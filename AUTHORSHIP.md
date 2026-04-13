AUTHORSHIP.md — Human Authorship Paper Trail for GradeVue
============================================================

## What This Document Is

This document serves as a record of human creative direction in the development of GradeVue. It explains which parts of the project were conceived, specified, and guided by the human author (VWTAlpine), and how that authorship is evidenced through the Git commit history, design decisions, and iterative refinements made throughout the project's development.

AI tooling (Replit) was used as an implementation assistant — generating code in response to explicit human instructions. This document exists to make that distinction clear and to help establish a defensible paper trail of human authorship for copyright, licensing, and attribution purposes.

---

## Why It Matters

Under current copyright law in many jurisdictions, copyright protection attaches to works of human authorship. When AI is involved in creating software, the question becomes: who made the meaningful creative decisions?

The answer matters because:
- **Copyright**: Works with insufficient human authorship may not qualify for copyright protection. A clear paper trail showing that a human conceived, directed, and refined the project helps establish that protection.
- **Licensing**: If you distribute software under a license like GPL-3.0 (as GradeVue does), you need to be the rightful copyright holder or have appropriate rights to the work.
- **Credibility**: Demonstrating that AI was a tool — not the author — protects against challenges to your ownership of the work.

A paper trail does not need to prove you typed every line of code. It needs to show that the creative choices — what to build, how it should work, what to keep or discard — were made by a human being.

---

## Human Contributions in This Project

The following categories of creative and technical decision-making were performed by the human author of GradeVue:

### 1. Product Concept
GradeVue was conceived as a modern, student-friendly frontend for StudentVue — the grade management system used by many school districts. The decision to build a better UI on top of the StudentVue API, rather than use the default interface, was an original human idea. The project scope, name, and purpose were entirely human-defined.

### 2. UX and UI Design Direction
The overall look and feel of GradeVue — including the dashboard layout, card-based grade display, sidebar navigation, dark mode support, and color theming — reflects human design choices. Decisions about what information to surface, how to organize it, and how to make it visually clear were made by the author, not generated autonomously by AI.

### 3. Feature Specifications
Each feature was specified by the human author before being implemented. This includes:
- The grade dashboard with stat cards and per-course grade cards
- Assignment detail views with score parsing and missing assignment detection
- A GPA calculator with support for weighted and unweighted grades
- Attendance tracking using data from the StudentVue API
- Reporting period switching
- CSV and ICS calendar export
- Grade change notifications
- PWA/offline shell caching via a service worker

These were not features that AI proposed on its own — they were requirements provided by the author.

### 4. Code Review and Rejection
Throughout development, AI-generated code was reviewed, tested, corrected, and in many cases rewritten or rejected entirely. The author made decisions about what was acceptable, what was wrong, and what needed to change — exercising editorial control over the final output.

### 5. Third-Party Source Selection and Attribution
The author independently identified and evaluated third-party libraries and code references used in this project — including the `studentvue` npm package, shadcn/ui, Radix UI, and the SOAP client structure based on work by Connor Rakov. Decisions to use these sources, and how to credit them, were made by the human author. See `NOTICE.md` for attribution details.

### 6. Security Review Decisions
Security decisions — such as what risks to document, which tradeoffs to accept, and where to apply additional caution — were made by the human author. The security review is documented in `SECURITY_REVIEW.md`.

### 7. Prompt Engineering and Iterative Refinement
The author engaged in ongoing, iterative direction of the AI implementation assistant — writing prompts, correcting misunderstandings, redirecting approach, and refining outputs across many sessions. This iterative process of specification and correction is itself a form of authorship.

### 8. Technology Choices
Key technology decisions were made by the author based on independent research. For example, TypeScript was chosen over JavaScript because the author determined it allowed cleaner integration of front-end and back-end in a full-stack context and handled large data structures more intuitively.

---

## Git Commit History as Evidence

The Git commit history for this project serves as a timestamped record of human decisions. Each commit marks a moment when the author reviewed the state of the project and decided to accept, change, or extend it.

To make commit history as strong a record as possible, commit messages should follow these principles:

**Explain the why, not just the what.**
A message like "Add attendance page" is less useful than "Add attendance page — display absence and tardy records from StudentVue; exclude attendance rate since total school days aren't available from the API." The reasoning behind a decision is what shows human judgment.

**Record rejections and rewrites.**
If you rejected AI output and wrote something yourself, or made a significant correction, note it. For example: "Rewrite GPA calculation logic — AI version didn't correctly handle ungraded courses, now uses isCourseUngraded() check."

**Be specific about feature decisions.**
When you add a feature, describe what it does and why you included it. This connects the code change to your intent as the author.

**Commit frequently.**
More commits mean more data points in the timeline showing your active, ongoing involvement in the project. A single commit for an entire week of work tells a weaker story than dozens of small, descriptive commits.

---

## Going Forward

To keep the paper trail strong as GradeVue continues to evolve:

- **Commit often** — even for small changes, rather than batching everything together.
- **Write descriptive commit messages** that explain decisions, not just actions.
- **Note when you reject or rewrite AI output** — this is evidence of active editorial control.
- **Document major design decisions** in commit messages, code comments, or markdown files in the repository.
- **Keep prompts when possible** — if you save the prompts you gave to AI tools, those records further demonstrate that the creative direction came from you.
- **Update this document** when major new features are added or significant design pivots are made.

---

## References

- `LICENSE` — Full license text (GNU GPL v3.0) and authorship notice for GradeVue.
- `NOTICE.md` — Third-party software attributions and credits.
- `replit.md` — System architecture overview documenting the project structure and key design decisions.
