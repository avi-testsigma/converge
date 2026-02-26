# CLAUDE.md - Converge

## Project Overview

Converge is an AI development orchestrator that pairs vibe coding with vibe testing. It generates code and executable acceptance tests in parallel, then converges them in an automated loop until the product matches expectations.

## Architecture

- **Electron app** with React renderer (Vite + TypeScript)
- **Monorepo** with packages: main, renderer, shared, sigma-authoring
- **Agent orchestration**: spawns Claude Code CLI processes in git worktrees
- **Test execution**: embeds behaviour-tree-ecosystem's bt-runner
- **Vision**: Gemini Nano Banana Pro for mockup generation and visual comparison

See `docs/ARCHITECTURE.md` for full system design.

## Key Directories

```
packages/main/           # Electron main process (orchestrator, agents, git, BT runner)
packages/renderer/       # React UI (views, components, stores)
packages/shared/         # Shared types and events
packages/sigma-authoring/ # Embedded test editor (from drifter-electron)
prompt-templates/        # Agent prompt engineering
docs/                    # Vision, architecture, MVP docs
```

## Dependencies (External)

- **behaviour-tree-ecosystem**: BT runtime, XML parser, Playwright atoms — lives at `../behaviour-tree-ecosystem`
- **sigma-authoring**: Visual test editor — extracted from `../drifter-electron/packages/renderer/sigma-authoring`

## Development Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start Electron in dev mode
pnpm build                # Production build
pnpm lint                 # Biome lint
pnpm test                 # Run tests
```

## Conventions

- TypeScript strict mode
- Biome for linting and formatting
- Zustand for state management
- tRPC for typed IPC between main/renderer
- All agent communication via Claude Code CLI subprocess
- `.sigma` files for behavior tree tests (XML format)
- `.converge/` directory in user projects for worktrees and artifacts
