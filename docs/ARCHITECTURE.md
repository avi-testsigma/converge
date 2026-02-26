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
- Side-by-side: approved mockup vs implementation screenshot
- Test results summary with drill-down
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
GENERATING → CONVERGING → READY_FOR_REVIEW →
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
| `code` | Implement a feature/component | Task description + approved mockup ref | Code changes in worktree |
| `test` | Generate acceptance tests | Requirement + approved mockup ref | `.sigma` BT files in worktree |
| `fix` | Fix a specific test failure | Failing test + diagnostic report | Targeted code fix in worktree |
| `diagnose` | Analyze test failure | BT event stream + screenshots | Diagnostic report |

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
  | { type: 'iteration_start'; iteration: number }
  | { type: 'tests_running'; total: number }
  | { type: 'test_result'; testId: string; status: 'pass' | 'fail'; details: BTEventLog }
  | { type: 'visual_check'; score: number; discrepancies: Discrepancy[] }
  | { type: 'diagnosis'; failures: DiagnosticReport[] }
  | { type: 'fix_dispatched'; agentId: string; target: string }
  | { type: 'fix_complete'; agentId: string }
  | { type: 'iteration_end'; passRate: number; visualScore: number }
  | { type: 'converged'; finalPassRate: number; finalVisualScore: number }
  | { type: 'max_iterations_reached'; passRate: number }
```

**Convergence Algorithm:**

```
function converge(config):
  for iteration in 1..maxIterations:

    // 1. Merge all code changes into integration branch
    mergeResult = worktreeManager.createIntegrationBranch(codeWorktrees)
    if mergeResult.conflicts:
      spawnFixAgent(resolveConflicts, mergeResult.conflicts)
      continue

    // 2. Run behavior tree test suite
    testResults = btRunner.executeAll(config.testFiles, integrationBranch)

    // 3. Visual verification (if mockup provided)
    screenshot = takeScreenshot(integrationBranch)
    visualResult = visionService.compareImplementation(config.mockup, screenshot)

    // 4. Check convergence
    passRate = testResults.passed / testResults.total
    if passRate == 1.0 && visualResult.score >= 90:
      return CONVERGED

    // 5. Diagnose failures
    for failure in testResults.failures:
      diagnostic = diagnoseFailure(failure.eventLog, failure.screenshots)

      // 6. Dispatch targeted fix agent
      if diagnostic.isCodeBug:
        spawnFixAgent('code', diagnostic.suggestedFix, codeWorktree)
      else if diagnostic.isTestBug:
        spawnFixAgent('test', diagnostic.suggestedFix, testWorktree)

    // 7. Wait for fix agents to complete
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
  ├─→ Agent Manager: Spawn (parallel)
  │     ├── code-agent-1 → worktree/code-1/ (settings component)
  │     ├── code-agent-2 → worktree/code-2/ (API endpoint)
  │     ├── code-agent-3 → worktree/code-3/ (theme provider)
  │     ├── test-agent-1 → worktree/test-1/ (generates settings.sigma)
  │     └── test-agent-2 → worktree/test-2/ (generates dark-mode.sigma)
  │
  │     All agents complete...
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
  └─→ Review Package
        ├── Mockup vs screenshot comparison (94% match)
        ├── 10/10 behavior tree tests passing
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

### 5. Project Structure

```
testsigma-converge/
├── packages/
│   ├── main/                          # Electron main process
│   │   ├── src/
│   │   │   ├── orchestrator/
│   │   │   │   ├── engine.ts          # OrchestratorEngine
│   │   │   │   ├── state-machine.ts   # Session state management
│   │   │   │   └── task-planner.ts    # Requirement → TaskPlan decomposition
│   │   │   ├── agents/
│   │   │   │   ├── manager.ts         # AgentManager
│   │   │   │   ├── claude-code.ts     # Claude Code subprocess wrapper
│   │   │   │   ├── codex.ts           # Codex subprocess wrapper (future)
│   │   │   │   └── prompt-templates/  # Task-specific prompt templates
│   │   │   │       ├── code-agent.md
│   │   │   │       ├── test-agent.md
│   │   │   │       ├── fix-agent.md
│   │   │   │       └── diagnose-agent.md
│   │   │   ├── convergence/
│   │   │   │   ├── engine.ts          # ConvergenceEngine
│   │   │   │   ├── diagnostics.ts     # Failure analysis
│   │   │   │   └── visual-verify.ts   # Screenshot vs mockup comparison
│   │   │   ├── git/
│   │   │   │   ├── worktree.ts        # WorktreeManager
│   │   │   │   └── merge.ts           # Integration branch management
│   │   │   ├── vision/
│   │   │   │   ├── service.ts         # VisionService (Gemini API)
│   │   │   │   └── comparison.ts      # Visual diff logic
│   │   │   ├── bt-runner/
│   │   │   │   ├── runner.ts          # Embedded BT execution
│   │   │   │   └── event-parser.ts    # BT event stream processing
│   │   │   └── ipc/
│   │   │       └── handlers.ts        # IPC handler registration
│   │   └── index.ts                   # Electron main entry
│   │
│   ├── renderer/
│   │   ├── src/
│   │   │   ├── views/
│   │   │   │   ├── ProjectSetup.tsx
│   │   │   │   ├── VisionStudio.tsx
│   │   │   │   ├── AgentMonitor.tsx
│   │   │   │   ├── ReviewMerge.tsx
│   │   │   │   └── TestEditor.tsx     # Wraps sigma-authoring
│   │   │   ├── components/
│   │   │   │   ├── agent-card/
│   │   │   │   ├── convergence-timeline/
│   │   │   │   ├── mockup-gallery/
│   │   │   │   ├── diff-viewer/
│   │   │   │   ├── visual-comparison/
│   │   │   │   └── test-results/
│   │   │   ├── stores/
│   │   │   │   ├── project-store.ts
│   │   │   │   ├── agent-store.ts
│   │   │   │   └── convergence-store.ts
│   │   │   └── lib/
│   │   │       └── ipc-client.ts      # Typed IPC client
│   │   └── index.html
│   │
│   ├── shared/                        # Shared types between main/renderer
│   │   └── src/
│   │       ├── types.ts
│   │       └── events.ts
│   │
│   └── sigma-authoring/               # Extracted/embedded from drifter-electron
│       └── (existing sigma-authoring code)
│
├── prompt-templates/                   # Agent prompt engineering
│   ├── system/
│   │   ├── code-agent.md              # System prompt for code generation agents
│   │   ├── test-agent.md              # System prompt for test generation agents
│   │   ├── fix-agent.md               # System prompt for fix agents
│   │   └── diagnose-agent.md          # System prompt for diagnostic agents
│   └── examples/
│       ├── sample-sigma-tests/        # Example .sigma files for few-shot prompting
│       └── sample-diagnostics/        # Example diagnostic reports
│
├── docs/
│   ├── VISION.md
│   ├── ARCHITECTURE.md
│   └── MVP.md
│
├── turbo.json
├── package.json
└── CLAUDE.md
```

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

#### Why Gemini for Vision (not Claude)?

- **Image generation**: Nano Banana Pro generates images; Claude doesn't
- **Multi-modal**: Same API handles generation AND comparison
- **Quality**: Strong at UI mockup generation with text rendering
- **Claude for code**: Keep Claude focused on what it's best at (code/reasoning)
