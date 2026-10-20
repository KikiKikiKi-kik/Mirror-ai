const sidebar = document.querySelector(".sidebar");
const mobileMenu = document.getElementById("mobileMenu");
const closeMenu = document.getElementById("closeMenu");

const newChatButton = document.getElementById("newChat");
const imageModeButton = document.getElementById("imageMode");
const exitButton = document.getElementById("exitButton");

const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const historyList = document.getElementById("historyList");

const imagePanel = document.getElementById("imagePanel");

const STORAGE_KEY = "mirror_chats_v1";

let chats = [];
let currentChatId = null;
let isGenerating = false;
let imageMode = false;


/* =========================
   ЧАТЫ
========================= */

function loadChats() {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (saved) {
      chats = JSON.parse(saved);
    }

    if (!Array.isArray(chats)) {
      chats = [];
    }

  } catch (error) {
    console.error(
      "Ошибка загрузки чатов:",
      error
    );

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
    console.error(
      "Ошибка сохранения чатов:",
      error
    );
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

function openSidebar() {
  sidebar.classList.add("open");
}


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

  const sortedChats =
    [...chats].reverse();

  sortedChats.forEach(chat => {

    const item =
      document.createElement("div");

    item.className =
      "history-item";

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

  const welcome =
    document.createElement("div");

  welcome.className =
    "welcome";

  welcome.innerHTML = `
    <div class="welcome-mark">M</div>

    <h1>Чем могу помочь?</h1>

    <p>
      Напиши сообщение или создай изображение
    </p>
  `;

  messages.appendChild(welcome);
}


/* =========================
   НОВЫЙ ЧАТ
========================= */

function newChat() {

  currentChatId = null;

  imageMode = false;

  imagePanel.classList.remove("show");

  imageModeButton.classList.remove("active");

  input.placeholder =
    "Сообщение Mirror";

  input.value = "";

  showWelcome();

  resizeInput();

  closeSidebar();

  input.focus();
}


/* =========================
   СОЗДАНИЕ ЧАТА
========================= */

function createChat(firstMessage) {

  const chat = {

    id:
      Date.now().toString(),

    title:
      firstMessage.length > 40
        ? firstMessage.slice(0, 40) + "..."
        : firstMessage,

    messages: []
  };

  chats.push(chat);

  currentChatId =
    chat.id;

  saveChats();

  renderHistory();

  return chat;
}


/* =========================
   ОТКРЫТЬ ЧАТ
========================= */

function openChat(chatId) {

  const chat =
    chats.find(
      item => item.id === chatId
    );

  if (!chat) {
    return;
  }

  currentChatId =
    chat.id;

  imageMode = false;

  imagePanel.classList.remove("show");

  imageModeButton.classList.remove("active");

  input.placeholder =
    "Сообщение Mirror";

  messages.innerHTML = "";


  chat.messages.forEach(
    message => {

      if (message.type === "image") {

        addImageMessage(
          message.prompt,
          message.image,
          false
        );

      } else {

        addMessage(
          message.role,
          message.content,
          false
        );
      }
    }
  );


  closeSidebar();

  scrollToBottom();
}


/* =========================
   ДОБАВИТЬ СООБЩЕНИЕ
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

    content.textContent =
      text;
  }


  wrapper.appendChild(content);

  messages.appendChild(wrapper);


  if (scroll) {
    scrollToBottom();
  }


  return content;
}


/* =========================
   ДОБАВИТЬ КАРТИНКУ
========================= */

function addImageMessage(
  prompt,
  imageData,
  scroll = true
) {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message assistant image-message";


  const title =
    document.createElement("div");

  title.className =
    "image-title";

  title.textContent =
    "🖼️ " + prompt;


  wrapper.appendChild(title);


  const image =
    document.createElement("img");

  image.className =
    "generated-image";

  image.src =
    imageData;

  image.alt =
    prompt;


  wrapper.appendChild(image);


  const download =
    document.createElement("a");

  download.className =
    "download-image";

  download.textContent =
    "↓ Сохранить изображение";

  download.href =
    imageData;

  download.download =
    "mirror-image.png";


  wrapper.appendChild(download);

  messages.appendChild(wrapper);


  if (scroll) {
    scrollToBottom();
  }
}


/* =========================
   MARKDOWN
========================= */

function renderMarkdown(
  element,
  text
) {

  let html =
    text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");


  html =
    html.replace(
      /\*\*(.+?)\*\*/g,
      "<strong>$1</strong>"
    );


  html =
    html.replace(
      /__(.+?)__/g,
      "<strong>$1</strong>"
    );


  html =
    html.replace(
      /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
      "<em>$1</em>"
    );


  html =
    html.replace(
      /`([^`\n]+)`/g,
      "<code>$1</code>"
    );


  html =
    html.replace(
      /^### (.+)$/gm,
      "<h3>$1</h3>"
    );


  html =
    html.replace(
      /^## (.+)$/gm,
      "<h2>$1</h2>"
    );


  html =
    html.replace(
      /^# (.+)$/gm,
      "<h1>$1</h1>"
    );


  html =
    html.replace(
      /^- (.+)$/gm,
      "• $1"
    );


  html =
    html.replace(
      /\n/g,
      "<br>"
    );


  element.innerHTML =
    html;
}


/* =========================
   ОТПРАВКА СООБЩЕНИЯ
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


  if (imageMode) {

    await generateImage(text);

    return;
  }


  await sendChatMessage(text);
}


/* =========================
   ОБЫЧНЫЙ ЧАТ
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


  const chat =
    getCurrentChat();


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
              message: text
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


      fullResponse +=
        chunk;


      renderMarkdown(
        assistantElement,
        fullResponse
      );


      scrollToBottom();
    }


    chat.messages.push({

      role:
        "assistant",

      content:
        fullResponse
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
   ОПРЕДЕЛЕНИЕ РАЗМЕРА
========================= */

function detectAspectRatio(text) {

  const prompt =
    text.toLowerCase();


  /* Явно указанный формат */

  if (
    /9\s*[:xх]\s*16/.test(prompt)
  ) {
    return "9:16";
  }


  if (
    /16\s*[:xх]\s*9/.test(prompt)
  ) {
    return "16:9";
  }


  if (
    /1\s*[:xх]\s*1/.test(prompt)
  ) {
    return "1:1";
  }


  if (
    /3\s*[:xх]\s*4/.test(prompt)
  ) {
    return "3:4";
  }


  if (
    /4\s*[:xх]\s*3/.test(prompt)
  ) {
    return "4:3";
  }


  if (
    /2\s*[:xх]\s*3/.test(prompt)
  ) {
    return "2:3";
  }


  if (
    /3\s*[:xх]\s*2/.test(prompt)
  ) {
    return "3:2";
  }


  if (
    /4\s*[:xх]\s*5/.test(prompt)
  ) {
    return "4:5";
  }


  if (
    /5\s*[:xх]\s*4/.test(prompt)
  ) {
    return "5:4";
  }


  if (
    /21\s*[:xх]\s*9/.test(prompt)
  ) {
    return "21:9";
  }


  /* Вертикальное */

  if (
    prompt.includes("вертикальн") ||
    prompt.includes("сторис") ||
    prompt.includes("сториз") ||
    prompt.includes("для телефона") ||
    prompt.includes("на телефон") ||
    prompt.includes("для тиктока") ||
    prompt.includes("для tiktok") ||
    prompt.includes("для shorts") ||
    prompt.includes("для short") ||
    prompt.includes("для reels") ||
    prompt.includes("для instagram")
  ) {
    return "9:16";
  }


  /* Горизонтальное */

  if (
    prompt.includes("горизонтальн") ||
    prompt.includes("широкоформат") ||
    prompt.includes("для ютуба") ||
    prompt.includes("для youtube") ||
    prompt.includes("обложка youtube") ||
    prompt.includes("баннер")
  ) {
    return "16:9";
  }


  /* Портрет */

  if (
    prompt.includes("портрет") ||
    prompt.includes("портретное фото")
  ) {
    return "4:5";
  }


  /* По умолчанию */

  return "1:1";
}


/* =========================
   ГЕНЕРАЦИЯ ИЗОБРАЖЕНИЯ
========================= */

async function generateImage(prompt) {

  isGenerating = true;

  sendButton.disabled = true;

  input.value = "";

  resizeInput();


  const loading =
    document.createElement("div");

  loading.className =
    "message assistant image-loading";


  loading.innerHTML = `
    <div class="loading-spinner"></div>
    <div>Создаю изображение…</div>
  `;


  messages.appendChild(loading);

  scrollToBottom();


  try {

    const aspectRatio =
      detectAspectRatio(prompt);


    const response =
      await fetch(
        "/api/image",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              prompt: prompt,
              aspectRatio: aspectRatio
            })
        }
      );


    if (!response.ok) {

      let errorText =
        "Не удалось создать изображение";


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


    const data =
      await response.json();


    loading.remove();


    if (!data.image) {

      throw new Error(
        "Модель не вернула изображение"
      );
    }


    const imageData =
      data.image.startsWith("data:")
        ? data.image
        : `data:${
            data.mimeType ||
            "image/png"
          };base64,${data.image}`;


    addImageMessage(
      prompt,
      imageData
    );


    if (!currentChatId) {

      createChat(
        "🖼️ " + prompt
      );
    }


    const chat =
      getCurrentChat();


    if (chat) {

      chat.messages.push({

        type:
          "image",

        prompt:
          prompt,

        image:
          imageData
      });


      saveChats();

      renderHistory();
    }


  } catch (error) {

    loading.remove();


    addMessage(
      "assistant",

      "Ошибка генерации: " +
      (
        error.message ||
        "неизвестная ошибка"
      )
    );


    console.error(
      "Image error:",
      error
    );


  } finally {

    isGenerating = false;

    sendButton.disabled = false;

    input.focus();

    scrollToBottom();
  }
}


/* =========================
   РЕЖИМ ИЗОБРАЖЕНИЙ
========================= */

function toggleImageMode() {

  imageMode =
    !imageMode;


  if (imageMode) {

    imagePanel.classList.add(
      "show"
    );

    imageModeButton.classList.add(
      "active"
    );

    input.placeholder =
      "Опишите изображение…";

    input.focus();

  } else {

    imagePanel.classList.remove(
      "show"
    );

    imageModeButton.classList.remove(
      "active"
    );

    input.placeholder =
      "Сообщение Mirror";

    input.focus();
  }
}


/* =========================
   РАЗМЕР ПОЛЯ
========================= */

function resizeInput() {

  input.style.height =
    "auto";

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
   КНОПКИ
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


imageModeButton.addEventListener(
  "click",
  toggleImageMode
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

showWelcome();

resizeInput();
