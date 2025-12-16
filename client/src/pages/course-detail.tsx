import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGrades } from "@/lib/gradeContext";
import { AssignmentRow } from "@/components/assignment-row";
import { CategoryBreakdownCompact } from "@/components/category-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getGradeBgColor, getGradeColor, getLetterGrade } from "@shared/schema";
import { ArrowLeft, User, MapPin, FileText, BarChart3, LineChart, FlaskConical } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const categoryColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

interface HypotheticalAssignment {
  name: string;
  score: number;
  maxScore: number;
  category: string;
}

export default function CourseDetailPage() {
  const [, params] = useRoute("/course/:id");
  const [, setLocation] = useLocation();
  const { gradebook, selectedCourse, setSelectedCourse } = useGrades();

  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [hypotheticalMode, setHypotheticalMode] = useState(false);
  const [hypotheticalAssignments, setHypotheticalAssignments] = useState<HypotheticalAssignment[]>([]);

  const courseId = params?.id;
  const courses = gradebook?.courses || [];

  useEffect(() => {
    if (courseId && courses.length > 0 && !selectedCourse) {
      const index = parseInt(courseId);
      if (!isNaN(index) && index >= 0 && index < courses.length) {
        setSelectedCourse(courses[index]);
      }
    }
  }, [courseId, courses, selectedCourse, setSelectedCourse]);

  const course = selectedCourse || (courseId ? courses[parseInt(courseId)] : null);

  const categoryChartData = useMemo(() => {
    if (!course?.categories) return [];
    return course.categories.map((cat, index) => ({
      name: cat.name,
      score: cat.score,
      weight: cat.weight,
      color: categoryColors[index % categoryColors.length],
    }));
  }, [course]);

  const gradeHistoryData = useMemo(() => {
    if (!course?.assignments) return [];
    
    const gradedAssignments = course.assignments
      .filter(a => a.score && !a.score.includes("Not Graded"))
      .slice()
      .reverse()
      .slice(0, 10);
    
    return gradedAssignments.map((a, idx) => {
      const pointsMatch = a.points?.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
      let score = 0;
      if (pointsMatch) {
        const earned = parseFloat(pointsMatch[1]);
        const possible = parseFloat(pointsMatch[2]);
        score = possible > 0 ? (earned / possible) * 100 : 0;
      }
      return {
        name: a.name.length > 15 ? a.name.substring(0, 15) + "..." : a.name,
        fullName: a.name,
        score: Math.round(score * 10) / 10,
        index: idx + 1,
      };
    });
  }, [course]);

  const calculateHypotheticalGrade = useMemo(() => {
    if (!hypotheticalMode || !course) return course?.grade ?? 0;
    
    let baseGrade = course.grade ?? 0;
    hypotheticalAssignments.forEach(ha => {
      const percent = (ha.score / ha.maxScore) * 100;
      baseGrade = (baseGrade + percent) / 2;
    });
    return baseGrade;
  }, [hypotheticalMode, course, hypotheticalAssignments]);

  const displayGrade = hypotheticalMode ? calculateHypotheticalGrade : (course?.grade ?? 0);
  const displayLetter = hypotheticalMode ? getLetterGrade(displayGrade) : (course?.letterGrade ?? "N/A");

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="mt-4 text-xl font-semibold">Course not found</h2>
        <p className="mt-2 text-muted-foreground">
          The course you're looking for doesn't exist
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => setLocation("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categoryChartData.length > 0 && (
        <Card className="overflow-visible" data-testid="card-chart">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation("/dashboard")}
                  data-testid="button-back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <CardTitle className="text-lg">{course.name}</CardTitle>
                  <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    <User className="h-3 w-3" />
                    {course.teacher}
                    {course.period && <span>Period {course.period}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-lg border p-1">
                  <Button
                    variant={chartType === "bar" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setChartType("bar")}
                    data-testid="button-chart-bar"
                  >
                    <BarChart3 className="mr-1 h-4 w-4" />
                    Bar
                  </Button>
                  <Button
                    variant={chartType === "line" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setChartType("line")}
                    data-testid="button-chart-line"
                  >
                    <LineChart className="mr-1 h-4 w-4" />
                    Line
                  </Button>
                </div>
                <div className="text-right" data-testid="course-grade-summary">
                  <p className={`text-2xl font-bold ${getGradeColor(displayLetter)}`} data-testid="text-course-grade">
                    {displayGrade.toFixed(1)}%
                  </p>
                  <Badge className={`${getGradeBgColor(displayLetter)}`} data-testid="badge-course-letter">
                    {displayLetter}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" ? (
                  <BarChart
                    data={categoryChartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-card p-2 shadow-lg text-sm">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-muted-foreground">
                                Score: {data.score.toFixed(1)}% | Weight: {data.weight}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                ) : (
                  <RechartsLineChart
                    data={gradeHistoryData.length > 0 ? gradeHistoryData : categoryChartData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey={gradeHistoryData.length > 0 ? "index" : "name"}
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-card p-2 shadow-lg text-sm">
                              <p className="font-medium">{data.fullName || data.name}</p>
                              <p className="text-muted-foreground">
                                Score: {data.score.toFixed(1)}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </RechartsLineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className={`h-4 w-4 ${hypotheticalMode ? "text-primary" : "text-muted-foreground"}`} />
          <Label htmlFor="hypothetical-mode" className="text-sm cursor-pointer">
            Hypothetical Mode
          </Label>
          <Switch
            id="hypothetical-mode"
            checked={hypotheticalMode}
            onCheckedChange={setHypotheticalMode}
            data-testid="switch-hypothetical"
          />
        </div>
        {course.room && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Room {course.room}
          </span>
        )}
      </div>

      {hypotheticalMode && (
        <Card className="overflow-visible border-primary/20 bg-primary/5" data-testid="card-hypothetical">
          <CardContent className="py-3">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Hypothetical Mode is active. The grade shown reflects simulated scenarios.
            </p>
          </CardContent>
        </Card>
      )}

      <CategoryBreakdownCompact categories={course.categories || []} />

      <Card className="overflow-visible" data-testid="card-assignments">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {course.assignments && course.assignments.length > 0 ? (
            course.assignments.map((assignment, aIndex) => (
              <AssignmentRow key={aIndex} assignment={assignment} index={aIndex} />
            ))
          ) : (
            <div className="py-6 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-3 text-sm font-medium">No assignments</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                No assignments have been recorded for this course yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
