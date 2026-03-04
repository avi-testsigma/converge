# Converge: Storybook Integration

## Why Storybook

Storybook stories are **component-level contracts**. A story with a `play` function is an executable specification of how a component should behave in isolation. This maps directly to Converge's thesis: tests as executable specifications.

The bridge nobody owns today: **story → production test**. Developers write/generate stories (unit-level, isolated). Converge promotes these to integration/E2E tests across real browsers via behavior trees. The agent maintains both layers simultaneously.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    STORYBOOK                         │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  @converge/storybook-addon                    │   │
│  │                                               │   │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────────┐ │   │
│  │  │ TDD     │  │ Toolbar  │  │ Decorator   │ │   │
│  │  │ Panel   │  │ Buttons  │  │ (observer)  │ │   │
│  │  └────┬────┘  └────┬─────┘  └──────┬──────┘ │   │
│  │       │            │               │          │   │
│  │       └────────────┼───────────────┘          │   │
│  │                    │ Channel API              │   │
│  └────────────────────┼─────────────────────────┘   │
│                       │                              │
│  ┌────────────────────┼─────────────────────────┐   │
│  │  Preview (iframe)  │                          │   │
│  │  • Stories with play() functions              │   │
│  │  • Observer decorator captures interactions   │   │
│  │  • postVisit hook → BT bridge                 │   │
│  └───────────────────────────────────────────────┘   │
└──────────────────┬──────────────────────────────────┘
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
     @converge  @converge  @converge
     /core      /bt-bridge /vision
```

## The Addon: Three Extension Points

### 1. TDD Panel (bottom panel tab)

A panel addon registered alongside Controls and Actions. Shows:

```
┌─ Converge TDD ──────────────────────────────────────┐
│                                                      │
│  Story: Button/Primary                               │
│  Status: 🔴 RED — 2 failing assertions               │
│                                                      │
│  ┌─ Play Function Tests ──────────────────────────┐ │
│  │  ✓ renders with primary variant                 │ │
│  │  ✗ calls onClick when clicked                   │ │
│  │  ✗ shows loading state during async action      │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ Behavior Tree Tests ──────────────────────────┐ │
│  │  ⏸ button-click.sigma — waiting for green       │ │
│  │  ⏸ button-loading.sigma — waiting for green     │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─ Agent Activity ───────────────────────────────┐ │
│  │  Claude Code: "Adding onClick handler to        │ │
│  │  Button component. The play function expects    │ │
│  │  userEvent.click to trigger the callback..."    │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  [Run Agent] [Accept Changes] [Reject] [Edit Test]  │
└──────────────────────────────────────────────────────┘
```

**Implementation**: Panel addon using `addons.register()` + `addons.addPanel()`. Communicates with preview via Channel API events.

### 2. Toolbar Buttons

- **Run Converge** — starts the TDD loop for the current story
- **Generate Tests** — spawns test agent to create play() + .sigma for current story
- **Accept / Reject** — human-in-the-loop controls for agent changes

### 3. Observer Decorator

A decorator wrapping all stories that:
- Captures user interactions (clicks, inputs, navigation) during manual story exploration
- Records these as potential test steps
- Feeds interaction data to the test agent for generating play() functions
- Tags stories with metadata: `agent-generated`, `red`, `green`, `needs-review`

```typescript
// Usage in .storybook/preview.ts
import { withConvergeObserver } from '@converge/storybook-addon'

export const decorators = [withConvergeObserver]
```

## The Red-Green Loop (Component Level)

```
1. SPEC — Human selects a story or describes a new component
   → Story file exists (or gets generated) with empty/failing play()
   → Tagged: { converge: 'red' }

2. RED — Test agent writes executable assertions
   → Generates play() function in CSF using @storybook/test
   → Generates companion .sigma BT for cross-browser validation
   → test-runner confirms: FAIL ✗

3. GREEN — Code agent implements the component
   → Modifies component code to satisfy play() assertions
   → test-runner confirms: PASS ✓
   → BT runner confirms: PASS ✓ across browsers
   → Tagged: { converge: 'green' }

4. REFACTOR — Agent or human cleans up
   → Claude Code refactors, tests stay green
   → Visual regression check via postVisit screenshot comparison
```

## Story ↔ Behavior Tree Bridge

The key innovation: bidirectional conversion between Storybook play functions and .sigma behavior trees.

### play() → .sigma (promotion)

```typescript
// Storybook play function (component-level)
export const Primary: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /submit/i }))
    await expect(canvas.getByText('Success')).toBeVisible()
  }
}
```

Converts to:

```xml
<!-- .sigma behavior tree (integration-level) -->
<BehaviorTree ID="Button_Primary_CrossBrowser">
  <Sequence>
    <Navigate url="${storybookUrl}/iframe.html?id=button--primary"/>
    <SmartLocate locator="button[name=submit]"/>
    <RobustClick/>
    <VerifyText expected="Success" mode="contains"/>
  </Sequence>
</BehaviorTree>
```

### .sigma → play() (demotion)

When a BT acceptance test is written first (from requirement), generate the corresponding play function for fast, in-process component testing.

### test-runner postVisit Hook

```typescript
// .storybook/test-runner.ts
import { TestRunnerConfig } from '@storybook/test-runner'
import { bridgeToBT } from '@converge/storybook-addon/test-runner'

const config: TestRunnerConfig = {
  async postVisit(page, context) {
    // After each story passes locally, trigger BT execution
    // for cross-browser validation
    await bridgeToBT(page, context, {
      browsers: ['chromium', 'firefox', 'webkit'],
      generateSigma: true, // auto-generate .sigma from play()
    })
  }
}

export default config
```

## Story Discovery & Agent Context

Storybook exposes `index.json` listing all stories. The grounding agent reads this to understand:
- What components exist and their variants
- Which stories have play functions (already tested)
- Which stories are tagged `needs-test` or `red`
- Story parameters (viewport, theme, locale) for multi-config testing

## Package Structure

```
packages/storybook-addon/
├── src/
│   ├── manager.tsx           # Panel + toolbar registration
│   ├── preview.tsx           # Decorator registration
│   ├── Panel.tsx             # TDD panel component
│   ├── Toolbar.tsx           # Toolbar buttons
│   ├── observer/
│   │   ├── decorator.tsx     # Observer decorator
│   │   └── interaction-recorder.ts
│   ├── bridge/
│   │   ├── play-to-sigma.ts  # play() → .sigma conversion
│   │   ├── sigma-to-play.ts  # .sigma → play() conversion
│   │   └── test-runner-hook.ts
│   ├── channel/
│   │   └── events.ts         # Channel event definitions
│   └── index.ts
├── preset.ts                 # Storybook preset for auto-registration
├── package.json
└── tsconfig.json
```
