# GradeVue — replit.md

## Overview

GradeVue is a modern, student-friendly web application that provides a beautiful frontend interface for StudentVue — the grade management system used by many school districts. It connects to the StudentVue SOAP API to pull gradebook data and presents it in a clean, card-based dashboard.

**Core features:**
- Grade dashboard with stat cards and per-course grade cards
- Assignment detail views with score parsing and missing assignment detection
- GPA calculator (weighted and unweighted)
- Attendance tracking with calendar view
- School documents viewer and messages viewer
- Reporting period switching and term comparison
- CSV and ICS calendar export
- Grade change notifications
- Hypothetical grade mode (what-if calculator)
- PWA support with offline shell caching via service worker
- Full dark mode + theme/font/border-radius customization

The project is licensed under GNU GPL v3.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Overall Structure
This is a **monorepo** with a React frontend and an Express backend, sharing types via a `shared/` directory.

```
/
├── client/          # React SPA (Vite)
│   ├── src/
│   │   ├── pages/       # Route-level page components
│   │   ├── components/  # Reusable UI components (shadcn/ui based)
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Core logic (gradeContext, themeContext, studentvue-client, grade-utils)
│   └── public/          # Static assets, manifest.json, sw.js
├── server/          # Express API server
│   ├── index.ts     # App entry, rate limiting, security headers
│   ├── routes.ts    # API routes (StudentVue proxy)
│   ├── storage.ts   # In-memory user storage (MemStorage)
│   └── static.ts    # Static file serving for production
├── shared/          # Shared TypeScript types and Zod schemas
│   └── schema.ts
└── script/
    └── build.ts     # Custom build script (Vite + esbuild)
```

### Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Bundler:** Vite
- **Routing:** Wouter (lightweight client-side routing)
- **State management:** React Context API
  - `GradeProvider` (`gradeContext.tsx`): Central store for gradebook data, credentials, hypothetical mode, grade changes, and reporting period selection. Persists credentials to `sessionStorage` (not `localStorage`) for security.
  - `ThemeProvider` (`themeContext.tsx`): Controls light/dark mode, color theme, font family, and border radius. Persists to `localStorage`.
- **Server state:** TanStack React Query (for API calls, though much data fetching is done imperatively via the StudentVue client)
- **UI components:** shadcn/ui + Radix UI primitives, customized with a Tailwind CSS design system
- **Charts:** Recharts
- **PWA:** Service worker (`sw.js`) for offline shell caching; `beforeinstallprompt` capture for install button

### Backend Architecture
- **Framework:** Express.js (TypeScript, ESM)
- **Purpose:** Acts primarily as a proxy to the StudentVue SOAP API, to avoid CORS issues from the browser. Does not store any grade data server-side.
- **Rate limiting:** `express-rate-limit` applied globally (`/api/`) and more strictly on login (`/api/studentvue/login` — 5 attempts / 60s)
- **Security headers:** X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy set on all responses
- **Storage:** `MemStorage` — in-memory user store (no persistent DB for user accounts currently). A PostgreSQL database is configured via Drizzle ORM but is not yet actively used for core features.

### StudentVue API Integration
- **Primary:** A client-side SOAP client (`client/src/lib/studentvue-client.ts`) makes requests directly from the browser to the StudentVue district server using `fast-xml-parser`. This avoids an extra server round-trip for most data.
- **Fallback:** If the client-side fetch fails (e.g., CORS), the app falls back to the Express server proxy routes (e.g., `/api/studentvue/login`, `/api/studentvue/attendance`, etc.).
- **Security:** XML input is escaped via `xmlEscape()` before being interpolated into SOAP envelopes to prevent injection.
- Credentials are stored in `sessionStorage` only (cleared on tab close); they are re-sent with each API call (noted as a known open issue — server-side sessions are a future improvement).

### Data Flow
1. User enters district URL, username, and password on the login page.
2. App attempts login via the client-side StudentVue SOAP client; falls back to server proxy.
3. On success, gradebook data is parsed and stored in `GradeProvider` context and `sessionStorage`.
4. All pages read from the context; individual pages (attendance, documents, messages) fetch their own data on mount using the same client.

### Build System
- **Dev:** `tsx server/index.ts` runs the Express server; Vite middleware is used for HMR.
- **Production:** `script/build.ts` runs Vite (client bundle → `dist/public`) then esbuild (server bundle → `dist/index.cjs`). Key server dependencies are bundled into the output to reduce cold-start syscalls.

### Database
- Drizzle ORM is configured with PostgreSQL (`drizzle.config.ts`, `shared/schema.ts`).
- `DATABASE_URL` environment variable is required for Drizzle.
- Currently, the schema defines types/validators but the app's core data (gradebook) is not persisted to the DB — only in-memory and sessionStorage. The DB is provisioned but not yet used for grade data.

---

## External Dependencies

### StudentVue / Synergy API
- **What:** The StudentVue SOAP web service used by school districts. GradeVue reads gradebook, attendance, documents, and messages from this API.
- **How accessed:** Via a custom SOAP client (`studentvue-client.ts`) and optionally the `studentvue` npm package (by Joseph Marbella) on the server side.
- **Credentials:** User's school district URL, username, and password — passed per-request.

### PostgreSQL (via Drizzle ORM)
- Configured and schema defined, but not heavily used in current core features.
- `DATABASE_URL` env var required.
- `connect-pg-simple` is included as a session store dependency for future server-side session implementation.

### Key npm Packages
| Package | Purpose |
|---|---|
| `studentvue` | Server-side StudentVue API client (npm package by Joseph Marbella) |
| `fast-xml-parser` | Client-side XML parsing for SOAP responses |
| `drizzle-orm` + `drizzle-zod` | ORM + schema validation |
| `@tanstack/react-query` | Server state management |
| `wouter` | Lightweight client-side routing |
| `recharts` | Charts (grade trends, attendance, etc.) |
| `express-rate-limit` | Rate limiting on API endpoints |
| `express-session` | Session middleware (future use) |
| `shadcn/ui` + `@radix-ui/*` | Accessible UI component primitives |
| `tailwindcss` | Utility-first CSS |
| `date-fns` | Date formatting |
| `zod` | Runtime schema validation |
| `class-variance-authority` | Component variant management |
| `nanoid` | ID generation |

### Fonts
- Inter and DM Sans loaded from Google Fonts (`fonts.googleapis.com`).

### PWA
- Web App Manifest (`/manifest.json`) and service worker (`/sw.js`) for installability and offline shell caching.
- No push notification server; notifications are in-app only (grade change alerts).