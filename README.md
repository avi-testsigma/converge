# Converge

An AI development orchestrator that pairs vibe coding with vibe testing. Describe what you want, approve a visual prototype, and watch parallel agents generate code and tests — then automatically converge them until everything works.

## How It Works

```
Requirement → Visual Mockup → Approve →
  Code Agents (parallel) ──┐
  Test Agents (parallel) ──┘→ Convergence Loop → Review → Merge
```

1. **Envision** — Describe a feature. Converge generates visual mockups (Gemini Nano Banana Pro). Pick one or iterate until it looks right.

2. **Decompose** — The approved vision is broken into parallel work units: components, APIs, pages — each with corresponding acceptance tests.

3. **Ground** — A grounding agent explores your codebase — framework, conventions, relevant files, existing tests — and passes context to all code agents.

4. **Dual-Track Generate** — Code agents and test agents work simultaneously in isolated git worktrees. Code agents implement features. Test agents generate `.sigma` behavior tree files encoding acceptance criteria from the requirement (not from the code).

5. **Red Check** — Generated tests are run against the current code to verify they fail. If a test passes without new code, it's vacuous and gets flagged.

6. **Converge** — Code is merged. Existing tests run first (regression check). Then BT tests run. Failures produce structured diagnostics. Fix agents are dispatched. Loop until all tests pass and the visual matches the mockup.

7. **Review** — Read the change walkthrough (narrative summary of what was built). See test pass rate, visual similarity, regression status, and full diff. Review generated tests in the visual editor. Approve and merge.

## Key Concepts

**Test-First Orchestration** — Tests are generated from the requirement, not from the code. Code agents are scored by how many tests they pass. This is TDD at the orchestration level.

**Cascading Confidence** — Multiple verification layers filter issues before human review:
- Existing test baseline (regression safety)
- Red-phase check (test validity)
- Lint + typecheck (syntax)
- Unit tests (logic)
- Behavior tree tests (functional)
- Visual verification against mockup (design)
- Change walkthrough (comprehension)
- Human review (intent)

**Living Documentation** — `.sigma` behavior tree files serve as executable tests, readable step-by-step workflows, and precise acceptance criteria. One artifact, three audiences.

## Surfaces

Converge meets developers where they work:

| Surface | What It Does |
|---------|-------------|
| **Desktop App** | Full orchestration UI — vision studio, agent monitor, convergence dashboard, review & merge |
| **Storybook Addon** | TDD panel, red/green status per story, play() ↔ .sigma bridge, cross-browser promotion |
| **VS Code Extension** | Status bar, sidebar panel, inline diagnostics from BT failures, CodeLens, change walkthrough |
| **Claude Code Plugins** | `/converge-test`, `/converge-vision`, `/converge-review` skills + MCP tools for BT execution, visual compare, diagnostics |

## Monorepo Structure

```
converge/
├── apps/
│   └── desktop/                 Electron app (primary UI)
├── packages/
│   ├── core/                    Orchestration engine, convergence loop
│   ├── shared/                  Types, events, constants
│   ├── git/                     Git worktree management
│   ├── vision/                  Gemini mockup generation + visual comparison
│   ├── bt-bridge/               Behavior tree runner bridge
│   ├── storybook-addon/         Storybook TDD panel
│   ├── vscode-extension/        VS Code integration
│   └── claude-plugins/          Skills, sub-agents, MCP tools
├── prompt-templates/            Agent prompt engineering
└── docs/                        Vision, architecture, specs
```

## Prerequisites

- Node.js 22+, pnpm 9+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- Gemini API key with Nano Banana Pro access
- Git

## Development

```bash
pnpm install              # Install dependencies
pnpm dev                  # Start all in dev mode
pnpm build                # Build all packages
pnpm lint                 # Biome lint
pnpm test                 # Run all tests
```

## Documentation

- [Vision](docs/VISION.md) — Why Converge exists, core principles, positioning
- [Architecture](docs/ARCHITECTURE.md) — System design, monorepo structure, interfaces
- [MVP Scope](docs/MVP.md) — Phased build plan with what's in and out
- [Agentic Patterns](docs/AGENTIC_PATTERNS.md) — Analysis of Simon Willison's patterns
- [Storybook Integration](docs/STORYBOOK_INTEGRATION.md) — Addon design, story ↔ BT bridge
- [VS Code Extension](docs/VSCODE_EXTENSION.md) — Extension surfaces, desktop app connection
- [Claude Plugins](docs/CLAUDE_PLUGINS.md) — Skills, sub-agents, MCP tools

## Status

Early development. See [MVP.md](docs/MVP.md) for current scope and phasing.

## License

Proprietary.
