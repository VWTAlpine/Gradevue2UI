import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useTheme, presetThemes } from "@/lib/themeContext";
import { useGrades } from "@/lib/gradeContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Moon, Sun, Monitor, RefreshCw, LogOut, Shield, Bell, Palette, Download, FileText, Check, Pencil, Smartphone, MessageSquare, Mail } from "lucide-react";
import { SiGithub } from "react-icons/si";

type ColorTheme = "blue" | "green" | "purple" | "orange" | "rose" | "custom1" | "custom2" | "custom3";

const presetColors: { id: ColorTheme; color: string; name: string }[] = [
  { id: "blue", color: "hsl(217 91% 60%)", name: "Blue" },
  { id: "green", color: "hsl(142 76% 36%)", name: "Green" },
  { id: "purple", color: "hsl(271 91% 65%)", name: "Purple" },
  { id: "orange", color: "hsl(24 95% 53%)", name: "Orange" },
  { id: "rose", color: "hsl(346 77% 50%)", name: "Rose" },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function SettingsPage() {
  const { theme, setTheme, colorTheme, setColorTheme, customColors, setCustomColor } = useTheme();
  const { logout, credentials, setIsLoading, setGradebook, setCredentials, gradebook } = useGrades();
  const { toast } = useToast();
  const [editingCustom, setEditingCustom] = useState<"custom1" | "custom2" | "custom3" | null>(null);
  const [customHue, setCustomHue] = useState("217");
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

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
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
        toast({
          title: "App Installed",
          description: "GradeVue has been installed to your device",
        });
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
        toast({
          title: "Data Refreshed",
          description: "Your grades have been updated from StudentVue",
        });
      } else {
        throw new Error(data.error || "Failed to refresh");
      }
    } catch (error: any) {
      toast({
        title: "Refresh Failed",
        description: error.message || "Could not refresh data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Signed Out",
      description: "You have been signed out successfully",
    });
    window.location.href = "/";
  };

  const exportGradesCSV = () => {
    if (!gradebook?.courses || gradebook.courses.length === 0) {
      toast({
        title: "No Data",
        description: "No grade data available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Course", "Teacher", "Period", "Grade (%)", "Letter Grade"];
    const rows = gradebook.courses.map((course) => [
      course.name,
      course.teacher || "",
      course.period || "",
      course.grade?.toFixed(2) || "N/A",
      course.letterGrade || "N/A",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    downloadFile(csvContent, "grades.csv", "text/csv");
    toast({
      title: "Export Successful",
      description: "Grades exported to CSV",
    });
  };

  const exportAssignmentsCSV = () => {
    if (!gradebook?.courses || gradebook.courses.length === 0) {
      toast({
        title: "No Data",
        description: "No assignment data available to export",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Course", "Assignment", "Type", "Due Date", "Points Earned", "Points Possible", "Percentage"];
    const rows: string[][] = [];

    gradebook.courses.forEach((course) => {
      if (course.assignments) {
        course.assignments.forEach((assignment) => {
          let earned = "";
          let possible = "";
          let percentage = "";

          if (assignment.score) {
            const parts = assignment.score.split("/").map((p) => p.trim());
            if (parts.length === 2) {
              earned = parts[0];
              possible = parts[1];
              const e = parseFloat(earned);
              const p = parseFloat(possible);
              if (!isNaN(e) && !isNaN(p) && p > 0) {
                percentage = ((e / p) * 100).toFixed(1) + "%";
              }
            }
          }

          rows.push([
            course.name,
            assignment.name,
            assignment.type || "",
            assignment.dueDate || "",
            earned,
            possible,
            percentage,
          ]);
        });
      }
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    downloadFile(csvContent, "assignments.csv", "text/csv");
    toast({
      title: "Export Successful",
      description: "Assignments exported to CSV",
    });
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveCustomColor = (slot: "custom1" | "custom2" | "custom3") => {
    const hue = parseInt(customHue) || 217;
    const primary = `${hue} 80% 50%`;
    const name = customName.trim() || `Custom ${slot.slice(-1)}`;
    setCustomColor(slot, primary, name);
    setColorTheme(slot);
    setEditingCustom(null);
    toast({
      title: "Theme Saved",
      description: `Custom theme "${name}" has been saved`,
    });
  };

  const getCustomSlotDisplay = (slot: "custom1" | "custom2" | "custom3") => {
    if (customColors[slot]) {
      return {
        name: customColors[slot].name,
        color: `hsl(${customColors[slot].primary})`,
      };
    }
    return {
      name: `Custom ${slot.slice(-1)}`,
      color: "hsl(217 20% 50%)",
    };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Customize your GradeVue experience
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how GradeVue looks on your device
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Mode</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className="justify-start gap-3"
                  onClick={() => setTheme("light")}
                  data-testid="button-theme-light"
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="justify-start gap-3"
                  onClick={() => setTheme("dark")}
                  data-testid="button-theme-dark"
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  className="justify-start gap-3"
                  onClick={() => setTheme("system")}
                  data-testid="button-theme-system"
                >
                  <Monitor className="h-4 w-4" />
                  System
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Color Theme</Label>
              <div className="grid gap-3 sm:grid-cols-5">
                {presetColors.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setColorTheme(preset.id)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-3 transition-all hover-elevate ${
                      colorTheme === preset.id ? "border-primary ring-2 ring-primary/20" : "border-border"
                    }`}
                    data-testid={`button-color-${preset.id}`}
                  >
                    <div
                      className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span className="text-xs font-medium">{preset.name}</span>
                    {colorTheme === preset.id && (
                      <Check className="h-3 w-3 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Custom Themes</Label>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["custom1", "custom2", "custom3"] as const).map((slot) => {
                  const display = getCustomSlotDisplay(slot);
                  const isEditing = editingCustom === slot;
                  
                  return (
                    <div key={slot} className="space-y-2">
                      {isEditing ? (
                        <div className="rounded-lg border p-3 space-y-3">
                          <Input
                            placeholder="Theme name"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            className="text-sm"
                            data-testid={`input-custom-name-${slot}`}
                          />
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs">Hue (0-360)</Label>
                              <Input
                                type="number"
                                min="0"
                                max="360"
                                value={customHue}
                                onChange={(e) => {
                                  const val = Math.min(360, Math.max(0, parseInt(e.target.value) || 0));
                                  setCustomHue(val.toString());
                                }}
                                className="w-16 h-7 text-xs"
                                data-testid={`input-custom-hue-number-${slot}`}
                              />
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={customHue}
                              onChange={(e) => setCustomHue(e.target.value)}
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                              data-testid={`input-custom-hue-${slot}`}
                            />
                            <div 
                              className="h-6 w-full rounded-md"
                              style={{ backgroundColor: `hsl(${customHue} 80% 50%)` }}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveCustomColor(slot)}
                              data-testid={`button-save-custom-${slot}`}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingCustom(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (customColors[slot]) {
                              setColorTheme(slot);
                            } else {
                              setCustomHue("217");
                              setCustomName("");
                              setEditingCustom(slot);
                            }
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg border p-3 transition-all hover-elevate ${
                            colorTheme === slot ? "border-primary ring-2 ring-primary/20" : "border-border"
                          }`}
                          data-testid={`button-custom-${slot}`}
                        >
                          <div
                            className={`h-8 w-8 rounded-full border-2 border-white shadow-sm ${
                              !customColors[slot] ? "border-dashed border-muted-foreground/50" : ""
                            }`}
                            style={{ backgroundColor: display.color }}
                          />
                          <span className="flex-1 text-left text-sm font-medium">{display.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              const storedColors = localStorage.getItem("customColors");
                              const parsed = storedColors ? JSON.parse(storedColors) : {};
                              if (parsed[slot]) {
                                const parts = parsed[slot].primary.split(" ");
                                setCustomHue(parts[0] || "217");
                                setCustomName(parsed[slot].name || "");
                              } else if (customColors[slot]) {
                                const parts = customColors[slot].primary.split(" ");
                                setCustomHue(parts[0] || "217");
                                setCustomName(customColors[slot].name || "");
                              } else {
                                setCustomHue("217");
                                setCustomName("");
                              }
                              setEditingCustom(slot);
                            }}
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
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive updates
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="grade-alerts">Grade Change Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when your grades change
                </p>
              </div>
              <Switch id="grade-alerts" disabled data-testid="switch-grade-alerts" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="assignment-reminders">Assignment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Remind me about upcoming due dates
                </p>
              </div>
              <Switch id="assignment-reminders" disabled data-testid="switch-reminders" />
            </div>
            <p className="text-xs text-muted-foreground">
              Notification features coming soon
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-visible">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <RefreshCw className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle>Data</CardTitle>
              <CardDescription>
                Manage your grade data and sync settings
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Refresh Grades</p>
                <p className="text-sm text-muted-foreground">
                  Fetch the latest data from StudentVue
                </p>
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
              <CardDescription>
                Download your grades and assignments as CSV files
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Grades Summary</p>
                <p className="text-sm text-muted-foreground">
                  Download course grades as a CSV file
                </p>
              </div>
              <Button onClick={exportGradesCSV} variant="outline" data-testid="button-export-grades">
                <FileText className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export All Assignments</p>
                <p className="text-sm text-muted-foreground">
                  Download detailed assignment data as a CSV file
                </p>
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
              <CardDescription>
                Install GradeVue as a web app on your device
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Install as Web App</p>
                <p className="text-sm text-muted-foreground">
                  Add GradeVue to your home screen for quick access
                </p>
              </div>
              <Button 
                onClick={handleInstallPWA} 
                variant="outline" 
                disabled={!canInstall}
                data-testid="button-install-pwa"
              >
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
              <CardDescription>
                Help improve GradeVue by reporting issues or suggestions
              </CardDescription>
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
              <CardDescription>
                Manage your account security
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                Your StudentVue credentials are stored locally on your device and are
                never sent to our servers. All communication is directly between your
                device and StudentVue's servers over encrypted HTTPS.
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
