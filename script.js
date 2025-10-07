// Clean, robust client-side script for the chat app.
// - No API keys are stored here. Use config.js or the temporary banner flow to provide a key.

const prompt = document.querySelector('#prompt');
const submitbtn = document.querySelector('#submit');
const chatContainer = document.querySelector('.chat-container');
const imagebtn = document.querySelector('#image');
const image = document.querySelector('#image img');
const imageinput = document.querySelector('#image input');

let user = { message: null, file: { mime_type: null, data: null } };

// Use the provided Api_Url constant (will be used first). If empty, fall back
// to config or temp key.
const Api_Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyB4TAoQwsrlEKkZJyx6FV0BY6W2helZhHc";

function getApiUrl() {
  if (Api_Url) return Api_Url;
  const base = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=';
  const key = (window.APP_CONFIG && window.APP_CONFIG.GENERATIVE_API_KEY) || localStorage.getItem('TEMP_API_KEY');
  if (!key) return null;
  return base + encodeURIComponent(key);
}

function createChatBox(html, classes) {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.className = classes;
  return div;
}

function scrollToBottom() {
  if (!chatContainer) return;
  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
}

function showApiBanner() {
  if (!chatContainer) return;
  if (document.querySelector('.api-banner')) return; // only once
  const banner = document.createElement('div');
  banner.className = 'api-banner';
  banner.innerHTML = `
    <div style="flex:1">API key not configured. You can create a local <code>config.js</code> or enter a temporary key to test.</div>
    <div style="display:flex;gap:8px">
      <button id="api-enter" class="btn">Enter key</button>
      <button id="api-clear" class="btn-outline">Clear key</button>
    </div>`;
  banner.style.cssText = 'display:flex;align-items:center;padding:12px 14px;margin:10px 0;border-radius:12px;background:#fff3cd;color:#856404';
  chatContainer.insertBefore(banner, chatContainer.firstChild);
  document.getElementById('api-enter').addEventListener('click', () => {
    const k = prompt('Enter temporary API key (will be stored in localStorage for testing):');
    if (k) {
      localStorage.setItem('TEMP_API_KEY', k.trim());
      banner.remove();
    }
  });
  document.getElementById('api-clear').addEventListener('click', () => {
    localStorage.removeItem('TEMP_API_KEY');
    banner.remove();
  });
}

async function generateResponse(aiChatBox) {
  const text = aiChatBox.querySelector('.ai-chat-area');
  const apiUrl = getApiUrl();
  const RequestOption = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: user.message }].concat(user.file.data ? [{ inline_data: user.file }] : []) }]
    })
  };

  try {
    if (!apiUrl) {
      showApiBanner();
      text.innerHTML = 'API key not configured. Enter a temporary key or create config.js as described in README.';
      return;
    }
    const response = await fetch(apiUrl, RequestOption);
    const data = await response.json();
    const apiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text?.replace(/\*\*(.*?)\*\*/g, '$1')?.trim();
    text.innerHTML = apiResponse || 'No response from API.';
  } catch (err) {
    console.error(err);
    text.innerHTML = 'Error calling API. See console.';
  } finally {
    scrollToBottom();
    if (image) image.src = 'user.png';
    if (image) image.classList.remove('choose');
    user.file = { mime_type: null, data: null };
  }
}

function handlechatResponse(userMessage) {
  user.message = userMessage;
  const html = `
    <img src="user.png" alt="" id="userImage" width="8%">
    <div class="user-chat-area">
      ${user.message}
      ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ''}
    </div>`;
  if (prompt) prompt.value = '';
  const userChatBox = createChatBox(html, 'user-chat-box');
  if (chatContainer) chatContainer.appendChild(userChatBox);
  scrollToBottom();

  setTimeout(() => {
    const html2 = `<img src="ai.png" alt="" id="aiImage" width="10%"><div class="ai-chat-area"><img src="loading.webp" alt="" class="load" width="50px"></div>`;
    const aiChatBox = createChatBox(html2, 'ai-chat-box');
    if (chatContainer) chatContainer.appendChild(aiChatBox);
    generateResponse(aiChatBox);
  }, 600);
}

// events
if (prompt) {
  prompt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlechatResponse(prompt.value.trim());
    }
  });
}
if (submitbtn) submitbtn.addEventListener('click', () => handlechatResponse(prompt.value.trim()));

if (imageinput) {
  imageinput.addEventListener('change', () => {
    const file = imageinput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64string = e.target.result.split(',')[1];
      user.file = { mime_type: file.type, data: base64string };
      if (image) image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
      if (image) image.classList.add('choose');
    };
    reader.readAsDataURL(file);
  });
}
if (imagebtn) imagebtn.addEventListener('click', () => imagebtn.querySelector('input').click());

// Auth & theme wiring
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');
const userInfoEl = document.getElementById('userInfo');
if (userInfoEl) {
  const current = localStorage.getItem('currentUser');
  if (current) userInfoEl.textContent = `Signed in as ${current}`;
}
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
  });
}

function applyTheme() {
  const mode = localStorage.getItem('theme') || 'dark';
  if (mode === 'light') document.documentElement.classList.add('light-mode');
  else document.documentElement.classList.remove('light-mode');
}
applyTheme();
if (themeToggle) themeToggle.addEventListener('click', () => {
  const isLight = document.documentElement.classList.toggle('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

// show banner if no API key yet and on first load
if (!getApiUrl()) setTimeout(showApiBanner, 600);