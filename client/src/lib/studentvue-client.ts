import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const alwaysArray = [
  'Gradebook.Courses.Course',
  'Gradebook.Courses.Course.Marks.Mark',
  'Gradebook.Courses.Course.Marks.Mark.Assignments.Assignment',
  'Gradebook.Courses.Course.Marks.Mark.GradeCalculationSummary.AssignmentGradeCalc',
  'Gradebook.ReportingPeriods.ReportPeriod',
  'Attendance.Absences.Absence'
];

const parser = new XMLParser({
  ignoreAttributes: false,
  ignoreDeclaration: true,
  attributeNamePrefix: '_',
  isArray: (_name: string, jpath: string) => alwaysArray.includes(jpath)
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '_'
});

function normalizeDistrictUrl(input: string): string {
  let url = input.trim();
  url = url.replace(/\/+$/, '');
  
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  
  try {
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return url.replace(/^https?:\/\//, '');
  }
}

export class StudentVueClient {
  domain: string;
  userID: string;
  password: string;

  constructor(domain: string, userID: string, password: string) {
    this.domain = normalizeDistrictUrl(domain);
    this.userID = userID.trim();
    this.password = password;
  }

  async soapRequest(operation: string, methodName: string, params: unknown = {}) {
    const paramStr = builder
      .build({ Params: params })
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch(`https://${this.domain}/Service/PXPCommunication.asmx?WSDL`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
        body: `<?xml version="1.0" encoding="utf-8"?>
          <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
            <soap12:Body>
              <${operation} xmlns="http://edupoint.com/webservices/">
                <userID>${this.userID}</userID>
                <password>${this.password}</password>
                <skipLoginLog>true</skipLoginLog>
                <parent>false</parent>
                <webServiceHandleName>PXPWebServices</webServiceHandleName>
                <methodName>${methodName}</methodName>
                <paramStr>${paramStr}</paramStr>
              </${operation}>
            </soap12:Body>
          </soap12:Envelope>`,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }

      const text = await res.text();
      const envelope = parser.parse(text);
      
      const body = envelope['soap:Envelope']?.['soap:Body'];
      if (!body) {
        throw new Error('Invalid SOAP response');
      }
      
      const response = body[operation + 'Response'];
      if (!response) {
        throw new Error('Invalid SOAP response structure');
      }
      
      const resultXml = response[operation + 'Result'];
      if (!resultXml) {
        throw new Error('No result in SOAP response');
      }
      
      const result = parser.parse(resultXml);

      if (result.RT_ERROR) {
        throw new Error(result.RT_ERROR._ERROR_MESSAGE || 'StudentVue error');
      }

      return result;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. The server took too long to respond.');
      }
      
      throw error;
    }
  }

  request(methodName: string, params: unknown = {}) {
    return this.soapRequest('ProcessWebServiceRequest', methodName, params);
  }

  async checkLogin(): Promise<void> {
    await this.request('StudentInfo');
  }

  async gradebook(reportPeriod?: number): Promise<any> {
    if (reportPeriod !== undefined) {
      return (await this.request('Gradebook', { ReportPeriod: reportPeriod })).Gradebook;
    }
    return (await this.request('Gradebook')).Gradebook;
  }

  async studentInfo(): Promise<any> {
    return (await this.request('StudentInfo')).StudentInfo;
  }

  async attendance(): Promise<any> {
    return (await this.request('Attendance')).Attendance;
  }

  async studentDocuments(): Promise<any> {
    return (await this.request('GetStudentDocumentInitialData')).StudentDocuments;
  }

  async getDocument(documentGU: string): Promise<any> {
    const result = await this.request('GetContentOfAttachedDoc', { DocumentGU: documentGU });
    return result;
  }

  async getDocumentContent(documentGU: string): Promise<{ base64Code: string; fileName: string; docType: string } | null> {
    try {
      const result = await this.getDocument(documentGU);
      const docData = result?.AttachmentXML?.DocumentData || result?.DocumentData;
      if (docData) {
        return {
          base64Code: docData._Base64Code || docData.Base64Code || "",
          fileName: docData._FileName || docData.FileName || "document.pdf",
          docType: docData._DocType || docData.DocType || "PDF",
        };
      }
      return null;
    } catch (e) {
      console.error("Error fetching document content:", e);
      return null;
    }
  }
}

export interface ParsedDocument {
  name: string;
  date: string;
  type: string;
  documentGU: string;
  fileName?: string;
}

export interface ParsedDocuments {
  documents: ParsedDocument[];
}

export function parseDocuments(data: any): ParsedDocuments {
  const documents: ParsedDocument[] = [];
  
  try {
    // Try multiple possible paths for document data
    const studentDocuments = 
      data?.StudentDocumentDatas?.StudentDocumentData ||
      data?.StudentDocuments?.StudentDocument ||
      data?.Documents?.Document ||
      data?.studentDocuments ||
      [];
    const docList = Array.isArray(studentDocuments) ? studentDocuments : (studentDocuments ? [studentDocuments] : []);
    
    for (const doc of docList) {
      if (!doc) continue;
      
      // _DocumentComment contains the actual title (e.g., "Report Card With Attendance Detail", "Progress Report 1")
      const docName = 
        doc._DocumentComment || doc.DocumentComment ||
        doc._DocumentName || doc.DocumentName ||
        doc._Comment || doc.Comment ||
        doc._Name || doc.Name ||
        "Unknown Document";
      
      const docDate =
        doc._DocumentDate || doc.DocumentDate ||
        doc._Date || doc.Date ||
        "";
      
      const docType =
        doc._DocumentType || doc.DocumentType ||
        doc._Type || doc.Type ||
        "Document";
      
      const docGU =
        doc._DocumentGU || doc.DocumentGU ||
        doc._GU || doc.GU ||
        "";
      
      const docFileName =
        doc._DocumentFileName || doc.DocumentFileName ||
        doc._FileName || doc.FileName ||
        "";
      
      documents.push({
        name: docName,
        date: docDate,
        type: docType,
        documentGU: docGU,
        fileName: docFileName,
      });
    }
  } catch (e) {
    console.error("Error parsing documents:", e);
  }
  
  return { documents };
}

export interface ParsedAttendance {
  totalAbsences: number;
  totalTardies: number;
  totalExcused: number;
  totalUnexcused: number;
  records: ParsedAttendanceRecord[];
}

export interface ParsedAttendanceRecord {
  date: string;
  period: number;
  course: string;
  status: string;
  reason: string;
  description: string;
}

// Parse attendance code to determine type
function parseAttendanceCode(code: string): "Tardy" | "Absent" | "Excused" | "Unexcused" {
  const codeLower = code.toLowerCase();
  
  // Common StudentVue attendance codes
  // T, Tdy, Tardy, ClsTdy, ClsTdyAbE = Tardy
  // A, Abs, Absent = Absent (unexcused)
  // E, Exc, Excused = Excused absence
  // U, Unx, Unexcused = Unexcused absence
  
  if (codeLower.includes("tdy") || codeLower.includes("tardy") || 
      codeLower === "t" || codeLower.includes("late") ||
      codeLower.includes("clstdy")) {
    return "Tardy";
  }
  
  if (codeLower.includes("exc") || codeLower === "e" ||
      codeLower.includes("field") || codeLower.includes("medical") ||
      codeLower.includes("doctor") || codeLower.includes("illness")) {
    return "Excused";
  }
  
  if (codeLower.includes("unx") || codeLower === "u" ||
      codeLower.includes("unexcused")) {
    return "Unexcused";
  }
  
  // Default to Absent (which we'll count as unexcused)
  return "Absent";
}

export function parseAttendance(attendance: any): ParsedAttendance {
  const records: ParsedAttendanceRecord[] = [];
  let totalAbsences = 0;
  let totalTardies = 0;
  let totalExcused = 0;
  let totalUnexcused = 0;

  try {
    // Log raw attendance data for debugging
    console.log("Raw attendance data:", JSON.stringify(attendance, null, 2));
    
    // Try SOAP response format first (from client-side)
    const absences = attendance?.Absences?.Absence || attendance?.absences || [];
    const absenceList = Array.isArray(absences) ? absences : (absences ? [absences] : []);

    for (const absence of absenceList) {
      if (!absence) continue;
      
      // Log individual absence record
      console.log("Absence record:", JSON.stringify(absence, null, 2));

      const dateVal = absence._AbsenceDate || absence.date || "";
      const reason = absence._Reason || absence.reason || "";
      const note = absence._Note || absence.note || "";
      
      // Description/Reason text
      const description = absence._ReasonDescription || absence.reasonDescription || 
                          absence._Description || absence.description || 
                          reason || "";
      
      // Get period activities - this contains per-period attendance codes
      const periodActivities = absence._PeriodActivities || absence.periodActivities || [];
      const dailyIconType = absence._DailyIconType || absence.dailyIconType || "";
      
      // Parse period activities if available (more detailed)
      if (periodActivities && (Array.isArray(periodActivities) ? periodActivities.length > 0 : periodActivities)) {
        const activityList = Array.isArray(periodActivities) ? periodActivities : [periodActivities];
        
        for (const activity of activityList) {
          if (!activity) continue;
          
          const periodNum = activity._Period || activity.period || 0;
          const courseName = activity._Name || activity.name || note || "";
          const activityCode = activity._Code || activity.code || activity._Activity || activity.activity || reason || "";
          
          const status = parseAttendanceCode(activityCode);
          
          if (status === "Tardy") {
            totalTardies++;
          } else if (status === "Excused") {
            totalExcused++;
            totalAbsences++;
          } else {
            totalAbsences++;
            totalUnexcused++;
          }
          
          records.push({
            date: dateVal,
            period: typeof periodNum === "number" ? periodNum : (parseInt(periodNum) || 0),
            course: courseName,
            status: activityCode || status,
            reason: reason,
            description: description,
          });
        }
      } else {
        // Fallback: Use periods list and reason
        const periods = absence._Periods || absence.periods || "";
        const periodList = typeof periods === "string" 
          ? periods.split(",").filter((p: string) => p.trim())
          : (Array.isArray(periods) ? periods : (periods ? [periods] : []));
        
        // Check dailyIconType or reason for status
        const statusCode = dailyIconType || reason;
        const status = parseAttendanceCode(statusCode);
        
        if (status === "Tardy") {
          totalTardies++;
        } else if (status === "Excused") {
          totalExcused++;
          totalAbsences++;
        } else {
          totalAbsences++;
          totalUnexcused++;
        }
        
        if (periodList.length === 0) {
          records.push({
            date: dateVal,
            period: 0,
            course: note,
            status: statusCode || status,
            reason: reason,
            description: description,
          });
        } else {
          for (const period of periodList) {
            records.push({
              date: dateVal,
              period: typeof period === "number" ? period : (parseInt(period) || 0),
              course: note,
              status: statusCode || status,
              reason: reason,
              description: description,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("Error parsing attendance:", e);
  }

  return {
    totalAbsences,
    totalTardies,
    totalExcused,
    totalUnexcused,
    records,
  };
}

export interface ParsedGradebook {
  courses: ParsedCourse[];
  reportingPeriod: {
    name: string;
    startDate: string;
    endDate: string;
  };
  reportingPeriods: any[];
  studentInfo: {
    name: string;
    grade: string;
    school: string;
    studentId: string;
    email: string;
    phone: string;
    address: string;
    birthDate: string;
    counselor: string;
    photo: string;
  } | null;
}

export interface ParsedCourse {
  id: string;
  name: string;
  period: number;
  teacher: string;
  room: string;
  grade: number | null;
  letterGrade: string;
  assignments: ParsedAssignment[];
  categories: ParsedCategory[];
}

export interface ParsedAssignment {
  name: string;
  type: string;
  date: string;
  dueDate: string;
  score: string;
  scoreType: string;
  points: string;
  pointsEarned: number | null;
  pointsPossible: number | null;
  notes: string;
  description: string;
}

export interface ParsedCategory {
  name: string;
  weight: number;
  score: number;
  points: string;
}

export function parseGradebook(gradebook: any, studentInfo: any = null): ParsedGradebook {
  const courses: ParsedCourse[] = [];
  
  try {
    const rawCourses = gradebook?.Courses?.Course || [];
    const courseList = Array.isArray(rawCourses) ? rawCourses : [rawCourses];
    
    for (let i = 0; i < courseList.length; i++) {
      const course = courseList[i];
      
      let gradeValue: number | null = null;
      let letterGrade = "N/A";
      
      const marks = course?.Marks?.Mark;
      if (marks && marks.length > 0) {
        const mark = marks[0];
        if (mark._CalculatedScoreRaw) {
          gradeValue = parseFloat(mark._CalculatedScoreRaw);
        }
        if (mark._CalculatedScoreString) {
          letterGrade = mark._CalculatedScoreString;
        }
        
        if (gradeValue === null && mark._ScoreRaw) {
          gradeValue = parseFloat(mark._ScoreRaw);
        }
        if (letterGrade === "N/A" && mark._ScoreString) {
          letterGrade = mark._ScoreString;
        }
      }
      
      const assignments: ParsedAssignment[] = [];
      const rawAssignments = marks?.[0]?.Assignments?.Assignment || [];
      const assignmentList = Array.isArray(rawAssignments) ? rawAssignments : [rawAssignments];
      
      for (const assignment of assignmentList) {
        if (!assignment) continue;
        
        // Extract points earned/possible from multiple possible sources
        let pointsEarned: number | null = null;
        let pointsPossible: number | null = null;
        
        // Try Point/PointPossible fields first (from GitHub code structure)
        if (assignment.Point !== undefined || assignment._Point !== undefined) {
          pointsEarned = parseFloat(assignment.Point || assignment._Point) || null;
        }
        if (assignment.PointPossible !== undefined || assignment._PointPossible !== undefined) {
          pointsPossible = parseFloat(assignment.PointPossible || assignment._PointPossible) || null;
        }
        
        // Fallback: parse from _Points string like "8/10" or "8 / 10"
        const pointsStr = assignment._Points || "";
        if ((pointsEarned === null || pointsPossible === null) && pointsStr.includes("/")) {
          const parts = pointsStr.split("/").map((p: string) => p.trim());
          if (parts.length === 2) {
            if (pointsEarned === null) {
              pointsEarned = parseFloat(parts[0]) || null;
            }
            if (pointsPossible === null) {
              pointsPossible = parseFloat(parts[1]) || null;
            }
          }
        }
        
        assignments.push({
          name: assignment._Measure || assignment.Measure || "Untitled Assignment",
          type: assignment._Type || assignment.Type || "Assignment",
          date: assignment._Date || assignment.Date || "",
          dueDate: assignment._DueDate || assignment.DueDate || "",
          score: assignment._Score || assignment.Score || "Not Graded",
          scoreType: assignment._ScoreType || assignment.ScoreType || "",
          points: pointsStr,
          pointsEarned,
          pointsPossible,
          notes: assignment._Notes || assignment.Notes || "",
          description: assignment._Description || assignment.Description || "",
        });
      }
      
      const categories: ParsedCategory[] = [];
      const rawCategories = marks?.[0]?.GradeCalculationSummary?.AssignmentGradeCalc || [];
      const categoryList = Array.isArray(rawCategories) ? rawCategories : [rawCategories];
      
      for (const cat of categoryList) {
        if (!cat) continue;
        categories.push({
          name: cat._Type || "Category",
          weight: parseFloat(cat._Weight) || 0,
          score: parseFloat(cat._CalculatedMark) || 0,
          points: cat._Points ? `${cat._PointsEarned || 0}/${cat._PointsPossible || 0}` : "",
        });
      }
      
      courses.push({
        id: `course-${i}`,
        name: course._Title || "Unknown Course",
        period: parseInt(course._Period) || i + 1,
        teacher: course._Staff || "Unknown Teacher",
        room: course._Room || "",
        grade: gradeValue,
        letterGrade: letterGrade,
        assignments: assignments,
        categories: categories,
      });
    }
  } catch (parseError) {
    console.error("Error parsing gradebook:", parseError);
  }

  let reportingPeriod = {
    name: "Current Term",
    startDate: "",
    endDate: "",
  };
  
  try {
    const rp = gradebook?.ReportingPeriod;
    if (rp) {
      reportingPeriod = {
        name: rp._GradePeriod || "Current Term",
        startDate: rp._StartDate || "",
        endDate: rp._EndDate || "",
      };
    }
  } catch (e) {
    console.error("Error parsing reporting period:", e);
  }

  let parsedStudentInfo = null;
  if (studentInfo) {
    try {
      parsedStudentInfo = {
        name: studentInfo._FormattedName || studentInfo.FormattedName || "",
        grade: studentInfo._Grade || studentInfo.Grade || "",
        school: studentInfo._CurrentSchool || studentInfo.CurrentSchool || "",
        studentId: studentInfo._PermID || studentInfo.PermID || "",
        email: studentInfo._EMail || studentInfo.EMail || "",
        phone: studentInfo._Phone || studentInfo.Phone || "",
        address: studentInfo._Address || studentInfo.Address || "",
        birthDate: studentInfo._BirthDate || studentInfo.BirthDate || "",
        counselor: studentInfo._CounselorName || studentInfo.CounselorName || "",
        photo: studentInfo._Photo || studentInfo.Photo || studentInfo.Base64Photo || "",
      };
    } catch (e) {
      console.error("Error parsing student info:", e);
    }
  }

  return {
    courses,
    reportingPeriod,
    reportingPeriods: gradebook?.ReportingPeriods?.ReportPeriod || [],
    studentInfo: parsedStudentInfo,
  };
}
