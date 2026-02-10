# Copilot Desktop — Copilot Instructions

## Architecture

Copilot Desktop is a native macOS app built with **Tauri 2** (Rust backend) and **React 19** (TypeScript frontend).

```
src/              → React frontend (Vite + Tailwind CSS v4)
src-tauri/        → Rust backend (Tauri commands, PTY management)
```

The app wraps the GitHub Copilot CLI in a desktop GUI, managing sessions via pseudo-terminals.

## Frontend Conventions

- **State management**: Zustand stores in `src/stores/`. Each store is a single `create()` call.
- **Styling**: Tailwind CSS v4 with `cn()` utility from `src/lib/utils.ts` (clsx + tailwind-merge).
- **Imports**: Use the `@/` alias (maps to `src/`). Example: `import { cn } from '@/lib/utils'`.
- **Components**: Organized by feature in `src/components/` (e.g., `layout/`, `chat/`, `auth/`).
- **Icons**: Use `lucide-react` for all icons.
- **Animations**: Use `framer-motion` for transitions and animations.
- **Markdown**: Use `react-markdown` with `remark-gfm` and `rehype-highlight`.

## Backend Conventions

- **Error handling**: Use `thiserror` for typed errors. Return `Result<T, AppError>` from commands.
- **State**: Inject shared state via `tauri::State<T>` in command handlers.
- **Commands**: Annotate with `#[tauri::command]` and register in `tauri::Builder`.
- **Serialization**: Derive `serde::Serialize` / `serde::Deserialize` on all types crossing the FFI boundary.

## Adding a New Tauri Command

1. Define the function in `src-tauri/src/commands/` with `#[tauri::command]`.
2. Add any new types to `src-tauri/src/types.rs` with Serde derives.
3. Register the command in `src-tauri/src/lib.rs` via `.invoke_handler(tauri::generate_handler![...])`.
4. Add the TypeScript binding in `src/lib/tauri.ts` using `invoke<ReturnType>('command_name', { args })`.
5. Add the return type to `src/types/index.ts`.

## Adding a New UI Component

1. Create the component in the appropriate `src/components/<feature>/` directory.
2. Use `cn()` for conditional class merging.
3. Accept props via a typed interface; export as a named export.
4. If the component needs global state, use the relevant Zustand store.
5. For keyboard shortcuts, register them in `src/hooks/useKeyboard.ts`.

## Testing Guidelines

- **Rust**: Write unit tests in the same file with `#[cfg(test)]` modules. Run with `cargo test` in `src-tauri/`.
- **Frontend**: Run `pnpm exec tsc --noEmit` to type-check. Run `pnpm run lint` for ESLint.
- **CI**: GitHub Actions runs both frontend and backend checks on every push/PR to `main`.

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Root component with auth gating and layout |
| `src/stores/sessionStore.ts` | Session state (active session, list) |
| `src/stores/settingsStore.ts` | App settings (theme, view, sidebar) |
| `src/lib/tauri.ts` | All Tauri IPC bindings |
| `src/types/index.ts` | Shared TypeScript types |
| `src-tauri/src/lib.rs` | Tauri app builder and command registration |
| `src-tauri/tauri.conf.json` | Tauri configuration |
