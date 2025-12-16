import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
    <Card className="overflow-visible transition-all" data-testid={`card-course-${index}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="space-y-1">
          <h3 className="font-semibold leading-tight">{course.name}</h3>
          <p className="text-sm text-muted-foreground">
            {course.teacher} {course.period ? `Period ${course.period}` : ""}
          </p>
        </div>
        <Badge
          className={`shrink-0 text-base font-bold ${getGradeBgColor(course.letterGrade)}`}
        >
          {course.letterGrade}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Grade:</p>
          <p className={`text-4xl font-bold ${getGradeColor(course.letterGrade)}`} data-testid={`grade-percentage-${index}`}>
            {gradePercentage.toFixed(1)}%
          </p>
        </div>

        <Progress value={gradePercentage} className="h-2" />

        {course.categories && course.categories.length > 0 && (
          <div className="space-y-2">
            {course.categories.slice(0, 3).map((category, catIndex) => (
              <div key={catIndex} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {category.name} ({category.weight}%)
                </span>
                <span className="font-medium">{category.score.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        )}

        <Link href={`/course/${index}`} onClick={() => onSelect?.(course)}>
          <Button variant="ghost" className="w-full justify-between" data-testid={`button-view-course-${index}`}>
            View Details
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
