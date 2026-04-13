import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useTheme, colorThemeValues, fontFamilyValues, borderRadiusValues, type ColorTheme, type FontFamily, type BorderRadius } from "@/lib/themeContext";
import { useGrades } from "@/lib/gradeContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Moon, Sun, Monitor, RefreshCw, LogOut, Shield, Bell, Palette, Download,
  FileText, Check, Pencil, Smartphone, MessageSquare, Mail, Type, Sliders,
  BookOpen, TrendingUp,
} from "lucide-react";
import { SiGithub } from "react-icons/si";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hslStr: string): string {
  const parts = hslStr.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!parts) return "#3b82f6";
  let h = parseInt(parts[1]) / 360;
  const s = parseInt(parts[2]) / 100;
  const l = parseInt(parts[3]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function ThemePreview() {
  return (
    <div
      className="rounded-xl border bg-background overflow-hidden"
      data-testid="theme-live-preview"
    >
      <div className="px-4 pt-4 pb-2 border-b bg-card">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Live Preview</p>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0">
            <BookOpen className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Academic Progress</p>
            <p className="text-xs text-muted-foreground">Current Semester</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">GPA</p>
            <p className="text-lg font-bold text-foreground">3.87</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Average</p>
            <p className="text-lg font-bold text-foreground">94.2%</p>
          </div>
          <div className="rounded-lg border bg-primary/10 p-3 text-center">
            <p className="text-xs text-primary mb-1">Grade</p>
            <p className="text-lg font-bold text-primary">A</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">AP Calculus BC</p>
            <span className="text-xs rounded-full bg-primary text-primary-foreground px-2 py-0.5 font-semibold">A</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: "96%" }} />
          </div>
          <div className="flex justify-between">
            <p className="text-xs text-muted-foreground">Ms. Rodriguez · Period 2</p>
            <p className="text-xs font-medium text-foreground">96.2%</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="flex-1 rounded-[var(--radius)] bg-primary text-primary-foreground text-xs font-medium py-2 px-3">
            View Details
          </button>
          <button className="flex-1 rounded-[var(--radius)] border bg-card text-foreground text-xs font-medium py-2 px-3 flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Trends
          </button>
        </div>
      </div>
    </div>
  );
}

const presetColorList = [
  "blue", "green", "purple", "orange", "rose", "teal", "indigo", "cyan", "slate",
] as ColorTheme[];

export default function SettingsPage() {
  const {
    theme, setTheme,
    colorTheme, setColorTheme,
    customColors, setCustomColor,
    fontFamily, setFontFamily,
    borderRadius, setBorderRadius,
  } = useTheme();
  const { logout, credentials, setIsLoading, setGradebook, gradebook } = useGrades();
  const { toast } = useToast();
  const [editingCustom, setEditingCustom] = useState<"custom1" | "custom2" | "custom3" | null>(null);
  const [customHex, setCustomHex] = useState("#3b82f6");
  const [customName, setCustomName] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast({
        title: "Installation Not Available",
        description: "Your browser doesn't support app installation, or the app is already installed.",
        variant: "destructive",
      });
      return;
    }
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast({ title: "App Installed", description: "GradeVue has been installed to your device" });
        setCanInstall(false);
        setDeferredPrompt(null);
      }
    } catch (error) {
      console.error("PWA install error:", error);
    }
  };

  const handleRefresh = async () => {
    if (!credentials || credentials.district === "demo") {
      toast({
        title: "Cannot Refresh",
        description: "You are using demo data. Please log in with real credentials to refresh.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/studentvue/login", credentials);
      const data = await response.json();
      if (data.success && data.data) {
        setGradebook(data.data);
        toast({ title: "Data Refreshed", description: "Your grades have been updated from StudentVue" });
      } else {
        throw new Error(data.error || "Failed to refresh");
      }
    } catch (error: any) {
      toast({ title: "Refresh Failed", description: error.message || "Could not refresh data", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: "Signed Out", description: "You have been signed out successfully" });
    window.location.href = "/";
  };

  const exportGradesCSV = () => {
    if (!gradebook?.courses || gradebook.courses.length === 0) {
      toast({ title: "No Data", description: "No grade data available to export", variant: "destructive" });
      return;
    }
    const headers = ["Course", "Teacher", "Period", "Grade (%)", "Letter Grade"];
    const rows = gradebook.courses.map((course) => [
      course.name, course.teacher || "", course.period || "",
      course.grade?.toFixed(2) || "N/A", course.letterGrade || "N/A",
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    downloadFile(csvContent, "grades.csv", "text/csv");
    toast({ title: "Export Successful", description: "Grades exported to CSV" });
  };

  const exportAssignmentsCSV = () => {
    if (!gradebook?.courses || gradebook.courses.length === 0) {
      toast({ title: "No Data", description: "No assignment data available to export", variant: "destructive" });
      return;
    }
    const headers = ["Course", "Assignment", "Type", "Due Date", "Points Earned", "Points Possible", "Percentage"];
    const rows: string[][] = [];
    gradebook.courses.forEach((course) => {
      if (course.assignments) {
        course.assignments.forEach((assignment) => {
          let earned = "", possible = "", percentage = "";
          if (assignment.score) {
            const parts = assignment.score.split("/").map((p) => p.trim());
            if (parts.length === 2) {
              earned = parts[0]; possible = parts[1];
              const e = parseFloat(earned), p = parseFloat(possible);
              if (!isNaN(e) && !isNaN(p) && p > 0) percentage = ((e / p) * 100).toFixed(1) + "%";
            }
          }
          rows.push([course.name, assignment.name, assignment.type || "", assignment.dueDate || "", earned, possible, percentage]);
        });
      }
    });
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    downloadFile(csvContent, "assignments.csv", "text/csv");
    toast({ title: "Export Successful", description: "Assignments exported to CSV" });
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  const handleSaveCustomColor = (slot: "custom1" | "custom2" | "custom3") => {
    const hslValue = hexToHsl(customHex);
    const name = customName.trim() || `Custom ${slot.slice(-1)}`;
    setCustomColor(slot, hslValue, name);
    setColorTheme(slot);
    setEditingCustom(null);
    toast({ title: "Theme Saved", description: `Custom theme "${name}" has been saved` });
  };

  const getCustomSlotDisplay = (slot: "custom1" | "custom2" | "custom3") => {
    if (customColors[slot]) {
      return { name: customColors[slot].name, color: `hsl(${customColors[slot].primary})` };
    }
    return { name: `Custom ${slot.slice(-1)}`, color: "hsl(217 20% 50%)" };
  };

  const openEditCustom = (slot: "custom1" | "custom2" | "custom3") => {
    if (customColors[slot]) {
      setCustomHex(hslToHex(customColors[slot].primary));
      setCustomName(customColors[slot].name || "");
    } else {
      setCustomHex("#3b82f6");
      setCustomName("");
    }
    setEditingCustom(slot);
  };

  const fontOptions: { id: FontFamily; label: string; description: string }[] = [
    { id: "inter",   label: "Inter",   description: "Clean & modern" },
    { id: "dm-sans", label: "DM Sans", description: "Friendly & round" },
    { id: "system",  label: "System",  description: "Native platform font" },
  ];

  const radiusOptions: { id: BorderRadius; label: string; preview: string }[] = [
    { id: "sharp",   label: "Sharp",   preview: "2px" },
    { id: "default", label: "Default", preview: "8px" },
    { id: "rounded", label: "Rounded", preview: "14px" },
    { id: "pill",    label: "Pill",    preview: "24px" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">Customize your GradeVue experience</p>
      </div>

      <div className="grid gap-6">
        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how GradeVue looks on your device</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <ThemePreview />

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Mode</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {([
                  { id: "light", label: "Light", Icon: Sun },
                  { id: "dark",  label: "Dark",  Icon: Moon },
                  { id: "system",label: "System",Icon: Monitor },
                ] as const).map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all hover-elevate ${
                      theme === id ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20" : "border-border text-foreground"
                    }`}
                    data-testid={`button-theme-${id}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                    {theme === id && <Check className="h-3 w-3 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Color Theme</Label>
              <div className="grid gap-2 grid-cols-4 sm:grid-cols-9">
                {presetColorList.map((id) => {
                  const preset = colorThemeValues[id];
                  return (
                    <button
                      key={id}
                      onClick={() => setColorTheme(id)}
                      title={preset.name}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-all hover-elevate ${
                        colorTheme === id ? "border-primary ring-2 ring-primary/20" : "border-border"
                      }`}
                      data-testid={`button-color-${id}`}
                    >
                      <div
                        className="h-7 w-7 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span className="text-[10px] font-medium leading-none">{preset.name}</span>
                      {colorTheme === id && <Check className="h-2.5 w-2.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Custom Colors</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["custom1", "custom2", "custom3"] as const).map((slot) => {
                  const display = getCustomSlotDisplay(slot);
                  const isEditing = editingCustom === slot;
                  return (
                    <div key={slot}>
                      {isEditing ? (
                        <div className="rounded-xl border p-4 space-y-4 bg-card">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Theme name</Label>
                            <Input
                              placeholder={`Custom ${slot.slice(-1)}`}
                              value={customName}
                              onChange={(e) => setCustomName(e.target.value)}
                              className="text-sm"
                              data-testid={`input-custom-name-${slot}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Pick a color</Label>
                            <div className="flex items-center gap-3">
                              <input
                                type="color"
                                value={customHex}
                                onChange={(e) => setCustomHex(e.target.value)}
                                className="h-10 w-16 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                                data-testid={`input-custom-color-${slot}`}
                              />
                              <Input
                                value={customHex}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (/^#[0-9a-fA-F]{0,6}$/.test(val)) setCustomHex(val);
                                }}
                                className="font-mono text-sm"
                                maxLength={7}
                                placeholder="#3b82f6"
                              />
                            </div>
                            <div
                              className="h-8 w-full rounded-lg border"
                              style={{ backgroundColor: customHex }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveCustomColor(slot)} data-testid={`button-save-custom-${slot}`}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingCustom(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => customColors[slot] ? setColorTheme(slot) : openEditCustom(slot)}
                          className={`flex w-full items-center gap-3 rounded-xl border p-3 transition-all hover-elevate ${
                            colorTheme === slot ? "border-primary ring-2 ring-primary/20" : "border-border"
                          }`}
                          data-testid={`button-custom-${slot}`}
                        >
                          <div
                            className={`h-8 w-8 rounded-full border-2 border-white shadow-sm shrink-0 ${
                              !customColors[slot] ? "border-dashed border-muted-foreground/40" : ""
                            }`}
                            style={{ backgroundColor: display.color }}
                          />
                          <span className="flex-1 text-left text-sm font-medium truncate">{display.name}</span>
                          {colorTheme === slot && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={(e) => { e.stopPropagation(); openEditCustom(slot); }}
                            data-testid={`button-edit-custom-${slot}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Type className="h-4 w-4" /> Font Family
              </Label>
              <div className="grid gap-3 sm:grid-cols-3">
                {fontOptions.map(({ id, label, description }) => (
                  <button
                    key={id}
                    onClick={() => setFontFamily(id)}
                    className={`flex flex-col gap-1 rounded-xl border p-4 text-left transition-all hover-elevate ${
                      fontFamily === id ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border"
                    }`}
                    data-testid={`button-font-${id}`}
                    style={{ fontFamily: fontFamilyValues[id].css }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold">{label}</span>
                      {fontFamily === id && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{description}</span>
                    <span className="text-base font-medium mt-1">Aa Bb Cc</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Sliders className="h-4 w-4" /> Border Radius
              </Label>
              <div className="grid gap-3 grid-cols-4">
                {radiusOptions.map(({ id, label, preview }) => (
                  <button
                    key={id}
                    onClick={() => setBorderRadius(id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all hover-elevate ${
                      borderRadius === id ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-border"
                    }`}
                    data-testid={`button-radius-${id}`}
                  >
                    <div
                      className="h-8 w-8 bg-primary/20 border-2 border-primary/40"
                      style={{ borderRadius: preview }}
                    />
                    <span className="text-xs font-medium">{label}</span>
                    {borderRadius === id && <Check className="h-3 w-3 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Configure how you receive updates</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="grade-alerts">Grade Change Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified when your grades change</p>
              </div>
              <Switch id="grade-alerts" disabled data-testid="switch-grade-alerts" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="assignment-reminders">Assignment Reminders</Label>
                <p className="text-sm text-muted-foreground">Remind me about upcoming due dates</p>
              </div>
              <Switch id="assignment-reminders" disabled data-testid="switch-reminders" />
            </div>
            <p className="text-xs text-muted-foreground">Notification features coming soon</p>
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <RefreshCw className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle>Data</CardTitle>
              <CardDescription>Manage your grade data and sync settings</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Refresh Grades</p>
                <p className="text-sm text-muted-foreground">Fetch the latest data from StudentVue</p>
              </div>
              <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Connected Account</p>
                <p className="text-sm text-muted-foreground">
                  {credentials?.username || "Not connected"}
                  {credentials?.district && credentials.district !== "demo" && (
                    <span className="ml-1 text-xs">({credentials.district})</span>
                  )}
                  {credentials?.district === "demo" && (
                    <span className="ml-1 text-xs">(Demo Mode)</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible" data-testid="card-export">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Download className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Download your grades and assignments as CSV files</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Grades Summary</p>
                <p className="text-sm text-muted-foreground">Download course grades as a CSV file</p>
              </div>
              <Button onClick={exportGradesCSV} variant="outline" data-testid="button-export-grades">
                <FileText className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export All Assignments</p>
                <p className="text-sm text-muted-foreground">Download detailed assignment data as a CSV file</p>
              </div>
              <Button onClick={exportAssignmentsCSV} variant="outline" data-testid="button-export-assignments">
                <FileText className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
              <Smartphone className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <CardTitle>Install App</CardTitle>
              <CardDescription>Install GradeVue as a web app on your device</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Install as Web App</p>
                <p className="text-sm text-muted-foreground">Add GradeVue to your home screen for quick access</p>
              </div>
              <Button onClick={handleInstallPWA} variant="outline" disabled={!canInstall} data-testid="button-install-pwa">
                <Smartphone className="mr-2 h-4 w-4" />
                Install
              </Button>
            </div>
            {!canInstall && (
              <p className="text-xs text-muted-foreground">
                App installation is available when using a supported browser. If you've already installed the app, this option won't appear.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
              <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle>Feedback</CardTitle>
              <CardDescription>Help improve GradeVue by reporting issues or suggestions</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4 mb-4">
              <p className="text-sm text-muted-foreground">
                Found a bug or have a feature request? Create an issue on GitHub to let us know. You can also reach out via email for any questions or feedback.
              </p>
            </div>
            <a
              href="https://github.com/VWTAlpine/Gradevue2UI/issues/new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full rounded-lg border p-4 hover-elevate transition-colors"
              data-testid="link-github-issue"
            >
              <SiGithub className="h-5 w-5" />
              <span className="font-medium">Create an issue on GitHub</span>
            </a>
            <a
              href="mailto:javanon@proton.me"
              className="flex items-center gap-3 w-full rounded-lg border p-4 hover-elevate transition-colors"
              data-testid="link-email-feedback"
            >
              <Mail className="h-5 w-5" />
              <span className="font-medium">Send an email</span>
            </a>
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                Your StudentVue credentials are stored only for your current browser session and are never retained after you close the tab. All grade data is fetched directly from StudentVue's servers using your school district's secure connection.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible border-destructive/50">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <CardTitle>Account</CardTitle>
              <CardDescription>Sign out of your account</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleLogout} data-testid="button-signout">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
