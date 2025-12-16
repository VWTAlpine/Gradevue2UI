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
        assignments.push({
          name: assignment._Measure || "Untitled Assignment",
          type: assignment._Type || "Assignment",
          date: assignment._Date || "",
          dueDate: assignment._DueDate || "",
          score: assignment._Score || "Not Graded",
          scoreType: assignment._ScoreType || "",
          points: assignment._Points || "",
          notes: assignment._Notes || "",
          description: assignment._Description || "",
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
