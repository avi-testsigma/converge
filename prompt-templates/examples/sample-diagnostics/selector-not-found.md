# Diagnostic Example: Selector Not Found

## sigmascript Output

```
❌ LoginFlowTest — FAIL (8.2s)
   Error: Locator timeout at step 'Locate role="button" name="Sign In"'
   Waited 3000ms for element matching role="button" name="Sign In"
   No matching elements found on the page.
```

## Diagnosis

### LoginFlowTest (FAIL)

**Failing step:** `<Locate role="button" name="Sign In" as="signInBtn" />`

**What happened:** After navigating to `/login`, the test could not find a button with role="button" and accessible name "Sign In". The locator timed out after 3 seconds.

**Root cause:** The login page at `src/app/login/page.tsx` renders the submit button with the text "Log In" instead of "Sign In":

```tsx
// src/app/login/page.tsx, line 34
<button type="submit" className="btn-primary">
  Log In
</button>
```

The test expects `name="Sign In"` but the actual button text is "Log In".

**Decision:** This is a **test-code mismatch**. Since the requirement says "Sign In", the code should match the requirement.

**Suggested fix:**
File: `src/app/login/page.tsx`, line 34

Change the button text to match the requirement:
```tsx
<button type="submit" className="btn-primary">
  Sign In
</button>
```

Alternatively, if "Log In" is intentional, update the test:
```xml
<Locate role="button" name="Log In" as="signInBtn" />
```

**Confidence:** High — the button exists with different text.
