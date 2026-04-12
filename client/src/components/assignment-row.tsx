import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Assignment } from "@shared/schema";
import { getGradeColor } from "@shared/schema";
import { parseAssignmentScore, isAssignmentMissing, getLetterFromPercentage } from "@/lib/grade-utils";
import { Edit2, Check, X, FlaskConical } from "lucide-react";

interface AssignmentRowProps {
  assignment: Assignment;
  showCourse?: boolean;
  courseName?: string;
  index?: number;
  courseId?: string;
  editable?: boolean;
  onScoreChange?: (pointsEarned: number, pointsPossible: number) => void;
  isOverridden?: boolean;
  originalScore?: { earned: number; possible: number } | null;
}

export function AssignmentRow({ 
  assignment, 
  showCourse, 
  courseName, 
  index = 0,
  courseId,
  editable = false,
  onScoreChange,
  isOverridden = false,
  originalScore = null,
}: AssignmentRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editEarned, setEditEarned] = useState("");
  const [editPossible, setEditPossible] = useState("");

  const { earned, max, percentage } = parseAssignmentScore(assignment);
  const assignmentIsMissing = isAssignmentMissing(assignment);
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

  const getOverrideClasses = () => {
    if (isOverridden) {
      return "border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-900/10";
    }
    if (isHypothetical) {
      return "border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10";
    }
    return "bg-card";
  };

  return (
    <div 
      className={`flex items-center justify-between gap-4 rounded-lg border p-4 ${getOverrideClasses()} ${editable ? "hover-elevate" : ""}`} 
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
          {isOverridden && !isHypothetical && (
            <Badge variant="outline" className="text-xs border-amber-400 text-amber-600 dark:text-amber-400">
              Modified
            </Badge>
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
                  0/{max ?? 100}
                </p>
                <p className="text-sm font-medium text-red-600 dark:text-red-400" data-testid={`assignment-percentage-${index}`}>
                  0% missing
                </p>
              </div>
            ) : earned !== null && max !== null ? (
              <div>
                <p className="text-lg font-bold" data-testid={`assignment-points-${index}`}>
                  {earned}/{max}
                  {isOverridden && originalScore && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground line-through">
                      {originalScore.earned}/{originalScore.possible}
                    </span>
                  )}
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
