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

let currentUser = null;

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

const loginSection = document.getElementById('login-section');
const mainSection = document.getElementById('main-section');
const loginMessage = document.getElementById('login-message');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const btnLogout = document.getElementById('btn-logout');
const tabButtons = {
  games: document.getElementById('tab-games'),
  youtube: document.getElementById('tab-youtube'),
  embed: document.getElementById('tab-embed')
};
const tabs = {
  games: document.getElementById('games-tab'),
  youtube: document.getElementById('youtube-tab'),
  embed: document.getElementById('embed-tab')
};

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

btnLogout.addEventListener('click', () => {
  currentUser = null;
  mainSection.style.display = 'none';
  loginSection.style.display = 'block';
  clearInputs();
  showTab('games');
});

function showMain() {
  loginSection.style.display = 'none';
  mainSection.style.display = 'block';
  checkUserUsage();
}

function clearInputs() {
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  loginMessage.textContent = '';
}

tabButtons.games.addEventListener('click', () => showTab('games'));
tabButtons.youtube.addEventListener('click', () => showTab('youtube'));
tabButtons.embed.addEventListener('click', () => showTab('embed'));

function showTab(tab) {
  if(tab === 'youtube' && tabButtons.youtube.style.display === 'none') {
    tab = 'games';
  }
  if(tab === 'embed' && tabButtons.embed.style.display === 'none') {
    tab = 'games';
  }
  tabs.games.style.display = tab === 'games' ? 'block' : 'none';
  tabs.youtube.style.display = tab === 'youtube' ? 'block' : 'none';
  tabs.embed.style.display = tab === 'embed' ? 'block' : 'none';

  tabButtons.games.classList.toggle('active', tab === 'games');
  tabButtons.youtube.classList.toggle('active', tab === 'youtube');
  tabButtons.embed.classList.toggle('active', tab === 'embed');
}

function loadGame(gameName) {
  window.location.href = `./games/${gameName}/code/index.html`;
}

async function checkUserUsage() {
  if (!currentUser) return;
  const userRef = db.collection('users').doc(currentUser);
  const doc = await userRef.get();
  if (!doc.exists) return;
  const usage = doc.data().usage || 0;
  if (usage >= 4000) {
    tabButtons.youtube.style.display = 'none';
    tabButtons.embed.style.display = 'none';
    if (tabs.youtube.style.display === 'block' || tabs.embed.style.display === 'block') showTab('games');
  } else {
    tabButtons.youtube.style.display = 'inline-block';
    tabButtons.embed.style.display = 'inline-block';
  }
}

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
    await userRef.update({
      usage: 0,
      reset: {
        'current-time': firebase.firestore.Timestamp.now(),
        'last-reset': firebase.firestore.Timestamp.fromDate(today5PM)
      }
    });

    const keysSnapshot = await db.collection('apiKeys').get();
    const batch = db.batch();
    keysSnapshot.forEach(doc => {
      batch.update(doc.ref, { usage: 0, active: true });
    });
    await batch.commit();

    console.log('Usage reset done at 5 PM');
    checkUserUsage();
  } else {
    await userRef.set({
      reset: {
        'current-time': firebase.firestore.Timestamp.now(),
        'last-reset': reset['last-reset'] || firebase.firestore.Timestamp.fromDate(new Date(0))
      }
    }, { merge: true });
  }
}

setInterval(usageResetCheck, 5 * 60 * 1000);

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
    const keysSnap = await db.collection('apiKeys').where('active', '==', true).orderBy('usage', 'asc').limit(1).get();
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
      tabButtons.embed.style.display = 'none';
      if (tabs.youtube.style.display === 'block' || tabs.embed.style.display === 'block') showTab('games');
    } else {
      tabButtons.youtube.style.display = 'inline-block';
      tabButtons.embed.style.display = 'inline-block';
    }

    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=${count}&q=${encodeURIComponent(query)}&key=${keyData.key}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const embedDiv = document.getElementById('embed-results');
    embedDiv.innerHTML = '';

    data.items.forEach(item => {
      const videoId = item.id.videoId;
      const iframe = document.createElement('iframe');
      iframe.width = "100%";
      iframe.height = "315";
      iframe.src = `https://www.youtube.com/embed/${videoId}`;
      iframe.title = item.snippet.title;
      iframe.frameBorder = "0";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.style.marginBottom = '1em';
      embedDiv.appendChild(iframe);
    });

    showTab('embed');
  } catch (e) {
    alert('Error: ' + e.message);
  }
});
