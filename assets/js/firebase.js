<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js"></script>
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
