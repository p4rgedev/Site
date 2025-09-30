const gamesGrid = document.getElementById('games-grid');
const gamesJSON = '/games/games.json';

async function loadGames() {
		try {
				const response = await fetch(gamesJSON);
				if (!response.ok) throw new Error('Failed to load games.json');

				const games = await response.json();
				gamesGrid.innerHTML = '';

				for (const game of games) {
						const div = document.createElement('div');
						div.className = 'game-card';
						div.innerHTML = `
						<img src="/games/${game.name}/cover.png" alt="${game.name}" width="150">
						<p>${game.name}</p>
						`;
						div.addEventListener('click', () => {
								window.open(`/games/${game.name}/code/index.html`, '_blank');
						});
						gamesGrid.appendChild(div);
				}
		} catch (err) {
				gamesGrid.innerHTML = '<p>No games found or failed to load.</p>';
				console.error(err);
		}
}

// Run on page load
loadGames();
