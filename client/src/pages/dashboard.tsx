import { useGrades, type GradeChange } from "@/lib/gradeContext";
import { StatCard } from "@/components/stat-card";
import { GradeCard } from "@/components/grade-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, BookOpen, Bell, X, Calendar, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface AttendanceSummary {
  totalAbsences: number;
  totalTardies: number;
}

export default function DashboardPage() {
  const { gradebook, setSelectedCourse, gradeChanges, clearGradeChanges } = useGrades();
  const [attendance, setAttendance] = useState<AttendanceSummary>({ totalAbsences: 0, totalTardies: 0 });

  const loadAttendance = () => {
    const savedAttendance = localStorage.getItem("attendance");
    if (savedAttendance) {
      try {
        const parsed = JSON.parse(savedAttendance);
        setAttendance({
          totalAbsences: parsed.totalAbsences || 0,
          totalTardies: parsed.totalTardies || 0,
        });
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    loadAttendance();
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "attendance") {
        loadAttendance();
      }
    };
    
    const handleFocus = () => {
      loadAttendance();
    };
    
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const courses = gradebook?.courses || [];

  const countMissingAssignments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let count = 0;
    courses.forEach((course) => {
      course.assignments.forEach((a) => {
        const scoreLower = a.score?.toLowerCase() || "";
        const notesLower = a.notes?.toLowerCase() || "";
        
        // Explicit missing markers
        if (scoreLower.includes("missing") || scoreLower === "m" || scoreLower.includes("not turned in")) {
          count++;
          return;
        }
        if (notesLower.includes("missing") || notesLower.includes("not turned in")) {
          count++;
          return;
        }
        
        // Check if "Not Graded" with past due date = likely missing
        const isUngraded = !a.score || scoreLower === "not graded" || scoreLower === "n/a" || scoreLower === "";
        if (isUngraded && a.dueDate) {
          const dueDate = new Date(a.dueDate);
          if (!isNaN(dueDate.getTime()) && dueDate < today) {
            count++;
          }
        }
      });
    });
    return count;
  };

  const missingCount = countMissingAssignments();

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

  const getMonthLabels = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const result: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push(months[d.getMonth()]);
    }
    return result;
  };

  const generateTrendData = () => {
    const base = averageGrade || 85;
    return Array.from({ length: 7 }, (_, i) => 
      Math.max(0, Math.min(100, base - 5 + Math.random() * 10 + (i * 0.5)))
    );
  };

  const monthLabels = getMonthLabels();
  const gpaTrendData = generateTrendData().map(v => (v / 100) * 4);
  const gradeTrendData = generateTrendData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl" data-testid="heading-academic-progress">
          Academic Progress
        </h1>
        <p className="mt-1 text-sm text-muted-foreground uppercase tracking-wide" data-testid="text-report-period">
          {reportingPeriod.name}
          {reportingPeriod.endDate && ` - Ends ${formatDate(reportingPeriod.endDate)}`}
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" data-testid="stats-grid">
        <StatCard
          title="Overall GPA"
          value={gpa.toFixed(2)}
          subtitle="/ 4.0"
          chartData={gpaTrendData}
          chartColor="#3b82f6"
          showChartBackground
          showAxes
          yAxisDomain={[0, 4]}
          xAxisLabels={monthLabels}
          testId="stat-overall-gpa"
        />
        <StatCard
          title="Average Grade"
          value={`${averageGrade.toFixed(1)}%`}
          subtitle={getGradeLabel(averageGrade) + "+"}
          chartData={gradeTrendData}
          chartColor="#10b981"
          showChartBackground
          showAxes
          yAxisDomain={[0, 100]}
          xAxisLabels={monthLabels}
          testId="stat-average-grade"
        />
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Courses"
              value={courses.length.toString()}
              icon={BookOpen}
              iconBgColor="bg-purple-100 dark:bg-purple-900/30"
              iconColor="text-purple-600 dark:text-purple-400"
              size="mini"
              testId="stat-total-courses"
            />
            <StatCard
              title="Missing"
              value={missingCount.toString()}
              icon={AlertTriangle}
              iconBgColor={missingCount > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}
              iconColor={missingCount > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}
              size="mini"
              testId="stat-missing"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Tardies"
              value={attendance.totalTardies.toString()}
              size="mini"
              testId="stat-tardies"
            />
            <StatCard
              title="Absences"
              value={attendance.totalAbsences.toString()}
              size="mini"
              testId="stat-absences"
            />
          </div>
        </div>
        <StatCard
          title="Term"
          value={reportingPeriod.name || "Current"}
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
                          {" \u2192 "}
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
