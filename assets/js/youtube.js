const searchBtn = document.getElementById('yt-search');
const queryInput = document.getElementById('yt-query');
const resultsDiv = document.getElementById('yt-results');

searchBtn?.addEventListener('click', async () => {
		const query = queryInput.value.trim();
		if (!query) return;

		const user = localStorage.getItem('user');
		const userRef = db.ref(`users/${user}`);
		const userData = (await userRef.get()).val();

		if (userData.usage >= 4000) return alert("Daily limit reached");

		const keysSnap = await db.ref('youtubeKeys').get();
		const keys = keysSnap.val();
		const activeKeys = Object.entries(keys).filter(([k,v]) => v.active && v.usage < 5000);

		if (!activeKeys.length) return alert("No active API keys");

		// select key with lowest usage
		activeKeys.sort((a,b) => a[1].usage - b[1].usage);
		const key = activeKeys[0][0];

		const maxResults = 20;
		const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${key}&q=${encodeURIComponent(query)}&part=snippet&type=video&maxResults=${maxResults}`);
		const data = await res.json();

		resultsDiv.innerHTML = '';
		data.items.forEach(item => {
				const vid = item.id.videoId;
				const title = item.snippet.title;
				const frame = document.createElement('iframe');
				frame.src = `https://www.youtube.com/embed/${vid}`;
				frame.width = "300";
				frame.height = "170";
				resultsDiv.appendChild(frame);
				const p = document.createElement('p');
				p.textContent = title;
				resultsDiv.appendChild(p);
		});

		const usageIncrement = 3.2291 * maxResults;
		await db.ref(`users/${user}/usage`).set(userData.usage + usageIncrement);
		await db.ref(`youtubeKeys/${key}/usage`).set(keys[key].usage + usageIncrement);
});
