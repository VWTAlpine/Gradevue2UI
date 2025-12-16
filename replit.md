# GradeVue

## Overview

GradeVue is a modern, beautiful web application for viewing StudentVue grades. It provides students with an elegant interface to track academic progress, view assignments, calculate GPA, and analyze grade trends. The app connects to StudentVue's API to fetch real gradebook data and presents it through a clean dashboard experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: React Context API for global state (grades, theme, authentication)
- **Data Fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Charts**: Recharts for data visualization (grade distributions, category breakdowns)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api/` prefix
- **External Integration**: StudentVue npm package for fetching gradebook data from school districts

### Key Design Patterns
- **Provider Pattern**: Used extensively for context (GradeProvider, ThemeProvider, SidebarProvider)
- **Protected Routes**: Authentication check before rendering authenticated pages
- **Component Composition**: Reusable UI components (StatCard, GradeCard, AssignmentRow) for consistent layouts

### Page Structure
- `/` - Login page (StudentVue credentials)
- `/dashboard` - Main grades overview with stats and course cards
- `/assignments` - Detailed assignment list with filtering
- `/course/:id` - Individual course detail view
- `/gpa` - GPA calculator tool
- `/attendance` - Attendance tracking with absence/tardy records
- `/settings` - App settings and data refresh

### Data Flow
1. User enters StudentVue credentials on login page
2. **Hybrid Authentication**: Client-side SOAP requests attempted first for performance, with automatic server-side fallback using studentvue npm package
3. Parsed gradebook data stored in React context
4. All authenticated pages read from context for grade display
5. Grade changes are tracked for notifications

### Authentication Details
- **Client-side**: Direct SOAP XML requests to StudentVue API for faster response
- **Server fallback**: Uses `studentvue` npm package when client requests fail (CORS restrictions, etc.)
- Credentials stored in React context for session duration

### Attendance Tracking
- StudentVue only reports absence/tardy events, not present days
- UI displays: Total Absences, Tardies, Excused, and Unexcused counts
- Attendance rate not shown since total school days not available from API

## External Dependencies

### Third-Party Services
- **StudentVue API**: School district grade management system accessed via the `studentvue` npm package. Requires district URL, username, and password for authentication.

### Database
- **PostgreSQL**: Configured via Drizzle ORM with schema in `shared/schema.ts`. Currently uses in-memory storage for user sessions but database is provisioned for future persistence.
- **Drizzle ORM**: Database toolkit for type-safe queries and migrations

### Key NPM Packages
- `studentvue`: Official StudentVue API client for fetching gradebook data
- `@tanstack/react-query`: Async state management
- `wouter`: Lightweight routing
- `recharts`: Chart library for grade visualizations
- `drizzle-orm` + `drizzle-zod`: Database ORM with Zod schema integration
- Radix UI primitives: Accessible component foundations
- `tailwindcss`: Utility-first CSS framework