const STORAGE_KEY = "mirror_chats_v1";
/* =========================
   ELEMENTS
========================= */
const sidebar = document.getElementById("sidebar");
const mobileMenu = document.getElementById("mobileMenu");
const closeMenu = document.getElementById("closeMenu");
const exitButton = document.getElementById("exitButton");
const newChatButton = document.getElementById("newChat");
const codeModeButton = document.getElementById("codeMode");
const modeIndicator = document.getElementById("modeIndicator");
const historyList = document.getElementById("historyList");
const messages = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const imageButton = document.getElementById("imageButton");
const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");
const removeImageButton = document.getElementById("removeImage");
/* =========================
   STATE
========================= */
let chats = [];
let currentChatId = null;
let codeMode = false;
let selectedImage = null;
let isSending = false;
/* =========================
   STORAGE
========================= */
function loadChats() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      chats = [];
      return;
    }
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      chats = parsed;
    } else {
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
/* =========================
   HELPERS
========================= */
function generateId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}
function getCurrentChat() {
  return chats.find(
    chat => chat.id === currentChatId
  );
}
function closeSidebar() {
  sidebar.classList.remove("open");
}
function scrollToBottom() {
  requestAnimationFrame(() => {
    messages.scrollTop = messages.scrollHeight;
  });
}
function escapeHtml(text = "") {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
/* =========================
   WELCOME
========================= */
function renderWelcome() {
  messages.innerHTML = `
    <div class="welcome">
      <div class="welcome-mark">M</div>
      <h1>Чем могу помочь?</h1>
      <p>Напиши сообщение Mirror</p>
    </div>
  `;
}
/* =========================
   CREATE CHAT
========================= */
function createChat() {
  const chat = {
    id: generateId(),
    title: "Новый чат",
    messages: [],
    createdAt: Date.now()
  };
  chats.unshift(chat);
  currentChatId = chat.id;
  codeMode = false;
  updateCodeMode();
  clearSelectedImage();
  saveChats();
  renderHistory();
  renderMessages();
  closeSidebar();
  setTimeout(() => {
    messageInput.focus();
  }, 100);
}
/* =========================
   OPEN CHAT
========================= */
function openChat(id) {
  const chat = chats.find(
    item => item.id === id
  );
  if (!chat) return;
  currentChatId = id;
  /*
    По твоему старому правилу:
    при переходе в старый чат
    Mirror Code выключается.
  */
  codeMode = false;
  updateCodeMode();
  clearSelectedImage();
  renderHistory();
  renderMessages();
  closeSidebar();
}
/* =========================
   HISTORY
========================= */
function renderHistory() {
  historyList.innerHTML = "";
  chats.forEach(chat => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-item";
    if (chat.id === currentChatId) {
      button.classList.add("active");
    }
    button.textContent =
      chat.title || "Новый чат";
    button.addEventListener("click", () => {
      openChat(chat.id);
    });
    historyList.appendChild(button);
  });
}
/* =========================
   CODE MODE
========================= */
function updateCodeMode() {
  codeModeButton.classList.toggle(
    "active",
    codeMode
  );
  modeIndicator.classList.toggle(
    "show",
    codeMode
  );
}
function toggleCodeMode() {
  codeMode = !codeMode;
  updateCodeMode();
  closeSidebar();
}
/* =========================
   IMAGE
========================= */
function clearSelectedImage() {
  selectedImage = null;
  imageInput.value = "";
  previewImage.removeAttribute("src");
  imagePreview.classList.remove("show");
}
function openImagePicker() {
  if (isSending) return;
  imageInput.click();
}
function handleImageSelection() {
  const file = imageInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    alert("Выбери изображение.");
    clearSelectedImage();
    return;
  }
  /*
    Ограничение, чтобы случайно не забить
    localStorage огромной фотографией.
  */
  const maxSize = 8 * 1024 * 1024;
  if (file.size > maxSize) {
    alert("Изображение слишком большое.");
    clearSelectedImage();
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    selectedImage = reader.result;
    previewImage.src = selectedImage;
    imagePreview.classList.add("show");
  };
  reader.onerror = () => {
    alert("Не удалось открыть изображение.");
    clearSelectedImage();
  };
  reader.readAsDataURL(file);
}
/* =========================
   TEXTAREA
========================= */
function resizeTextarea() {
  messageInput.style.height = "auto";
  const newHeight = Math.min(
    messageInput.scrollHeight,
    130
  );
  messageInput.style.height =
    newHeight + "px";
}
/* =========================
   SIMPLE MARKDOWN
========================= */
function formatMessage(text = "") {
  /*
    Сначала защищаем HTML.
  */
  let safe = escapeHtml(text);
  /*
    Код ```...```
  */
  safe = safe.replace(
    /```([\s\S]*?)```/g,
    (_, code) => {
      return `
        <div class="code-block">
          <button
            class="copy-code"
            type="button"
          >
            Копировать
          </button>
          <pre><code>${code.trim()}</code></pre>
        </div>
      `;
    }
  );
  /*
    Inline code
  */
  safe = safe.replace(
    /`([^`\n]+)`/g,
    "<code>$1</code>"
  );
  /*
    **жирный**
  */
  safe = safe.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );
  /*
    Переносы строк
  */
  safe = safe.replace(
    /\n/g,
    "<br>"
  );
  return safe;
}
/* =========================
   COPY CODE
========================= */
async function copyCode(button) {
  const block = button.closest(".code-block");
  if (!block) return;
  const code = block.querySelector("code");
  if (!code) return;
  try {
    await navigator.clipboard.writeText(
      code.textContent
    );
    const oldText = button.textContent;
    button.textContent = "Скопировано";
    setTimeout(() => {
      button.textContent = oldText;
    }, 1200);
  } catch (error) {
    console.error(
      "Ошибка копирования:",
      error
    );
  }
}
/* =========================
   CREATE MESSAGE ELEMENT
========================= */
function createMessageElement(item) {
  const wrapper = document.createElement("div");
  wrapper.className =
    `message ${
      item.role === "assistant"
        ? "assistant"
        : "user"
    }`;
  const content = document.createElement("div");
  content.className = "message-content";
  if (item.image) {
    const img = document.createElement("img");
    img.className = "message-image";
    img.src = item.image;
    img.alt = "Изображение";
    content.appendChild(img);
  }
  if (item.content) {
    const text = document.createElement("div");
    if (item.role === "assistant") {
      text.innerHTML =
        formatMessage(item.content);
    } else {
      text.textContent = item.content;
    }
    content.appendChild(text);
  }
  wrapper.appendChild(content);
  return wrapper;
}
/* =========================
   RENDER MESSAGES
========================= */
function renderMessages() {
  const chat = getCurrentChat();
  if (
    !chat ||
    !Array.isArray(chat.messages) ||
    chat.messages.length === 0
  ) {
    renderWelcome();
    return;
  }
  messages.innerHTML = "";
  chat.messages.forEach(item => {
    messages.appendChild(
      createMessageElement(item)
    );
  });
  scrollToBottom();
}
/* =========================
   THINKING
========================= */
function createThinkingMessage() {
  const wrapper = document.createElement("div");
  wrapper.className =
    "message assistant thinking-message";
  wrapper.innerHTML = `
    <div class="message-content">
      <span class="thinking-text">
        think<span class="thinking-dots">...</span>
      </span>
    </div>
  `;
  messages.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}
/* =========================
   TITLE
========================= */
function createTitle(text) {
  const clean = text
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) {
    return "Фото";
  }
  if (clean.length <= 32) {
    return clean;
  }
  return clean.slice(0, 32) + "…";
}
/* =========================
   SEND
========================= */
async function sendMessage() {
  if (isSending) return;
  const text = messageInput.value.trim();
  if (!text && !selectedImage) {
    return;
  }
  let chat = getCurrentChat();
  if (!chat) {
    createChat();
    chat = getCurrentChat();
  }
  if (!chat) return;
  /*
    Сохраняем историю ДО добавления
    нового сообщения.
  */
  const conversationHistory =
    chat.messages
      .slice(-30)
      .map(item => ({
        role: item.role,
        content: item.content || "",
        image: item.image || null
      }));
  const imageForMessage =
    selectedImage || null;
  const userMessage = {
    role: "user",
    content: text,
    image: imageForMessage
  };
  chat.messages.push(userMessage);
  if (
    chat.title === "Новый чат" ||
    !chat.title
  ) {
    chat.title = createTitle(text);
  }
  /*
    Очищаем поле.
  */
  messageInput.value = "";
  resizeTextarea();
  clearSelectedImage();
  saveChats();
  renderHistory();
  renderMessages();
  /*
    THINK...
  */
  const thinking =
    createThinkingMessage();
  isSending = true;
  sendButton.disabled = true;
  imageButton.disabled = true;
  let assistantText = "";
  let assistantElement = null;
  let assistantContent = null;
  try {
    const response = await fetch(
      "/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          mode: codeMode
            ? "code"
            : "normal",
          image: imageForMessage,
          history: conversationHistory
        })
      }
    );
    if (!response.ok) {
      let errorText = "";
      try {
        errorText =
          await response.text();
      } catch {}
      throw new Error(
        errorText ||
        `HTTP ${response.status}`
      );
    }
    if (!response.body) {
      const result =
        await response.text();
      thinking.remove();
      assistantText = result;
      chat.messages.push({
        role: "assistant",
        content: assistantText,
        image: null
      });
      saveChats();
      renderMessages();
      return;
    }
    const reader =
      response.body.getReader();
    const decoder =
      new TextDecoder();
    let firstChunk = true;
    while (true) {
      const {
        value,
        done
      } = await reader.read();
      if (done) break;
      const chunk =
        decoder.decode(
          value,
          { stream: true }
        );
      if (!chunk) continue;
      if (firstChunk) {
        firstChunk = false;
        thinking.remove();
        assistantElement =
          document.createElement("div");
        assistantElement.className =
          "message assistant";
        assistantContent =
          document.createElement("div");
        assistantContent.className =
          "message-content";
        assistantElement.appendChild(
          assistantContent
        );
        messages.appendChild(
          assistantElement
        );
      }
      assistantText += chunk;
      if (assistantContent) {
        assistantContent.innerHTML =
          formatMessage(
            assistantText
          );
      }
      scrollToBottom();
    }
    /*
      Если сервер почему-то вернул
      пустой ответ.
    */
    if (!assistantText.trim()) {
      thinking.remove();
      throw new Error(
        "Mirror вернул пустой ответ."
      );
    }
    chat.messages.push({
      role: "assistant",
      content: assistantText,
      image: null
    });
    saveChats();
  } catch (error) {
    console.error(
      "Ошибка Mirror:",
      error
    );
    thinking.remove();
    if (
      assistantElement &&
      !assistantText
    ) {
      assistantElement.remove();
    }
    const errorMessage = {
      role: "assistant",
      content:
        "Не удалось получить ответ. Попробуй ещё раз.",
      image: null
    };
    chat.messages.push(
      errorMessage
    );
    saveChats();
    renderMessages();
  } finally {
    isSending = false;
    sendButton.disabled = false;
    imageButton.disabled = false;
    messageInput.focus();
  }
}
/* =========================
   EVENTS
========================= */
newChatButton.addEventListener(
  "click",
  createChat
);
codeModeButton.addEventListener(
  "click",
  toggleCodeMode
);
mobileMenu.addEventListener(
  "click",
  () => {
    sidebar.classList.add("open");
  }
);
closeMenu.addEventListener(
  "click",
  closeSidebar
);
exitButton.addEventListener(
  "click",
  closeSidebar
);
imageButton.addEventListener(
  "click",
  openImagePicker
);
imageInput.addEventListener(
  "change",
  handleImageSelection
);
removeImageButton.addEventListener(
  "click",
  clearSelectedImage
);
sendButton.addEventListener(
  "click",
  sendMessage
);
messageInput.addEventListener(
  "input",
  resizeTextarea
);
messageInput.addEventListener(
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
/*
  Кнопки копирования создаются
  динамически, поэтому слушаем
  клики на messages.
*/
messages.addEventListener(
  "click",
  event => {
    const button =
      event.target.closest(
        ".copy-code"
      );
    if (!button) return;
    copyCode(button);
  }
);
/* =========================
   START
========================= */
function init() {
  loadChats();
  /*
    Открываем последний существующий
    чат. Если чатов нет — показываем
    стартовый экран.
  */
  if (chats.length > 0) {
    currentChatId =
      chats[0].id;
  }
  updateCodeMode();
  renderHistory();
  renderMessages();
  resizeTextarea();
}
init();
