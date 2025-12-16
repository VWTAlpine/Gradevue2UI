import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Gradebook, Course, LoginCredentials } from "@shared/schema";

export interface GradeChange {
  courseId: string;
  courseName: string;
  previousGrade: number | null;
  newGrade: number | null;
  previousLetter: string | null;
  newLetter: string | null;
  timestamp: string;
}

interface GradeContextType {
  gradebook: Gradebook | null;
  setGradebook: (gradebook: Gradebook | null) => void;
  isLoggedIn: boolean;
  credentials: LoginCredentials | null;
  setCredentials: (creds: LoginCredentials | null) => void;
  logout: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  selectedCourse: Course | null;
  setSelectedCourse: (course: Course | null) => void;
  hypotheticalMode: boolean;
  setHypotheticalMode: (mode: boolean) => void;
  gradeChanges: GradeChange[];
  clearGradeChanges: () => void;
}

const GradeContext = createContext<GradeContextType | undefined>(undefined);

export function GradeProvider({ children }: { children: ReactNode }) {
  const [gradebook, setGradebookState] = useState<Gradebook | null>(null);
  const [credentials, setCredentials] = useState<LoginCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [hypotheticalMode, setHypotheticalMode] = useState(false);
  const [gradeChanges, setGradeChanges] = useState<GradeChange[]>([]);

  const isLoggedIn = gradebook !== null;

  const detectGradeChanges = (oldGradebook: Gradebook | null, newGradebook: Gradebook): GradeChange[] => {
    if (!oldGradebook || !newGradebook.courses) return [];
    
    const changes: GradeChange[] = [];
    const timestamp = new Date().toISOString();

    newGradebook.courses.forEach((newCourse) => {
      const oldCourse = oldGradebook.courses?.find((c) => c.id === newCourse.id);
      if (!oldCourse) return;

      const gradeChanged = oldCourse.grade !== newCourse.grade;
      const letterChanged = oldCourse.letterGrade !== newCourse.letterGrade;

      if (gradeChanged || letterChanged) {
        changes.push({
          courseId: newCourse.id,
          courseName: newCourse.name,
          previousGrade: oldCourse.grade ?? null,
          newGrade: newCourse.grade ?? null,
          previousLetter: oldCourse.letterGrade ?? null,
          newLetter: newCourse.letterGrade ?? null,
          timestamp,
        });
      }
    });

    return changes;
  };

  const setGradebook = (newGradebook: Gradebook | null) => {
    if (newGradebook && gradebook) {
      const changes = detectGradeChanges(gradebook, newGradebook);
      if (changes.length > 0) {
        setGradeChanges((prev) => [...changes, ...prev].slice(0, 50));
      }
    }
    setGradebookState(newGradebook);
  };

  const clearGradeChanges = () => {
    setGradeChanges([]);
  };

  useEffect(() => {
    const savedGradebook = localStorage.getItem("gradebook");
    const savedCredentials = localStorage.getItem("credentials");
    
    if (savedGradebook) {
      try {
        setGradebookState(JSON.parse(savedGradebook));
      } catch (e) {
        localStorage.removeItem("gradebook");
      }
    }
    
    if (savedCredentials) {
      try {
        setCredentials(JSON.parse(savedCredentials));
      } catch (e) {
        localStorage.removeItem("credentials");
      }
    }
  }, []);

  useEffect(() => {
    if (gradebook) {
      localStorage.setItem("gradebook", JSON.stringify(gradebook));
    } else {
      localStorage.removeItem("gradebook");
    }
  }, [gradebook]);

  useEffect(() => {
    if (credentials) {
      localStorage.setItem("credentials", JSON.stringify(credentials));
    } else {
      localStorage.removeItem("credentials");
    }
  }, [credentials]);

  const logout = () => {
    setGradebook(null);
    setCredentials(null);
    setSelectedCourse(null);
    localStorage.removeItem("gradebook");
    localStorage.removeItem("credentials");
  };

  return (
    <GradeContext.Provider
      value={{
        gradebook,
        setGradebook,
        isLoggedIn,
        credentials,
        setCredentials,
        logout,
        isLoading,
        setIsLoading,
        selectedCourse,
        setSelectedCourse,
        hypotheticalMode,
        setHypotheticalMode,
        gradeChanges,
        clearGradeChanges,
      }}
    >
      {children}
    </GradeContext.Provider>
  );
}

export function useGrades() {
  const context = useContext(GradeContext);
  if (context === undefined) {
    throw new Error("useGrades must be used within a GradeProvider");
  }
  return context;
}
