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

const imageButton = document.getElementById("imageButton");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");
const removeImageButton = document.getElementById("removeImage");


const STORAGE_KEY = "mirror_chats_v1";

let chats = [];
let currentChatId = null;
let isGenerating = false;
let codeMode = false;

let selectedImage = null;


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

  [...chats]
    .reverse()
    .forEach(chat => {

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
   РЕЖИМ CODE
========================= */

function updateModeUI() {

  if (codeMode) {

    codeModeButton.classList.add(
      "active"
    );

    modeIndicator.classList.add(
      "show"
    );

    input.placeholder =
      "Сообщение Mirror Code";

    mobileTitle.textContent =
      "Mirror Code";

  } else {

    codeModeButton.classList.remove(
      "active"
    );

    modeIndicator.classList.remove(
      "show"
    );

    input.placeholder =
      "Сообщение Mirror";

    mobileTitle.textContent =
      "Mirror";
  }
}


function toggleCodeMode() {

  codeMode = !codeMode;

  updateModeUI();

  const chat =
    getCurrentChat();

  if (chat) {

    chat.mode =
      codeMode
        ? "code"
        : "normal";

    saveChats();
  }

  if (!currentChatId) {
    showWelcome();
  }

  input.focus();
}


/* =========================
   НОВЫЙ ЧАТ
========================= */

function newChat() {

  currentChatId = null;

  input.value = "";

  removeSelectedImage();

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

    id:
      Date.now().toString(),

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

  codeMode =
    chat.mode === "code";

  updateModeUI();

  messages.innerHTML = "";

  chat.messages.forEach(
    message => {

      addMessage(
        message.role,
        message.content,
        false,
        message.image || null
      );
    }
  );

  removeSelectedImage();

  closeSidebar();

  scrollToBottom();

  input.focus();
}


/* =========================
   ДОБАВИТЬ СООБЩЕНИЕ
========================= */

function addMessage(
  role,
  text,
  scroll = true,
  image = null
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


  if (image) {

    const img =
      document.createElement("img");

    img.className =
      "message-image";

    img.src =
      image;

    img.alt =
      "Изображение";

    content.appendChild(img);
  }


  if (role === "assistant") {

    const textContainer =
      document.createElement("div");

    renderMarkdown(
      textContainer,
      text || ""
    );

    content.appendChild(
      textContainer
    );

  } else {

    if (text) {

      const textContainer =
        document.createElement("div");

      textContainer.textContent =
        text;

      content.appendChild(
        textContainer
      );
    }
  }


  wrapper.appendChild(
    content
  );

  messages.appendChild(
    wrapper
  );


  if (scroll) {
    scrollToBottom();
  }


  return content;
}


/* =========================
   ЭКРАНИРОВАНИЕ
========================= */

function escapeHtml(text) {

  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


/* =========================
   MARKDOWN
========================= */

function renderMarkdown(
  element,
  text
) {

  const codeBlocks = [];

  let safeText =
    text.replace(
      /```([\w.+-]*)\n?([\s\S]*?)```/g,
      (match, language, code) => {

        const index =
          codeBlocks.length;

        codeBlocks.push({

          language:
            language || "code",

          code:
            code.replace(
              /\n$/,
              ""
            )
        });

        return `@@CODE_BLOCK_${index}@@`;
      }
    );


  let html =
    escapeHtml(
      safeText
    );


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
      "<code class=\"inline-code\">$1</code>"
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


  codeBlocks.forEach(
    (block, index) => {

      const marker =
        `@@CODE_BLOCK_${index}@@`;

      const escapedCode =
        escapeHtml(
          block.code
        );

      const codeHtml = `
        <pre class="code-block">
          <div class="code-header">

            <span>
              ${escapeHtml(block.language)}
            </span>

            <button
              class="copy-code"
              type="button"
              data-code-index="${index}"
            >
              Копировать
            </button>

          </div>

          <code class="code-content">${escapedCode}</code>
        </pre>
      `;

      html =
        html.replace(
          marker,
          codeHtml
        );
    }
  );


  element.innerHTML =
    html;


  const buttons =
    element.querySelectorAll(
      ".copy-code"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        async () => {

          const index =
            Number(
              button.dataset.codeIndex
            );

          const block =
            codeBlocks[index];

          if (!block) {
            return;
          }

          try {

            await navigator.clipboard.writeText(
              block.code
            );

            const oldText =
              button.textContent;

            button.textContent =
              "Скопировано";

            setTimeout(
              () => {
                button.textContent =
                  oldText;
              },
              1500
            );

          } catch {

            const textarea =
              document.createElement(
                "textarea"
              );

            textarea.value =
              block.code;

            document.body.appendChild(
              textarea
            );

            textarea.select();

            try {

              document.execCommand(
                "copy"
              );

              button.textContent =
                "Скопировано";

              setTimeout(
                () => {
                  button.textContent =
                    "Копировать";
                },
                1500
              );

            } catch {

              button.textContent =
                "Не удалось скопировать";
            }

            textarea.remove();
          }
        }
      );
    }
  );
}


/* =========================
   КАРТИНКА
========================= */

imageButton.addEventListener(
  "click",
  () => {

    if (isGenerating) {
      return;
    }

    imageInput.click();
  }
);


imageInput.addEventListener(
  "change",
  () => {

    const file =
      imageInput.files?.[0];

    if (!file) {
      return;
    }


    if (!file.type.startsWith("image/")) {

      alert(
        "Можно выбрать только изображение."
      );

      imageInput.value = "";

      return;
    }


    const reader =
      new FileReader();


    reader.onload = () => {

      selectedImage = {

        name:
          file.name,

        type:
          file.type,

        data:
          reader.result
      };


      previewImage.src =
        reader.result;

      imagePreview.classList.add(
        "show"
      );
    };


    reader.readAsDataURL(file);
  }
);


removeImageButton.addEventListener(
  "click",
  removeSelectedImage
);


function removeSelectedImage() {

  selectedImage =
    null;

  imageInput.value =
    "";

  previewImage.src =
    "";

  imagePreview.classList.remove(
    "show"
  );
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


  if (!text && !selectedImage) {
    return;
  }


  await sendChatMessage(
    text
  );
}


/* =========================
   ЗАПРОС К API
========================= */

async function sendChatMessage(
  text
) {

  isGenerating = true;

  sendButton.disabled =
    true;

  imageButton.disabled =
    true;


  input.value = "";

  resizeInput();


  const imageForMessage =
    selectedImage
      ? selectedImage.data
      : null;


  removeSelectedImage();


  if (!currentChatId) {

    showWelcome();

    createChat(
      text ||
      "Изображение"
    );
  }


  const chat =
    getCurrentChat();


  if (!chat) {

    isGenerating = false;

    sendButton.disabled =
      false;

    imageButton.disabled =
      false;

    return;
  }


  chat.mode =
    codeMode
      ? "code"
      : "normal";


  chat.messages.push({

    role: "user",

    content:
      text,

    image:
      imageForMessage
  });


  saveChats();


  addMessage(
    "user",
    text,
    true,
    imageForMessage
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

              message:
                text,

              mode:
                codeMode
                  ? "code"
                  : "normal",

              image:
                imageForMessage
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
      new TextDecoder(
        "utf-8"
      );


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

      role: "assistant",

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

    isGenerating =
      false;

    sendButton.disabled =
      false;

    imageButton.disabled =
      false;

    input.focus();

    scrollToBottom();
  }
}


/* =========================
   РАЗМЕР TEXTAREA
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
