import { Progress } from "@/components/ui/progress";
import type { Category } from "@shared/schema";

interface CategoryBreakdownProps {
  categories: Category[];
}

const categoryColors = [
  { bg: "bg-blue-500", text: "text-blue-600 dark:text-blue-400" },
  { bg: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  { bg: "bg-purple-500", text: "text-purple-600 dark:text-purple-400" },
  { bg: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
];

export function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h3 className="mb-4 text-lg font-semibold">Category Breakdown</h3>
        <p className="text-sm text-muted-foreground">No category data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6" data-testid="category-breakdown">
      <h3 className="mb-6 text-lg font-semibold" data-testid="heading-category-breakdown">Category Breakdown</h3>
      <div className="space-y-6">
        {categories.map((category, index) => {
          const color = categoryColors[index % categoryColors.length];
          return (
            <div key={index} className="space-y-2" data-testid={`category-item-${index}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${color.bg}`} />
                  <span className="font-medium" data-testid={`category-name-${index}`}>{category.name}</span>
                  <span className="text-sm text-muted-foreground" data-testid={`category-weight-${index}`}>
                    ({category.weight}% of grade)
                  </span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${color.text}`} data-testid={`category-score-${index}`}>
                    {category.score.toFixed(1)}%
                  </span>
                  {category.points && (
                    <span className="ml-2 text-sm text-muted-foreground" data-testid={`category-points-${index}`}>
                      {category.points}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full ${color.bg}`}
                  style={{ width: `${Math.min(category.score, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
