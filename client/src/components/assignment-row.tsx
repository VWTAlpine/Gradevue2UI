import { Badge } from "@/components/ui/badge";
import type { Assignment } from "@shared/schema";
import { getGradeColor } from "@shared/schema";

interface AssignmentRowProps {
  assignment: Assignment;
  showCourse?: boolean;
  courseName?: string;
  index?: number;
}

export function AssignmentRow({ assignment, showCourse, courseName, index = 0 }: AssignmentRowProps) {
  const parseScore = () => {
    const score = assignment.score;
    const points = assignment.points;
    
    if (!score || score === "Not Graded" || score === "N/A") {
      return { earned: null, max: null, percentage: null };
    }

    const scoreMatch = score.match(/^([\d.]+)\s*(?:out of|\/)\s*([\d.]+)/i);
    if (scoreMatch) {
      const earned = parseFloat(scoreMatch[1]);
      const max = parseFloat(scoreMatch[2]);
      return { earned, max, percentage: max > 0 ? (earned / max) * 100 : null };
    }

    const pointsMatch = points.match(/([\d.]+)\s*\/\s*([\d.]+)/);
    if (pointsMatch) {
      const earned = parseFloat(pointsMatch[1]);
      const max = parseFloat(pointsMatch[2]);
      return { earned, max, percentage: max > 0 ? (earned / max) * 100 : null };
    }

    const simpleNumber = parseFloat(score);
    if (!isNaN(simpleNumber)) {
      return { earned: simpleNumber, max: 100, percentage: simpleNumber };
    }

    return { earned: null, max: null, percentage: null };
  };

  const { earned, max, percentage } = parseScore();
  
  const getLetterFromPercentage = (pct: number | null) => {
    if (pct === null) return "N/A";
    if (pct >= 93) return "A";
    if (pct >= 90) return "A-";
    if (pct >= 87) return "B+";
    if (pct >= 83) return "B";
    if (pct >= 80) return "B-";
    if (pct >= 77) return "C+";
    if (pct >= 73) return "C";
    if (pct >= 70) return "C-";
    if (pct >= 67) return "D+";
    if (pct >= 63) return "D";
    if (pct >= 60) return "D-";
    return "F";
  };

  const letterGrade = getLetterFromPercentage(percentage);

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4" data-testid={`assignment-row-${index}`}>
      <div className="min-w-0 flex-1 space-y-1">
        <h4 className="font-medium leading-tight" data-testid={`assignment-name-${index}`}>{assignment.name}</h4>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {assignment.type && (
            <Badge variant="secondary" className="text-xs">
              {assignment.type}
            </Badge>
          )}
          {assignment.date && <span>Assigned: {assignment.date}</span>}
          {assignment.dueDate && <span>Due: {assignment.dueDate}</span>}
          {max !== null && <span>Max: {max} pts</span>}
        </div>
        {showCourse && courseName && (
          <p className="text-xs text-muted-foreground">{courseName}</p>
        )}
      </div>
      <div className="shrink-0 text-right" data-testid={`assignment-score-${index}`}>
        {earned !== null && max !== null ? (
          <>
            <p className="text-lg font-bold" data-testid={`assignment-points-${index}`}>
              {earned}/{max}
            </p>
            <p className={`text-sm font-medium ${getGradeColor(letterGrade)}`} data-testid={`assignment-percentage-${index}`}>
              {percentage?.toFixed(1)}%
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground" data-testid={`assignment-not-graded-${index}`}>Not Graded</p>
        )}
      </div>
    </div>
  );
}
