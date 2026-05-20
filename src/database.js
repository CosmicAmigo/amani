import initSqlJs from "sql.js";

const DB_SCHEMA = `
CREATE TABLE IF NOT EXISTS journal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

export async function initDatabase() {
  try {
    if (window.Capacitor?.isNativePlatform?.()) {
      const { SQLiteConnection } = await import("@capacitor-community/sqlite");
      const sqlite = new SQLiteConnection();
      const db = await sqlite.createConnection("amaniDB", false, "no-encryption", 1);
      await db.open();
      await db.execute(DB_SCHEMA);
      return db;
    }
  } catch (error) {
    console.warn("Capacitor SQLite initialization failed:", error);
  }

  const SQL = await initSqlJs({
    locateFile: (filename) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.14.1/${filename}`,
  });
  const db = new SQL.Database();
  db.run(DB_SCHEMA);
  return db;
}

export function addJournalEntry(db, entry) {
  if (!db) return;
  db.run("INSERT INTO journal (entry) VALUES (?)", [entry]);
}

export function getJournalEntries(db) {
  if (!db) return [];
  const res = db.exec("SELECT id, entry, created_at FROM journal");
  if (!res || res.length === 0) return [];
  return res[0].values.map(([id, entry, created_at]) => ({ id, entry, created_at }));
}
