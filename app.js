const STORAGE_KEY = “mirror_chats_v1”;

const $ = id => document.getElementById(id);

const messages = $(“messages”);
const input = $(“messageInput”);
const sendButton = $(“sendButton”);

const imageButton = $(“imageButton”);
const imageInput = $(“imageInput”);
const imagePreview = $(“imagePreview”);
const previewImage = $(“previewImage”);
const removeImage = $(“removeImage”);

const historyList = $(“historyList”);

const sidebar = $(“sidebar”);
const mobileMenu = $(“mobileMenu”);
const closeMenu = $(“closeMenu”);
const exitButton = $(“exitButton”);

const newChatButton = $(“newChat”);
const codeModeButton = $(“codeMode”);
const modeIndicator = $(“modeIndicator”);

let chats = loadChats();
let currentChatId = null;
let selectedImage = null;
let codeMode = false;
let generating = false;

/* STORAGE */

function loadChats() {
try {
const data = localStorage.getItem(STORAGE_KEY);
const parsed = data ? JSON.parse(data) : [];

return Array.isArray(parsed) ? parsed : [];

} catch {
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
console.error(“Ошибка сохранения:”, error);
}
}

function getChat() {
return chats.find(
chat => chat.id === currentChatId
);
}

/* HISTORY */

function renderHistory() {

historyList.innerHTML = “”;

chats.forEach(chat => {

const button =
  document.createElement("button");
button.type = "button";
button.className = "history-item";
if (chat.id === currentChatId) {
  button.classList.add("active");
}
button.textContent =
  chat.title || "Новый чат";
button.onclick = () => {
  openChat(chat.id);
};
historyList.appendChild(button);

});
}

/* CHAT */

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

input.focus();
}

function openChat(id) {

const chat =
chats.find(item => item.id === id);

if (!chat) return;

currentChatId = id;

renderHistory();
renderChat();

closeSidebar();

input.focus();
}

function ensureChat() {

let chat = getChat();

if (!chat) {
createChat();
chat = getChat();
}

return chat;
}

function renderChat() {

messages.innerHTML = “”;

const chat = getChat();

if (!chat || !chat.messages.length) {

messages.innerHTML = `
  <div class="welcome">
    <div class="welcome-mark">M</div>
    <h1>Чем могу помочь?</h1>
    <p>Напиши сообщение Mirror</p>
  </div>
`;
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

scrollBottom();
}

/* MESSAGE */

function addMessage(
role,
text,
scroll = true,
image = null
) {

const message =
document.createElement(“div”);

message.className =
message ${role};

const content =
document.createElement(“div”);

content.className =
“message-content”;

if (image) {

const img =
  document.createElement("img");
img.className =
  "message-image";
img.src = image;
img.alt = "Изображение";
content.appendChild(img);

}

if (text) {

const textElement =
  document.createElement("div");
textElement.innerHTML =
  formatText(text);
content.appendChild(textElement);

}

message.appendChild(content);

messages.appendChild(message);

if (scroll) {
scrollBottom();
}

return message;
}

/* TEXT */

function escapeHtml(text) {

return String(text)
.replace(/&/g, “&”)
.replace(/</g, “<”)
.replace(/>/g, “>”)
.replace(/”/g, “"”)
.replace(/’/g, “'”);
}

function formatText(text) {

let result =
escapeHtml(text);

result =
result.replace(
/([\s\S]*?)/g,
(_, code) => {

    code =
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
        <pre>${code}</pre>
      </div>
    `;
  }
);

result =
result.replace(
/**(.*?)**/g,
“$1”
);

return result.replace(
/\n/g,
“”
);
}

window.copyCode = function(button) {

const code =
button.parentElement
.querySelector(“pre”);

if (!code) return;

navigator.clipboard
.writeText(code.innerText)
.then(() => {

  const old =
    button.textContent;
  button.textContent =
    "Скопировано";
  setTimeout(() => {
    button.textContent = old;
  }, 1000);
});

};

/* THINKING */

function showThinking() {

removeThinking();

const element =
document.createElement(“div”);

element.id =
“thinkingMessage”;

element.className =
“message assistant thinking-message”;

element.innerHTML = <div class="message-content"> <span class="thinking-text"> Думаю<span class="thinking-dots">...</span> </span> </div>;

messages.appendChild(element);

scrollBottom();
}

function removeThinking() {

const element =
$(“thinkingMessage”);

if (element) {
element.remove();
}
}

/* IMAGE */

imageButton.onclick = () => {

if (generating) return;

imageInput.click();
};

imageInput.onchange = () => {

const file =
imageInput.files?.[0];

if (!file) return;

if (
file.type &&
!file.type.startsWith(“image/”)
) {

alert("Выбери изображение.");
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
imagePreview.classList.add("show");
input.focus();

};

reader.onerror = () => {

alert(
  "Не удалось загрузить изображение."
);
selectedImage = null;
imageInput.value = "";

};

reader.readAsDataURL(file);
};

removeImage.onclick = () => {

selectedImage = null;

imageInput.value = “”;

previewImage.src = “”;

imagePreview.classList.remove(“show”);

input.focus();
};

/* SEND */

async function sendMessage() {

if (generating) return;

const text =
input.value.trim();

if (!text && !selectedImage) {
return;
}

const chat =
ensureChat();

const image =
selectedImage || null;

/*
ВАЖНО:
Передаём картинки из предыдущих
сообщений тоже.
*/

const history =
chat.messages
.slice(-30)
.map(message => ({
role: message.role,
content: message.content || “”,
image: message.image || null
}));

chat.messages.push({
role: “user”,
content: text,
image: image
});

if (chat.title === “Новый чат”) {

const title =
  text ||
  "Изображение";
chat.title =
  title.length > 35
    ? title.slice(0, 35) + "..."
    : title;

}

saveChats();
renderHistory();

input.value = “”;

resizeInput();

selectedImage = null;

imageInput.value = “”;

previewImage.src = “”;

imagePreview.classList.remove(“show”);

addMessage(
“user”,
text,
true,
image
);

showThinking();

generating = true;

sendButton.disabled = true;
imageButton.disabled = true;

try {

const response =
  await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: text,
      mode:
        codeMode
          ? "code"
          : "normal",
      image: image,
      history: history
    })
  });
if (!response.ok) {
  const error =
    await response.text();
  throw new Error(
    error ||
    `Ошибка ${response.status}`
  );
}
removeThinking();
const assistant =
  addMessage(
    "assistant",
    "",
    true
  );
const content =
  assistant.querySelector(
    ".message-content"
  );
const reader =
  response.body.getReader();
const decoder =
  new TextDecoder();
let answer = "";
while (true) {
  const result =
    await reader.read();
  if (result.done) break;
  answer +=
    decoder.decode(
      result.value,
      { stream: true }
    );
  content.innerHTML =
    formatText(answer);
  scrollBottom();
}
chat.messages.push({
  role: "assistant",
  content: answer,
  image: null
});
saveChats();

} catch (error) {

console.error(error);
removeThinking();
const errorText =
  "Ошибка: " +
  (error.message ||
    "Не удалось получить ответ.");
addMessage(
  "assistant",
  errorText,
  true
);
chat.messages.push({
  role: "assistant",
  content: errorText,
  image: null
});
saveChats();

} finally {

generating = false;
sendButton.disabled = false;
imageButton.disabled = false;
input.focus();

}
}

/* INPUT */

sendButton.onclick =
sendMessage;

input.onkeydown =
event => {

if (
  event.key === "Enter" &&
  !event.shiftKey
) {
  event.preventDefault();
  sendMessage();
}

};

input.oninput =
resizeInput;

function resizeInput() {

input.style.height =
“auto”;

input.style.height =
Math.min(
input.scrollHeight,
130
) + “px”;
}

/* CODE MODE */

codeModeButton.onclick = () => {

codeMode =
!codeMode;

codeModeButton.classList.toggle(
“active”,
codeMode
);

modeIndicator.classList.toggle(
“show”,
codeMode
);
};

/* MENU */

function openSidebar() {
sidebar.classList.add(“open”);
}

function closeSidebar() {
sidebar.classList.remove(“open”);
}

mobileMenu.onclick =
openSidebar;

closeMenu.onclick =
closeSidebar;

exitButton.onclick =
closeSidebar;

/* NEW CHAT */

newChatButton.onclick =
createChat;

/* SCROLL */

function scrollBottom() {

requestAnimationFrame(() => {

messages.scrollTop =
  messages.scrollHeight;

});
}

/* START */

if (chats.length) {

currentChatId =
chats[0].id;

renderHistory();
renderChat();

} else {

renderHistory();
renderChat();

}

resizeInput();
