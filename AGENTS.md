# Copilot Desktop — Agent Instructions

## Project Overview
Copilot Desktop is a standalone desktop application built with **Tauri 2.1** (Rust backend) and **React 19** (TypeScript frontend) that provides a modern UI for GitHub Copilot CLI. It wraps the `copilot` CLI binary as a child process via PTY and renders the output in a polished graphical interface inspired by OpenAI's Codex app.

## Architecture
- **Backend (Rust — `src-tauri/src/`):** Manages PTY sessions, file watching, config persistence, and exposes Tauri IPC commands.
- **Frontend (React — `src/`):** Renders the UI with Tailwind CSS 4 + shadcn/ui components. State management via Zustand stores.
- **Communication:** Frontend ↔ Backend via Tauri `invoke()` commands and event listeners (`listen()`).

## Key Principles
- **KISS:** Each module/component has a single responsibility.
- **DRY:** Shared types in `src/types/`, utility functions in `src/lib/utils.ts`, centralized state in Zustand stores.
- **SOLID:** Rust traits for abstractions, React composition over inheritance, dependency injection via Tauri state management.

## Directory Structure
```
src-tauri/src/
├── pty/manager.rs       — PTY lifecycle (spawn, write, kill copilot process)
├── session/manager.rs   — Session state management
├── config/mod.rs        — App configuration
├── commands/mod.rs       — Tauri IPC command handlers
├── types.rs              — Shared Rust types
├── lib.rs                — App entry point, plugin registration
└── main.rs               — Binary entry point

src/
├── components/layout/   — Titlebar, Sidebar, MainPanel
├── components/chat/     — ChatPanel, MessageBubble, InputArea
├── stores/              — Zustand stores (chat, session, settings)
├── lib/tauri.ts          — Tauri IPC wrapper functions
├── lib/utils.ts          — Utility functions (cn)
├── types/index.ts        — TypeScript type definitions
└── App.tsx               — Root component
```

## Coding Standards

### Rust
- Use `thiserror` for error types, implement `Serialize` for Tauri compatibility.
- Prefer `Mutex` with `unwrap_or_else(|e| e.into_inner())` for poison recovery.
- Use `tauri::State<'_>` for dependency injection in commands.
- All IPC commands go in `commands/mod.rs`.

### TypeScript/React
- Use `@/` path aliases for imports.
- Use `cn()` utility for conditional classNames.
- Components are functional, using hooks for state.
- All Tauri calls go through `lib/tauri.ts` — never call `invoke()` directly from components.
- Store files follow the pattern: `use[Name]Store.ts`.

### Styling
- Tailwind CSS 4 with zinc color palette for dark theme.
- Glass effect: `bg-zinc-900/80 backdrop-blur-xl`.
- Border: `border-zinc-800/50`.
- Interactive: hover states with `/50` opacity variants.
- Animations: `transition-colors`, `transition-all duration-200`.

## Git Workflow
- `main` branch is stable.
- Feature branches: `feat/phase-N-description`.
- Each phase = 1 branch → commit → merge to main.
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`).

## Testing
- Rust: `cargo test` in `src-tauri/`.
- Frontend: `vitest` (to be configured).
- Always verify `pnpm tauri dev` runs without errors after changes.

## Build
- Dev: `pnpm tauri dev`
- Build: `pnpm tauri build`
- The app requires `copilot` CLI to be installed on the user's machine.
