use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub copilot_path: Option<String>,
    pub default_model: Option<String>,
    pub theme: String,
    pub recent_projects: Vec<String>,
    #[serde(default = "default_font_size")]
    pub font_size: u16,
    #[serde(default = "default_font_family")]
    pub font_family: String,
    #[serde(default = "default_true")]
    pub show_line_numbers: bool,
    #[serde(default = "default_true")]
    pub auto_scroll: bool,
    #[serde(default = "default_true")]
    pub send_on_enter: bool,
    #[serde(default)]
    pub notification_sound: bool,
    #[serde(default = "default_accent_color")]
    pub accent_color: String,
}

fn default_font_size() -> u16 { 14 }
fn default_font_family() -> String { "SF Mono".to_string() }
fn default_true() -> bool { true }
fn default_accent_color() -> String { "blue".to_string() }

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            copilot_path: None,
            default_model: None,
            theme: "dark".to_string(),
            recent_projects: Vec::new(),
            font_size: 14,
            font_family: "SF Mono".to_string(),
            show_line_numbers: true,
            auto_scroll: true,
            send_on_enter: true,
            notification_sound: false,
            accent_color: "blue".to_string(),
        }
    }
}

fn config_dir() -> std::path::PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| std::path::PathBuf::from("."));
    home.join(".copilot-desktop")
}

fn config_path() -> std::path::PathBuf {
    config_dir().join("config.json")
}

pub fn load_config() -> AppConfig {
    let path = config_path();
    match std::fs::read_to_string(&path) {
        Ok(data) => serde_json::from_str(&data).unwrap_or_default(),
        Err(_) => AppConfig::default(),
    }
}

pub fn save_config(config: &AppConfig) -> Result<(), std::io::Error> {
    let dir = config_dir();
    std::fs::create_dir_all(&dir)?;
    let data = serde_json::to_string_pretty(config)
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;
    std::fs::write(config_path(), data)
}

pub struct ConfigManager {
    config: Mutex<AppConfig>,
}

impl ConfigManager {
    pub fn new() -> Self {
        Self {
            config: Mutex::new(load_config()),
        }
    }

    pub fn get_config(&self) -> AppConfig {
        self.config.lock().unwrap_or_else(|e| e.into_inner()).clone()
    }

    pub fn update_config(&self, new_config: AppConfig) -> Result<(), std::io::Error> {
        save_config(&new_config)?;
        *self.config.lock().unwrap_or_else(|e| e.into_inner()) = new_config;
        Ok(())
    }

    pub fn add_recent_project(&self, path: &str) {
        let mut config = self.config.lock().unwrap_or_else(|e| e.into_inner());
        config.recent_projects.retain(|p| p != path);
        config.recent_projects.insert(0, path.to_string());
        config.recent_projects.truncate(10);
        let _ = save_config(&config);
    }

    pub fn set_theme(&self, theme: &str) {
        let mut config = self.config.lock().unwrap_or_else(|e| e.into_inner());
        config.theme = theme.to_string();
        let _ = save_config(&config);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();
        assert_eq!(config.theme, "dark");
        assert_eq!(config.font_size, 14);
        assert_eq!(config.font_family, "SF Mono");
        assert!(config.copilot_path.is_none());
        assert!(config.default_model.is_none());
        assert!(config.recent_projects.is_empty());
        assert!(config.show_line_numbers);
        assert!(config.auto_scroll);
        assert!(config.send_on_enter);
        assert!(!config.notification_sound);
        assert_eq!(config.accent_color, "blue");
    }

    #[test]
    fn test_config_serialize_deserialize() {
        let config = AppConfig {
            copilot_path: Some("/usr/bin/copilot".to_string()),
            theme: "light".to_string(),
            font_size: 16,
            ..AppConfig::default()
        };
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: AppConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.copilot_path, Some("/usr/bin/copilot".to_string()));
        assert_eq!(deserialized.theme, "light");
        assert_eq!(deserialized.font_size, 16);
    }

    #[test]
    fn test_load_save_cycle_with_temp_file() {
        let dir = std::env::temp_dir().join(format!("copilot-test-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("config.json");

        let config = AppConfig {
            theme: "light".to_string(),
            font_size: 20,
            ..AppConfig::default()
        };
        let data = serde_json::to_string_pretty(&config).unwrap();
        let mut file = std::fs::File::create(&path).unwrap();
        file.write_all(data.as_bytes()).unwrap();

        let loaded: AppConfig =
            serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(loaded.theme, "light");
        assert_eq!(loaded.font_size, 20);

        // Cleanup
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn test_config_manager_get_update() {
        let manager = ConfigManager {
            config: Mutex::new(AppConfig::default()),
        };
        let config = manager.get_config();
        assert_eq!(config.theme, "dark");

        let mut updated = config;
        updated.theme = "light".to_string();
        *manager.config.lock().unwrap() = updated;
        assert_eq!(manager.get_config().theme, "light");
    }
}
