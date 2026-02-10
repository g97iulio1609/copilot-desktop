use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use crate::types::{AgentMode, SessionInfo};

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
            mode: AgentMode::Suggest,
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

    pub fn get_session(&self, session_id: &str) -> Option<SessionInfo> {
        let active = self.active_session.lock().unwrap_or_else(|e| e.into_inner()).clone();
        self.sessions
            .lock()
            .unwrap_or_else(|e| e.into_inner())
            .get(session_id)
            .map(|s| {
                let mut session = s.clone();
                session.is_active = active.as_deref() == Some(&session.id);
                session
            })
    }

    pub fn rename_session(&self, session_id: &str, new_name: &str) -> bool {
        let mut sessions = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(session) = sessions.get_mut(session_id) {
            session.name = new_name.to_string();
            true
        } else {
            false
        }
    }

    pub fn set_session_model(&self, session_id: &str, model: &str) -> bool {
        let mut sessions = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(session) = sessions.get_mut(session_id) {
            session.model = Some(model.to_string());
            true
        } else {
            false
        }
    }

    pub fn set_session_mode(&self, session_id: &str, mode: AgentMode) -> bool {
        let mut sessions = self.sessions.lock().unwrap_or_else(|e| e.into_inner());
        if let Some(session) = sessions.get_mut(session_id) {
            session.mode = mode;
            true
        } else {
            false
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_session() {
        let manager = SessionManager::new();
        let session = manager.create_session("test", "/tmp");
        assert_eq!(session.name, "test");
        assert_eq!(session.working_dir, "/tmp");
        assert!(session.is_active);
        assert!(!session.id.is_empty());
    }

    #[test]
    fn test_list_sessions() {
        let manager = SessionManager::new();
        manager.create_session("s1", "/tmp");
        manager.create_session("s2", "/home");
        let sessions = manager.list_sessions();
        assert_eq!(sessions.len(), 2);
    }

    #[test]
    fn test_active_session_is_last_created() {
        let manager = SessionManager::new();
        let s1 = manager.create_session("s1", "/tmp");
        let s2 = manager.create_session("s2", "/home");
        assert_eq!(manager.get_active_session_id(), Some(s2.id.clone()));

        // s1 should not be active, s2 should be
        let listed = manager.list_sessions();
        let s1_listed = listed.iter().find(|s| s.id == s1.id).unwrap();
        let s2_listed = listed.iter().find(|s| s.id == s2.id).unwrap();
        assert!(!s1_listed.is_active);
        assert!(s2_listed.is_active);
    }

    #[test]
    fn test_delete_session() {
        let manager = SessionManager::new();
        let session = manager.create_session("test", "/tmp");
        assert!(manager.remove_session(&session.id));
        assert_eq!(manager.list_sessions().len(), 0);
    }

    #[test]
    fn test_delete_session_clears_active() {
        let manager = SessionManager::new();
        let session = manager.create_session("test", "/tmp");
        manager.remove_session(&session.id);
        assert!(manager.get_active_session_id().is_none());
    }

    #[test]
    fn test_delete_nonexistent_session_returns_false() {
        let manager = SessionManager::new();
        assert!(!manager.remove_session("nonexistent"));
    }

    #[test]
    fn test_set_active_session() {
        let manager = SessionManager::new();
        let s1 = manager.create_session("s1", "/tmp");
        let _s2 = manager.create_session("s2", "/home");
        assert!(manager.set_active_session(&s1.id));
        assert_eq!(manager.get_active_session_id(), Some(s1.id));
    }

    #[test]
    fn test_rename_session() {
        let manager = SessionManager::new();
        let session = manager.create_session("old", "/tmp");
        assert!(manager.rename_session(&session.id, "new"));
        let updated = manager.get_session(&session.id).unwrap();
        assert_eq!(updated.name, "new");
    }
}
