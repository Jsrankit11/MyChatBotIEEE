// ------------------------------
// GLOBAL CHAT ELEMENTS & STATE
// ------------------------------
const prompt = document.querySelector('#prompt');
const submitbtn = document.querySelector('#submit');
const chatContainer = document.querySelector('.chat-container');
const imagebtn = document.querySelector('#image');
const imageIcon = document.querySelector('#image .material-icons');
const imageinput = document.querySelector('#image input');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');
const userInfoEl = document.getElementById('userInfo');

let user = { message: null, file: { mime_type: null, data: null } };

// ⭐️ KEEPING YOUR ORIGINAL API CONFIGURATION (gemini-2.0-flash with key)
const Api_Url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyB4TAoQwsrlEKkZJyx6FV0BY6W2helZhHc";

function getApiUrl() {
  // ⭐️ FIX: Always return the hardcoded URL since the intent is not to use 
  // local storage or config for the API key.
  return Api_Url;
}
// END API CONFIGURATION

// ------------------------------
// VIEW SWITCHING FUNCTIONS (FIX)
// ------------------------------
function showView(viewId) {
  document.querySelectorAll('.app-view').forEach(view => {
    view.style.display = 'none';
  });
  const view = document.getElementById(viewId);
  if (view) {
    view.style.display = (viewId === 'chatView') ? 'flex' : 'flex';
  }
  // Update user info header when showing chat
  if (viewId === 'chatView') {
    const current = localStorage.getItem('currentUser');
    if (userInfoEl && current) userInfoEl.textContent = `Signed in as ${current}`;
  }
}

function showChat() { showView('chatView'); }
function showLogin() { showView('loginView'); }
function showRegister() { showView('registerView'); }

function handleLogout() {
  localStorage.removeItem('loggedIn');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('TEMP_API_KEY');
  showLogin();
}

// ------------------------------
// UTILITY FUNCTIONS
// ------------------------------
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

// Auth Utils
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('users') || '{}');
  } catch (e) {
    console.error("Error parsing users from localStorage:", e);
    return {};
  }
}

function setUsers(users) {
  try {
    localStorage.setItem('users', JSON.stringify(users));
  } catch (e) {
    console.error("Error saving users to localStorage:", e);
  }
}

// Theme Utils
function toggleTheme() {
  document.body.classList.toggle('light-mode');
  const isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function applyTheme() {
  const mode = localStorage.getItem('theme') || 'dark';
  if (mode === 'light') document.body.classList.add('light-mode');
  else document.body.classList.remove('light-mode');
}

// ------------------------------
// API & CHAT LOGIC (Preserved Markdown Fix)
// ------------------------------
async function generateResponse(aiChatBox) {
  const text = aiChatBox.querySelector('.ai-chat-area');
  const apiUrl = getApiUrl();

  text.innerHTML = '<span class="loader"></span> Generating response...';

  const RequestOption = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: user.message }].concat(user.file.data ? [{ inlineData: user.file }] : []) }]
    })
  };

  try {
    if (!apiUrl) {
      text.innerHTML = 'API URL is empty. Please check API configuration.';
      return;
    }

    const response = await fetch(apiUrl, RequestOption);
    const data = await response.json();

    const apiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    // Use marked.parse() to convert the markdown text to HTML
    if (apiText) {
      text.innerHTML = marked.parse(apiText);
    } else {
      text.innerHTML = 'No response from API. Check API key and rate limits.';
    }

  } catch (err) {
    console.error('API Error:', err);
    text.innerHTML = 'Error calling API. See console for details.';
  } finally {
    scrollToBottom();
    if (imageIcon) imageIcon.classList.remove('choose');
    user.file = { mime_type: null, data: null };
  }
}

function handlechatResponse(userMessage) {
  if (!userMessage && !user.file.data) return;

  user.message = userMessage || (user.file.data ? "Analyze this image." : "");

  const userHtml = `
    <div class="avatar material-icons" title="You">person</div>
    <div class="user-chat-area">
      ${userMessage}
      ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="uploaded-img" />` : ''}
      <span class="timestamp">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
    </div>`;

  if (prompt) prompt.value = '';
  const userChatBox = createChatBox(userHtml, 'user-chat-box');
  if (chatContainer) chatContainer.appendChild(userChatBox);
  scrollToBottom();

  setTimeout(() => {
    const aiHtml = `
      <div class="avatar ai-avatar material-icons" title="Gemini AI">auto_awesome</div>
      <div class="ai-chat-area">
        <span class="loader"></span> Generating response...
      </div>`;

    const aiChatBox = createChatBox(aiHtml, 'ai-chat-box');
    if (chatContainer) chatContainer.appendChild(aiChatBox);
    generateResponse(aiChatBox);
  }, 600);
}

// ------------------------------
// LOGIN/REGISTER HANDLERS (FIXED NAVIGATION)
// ------------------------------
function initializeDefaultUser() {
  let users = getUsers();
  if (Object.keys(users).length === 0) {
    users = { "user": "password" }; // Default credentials
    setUsers(users);
  }
}

// LOGIN FORM HANDLER
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const messageEl = document.getElementById('loginMessage');
  messageEl.textContent = 'Verifying credentials...';
  messageEl.style.color = '#FFC107';

  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  const users = getUsers();

  setTimeout(() => {
    if (users[user] && users[user] === pass) {
      messageEl.textContent = 'Login successful! Redirecting...';
      messageEl.style.color = 'var(--action-color)';

      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("currentUser", user);

      showChat();
    } else {
      messageEl.textContent = 'Invalid username or password';
      messageEl.style.color = 'var(--error-color)';

      document.getElementById("username").value = '';
      document.getElementById("password").value = '';
      document.getElementById("username").focus();
    }
  }, 500);
});

// REGISTER FORM HANDLER
document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const messageEl = document.getElementById('registerMessage');
  const usernameInput = document.getElementById('regUsername');
  const passwordInput = document.getElementById('regPassword');

  messageEl.textContent = 'Processing registration...';
  messageEl.style.color = '#FFC107';

  const user = usernameInput.value.trim();
  const pass = passwordInput.value;

  if (user.length < 3) {
    messageEl.textContent = 'Username must be at least 3 characters.';
    messageEl.style.color = 'var(--error-color)';
    return;
  }
  if (pass.length < 4) {
    messageEl.textContent = 'Password must be at least 4 characters.';
    messageEl.style.color = 'var(--error-color)';
    return;
  }

  let users = getUsers();

  setTimeout(() => {
    if (users[user]) {
      messageEl.textContent = 'Username already taken. Please choose another.';
      messageEl.style.color = 'var(--error-color)';
      usernameInput.focus();
    } else {
      users[user] = pass;
      setUsers(users);

      messageEl.textContent = 'Registration successful! Redirecting to login...';
      messageEl.style.color = 'var(--action-color)';

      setTimeout(() => {
        showLogin();
      }, 1000);
    }
  }, 500);
});

// ------------------------------
// INITIALIZATION & EVENT LISTENERS
// ------------------------------
document.addEventListener('DOMContentLoaded', () => {
  applyTheme();
  initializeDefaultUser();

  if (localStorage.getItem("loggedIn") === "true") {
    showChat();
  } else {
    showLogin();
  }

  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

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
        user.file = { mimeType: file.type, data: base64string };
        if (imageIcon) imageIcon.classList.add('choose');
      };
      reader.readAsDataURL(file);
    });
  }
  if (imagebtn) imagebtn.addEventListener('click', () => imagebtn.querySelector('input').click());

  document.getElementById('registerLink').addEventListener('click', showRegister);
  document.getElementById('loginLink').addEventListener('click', showLogin);

  ['username', 'password'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('focus', () => {
      document.getElementById('loginMessage').textContent = '';
      document.getElementById('loginMessage').style.color = '';
    });
  });

  ['regUsername', 'regPassword'].forEach(id => {
    const input = document.getElementById(id);
    if (input) input.addEventListener('focus', () => {
      document.getElementById('registerMessage').textContent = '';
      document.getElementById('registerMessage').style.color = '';
    });
  });
});
