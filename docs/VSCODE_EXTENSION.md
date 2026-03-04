# Converge: VS Code Extension

## Why VS Code

Most developers live in VS Code. The Electron desktop app is the full orchestration experience, but developers need Converge feedback where they already work. The VS Code extension is the lightweight integration — it doesn't replace the desktop app, it connects to it and surfaces status inline.

Think of it as: **desktop app = orchestration control room, VS Code = inline feedback**.

## Extension Surface Areas

### 1. Status Bar

Always-visible convergence status in the VS Code status bar:

```
$(testing-run-icon) Converge: 8/14 tests | Iter 2 | 88% visual
```

Clicking opens the Converge sidebar panel.

### 2. Sidebar Panel (Activity Bar)

A custom view container in the activity bar with tree views:

```
CONVERGE
├─ Current Session
│  ├─ Status: CONVERGING (iteration 2)
│  ├─ Requirement: "Add settings page with dark mode..."
│  └─ Mockup: [click to preview]
│
├─ Agents
│  ├─ 🟢 code-agent-1: Settings component (done)
│  ├─ 🟢 code-agent-2: API endpoint (done)
│  ├─ 🟡 fix-agent-1: Notification toggle (running)
│  └─ ✅ test-agent-1: 14 tests generated
│
├─ Test Results
│  ├─ ✅ settings-nav.sigma (6/6)
│  ├─ ❌ dark-mode.sigma (3/4)
│  │  └─ ❌ Step 7: VerifyText "persisted" — timeout
│  └─ ✅ notifications.sigma (4/4)
│
├─ Regressions
│  └─ ✅ 47/47 existing tests passing
│
└─ History
   ├─ Iter 1: 8/14 pass, 72% visual
   └─ Iter 2: 12/14 pass, 88% visual (current)
```

### 3. Inline Diagnostics

When a BT test fails and the diagnosis points to a specific file, show inline diagnostics:

```typescript
// src/components/Settings.tsx
export function Settings() {
  return (
    <div>
      <ThemeToggle />   // ⚠️ Converge: dark-mode.sigma step 7 fails here
                         //    Expected: toggle persists after refresh
                         //    Actual: state resets on mount
    </div>
  )
}
```

Uses VS Code's `DiagnosticCollection` API to show warnings/errors from BT test failures mapped to source locations.

### 4. CodeLens

Above components that have corresponding stories or BT tests:

```
▶ Run Converge Tests | 📋 3 BT tests | 🔴 1 failing
export function SettingsPage() {
```

Clicking "Run Converge Tests" triggers the relevant `.sigma` tests via the desktop app.

### 5. Webview Panels

For richer views that can't fit in tree views:

- **Mockup Preview** — show the approved visual prototype
- **Visual Comparison** — side-by-side mockup vs screenshot
- **Change Walkthrough** — rendered markdown of the walkthrough agent's summary
- **Screencast Replay** — embedded BT test execution screencast

### 6. Commands

```
Converge: Start New Session
Converge: Show Current Status
Converge: Run Tests for Current File
Converge: Open Mockup Preview
Converge: Show Change Walkthrough
Converge: Accept Changes
Converge: Reject and Add Feedback
Converge: Open Desktop App
```

## Communication with Desktop App

The extension doesn't run agents itself — it connects to the running Converge desktop app via local IPC:

```
VS Code Extension ←→ Local WebSocket ←→ Converge Desktop App
                     (localhost:PORT)
```

**Protocol**: JSON-RPC over WebSocket. The desktop app exposes a local server on a random port, writing the port number to `.converge/server.json`.

```typescript
interface ConvergeServerAPI {
  // Status
  getSessionStatus(): SessionStatus
  getAgents(): AgentStatus[]
  getTestResults(): TestSuiteResult[]
  getConvergenceHistory(): ConvergenceEvent[]

  // Actions
  runTestsForFile(filePath: string): void
  acceptChanges(): void
  rejectChanges(feedback: string): void
  addInstruction(agentId: string, instruction: string): void

  // Streaming
  onEvent(callback: (event: ConvergenceEvent) => void): Disposable
}
```

**Fallback**: If the desktop app isn't running, the extension shows "Converge desktop app not detected" with a button to launch it.

## Package Structure

```
packages/vscode-extension/
├── src/
│   ├── extension.ts              # Activation, command registration
│   ├── providers/
│   │   ├── sidebar-provider.ts   # Tree view data provider
│   │   ├── status-bar.ts         # Status bar item
│   │   ├── diagnostics.ts        # Inline BT failure diagnostics
│   │   ├── codelens.ts           # CodeLens for test-linked components
│   │   └── webview/
│   │       ├── mockup-preview.ts
│   │       ├── visual-comparison.ts
│   │       └── walkthrough.ts
│   ├── client/
│   │   ├── connection.ts         # WebSocket client to desktop app
│   │   └── protocol.ts           # JSON-RPC message types
│   └── util/
│       └── file-mapping.ts       # Map BT failures to source locations
├── media/                        # Icons, webview assets
├── package.json
└── tsconfig.json
```
