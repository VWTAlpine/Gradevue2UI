import type { Express } from "express";
import { createServer, type Server } from "http";
import StudentVue from "studentvue";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // StudentVue Login endpoint
  app.post("/api/studentvue/login", async (req, res) => {
    try {
      const { district, username, password } = req.body;

      if (!district || !username || !password) {
        return res.status(400).json({ 
          success: false, 
          error: "Missing required fields: district, username, and password are required" 
        });
      }

      // Clean up the district URL
      let districtUrl = district.trim();
      if (!districtUrl.startsWith("http://") && !districtUrl.startsWith("https://")) {
        districtUrl = "https://" + districtUrl;
      }

      try {
        const client = await StudentVue.login(districtUrl, {
          username: username.trim(),
          password: password,
        });

        const gradebook = await client.gradebook();
        
        // Parse the gradebook data into our schema format
        const parsedGradebook = parseGradebook(gradebook);
        
        return res.json({ 
          success: true, 
          data: parsedGradebook 
        });
      } catch (loginError: any) {
        console.error("StudentVue login error:", loginError.message);
        return res.status(401).json({ 
          success: false, 
          error: "Login failed. Please check your credentials and district URL. Make sure you don't include @domain in your username." 
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

  // Demo data endpoint
  app.get("/api/studentvue/demo", (req, res) => {
    const demoData = generateDemoData();
    return res.json({ 
      success: true, 
      data: demoData 
    });
  });

  return httpServer;
}

// Parse StudentVue gradebook response into our schema format
function parseGradebook(gradebook: any) {
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

  return {
    courses,
    reportingPeriod,
    reportingPeriods: gradebook.reportingPeriods || [],
  };
}

// Generate realistic demo data
function generateDemoData() {
  const courses = [
    {
      id: "course-0",
      name: "AP Calculus BC",
      period: 1,
      teacher: "Ms. Rodriguez",
      room: "201",
      grade: 92.5,
      letterGrade: "A-",
      assignments: [
        {
          name: "Unit 5 Test - Integration",
          type: "Tests",
          date: "Nov 29, 2024",
          dueDate: "Dec 6, 2024",
          score: "95 out of 100",
          points: "95/100",
          notes: "",
        },
        {
          name: "Quiz: Derivatives",
          type: "Quizzes",
          date: "Nov 26, 2024",
          dueDate: "Nov 30, 2024",
          score: "28 out of 30",
          points: "28/30",
          notes: "",
        },
        {
          name: "Homework Set 12",
          type: "Homework",
          date: "Dec 3, 2024",
          dueDate: "Dec 7, 2024",
          score: "19 out of 20",
          points: "19/20",
          notes: "",
        },
        {
          name: "Unit 6 Test - Applications",
          type: "Tests",
          date: "Dec 10, 2024",
          dueDate: "Dec 15, 2024",
          score: "Not Graded",
          points: "0/100",
          notes: "",
        },
      ],
      categories: [
        { name: "Tests", weight: 40, score: 90, points: "360/400" },
        { name: "Quizzes", weight: 30, score: 90, points: "270/300" },
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
      grade: 88.3,
      letterGrade: "B+",
      assignments: [
        {
          name: "Hamlet Essay",
          type: "Essays",
          date: "Nov 20, 2024",
          dueDate: "Dec 4, 2024",
          score: "85 out of 100",
          points: "85/100",
          notes: "Good analysis, improve thesis",
        },
        {
          name: "Reading Quiz - Act III",
          type: "Reading Quizzes",
          date: "Nov 25, 2024",
          dueDate: "Nov 25, 2024",
          score: "88 out of 100",
          points: "88/100",
          notes: "",
        },
        {
          name: "Poetry Analysis",
          type: "Essays",
          date: "Dec 1, 2024",
          dueDate: "Dec 8, 2024",
          score: "92 out of 100",
          points: "92/100",
          notes: "",
        },
      ],
      categories: [
        { name: "Essays", weight: 50, score: 88, points: "440/500" },
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
      grade: 85.7,
      letterGrade: "B",
      assignments: [
        {
          name: "Lab Report: Titration",
          type: "Labs",
          date: "Nov 22, 2024",
          dueDate: "Nov 29, 2024",
          score: "91 out of 100",
          points: "91/100",
          notes: "",
        },
        {
          name: "Chapter 8 Test",
          type: "Tests",
          date: "Dec 2, 2024",
          dueDate: "Dec 2, 2024",
          score: "82 out of 100",
          points: "82/100",
          notes: "",
        },
        {
          name: "Homework 14",
          type: "Homework",
          date: "Dec 5, 2024",
          dueDate: "Dec 9, 2024",
          score: "18 out of 20",
          points: "18/20",
          notes: "",
        },
      ],
      categories: [
        { name: "Tests", weight: 45, score: 85, points: "382/450" },
        { name: "Labs", weight: 35, score: 91, points: "318/350" },
        { name: "Homework", weight: 20, score: 82, points: "164/200" },
      ],
    },
    {
      id: "course-3",
      name: "US History",
      period: 4,
      teacher: "Mrs. Johnson",
      room: "210",
      grade: 94.2,
      letterGrade: "A",
      assignments: [
        {
          name: "Civil War Essay",
          type: "Essays",
          date: "Nov 15, 2024",
          dueDate: "Nov 22, 2024",
          score: "96 out of 100",
          points: "96/100",
          notes: "Excellent research",
        },
        {
          name: "Chapter 12 Test",
          type: "Tests",
          date: "Dec 1, 2024",
          dueDate: "Dec 1, 2024",
          score: "93 out of 100",
          points: "93/100",
          notes: "",
        },
        {
          name: "Document Analysis",
          type: "Projects",
          date: "Dec 8, 2024",
          dueDate: "Dec 15, 2024",
          score: "Not Graded",
          points: "0/50",
          notes: "",
        },
      ],
      categories: [
        { name: "Tests", weight: 40, score: 93, points: "372/400" },
        { name: "Essays", weight: 30, score: 96, points: "288/300" },
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
      grade: 91.8,
      letterGrade: "A-",
      assignments: [
        {
          name: "Oral Presentation",
          type: "Speaking",
          date: "Nov 28, 2024",
          dueDate: "Nov 28, 2024",
          score: "95 out of 100",
          points: "95/100",
          notes: "Great pronunciation!",
        },
        {
          name: "Writing Assignment 5",
          type: "Writing",
          date: "Dec 3, 2024",
          dueDate: "Dec 6, 2024",
          score: "88 out of 100",
          points: "88/100",
          notes: "",
        },
        {
          name: "Vocabulary Quiz Ch. 7",
          type: "Quizzes",
          date: "Dec 9, 2024",
          dueDate: "Dec 9, 2024",
          score: "18 out of 20",
          points: "18/20",
          notes: "",
        },
      ],
      categories: [
        { name: "Speaking", weight: 30, score: 94, points: "282/300" },
        { name: "Writing", weight: 30, score: 90, points: "270/300" },
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
      grade: 87.4,
      letterGrade: "B+",
      assignments: [
        {
          name: "Lab: Projectile Motion",
          type: "Labs",
          date: "Nov 20, 2024",
          dueDate: "Nov 27, 2024",
          score: "88 out of 100",
          points: "88/100",
          notes: "",
        },
        {
          name: "Problem Set 10",
          type: "Homework",
          date: "Dec 2, 2024",
          dueDate: "Dec 6, 2024",
          score: "85 out of 100",
          points: "85/100",
          notes: "",
        },
        {
          name: "Unit 4 Test",
          type: "Tests",
          date: "Dec 10, 2024",
          dueDate: "Dec 10, 2024",
          score: "Not Graded",
          points: "0/100",
          notes: "",
        },
      ],
      categories: [
        { name: "Tests", weight: 40, score: 86, points: "344/400" },
        { name: "Labs", weight: 35, score: 89, points: "311/350" },
        { name: "Homework", weight: 25, score: 87, points: "217/250" },
      ],
    },
  ];

  return {
    courses,
    reportingPeriod: {
      name: "Fall Semester 2024",
      startDate: "Aug 26, 2024",
      endDate: "Dec 20, 2024",
    },
    reportingPeriods: [
      { name: "Fall Semester 2024", startDate: "Aug 26, 2024", endDate: "Dec 20, 2024" },
      { name: "Spring Semester 2024", startDate: "Jan 8, 2024", endDate: "May 24, 2024" },
    ],
  };
}
