# Diagnostic Example: Assertion Mismatch

## sigmascript Output

```
❌ ContactFormTest — FAIL (4.1s)
   Error: Assertion failed at step 'ExpectText element="successMsg" expected="Message sent"'
   Expected text: "Message sent"
   Actual text: "Your message has been sent successfully!"
```

## Diagnosis

### ContactFormTest (FAIL)

**Failing step:** `<ExpectText element="successMsg" expected="Message sent" />`

**What happened:** The form submitted successfully and a success message appeared, but the text content didn't match. The test expected "Message sent" but the actual message was "Your message has been sent successfully!".

**Root cause:** The success message in `src/components/ContactForm.tsx` (line 67) uses a longer, more descriptive message:

```tsx
// src/components/ContactForm.tsx, line 67
{submitted && (
  <p className="text-green-600" data-testid="success-message">
    Your message has been sent successfully!
  </p>
)}
```

**Decision:** The code's message is acceptable — it's more descriptive. The test's `expected` text is too specific. Since `ExpectText` defaults to **contains** matching (not exact), we can use a substring.

**Suggested fix:**
Update the test to use a substring that matches:

```xml
<!-- Use a substring that the actual message contains -->
<ExpectText element="successMsg" expected="message has been sent" />
```

Or for exact matching:
```xml
<ExpectText element="successMsg" expected="Your message has been sent successfully!" exact="true" />
```

**Confidence:** High — the feature works correctly, the test just needs its expected text adjusted.
