import { useState, useEffect, useMemo } from "react";
import { useGrades } from "@/lib/gradeContext";
import { StudentVueClient, parseAttendance, type ParsedAttendanceRecord } from "@/lib/studentvue-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, AlertCircle, Loader2, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

type AttendanceStatus = "absent" | "tardy" | "excused" | "present" | null;

function parseRecordDate(dateStr: string): Date | null {
  try {
    const parts = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (parts) {
      return new Date(parseInt(parts[3]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function getStatusFromRecord(status: string): AttendanceStatus {
  const s = status.toLowerCase();
  if (s.includes("excused")) return "excused";
  if (s.includes("tardy") || s.includes("late")) return "tardy";
  if (s.includes("absent") || s.includes("unexcused")) return "absent";
  if (s.includes("present")) return "present";
  return "absent";
}

export default function AttendancePage() {
  const { credentials } = useGrades();
  const [attendanceRecords, setAttendanceRecords] = useState<ParsedAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, tardy: 0, excused: 0 });
  const [calendarDate, setCalendarDate] = useState(new Date());

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
          const newStats = {
            present: 0,
            absent: attendanceData.totalAbsences || 0,
            tardy: attendanceData.totalTardies || 0,
            excused: attendanceData.totalExcused || 0,
          };
          setStats(newStats);
          localStorage.setItem("attendance", JSON.stringify({
            totalAbsences: attendanceData.totalAbsences || 0,
            totalTardies: attendanceData.totalTardies || 0,
            totalExcused: attendanceData.totalExcused || 0,
          }));
        }
      } catch (err: any) {
        console.error("Error fetching attendance:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendance();
  }, [credentials]);

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, AttendanceStatus>();
    attendanceRecords.forEach((record) => {
      const date = parseRecordDate(record.date);
      if (date) {
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const status = getStatusFromRecord(record.status);
        const existing = map.get(key);
        if (!existing || status === "absent" || (status === "tardy" && existing !== "absent")) {
          map.set(key, status);
        }
      }
    });
    return map;
  }, [attendanceRecords]);

  const monthlyData = useMemo(() => {
    const data: { month: string; absent: number; tardy: number; excused: number; absentPct: number; tardyPct: number; excusedPct: number; total: number }[] = [];
    const monthCounts = new Map<string, { absent: number; tardy: number; excused: number }>();
    
    attendanceRecords.forEach((record) => {
      const date = parseRecordDate(record.date);
      if (date) {
        const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
        const status = getStatusFromRecord(record.status);
        const counts = monthCounts.get(key) || { absent: 0, tardy: 0, excused: 0 };
        if (status === "absent") counts.absent++;
        else if (status === "tardy") counts.tardy++;
        else if (status === "excused") counts.excused++;
        monthCounts.set(key, counts);
      }
    });

    const sorted = Array.from(monthCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    sorted.forEach(([key, counts]) => {
      const [year, month] = key.split("-");
      const total = counts.absent + counts.tardy + counts.excused;
      data.push({
        month: `${SHORT_MONTHS[parseInt(month)]} ${year.slice(2)}`,
        ...counts,
        absentPct: total > 0 ? Math.round((counts.absent / total) * 100) : 0,
        tardyPct: total > 0 ? Math.round((counts.tardy / total) * 100) : 0,
        excusedPct: total > 0 ? Math.round((counts.excused / total) * 100) : 0,
        total,
      });
    });

    return data;
  }, [attendanceRecords]);

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { day: number | null; status: AttendanceStatus }[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, status: null });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${month}-${d}`;
      days.push({ day: d, status: attendanceByDate.get(key) || null });
    }

    return days;
  }, [calendarDate, attendanceByDate]);

  const prevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "absent": return "bg-red-400 dark:bg-red-500";
      case "tardy": return "bg-amber-400 dark:bg-amber-500";
      case "excused": return "bg-emerald-400 dark:bg-emerald-500";
      default: return "";
    }
  };

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
                <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-unexcused-count">{Math.max(0, stats.absent - stats.excused)}</p>
                <p className="text-sm text-muted-foreground">Unexcused</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-visible" data-testid="card-attendance-calendar">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle>Attendance Calendar</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={prevMonth} data-testid="button-prev-month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center text-sm font-medium">
                {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </span>
              <Button variant="ghost" size="icon" onClick={nextMonth} data-testid="button-next-month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((day, i) => (
                <div key={i} className="py-2 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {calendarDays.map((item, i) => (
                <div
                  key={i}
                  className={`relative flex h-9 items-center justify-center rounded-md text-sm ${
                    item.day ? "hover-elevate cursor-default" : ""
                  }`}
                >
                  {item.day && (
                    <>
                      <span>{item.day}</span>
                      {item.status && (
                        <span
                          className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${getStatusColor(item.status)}`}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 dark:bg-emerald-500" />
                <span>Excused</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400 dark:bg-amber-500" />
                <span>Tardy</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400 dark:bg-red-500" />
                <span>Absent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-visible" data-testid="card-monthly-chart">
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-muted-foreground">
                No attendance data to display
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0]?.payload;
                          return (
                            <div className="rounded-lg border bg-card p-3 shadow-lg">
                              <p className="font-medium">{label}</p>
                              <p className="text-sm text-red-500">Absent: {data?.absent || 0} ({data?.absentPct || 0}%)</p>
                              <p className="text-sm text-amber-500">Tardy: {data?.tardy || 0} ({data?.tardyPct || 0}%)</p>
                              <p className="text-sm text-emerald-500">Excused: {data?.excused || 0} ({data?.excusedPct || 0}%)</p>
                              <p className="mt-1 text-xs text-muted-foreground">Total events: {data?.total || 0}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="absentPct" name="Absent %" fill="#ef4444" stackId="a" />
                    <Bar dataKey="tardyPct" name="Tardy %" fill="#f59e0b" stackId="a" />
                    <Bar dataKey="excusedPct" name="Excused %" fill="#10b981" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
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
              <CalendarIcon className="h-12 w-12 text-muted-foreground" />
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
                <Collapsible key={index}>
                  <div className="rounded-lg border bg-card">
                    <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover-elevate">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(record.status)}
                        <div className="text-left">
                          <p className="font-medium">{record.date}</p>
                          {record.course && (
                            <p className="text-sm text-muted-foreground">
                              {record.course}
                              {record.period ? ` - Period ${record.period}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(record.status)}
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]_&]:rotate-180" />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t px-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Reason: </span>
                          {record.reason || "No description provided"}
                        </p>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
