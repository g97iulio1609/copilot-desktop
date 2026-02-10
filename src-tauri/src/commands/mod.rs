use tauri::{AppHandle, State};

use crate::auth;
use crate::config::ConfigManager;
use crate::pty::PtyManager;
use crate::session::SessionManager;
use crate::files::FileWatcher;
use crate::types::{AgentMode, AppError, AuthStatus, CopilotStatus, DiffResult, FileChangeEvent, McpServerConfig, ModelInfo, PluginInfo, SessionInfo, UsageMetrics};
use crate::mcp::McpManager;
use crate::plugins::PluginManager;

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
    let model = config.get_config().default_model;
    pty.spawn_session(
        &session.id,
        working_dir,
        model.as_deref(),
        Some("suggest"),
        app_handle.clone(),
    )?;
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
    let model = config.get_config().default_model;
    pty.spawn_session(
        &session.id,
        path,
        model.as_deref(),
        Some("suggest"),
        app_handle.clone(),
    )?;
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

#[tauri::command]
pub fn list_installed_plugins() -> Vec<PluginInfo> {
    PluginManager::list_installed_plugins()
}

#[tauri::command]
pub fn list_available_plugins() -> Vec<PluginInfo> {
    PluginManager::list_available_plugins()
}

#[tauri::command]
pub fn install_plugin(
    session_id: &str,
    name: &str,
    pty: State<'_, PtyManager>,
) -> Result<(), AppError> {
    PluginManager::install_plugin(&pty, session_id, name)
}

#[tauri::command]
pub fn uninstall_plugin(
    session_id: &str,
    name: &str,
    pty: State<'_, PtyManager>,
) -> Result<(), AppError> {
    PluginManager::uninstall_plugin(&pty, session_id, name)
}

#[tauri::command]
pub fn update_plugin(
    session_id: &str,
    name: &str,
    pty: State<'_, PtyManager>,
) -> Result<(), AppError> {
    PluginManager::update_plugin(&pty, session_id, name)
}

#[tauri::command]
pub fn rename_session(
    session_id: &str,
    name: &str,
    session_mgr: State<'_, SessionManager>,
) -> Result<(), AppError> {
    if session_mgr.rename_session(session_id, name) {
        Ok(())
    } else {
        Err(AppError::SessionNotFound(session_id.to_string()))
    }
}

#[tauri::command]
pub fn set_model(
    session_id: &str,
    model: &str,
    session_mgr: State<'_, SessionManager>,
    pty: State<'_, PtyManager>,
) -> Result<(), AppError> {
    session_mgr.set_session_model(session_id, model);
    let command = format!("/model {}", model);
    pty.write_to_session(session_id, &command)
}

#[tauri::command]
pub fn set_mode(
    session_id: &str,
    mode: &str,
    session_mgr: State<'_, SessionManager>,
) -> Result<(), AppError> {
    let agent_mode = match mode {
        "suggest" => AgentMode::Suggest,
        "autoedit" => AgentMode::AutoEdit,
        "autopilot" => AgentMode::Autopilot,
        _ => return Err(AppError::Other(format!("Unknown mode: {}", mode))),
    };
    if session_mgr.set_session_mode(session_id, agent_mode) {
        Ok(())
    } else {
        Err(AppError::SessionNotFound(session_id.to_string()))
    }
}

#[tauri::command]
pub fn list_available_models() -> Vec<ModelInfo> {
    vec![
        ModelInfo {
            id: "claude-sonnet-4-5".to_string(),
            name: "Claude Sonnet 4.5".to_string(),
            provider: "Anthropic".to_string(),
            description: "Best balance of speed and intelligence".to_string(),
        },
        ModelInfo {
            id: "claude-sonnet-4".to_string(),
            name: "Claude Sonnet 4".to_string(),
            provider: "Anthropic".to_string(),
            description: "Fast and capable coding model".to_string(),
        },
        ModelInfo {
            id: "gpt-5".to_string(),
            name: "GPT-5".to_string(),
            provider: "OpenAI".to_string(),
            description: "Latest OpenAI flagship model".to_string(),
        },
    ]
}

#[tauri::command]
pub fn send_slash_command(
    session_id: &str,
    command: &str,
    pty: State<'_, PtyManager>,
) -> Result<(), AppError> {
    let slash_command = if command.starts_with('/') {
        command.to_string()
    } else {
        format!("/{}", command)
    };
    pty.write_to_session(session_id, &slash_command)
}

#[tauri::command]
pub fn get_session(
    session_id: &str,
    session_mgr: State<'_, SessionManager>,
) -> Result<SessionInfo, AppError> {
    session_mgr
        .get_session(session_id)
        .ok_or_else(|| AppError::SessionNotFound(session_id.to_string()))
}

#[tauri::command]
pub fn list_mcp_servers(mcp: State<'_, McpManager>) -> Result<Vec<McpServerConfig>, AppError> {
    mcp.list_servers()
}

#[tauri::command]
pub fn add_mcp_server(config: McpServerConfig, mcp: State<'_, McpManager>) -> Result<(), AppError> {
    mcp.add_server(config)
}

#[tauri::command]
pub fn update_mcp_server(name: &str, config: McpServerConfig, mcp: State<'_, McpManager>) -> Result<(), AppError> {
    mcp.update_server(name, config)
}

#[tauri::command]
pub fn delete_mcp_server(name: &str, mcp: State<'_, McpManager>) -> Result<(), AppError> {
    mcp.delete_server(name)
}

#[tauri::command]
pub fn toggle_mcp_server(name: &str, enabled: bool, mcp: State<'_, McpManager>) -> Result<(), AppError> {
    mcp.toggle_server(name, enabled)
}

#[tauri::command]
pub fn update_config(
    config: crate::config::AppConfig,
    config_mgr: State<'_, ConfigManager>,
) -> Result<(), AppError> {
    config_mgr
        .update_config(config)
        .map_err(|e| AppError::Io(e))
}

#[tauri::command]
pub fn get_usage_metrics(
    session_id: &str,
    session_mgr: State<'_, SessionManager>,
) -> Result<UsageMetrics, AppError> {
    let session = session_mgr
        .get_session(session_id)
        .ok_or_else(|| AppError::SessionNotFound(session_id.to_string()))?;
    Ok(UsageMetrics {
        premium_requests_used: 0,
        premium_requests_limit: Some(300),
        session_messages: 0,
        session_tokens: None,
        active_model: session.model.unwrap_or_else(|| "claude-sonnet-4-5".to_string()),
    })
}

#[tauri::command]
pub fn clear_session_history(
    session_id: &str,
    pty: State<'_, PtyManager>,
) -> Result<(), AppError> {
    pty.write_to_session(session_id, "/clear")
}
