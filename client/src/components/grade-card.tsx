import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Course } from "@shared/schema";
import { getGradeBgColor, getGradeColor } from "@shared/schema";
import { ChevronRight, AlertTriangle } from "lucide-react";

interface GradeCardProps {
  course: Course;
  index: number;
  onSelect?: (course: Course) => void;
}

function countMissingAssignments(course: Course): number {
  return course.assignments.filter((a) => {
    const scoreLower = a.score?.toLowerCase() || "";
    if (scoreLower.includes("missing") || scoreLower === "m" || scoreLower === "not turned in") {
      return true;
    }
    if (a.pointsEarned === 0 && a.pointsPossible && a.pointsPossible > 0) {
      const notesLower = a.notes?.toLowerCase() || "";
      if (notesLower.includes("missing") || notesLower.includes("not turned in")) {
        return true;
      }
    }
    return false;
  }).length;
}

export function GradeCard({ course, index, onSelect }: GradeCardProps) {
  const gradePercentage = course.grade ?? 0;
  const missingCount = countMissingAssignments(course);

  return (
    <Card className="overflow-visible" data-testid={`card-course-${index}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <h3 className="font-semibold leading-tight line-clamp-2">{course.name}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {missingCount > 0 && (
            <Badge
              variant="destructive"
              className="gap-1"
              data-testid={`badge-missing-${index}`}
            >
              <AlertTriangle className="h-3 w-3" />
              {missingCount}
            </Badge>
          )}
          <Badge
            className={`text-sm font-bold ${getGradeBgColor(course.letterGrade)}`}
          >
            {course.letterGrade}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="text-sm text-muted-foreground">
          <p>{course.teacher || "Teacher"}</p>
          <p>Period {course.period || "N/A"}</p>
        </div>

        <div className="flex items-baseline justify-between gap-2 pt-2">
          <span className="text-sm text-muted-foreground">Current Grade:</span>
          <span className={`text-3xl font-bold ${getGradeColor(course.letterGrade)}`} data-testid={`grade-percentage-${index}`}>
            {gradePercentage.toFixed(1)}%
          </span>
        </div>

        <div className="pt-3 border-t">
          <Link href={`/course/${index}`} onClick={() => onSelect?.(course)}>
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full justify-between text-foreground" 
              data-testid={`button-view-course-${index}`}
            >
              <span className="text-xs">View Details</span>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
