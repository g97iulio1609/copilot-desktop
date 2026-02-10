use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};

use crate::types::{AppError, McpServerConfig};

/// On-disk format: { "mcpServers": { "<name>": { "command", "args", "env", "disabled" } } }
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct McpConfigFile {
    #[serde(rename = "mcpServers", default)]
    mcp_servers: HashMap<String, McpServerEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct McpServerEntry {
    command: String,
    #[serde(default)]
    args: Vec<String>,
    #[serde(default)]
    env: Option<HashMap<String, String>>,
    #[serde(default)]
    disabled: bool,
}

pub struct McpManager {
    config_path: Mutex<PathBuf>,
}

impl McpManager {
    pub fn new() -> Self {
        let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
        let config_path = home.join(".copilot").join("mcp-config.json");
        Self {
            config_path: Mutex::new(config_path),
        }
    }

    fn read_config(&self) -> Result<McpConfigFile, AppError> {
        let path = self.config_path.lock().unwrap().clone();
        if !path.exists() {
            return Ok(McpConfigFile::default());
        }
        let content = fs::read_to_string(&path)?;
        serde_json::from_str(&content).map_err(|e| AppError::Other(format!("Invalid MCP config: {e}")))
    }

    fn write_config(&self, config: &McpConfigFile) -> Result<(), AppError> {
        let path = self.config_path.lock().unwrap().clone();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let json = serde_json::to_string_pretty(config)
            .map_err(|e| AppError::Other(format!("Failed to serialize MCP config: {e}")))?;
        fs::write(&path, json)?;
        Ok(())
    }

    pub fn list_servers(&self) -> Result<Vec<McpServerConfig>, AppError> {
        let config = self.read_config()?;
        let servers = config
            .mcp_servers
            .into_iter()
            .map(|(name, entry)| McpServerConfig {
                name,
                command: entry.command,
                args: entry.args,
                env: entry.env,
                enabled: !entry.disabled,
                status: None,
            })
            .collect();
        Ok(servers)
    }

    pub fn add_server(&self, server: McpServerConfig) -> Result<(), AppError> {
        let mut config = self.read_config()?;
        if config.mcp_servers.contains_key(&server.name) {
            return Err(AppError::Other(format!(
                "MCP server '{}' already exists",
                server.name
            )));
        }
        config.mcp_servers.insert(
            server.name,
            McpServerEntry {
                command: server.command,
                args: server.args,
                env: server.env,
                disabled: !server.enabled,
            },
        );
        self.write_config(&config)
    }

    pub fn update_server(&self, name: &str, server: McpServerConfig) -> Result<(), AppError> {
        let mut config = self.read_config()?;
        if !config.mcp_servers.contains_key(name) {
            return Err(AppError::Other(format!("MCP server '{name}' not found")));
        }
        // If name changed, remove old key
        if name != server.name {
            config.mcp_servers.remove(name);
        }
        config.mcp_servers.insert(
            server.name,
            McpServerEntry {
                command: server.command,
                args: server.args,
                env: server.env,
                disabled: !server.enabled,
            },
        );
        self.write_config(&config)
    }

    pub fn delete_server(&self, name: &str) -> Result<(), AppError> {
        let mut config = self.read_config()?;
        if config.mcp_servers.remove(name).is_none() {
            return Err(AppError::Other(format!("MCP server '{name}' not found")));
        }
        self.write_config(&config)
    }

    pub fn toggle_server(&self, name: &str, enabled: bool) -> Result<(), AppError> {
        let mut config = self.read_config()?;
        let entry = config
            .mcp_servers
            .get_mut(name)
            .ok_or_else(|| AppError::Other(format!("MCP server '{name}' not found")))?;
        entry.disabled = !enabled;
        self.write_config(&config)
    }
}
