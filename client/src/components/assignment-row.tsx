import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Assignment } from "@shared/schema";
import { getGradeColor } from "@shared/schema";
import { Edit2, Check, X, FlaskConical } from "lucide-react";

interface AssignmentRowProps {
  assignment: Assignment;
  showCourse?: boolean;
  courseName?: string;
  index?: number;
  courseId?: string;
  editable?: boolean;
  onScoreChange?: (pointsEarned: number, pointsPossible: number) => void;
}

export function AssignmentRow({ 
  assignment, 
  showCourse, 
  courseName, 
  index = 0,
  courseId,
  editable = false,
  onScoreChange,
}: AssignmentRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editEarned, setEditEarned] = useState("");
  const [editPossible, setEditPossible] = useState("");

  const parseScore = () => {
    if (assignment.pointsEarned !== null && assignment.pointsEarned !== undefined &&
        assignment.pointsPossible !== null && assignment.pointsPossible !== undefined) {
      const earned = assignment.pointsEarned;
      const max = assignment.pointsPossible;
      return { earned, max, percentage: max > 0 ? (earned / max) * 100 : null };
    }
    
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

  // Check if assignment is missing
  const isMissing = (): boolean => {
    const scoreLower = (assignment.score || "").toLowerCase();
    const notesLower = (assignment.notes || "").toLowerCase();
    
    // Check for explicit "missing" text
    if (scoreLower.includes("missing") || notesLower.includes("missing")) {
      return true;
    }
    
    // Check if past due with zero score
    if (assignment.dueDate) {
      const dueDate = new Date(assignment.dueDate);
      const now = new Date();
      if (dueDate < now && earned !== null && earned === 0) {
        return true;
      }
    }
    
    return false;
  };

  const assignmentIsMissing = isMissing();
  
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

  const startEditing = () => {
    setEditEarned(earned?.toString() || "0");
    setEditPossible(max?.toString() || "100");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditEarned("");
    setEditPossible("");
  };

  const saveEdit = () => {
    const newEarned = parseFloat(editEarned) || 0;
    const newPossible = parseFloat(editPossible) || 100;
    if (onScoreChange) {
      onScoreChange(newEarned, newPossible);
    }
    setIsEditing(false);
  };

  const isHypothetical = (assignment as any).isHypothetical === true;

  return (
    <div 
      className={`flex items-center justify-between gap-4 rounded-lg border bg-card p-4 ${editable ? "hover-elevate" : ""}`} 
      data-testid={`assignment-row-${index}`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium leading-tight" data-testid={`assignment-name-${index}`}>
            {assignment.name}
          </h4>
          {isHypothetical && (
            <FlaskConical className="h-3.5 w-3.5 text-purple-500" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {assignment.type && (
            <Badge variant="secondary" className="text-xs">
              {assignment.type}
            </Badge>
          )}
          {assignment.date && <span>Assigned: {assignment.date}</span>}
          {assignment.dueDate && <span>Due: {assignment.dueDate}</span>}
          {max !== null && !isEditing && <span>Max: {max} pts</span>}
        </div>
        {showCourse && courseName && (
          <p className="text-xs text-muted-foreground">{courseName}</p>
        )}
      </div>
      <div className="shrink-0 text-right" data-testid={`assignment-score-${index}`}>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={editEarned}
              onChange={(e) => setEditEarned(e.target.value)}
              className="h-8 w-16 text-center text-sm"
              data-testid={`input-edit-earned-${index}`}
            />
            <span className="text-muted-foreground">/</span>
            <Input
              type="number"
              value={editPossible}
              onChange={(e) => setEditPossible(e.target.value)}
              className="h-8 w-16 text-center text-sm"
              data-testid={`input-edit-possible-${index}`}
            />
            <Button size="icon" variant="ghost" onClick={saveEdit} className="h-8 w-8" data-testid={`button-save-edit-${index}`}>
              <Check className="h-4 w-4 text-emerald-500" />
            </Button>
            <Button size="icon" variant="ghost" onClick={cancelEditing} className="h-8 w-8" data-testid={`button-cancel-edit-${index}`}>
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {assignmentIsMissing ? (
              <div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400" data-testid={`assignment-points-${index}`}>
                  0/{max ?? 0}
                </p>
                <p className="text-sm font-medium text-red-600 dark:text-red-400" data-testid={`assignment-percentage-${index}`}>
                  0% missing
                </p>
              </div>
            ) : earned !== null && max !== null ? (
              <div>
                <p className="text-lg font-bold" data-testid={`assignment-points-${index}`}>
                  {earned}/{max}
                </p>
                <p className={`text-sm font-medium ${getGradeColor(letterGrade)}`} data-testid={`assignment-percentage-${index}`}>
                  {percentage?.toFixed(1)}%
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground" data-testid={`assignment-not-graded-${index}`}>Not Graded</p>
            )}
            {editable && (
              <Button size="icon" variant="ghost" onClick={startEditing} className="h-8 w-8" data-testid={`button-edit-${index}`}>
                <Edit2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
