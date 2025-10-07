const form = document.getElementById('registerForm');
const messageEl = document.getElementById('message');

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('users') || '{}');
  } catch (e) {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const user = document.getElementById('regUsername').value.trim();
  const pass = document.getElementById('regPassword').value;

  if (!user || !pass) {
    messageEl.textContent = 'Please provide username and password';
    messageEl.style.color = 'salmon';
    return;
  }

  const users = getUsers();
  if (users[user]) {
    messageEl.textContent = 'Username already exists';
    messageEl.style.color = 'salmon';
    return;
  }

  users[user] = pass; // For demo only: store plain-text
  saveUsers(users);

  messageEl.textContent = 'Registration successful. Redirecting to login...';
  messageEl.style.color = 'lightgreen';

  setTimeout(() => {
    window.location.href = 'login.html';
  }, 1200);
});