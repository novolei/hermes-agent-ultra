//! SQLite-backed workspace persistence. Mirrors `SessionPersistence` —
//! rooted at the hermes_home directory, uses the same `rusqlite` setup,
//! emits `AgentError` for failures.
//!
//! Plan 3.2 — replaces the frontend dormant workspace stub from Plan 2b.2.c.3.

use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

use hermes_core::AgentError;

const DB_NAME: &str = "workspaces.db";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct WorkspaceRow {
    pub id: String,
    pub name: String,
    pub icon: Option<String>,
    pub cwd: Option<String>,
    pub color: Option<String>,
    pub position: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

pub struct WorkspacePersistence {
    db_path: PathBuf,
}

impl WorkspacePersistence {
    pub fn new(hermes_home: impl AsRef<std::path::Path>) -> Self {
        let db_path = hermes_home.as_ref().join(DB_NAME);
        Self { db_path }
    }

    pub fn ensure_db(&self) -> Result<(), AgentError> {
        if let Some(parent) = self.db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| AgentError::Io(format!("Failed to create workspaces db directory: {e}")))?;
        }
        let conn = Connection::open(&self.db_path)
            .map_err(|e| AgentError::Io(format!("open workspaces db: {e}")))?;
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS workspaces (
                id TEXT PRIMARY KEY NOT NULL,
                name TEXT NOT NULL,
                icon TEXT,
                cwd TEXT,
                color TEXT,
                position INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS workspace_settings (
                key TEXT PRIMARY KEY NOT NULL,
                value TEXT NOT NULL
            );
            "#,
        )
        .map_err(|e| AgentError::Io(format!("ensure workspaces schema: {e}")))?;
        Ok(())
    }

    pub fn list_workspaces(&self) -> Result<Vec<WorkspaceRow>, AgentError> {
        let conn = self.open()?;
        let mut stmt = conn
            .prepare(
                "SELECT id, name, icon, cwd, color, position, created_at, updated_at \
                 FROM workspaces ORDER BY position ASC, created_at ASC",
            )
            .map_err(|e| AgentError::Io(format!("prepare list: {e}")))?;
        let rows = stmt
            .query_map([], |row| {
                Ok(WorkspaceRow {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    icon: row.get(2)?,
                    cwd: row.get(3)?,
                    color: row.get(4)?,
                    position: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })
            .map_err(|e| AgentError::Io(format!("query list: {e}")))?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r.map_err(|e| AgentError::Io(format!("row list: {e}")))?);
        }
        Ok(out)
    }

    pub fn create_workspace(
        &self,
        id: &str,
        name: &str,
        icon: Option<&str>,
        cwd: Option<&str>,
        color: Option<&str>,
    ) -> Result<WorkspaceRow, AgentError> {
        let now = unix_now();
        let conn = self.open()?;
        let max_pos: i64 = conn
            .query_row("SELECT COALESCE(MAX(position), -1) FROM workspaces", [], |r| r.get(0))
            .map_err(|e| AgentError::Io(format!("max pos: {e}")))?;
        let position = max_pos + 1;
        conn.execute(
            "INSERT INTO workspaces (id, name, icon, cwd, color, position, created_at, updated_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7)",
            params![id, name, icon, cwd, color, position, now],
        )
        .map_err(|e| AgentError::Io(format!("insert workspace: {e}")))?;
        Ok(WorkspaceRow {
            id: id.to_string(),
            name: name.to_string(),
            icon: icon.map(str::to_string),
            cwd: cwd.map(str::to_string),
            color: color.map(str::to_string),
            position,
            created_at: now,
            updated_at: now,
        })
    }

    pub fn update_workspace(
        &self,
        id: &str,
        name: Option<&str>,
        icon: Option<&str>,
        cwd: Option<&str>,
        color: Option<&str>,
    ) -> Result<(), AgentError> {
        let now = unix_now();
        let conn = self.open()?;
        conn.execute(
            "UPDATE workspaces SET \
                name = COALESCE(?2, name), \
                icon = COALESCE(?3, icon), \
                cwd = COALESCE(?4, cwd), \
                color = COALESCE(?5, color), \
                updated_at = ?6 \
             WHERE id = ?1",
            params![id, name, icon, cwd, color, now],
        )
        .map_err(|e| AgentError::Io(format!("update workspace: {e}")))?;
        Ok(())
    }

    pub fn delete_workspace(&self, id: &str) -> Result<(), AgentError> {
        let conn = self.open()?;
        conn.execute("DELETE FROM workspaces WHERE id = ?1", params![id])
            .map_err(|e| AgentError::Io(format!("delete workspace: {e}")))?;
        Ok(())
    }

    pub fn reorder_workspaces(&self, ordered_ids: &[String]) -> Result<(), AgentError> {
        let mut conn = self.open()?;
        let tx = conn.transaction().map_err(|e| AgentError::Io(format!("begin tx: {e}")))?;
        for (idx, id) in ordered_ids.iter().enumerate() {
            tx.execute(
                "UPDATE workspaces SET position = ?1 WHERE id = ?2",
                params![idx as i64, id],
            )
            .map_err(|e| AgentError::Io(format!("reorder: {e}")))?;
        }
        tx.commit().map_err(|e| AgentError::Io(format!("commit reorder: {e}")))?;
        Ok(())
    }

    pub fn get_active_workspace_id(&self) -> Result<Option<String>, AgentError> {
        let conn = self.open()?;
        let result: rusqlite::Result<String> = conn.query_row(
            "SELECT value FROM workspace_settings WHERE key = 'active_workspace_id'",
            [],
            |r| r.get(0),
        );
        match result {
            Ok(s) => Ok(Some(s)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(AgentError::Io(format!("get active id: {e}"))),
        }
    }

    pub fn set_active_workspace_id(&self, id: Option<&str>) -> Result<(), AgentError> {
        let conn = self.open()?;
        match id {
            Some(value) => {
                conn.execute(
                    "INSERT INTO workspace_settings (key, value) VALUES ('active_workspace_id', ?1) \
                     ON CONFLICT(key) DO UPDATE SET value = excluded.value",
                    params![value],
                )
                .map_err(|e| AgentError::Io(format!("set active id: {e}")))?;
            }
            None => {
                conn.execute(
                    "DELETE FROM workspace_settings WHERE key = 'active_workspace_id'",
                    [],
                )
                .map_err(|e| AgentError::Io(format!("clear active id: {e}")))?;
            }
        }
        Ok(())
    }

    fn open(&self) -> Result<Connection, AgentError> {
        Connection::open(&self.db_path)
            .map_err(|e| AgentError::Io(format!("open workspaces db: {e}")))
    }
}

fn unix_now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    fn setup() -> (tempfile::TempDir, WorkspacePersistence) {
        let dir = tempdir().unwrap();
        let store = WorkspacePersistence::new(dir.path());
        store.ensure_db().unwrap();
        (dir, store)
    }

    #[test]
    fn create_and_list_workspace() {
        let (_dir, store) = setup();
        store
            .create_workspace("ws-1", "First", None, None, None)
            .unwrap();
        let list = store.list_workspaces().unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].id, "ws-1");
        assert_eq!(list[0].name, "First");
        assert_eq!(list[0].position, 0);
    }

    #[test]
    fn update_workspace_changes_name_and_updated_at() {
        let (_dir, store) = setup();
        let created = store
            .create_workspace("ws-1", "Old", None, None, None)
            .unwrap();
        std::thread::sleep(std::time::Duration::from_millis(1100));
        store
            .update_workspace("ws-1", Some("New"), None, None, None)
            .unwrap();
        let list = store.list_workspaces().unwrap();
        assert_eq!(list[0].name, "New");
        assert!(list[0].updated_at > created.updated_at);
    }

    #[test]
    fn delete_workspace_removes_row() {
        let (_dir, store) = setup();
        store
            .create_workspace("ws-1", "Doomed", None, None, None)
            .unwrap();
        store.delete_workspace("ws-1").unwrap();
        assert_eq!(store.list_workspaces().unwrap().len(), 0);
    }

    #[test]
    fn reorder_assigns_positions_in_order() {
        let (_dir, store) = setup();
        store
            .create_workspace("ws-1", "First", None, None, None)
            .unwrap();
        store
            .create_workspace("ws-2", "Second", None, None, None)
            .unwrap();
        store
            .create_workspace("ws-3", "Third", None, None, None)
            .unwrap();

        store
            .reorder_workspaces(&[
                "ws-3".to_string(),
                "ws-1".to_string(),
                "ws-2".to_string(),
            ])
            .unwrap();

        let list = store.list_workspaces().unwrap();
        assert_eq!(
            list.iter().map(|w| w.id.as_str()).collect::<Vec<_>>(),
            vec!["ws-3", "ws-1", "ws-2"]
        );
    }

    #[test]
    fn active_workspace_round_trip() {
        let (_dir, store) = setup();
        assert!(store.get_active_workspace_id().unwrap().is_none());
        store.set_active_workspace_id(Some("ws-1")).unwrap();
        assert_eq!(
            store.get_active_workspace_id().unwrap(),
            Some("ws-1".to_string())
        );
        store.set_active_workspace_id(None).unwrap();
        assert!(store.get_active_workspace_id().unwrap().is_none());
    }
}
