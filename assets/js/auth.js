document.addEventListener('DOMContentLoaded', () => {
		const loginForm = document.getElementById('login-form');
		const registerForm = document.getElementById('register-form');
		const toggleLink = document.getElementById('toggle-link');
		const authTitle = document.getElementById('auth-title');

		function hashPassword(password) {
				return btoa(password); // simple hash for demonstration
		}

		// Toggle login/register
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

		// Login
		loginForm?.addEventListener('submit', async e => {
				e.preventDefault();
				const username = document.getElementById('username').value.trim();
				const passwordHash = hashPassword(document.getElementById('password').value);

				try {
						const docRef = db.collection('users').doc(username);
						const doc = await docRef.get();
						if (!doc.exists) return alert("User not found");

						const data = doc.data();
						if (data.banned) return alert("You are banned");
						if (data.passwordHash !== passwordHash) return alert("Wrong password");

						localStorage.setItem('user', username);
						location.href = 'games.html';
				} catch (err) {
						console.error(err);
						alert("Error logging in");
				}
		});

		// Register + auto-login
		registerForm?.addEventListener('submit', async e => {
				e.preventDefault();
				const username = document.getElementById('reg-username').value.trim();
				const passwordHash = hashPassword(document.getElementById('reg-password').value);

				try {
						const docRef = db.collection('users').doc(username);
						const doc = await docRef.get();
						if (doc.exists) return alert("Username taken");

						await docRef.set({
								username,
								passwordHash,
								banned: false,
								usage: 0,
								'yt-searches': []
						});

						localStorage.setItem('user', username);
						location.href = 'games.html';
				} catch (err) {
						console.error(err);
						alert("Error registering user");
				}
		});
});
