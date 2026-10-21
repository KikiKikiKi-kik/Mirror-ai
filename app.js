* {
  box-sizing: border-box;
}
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
body {
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, Helvetica, sans-serif;
  color: #171717;
  background: #fff;
}
button,
textarea {
  font: inherit;
}
button {
  border: 0;
}
/* APP */
.app {
  width: 100%;
  height: 100dvh;
  display: flex;
}
/* SIDEBAR */
.sidebar {
  width: 230px;
  min-width: 230px;
  height: 100%;
  background: #f7f7f8;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  height: 52px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
}
.brand-mark {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}
.close-menu {
  display: none;
  background: transparent;
  color: #777;
  font-size: 25px;
  cursor: pointer;
  padding: 0;
}
/* SIDEBAR ACTIONS */
.sidebar-actions {
  padding: 6px 9px;
}
.new-chat,
.code-mode {
  width: 100%;
  height: 37px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  transition:
    background .15s ease,
    transform .1s ease;
}
.new-chat {
  margin-bottom: 5px;
  background: #111;
  color: #fff;
}
.new-chat:hover {
  background: #222;
}
.new-chat:active,
.code-mode:active {
  transform: scale(.98);
}
.code-mode {
  background: transparent;
  color: #333;
}
.code-mode:hover,
.code-mode.active {
  background: #e7e7e8;
}
/* HISTORY */
.history {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 5px 9px;
}
.history::-webkit-scrollbar {
  width: 5px;
}
.history::-webkit-scrollbar-thumb {
  background: #d4d4d4;
  border-radius: 10px;
}
.history-title {
  padding: 7px;
  font-size: 11px;
  color: #888;
}
.history-item {
  width: 100%;
  min-height: 34px;
  margin-bottom: 2px;
  padding: 7px 9px;
  border-radius: 8px;
  background: transparent;
  color: #333;
  cursor: pointer;
  text-align: left;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: background .15s ease;
}
.history-item:hover,
.history-item.active {
  background: #e5e5e6;
}
.sidebar-bottom {
  padding: 8px;
}
.exit-button {
  width: 100%;
  height: 34px;
  border-radius: 8px;
  background: transparent;
  color: #666;
  cursor: pointer;
  text-align: left;
  padding: 0 9px;
  font-size: 12px;
}
.exit-button:hover {
  background: #e9e9ea;
}
/* MAIN */
.main {
  flex: 1;
  min-width: 0;
  height: 100%;
  position: relative;
  background: #fff;
}
.topbar {
  height: 48px;
  border-bottom: 1px solid #ededed;
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: rgba(255, 255, 255, .96);
}
.mobile-menu {
  display: none;
  background: transparent;
  color: #222;
  cursor: pointer;
  font-size: 20px;
  padding: 3px 5px;
  border-radius: 7px;
}
.mobile-menu:hover {
  background: #f1f1f1;
}
.mobile-title {
  display: none;
}
/* CHAT */
.chat {
  height: calc(100% - 48px);
  position: relative;
}
.messages {
  height: 100%;
  overflow-y: auto;
  padding: 20px 12px 105px;
  scroll-behavior: smooth;
}
.messages::-webkit-scrollbar {
  width: 6px;
}
.messages::-webkit-scrollbar-thumb {
  background: #d8d8d8;
  border-radius: 10px;
}
/* WELCOME */
.welcome {
  min-height: calc(100% - 20px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.welcome-mark {
  width: 44px;
  height: 44px;
  border-radius: 13px;
  background: #111;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21px;
  font-weight: 700;
  margin-bottom: 12px;
  box-shadow: 0 5px 18px rgba(0, 0, 0, .08);
}
.welcome h1 {
  margin: 0 0 5px;
  font-size: 23px;
  letter-spacing: -.4px;
}
.welcome p {
  margin: 0;
  color: #888;
  font-size: 13px;
}
/* MESSAGES */
.message {
  max-width: 760px;
  margin: 0 auto 16px;
  font-size: 14px;
  line-height: 1.5;
}
.message.user {
  display: flex;
  justify-content: flex-end;
}
.message.user .message-content {
  max-width: 80%;
  padding: 9px 12px;
  background: #f0f0f0;
  border-radius: 15px;
  color: #171717;
}
.message-content {
  overflow-wrap: anywhere;
}
.message-image {
  display: block;
  width: auto;
  max-width: 100%;
  max-height: 350px;
  border-radius: 11px;
  margin-bottom: 7px;
  object-fit: contain;
}
/* THINKING */
.thinking-message {
  opacity: .65;
}
.thinking-text {
  color: #777;
  font-size: 13px;
}
.thinking-dots {
  display: inline-block;
  width: 18px;
  text-align: left;
  animation: thinkingDots 1.2s infinite;
}
@keyframes thinkingDots {
  0%,
  100% {
    opacity: .2;
  }
  50% {
    opacity: 1;
  }
}
/* COMPOSER */
.composer-area {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 7px 10px 7px;
  background: linear-gradient(
    to top,
    #fff 72%,
    rgba(255, 255, 255, 0)
  );
}
.composer {
  width: 100%;
  max-width: 760px;
  min-height: 44px;
  margin: 0 auto;
  padding: 5px;
  display: flex;
  align-items: flex-end;
  gap: 5px;
  background: rgba(255, 255, 255, .98);
  border: 1px solid #d5d5d5;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, .035);
  transition:
    border-color .15s ease,
    box-shadow .15s ease;
}
.composer:focus-within {
  border-color: #bdbdbd;
  box-shadow: 0 3px 14px rgba(0, 0, 0, .055);
}
.image-button,
.send-button {
  width: 32px;
  min-width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background .15s ease,
    transform .1s ease;
}
.image-button {
  background: #f0f0f0;
  font-size: 16px;
}
.image-button:hover {
  background: #e6e6e6;
}
.send-button {
  background: #111;
  color: #fff;
  font-size: 18px;
}
.send-button:hover {
  background: #252525;
}
.image-button:active,
.send-button:active {
  transform: scale(.94);
}
.image-button:disabled,
.send-button:disabled {
  opacity: .5;
  cursor: default;
  transform: none;
}
#messageInput {
  flex: 1;
  min-width: 0;
  max-height: 130px;
  padding: 7px 3px;
  resize: none;
  border: 0;
  outline: 0;
  background: transparent;
  color: #171717;
  font-size: 14px;
  line-height: 1.35;
}
#messageInput::placeholder {
  color: #999;
}
/* IMAGE PREVIEW */
.image-preview {
  display: none;
  position: relative;
  width: 100%;
  max-width: 760px;
  margin: 0 auto 5px;
  padding: 5px;
  background: #f7f7f8;
  border: 1px solid #ddd;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .03);
}
.image-preview.show {
  display: block;
}
.image-preview img {
  display: block;
  width: auto;
  max-width: 100%;
  max-height: 120px;
  border-radius: 7px;
  object-fit: contain;
}
.remove-image {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 23px;
  height: 23px;
  border-radius: 50%;
  background: rgba(0, 0, 0, .72);
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.remove-image:hover {
  background: #111;
}
/* MODE */
.mode-indicator {
  display: none;
  width: fit-content;
  margin: 0 auto 4px;
  padding: 4px 8px;
  border-radius: 7px;
  background: #eee;
  color: #555;
  font-size: 10px;
}
.mode-indicator.show {
  display: flex;
  gap: 5px;
  align-items: center;
}
/* DISCLAIMER */
.disclaimer {
  margin: 4px auto 0;
  max-width: 760px;
  text-align: center;
  font-size: 8px;
  color: #999;
}
/* CODE */
.code-block {
  position: relative;
  margin: 9px 0;
  border-radius: 9px;
  background: #181818;
  color: #f5f5f5;
  overflow: hidden;
  border: 1px solid #292929;
}
.code-block pre {
  margin: 0;
  padding: 12px;
  overflow-x: auto;
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.5;
}
.copy-code {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 4px 7px;
  border-radius: 6px;
  background: #333;
  color: #eee;
  cursor: pointer;
  font-size: 10px;
}
.copy-code:hover {
  background: #444;
}
/* MOBILE */
@media (max-width: 700px) {
  .sidebar {
    position: fixed;
    z-index: 100;
    top: 0;
    left: 0;
    transform: translateX(-100%);
    transition: transform .2s ease;
    box-shadow: 7px 0 25px rgba(0, 0, 0, .15);
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .close-menu {
    display: block;
  }
  .mobile-menu {
    display: block;
  }
  .mobile-title {
    display: block;
    margin-left: 8px;
    font-size: 15px;
    font-weight: 600;
  }
  .topbar {
    height: 45px;
  }
  .chat {
    height: calc(100% - 45px);
  }
  .messages {
    padding: 12px 8px 100px;
  }
  .message {
    font-size: 14px;
  }
  .message.user .message-content {
    max-width: 88%;
  }
  .message-image {
    max-height: 300px;
  }
  .composer-area {
    padding: 5px 7px 6px;
  }
  .composer {
    min-height: 42px;
    border-radius: 13px;
  }
  .image-button,
  .send-button {
    width: 31px;
    min-width: 31px;
    height: 31px;
  }
  #messageInput {
    font-size: 14px;
  }
  .disclaimer {
    font-size: 8px;
  }
}
