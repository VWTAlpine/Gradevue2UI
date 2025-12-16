import { useState, useMemo } from "react";
import { useGrades } from "@/lib/gradeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { letterGradeToPoints } from "@shared/schema";
import { Calculator, Plus, Trash2, Scale } from "lucide-react";

interface GPAEntry {
  id: string;
  courseName: string;
  letterGrade: string;
  credits: number;
  isAP: boolean;
  isHonors: boolean;
}

const gradeOptions = [
  "A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"
];

export default function GPACalculatorPage() {
  const { gradebook } = useGrades();

  const initialEntries = useMemo(() => {
    if (!gradebook?.courses) return [];
    return gradebook.courses.map((course, index) => ({
      id: `course-${index}`,
      courseName: course.name,
      letterGrade: course.letterGrade || "B",
      credits: 1,
      isAP: course.name.toLowerCase().includes("ap "),
      isHonors: course.name.toLowerCase().includes("honors") ||
                course.name.toLowerCase().includes("hon "),
    }));
  }, [gradebook]);

  const [entries, setEntries] = useState<GPAEntry[]>(
    initialEntries.length > 0 ? initialEntries : [
      { id: "1", courseName: "", letterGrade: "A", credits: 1, isAP: false, isHonors: false },
    ]
  );

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        id: Date.now().toString(),
        courseName: "",
        letterGrade: "B",
        credits: 1,
        isAP: false,
        isHonors: false,
      },
    ]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((e) => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof GPAEntry, value: any) => {
    setEntries(
      entries.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      )
    );
  };

  const { unweightedGPA, weightedGPA, totalCredits } = useMemo(() => {
    if (entries.length === 0) {
      return { unweightedGPA: 0, weightedGPA: 0, totalCredits: 0 };
    }

    let totalUnweightedPoints = 0;
    let totalWeightedPoints = 0;
    let credits = 0;

    entries.forEach((entry) => {
      const basePoints = letterGradeToPoints(entry.letterGrade);
      let weightedPoints = basePoints;

      if (entry.isAP) {
        weightedPoints += 1.0;
      } else if (entry.isHonors) {
        weightedPoints += 0.5;
      }

      totalUnweightedPoints += basePoints * entry.credits;
      totalWeightedPoints += weightedPoints * entry.credits;
      credits += entry.credits;
    });

    return {
      unweightedGPA: credits > 0 ? totalUnweightedPoints / credits : 0,
      weightedGPA: credits > 0 ? totalWeightedPoints / credits : 0,
      totalCredits: credits,
    };
  }, [entries]);

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return "text-emerald-600 dark:text-emerald-400";
    if (gpa >= 3.0) return "text-blue-600 dark:text-blue-400";
    if (gpa >= 2.5) return "text-amber-600 dark:text-amber-400";
    if (gpa >= 2.0) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          GPA Calculator
        </h1>
        <p className="mt-1 text-muted-foreground">
          Calculate your weighted and unweighted GPA
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="overflow-visible lg:col-span-1" data-testid="card-unweighted-gpa">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Scale className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Unweighted GPA</CardTitle>
              <p className="text-sm text-muted-foreground">Standard 4.0 scale</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-5xl font-bold ${getGPAColor(unweightedGPA)}`} data-testid="text-unweighted-gpa">
              {unweightedGPA.toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              / 4.0 scale
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-visible lg:col-span-1" data-testid="card-weighted-gpa">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Calculator className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Weighted GPA</CardTitle>
              <p className="text-sm text-muted-foreground">AP/Honors weighted</p>
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-5xl font-bold ${getGPAColor(weightedGPA)}`} data-testid="text-weighted-gpa">
              {weightedGPA.toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              / 5.0 scale (with AP courses)
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-visible lg:col-span-1" data-testid="card-gpa-summary">
          <CardHeader>
            <CardTitle className="text-lg">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Courses</span>
              <span className="font-medium" data-testid="text-total-courses">{entries.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Credits</span>
              <span className="font-medium" data-testid="text-total-credits">{totalCredits}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">AP Courses</span>
              <span className="font-medium" data-testid="text-ap-courses">
                {entries.filter((e) => e.isAP).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Honors Courses</span>
              <span className="font-medium" data-testid="text-honors-courses">
                {entries.filter((e) => e.isHonors).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-visible">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Courses</CardTitle>
          <Button onClick={addEntry} size="sm" data-testid="button-add-course">
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6"
              >
                <div className="lg:col-span-2">
                  <Label htmlFor={`course-${entry.id}`} className="text-xs">
                    Course Name
                  </Label>
                  <Input
                    id={`course-${entry.id}`}
                    value={entry.courseName}
                    onChange={(e) =>
                      updateEntry(entry.id, "courseName", e.target.value)
                    }
                    placeholder="Enter course name"
                    className="mt-1"
                    data-testid={`input-course-name-${index}`}
                  />
                </div>

                <div>
                  <Label className="text-xs">Grade</Label>
                  <Select
                    value={entry.letterGrade}
                    onValueChange={(value) =>
                      updateEntry(entry.id, "letterGrade", value)
                    }
                  >
                    <SelectTrigger className="mt-1" data-testid={`select-grade-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeOptions.map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor={`credits-${entry.id}`} className="text-xs">
                    Credits
                  </Label>
                  <Input
                    id={`credits-${entry.id}`}
                    type="number"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={entry.credits}
                    onChange={(e) =>
                      updateEntry(entry.id, "credits", parseFloat(e.target.value) || 1)
                    }
                    className="mt-1"
                    data-testid={`input-credits-${index}`}
                  />
                </div>

                <div className="flex items-end gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`ap-${entry.id}`}
                      checked={entry.isAP}
                      onCheckedChange={(checked) => {
                        updateEntry(entry.id, "isAP", checked);
                        if (checked) updateEntry(entry.id, "isHonors", false);
                      }}
                      data-testid={`switch-ap-${index}`}
                    />
                    <Label htmlFor={`ap-${entry.id}`} className="text-xs">
                      AP
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`honors-${entry.id}`}
                      checked={entry.isHonors}
                      onCheckedChange={(checked) => {
                        updateEntry(entry.id, "isHonors", checked);
                        if (checked) updateEntry(entry.id, "isAP", false);
                      }}
                      data-testid={`switch-honors-${index}`}
                    />
                    <Label htmlFor={`honors-${entry.id}`} className="text-xs">
                      Honors
                    </Label>
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEntry(entry.id)}
                    disabled={entries.length === 1}
                    className="text-destructive"
                    data-testid={`button-remove-course-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
