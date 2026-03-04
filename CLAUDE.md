# CLAUDE.md - Converge

## Project Overview

Converge is an AI development orchestrator that pairs vibe coding with vibe testing. It generates code and executable acceptance tests in parallel, then converges them in an automated loop until the product matches expectations.

## Architecture

pnpm + Turbo monorepo with shared core logic consumed by multiple surfaces:

- **apps/desktop/** — Electron app (primary orchestration UI)
- **packages/core/** — Orchestration engine, convergence loop, agent management
- **packages/shared/** — Types, events, constants shared across all packages
- **packages/git/** — Git worktree management
- **packages/vision/** — Gemini Nano Banana Pro (mockups + visual comparison)
- **packages/bt-bridge/** — Bridge to behaviour-tree-ecosystem (test execution)
- **packages/storybook-addon/** — Storybook panel addon (TDD panel, story↔BT bridge)
- **packages/vscode-extension/** — VS Code extension (status, diagnostics, CodeLens)
- **packages/claude-plugins/** — Claude Code skills, sub-agents, MCP tools

See `docs/ARCHITECTURE.md` for full system design and dependency graph.

## Key Documentation

- `docs/VISION.md` — Product vision, principles, positioning
- `docs/ARCHITECTURE.md` — System design, interfaces, monorepo structure
- `docs/MVP.md` — Phased MVP scope
- `docs/AGENTIC_PATTERNS.md` — Simon Willison pattern analysis
- `docs/STORYBOOK_INTEGRATION.md` — Storybook addon design
- `docs/VSCODE_EXTENSION.md` — VS Code extension design
- `docs/CLAUDE_PLUGINS.md` — Skills, sub-agents, MCP tools
- `docs/INTELLIGENT_QA.md` — Quality intelligence layer (risk, monitoring, learning)

## Dependencies (External)

- **behaviour-tree-ecosystem**: BT runtime, XML parser, Playwright atoms — lives at `../behaviour-tree-ecosystem`
- **sigma-authoring**: Visual test editor — extracted from `../drifter-electron/packages/renderer/sigma-authoring`

## Development Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start all in dev mode
pnpm build                # Build all packages
pnpm lint                 # Biome lint
pnpm test                 # Run all tests
pnpm typecheck            # TypeScript checking
```

## Conventions

- TypeScript strict mode
- Biome for linting and formatting
- pnpm workspaces + Turbo for monorepo orchestration
- `@converge/` package namespace
- Zustand for state management (renderer)
- tRPC for typed IPC between Electron main/renderer
- All agent communication via Claude Code CLI subprocess
- `.sigma` files for behavior tree tests (XML format)
- `.converge/` directory in user projects for worktrees and artifacts
