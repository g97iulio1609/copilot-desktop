use portable_pty::{CommandBuilder, NativePtySystem, PtySize, PtySystem};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter};

use crate::types::{AppError, PtyEvent};

struct PtySession {
    writer: Box<dyn Write + Send>,
    _child: Box<dyn portable_pty::Child + Send + Sync>,
}

pub struct PtyManager {
    sessions: Arc<Mutex<HashMap<String, PtySession>>>,
    copilot_path: Arc<Mutex<Option<String>>>,
}

impl PtyManager {
    pub fn new() -> Self {
        let copilot_path = which::which("copilot")
            .ok()
            .map(|p| p.to_string_lossy().to_string());

        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            copilot_path: Arc::new(Mutex::new(copilot_path)),
        }
    }

    pub fn is_copilot_installed(&self) -> bool {
        self.copilot_path.lock().unwrap_or_else(|e| e.into_inner()).is_some()
    }

    pub fn get_copilot_path(&self) -> Option<String> {
        self.copilot_path.lock().unwrap_or_else(|e| e.into_inner()).clone()
    }

    pub fn spawn_session(
        &self,
        session_id: &str,
        working_dir: &str,
        app_handle: AppHandle,
    ) -> Result<(), AppError> {
        let copilot_path = self
            .get_copilot_path()
            .ok_or(AppError::CopilotNotFound)?;

        let pty_system = NativePtySystem::default();
        let pair = pty_system
            .openpty(PtySize {
                rows: 50,
                cols: 120,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| AppError::PtyError(e.to_string()))?;

        let mut cmd = CommandBuilder::new(&copilot_path);
        cmd.cwd(working_dir);

        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| AppError::PtyError(e.to_string()))?;

        let reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| AppError::PtyError(e.to_string()))?;

        let writer = pair
            .master
            .take_writer()
            .map_err(|e| AppError::PtyError(e.to_string()))?;

        let sid = session_id.to_string();
        thread::spawn(move || {
            let buf_reader = BufReader::new(reader);
            for line in buf_reader.lines() {
                match line {
                    Ok(text) => {
                        let clean = strip_ansi_escapes::strip_str(&text);
                        let _ = app_handle.emit(
                            &format!("pty-output-{}", sid),
                            PtyEvent::Output(clean),
                        );
                    }
                    Err(_) => break,
                }
            }
            let _ = app_handle.emit(&format!("pty-output-{}", sid), PtyEvent::Exit(0));
        });

        let session = PtySession {
            writer,
            _child: child,
        };

        self.sessions
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .insert(session_id.to_string(), session);

        Ok(())
    }

    pub fn write_to_session(&self, session_id: &str, input: &str) -> Result<(), AppError> {
        let mut sessions = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        let session = sessions
            .get_mut(session_id)
            .ok_or_else(|| AppError::SessionNotFound(session_id.to_string()))?;

        session
            .writer
            .write_all(input.as_bytes())
            .map_err(|e| AppError::PtyError(e.to_string()))?;
        session
            .writer
            .write_all(b"\n")
            .map_err(|e| AppError::PtyError(e.to_string()))?;
        session
            .writer
            .flush()
            .map_err(|e| AppError::PtyError(e.to_string()))?;

        Ok(())
    }

    pub fn kill_session(&self, session_id: &str) -> Result<(), AppError> {
        self.sessions
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .remove(session_id)
            .ok_or_else(|| AppError::SessionNotFound(session_id.to_string()))?;
        Ok(())
    }
}
