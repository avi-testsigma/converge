# Converge: Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CONVERGE APP (Electron)                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    RENDERER (React)                     │  │
│  │                                                         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ │  │
│  │  │ Project  │ │ Vision   │ │  Agent    │ │ Review & │ │  │
│  │  │ Setup    │ │ Studio   │ │  Monitor  │ │ Merge    │ │  │
│  │  └──────────┘ └──────────┘ └───────────┘ └──────────┘ │  │
│  │                                                         │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │           sigma-authoring (embedded)             │   │  │
│  │  │         Test review / edit / execution           │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
│                            │ IPC                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                    MAIN PROCESS                         │  │
│  │                                                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ Orchestrator │  │ Agent        │  │ Git Worktree │ │  │
│  │  │ Engine       │  │ Manager      │  │ Manager      │ │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │  │
│  │         │                 │                  │          │  │
│  │  ┌──────┴───────┐  ┌─────┴────────┐  ┌─────┴────────┐ │  │
│  │  │ Convergence  │  │ Vision       │  │ BT Runner    │ │  │
│  │  │ Engine       │  │ Service      │  │ (embedded)   │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
    ┌────┴────┐          ┌───┴────┐          ┌────┴────┐
    │ Claude  │          │ Gemini │          │ Claude  │
    │ Code    │          │ API    │          │ Code    │
    │ (agent) │          │ (Nano  │          │ (agent) │
    │         │          │ Banana)│          │         │
    └─────────┘          └────────┘          └─────────┘
```

## Component Architecture

### 1. Renderer Layer (React + TypeScript)

The UI is a single Electron renderer with multiple views:

#### Project Setup View
- Clone/open repository
- Configure API keys (Claude, Gemini)
- Set project-level defaults (framework, language, test patterns)

#### Vision Studio View
- Text input for requirement description
- Gallery of generated mockups (2-4 variations)
- Mockup iteration controls ("make the button larger", "add dark mode")
- Approval workflow with annotation support
- Stores approved mockups as project artifacts

#### Agent Monitor View
- Dashboard showing all active agents and their status
- Per-agent: task description, current activity, git diff preview
- Convergence timeline: iteration count, test pass rate over time
- Live log streaming from each agent
- Controls: pause, resume, terminate, add instruction

#### Review & Merge View
- **Change walkthrough**: narrative summary of what was built and why (read this first)
- Side-by-side: approved mockup vs implementation screenshot
- Test results summary with drill-down (new tests + regression check)
- Git diff viewer for all code changes
- One-click merge to target branch
- Rejection workflow: add feedback, trigger new iteration

#### Sigma Authoring (Embedded)
- The existing sigma-authoring component, embedded as a view
- Used for reviewing/editing generated behavior tree tests
- Live test execution with screencast
- Users can manually run tests, modify acceptance criteria, add edge cases

### 2. Main Process Layer (Node.js)

#### Orchestrator Engine

The brain of the system. Manages the full lifecycle from requirement to merged code.

```typescript
interface OrchestratorEngine {
  // Lifecycle
  startProject(config: ProjectConfig): Promise<ProjectSession>

  // Vision phase
  generateMockups(requirement: string, count?: number): Promise<Mockup[]>
  iterateMockup(mockupId: string, feedback: string): Promise<Mockup>
  approveMockup(mockupId: string): Promise<ApprovedVision>

  // Decomposition
  decompose(vision: ApprovedVision): Promise<TaskPlan>

  // Execution
  dispatch(plan: TaskPlan): Promise<AgentPool>

  // Convergence
  runConvergenceLoop(pool: AgentPool): AsyncIterable<ConvergenceEvent>

  // Review
  getReviewPackage(sessionId: string): Promise<ReviewPackage>
  approve(sessionId: string): Promise<MergeResult>
  reject(sessionId: string, feedback: string): Promise<void>
}
```

**State Machine:**

```
IDLE → ENVISIONING → VISION_APPROVED → DECOMPOSING →
GROUNDING → GENERATING → RED_CHECK → CONVERGING →
WALKTHROUGH → READY_FOR_REVIEW →
  ├→ APPROVED → MERGED
  └→ REJECTED → GENERATING (with feedback)
```

#### Agent Manager

Manages Claude Code / Codex agent processes.

```typescript
interface AgentManager {
  // Lifecycle
  spawn(config: AgentConfig): Promise<AgentHandle>
  terminate(agentId: string): Promise<void>
  terminateAll(): Promise<void>

  // Communication
  sendInstruction(agentId: string, instruction: string): Promise<void>
  getStatus(agentId: string): AgentStatus
  streamOutput(agentId: string): AsyncIterable<string>

  // Observation
  onComplete(agentId: string): Promise<AgentResult>
  listActive(): AgentHandle[]
}

interface AgentConfig {
  type: 'code' | 'test' | 'fix'
  worktreePath: string
  task: string                    // Natural language task description
  context: string[]               // Relevant file paths for context
  claudeMd?: string               // Task-specific CLAUDE.md content
  maxTurns?: number               // Safety limit
  model?: 'claude-code' | 'codex' // Which underlying agent to use
}
```

**Agent Types:**

| Type | Purpose | Input | Output |
|------|---------|-------|--------|
| `ground` | Explore codebase before coding | Project dir + task context | Codebase summary, relevant files, conventions |
| `code` | Implement a feature/component | Task description + grounding report + approved mockup ref | Code changes in worktree |
| `test` | Generate acceptance tests | Requirement + approved mockup ref | `.sigma` BT files in worktree |
| `fix` | Fix a specific test failure | Failing test + diagnostic report | Targeted code fix in worktree |
| `fix-regression` | Fix a broken existing test | Regression report + baseline | Targeted code fix that restores existing behavior |
| `diagnose` | Analyze test failure | BT event stream + screenshots | Diagnostic report |
| `walkthrough` | Explain what was built | All diffs + test results + requirement | Narrative change summary |
| `risk` | Compute risk scores from code analysis + defect history | Project dir + git log + defect data | Risk scores per component |
| `monitor` | Watch production metrics, detect anomalies | APM webhooks + error logs | Anomaly alerts + regression test stubs |
| `triage` | Deduplicate defects, score severity, assign owners | Raw diagnostic reports | Grouped, prioritized defect list |
| `heal` | Self-heal broken tests (locator, timing, data issues) | Failed test + failure classification | Updated test with healing applied |

The `ground` agent runs first — it explores the codebase, reads existing tests, identifies conventions and relevant files, then produces a grounding report that code agents receive as context. This follows Simon Willison's "First Run the Tests" pattern: agents that understand the project before modifying it produce significantly better results.

The `walkthrough` agent runs after convergence — it reads all diffs, test results, and the original requirement, then produces a narrative explanation of what was built. This follows Willison's "Linear Walkthroughs" pattern: a structured human-readable summary that makes review faster and more meaningful than reading raw diffs.

**How Agents Are Spawned:**

Each agent is a Claude Code CLI process running in a dedicated git worktree:

```bash
# Agent spawning (pseudocode)
git worktree add .converge/worktrees/{agent-id} -b converge/{agent-id} HEAD

# Code agent
claude --dir .converge/worktrees/{agent-id} \
  --allowedTools Edit,Write,Bash,Read,Glob,Grep \
  --prompt "$(cat task-prompt.md)"

# Test agent
claude --dir .converge/worktrees/{agent-id} \
  --allowedTools Edit,Write,Read,Glob,Grep \
  --prompt "$(cat test-generation-prompt.md)"
```

#### Git Worktree Manager

Handles workspace isolation for parallel agents.

```typescript
interface WorktreeManager {
  // Lifecycle
  create(name: string, baseBranch?: string): Promise<WorktreePath>
  remove(name: string): Promise<void>
  removeAll(): Promise<void>

  // Operations
  list(): Promise<Worktree[]>
  getDiff(name: string): Promise<string>
  getChangedFiles(name: string): Promise<string[]>

  // Integration
  createIntegrationBranch(worktrees: string[]): Promise<string>
  mergeWorktree(name: string, target: string): Promise<MergeResult>
  mergeAll(target: string): Promise<MergeResult>
}
```

**Worktree Layout:**

```
project-repo/
├── .converge/
│   ├── worktrees/
│   │   ├── code-agent-1/          # Full repo clone (worktree)
│   │   ├── code-agent-2/
│   │   ├── test-agent-1/
│   │   └── integration/           # Merged branch for testing
│   ├── artifacts/
│   │   ├── mockups/               # Approved visual prototypes
│   │   ├── screenshots/           # Implementation screenshots
│   │   └── reports/               # Convergence reports
│   ├── sessions/
│   │   └── {session-id}.json      # Session state persistence
│   └── config.json                # Project-level Converge config
├── src/                           # User's actual codebase
├── tests/                         # Generated .sigma files land here
└── ...
```

#### Vision Service

Interfaces with Gemini API (Nano Banana Pro) for mockup generation.

```typescript
interface VisionService {
  // Generation
  generateMockups(prompt: VisionPrompt): Promise<Mockup[]>
  iterateMockup(mockup: Mockup, feedback: string): Promise<Mockup>

  // Comparison
  compareImplementation(
    mockup: Mockup,
    screenshot: Buffer
  ): Promise<VisualComparisonResult>
}

interface VisionPrompt {
  requirement: string              // User's feature description
  existingScreenshots?: Buffer[]   // Current state of the app
  styleGuide?: string              // Design system / brand guidelines
  framework?: string               // "React", "Next.js" etc. for realistic mockups
}

interface VisualComparisonResult {
  similarityScore: number          // 0-100
  discrepancies: Discrepancy[]     // Specific differences found
  suggestion: string               // Natural language fix suggestion
}
```

#### Convergence Engine

The automated test-fix loop.

```typescript
interface ConvergenceEngine {
  run(config: ConvergenceConfig): AsyncIterable<ConvergenceEvent>
}

interface ConvergenceConfig {
  integrationBranch: string        // Branch with merged code
  testFiles: string[]              // .sigma BT test files to run
  mockup?: Mockup                  // For visual verification
  maxIterations: number            // Safety limit (default: 5)
  fixStrategy: 'targeted' | 'broad'
}

// Event stream for UI updates
type ConvergenceEvent =
  | { type: 'baseline_running' }
  | { type: 'baseline_complete'; existingTests: number; passing: number; failing: number }
  | { type: 'baseline_warning'; preExistingFailures: string[] }
  | { type: 'red_check_running'; total: number }
  | { type: 'red_check_result'; testId: string; status: 'red' | 'vacuous' }
  | { type: 'vacuous_test'; testId: string; reason: string }
  | { type: 'iteration_start'; iteration: number }
  | { type: 'regression_check'; total: number }
  | { type: 'regression_detected'; brokenTests: string[] }
  | { type: 'tests_running'; total: number }
  | { type: 'test_result'; testId: string; status: 'pass' | 'fail'; details: BTEventLog }
  | { type: 'visual_check'; score: number; discrepancies: Discrepancy[] }
  | { type: 'diagnosis'; failures: DiagnosticReport[] }
  | { type: 'fix_dispatched'; agentId: string; target: string }
  | { type: 'fix_complete'; agentId: string }
  | { type: 'iteration_end'; passRate: number; visualScore: number }
  | { type: 'walkthrough_generating' }
  | { type: 'walkthrough_complete'; summary: string }
  | { type: 'converged'; finalPassRate: number; finalVisualScore: number }
  | { type: 'max_iterations_reached'; passRate: number }
```

**Convergence Algorithm:**

```
function converge(config):

  // Phase 0: BASELINE — Run existing project tests
  baselineResults = runExistingTests(config.projectDir)
  if baselineResults.failures:
    emit('baseline_warning', baselineResults)
    // Record which tests already fail — don't blame agents for these

  // Phase 0.5: RED CHECK — Verify generated tests fail without new code
  redCheckResults = btRunner.executeAll(config.testFiles, config.baseBranch)
  for test in redCheckResults:
    if test.status == 'pass':
      emit('vacuous_test', test.testId)
      // Flag: this test passes without any code changes — it tests nothing
      // Either remove it or have test agent rewrite with stricter assertions

  for iteration in 1..maxIterations:

    // 1. Merge all code changes into integration branch
    mergeResult = worktreeManager.createIntegrationBranch(codeWorktrees)
    if mergeResult.conflicts:
      spawnFixAgent(resolveConflicts, mergeResult.conflicts)
      continue

    // 2. Run existing test suite (regression check)
    regressionResults = runExistingTests(integrationBranch)
    newRegressions = diff(regressionResults, baselineResults)
    if newRegressions.length > 0:
      emit('regression_detected', newRegressions)
      for regression in newRegressions:
        spawnFixAgent('regression', regression, codeWorktree)
      continue

    // 3. Run behavior tree test suite
    testResults = btRunner.executeAll(config.testFiles, integrationBranch)

    // 4. Visual verification (if mockup provided)
    screenshot = takeScreenshot(integrationBranch)
    visualResult = visionService.compareImplementation(config.mockup, screenshot)

    // 5. Check convergence
    passRate = testResults.passed / testResults.total
    if passRate == 1.0 && visualResult.score >= 90:
      // Generate change walkthrough before declaring converged
      walkthrough = generateWalkthrough(config.allDiffs, testResults)
      return CONVERGED(walkthrough)

    // 6. Diagnose failures
    for failure in testResults.failures:
      diagnostic = diagnoseFailure(failure.eventLog, failure.screenshots)

      // 7. Dispatch targeted fix agent
      if diagnostic.isCodeBug:
        spawnFixAgent('code', diagnostic.suggestedFix, codeWorktree)
      else if diagnostic.isTestBug:
        spawnFixAgent('test', diagnostic.suggestedFix, testWorktree)

    // 8. Wait for fix agents to complete
    awaitAll(activeFixAgents)

  return MAX_ITERATIONS_REACHED(passRate)
```

#### BT Runner (Embedded)

Embeds the behaviour-tree-ecosystem's `bt-runner` for local test execution.

```typescript
interface BTRunner {
  // Execution
  executeTest(testFile: string, options: ExecutionOptions): Promise<TestResult>
  executeAll(testFiles: string[], options: ExecutionOptions): Promise<TestSuiteResult>

  // Streaming
  streamEvents(sessionId: string): AsyncIterable<NodeEvent>
  streamScreencast(sessionId: string): AsyncIterable<ScreencastFrame>

  // Diagnostics
  getEventLog(sessionId: string): Promise<NodeEvent[]>
  getScreenshots(sessionId: string): Promise<Screenshot[]>
}

interface ExecutionOptions {
  browser: 'chromium' | 'firefox' | 'webkit'
  headless: boolean
  baseUrl?: string
  variables?: Record<string, string>
  timeout?: number
}

interface TestResult {
  testId: string
  status: 'pass' | 'fail' | 'error'
  duration: number
  events: NodeEvent[]           // Full BT event stream
  failedNodeId?: string         // Exact node that failed
  failedStep?: string           // Human-readable step description
  screenshot?: Buffer           // Screenshot at failure point
  error?: string                // Error message
}
```

### 3. Data Flow

#### Requirement → Shipped Feature (Happy Path)

```
User: "Add a settings page with dark mode toggle and notification preferences"
  │
  ├─→ Vision Service
  │     Input: requirement text + existing app screenshots
  │     Output: 3 mockup variations of settings page
  │     User selects mockup #2, iterates: "make toggle switches instead of checkboxes"
  │     Final mockup approved ✓
  │
  ├─→ Orchestrator: Decompose
  │     Input: approved mockup + requirement
  │     Output: TaskPlan
  │       ├── code-task-1: "Settings page component with dark mode toggle"
  │       ├── code-task-2: "Settings API endpoint for preferences CRUD"
  │       ├── code-task-3: "Dark mode theme provider integration"
  │       ├── test-task-1: "Acceptance tests for settings page"
  │       └── test-task-2: "Acceptance tests for dark mode behavior"
  │
  ├─→ Baseline: Run existing tests
  │     Input: project's existing test suite
  │     Output: 47/47 existing tests pass ✓ (baseline recorded)
  │
  ├─→ Grounding Agent: Explore codebase
  │     Input: project directory + task plan
  │     Output: grounding report
  │       ├── Framework: Next.js 14 with App Router
  │       ├── Styling: Tailwind + shadcn/ui
  │       ├── State: Zustand stores in src/stores/
  │       ├── API: Route handlers in src/app/api/
  │       ├── Relevant files: layout.tsx, nav.tsx, theme-provider.tsx
  │       └── Existing tests: Vitest in __tests__/, 47 passing
  │
  ├─→ Agent Manager: Spawn (parallel)
  │     ├── code-agent-1 → worktree/code-1/ (settings component)
  │     ├── code-agent-2 → worktree/code-2/ (API endpoint)
  │     ├── code-agent-3 → worktree/code-3/ (theme provider)
  │     ├── test-agent-1 → worktree/test-1/ (generates settings.sigma)
  │     └── test-agent-2 → worktree/test-2/ (generates dark-mode.sigma)
  │     (All code agents receive the grounding report as context)
  │
  │     All agents complete...
  │
  ├─→ Red Check: Verify generated tests fail against current code
  │     Run settings.sigma against base branch → 0/6 pass ✓ (all red)
  │     Run dark-mode.sigma against base branch → 0/4 pass ✓ (all red)
  │     All tests properly fail without new code — they test real things
  │
  ├─→ Convergence Engine: Loop
  │     Iteration 1:
  │       Merge code-1 + code-2 + code-3 → integration branch
  │       Run settings.sigma → 4/6 tests pass
  │       Run dark-mode.sigma → 2/4 tests pass
  │       Visual score: 78%
  │       Diagnose: missing notification toggle, theme not applied to sidebar
  │       Dispatch fix-agent-1 (notification toggle)
  │       Dispatch fix-agent-2 (sidebar theme)
  │
  │     Iteration 2:
  │       Re-merge with fixes
  │       Run settings.sigma → 6/6 pass ✓
  │       Run dark-mode.sigma → 3/4 pass
  │       Visual score: 91%
  │       Diagnose: dark mode transition animation missing
  │       Dispatch fix-agent-3 (animation)
  │
  │     Iteration 3:
  │       All tests pass ✓
  │       Visual score: 94% ✓
  │       CONVERGED
  │
  ├─→ Walkthrough Agent: Explain what was built
  │     Input: all diffs + test results + original requirement
  │     Output: narrative summary
  │       "Added a Settings page at /settings with three tabbed sections:
  │        Profile (name, email, avatar upload via presigned S3 URL),
  │        Notifications (email + push toggles persisted via PUT /api/settings),
  │        and Appearance (dark mode toggle using existing ThemeProvider).
  │        Nav bar updated with Settings link. 10 acceptance tests cover
  │        all sections including persistence across page refresh."
  │
  └─→ Review Package
        ├── Change walkthrough (narrative summary above)
        ├── Mockup vs screenshot comparison (94% match)
        ├── 10/10 behavior tree tests passing
        ├── 47/47 existing tests still passing (no regressions)
        ├── Git diff: 12 files changed, +340 -20
        ├── Convergence: 3 iterations
        └── Human approves → merged to main
```

#### Diagnostic Report Structure

When a BT test fails, the diagnostic report gives the fix agent structured context:

```typescript
interface DiagnosticReport {
  testFile: string                     // "settings.sigma"
  testName: string                     // "SettingsPage_DarkModeToggle"
  failedAt: {
    nodeId: string                     // "node-14"
    nodeType: string                   // "VerifyText"
    stepDescription: string            // "Verify text 'Dark Mode' is visible"
    expectedBehavior: string           // "Element with text 'Dark Mode' should be visible"
    actualBehavior: string             // "Element not found within 5000ms timeout"
  }
  context: {
    precedingSteps: StepSummary[]      // Steps that passed before failure
    screenshot: Buffer                 // Screenshot at failure point
    domSnapshot?: string               // Relevant DOM section
    consoleErrors?: string[]           // Browser console errors
    networkErrors?: string[]           // Failed API calls
  }
  diagnosis: {
    likelyCause: 'code_bug' | 'test_bug' | 'timing' | 'unknown'
    confidence: number                 // 0-1
    explanation: string                // "The settings page renders but the dark mode section
                                       //  is behind a tab that wasn't clicked first"
    suggestedFix: string               // "Add a click on the 'Appearance' tab before
                                       //  verifying the dark mode toggle"
    targetFile?: string                // Which file to modify
  }
}
```

### 4. Technology Choices

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **App Shell** | Electron | Local-first, file system access, process management |
| **Renderer** | React + TypeScript + Vite | Existing sigma-authoring stack, reuse components |
| **UI Components** | Shadcn/ui + Tailwind | Existing sigma-authoring stack |
| **State Management** | Zustand | Lightweight, already used in sigma-authoring |
| **Agent Runtime** | Claude Code CLI (subprocess) | Battle-tested, user's existing auth, tool ecosystem |
| **Test Runtime** | bt-runner (embedded) | Our own BT ecosystem, full control |
| **Vision/Mockups** | Gemini API (Nano Banana Pro) | Image generation + vision comparison |
| **Git Operations** | simple-git (Node.js) | Worktree management, merge, diff |
| **IPC** | Electron IPC + tRPC | Type-safe renderer↔main communication |
| **Process Management** | execa | Spawning and managing Claude Code processes |
| **Screencast** | CDP (Chrome DevTools Protocol) | Already used in sigma-authoring |

### 5. Monorepo Structure

Converge is a pnpm + Turbo monorepo. Core logic lives in shared packages consumed by multiple surfaces (desktop app, Storybook addon, VS Code extension, Claude plugins).

**Dependency Graph:**

```
                    @converge/shared
                   (types, events, constants)
                    /     |     \      \
                   /      |      \      \
          @converge/  @converge/  @converge/  @converge/
          git         vision      bt-bridge   (leaf packages)
            \           |           /     \
             \          |          /       \
              @converge/core               \
         (orchestrator, convergence,        \
          agent management)                  \
           /    |      \        \             \
          /     |       \        \             \
   @converge/  @converge/  @converge/   @converge/
   desktop     storybook   vscode-ext   claude-plugins
   (Electron)  -addon      (VS Code)   (skills, MCP,
                                        sub-agents)
```

**Directory Layout:**

```
converge/
├── apps/
│   └── desktop/                        # Electron app (MVP primary surface)
│       ├── src/
│       │   ├── main/                   # Electron main process
│       │   │   ├── ipc/               # IPC handler registration
│       │   │   ├── server.ts          # Local WebSocket server (for VS Code ext)
│       │   │   └── index.ts
│       │   └── renderer/              # React UI
│       │       ├── views/
│       │       │   ├── ProjectSetup.tsx
│       │       │   ├── VisionStudio.tsx
│       │       │   ├── AgentMonitor.tsx
│       │       │   ├── ReviewMerge.tsx
│       │       │   └── TestEditor.tsx
│       │       ├── components/
│       │       │   ├── agent-card/
│       │       │   ├── convergence-timeline/
│       │       │   ├── mockup-gallery/
│       │       │   ├── diff-viewer/
│       │       │   ├── visual-comparison/
│       │       │   ├── walkthrough-viewer/
│       │       │   └── test-results/
│       │       └── stores/
│       └── package.json
│
├── packages/
│   ├── shared/                         # Types, events, constants
│   │   └── src/
│   │       ├── types.ts               # Core interfaces (AgentConfig, TestResult, etc.)
│   │       ├── events.ts             # ConvergenceEvent union type
│   │       └── index.ts
│   │
│   ├── core/                           # Orchestration engine (the brain)
│   │   └── src/
│   │       ├── orchestrator/
│   │       │   ├── engine.ts          # OrchestratorEngine
│   │       │   ├── state-machine.ts   # Session state (IDLE → ... → MERGED)
│   │       │   └── task-planner.ts    # Requirement → TaskPlan decomposition
│   │       ├── agents/
│   │       │   ├── manager.ts         # AgentManager (spawn, terminate, stream)
│   │       │   ├── claude-code.ts     # Claude Code CLI subprocess wrapper
│   │       │   └── types.ts          # Agent type definitions
│   │       ├── convergence/
│   │       │   ├── engine.ts          # ConvergenceEngine (the loop)
│   │       │   ├── baseline.ts        # Existing test suite baseline
│   │       │   ├── red-check.ts       # Red-phase verification
│   │       │   ├── regression.ts      # Regression detection
│   │       │   ├── diagnostics.ts     # Failure analysis
│   │       │   └── visual-verify.ts   # Screenshot vs mockup comparison
│   │       └── index.ts
│   │
│   ├── git/                            # Git operations
│   │   └── src/
│   │       ├── worktree.ts            # WorktreeManager
│   │       ├── merge.ts              # Integration branch management
│   │       └── index.ts
│   │
│   ├── vision/                         # Gemini integration
│   │   └── src/
│   │       ├── service.ts             # VisionService (mockup generation)
│   │       ├── comparison.ts          # Visual diff (mockup vs screenshot)
│   │       └── index.ts
│   │
│   ├── bt-bridge/                      # Behavior tree ecosystem bridge
│   │   └── src/
│   │       ├── runner.ts              # BT execution wrapper
│   │       ├── event-parser.ts        # BT event stream → structured results
│   │       ├── sigma-utils.ts         # .sigma file operations
│   │       └── index.ts
│   │
│   ├── storybook-addon/                # Storybook integration
│   │   └── src/                       # See docs/STORYBOOK_INTEGRATION.md
│   │       ├── manager.tsx            # Panel + toolbar registration
│   │       ├── preview.tsx            # Decorator registration
│   │       ├── Panel.tsx              # TDD panel component
│   │       ├── bridge/
│   │       │   ├── play-to-sigma.ts   # play() → .sigma conversion
│   │       │   └── sigma-to-play.ts   # .sigma → play() conversion
│   │       └── channel/
│   │           └── events.ts
│   │
│   ├── vscode-extension/               # VS Code integration
│   │   └── src/                       # See docs/VSCODE_EXTENSION.md
│   │       ├── extension.ts           # Activation, commands
│   │       ├── providers/
│   │       │   ├── sidebar-provider.ts
│   │       │   ├── status-bar.ts
│   │       │   ├── diagnostics.ts
│   │       │   └── codelens.ts
│   │       └── client/
│   │           └── connection.ts      # WebSocket to desktop app
│   │
│   └── claude-plugins/                 # Claude Code integrations
│       └── src/                       # See docs/CLAUDE_PLUGINS.md
│           ├── skills/                # Slash commands (/converge-test, etc.)
│           ├── agents/                # Sub-agent definitions
│           └── mcp/
│               ├── server.ts          # MCP server entry
│               ├── tools/             # MCP tool implementations
│               └── resources/         # MCP resources (BT catalog, examples)
│
├── prompt-templates/                   # Agent prompt engineering
│   ├── system/
│   │   ├── ground-agent.md
│   │   ├── code-agent.md
│   │   ├── test-agent.md
│   │   ├── fix-agent.md
│   │   ├── diagnose-agent.md
│   │   └── walkthrough-agent.md
│   └── examples/
│       ├── sample-sigma-tests/
│       └── sample-diagnostics/
│
├── docs/
│   ├── VISION.md
│   ├── ARCHITECTURE.md
│   ├── MVP.md
│   ├── AGENTIC_PATTERNS.md
│   ├── STORYBOOK_INTEGRATION.md
│   ├── VSCODE_EXTENSION.md
│   └── CLAUDE_PLUGINS.md
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── CLAUDE.md
```

**Why this split:**

| Package | Rationale |
|---------|-----------|
| `shared` | Types/events used everywhere — zero logic, zero dependencies |
| `core` | Orchestration logic reused by desktop, VS Code ext, and Claude plugins |
| `git` | Worktree ops consumed by core and claude-plugins independently |
| `vision` | Gemini API calls consumed by core and claude-plugins independently |
| `bt-bridge` | BT runner consumed by core, storybook-addon, and claude-plugins |
| `storybook-addon` | Ships as an npm package users install in their Storybook |
| `vscode-extension` | Ships as a .vsix; connects to desktop app via WebSocket |
| `claude-plugins` | Skills + MCP tools installable into Claude Code |
| `desktop` | Electron app — the primary orchestration UI |

### 6. Key Design Decisions

#### Why Electron (not web)?

- **Process management**: Need to spawn and manage multiple Claude Code CLI processes
- **File system access**: Direct access to git repos, worktrees, .sigma files
- **Local-first**: No server deployment, runs on user's machine
- **Reuse**: sigma-authoring is already an Electron renderer component

#### Why Claude Code CLI (not API)?

- **Tool ecosystem**: Claude Code has file editing, bash execution, git operations built in
- **Auth simplicity**: Users already have Claude Code installed and authenticated
- **CLAUDE.md**: Agents can read project conventions automatically
- **Battle-tested**: Handles long-running agentic tasks with retry, context management
- **Future flexibility**: Can swap in Codex or other agent CLIs

#### Why Embedded BT Runner (not external)?

- **Speed**: No network overhead for test execution
- **Event streaming**: Direct access to NodeEventEmitter for real-time diagnostics
- **Control**: Can pause, resume, modify tests mid-execution
- **Isolation**: Each convergence iteration gets a fresh browser context

### 7. Intelligence Layer (Post-MVP)

The Intelligence Layer sits between `@converge/core` and the surfaces. It provides risk scoring, coverage analysis, and learning capabilities that make every surface smarter. See [INTELLIGENT_QA.md](INTELLIGENT_QA.md) for the full design.

```typescript
interface IntelligenceEngine {
  // Risk analysis
  computeRiskScores(projectDir: string): Promise<RiskMap>
  getRiskForFiles(files: string[]): Promise<RiskScore[]>

  // Coverage intelligence
  getCoverageMap(projectDir: string): Promise<CoverageMap>
  getUncoveredPaths(): Promise<CodePath[]>

  // Test prioritization
  prioritizeTests(tests: string[], budget?: number): Promise<PrioritizedTestPlan>

  // Learning
  recordOutcome(sessionId: string, outcome: SessionOutcome): Promise<void>
  getFalsePositiveRate(): Promise<number>
  getDefectPatterns(): Promise<DefectPattern[]>
}

interface RiskScore {
  path: string
  score: number              // 0-100
  factors: {
    complexity: number       // Cyclomatic complexity
    changeFrequency: number  // Commits in last 90 days
    defectDensity: number    // Historical bugs per KLOC
    businessCriticality: number  // From config
    dependencyDepth: number  // How many things depend on this
  }
}

interface ReleaseAssessment {
  verdict: 'safe' | 'acceptable_risk' | 'risky' | 'stop'
  confidence: number
  factors: {
    coverageAchieved: number
    riskScore: number
    defects: { critical: number; high: number; medium: number; low: number }
    regressionStatus: 'clean' | 'minor' | 'major'
    visualMatchScore: number
  }
  reasoning: string
  recommendation: string
}
```

**Extended Dependency Graph (with Intelligence):**

```
                    @converge/shared
                   (types, events, constants)
                    /     |     \      \
                   /      |      \      \
          @converge/  @converge/  @converge/  @converge/
          git         vision      bt-bridge   intelligence
            \           |           /     \        |
             \          |          /       \       |
              @converge/core ─────────────────────┘
         (orchestrator, convergence,
          agent management)
           /    |      \        \
          /     |       \        \
   desktop   storybook   vscode    claude-plugins
```

#### Why Gemini for Vision (not Claude)?

- **Image generation**: Nano Banana Pro generates images; Claude doesn't
- **Multi-modal**: Same API handles generation AND comparison
- **Quality**: Strong at UI mockup generation with text rendering
- **Claude for code**: Keep Claude focused on what it's best at (code/reasoning)
