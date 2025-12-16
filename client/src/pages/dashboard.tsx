import { useGrades, type GradeChange } from "@/lib/gradeContext";
import { StatCard } from "@/components/stat-card";
import { GradeCard } from "@/components/grade-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Award, BookOpen, Calendar, Bell, X } from "lucide-react";

export default function DashboardPage() {
  const { gradebook, setSelectedCourse, gradeChanges, clearGradeChanges } = useGrades();

  // Add data-testid to stat cards and course cards

  const courses = gradebook?.courses || [];

  const calculateOverallGPA = () => {
    const validGrades = courses.filter((c) => c.grade !== null);
    if (validGrades.length === 0) return 0;

    let totalPoints = 0;
    validGrades.forEach((course) => {
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

    return totalPoints / validGrades.length;
  };

  const calculateAverageGrade = () => {
    const validGrades = courses.filter((c) => c.grade !== null);
    if (validGrades.length === 0) return 0;

    const sum = validGrades.reduce((acc, c) => acc + (c.grade ?? 0), 0);
    return sum / validGrades.length;
  };

  const gpa = calculateOverallGPA();
  const averageGrade = calculateAverageGrade();

  const getGradeLabel = (avg: number) => {
    if (avg >= 90) return "A";
    if (avg >= 80) return "B";
    if (avg >= 70) return "C";
    if (avg >= 60) return "D";
    return "F";
  };

  const reportingPeriod = gradebook?.reportingPeriod || {
    name: "Current Term",
    endDate: "",
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Academic Progress
        </h1>
        <p className="mt-1 text-muted-foreground">
          {reportingPeriod.name}
          {reportingPeriod.endDate && ` - Ends ${formatDate(reportingPeriod.endDate)}`}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="stats-grid">
        <StatCard
          title="Overall GPA"
          value={gpa.toFixed(2)}
          subtitle="/ 4.0"
          icon={TrendingUp}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          testId="stat-overall-gpa"
        />
        <StatCard
          title="Average Grade"
          value={`${averageGrade.toFixed(1)}%`}
          subtitle={getGradeLabel(averageGrade) + "+"}
          icon={Award}
          iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          testId="stat-average-grade"
        />
        <StatCard
          title="Total Courses"
          value={courses.length.toString()}
          icon={BookOpen}
          iconBgColor="bg-purple-100 dark:bg-purple-900/30"
          iconColor="text-purple-600 dark:text-purple-400"
          testId="stat-total-courses"
        />
        <StatCard
          title="Current Term"
          value={reportingPeriod.name || "Fall Semester"}
          subtitle={reportingPeriod.endDate ? `Ends ${formatDate(reportingPeriod.endDate)}` : ""}
          icon={Calendar}
          iconBgColor="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
          testId="stat-current-term"
        />
      </div>

      {gradeChanges.length > 0 && (
        <Card className="overflow-visible border-blue-200 dark:border-blue-800" data-testid="card-grade-changes">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Recent Grade Changes</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearGradeChanges}
              data-testid="button-clear-changes"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gradeChanges.slice(0, 5).map((change: GradeChange, idx: number) => {
                const isImproved = (change.newGrade ?? 0) > (change.previousGrade ?? 0);
                return (
                  <div
                    key={`${change.courseName}-${idx}`}
                    className="flex items-center justify-between rounded-md bg-muted/50 p-3"
                    data-testid={`grade-change-${idx}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isImproved
                          ? "bg-emerald-100 dark:bg-emerald-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}>
                        {isImproved ? (
                          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{change.courseName}</p>
                        <p className="text-xs text-muted-foreground">
                          {change.previousGrade?.toFixed(1) ?? "N/A"}% {change.previousLetter ? `(${change.previousLetter})` : ""} 
                          {" → "}
                          {change.newGrade?.toFixed(1) ?? "N/A"}% {change.newLetter ? `(${change.newLetter})` : ""}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${
                      isImproved
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {isImproved ? "+" : ""}{((change.newGrade ?? 0) - (change.previousGrade ?? 0)).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div data-testid="courses-section">
        <h2 className="mb-6 text-2xl font-semibold" data-testid="heading-my-courses">My Courses</h2>
        {courses.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No courses found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your courses will appear here once you log in to StudentVue
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="courses-grid">
            {courses.map((course, index) => (
              <GradeCard
                key={course.id || index}
                course={course}
                index={index}
                onSelect={setSelectedCourse}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
