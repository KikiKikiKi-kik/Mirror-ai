const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const newChatButton = document.getElementById("newChat");
const historyList = document.getElementById("historyList");
const welcome = document.getElementById("welcome");
const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.querySelector(".sidebar");

let currentChat = [];
let chats = [];


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

  const text = input.value.trim();

  if (!text) return;

  input.value = "";
  resizeInput();

  welcome.style.display = "none";

  addMessage("user", text);

  currentChat.push({
    role: "user",
    content: text
  });

  sendButton.disabled = true;

  const loading = addMessage(
    "mirror",
    "Thinking..."
  );

  try {

    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: text
      })
    });


    const data = await response.json();


    if (!response.ok) {
  throw new Error(JSON.stringify(data, null, 2));
}


    loading.querySelector(".bubble").textContent =
      data.answer;


    currentChat.push({
      role: "mirror",
      content: data.answer
    });


    updateHistory(text);


  } catch (error) {

    console.error(error);

    loading.querySelector(".bubble").textContent =
  `Ошибка: ${error.message}`;

  }


  sendButton.disabled = false;

  scrollToBottom();
}


/* =========================
   ADD MESSAGE
========================= */

function addMessage(role, text) {

  const message = document.createElement("div");

  message.className =
    `message message-${role}`;


  const bubble = document.createElement("div");

  bubble.className = "bubble";

  bubble.textContent = text;


  message.appendChild(bubble);

  messages.appendChild(message);


  scrollToBottom();


  return message;
}


/* =========================
   SCROLL
========================= */

function scrollToBottom() {

  requestAnimationFrame(() => {

    messages.scrollTo({
      top: messages.scrollHeight,
      behavior: "smooth"
    });

  });

}


/* =========================
   NEW CHAT
========================= */

function newChat() {

  currentChat = [];

  messages.innerHTML = "";

  const newWelcome =
    document.createElement("div");

  newWelcome.className = "welcome";

  newWelcome.id = "welcome";

  newWelcome.innerHTML = `
    <div class="welcome-mark">M</div>

    <h1>How can I help you?</h1>
  `;

  messages.appendChild(newWelcome);

  input.value = "";

  resizeInput();

  input.focus();
}


newChatButton.addEventListener(
  "click",
  newChat
);


/* =========================
   HISTORY
========================= */

function updateHistory(text) {

  const title =
    text.length > 30
      ? text.substring(0, 30) + "..."
      : text;


  if (historyList.children.length === 0) {

    const item =
      document.createElement("div");

    item.className = "history-item";

    item.textContent = title;

    historyList.appendChild(item);

  }

}


/* =========================
   ENTER
========================= */

input.addEventListener(
  "keydown",
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


/* =========================
   AUTO RESIZE
========================= */

input.addEventListener(
  "input",
  resizeInput
);


function resizeInput() {

  input.style.height = "auto";

  input.style.height =
    Math.min(input.scrollHeight, 180) + "px";

}


/* =========================
   SEND BUTTON
========================= */

sendButton.addEventListener(
  "click",
  sendMessage
);


/* =========================
   MOBILE MENU
========================= */

mobileMenu.addEventListener(
  "click",
  () => {

    sidebar.classList.toggle("open");

  }
);


/* =========================
   START
========================= */

input.focus();
