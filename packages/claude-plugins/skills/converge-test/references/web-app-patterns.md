# Web App E2E Patterns (Groot / Testsigma Frontend)

Patterns specific to testing web applications with Sigma, learned from the groot sigma-e2e setup.

---

## Cross-Domain Login Flow

When your app redirects to a separate identity/SSO service for login:

```xml
<BehaviorTree ID="Login">
  <Sequence>
    <!-- 1. Navigate to app (will redirect to identity service) -->
    <Navigate url="http://dev.testsigma.com" wait_until="domcontentloaded"/>

    <!-- 2. Fill login on identity domain (dev-id.testsigma.com) -->
    <Locate placeholder="name@company.com" as="emailInput" timeout="10000"/>
    <Fill element="emailInput" text="rachel@testsigma.com"/>
    <Locate placeholder="Enter Password" as="passwordInput" timeout="5000"/>
    <Fill element="passwordInput" text="testsigma"/>

    <!-- 3. Click sign in -->
    <Locate role="button" name="Sign in" as="signInBtn" timeout="5000"/>
    <Click element="signInBtn"/>

    <!-- 4. Wait for redirect BACK to main app (use FULL domain to avoid matching identity URL) -->
    <WaitForURL url="http://dev.testsigma.com/ui/**" timeout="30000"/>

    <!-- 5. Verify dashboard loaded (use role+name to avoid strict mode violation) -->
    <Locate role="link" name="Dashboard" as="dashboardLink" timeout="30000"/>
    <ExpectVisible element="dashboardLink"/>
  </Sequence>
</BehaviorTree>
```

### Key Lessons
- Use `placeholder` to locate form inputs (more stable than CSS selectors)
- Use full domain in `WaitForURL` to avoid matching the identity service URL
- Use `role="link" name="X"` instead of `text="X"` when text appears in multiple places

---

## Reusable Login via StepGroup

Define login once, reuse across tests:

```xml
<root main_tree_to_execute="MainTest">
  <!-- Define reusable login tree -->
  <BehaviorTree ID="Login">
    <Sequence>
      <Navigate url="http://dev.testsigma.com" wait_until="domcontentloaded"/>
      <Locate placeholder="name@company.com" as="emailInput" timeout="10000"/>
      <Fill element="emailInput" text="rachel@testsigma.com"/>
      <Locate placeholder="Enter Password" as="passwordInput" timeout="5000"/>
      <Fill element="passwordInput" text="testsigma"/>
      <Locate role="button" name="Sign in" as="signInBtn" timeout="5000"/>
      <Click element="signInBtn"/>
      <WaitForURL url="http://dev.testsigma.com/ui/**" timeout="30000"/>
      <Locate role="link" name="Dashboard" as="dashboardLink" timeout="30000"/>
      <ExpectVisible element="dashboardLink"/>
    </Sequence>
  </BehaviorTree>

  <!-- Main test references login via StepGroup -->
  <BehaviorTree ID="MainTest">
    <Sequence>
      <StepGroup ID="Login"/>
      <!-- Test steps after login -->
      <Navigate url="http://dev.testsigma.com/ui/some-page" wait_until="domcontentloaded"/>
    </Sequence>
  </BehaviorTree>
</root>
```

---

## Handling Ambiguous Text Matches

When `text="X"` matches multiple elements (strict mode violation):

### Strategy 1: Use role + name
```xml
<!-- Instead of text="Dashboard" (matches nav link + page title) -->
<Locate role="link" name="Dashboard" as="dashboardLink"/>
```

### Strategy 2: Use combined text
```xml
<!-- Instead of clicking "Chrome" then "Latest" separately -->
<Locate text="Chrome Latest" as="chromeLatest"/>
<Click element="chromeLatest"/>
```

### Strategy 3: Use First/Nth for collection
```xml
<Locate text="Latest" as="allLatest"/>
<First elements="allLatest" as="firstLatest"/>
<Click element="firstLatest"/>
```

### Strategy 4: Use Within to scope
```xml
<Locate css=".dialog" as="dialog"/>
<Within element="dialog">
  <Locate text="Submit" as="submitBtn"/>
  <Click element="submitBtn"/>
</Within>
```

---

## Ad-Hoc Run Dialog Pattern

Triggering a test execution through the Testsigma UI:

```xml
<!-- Navigate to test case -->
<Navigate url="http://dev.testsigma.com/ui/td/5/cases/filters/1" wait_until="domcontentloaded"/>

<!-- Verify test case loaded -->
<Locate text="Login [IF condition]" as="testCaseTitle" timeout="10000"/>
<ExpectVisible element="testCaseTitle"/>

<!-- Click Run button -->
<Locate role="button" name="Run" as="runBtn" timeout="5000"/>
<Click element="runBtn"/>

<!-- Wait for Ad-Hoc Run dialog -->
<Locate text="Ad-Hoc Run" as="dialogTitle" timeout="5000"/>
<ExpectVisible element="dialogTitle"/>

<!-- Select browser (use combined text to avoid ambiguity) -->
<Locate text="Chrome Latest" as="chromeLatest" timeout="5000"/>
<Click element="chromeLatest"/>

<!-- Click Run Now -->
<Locate role="button" name="Run Now" as="runNowBtn" timeout="5000"/>
<Click element="runNowBtn"/>

<!-- Wait for execution page -->
<WaitForURL url="**/dry_run/**" timeout="10000"/>

<!-- Wait for execution to complete (Re-Run button appears when done) -->
<Locate role="button" name="Re-Run" as="reRunBtn" timeout="120000"/>
<ExpectVisible element="reRunBtn"/>
```

---

## sigma.config.ts Patterns

### Separate Plans for Different Scopes

```typescript
const config: SigmaConfig = {
  project: {
    baseDir: './tests',
    patterns: ['**/*.sigma'],
    platform: 'web',
  },
  browser: {
    type: 'chromium',
    headless: false,  // Set true for CI
    viewport: { width: 1280, height: 720 },
  },
  plans: [
    {
      name: 'smoke',
      description: 'Quick login verification',
      tests: [{ id: 'LoginFlow', file: 'auth/login.sigma', timeout: 60000 }],
    },
    {
      name: 'execute-test',
      description: 'Full execution flow',
      tests: [{ id: 'RunTestCase', file: 'execution/run-test-case.sigma', timeout: 120000 }],
    },
  ],
  defaultPlan: 'smoke',
  timeout: 120000,
};
```

### Key Config Notes
- Tests within a plan share the same browser instance (by design)
- Use separate plans for tests that need independent browser state
- Set generous timeouts for execution flows (120s+)
- Use `headless: true` for CI, `false` for local debugging
