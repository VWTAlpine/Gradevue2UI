import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useGrades } from "@/lib/gradeContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const { lastUpdated, refreshGrades, isLoading, credentials, gradebook } = useGrades();
  const [timeAgo, setTimeAgo] = useState<string>("");

  const studentInfo = gradebook?.studentInfo;
  const initials = studentInfo?.name
    ? studentInfo.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "ST";

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
      className="flex items-center gap-2"
      data-testid="refresh-indicator"
    >
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="text-sm text-muted-foreground hidden sm:inline">
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
