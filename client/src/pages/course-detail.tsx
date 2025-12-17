import { useEffect, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useGrades } from "@/lib/gradeContext";
import { AssignmentRow } from "@/components/assignment-row";
import { CategoryBreakdownCompact } from "@/components/category-breakdown";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getGradeBgColor, getGradeColor, getLetterGrade } from "@shared/schema";
import { ArrowLeft, User, MapPin, FileText, BarChart3, LineChart, FlaskConical, Plus, X } from "lucide-react";
import { useState } from "react";
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
  PieChart,
  Pie,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categoryColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#06b6d4"];

export default function CourseDetailPage() {
  const [, params] = useRoute("/course/:id");
  const [, setLocation] = useLocation();
  const { 
    gradebook, 
    hypotheticalGradebook,
    selectedCourse, 
    setSelectedCourse,
    hypotheticalMode,
    setHypotheticalMode,
    courseOverrides,
    addHypotheticalAssignment,
    removeHypotheticalAssignment,
    clearAllOverrides,
  } = useGrades();

  const [chartType, setChartType] = useState<"bar" | "line">("line");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    name: "",
    type: "Assignment",
    pointsEarned: "",
    pointsPossible: "",
  });

  const courseId = params?.id;
  const activeGradebook = hypotheticalMode && hypotheticalGradebook ? hypotheticalGradebook : gradebook;
  const courses = activeGradebook?.courses || [];

  useEffect(() => {
    if (courseId && courses.length > 0 && !selectedCourse) {
      const index = parseInt(courseId);
      if (!isNaN(index) && index >= 0 && index < courses.length) {
        setSelectedCourse(courses[index]);
      }
    }
  }, [courseId, courses, selectedCourse, setSelectedCourse]);

  const course = courseId ? courses[parseInt(courseId)] : selectedCourse;

  // Calculate category scores from assignments if API returns 0
  const computedCategories = useMemo(() => {
    if (!course?.categories) return [];
    
    return course.categories.map((cat) => {
      // If score is already populated, use it
      if (cat.score > 0) {
        return cat;
      }
      
      // Calculate from assignments
      if (course.assignments && course.assignments.length > 0) {
        const categoryAssignments = course.assignments.filter(a => a.type === cat.name);
        let totalEarned = 0;
        let totalPossible = 0;
        
        for (const a of categoryAssignments) {
          if (a.pointsEarned !== null && a.pointsEarned !== undefined && 
              a.pointsPossible !== null && a.pointsPossible !== undefined && a.pointsPossible > 0) {
            totalEarned += a.pointsEarned;
            totalPossible += a.pointsPossible;
          } else if (a.points) {
            const pointsMatch = a.points.match(/([\d.]+)\s*\/\s*([\d.]+)/);
            if (pointsMatch) {
              totalEarned += parseFloat(pointsMatch[1]) || 0;
              totalPossible += parseFloat(pointsMatch[2]) || 0;
            }
          } else if (a.score && a.score !== "Not Graded" && a.score !== "N/A") {
            const scoreMatch = a.score.match(/^([\d.]+)\s*(?:out of|\/)\s*([\d.]+)/i);
            if (scoreMatch) {
              totalEarned += parseFloat(scoreMatch[1]) || 0;
              totalPossible += parseFloat(scoreMatch[2]) || 0;
            }
          }
        }
        
        const calculatedScore = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
        return { ...cat, score: calculatedScore };
      }
      
      return cat;
    });
  }, [course]);

  const categoryChartData = useMemo(() => {
    if (!computedCategories || computedCategories.length === 0) return [];
    return computedCategories.map((cat, index) => ({
      name: cat.name,
      score: cat.score,
      weight: cat.weight,
      color: categoryColors[index % categoryColors.length],
    }));
  }, [computedCategories]);

  // Detect missing assignments
  const missingAssignments = useMemo(() => {
    if (!course?.assignments) return [];
    const now = new Date();
    
    return course.assignments.filter(a => {
      const scoreLower = (a.score || "").toLowerCase();
      const notesLower = (a.notes || "").toLowerCase();
      
      // Explicit "missing" in score or notes
      if (scoreLower.includes("missing") || notesLower.includes("missing")) {
        return true;
      }
      
      // "Not Graded" with a past due date is considered missing
      if (scoreLower === "not graded" || scoreLower === "n/a" || scoreLower === "") {
        if (a.dueDate) {
          const dueDate = new Date(a.dueDate);
          // Check if due date is valid and in the past
          if (!isNaN(dueDate.getTime()) && dueDate < now) {
            // Any ungraded assignment past its due date is likely missing
            // Check if there's no actual score (pointsEarned is 0, undefined, or null)
            const hasNoScore = a.pointsEarned === 0 || 
                               a.pointsEarned === undefined || 
                               a.pointsEarned === null ||
                               (a.points && a.points.match(/^0\s*\/\s*[\d.]+/));
            if (hasNoScore) {
              return true;
            }
          }
        }
      }
      
      return false;
    });
  }, [course]);

  // Same parseScore logic as AssignmentRow - handles all data formats
  const getAssignmentPercentage = (a: any): number | null => {
    // Check numeric fields first
    if (a.pointsEarned !== null && a.pointsEarned !== undefined &&
        a.pointsPossible !== null && a.pointsPossible !== undefined && a.pointsPossible > 0) {
      return (a.pointsEarned / a.pointsPossible) * 100;
    }
    
    const score = a.score;
    const points = a.points;
    
    if (!score || score === "Not Graded" || score === "N/A") {
      // Still try points field
      if (points) {
        const pointsMatch = points.match(/([\d.]+)\s*\/\s*([\d.]+)/);
        if (pointsMatch) {
          const earned = parseFloat(pointsMatch[1]);
          const max = parseFloat(pointsMatch[2]);
          return max > 0 ? (earned / max) * 100 : null;
        }
      }
      return null;
    }

    // Check score for "X out of Y" or "X/Y" format
    const scoreMatch = score.match(/^([\d.]+)\s*(?:out of|\/)\s*([\d.]+)/i);
    if (scoreMatch) {
      const earned = parseFloat(scoreMatch[1]);
      const max = parseFloat(scoreMatch[2]);
      return max > 0 ? (earned / max) * 100 : null;
    }

    // Check points field for "X/Y" format
    if (points) {
      const pointsMatch = points.match(/([\d.]+)\s*\/\s*([\d.]+)/);
      if (pointsMatch) {
        const earned = parseFloat(pointsMatch[1]);
        const max = parseFloat(pointsMatch[2]);
        return max > 0 ? (earned / max) * 100 : null;
      }
    }

    // Try parsing score as a simple number (percentage)
    const simpleNumber = parseFloat(score);
    if (!isNaN(simpleNumber)) {
      return simpleNumber;
    }

    return null;
  };

  const gradeHistoryData = useMemo(() => {
    if (!course?.assignments) return [];
    
    // Get all assignments and calculate percentages
    const withScores = course.assignments
      .map((a, originalIdx) => ({
        assignment: a,
        percentage: getAssignmentPercentage(a),
        originalIdx,
      }))
      .filter(item => item.percentage !== null);
    
    // Take the last 20 graded assignments (reverse to show oldest first)
    const recent = withScores.slice().reverse().slice(0, 20);
    
    return recent.map((item, idx) => ({
      name: item.assignment.name.length > 15 ? item.assignment.name.substring(0, 15) + "..." : item.assignment.name,
      fullName: item.assignment.name,
      score: Math.round((item.percentage as number) * 10) / 10,
      index: idx + 1,
    }));
  }, [course]);

  const displayGrade = course?.grade ?? 0;
  const displayLetter = course?.letterGrade ?? "N/A";

  const overrides = course ? courseOverrides.get(course.id) : null;
  const addedAssignments = overrides?.addedAssignments || [];

  const handleAddAssignment = () => {
    if (!course || !newAssignment.name || !newAssignment.pointsEarned || !newAssignment.pointsPossible) return;
    
    addHypotheticalAssignment(course.id, {
      id: `hypo-${Date.now()}`,
      name: newAssignment.name,
      type: newAssignment.type,
      pointsEarned: parseFloat(newAssignment.pointsEarned),
      pointsPossible: parseFloat(newAssignment.pointsPossible),
    });
    setNewAssignment({ name: "", type: "Assignment", pointsEarned: "", pointsPossible: "" });
    setAddDialogOpen(false);
  };

  const handleModeToggle = (enabled: boolean) => {
    setHypotheticalMode(enabled);
    if (!enabled) {
      clearAllOverrides();
    }
  };

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

  const hasCategories = categoryChartData.length > 0;
  const hasAssignmentHistory = gradeHistoryData.length > 0;
  const showChartToggle = hasCategories && hasAssignmentHistory;

  return (
    <div className="space-y-4">
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
              {showChartToggle && (
                <div className="flex items-center gap-2 rounded-lg border p-1">
                  <Button
                    variant={chartType === "bar" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setChartType("bar")}
                    data-testid="button-chart-bar"
                  >
                    <BarChart3 className="mr-1 h-4 w-4" />
                    Categories
                  </Button>
                  <Button
                    variant={chartType === "line" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setChartType("line")}
                    data-testid="button-chart-line"
                  >
                    <LineChart className="mr-1 h-4 w-4" />
                    Grades
                  </Button>
                </div>
              )}
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
          {(hasAssignmentHistory || hasCategories) && (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "bar" && hasCategories ? (
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
                ) : hasAssignmentHistory ? (
                  <RechartsLineChart
                    data={gradeHistoryData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="index"
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                      label={{ value: "Assignment #", position: "insideBottom", offset: -5, fontSize: 10 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                      className="fill-muted-foreground"
                      label={{ value: "Score %", angle: -90, position: "insideLeft", fontSize: 10 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-card p-2 shadow-lg text-sm">
                              <p className="font-medium">{data.fullName}</p>
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
                ) : (
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
                                Score: {data.score.toFixed(1)}%
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
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FlaskConical className={`h-4 w-4 ${hypotheticalMode ? "text-purple-500" : "text-muted-foreground"}`} />
          <Label htmlFor="hypothetical-mode" className="text-sm cursor-pointer">
            What-If Mode
          </Label>
          <Switch
            id="hypothetical-mode"
            checked={hypotheticalMode}
            onCheckedChange={handleModeToggle}
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
        <Card className="overflow-visible border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10" data-testid="card-hypothetical">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FlaskConical className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium text-purple-700 dark:text-purple-300">What-If Mode Active</p>
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    Add hypothetical assignments to see how they affect your grade
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-2 border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-300"
                      data-testid="button-add-hypothetical"
                    >
                      <Plus className="h-4 w-4" />
                      Add Assignment
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
                            {course.categories && course.categories.length > 0 ? (
                              course.categories.map((cat) => (
                                <SelectItem key={cat.name} value={cat.name}>
                                  {cat.name} ({cat.weight}%)
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="Assignment">Assignment</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
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
                        onClick={handleAddAssignment} 
                        className="w-full"
                        data-testid="button-confirm-add"
                      >
                        Add Assignment
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
            </div>
            {addedAssignments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Hypothetical Assignments:
                </p>
                {addedAssignments.map((ha) => (
                  <div 
                    key={ha.id} 
                    className="flex items-center justify-between rounded-md bg-purple-100/50 dark:bg-purple-900/20 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">{ha.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({ha.pointsEarned}/{ha.pointsPossible})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHypotheticalAssignment(course.id, ha.id)}
                      className="h-6 w-6"
                      data-testid={`button-remove-hypo-${ha.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <CategoryBreakdownCompact categories={computedCategories} />

      {missingAssignments.length > 0 && (
        <Alert variant="destructive" data-testid="alert-missing-assignments">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <span className="font-semibold">{missingAssignments.length} missing assignment{missingAssignments.length !== 1 ? 's' : ''}</span>
            {' '}detected in this course
          </AlertDescription>
        </Alert>
      )}

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
