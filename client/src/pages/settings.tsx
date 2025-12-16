import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/lib/themeContext";
import { useGrades } from "@/lib/gradeContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Moon, Sun, Monitor, RefreshCw, LogOut, Shield, Bell, Palette, Download, FileText } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout, credentials, setIsLoading, setGradebook, setCredentials, gradebook } = useGrades();
  const { toast } = useToast();

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
              <Label>Theme</Label>
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
