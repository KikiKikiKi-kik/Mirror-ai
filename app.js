const messages = document.getElementById(“messages”);
const input = document.getElementById(“messageInput”);
const sendButton = document.getElementById(“sendButton”);
const newChatButton = document.getElementById(“newChat”);
const historyList = document.getElementById(“historyList”);
const mobileMenu = document.getElementById(“mobileMenu”);
const sidebar = document.querySelector(”.sidebar”);

let currentChat = [];
let currentChatId = null;

let chats = loadChats();

// =========================
// MARKDOWN
// =========================

function renderMarkdown(element, text) {

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

html = html.replace(/\n/g, “”);

element.innerHTML = html;
}

// =========================
// LOCAL STORAGE
// =========================

function loadChats() {

try {

const saved =
  localStorage.getItem("mirror_chats");
if (!saved) {
  return [];
}
const parsed = JSON.parse(saved);
if (!Array.isArray(parsed)) {
  return [];
}
return parsed;

} catch (error) {

console.error(
  "Ошибка загрузки чатов:",
  error
);
return [];

}
}

function saveChats() {

try {

localStorage.setItem(
  "mirror_chats",
  JSON.stringify(chats)
);

} catch (error) {

console.error(
  "Ошибка сохранения чатов:",
  error
);

}
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
// HISTORY
// =========================

function renderHistory() {

historyList.innerHTML = “”;

if (chats.length === 0) {

const empty =
  document.createElement("div");
empty.className =
  "history-empty";
empty.textContent =
  "Пока нет чатов";
historyList.appendChild(empty);
return;

}

chats.forEach(chat => {

const item =
  document.createElement("button");
item.type = "button";
item.className =
  "history-item";
item.textContent =
  chat.title || "Новый чат";
if (chat.id === currentChatId) {
  item.classList.add("active");
}
item.addEventListener(
  "click",
  () => {
    openChat(chat.id);
  }
);
historyList.appendChild(item);

});

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

currentChat =
chat.messages;

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

if (!chat) {
return;
}

currentChatId =
chat.id;

currentChat =
chat.messages;

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
// SHOW WELCOME
// =========================

function showWelcome() {

const welcome =
document.createElement(“div”);

welcome.className =
“welcome”;

welcome.id =
“welcome”;

welcome.innerHTML = `

<div class="welcome-mark">
  M
</div>
<h1>
  Чем могу помочь?
</h1>

`;

messages.appendChild(
welcome
);

}

// =========================
// NEW CHAT
// =========================

function newChat() {

currentChat = [];

currentChatId = null;

messages.innerHTML = “”;

showWelcome();

input.value = “”;

resizeInput();

// ВАЖНО:
// закрываем мобильное меню

closeSidebar();

renderHistory();

input.focus();

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
document.getElementById(
“welcome”
);

if (welcome) {

welcome.remove();

}

addMessage(
“user”,
text
);

sendButton.disabled =
true;

// Если чата ещё нет —
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

renderHistory();

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
  const errorText =
    await response.text();
  throw new Error(
    errorText ||
    `HTTP ${response.status}`
  );
}
if (!response.body) {
  throw new Error(
    "Сервер не поддерживает streaming"
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
  if (done) {
    break;
  }
  const chunk =
    decoder.decode(
      value,
      {
        stream: true
      }
    );
  if (!chunk) {
    continue;
  }
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
const lastChunk =
  decoder.decode();
if (lastChunk) {
  answer +=
    lastChunk;
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
renderHistory();

} catch (error) {

console.error(
  "Ошибка:",
  error
);
bubble.classList.remove(
  "thinking"
);
bubble.textContent =
  "Ошибка: " +
  error.message;

}

sendButton.disabled =
false;

input.focus();

scrollToBottom();

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
document.createElement(
“div”
);

message.className =
message message-${role};

const bubble =
document.createElement(
“div”
);

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
// TEXTAREA
// =========================

function resizeInput() {

input.style.height =
“auto”;

input.style.height =
Math.min(
input.scrollHeight,
180
) + “px”;

}

// =========================
// SIDEBAR
// =========================

function closeSidebar() {

sidebar.classList.remove(
“open”
);

}

function openSidebar() {

sidebar.classList.add(
“open”
);

}

function toggleSidebar() {

sidebar.classList.toggle(
“open”
);

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

mobileMenu.addEventListener(
“click”,
toggleSidebar
);

// =========================
// CLOSE BUTTON
// =========================

// Если кнопка × появится
// в HTML — она автоматически
// будет работать.

const closeMenuButton =
document.getElementById(
“closeMenu”
);

if (closeMenuButton) {

closeMenuButton.addEventListener(
“click”,
closeSidebar
);

}

// =========================
// EXIT BUTTON
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

input.focus();
