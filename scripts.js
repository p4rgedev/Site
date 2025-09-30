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
    username,
    'yt-searches': []
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

const youtubeResultsDiv = document.getElementById('youtube-results');
const channelQueryInput = document.getElementById('channel-query');
const keywordQueryInput = document.getElementById('keyword-query');
const searchBtn = document.getElementById('search-btn');

let selectedChannelId = null;

searchBtn.addEventListener('click', async () => {
  if (!currentUser) {
    alert('Please login first.');
    return;
  }
  youtubeResultsDiv.innerHTML = '';
  selectedChannelId = null;

  const channelQuery = channelQueryInput.value.trim();
  const keywordQuery = keywordQueryInput.value.trim();

  if (!channelQuery && !keywordQuery) {
    alert('Enter a channel or keyword to search');
    return;
  }

  try {
    // Log searches
    const userRef = db.collection('users').doc(currentUser);
    if (channelQuery) {
      await userRef.update({
        'yt-searches': firebase.firestore.FieldValue.arrayUnion(channelQuery)
      });
    }
    if (keywordQuery) {
      await userRef.update({
        'yt-searches': firebase.firestore.FieldValue.arrayUnion(keywordQuery)
      });
    }

    const apiKey = await getActiveApiKey();

    if (channelQuery) {
      let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=10&q=${encodeURIComponent(channelQuery)}&key=${apiKey}`;
      let response = await fetch(url);
      let data = await response.json();

      if (data.error) throw new Error(data.error.message);

      if (data.items.length === 0) {
        await searchVideos(keywordQuery || channelQuery, apiKey);
      } else {
        data.items.forEach(channel => {
          const channelId = channel.snippet.channelId;
          const title = channel.snippet.title;
          const thumb = channel.snippet.thumbnails.default.url;

          const card = document.createElement('div');
          card.style.cursor = 'pointer';
          card.style.display = 'flex';
          card.style.alignItems = 'center';
          card.style.marginBottom = '10px';
          card.style.border = '1px solid #555';
          card.style.padding = '5px';
          card.style.borderRadius = '5px';

          const img = document.createElement('img');
          img.src = thumb;
          img.alt = title;
          img.style.marginRight = '10px';

          const text = document.createElement('div');
          text.textContent = title;

          card.appendChild(img);
          card.appendChild(text);

          card.onclick = () => {
            selectedChannelId = channelId;
            if (keywordQuery) {
              searchVideos(keywordQuery, apiKey, selectedChannelId);
            } else {
              const kw = prompt(`Enter keyword to search videos in channel "${title}"`, '');
              if (kw !== null && kw.trim() !== '') {
                searchVideos(kw.trim(), apiKey, selectedChannelId);
              }
            }
          };

          youtubeResultsDiv.appendChild(card);
        });
      }
    } else if (keywordQuery) {
      await searchVideos(keywordQuery, apiKey);
    }
  } catch (e) {
    alert('Error: ' + e.message);
  }
});

async function searchVideos(keyword, apiKey, channelId = null) {
  youtubeResultsDiv.innerHTML = '';

  let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(keyword)}&key=${apiKey}`;
  if (channelId) url += `&channelId=${channelId}`;

  const response = await fetch(url);
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  if (data.items.length === 0) {
    youtubeResultsDiv.textContent = 'No videos found.';
    return;
  }

  data.items.forEach(video => {
    const videoId = video.id.videoId;
    const title = video.snippet.title;
    const thumb = video.snippet.thumbnails.default.url;

    const card = document.createElement('div');
    card.style.cursor = 'pointer';
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.marginBottom = '10px';
    card.style.border = '1px solid #555';
    card.style.padding = '5px';
    card.style.borderRadius = '5px';

    const img = document.createElement('img');
    img.src = thumb;
    img.alt = title;
    img.style.marginRight = '10px';

    const text = document.createElement('div');
    text.textContent = title;

    card.appendChild(img);
    card.appendChild(text);

    card.onclick = () => {
      showEmbeddedVideo(videoId, title);
      showTab('embed');
    };

    youtubeResultsDiv.appendChild(card);
  });
}

function showEmbeddedVideo(videoId, title) {
  const embedDiv = document.getElementById('embed-results');
  embedDiv.innerHTML = '';

  const iframe = document.createElement('iframe');
  iframe.width = "100%";
  iframe.height = "315";
  iframe.src = `https://www.youtube.com/embed/${videoId}`;
  iframe.title = title;
  iframe.frameBorder = "0";
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
  iframe.allowFullscreen = true;
  embedDiv.appendChild(iframe);
}

async function getActiveApiKey() {
  const keysSnap = await db.collection('apiKeys').where('active', '==', true).limit(1).get();
  if (keysSnap.empty) throw new Error('No active YouTube API keys available');
  return keysSnap.docs[0].data().key;
}
