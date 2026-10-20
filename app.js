const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const newChatButton = document.getElementById("newChat");
const historyList = document.getElementById("historyList");
const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.querySelector(".sidebar");

let currentChat = [];
let currentChatId = null;
let chats = loadChats();


// =========================
// MARKDOWN
// =========================

function renderMarkdown(element, text) {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(
    /\*\*(.+?)\*\*/g,
    "<strong>$1</strong>"
  );

  html = html.replace(
    /__(.+?)__/g,
    "<strong>$1</strong>"
  );

  html = html.replace(
    /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
    "<em>$1</em>"
  );

  html = html.replace(
    /`([^`\n]+)`/g,
    "<code>$1</code>"
  );

  html = html.replace(
    /^### (.+)$/gm,
    "<h3>$1</h3>"
  );

  html = html.replace(
    /^## (.+)$/gm,
    "<h2>$1</h2>"
  );

  html = html.replace(
    /^# (.+)$/gm,
    "<h1>$1</h1>"
  );

  html = html.replace(
    /^- (.+)$/gm,
    "• $1"
  );

  html = html.replace(/\n/g, "<br>");

  element.innerHTML = html;
}


// =========================
// LOCAL STORAGE
// =========================

function loadChats() {
  try {
    const saved = localStorage.getItem("mirror_chats");

    if (!saved) {
      return [];
    }

    return JSON.parse(saved);

  } catch (error) {
    console.error("Failed to load chats:", error);
    return [];
  }
}


function saveChats() {
  localStorage.setItem(
    "mirror_chats",
    JSON.stringify(chats)
  );
}


// =========================
// HISTORY
// =========================

function renderHistory() {

  historyList.innerHTML = "";

  chats.forEach(chat => {

    const item = document.createElement("div");

    item.className = "history-item";

    item.textContent = chat.title;

    item.addEventListener("click", () => {

      openChat(chat.id);

    });

    historyList.appendChild(item);

  });
}


function createChat(title) {

  const chat = {

    id: Date.now().toString(),

    title: title.length > 35
      ? title.substring(0, 35) + "..."
      : title,

    messages: []

  };

  chats.unshift(chat);

  currentChatId = chat.id;

  currentChat = chat.messages;

  saveChats();

  renderHistory();

  return chat;

}


function getCurrentChat() {

  return chats.find(
    chat => chat.id === currentChatId
  );

}


// =========================
// OPEN CHAT
// =========================

function openChat(id) {

  const chat = chats.find(
    item => item.id === id
  );

  if (!chat) {
    return;
  }

  currentChatId = chat.id;

  currentChat = chat.messages;

  messages.innerHTML = "";

  chat.messages.forEach(message => {

    addMessage(
      message.role,
      message.content,
      false
    );

  });

  closeSidebar();

  scrollToBottom();

}


// =========================
// NEW CHAT
// =========================

function newChat() {

  currentChat = [];

  currentChatId = null;

  messages.innerHTML = "";


  const welcome = document.createElement("div");

  welcome.className = "welcome";

  welcome.id = "welcome";

  welcome.innerHTML = `

    <div class="welcome-mark">
      M
    </div>

    <h1>
      Чем могу помочь?
    </h1>

  `;

  messages.appendChild(welcome);


  input.value = "";

  resizeInput();

  closeSidebar();

  input.focus();

}


// =========================
// SEND MESSAGE
// =========================

async function sendMessage() {

  const text = input.value.trim();

  if (!text || sendButton.disabled) {
    return;
  }


  input.value = "";

  resizeInput();


  const welcome =
    document.getElementById("welcome");

  if (welcome) {
    welcome.remove();
  }


  addMessage("user", text);

  sendButton.disabled = true;


  // Создаём чат только после первого сообщения
  if (!currentChatId) {

    createChat(text);

  }


  const chat = getCurrentChat();

  if (chat) {

    chat.messages.push({
      role: "user",
      content: text
    });

    saveChats();

  }


  const loading =
    addMessage("mirror", "");

  const bubble =
    loading.querySelector(".bubble");


  bubble.classList.add("thinking");

  bubble.textContent = "Думаю…";


  try {

    const response = await fetch(
      "/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
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
        "Streaming is not supported"
      );

    }


    const reader =
      response.body.getReader();

    const decoder =
      new TextDecoder("utf-8");


    let answer = "";

    let firstChunk = true;


    while (true) {

      const {
        value,
        done
      } = await reader.read();


      if (done) {
        break;
      }


      const chunk =
        decoder.decode(value, {
          stream: true
        });


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

      answer += lastChunk;

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

    console.error(error);

    bubble.classList.remove(
      "thinking"
    );

    bubble.textContent =
      "Ошибка: " + error.message;

  }


  sendButton.disabled = false;

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
    document.createElement("div");

  message.className =
    `message message-${role}`;


  const bubble =
    document.createElement("div");

  bubble.className = "bubble";


  if (
    role === "mirror" &&
    text
  ) {

    renderMarkdown(
      bubble,
      text
    );

  } else {

    bubble.textContent = text;

  }


  message.appendChild(bubble);

  messages.appendChild(message);


  if (scroll) {
    scrollToBottom();
  }


  return message;

}


// =========================
// SCROLL
// =========================

function scrollToBottom() {

  requestAnimationFrame(() => {

    messages.scrollTo({
      top: messages.scrollHeight,
      behavior: "smooth"
    });

  });

}


// =========================
// TEXTAREA
// =========================

function resizeInput() {

  input.style.height = "auto";

  input.style.height =
    Math.min(
      input.scrollHeight,
      180
    ) + "px";

}


// =========================
// SIDEBAR
// =========================

function closeSidebar() {

  sidebar.classList.remove("open");

}


function toggleSidebar() {

  sidebar.classList.toggle("open");

}


// =========================
// EVENTS
// =========================

newChatButton.addEventListener(
  "click",
  newChat
);


sendButton.addEventListener(
  "click",
  sendMessage
);


input.addEventListener(
  "input",
  resizeInput
);


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


mobileMenu.addEventListener(
  "click",
  toggleSidebar
);


// =========================
// EXIT BUTTON
// =========================

const exitButton =
  document.getElementById("exitButton");

if (exitButton) {

  exitButton.addEventListener(
    "click",
    closeSidebar
  );

}


// =========================
// START
// =========================

renderHistory();

input.focus();
