use portable_pty::{CommandBuilder, MasterPty, NativePtySystem, PtySize, PtySystem};
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};
use tokio::sync::mpsc;

use super::parser::AnsiParser;
use crate::types::{AppError, PtyEvent};

struct PtySession {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
    child: Box<dyn portable_pty::Child + Send + Sync>,
    /// Sender to signal the reader task to stop
    _cancel_tx: mpsc::Sender<()>,
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
        model: Option<&str>,
        mode: Option<&str>,
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
        cmd.arg("--add-dir");
        cmd.arg(working_dir);
        if let Some(m) = model {
            cmd.arg("--model");
            cmd.arg(m);
        }
        if mode == Some("autopilot") {
            cmd.arg("--allow-all-tools");
        }
        cmd.env("TERM", "xterm-256color");

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

        // Channel for raw PTY data; reader thread sends chunks to async task
        let (data_tx, mut data_rx) = mpsc::channel::<Vec<u8>>(256);
        // Cancel channel to signal shutdown
        let (cancel_tx, mut cancel_rx) = mpsc::channel::<()>(1);

        let sid = session_id.to_string();

        // Blocking reader thread: reads raw bytes from PTY and sends via channel
        std::thread::spawn({
            let data_tx = data_tx.clone();
            move || {
                let mut reader = reader;
                let mut buf = [0u8; 4096];
                loop {
                    match reader.read(&mut buf) {
                        Ok(0) => break,
                        Ok(n) => {
                            if data_tx.blocking_send(buf[..n].to_vec()).is_err() {
                                break;
                            }
                        }
                        Err(_) => break,
                    }
                }
                // Signal EOF
                drop(data_tx);
            }
        });

        // Async task: receives raw data, parses, and emits structured events
        let sid_clone = sid.clone();
        let child_sessions = self.sessions.clone();
        tauri::async_runtime::spawn(async move {
            let mut parser = AnsiParser::new();
            let event_name = format!("pty-output-{}", sid_clone);

            loop {
                tokio::select! {
                    chunk = data_rx.recv() => {
                        match chunk {
                            Some(bytes) => {
                                let text = String::from_utf8_lossy(&bytes);
                                let parsed_events = parser.feed(&text);
                                for parsed in parsed_events {
                                    let _ = app_handle.emit(
                                        &event_name,
                                        PtyEvent::Parsed(parsed),
                                    );
                                }
                            }
                            None => {
                                // Reader closed — flush remaining buffered content
                                let remaining = parser.flush();
                                for parsed in remaining {
                                    let _ = app_handle.emit(
                                        &event_name,
                                        PtyEvent::Parsed(parsed),
                                    );
                                }

                                // Detect exit code from child process
                                let exit_code = {
                                    let mut sessions = child_sessions.lock().unwrap_or_else(|e| e.into_inner());
                                    if let Some(session) = sessions.get_mut(&sid_clone) {
                                        session.child.try_wait()
                                            .ok()
                                            .flatten()
                                            .map(|status| status.exit_code() as i32)
                                            .unwrap_or(0)
                                    } else {
                                        0
                                    }
                                };

                                let _ = app_handle.emit(&event_name, PtyEvent::Exit(exit_code));
                                break;
                            }
                        }
                    }
                    _ = cancel_rx.recv() => {
                        let remaining = parser.flush();
                        let event_name = format!("pty-output-{}", sid_clone);
                        for parsed in remaining {
                            let _ = app_handle.emit(
                                &event_name,
                                PtyEvent::Parsed(parsed),
                            );
                        }
                        break;
                    }
                }
            }
        });

        let session = PtySession {
            writer,
            master: pair.master,
            child,
            _cancel_tx: cancel_tx,
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

    pub fn resize_pty(
        &self,
        session_id: &str,
        rows: u16,
        cols: u16,
    ) -> Result<(), AppError> {
        let sessions = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        let session = sessions
            .get(session_id)
            .ok_or_else(|| AppError::SessionNotFound(session_id.to_string()))?;

        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| AppError::PtyError(e.to_string()))?;

        Ok(())
    }

    pub fn kill_session(&self, session_id: &str) -> Result<(), AppError> {
        let mut sessions = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        let mut session = sessions
            .remove(session_id)
            .ok_or_else(|| AppError::SessionNotFound(session_id.to_string()))?;

        // Attempt graceful kill
        let _ = session.child.kill();

        Ok(())
    }
}
