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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Building,
} from "lucide-react";
import logoImage from "@assets/Gradevue_Design_Pack_(3)_1765931869180.png";

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

  const studentInfo = gradebook?.studentInfo;
  const initials = studentInfo?.name
    ? studentInfo.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "ST";

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 shrink-0">
        <div className="flex justify-center">
          <img 
            src={logoImage} 
            alt="GradeVue Logo" 
            className="h-20 w-auto object-cover scale-[2.5]"
            data-testid="img-sidebar-logo"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        <SidebarGroup className="p-4 pt-0 space-y-3">
          {studentInfo?.school && (
            <div className="flex items-center gap-2 text-center justify-center pb-2 border-b border-sidebar-border">
              <Building className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium truncate" data-testid="text-school-name">
                {studentInfo.school}
              </span>
            </div>
          )}
          <Link href="/profile" data-testid="link-profile">
            <div className="flex flex-col items-center gap-3 rounded-lg p-3 hover-elevate active-elevate-2 cursor-pointer">
              <Avatar className="h-16 w-16 shrink-0">
                <AvatarImage 
                  src={studentInfo?.photo ? (studentInfo.photo.startsWith("data:") ? studentInfo.photo : `data:image/jpeg;base64,${studentInfo.photo}`) : undefined} 
                  alt={studentInfo?.name || "Student"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center min-w-0 w-full">
                <p className="text-base font-semibold truncate" data-testid="text-student-name">
                  {studentInfo?.name || "Student"}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-student-info">
                  {studentInfo?.grade ? `Grade ${studentInfo.grade}` : ""}
                </p>
                {studentInfo?.studentId && (
                  <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-student-id">
                    ID: {studentInfo.studentId}
                  </p>
                )}
              </div>
            </div>
          </Link>
          <div className="flex items-center justify-center gap-2 py-1">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">GPA:</span>
            <span className="text-sm font-medium text-foreground">{calculateOverallGPA()}</span>
          </div>
        </SidebarGroup>
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
