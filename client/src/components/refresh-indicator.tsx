import { useState, useEffect } from "react";
import { Clock, RefreshCw } from "lucide-react";
import { useGrades } from "@/lib/gradeContext";

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
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-muted/90 backdrop-blur-sm border px-4 py-2 shadow-lg"
      data-testid="refresh-indicator"
    >
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        Last updated {timeAgo}
      </span>
      <button
        className="text-sm font-medium text-primary hover:underline disabled:opacity-50 flex items-center gap-1"
        onClick={refreshGrades}
        disabled={isLoading}
        data-testid="button-refresh-indicator"
      >
        {isLoading ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : null}
        Refresh
      </button>
    </div>
  );
}
