// ============================================
// APP.JS - VERSION SUPABASE
// ============================================
// Ce fichier remplace Firebase par Supabase
// TOUT LE RESTE RESTE IDENTIQUE (design, calculs, fonctionnalités)

import { supabase } from './supabase-config.js';

// Variables globales
let currentUser = null;
let products = [];
let movements = [];
let pointsVente = [];
let currentPage = 'dashboard';
let editingProduct = null;

// ============== INITIALISATION ==============

// Vérifier l'authentification au chargement
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        currentUser = session.user;
        init();
    } else {
        window.location.href = 'index.html';
    }
});

// Écouter les changements d'authentification
supabase.auth.onAuthStateChanged((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        init();
    } else if (event === 'SIGNED_OUT') {
        window.location.href = 'index.html';
    }
});

async function init() {
    await loadUserData();
    await loadAllData();
    renderDashboard();
    setupRealtimeSubscriptions();
}

async function loadUserData() {
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        if (data) {
            document.getElementById('user-name').textContent = data.full_name || 'Utilisateur';
            document.getElementById('user-email').textContent = data.email;
            
            if (data.photo_url) {
                document.getElementById('user-avatar').innerHTML = `<img src="${data.photo_url}" style="width:100%;height:100%;border-radius:50%;">`;
            }
        }
    } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
    }
}

async function loadAllData() {
    showLoading(true);
    try {
        await Promise.all([
            loadProducts(),
            loadPointsVente(),
            loadMovements()
        ]);
    } catch (error) {
        console.error('Erreur chargement données:', error);
        showToast('Erreur de chargement des données', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        products = data.map(p => ({
            id: p.id,
            name: p.real_name,
            conventionalName: p.conventional_name,
            reference: p.reference,
            barcode: p.barcode,
            quantity: p.quantity,
            minStock: p.min_stock,
            category: p.category,
            brand: p.brand,
            warehouse: p.warehouse,
            image: p.image,
            price: 0, // À ajouter si vous avez un champ prix
            createdAt: p.created_at
        }));
    } catch (error) {
        console.error('Erreur chargement produits:', error);
    }
}

async function loadPointsVente() {
    try {
        const { data, error } = await supabase
            .from('points_vente')
            .select('*')
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        pointsVente = data.map(p => ({
            id: p.id,
            name: p.name,
            address: p.address,
            phone: p.phone,
            email: p.email,
            manager: p.manager
        }));
    } catch (error) {
        console.error('Erreur chargement PDV:', error);
    }
}

async function loadMovements() {
    try {
        const { data, error } = await supabase
            .from('movements')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false });
        
        if (error) throw error;
        
        movements = data.map(m => ({
            id: m.id,
            productId: m.product_id,
            type: m.type,
            quantity: m.quantity,
            reason: m.reason,
            customer: m.customer,
            fromLocation: m.from_location,
            toLocation: m.to_location,
            date: m.date,
            userName: m.user_name
        }));
    } catch (error) {
        console.error('Erreur chargement mouvements:', error);
    }
}

// ============== REALTIME SUBSCRIPTIONS ==============

function setupRealtimeSubscriptions() {
    // Écouter les changements sur les produits en temps réel
    supabase
        .channel('products_changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${currentUser.id}` },
            async (payload) => {
                console.log('Changement produit:', payload);
                await loadProducts();
                if (currentPage === 'products') renderProducts();
                if (currentPage === 'dashboard') renderDashboard();
            }
        )
        .subscribe();
    
    // Écouter les changements sur les mouvements
    supabase
        .channel('movements_changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'movements', filter: `user_id=eq.${currentUser.id}` },
            async (payload) => {
                console.log('Changement mouvement:', payload);
                await loadMovements();
                await loadProducts(); // Recharger aussi les produits car les quantités ont changé
                if (currentPage === 'movements') renderMovements();
                if (currentPage === 'history') renderHistory();
                if (currentPage === 'dashboard') renderDashboard();
            }
        )
        .subscribe();
}

// ============== UTILITIES ==============

function showLoading(show = true) {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.classList.toggle('hidden', !show);
    }
}

function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = `<div>${type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠'}</div><div>${msg}</div>`;
    container.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function showPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });
    
    const titles = {
        dashboard: 'Dashboard',
        products: 'Gestion des Produits',
        movements: 'Mouvements de Stock',
        pointsVente: 'Points de Vente',
        history: 'Historique'
    };
    
    document.getElementById('page-title').textContent = titles[page] || 'Dashboard';
    
    if (page === 'dashboard') renderDashboard();
    else if (page === 'products') renderProducts();
    else if (page === 'movements') renderMovements();
    else if (page === 'pointsVente') renderPointsVente();
    else if (page === 'history') renderHistory();
}

window.showPage = showPage;

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

window.toggleSidebar = toggleSidebar;

// ============== DASHBOARD ==============

function renderDashboard() {
    const total = products.length;
    const stock = products.reduce((s, p) => s + (p.quantity || 0), 0);
    const low = products.filter(p => (p.quantity || 0) < (p.minStock || 10)).length;
    const value = products.reduce((s, p) => s + ((p.quantity || 0) * (p.price || 0)), 0);

    document.getElementById('app-container').innerHTML = `
        <div class="card">
            <input type="text" id="dash-search" class="search-input" placeholder="🔍 Rechercher un produit en alerte..." style="width:100%;">
        </div>
        
        <div class="stats-grid">
            <div class="stat-card blue">
                <div class="stat-label">Total Produits</div>
                <div class="stat-value">${total}</div>
            </div>
            <div class="stat-card green">
                <div class="stat-label">Stock Total</div>
                <div class="stat-value">${stock}</div>
            </div>
            <div class="stat-card red">
                <div class="stat-label">Alertes Stock</div>
                <div class="stat-value">${low}</div>
            </div>
            <div class="stat-card orange">
                <div class="stat-label">Valeur Stock</div>
                <div class="stat-value">${value.toFixed(2)} DH</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">🚨 Alertes Stock (< 10 unités)</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Référence</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="dash-body">${renderAlerts(products.filter(p => (p.quantity || 0) < (p.minStock || 10)))}</tbody>
                </table>
            </div>
        </div>
    `;

    const searchInput = document.getElementById('dash-search');
    if (searchInput) {
        searchInput.oninput = function() {
            const s = this.value.toLowerCase();
            const f = products.filter(p => 
                (p.quantity || 0) < (p.minStock || 10) && 
                (p.name.toLowerCase().includes(s) || p.reference.toLowerCase().includes(s))
            );
            document.getElementById('dash-body').innerHTML = renderAlerts(f);
        };
    }
}

function renderAlerts(list) {
    if (list.length === 0) return '<tr><td colspan="4" style="text-align:center;padding:2rem;color:#999;">Aucune alerte</td></tr>';
    return list.map(p => `
        <tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.reference}</td>
            <td style="color:#ef4444;"><strong>${p.quantity || 0}</strong></td>
            <td><button class="btn btn-primary" onclick="quickRestock('${p.id}')" style="padding:8px 16px;">➕ Réapprovisionner</button></td>
        </tr>
    `).join('');
}

window.quickRestock = async function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const qty = prompt(`Quantité à ajouter pour "${product.name}" :`);
    if (qty && !isNaN(qty) && parseInt(qty) > 0) {
        await addMovement('entry', product.id, parseInt(qty), 'Réapprovisionnement rapide');
    }
};

// ============== PRODUITS ==============

function renderProducts() {
    document.getElementById('app-container').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">📦 Gestion des Produits</h3>
                <div class="btn-group">
                    <input type="text" id="prod-search" class="search-input" placeholder="🔍 Rechercher...">
                    <button class="btn btn-primary" onclick="openProductModal()">➕ Ajouter</button>
                    <button class="btn btn-success" onclick="openImportModal()">📤 Importer</button>
                    <button class="btn btn-warning" onclick="exportProducts()">📥 Exporter</button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Nom</th>
                            <th>Référence</th>
                            <th>Catégorie</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="prod-body">${renderProdRows(products)}</tbody>
                </table>
            </div>
        </div>
    `;

    const searchInput = document.getElementById('prod-search');
    if (searchInput) {
        searchInput.oninput = function() {
            const s = this.value.toLowerCase();
            const f = products.filter(p => 
                p.name.toLowerCase().includes(s) || 
                p.reference.toLowerCase().includes(s) ||
                (p.category || '').toLowerCase().includes(s)
            );
            document.getElementById('prod-body').innerHTML = renderProdRows(f);
        };
    }
}

function renderProdRows(list) {
    if (list.length === 0) return '<tr><td colspan="6" style="text-align:center;padding:2rem;">Aucun produit</td></tr>';
    
    return list.map(p => {
        let img = '📦';
        if (p.image) {
            const match = p.image.match(/[?&]id=([^&]+)/);
            if (match) {
                const id = match[1];
                img = `<img src="https://drive.google.com/thumbnail?id=${id}&sz=w200" class="product-img" onclick="openImgModal('${p.image}')">`;
            }
        }
        
        return `
            <tr>
                <td>${img}</td>
                <td>
                    <strong>${p.name}</strong><br>
                    ${p.conventionalName ? `<small style="color:#666;">${p.conventionalName}</small>` : ''}
                </td>
                <td>${p.reference}</td>
                <td>${p.category || '-'}</td>
                <td><strong style="font-size:1.1rem;">${p.quantity || 0}</strong></td>
                <td>
                    <button class="btn-icon" onclick="editProduct('${p.id}')" title="Modifier">✏️</button>
                    <button class="btn-icon" onclick="deleteProduct('${p.id}')" title="Supprimer">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

// ============== AJOUTER / MODIFIER PRODUIT ==============

window.openProductModal = function(productId = null) {
    editingProduct = productId ? products.find(p => p.id === productId) : null;
    
    document.getElementById('modal-product').classList.add('active');
    document.getElementById('modal-title-product').textContent = editingProduct ? 'Modifier le produit' : 'Nouveau produit';
    
    if (editingProduct) {
        document.getElementById('prod-name').value = editingProduct.name;
        document.getElementById('prod-conv').value = editingProduct.conventionalName || '';
        document.getElementById('prod-ref').value = editingProduct.reference;
        document.getElementById('prod-barcode').value = editingProduct.barcode || '';
        document.getElementById('prod-qty').value = editingProduct.quantity || 0;
        document.getElementById('prod-min').value = editingProduct.minStock || 10;
        document.getElementById('prod-cat').value = editingProduct.category || '';
        document.getElementById('prod-brand').value = editingProduct.brand || '';
        document.getElementById('prod-warehouse').value = editingProduct.warehouse || '';
        document.getElementById('prod-img').value = editingProduct.image || '';
    } else {
        document.getElementById('form-product').reset();
    }
};

window.editProduct = function(productId) {
    openProductModal(productId);
};

window.closeProductModal = function() {
    document.getElementById('modal-product').classList.remove('active');
    editingProduct = null;
};

window.saveProduct = async function() {
    const name = document.getElementById('prod-name').value.trim();
    const conv = document.getElementById('prod-conv').value.trim();
    const ref = document.getElementById('prod-ref').value.trim();
    const barcode = document.getElementById('prod-barcode').value.trim();
    const qty = parseInt(document.getElementById('prod-qty').value) || 0;
    const min = parseInt(document.getElementById('prod-min').value) || 10;
    const cat = document.getElementById('prod-cat').value.trim();
    const brand = document.getElementById('prod-brand').value.trim();
    const warehouse = document.getElementById('prod-warehouse').value.trim();
    const img = document.getElementById('prod-img').value.trim();
    
    if (!name || !ref) {
        showToast('Le nom et la référence sont obligatoires', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const productData = {
            user_id: currentUser.id,
            real_name: name,
            conventional_name: conv,
            reference: ref,
            barcode: barcode,
            quantity: qty,
            min_stock: min,
            category: cat,
            brand: brand,
            warehouse: warehouse,
            image: img
        };
        
        if (editingProduct) {
            // Mise à jour
            const { error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', editingProduct.id)
                .eq('user_id', currentUser.id);
            
            if (error) throw error;
            showToast('Produit modifié avec succès');
        } else {
            // Création
            const { error } = await supabase
                .from('products')
                .insert([productData]);
            
            if (error) throw error;
            showToast('Produit ajouté avec succès');
        }
        
        await loadProducts();
        renderProducts();
        closeProductModal();
    } catch (error) {
        console.error('Erreur sauvegarde produit:', error);
        showToast('Erreur lors de la sauvegarde: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
};

window.deleteProduct = async function(productId) {
    if (!confirm('Supprimer ce produit ?')) return;
    
    showLoading(true);
    
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        showToast('Produit supprimé');
        await loadProducts();
        renderProducts();
    } catch (error) {
        console.error('Erreur suppression:', error);
        showToast('Erreur lors de la suppression', 'error');
    } finally {
        showLoading(false);
    }
};

// ============== MOUVEMENTS ==============

async function addMovement(type, productId, quantity, reason, customer = null, fromLocation = null, toLocation = null) {
    showLoading(true);
    
    try {
        const product = products.find(p => p.id === productId);
        if (!product) throw new Error('Produit introuvable');
        
        let newQty = product.quantity;
        
        if (type === 'entry') {
            newQty += quantity;
        } else if (type === 'exit') {
            if (newQty < quantity) {
                throw new Error('Stock insuffisant');
            }
            newQty -= quantity;
        }
        
        // Mettre à jour la quantité du produit
        const { error: updateError } = await supabase
            .from('products')
            .update({ quantity: newQty })
            .eq('id', productId)
            .eq('user_id', currentUser.id);
        
        if (updateError) throw updateError;
        
        // Créer le mouvement
        const { error: movementError } = await supabase
            .from('movements')
            .insert([{
                user_id: currentUser.id,
                product_id: productId,
                type: type,
                quantity: quantity,
                reason: reason,
                customer: customer,
                from_location: fromLocation,
                to_location: toLocation,
                date: new Date().toISOString().split('T')[0],
                user_name: currentUser.email
            }]);
        
        if (movementError) throw movementError;
        
        showToast('Mouvement enregistré');
        await loadProducts();
        await loadMovements();
        
        if (currentPage === 'dashboard') renderDashboard();
        if (currentPage === 'movements') renderMovements();
        if (currentPage === 'history') renderHistory();
    } catch (error) {
        console.error('Erreur mouvement:', error);
        showToast('Erreur: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function renderMovements() {
    document.getElementById('app-container').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">📊 Mouvements de Stock</h3>
                <div class="btn-group">
                    <button class="btn btn-success" onclick="openMovementModal('entry')">➕ Entrée</button>
                    <button class="btn btn-danger" onclick="openMovementModal('exit')">➖ Sortie</button>
                    <button class="btn btn-warning" onclick="openMovementModal('transfer')">🔄 Transfert</button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Quantité</th>
                            <th>Raison</th>
                            <th>Client</th>
                        </tr>
                    </thead>
                    <tbody>${renderMovementRows(movements)}</tbody>
                </table>
            </div>
        </div>
    `;
}

function renderMovementRows(list) {
    if (list.length === 0) return '<tr><td colspan="5" style="text-align:center;padding:2rem;">Aucun mouvement</td></tr>';
    
    return list.map(m => {
        const typeLabel = m.type === 'entry' ? 'Entrée' : m.type === 'exit' ? 'Sortie' : 'Transfert';
        const typeColor = m.type === 'entry' ? '#10b981' : m.type === 'exit' ? '#ef4444' : '#f59e0b';
        
        return `
            <tr>
                <td>${m.date}</td>
                <td><span style="color:${typeColor};font-weight:600;">${typeLabel}</span></td>
                <td><strong>${m.quantity}</strong></td>
                <td>${m.reason || '-'}</td>
                <td>${m.customer || '-'}</td>
            </tr>
        `;
    }).join('');
}

// ============== POINTS DE VENTE ==============

function renderPointsVente() {
    document.getElementById('app-container').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">🏪 Points de Vente</h3>
                <button class="btn btn-primary" onclick="openPdvModal()">➕ Ajouter</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Adresse</th>
                            <th>Téléphone</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>${renderPdvRows(pointsVente)}</tbody>
                </table>
            </div>
        </div>
    `;
}

function renderPdvRows(list) {
    if (list.length === 0) return '<tr><td colspan="4" style="text-align:center;padding:2rem;">Aucun point de vente</td></tr>';
    
    return list.map(p => `
        <tr>
            <td><strong>${p.name}</strong></td>
            <td>${p.address || '-'}</td>
            <td>${p.phone || '-'}</td>
            <td>
                <button class="btn-icon" onclick="editPdv('${p.id}')" title="Modifier">✏️</button>
                <button class="btn-icon" onclick="deletePdv('${p.id}')" title="Supprimer">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// ============== HISTORIQUE ==============

function renderHistory() {
    document.getElementById('app-container').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">📜 Historique Complet</h3>
                <input type="text" id="history-search" class="search-input" placeholder="🔍 Rechercher...">
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Quantité</th>
                            <th>Raison</th>
                            <th>Utilisateur</th>
                        </tr>
                    </thead>
                    <tbody id="history-body">${renderMovementRows(movements)}</tbody>
                </table>
            </div>
        </div>
    `;
    
    const searchInput = document.getElementById('history-search');
    if (searchInput) {
        searchInput.oninput = function() {
            const s = this.value.toLowerCase();
            const f = movements.filter(m => 
                (m.reason || '').toLowerCase().includes(s) ||
                (m.customer || '').toLowerCase().includes(s) ||
                (m.userName || '').toLowerCase().includes(s)
            );
            document.getElementById('history-body').innerHTML = renderMovementRows(f);
        };
    }
}

// ============== EXPORT ==============

window.exportProducts = function() {
    if (products.length === 0) {
        showToast('Aucun produit à exporter', 'warning');
        return;
    }
    
    const headers = ['Nom', 'Nom Conventionnel', 'Référence', 'Code-barres', 'Quantité', 'Stock Min', 'Catégorie', 'Marque', 'Entrepôt'];
    const rows = products.map(p => [
        p.name,
        p.conventionalName || '',
        p.reference,
        p.barcode || '',
        p.quantity,
        p.minStock,
        p.category || '',
        p.brand || '',
        p.warehouse || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `produits_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('Export réussi');
};

// ============== IMAGE MODAL ==============

window.openImgModal = function(imageUrl) {
    const match = imageUrl.match(/[?&]id=([^&]+)/);
    if (match) {
        const id = match[1];
        const fullImageUrl = `https://drive.google.com/uc?export=view&id=${id}`;
        document.getElementById('img-modal-img').src = fullImageUrl;
        document.getElementById('img-modal').classList.add('active');
    }
};

window.closeImgModal = function() {
    document.getElementById('img-modal').classList.remove('active');
};

// ============== DÉCONNEXION ==============

window.logout = async function() {
    if (!confirm('Se déconnecter ?')) return;
    
    try {
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        showToast('Erreur lors de la déconnexion', 'error');
    }
};

console.log('✅ App Supabase chargée');

import { saveProduit } from './supabase-adapter.js'

// منين كيزيد منتوج جديد:
saveProduit(nomProduit, stockProduit)

import { updateStock } from './supabase-adapter.js'

updateStock(idProduit, nouveauStock)
