import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Course } from "@shared/schema";
import { getGradeBgColor, getGradeColor } from "@shared/schema";
import { ChevronRight } from "lucide-react";

interface GradeCardProps {
  course: Course;
  index: number;
  onSelect?: (course: Course) => void;
}

export function GradeCard({ course, index, onSelect }: GradeCardProps) {
  const gradePercentage = course.grade ?? 0;

  return (
    <Card className="overflow-visible" data-testid={`card-course-${index}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
        <h3 className="font-semibold leading-tight line-clamp-2">{course.name}</h3>
        <Badge
          className={`shrink-0 text-sm font-bold ${getGradeBgColor(course.letterGrade)}`}
        >
          {course.letterGrade}
        </Badge>
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

        <div className="pt-3 border-t border-emerald-500">
          <Link href={`/course/${index}`} onClick={() => onSelect?.(course)}>
            <Button 
              variant="ghost" 
              className="w-full justify-between text-emerald-600 dark:text-emerald-400" 
              data-testid={`button-view-course-${index}`}
            >
              View Details
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
