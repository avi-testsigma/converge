# Diagnostic Example: Timeout / Missing Redirect

## sigmascript Output

```
❌ LoginFlowTest — FAIL (10.3s)
   Error: Timeout at step 'ExpectURL expected="**/dashboard" timeout="10000"'
   Current URL: http://localhost:3000/login
   Expected URL pattern: **/dashboard
   Timed out after 10000ms
```

## Diagnosis

### LoginFlowTest (FAIL)

**Failing step:** `<ExpectURL expected="**/dashboard" timeout="10000" />`

**What happened:** After filling in valid credentials and clicking the Sign In button, the URL remained at `/login` instead of changing to `/dashboard`. The test waited 10 seconds for the redirect but it never happened.

**Root cause:** Traced through two files:

1. The API route `src/app/api/auth/login/route.ts` correctly validates credentials and returns a JSON response with `{ success: true, user: {...} }` (line 23).

2. The client-side handler in `src/app/login/page.tsx` (line 42-48) receives the successful response and stores the user data, but **never triggers a navigation**:

```tsx
// src/app/login/page.tsx, lines 42-48
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  const res = await fetch('/api/auth/login', { method: 'POST', body: formData });
  const data = await res.json();
  if (data.success) {
    setUser(data.user);  // ← stores user but doesn't redirect
  }
};
```

The `setUser` call updates state but there's no `router.push('/dashboard')` after it.

**Suggested fix:**
File: `src/app/login/page.tsx`, line ~47

Add redirect after successful login:
```tsx
if (data.success) {
  setUser(data.user);
  router.push('/dashboard');  // ← add this line
}
```

Make sure `useRouter` is imported:
```tsx
import { useRouter } from 'next/navigation';
// ... inside component:
const router = useRouter();
```

**Confidence:** High — the authentication succeeds (API returns success), the issue is purely a missing client-side redirect.
