// Import Firebase SDK
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// 🔥 IMPORTANT: Remplacez ces valeurs par vos propres identifiants Firebase
// Vous les trouverez dans: Firebase Console > Project Settings > Your apps > Web app
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_PROJECT_ID.appspot.com",
    messagingSenderId: "VOTRE_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

// ℹ️ EXEMPLE DE CONFIGURATION (ne pas utiliser tel quel)
/*
const firebaseConfig = {
    apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "stock-management-pro.firebaseapp.com",
    projectId: "stock-management-pro",
    storageBucket: "stock-management-pro.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890"
};
*/

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

console.log('✅ Firebase initialisé avec succès');

// Configuration supplémentaire
export const firebaseSettings = {
    appName: 'Stock Pro',
    version: '1.0.0',
    environment: 'production'
};