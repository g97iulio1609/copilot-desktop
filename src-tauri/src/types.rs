use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Copilot CLI not found. Please install it first.")]
    CopilotNotFound,
    #[error("PTY error: {0}")]
    PtyError(String),
    #[error("Session not found: {0}")]
    SessionNotFound(String),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Other(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CopilotMessage {
    pub id: String,
    pub role: MessageRole,
    pub content: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
    User,
    Assistant,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionInfo {
    pub id: String,
    pub name: String,
    pub working_dir: String,
    pub model: Option<String>,
    pub created_at: u64,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CopilotStatus {
    pub installed: bool,
    pub path: Option<String>,
    pub version: Option<String>,
    pub authenticated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum PtyEvent {
    Output(String),
    Parsed(ParsedOutput),
    Error(String),
    Exit(i32),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ParsedOutput {
    Text(String),
    CodeBlock { language: Option<String>, code: String },
    ToolExecution { tool: String, status: String },
    FileChange { path: String, action: String },
    Thinking(String),
    Error(String),
    RawLine(String),
}
