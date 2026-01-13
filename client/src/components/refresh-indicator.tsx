import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useGrades } from "@/lib/gradeContext";
import { Button } from "@/components/ui/button";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "Just now";
  } else if (diffMinutes === 1) {
    return "1 minute ago";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffHours === 1) {
    return "1 hour ago";
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return "1 day ago";
  } else {
    return `${diffDays} days ago`;
  }
}

export function RefreshIndicator() {
  const { lastUpdated, refreshGrades, isLoading, credentials } = useGrades();
  const [timeAgo, setTimeAgo] = useState<string>("");

  useEffect(() => {
    if (!lastUpdated) return;

    const updateTimeAgo = () => {
      setTimeAgo(formatTimeAgo(lastUpdated));
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 30000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  if (!lastUpdated || credentials?.district === "demo") {
    return null;
  }

  return (
    <div 
      className="flex items-center gap-3"
      data-testid="refresh-indicator"
    >
      <span className="text-sm text-muted-foreground hidden sm:inline">
        Updated {timeAgo}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={refreshGrades}
        disabled={isLoading}
        className="gap-2"
        data-testid="button-refresh-indicator"
        aria-label="Refresh grades"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </div>
  );
}
