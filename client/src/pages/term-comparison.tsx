import { useState } from "react";
import { useGrades } from "@/lib/gradeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getGradeBgColor, letterGradeToPoints } from "@shared/schema";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from "recharts";
import { TrendingUp, TrendingDown, Minus, Layers, Info } from "lucide-react";

interface TermSnapshot {
  termName: string;
  courses: {
    name: string;
    grade: number | null;
    letterGrade: string;
  }[];
  gpa: number;
  averageGrade: number;
}

export default function TermComparisonPage() {
  const { gradebook } = useGrades();
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);

  const courses = gradebook?.courses || [];
  const reportingPeriods = gradebook?.reportingPeriods || [];
  const currentTermName = gradebook?.reportingPeriod?.name || "Current Term";

  const calculateGPA = (grades: { grade: number | null; letterGrade: string }[]) => {
    const validGrades = grades.filter((g) => g.grade !== null);
    if (validGrades.length === 0) return 0;

    let totalPoints = 0;
    validGrades.forEach((item) => {
      totalPoints += letterGradeToPoints(item.letterGrade);
    });

    return totalPoints / validGrades.length;
  };

  const calculateAverage = (grades: { grade: number | null }[]) => {
    const validGrades = grades.filter((g) => g.grade !== null);
    if (validGrades.length === 0) return 0;
    return validGrades.reduce((sum, g) => sum + (g.grade || 0), 0) / validGrades.length;
  };

  const currentTermSnapshot: TermSnapshot = {
    termName: currentTermName,
    courses: courses.map((c) => ({
      name: c.name,
      grade: c.grade,
      letterGrade: c.letterGrade,
    })),
    gpa: calculateGPA(courses),
    averageGrade: calculateAverage(courses),
  };

  const mockHistoricalTerms: TermSnapshot[] = [
    {
      termName: "Fall 2024",
      courses: courses.map((c) => ({
        name: c.name,
        grade: c.grade ? Math.max(0, c.grade - Math.random() * 10 + 2) : null,
        letterGrade: c.letterGrade,
      })),
      gpa: currentTermSnapshot.gpa - 0.15,
      averageGrade: currentTermSnapshot.averageGrade - 3,
    },
    {
      termName: "Spring 2024",
      courses: courses.map((c) => ({
        name: c.name,
        grade: c.grade ? Math.max(0, c.grade - Math.random() * 15 + 5) : null,
        letterGrade: c.letterGrade,
      })),
      gpa: currentTermSnapshot.gpa - 0.25,
      averageGrade: currentTermSnapshot.averageGrade - 5,
    },
  ];

  const allTerms = [currentTermSnapshot, ...mockHistoricalTerms];

  const comparisonChartData = courses.map((course, idx) => {
    const dataPoint: Record<string, string | number | null> = {
      name: course.name.length > 20 ? course.name.substring(0, 20) + "..." : course.name,
      fullName: course.name,
    };

    allTerms.forEach((term) => {
      const termCourse = term.courses[idx];
      dataPoint[term.termName] = termCourse?.grade ?? null;
    });

    return dataPoint;
  });

  const gpaChartData = allTerms.map((term) => ({
    name: term.termName,
    gpa: term.gpa,
    average: term.averageGrade,
  })).reverse();

  const getChangeIcon = (current: number | null, previous: number | null) => {
    if (current === null || previous === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (current > previous) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const chartColors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Term Comparison</h1>
        <p className="mt-1 text-muted-foreground">
          Compare your academic performance across different terms
        </p>
      </div>

      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30" data-testid="alert-demo-data">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-200">Demo Data</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          Historical term data shown below is simulated for demonstration purposes. 
          Full term history will be available when StudentVue provides historical reporting period data.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-3">
        {allTerms.slice(0, 3).map((term, idx) => (
          <Card key={term.termName} className="overflow-visible" data-testid={`card-term-${idx}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{term.termName}</CardTitle>
                {idx === 0 && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Current
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">GPA</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{term.gpa.toFixed(2)}</span>
                    {idx > 0 && getChangeIcon(allTerms[0].gpa, term.gpa)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Grade</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">{term.averageGrade.toFixed(1)}%</span>
                    {idx > 0 && getChangeIcon(allTerms[0].averageGrade, term.averageGrade)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Courses</span>
                  <span className="font-medium">{term.courses.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-visible" data-testid="card-gpa-trend">
          <CardHeader>
            <CardTitle>GPA Trend</CardTitle>
            <CardDescription>Your GPA progression over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gpaChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="gpa"
                    name="GPA"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible" data-testid="card-average-trend">
          <CardHeader>
            <CardTitle>Average Grade Trend</CardTitle>
            <CardDescription>Your average percentage over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gpaChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="average"
                    name="Average %"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-visible" data-testid="card-course-comparison">
        <CardHeader>
          <CardTitle>Course Performance Comparison</CardTitle>
          <CardDescription>Compare grades across terms for each course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonChartData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={150}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  formatter={(value: number) => [`${value?.toFixed(1)}%`, ""]}
                />
                <Legend />
                {allTerms.map((term, idx) => (
                  <Bar
                    key={term.termName}
                    dataKey={term.termName}
                    fill={chartColors[idx % chartColors.length]}
                    radius={[0, 4, 4, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-visible" data-testid="card-detailed-comparison">
        <CardHeader>
          <CardTitle>Detailed Course Comparison</CardTitle>
          <CardDescription>Side-by-side grade comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-3 text-left font-medium">Course</th>
                  {allTerms.map((term) => (
                    <th key={term.termName} className="pb-3 text-center font-medium">
                      {term.termName}
                    </th>
                  ))}
                  <th className="pb-3 text-center font-medium">Change</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course, idx) => {
                  const currentGrade = allTerms[0].courses[idx]?.grade;
                  const previousGrade = allTerms[1]?.courses[idx]?.grade;
                  const change = currentGrade !== null && previousGrade !== null
                    ? currentGrade - previousGrade
                    : null;

                  return (
                    <tr key={course.name} className="border-b last:border-0" data-testid={`row-comparison-${idx}`}>
                      <td className="py-3 pr-4">
                        <span className="font-medium">{course.name}</span>
                      </td>
                      {allTerms.map((term) => {
                        const termCourse = term.courses[idx];
                        return (
                          <td key={term.termName} className="py-3 text-center">
                            {termCourse?.grade !== null ? (
                              <Badge className={getGradeBgColor(termCourse.letterGrade)}>
                                {termCourse.grade.toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="py-3 text-center">
                        {change !== null ? (
                          <span className={`flex items-center justify-center gap-1 font-medium ${
                            change > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : change < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                          }`}>
                            {change > 0 ? <TrendingUp className="h-3 w-3" /> : change < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                            {change > 0 ? "+" : ""}{change.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {courses.length === 0 && (
        <Card className="overflow-visible">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Data Available</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Log in with your StudentVue credentials to view term comparisons
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
