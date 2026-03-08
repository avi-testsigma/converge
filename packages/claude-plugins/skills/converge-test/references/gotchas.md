# Sigma XML Gotchas and Best Practices

Critical patterns and anti-patterns when writing Sigma behavior tree tests.

---

## 1. Race Conditions

### The Problem

When an action triggers an event (new page, dialog, navigation), the event may fire before your listener is ready.

### Event-Based Operations

These operations MUST use `Parallel` to ensure the listener is ready before the trigger:

| Trigger | Listener | Pattern |
|---------|----------|---------|
| Click that opens new tab | WaitForNewPage | Parallel |
| Click that shows alert | HandleDialog | Parallel |
| Click that triggers navigation | ExpectURL | Sequence OK |
| Form submit | ExpectURL | Sequence OK |

### New Page/Tab Pattern

```xml
<!-- WRONG: Sequential causes race condition -->
<Sequence>
  <Click element="newTabLink" />
  <WaitForNewPage as="_newPage" />  <!-- Event fires before listener! -->
</Sequence>

<!-- CORRECT: Listener active before trigger -->
<Sequence>
  <Parallel strategy="strict">
    <WaitForNewPage as="_newPage" timeout="10000" />
    <Click element="newTabLink" />
  </Parallel>
  <SwitchToPage pageRef="_newPage" />
</Sequence>
```

### Dialog Pattern

```xml
<!-- WRONG -->
<Sequence>
  <Click element="deleteBtn" />
  <HandleDialog action="accept" />  <!-- Dialog may already be gone! -->
</Sequence>

<!-- CORRECT -->
<Parallel strategy="strict">
  <HandleDialog action="accept" timeout="5000" />
  <Click element="deleteBtn" />
</Parallel>
```

### Download Pattern

```xml
<!-- Start download and wait for it -->
<Parallel strategy="strict">
  <WaitForDownload as="download" timeout="30000" />
  <Click element="downloadBtn" />
</Parallel>
```

---

## 2. Async State Verification

### The Problem

Actions that trigger JavaScript handlers don't wait for those handlers to complete.

### What Actions Auto-Wait For

| Action | Waits For | Does NOT Wait For |
|--------|-----------|-------------------|
| Click | Element clickable | onclick handler completion |
| Fill | Element fillable | input/change event handlers |
| Press | Element focusable | keydown/keyup handlers |
| Navigate | Initial page load | SPA routing completion |

### Pattern: Action → Verify State → Continue

```xml
<!-- WRONG: Rapid actions without verification -->
<Click element="addToCart" />
<Click element="checkout" />
<Fill element="email" value="test@example.com" />

<!-- CORRECT: Verify each state transition -->
<Click element="addToCart" />
<ExpectText element="cartCount" expected="1" timeout="3000" />

<Click element="checkout" />
<ExpectVisible element="checkoutForm" expectedState="true" timeout="5000" />

<Fill element="email" value="test@example.com" />
<ExpectValue element="email" expected="test@example.com" />
```

### Pattern: Loading States

```xml
<!-- Wait for loading to START then FINISH -->
<Click element="loadDataBtn" />
<ExpectVisible element="spinner" expectedState="true" timeout="1000" />
<ExpectVisible element="spinner" expectedState="false" timeout="30000" />
<ExpectVisible element="dataTable" expectedState="true" timeout="1000" />
```

### Pattern: Form Submission

```xml
<Fill element="username" text="admin" />
<Fill element="password" text="secret" />
<Click element="submitBtn" />

<!-- Wait for navigation OR error message -->
<Selector>
  <ExpectURL expected="**/dashboard" timeout="10000" />
  <Sequence>
    <ExpectVisible element="errorMsg" expectedState="true" timeout="10000" />
    <ForceFailure>
      <LogMessage level="error" message="Login failed - error displayed" />
    </ForceFailure>
  </Sequence>
</Selector>
```

---

## 3. Blackboard Variable Management

### The Problem

Blackboard variables are global within a tree. Careless naming causes data loss.

### Variable Naming Rules

1. **Use unique, descriptive names**
2. **Prefix with underscore for temporary/internal vars**: `_tempElement`
3. **Never reuse output keys for different data**

```xml
<!-- WRONG: Variable overwriting -->
<GetText element="firstName" outputKey="name" />
<GetText element="lastName" outputKey="name" />  <!-- firstName is lost! -->
<LogMessage message="Name: ${name}" />  <!-- Only shows lastName -->

<!-- CORRECT: Unique names -->
<GetText element="firstName" outputKey="firstName" />
<GetText element="lastName" outputKey="lastName" />
<LogMessage message="Name: ${firstName} ${lastName}" />
```

### Scoped Variables in Loops

```xml
<ForEach collection="items" item="currentItem" index="itemIndex">
  <!-- currentItem and itemIndex are scoped to this iteration -->
  <GetText element="currentItem" outputKey="itemText_${itemIndex}" />
</ForEach>
```

---

## 4. Timeout Anti-Patterns

### The Problem

Fixed timeouts (WaitForTimeout) are unreliable and slow tests down.

### Why WaitForTimeout is Bad

1. **Too short**: Test fails on slow systems
2. **Too long**: Wastes time when things are fast
3. **No feedback**: Doesn't tell you what you're waiting for

```xml
<!-- WRONG: Fixed timeout -->
<Click element="submitBtn" />
<WaitForTimeout duration="5" />  <!-- Always waits 5 seconds! -->
<GetText element="result" outputKey="result" />

<!-- CORRECT: Web-first assertion -->
<Click element="submitBtn" />
<ExpectVisible element="result" expectedState="true" timeout="10000" />
<GetText element="result" outputKey="result" />
```

### When Timeouts MIGHT Be Acceptable

1. **Debounced inputs**: Waiting for debounce to trigger
2. **Rate limiting**: Respecting API rate limits
3. **Animation completion**: When no other signal available

```xml
<!-- Debounced search - acceptable timeout -->
<Fill element="searchInput" text="query" />
<WaitForTimeout duration="0.5" />  <!-- Wait for 500ms debounce -->
<ExpectVisible element="searchResults" expectedState="true" timeout="5000" />
```

---

## 5. Locator Best Practices

### Priority Order (Most to Least Reliable)

1. **testId**: `<Locate testId="submit-btn" />`
2. **role + name**: `<Locate role="button" name="Submit" />`
3. **text**: `<Locate text="Submit" />`
4. **css (semantic)**: `<Locate css="button[type='submit']" />`
5. **css (structural)**: `<Locate css=".form > .buttons > button:first-child" />`
6. **xpath**: Last resort

### Avoid Brittle Locators

```xml
<!-- WRONG: Depends on DOM structure -->
<Locate css="body > div:nth-child(2) > form > div:nth-child(5) > button" />

<!-- CORRECT: Semantic locator -->
<Locate testId="login-submit-btn" />
<!-- or -->
<Locate role="button" name="Log In" />
```

### Use Scoping to Simplify

```xml
<!-- Instead of long selectors -->
<Locate css=".user-profile .settings-panel .notification-toggle" />

<!-- Use scoping -->
<Locate css=".user-profile" as="profile" />
<Within element="profile">
  <Locate css=".settings-panel" as="settings" />
  <Within element="settings">
    <Locate css=".notification-toggle" as="toggle" />
    <Click element="toggle" />
  </Within>
</Within>
```

---

## 6. Parallel vs Sequence

### When to Use Sequence

- Operations that depend on each other
- Operations that must happen in order
- Most test steps

```xml
<Sequence>
  <Navigate url="https://example.com" />  <!-- Must complete first -->
  <Locate css="#login" as="btn" />         <!-- Needs page loaded -->
  <Click element="btn" />                   <!-- Needs element found -->
</Sequence>
```

### When to Use Parallel

- Event listeners + triggers (dialogs, new pages)
- Truly independent operations (rare in tests)
- Multiple waits that could complete in any order

```xml
<!-- Event pattern -->
<Parallel strategy="strict">
  <WaitForNewPage as="popup" timeout="10000" />
  <Click element="openPopup" />
</Parallel>

<!-- Multiple independent checks -->
<Parallel strategy="strict">
  <ExpectVisible element="header" expectedState="true" />
  <ExpectVisible element="footer" expectedState="true" />
  <ExpectVisible element="sidebar" expectedState="true" />
</Parallel>
```

### Never Use Parallel For

```xml
<!-- WRONG: Dependencies in parallel -->
<Parallel>
  <Fill element="username" text="admin" />
  <Fill element="password" text="secret" />  <!-- May run before username! -->
  <Click element="submit" />                  <!-- May run before fills! -->
</Parallel>
```

---

## 7. Error Recovery Patterns

### Soft Assertions (Continue on Failure)

```xml
<ForceSuccess>
  <Sequence>
    <Screenshot path="before-action.png" />
    <ExpectVisible element="optionalBanner" expectedState="true" timeout="1000" />
    <Click element="optionalBanner" />
  </Sequence>
</ForceSuccess>
<!-- Test continues even if banner isn't there -->
```

### Retry Flaky Operations

```xml
<RetryUntilSuccessful num_attempts="3" delay_ms="1000">
  <Sequence>
    <Click element="flakyButton" />
    <ExpectText element="result" expected="Success" timeout="5000" />
  </Sequence>
</RetryUntilSuccessful>
```

### Recovery Blocks (Try/Catch)

```xml
<Recovery>
  <Recovery.Try>
    <Click element="primaryPath" />
    <ExpectURL expected="**/success" timeout="5000" />
  </Recovery.Try>
  <Recovery.Catch>
    <Screenshot path="error-state.png" />
    <Click element="fallbackPath" />
  </Recovery.Catch>
  <Recovery.Finally>
    <LogMessage level="info" message="Operation completed" />
  </Recovery.Finally>
</Recovery>
```

---

## 8. Nth Index Gotcha

### The Problem

`Nth` node supports both 0-based and 1-based indexing.

```xml
<!-- Default is 1-based (matches human counting) -->
<Nth elements="items" index="1" as="firstItem" />   <!-- Gets item 1 -->
<Nth elements="items" index="2" as="secondItem" />  <!-- Gets item 2 -->

<!-- Explicit 0-based -->
<Nth elements="items" index="0" indexBase="0" as="firstItem" />  <!-- Gets item 1 -->
<Nth elements="items" index="1" indexBase="0" as="secondItem" /> <!-- Gets item 2 -->
```

### Recommendation

Always be explicit about indexBase when working with dynamic indices:

```xml
<!-- When index comes from test data -->
<Nth elements="rows" index="${rowIndex}" indexBase="1" as="targetRow" />
```

---

## 9. Element Reference Lifetime

### The Problem

Stored element references can become stale if the DOM changes.

```xml
<!-- RISKY: Long gap between locate and use -->
<Locate css=".item" as="items" />
<Click element="refreshBtn" />  <!-- DOM may change! -->
<ExpectText element="loadingSpinner" expectedState="false" timeout="10000" />
<Click element="items" />  <!-- items reference may be stale! -->

<!-- BETTER: Re-locate after DOM changes -->
<Locate css=".item" as="items" />
<Click element="refreshBtn" />
<ExpectText element="loadingSpinner" expectedState="false" timeout="10000" />
<Locate css=".item" as="items" />  <!-- Re-locate -->
<Click element="items" />
```

---

## 10. Debugging Tips

### Use LogMessage Liberally

```xml
<Sequence>
  <LogMessage level="info" message="Starting login flow" />
  <Fill element="username" text="${username}" />
  <LogMessage level="debug" message="Username filled: ${username}" />
  <Fill element="password" text="***" />
  <LogMessage level="debug" message="Password filled" />
  <Click element="submitBtn" />
  <LogMessage level="info" message="Login submitted, waiting for redirect" />
</Sequence>
```

### Capture State on Failure

```xml
<Recovery>
  <Recovery.Try>
    <Sequence>
      <!-- Test steps -->
    </Sequence>
  </Recovery.Try>
  <Recovery.Catch>
    <Sequence>
      <Screenshot path="failure-${timestamp}.png" />
      <GetCurrentURL outputKey="failureUrl" />
      <LogMessage level="error" message="Failed at URL: ${failureUrl}" />
    </Sequence>
  </Recovery.Catch>
</Recovery>
```

### Use ResumePoint for Long Tests

```xml
<Sequence>
  <Step name="Setup">
    <!-- Setup steps -->
  </Step>

  <ResumePoint id="after-setup" />  <!-- Can resume from here -->

  <Step name="Main Test">
    <!-- Main test steps -->
  </Step>

  <ResumePoint id="after-main" />

  <Step name="Cleanup">
    <!-- Cleanup steps -->
  </Step>
</Sequence>
```

---

## 11. WaitForURL vs ExpectURL Attribute Names

### The Problem

`WaitForURL` and `ExpectURL` use different attribute names for the URL pattern. Getting them wrong silently fails (the attribute is ignored and the node waits for `undefined`).

```xml
<!-- WRONG: WaitForURL uses 'url', NOT 'expected' -->
<WaitForURL expected="**/dashboard" timeout="10000" />
<!-- This waits for URL to match 'undefined' - will always timeout! -->

<!-- CORRECT -->
<WaitForURL url="**/dashboard" timeout="10000" />

<!-- ExpectURL uses 'expected' - this is correct -->
<ExpectURL expected="**/dashboard" timeout="10000" />
```

### Quick Reference

| Node | Attribute | Example |
|------|-----------|---------|
| WaitForURL | `url` | `<WaitForURL url="**/dashboard" />` |
| ExpectURL | `expected` | `<ExpectURL expected="**/dashboard" />` |

---

## 12. Strict Mode Violations with text Locator

### The Problem

Playwright uses strict mode by default. When `Locate text="X"` matches multiple elements, subsequent actions (Click, ExpectVisible) fail with a strict mode violation.

```xml
<!-- WRONG: "Dashboard" appears in both nav link and page heading -->
<Locate text="Dashboard" as="dashboard" />
<ExpectVisible element="dashboard" />
<!-- Error: strict mode violation: getByText('Dashboard') resolved to 2 elements -->

<!-- CORRECT: Use role+name for specificity -->
<Locate role="link" name="Dashboard" as="dashboardLink" />
<ExpectVisible element="dashboardLink" />

<!-- Or use First to get the first match -->
<Locate text="Dashboard" as="dashboardAll" />
<First elements="dashboardAll" as="dashboard" />
<ExpectVisible element="dashboard" />
```

### Common Multi-Match Scenarios

| Text | Why Multiple | Fix |
|------|-------------|-----|
| "Dashboard" | Nav link + page heading | `role="link" name="Dashboard"` |
| "Latest" | Multiple version dropdowns | Use combined text like `text="Chrome Latest"` |
| "Submit" | Multiple forms on page | Use `Within` to scope, or `role="button" name="Submit"` |
| "Close" | Multiple modals/dialogs | Scope with `Within` parent element |

---

## 13. Cross-Domain URL Pattern Matching

### The Problem

Glob patterns like `**/path/**` match ANY domain. This is dangerous when your app redirects through different domains (e.g., identity service login).

```xml
<!-- WRONG: Matches identity domain too early -->
<WaitForURL url="**/ui/**" timeout="30000" />
<!-- Matches http://dev-id.testsigma.com/ui/login BEFORE the redirect completes! -->

<!-- CORRECT: Include the full domain to match only the target -->
<WaitForURL url="http://dev.testsigma.com/ui/**" timeout="30000" />
```

### When This Happens

- Login flows that redirect through SSO/identity services
- OAuth flows through third-party providers
- Any multi-domain redirect chain

### Pattern

```xml
<!-- Navigate to app (redirects to identity for login) -->
<Navigate url="http://app.example.com" />
<!-- Fill login on identity.example.com -->
<Locate placeholder="Email" as="email" />
<Fill element="email" text="user@example.com" />
<Click element="submitBtn" />
<!-- Wait for redirect BACK to main app - use full domain -->
<WaitForURL url="http://app.example.com/**" timeout="30000" />
```

---

## 14. Shared Browser State in Plans

### The Problem

Tests within the same plan share a browser instance (by design, for state preservation). If Test A logs in, Test B starts already logged in.

```
Plan: all
  Test 1: LoginFlow  → Logs in, lands on dashboard ✅
  Test 2: RunTestCase → StepGroup Login tries to log in again ❌
                         (login form not found - already logged in!)
```

### Solutions

**Option A: Separate plans for independent tests**
```typescript
plans: [
  { name: 'smoke', tests: [{ id: 'LoginFlow', file: 'auth/login.sigma' }] },
  { name: 'execute', tests: [{ id: 'RunTestCase', file: 'execution/run.sigma' }] },
]
```

**Option B: Don't duplicate login in "all" plan**
```typescript
// RunTestCase already includes login via StepGroup
plans: [
  { name: 'all', tests: [{ id: 'RunTestCase', file: 'execution/run.sigma' }] },
]
```

**Option C: Make login StepGroup handle already-logged-in state**
Use `Selector` (try login form first, fall back to checking dashboard):
```xml
<BehaviorTree ID="Login">
  <Selector>
    <!-- Try normal login flow -->
    <Sequence>
      <Navigate url="http://app.example.com" />
      <Locate placeholder="Email" as="email" timeout="3000" />
      <Fill element="email" text="user@example.com" />
      <Locate placeholder="Password" as="pass" />
      <Fill element="pass" text="secret" />
      <Click element="submitBtn" />
      <WaitForURL url="http://app.example.com/ui/**" timeout="30000" />
    </Sequence>
    <!-- Already logged in - just verify dashboard -->
    <Sequence>
      <WaitForURL url="http://app.example.com/ui/**" timeout="5000" />
      <Locate role="link" name="Dashboard" as="dash" timeout="5000" />
      <ExpectVisible element="dash" />
    </Sequence>
  </Selector>
</BehaviorTree>
```

---

## 15. Script vs EvaluateScript Confusion

### The Problem

`Script` and `EvaluateScript` run JavaScript in completely different contexts. Using the wrong one silently produces unexpected results.

| Node | Execution Context | Has Access To |
|------|------------------|---------------|
| `Script` | Node.js (BT runtime) | Blackboard (test variables) |
| `EvaluateScript` | Browser (page.evaluate) | DOM, window, document |

```xml
<!-- WRONG: Trying to access DOM in Script (runs in Node.js, not browser) -->
<Script><![CDATA[
  const el = document.querySelector('.price'); // undefined!
  blackboard.set('price', el.textContent);
]]></Script>

<!-- CORRECT: Use EvaluateScript for DOM access -->
<EvaluateScript outputKey="price"><![CDATA[
  return document.querySelector('.price').textContent;
]]></EvaluateScript>

<!-- WRONG: Trying to access blackboard in EvaluateScript -->
<EvaluateScript><![CDATA[
  blackboard.set('result', 42); // blackboard is not defined!
]]></EvaluateScript>

<!-- CORRECT: Use Script for blackboard manipulation -->
<Script><![CDATA[
  blackboard.set('result', 42);
]]></Script>
```

### When to Use Each

- **Script**: Data manipulation, conditional logic, computing values from blackboard variables
- **EvaluateScript**: Reading computed styles, scrollHeight, executing browser-side JS, interacting with browser APIs

---

## 16. CDATA Required for JavaScript in XML

### The Problem

JavaScript often contains characters that are special in XML (`<`, `>`, `&`, quotes). Without CDATA, the XML parser breaks.

```xml
<!-- WRONG: XML parser chokes on < and & -->
<Script>
  if (count < 10 && status === "active") { return true; }
</Script>
<!-- Parse error: '<' not expected here -->

<!-- CORRECT: Wrap in CDATA -->
<Script><![CDATA[
  if (count < 10 && status === "active") { return true; }
]]></Script>
```

### Rule

Always use `<![CDATA[...]]>` for `Script` and `EvaluateScript` nodes, even for simple code. It prevents future breakage if the script is later modified to include special characters.

---

## 17. LocateElement Requires Element Registry

### The Problem

`LocateElement` resolves elements from the element registry (`elements.sigma`). If the element ID doesn't exist in the registry, it fails at runtime.

```xml
<!-- WRONG: Using LocateElement without a registry definition -->
<LocateElement ID="my-button" as="_btn" />
<!-- Error: Element 'my-button' not found in registry -->

<!-- CORRECT for hand-written tests: Use Locate directly -->
<Locate role="button" name="Submit" as="_btn" />

<!-- CORRECT with registry: Ensure elements.sigma has the definition -->
<!-- elements.sigma -->
<BehaviorTree ID="my-button">
  <Locate role="button" name="Submit" as="_el" />
</BehaviorTree>
<!-- test.sigma -->
<LocateElement ID="my-button" as="_btn" />
```

### When to Use Each

- **`Locate`**: Hand-written tests, quick prototypes, unique elements
- **`LocateElement`**: Large test suites with shared elements, platform-managed tests

---

## 18. ForEach collectionProfileId vs collection

### The Problem

`ForEach` has two modes: iterating over DOM element collections vs test data profile sets. Using the wrong attribute causes silent failures.

```xml
<!-- Iterating over DOM elements (collection of Playwright locators) -->
<Locate css=".item" as="items" />
<ForEach collection="items" item="currentItem" index="i">
  <Click element="currentItem" />
</ForEach>

<!-- Iterating over test data profile sets -->
<ForEach collectionProfileId="LoginCredentials" item="currentSet" index="i">
  <Fill element="_emailInput" text="${testData['username']}" />
</ForEach>
```

Don't confuse them - `collection` references a blackboard variable containing elements, while `collectionProfileId` references a test data profile by name.
