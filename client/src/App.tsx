import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { GradeProvider, useGrades } from "@/lib/gradeContext";
import { ThemeProvider } from "@/lib/themeContext";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import AssignmentsPage from "@/pages/assignments";
import CourseDetailPage from "@/pages/course-detail";
import GPACalculatorPage from "@/pages/gpa-calculator";
import AttendancePage from "@/pages/attendance";
import TermComparisonPage from "@/pages/term-comparison";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function ProtectedRoute({
  component: Component,
}: {
  component: React.ComponentType;
}) {
  const { isLoggedIn } = useGrades();
  const [location] = useLocation();

  if (!isLoggedIn) {
    return <Redirect to="/" />;
  }

  return (
    <AuthenticatedLayout>
      <Component />
    </AuthenticatedLayout>
  );
}

function Router() {
  const { isLoggedIn } = useGrades();

  return (
    <Switch>
      <Route path="/">
        {isLoggedIn ? <Redirect to="/dashboard" /> : <LoginPage />}
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/assignments">
        <ProtectedRoute component={AssignmentsPage} />
      </Route>
      <Route path="/course/:id">
        <ProtectedRoute component={CourseDetailPage} />
      </Route>
      <Route path="/gpa">
        <ProtectedRoute component={GPACalculatorPage} />
      </Route>
      <Route path="/attendance">
        <ProtectedRoute component={AttendancePage} />
      </Route>
      <Route path="/terms">
        <ProtectedRoute component={TermComparisonPage} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <GradeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </GradeProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
