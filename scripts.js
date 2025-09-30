// Firebase config and initialization
const firebaseConfig = {
  apiKey: "AIzaSyBlODXx-DUc854md33vCUQmfFmgbVVr2Z8",
  authDomain: "wallpuncherhub.firebaseapp.com",
  projectId: "wallpuncherhub",
  storageBucket: "wallpuncherhub.firebasestorage.app",
  messagingSenderId: "290890530719",
  appId: "1:290890530719:web:71757bb1bac1b421cdc7aa",
  measurementId: "G-GJNRHGBBLX"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global currentUser (username string)
let currentUser = null;

// Hash password using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Register user
async function register(username, password) {
  const userDoc = db.collection('users').doc(username);
  const doc = await userDoc.get();
  if (doc.exists) throw new Error('Username already exists');
  const passwordHash = await hashPassword(password);
  await userDoc.set({
    banned: false,
    passwordHash,
    usage: 0,
    username,
    'yt-searches': [],
    reset: {
      'current-time': firebase.firestore.Timestamp.now(),
      'last-reset': firebase.firestore.Timestamp.fromDate(new Date(0))
    }
  });
}

// Login user
async function login(username, password) {
  const userDoc = db.collection('users').doc(username);
  const doc = await userDoc.get();
  if (!doc.exists) throw new Error('User not found');
  const data = doc.data();
  if (data.banned) throw new Error('User is banned');
  const passwordHash = await hashPassword(password);
  if (passwordHash !== data.passwordHash) throw new Error('Incorrect password');
  return data;
}

// UI elements
const loginSection = document.getElementById('login-section');
const mainSection = document.getElementById('main-section');
const loginMessage = document.getElementById('login-message');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const btnLogout = document.getElementById('btn-logout');
const tabs = {
  games: document.getElementById('games-tab'),
  youtube: document.getElementById('youtube-tab')
};
const tabButtons = {
  games: document.getElementById('tab-games'),
  youtube: document.getElementById('tab-youtube')
};

// Login button handler
btnLogin.addEventListener('click', async () => {
  loginMessage.textContent = '';
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) {
    loginMessage.textContent = 'Enter username and password';
    return;
  }
  try {
    await login(username, password);
    currentUser = username;
    showMain();
  } catch (err) {
    loginMessage.textContent = 'Login failed: ' + err.message;
  }
});

// Register button handler
btnRegister.addEventListener('click', async () => {
  loginMessage.textContent = '';
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) {
    loginMessage.textContent = 'Enter username and password';
    return;
  }
  try {
    await register(username, password);
    loginMessage.textContent = 'Registration successful, please login';
  } catch (err) {
    loginMessage.textContent = 'Registration failed: ' + err.message;
  }
});

// Logout handler
btnLogout.addEventListener('click', () => {
  currentUser = null;
  mainSection.style.display = 'none';
  loginSection.style.display = 'block';
  clearInputs();
  showTab('games'); // Reset to games tab
});

// Show main UI after login
function showMain() {
  loginSection.style.display = 'none';
  mainSection.style.display = 'block';
  checkUserUsage();
}

// Clear input fields
function clearInputs() {
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  loginMessage.textContent = '';
}

// Tab switching logic
tabButtons.games.addEventListener('click', () => showTab('games'));
tabButtons.youtube.addEventListener('click', () => showTab('youtube'));

function showTab(tab) {
  if(tab === 'youtube' && tabButtons.youtube.style.display === 'none') {
    // If YouTube tab hidden, default to games
    tab = 'games';
  }
  tabs.games.style.display = tab === 'games' ? 'block' : 'none';
  tabs.youtube.style.display = tab === 'youtube' ? 'block' : 'none';
  tabButtons.games.classList.toggle('active', tab === 'games');
  tabButtons.youtube.classList.toggle('active', tab === 'youtube');
}

// Load a game by navigating to its index.html
function loadGame(gameName) {
  window.location.href = `./games/${gameName}/code/index.html`;
}

// Check user's usage and hide YouTube tab if needed
async function checkUserUsage() {
  if (!currentUser) return;
  const userRef = db.collection('users').doc(currentUser);
  const doc = await userRef.get();
  if (!doc.exists) return;
  const usage = doc.data().usage || 0;
  if (usage >= 4000) {
    tabButtons.youtube.style.display = 'none';
    if (tabs.youtube.style.display === 'block') showTab('games');
  } else {
    tabButtons.youtube.style.display = 'inline-block';
  }
}

// Usage reset logic every 5 minutes
async function usageResetCheck() {
  if (!currentUser) return;
  const userRef = db.collection('users').doc(currentUser);
  const userDoc = await userRef.get();
  if (!userDoc.exists) return;
  const data = userDoc.data();
  const reset = data.reset || {};
  const now = firebase.firestore.Timestamp.now().toDate();

  const lastReset = reset['last-reset'] ? reset['last-reset'].toDate() : new Date(0);
  const today5PM = new Date(now);
  today5PM.setHours(17, 0, 0, 0);

  if (now >= today5PM && lastReset < today5PM) {
    // Reset all users usage & apiKeys usage in batch
    const batch = db.batch();

    // Reset current user usage (for demo, ideally reset all users in backend)
    batch.update(userRef, {
      usage: 0,
      reset: {
        'current-time': firebase.firestore.Timestamp.now(),
        'last-reset': firebase.firestore.Timestamp.fromDate(today5PM)
      }
    });

    // Reset all apiKeys
    const keysSnapshot = await db.collection('apiKeys').get();
    keysSnapshot.forEach(doc => {
      batch.update(doc.ref, { usage: 0, active: true });
    });

    await batch.commit();
    console.log('Usage reset done at 5 PM');
    checkUserUsage();
  } else {
    // Update current-time only
    await userRef.set({ reset: { 'current-time': firebase.firestore.Timestamp.now(), 'last-reset': reset['last-reset'] || firebase.firestore.Timestamp.fromDate(new Date(0)) } }, { merge: true });
  }
}

// Call usage reset every 5 minutes
setInterval(usageResetCheck, 5 * 60 * 1000);

// YouTube search and usage tracking
document.getElementById('search-btn').addEventListener('click', async () => {
  if (!currentUser) {
    alert('Please login first.');
    return;
  }
  const query = document.getElementById('search-query').value.trim();
  const count = parseInt(document.getElementById('videos-count').value);
  if (!query) {
    alert('Enter a search query');
    return;
  }
  try {
    // Pick lowest usage active api key
    const keysSnap = await db.collection('apiKeys').where('active', '==', true).orderBy('usage').limit(1).get();
    if (keysSnap.empty) throw new Error('No active YouTube API keys available');

    const keyDoc = keysSnap.docs[0];
    const keyData = keyDoc.data();

    const usageIncrement = 3.575 * count;
    let newKeyUsage = keyData.usage + usageIncrement;
    let keyActive = keyData.active;
    if (newKeyUsage >= 2000) {
      keyActive = false;
      newKeyUsage = 2000;
    }

    // Update user usage
    const userRef = db.collection('users').doc(currentUser);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    let newUserUsage = (userData.usage || 0) + usageIncrement;
    if (newUserUsage > 4000) newUserUsage = 4000;

    const batch = db.batch();
    batch.update(keyDoc.ref, { usage: newKeyUsage, active: keyActive });
    batch.update(userRef, { usage: newUserUsage });
    await batch.commit();

    if (newUserUsage >= 4000) {
      tabButtons.youtube.style.display = 'none';
      if (tabs.youtube.style.display === 'block') showTab('games');
    }

    // Fetch YouTube videos
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${count}&q=${encodeURIComponent(query)}&key=${keyData.key}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    // Display results
    const resultsDiv = document.getElementById('search-results');
    resultsDiv.innerHTML = '';
    data.items.forEach(item => {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const thumb = item.snippet.thumbnails.default.url;
      resultsDiv.innerHTML += `
        <div style="margin-bottom:10px;">
          <img src="${thumb}" alt="Thumbnail" />
          <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">${title}</a>
        </div>
      `;
    });
  } catch (e) {
    alert('Error: ' + e.message);
  }
});
