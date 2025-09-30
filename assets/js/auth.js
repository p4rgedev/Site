const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toggleLink = document.getElementById('toggle-link');
const authTitle = document.getElementById('auth-title');

function hashPassword(password) {
		return btoa(password); // simple base64 hashing (replace with stronger hash if needed)
}

// Toggle between login and register
toggleLink.addEventListener('click', () => {
		if (loginForm.style.display === 'none') {
				loginForm.style.display = 'block';
				registerForm.style.display = 'none';
				authTitle.textContent = 'Login';
				toggleLink.textContent = "Don't have an account? Register here";
		} else {
				loginForm.style.display = 'none';
				registerForm.style.display = 'block';
				authTitle.textContent = 'Register';
				toggleLink.textContent = "Already have an account? Login here";
		}
});

// Login handler
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

// Register handler with auto-login
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

		// Auto-login
		localStorage.setItem('user', username);
		location.href = 'games.html';
});
