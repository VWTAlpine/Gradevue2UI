import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useGrades } from "@/lib/gradeContext";
import { getGradeBgColor } from "@shared/schema";
import {
  LayoutDashboard,
  FileText,
  Calculator,
  Calendar,
  Settings,
  LogOut,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

const mainNavItems = [
  {
    title: "Grades Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Assignments",
    url: "/assignments",
    icon: FileText,
  },
  {
    title: "GPA Calculator",
    url: "/gpa",
    icon: Calculator,
  },
  {
    title: "Attendance",
    url: "/attendance",
    icon: Calendar,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { gradebook, logout, setSelectedCourse } = useGrades();

  const calculateOverallGPA = () => {
    if (!gradebook?.courses) return "0.00";
    const validGrades = gradebook.courses.filter(c => c.grade !== null);
    if (validGrades.length === 0) return "0.00";
    
    let totalPoints = 0;
    validGrades.forEach(course => {
      const grade = course.grade ?? 0;
      if (grade >= 93) totalPoints += 4.0;
      else if (grade >= 90) totalPoints += 3.7;
      else if (grade >= 87) totalPoints += 3.3;
      else if (grade >= 83) totalPoints += 3.0;
      else if (grade >= 80) totalPoints += 2.7;
      else if (grade >= 77) totalPoints += 2.3;
      else if (grade >= 73) totalPoints += 2.0;
      else if (grade >= 70) totalPoints += 1.7;
      else if (grade >= 67) totalPoints += 1.3;
      else if (grade >= 63) totalPoints += 1.0;
      else if (grade >= 60) totalPoints += 0.7;
      else totalPoints += 0.0;
    });
    
    return (totalPoints / validGrades.length).toFixed(2);
  };

  const handleCourseClick = (course: NonNullable<typeof gradebook>["courses"][0]) => {
    setSelectedCourse(course);
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current GPA</p>
            <p className="text-2xl font-bold text-foreground">{calculateOverallGPA()}</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    className="gap-3"
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {gradebook?.courses && gradebook.courses.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wide text-muted-foreground">
              My Courses
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {gradebook.courses.map((course, index) => (
                  <SidebarMenuItem key={course.id || index}>
                    <SidebarMenuButton
                      asChild
                      className="justify-between gap-2"
                    >
                      <Link
                        href={`/course/${index}`}
                        onClick={() => handleCourseClick(course)}
                        data-testid={`nav-course-${index}`}
                      >
                        <span className="truncate text-sm">{course.name}</span>
                        <Badge
                          variant="secondary"
                          className={`ml-auto shrink-0 ${getGradeBgColor(course.letterGrade)}`}
                        >
                          {course.letterGrade}
                        </Badge>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="gap-3 text-destructive"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
