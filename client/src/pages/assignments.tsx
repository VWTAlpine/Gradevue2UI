import { useState, useMemo } from "react";
import { useGrades, type HypotheticalAssignment } from "@/lib/gradeContext";
import { AssignmentRow } from "@/components/assignment-row";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getGradeBgColor, getGradeColor } from "@shared/schema";
import { List, BarChart3, ChevronDown, ChevronRight, FlaskConical, FileText, Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const { 
    gradebook, 
    hypotheticalGradebook,
    hypotheticalMode, 
    setHypotheticalMode,
    courseOverrides,
    updateAssignmentScore,
    addHypotheticalAssignment,
    removeHypotheticalAssignment,
    clearAllOverrides,
  } = useGrades();
  
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("all");
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set(["0"]));
  const [addDialogOpen, setAddDialogOpen] = useState<string | null>(null);
  const [newAssignment, setNewAssignment] = useState({ name: "", type: "Assignment", pointsEarned: "", pointsPossible: "" });

  const activeGradebook = hypotheticalMode && hypotheticalGradebook ? hypotheticalGradebook : gradebook;
  const courses = activeGradebook?.courses || [];

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

  const handleAddAssignment = (courseId: string) => {
    if (!newAssignment.pointsEarned || !newAssignment.pointsPossible) return;
    
    const assignmentName = newAssignment.name.trim() || `Hypothetical ${Date.now().toString().slice(-4)}`;
    
    const assignment: HypotheticalAssignment = {
      id: `hypo-${Date.now()}`,
      name: assignmentName,
      type: newAssignment.type,
      pointsEarned: parseFloat(newAssignment.pointsEarned),
      pointsPossible: parseFloat(newAssignment.pointsPossible),
    };
    
    addHypotheticalAssignment(courseId, assignment);
    setNewAssignment({ name: "", type: "Assignment", pointsEarned: "", pointsPossible: "" });
    setAddDialogOpen(null);
  };

  const handleModeToggle = (enabled: boolean) => {
    setHypotheticalMode(enabled);
    if (!enabled) {
      clearAllOverrides();
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
            <FlaskConical className={`h-4 w-4 ${hypotheticalMode ? "text-purple-500" : "text-muted-foreground"}`} />
            <Label htmlFor="hypothetical" className="text-sm">
              What-If Mode
            </Label>
            <Switch
              id="hypothetical"
              checked={hypotheticalMode}
              onCheckedChange={handleModeToggle}
              data-testid="switch-hypothetical"
            />
          </div>
        </div>
      </div>

      {hypotheticalMode && (
        <Card className="overflow-visible border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FlaskConical className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium text-purple-700 dark:text-purple-300">What-If Mode Active</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Edit scores or add assignments to see how they affect your grades
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllOverrides}
                className="border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300"
                data-testid="button-reset-hypothetical"
              >
                Reset Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCourseFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCourseFilter("all")}
          data-testid="filter-all"
        >
          All Courses
        </Button>
        {(gradebook?.courses || []).map((course, index) => (
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
              const actualIndex = (gradebook?.courses || []).findIndex((c) => c.id === course.id);
              const indexKey = actualIndex >= 0 ? actualIndex.toString() : index.toString();
              const isExpanded = expandedCourses.has(indexKey);
              const overrides = courseOverrides.get(course.id);
              const hasChanges = overrides && (overrides.modifiedAssignments.length > 0 || overrides.addedAssignments.length > 0);

              return (
                <Collapsible
                  key={course.id || index}
                  open={isExpanded}
                  onOpenChange={() => toggleCourseExpanded(indexKey)}
                >
                  <Card className={`overflow-visible ${hasChanges ? "border-purple-300 dark:border-purple-700" : ""}`} data-testid={`course-card-${index}`}>
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
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg" data-testid={`course-name-${index}`}>{course.name}</CardTitle>
                                {hasChanges && (
                                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                    Modified
                                  </Badge>
                                )}
                              </div>
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
                              courseId={course.id}
                              editable={hypotheticalMode}
                              onScoreChange={hypotheticalMode ? (earned, possible) => updateAssignmentScore(course.id, aIndex, earned, possible) : undefined}
                            />
                          ))
                        ) : (
                          <p className="py-4 text-center text-sm text-muted-foreground">
                            No assignments for this course
                          </p>
                        )}
                        
                        {hypotheticalMode && (
                          <Dialog open={addDialogOpen === course.id} onOpenChange={(open) => setAddDialogOpen(open ? course.id : null)}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="w-full mt-2 gap-2 border-dashed"
                                data-testid={`button-add-assignment-${index}`}
                              >
                                <Plus className="h-4 w-4" />
                                Add Hypothetical Assignment
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add Hypothetical Assignment</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                  <Label htmlFor="assignment-name">Assignment Name</Label>
                                  <Input
                                    id="assignment-name"
                                    placeholder="e.g., Final Exam"
                                    value={newAssignment.name}
                                    onChange={(e) => setNewAssignment(prev => ({ ...prev, name: e.target.value }))}
                                    data-testid="input-assignment-name"
                                  />
                                </div>
                                {course.categories && course.categories.length > 0 && (
                                  <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                      value={newAssignment.type}
                                      onValueChange={(value) => setNewAssignment(prev => ({ ...prev, type: value }))}
                                    >
                                      <SelectTrigger data-testid="select-category">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {course.categories.map((cat) => (
                                          <SelectItem key={cat.name} value={cat.name}>
                                            {cat.name} ({cat.weight}%)
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="points-earned">Points Earned</Label>
                                    <Input
                                      id="points-earned"
                                      type="number"
                                      placeholder="90"
                                      value={newAssignment.pointsEarned}
                                      onChange={(e) => setNewAssignment(prev => ({ ...prev, pointsEarned: e.target.value }))}
                                      data-testid="input-points-earned"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="points-possible">Points Possible</Label>
                                    <Input
                                      id="points-possible"
                                      type="number"
                                      placeholder="100"
                                      value={newAssignment.pointsPossible}
                                      onChange={(e) => setNewAssignment(prev => ({ ...prev, pointsPossible: e.target.value }))}
                                      data-testid="input-points-possible"
                                    />
                                  </div>
                                </div>
                                <Button 
                                  className="w-full" 
                                  onClick={() => handleAddAssignment(course.id)}
                                  data-testid="button-confirm-add"
                                >
                                  Add Assignment
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
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
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Grade Distribution</CardTitle>
              {hypotheticalMode && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  What-If Mode
                </Badge>
              )}
            </div>
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
