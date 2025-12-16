import { useGrades } from "@/lib/gradeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Phone, School, Calendar, BookOpen } from "lucide-react";

export default function ProfilePage() {
  const { gradebook } = useGrades();
  const studentInfo = gradebook?.studentInfo;

  const initials = studentInfo?.name
    ? studentInfo.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "ST";

  const infoItems = [
    { icon: User, label: "Student ID", value: studentInfo?.studentId },
    { icon: BookOpen, label: "Grade Level", value: studentInfo?.grade ? `Grade ${studentInfo.grade}` : undefined },
    { icon: School, label: "School", value: studentInfo?.school },
    { icon: Mail, label: "Email", value: studentInfo?.email },
    { icon: Phone, label: "Phone", value: studentInfo?.phone },
    { icon: Calendar, label: "Birth Date", value: studentInfo?.birthDate },
    { icon: User, label: "Counselor", value: studentInfo?.counselor },
  ].filter(item => item.value);

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

  const calculateAverageGrade = () => {
    if (!gradebook?.courses) return 0;
    const validGrades = gradebook.courses.filter(c => c.grade !== null);
    if (validGrades.length === 0) return 0;
    const sum = validGrades.reduce((acc, c) => acc + (c.grade ?? 0), 0);
    return sum / validGrades.length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Your student information and academic summary
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 overflow-visible" data-testid="card-student-profile">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold" data-testid="text-profile-name">
                {studentInfo?.name || "Student"}
              </h2>
              {studentInfo?.grade && (
                <Badge variant="secondary" className="mt-2" data-testid="badge-grade-level">
                  Grade {studentInfo.grade}
                </Badge>
              )}
              {studentInfo?.school && (
                <p className="mt-2 text-sm text-muted-foreground" data-testid="text-school">
                  {studentInfo.school}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 overflow-visible" data-testid="card-student-info">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            {infoItems.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {infoItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium" data-testid={`text-info-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Student information not available. Try refreshing your data from Settings.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="overflow-visible" data-testid="card-stat-gpa">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{calculateOverallGPA()}</p>
          </CardContent>
        </Card>

        <Card className="overflow-visible" data-testid="card-stat-average">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{calculateAverageGrade().toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="overflow-visible" data-testid="card-stat-courses">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{gradebook?.courses?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      {gradebook?.reportingPeriod && (
        <Card className="overflow-visible" data-testid="card-reporting-period">
          <CardHeader>
            <CardTitle>Current Term</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Term Name</p>
                <p className="font-medium">{gradebook.reportingPeriod.name}</p>
              </div>
              {gradebook.reportingPeriod.startDate && (
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium">{gradebook.reportingPeriod.startDate}</p>
                </div>
              )}
              {gradebook.reportingPeriod.endDate && (
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-medium">{gradebook.reportingPeriod.endDate}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
