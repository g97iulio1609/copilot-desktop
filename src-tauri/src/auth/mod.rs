use serde_json::Value;
use std::path::PathBuf;

use crate::types::AuthStatus;

/// Try to read GitHub auth info from ~/.copilot/ config files
fn read_copilot_config() -> Option<AuthStatus> {
    let home = dirs::home_dir()?;

    // Check hosts.json (GitHub Copilot CLI auth store)
    let hosts_path = home.join(".copilot").join("hosts.json");
    if let Ok(contents) = std::fs::read_to_string(&hosts_path) {
        if let Ok(hosts) = serde_json::from_str::<Value>(&contents) {
            if let Some(obj) = hosts.as_object() {
                // hosts.json maps host -> { user, oauth_token, ... }
                for (_host, info) in obj {
                    if let Some(user) = info.get("user").and_then(|v| v.as_str()) {
                        return Some(AuthStatus {
                            authenticated: true,
                            username: Some(user.to_string()),
                            email: info.get("email").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        });
                    }
                    // If there's an oauth_token but no user field, still authenticated
                    if info.get("oauth_token").and_then(|v| v.as_str()).is_some() {
                        return Some(AuthStatus {
                            authenticated: true,
                            username: None,
                            email: None,
                        });
                    }
                }
            }
        }
    }

    // Fallback: check github-copilot config locations
    let alt_paths: Vec<PathBuf> = vec![
        home.join(".config").join("github-copilot").join("hosts.json"),
        home.join(".config").join("github-copilot").join("apps.json"),
    ];

    for path in alt_paths {
        if let Ok(contents) = std::fs::read_to_string(&path) {
            if let Ok(data) = serde_json::from_str::<Value>(&contents) {
                if let Some(obj) = data.as_object() {
                    if !obj.is_empty() {
                        // Has config entries — likely authenticated
                        for (_key, info) in obj {
                            let user = info.get("user").and_then(|v| v.as_str()).map(|s| s.to_string());
                            let email = info.get("email").and_then(|v| v.as_str()).map(|s| s.to_string());
                            if user.is_some() || info.get("oauth_token").is_some() {
                                return Some(AuthStatus {
                                    authenticated: true,
                                    username: user,
                                    email,
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    None
}

/// Check if the user is authenticated with GitHub Copilot
pub fn check_auth_status() -> AuthStatus {
    read_copilot_config().unwrap_or(AuthStatus {
        authenticated: false,
        username: None,
        email: None,
    })
}
