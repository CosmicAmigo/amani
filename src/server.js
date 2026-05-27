const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();

// Middleware
app.use(express.json());

// Serve the built frontend from the `dist` directory
app.use(express.static(path.join(__dirname, "..", "dist")));

// Bind to the port Render provides, otherwise default to 10000
const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || "0.0.0.0";

// Database connection pool
let pool;

async function initializeDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const parsed = new URL(dbUrl);
  const user = parsed.username ? decodeURIComponent(parsed.username) : undefined;
  const password = parsed.password ? decodeURIComponent(parsed.password) : undefined;
  const host = parsed.hostname;
  const port = parsed.port ? parseInt(parsed.port, 10) : 3306;
  const database = parsed.pathname ? parsed.pathname.replace(/^\//, "") : undefined;
  const sslMode = parsed.searchParams.get("ssl-mode") || parsed.searchParams.get("sslmode");

  const poolOptions = {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };

  if (sslMode && sslMode.toUpperCase() !== "DISABLED") {
    poolOptions.ssl = { rejectUnauthorized: false };
  }

  pool = mysql.createPool(poolOptions);
}

// Get user profile
app.get("/api/users/:userId", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT id, google_sub, username, name, email, picture FROM users WHERE id = ?",
      [req.params.userId],
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get user progress stats
app.get("/api/users/:userId/progress", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT id, date, metric, value, notes FROM progress WHERE user_id = ? ORDER BY date DESC LIMIT 10",
      [req.params.userId],
    );
    connection.release();
    res.json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Add progress entry
app.post("/api/users/:userId/progress", async (req, res) => {
  try {
    const { date, metric, value, notes } = req.body;
    const connection = await pool.getConnection();
    await connection.execute(
      "INSERT INTO progress (user_id, date, metric, value, notes) VALUES (?, ?, ?, ?, ?)",
      [req.params.userId, date, metric, value, notes || null],
    );
    connection.release();
    res.json({ success: true });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get user friends
app.get("/api/users/:userId/friends", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT f.id, f.friend_id, u.username, u.name, u.picture, f.status, f.created_at
       FROM friends f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = ? AND f.status = 'accepted'
       ORDER BY f.created_at DESC`,
      [req.params.userId],
    );
    connection.release();
    res.json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get lobby messages
app.get("/api/lobby/messages", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT id, user_id, display_name, is_anonymous, message, created_at FROM lobby_messages ORDER BY created_at DESC LIMIT 50",
    );
    connection.release();
    res.json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Add lobby message
app.post("/api/lobby/messages", async (req, res) => {
  try {
    const { user_id, display_name, is_anonymous, message } = req.body;
    const connection = await pool.getConnection();
    await connection.execute(
      "INSERT INTO lobby_messages (user_id, display_name, is_anonymous, message) VALUES (?, ?, ?, ?)",
      [user_id || null, display_name, is_anonymous ? 1 : 0, message],
    );
    connection.release();
    res.json({ success: true });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get user journal entries
app.get("/api/users/:userId/journal", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      "SELECT id, entry, created_at FROM journal WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
      [req.params.userId],
    );
    connection.release();
    res.json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Add journal entry
app.post("/api/users/:userId/journal", async (req, res) => {
  try {
    const { entry } = req.body;
    const connection = await pool.getConnection();
    await connection.execute(
      "INSERT INTO journal (user_id, entry) VALUES (?, ?)",
      [req.params.userId, entry],
    );
    connection.release();
    res.json({ success: true });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Get user abstinence streaks
app.get("/api/users/:userId/streaks", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT id, substance_or_behavior, start_date, current_streak_days, last_checked, is_active 
       FROM abstinence_streaks 
       WHERE user_id = ? AND is_active = 1 
       ORDER BY current_streak_days DESC`,
      [req.params.userId],
    );
    connection.release();
    res.json(rows);
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Create or update abstinence streak
app.post("/api/users/:userId/streaks", async (req, res) => {
  try {
    const { substance_or_behavior } = req.body;
    const connection = await pool.getConnection();
    const today = new Date().toISOString().split("T")[0];

    await connection.execute(
      `INSERT INTO abstinence_streaks (user_id, substance_or_behavior, start_date, current_streak_days, last_checked, is_active)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE 
       is_active = 1,
       last_checked = NOW()`,
      [req.params.userId, substance_or_behavior, today, 0, new Date()],
    );

    connection.release();
    res.json({ success: true });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Update streak days
app.put("/api/users/:userId/streaks/:streakId", async (req, res) => {
  try {
    const { current_streak_days } = req.body;
    const connection = await pool.getConnection();

    await connection.execute(
      `UPDATE abstinence_streaks 
       SET current_streak_days = ?, last_checked = NOW()
       WHERE id = ? AND user_id = ?`,
      [current_streak_days, req.params.streakId, req.params.userId],
    );

    connection.release();
    res.json({ success: true });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// End streak
app.delete("/api/users/:userId/streaks/:streakId", async (req, res) => {
  try {
    const connection = await pool.getConnection();

    await connection.execute(
      `UPDATE abstinence_streaks \n       SET is_active = 0\n       WHERE id = ? AND user_id = ?`,
      [req.params.streakId, req.params.userId],
    );

    connection.release();
    res.json({ success: true });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/chat", async (req, res) => {
  const { history } = req.body;

  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ error: "Invalid conversation history format." });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server Configuration Error: GEMINI_API_KEY is not set on Render." });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Pull out the user's latest text input string
    const latestMessage = history[history.length - 1].parts[0].text;
    
    // Grab everything before the latest message to serve as context history
    const pastConversations = history.slice(0, -1);

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: pastConversations,
      config: {
        systemInstruction: "You are AMANI, a compassionate mental wellness assistant. Listen attentively, provide validation, and keep your responses supportive and focused on wellness."
      }
    });

    const result = await chat.sendMessage({ message: latestMessage });
    
    res.json({ reply: result.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Failed to communicate with AMANI engine." });
  }
});

// Fallback path handler to support client-side SPA routing routing if needed
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Server is running on ${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });