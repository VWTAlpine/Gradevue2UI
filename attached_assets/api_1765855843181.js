import StudentVue from "studentvue.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if ( req.method === "OPTIONS" ) {
    return res.status(204).end();
  }

  if ( req.method !== "POST" ) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { district, username, password } = req.body;

    if ( !district || !username || !password ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const client = await StudentVue.login(district, username, password);
    const gradebook = await client.getGradebook();

    return res.status(200).json(gradebook);
  } catch ( err ) {
    console.error(err);
    alert("Login failed! Make sure you don't include @vbstudents");
    return res.status(500).json({ error: "Login failed" });
  }
}

