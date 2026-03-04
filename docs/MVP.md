# Converge: MVP Scope

## MVP Goal

A working local Electron app where a user can:
1. Describe a feature in natural language
2. See and approve visual mockups of the feature
3. Watch parallel code + test agents work on it
4. See the convergence loop run (tests validate code, failures trigger fixes)
5. Review the final result and merge

The MVP proves the core thesis: **dual-track generation (code + tests) with automated convergence produces better outcomes faster than code-only generation with manual review.**

---

## What's IN the MVP

### Phase 1: Foundation (Weeks 1-3)

**Electron Shell + Project Setup**
- Electron app with React renderer (Vite build)
- Open/clone a git repository
- Configure API keys (Claude API key for Claude Code, Gemini API key)
- Basic navigation between views
- `.converge/` directory structure creation

**Git Worktree Manager**
- Create/list/remove worktrees in `.converge/worktrees/`
- Create integration branch from multiple worktrees
- Get diff for a worktree
- Clean up worktrees on session end

**Agent Manager (Claude Code only)**
- Spawn Claude Code CLI as subprocess in a worktree
- Pass task prompt via `--print` or stdin
- Stream stdout for live output display
- Track agent status (running, completed, failed)
- Terminate agents
- Support 1-5 concurrent agents

### Phase 2: Vision Studio (Weeks 3-5)

**Mockup Generation**
- Text input for feature description
- Option to include existing app screenshots as context
- Call Gemini Nano Banana Pro to generate 2-4 mockup variations
- Display mockups in a gallery view
- Iterate: user provides text feedback, regenerate specific mockup
- Approve a mockup → stored in `.converge/artifacts/mockups/`

**Visual Comparison**
- Take screenshot of running app (via Playwright browser launch)
- Send mockup + screenshot to Gemini vision model
- Return similarity score (0-100) and list of discrepancies
- Display side-by-side comparison in UI

### Phase 3: Dual-Track Generation (Weeks 5-8)

**Task Decomposition**
- Send approved mockup + requirement to Claude (via API or Claude Code)
- Output: structured TaskPlan with code tasks and test tasks
- User can review/edit the plan before execution
- Each task becomes an agent assignment

**Codebase Grounding (before agents start)**
- Spawn a grounding agent that explores the project codebase
- Agent reads project structure, existing tests, conventions, CLAUDE.md
- Produces a grounding report: framework, styling, state management, relevant files, test patterns
- This report is included as context for all code agents
- Follows Willison's "First Run the Tests" pattern — agents that understand the project first produce better code

**Code Agent Prompts**
- Template-based prompts that include:
  - The specific task description
  - The grounding report (codebase conventions, relevant files)
  - Reference to approved mockup (description, not image — Claude Code is CLI)
  - Project context (framework, conventions from CLAUDE.md)
  - Constraint: only modify files relevant to the task
- Agent works in its own worktree, commits when done

**Test Agent Prompts**
- Template that includes:
  - The original requirement
  - The acceptance criteria derived from decomposition
  - Reference `.sigma` examples (few-shot prompting)
  - The behavior tree node catalog (available atoms)
  - Constraint: generate `.sigma` XML files only
- Agent generates behavior tree test files
- Tests are authored FROM the requirement, NOT from the code

**Agent Monitor Dashboard**
- Card per agent showing: task, status, elapsed time
- Live output streaming (collapsible log)
- Worktree diff preview (files changed)
- Terminate button per agent

### Phase 4: Convergence Engine (Weeks 8-11)

**Baseline + Red Check**
- Run existing project test suite before agents start → record baseline
- After test agents complete, run generated `.sigma` tests against CURRENT code (pre-changes)
- Verify all generated tests FAIL (red phase) — if any pass, they're vacuous and get flagged
- This enforces Willison's red/green TDD: "confirm tests fail before implementing"

**Integration Merge**
- Merge all code agent worktrees into integration branch
- Detect and report merge conflicts
- If conflicts: spawn a fix agent to resolve, or flag for human

**Regression Check**
- Run existing project tests against integration branch
- Compare results to baseline — any new failures are regressions
- Regressions get their own fix agents before proceeding to BT tests
- This ensures agents don't break existing functionality

**BT Test Execution**
- Embed `bt-runner` (from behaviour-tree-ecosystem)
- Execute `.sigma` test files against the integration branch
- Collect per-test results: pass/fail, event log, screenshots
- Stream results to the UI in real-time

**Failure Diagnosis**
- For each failed test:
  - Extract the failing node, its expected vs actual behavior
  - Include screenshot at failure point
  - Include preceding successful steps for context
- Send diagnostic context to Claude (API call) for analysis
- Claude returns: likely cause, suggested fix, target file

**Fix Loop**
- For each diagnosed failure:
  - Spawn a targeted fix agent in the code worktree
  - Fix agent gets: diagnostic report, specific file to modify, test that should pass
- After all fix agents complete, re-run convergence
- Track iteration count and test pass rate over time
- Stop after max iterations (default 5) or full convergence

**Change Walkthrough Generation**
- After convergence (all tests pass), spawn a walkthrough agent
- Agent reads all diffs, test results, and original requirement
- Produces a narrative summary: what was built, why, how it connects
- This is the first thing the human reads in the review step
- Follows Willison's "Linear Walkthroughs" pattern

**Convergence Dashboard**
- Timeline showing pass rate per iteration
- Per-test status breakdown (including red-check and regression results)
- Visual comparison score per iteration
- Current iteration indicator
- Manual "stop" and "add instruction" controls

### Phase 5: Review & Merge (Weeks 11-13)

**Review Package**
- **Change walkthrough** (narrative summary — read first)
- Side-by-side: approved mockup vs implementation screenshot
- Visual similarity score
- Test results summary (X/Y new tests passing + Y/Y existing tests passing)
- Full git diff (all changes across all agent worktrees)
- Convergence history (how many iterations, what was fixed, regressions caught)

**Sigma Authoring Integration**
- Embed sigma-authoring component for test review
- User can open any generated `.sigma` file
- Run tests manually with live screencast
- Edit tests if acceptance criteria need adjustment
- Modified tests trigger a new convergence iteration

**Merge Flow**
- "Approve & Merge" button
- Squash-merges integration branch into user's target branch
- Clean up all worktrees and artifacts
- Option to keep generated `.sigma` tests as regression suite

---

## What's OUT of MVP

| Feature | Why Deferred |
|---------|-------------|
| Codex agent support | Start with Claude Code only, add Codex later |
| Competitive agents (multiple impls) | Complexity; proves value with single implementation first |
| Spec recording (browser → BT) | Requires recorder extension integration |
| Team collaboration | MVP is single-user |
| CI/CD integration | MVP is local-only |
| Cloud execution | Local-first per decision |
| Mobile testing | Web-only for MVP, bt-mobile exists for later |
| Self-improving tests | Manual test editing via sigma-authoring covers this |
| Custom agent model selection | Default to Claude Code's model |
| Project templates / presets | Users configure manually for MVP |

---

## Technical Prerequisites

**Must exist before MVP development:**

1. **bt-runner as embeddable package**
   - Currently `bt-runner` is a Fastify server. Need to extract the execution logic into a library that can be called programmatically from the Electron main process.
   - Alternative: run bt-runner as a local subprocess and communicate via HTTP/WebSocket (simpler for MVP).

2. **sigma-authoring as extractable component**
   - Currently embedded in drifter-electron. Need to either:
     - (a) Extract into a standalone package that Converge can depend on
     - (b) Copy the component and adapt (faster for MVP, debt for later)
   - The IPC layer (window.sigmaFilesApi) needs adaptation for Converge's file system.

3. **Claude Code CLI availability**
   - Users must have Claude Code installed and authenticated
   - Converge detects this on first run and guides setup if missing

4. **Gemini API access**
   - Users need a Gemini API key with Nano Banana Pro access
   - Converge stores this in local config

5. **Prompt engineering for test generation**
   - The test agent prompt is critical to MVP quality
   - Need a library of example `.sigma` files for few-shot prompting
   - Need the BT node catalog in a format the LLM can reference
   - This is iterative work that happens alongside development

---

## MVP User Flow (Walkthrough)

```
1. LAUNCH
   User opens Converge, sees project setup
   Opens their React project: ~/code/my-saas-app
   Enters Claude API key, Gemini API key
   Converge creates .converge/ directory

2. ENVISION
   User types: "Add a settings page accessible from the nav bar.
   Should have sections for: Profile (name, email, avatar upload),
   Notifications (email toggle, push toggle), and Appearance (dark mode toggle).
   Use existing design system."

   Converge generates 3 mockup variations via Nano Banana
   User picks #2, says "make the dark mode toggle a switch not a checkbox"
   Regenerated mockup approved ✓

3. PLAN
   Converge shows decomposed task plan:
   ┌─ Code Tasks ─────────────────────────────────────┐
   │ 1. Settings page layout with tab navigation       │
   │ 2. Profile section component with avatar upload    │
   │ 3. Notifications section with toggle switches      │
   │ 4. Appearance section with dark mode switch        │
   │ 5. Settings API route (GET/PUT /api/settings)      │
   │ 6. Nav bar link to settings page                   │
   └───────────────────────────────────────────────────┘
   ┌─ Test Tasks ─────────────────────────────────────┐
   │ 1. Settings page navigation and layout tests      │
   │ 2. Profile editing acceptance tests                │
   │ 3. Notification preferences acceptance tests       │
   │ 4. Dark mode toggle acceptance tests               │
   └───────────────────────────────────────────────────┘

   User reviews, approves. (Can edit tasks if needed.)

4. GROUND + GENERATE
   Baseline: 47/47 existing project tests pass ✓ (recorded)
   Grounding agent explores codebase → reports: Next.js 14, Tailwind, Zustand, etc.

   Agent monitor shows 10 agents spinning up (6 code + 4 test)
   All code agents receive the grounding report as context
   Each agent card shows live output
   Agents complete over 2-8 minutes

   Red check: all 14 generated tests fail against current code ✓ (all red)
   Dashboard: "All agents complete. Tests verified. Starting convergence."

5. CONVERGE
   Iteration 1:
     Regression check: 47/47 existing tests still pass ✓
     BT tests: 8/14 pass, visual score 72%
     Failures: nav link missing, dark mode doesn't persist, avatar upload 404
     3 fix agents dispatched

   Iteration 2:
     Regression check: 47/47 still pass ✓
     BT tests: 12/14 pass, visual score 88%
     Failures: notification toggles don't save state
     1 fix agent dispatched

   Iteration 3:
     Regression check: 47/47 still pass ✓
     BT tests: 14/14 pass, visual score 93%
     CONVERGED ✓

   Walkthrough agent generates summary:
   "Added a Settings page at /settings with three tabbed sections..."

6. REVIEW
   User reads the change walkthrough first — understands what was built in 30 seconds.

   Then sees:
   - Mockup vs screenshot side-by-side (93% match)
   - 14/14 new tests passing
   - 47/47 existing tests passing (no regressions)
   - 18 files changed, +580 -12 lines
   - 3 convergence iterations

   User opens test files in sigma-authoring
   Runs "Dark mode toggle" test manually, watches screencast
   Looks correct. Adds one edge case test: "Toggle dark mode, refresh, verify persisted"

   Convergence re-runs with new test: passes ✓

   User clicks "Approve & Merge"
   Changes merged to feature/settings-page branch
   .sigma test files kept in tests/ directory
   Worktrees cleaned up
```

---

## Key Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Test generation quality** — AI generates tests that don't actually test the right things | Convergence passes but feature is wrong | Few-shot prompting with curated examples; human reviews tests in sigma-authoring before merge; visual verification as second check |
| **Convergence doesn't converge** — fix agents introduce new failures | Infinite loop, user frustration | Max iteration limit (5); clear status communication; human can intervene at any point; "stop and review what we have" option |
| **Merge conflicts between agents** — parallel code agents modify same files | Integration branch fails to build | Task decomposition should minimize overlap; conflict resolution agent; human fallback |
| **Claude Code subprocess management** — processes hang, crash, or consume excessive resources | Bad UX, resource exhaustion | Timeout per agent (10 min default); resource monitoring; graceful termination; worktree cleanup on crash |
| **Prompt engineering iteration** — takes many cycles to get good test/code generation | Slow MVP progress | Start with a narrow scope (React web apps only); build prompt library incrementally; use real user projects for testing |
| **sigma-authoring extraction** — extracting from drifter-electron is complex | Delays Phase 5 | For MVP, run bt-runner as subprocess and build a simpler test results viewer; full sigma-authoring integration in v1.1 |

---

## Definition of Done (MVP)

The MVP is complete when a user can:

- [ ] Open a React/Next.js project in Converge
- [ ] Describe a feature and get visual mockups
- [ ] Approve a mockup and see a task plan
- [ ] See agents grounded in their codebase before coding starts
- [ ] Watch parallel code and test agents execute
- [ ] See red-phase verification (generated tests fail before code changes)
- [ ] See the convergence loop run automatically (with regression checks)
- [ ] Read a narrative walkthrough explaining what was built
- [ ] View test results, visual comparison, and code diff
- [ ] Edit generated tests and trigger re-convergence
- [ ] Merge approved changes to their branch
- [ ] Keep generated tests as regression suite

---

## Post-MVP Phases (Quality Intelligence)

See [INTELLIGENT_QA.md](INTELLIGENT_QA.md) for the full quality intelligence vision.

### Phase 6: Intelligence Foundation

**Risk Scoring & Coverage**
- `risk-agent` computes risk scores from code complexity, git history, defect patterns
- Coverage heat map — identify untested paths before generating tests
- Risk-informed test generation — focus effort on high-risk areas
- `--budget N` flag for CLI skill — run the N most valuable tests
- Risk gutter icons in VS Code extension

**Self-Healing Tests**
- `heal-agent` classifies test failures as "app bug" vs "test infrastructure"
- Smart locator fallback (multi-attribute matching)
- Adaptive waits (learn typical load times per action)
- Semantic re-derivation — .sigma intent trees enable re-planning steps when flows change

### Phase 7: Continuous Guard

**Release Gating**
- Composite confidence score (not binary pass/fail) with reasoning
- Configurable risk thresholds per module (`.converge/risk-config.yaml`)
- Release assessment interface in desktop app and CLI output

**Production Monitoring**
- `monitor-agent` ingests webhooks from APM tools (Datadog, New Relic, CloudWatch)
- Anomaly detection — alert when behavior deviates from baselines
- Incident-to-test pipeline — every production incident becomes a regression test

**External Integrations**
- CI/CD pipeline stage (GitHub Actions, GitLab CI)
- Issue tracking (auto-file bugs to Jira, Linear, GitHub Issues)
- Team notifications (Slack, Teams)

### Phase 8: Learning Engine

**Pattern Learning**
- Track which tests catch real bugs vs produce noise
- Track which risk predictions were accurate
- Track which code areas cluster defects

**Model Refinement**
- Recalibrate risk scores after each release (prediction vs reality)
- Evolve test generation templates based on defect detection rate
- Learn environmental quirks (CI timing, flaky infrastructure patterns)

**Developer Feedback Loop**
- False positives dismissed by developers → reduce future noise
- Production bugs not caught by tests → coverage gap analysis
- Actual vs predicted defect rates → model accuracy tracking

---

And we can demonstrate:
- [ ] A non-trivial feature (multi-component, API + UI) built end-to-end
- [ ] Convergence achieving all-tests-pass within 5 iterations
- [ ] Red-phase verification catching at least one vacuous test
- [ ] Regression check catching at least one case where agents break existing functionality
- [ ] Change walkthrough accurately summarizing what was built
- [ ] At least one case where the convergence loop catches a real bug that code-only generation would miss
