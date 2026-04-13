import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
export type ColorTheme =
  | "blue" | "green" | "purple" | "orange" | "rose"
  | "teal" | "indigo" | "cyan" | "slate"
  | "custom1" | "custom2" | "custom3";
export type FontFamily = "inter" | "dm-sans" | "system";
export type BorderRadius = "sharp" | "default" | "rounded" | "pill";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  colorTheme: ColorTheme;
  setColorTheme: (colorTheme: ColorTheme) => void;
  customColors: Record<string, { primary: string; name: string }>;
  setCustomColor: (slot: "custom1" | "custom2" | "custom3", primary: string, name: string) => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  borderRadius: BorderRadius;
  setBorderRadius: (radius: BorderRadius) => void;
}

export const colorThemeValues: Record<ColorTheme, { primary: string; name: string; hex: string }> = {
  blue:   { primary: "217 91% 60%", name: "Blue",   hex: "#3b82f6" },
  green:  { primary: "142 76% 36%", name: "Green",  hex: "#16a34a" },
  purple: { primary: "271 91% 65%", name: "Purple", hex: "#a855f7" },
  orange: { primary: "24 95% 53%",  name: "Orange", hex: "#f97316" },
  rose:   { primary: "346 77% 50%", name: "Rose",   hex: "#e11d48" },
  teal:   { primary: "172 66% 40%", name: "Teal",   hex: "#14b8a6" },
  indigo: { primary: "245 91% 65%", name: "Indigo", hex: "#6366f1" },
  cyan:   { primary: "190 95% 39%", name: "Cyan",   hex: "#0891b2" },
  slate:  { primary: "215 28% 55%", name: "Slate",  hex: "#64748b" },
  custom1: { primary: "217 91% 60%", name: "Custom 1", hex: "#3b82f6" },
  custom2: { primary: "217 91% 60%", name: "Custom 2", hex: "#3b82f6" },
  custom3: { primary: "217 91% 60%", name: "Custom 3", hex: "#3b82f6" },
};

export const fontFamilyValues: Record<FontFamily, { css: string; name: string; sample: string }> = {
  "inter":   { css: "Inter, sans-serif",       name: "Inter",   sample: "Clean & modern" },
  "dm-sans": { css: "'DM Sans', sans-serif",    name: "DM Sans", sample: "Friendly & round" },
  "system":  { css: "system-ui, sans-serif",    name: "System",  sample: "Native platform" },
};

export const borderRadiusValues: Record<BorderRadius, { css: string; name: string }> = {
  "sharp":   { css: "0.125rem", name: "Sharp" },
  "default": { css: "0.5rem",   name: "Default" },
  "rounded": { css: "0.875rem", name: "Rounded" },
  "pill":    { css: "1.5rem",   name: "Pill" },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    (typeof window !== "undefined" ? (localStorage.getItem("theme") as Theme) : null) || "system"
  );

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() =>
    (typeof window !== "undefined" ? (localStorage.getItem("colorTheme") as ColorTheme) : null) || "blue"
  );

  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() =>
    (typeof window !== "undefined" ? (localStorage.getItem("fontFamily") as FontFamily) : null) || "inter"
  );

  const [borderRadius, setBorderRadiusState] = useState<BorderRadius>(() =>
    (typeof window !== "undefined" ? (localStorage.getItem("borderRadius") as BorderRadius) : null) || "default"
  );

  const [customColors, setCustomColors] = useState<Record<string, { primary: string; name: string }>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("customColors");
      if (stored) {
        try { return JSON.parse(stored); } catch { return {}; }
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
        effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty("--font-sans", fontFamilyValues[fontFamily].css);
    localStorage.setItem("fontFamily", fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.style.setProperty("--radius", borderRadiusValues[borderRadius].css);
    localStorage.setItem("borderRadius", borderRadius);
  }, [borderRadius]);

  const setFontFamily = (font: FontFamily) => setFontFamilyState(font);
  const setBorderRadius = (radius: BorderRadius) => setBorderRadiusState(radius);

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
      theme, setTheme, resolvedTheme,
      colorTheme, setColorTheme,
      customColors, setCustomColor,
      fontFamily, setFontFamily,
      borderRadius, setBorderRadius,
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
