//! Shared application state. Holds Arc handles to services.

use std::path::PathBuf;
use std::sync::Arc;

use crate::services::app_service::AppService;
use crate::services::session_service::SessionService;

#[derive(Clone)]
pub struct AppState {
    pub app: AppService,
    pub session: Arc<SessionService>,
    pub hermes_home: PathBuf,
}

impl AppState {
    /// Construct the AppState with all services rooted at the user's hermes_home.
    pub fn init() -> Self {
        let hermes_home = default_hermes_home();
        let session = SessionService::open(&hermes_home)
            .expect("failed to initialise SessionService at hermes_home");
        Self {
            app: AppService,
            session: Arc::new(session),
            hermes_home,
        }
    }
}

/// Resolves the hermes_home path: `$HERMES_HOME` if set, else `~/.hermes-agent-ultra`.
fn default_hermes_home() -> PathBuf {
    if let Ok(p) = std::env::var("HERMES_HOME") {
        return PathBuf::from(p);
    }
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".into());
    PathBuf::from(home).join(".hermes-agent-ultra")
}
