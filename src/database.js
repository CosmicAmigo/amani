import initSqlJs from "sql.js";
import sqlText from "./queries.sql?raw";

function extractQuery(name) {
  const marker = `-- name: ${name}`;
  const start = sqlText.indexOf(marker);
  if (start === -1) {
    throw new Error(`SQL query not found: ${name}`);
  }

  const afterMarker = sqlText.slice(start + marker.length).trimStart();
  const nextMarker = afterMarker.indexOf("-- name:");
  return (nextMarker === -1 ? afterMarker : afterMarker.slice(0, nextMarker)).trim();
}

const DB_SCHEMA = sqlText.split("-- name:")[0].trim();
const UPSERT_USER_QUERY = extractQuery("upsert_user");
const GET_USER_BY_SUB_QUERY = extractQuery("get_user_by_sub");
const INSERT_LOBBY_MESSAGE_QUERY = extractQuery("insert_lobby_message");
const GET_LOBBY_MESSAGES_QUERY = extractQuery("get_lobby_messages");

export async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: (filename) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.14.1/${filename}`,
  });
  const db = new SQL.Database();
  db.run(DB_SCHEMA);
  return db;
}

export function upsertUser(db, profile) {
  if (!db || !profile?.sub) return null;

  db.run(UPSERT_USER_QUERY, [profile.sub, profile.name || null, profile.email || null, profile.picture || null]);

  const res = db.exec(GET_USER_BY_SUB_QUERY, [profile.sub]);
  if (!res.length) return null;
  const [id, google_sub, name, email, picture] = res[0].values[0];
  return { id, google_sub, name, email, picture };
}

export function addLobbyMessage(db, { userId, displayName, isAnonymous, message }) {
  if (!db || !message?.trim()) return;
  db.run(INSERT_LOBBY_MESSAGE_QUERY, [userId || null, displayName, isAnonymous ? 1 : 0, message.trim()]);
}

export function getLobbyMessages(db) {
  if (!db) return [];
  const res = db.exec(GET_LOBBY_MESSAGES_QUERY);
  if (!res.length) return [];
  return res[0].values.map(([id, user_id, display_name, is_anonymous, message, created_at]) => ({
    id,
    user_id,
    display_name,
    is_anonymous: Boolean(is_anonymous),
    message,
    created_at,
  }));
}
