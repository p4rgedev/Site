// Firebase config
const firebaseConfig = {
		apiKey: "AIzaSyBlODXx-DUc854md33vCUQmfFmgbVVr2Z8",
		authDomain: "wallpuncherhub.firebaseapp.com",
		projectId: "wallpuncherhub",
		storageBucket: "wallpuncherhub.firebasestorage.app",
		messagingSenderId: "290890530719",
		appId: "1:290890530719:web:71757bb1bac1b421cdc7aa",
		measurementId: "G-GJNRHGBBLX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();
