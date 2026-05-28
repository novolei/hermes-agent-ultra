//! Wraps `hermes_agent::WorkspacePersistence` behind a desktop-friendly
//! interface. Mirrors the SessionService pattern: Arc-cloneable wrapper
//! over the SQLite-backed store from the hermes-agent crate.

use std::path::Path;

use hermes_agent::WorkspacePersistence;
use hermes_core::AgentError;

pub use hermes_agent::WorkspaceRow;

pub struct WorkspaceService {
    inner: WorkspacePersistence,
}

impl WorkspaceService {
    pub fn open(hermes_home: impl AsRef<Path>) -> Result<Self, AgentError> {
        let path = hermes_home.as_ref().to_path_buf();
        std::fs::create_dir_all(&path)
            .map_err(|e| AgentError::Io(format!("create hermes_home: {e}")))?;
        let persistence = WorkspacePersistence::new(&path);
        persistence.ensure_db()?;
        Ok(Self { inner: persistence })
    }

    pub fn list(&self) -> Result<Vec<WorkspaceRow>, AgentError> {
        self.inner.list_workspaces()
    }

    pub fn create(
        &self,
        id: &str,
        name: &str,
        icon: Option<&str>,
        cwd: Option<&str>,
        color: Option<&str>,
    ) -> Result<WorkspaceRow, AgentError> {
        self.inner.create_workspace(id, name, icon, cwd, color)
    }

    pub fn update(
        &self,
        id: &str,
        name: Option<&str>,
        icon: Option<&str>,
        cwd: Option<&str>,
        color: Option<&str>,
    ) -> Result<(), AgentError> {
        self.inner.update_workspace(id, name, icon, cwd, color)
    }

    pub fn delete(&self, id: &str) -> Result<(), AgentError> {
        self.inner.delete_workspace(id)
    }

    pub fn reorder(&self, ordered_ids: &[String]) -> Result<(), AgentError> {
        self.inner.reorder_workspaces(ordered_ids)
    }

    pub fn get_active(&self) -> Result<Option<String>, AgentError> {
        self.inner.get_active_workspace_id()
    }

    pub fn set_active(&self, id: Option<&str>) -> Result<(), AgentError> {
        self.inner.set_active_workspace_id(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn open_creates_db_and_lists_empty() {
        let dir = tempdir().unwrap();
        let svc = WorkspaceService::open(dir.path()).unwrap();
        assert_eq!(svc.list().unwrap().len(), 0);
    }
}
