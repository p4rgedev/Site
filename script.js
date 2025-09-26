// Firebase config and initialization
const firebaseConfig = {
  apiKey: "AIzaSyBlODXx-DUc854md33vCUQmfFmgbVVr2Z8",
  authDomain: "wallpuncherhub.firebaseapp.com",
  projectId: "wallpuncherhub",
  storageBucket: "wallpuncherhub.firebasestorage.app",
  messagingSenderId: "290890530719",
  appId: "1:290890530719:web:71757bb1bac1b421cdc7aa"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const games = [
  { name: "slope", cover: "games/slope-plus/cover.png", code: "https://p4rgedev.github.io/slope-plus/" }
];

// Hash password function (SHA-256)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Elements
const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const appSection = document.getElementById('app-section');
const loginError = document.getElementById('login-error');

const registerForm = document.getElementById('register-form');
const registerError = document.getElementById('register-error');
const registerSuccess = document.getElementById('register-success');

const searchInput = document.getElementById('search-input');
const gamesList = document.getElementById('games-list');

const tabGames = document.getElementById('tab-games');
const tabYoutube = document.getElementById('tab-youtube');
const tabChat = document.getElementById('tab-chat');
const tabContact = document.getElementById('tab-contact');

const gameSection = document.getElementById('game-section');
const youtubeSection = document.getElementById('youtube-section');
const chatSection = document.getElementById('chat-section');
const contactSection = document.getElementById('contact-section');

const ytChannelInput = document.getElementById('yt-channel-input');
const ytSearchInput = document.getElementById('yt-search-input');
const ytCountInput = document.getElementById('yt-count-input');
const ytSearchBtn = document.getElementById('yt-search-btn');
const ytResults = document.getElementById('yt-results');

const ytUrlInput = document.getElementById('yt-url-input');
const ytUrlBtn = document.getElementById('yt-url-btn');
const ytPlayer = document.getElementById('yt-player');

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

const showRegisterBtn = document.getElementById('show-register');
const showLoginBtn = document.getElementById('show-login');

const YOUTUBE_API_KEYS = [
  'AIzaSyBoL0xrQEnNSAD1eSXLuLIMLrHmAsmw3ZQ',
  'AIzaSyDstZPwfimboVJWSWW-txfej9gPUWR9PiE',
  'AIzaSyBrqkVMBvINFfkEuARDcc6_NkPjHLRbfQQ'
];
let currentKeyIndex = 0;
function getNextApiKey() {
  const key = YOUTUBE_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % YOUTUBE_API_KEYS.length;
  return key;
}

let currentUser = null;

// Toggle views
showRegisterBtn.addEventListener('click', () => {
  loginSection.style.display = 'none';
  registerSection.style.display = 'block';
  loginError.style.display = 'none';
  registerError.style.display = 'none';
  registerSuccess.style.display = 'none';
});

showLoginBtn.addEventListener('click', () => {
  registerSection.style.display = 'none';
  loginSection.style.display = 'block';
  loginError.style.display = 'none';
  registerError.style.display = 'none';
  registerSuccess.style.display = 'none';
});

// Login handler
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    loginError.style.display = 'block';
    return;
  }

  try {
    const passwordHash = await hashPassword(password);
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef.where('username', '==', username).get();

    if (querySnapshot.empty) {
      loginError.style.display = 'block';
      return;
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.passwordHash === passwordHash) {
      currentUser = {
        username: username,
        isAdmin: !!userData.isAdmin,
        friends: userData.friends || [],
        blocked: userData.blocked || []
      };
      sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

      // Update local history of logged usernames
      let loggedUsernames = JSON.parse(localStorage.getItem('loggedUsernames') || '[]');
      if (!loggedUsernames.includes(currentUser.username)) {
        loggedUsernames.push(currentUser.username);
        localStorage.setItem('loggedUsernames', JSON.stringify(loggedUsernames));
      }

      // Check ban status immediately
      await checkBans();

      loginSection.style.display = 'none';
      registerSection.style.display = 'none';
      appSection.style.display = 'block';
      renderGames(games);
      initChat();
      applyAdminUI(currentUser.isAdmin);
    } else {
      loginError.style.display = 'block';
    }
  } catch (error) {
    console.error(error);
    loginError.style.display = 'block';
  }
});

// Registration handler
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  registerError.style.display = 'none';
  registerSuccess.style.display = 'none';

  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!username || !password) {
    registerError.textContent = 'Please fill in both fields.';
    registerError.style.display = 'block';
    return;
  }

  try {
    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('username', '==', username).get();
    if (!existingUser.empty) {
      registerError.textContent = 'Username already taken.';
      registerError.style.display = 'block';
      return;
    }

    const passwordHash = await hashPassword(password);

    await usersRef.doc(username).set({
      username: username,
      passwordHash: passwordHash,
      isAdmin: false,
      friends: [],
      blocked: []
    });

    registerSuccess.textContent = 'Registration successful! You can now log in.';
    registerSuccess.style.display = 'block';
    registerForm.reset();
  } catch (error) {
    console.error(error);
    registerError.textContent = 'Error during registration. Please try again.';
    registerError.style.display = 'block';
  }
});

// Render games list
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  const filtered = games.filter(game => game.name.toLowerCase().includes(query));
  renderGames(filtered);
});

function renderGames(list) {
  gamesList.innerHTML = '';
  if (list.length === 0) {
    gamesList.innerHTML = '<p>No games found.</p>';
    return;
  }
  list.sort((a,b) => a.name.localeCompare(b.name));
  for (const game of list) {
    const card = document.createElement('div');
    card.className = 'game-card';

    const link = document.createElement('a');
    link.href = game.code;
    link.rel = 'noopener noreferrer';
    link.title = `Play ${game.name}`;

    const img = document.createElement('img');
    img.src = game.cover;
    img.alt = `${game.name} cover`;

    const name = document.createElement('span');
    name.textContent = game.name;

    link.appendChild(img);
    link.appendChild(name);
    card.appendChild(link);
    gamesList.appendChild(card);
  }
}

// Tabs switching
function activateTab(tab) {
  tabGames.classList.toggle('active', tab === 'games');
  tabYoutube.classList.toggle('active', tab === 'youtube');
  tabChat.classList.toggle('active', tab === 'chat');
  tabContact.classList.toggle('active', tab === 'contact');

  gameSection.style.display = (tab === 'games') ? 'block' : 'none';
  youtubeSection.style.display = (tab === 'youtube') ? 'block' : 'none';
  chatSection.style.display = (tab === 'chat') ? 'block' : 'none';
  contactSection.style.display = (tab === 'contact') ? 'block' : 'none';

  tabGames.setAttribute('aria-selected', tab === 'games');
  tabYoutube.setAttribute('aria-selected', tab === 'youtube');
  tabChat.setAttribute('aria-selected', tab === 'chat');
  tabContact.setAttribute('aria-selected', tab === 'contact');
}

tabGames.addEventListener('click', () => activateTab('games'));
tabYoutube.addEventListener('click', () => activateTab('youtube'));
tabChat.addEventListener('click', () => activateTab('chat'));
tabContact.addEventListener('click', () => activateTab('contact'));

// Keyboard navigation for tabs
[tabGames, tabYoutube, tabChat, tabContact].forEach(tab => {
  tab.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const tabs = [tabGames, tabYoutube, tabChat, tabContact];
      let idx = tabs.indexOf(tab);
      if (e.key === 'ArrowRight') idx = (idx + 1) % tabs.length;
      else idx = (idx - 1 + tabs.length) % tabs.length;
      activateTab(tabs[idx].id.replace('tab-', ''));
      tabs[idx].focus();
    }
  });
});

// Initialize chat with message listener and admin delete buttons
function initChat() {
  chatMessages.innerHTML = '';
  db.collection('messages').orderBy('timestamp').limit(100)
    .onSnapshot(snapshot => {
      chatMessages.innerHTML = '';
      snapshot.forEach(doc => {
        const msg = doc.data();
        if (currentUser.blocked.includes(msg.username)) return;

        const msgDiv = document.createElement('div');
        msgDiv.style.marginBottom = '0.5rem';
        msgDiv.textContent = `${msg.username}: ${msg.text}`;

        if (currentUser.isAdmin) {
          const delBtn = document.createElement('button');
          delBtn.textContent = 'Delete';
          delBtn.style.marginLeft = '1rem';
          delBtn.onclick = () => {
            db.collection('messages').doc(doc.id).delete()
              .catch(err => console.error('Error deleting message:', err));
          };
          msgDiv.appendChild(delBtn);
        }

        chatMessages.appendChild(msgDiv);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// Chat message send handler
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text || !currentUser) return;

  try {
    await db.collection('messages').add({
      username: currentUser.username,
      text: text,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    chatInput.value = '';
  } catch (error) {
    console.error('Error sending message:', error);
  }
});

// Apply admin UI controls if user is admin
function applyAdminUI(isAdmin) {
  if (!isAdmin) return;
  console.log("Admin features enabled");
  // Further UI controls can be added here (e.g., ban management)
}

// Check bans for all logged usernames and redirect banned users
async function checkBans() {
  // Get previously logged usernames from localStorage
  const loggedUsernames = JSON.parse(localStorage.getItem('loggedUsernames') || '[]');

  // Include current user username if not in list
  if (currentUser && !loggedUsernames.includes(currentUser.username)) {
    loggedUsernames.push(currentUser.username);
    localStorage.setItem('loggedUsernames', JSON.stringify(loggedUsernames));
  }

  if (loggedUsernames.length === 0) return;

  try {
    const bansSnapshot = await db.collection('bans').get();
    let banInfo = null;

    bansSnapshot.forEach(doc => {
      const ban = doc.data();
      const bannedSet = new Set(ban.bannedUsernames || []);
      for (const user of loggedUsernames) {
        if (bannedSet.has(user)) {
          banInfo = ban;
          return;
        }
      }
    });

    if (banInfo) {
      // Mark all logged usernames as banned in localStorage
      localStorage.setItem('isBANNED', 'true');
      localStorage.setItem('banDetails', JSON.stringify(banInfo));

      // Redirect to about:blank with ban info overlay
      window.location.href = 'about:blank';
      document.write(`
        <style>
          body {
            display:flex; justify-content:center; align-items:center; height:100vh;
            background:#000; color:#fff; font-family:sans-serif; text-align:center; padding:1rem;
          }
          a { color:#0af; }
          div { max-width: 600px; }
        </style>
        <div>
          <h1>You are banned</h1>
          <p><strong>Reason:</strong> ${banInfo.reason}</p>
          <p><strong>Ban Date:</strong> ${new Date(banInfo.banDate?.seconds * 1000).toLocaleString()}</p>
          <p><strong>Banned By:</strong> ${banInfo.bannedBy}</p>
          <p><strong>Banned Accounts:</strong> ${banInfo.bannedUsernames.join(', ')}</p>
          <p>To appeal, email <a href="mailto:p4rgedev-c@outlook.com">p4rgedev-c@outlook.com</a> with all information you have on this screen.</p>
        </div>
      `);
    }
  } catch (error) {
    console.error('Error checking bans:', error);
  }
}
