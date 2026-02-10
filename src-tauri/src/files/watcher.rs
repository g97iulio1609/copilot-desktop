use std::collections::HashMap;
use std::path::Path;
use std::process::Command;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use tauri::{AppHandle, Emitter};

use crate::types::{AppError, DiffHunk, DiffLine, DiffResult, FileChangeEvent};

const IGNORE_PATTERNS: &[&str] = &[
    "node_modules",
    ".git",
    "target",
    "dist",
    "build",
    "__pycache__",
    ".DS_Store",
    ".next",
    ".turbo",
    ".cache",
];

const MAX_FILE_SIZE: u64 = 1_048_576; // 1MB

fn should_ignore(path: &Path) -> bool {
    path.components().any(|c| {
        let s = c.as_os_str().to_string_lossy();
        IGNORE_PATTERNS.iter().any(|p| s == *p)
    })
}

fn now_ts() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

type SharedChanges = Arc<Mutex<Vec<FileChangeEvent>>>;

struct WatcherHandle {
    _watcher: RecommendedWatcher,
    changes: SharedChanges,
}

pub struct FileWatcher {
    watchers: Mutex<HashMap<String, WatcherHandle>>,
}

impl FileWatcher {
    pub fn new() -> Self {
        Self {
            watchers: Mutex::new(HashMap::new()),
        }
    }

    pub fn start_watching(
        &self,
        session_id: &str,
        working_dir: &str,
        app_handle: AppHandle,
    ) -> Result<(), AppError> {
        let dir = Path::new(working_dir);
        if !dir.exists() {
            return Err(AppError::Other(format!(
                "Directory does not exist: {}",
                working_dir
            )));
        }

        let changes: SharedChanges = Arc::new(Mutex::new(Vec::new()));
        let changes_ref = changes.clone();
        let event_name = format!("file-change-{}", session_id);

        let mut watcher = RecommendedWatcher::new(
            move |res: Result<notify::Event, notify::Error>| {
                if let Ok(event) = res {
                    for path in &event.paths {
                        if should_ignore(path) {
                            continue;
                        }
                        let kind = match event.kind {
                            EventKind::Create(_) => "created",
                            EventKind::Modify(_) => "modified",
                            EventKind::Remove(_) => "deleted",
                            _ => continue,
                        };

                        let change = FileChangeEvent {
                            path: path.to_string_lossy().to_string(),
                            kind: kind.to_string(),
                            timestamp: now_ts(),
                        };

                        if let Ok(mut c) = changes_ref.lock() {
                            if let Some(existing) = c.iter_mut().find(|e| e.path == change.path) {
                                existing.kind = change.kind.clone();
                                existing.timestamp = change.timestamp;
                            } else {
                                c.push(change.clone());
                            }
                        }

                        let _ = app_handle.emit(&event_name, &change);
                    }
                }
            },
            Config::default(),
        )
        .map_err(|e| AppError::Other(format!("Watcher error: {}", e)))?;

        watcher
            .watch(dir, RecursiveMode::Recursive)
            .map_err(|e| AppError::Other(format!("Watch error: {}", e)))?;

        self.watchers
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .insert(
                session_id.to_string(),
                WatcherHandle {
                    _watcher: watcher,
                    changes,
                },
            );

        Ok(())
    }

    pub fn stop_watching(&self, session_id: &str) {
        self.watchers
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .remove(session_id);
    }

    pub fn list_changed_files(&self, session_id: &str) -> Vec<FileChangeEvent> {
        self.watchers
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .get(session_id)
            .map(|h| h.changes.lock().unwrap_or_else(|e| e.into_inner()).clone())
            .unwrap_or_default()
    }

    pub fn read_file_content(path: &str) -> Result<String, AppError> {
        let p = Path::new(path);
        if !p.exists() {
            return Err(AppError::Other(format!("File not found: {}", path)));
        }

        let metadata = std::fs::metadata(p)?;
        if metadata.len() > MAX_FILE_SIZE {
            return Err(AppError::Other("File too large (max 1MB)".to_string()));
        }

        std::fs::read_to_string(p).map_err(|e| AppError::Other(format!("Read error: {}", e)))
    }

    pub fn get_file_diff(path: &str) -> Result<DiffResult, AppError> {
        let p = Path::new(path);

        let dir = if p.is_file() {
            p.parent().unwrap_or(p)
        } else {
            p
        };

        let output = Command::new("git")
            .args(["diff", "HEAD", "--", path])
            .current_dir(dir)
            .output()
            .map_err(|e| AppError::Other(format!("Git error: {}", e)))?;

        let diff_text = String::from_utf8_lossy(&output.stdout).to_string();

        if diff_text.is_empty() {
            let status_output = Command::new("git")
                .args(["status", "--porcelain", "--", path])
                .current_dir(dir)
                .output()
                .map_err(|e| AppError::Other(format!("Git error: {}", e)))?;

            let status = String::from_utf8_lossy(&status_output.stdout).to_string();
            if status.starts_with("??") {
                let content = Self::read_file_content(path)?;
                let lines: Vec<DiffLine> = content
                    .lines()
                    .enumerate()
                    .map(|(i, line)| DiffLine {
                        content: line.to_string(),
                        line_type: "add".to_string(),
                        old_line: None,
                        new_line: Some(i + 1),
                    })
                    .collect();
                let additions = lines.len();
                return Ok(DiffResult {
                    path: path.to_string(),
                    hunks: vec![DiffHunk {
                        header: format!("@@ -0,0 +1,{} @@", additions),
                        lines,
                    }],
                    additions,
                    deletions: 0,
                });
            }

            return Ok(DiffResult {
                path: path.to_string(),
                hunks: vec![],
                additions: 0,
                deletions: 0,
            });
        }

        parse_unified_diff(path, &diff_text)
    }
}

fn parse_unified_diff(path: &str, diff: &str) -> Result<DiffResult, AppError> {
    let mut hunks = Vec::new();
    let mut additions = 0usize;
    let mut deletions = 0usize;
    let mut current_hunk: Option<DiffHunk> = None;
    let mut old_line = 0usize;
    let mut new_line = 0usize;

    for line in diff.lines() {
        if line.starts_with("@@") {
            if let Some(hunk) = current_hunk.take() {
                hunks.push(hunk);
            }

            // Parse hunk header: @@ -old_start,old_count +new_start,new_count @@
            let parts: Vec<&str> = line.splitn(4, ' ').collect();
            if parts.len() >= 3 {
                let old_part = parts[1].trim_start_matches('-');
                let new_part = parts[2].trim_start_matches('+');
                old_line = old_part
                    .split(',')
                    .next()
                    .and_then(|s| s.parse().ok())
                    .unwrap_or(1);
                new_line = new_part
                    .split(',')
                    .next()
                    .and_then(|s| s.parse().ok())
                    .unwrap_or(1);
            }

            current_hunk = Some(DiffHunk {
                header: line.to_string(),
                lines: Vec::new(),
            });
        } else if let Some(ref mut hunk) = current_hunk {
            if line.starts_with('+') {
                hunk.lines.push(DiffLine {
                    content: line[1..].to_string(),
                    line_type: "add".to_string(),
                    old_line: None,
                    new_line: Some(new_line),
                });
                new_line += 1;
                additions += 1;
            } else if line.starts_with('-') {
                hunk.lines.push(DiffLine {
                    content: line[1..].to_string(),
                    line_type: "remove".to_string(),
                    old_line: Some(old_line),
                    new_line: None,
                });
                old_line += 1;
                deletions += 1;
            } else if line.starts_with(' ') {
                hunk.lines.push(DiffLine {
                    content: line[1..].to_string(),
                    line_type: "context".to_string(),
                    old_line: Some(old_line),
                    new_line: Some(new_line),
                });
                old_line += 1;
                new_line += 1;
            }
        }
    }

    if let Some(hunk) = current_hunk {
        hunks.push(hunk);
    }

    Ok(DiffResult {
        path: path.to_string(),
        hunks,
        additions,
        deletions,
    })
}
