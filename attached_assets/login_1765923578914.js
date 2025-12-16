const getLetterGrade = percentage => {
  percentage = Math.round(percentage);
  if (percentage >= 93) return "A";
  if (percentage >= 90) return "A-";
  if (percentage >= 87) return "B+";
  if (percentage >= 83) return "B";
  if (percentage >= 80) return "B-";
  if (percentage >= 77) return "C+";
  if (percentage >= 73) return "C";
  if (percentage >= 70) return "C-";
  if (percentage >= 67) return "D+";
  if (percentage >= 64) return "D";
  return "E";
};

const calcPercentage = row => {
  const numberEl = document.getElementById("number");
  const letterEl = document.getElementById("letter");
  const table = document.getElementById("table");

  const points = Number(row.cells[1].querySelector("input").value);
  const total = Number(row.cells[3].querySelector("input").value);

  let percentage = points / total * 100;
  percentage = Math.round(percentage * 100) / 100;
  if (!isNaN(percentage)) row.cells[4].textContent = `${percentage}%`;

  let totalPoints = 0;
  let totalTotal = 0;

  Array.from(table.rows).forEach(r => {
    const p = Number(r.cells[1].querySelector("input").value);
    if (!isNaN(p)) totalPoints += p;
    const t = Number(r.cells[3].querySelector("input").value);
    if (!isNaN(t)) totalTotal += t;
  });

  const overall = totalPoints / totalTotal * 100;
  const roundedOverall = Math.round(overall * 100) / 100;
  numberEl.textContent = roundedOverall;
  letterEl.textContent = getLetterGrade(roundedOverall);
};

const drawAssignment = (table, assignment) => {
  const row = table.insertRow();
  row.insertCell(0).textContent = assignment.Measure;

  const pointsCell = row.insertCell(1);
  const pointsInput = document.createElement("input");
  pointsInput.type = "number";
  pointsInput.value = assignment.Point || 0;
  pointsInput.oninput = () => calcPercentage(row);
  pointsCell.appendChild(pointsInput);

  row.insertCell(2).textContent = "/";

  const totalCell = row.insertCell(3);
  const totalInput = document.createElement("input");
  totalInput.type = "number";
  totalInput.value = assignment.PointPossible || 0;
  totalInput.oninput = () => calcPercentage(row);
  totalCell.appendChild(totalInput);
  totalCell.classList.add("points");

  row.insertCell(4);
  calcPercentage(row);
};

const drawAssignments = (parsedData, courseID) => {
  document.body.innerHTML = "";
  const courses = document.querySelectorAll(".coursedata");
  courses.forEach(el => el.remove());

  const footer = document.getElementById("footer");
  const course = parsedData.Gradebook.Courses.Course[courseID];

  const name = document.createElement("span");
  name.textContent = `${course.CourseName} - `;
  document.body.insertBefore(name, footer);

  const letter = document.createElement("span");
  letter.id = "letter";
  document.body.insertBefore(letter, footer);

  const number = document.createElement("span");
  number.id = "number";
  document.body.insertBefore(number, footer);

  const back = document.createElement("button");
  back.textContent = "Back";
  back.classList.add("back-btn");
  back.addEventListener("click", () => drawCourses(parsedData));
  document.body.insertBefore(back, footer);

  const assignments = course.Marks.Mark[0].Assignments.Assignment;
  const table = document.createElement("table");
  table.id = "table";
  table.classList.add("assignment");
  document.body.insertBefore(table, footer);

  if (Array.isArray(assignments)) {
    assignments.forEach(a => drawAssignment(table, a));
  } else {
    drawAssignment(table, assignments);
  }
};

const drawCourses = parsedData => {
  document.body.innerHTML = "";
  const footer = document.getElementById("footer");
  const courses = parsedData.Gradebook.Courses.Course;

  const coursesContainer = document.createElement("div");
  coursesContainer.classList.add("courses-container");
  document.body.insertBefore(coursesContainer, footer);

  courses.forEach((course, i) => {
    // Create course card
    const card = document.createElement("div");
    card.classList.add("course-card");

    // Course name
    const courseName = document.createElement("h3");
    courseName.textContent = course.CourseName;
    card.appendChild(courseName);

    // Calculated grade
    const grade = document.createElement("span");
    grade.classList.add("course-grade");
    grade.textContent = course.Marks.Mark[0].CalculatedScoreString;
    card.appendChild(grade);

    // Click event to view assignments
    card.addEventListener("click", () => drawAssignments(parsedData, i));

    coursesContainer.appendChild(card);
  });
};

const loginAndFetch = async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  document.body.innerHTML = `<p class="loading">Loading...</p>`;

  const response = await fetch("/api/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      district: "https://studentvue.vbcps.com",
      username,
      password
    })
  });

  const data = await response.json();
  document.body.innerHTML = "";

  const title = document.createElement("h1");
  title.id = "site-title";
  title.textContent = "Grades";
  document.body.appendChild(title);

  const parsedData = JSON.parse(data);
  drawCourses(parsedData);
};

