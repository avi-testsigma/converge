---
name: converge-test
description: Generate acceptance tests from a requirement, run them with sigmascript, and diagnose failures. Use this skill when the user wants to generate tests for a feature, run behavior tree tests, or diagnose test failures.
---

# Converge Test — AI Test Generation & Verification

Generate behavior tree acceptance tests from a requirement, verify they fail against current code (red check), run them after implementation, and diagnose failures — all orchestrated through sigmascript CLI.

## Overview

This skill implements **test-first orchestration**: tests are generated from the REQUIREMENT, not from the code. This ensures tests verify intended behavior rather than just documenting what code happens to do.

### Flow

```
/converge-test <requirement>

  1. GROUND    — explore the user's codebase
  2. GENERATE  — write .sigma test files from the requirement
  3. RED CHECK — run tests, verify they all fail (confirms they test new behavior)
  4. REPORT    — present results, suggest what to implement
  5. RUN       — (on demand) re-run tests after user implements the feature
  6. DIAGNOSE  — (on failure) analyze failures, suggest fixes
```

---

## Phase 1: GROUND

Explore the user's codebase to understand context before generating tests.

### What to Look For

Use Glob, Grep, and Read tools to identify:

1. **Framework & build system** — package.json, tsconfig, vite.config, next.config, etc.
2. **Routing** — file-based routes (Next.js pages/, app/), react-router config, etc.
3. **State management** — Redux, Zustand, Context, Vuex, etc.
4. **CSS approach** — Tailwind, CSS modules, styled-components, etc.
5. **Existing test patterns** — test directories, test frameworks, naming conventions
6. **Entry points** — main app component, layout files, index pages
7. **Relevant existing code** — components/pages related to the requirement
8. **Base URL** — dev server URL (check package.json scripts, vite config, etc.)

### Grounding Output

Produce a brief inline summary (do NOT write to a file):

```
## Grounding Summary

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Base URL**: http://localhost:3000
- **Existing tests**: Playwright in tests/, Jest in __tests__/
- **Relevant files**: src/app/settings/page.tsx, src/components/ThemeToggle.tsx
- **Conventions**: kebab-case files, PascalCase components
```

---

## Phase 2: GENERATE

Generate `.sigma` behavior tree test files from the requirement. **Test the behavior described in the requirement, NOT the current code.**

### Key Principles

1. **Requirement-driven**: Tests come from what the user ASKED for, not what exists
2. **Behavioral**: Test user-visible behavior (navigate, click, verify text) not implementation details
3. **Independent**: Each test should be self-contained (navigate to the page, perform actions, verify)
4. **Specific**: Use concrete assertions (exact text, specific URLs, element states)

### File Structure

Write test files to `tests/converge/` in the user's project:

```
tests/
  converge/
    <feature-name>.sigma     # Test file(s)
sigma.config.ts              # Config (create or update)
```

### Writing .sigma Files

Follow the sigma XML format. Refer to `references/node-reference.md` for available nodes, `references/examples.md` for patterns, and `references/gotchas.md` for common mistakes.

#### Basic Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<root main_tree_to_execute="MainTest">
  <BehaviorTree ID="MainTest">
    <Sequence>
      <!-- Test steps here -->
    </Sequence>
  </BehaviorTree>
</root>
```

#### Example: Login Form Test

```xml
<?xml version="1.0" encoding="UTF-8"?>
<root main_tree_to_execute="LoginFormTest">

  <!-- Reusable login step -->
  <BehaviorTree ID="FillLoginForm" params="email, password">
    <Sequence>
      <Locate placeholder="Email" as="emailInput" />
      <Fill element="emailInput" text="${email}" />
      <Locate placeholder="Password" as="passwordInput" />
      <Fill element="passwordInput" text="${password}" />
    </Sequence>
  </BehaviorTree>

  <BehaviorTree ID="LoginFormTest">
    <Sequence>
      <!-- Navigate to login page -->
      <Navigate url="http://localhost:3000/login" />
      <ExpectURL expected="**/login" timeout="5000" />

      <!-- Test: Login form renders -->
      <Locate role="heading" name="Sign In" as="heading" />
      <ExpectVisible element="heading" expectedState="true" timeout="3000" />

      <!-- Test: Form validation — empty submit shows errors -->
      <Locate role="button" name="Sign In" as="submitBtn" />
      <Click element="submitBtn" />
      <ExpectVisible element="heading" expectedState="true" timeout="2000" />

      <!-- Test: Successful login -->
      <StepGroup ID="FillLoginForm" email="user@example.com" password="password123" />
      <Click element="submitBtn" />
      <ExpectURL expected="**/dashboard" timeout="10000" />
    </Sequence>
  </BehaviorTree>
</root>
```

### Multiple Test Cases

For features with multiple scenarios, create either:
- **One file with multiple BehaviorTrees** (related scenarios)
- **Separate files** (independent features)

Each BehaviorTree ID must be unique and should clearly name the scenario.

### sigma.config.ts

Create or update `sigma.config.ts` in the project root:

```typescript
import type { SigmaConfig } from '@testsigmainc/sigmascript';

const config: SigmaConfig = {
  project: {
    baseDir: '.',
    patterns: ['tests/converge/**/*.sigma'],
    platform: 'web',
  },

  browser: {
    type: 'chromium',
    headless: true,
    timeout: 30000,
  },

  screenshots: {
    dir: 'screenshots',
    onFailure: true,
  },

  plans: [
    {
      name: 'converge',
      description: 'Converge-generated acceptance tests',
      tests: [
        // Add entries for each generated test file:
        {
          id: 'LoginFormTest',
          description: 'Login form renders, validates, and authenticates',
          file: 'tests/converge/login-form.sigma',
        },
      ],
    },
  ],

  defaultPlan: 'converge',
  timeout: 60000,
  failFast: false,
  retries: 0,
};

export default config;
```

**Important:** The `id` in each test entry should match the `main_tree_to_execute` in the corresponding .sigma file. The `file` path is relative to `project.baseDir`.

### If sigma.config.ts already exists

- Read the existing config
- Add a `converge` plan if it doesn't exist
- Append new test entries to the existing `converge` plan
- Do NOT overwrite other plans

---

## Phase 3: RED CHECK

After generating tests, run them against the CURRENT code to verify they fail. This is critical — if a test passes without new code, it's either testing existing behavior (vacuous) or wrong.

### Running the Red Check

```bash
cd <project-root> && npx sigmascript test --plan converge --headless
```

**If sigmascript is not installed:** Install it first:
```bash
npm install --save-dev @testsigmainc/sigmascript
```

### Interpreting Results

- **All tests fail** — GOOD. Tests are correctly verifying new behavior. Proceed.
- **Some tests pass** — WARNING. Investigate the passing tests:
  - If they test existing behavior, they're vacuous. Either remove them or note they're regression tests.
  - If they test new behavior but pass, the assertion may be wrong.
- **All tests pass** — PROBLEM. Tests are not testing anything new. Re-examine the requirement and regenerate.

### Red Check Report

Present to the user:

```
## Red Check Results

✅ 6/6 tests fail against current code — tests are valid

| Test | Status | Notes |
|------|--------|-------|
| LoginFormTest | ❌ FAIL | Navigate fails — /login page doesn't exist yet |
| DarkModeToggle | ❌ FAIL | Toggle element not found |
| ... | ... | ... |

These tests verify the requirement. Implement the feature, then run
`/converge-test run` to check your progress.
```

---

## Phase 4: REPORT

After the red check, present a summary:

1. **Tests generated** — list of .sigma files and what they test
2. **Red check status** — all fail (good) or issues found
3. **Implementation hints** — based on grounding, suggest which files to create/modify
4. **Next step** — tell the user to implement the feature, then run `/converge-test run`

---

## Phase 5: RUN (On Demand)

When the user says "run tests", "check if it passes", or invokes `/converge-test run`:

```bash
cd <project-root> && npx sigmascript test --plan converge --headless
```

### Interpreting Results

Present pass/fail per test. For failures, proceed to Phase 6 (DIAGNOSE).

```
## Test Results

4/6 tests pass

| Test | Status | Duration |
|------|--------|----------|
| LoginFormRenders | ✅ PASS | 1.2s |
| LoginValidation | ✅ PASS | 0.8s |
| LoginSuccess | ❌ FAIL | 3.1s |
| LoginRedirect | ❌ FAIL | 5.0s |
```

---

## Phase 6: DIAGNOSE (On Failure)

When tests fail, analyze the failure output and cross-reference with source code.

### Diagnosis Process

1. **Read the sigmascript output** — look for error messages, which step failed, screenshots
2. **Identify the failing node** — which .sigma XML node failed (Navigate, ExpectURL, Locate, etc.)
3. **Cross-reference with code** — Read the relevant source files to understand why
4. **Produce actionable diagnosis**:

```
## Diagnosis

### LoginSuccess (FAIL)

**What failed:** `<ExpectURL expected="**/dashboard" timeout="10000" />`
After clicking submit, the URL did not change to /dashboard.

**Root cause:** The login handler in `src/app/api/auth/route.ts` returns a
JSON response but doesn't trigger a redirect. The client-side `onSubmit`
handler in `src/app/login/page.tsx` doesn't call `router.push('/dashboard')`
after a successful response.

**Suggested fix:**
In `src/app/login/page.tsx`, after the fetch succeeds, add:
```typescript
router.push('/dashboard');
```

**Files to modify:**
- `src/app/login/page.tsx` (line ~45, onSubmit handler)
```

---

## Critical Rules

### DO
- Generate tests from the REQUIREMENT, not from existing code
- Use `Locate` with semantic selectors (role, placeholder, text) over CSS selectors
- Include proper timeouts on waits and assertions
- Make each test self-contained (navigate to the page first)
- Use `StepGroup` for reusable sequences (login flows, form fills)
- Verify state between actions (don't assume instant updates)
- Use `<Parallel>` for events that race (dialogs, new pages)

### DON'T
- Don't test implementation details (internal state, function calls)
- Don't use `WaitForTimeout` — use explicit waits (`ExpectVisible`, `ExpectURL`, etc.)
- Don't assume element structure — locate by accessible attributes
- Don't hardcode absolute paths in .sigma files
- Don't generate tests that test already-existing behavior (that's what red check catches)
- Don't overwrite existing sigma.config.ts plans — only add/update the `converge` plan

### Node Syntax Quick Reference

See `references/node-reference.md` for the complete reference. Key nodes:

**Navigation:** `Navigate`, `Reload`, `GoBack`, `GoForward`
**Location:** `Locate` (by role, placeholder, text, testId, css, xpath), `LocateElement`
**Actions:** `Click`, `Fill`, `Clear`, `Press`, `Check`, `Hover`, `SelectOption`
**Assertions:** `ExpectVisible`, `ExpectText`, `ExpectURL`, `ExpectTitle`, `ExpectCount`, `ExpectValue`, `AssertValue`
**Data:** `GetText`, `GetAttribute`, `GetValue`, `GetTitle`, `GetCurrentURL`
**Control:** `Sequence`, `Selector`, `Parallel`, `Conditional`, `ForEach`, `While`
**Decorators:** `RetryUntilSuccessful`, `Timeout`, `Delay`, `Invert`, `ForceSuccess`
**Other:** `Screenshot`, `HandleDialog`, `WaitForNewPage`, `SwitchToPage`

---

## Reference Files

The following reference files contain detailed documentation:

- `references/node-reference.md` — Complete attribute reference for all BT nodes
- `references/examples.md` — Real-world test patterns and examples
- `references/gotchas.md` — 18 common pitfalls and their solutions
- `references/validation.md` — Validation layers and error types
- `references/web-app-patterns.md` — Web application E2E testing patterns
- `references/workspace-patterns.md` — Project structure, element registry, test data profiles
