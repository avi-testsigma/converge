# Converge

An AI quality intelligence platform that generates code and tests in parallel — from the same requirement — then converges them automatically until everything works. Keeps getting smarter with every build.

## How It Works

```
Requirement → Ground Codebase → Generate Tests + Code (parallel) →
  Red Check → Converge (test-fix loop) → Review → Merge →
  Guard (monitor) → Learn (improve) → repeat
```

1. **Ground** — A grounding agent explores your codebase — framework, conventions, relevant files, existing tests — and passes context to all agents.

2. **Generate** — Code agents and test agents work simultaneously in isolated git worktrees. Tests come from the requirement, not the code. This is TDD at the orchestration level.

3. **Red Check** — Generated tests run against the current code to verify they fail. If a test passes without new code, it's vacuous and gets flagged.

4. **Converge** — Code is merged. Existing tests run first (regression check). Then BT tests run. Failures produce structured diagnostics. Fix agents are dispatched. Loop until all tests pass.

5. **Review** — Read the change walkthrough. See test results, regression status, full diff. Approve and merge.

6. **Guard** — After merge, continuous monitoring watches for production anomalies. Incidents automatically become regression tests.

7. **Learn** — Every outcome refines risk models, test generation, and prioritization. The system compounds.

## Key Concepts

**Test-First Orchestration** — Tests are generated from the requirement, not from the code. Code agents are scored by how many tests they pass.

**Cascading Confidence** — Eight verification layers filter issues before human review: baseline → red check → lint → unit tests → BT tests → visual verification → walkthrough → human review.

**Living Documentation** — `.sigma` behavior tree files serve as executable tests, readable workflows, and precise acceptance criteria. One artifact, three audiences.

**Three Acts of Quality** — Build (development time convergence) → Guard (post-merge monitoring) → Learn (continuous improvement). The system gets smarter every cycle.

## The Spectrum

One engine, every zoom level. Pick your entry point:

| Surface | What It Does | Ships As |
|---------|-------------|----------|
| **Claude Code Plugins** | `/converge-test` skill + MCP tools — generate and run tests from the terminal | Phase 1 |
| **Storybook Addon** | TDD panel per story, play() ↔ .sigma bridge, red/green status | Phase 3 |
| **VS Code Extension** | Inline diagnostics, CodeLens, status bar, risk indicators | Phase 4 |
| **Desktop App** | Full orchestration UI — vision studio, agent monitor, convergence dashboard, review & merge | Phase 5 |

All surfaces share `@converge/core` — same engine, different depth.

## Monorepo Structure

```
converge/
├── apps/
│   └── desktop/                 Electron app (Phase 5)
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
- [Implementation Plan](docs/MVP.md) — Phased build plan following the spectrum
- [Intelligent QA](docs/INTELLIGENT_QA.md) — Quality intelligence layer, continuous quality, learning
- [Agentic Patterns](docs/AGENTIC_PATTERNS.md) — Analysis of Simon Willison's patterns
- [Storybook Integration](docs/STORYBOOK_INTEGRATION.md) — Addon design, story ↔ BT bridge
- [VS Code Extension](docs/VSCODE_EXTENSION.md) — Extension surfaces, desktop app connection
- [Claude Plugins](docs/CLAUDE_PLUGINS.md) — Skills, sub-agents, MCP tools

## Quick Start (Phase 1 — CLI Skill)

### 1. Install sigmascript

Add `.npmrc` to your project (or `~/.npmrc`):
```ini
@testsigmainc:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT
```

Then install:
```bash
npm install --save-dev @testsigmainc/sigmascript
```

### 2. Add the skill to Claude Code

```bash
mkdir -p .claude/skills
cp -r /path/to/testsigma-converge/packages/claude-plugins/skills/converge-test .claude/skills/converge-test
```

Claude Code auto-discovers skills from `.claude/skills/` — no configuration needed.

### 3. Use it

```
/converge-test Add a login page with email/password authentication
```

Claude will ground your codebase, generate `.sigma` test files from the requirement, run a red check to verify the tests fail, and report what to implement next.

After implementing the feature:
```
/converge-test run
```

See [INSTALL.md](packages/claude-plugins/skills/converge-test/INSTALL.md) for detailed setup.

## Status

Phase 1 (CLI Skill) in development. See [Implementation Plan](docs/MVP.md) for phasing.

## License

Proprietary.
