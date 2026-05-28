mod commands;
mod services;
mod state;

use state::AppState;
use tauri_specta::{collect_commands, Builder};

fn make_builder() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new()
        .commands(collect_commands![commands::app::app_info])
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = make_builder();

    #[cfg(debug_assertions)]
    builder
        .export(
            specta_typescript::Typescript::default(),
            "../src/lib/bridge/generated.ts",
        )
        .expect("failed to export specta bindings");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::default())
        .invoke_handler(builder.invoke_handler())
        .setup(move |app| {
            builder.mount_events(app);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Generates `desktop/src/lib/bridge/generated.ts` from the current command set.
    /// Run with: cargo test -p hermes-desktop export_bindings
    #[test]
    fn export_bindings() {
        make_builder()
            .export(
                specta_typescript::Typescript::default(),
                "../src/lib/bridge/generated.ts",
            )
            .expect("failed to export specta bindings");
    }
}
