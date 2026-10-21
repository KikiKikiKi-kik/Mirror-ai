const STORAGE_KEY = “mirror_chats_v1”;

const messagesEl = document.getElementById(“messages”);
const messageInput = document.getElementById(“messageInput”);
const sendButton = document.getElementById(“sendButton”);

const imageButton = document.getElementById(“imageButton”);
const imageInput = document.getElementById(“imageInput”);
const imagePreview = document.getElementById(“imagePreview”);
const previewImage = document.getElementById(“previewImage”);
const removeImage = document.getElementById(“removeImage”);

const historyList = document.getElementById(“historyList”);

const newChatButton = document.getElementById(“newChat”);
const codeModeButton = document.getElementById(“codeMode”);

const modeIndicator = document.getElementById(“modeIndicator”);

const mobileMenu = document.getElementById(“mobileMenu”);
const closeMenu = document.getElementById(“closeMenu”);
const exitButton = document.getElementById(“exitButton”);
const sidebar = document.getElementById(“sidebar”);

let chats = loadChats();

let currentChatId = null;

let selectedImage = null;

let codeMode = false;

let generating = false;

/* =========================
STORAGE
========================= */

function loadChats() {
try {
const saved = localStorage.getItem(STORAGE_KEY);

if (!saved) {
  return [];
}
const parsed = JSON.parse(saved);
if (!Array.isArray(parsed)) {
  return [];
}
return parsed;

} catch (error) {
console.error(“Не удалось загрузить чаты:”, error);
return [];
}
}

function saveChats() {
try {
localStorage.setItem(
STORAGE_KEY,
JSON.stringify(chats)
);
} catch (error) {
console.error(“Не удалось сохранить чаты:”, error);
}
}

/* =========================
CHAT
========================= */

function createChat() {

const chat = {
id: Date.now().toString(),
title: “Новый чат”,
messages: [],
createdAt: Date.now()
};

chats.unshift(chat);

currentChatId = chat.id;

saveChats();

renderHistory();

renderChat();

closeSidebar();

messageInput.focus();
}

function getCurrentChat() {
return chats.find(
chat => chat.id === currentChatId
);
}

function ensureChat() {

if (currentChatId && getCurrentChat()) {
return getCurrentChat();
}

createChat();

return getCurrentChat();
}

/* =========================
RENDER HISTORY
========================= */

function renderHistory() {

historyList.innerHTML = “”;

if (chats.length === 0) {
return;
}

chats.forEach(chat => {

const item = document.createElement("button");
item.type = "button";
item.className = "history-item";
if (chat.id === currentChatId) {
  item.classList.add("active");
}
item.textContent =
  chat.title || "Новый чат";
item.addEventListener(
  "click",
  () => openChat(chat.id)
);
historyList.appendChild(item);

});
}

/* =========================
OPEN CHAT
========================= */

function openChat(id) {

const chat = chats.find(
item => item.id === id
);

if (!chat) {
return;
}

currentChatId = id;

renderHistory();

renderChat();

closeSidebar();

messageInput.focus();
}

/* =========================
RENDER CHAT
========================= */

function renderChat() {

messagesEl.innerHTML = “”;

const chat = getCurrentChat();

if (!chat || chat.messages.length === 0) {

const welcome = document.createElement("div");
welcome.className = "welcome";
welcome.innerHTML = `
  <div class="welcome-mark">M</div>
  <h1>Чем могу помочь?</h1>
  <p>Напиши сообщение Mirror</p>
`;
messagesEl.appendChild(welcome);
return;

}

chat.messages.forEach(message => {

addMessage(
  message.role,
  message.content || "",
  false,
  message.image || null
);

});

scrollToBottom();
}

/* =========================
ADD MESSAGE
========================= */

function addMessage(
role,
content,
scroll = true,
image = null
) {

const wrapper =
document.createElement(“div”);

wrapper.className =
message ${role};

const contentEl =
document.createElement(“div”);

contentEl.className =
“message-content”;

if (image) {

const img =
  document.createElement("img");
img.className =
  "message-image";
img.src = image;
img.alt =
  "Изображение";
contentEl.appendChild(img);

}

if (content) {

const textEl =
  document.createElement("div");
textEl.innerHTML =
  formatText(content);
contentEl.appendChild(textEl);

}

wrapper.appendChild(contentEl);

messagesEl.appendChild(wrapper);

if (scroll) {
scrollToBottom();
}

return wrapper;
}

/* =========================
TEXT / MARKDOWN
========================= */

function escapeHtml(text) {

return text
.replace(/&/g, “&”)
.replace(/</g, “<”)
.replace(/>/g, “>”)
.replace(/”/g, “"”)
.replace(/’/g, “'”);
}

function formatText(text) {

let result = escapeHtml(
String(text)
);

result = result.replace(
/([\s\S]*?)/g,
(_, code) => {

  const safeCode =
    code
      .replace(/^\w+\n/, "")
      .trim();
  return `
    <div class="code-block">
      <button
        class="copy-code"
        type="button"
        onclick="copyCode(this)"
      >
        Копировать
      </button>
      <pre>${safeCode}</pre>
    </div>
  `;
}

);

result = result.replace(
/**(.*?)**/g,
“$1”
);

result = result.replace(
/\n/g,
“”
);

return result;
}

window.copyCode = function(button) {

const pre =
button.parentElement.querySelector(
“pre”
);

if (!pre) {
return;
}

navigator.clipboard
.writeText(pre.innerText)
.then(() => {

  const old =
    button.textContent;
  button.textContent =
    "Скопировано";
  setTimeout(() => {
    button.textContent = old;
  }, 1200);
})
.catch(() => {});

};

/* =========================
THINKING
========================= */

function showThinking() {

const wrapper =
document.createElement(“div”);

wrapper.className =
“message assistant thinking-message”;

wrapper.id =
“thinkingMessage”;

const content =
document.createElement(“div”);

content.className =
“message-content”;

content.innerHTML = <span class="thinking-text"> Думаю<span class="thinking-dots">...</span> </span>;

wrapper.appendChild(content);

messagesEl.appendChild(wrapper);

scrollToBottom();
}

function removeThinking() {

const thinking =
document.getElementById(
“thinkingMessage”
);

if (thinking) {
thinking.remove();
}
}

/* =========================
IMAGE
========================= */

imageButton.addEventListener(
“click”,
() => {

if (generating) {
  return;
}
imageInput.click();

}
);

imageInput.addEventListener(
“change”,
() => {

const file =
  imageInput.files &&
  imageInput.files[0];
if (!file) {
  return;
}
const allowed = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif"
];
if (
  file.type &&
  !allowed.includes(file.type)
) {
  alert(
    "Выбери PNG, JPG, WEBP, HEIC или HEIF."
  );
  imageInput.value = "";
  return;
}
const reader =
  new FileReader();
reader.onload = () => {
  selectedImage =
    reader.result;
  previewImage.src =
    selectedImage;
  imagePreview.classList.add(
    "show"
  );
  messageInput.focus();
};
reader.onerror = () => {
  alert(
    "Не удалось прочитать изображение."
  );
  selectedImage = null;
  imageInput.value = "";
};
reader.readAsDataURL(file);

}
);

removeImage.addEventListener(
“click”,
() => {

selectedImage = null;
imageInput.value = "";
previewImage.src = "";
imagePreview.classList.remove(
  "show"
);
messageInput.focus();

}
);

/* =========================
SEND
========================= */

async function sendMessage() {

if (generating) {
return;
}

const text =
messageInput.value.trim();

if (!text && !selectedImage) {
return;
}

const chat =
ensureChat();

const imageForMessage =
selectedImage;

/*
Сохраняем предыдущую историю.

Картинки тоже передаём,
чтобы Mirror мог помнить
изображения из этого чата.

*/

const conversationHistory =
chat.messages
.slice(-30)
.map(item => ({
role: item.role,
content: item.content || “”,
image: item.image || null
}));

chat.messages.push({
role: “user”,
content: text,
image: imageForMessage || null
});

if (
chat.title === “Новый чат”
) {

const titleSource =
  text ||
  "Изображение";
chat.title =
  titleSource.length > 35
    ? titleSource.slice(0, 35) + "..."
    : titleSource;

}

saveChats();

renderHistory();

messageInput.value = “”;

autoResize();

selectedImage = null;

imageInput.value = “”;

previewImage.src = “”;

imagePreview.classList.remove(
“show”
);

addMessage(
“user”,
text,
true,
imageForMessage || null
);

showThinking();

generating = true;

sendButton.disabled = true;

imageButton.disabled = true;

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
      body: JSON.stringify({
        message: text,
        mode:
          codeMode
            ? "code"
            : "normal",
        image:
          imageForMessage || null,
        history:
          conversationHistory
      })
    }
  );
if (!response.ok) {
  const errorText =
    await response.text();
  throw new Error(
    errorText ||
    `Ошибка ${response.status}`
  );
}
removeThinking();
const assistantWrapper =
  addMessage(
    "assistant",
    "",
    true
  );
const assistantContent =
  assistantWrapper.querySelector(
    ".message-content"
  );
let fullText = "";
const reader =
  response.body.getReader();
const decoder =
  new TextDecoder();
while (true) {
  const {
    value,
    done
  } = await reader.read();
  if (done) {
    break;
  }
  const chunk =
    decoder.decode(
      value,
      { stream: true }
    );
  fullText += chunk;
  assistantContent.innerHTML =
    formatText(fullText);
  scrollToBottom();
}
/*
  Сохраняем ответ Mirror
  в текущий чат.
*/
chat.messages.push({
  role: "assistant",
  content: fullText,
  image: null
});
saveChats();
renderHistory();

} catch (error) {

console.error(error);
removeThinking();
const errorMessage =
  "Ошибка: " +
  (
    error.message ||
    "Не удалось получить ответ."
  );
addMessage(
  "assistant",
  errorMessage,
  true
);
chat.messages.push({
  role: "assistant",
  content: errorMessage,
  image: null
});
saveChats();

} finally {

generating = false;
sendButton.disabled = false;
imageButton.disabled = false;
messageInput.focus();

}
}

/* =========================
ENTER
========================= */

messageInput.addEventListener(
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

sendButton.addEventListener(
“click”,
sendMessage
);

/* =========================
AUTO RESIZE
========================= */

function autoResize() {

messageInput.style.height =
“auto”;

messageInput.style.height =
Math.min(
messageInput.scrollHeight,
180
) + “px”;
}

messageInput.addEventListener(
“input”,
autoResize
);

/* =========================
CODE MODE
========================= */

codeModeButton.addEventListener(
“click”,
() => {

codeMode =
  !codeMode;
modeIndicator.classList.toggle(
  "show",
  codeMode
);
codeModeButton.classList.toggle(
  "active",
  codeMode
);

}
);

/* =========================
MOBILE MENU
========================= */

function openSidebar() {
sidebar.classList.add(“open”);
}

function closeSidebar() {
sidebar.classList.remove(“open”);
}

mobileMenu.addEventListener(
“click”,
openSidebar
);

closeMenu.addEventListener(
“click”,
closeSidebar
);

exitButton.addEventListener(
“click”,
closeSidebar
);

/* =========================
NEW CHAT
========================= */

newChatButton.addEventListener(
“click”,
createChat
);

/* =========================
SCROLL
========================= */

function scrollToBottom() {

requestAnimationFrame(() => {

messagesEl.scrollTop =
  messagesEl.scrollHeight;

});
}

/* =========================
START
========================= */

if (chats.length > 0) {

currentChatId =
chats[0].id;

renderHistory();

renderChat();

} else {

renderHistory();

}

autoResize();
