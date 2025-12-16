import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  testId?: string;
  chartData?: number[];
  chartColor?: string;
  showChartBackground?: boolean;
  size?: "default" | "compact" | "mini";
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
  testId,
  chartData,
  chartColor = "#10b981",
  showChartBackground = false,
  size = "default",
}: StatCardProps) {
  const formattedChartData = chartData?.map((val, idx) => ({ value: val, idx }));

  if (size === "mini") {
    return (
      <Card className="overflow-visible" data-testid={testId || `stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
        <CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight mt-0.5">{value}</p>
        </CardContent>
      </Card>
    );
  }

  if (size === "compact") {
    return (
      <Card className="overflow-visible" data-testid={testId || `stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5 min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">{title}</p>
              <p className="text-3xl font-bold tracking-tight">
                {value}
              </p>
            </div>
            {Icon && (
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBgColor}`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-visible" data-testid={testId || `stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
              {subtitle && (
                <span className="text-base font-normal text-muted-foreground">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
          {Icon && !chartData && (
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBgColor}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          )}
        </div>
        {formattedChartData && formattedChartData.length > 0 && (
          <div className={`mt-3 h-16 w-full rounded-md ${showChartBackground ? "bg-muted/50 p-2" : ""}`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedChartData}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
