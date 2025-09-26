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

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const loginForm = document.getElementById('login-form');
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loginError = document.getElementById('login-error');

const searchInput = document.getElementById('search-input');
const gamesList = document.getElementById('games-list');

const tabGames = document.getElementById('tab-games');
const tabYoutube = document.getElementById('tab-youtube');
const tabContact = document.getElementById('tab-contact');
const gameSection = document.getElementById('game-section');
const youtubeSection = document.getElementById('youtube-section');
const contactSection = document.getElementById('contact-section');

const ytChannelInput = document.getElementById('yt-channel-input');
const ytSearchInput = document.getElementById('yt-search-input');
const ytCountInput = document.getElementById('yt-count-input');
const ytSearchBtn = document.getElementById('yt-search-btn');
const ytResults = document.getElementById('yt-results');

const ytUrlInput = document.getElementById('yt-url-input');
const ytUrlBtn = document.getElementById('yt-url-btn');
const ytPlayer = document.getElementById('yt-player');

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

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loginError.style.display = 'none';
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (username === USERNAME && password === PASSWORD) {
    loginSection.style.display = 'none';
    appSection.style.display = 'block';
    renderGames(games);
  } else {
    loginError.style.display = 'block';
  }
});

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
  if (tab === 'games') {
    tabGames.classList.add('active');
    tabGames.setAttribute('aria-selected', 'true');
    tabGames.tabIndex = 0;

    tabYoutube.classList.remove('active');
    tabYoutube.setAttribute('aria-selected', 'false');
    tabYoutube.tabIndex = -1;

    tabContact.classList.remove('active');
    tabContact.setAttribute('aria-selected', 'false');
    tabContact.tabIndex = -1;

    gameSection.classList.add('active');
    youtubeSection.classList.remove('active');
    contactSection.classList.remove('active');
  } else if (tab === 'youtube') {
    tabYoutube.classList.add('active');
    tabYoutube.setAttribute('aria-selected', 'true');
    tabYoutube.tabIndex = 0;

    tabGames.classList.remove('active');
    tabGames.setAttribute('aria-selected', 'false');
    tabGames.tabIndex = -1;

    tabContact.classList.remove('active');
    tabContact.setAttribute('aria-selected', 'false');
    tabContact.tabIndex = -1;

    youtubeSection.classList.add('active');
    gameSection.classList.remove('active');
    contactSection.classList.remove('active');
  } else if (tab === 'contact') {
    tabContact.classList.add('active');
    tabContact.setAttribute('aria-selected', 'true');
    tabContact.tabIndex = 0;

    tabGames.classList.remove('active');
    tabGames.setAttribute('aria-selected', 'false');
    tabGames.tabIndex = -1;

    tabYoutube.classList.remove('active');
    tabYoutube.setAttribute('aria-selected', 'false');
    tabYoutube.tabIndex = -1;

    contactSection.classList.add('active');
    gameSection.classList.remove('active');
    youtubeSection.classList.remove('active');
  }
}

tabGames.addEventListener('click', () => activateTab('games'));
tabYoutube.addEventListener('click', () => activateTab('youtube'));
tabContact.addEventListener('click', () => activateTab('contact'));

[tabGames, tabYoutube, tabContact].forEach(tab => {
  tab.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      if (tab === tabGames) {
        activateTab('youtube');
        tabYoutube.focus();
      } else if (tab === tabYoutube) {
        if (e.key === 'ArrowRight') {
          activateTab('contact');
          tabContact.focus();
        } else {
          activateTab('games');
          tabGames.focus();
        }
      } else if (tab === tabContact) {
        activateTab('games');
        tabGames.focus();
      }
    }
  });
});
// Fetch videos from a channel's uploads playlist and filter by keyword client-side
async function fetchChannelVideosFiltered(channelName, keyword, maxResults = 5) {
  const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${getNextApiKey()}&part=snippet&type=channel&q=${encodeURIComponent(channelName)}&maxResults=1`);
  const channelData = await channelRes.json();
  if (!channelData.items || channelData.items.length === 0) {
    throw new Error('Channel not found');
  }
  const channelId = channelData.items[0].snippet.channelId;

  const channelDetailsRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?key=${getNextApiKey()}&part=contentDetails&id=${channelId}`);
  const channelDetailsData = await channelDetailsRes.json();
  if (!channelDetailsData.items || channelDetailsData.items.length === 0) {
    throw new Error('Channel details not found');
  }
  const uploadsPlaylistId = channelDetailsData.items[0].contentDetails.relatedPlaylists.uploads;

  let videos = [];
  let nextPageToken = '';
  const pageSize = 50;
  const lowerKeyword = keyword.toLowerCase();

  while (videos.length < maxResults) {
    const playlistRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?key=${getNextApiKey()}&part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${pageSize}&pageToken=${nextPageToken}`);
    const playlistData = await playlistRes.json();
    if (!playlistData.items) break;

    const filtered = playlistData.items.filter(item =>
      item.snippet.title.toLowerCase().includes(lowerKeyword)
    );

    videos = videos.concat(filtered);

    if (!playlistData.nextPageToken) break;
    nextPageToken = playlistData.nextPageToken;
  }

  return videos.slice(0, maxResults);
}

ytSearchBtn.addEventListener('click', async () => {
  let channelName = ytChannelInput.value.trim();
  let keywords = ytSearchInput.value.trim();
  let count = parseInt(ytCountInput.value);
  if (!count || count <= 0) count = 5;

  ytResults.innerHTML = '<p>Loading...</p>';
  ytPlayer.style.display = 'none';
  ytPlayer.src = '';

  try {
    let videos = [];

    if (channelName) {
      videos = await fetchChannelVideosFiltered(channelName, keywords, count);
    } else if (keywords) {
      const videosUrl = `https://www.googleapis.com/youtube/v3/search?key=${getNextApiKey()}&part=snippet&q=${encodeURIComponent(keywords)}&maxResults=${count}&type=video`;
      const videosRes = await fetch(videosUrl);
      const videosData = await videosRes.json();
      videos = videosData.items || [];
    } else {
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${getNextApiKey()}&part=snippet&chart=mostPopular&maxResults=${count}&regionCode=US`;
      const videosRes = await fetch(videosUrl);
      const videosData = await videosRes.json();
      videos = videosData.items || [];
    }

    if (videos.length === 0) {
      ytResults.innerHTML = '<p>No videos found.</p>';
      return;
    }

    ytResults.innerHTML = '';
    videos.forEach(item => {
      const videoId = item.id.videoId || item.snippet.resourceId?.videoId || item.id;
      const title = item.snippet.title;
      const thumbnail = item.snippet.thumbnails?.medium?.url || '';

      const card = document.createElement('div');
      card.className = 'yt-video-card';

      const thumbImg = document.createElement('img');
      thumbImg.src = thumbnail;
      thumbImg.alt = title;

      const titleDiv = document.createElement('div');
      titleDiv.textContent = title;

      card.appendChild(thumbImg);
      card.appendChild(titleDiv);
      card.tabIndex = 0;

      card.addEventListener('click', () => {
        ytPlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        ytPlayer.style.display = 'block';
        ytPlayer.scrollIntoView({behavior: 'smooth'});
      });

      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });

      ytResults.appendChild(card);
    });
  } catch (error) {
    ytResults.innerHTML = '<p>Error loading results.</p>';
    console.error(error);
  }
});
// Embed video from pasted YouTube URL
ytUrlBtn.addEventListener('click', () => {
  const url = ytUrlInput.value.trim();
  if (!url) return;
  const videoId = extractVideoID(url);
  if (!videoId) {
    alert('Invalid YouTube URL.');
    return;
  }
  ytPlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  ytPlayer.style.display = 'block';
  ytPlayer.scrollIntoView({ behavior: 'smooth' });
});

// Helper function to extract YouTube video ID from URL
function extractVideoID(url) {
  const regex = /(?:youtube\.com\/.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};
