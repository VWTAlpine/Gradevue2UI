import { useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useGrades } from "@/lib/gradeContext";
import { AssignmentRow } from "@/components/assignment-row";
import { CategoryBreakdown } from "@/components/category-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGradeBgColor, getGradeColor } from "@shared/schema";
import { ArrowLeft, User, MapPin, FileText } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const categoryColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

export default function CourseDetailPage() {
  const [, params] = useRoute("/course/:id");
  const [, setLocation] = useLocation();
  const { gradebook, selectedCourse, setSelectedCourse } = useGrades();

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {course.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {course.teacher}
              </span>
              {course.period && (
                <span className="flex items-center gap-1">
                  Period {course.period}
                </span>
              )}
              {course.room && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Room {course.room}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right" data-testid="course-grade-summary">
          <p className={`text-4xl font-bold ${getGradeColor(course.letterGrade)}`} data-testid="text-course-grade">
            {course.grade?.toFixed(1)}%
          </p>
          <Badge className={`mt-1 text-lg ${getGradeBgColor(course.letterGrade)}`} data-testid="badge-course-letter">
            {course.letterGrade}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments
          </TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">
            Grade Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6" data-testid="tab-content-overview">
          <CategoryBreakdown categories={course.categories || []} />

          {categoryChartData.length > 0 && (
            <Card className="overflow-visible">
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={categoryChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        className="fill-muted-foreground"
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-card p-3 shadow-lg">
                                <p className="font-medium">{data.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Score: {data.score.toFixed(1)}%
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Weight: {data.weight}%
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
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4" data-testid="tab-content-assignments">
          {course.assignments && course.assignments.length > 0 ? (
            course.assignments.map((assignment, aIndex) => (
              <AssignmentRow key={aIndex} assignment={assignment} index={aIndex} />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No assignments</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  No assignments have been recorded for this course yet
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-6" data-testid="tab-content-trends">
          <Card className="overflow-visible">
            <CardHeader>
              <CardTitle>Grade Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center">
                <p className="text-muted-foreground">
                  Grade trend data will be available as more assignments are graded
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
