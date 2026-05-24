CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_sub TEXT UNIQUE,
  name TEXT,
  email TEXT,
  picture TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lobby_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  display_name TEXT NOT NULL,
  is_anonymous INTEGER NOT NULL DEFAULT 1,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

-- name: upsert_user
INSERT INTO users (google_sub, name, email, picture)
VALUES (?, ?, ?, ?)
ON CONFLICT(google_sub) DO UPDATE SET
  name=excluded.name,
  email=excluded.email,
  picture=excluded.picture;

-- name: get_user_by_sub
SELECT id, google_sub, name, email, picture
FROM users
WHERE google_sub = ?;

-- name: insert_lobby_message
INSERT INTO lobby_messages (user_id, display_name, is_anonymous, message)
VALUES (?, ?, ?, ?);

-- name: get_lobby_messages
SELECT id, user_id, display_name, is_anonymous, message, created_at
FROM lobby_messages
ORDER BY id ASC;
