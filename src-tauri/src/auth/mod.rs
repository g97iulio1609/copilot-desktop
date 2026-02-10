use serde_json::Value;

use crate::types::AuthStatus;

/// Check if the user is authenticated with GitHub Copilot
/// Reads ~/.copilot/config.json which contains logged_in_users array
pub fn check_auth_status() -> AuthStatus {
    let home = match dirs::home_dir() {
        Some(h) => h,
        None => return AuthStatus { authenticated: false, username: None, email: None },
    };

    // Primary: ~/.copilot/config.json — prefer last_logged_in_user, fall back to logged_in_users
    let config_path = home.join(".copilot").join("config.json");
    if let Ok(contents) = std::fs::read_to_string(&config_path) {
        if let Ok(config) = serde_json::from_str::<Value>(&contents) {
            // Prefer last_logged_in_user (the active user)
            if let Some(last_user) = config.get("last_logged_in_user") {
                let login = last_user.get("login").and_then(|v| v.as_str()).map(|s| s.to_string());
                if login.is_some() {
                    return AuthStatus {
                        authenticated: true,
                        username: login,
                        email: None,
                    };
                }
            }
            // Fall back to first entry in logged_in_users
            if let Some(users) = config.get("logged_in_users").and_then(|v| v.as_array()) {
                if let Some(first_user) = users.first() {
                    let login = first_user.get("login").and_then(|v| v.as_str()).map(|s| s.to_string());
                    return AuthStatus {
                        authenticated: true,
                        username: login,
                        email: None,
                    };
                }
            }
        }
    }

    AuthStatus { authenticated: false, username: None, email: None }
}
