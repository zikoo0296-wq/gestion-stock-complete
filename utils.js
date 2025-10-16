// ============== UTILITAIRES GÉNÉRAUX ==============

/**
 * Formate un nombre en devise
 */
export function formatCurrency(amount, currency = 'DH') {
    return `${parseFloat(amount).toFixed(2)} ${currency}`;
}

/**
 * Formate une date
 */
export function formatDate(date, format = 'full') {
    if (!date) return 'Date inconnue';
    
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    
    if (format === 'full') {
        return d.toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (format === 'short') {
        return d.toLocaleDateString('fr-FR');
    } else if (format === 'time') {
        return d.toLocaleTimeString('fr-FR');
    }
    
    return d.toLocaleString('fr-FR');
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Vérifie si une chaîne est vide
 */
export function isEmpty(str) {
    return !str || str.trim().length === 0;
}

/**
 * Capitalise la première lettre
 */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Génère un ID unique
 */
export function generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function - limite l'exécution d'une fonction
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Valide une adresse email
 */
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Valide un numéro de téléphone (format international)
 */
export function isValidPhone(phone) {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(phone);
}

/**
 * Tronque un texte
 */
export function truncate(str, maxLength = 50) {
    if (!str || str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

/**
 * Copie du texte dans le presse-papiers
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Erreur copie:', err);
        return false;
    }
}

/**
 * Télécharge un fichier
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

/**
 * Calcule le pourcentage
 */
export function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return ((value / total) * 100).toFixed(2);
}

/**
 * Génère une couleur aléatoire
 */
export function randomColor() {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#43e97b', '#fa709a', '#fee140', '#30cfd0'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Trie un tableau d'objets par une propriété
 */
export function sortByProperty(array, property, ascending = true) {
    return [...array].sort((a, b) => {
        const aVal = a[property];
        const bVal = b[property];
        
        if (aVal < bVal) return ascending ? -1 : 1;
        if (aVal > bVal) return ascending ? 1 : -1;
        return 0;
    });
}

/**
 * Filtre un tableau par recherche
 */
export function filterBySearch(array, searchTerm, properties) {
    if (!searchTerm) return array;
    
    const term = searchTerm.toLowerCase();
    return array.filter(item => {
        return properties.some(prop => {
            const value = item[prop];
            return value && value.toString().toLowerCase().includes(term);
        });
    });
}

/**
 * Groupe un tableau par une propriété
 */
export function groupBy(array, property) {
    return array.reduce((groups, item) => {
        const key = item[property];
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});
}

/**
 * Calcule des statistiques sur un tableau
 */
export function calculateStats(array, property) {
    if (array.length === 0) return { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
    
    const values = array.map(item => parseFloat(item[property]) || 0);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return {
        sum,
        avg: parseFloat(avg.toFixed(2)),
        min,
        max,
        count: array.length
    };
}

/**
 * Vérifie si l'utilisateur est sur mobile
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Obtient la position de scroll
 */
export function getScrollPosition() {
    return {
        x: window.pageXOffset || document.documentElement.scrollLeft,
        y: window.pageYOffset || document.documentElement.scrollTop
    };
}

/**
 * Scroll vers un élément
 */
export function scrollToElement(elementId, offset = 0) {
    const element = document.getElementById(elementId);
    if (element) {
        const top = element.offsetTop - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    }
}

/**
 * Stockage local sécurisé
 */
export const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (err) {
            console.error('Erreur storage.set:', err);
            return false;
        }
    },
    
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (err) {
            console.error('Erreur storage.get:', err);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (err) {
            console.error('Erreur storage.remove:', err);
            return false;
        }
    },
    
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch (err) {
            console.error('Erreur storage.clear:', err);
            return false;
        }
    }
};

/**
 * Gestion des erreurs Firebase
 */
export function getFirebaseErrorMessage(error) {
    const errorMessages = {
        'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
        'auth/invalid-email': 'Adresse email invalide',
        'auth/operation-not-allowed': 'Opération non autorisée',
        'auth/weak-password': 'Le mot de passe est trop faible',
        'auth/user-disabled': 'Ce compte a été désactivé',
        'auth/user-not-found': 'Aucun compte trouvé avec cet email',
        'auth/wrong-password': 'Mot de passe incorrect',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard',
        'permission-denied': 'Accès refusé',
        'not-found': 'Document introuvable',
        'already-exists': 'Document déjà existant',
        'resource-exhausted': 'Quota dépassé',
        'unauthenticated': 'Non authentifié',
        'unavailable': 'Service temporairement indisponible'
    };
    
    return errorMessages[error.code] || `Erreur: ${error.message}`;
}

/**
 * Validation de formulaire
 */
export function validateForm(formData, rules) {
    const errors = {};
    
    for (const [field, value] of Object.entries(formData)) {
        const fieldRules = rules[field];
        if (!fieldRules) continue;
        
        // Required
        if (fieldRules.required && isEmpty(value)) {
            errors[field] = `${field} est requis`;
        }
        
        // Email
        if (fieldRules.email && !isEmpty(value) && !isValidEmail(value)) {
            errors[field] = 'Email invalide';
        }
        
        // Min length
        if (fieldRules.minLength && value.length < fieldRules.minLength) {
            errors[field] = `Minimum ${fieldRules.minLength} caractères`;
        }
        
        // Max length
        if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
            errors[field] = `Maximum ${fieldRules.maxLength} caractères`;
        }
        
        // Pattern
        if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
            errors[field] = fieldRules.patternMessage || 'Format invalide';
        }
    }
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Export CSV
 */
export function exportToCSV(data, filename) {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                return typeof value === 'string' && value.includes(',') 
                    ? `"${value}"` 
                    : value;
            }).join(',')
        )
    ].join('\n');
    
    downloadFile(csv, `${filename}.csv`, 'text/csv');
}

/**
 * Logger personnalisé
 */
export const logger = {
    info: (...args) => console.log('ℹ️', ...args),
    success: (...args) => console.log('✅', ...args),
    warning: (...args) => console.warn('⚠️', ...args),
    error: (...args) => console.error('❌', ...args),
    debug: (...args) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('🐛', ...args);
        }
    }
};

/**
 * Gestion du cache en mémoire
 */
class Cache {
    constructor(ttl = 300000) { // 5 minutes par défaut
        this.cache = new Map();
        this.ttl = ttl;
    }
    
    set(key, value) {
        this.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return item.value;
    }
    
    has(key) {
        return this.get(key) !== null;
    }
    
    delete(key) {
        this.cache.delete(key);
    }
    
    clear() {
        this.cache.clear();
    }
}

export const cache = new Cache();

console.log('✅ Utilitaires chargés');

export default {
    formatCurrency,
    formatDate,
    formatNumber,
    isEmpty,
    capitalize,
    generateId,
    debounce,
    isValidEmail,
    isValidPhone,
    truncate,
    copyToClipboard,
    downloadFile,
    calculatePercentage,
    randomColor,
    sortByProperty,
    filterBySearch,
    groupBy,
    calculateStats,
    isMobile,
    getScrollPosition,
    scrollToElement,
    storage,
    getFirebaseErrorMessage,
    validateForm,
    exportToCSV,
    logger,
    cache
};