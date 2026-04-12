# GradeVue Security Review

**Date:** April 12, 2026
**Last Updated:** April 12, 2026 (fixes applied)
**License:** GNU General Public License v3.0 — © 2026 GradeVue Contributors
**Scope:** Full application (client + server)

---

## High Issues

### 1. Plain-text credentials in sessionStorage
**Location:** `client/src/lib/gradeContext.tsx`
**Risk:** HIGH
**Status:** Partially mitigated — gradebook data moved from `localStorage` to `sessionStorage` (clears on tab close). Credentials in sessionStorage remain; full server-side session implementation is a future architectural goal.

### 2. Credentials re-sent on every API call
**Location:** `client/src/pages/attendance.tsx`, `documents.tsx`, `messages.tsx`, `settings.tsx`
**Risk:** HIGH
**Status:** Open — requires server-side session architecture. Tracked as future improvement.

### 3. XML injection in SOAP requests (client-side) — FIXED
**Location:** `client/src/lib/studentvue-client.ts`
**Risk:** MEDIUM → Resolved
**Status:** **Fixed.** Added `xmlEscape()` function that escapes `&`, `<`, `>`, `"`, `'` before interpolating `userID` and `password` into the SOAP envelope.

---

## Medium Issues

### 4. No server-side rate limiting on login endpoint — FIXED
**Location:** `server/routes.ts`
**Risk:** MEDIUM → Resolved
**Status:** **Fixed.** Added `express-rate-limit` middleware on `/api/studentvue/login`: max 5 attempts per IP per 60-second window with a clear user-facing error message.

### 5. No CSRF protection
**Location:** All POST endpoints in `server/routes.ts`
**Risk:** MEDIUM
**Status:** Open — same-origin policy provides partial protection. Full CSRF token implementation is a future improvement.

### 6. Gradebook data stored unencrypted in localStorage — FIXED
**Location:** `client/src/lib/gradeContext.tsx`
**Risk:** MEDIUM → Resolved
**Status:** **Fixed.** Gradebook and lastUpdated moved from `localStorage` to `sessionStorage`. Data now clears automatically when the browser tab is closed. Logout also explicitly clears all three sessionStorage keys.

### 7. Error responses leaked internal details — FIXED
**Location:** `server/routes.ts` — multiple endpoints
**Risk:** LOW-MEDIUM → Resolved
**Status:** **Fixed.** Removed all `details` fields from error responses. Raw `err.message` values replaced with generic messages across all endpoints (login, attendance, documents, messages, document download). Internal details are still logged server-side only.

---

## Low Issues

### 8. No input length/format validation on server — FIXED
**Location:** `server/routes.ts`
**Risk:** LOW → Resolved
**Status:** **Fixed.** Added type and length checks on login endpoint: district max 500 chars, username max 100 chars, password max 500 chars. Returns 400 with a clean error message for invalid inputs.

### 9. documentGU parameter not validated — FIXED
**Location:** `server/routes.ts`
**Risk:** LOW → Resolved
**Status:** **Fixed.** Added GUID format validation (`/^[0-9A-Fa-f]{8}-...-[0-9A-Fa-f]{12}$/`) before passing `documentGU` to the StudentVue API. Returns 400 for non-GUID values.

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

| # | Finding | Priority | Status |
|---|---------|----------|--------|
| 1 | Credentials in sessionStorage | High | Open (future: server-side sessions) |
| 2 | Credentials re-sent on every API call | High | Open (future: server-side sessions) |
| 3 | XML injection in SOAP | High | **Fixed** |
| 4 | No login rate limiting | Medium | **Fixed** |
| 5 | No CSRF protection | Medium | Open |
| 6 | Gradebook in localStorage | Medium | **Fixed** |
| 7 | Error details leaked in responses | Medium | **Fixed** |
| 8 | No input length validation | Low | **Fixed** |
| 9 | documentGU not validated | Low | **Fixed** |
| 10 | Console logging in production | Low | Open |
| 11 | SW cache on logout | Low | Open |
