use tauri::{AppHandle, State};

use crate::auth;
use crate::config::ConfigManager;
use crate::pty::PtyManager;
use crate::session::SessionManager;
use crate::files::FileWatcher;
use crate::types::{AppError, AuthStatus, CopilotStatus, DiffResult, FileChangeEvent, SessionInfo};

#[tauri::command]
pub fn check_copilot_status(pty: State<'_, PtyManager>) -> CopilotStatus {
    let path = pty.get_copilot_path();
    CopilotStatus {
        installed: pty.is_copilot_installed(),
        path,
        version: None,
        authenticated: false,
    }
}

#[tauri::command]
pub fn create_session(
    name: &str,
    working_dir: &str,
    session_mgr: State<'_, SessionManager>,
    pty: State<'_, PtyManager>,
    config: State<'_, ConfigManager>,
    file_watcher: State<'_, FileWatcher>,
    app_handle: AppHandle,
) -> Result<SessionInfo, AppError> {
    let session = session_mgr.create_session(name, working_dir);
    pty.spawn_session(&session.id, working_dir, app_handle.clone())?;
    let _ = file_watcher.start_watching(&session.id, working_dir, app_handle);
    config.add_recent_project(working_dir);
    Ok(session)
}

#[tauri::command]
pub fn send_message(
    session_id: &str,
    message: &str,
    pty: State<'_, PtyManager>,
) -> Result<(), AppError> {
    pty.write_to_session(session_id, message)
}

#[tauri::command]
pub fn resize_terminal(
    session_id: &str,
    rows: u16,
    cols: u16,
    pty: State<'_, PtyManager>,
) -> Result<(), AppError> {
    pty.resize_pty(session_id, rows, cols)
}

#[tauri::command]
pub fn list_sessions(session_mgr: State<'_, SessionManager>) -> Vec<SessionInfo> {
    session_mgr.list_sessions()
}

#[tauri::command]
pub fn close_session(
    session_id: &str,
    session_mgr: State<'_, SessionManager>,
    pty: State<'_, PtyManager>,
    file_watcher: State<'_, FileWatcher>,
) -> Result<bool, AppError> {
    pty.kill_session(session_id)?;
    file_watcher.stop_watching(session_id);
    Ok(session_mgr.remove_session(session_id))
}

#[tauri::command]
pub fn get_config(config: State<'_, ConfigManager>) -> crate::config::AppConfig {
    config.get_config()
}

#[tauri::command]
pub fn set_theme(theme: &str, config: State<'_, ConfigManager>) {
    config.set_theme(theme);
}

#[tauri::command]
pub fn select_directory() -> Option<String> {
    None // Will use tauri-plugin-dialog in the frontend
}

#[tauri::command]
pub fn check_auth() -> AuthStatus {
    auth::check_auth_status()
}

#[tauri::command]
pub fn open_project(
    path: &str,
    name: Option<&str>,
    session_mgr: State<'_, SessionManager>,
    pty: State<'_, PtyManager>,
    config: State<'_, ConfigManager>,
    file_watcher: State<'_, FileWatcher>,
    app_handle: AppHandle,
) -> Result<SessionInfo, AppError> {
    let session_name = name.unwrap_or_else(|| {
        std::path::Path::new(path)
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("project")
    });
    let session = session_mgr.create_session(session_name, path);
    pty.spawn_session(&session.id, path, app_handle.clone())?;
    let _ = file_watcher.start_watching(&session.id, path, app_handle);
    config.add_recent_project(path);
    Ok(session)
}

#[tauri::command]
pub fn get_recent_projects(config: State<'_, ConfigManager>) -> Vec<String> {
    config.get_config().recent_projects
}

#[tauri::command]
pub fn detect_copilot_binary(pty: State<'_, PtyManager>) -> CopilotStatus {
    CopilotStatus {
        installed: pty.is_copilot_installed(),
        path: pty.get_copilot_path(),
        version: None,
        authenticated: auth::check_auth_status().authenticated,
    }
}

#[tauri::command]
pub fn list_changed_files(
    session_id: &str,
    file_watcher: State<'_, FileWatcher>,
) -> Result<Vec<FileChangeEvent>, AppError> {
    Ok(file_watcher.list_changed_files(session_id))
}

#[tauri::command]
pub fn read_file(path: &str) -> Result<String, AppError> {
    FileWatcher::read_file_content(path)
}

#[tauri::command]
pub fn get_diff(path: &str) -> Result<DiffResult, AppError> {
    FileWatcher::get_file_diff(path)
}
