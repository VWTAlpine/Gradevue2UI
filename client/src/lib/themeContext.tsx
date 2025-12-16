import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
type ColorTheme = "blue" | "green" | "purple" | "orange" | "rose" | "custom1" | "custom2" | "custom3";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
  customColors: Record<string, { primary: string; name: string }>;
  setCustomColor: (slot: "custom1" | "custom2" | "custom3", primary: string, name: string) => void;
}

const colorThemeValues: Record<ColorTheme, { primary: string; name: string }> = {
  blue: { primary: "217 91% 60%", name: "Blue" },
  green: { primary: "142 76% 36%", name: "Green" },
  purple: { primary: "271 91% 65%", name: "Purple" },
  orange: { primary: "24 95% 53%", name: "Orange" },
  rose: { primary: "346 77% 50%", name: "Rose" },
  custom1: { primary: "217 91% 60%", name: "Custom 1" },
  custom2: { primary: "217 91% 60%", name: "Custom 2" },
  custom3: { primary: "217 91% 60%", name: "Custom 3" },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "system";
    }
    return "system";
  });

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("colorTheme") as ColorTheme) || "blue";
    }
    return "blue";
  });

  const [customColors, setCustomColors] = useState<Record<string, { primary: string; name: string }>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("customColors");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return {};
        }
      }
    }
    return {};
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;

    const updateTheme = () => {
      let effectiveTheme: "light" | "dark";

      if (theme === "system") {
        effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      } else {
        effectiveTheme = theme;
      }

      root.classList.remove("light", "dark");
      root.classList.add(effectiveTheme);
      setResolvedTheme(effectiveTheme);
    };

    updateTheme();
    localStorage.setItem("theme", theme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", updateTheme);

    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    let primaryColor: string;
    if (colorTheme.startsWith("custom") && customColors[colorTheme]) {
      primaryColor = customColors[colorTheme].primary;
    } else {
      primaryColor = colorThemeValues[colorTheme]?.primary || colorThemeValues.blue.primary;
    }

    root.style.setProperty("--primary", primaryColor);
    root.style.setProperty("--ring", primaryColor);
    root.style.setProperty("--sidebar-primary", primaryColor);
    root.style.setProperty("--sidebar-ring", primaryColor);
    root.style.setProperty("--chart-1", primaryColor);

    localStorage.setItem("colorTheme", colorTheme);
  }, [colorTheme, customColors]);

  const setCustomColor = (slot: "custom1" | "custom2" | "custom3", primary: string, name: string) => {
    const updated = { ...customColors, [slot]: { primary, name } };
    setCustomColors(updated);
    localStorage.setItem("customColors", JSON.stringify(updated));
    
    if (colorTheme === slot) {
      const root = window.document.documentElement;
      root.style.setProperty("--primary", primary);
      root.style.setProperty("--ring", primary);
      root.style.setProperty("--sidebar-primary", primary);
      root.style.setProperty("--sidebar-ring", primary);
      root.style.setProperty("--chart-1", primary);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      resolvedTheme, 
      colorTheme, 
      setColorTheme,
      customColors,
      setCustomColor
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export const presetThemes = colorThemeValues;
