const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

function hashPassword(password) {
		return btoa(password); // simple base64 hashing (replace with stronger hash if needed)
}

loginForm?.addEventListener('submit', async e => {
		e.preventDefault();
		const username = document.getElementById('username').value;
		const passwordHash = hashPassword(document.getElementById('password').value);

		const snapshot = await db.ref(`users/${username}`).get();
		if (!snapshot.exists()) return alert("User not found");
		const data = snapshot.val();
		if (data.banned) return alert("You are banned");
		if (data.passwordHash !== passwordHash) return alert("Wrong password");

		localStorage.setItem('user', username);
		location.href = 'games.html';
});

registerForm?.addEventListener('submit', async e => {
		e.preventDefault();
		const username = document.getElementById('reg-username').value;
		const passwordHash = hashPassword(document.getElementById('reg-password').value);

		const snapshot = await db.ref(`users/${username}`).get();
		if (snapshot.exists()) return alert("Username taken");

		await db.ref(`users/${username}`).set({
				username,
				passwordHash,
				banned: false,
				usage: 0,
				'yt-searches': []
		});

		alert("Registered! You can now login.");
});
