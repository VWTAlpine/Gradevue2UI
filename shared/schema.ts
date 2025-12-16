import { z } from "zod";

// StudentVue Login Schema
export const loginSchema = z.object({
  district: z.string().min(1, "District URL is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Assignment Schema
export const assignmentSchema = z.object({
  name: z.string(),
  type: z.string(),
  date: z.string().optional(),
  dueDate: z.string().optional(),
  score: z.string(),
  scoreType: z.string().optional(),
  points: z.string(),
  notes: z.string().optional(),
  description: z.string().optional(),
});

export type Assignment = z.infer<typeof assignmentSchema>;

// Category Schema
export const categorySchema = z.object({
  name: z.string(),
  weight: z.number(),
  score: z.number(),
  points: z.string().optional(),
});

export type Category = z.infer<typeof categorySchema>;

// Course Schema
export const courseSchema = z.object({
  id: z.string(),
  name: z.string(),
  period: z.number(),
  teacher: z.string(),
  room: z.string().optional(),
  grade: z.number().nullable(),
  letterGrade: z.string(),
  assignments: z.array(assignmentSchema),
  categories: z.array(categorySchema).optional(),
});

export type Course = z.infer<typeof courseSchema>;

// Student Info Schema
export const studentInfoSchema = z.object({
  name: z.string(),
  studentId: z.string(),
  grade: z.string(),
  school: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  counselor: z.string().optional(),
  photo: z.string().optional(),
});

export type StudentInfo = z.infer<typeof studentInfoSchema>;

// Gradebook Schema (main data structure from StudentVue)
export const gradebookSchema = z.object({
  courses: z.array(courseSchema),
  reportingPeriod: z.object({
    name: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).optional(),
  reportingPeriods: z.array(z.object({
    name: z.string(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })).optional(),
  studentInfo: studentInfoSchema.optional(),
});

export type Gradebook = z.infer<typeof gradebookSchema>;

// Attendance Schema
export const attendanceRecordSchema = z.object({
  date: z.string(),
  period: z.number().optional(),
  course: z.string().optional(),
  status: z.enum(["Present", "Absent", "Tardy", "Excused", "Unexcused"]),
  reason: z.string().optional(),
});

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>;

// GPA Calculation Types
export interface GPAEntry {
  courseName: string;
  letterGrade: string;
  credits: number;
  gradePoints: number;
  isAP: boolean;
  isHonors: boolean;
}

export interface GPAResult {
  unweighted: number;
  weighted: number;
  totalCredits: number;
}

// User session type (for in-memory storage)
export interface UserSession {
  id: string;
  username: string;
  district: string;
  gradebook: Gradebook | null;
  lastUpdated: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Grade utilities
export function getLetterGrade(percentage: number | null): string {
  if (percentage === null) return "N/A";
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 63) return "D";
  if (percentage >= 60) return "D-";
  return "F";
}

export function getGradeColor(letterGrade: string): string {
  const grade = letterGrade.charAt(0).toUpperCase();
  switch (grade) {
    case "A":
      return "text-emerald-600 dark:text-emerald-400";
    case "B":
      return "text-blue-600 dark:text-blue-400";
    case "C":
      return "text-amber-600 dark:text-amber-400";
    case "D":
      return "text-orange-600 dark:text-orange-400";
    case "F":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}

export function getGradeBgColor(letterGrade: string): string {
  const grade = letterGrade.charAt(0).toUpperCase();
  switch (grade) {
    case "A":
      return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
    case "B":
      return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
    case "C":
      return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
    case "D":
      return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
    case "F":
      return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function calculateGPA(entries: GPAEntry[]): GPAResult {
  if (entries.length === 0) {
    return { unweighted: 0, weighted: 0, totalCredits: 0 };
  }

  let totalUnweightedPoints = 0;
  let totalWeightedPoints = 0;
  let totalCredits = 0;

  entries.forEach((entry) => {
    const unweightedPoints = entry.gradePoints;
    let weightedPoints = entry.gradePoints;

    if (entry.isAP) {
      weightedPoints += 1.0;
    } else if (entry.isHonors) {
      weightedPoints += 0.5;
    }

    totalUnweightedPoints += unweightedPoints * entry.credits;
    totalWeightedPoints += weightedPoints * entry.credits;
    totalCredits += entry.credits;
  });

  return {
    unweighted: totalCredits > 0 ? totalUnweightedPoints / totalCredits : 0,
    weighted: totalCredits > 0 ? totalWeightedPoints / totalCredits : 0,
    totalCredits,
  };
}

export function letterGradeToPoints(letterGrade: string): number {
  const grade = letterGrade.toUpperCase().trim();
  switch (grade) {
    case "A+":
    case "A":
      return 4.0;
    case "A-":
      return 3.7;
    case "B+":
      return 3.3;
    case "B":
      return 3.0;
    case "B-":
      return 2.7;
    case "C+":
      return 2.3;
    case "C":
      return 2.0;
    case "C-":
      return 1.7;
    case "D+":
      return 1.3;
    case "D":
      return 1.0;
    case "D-":
      return 0.7;
    case "F":
      return 0.0;
    default:
      return 0.0;
  }
}

// Users table (keeping for compatibility)
import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
