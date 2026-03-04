# Converge: Claude Code Plugins

## Why Claude Plugins

Claude Code is the engine. The desktop app and VS Code extension are orchestration UIs. But developers also work directly in Claude Code — through the CLI, through IDE integrations, through the Agent SDK. Converge should meet them there too.

Three plugin types, each independent:
1. **Skills** — slash commands that developers invoke directly in Claude Code
2. **Sub-agents** — specialized agents that the orchestrator or other agents can spawn
3. **MCP Tools** — tools exposed via Model Context Protocol that any Claude session can use

## 1. Skills (Slash Commands)

Skills are user-invocable. A developer types `/converge-test` in Claude Code and gets the Converge TDD workflow without leaving their terminal.

### /converge-test

Generate and run behavior tree acceptance tests for the current feature.

```
User: /converge-test Add a dark mode toggle to the settings page

→ Explores codebase (grounding)
→ Generates .sigma BT files from the requirement
→ Runs red-phase check (tests fail against current code ✓)
→ Runs tests after implementation
→ Reports results inline
```

### /converge-vision

Generate visual mockups for a feature.

```
User: /converge-vision A settings page with profile, notifications, and appearance tabs

→ Calls Gemini Nano Banana Pro
→ Generates 3 variations
→ Displays inline (terminal image protocol or file paths)
→ User picks one: "use #2 but make toggles instead of checkboxes"
→ Iterates and saves approved mockup
```

### /converge-review

Generate a change walkthrough for current branch changes.

```
User: /converge-review

→ Reads git diff for current branch vs main
→ Reads any .sigma test results
→ Generates narrative walkthrough
→ Outputs: what changed, why, test coverage, risks
```

### /converge-story

Generate a Storybook story with play() function for a component.

```
User: /converge-story src/components/Button.tsx

→ Reads component source
→ Generates .stories.tsx with variants and play() functions
→ Generates companion .sigma for cross-browser validation
→ Runs both to verify they pass
```

### /converge-diagnose

Diagnose a failing test with structured analysis.

```
User: /converge-diagnose tests/settings.sigma

→ Runs the .sigma test
→ On failure: captures event log, screenshots, DOM state
→ Analyzes failure: code bug vs test bug vs timing
→ Suggests specific fix with file and line reference
```

## 2. Sub-Agents

Sub-agents are spawned by the orchestrator or by other agents. They're the specialized workers inside the convergence loop. Each has a focused prompt template and constrained tool access.

### ground-agent

**Purpose**: Explore codebase before coding starts.
**Tools**: Read, Glob, Grep, Bash (read-only)
**Output**: Grounding report — framework, conventions, relevant files, existing tests

```markdown
# Grounding Report

## Framework
- Next.js 14 with App Router
- TypeScript strict mode

## Styling
- Tailwind CSS with custom theme in tailwind.config.ts
- shadcn/ui components in src/components/ui/

## State Management
- Zustand stores in src/stores/
- Server state via TanStack Query

## Existing Tests
- Vitest: 47 tests in __tests__/
- Storybook: 23 stories with play functions
- Pattern: colocated test files (Component.test.tsx)

## Relevant Files for "Settings Page"
- src/app/layout.tsx (nav bar lives here)
- src/components/ui/switch.tsx (toggle component)
- src/stores/theme-store.ts (dark mode state)
- src/app/api/ (API route convention)
```

### test-agent

**Purpose**: Generate .sigma BT files from requirements.
**Tools**: Read, Write, Glob, Grep
**Input**: Requirement + acceptance criteria + BT node catalog + .sigma examples
**Output**: .sigma files in the test directory

**Constraint**: Generate tests from the REQUIREMENT, not from the code. Never read implementation files — only read the requirement, existing test patterns, and the BT node catalog.

### code-agent

**Purpose**: Implement a specific task.
**Tools**: Read, Write, Edit, Bash, Glob, Grep
**Input**: Task description + grounding report + mockup description
**Output**: Code changes committed in worktree

### fix-agent

**Purpose**: Fix a specific test failure.
**Tools**: Read, Write, Edit, Bash, Glob, Grep
**Input**: Diagnostic report (failing node, expected/actual, screenshot description, suggested fix)
**Output**: Targeted code change

**Constraint**: Only modify the file(s) identified in the diagnostic report. Run the failing test after the fix to verify.

### diagnose-agent

**Purpose**: Analyze test failure and produce diagnostic report.
**Tools**: Read, Glob, Grep, Bash (read-only)
**Input**: BT event log + screenshots + console errors + DOM state
**Output**: DiagnosticReport (likely cause, confidence, explanation, suggested fix, target file)

### walkthrough-agent

**Purpose**: Generate narrative summary of changes.
**Tools**: Read, Glob, Grep, Bash (git commands only)
**Input**: All diffs + test results + original requirement
**Output**: Markdown change walkthrough

## 3. MCP Tools

MCP (Model Context Protocol) tools are functions that any Claude session can invoke. They expose Converge capabilities to Claude Code, Claude Desktop, or any MCP-compatible client.

### converge_run_bt_tests

Execute behavior tree tests and return structured results.

```typescript
{
  name: "converge_run_bt_tests",
  description: "Run .sigma behavior tree tests against a target URL or local dev server",
  inputSchema: {
    type: "object",
    properties: {
      testFiles: { type: "array", items: { type: "string" } },
      baseUrl: { type: "string" },
      browser: { enum: ["chromium", "firefox", "webkit"] },
      headless: { type: "boolean", default: true }
    },
    required: ["testFiles"]
  }
}
// Returns: { passed, failed, total, results: TestResult[] }
```

### converge_generate_mockup

Generate a visual mockup via Gemini.

```typescript
{
  name: "converge_generate_mockup",
  description: "Generate UI mockup images from a feature description",
  inputSchema: {
    type: "object",
    properties: {
      requirement: { type: "string" },
      existingScreenshots: { type: "array", items: { type: "string" } },
      count: { type: "number", default: 3 }
    },
    required: ["requirement"]
  }
}
// Returns: { mockups: [{ id, imagePath, description }] }
```

### converge_visual_compare

Compare a screenshot against a mockup.

```typescript
{
  name: "converge_visual_compare",
  description: "Compare implementation screenshot against approved mockup",
  inputSchema: {
    type: "object",
    properties: {
      mockupPath: { type: "string" },
      screenshotPath: { type: "string" }
    },
    required: ["mockupPath", "screenshotPath"]
  }
}
// Returns: { similarityScore, discrepancies: [], suggestion }
```

### converge_diagnose_failure

Analyze a BT test failure and produce a diagnostic report.

```typescript
{
  name: "converge_diagnose_failure",
  description: "Analyze a behavior tree test failure and suggest fixes",
  inputSchema: {
    type: "object",
    properties: {
      testFile: { type: "string" },
      eventLog: { type: "string" },
      screenshotPath: { type: "string" }
    },
    required: ["testFile", "eventLog"]
  }
}
// Returns: DiagnosticReport
```

### converge_story_to_sigma

Convert a Storybook play function to a .sigma behavior tree.

```typescript
{
  name: "converge_story_to_sigma",
  description: "Convert a Storybook story's play() function to a .sigma behavior tree test",
  inputSchema: {
    type: "object",
    properties: {
      storyFile: { type: "string" },
      storyId: { type: "string" }
    },
    required: ["storyFile"]
  }
}
// Returns: { sigmaXml, outputPath }
```

### converge_manage_worktree

Create and manage git worktrees for isolated agent work.

```typescript
{
  name: "converge_manage_worktree",
  description: "Create, list, or remove git worktrees for parallel agent work",
  inputSchema: {
    type: "object",
    properties: {
      action: { enum: ["create", "list", "remove", "diff"] },
      name: { type: "string" },
      baseBranch: { type: "string" }
    },
    required: ["action"]
  }
}
```

## Package Structure

```
packages/claude-plugins/
├── src/
│   ├── skills/
│   │   ├── converge-test.md       # /converge-test skill definition
│   │   ├── converge-vision.md     # /converge-vision skill definition
│   │   ├── converge-review.md     # /converge-review skill definition
│   │   ├── converge-story.md      # /converge-story skill definition
│   │   └── converge-diagnose.md   # /converge-diagnose skill definition
│   ├── agents/
│   │   ├── ground.ts              # Grounding sub-agent
│   │   ├── test-gen.ts            # Test generation sub-agent
│   │   ├── code-gen.ts            # Code generation sub-agent
│   │   ├── fix.ts                 # Fix sub-agent
│   │   ├── diagnose.ts            # Diagnosis sub-agent
│   │   └── walkthrough.ts         # Walkthrough sub-agent
│   ├── mcp/
│   │   ├── server.ts              # MCP server entry point
│   │   ├── tools/
│   │   │   ├── run-bt-tests.ts
│   │   │   ├── generate-mockup.ts
│   │   │   ├── visual-compare.ts
│   │   │   ├── diagnose-failure.ts
│   │   │   ├── story-to-sigma.ts
│   │   │   └── manage-worktree.ts
│   │   └── resources/
│   │       ├── bt-node-catalog.ts # Expose BT node catalog as MCP resource
│   │       └── sigma-examples.ts  # Expose example .sigma files as resource
│   └── index.ts
├── package.json
└── tsconfig.json
```

## How They Work Together

The three plugin types compose naturally:

```
Developer in Claude Code:
  /converge-test "add dark mode toggle"
      │
      ├─ Skill invokes ground-agent (sub-agent)
      │    → produces grounding report
      │
      ├─ Skill invokes test-gen agent (sub-agent)
      │    → calls converge_run_bt_tests (MCP tool) for red-check
      │    → generates .sigma files
      │
      ├─ Developer implements the feature manually or with Claude Code
      │
      ├─ Skill invokes converge_run_bt_tests (MCP tool)
      │    → runs BT suite, returns results
      │
      ├─ If failures: skill invokes converge_diagnose_failure (MCP tool)
      │    → returns diagnostic with suggested fix
      │
      └─ Developer (or fix agent) applies fix, re-runs tests
```

The desktop app uses the same sub-agents and MCP tools under the hood — it's just a richer UI for orchestrating them. This means a developer can start with `/converge-test` in the CLI and graduate to the desktop app for complex multi-agent orchestration, with the same underlying engine.
