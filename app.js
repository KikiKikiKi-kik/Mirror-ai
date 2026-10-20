const messages = document.getElementById("messages");
const input = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const newChatButton = document.getElementById("newChat");
const historyList = document.getElementById("historyList");
const mobileMenu = document.getElementById("mobileMenu");
const sidebar = document.querySelector(".sidebar");

let currentChat = [];


function renderMarkdown(element, text) {
  const html = marked.parse(text);

  element.innerHTML = DOMPurify.sanitize(html);
}


async function sendMessage() {

  const text = input.value.trim();

  if (!text || sendButton.disabled) {
    return;
  }

  input.value = "";
  resizeInput();

  const welcome = document.getElementById("welcome");

  if (welcome) {
    welcome.remove();
  }

  addMessage("user", text);

  currentChat.push({
    role: "user",
    content: text
  });

  sendButton.disabled = true;

  const loading = addMessage("mirror", "");

  const bubble = loading.querySelector(".bubble");

  bubble.classList.add("thinking");

  bubble.textContent = "Думаю…";


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


    if (!response.ok) {

      const errorText = await response.text();

      throw new Error(
        errorText || `HTTP ${response.status}`
      );

    }


    if (!response.body) {
      throw new Error("Streaming is not supported");
    }


    const reader = response.body.getReader();

    const decoder = new TextDecoder("utf-8");

    let answer = "";

    let firstChunk = true;


    while (true) {

      const { value, done } = await reader.read();

      if (done) {
        break;
      }


      const chunk = decoder.decode(value, {
        stream: true
      });


      if (!chunk) {
        continue;
      }


      answer += chunk;


      if (firstChunk) {

        bubble.classList.remove("thinking");

        firstChunk = false;

      }


      renderMarkdown(bubble, answer);

      scrollToBottom();

    }


    const lastChunk = decoder.decode();

    if (lastChunk) {

      answer += lastChunk;

      renderMarkdown(bubble, answer);

    }


    if (!answer.trim()) {

      bubble.textContent =
        "Не удалось получить ответ.";

    }


    currentChat.push({
      role: "mirror",
      content: answer
    });


    updateHistory(text);


  } catch (error) {

    console.error(error);

    bubble.classList.remove("thinking");

    bubble.textContent =
      "Ошибка: " + error.message;

  }


  sendButton.disabled = false;

  input.focus();

  scrollToBottom();

}


function addMessage(role, text) {

  const message = document.createElement("div");

  message.className =
    `message message-${role}`;


  const bubble = document.createElement("div");

  bubble.className = "bubble";


  if (role === "mirror" && text) {

    renderMarkdown(bubble, text);

  } else {

    bubble.textContent = text;

  }


  message.appendChild(bubble);

  messages.appendChild(message);


  scrollToBottom();


  return message;

}


function scrollToBottom() {

  requestAnimationFrame(() => {

    messages.scrollTo({
      top: messages.scrollHeight,
      behavior: "smooth"
    });

  });

}


function newChat() {

  currentChat = [];

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

  input.focus();

}


function updateHistory(text) {

  if (historyList.children.length > 0) {
    return;
  }


  const item = document.createElement("div");

  item.className = "history-item";


  const title =
    text.length > 32
      ? text.substring(0, 32) + "..."
      : text;


  item.textContent = title;

  historyList.appendChild(item);

}


function resizeInput() {

  input.style.height = "auto";


  input.style.height =
    Math.min(input.scrollHeight, 180) + "px";

}


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
  () => {

    sidebar.classList.toggle("open");

  }
);


input.focus();
