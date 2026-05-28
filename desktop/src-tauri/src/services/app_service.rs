//! App-level metadata service. Pure logic, unit-testable without Tauri.

use serde::Serialize;

/// Basic application metadata surfaced to the frontend.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, specta::Type)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub platform: String,
}

/// Stateless service exposing app metadata.
#[derive(Debug, Default, Clone)]
pub struct AppService;

impl AppService {
    pub fn info(&self) -> AppInfo {
        AppInfo {
            name: "Hermes Agent Ultra".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            platform: std::env::consts::OS.to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn info_reports_name_version_and_platform() {
        let info = AppService.info();
        assert_eq!(info.name, "Hermes Agent Ultra");
        assert_eq!(info.version, env!("CARGO_PKG_VERSION"));
        assert_eq!(info.platform, std::env::consts::OS);
    }
}
