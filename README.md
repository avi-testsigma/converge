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

3. **Dual-Track Generate** — Code agents and test agents work simultaneously in isolated git worktrees. Code agents implement features. Test agents generate `.sigma` behavior tree files encoding acceptance criteria from the requirement (not from the code).

4. **Converge** — Code is merged into an integration branch. The behavior tree test suite runs against it. Failures produce structured diagnostics — which step failed, screenshots, DOM state. Fix agents are dispatched. Loop until all tests pass and the visual matches the mockup.

5. **Review** — See test pass rate, visual similarity score, convergence timeline, and full diff. Review generated tests in the visual editor. Approve and merge.

## Key Concepts

**Test-First Orchestration** — Tests are generated from the requirement, not from the code. Code agents are scored by how many tests they pass. This is TDD at the orchestration level.

**Cascading Confidence** — Multiple verification layers filter issues before human review:
- Lint + typecheck (syntax)
- Unit tests (logic)
- Behavior tree tests (functional)
- Visual verification against mockup (design)
- Human review (intent)

**Living Documentation** — `.sigma` behavior tree files serve as executable tests, readable step-by-step workflows, and precise acceptance criteria. One artifact, three audiences.

## Architecture

```
┌──────────────────────────────────────────┐
│            Converge (Electron)            │
│                                          │
│  Renderer (React)                        │
│  ┌──────────┬──────────┬──────────────┐  │
│  │ Vision   │ Agent    │ Review &     │  │
│  │ Studio   │ Monitor  │ Merge        │  │
│  └──────────┴──────────┴──────────────┘  │
│  ┌────────────────────────────────────┐  │
│  │      sigma-authoring (embedded)    │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Main Process                            │
│  ┌────────────┬───────────┬───────────┐  │
│  │Orchestrator│ Agent     │Convergence│  │
│  │Engine      │ Manager   │Engine     │  │
│  ├────────────┼───────────┼───────────┤  │
│  │Vision      │ Git       │ BT Runner │  │
│  │Service     │ Worktrees │ (embedded)│  │
│  └────────────┴───────────┴───────────┘  │
└──────────┬──────────┬──────────┬─────────┘
           │          │          │
      Claude Code  Gemini API  Claude Code
      (agents)     (mockups)   (agents)
```

- **Electron** — Local-first. Your repos, your API keys, your machine.
- **Claude Code CLI** — Agents run as subprocesses in isolated git worktrees.
- **Gemini Nano Banana Pro** — Mockup generation and visual comparison.
- **behaviour-tree-ecosystem** — Test execution runtime with 60+ Playwright atoms.
- **sigma-authoring** — Visual editor for reviewing and editing generated tests.

## Prerequisites

- Node.js 22+
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated
- Gemini API key with Nano Banana Pro access
- Git

## Project Structure

```
packages/
  main/                 Electron main process
  renderer/             React UI
  shared/               Shared types
  sigma-authoring/      Embedded test editor
prompt-templates/       Agent prompt engineering
docs/
  VISION.md             Product vision and principles
  ARCHITECTURE.md       System design and component specs
  MVP.md                Phased MVP scope
```

## Documentation

- [Vision](docs/VISION.md) — Why Converge exists, core principles, positioning
- [Architecture](docs/ARCHITECTURE.md) — System design, interfaces, data flows
- [MVP Scope](docs/MVP.md) — Phased build plan with what's in and out

## Status

Early development. See [MVP.md](docs/MVP.md) for current scope and phasing.

## License

Proprietary.
