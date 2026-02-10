use crate::types::ParsedOutput;

/// Streaming ANSI output parser that detects structured content
/// from Copilot CLI output (code blocks, tool executions, file changes, etc.)
pub struct AnsiParser {
    /// Buffer for accumulating partial lines
    line_buffer: String,
    /// Whether we're currently inside a code block
    in_code_block: bool,
    /// Language of the current code block
    code_block_language: Option<String>,
    /// Accumulated code block content
    code_block_buffer: String,
    /// Reserved for handling incomplete ANSI escape sequences in future
    _incomplete_escape: bool,
}

impl AnsiParser {
    pub fn new() -> Self {
        Self {
            line_buffer: String::new(),
            in_code_block: false,
            code_block_language: None,
            code_block_buffer: String::new(),
            _incomplete_escape: false,
        }
    }

    /// Feed raw bytes from the PTY and return parsed output events.
    /// Handles streaming: partial lines are buffered until a newline is received.
    pub fn feed(&mut self, raw: &str) -> Vec<ParsedOutput> {
        let mut results = Vec::new();
        let stripped = strip_ansi(raw);

        for ch in stripped.chars() {
            if ch == '\n' {
                let line = std::mem::take(&mut self.line_buffer);
                if let Some(parsed) = self.process_line(&line) {
                    results.push(parsed);
                }
            } else if ch != '\r' {
                self.line_buffer.push(ch);
            }
        }

        results
    }

    /// Flush any remaining buffered content (call on stream end).
    pub fn flush(&mut self) -> Vec<ParsedOutput> {
        let mut results = Vec::new();

        if !self.line_buffer.is_empty() {
            let line = std::mem::take(&mut self.line_buffer);
            if let Some(parsed) = self.process_line(&line) {
                results.push(parsed);
            }
        }

        // Close any open code block
        if self.in_code_block {
            let code = std::mem::take(&mut self.code_block_buffer);
            let language = self.code_block_language.take();
            self.in_code_block = false;
            results.push(ParsedOutput::CodeBlock { language, code });
        }

        results
    }

    fn process_line(&mut self, line: &str) -> Option<ParsedOutput> {
        let trimmed = line.trim();

        // Code block fence detection
        if trimmed.starts_with("```") {
            if self.in_code_block {
                // Closing fence
                self.in_code_block = false;
                let code = std::mem::take(&mut self.code_block_buffer);
                let language = self.code_block_language.take();
                return Some(ParsedOutput::CodeBlock { language, code });
            } else {
                // Opening fence — extract optional language
                let lang_str = trimmed.trim_start_matches('`').trim();
                self.code_block_language = if lang_str.is_empty() {
                    None
                } else {
                    Some(lang_str.to_string())
                };
                self.in_code_block = true;
                self.code_block_buffer.clear();
                return None;
            }
        }

        // Accumulate content inside code blocks
        if self.in_code_block {
            if !self.code_block_buffer.is_empty() {
                self.code_block_buffer.push('\n');
            }
            self.code_block_buffer.push_str(line);
            return None;
        }

        // Skip empty lines
        if trimmed.is_empty() {
            return None;
        }

        // Detect tool execution patterns
        if let Some(parsed) = detect_tool_execution(trimmed) {
            return Some(parsed);
        }

        // Detect file change patterns
        if let Some(parsed) = detect_file_change(trimmed) {
            return Some(parsed);
        }

        // Detect thinking/reasoning
        if let Some(parsed) = detect_thinking(trimmed) {
            return Some(parsed);
        }

        // Detect errors
        if let Some(parsed) = detect_error(trimmed) {
            return Some(parsed);
        }

        // Default: plain text
        Some(ParsedOutput::Text(trimmed.to_string()))
    }
}

/// Strip ANSI escape sequences from a string, handling incomplete sequences gracefully.
fn strip_ansi(input: &str) -> String {
    strip_ansi_escapes::strip_str(input).to_string()
}

/// Detect tool execution patterns in Copilot CLI output.
fn detect_tool_execution(line: &str) -> Option<ParsedOutput> {
    // Patterns like: "⚡ Running: tool_name" or "Tool: tool_name (status)"
    let lower = line.to_lowercase();

    if lower.starts_with("running:") || lower.starts_with("⚡ running:") {
        let tool = line
            .splitn(2, ':')
            .nth(1)
            .unwrap_or("")
            .trim()
            .to_string();
        return Some(ParsedOutput::ToolExecution {
            tool,
            status: "running".to_string(),
        });
    }

    // Pattern: "✓ tool_name completed" or "✗ tool_name failed"
    if line.starts_with('✓') || line.starts_with('✗') {
        let status = if line.starts_with('✓') { "completed" } else { "failed" };
        let tool = line[line.chars().next().unwrap().len_utf8()..].trim().to_string();
        return Some(ParsedOutput::ToolExecution {
            tool,
            status: status.to_string(),
        });
    }

    // Pattern: "Executing: command" or "$ command"
    if lower.starts_with("executing:") || line.starts_with("$ ") {
        let tool = if line.starts_with("$ ") {
            line[2..].trim().to_string()
        } else {
            line.splitn(2, ':').nth(1).unwrap_or("").trim().to_string()
        };
        return Some(ParsedOutput::ToolExecution {
            tool,
            status: "executing".to_string(),
        });
    }

    None
}

/// Detect file change patterns in Copilot CLI output.
fn detect_file_change(line: &str) -> Option<ParsedOutput> {
    let lower = line.to_lowercase();

    // Patterns: "Created file: path", "Modified file: path", "Deleted file: path"
    for action in &["created", "modified", "deleted", "updated", "wrote"] {
        let pattern = format!("{} file:", action);
        if lower.starts_with(&pattern) || lower.starts_with(&format!("{} ", action)) {
            let path = line
                .splitn(2, ':')
                .nth(1)
                .or_else(|| line.splitn(2, ' ').nth(1))
                .unwrap_or("")
                .trim()
                .to_string();
            if !path.is_empty() {
                return Some(ParsedOutput::FileChange {
                    path,
                    action: action.to_string(),
                });
            }
        }
    }

    // Pattern: "M src/file.rs" or "A src/file.rs" (git-style)
    if line.len() > 2 {
        let first_char = line.chars().next().unwrap();
        let second_char = line.chars().nth(1).unwrap();
        if (first_char == 'M' || first_char == 'A' || first_char == 'D') && second_char == ' ' {
            let action = match first_char {
                'M' => "modified",
                'A' => "added",
                'D' => "deleted",
                _ => "unknown",
            };
            let path = line[2..].trim().to_string();
            if path.contains('/') || path.contains('.') {
                return Some(ParsedOutput::FileChange {
                    path,
                    action: action.to_string(),
                });
            }
        }
    }

    None
}

/// Detect thinking/reasoning markers.
fn detect_thinking(line: &str) -> Option<ParsedOutput> {
    let lower = line.to_lowercase();
    if lower.starts_with("thinking")
        || lower.starts_with("reasoning")
        || lower.starts_with("🤔")
        || lower.starts_with("> thinking")
    {
        let content = line
            .splitn(2, ':')
            .nth(1)
            .unwrap_or(line)
            .trim()
            .to_string();
        return Some(ParsedOutput::Thinking(content));
    }
    None
}

/// Detect error lines.
fn detect_error(line: &str) -> Option<ParsedOutput> {
    let lower = line.to_lowercase();
    if lower.starts_with("error:") || lower.starts_with("error ") || lower.starts_with("❌") {
        return Some(ParsedOutput::Error(line.to_string()));
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plain_text() {
        let mut parser = AnsiParser::new();
        let results = parser.feed("Hello world\n");
        assert_eq!(results.len(), 1);
        assert!(matches!(&results[0], ParsedOutput::Text(s) if s == "Hello world"));
    }

    #[test]
    fn test_code_block() {
        let mut parser = AnsiParser::new();
        let results = parser.feed("```rust\nfn main() {}\n```\n");
        assert_eq!(results.len(), 1);
        match &results[0] {
            ParsedOutput::CodeBlock { language, code } => {
                assert_eq!(language.as_deref(), Some("rust"));
                assert_eq!(code, "fn main() {}");
            }
            _ => panic!("Expected CodeBlock"),
        }
    }

    #[test]
    fn test_streaming_partial_lines() {
        let mut parser = AnsiParser::new();
        let r1 = parser.feed("Hello ");
        assert!(r1.is_empty());
        let r2 = parser.feed("world\n");
        assert_eq!(r2.len(), 1);
        assert!(matches!(&r2[0], ParsedOutput::Text(s) if s == "Hello world"));
    }

    #[test]
    fn test_tool_execution() {
        let mut parser = AnsiParser::new();
        let results = parser.feed("⚡ Running: bash ls -la\n");
        assert_eq!(results.len(), 1);
        assert!(matches!(&results[0], ParsedOutput::ToolExecution { tool, status } if !tool.is_empty() && status == "running"));
    }

    #[test]
    fn test_file_change() {
        let mut parser = AnsiParser::new();
        let results = parser.feed("Created file: src/main.rs\n");
        assert_eq!(results.len(), 1);
        assert!(matches!(&results[0], ParsedOutput::FileChange { path, action } if path == "src/main.rs" && action == "created"));
    }

    #[test]
    fn test_error() {
        let mut parser = AnsiParser::new();
        let results = parser.feed("Error: something went wrong\n");
        assert_eq!(results.len(), 1);
        assert!(matches!(&results[0], ParsedOutput::Error(s) if s.contains("something went wrong")));
    }

    #[test]
    fn test_flush() {
        let mut parser = AnsiParser::new();
        let r1 = parser.feed("partial");
        assert!(r1.is_empty());
        let r2 = parser.flush();
        assert_eq!(r2.len(), 1);
        assert!(matches!(&r2[0], ParsedOutput::Text(s) if s == "partial"));
    }

    #[test]
    fn test_ansi_stripping() {
        let mut parser = AnsiParser::new();
        let results = parser.feed("\x1b[32mGreen text\x1b[0m\n");
        assert_eq!(results.len(), 1);
        assert!(matches!(&results[0], ParsedOutput::Text(s) if s == "Green text"));
    }
}
