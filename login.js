const form = document.getElementById("loginForm");
const messageEl = document.getElementById('message');

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('users') || '{}');
  } catch (e) {
    return {};
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  const users = getUsers();
  if (users[user] && users[user] === pass) {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("currentUser", user);
    window.location.href = "index.html";
  } else {
    messageEl.textContent = 'Invalid username or password';
    messageEl.style.color = 'salmon';
  }
});
