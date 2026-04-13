import { useMemo } from "react";
import { useGrades } from "@/lib/gradeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CalendarDays, CheckCircle2 } from "lucide-react";
import type { Assignment, Course } from "@shared/schema";

interface DeadlineItem {
  assignment: Assignment;
  course: Course;
  dueDate: Date;
  daysRemaining: number;
}

type Bucket = "Today" | "This Week" | "Next Week" | "Later";

function getBucket(daysRemaining: number): Bucket {
  if (daysRemaining === 0) return "Today";
  if (daysRemaining <= 7) return "This Week";
  if (daysRemaining <= 14) return "Next Week";
  return "Later";
}

function getDaysRemaining(dueDate: Date): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const diff = due.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function CountdownBadge({ daysRemaining }: { daysRemaining: number }) {
  if (daysRemaining === 0) {
    return (
      <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 shrink-0" data-testid="badge-due-today">
        Due Today
      </Badge>
    );
  }
  if (daysRemaining === 1) {
    return (
      <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 shrink-0" data-testid="badge-due-tomorrow">
        Tomorrow
      </Badge>
    );
  }
  if (daysRemaining <= 7) {
    return (
      <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 shrink-0" data-testid={`badge-days-${daysRemaining}`}>
        {daysRemaining}d left
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="shrink-0" data-testid={`badge-days-${daysRemaining}`}>
      {daysRemaining}d left
    </Badge>
  );
}

const bucketOrder: Bucket[] = ["Today", "This Week", "Next Week", "Later"];

const bucketIcons: Record<Bucket, typeof Clock> = {
  Today: Clock,
  "This Week": CalendarDays,
  "Next Week": CalendarDays,
  Later: CalendarDays,
};

const bucketColors: Record<Bucket, string> = {
  Today: "text-red-600 dark:text-red-400",
  "This Week": "text-amber-600 dark:text-amber-400",
  "Next Week": "text-blue-600 dark:text-blue-400",
  Later: "text-muted-foreground",
};

export default function DeadlinesPage() {
  const { gradebook } = useGrades();
  const courses = gradebook?.courses || [];

  const grouped = useMemo(() => {
    const items: DeadlineItem[] = [];

    for (const course of courses) {
      for (const assignment of course.assignments) {
        if (!assignment.dueDate) continue;
        const dueDate = new Date(assignment.dueDate);
        if (isNaN(dueDate.getTime())) continue;

        const daysRemaining = getDaysRemaining(dueDate);
        if (daysRemaining < 0) continue;

        const isAlreadyGraded =
          assignment.score &&
          assignment.score !== "Not Graded" &&
          assignment.score !== "N/A" &&
          assignment.score !== "";
        if (isAlreadyGraded) continue;

        items.push({ assignment, course, dueDate, daysRemaining });
      }
    }

    items.sort((a, b) => a.daysRemaining - b.daysRemaining);

    const result: Partial<Record<Bucket, DeadlineItem[]>> = {};
    for (const item of items) {
      const bucket = getBucket(item.daysRemaining);
      if (!result[bucket]) result[bucket] = [];
      result[bucket]!.push(item);
    }
    return result;
  }, [courses]);

  const hasAny = bucketOrder.some(b => (grouped[b]?.length ?? 0) > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl" data-testid="heading-deadlines">
          Upcoming Deadlines
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          All upcoming assignments across your courses, sorted by urgency
        </p>
      </div>

      {!hasAny ? (
        <div className="rounded-lg border bg-card p-12 text-center" data-testid="empty-deadlines">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
          <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No upcoming assignments found. Check back after a sync.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {bucketOrder.map(bucket => {
            const items = grouped[bucket];
            if (!items || items.length === 0) return null;
            const Icon = bucketIcons[bucket];
            const colorClass = bucketColors[bucket];
            return (
              <div key={bucket} data-testid={`bucket-${bucket.replace(/\s+/g, "-").toLowerCase()}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`h-5 w-5 ${colorClass}`} />
                  <h2 className={`text-lg font-semibold ${colorClass}`}>{bucket}</h2>
                  <Badge variant="secondary" className="ml-1">
                    {items.length}
                  </Badge>
                </div>
                <Card className="overflow-visible">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {items.map((item, idx) => (
                        <div
                          key={`${item.course.id}-${item.assignment.name}-${idx}`}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                          data-testid={`deadline-item-${item.course.id}-${idx}`}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" data-testid={`deadline-assignment-name-${idx}`}>
                              {item.assignment.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate" data-testid={`deadline-course-name-${idx}`}>
                              {item.course.name}
                              {item.assignment.type ? ` · ${item.assignment.type}` : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-muted-foreground hidden sm:block">
                              {item.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                            <CountdownBadge daysRemaining={item.daysRemaining} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
