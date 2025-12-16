import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useGrades } from "@/lib/gradeContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { GraduationCap, Lock, User, Globe, Loader2, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setGradebook, setCredentials, setIsLoading, isLoading } = useGrades();
  const { toast } = useToast();

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
        setGradebook(response.data);
        setCredentials({ district, username, password });
        toast({
          title: "Success",
          description: "Successfully logged in to StudentVue",
        });
        setLocation("/dashboard");
      } else {
        // Show detailed error message with server details if available
        const errorMessage = response.error || "Login failed";
        const details = response.details ? ` (${response.details})` : "";
        throw new Error(errorMessage + details);
      }
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
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">GradeVue</h1>
            <p className="mt-2 text-muted-foreground">
              A beautiful way to view your StudentVue grades
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

              <p className="mt-6 text-center text-xs text-muted-foreground">
                <Lock className="mr-1 inline-block h-3 w-3" />
                Your credentials are securely encrypted and transmitted directly to
                StudentVue
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
