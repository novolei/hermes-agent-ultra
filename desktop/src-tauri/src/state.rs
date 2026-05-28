//! Shared application state. Holds Arc handles to services.

use std::path::PathBuf;
use std::sync::Arc;

use crate::services::app_service::AppService;
use crate::services::session_service::SessionService;

#[derive(Clone)]
pub struct AppState {
    pub app: AppService,
    pub session: Arc<SessionService>,
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
        }
    }
}

/// Resolves the hermes_home path, mirroring `SessionPersistence::default_home()`:
/// `HERMES_HOME` → `HERMES_AGENT_ULTRA_HOME` → `~/.hermes-agent-ultra` (with
/// legacy fallback to `~/.hermes` when only that directory exists).
fn default_hermes_home() -> PathBuf {
    if let Ok(home) = std::env::var("HERMES_HOME") {
        let home = home.trim().to_string();
        if !home.is_empty() {
            return PathBuf::from(home);
        }
    }
    if let Ok(home) = std::env::var("HERMES_AGENT_ULTRA_HOME") {
        let home = home.trim().to_string();
        if !home.is_empty() {
            return PathBuf::from(home);
        }
    }
    let base = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    let primary = base.join(".hermes-agent-ultra");
    let legacy = base.join(".hermes");
    if primary.exists() || !legacy.exists() {
        primary
    } else {
        legacy
    }
}
