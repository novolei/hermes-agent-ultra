//! Tauri commands for file attachments.
//!
//! Plan 2b.2.c.3 — replaces the frontend `peripheral-stubs.readAttachment` /
//! `peripheral-stubs.saveImageAs` no-ops. Consumers: `InlineImage` in
//! AgentMessages and `screenshot-result.tsx`.

use base64::Engine;
use serde::Deserialize;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

/// Read a file from disk and return its bytes as base64.
/// Used by InlineImage / screenshot-result to render local attachments
/// without a `file://` blob URL (which is blocked by Tauri's CSP).
#[tauri::command]
#[specta::specta]
pub async fn read_attachment(path: String) -> Result<String, String> {
    let bytes = tokio::fs::read(&path)
        .await
        .map_err(|e| format!("read {path}: {e}"))?;
    Ok(base64::engine::general_purpose::STANDARD.encode(&bytes))
}

#[derive(Debug, Deserialize, specta::Type)]
pub struct SaveImageArgs {
    pub local_path: String,
    pub filename: String,
    /// MIME type forwarded from the frontend; reserved for future use
    /// (e.g. choosing the save-dialog filter dynamically).
    #[allow(dead_code)]
    pub media_type: String,
}

/// Open a save-as dialog for the user, then copy `local_path` to the chosen
/// destination. Returns `true` if the user picked a destination + copy
/// succeeded; `false` if the user cancelled.
#[tauri::command]
#[specta::specta]
pub async fn save_image_as(app: AppHandle, args: SaveImageArgs) -> Result<bool, String> {
    let dest: Option<PathBuf> = app
        .dialog()
        .file()
        .add_filter("Images", &["png", "jpg", "jpeg", "webp"])
        .set_file_name(&args.filename)
        .blocking_save_file()
        .and_then(|fp| fp.into_path().ok());

    let Some(dest) = dest else {
        return Ok(false);
    };

    tokio::fs::copy(&args.local_path, &dest)
        .await
        .map_err(|e| format!("copy {} -> {}: {e}", args.local_path, dest.display()))?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn read_attachment_round_trips_a_small_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("hello.txt");
        tokio::fs::write(&path, b"hello").await.unwrap();
        let b64 = read_attachment(path.to_string_lossy().into_owned())
            .await
            .unwrap();
        // 'hello' base64-encoded is 'aGVsbG8='
        assert_eq!(b64, "aGVsbG8=");
    }

    #[tokio::test]
    async fn read_attachment_returns_error_for_missing_file() {
        let res = read_attachment("/definitely/does/not/exist".to_string()).await;
        assert!(res.is_err());
    }
}
