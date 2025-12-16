import { useState, useEffect } from "react";
import { useGrades } from "@/lib/gradeContext";
import { StudentVueClient, parseAttendance, type ParsedAttendanceRecord } from "@/lib/studentvue-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

export default function AttendancePage() {
  const { credentials } = useGrades();
  const [attendanceRecords, setAttendanceRecords] = useState<ParsedAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, tardy: 0, excused: 0 });

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!credentials) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        let attendanceData = null;

        try {
          const client = new StudentVueClient(
            credentials.district,
            credentials.username,
            credentials.password
          );
          await client.checkLogin();
          const rawAttendance = await client.attendance();
          attendanceData = parseAttendance(rawAttendance);
        } catch (clientErr: any) {
          console.log("Client-side attendance fetch failed, trying server:", clientErr.message);
          const res = await fetch("/api/studentvue/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(credentials),
            credentials: "include",
          });
          const response = await res.json();
          if (response.success && response.data) {
            attendanceData = response.data;
          }
        }

        if (attendanceData) {
          setAttendanceRecords(attendanceData.records || []);
          setStats({
            present: 0,
            absent: attendanceData.totalAbsences || 0,
            tardy: attendanceData.totalTardies || 0,
            excused: attendanceData.totalExcused || 0,
          });
        }
      } catch (err: any) {
        console.error("Error fetching attendance:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [credentials]);

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("present")) {
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    }
    if (statusLower.includes("tardy") || statusLower.includes("late")) {
      return <Clock className="h-5 w-5 text-amber-500" />;
    }
    if (statusLower.includes("excused")) {
      return <AlertCircle className="h-5 w-5 text-blue-500" />;
    }
    if (statusLower.includes("absent")) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("present")) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          Present
        </Badge>
      );
    }
    if (statusLower.includes("tardy") || statusLower.includes("late")) {
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          Tardy
        </Badge>
      );
    }
    if (statusLower.includes("excused")) {
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          Excused
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        Absent
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading attendance records...</p>
      </div>
    );
  }

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="attendance-stats-grid">
        <Card className="overflow-visible" data-testid="stat-absent">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-absent-count">{stats.absent}</p>
                <p className="text-sm text-muted-foreground">Total Absences</p>
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
                <p className="text-sm text-muted-foreground">Tardies</p>
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

        <Card className="overflow-visible" data-testid="stat-unexcused">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-unexcused-count">{stats.absent - stats.excused}</p>
                <p className="text-sm text-muted-foreground">Unexcused</p>
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
