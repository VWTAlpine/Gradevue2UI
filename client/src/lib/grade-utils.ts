import type { Assignment, Course } from "@shared/schema";

export interface ParsedScore {
  earned: number | null;
  max: number | null;
  percentage: number | null;
}

export function parseAssignmentScore(assignment: Assignment): ParsedScore {
  const assignmentMax =
    assignment.pointsPossible !== null && assignment.pointsPossible !== undefined
      ? assignment.pointsPossible
      : null;

  if (
    assignment.pointsEarned !== null &&
    assignment.pointsEarned !== undefined &&
    assignmentMax !== null
  ) {
    const earned = assignment.pointsEarned;
    return {
      earned,
      max: assignmentMax,
      percentage: assignmentMax > 0 ? (earned / assignmentMax) * 100 : null,
    };
  }

  const score = assignment.score;
  const points = assignment.points;

  if (!score || score === "Not Graded" || score === "N/A") {
    if (assignmentMax !== null) {
      return { earned: null, max: assignmentMax, percentage: null };
    }
    return { earned: null, max: null, percentage: null };
  }

  const scoreMatch = score.match(/^([\d.]+)\s*(?:out of|\/)\s*([\d.]+)/i);
  if (scoreMatch) {
    const earned = parseFloat(scoreMatch[1]);
    const max = parseFloat(scoreMatch[2]);
    return { earned, max, percentage: max > 0 ? (earned / max) * 100 : null };
  }

  if (points) {
    const pointsMatch = points.match(/([\d.]+)\s*\/\s*([\d.]+)/);
    if (pointsMatch) {
      const earned = parseFloat(pointsMatch[1]);
      const max = parseFloat(pointsMatch[2]);
      return { earned, max, percentage: max > 0 ? (earned / max) * 100 : null };
    }
  }

  const simpleNumber = parseFloat(score);
  if (!isNaN(simpleNumber)) {
    const max = assignmentMax ?? 100;
    return {
      earned: simpleNumber,
      max,
      percentage: max > 0 ? (simpleNumber / max) * 100 : simpleNumber,
    };
  }

  if (assignmentMax !== null) {
    return { earned: null, max: assignmentMax, percentage: null };
  }

  return { earned: null, max: null, percentage: null };
}

export function getAssignmentPoints(a: Assignment): { earned: number; possible: number } | null {
  const assignmentMax =
    a.pointsPossible !== null && a.pointsPossible !== undefined && a.pointsPossible > 0
      ? a.pointsPossible
      : null;

  if (a.pointsEarned !== null && a.pointsEarned !== undefined && assignmentMax !== null) {
    return { earned: a.pointsEarned, possible: assignmentMax };
  }

  if (a.score) {
    const scoreMatch = a.score.match(/^([\d.]+)\s*(?:out of|\/)\s*([\d.]+)/i);
    if (scoreMatch) {
      return { earned: parseFloat(scoreMatch[1]), possible: parseFloat(scoreMatch[2]) };
    }
  }

  if (a.points) {
    const pointsMatch = a.points.match(/([\d.]+)\s*\/\s*([\d.]+)/);
    if (pointsMatch) {
      return { earned: parseFloat(pointsMatch[1]), possible: parseFloat(pointsMatch[2]) };
    }
  }

  if (a.score) {
    const simpleNumber = parseFloat(a.score);
    if (!isNaN(simpleNumber)) {
      return { earned: simpleNumber, possible: assignmentMax ?? 100 };
    }
  }

  return null;
}

export function isCourseUngraded(course: Course): boolean {
  if (course.grade === null) return true;

  if (course.grade === 0) {
    const hasAnyGradedAssignment = course.assignments.some(a => {
      const points = getAssignmentPoints(a);
      return points !== null && points.possible > 0;
    });
    return !hasAnyGradedAssignment;
  }

  return false;
}

export function isExplicitlyMissing(a: Assignment): boolean {
  const scoreLower = (a.score || "").toLowerCase();
  const notesLower = (a.notes || "").toLowerCase();

  return (
    scoreLower.includes("missing") ||
    scoreLower === "m" ||
    scoreLower === "not turned in" ||
    notesLower.includes("missing") ||
    notesLower.includes("not turned in")
  );
}

export function isAssignmentMissing(a: Assignment): boolean {
  if (isExplicitlyMissing(a)) return true;

  if (a.dueDate) {
    const dueDate = new Date(a.dueDate);
    const now = new Date();
    if (dueDate < now) {
      const parsed = parseAssignmentScore(a);
      if (parsed.earned !== null && parsed.earned === 0) {
        return true;
      }
    }
  }

  return false;
}

export function countMissingAssignments(course: Course): number {
  return course.assignments.filter(isExplicitlyMissing).length;
}

export function percentageToGPA(grade: number): number {
  if (grade >= 93) return 4.0;
  if (grade >= 90) return 3.7;
  if (grade >= 87) return 3.3;
  if (grade >= 83) return 3.0;
  if (grade >= 80) return 2.7;
  if (grade >= 77) return 2.3;
  if (grade >= 73) return 2.0;
  if (grade >= 70) return 1.7;
  if (grade >= 67) return 1.3;
  if (grade >= 63) return 1.0;
  if (grade >= 60) return 0.7;
  return 0.0;
}

export function calculateOverallGPA(courses: Course[]): number {
  const validGrades = courses.filter((c) => c.grade !== null && !isCourseUngraded(c));
  if (validGrades.length === 0) return 0;
  const totalPoints = validGrades.reduce((sum, c) => sum + percentageToGPA(c.grade ?? 0), 0);
  return totalPoints / validGrades.length;
}

export function calculateAverageGrade(courses: Course[]): number {
  const validGrades = courses.filter((c) => c.grade !== null && !isCourseUngraded(c));
  if (validGrades.length === 0) return 0;
  return validGrades.reduce((acc, c) => acc + (c.grade ?? 0), 0) / validGrades.length;
}

export function getGradeLabel(avg: number): string {
  if (avg >= 90) return "A";
  if (avg >= 80) return "B";
  if (avg >= 70) return "C";
  if (avg >= 60) return "D";
  return "F";
}

export function getGradeHexColor(percentage: number): string {
  if (percentage >= 90) return "#10b981";
  if (percentage >= 80) return "#3b82f6";
  if (percentage >= 70) return "#f59e0b";
  if (percentage >= 60) return "#f97316";
  return "#ef4444";
}

export function getBarColorFromLetter(letterGrade: string): string {
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
}

export function getLetterFromPercentage(pct: number | null): string {
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
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function generateICSCalendar(courses: Course[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GradeVue//Assignments//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const course of courses) {
    for (const assignment of course.assignments) {
      if (!assignment.dueDate) continue;
      const dueDate = new Date(assignment.dueDate);
      if (isNaN(dueDate.getTime())) continue;

      const startDate = formatLocalDate(dueDate);
      const nextDay = new Date(dueDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const endDate = formatLocalDate(nextDay);

      const uid = `${course.id}-${assignment.name.replace(/\s+/g, "-").slice(0, 30)}-${startDate}@gradevue`;
      const summary = escapeICSText(`${assignment.name} - ${course.name}`);
      const description = escapeICSText([
        `Course: ${course.name}`,
        `Teacher: ${course.teacher}`,
        assignment.type ? `Type: ${assignment.type}` : "",
        assignment.score && assignment.score !== "Not Graded" ? `Score: ${assignment.score}` : "",
      ].filter(Boolean).join("\n"));

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT",
      );
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
