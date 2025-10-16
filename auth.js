import { auth, db } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Google Provider
const googleProvider = new GoogleAuthProvider();

// ============== UTILITIES ==============

function showLoading(show = true) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.classList.toggle('hidden', !show);
    }
}

function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
        setTimeout(() => errorEl.classList.add('hidden'), 5000);
    }
}

function showSuccess(message) {
    const successEl = document.getElementById('success-message');
    if (successEl) {
        successEl.textContent = message;
        successEl.classList.remove('hidden');
        setTimeout(() => successEl.classList.add('hidden'), 3000);
    }
}

// ============== INSCRIPTION ==============

const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const companyName = document.getElementById('company-name').value.trim();
        const fullName = document.getElementById('full-name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const role = document.getElementById('role').value;
        
        // Validation
        if (password !== confirmPassword) {
            showError('Les mots de passe ne correspondent pas');
            return;
        }
        
        if (password.length < 6) {
            showError('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }
        
        if (!role) {
            showError('Veuillez sélectionner un rôle');
            return;
        }
        
        showLoading(true);
        
        try {
            // Créer l'utilisateur
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Créer le profil utilisateur dans Firestore
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: email,
                fullName: fullName,
                companyName: companyName,
                role: role,
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp()
            });
            
            showSuccess('Compte créé avec succès ! Redirection...');
            
            // Redirection vers le dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } catch (error) {
            showLoading(false);
            console.error('Erreur inscription:', error);
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    showError('Cet email est déjà utilisé');
                    break;
                case 'auth/invalid-email':
                    showError('Email invalide');
                    break;
                case 'auth/weak-password':
                    showError('Mot de passe trop faible');
                    break;
                default:
                    showError('Erreur lors de l\'inscription: ' + error.message);
            }
        }
    });
}

// ============== CONNEXION ==============

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        showLoading(true);
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Mettre à jour la dernière connexion
            await setDoc(doc(db, 'users', user.uid), {
                lastLogin: serverTimestamp()
            }, { merge: true });
            
            showSuccess('Connexion réussie ! Redirection...');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
        
    } catch (error) {
        showLoading(false);
        console.error('Erreur Google Auth:', error);
        showError('Erreur de connexion avec Google: ' + error.message);
    }
}

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', handleGoogleAuth);
}

if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener('click', handleGoogleAuth);
}

// ============== MOT DE PASSE OUBLIÉ ==============

const forgotPasswordLink = document.querySelector('.forgot-password');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            showError('Veuillez entrer votre email');
            return;
        }
        
        try {
            await sendPasswordResetEmail(auth, email);
            showSuccess('Email de réinitialisation envoyé ! Vérifiez votre boîte mail');
        } catch (error) {
            console.error('Erreur reset password:', error);
            showError('Erreur lors de l\'envoi de l\'email: ' + error.message);
        }
    });
}

// ============== VÉRIFICATION AUTHENTIFICATION ==============

onAuthStateChanged(auth, async (user) => {
    const currentPage = window.location.pathname;
    
    if (user) {
        // Utilisateur connecté
        console.log('Utilisateur connecté:', user.email);
        
        // Si sur page login/register, rediriger vers dashboard
        if (currentPage.includes('index.html') || currentPage.includes('register.html') || currentPage === '/') {
            window.location.href = 'dashboard.html';
        }
        
        // Charger les données utilisateur
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                sessionStorage.setItem('currentUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    ...userData
                }));
            }
        } catch (error) {
            console.error('Erreur chargement profil:', error);
        }
        
    } else {
        // Utilisateur non connecté
        console.log('Aucun utilisateur connecté');
        
        // Si sur dashboard, rediriger vers login
        if (currentPage.includes('dashboard.html')) {
            window.location.href = 'index.html';
        }
        
        sessionStorage.removeItem('currentUser');
    }
});

// ============== DÉCONNEXION ==============

export async function logout() {
    try {
        await signOut(auth);
        sessionStorage.clear();
        localStorage.removeItem('rememberMe');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        showError('Erreur lors de la déconnexion');
    }
}

// Exposer la fonction logout globalement
window.logout = logout;
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
            
        } catch (error) {
            showLoading(false);
            console.error('Erreur connexion:', error);
            
            switch (error.code) {
                case 'auth/user-not-found':
                    showError('Aucun compte trouvé avec cet email');
                    break;
                case 'auth/wrong-password':
                    showError('Mot de passe incorrect');
                    break;
                case 'auth/invalid-email':
                    showError('Email invalide');
                    break;
                case 'auth/too-many-requests':
                    showError('Trop de tentatives. Réessayez plus tard');
                    break;
                default:
                    showError('Erreur de connexion: ' + error.message);
            }
        }
    });
}

// ============== CONNEXION GOOGLE ==============

const googleLoginBtn = document.getElementById('google-login');
const googleRegisterBtn = document.getElementById('google-register');

async function handleGoogleAuth() {
    showLoading(true);
    
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Vérifier si le profil existe
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Nouveau utilisateur Google
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                fullName: user.displayName || 'Utilisateur',
                companyName: 'Mon Entreprise',
                role: 'admin',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                photoURL: user.photoURL
            });
        } else {
            // Utilisateur existant
            await setDoc(doc(db, 'users', user.uid), {
                lastLogin: serverTimestamp()
            }, { merge: true });
        }
        
        showSuccess('Connexion réussie ! Redirection...');