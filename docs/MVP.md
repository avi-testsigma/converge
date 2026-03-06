# Converge: Implementation Plan

## Philosophy

**Start small. Release early. Follow the spectrum.**

The spectrum isn't just a product strategy — it's the implementation order. Each phase ships a usable product. Each validates assumptions before investing in the next surface. Every phase builds on the same `@converge/core` engine.

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6-8
CLI Skill   Convergence  Storybook   VS Code    Desktop App  Intelligence
(simplest)  Loop (CLI)   Addon       Extension  (richest)    (smartest)
```

## Core Thesis

**Dual-track generation (code + tests from the same requirement) with automated convergence produces better outcomes faster than code-only generation with manual review.**

Phase 1 proves this with zero UI. Phase 5 wraps it in a full orchestration app.

---

## Phase 1: CLI Skill + Core Engine

**Ship:** `/converge-test` skill for Claude Code
**User gets:** Generate acceptance tests from a requirement, run them, diagnose failures — all in the terminal.
**Validates:** Test generation quality, .sigma format, BT execution, diagnosis accuracy.

### What's Built

**@converge/shared**
- Core types: `AgentConfig`, `TestResult`, `DiagnosticReport`
- Event types: `ConvergenceEvent` union
- Constants

**@converge/bt-bridge**
- Wrapper around bt-runner (run as subprocess, communicate via HTTP)
- Execute `.sigma` files, return structured results
- Event stream parsing

**@converge/git**
- Create/remove worktrees
- Get diffs, changed files
- Basic merge operations

**@converge/claude-plugins (partial)**
- `/converge-test` skill definition
- `ground-agent` prompt template (explore codebase)
- `test-agent` prompt template (generate .sigma from requirement)
- `diagnose-agent` prompt template (analyze failures)
- MCP tool: `converge_run_bt_tests`

**Prompt Templates**
- Ground agent: explore codebase, produce grounding report
- Test agent: generate .sigma BT files from requirement (NOT from code)
- Diagnose agent: analyze failure, produce diagnostic report
- Few-shot .sigma examples library
- BT node catalog in LLM-friendly format

### User Flow

```
Developer in Claude Code:

> /converge-test Add a dark mode toggle to the settings page

  1. GROUND — explores codebase
     "Next.js 14, Tailwind, Zustand, existing theme store..."

  2. GENERATE TESTS — from the requirement
     Created: tests/dark-mode-toggle.sigma (6 test cases)

  3. RED CHECK — run tests against current code
     6/6 tests fail ✓ (all red — tests are valid)

  4. Developer implements the feature (manually or with Claude Code)

  5. RUN TESTS — developer triggers when ready
     4/6 pass, 2 fail

  6. DIAGNOSE — analyze failures
     "Toggle doesn't persist after page refresh — theme-store.ts
      doesn't write to localStorage"

  7. Developer fixes, re-runs → 6/6 pass ✓

  8. Tests kept as regression suite
```

### Prerequisites

1. **bt-runner as subprocess** — run existing bt-runner server locally, communicate via HTTP. No extraction needed.
2. **Claude Code CLI** — users must have it installed and authenticated.
3. **.sigma example library** — curate 10-15 example .sigma files for few-shot prompting.
4. **BT node catalog** — document available atoms in LLM-friendly format.

### Definition of Done

- [ ] Developer types `/converge-test <requirement>` in Claude Code
- [ ] Grounding agent explores their codebase and reports conventions
- [ ] Test agent generates .sigma files from the requirement
- [ ] Red check confirms generated tests fail against current code
- [ ] Tests run and produce structured pass/fail results
- [ ] Failures produce actionable diagnostic reports
- [ ] Generated .sigma files are valid and re-runnable

---

## Phase 2: Convergence Loop

**Ship:** Full automated convergence in CLI. `/converge-test` now generates code AND tests, then loops until they converge.
**User gets:** Describe a feature, watch it get built and verified automatically. Review the result.
**Validates:** Convergence algorithm, fix agents, regression safety, walkthrough generation.

### What's Built

**@converge/core (partial)**
- Convergence engine: the automated test-fix loop
- Agent manager: spawn Claude Code subprocess in worktrees
- Task decomposition: requirement → parallel code + test tasks
- Baseline + red check + regression check

**@converge/claude-plugins (extended)**
- `/converge-test` now orchestrates the full loop
- `/converge-review` skill (generate change walkthrough)
- `code-agent` prompt template
- `fix-agent` prompt template
- `walkthrough-agent` prompt template
- MCP tool: `converge_manage_worktree`
- MCP tool: `converge_diagnose_failure`

### User Flow

```
> /converge-test Add a settings page with profile, notifications, appearance tabs

  1. GROUND — explores codebase

  2. DECOMPOSE — breaks into parallel tasks
     Code: 4 tasks (layout, profile, notifications, appearance)
     Tests: 3 tasks (navigation, profile editing, dark mode toggle)

  3. BASELINE — run existing tests
     47/47 existing tests pass ✓ (recorded)

  4. GENERATE — parallel agents in worktrees
     4 code agents + 3 test agents spawned
     All code agents receive grounding report
     Test agents generate from requirement (not code)

  5. RED CHECK — generated tests fail against current code
     14/14 fail ✓ (all red)

  6. CONVERGE — automated loop
     Iteration 1: merge → regression check (47/47 ✓) → BT tests 8/14 pass
       → diagnose 6 failures → dispatch 3 fix agents
     Iteration 2: 12/14 pass → 1 fix agent
     Iteration 3: 14/14 pass ✓ CONVERGED

  7. WALKTHROUGH — narrative summary
     "Added a Settings page at /settings with three tabbed sections..."

  8. Developer reviews diff + walkthrough + test results
     Merges to branch. Tests kept as regression suite.
```

### Definition of Done

- [ ] Full convergence loop runs from a single `/converge-test` command
- [ ] Parallel code + test agents work in isolated worktrees
- [ ] Red check catches vacuous tests
- [ ] Regression check prevents breaking existing tests
- [ ] Fix agents resolve failures automatically
- [ ] Convergence terminates within 5 iterations (or reports partial progress)
- [ ] Change walkthrough accurately summarizes what was built
- [ ] One demo of convergence catching a real bug that code-only would miss

---

## Phase 3: Vision + Storybook Addon

**Ship:** Visual prototyping skill + Storybook TDD panel (npm package).
**User gets:** Generate mockups before coding. Component-level TDD in Storybook.
**Validates:** Visual prototypes as contracts, component-level convergence, Storybook integration.

### What's Built

**@converge/vision**
- Gemini Nano Banana Pro integration
- Mockup generation (text → 2-4 variations)
- Mockup iteration (feedback → refined mockup)
- Visual comparison (screenshot vs mockup → similarity score + discrepancies)

**@converge/storybook-addon**
- TDD panel: red/green status per story
- play() → .sigma bridge (promote component tests to BT tests)
- .sigma → play() bridge (demote acceptance tests to component tests)
- Toolbar buttons: "Run Converge", "Generate Tests"
- `npm install @converge/storybook-addon` — zero config

**@converge/claude-plugins (extended)**
- `/converge-vision` skill
- `/converge-story` skill
- MCP tools: `converge_generate_mockup`, `converge_visual_compare`, `converge_story_to_sigma`

### Definition of Done

- [ ] `/converge-vision` generates mockup variations from a description
- [ ] User iterates and approves a mockup
- [ ] Visual comparison scores implementation against mockup
- [ ] Storybook addon installs with `npm install @converge/storybook-addon`
- [ ] TDD panel shows test status per story
- [ ] play() functions convert to .sigma files (and back)
- [ ] Component-level red/green cycle works in Storybook

---

## Phase 4: VS Code Extension

**Ship:** VS Code extension that surfaces convergence data inline.
**User gets:** Risk indicators, test status, diagnostics — without leaving their editor.
**Validates:** IDE integration, developer workflow, passive intelligence surfaces.

### What's Built

**@converge/vscode-extension**
- Status bar: convergence status, test pass rate
- Sidebar panel: session tree, agent status, test results
- Inline diagnostics: BT failure locations mapped to source code
- CodeLens: "3 BT tests | 1 failing" above test-linked components
- Commands: run tests, show status, open diagnostics

### Connection Model

The VS Code extension is lightweight — it doesn't run the convergence engine itself. Two modes:

1. **Standalone mode** — runs `/converge-test` via Claude Code subprocess, displays results
2. **Connected mode** — connects to desktop app via WebSocket for richer data (when Phase 5 ships)

### Definition of Done

- [ ] Extension installs from VS Code marketplace
- [ ] Status bar shows convergence status
- [ ] Inline diagnostics show BT failure locations in source
- [ ] CodeLens shows test count per component
- [ ] Sidebar shows test results tree
- [ ] Can trigger `/converge-test` from VS Code command palette

---

## Phase 5: Desktop App

**Ship:** Full Electron orchestration UI.
**User gets:** Vision studio, agent monitor, convergence dashboard, review & merge — the premium experience.
**Validates:** Full orchestration UX, sigma-authoring integration, visual review workflow.

### What's Built

**@converge/desktop**
- Electron shell + React renderer (Vite)
- Project setup view (open repo, configure API keys)
- Vision studio (mockup generation, iteration, approval)
- Agent monitor (dashboard of active agents, live output, worktree diffs)
- Convergence dashboard (timeline, pass rate, visual comparison per iteration)
- Review & merge view (walkthrough, side-by-side comparison, git diff, approve/reject)
- Sigma authoring (embedded) — visual test editor for reviewing/editing .sigma files
- Local WebSocket server (VS Code extension connects here in connected mode)

### Prerequisites (deferred to here)

1. **sigma-authoring extraction** — extract from drifter-electron into standalone package, or copy and adapt
2. **bt-runner as embedded library** — for Phase 1-4 it runs as subprocess; for desktop, embed for speed + event streaming

### Definition of Done

- [ ] Open a project, configure keys, see project structure
- [ ] Generate mockups, iterate, approve
- [ ] Watch parallel agents work with live output
- [ ] See convergence loop with timeline visualization
- [ ] Visual comparison: mockup vs implementation side-by-side
- [ ] Read change walkthrough
- [ ] Review tests in sigma authoring, edit, re-converge
- [ ] One-click merge with worktree cleanup
- [ ] End-to-end: requirement → visual prototype → code + tests → convergence → review → merge

---

## Phase 6-8: Quality Intelligence

See [INTELLIGENT_QA.md](INTELLIGENT_QA.md) for the full vision. These phases layer intelligence onto every surface shipped in Phases 1-5.

### Phase 6: Intelligence Foundation

- `risk-agent` computes risk scores (code complexity + git history + defect patterns)
- Coverage heat maps — untested paths flagged before generation
- Risk-informed test generation — focus effort on high-risk areas
- `--budget N` flag for CLI skill
- Risk gutter icons in VS Code extension

### Phase 7: Continuous Guard

- Release gating with composite confidence scores
- Production monitoring via APM webhooks (Datadog, New Relic)
- Incident-to-test pipeline — production incidents become regression tests
- CI/CD integration (GitHub Actions, GitLab CI)
- Issue tracking integration (Jira, Linear, GitHub Issues)

### Phase 8: Learning Engine

- Pattern learning — which tests catch real bugs vs noise
- Risk model recalibration after each release
- Test generation template evolution
- Developer feedback loop — false positive reduction, coverage gap analysis

---

## What's OUT (All Phases)

| Feature | Why Deferred | Earliest Phase |
|---------|-------------|---------------|
| Codex agent support | Start with Claude Code only | Phase 2+ |
| Competitive agents | Complex; proves value with single impl first | Phase 6+ |
| Spec recording (browser → BT) | Requires recorder extension integration | Phase 5+ |
| Team collaboration | All phases are single-user first | Phase 7+ |
| Mobile testing | Web-only, bt-mobile exists for later | Phase 5+ |

---

## Key Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Test generation quality** | Convergence passes but feature is wrong | Few-shot prompting with curated examples; red check catches vacuous tests; Phase 1 validates this before building UI |
| **Convergence doesn't converge** | Infinite loop, user frustration | Max iteration limit (5); human can intervene; "stop and review what we have" |
| **Prompt engineering iteration** | Takes many cycles to get good generation | Phase 1 is the cheapest place to iterate — no UI to maintain while tuning prompts |
| **bt-runner subprocess overhead** | Slower than embedded | Acceptable for Phase 1-4; embed in Phase 5 for speed |
| **sigma-authoring extraction** | Complex extraction from drifter-electron | Deferred to Phase 5; CLI and Storybook don't need it |
| **.sigma format adoption** | Developers unfamiliar with format | Storybook bridge (Phase 3) shows .sigma as play() functions; sigma authoring (Phase 5) provides visual editor |

---

## Technical Prerequisites Per Phase

| Prerequisite | Phase Needed | Status |
|-------------|-------------|--------|
| bt-runner subprocess mode | Phase 1 | Existing bt-runner server works |
| Claude Code CLI | Phase 1 | Users install independently |
| .sigma example library (10-15 files) | Phase 1 | Needs curation |
| BT node catalog (LLM format) | Phase 1 | Needs authoring |
| Gemini API access | Phase 3 | Users provide API key |
| Storybook 8 peer dep | Phase 3 | Standard |
| VS Code extension API | Phase 4 | Standard |
| sigma-authoring extraction | Phase 5 | Complex — drifter-electron dependency |
| bt-runner embedded library | Phase 5 | Extract from Fastify server |

---

## Why This Order

1. **Phase 1 (CLI Skill)** is the fastest to ship. No UI framework decisions, no Electron packaging, no component extraction. Just prompt templates, a skill definition, and bt-bridge. Ships in the environment developers already use (Claude Code). **Validates the hardest part first: can AI generate useful .sigma tests from a requirement?**

2. **Phase 2 (Convergence Loop)** adds the automated loop. Still CLI. If convergence doesn't work well, we learn this before investing in a desktop UI. **Validates the second hardest part: can fix agents close the gap automatically?**

3. **Phase 3 (Storybook Addon)** is the first visual surface but it's lightweight (React panel inside Storybook, not a standalone app). Ships as an npm package. Adds visual prototyping. **Reaches component-level developers who may never use the desktop app.**

4. **Phase 4 (VS Code Extension)** is passive — it surfaces data, doesn't orchestrate. Lightweight to build. **Reaches developers who want convergence feedback in their editor.**

5. **Phase 5 (Desktop App)** is the premium experience. By this point, the core engine is battle-tested across 4 prior phases. sigma-authoring extraction is deferred to here because no earlier phase needs it. **The expensive investment comes after validation.**

6. **Phase 6-8 (Intelligence)** layers onto every surface. Risk scores appear in CLI output, VS Code gutters, Storybook panels, and the desktop dashboard. **Intelligence compounds across the spectrum.**
