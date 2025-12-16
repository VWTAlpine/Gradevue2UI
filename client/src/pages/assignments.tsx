import { useState, useMemo } from "react";
import { useGrades } from "@/lib/gradeContext";
import { AssignmentRow } from "@/components/assignment-row";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getGradeBgColor, getGradeColor } from "@shared/schema";
import { List, BarChart3, ChevronDown, ChevronRight, FlaskConical, FileText } from "lucide-react";
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

type ViewMode = "list" | "chart";

export default function AssignmentsPage() {
  const { gradebook, hypotheticalMode, setHypotheticalMode } = useGrades();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set(["0"]));

  const courses = gradebook?.courses || [];

  const filteredCourses = useMemo(() => {
    if (selectedCourseFilter === "all") {
      return courses;
    }
    return courses.filter((_, index) => index.toString() === selectedCourseFilter);
  }, [courses, selectedCourseFilter]);

  const toggleCourseExpanded = (index: string) => {
    setExpandedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const chartData = useMemo(() => {
    return courses.map((course) => ({
      name: course.name.length > 15 ? course.name.substring(0, 15) + "..." : course.name,
      fullName: course.name,
      grade: course.grade ?? 0,
      letterGrade: course.letterGrade,
    }));
  }, [courses]);

  const getBarColor = (letterGrade: string) => {
    const grade = letterGrade.charAt(0).toUpperCase();
    switch (grade) {
      case "A":
        return "#10b981";
      case "B":
        return "#3b82f6";
      case "C":
        return "#f59e0b";
      case "D":
        return "#f97316";
      case "F":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            All Assignments
          </h1>
          <p className="mt-1 text-muted-foreground">
            View and manage your assignments across all courses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border p-1">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === "chart" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("chart")}
              className="gap-2"
              data-testid="button-view-chart"
            >
              <BarChart3 className="h-4 w-4" />
              Chart
            </Button>
          </div>

          <div className="flex items-center gap-2 rounded-lg border p-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="hypothetical" className="text-sm">
              Hypothetical Mode
            </Label>
            <Switch
              id="hypothetical"
              checked={hypotheticalMode}
              onCheckedChange={setHypotheticalMode}
              data-testid="switch-hypothetical"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCourseFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCourseFilter("all")}
          data-testid="filter-all"
        >
          All Courses
        </Button>
        {courses.map((course, index) => (
          <Button
            key={index}
            variant={selectedCourseFilter === index.toString() ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCourseFilter(index.toString())}
            data-testid={`filter-course-${index}`}
          >
            {course.name.length > 20
              ? course.name.substring(0, 20) + "..."
              : course.name}
          </Button>
        ))}
      </div>

      {viewMode === "list" ? (
        <div className="space-y-4">
          {filteredCourses.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No assignments found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Assignments will appear here once you have grade data
              </p>
            </div>
          ) : (
            filteredCourses.map((course, index) => {
              const actualIndex = courses.findIndex((c) => c.id === course.id);
              const indexKey = actualIndex >= 0 ? actualIndex.toString() : index.toString();
              const isExpanded = expandedCourses.has(indexKey);

              return (
                <Collapsible
                  key={course.id || index}
                  open={isExpanded}
                  onOpenChange={() => toggleCourseExpanded(indexKey)}
                >
                  <Card className="overflow-visible" data-testid={`course-card-${index}`}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer pb-3" data-testid={`collapsible-trigger-${index}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <div>
                              <CardTitle className="text-lg" data-testid={`course-name-${index}`}>{course.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {course.teacher} {course.period ? `Period ${course.period}` : ""}
                              </p>
                            </div>
                          </div>
                          <div className="text-right" data-testid={`course-grade-${index}`}>
                            <p className={`text-2xl font-bold ${getGradeColor(course.letterGrade)}`} data-testid={`course-percentage-${index}`}>
                              {course.grade?.toFixed(1)}%
                            </p>
                            <Badge className={getGradeBgColor(course.letterGrade)} data-testid={`course-letter-${index}`}>
                              {course.letterGrade}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-3 pt-0">
                        {course.assignments && course.assignments.length > 0 ? (
                          course.assignments.map((assignment, aIndex) => (
                            <AssignmentRow
                              key={aIndex}
                              assignment={assignment}
                              index={aIndex}
                            />
                          ))
                        ) : (
                          <p className="py-4 text-center text-sm text-muted-foreground">
                            No assignments for this course
                          </p>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })
          )}
        </div>
      ) : (
        <Card className="overflow-visible" data-testid="card-grade-distribution">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
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
                            <p className="font-medium">{data.fullName}</p>
                            <p className="text-sm text-muted-foreground">
                              Grade: {data.grade.toFixed(1)}% ({data.letterGrade})
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="grade" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getBarColor(entry.letterGrade)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
