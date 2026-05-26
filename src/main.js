import { initDatabase, upsertUser, addLobbyMessage, getLobbyMessages } from "./database.js";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
let dbInstance = null;
let currentUser = null;

function saveState() {
  if (dbInstance) localStorage.setItem("amani-db", JSON.stringify(Array.from(dbInstance.export())));
  if (currentUser) localStorage.setItem("amani-current-user", JSON.stringify(currentUser));
}

async function initializeApp() {
  dbInstance = await initDatabase();
  const userRaw = localStorage.getItem("amani-current-user");
  if (userRaw) currentUser = JSON.parse(userRaw);

  wireGlobalHandlers();
  wireGoogleLogin();
  renderLobbyMessages();
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
}

function wireGoogleLogin() {
  const signInContainer = document.getElementById("googleSignIn");
  if (!signInContainer || !GOOGLE_CLIENT_ID || !window.google?.accounts?.id) return;

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      const profile = parseJwt(response.credential);
      currentUser = upsertUser(dbInstance, profile);
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

function sendLobbyMessage() {
  const input = document.getElementById("lobbyInput");
  const anonymousToggle = document.getElementById("anonymousToggle");
  if (!input) return;

  const message = input.value.trim();
  if (!message) return;

  const isAnonymous = anonymousToggle?.checked ?? true;
  const displayName = isAnonymous ? "Anonymous" : currentUser?.name || "Guest";

  addLobbyMessage(dbInstance, {
    userId: currentUser?.id,
    displayName,
    isAnonymous,
    message,
  });

  input.value = "";
  renderLobbyMessages();
}

function updateLobbyIdentityPreview() {
  const badge = document.getElementById("identityBadge");
  if (!badge) return;
  badge.textContent = currentUser
    ? `Signed in: ${currentUser.name || currentUser.email}`
    : "Not signed in (you can still post anonymously)";
}

function renderLobbyMessages() {
  const list = document.getElementById("lobbyMessages");
  if (!list) return;

  const rows = getLobbyMessages(dbInstance);
  list.innerHTML = rows
    .map(
      (row) => `<div class="message-ai"><strong>${row.display_name}:</strong> ${row.message}</div>`,
    )
    .join("");
  list.scrollTop = list.scrollHeight;
}

window.addEventListener("DOMContentLoaded", initializeApp);
