mod commands;
mod config;
mod pty;
mod session;
mod types;

use config::ConfigManager;
use pty::PtyManager;
use session::SessionManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .manage(PtyManager::new())
        .manage(SessionManager::new())
        .manage(ConfigManager::new())
        .invoke_handler(tauri::generate_handler![
            commands::check_copilot_status,
            commands::create_session,
            commands::send_message,
            commands::list_sessions,
            commands::close_session,
            commands::get_config,
            commands::set_theme,
            commands::select_directory,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
