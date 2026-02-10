# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-07-17

### Added

#### Phase 1 — Scaffolding & Foundation
- Tauri 2.10 + React 19 project scaffold with Vite and TypeScript
- Custom frameless window with macOS-native titlebar (traffic lights)
- Glass-effect sidebar and main panel layout
- Tailwind CSS 4 dark theme with zinc color palette
- Zustand stores for centralized state management

#### Phase 2 — Chat UI & Streaming
- Streaming chat interface with real-time markdown rendering
- Syntax-highlighted code blocks via Shiki
- Message bubbles with user/assistant distinction
- Auto-scroll and typing indicators
- Input area with keyboard shortcuts

#### Phase 3 — Authentication & Project Management
- GitHub authentication flow integration
- Project/workspace selector
- Working directory management via Tauri IPC

#### Phase 4 — File Tree & Diff Viewer
- Real-time file tree showing agent-modified files
- Unified and split diff viewer with syntax highlighting
- Accept/reject controls for individual changes

#### Phase 5 — Session Management
- Multi-session support with create/switch/delete
- Session history and persistence
- PTY session lifecycle management (spawn, write, kill)

#### Phase 6 — MCP Server Manager
- Visual MCP server configuration panel
- Add, remove, and toggle MCP servers
- Server status monitoring

#### Phase 7 — Plugin Marketplace
- Browse, install, and manage plugins
- Plugin cards with metadata display
- Enable/disable installed plugins

#### Phase 8 — Settings, Metrics & Polish
- Settings panel with preferences persistence
- Token usage and premium request metrics dashboard
- Keyboard shortcuts and command palette (⌘K)
- CI workflow for type checking and linting
- Release workflow for automated DMG builds

[Unreleased]: https://github.com/g97iulio1609/copilot-desktop/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/g97iulio1609/copilot-desktop/releases/tag/v0.1.0
