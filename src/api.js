// API utility for communicating with the backend

const API_BASE = "";

export async function getUserProfile(userId) {
  const response = await fetch(`${API_BASE}/api/users/${userId}`);
  if (!response.ok) throw new Error("Failed to fetch user profile");
  return response.json();
}

export async function getUserProgress(userId) {
  const response = await fetch(`${API_BASE}/api/users/${userId}/progress`);
  if (!response.ok) throw new Error("Failed to fetch progress");
  return response.json();
}

export async function addProgressEntry(userId, { date, metric, value, notes }) {
  const response = await fetch(`${API_BASE}/api/users/${userId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, metric, value, notes }),
  });
  if (!response.ok) throw new Error("Failed to add progress entry");
  return response.json();
}

export async function getUserFriends(userId) {
  const response = await fetch(`${API_BASE}/api/users/${userId}/friends`);
  if (!response.ok) throw new Error("Failed to fetch friends");
  return response.json();
}

export async function getLobbyMessages() {
  const response = await fetch(`${API_BASE}/api/lobby/messages`);
  if (!response.ok) throw new Error("Failed to fetch lobby messages");
  return response.json();
}

export async function addLobbyMessage({
  user_id,
  display_name,
  is_anonymous,
  message,
}) {
  const response = await fetch(`${API_BASE}/api/lobby/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, display_name, is_anonymous, message }),
  });
  if (!response.ok) throw new Error("Failed to add message");
  return response.json();
}

export async function getUserJournal(userId) {
  const response = await fetch(`${API_BASE}/api/users/${userId}/journal`);
  if (!response.ok) throw new Error("Failed to fetch journal");
  return response.json();
}

export async function addJournalEntry(userId, entry) {
  const response = await fetch(`${API_BASE}/api/users/${userId}/journal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entry }),
  });
  if (!response.ok) throw new Error("Failed to add journal entry");
  return response.json();
}

export async function getUserStreaks(userId) {
  const response = await fetch(`${API_BASE}/api/users/${userId}/streaks`);
  if (!response.ok) throw new Error("Failed to fetch streaks");
  return response.json();
}

export async function createStreak(userId, substance_or_behavior) {
  const response = await fetch(`${API_BASE}/api/users/${userId}/streaks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ substance_or_behavior }),
  });
  if (!response.ok) throw new Error("Failed to create streak");
  return response.json();
}

export async function updateStreak(userId, streakId, current_streak_days) {
  const response = await fetch(
    `${API_BASE}/api/users/${userId}/streaks/${streakId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ current_streak_days }),
    },
  );
  if (!response.ok) throw new Error("Failed to update streak");
  return response.json();
}

export async function endStreak(userId, streakId) {
  const response = await fetch(
    `${API_BASE}/api/users/${userId}/streaks/${streakId}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    },
  );
  if (!response.ok) throw new Error("Failed to end streak");
  return response.json();
}
