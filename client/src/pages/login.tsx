import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useGrades } from "@/lib/gradeContext";
import { ThemeToggle } from "@/components/theme-toggle";
import logoImageLight from "@assets/Gradevue_Design_Pack_(3)_1765931869180.png";
import logoImageDark from "@assets/Gradevue_Design_Pack_(2)_1766033013644.png";
import { useTheme } from "@/lib/themeContext";
import { GraduationCap, Lock, User, Globe, Loader2, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { StudentVueClient, parseGradebook } from "@/lib/studentvue-client";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setGradebook, setCredentials, setIsLoading, isLoading } = useGrades();
  const { toast } = useToast();
  const { theme } = useTheme();
  const logoImage = theme === "dark" ? logoImageDark : logoImageLight;

  const [district, setDistrict] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!district || !username || !password) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let parsedData = null;
      let loginMethod = "";

      // Try client-side login first (direct browser to StudentVue)
      try {
        console.log("Attempting client-side login to:", district);
        const client = new StudentVueClient(district, username, password);
        
        await client.checkLogin();
        console.log("Client-side login successful, fetching gradebook...");
        
        const [gradebook, studentInfo] = await Promise.all([
          client.gradebook().catch((e) => {
            console.error("Gradebook fetch error:", e);
            return null;
          }),
          client.studentInfo().catch((e) => {
            console.error("Student info fetch error:", e);
            return null;
          }),
        ]);

        if (gradebook) {
          parsedData = parseGradebook(gradebook, studentInfo);
          loginMethod = "client";
          console.log(`Client-side: Fetched ${parsedData.courses?.length || 0} courses`);
          
          // Check if any courses are missing assignments
          const hasAssignments = parsedData.courses?.some(
            (c: any) => c.assignments && c.assignments.length > 0
          );
          
          if (!hasAssignments && parsedData.courses && parsedData.courses.length > 0) {
            console.log("Client-side: No assignments found, trying server-side for better parsing...");
            try {
              const res = await fetch("/api/studentvue/login", {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "X-Requested-With": "XMLHttpRequest"
                },
                body: JSON.stringify({ district, username, password }),
                credentials: "include",
              });
              const serverResponse = await res.json();
              
              if (serverResponse.success && serverResponse.data?.courses) {
                const serverHasAssignments = serverResponse.data.courses.some(
                  (c: any) => c.assignments && c.assignments.length > 0
                );
                
                if (serverHasAssignments) {
                  console.log("Server-side: Found assignments, using server data");
                  parsedData = serverResponse.data;
                  loginMethod = "server-fallback";
                } else {
                  console.log("Server-side: Also no assignments, keeping client data");
                }
              }
            } catch (serverFallbackErr) {
              console.log("Server-side fallback failed, using client data:", serverFallbackErr);
            }
          }
        }
      } catch (clientError: any) {
        console.log("Client-side login failed, trying server-side:", clientError.message);
      }

      // If client-side failed completely, try server-side
      if (!parsedData) {
        console.log("Attempting server-side login...");
        const res = await fetch("/api/studentvue/login", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: JSON.stringify({ district, username, password }),
          credentials: "include",
        });
        const response = await res.json();

        if (response.success && response.data) {
          parsedData = response.data;
          loginMethod = "server";
          console.log(`Server-side: Fetched ${parsedData.courses?.length || 0} courses`);
        } else {
          throw new Error(response.error || "Login failed");
        }
      }

      if (!parsedData) {
        throw new Error("Could not fetch gradebook data. Please try again.");
      }
      
      setGradebook(parsedData);
      setCredentials({ district, username, password });
      toast({
        title: "Success",
        description: `Successfully logged in to StudentVue`,
      });
      setLocation("/dashboard");
    } catch (error: any) {
      const message = error.message || "Please check your credentials and try again";
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setIsLoading(true);

    try {
      const res = await apiRequest("GET", "/api/studentvue/demo");
      const response = await res.json();

      if (response.success && response.data) {
        setGradebook(response.data);
        setCredentials({ district: "demo", username: "demo", password: "demo" });
        toast({
          title: "Demo Mode",
          description: "Loaded sample data for demonstration",
        });
        setLocation("/dashboard");
      } else {
        throw new Error("Failed to load demo data");
      }
    } catch (error: any) {
      toast({
        title: "Demo Failed",
        description: error.message || "Could not load demo data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/5 via-background to-primary/10">
      <header className="flex items-center justify-end p-4">
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4">
              <img 
                src={logoImage} 
                alt="GradeVue Logo" 
                className="mx-auto h-56 w-auto object-contain"
                data-testid="img-login-logo"
              />
            </div>
            <p className="mt-2 text-muted-foreground">
              A beautiful, full-fledged replacement for StudentVue
            </p>
            <p className="mt-1 text-sm text-muted-foreground/70">
              By students, for students
            </p>
          </div>

          <Card className="overflow-visible shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                Connect your StudentVue account to access your grades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="district">District URL</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="district"
                      type="text"
                      placeholder="https://studentvue.your-district.org"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                      data-testid="input-district"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Your StudentVue username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                      data-testid="input-username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={isLoading}
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    "Sign In with StudentVue"
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleDemo}
                disabled={isLoading}
                data-testid="button-demo"
              >
                Try Demo
              </Button>

              <div className="mt-6 space-y-2 text-center text-xs text-muted-foreground">
                <p>
                  <Lock className="mr-1 inline-block h-3 w-3" />
                  Your credentials are securely encrypted and transmitted directly to
                  StudentVue
                </p>
                <p className="text-muted-foreground/70">
                  GradeVue is an independent project and is not affiliated with StudentVue or Edupoint.
                  This app accesses your data through StudentVue's public API for personal, educational use only.
                  By using this app, you agree to use it responsibly and in accordance with your school's policies.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="shrink-0 px-4 py-3 text-center text-xs text-muted-foreground/70" data-testid="app-footer">
        <p>
          Developed by Victor T and the GradeVue 2 Team. 
          <span className="mx-1">|</span>
          2025 Connor Rakov. 
          <span className="mx-1">|</span>
          Licensed under the{" "}
          <a 
            href="https://www.gnu.org/licenses/gpl-3.0.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-muted-foreground"
          >
            GNU GPLv3
          </a>
        </p>
      </footer>
    </div>
  );
}
