import { initDatabase } from "./database.js";
const express = require('express');
const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});

let dbInstance = null;

async function initializeApp() {
  try {
    dbInstance = await initDatabase();
  } catch (error) {
    console.warn("Database initialization failed:", error);
  }
}

function goHome() {
  window.location.href = "home.html";
}

function openChat() {
  window.location.href = "chat.html";
}

function activatePanic() {
  window.location.href = "panic.html";
}

function openProgress() {
  window.location.href = "progress.html";
}

function openFriendZone() {
  window.location.href = "friends.html";
}

function showMotivation(msg) {
  const popup = document.createElement("div");
  popup.className = "motivation-popup";
  popup.innerText = msg;
  document.querySelector(".app")?.appendChild(popup);
  setTimeout(() => popup.remove(), 2000);
}

function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBox = document.getElementById("chatBox");
  const typing = document.getElementById("typingIndicator");

  if (!input || !chatBox || !typing || input.value.trim() === "") return;

  const userMsg = input.value;
  chatBox.innerHTML += `<div class='message-user'>You: ${userMsg}</div>`;
  input.value = "";
  typing.style.display = "block";

  setTimeout(() => {
    let aiReply = "AMANI: I hear you. Can you tell me more?";
    const msg = userMsg.toLowerCase();

    if (msg.includes("relapse"))
      aiReply = "AMANI (Crisis): Remember, you are safe. Take a deep breath.";
    else if (msg.includes("happy"))
      aiReply = "AMANI: That's wonderful! Let's celebrate your progress.";
    else if (msg.includes("stressed"))
      aiReply = "AMANI: I understand stress is tough. Try breathing with me.";

    chatBox.innerHTML += `<div class='message-ai'>${aiReply}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
    typing.style.display = "none";
    showMotivation("Keep going! You’re doing great.");
  }, 1000);
}

function quickReply(msg) {
  const input = document.getElementById("userInput");
  if (!input) return;
  input.value = msg;
  sendMessage();
}

function animateFriends() {
  const list = document.getElementById("friendList");
  if (!list) return;
  let delay = 0;
  Array.from(list.children).forEach((li) => {
    li.style.opacity = 0;
    li.style.transform = "translateY(10px)";
    setTimeout(() => li.classList.add("online"), delay);
    delay += 200;
  });
}

function animateProgress() {
  document.querySelectorAll(".progress-fill").forEach((bar, index) => {
    bar.style.width = ["70%", "60%", "50%"][index];
  });
}

function talkToCounsellor() {
  alert(
    "Demo: Connecting to a counsellor...\nIf online, chat will start; if offline, schedule priority follow-up.",
  );
}

window.goHome = goHome;
window.openChat = openChat;
window.activatePanic = activatePanic;
window.openProgress = openProgress;
window.openFriendZone = openFriendZone;
window.quickReply = quickReply;
window.sendMessage = sendMessage;
window.talkToCounsellor = talkToCounsellor;

window.addEventListener("DOMContentLoaded", () => {
  const page = window.location.pathname.split("/").pop();
  if (page === "progress.html") animateProgress();
  if (page === "friends.html") animateFriends();
});

initializeApp();
