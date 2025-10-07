# ai-chat-bot-ankit

Local setup and API keys

- Do NOT commit API keys to the repository. To use the generative API create a local file `config.js` (next to `config.example.js`) with the following content:

```js
window.APP_CONFIG = {
  GENERATIVE_API_KEY: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyB4TAoQwsrlEKkZJyx6FV0BY6W2helZhHc",
};
```

- `config.js` is ignored by `.gitignore`. If you accidentally committed a key, rotate/revoke it immediately and remove it from the repo's history.

Then open `login.html` in a browser and register/login to test the app.
