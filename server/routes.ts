import type { Express } from "express";
import { createServer, type Server } from "http";
import StudentVue from "studentvue"; // studentvue npm package by Joseph Marbella — https://github.com/StudentVue/studentvue.js
import rateLimit from "express-rate-limit";

const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login attempts. Please wait a minute before trying again." },
});

const gradebookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many gradebook requests. Please wait a moment before trying again." },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Helper function to normalize StudentVue district URLs
  // The studentvue npm package expects the base URL (e.g., https://studentvue.district.org)
  // and will automatically append /Service/PXPCommunication.asmx
  function normalizeDistrictUrl(input: string): string {
    let url = input.trim();
    
    // Remove trailing slashes
    url = url.replace(/\/+$/, '');
    
    // Add https if no protocol
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    
    // Parse and extract just protocol + host (the library adds its own endpoints)
    try {
      const parsed = new URL(url);
      // Return just the base URL - library will add correct service path
      return `${parsed.protocol}//${parsed.host}`;
    } catch {
      // If URL parsing fails, return as-is with https
      return url;
    }
  }

  // Generate alternative URL formats to try for a district
  // The StudentVue library expects the base URL, but some districts have non-standard configurations
  function getDistrictUrlVariants(baseUrl: string): string[] {
    const variants: string[] = [];
    
    try {
      const parsed = new URL(baseUrl);
      const base = `${parsed.protocol}//${parsed.host}`;
      
      // Primary: Just the base URL (library appends /Service/PXPCommunication.asmx)
      variants.push(base);
      
      // Some districts use specific paths that the library might need
      // These are less common but worth trying
      const host = parsed.host.toLowerCase();
      
      // If there's already a path in the URL, try that exact URL
      if (parsed.pathname && parsed.pathname !== '/') {
        variants.push(baseUrl);
      }
      
      // For .com domains that might use subdomains differently
      if (host.includes('.com')) {
        // Some districts require explicit subdomain handling
        const parts = host.split('.');
        if (parts.length >= 3 && parts[0].toLowerCase().includes('student')) {
          // Also try the base domain without studentvue subdomain (rare)
          const baseDomain = parts.slice(1).join('.');
          variants.push(`${parsed.protocol}//${baseDomain}`);
        }
      }
      
    } catch {
      // If parsing fails, just return the original
      variants.push(baseUrl);
    }
    
    // Remove duplicates
    return Array.from(new Set(variants));
  }

  // Attempt login with fallback URL patterns
  async function attemptLogin(
    districtUrl: string, 
    username: string, 
    password: string,
    timeoutMs: number = 30000
  ): Promise<{ client: any; usedUrl: string; error?: string }> {
    const variants = getDistrictUrlVariants(districtUrl);
    let lastError: any = null;
    
    for (const url of variants) {
      try {
        // studentvue npm package by Joseph Marbella — performs the SOAP login handshake
        const client = await Promise.race([
          StudentVue.login(url, {
            username: username.trim(),
            password: password,
          }),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error(`Login timed out after ${timeoutMs/1000} seconds`)), timeoutMs)
          )
        ]);
        
        return { client, usedUrl: url };
      } catch (err: any) {
        lastError = err;
        
        // If it's clearly an auth error (not network/config), don't try other URLs
        const errMsg = err.message?.toLowerCase() || '';
        if (errMsg.includes('password') || errMsg.includes('username') || errMsg.includes('invalid')) {
          break;
        }
      }
    }
    
    return { client: null, usedUrl: districtUrl, error: lastError?.message || 'Unknown error' };
  }

  // StudentVue Login endpoint
  app.post("/api/studentvue/login", loginRateLimiter, async (req, res) => {
    try {
      const { district, username, password } = req.body;

      if (!district || !username || !password) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields: district, username, and password are required" 
        });
      }

      if (typeof district !== "string" || district.length > 500) {
        return res.status(400).json({ success: false, error: "Invalid district URL" });
      }
      if (typeof username !== "string" || username.length > 100) {
        return res.status(400).json({ success: false, error: "Invalid username" });
      }
      if (typeof password !== "string" || password.length > 500) {
        return res.status(400).json({ success: false, error: "Invalid password" });
      }

      // Normalize the district URL for compatibility
      const districtUrl = normalizeDistrictUrl(district);

      // Timeout wrapper for StudentVue operations
      const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs/1000} seconds`)), timeoutMs)
          )
        ]);
      };

      try {
        // Attempt login with fallback URL patterns
        const loginResult = await attemptLogin(districtUrl, username, password, 30000);
        
        if (!loginResult.client) {
          // Enhanced error handling with detailed messages
          const errorMsg = loginResult.error?.toLowerCase() || '';
          
          // Check for specific error patterns
          if (errorMsg.includes('invalid') || errorMsg.includes('incorrect') || errorMsg.includes('password') || errorMsg.includes('username') || errorMsg.includes('user name')) {
            return res.status(401).json({ 
              success: false, 
              error: "Invalid username or password. Please double-check your credentials and try again. Make sure there are no extra spaces."
            });
          }
          
          if (errorMsg.includes('network') || errorMsg.includes('enotfound') || errorMsg.includes('econnrefused') || errorMsg.includes('econnreset') || errorMsg.includes('getaddrinfo')) {
            return res.status(400).json({ 
              success: false, 
              error: "Could not connect to the district server. Please check your district URL and try again."
            });
          }
          
          if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
            return res.status(504).json({ 
              success: false, 
              error: "Connection timed out. The district server may be slow or unavailable. Please try again."
            });
          }
          
          if (errorMsg.includes('certificate') || errorMsg.includes('ssl') || errorMsg.includes('tls')) {
            return res.status(400).json({ 
              success: false, 
              error: "SSL/TLS certificate error. The district server may have security configuration issues."
            });
          }
          
          // Handle StudentVue-specific critical errors (error codes like 4D5DE)
          if (errorMsg.includes('critical error') || /\([a-f0-9]{5}\)/i.test(loginResult.error || '')) {
            return res.status(401).json({ 
              success: false, 
              error: "StudentVue returned an error. Please verify your username and password are correct. If the problem persists, try logging into StudentVue directly to check if your account is locked or if there are maintenance issues."
            });
          }
          
          // Generic error
          return res.status(401).json({ 
            success: false, 
            error: "Login failed. Please check your credentials and district URL, then try again."
          });
        }

        const client = loginResult.client;

        // Fetch gradebook and student info in parallel with timeout (via studentvue package by Joseph Marbella)
        const [gradebook, studentInfo] = await Promise.all([
          withTimeout(client.gradebook(), 20000, "Gradebook fetch").catch((e: any) => {
            console.error("Gradebook fetch error:", e.message);
            return null;
          }),
          withTimeout(client.studentInfo(), 20000, "Student info fetch").catch((e: any) => {
            console.error("Student info fetch error:", e.message);
            return null;
          }),
        ]);
        
        if (!gradebook) {
          return res.status(500).json({
            success: false,
            error: "Successfully logged in but could not fetch gradebook data. This may be a temporary issue - please try again."
          });
        }

        // Parse the gradebook data into our schema format
        const parsedGradebook = parseGradebook(gradebook, studentInfo);
        
        console.log(`Fetched ${parsedGradebook.courses?.length || 0} courses`);
        
        return res.json({ 
          success: true, 
          data: parsedGradebook 
        });
      } catch (loginError: any) {
        console.error("StudentVue login error:", loginError.message);
        return res.status(401).json({ 
          success: false, 
          error: "Login failed. Please check your credentials and district URL."
        });
      }
    } catch (err: any) {
      console.error("Server error:", err);
      return res.status(500).json({ 
        success: false, 
        error: "An unexpected error occurred. Please try again."
      });
    }
  });

  app.post("/api/studentvue/gradebook", gradebookRateLimiter, async (req, res) => {
    try {
      const { district, username, password, reportingPeriodIndex } = req.body;

      if (!district || !username || !password) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: district, username, and password are required"
        });
      }

      if (typeof district !== "string" || district.length > 500) {
        return res.status(400).json({ success: false, error: "Invalid district URL" });
      }
      if (typeof username !== "string" || username.length > 100) {
        return res.status(400).json({ success: false, error: "Invalid username" });
      }
      if (typeof password !== "string" || password.length > 500) {
        return res.status(400).json({ success: false, error: "Invalid password" });
      }

      const districtUrl = normalizeDistrictUrl(district);

      try {
        const loginResult = await attemptLogin(districtUrl, username, password, 30000);

        if (!loginResult.client) {
          return res.status(401).json({
            success: false,
            error: "Login failed. Please check your credentials."
          });
        }

        const client = loginResult.client;

        const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
          return Promise.race([
            promise,
            new Promise<T>((_, reject) =>
              setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs/1000} seconds`)), timeoutMs)
            )
          ]);
        };

        const periodIndex = typeof reportingPeriodIndex === "number" ? reportingPeriodIndex : 0;

        // Fetch period-specific gradebook via studentvue package by Joseph Marbella
        const gradebook = await withTimeout(
          client.gradebook(periodIndex),
          20000,
          "Gradebook fetch"
        ).catch((e: any) => {
          console.error("Gradebook fetch error:", e.message);
          return null;
        });

        if (!gradebook) {
          return res.status(500).json({
            success: false,
            error: "Could not fetch gradebook data for the selected reporting period."
          });
        }

        const parsedGradebook = parseGradebook(gradebook, null);

        return res.json({
          success: true,
          data: parsedGradebook
        });
      } catch (loginError: any) {
        console.error("Gradebook fetch error:", loginError.message);
        return res.status(401).json({
          success: false,
          error: "Failed to fetch gradebook."
        });
      }
    } catch (err: any) {
      console.error("Server error:", err);
      return res.status(500).json({
        success: false,
        error: "An unexpected error occurred."
      });
    }
  });

  // Demo data endpoint
  app.get("/api/studentvue/demo", (req, res) => {
    const periodIndex = parseInt((req.query.period as string) || "0") || 0;
    const demoData = generateDemoData(periodIndex);
    return res.json({ 
      success: true, 
      data: demoData 
    });
  });

  // Attendance endpoint
  app.post("/api/studentvue/attendance", async (req, res) => {
    try {
      const { district, username, password } = req.body;

      if (!district || !username || !password) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required credentials" 
        });
      }

      const districtUrl = normalizeDistrictUrl(district);
      const loginResult = await attemptLogin(districtUrl, username, password, 30000);
      
      if (!loginResult.client) {
        return res.status(401).json({ 
          success: false, 
          error: "Authentication failed" 
        });
      }

      try {
        const attendance = await loginResult.client.attendance(); // studentvue package by Joseph Marbella
        const records: any[] = [];
        let totalAbsences = 0;
        let totalTardies = 0;
        let totalExcused = 0;
        let totalUnexcused = 0;

        const absences = attendance?.absences || [];
        for (const absence of absences) {
          const reason = absence.reason || "";
          const reasonLower = reason.toLowerCase();
          const description = absence.description || absence.reasonDescription || reason || "";
          
          // Determine status based on reason using attendance code logic
          let status = "Absent";
          if (reasonLower.includes("tdy") || reasonLower.includes("tardy") || 
              reasonLower === "t" || reasonLower.includes("late") ||
              reasonLower.includes("clstdy")) {
            status = "Tardy";
            totalTardies++;
          } else if (reasonLower.includes("exc") || reasonLower === "e" ||
                     reasonLower.includes("field") || reasonLower.includes("doctor") ||
                     reasonLower.includes("illness") || reasonLower.includes("medical")) {
            status = "Excused";
            totalExcused++;
            totalAbsences++;
          } else {
            totalAbsences++;
            totalUnexcused++;
          }
          
          // Handle multiple periods
          const periods = absence.periods || [0];
          for (const period of periods) {
            records.push({
              date: absence.date || "",
              period: period,
              course: absence.note || "",
              status: reason || status,
              reason: reason,
              description: description,
            });
          }
        }

        return res.json({
          success: true,
          data: {
            totalAbsences,
            totalTardies,
            totalExcused,
            totalUnexcused,
            records,
          },
        });
      } catch (fetchErr: any) {
        console.error("Attendance fetch error:", fetchErr);
        return res.json({
          success: true,
          data: {
            totalAbsences: 0,
            totalTardies: 0,
            totalExcused: 0,
            totalUnexcused: 0,
            records: [],
          },
        });
      }
    } catch (err: any) {
      console.error("Attendance endpoint error:", err);
      return res.status(500).json({ 
        success: false, 
        error: "An unexpected error occurred fetching attendance."
      });
    }
  });

  // Documents endpoint
  app.post("/api/studentvue/documents", async (req, res) => {
    try {
      const { district, username, password } = req.body;

      if (!district || !username || !password) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required credentials" 
        });
      }

      const districtUrl = normalizeDistrictUrl(district);
      const loginResult = await attemptLogin(districtUrl, username, password, 30000);
      
      if (!loginResult.client) {
        return res.status(401).json({ 
          success: false, 
          error: "Authentication failed" 
        });
      }

      try {
        const documentsData = await loginResult.client.documents(); // studentvue package by Joseph Marbella
        const documents: any[] = [];

        const docList = documentsData || [];
        for (const doc of docList) {
          // The studentvue npm package returns document objects with a document property
          const docObj = doc.document || doc;
          
          // comment/name contains the actual title
          const docName = 
            docObj.comment || docObj.name ||
            docObj.title || docObj.fileName ||
            "Unknown Document";
          
          const docDate = docObj.date || "";
          
          const docType = docObj.type || docObj.category || "Document";
          
          // Get the document file GU for downloading
          const docGU = docObj.file?.documentGU || docObj.documentGU || "";
          
          documents.push({
            name: docName,
            date: docDate,
            type: docType,
            documentGU: docGU,
          });
        }

        return res.json({
          success: true,
          data: {
            documents,
          },
        });
      } catch (fetchErr: any) {
        console.error("Documents fetch error:", fetchErr);
        return res.json({
          success: true,
          data: {
            documents: [],
          },
        });
      }
    } catch (err: any) {
      console.error("Documents endpoint error:", err);
      return res.status(500).json({ 
        success: false, 
        error: "An unexpected error occurred fetching documents."
      });
    }
  });

  // Messages endpoint
  app.post("/api/studentvue/messages", async (req, res) => {
    try {
      const { district, username, password } = req.body;

      if (!district || !username || !password) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required credentials" 
        });
      }

      const districtUrl = normalizeDistrictUrl(district);
      const loginResult = await attemptLogin(districtUrl, username, password, 30000);
      
      if (!loginResult.client) {
        return res.status(401).json({ 
          success: false, 
          error: "Authentication failed" 
        });
      }

      try {
        const messagesData = await loginResult.client.messages(); // studentvue package by Joseph Marbella
        const messages: any[] = [];

        const msgList = messagesData || [];
        for (const msg of msgList) {
          const msgObj = msg.message || msg;
          
          messages.push({
            id: msgObj.id || msgObj.iconURL || "",
            type: msgObj.type || "Message",
            subject: msgObj.subject || "No Subject",
            from: msgObj.from || "Unknown",
            date: msgObj.beginDate || msgObj.date || "",
            content: msgObj.htmlContent || msgObj.content || "",
            read: msgObj.read === true || msgObj.read === "true",
          });
        }

        return res.json({
          success: true,
          data: {
            messages,
          },
        });
      } catch (fetchErr: any) {
        console.error("Messages fetch error:", fetchErr);
        return res.json({
          success: true,
          data: {
            messages: [],
          },
        });
      }
    } catch (err: any) {
      console.error("Messages endpoint error:", err);
      return res.status(500).json({ 
        success: false, 
        error: "An unexpected error occurred fetching messages."
      });
    }
  });

  // Document download endpoint - returns base64 PDF
  app.post("/api/studentvue/document/:documentGU", async (req, res) => {
    try {
      const { district, username, password } = req.body;
      const { documentGU } = req.params;

      if (!district || !username || !password || !documentGU) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required parameters" 
        });
      }

      const guidPattern = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;
      if (!guidPattern.test(documentGU)) {
        return res.status(400).json({ success: false, error: "Invalid document identifier" });
      }

      const districtUrl = normalizeDistrictUrl(district);
      const loginResult = await attemptLogin(districtUrl, username, password, 30000);
      
      if (!loginResult.client) {
        return res.status(401).json({ 
          success: false, 
          error: "Authentication failed" 
        });
      }

      try {
        const docContent = await loginResult.client.getDocumentContent(documentGU);
        
        if (docContent && docContent.base64Code) {
          // Return as data URL for direct viewing/download
          return res.json({
            success: true,
            data: {
              base64: docContent.base64Code,
              fileName: docContent.fileName || "document.pdf",
              docType: docContent.docType || "PDF",
            },
          });
        }
        
        return res.status(404).json({
          success: false,
          error: "Document not found",
        });
      } catch (fetchErr: any) {
        console.error("Document download error:", fetchErr);
        return res.status(500).json({
          success: false,
          error: "Failed to download document",
        });
      }
    } catch (err: any) {
      console.error("Document download endpoint error:", err);
      return res.status(500).json({ 
        success: false, 
        error: "An unexpected error occurred downloading the document."
      });
    }
  });

  return httpServer;
}

// Parse StudentVue gradebook response into our schema format
function parseGradebook(gradebook: any, studentInfo: any = null) {
  const courses: any[] = [];
  
  try {
    const rawCourses = gradebook.courses || [];
    
    for (let i = 0; i < rawCourses.length; i++) {
      const course = rawCourses[i];
      
      // Parse grade percentage
      let gradeValue: number | null = null;
      let letterGrade = "N/A";
      
      if (course.marks && course.marks.length > 0) {
        const mark = course.marks[0];
        if (mark.calculatedScore?.raw !== undefined) {
          gradeValue = parseFloat(mark.calculatedScore.raw);
        }
        if (mark.calculatedScore?.string) {
          letterGrade = mark.calculatedScore.string;
        }
      }
      
      // Parse assignments
      const assignments: any[] = [];
      if (course.marks && course.marks[0]?.assignments) {
        for (const assignment of course.marks[0].assignments) {
          assignments.push({
            name: assignment.name || "Untitled Assignment",
            type: assignment.type || "Assignment",
            date: assignment.date?.start || "",
            dueDate: assignment.date?.due || "",
            score: assignment.score?.value || "Not Graded",
            scoreType: assignment.score?.type || "",
            points: assignment.points || "",
            notes: assignment.notes || "",
            description: assignment.description || "",
          });
        }
      }
      
      // Parse categories/weights
      const categories: any[] = [];
      if (course.marks && course.marks[0]?.weightedCategories) {
        for (const cat of course.marks[0].weightedCategories) {
          categories.push({
            name: cat.type || "Category",
            weight: parseFloat(cat.weight?.standard) || 0,
            score: parseFloat(cat.points?.current) || 0,
            points: cat.points ? `${cat.points.current}/${cat.points.possible}` : "",
          });
        }
      }
      
      courses.push({
        id: `course-${i}`,
        name: course.title || "Unknown Course",
        period: course.period || i + 1,
        teacher: course.staff?.name || "Unknown Teacher",
        room: course.room || "",
        grade: gradeValue,
        letterGrade: letterGrade,
        assignments: assignments,
        categories: categories,
      });
    }
  } catch (parseError) {
    console.error("Error parsing gradebook:", parseError);
  }

  // Parse reporting period
  let reportingPeriod = {
    name: "Current Term",
    startDate: "",
    endDate: "",
  };
  
  try {
    if (gradebook.reportingPeriod) {
      reportingPeriod = {
        name: gradebook.reportingPeriod.name || "Current Term",
        startDate: gradebook.reportingPeriod.date?.start || "",
        endDate: gradebook.reportingPeriod.date?.end || "",
      };
    }
  } catch (e) {
    // Use defaults
  }

  // Parse student info
  let parsedStudentInfo = null;
  if (studentInfo) {
    try {
      parsedStudentInfo = {
        name: studentInfo.student?.name || studentInfo.formattedName || "Student",
        studentId: studentInfo.student?.id || studentInfo.permId || "",
        grade: studentInfo.grade || studentInfo.currentGradeLevel || "",
        school: studentInfo.currentSchool || "",
        email: studentInfo.email || "",
        phone: studentInfo.phone || "",
        address: studentInfo.address || "",
        birthDate: studentInfo.birthDate || "",
        counselor: studentInfo.counselor?.name || "",
        photo: studentInfo.photo || studentInfo.base64Photo || "",
      };
    } catch (e) {
      console.error("Error parsing student info:", e);
    }
  }

  return {
    courses,
    reportingPeriod,
    reportingPeriods: gradebook.reportingPeriods || [],
    studentInfo: parsedStudentInfo,
  };
}

// Deterministic per-course grade offset for alternate reporting periods.
// offsets[periodIndex][courseIndex] — applied as an additive shift to base grades.
const PERIOD_GRADE_OFFSETS: number[][] = [
  [0,    0,    0,    0,    0,    0,    0   ], // period 0 (Fall)   — baseline
  [-3.8, +2.1, +4.5, -1.2, +1.7, -2.3, 0  ], // period 1 (Spring) — earlier term, slightly different
];

function clampGrade(g: number) { return Math.min(100, Math.max(0, Math.round(g * 10) / 10)); }
function letterFromGrade(g: number) {
  if (g >= 97) return "A+"; if (g >= 93) return "A"; if (g >= 90) return "A-";
  if (g >= 87) return "B+"; if (g >= 83) return "B"; if (g >= 80) return "B-";
  if (g >= 77) return "C+"; if (g >= 73) return "C"; if (g >= 70) return "C-";
  if (g >= 67) return "D+"; if (g >= 63) return "D"; if (g >= 60) return "D-";
  return "F";
}

// Generate realistic demo data, optionally shifted for a different reporting period
function generateDemoData(periodIndex: number = 0) {
  const offsets = PERIOD_GRADE_OFFSETS[periodIndex] || PERIOD_GRADE_OFFSETS[0];

  const periodMeta = periodIndex === 1
    ? { name: "Spring Semester 2024", startDate: "Jan 8, 2024", endDate: "May 24, 2024" }
    : { name: "Fall Semester 2024",   startDate: "Aug 26, 2024", endDate: "Dec 20, 2024" };

  const baseGrades = [92.5, 88.3, 85.7, 94.2, 91.8, 87.4];
  const shiftedGrades = baseGrades.map((g, i) => clampGrade(g + (offsets[i] ?? 0)));

  const courses = [
    {
      id: "course-0",
      name: "AP Calculus BC",
      period: 1,
      teacher: "Ms. Rodriguez",
      room: "201",
      grade: shiftedGrades[0],
      letterGrade: letterFromGrade(shiftedGrades[0]),
      assignments: periodIndex === 1 ? [
        { name: "Limits & Continuity Quiz", type: "Quizzes", date: "Feb 14, 2024", dueDate: "Feb 14, 2024", score: "27 out of 30", points: "27/30", notes: "" },
        { name: "Derivatives Test", type: "Tests", date: "Mar 5, 2024", dueDate: "Mar 5, 2024", score: "86 out of 100", points: "86/100", notes: "" },
        { name: "Homework Set 5", type: "Homework", date: "Mar 12, 2024", dueDate: "Mar 15, 2024", score: "20 out of 20", points: "20/20", notes: "" },
      ] : [
        { name: "Unit 5 Test - Integration", type: "Tests", date: "Nov 29, 2024", dueDate: "Dec 6, 2024", score: "95 out of 100", points: "95/100", notes: "" },
        { name: "Quiz: Derivatives", type: "Quizzes", date: "Nov 26, 2024", dueDate: "Nov 30, 2024", score: "28 out of 30", points: "28/30", notes: "" },
        { name: "Homework Set 12", type: "Homework", date: "Dec 3, 2024", dueDate: "Dec 7, 2024", score: "19 out of 20", points: "19/20", notes: "" },
        { name: "Unit 6 Test - Applications", type: "Tests", date: "Dec 10, 2024", dueDate: "Dec 15, 2024", score: "Not Graded", points: "0/100", notes: "" },
      ],
      categories: [
        { name: "Tests", weight: 40, score: clampGrade(90 + (offsets[0] ?? 0)), points: "360/400" },
        { name: "Quizzes", weight: 30, score: clampGrade(90 + (offsets[0] ?? 0)), points: "270/300" },
        { name: "Homework", weight: 20, score: 95, points: "190/200" },
        { name: "Participation", weight: 10, score: 100, points: "100/100" },
      ],
    },
    {
      id: "course-1",
      name: "AP English Literature",
      period: 2,
      teacher: "Mr. Thompson",
      room: "105",
      grade: shiftedGrades[1],
      letterGrade: letterFromGrade(shiftedGrades[1]),
      assignments: periodIndex === 1 ? [
        { name: "Great Gatsby Essay", type: "Essays", date: "Feb 20, 2024", dueDate: "Feb 27, 2024", score: "90 out of 100", points: "90/100", notes: "Strong thesis" },
        { name: "Reading Quiz - Ch. 5", type: "Reading Quizzes", date: "Mar 1, 2024", dueDate: "Mar 1, 2024", score: "91 out of 100", points: "91/100", notes: "" },
      ] : [
        { name: "Hamlet Essay", type: "Essays", date: "Nov 20, 2024", dueDate: "Dec 4, 2024", score: "85 out of 100", points: "85/100", notes: "Good analysis, improve thesis" },
        { name: "Reading Quiz - Act III", type: "Reading Quizzes", date: "Nov 25, 2024", dueDate: "Nov 25, 2024", score: "88 out of 100", points: "88/100", notes: "" },
        { name: "Poetry Analysis", type: "Essays", date: "Dec 1, 2024", dueDate: "Dec 8, 2024", score: "92 out of 100", points: "92/100", notes: "" },
      ],
      categories: [
        { name: "Essays", weight: 50, score: clampGrade(88 + (offsets[1] ?? 0)), points: "440/500" },
        { name: "Reading Quizzes", weight: 25, score: 88, points: "220/250" },
        { name: "Participation", weight: 25, score: 92, points: "230/250" },
      ],
    },
    {
      id: "course-2",
      name: "AP Chemistry",
      period: 3,
      teacher: "Dr. Patel",
      room: "302",
      grade: shiftedGrades[2],
      letterGrade: letterFromGrade(shiftedGrades[2]),
      assignments: periodIndex === 1 ? [
        { name: "Lab Report: Acid-Base", type: "Labs", date: "Feb 15, 2024", dueDate: "Feb 22, 2024", score: "94 out of 100", points: "94/100", notes: "" },
        { name: "Chapter 3 Test", type: "Tests", date: "Mar 8, 2024", dueDate: "Mar 8, 2024", score: "88 out of 100", points: "88/100", notes: "" },
      ] : [
        { name: "Lab Report: Titration", type: "Labs", date: "Nov 22, 2024", dueDate: "Nov 29, 2024", score: "91 out of 100", points: "91/100", notes: "" },
        { name: "Chapter 8 Test", type: "Tests", date: "Dec 2, 2024", dueDate: "Dec 2, 2024", score: "82 out of 100", points: "82/100", notes: "" },
        { name: "Homework 14", type: "Homework", date: "Dec 5, 2024", dueDate: "Dec 9, 2024", score: "18 out of 20", points: "18/20", notes: "" },
      ],
      categories: [
        { name: "Tests", weight: 45, score: clampGrade(85 + (offsets[2] ?? 0)), points: "382/450" },
        { name: "Labs", weight: 35, score: clampGrade(91 + (offsets[2] ?? 0)), points: "318/350" },
        { name: "Homework", weight: 20, score: 82, points: "164/200" },
      ],
    },
    {
      id: "course-3",
      name: "US History",
      period: 4,
      teacher: "Mrs. Johnson",
      room: "210",
      grade: shiftedGrades[3],
      letterGrade: letterFromGrade(shiftedGrades[3]),
      assignments: periodIndex === 1 ? [
        { name: "Reconstruction Essay", type: "Essays", date: "Mar 3, 2024", dueDate: "Mar 10, 2024", score: "93 out of 100", points: "93/100", notes: "" },
        { name: "Chapter 7 Test", type: "Tests", date: "Mar 18, 2024", dueDate: "Mar 18, 2024", score: "92 out of 100", points: "92/100", notes: "" },
      ] : [
        { name: "Civil War Essay", type: "Essays", date: "Nov 15, 2024", dueDate: "Nov 22, 2024", score: "96 out of 100", points: "96/100", notes: "Excellent research" },
        { name: "Chapter 12 Test", type: "Tests", date: "Dec 1, 2024", dueDate: "Dec 1, 2024", score: "93 out of 100", points: "93/100", notes: "" },
        { name: "Document Analysis", type: "Projects", date: "Dec 8, 2024", dueDate: "Dec 15, 2024", score: "Not Graded", points: "0/50", notes: "" },
      ],
      categories: [
        { name: "Tests", weight: 40, score: clampGrade(93 + (offsets[3] ?? 0)), points: "372/400" },
        { name: "Essays", weight: 30, score: clampGrade(96 + (offsets[3] ?? 0)), points: "288/300" },
        { name: "Projects", weight: 20, score: 92, points: "184/200" },
        { name: "Participation", weight: 10, score: 98, points: "98/100" },
      ],
    },
    {
      id: "course-4",
      name: "Spanish III",
      period: 5,
      teacher: "Sra. Martinez",
      room: "115",
      grade: shiftedGrades[4],
      letterGrade: letterFromGrade(shiftedGrades[4]),
      assignments: periodIndex === 1 ? [
        { name: "Oral Presentation 1", type: "Speaking", date: "Feb 22, 2024", dueDate: "Feb 22, 2024", score: "90 out of 100", points: "90/100", notes: "" },
        { name: "Writing Assignment 2", type: "Writing", date: "Mar 7, 2024", dueDate: "Mar 11, 2024", score: "93 out of 100", points: "93/100", notes: "" },
      ] : [
        { name: "Oral Presentation", type: "Speaking", date: "Nov 28, 2024", dueDate: "Nov 28, 2024", score: "95 out of 100", points: "95/100", notes: "Great pronunciation!" },
        { name: "Writing Assignment 5", type: "Writing", date: "Dec 3, 2024", dueDate: "Dec 6, 2024", score: "88 out of 100", points: "88/100", notes: "" },
        { name: "Vocabulary Quiz Ch. 7", type: "Quizzes", date: "Dec 9, 2024", dueDate: "Dec 9, 2024", score: "18 out of 20", points: "18/20", notes: "" },
      ],
      categories: [
        { name: "Speaking", weight: 30, score: clampGrade(94 + (offsets[4] ?? 0)), points: "282/300" },
        { name: "Writing", weight: 30, score: clampGrade(90 + (offsets[4] ?? 0)), points: "270/300" },
        { name: "Quizzes", weight: 25, score: 91, points: "227/250" },
        { name: "Participation", weight: 15, score: 95, points: "142/150" },
      ],
    },
    {
      id: "course-5",
      name: "Physics",
      period: 6,
      teacher: "Mr. Wilson",
      room: "305",
      grade: shiftedGrades[5],
      letterGrade: letterFromGrade(shiftedGrades[5]),
      assignments: periodIndex === 1 ? [
        { name: "Lab: Forces & Motion", type: "Labs", date: "Feb 19, 2024", dueDate: "Feb 26, 2024", score: "82 out of 100", points: "82/100", notes: "" },
        { name: "Problem Set 4", type: "Homework", date: "Mar 4, 2024", dueDate: "Mar 8, 2024", score: "83 out of 100", points: "83/100", notes: "" },
      ] : [
        { name: "Lab: Projectile Motion", type: "Labs", date: "Nov 20, 2024", dueDate: "Nov 27, 2024", score: "88 out of 100", points: "88/100", notes: "" },
        { name: "Problem Set 10", type: "Homework", date: "Dec 2, 2024", dueDate: "Dec 6, 2024", score: "85 out of 100", points: "85/100", notes: "" },
        { name: "Unit 4 Test", type: "Tests", date: "Dec 10, 2024", dueDate: "Dec 10, 2024", score: "Not Graded", points: "0/100", notes: "" },
      ],
      categories: [
        { name: "Tests", weight: 40, score: clampGrade(86 + (offsets[5] ?? 0)), points: "344/400" },
        { name: "Labs", weight: 35, score: clampGrade(89 + (offsets[5] ?? 0)), points: "311/350" },
        { name: "Homework", weight: 25, score: 87, points: "217/250" },
      ],
    },
    {
      id: "course-6",
      name: "Study Hall",
      period: 7,
      teacher: "Mr. Clark",
      room: "100",
      grade: 0,
      letterGrade: "N/A",
      assignments: [
        { name: "Attendance Check", type: "Participation", date: periodIndex === 1 ? "Mar 1, 2024" : "Dec 1, 2024", dueDate: periodIndex === 1 ? "Mar 1, 2024" : "Dec 1, 2024", score: "Not Graded", points: "", notes: "" },
      ],
      categories: [],
    },
  ];

  return {
    courses,
    reportingPeriod: periodMeta,
    reportingPeriods: [
      { name: "Fall Semester 2024", startDate: "Aug 26, 2024", endDate: "Dec 20, 2024" },
      { name: "Spring Semester 2024", startDate: "Jan 8, 2024", endDate: "May 24, 2024" },
    ],
    studentInfo: {
      name: "Alex Johnson",
      studentId: "123456",
      grade: "11",
      school: "Westview High School",
      email: "alex.johnson@student.westview.edu",
      phone: "(555) 123-4567",
      counselor: "Ms. Williams",
    },
  };
}
