# GradeVue Security Review

**Date:** April 12, 2026
**Scope:** Full application (client + server)

---

## Critical Issues

### 1. Plain-text credentials in sessionStorage
**Location:** `client/src/lib/gradeContext.tsx` (line ~349)
**Risk:** HIGH
**Description:** User's StudentVue password is stored in plain text in `sessionStorage`. Any XSS vulnerability or browser extension with storage access could exfiltrate the password.
**Recommendation:** Avoid storing the password client-side entirely. Use a server-side session (cookie-based, httpOnly, secure) so the password never persists in the browser.

### 2. Credentials re-sent on every API call
**Location:** `client/src/pages/attendance.tsx`, `documents.tsx`, `messages.tsx`, `settings.tsx`
**Risk:** HIGH
**Description:** Each API call (attendance, documents, messages, refresh) sends full credentials (including password) in the POST body. This multiplies the exposure surface — any intercepted request leaks the password.
**Recommendation:** Implement server-side sessions. After initial login, issue a session token (httpOnly cookie). Subsequent API calls use the session token, not raw credentials.

### 3. XML injection in SOAP requests (client-side)
**Location:** `client/src/lib/studentvue-client.ts` (line ~64-76)
**Risk:** MEDIUM
**Description:** Username and password are interpolated directly into SOAP XML without escaping XML special characters (`&`, `"`, `'`, `<`, `>`). A username or password containing these characters could break the XML or potentially be used for XML injection.
**Recommendation:** XML-escape all user inputs before interpolation into the SOAP envelope (e.g., `&` → `&amp;`, `<` → `&lt;`, etc.).

---

## Medium Issues

### 4. No server-side rate limiting on login endpoint
**Location:** `server/routes.ts` (line ~114)
**Risk:** MEDIUM
**Description:** The `/api/studentvue/login` endpoint has no rate limiting. An attacker could brute-force credentials at high speed, potentially locking out the user's StudentVue account.
**Recommendation:** Add rate limiting (e.g., `express-rate-limit`) — max 5 attempts per IP per minute on the login endpoint.

### 5. No CSRF protection
**Location:** All POST endpoints in `server/routes.ts`
**Risk:** MEDIUM
**Description:** API endpoints accept POST requests without CSRF token validation. While the `X-Requested-With: XMLHttpRequest` header is sent by some client calls, the server doesn't verify it. A malicious page could submit login credentials on behalf of a user.
**Recommendation:** Validate the `X-Requested-With` header server-side, or implement a CSRF token flow.

### 6. Gradebook data stored unencrypted in localStorage
**Location:** `client/src/lib/gradeContext.tsx` (line ~334)
**Risk:** MEDIUM
**Description:** Full gradebook data (grades, teacher names, student info, student ID) is stored in `localStorage` as plain JSON. This data persists after the browser tab is closed and is accessible to any script running on the same origin.
**Recommendation:** Store in `sessionStorage` instead (clears on tab close), or encrypt with a session-derived key.

### 7. Error responses may leak internal details
**Location:** `server/routes.ts` — multiple endpoints
**Risk:** LOW-MEDIUM
**Description:** Error responses include a `details` field containing raw error messages from the StudentVue library or Node.js internals. These could reveal server-side library versions, stack traces, or internal architecture to attackers.
**Recommendation:** Remove the `details` field from production error responses. Log the details server-side only.

---

## Low Issues

### 8. No input length/format validation on server
**Location:** `server/routes.ts` (line ~116-123)
**Risk:** LOW
**Description:** Server only checks for presence of `district`, `username`, `password` but doesn't validate length, format, or character restrictions. Extremely long inputs could cause performance issues.
**Recommendation:** Validate: district must be a valid URL (max 500 chars), username max 100 chars, password max 500 chars.

### 9. documentGU parameter not validated
**Location:** `server/routes.ts` (line ~498-501)
**Risk:** LOW
**Description:** The `:documentGU` URL parameter is passed directly to the StudentVue API without format validation. While StudentVue likely rejects invalid values, validating the expected format (GUID) is a defense-in-depth measure.
**Recommendation:** Validate that `documentGU` matches a GUID pattern before passing to the API.

### 10. Console logging in production
**Location:** Various files (server/routes.ts, client/src/lib/studentvue-client.ts)
**Risk:** LOW
**Description:** `console.error` and `console.log` calls remain in production code. Server-side logs may expose user data (e.g., number of courses) in log aggregation systems.
**Recommendation:** Use a structured logger with log levels. Strip or sanitize user-specific data from log messages.

### 11. Service worker caches all navigation requests
**Location:** `client/public/sw.js`
**Risk:** LOW
**Description:** The service worker's network-first strategy caches responses. If a user logs out but the SW cache retains old pages, stale data could be served.
**Recommendation:** Clear SW caches on logout, or exclude authenticated pages from caching.

---

## Architecture Observations (Non-Vulnerability)

- **No server-side session management:** The entire auth model is client-driven. The server is stateless (no sessions), meaning every request is independently authenticated against StudentVue. This is simpler but means the server can't revoke access or enforce session timeouts.
- **Client-side SOAP calls bypass server:** When client-side login works (no CORS issues), credentials go directly from the browser to the StudentVue server. This is actually better for privacy (server never sees the password), but means the server can't log or rate-limit these attempts.
- **Mixed authentication paths:** The hybrid auth (client-first, server-fallback) adds complexity. Different code paths parse the same data differently, which could lead to inconsistencies.

---

## Summary

| Priority | Count | Key Action |
|----------|-------|------------|
| High     | 3 | Move to server-side sessions (#1, #2), escape XML inputs (#3) |
| Medium   | 4 | Rate limiting (#4), CSRF (#5), encrypt/move localStorage (#6), scrub error details (#7) |
| Low      | 4 | Input validation (#8), documentGU validation (#9), logging cleanup (#10), SW cache on logout (#11) |
