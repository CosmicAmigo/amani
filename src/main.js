import {
  getUserProfile,
  getUserProgress,
  addProgressEntry,
  getUserFriends,
  getLobbyMessages,
  addLobbyMessage,
  getUserJournal,
  addJournalEntry,
  getUserStreaks,
  createStreak,
  updateStreak,
  endStreak,
} from "./api.js";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
let currentUser = null;
let currentUserId = null;
let chatHistory = [];

function saveState() {
  if (currentUser)
    localStorage.setItem("amani-current-user", JSON.stringify(currentUser));
  if (currentUserId) localStorage.setItem("amani-user-id", currentUserId);
}

async function initializeApp() {
  const userIdRaw = localStorage.getItem("amani-user-id");
  if (userIdRaw) {
    currentUserId = userIdRaw;
    try {
      currentUser = await getUserProfile(currentUserId);
    } catch (err) {
      console.error("Failed to load user profile:", err);
      currentUserId = null;
    }
  }

  wireGlobalHandlers();
  wireGoogleLogin();
  await renderLobbyMessages();
  updateLobbyIdentityPreview();
}

function wireGlobalHandlers() {
  window.goHome = () => (window.location.href = "home.html");
  window.openChat = () => (window.location.href = "chat.html");
  window.openLobby = () => (window.location.href = "lobby.html");
  window.activatePanic = () => (window.location.href = "panic.html");
  window.openProgress = () => (window.location.href = "progress.html");
  window.openFriendZone = () => (window.location.href = "friends.html");

  window.sendLobbyMessage = sendLobbyMessage;
  window.sendMessage = sendMessage;
  window.quickReply = quickReply;
  window.talkToCounsellor = talkToCounsellor;
  window.loadUserProgress = loadUserProgress;
  window.loadUserStreaks = loadUserStreaks;
  window.addNewStreak = addNewStreak;
  window.updateStreakDays = updateStreakDays;
  window.completeStreak = completeStreak;
  window.loadUserFriends = loadUserFriends;
}

function wireGoogleLogin() {
  const signInContainer = document.getElementById("googleSignIn");
  if (!signInContainer || !GOOGLE_CLIENT_ID || !window.google?.accounts?.id)
    return;

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: async (response) => {
      const profile = parseJwt(response.credential);
      currentUser = profile;
      currentUserId = Math.random().toString();
      saveState();
      updateLobbyIdentityPreview();
    },
  });

  window.google.accounts.id.renderButton(signInContainer, {
    theme: "outline",
    size: "large",
    width: "260",
  });
}

function parseJwt(token) {
  const payload = token.split(".")[1];
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
}

// Chat functionality
async function sendMessage() {
  const input = document.getElementById("userInput");
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  const chatBox = document.getElementById("chatBox");
  if (chatBox) {
    chatBox.innerHTML += `<div class="message-user"><strong>You:</strong> ${message}</div>`;
  }

  chatHistory.push({ role: "user", content: message });
  input.value = "";

  // Show typing indicator
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) typingIndicator.style.display = "block";

  // Simulate AMANI response
  setTimeout(() => {
    const responses = [
      "I hear you. That sounds important. Tell me more.",
      "Thank you for sharing. How does that make you feel?",
      "I'm here to listen. What would help you right now?",
      "That's a valid feeling. You're not alone.",
      "I appreciate your trust in me. What can I do to help?",
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];

    if (chatBox) {
      chatBox.innerHTML += `<div class="message-ai"><strong>AMANI:</strong> ${response}</div>`;
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    if (typingIndicator) typingIndicator.style.display = "none";
    chatHistory.push({ role: "assistant", content: response });
  }, 800);
}

function quickReply(message) {
  const input = document.getElementById("userInput");
  if (input) {
    input.value = message;
    sendMessage();
  }
}

function talkToCounsellor() {
  alert(
    "Counsellor feature coming soon! In the meantime, use the AMANI chat or community lobby.",
  );
}

// Streak functionality
async function loadUserStreaks() {
  const container = document.getElementById("streaksContainer");
  if (!container || !currentUserId) return;

  try {
    const streaks = await getUserStreaks(currentUserId);

    if (streaks.length === 0) {
      container.innerHTML =
        "<p>No active streaks. Start one to begin tracking your recovery!</p>";
      return;
    }

    container.innerHTML = streaks
      .map(
        (streak, idx) => `
        <div class="streak-card">
          <h4>${streak.substance_or_behavior}</h4>
          <div class="streak-display">
            <span class="streak-days">${streak.current_streak_days}</span>
            <span class="streak-label">days</span>
          </div>
          <small>Started: ${new Date(streak.start_date).toLocaleDateString()}</small>
          <div class="streak-controls">
            <button class="button-small" onclick="updateStreakDays(${streak.id}, ${streak.current_streak_days + 1})">+1 Day</button>
            <button class="button-small danger" onclick="completeStreak(${streak.id})">End Streak</button>
          </div>
        </div>
      `,
      )
      .join("");
  } catch (err) {
    console.error("Failed to load streaks:", err);
    container.innerHTML = "<p>Failed to load streaks</p>";
  }
}

async function addNewStreak() {
  const substance = prompt("What would you like to abstain from?");
  if (!substance || !currentUserId) return;

  try {
    await createStreak(currentUserId, substance);
    alert("Streak started! You can do this!");
    await loadUserStreaks();
  } catch (err) {
    console.error("Failed to create streak:", err);
    alert("Failed to create streak");
  }
}

async function updateStreakDays(streakId, newDays) {
  if (!currentUserId) return;

  try {
    await updateStreak(currentUserId, streakId, newDays);
    await loadUserStreaks();
  } catch (err) {
    console.error("Failed to update streak:", err);
    alert("Failed to update streak");
  }
}

async function completeStreak(streakId) {
  if (!currentUserId) return;
  if (!confirm("End this streak? This action cannot be undone.")) return;

  try {
    await endStreak(currentUserId, streakId);
    alert("Streak ended. Remember, every day of progress is a victory!");
    await loadUserStreaks();
  } catch (err) {
    console.error("Failed to end streak:", err);
    alert("Failed to end streak");
  }
}

// Lobby messages
async function sendLobbyMessage() {
  const input = document.getElementById("lobbyInput");
  const anonymousToggle = document.getElementById("anonymousToggle");
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  const isAnonymous = anonymousToggle?.checked ?? true;
  const displayName = isAnonymous ? "Anonymous" : currentUser?.name || "Guest";

  try {
    await addLobbyMessage({
      user_id: currentUserId || null,
      display_name: displayName,
      is_anonymous: isAnonymous,
      message,
    });

    input.value = "";
    await renderLobbyMessages();
  } catch (err) {
    console.error("Failed to send message:", err);
    alert("Failed to send message");
  }
}

function updateLobbyIdentityPreview() {
  const badge = document.getElementById("identityBadge");
  if (!badge) return;
  badge.textContent = currentUser
    ? `Signed in: ${currentUser.name || currentUser.email}`
    : "Not signed in (you can still post anonymously)";
}

async function renderLobbyMessages() {
  const list = document.getElementById("lobbyMessages");
  if (!list) return;

  try {
    const messages = await getLobbyMessages();
    list.innerHTML = messages
      .map(
        (msg) =>
          `<div class="message-ai"><strong>${msg.display_name}:</strong> ${msg.message}</div>`,
      )
      .join("");
    list.scrollTop = list.scrollHeight;
  } catch (err) {
    console.error("Failed to load messages:", err);
    list.innerHTML = '<div class="message-ai">Failed to load messages</div>';
  }
}

// Progress tracking
async function loadUserProgress() {
  const container = document.getElementById("progressContainer");
  if (!container || !currentUserId) return;

  try {
    const progress = await getUserProgress(currentUserId);
    container.innerHTML = progress
      .map(
        (p) => `
        <div class="progress-card">
          <p>${p.metric}</p>
          <div class="progress-value">${p.value}</div>
          <small>${new Date(p.date).toLocaleDateString()}</small>
        </div>
      `,
      )
      .join("");
  } catch (err) {
    console.error("Failed to load progress:", err);
  }
}

// Friends
async function loadUserFriends() {
  const container = document.getElementById("friendsContainer");
  if (!container || !currentUserId) return;

  try {
    const friends = await getUserFriends(currentUserId);
    container.innerHTML = friends
      .map(
        (f) => `
        <div class="friend-card">
          <img src="${f.picture || "default-avatar.png"}" alt="${f.name}">
          <div class="friend-info">
            <p>${f.name || f.username}</p>
          </div>
        </div>
      `,
      )
      .join("");
  } catch (err) {
    console.error("Failed to load friends:", err);
  }
}

window.addEventListener("DOMContentLoaded", initializeApp);
