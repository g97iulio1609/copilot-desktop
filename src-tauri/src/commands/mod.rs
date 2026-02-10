use tauri::{AppHandle, State};

use crate::auth;
use crate::config::ConfigManager;
use crate::pty::PtyManager;
use crate::session::SessionManager;
use crate::files::FileWatcher;
use crate::types::{AgentMode, AppError, AuthStatus, CopilotSession, CopilotStatus, DiffResult, FileChangeEvent, McpServerConfig, ModelInfo, PluginInfo, SessionInfo, UsageMetrics};
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
        None,
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
        None,
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
        ModelInfo { id: "claude-sonnet-4.5".into(), name: "Claude Sonnet 4.5".into(), provider: "Anthropic".into(), description: "Best balance of speed and intelligence".into() },
        ModelInfo { id: "claude-haiku-4.5".into(), name: "Claude Haiku 4.5".into(), provider: "Anthropic".into(), description: "Fast and lightweight".into() },
        ModelInfo { id: "claude-opus-4.6".into(), name: "Claude Opus 4.6".into(), provider: "Anthropic".into(), description: "Most capable Anthropic model".into() },
        ModelInfo { id: "claude-opus-4.6-fast".into(), name: "Claude Opus 4.6 Fast".into(), provider: "Anthropic".into(), description: "Opus 4.6 with faster responses".into() },
        ModelInfo { id: "claude-opus-4.5".into(), name: "Claude Opus 4.5".into(), provider: "Anthropic".into(), description: "Previous generation flagship".into() },
        ModelInfo { id: "claude-sonnet-4".into(), name: "Claude Sonnet 4".into(), provider: "Anthropic".into(), description: "Fast and capable".into() },
        ModelInfo { id: "gemini-3-pro-preview".into(), name: "Gemini 3 Pro".into(), provider: "Google".into(), description: "Preview of Google's latest".into() },
        ModelInfo { id: "gpt-5.2-codex".into(), name: "GPT-5.2 Codex".into(), provider: "OpenAI".into(), description: "Latest codex model".into() },
        ModelInfo { id: "gpt-5.2".into(), name: "GPT-5.2".into(), provider: "OpenAI".into(), description: "Latest GPT model".into() },
        ModelInfo { id: "gpt-5.1-codex-max".into(), name: "GPT-5.1 Codex Max".into(), provider: "OpenAI".into(), description: "Maximum capability codex".into() },
        ModelInfo { id: "gpt-5.1-codex".into(), name: "GPT-5.1 Codex".into(), provider: "OpenAI".into(), description: "Codex optimized".into() },
        ModelInfo { id: "gpt-5.1".into(), name: "GPT-5.1".into(), provider: "OpenAI".into(), description: "GPT-5.1 generation".into() },
        ModelInfo { id: "gpt-5".into(), name: "GPT-5".into(), provider: "OpenAI".into(), description: "OpenAI flagship".into() },
        ModelInfo { id: "gpt-5.1-codex-mini".into(), name: "GPT-5.1 Codex Mini".into(), provider: "OpenAI".into(), description: "Small and fast codex".into() },
        ModelInfo { id: "gpt-5-mini".into(), name: "GPT-5 Mini".into(), provider: "OpenAI".into(), description: "Small and efficient".into() },
        ModelInfo { id: "gpt-4.1".into(), name: "GPT-4.1".into(), provider: "OpenAI".into(), description: "Previous generation".into() },
    ]
}

#[tauri::command]
pub fn get_default_model() -> String {
    if let Some(home) = dirs::home_dir() {
        let config_path = home.join(".copilot").join("config.json");
        if let Ok(contents) = std::fs::read_to_string(&config_path) {
            if let Ok(config) = serde_json::from_str::<serde_json::Value>(&contents) {
                if let Some(model) = config.get("model").and_then(|v| v.as_str()) {
                    return model.to_string();
                }
            }
        }
    }
    "claude-sonnet-4.5".to_string()
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
        active_model: session.model.unwrap_or_else(|| "claude-sonnet-4.5".to_string()),
    })
}

#[tauri::command]
pub fn clear_session_history(
    session_id: &str,
    pty: State<'_, PtyManager>,
) -> Result<(), AppError> {
    pty.write_to_session(session_id, "/clear")
}

#[tauri::command]
pub fn trigger_login(pty: State<'_, PtyManager>) -> Result<(), AppError> {
    let copilot_path = pty
        .get_copilot_path()
        .ok_or(AppError::CopilotNotFound)?;
    std::process::Command::new(&copilot_path)
        .arg("login")
        .spawn()
        .map_err(|e| AppError::PtyError(e.to_string()))?;
    Ok(())
}

fn parse_workspace_yaml(content: &str) -> Option<CopilotSession> {
    let mut id = String::new();
    let mut cwd = String::new();
    let mut summary = None;
    let mut repository = None;
    let mut branch = None;
    let mut created_at = String::new();
    let mut updated_at = String::new();

    for line in content.lines() {
        if let Some((key, value)) = line.split_once(": ") {
            let value = value.trim();
            match key.trim() {
                "id" => id = value.to_string(),
                "cwd" => cwd = value.to_string(),
                "summary" => summary = Some(value.to_string()),
                "repository" => repository = Some(value.to_string()),
                "branch" => branch = Some(value.to_string()),
                "created_at" => created_at = value.to_string(),
                "updated_at" => updated_at = value.to_string(),
                _ => {}
            }
        }
    }

    if id.is_empty() || cwd.is_empty() {
        return None;
    }
    Some(CopilotSession { id, cwd, summary, repository, branch, created_at, updated_at })
}

#[tauri::command]
pub fn list_copilot_sessions() -> Vec<CopilotSession> {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return Vec::new(),
    };
    let session_dir = home.join(".copilot").join("session-state");
    let entries = match std::fs::read_dir(&session_dir) {
        Ok(e) => e,
        Err(_) => return Vec::new(),
    };

    let mut sessions: Vec<CopilotSession> = entries
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let path = entry.path().join("workspace.yaml");
            let content = std::fs::read_to_string(&path).ok()?;
            parse_workspace_yaml(&content)
        })
        .collect();

    sessions.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    sessions.truncate(50);
    sessions
}

#[tauri::command]
pub fn get_session_events(session_id: &str) -> Vec<serde_json::Value> {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return Vec::new(),
    };
    let events_path = home
        .join(".copilot")
        .join("session-state")
        .join(session_id)
        .join("events.jsonl");
    let content = match std::fs::read_to_string(&events_path) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    content
        .lines()
        .filter_map(|line| {
            let val: serde_json::Value = serde_json::from_str(line).ok()?;
            let event_type = val.get("type")?.as_str()?;
            match event_type {
                "user.message" | "assistant.message" => {
                    let data_content = val.get("data")?.get("content")?.as_str()?.to_string();
                    if data_content.is_empty() {
                        return None;
                    }
                    let id = val.get("id")?.as_str()?.to_string();
                    let timestamp = val.get("timestamp")?.as_str()?.to_string();
                    let role = if event_type == "user.message" {
                        "user"
                    } else {
                        "assistant"
                    };
                    Some(serde_json::json!({
                        "id": id,
                        "role": role,
                        "content": data_content,
                        "timestamp": timestamp
                    }))
                }
                _ => None,
            }
        })
        .collect()
}

#[tauri::command]
pub fn get_copilot_config() -> Result<serde_json::Value, AppError> {
    let home = dirs::home_dir().ok_or(AppError::Other("No home dir".into()))?;
    let path = home.join(".copilot").join("config.json");
    let contents = std::fs::read_to_string(&path)
        .map_err(|e| AppError::Io(e))?;
    serde_json::from_str(&contents)
        .map_err(|e| AppError::Other(e.to_string()))
}

#[tauri::command]
pub fn resume_session(
    session_id: &str,
    session_mgr: State<'_, SessionManager>,
    pty: State<'_, PtyManager>,
    config: State<'_, ConfigManager>,
    file_watcher: State<'_, FileWatcher>,
    app_handle: AppHandle,
) -> Result<SessionInfo, AppError> {
    // Read workspace.yaml from the copilot session to get cwd
    let home = dirs::home_dir().ok_or(AppError::Other("No home dir".into()))?;
    let workspace_path = home
        .join(".copilot")
        .join("session-state")
        .join(session_id)
        .join("workspace.yaml");
    let content = std::fs::read_to_string(&workspace_path)
        .map_err(|e| AppError::Io(e))?;
    let copilot_session = parse_workspace_yaml(&content)
        .ok_or(AppError::Other("Failed to parse workspace.yaml".into()))?;

    let session_name = copilot_session
        .summary
        .as_deref()
        .unwrap_or_else(|| {
            std::path::Path::new(&copilot_session.cwd)
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("session")
        });
    let session = session_mgr.create_session(session_name, &copilot_session.cwd);
    let model = config.get_config().default_model;
    pty.spawn_session(
        &session.id,
        &copilot_session.cwd,
        model.as_deref(),
        Some("suggest"),
        Some(session_id),
        app_handle.clone(),
    )?;
    let _ = file_watcher.start_watching(&session.id, &copilot_session.cwd, app_handle);
    config.add_recent_project(&copilot_session.cwd);
    Ok(session)
}
