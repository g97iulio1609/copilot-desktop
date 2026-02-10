use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub copilot_path: Option<String>,
    pub default_model: Option<String>,
    pub theme: String,
    pub recent_projects: Vec<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            copilot_path: None,
            default_model: None,
            theme: "dark".to_string(),
            recent_projects: Vec::new(),
        }
    }
}

pub struct ConfigManager {
    config: Mutex<AppConfig>,
}

impl ConfigManager {
    pub fn new() -> Self {
        Self {
            config: Mutex::new(AppConfig::default()),
        }
    }

    pub fn get_config(&self) -> AppConfig {
        self.config.lock().unwrap_or_else(|e| e.into_inner()).clone()
    }

    pub fn add_recent_project(&self, path: &str) {
        let mut config = self.config.lock().unwrap_or_else(|e| e.into_inner());
        config.recent_projects.retain(|p| p != path);
        config.recent_projects.insert(0, path.to_string());
        config.recent_projects.truncate(10);
    }

    pub fn set_theme(&self, theme: &str) {
        self.config.lock().unwrap_or_else(|e| e.into_inner()).theme = theme.to_string();
    }
}
