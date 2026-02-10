use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use crate::types::SessionInfo;

pub struct SessionManager {
    sessions: Mutex<HashMap<String, SessionInfo>>,
    active_session: Mutex<Option<String>>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            sessions: Mutex::new(HashMap::new()),
            active_session: Mutex::new(None),
        }
    }

    pub fn create_session(&self, name: &str, working_dir: &str) -> SessionInfo {
        let id = Uuid::new_v4().to_string();
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let session = SessionInfo {
            id: id.clone(),
            name: name.to_string(),
            working_dir: working_dir.to_string(),
            model: None,
            created_at: now,
            is_active: true,
        };

        self.sessions
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .insert(id.clone(), session.clone());

        *self.active_session.lock().unwrap_or_else(|e| e.into_inner()) = Some(id);

        session
    }

    pub fn list_sessions(&self) -> Vec<SessionInfo> {
        let active = self.active_session.lock().unwrap_or_else(|e| e.into_inner()).clone();
        self.sessions
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .values()
            .map(|s| {
                let mut session = s.clone();
                session.is_active = active.as_deref() == Some(&session.id);
                session
            })
            .collect()
    }

    pub fn get_active_session_id(&self) -> Option<String> {
        self.active_session.lock().unwrap_or_else(|e| e.into_inner()).clone()
    }

    pub fn set_active_session(&self, session_id: &str) -> bool {
        let sessions = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        if sessions.contains_key(session_id) {
            *self.active_session.lock().unwrap_or_else(|e| e.into_inner()) =
                Some(session_id.to_string());
            true
        } else {
            false
        }
    }

    pub fn remove_session(&self, session_id: &str) -> bool {
        let removed = self
            .sessions
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .remove(session_id)
            .is_some();

        if removed {
            let mut active = self.active_session.lock().unwrap_or_else(|e| e.into_inner());
            if active.as_deref() == Some(session_id) {
                *active = None;
            }
        }
        removed
    }
}
