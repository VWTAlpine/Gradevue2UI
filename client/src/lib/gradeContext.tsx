import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Gradebook, Course, LoginCredentials } from "@shared/schema";

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
}

const GradeContext = createContext<GradeContextType | undefined>(undefined);

export function GradeProvider({ children }: { children: ReactNode }) {
  const [gradebook, setGradebook] = useState<Gradebook | null>(null);
  const [credentials, setCredentials] = useState<LoginCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [hypotheticalMode, setHypotheticalMode] = useState(false);

  const isLoggedIn = gradebook !== null;

  useEffect(() => {
    const savedGradebook = localStorage.getItem("gradebook");
    const savedCredentials = localStorage.getItem("credentials");
    
    if (savedGradebook) {
      try {
        setGradebook(JSON.parse(savedGradebook));
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
