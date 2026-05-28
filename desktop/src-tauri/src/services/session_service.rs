//! Wraps `hermes_agent::SessionPersistence` behind a desktop-friendly interface.
//! Owns the SQLite session store rooted at the desktop's data directory.

use std::path::Path;

use hermes_agent::SessionPersistence;
use hermes_core::{AgentError, Message};

pub struct SessionService {
    inner: SessionPersistence,
}

impl SessionService {
    /// Construct a SessionService rooted at the given `hermes_home` directory.
    /// The directory will be created (recursively) if it does not exist; the
    /// SQLite store is initialised via `ensure_db`.
    pub fn open(hermes_home: impl AsRef<Path>) -> Result<Self, AgentError> {
        let path = hermes_home.as_ref().to_path_buf();
        std::fs::create_dir_all(&path)
            .map_err(|e| AgentError::Io(format!("create hermes_home: {e}")))?;
        let persistence = SessionPersistence::new(&path);
        persistence.ensure_db()?;
        Ok(Self { inner: persistence })
    }

    /// Load the message history for a session. Returns an empty vector if the
    /// session does not yet exist.
    pub fn load(&self, session_id: &str) -> Result<Vec<Message>, AgentError> {
        self.inner.load_session(session_id)
    }

    // NOTE: hermes_agent::SessionPersistence::persist_session does not clean up
    // `messages_fts` rows on rewrite (pre-existing bug in hermes-agent). FTS search
    // over rewritten sessions may return stale results. Tracked separately.
    /// Persist (replace) the message history for a session.
    pub fn save(
        &self,
        session_id: &str,
        messages: &[Message],
        model: Option<&str>,
    ) -> Result<(), AgentError> {
        self.inner
            .persist_session(session_id, messages, model, Some("desktop"), None, None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use hermes_core::{Message, MessageRole};
    use tempfile::TempDir;

    fn user_msg(text: &str) -> Message {
        Message {
            role: MessageRole::User,
            content: Some(text.into()),
            tool_calls: None,
            tool_call_id: None,
            name: None,
            reasoning_content: None,
            cache_control: None,
        }
    }

    #[test]
    fn load_empty_returns_no_messages() {
        let tmp = TempDir::new().unwrap();
        let svc = SessionService::open(tmp.path()).unwrap();
        let msgs = svc.load("does-not-exist").unwrap();
        assert!(msgs.is_empty(), "expected no messages for unknown session");
    }

    #[test]
    fn save_then_load_roundtrips_messages() {
        let tmp = TempDir::new().unwrap();
        let svc = SessionService::open(tmp.path()).unwrap();
        let msgs = vec![user_msg("hello"), user_msg("world")];
        svc.save("s1", &msgs, Some("gpt-4o-mini")).unwrap();
        let loaded = svc.load("s1").unwrap();
        assert_eq!(loaded.len(), 2);
        assert_eq!(loaded[0].content.as_deref(), Some("hello"));
        assert_eq!(loaded[1].content.as_deref(), Some("world"));
    }
}
