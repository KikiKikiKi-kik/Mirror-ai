const sidebar = document.querySelector(".sidebar");
const mobileMenu = document.getElementById("mobileMenu");
const closeMenu = document.getElementById("closeMenu");

const newChatButton = document.getElementById("newChat");
const codeModeButton = document.getElementById("codeMode");
const exitButton = document.getElementById("exitButton");

const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const historyList = document.getElementById("historyList");

const mobileTitle = document.getElementById("mobileTitle");
const modeIndicator = document.getElementById("modeIndicator");

const STORAGE_KEY = "mirror_chats_v1";

let chats = [];
let currentChatId = null;
let isGenerating = false;
let codeMode = false;


/* =========================
   ЧАТЫ
========================= */

function loadChats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      chats = JSON.parse(saved);
    }

    if (!Array.isArray(chats)) {
      chats = [];
    }

  } catch (error) {
    console.error("Ошибка загрузки чатов:", error);
    chats = [];
  }
}


function saveChats() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chats)
    );
  } catch (error) {
    console.error("Ошибка сохранения чатов:", error);
  }
}


function getCurrentChat() {
  return chats.find(
    chat => chat.id === currentChatId
  );
}


/* =========================
   МЕНЮ
========================= */

function closeSidebar() {
  sidebar.classList.remove("open");
}


function toggleSidebar() {
  sidebar.classList.toggle("open");
}


/* =========================
   ИСТОРИЯ
========================= */

function renderHistory() {

  historyList.innerHTML = "";

  [...chats].reverse().forEach(chat => {

    const item = document.createElement("div");

    item.className = "history-item";

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
   ПРИВЕТСТВИЕ
========================= */

function showWelcome() {

  messages.innerHTML = "";

  const welcome = document.createElement("div");

  welcome.className = "welcome";


  if (codeMode) {

    welcome.innerHTML = `
      <div class="welcome-mark">&lt;/&gt;</div>

      <h1>Mirror Code</h1>

      <p>
        Чем помочь с кодом?
      </p>
    `;

  } else {

    welcome.innerHTML = `
      <div class="welcome-mark">M</div>

      <h1>Чем могу помочь?</h1>

      <p>
        Напиши сообщение Mirror
      </p>
    `;
  }


  messages.appendChild(welcome);
}


/* =========================
   CODE MODE
========================= */

function updateModeUI() {

  if (codeMode) {

    codeModeButton.classList.add("active");

    modeIndicator.classList.add("show");

    input.placeholder =
      "Сообщение Mirror Code";

    mobileTitle.textContent =
      "Mirror Code";

  } else {

    codeModeButton.classList.remove("active");

    modeIndicator.classList.remove("show");

    input.placeholder =
      "Сообщение Mirror";

    mobileTitle.textContent =
      "Mirror";
  }
}


function toggleCodeMode() {

  codeMode = !codeMode;

  currentChatId = null;

  input.value = "";

  resizeInput();

  updateModeUI();

  showWelcome();

  closeSidebar();

  input.focus();
}


/* =========================
   НОВЫЙ ЧАТ
========================= */

function newChat() {

  currentChatId = null;

  input.value = "";

  resizeInput();

  showWelcome();

  closeSidebar();

  input.focus();
}


/* =========================
   СОЗДАНИЕ ЧАТА
========================= */

function createChat(firstMessage) {

  const chat = {

    id: Date.now().toString(),

    title:
      firstMessage.length > 40
        ? firstMessage.slice(0, 40) + "..."
        : firstMessage,

    mode:
      codeMode
        ? "code"
        : "normal",

    messages: []
  };


  chats.push(chat);

  currentChatId = chat.id;

  saveChats();

  renderHistory();

  return chat;
}


/* =========================
   ОТКРЫТЬ ЧАТ
========================= */

function openChat(chatId) {

  const chat = chats.find(
    item => item.id === chatId
  );

  if (!chat) {
    return;
  }


  currentChatId = chat.id;


  codeMode =
    chat.mode === "code";


  updateModeUI();


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

  input.focus();
}


/* =========================
   СООБЩЕНИЕ
========================= */

function addMessage(
  role,
  text,
  scroll = true
) {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message " +
    (
      role === "user"
        ? "user"
        : "assistant"
    );


  const content =
    document.createElement("div");

  content.className =
    "message-content";


  if (role === "assistant") {

    renderMarkdown(
      content,
      text
    );

  } else {

    content.textContent = text;
  }


  wrapper.appendChild(content);

  messages.appendChild(wrapper);


  if (scroll) {
    scrollToBottom();
  }


  return content;
}


/* =========================
   MARKDOWN
========================= */

function renderMarkdown(element, text) {

  let html =
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");


  /* Блоки кода */

  html = html.replace(
    /```([\w+-]*)\n([\s\S]*?)```/g,
    (match, language, code) => {

      return `
        <pre class="code-block">
          <div class="code-header">
            <span>${language || "code"}</span>
          </div>
          <code>${code}</code>
        </pre>
      `;
    }
  );


  /* Жирный */

  html = html.replace(
    /\*\*(.+?)\*\*/g,
    "<strong>$1</strong>"
  );


  html = html.replace(
    /__(.+?)__/g,
    "<strong>$1</strong>"
  );


  /* Курсив */

  html = html.replace(
    /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
    "<em>$1</em>"
  );


  /* Код внутри строки */

  html = html.replace(
    /`([^`\n]+)`/g,
    "<code class=\"inline-code\">$1</code>"
  );


  /* Заголовки */

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


  /* Списки */

  html = html.replace(
    /^- (.+)$/gm,
    "• $1"
  );


  /* Переносы */

  html = html.replace(
    /\n/g,
    "<br>"
  );


  element.innerHTML = html;
}


/* =========================
   ОТПРАВКА
========================= */

async function sendMessage() {

  if (isGenerating) {
    return;
  }


  const text =
    input.value.trim();


  if (!text) {
    return;
  }


  await sendChatMessage(text);
}


/* =========================
   ЗАПРОС К MIRROR
========================= */

async function sendChatMessage(text) {

  isGenerating = true;

  sendButton.disabled = true;

  input.value = "";

  resizeInput();


  if (!currentChatId) {

    showWelcome();

    createChat(text);
  }


  const chat = getCurrentChat();


  if (!chat) {

    isGenerating = false;

    sendButton.disabled = false;

    return;
  }


  chat.messages.push({
    role: "user",
    content: text
  });


  saveChats();


  addMessage(
    "user",
    text
  );


  const assistantElement =
    addMessage(
      "assistant",
      "",
      true
    );


  let fullResponse = "";


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

              message: text,

              mode:
                codeMode
                  ? "code"
                  : "normal"

            })
        }
      );


    if (!response.ok) {

      let errorText =
        "Ошибка сервера";


      try {

        const errorData =
          await response.json();

        errorText =
          errorData.error ||
          errorText;

      } catch {}


      throw new Error(
        errorText
      );
    }


    if (!response.body) {

      throw new Error(
        "Сервер не вернул ответ"
      );
    }


    const reader =
      response.body.getReader();


    const decoder =
      new TextDecoder("utf-8");


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


      fullResponse += chunk;


      renderMarkdown(
        assistantElement,
        fullResponse
      );


      scrollToBottom();
    }


    chat.messages.push({
      role: "assistant",
      content: fullResponse
    });


    saveChats();

    renderHistory();


  } catch (error) {

    console.error(
      "Mirror error:",
      error
    );


    renderMarkdown(
      assistantElement,

      "Ошибка: " +
      (
        error.message ||
        "не удалось получить ответ"
      )
    );


  } finally {

    isGenerating = false;

    sendButton.disabled = false;

    input.focus();

    scrollToBottom();
  }
}


/* =========================
   TEXTAREA
========================= */

function resizeInput() {

  input.style.height = "auto";

  input.style.height =
    Math.min(
      input.scrollHeight,
      140
    ) + "px";
}


/* =========================
   ПРОКРУТКА
========================= */

function scrollToBottom() {

  messages.scrollTop =
    messages.scrollHeight;
}


/* =========================
   СОБЫТИЯ
========================= */

mobileMenu.addEventListener(
  "click",
  toggleSidebar
);


closeMenu.addEventListener(
  "click",
  closeSidebar
);


newChatButton.addEventListener(
  "click",
  newChat
);


codeModeButton.addEventListener(
  "click",
  toggleCodeMode
);


exitButton.addEventListener(
  "click",
  closeSidebar
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


/* =========================
   ЗАПУСК
========================= */

loadChats();

renderHistory();

updateModeUI();

showWelcome();

resizeInput();
