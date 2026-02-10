use crate::pty::PtyManager;
use crate::types::PluginInfo;

pub struct PluginManager;

impl PluginManager {
    /// Returns hardcoded sample data for the marketplace.
    pub fn list_available_plugins() -> Vec<PluginInfo> {
        vec![
            PluginInfo {
                name: "github-pr-review".into(),
                version: "1.2.0".into(),
                description: "Review pull requests directly from Copilot with inline comments and approval workflows.".into(),
                author: "GitHub".into(),
                installed: false,
                update_available: false,
                category: Some("Integrations".into()),
                downloads: Some(45_200),
            },
            PluginInfo {
                name: "docker-compose".into(),
                version: "0.9.1".into(),
                description: "Manage Docker Compose services, build images, and inspect containers.".into(),
                author: "Docker Inc.".into(),
                installed: false,
                update_available: false,
                category: Some("Tools".into()),
                downloads: Some(32_100),
            },
            PluginInfo {
                name: "python-debugger".into(),
                version: "2.0.3".into(),
                description: "Enhanced Python debugging with breakpoints, variable inspection, and step execution.".into(),
                author: "PyTools".into(),
                installed: false,
                update_available: false,
                category: Some("Languages".into()),
                downloads: Some(28_750),
            },
            PluginInfo {
                name: "sql-assistant".into(),
                version: "1.1.0".into(),
                description: "Write, optimize, and explain SQL queries with schema-aware suggestions.".into(),
                author: "DataTools".into(),
                installed: false,
                update_available: false,
                category: Some("Languages".into()),
                downloads: Some(19_400),
            },
            PluginInfo {
                name: "kubernetes-manager".into(),
                version: "0.8.0".into(),
                description: "Deploy, monitor, and troubleshoot Kubernetes clusters and workloads.".into(),
                author: "CloudNative".into(),
                installed: false,
                update_available: false,
                category: Some("Tools".into()),
                downloads: Some(15_300),
            },
            PluginInfo {
                name: "figma-bridge".into(),
                version: "1.0.2".into(),
                description: "Import Figma designs and generate React components from design tokens.".into(),
                author: "DesignOps".into(),
                installed: false,
                update_available: false,
                category: Some("Integrations".into()),
                downloads: Some(12_800),
            },
        ]
    }

    /// Returns sample installed plugins.
    pub fn list_installed_plugins() -> Vec<PluginInfo> {
        vec![
            PluginInfo {
                name: "github-pr-review".into(),
                version: "1.1.0".into(),
                description: "Review pull requests directly from Copilot with inline comments and approval workflows.".into(),
                author: "GitHub".into(),
                installed: true,
                update_available: true,
                category: Some("Integrations".into()),
                downloads: Some(45_200),
            },
        ]
    }

    /// Sends `/plugin install {name}` to the active PTY session.
    pub fn install_plugin(pty: &PtyManager, session_id: &str, name: &str) -> Result<(), crate::types::AppError> {
        let cmd = format!("/plugin install {}", name);
        pty.write_to_session(session_id, &cmd)
    }

    /// Sends `/plugin uninstall {name}` to the active PTY session.
    pub fn uninstall_plugin(pty: &PtyManager, session_id: &str, name: &str) -> Result<(), crate::types::AppError> {
        let cmd = format!("/plugin uninstall {}", name);
        pty.write_to_session(session_id, &cmd)
    }

    /// Sends `/plugin update {name}` to the active PTY session.
    pub fn update_plugin(pty: &PtyManager, session_id: &str, name: &str) -> Result<(), crate::types::AppError> {
        let cmd = format!("/plugin update {}", name);
        pty.write_to_session(session_id, &cmd)
    }
}
