# GradeVue Design Guidelines

## Design Approach
**System-Based with Reference Adaptation**: Using Material Design principles adapted to match the reference app's academic dashboard aesthetic. This productivity tool requires clear information hierarchy, efficient data scanning, and professional presentation suitable for student users.

Inspiration: Linear's clean data presentation + Notion's card-based layouts + the reference app's blue academic theme.

## Typography
- **Primary Font**: Inter or DM Sans via Google Fonts
- **Headers**: 
  - H1 (Page Titles): text-3xl md:text-4xl, font-bold
  - H2 (Section Headers): text-2xl, font-semibold
  - H3 (Card Titles): text-lg, font-semibold
- **Body Text**: text-base, font-normal for general content
- **Data/Stats**: text-sm for labels, text-2xl to text-4xl font-bold for numerical values
- **Grade Letters**: text-xl to text-3xl, font-bold

## Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 (e.g., p-4, gap-6, mb-8)
- Consistent card padding: p-6
- Grid gaps: gap-4 for dense layouts, gap-6 for card grids
- Section spacing: mb-8 between major sections

**Layout Structure**:
- Sidebar: Fixed w-64, collapsible to w-20 on mobile
- Main Content: ml-64 with max-w-7xl container, responsive to ml-0 when sidebar collapsed
- Dashboard Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 for stat cards
- Course Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3

## Component Library

### Navigation
- **Sidebar**: Fixed left navigation with logo, course list with grade badges, collapsible menu items with icons (Heroicons)
- Course list items show course name + letter grade badge on right
- Active state: subtle blue background highlight

### Dashboard Components
- **Stat Cards**: Elevated cards (shadow-md) displaying metric title, large number, optional trend indicator
  - Grid layout for 4 key metrics: Overall GPA, Average Grade, Total Courses, Current Term
  - Icon + label + large value format
  
- **Course Cards**: Elevated cards showing:
  - Course name (header)
  - Large letter grade badge (A+, B, C, etc.) with distinct styling per grade range
  - Percentage score
  - Category breakdown list (Tests, Quizzes, Homework, Participation) with percentage values
  - "View Details" link/button

### Grade Badges
Letter grades displayed as rounded badges with appropriate visual weight:
- A grades: Prominent positive styling
- B grades: Secondary positive styling  
- C/D grades: Warning styling
- F grades: Alert styling
Use px-3 py-1, rounded-full, font-semibold for badge treatment

### Data Visualization
- **Charts**: Use Chart.js with consistent blue color palette
- Bar charts for grade trends over time
- Horizontal progress bars for category breakdowns (0-100% scale)
- Clean, minimal chart styling with clear axis labels

### Assignments List
- **Table/List View**: Alternating subtle row backgrounds for scannability
- Columns: Assignment Name, Course, Due Date, Score, Percentage
- Expandable rows showing assignment details
- Filter dropdown for course selection

### Forms & Inputs
- **Login Form**: Centered card layout with:
  - District dropdown/input
  - Username input
  - Password input
  - "Sign In" primary button
  - "Try Demo" secondary button option
  - Security note beneath form
- Input fields: border, rounded, p-3, focus states with blue ring

### Buttons
Primary: Blue background, white text, px-6 py-3, rounded-lg, font-medium
Secondary: Border style with blue text
Sizes: Regular (py-3 px-6) and Small (py-2 px-4)

## Page-Specific Layouts

### Dashboard (Home)
- Top: 4-column stat card grid (responsive)
- Below: "My Courses" section with course card grid
- Each section has clear header with mb-6 spacing

### Assignments Page
- Filter bar at top with course selector + view mode toggle (List/Chart)
- Assignments grouped by course with expandable sections
- Chart view shows grade distribution

### Course Detail Page
- Tab navigation: Overview, Assignments, Grade Trends
- Overview: Category breakdown with progress bars + current grade summary
- Grade Trends: Bar chart showing grade over time

### GPA Calculator
- Side-by-side comparison: Weighted vs Unweighted
- Course list with grade inputs
- Large calculated GPA display

### Settings
- Card-based sections for different preference groups
- Toggle switches for boolean settings
- Theme options if applicable

## Visual Hierarchy
- Clear separation between sections using whitespace (mb-8)
- Cards for grouping related information
- Bold typography for important data points
- Subtle borders and shadows for depth
- Blue accent for interactive elements and data emphasis

## Responsive Behavior
- Sidebar collapses to icon-only on tablet/mobile with hamburger toggle
- Stat cards stack to 2-column then 1-column on smaller screens
- Course cards go from 3-column to 2-column to 1-column
- Tables convert to stacked card views on mobile
- Charts remain responsive with adjusted aspect ratios

## Accessibility
- Proper heading hierarchy throughout
- Focus indicators on interactive elements
- Sufficient contrast ratios for text and data
- ARIA labels for icons and interactive components
- Keyboard navigation support for all features

## Icons
**Library**: Heroicons via CDN
- Academic/book icons for courses
- Chart icons for analytics
- Calendar icons for dates/attendance
- Calculator icon for GPA
- Settings gear icon
- User profile icon