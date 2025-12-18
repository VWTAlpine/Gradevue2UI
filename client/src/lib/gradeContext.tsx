import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react";
import type { Gradebook, Course, LoginCredentials, Assignment } from "@shared/schema";
import { getLetterGrade } from "@shared/schema";

export interface GradeChange {
  courseId: string;
  courseName: string;
  previousGrade: number | null;
  newGrade: number | null;
  previousLetter: string | null;
  newLetter: string | null;
  timestamp: string;
}

export interface HypotheticalAssignment {
  id: string;
  name: string;
  type: string;
  pointsEarned: number;
  pointsPossible: number;
}

export interface AssignmentOverride {
  assignmentIndex: number;
  pointsEarned: number;
  pointsPossible: number;
}

export interface CourseOverrides {
  modifiedAssignments: AssignmentOverride[];
  addedAssignments: HypotheticalAssignment[];
}

interface GradeContextType {
  gradebook: Gradebook | null;
  setGradebook: (gradebook: Gradebook | null) => void;
  hypotheticalGradebook: Gradebook | null;
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
  courseOverrides: Map<string, CourseOverrides>;
  updateAssignmentScore: (courseId: string, assignmentIndex: number, pointsEarned: number, pointsPossible: number) => void;
  addHypotheticalAssignment: (courseId: string, assignment: HypotheticalAssignment) => void;
  removeHypotheticalAssignment: (courseId: string, assignmentId: string) => void;
  clearAllOverrides: () => void;
  lastUpdated: Date | null;
  refreshGrades: () => Promise<void>;
}

const GradeContext = createContext<GradeContextType | undefined>(undefined);

export function GradeProvider({ children }: { children: ReactNode }) {
  const [gradebook, setGradebookState] = useState<Gradebook | null>(null);
  const [credentials, setCredentials] = useState<LoginCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [hypotheticalMode, setHypotheticalMode] = useState(false);
  const [gradeChanges, setGradeChanges] = useState<GradeChange[]>([]);
  const [courseOverrides, setCourseOverrides] = useState<Map<string, CourseOverrides>>(new Map());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const isLoggedIn = gradebook !== null;

  const updateAssignmentScore = (courseId: string, assignmentIndex: number, pointsEarned: number, pointsPossible: number) => {
    setCourseOverrides(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(courseId) || { modifiedAssignments: [], addedAssignments: [] };
      const modIdx = existing.modifiedAssignments.findIndex(m => m.assignmentIndex === assignmentIndex);
      if (modIdx >= 0) {
        existing.modifiedAssignments[modIdx] = { assignmentIndex, pointsEarned, pointsPossible };
      } else {
        existing.modifiedAssignments.push({ assignmentIndex, pointsEarned, pointsPossible });
      }
      newMap.set(courseId, existing);
      return newMap;
    });
  };

  const addHypotheticalAssignment = (courseId: string, assignment: HypotheticalAssignment) => {
    setCourseOverrides(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(courseId) || { modifiedAssignments: [], addedAssignments: [] };
      existing.addedAssignments.push(assignment);
      newMap.set(courseId, existing);
      return newMap;
    });
  };

  const removeHypotheticalAssignment = (courseId: string, assignmentId: string) => {
    setCourseOverrides(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(courseId);
      if (existing) {
        existing.addedAssignments = existing.addedAssignments.filter(a => a.id !== assignmentId);
        newMap.set(courseId, existing);
      }
      return newMap;
    });
  };

  const clearAllOverrides = () => {
    setCourseOverrides(new Map());
  };

  const hypotheticalGradebook = useMemo(() => {
    if (!gradebook || !hypotheticalMode) return null;

    const newCourses = gradebook.courses.map(course => {
      const overrides = courseOverrides.get(course.id);
      if (!overrides || (overrides.modifiedAssignments.length === 0 && overrides.addedAssignments.length === 0)) {
        return course;
      }

      let modifiedAssignments = [...course.assignments];
      
      overrides.modifiedAssignments.forEach(override => {
        if (modifiedAssignments[override.assignmentIndex]) {
          modifiedAssignments[override.assignmentIndex] = {
            ...modifiedAssignments[override.assignmentIndex],
            pointsEarned: override.pointsEarned,
            pointsPossible: override.pointsPossible,
            score: `${override.pointsEarned}/${override.pointsPossible}`,
          };
        }
      });

      overrides.addedAssignments.forEach(hypo => {
        modifiedAssignments.push({
          name: hypo.name,
          type: hypo.type,
          score: `${hypo.pointsEarned}/${hypo.pointsPossible}`,
          points: `${hypo.pointsEarned} / ${hypo.pointsPossible}`,
          pointsEarned: hypo.pointsEarned,
          pointsPossible: hypo.pointsPossible,
          isHypothetical: true,
        } as Assignment & { isHypothetical: boolean });
      });

      let newGrade: number | null = course.grade;

      if (course.categories && course.categories.length > 0) {
        const categoryTotals: Map<string, { earned: number; possible: number }> = new Map();
        
        course.categories.forEach(cat => {
          categoryTotals.set(cat.name.toLowerCase(), { earned: 0, possible: 0 });
        });

        modifiedAssignments.forEach(a => {
          const earned = a.pointsEarned ?? 0;
          const possible = a.pointsPossible ?? 0;
          if (possible > 0) {
            const assignmentType = a.type?.toLowerCase() || "";
            let matchedCategory: string | null = null;
            
            for (const cat of course.categories!) {
              const catNameLower = cat.name.toLowerCase();
              if (assignmentType.includes(catNameLower) || catNameLower.includes(assignmentType)) {
                matchedCategory = catNameLower;
                break;
              }
            }
            
            if (!matchedCategory) {
              for (const cat of course.categories!) {
                matchedCategory = cat.name.toLowerCase();
                break;
              }
            }

            if (matchedCategory && categoryTotals.has(matchedCategory)) {
              const current = categoryTotals.get(matchedCategory)!;
              categoryTotals.set(matchedCategory, {
                earned: current.earned + earned,
                possible: current.possible + possible,
              });
            }
          }
        });

        let weightedSum = 0;
        let totalWeight = 0;
        
        course.categories.forEach(cat => {
          const catNameLower = cat.name.toLowerCase();
          const totals = categoryTotals.get(catNameLower);
          if (totals && totals.possible > 0) {
            const categoryPercent = (totals.earned / totals.possible) * 100;
            weightedSum += categoryPercent * (cat.weight / 100);
            totalWeight += cat.weight;
          }
        });

        if (totalWeight > 0) {
          newGrade = (weightedSum / totalWeight) * 100;
        }
      } else {
        let totalEarned = 0;
        let totalPossible = 0;
        modifiedAssignments.forEach(a => {
          const earned = a.pointsEarned ?? 0;
          const possible = a.pointsPossible ?? 0;
          if (possible > 0) {
            totalEarned += earned;
            totalPossible += possible;
          }
        });
        newGrade = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : course.grade;
      }

      const newLetterGrade = getLetterGrade(newGrade);

      return {
        ...course,
        assignments: modifiedAssignments,
        grade: newGrade,
        letterGrade: newLetterGrade,
      };
    });

    return { ...gradebook, courses: newCourses };
  }, [gradebook, hypotheticalMode, courseOverrides]);

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
    if (newGradebook) {
      setLastUpdated(new Date());
    }
  };

  const refreshGrades = async () => {
    if (!credentials || credentials.district === "demo") {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/studentvue/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();

      if (data.success && data.data) {
        setGradebook(data.data);
      }
    } catch (error) {
      console.error("Failed to refresh grades:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearGradeChanges = () => {
    setGradeChanges([]);
  };

  useEffect(() => {
    const savedGradebook = localStorage.getItem("gradebook");
    const savedCredentials = sessionStorage.getItem("credentials");
    const savedLastUpdated = localStorage.getItem("lastUpdated");
    
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
        sessionStorage.removeItem("credentials");
      }
    }

    if (savedLastUpdated) {
      try {
        setLastUpdated(new Date(savedLastUpdated));
      } catch (e) {
        localStorage.removeItem("lastUpdated");
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
    if (lastUpdated) {
      localStorage.setItem("lastUpdated", lastUpdated.toISOString());
    } else {
      localStorage.removeItem("lastUpdated");
    }
  }, [lastUpdated]);

  useEffect(() => {
    if (credentials) {
      sessionStorage.setItem("credentials", JSON.stringify(credentials));
    } else {
      sessionStorage.removeItem("credentials");
    }
  }, [credentials]);

  const logout = () => {
    setGradebook(null);
    setCredentials(null);
    setSelectedCourse(null);
    localStorage.removeItem("gradebook");
    sessionStorage.removeItem("credentials");
  };

  return (
    <GradeContext.Provider
      value={{
        gradebook,
        setGradebook,
        hypotheticalGradebook,
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
        courseOverrides,
        updateAssignmentScore,
        addHypotheticalAssignment,
        removeHypotheticalAssignment,
        clearAllOverrides,
        lastUpdated,
        refreshGrades,
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
