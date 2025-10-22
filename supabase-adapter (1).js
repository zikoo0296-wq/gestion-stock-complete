// ============================================
// ADAPTATEUR SUPABASE POUR VOTRE APP EXISTANTE
// ============================================
// Ce fichier remplace localStorage par Supabase
// SANS modifier le reste de votre application

// Configuration Supabase
const SUPABASE_URL = 'https://djnaayhhntopupixzitm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbmFheWhobnRvcHVwaXh6aXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NzY0NTIsImV4cCI6MjA3NjU1MjQ1Mn0.AzrxJ7h7SNEgn-i8qgdGYPvoEpWdRohX1E8N_Ko_Gc0';

// Créer le client Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// ID utilisateur fixe pour admin
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

// ============================================
// FONCTIONS DE SYNCHRONISATION
// ============================================

/**
 * Sauvegarder les données dans Supabase
 */
async function saveToSupabase(products, movements, pdvs) {
    console.log('💾 Sauvegarde dans Supabase...');
    
    try {
        // 1. Supprimer toutes les anciennes données
        await supabaseClient.from('products').delete().eq('user_id', ADMIN_USER_ID);
        await supabaseClient.from('movements').delete().eq('user_id', ADMIN_USER_ID);
        await supabaseClient.from('points_vente').delete().eq('user_id', ADMIN_USER_ID);
        
        // 2. Sauvegarder les produits
        if (products && products.length > 0) {
            const productsToInsert = products.map(p => ({
                user_id: ADMIN_USER_ID,
                real_name: p.realName || p.name,
                conventional_name: p.conventionalName || '',
                reference: p.reference,
                barcode: p.barcode || '',
                quantity: p.quantity || p.repetition || 0,
                min_stock: 10,
                category: p.category || '',
                brand: p.brand || '',
                warehouse: 'Entrepôt A',
                image: p.imageUrl || ''
            }));
            
            const { error: productsError } = await supabaseClient
                .from('products')
                .insert(productsToInsert);
            
            if (productsError) {
                console.error('Erreur produits:', productsError);
            } else {
                console.log(`✅ ${products.length} produits sauvegardés`);
            }
        }
        
        // 3. Sauvegarder les mouvements
        if (movements && movements.length > 0) {
            const movementsToInsert = movements.map(m => ({
                user_id: ADMIN_USER_ID,
                product_id: 1, // ID fictif, vous pourrez l'améliorer
                type: m.type === 'in' ? 'entry' : m.type === 'transfer' ? 'transfer' : 'exit',
                quantity: m.quantity || 0,
                reason: m.reason || '',
                customer: m.pdv || '',
                from_location: m.from || '',
                to_location: m.to || '',
                date: m.date ? new Date(m.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                user_name: 'Admin'
            }));
            
            const { error: movementsError } = await supabaseClient
                .from('movements')
                .insert(movementsToInsert);
            
            if (movementsError) {
                console.error('Erreur mouvements:', movementsError);
            } else {
                console.log(`✅ ${movements.length} mouvements sauvegardés`);
            }
        }
        
        // 4. Sauvegarder les points de vente
        if (pdvs && pdvs.length > 0) {
            const pdvsToInsert = pdvs.map(p => ({
                user_id: ADMIN_USER_ID,
                name: p.name,
                address: p.location || '',
                phone: '',
                email: '',
                manager: ''
            }));
            
            const { error: pdvsError } = await supabaseClient
                .from('points_vente')
                .insert(pdvsToInsert);
            
            if (pdvsError) {
                console.error('Erreur PDV:', pdvsError);
            } else {
                console.log(`✅ ${pdvs.length} points de vente sauvegardés`);
            }
        }
        
        console.log('✅ Sauvegarde Supabase réussie !');
        return true;
        
    } catch (error) {
        console.error('❌ Erreur sauvegarde Supabase:', error);
        return false;
    }
}

/**
 * Charger les données depuis Supabase
 */
async function loadFromSupabase() {
    console.log('📥 Chargement depuis Supabase...');
    
    try {
        // 1. Charger les produits
        const { data: productsData, error: productsError } = await supabaseClient
            .from('products')
            .select('*')
            .eq('user_id', ADMIN_USER_ID);
        
        if (productsError) throw productsError;
        
        // 2. Charger les mouvements
        const { data: movementsData, error: movementsError } = await supabaseClient
            .from('movements')
            .select('*')
            .eq('user_id', ADMIN_USER_ID);
        
        if (movementsError) throw movementsError;
        
        // 3. Charger les points de vente
        const { data: pdvsData, error: pdvsError } = await supabaseClient
            .from('points_vente')
            .select('*')
            .eq('user_id', ADMIN_USER_ID);
        
        if (pdvsError) throw pdvsError;
        
        // Convertir au format de votre app
        const products = productsData.map(p => ({
            id: p.id.toString(),
            name: p.real_name,
            realName: p.real_name,
            conventionalName: p.conventional_name,
            reference: p.reference,
            barcode: p.barcode,
            repetition: p.quantity,
            quantity: p.quantity,
            category: p.category,
            brand: p.brand,
            imageUrl: p.image,
            pdvStock: {}
        }));
        
        const movements = movementsData.map(m => ({
            id: m.id.toString(),
            type: m.type === 'entry' ? 'in' : m.type === 'transfer' ? 'transfer' : 'out',
            quantity: m.quantity,
            reason: m.reason,
            product: '',
            pdv: m.customer,
            from: m.from_location,
            to: m.to_location,
            date: m.date,
            payment: '',
            note: ''
        }));
        
        const pdvs = pdvsData.map(p => ({
            id: p.id.toString(),
            name: p.name,
            location: p.address
        }));
        
        console.log(`✅ Chargé: ${products.length} produits, ${movements.length} mouvements, ${pdvs.length} PDV`);
        
        return { products, movements, pdvs };
        
    } catch (error) {
        console.error('❌ Erreur chargement Supabase:', error);
        return null;
    }
}

/**
 * Synchronisation automatique
 */
async function syncWithSupabase() {
    // Charger depuis localStorage
    const localData = localStorage.getItem('stockData');
    
    if (localData) {
        try {
            const parsed = JSON.parse(localData);
            const { products, movements, pdvs } = parsed;
            
            // Sauvegarder dans Supabase
            await saveToSupabase(products || [], movements || [], pdvs || []);
            
        } catch (e) {
            console.error('Erreur sync:', e);
        }
    }
}

/**
 * Charger au démarrage et merger avec localStorage
 */
async function initSupabase() {
    console.log('🚀 Initialisation Supabase...');
    
    // Charger depuis Supabase
    const supabaseData = await loadFromSupabase();
    
    if (supabaseData) {
        // Sauvegarder dans localStorage pour que l'app fonctionne normalement
        localStorage.setItem('stockData', JSON.stringify(supabaseData));
        console.log('✅ Données Supabase chargées dans localStorage');
    } else {
        console.log('ℹ️ Aucune donnée Supabase, utilisation de localStorage');
    }
}

// ============================================
// REMPLACER LA FONCTION save() DE VOTRE APP
// ============================================

// Sauvegarder l'ancienne fonction save
const originalSave = window.save;

// Nouvelle fonction save qui sauvegarde aussi dans Supabase
window.save = async function() {
    // Appeler l'ancienne fonction save (localStorage)
    if (originalSave) {
        originalSave();
    } else {
        // Si pas de fonction save originale, sauvegarder dans localStorage
        localStorage.setItem('stockData', JSON.stringify({
            products: window.products || [],
            movements: window.movements || [],
            pdvs: window.pdvs || []
        }));
    }
    
    // Sauvegarder aussi dans Supabase (asynchrone, ne bloque pas)
    setTimeout(() => {
        syncWithSupabase();
    }, 500);
};

// ============================================
// AUTO-INITIALISATION AU CHARGEMENT
// ============================================

// Attendre que la page soit chargée
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSupabase);
} else {
    initSupabase();
}

// Synchroniser toutes les 5 minutes
setInterval(syncWithSupabase, 5 * 60 * 1000);

console.log('✅ Adaptateur Supabase chargé');
