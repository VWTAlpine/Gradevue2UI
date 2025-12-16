import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface AttendanceRecord {
  date: string;
  status: "Present" | "Absent" | "Tardy" | "Excused";
  course?: string;
  period?: number;
}

export default function AttendancePage() {
  const [attendanceRecords] = useState<AttendanceRecord[]>([]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Present":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
      case "Absent":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "Tardy":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "Excused":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Present":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Present
          </Badge>
        );
      case "Absent":
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            Absent
          </Badge>
        );
      case "Tardy":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Tardy
          </Badge>
        );
      case "Excused":
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            Excused
          </Badge>
        );
      default:
        return null;
    }
  };

  const stats = {
    present: attendanceRecords.filter((r) => r.status === "Present").length,
    absent: attendanceRecords.filter((r) => r.status === "Absent").length,
    tardy: attendanceRecords.filter((r) => r.status === "Tardy").length,
    excused: attendanceRecords.filter((r) => r.status === "Excused").length,
  };

  const attendanceRate =
    attendanceRecords.length > 0
      ? ((stats.present + stats.excused) / attendanceRecords.length) * 100
      : 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Attendance
        </h1>
        <p className="mt-1 text-muted-foreground">
          Track your attendance records across all courses
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" data-testid="attendance-stats-grid">
        <Card className="overflow-visible" data-testid="stat-present">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-present-count">{stats.present}</p>
                <p className="text-sm text-muted-foreground">Present</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible" data-testid="stat-absent">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-absent-count">{stats.absent}</p>
                <p className="text-sm text-muted-foreground">Absent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible" data-testid="stat-tardy">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-tardy-count">{stats.tardy}</p>
                <p className="text-sm text-muted-foreground">Tardy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible" data-testid="stat-excused">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-excused-count">{stats.excused}</p>
                <p className="text-sm text-muted-foreground">Excused</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible" data-testid="stat-attendance-rate">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-attendance-rate">{attendanceRate.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-visible" data-testid="card-attendance-records">
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No attendance records</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Attendance records will appear here once they are available from
                StudentVue.
                <br />
                Note: Attendance data may not be available in all districts.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceRecords.map((record, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border bg-card p-4"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(record.status)}
                    <div>
                      <p className="font-medium">{record.date}</p>
                      {record.course && (
                        <p className="text-sm text-muted-foreground">
                          {record.course}
                          {record.period && ` - Period ${record.period}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(record.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
