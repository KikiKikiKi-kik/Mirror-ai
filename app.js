const messages = document.getElementById(“messages”);
const input = document.getElementById(“messageInput”);
const sendButton = document.getElementById(“sendButton”);
const newChatButton = document.getElementById(“newChat”);
const historyList = document.getElementById(“historyList”);
const mobileMenu = document.getElementById(“mobileMenu”);
const sidebar = document.querySelector(”.sidebar”);

let currentChatId = null;
let chats = loadChats();

// =========================
// LOCAL STORAGE
// =========================

function loadChats() {
try {
const saved = localStorage.getItem(“mirror_chats”);

if (!saved) return [];
const data = JSON.parse(saved);
return Array.isArray(data) ? data : [];

} catch (error) {
console.error(error);
return [];
}
}

function saveChats() {
localStorage.setItem(
“mirror_chats”,
JSON.stringify(chats)
);
}

// =========================
// CURRENT CHAT
// =========================

function getCurrentChat() {
return chats.find(
chat => chat.id === currentChatId
);
}

// =========================
// SIDEBAR
// =========================

function closeSidebar() {

// Убираем класс
sidebar.classList.remove(“open”);

// И дополнительно принудительно
// закрываем меню на телефоне
sidebar.style.transform = “translateX(-100%)”;

}

function openSidebar() {

sidebar.classList.add(“open”);

sidebar.style.transform = “translateX(0)”;

}

function toggleSidebar() {

if (sidebar.classList.contains(“open”)) {

closeSidebar();

} else {

openSidebar();

}

}

// =========================
// HISTORY
// =========================

function renderHistory() {

historyList.innerHTML = “”;

chats.forEach(chat => {

const item = document.createElement("button");
item.type = "button";
item.className = "history-item";
item.textContent =
  chat.title || "Новый чат";
if (chat.id === currentChatId) {
  item.classList.add("active");
}
item.addEventListener(
  "click",
  () => openChat(chat.id)
);
historyList.appendChild(item);

});

}

// =========================
// WELCOME
// =========================

function showWelcome() {

messages.innerHTML = “”;

const welcome =
document.createElement(“div”);

welcome.className = “welcome”;

welcome.id = “welcome”;

welcome.innerHTML = `
M
<h1>
  Чем могу помочь?
</h1>

`;

messages.appendChild(welcome);
}

// =========================
// NEW CHAT
// =========================

function newChat() {

// Создаём состояние нового чата
currentChatId = null;

// Очищаем сообщения
showWelcome();

// Очищаем поле
input.value = “”;

resizeInput();

// ВОТ ЭТО ГЛАВНОЕ
// закрываем меню ПРИНУДИТЕЛЬНО
closeSidebar();

// Обновляем историю
renderHistory();

// Возвращаем курсор
input.focus();

}

// =========================
// CREATE CHAT
// =========================

function createChat(title) {

const chat = {

id:
  Date.now().toString(),
title:
  title.length > 35
    ? title.substring(0, 35) + "..."
    : title,
messages: []

};

chats.unshift(chat);

currentChatId =
chat.id;

saveChats();

renderHistory();

return chat;
}

// =========================
// OPEN CHAT
// =========================

function openChat(id) {

const chat =
chats.find(
item => item.id === id
);

if (!chat) return;

currentChatId =
chat.id;

messages.innerHTML = “”;

if (
!chat.messages ||
chat.messages.length === 0
) {

showWelcome();

} else {

chat.messages.forEach(
  message => {
    addMessage(
      message.role,
      message.content,
      false
    );
  }
);

}

renderHistory();

closeSidebar();

scrollToBottom();

}

// =========================
// SEND MESSAGE
// =========================

async function sendMessage() {

const text =
input.value.trim();

if (
!text ||
sendButton.disabled
) {
return;
}

input.value = “”;

resizeInput();

const welcome =
document.getElementById(“welcome”);

if (welcome) {
welcome.remove();
}

addMessage(
“user”,
text
);

sendButton.disabled = true;

// Если это новый чат —
// создаём его
if (!currentChatId) {

createChat(text);

}

const chat =
getCurrentChat();

if (chat) {

chat.messages.push({
  role: "user",
  content: text
});
saveChats();

}

const loading =
addMessage(
“mirror”,
“”
);

const bubble =
loading.querySelector(
“.bubble”
);

bubble.classList.add(
“thinking”
);

bubble.textContent =
“Думаю…”;

try {

const response =
  await fetch(
    "/api/chat",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json"
      },
      body:
        JSON.stringify({
          message: text
        })
    }
  );
if (!response.ok) {
  const error =
    await response.text();
  throw new Error(
    error ||
    `HTTP ${response.status}`
  );
}
if (!response.body) {
  throw new Error(
    "Streaming не поддерживается"
  );
}
const reader =
  response.body.getReader();
const decoder =
  new TextDecoder(
    "utf-8"
  );
let answer = "";
let firstChunk = true;
while (true) {
  const {
    value,
    done
  } =
    await reader.read();
  if (done) break;
  const chunk =
    decoder.decode(
      value,
      {
        stream: true
      }
    );
  if (!chunk) continue;
  answer += chunk;
  if (firstChunk) {
    bubble.classList.remove(
      "thinking"
    );
    firstChunk = false;
  }
  renderMarkdown(
    bubble,
    answer
  );
  scrollToBottom();
}
const last =
  decoder.decode();
if (last) {
  answer += last;
  renderMarkdown(
    bubble,
    answer
  );
}
if (!answer.trim()) {
  bubble.textContent =
    "Не удалось получить ответ.";
}
if (chat) {
  chat.messages.push({
    role: "mirror",
    content: answer
  });
  saveChats();
}

} catch (error) {

console.error(error);
bubble.classList.remove(
  "thinking"
);
bubble.textContent =
  "Ошибка: " +
  error.message;

}

renderHistory();

sendButton.disabled = false;

input.focus();

scrollToBottom();

}

// =========================
// MARKDOWN
// =========================

function renderMarkdown(
element,
text
) {

let html = text
.replace(/&/g, “&”)
.replace(/</g, “<”)
.replace(/>/g, “>”);

html = html.replace(
/**(.+?)**/g,
“$1”
);

html = html.replace(
/(.+?)/g,
“$1”
);

html = html.replace(
/(?<!*)*([^*\n]+)*(?!*)/g,
“$1”
);

html = html.replace(
/([^\n]+)`/g,
“$1”
);

html = html.replace(
/^### (.+)$/gm,
“$1”
);

html = html.replace(
/^## (.+)$/gm,
“$1”
);

html = html.replace(
/^# (.+)$/gm,
“$1”
);

html = html.replace(
/^- (.+)$/gm,
“• $1”
);

html = html.replace(
/\n/g,
“”
);

element.innerHTML = html;
}

// =========================
// ADD MESSAGE
// =========================

function addMessage(
role,
text,
scroll = true
) {

const message =
document.createElement(“div”);

message.className =
message message-${role};

const bubble =
document.createElement(“div”);

bubble.className =
“bubble”;

if (
role === “mirror” &&
text
) {

renderMarkdown(
  bubble,
  text
);

} else {

bubble.textContent =
  text;

}

message.appendChild(
bubble
);

messages.appendChild(
message
);

if (scroll) {
scrollToBottom();
}

return message;
}

// =========================
// SCROLL
// =========================

function scrollToBottom() {

requestAnimationFrame(
() => {

  messages.scrollTo({
    top:
      messages.scrollHeight,
    behavior:
      "smooth"
  });
}

);

}

// =========================
// INPUT
// =========================

function resizeInput() {

input.style.height = “auto”;

input.style.height =
Math.min(
input.scrollHeight,
180
) + “px”;

}

// =========================
// EVENTS
// =========================

newChatButton.addEventListener(
“click”,
newChat
);

sendButton.addEventListener(
“click”,
sendMessage
);

mobileMenu.addEventListener(
“click”,
toggleSidebar
);

input.addEventListener(
“input”,
resizeInput
);

input.addEventListener(
“keydown”,
event => {

if (
  event.key === "Enter" &&
  !event.shiftKey
) {
  event.preventDefault();
  sendMessage();
}

}
);

// =========================
// CLOSE MENU BUTTON
// =========================

const closeMenu =
document.getElementById(
“closeMenu”
);

if (closeMenu) {

closeMenu.addEventListener(
“click”,
closeSidebar
);

}

// =========================
// EXIT
// =========================

const exitButton =
document.getElementById(
“exitButton”
);

if (exitButton) {

exitButton.addEventListener(
“click”,
closeSidebar
);

}

// =========================
// START
// =========================

renderHistory();

showWelcome();

input.focus();
