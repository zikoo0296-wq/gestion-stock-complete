import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Variables globales
let currentUser = null;
let products = [];
let movements = [];
let pointsVente = [];
let currentPage = 'dashboard';
let editingProduct = null;

// ============== INITIALISATION ==============

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData();
        await loadAllData();
        renderDashboard();
    } else {
        window.location.href = 'index.html';
    }
});

async function loadUserData() {
    try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('user-name').textContent = userData.fullName || 'Utilisateur';
            document.getElementById('user-email').textContent = userData.email;
            
            if (userData.photoURL) {
                document.getElementById('user-avatar').innerHTML = `<img src="${userData.photoURL}" style="width:100%;height:100%;border-radius:50%;">`;
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
        const q = query(collection(db, 'products'), where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Erreur chargement produits:', error);
    }
}

async function loadPointsVente() {
    try {
        const q = query(collection(db, 'pointsVente'), where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        pointsVente = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Erreur chargement PDV:', error);
    }
}

async function loadMovements() {
    try {
        const q = query(
            collection(db, 'movements'), 
            where('userId', '==', currentUser.uid),
            orderBy('date', 'desc')
        );
        const snapshot = await getDocs(q);
        movements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Erreur chargement mouvements:', error);
    }
}

// ============== UTILITIES ==============

function showLoading(show = true) {
    document.getElementById('loading').classList.toggle('hidden', !show);
}

function showToast(msg, type = 'success') {
    const div = document.createElement('div');
    div.className = `toast ${type}`;
    div.innerHTML = `<div>${type === 'success' ? '✓' : type === 'error' ? '✗' : '⚠'}</div><div>${msg}</div>`;
    document.getElementById('toast-container').appendChild(div);
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
    document.getElementById('sidebar').classList.toggle('active');
}

window.toggleSidebar = toggleSidebar;

// ============== DASHBOARD ==============

function renderDashboard() {
    const total = products.length;
    const stock = products.reduce((s, p) => s + (p.quantity || 0), 0);
    const low = products.filter(p => (p.quantity || 0) < 10).length;
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
                    <tbody id="dash-body">${renderAlerts(products.filter(p => (p.quantity || 0) < 10))}</tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('dash-search').oninput = function() {
        const s = this.value.toLowerCase();
        const f = products.filter(p => (p.quantity || 0) < 10 && (p.name.toLowerCase().includes(s) || p.reference.toLowerCase().includes(s)));
        document.getElementById('dash-body').innerHTML = renderAlerts(f);
    };
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

window.quickRestock = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const qty = prompt(`Quantité à ajouter pour "${product.name}" :`);
    if (qty && !isNaN(qty) && parseInt(qty) > 0) {
        addMovement('in', product.id, parseInt(qty), 'Réapprovisionnement rapide');
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
                            <th>Prix</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="prod-body">${renderProdRows(products)}</tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('prod-search').oninput = function() {
        const s = this.value.toLowerCase();
        const f = products.filter(p => 
            p.name.toLowerCase().includes(s) || 
            p.reference.toLowerCase().includes(s) ||
            (p.category || '').toLowerCase().includes(s)
        );
        document.getElementById('prod-body').innerHTML = renderProdRows(f);
    };
}

function renderProdRows(list) {
    if (list.length === 0) return '<tr><td colspan="7" style="text-align:center;padding:2rem;">Aucun produit</td></tr>';
    
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
                <td><strong>${(p.price || 0).toFixed(2)} DH</strong></td>
                <td>
                    <button class="btn btn-primary" onclick='editProduct("${p.id}")' style="padding:8px 12px;">✏️</button>
                    <button class="btn btn-danger" onclick='deleteProduct("${p.id}")' style="padding:8px 12px;">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

window.openProductModal = function() {
    editingProduct = null;
    document.getElementById('modal-title').textContent = 'Ajouter un produit';
    document.getElementById('product-form').reset();
    document.getElementById('product-modal').classList.add('active');
};

window.closeProductModal = function() {
    document.getElementById('product-modal').classList.remove('active');
};

window.editProduct = async function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    editingProduct = product;
    document.getElementById('modal-title').textContent = 'Modifier le produit';
    document.getElementById('product-image').value = product.image || '';
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-conventional').value = product.conventionalName || '';
    document.getElementById('product-ref').value = product.reference;
    document.getElementById('product-barcode').value = product.barcode || '';
    document.getElementById('product-category').value = product.category || '';
    document.getElementById('product-brand').value = product.brand || '';
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-quantity').value = product.quantity || 0;
    document.getElementById('product-modal').classList.add('active');
};

window.deleteProduct = async function(productId) {
    if (!confirm('Supprimer ce produit ?')) return;
    
    showLoading(true);
    try {
        await deleteDoc(doc(db, 'products', productId));
        products = products.filter(p => p.id !== productId);
        showToast('Produit supprimé');
        renderProducts();
    } catch (error) {
        console.error('Erreur suppression:', error);
        showToast('Erreur de suppression', 'error');
    } finally {
        showLoading(false);
    }
};

document.getElementById('product-form').onsubmit = async function(e) {
    e.preventDefault();
    
    const data = {
        image: document.getElementById('product-image').value,
        name: document.getElementById('product-name').value,
        conventionalName: document.getElementById('product-conventional').value,
        reference: document.getElementById('product-ref').value,
        barcode: document.getElementById('product-barcode').value,
        category: document.getElementById('product-category').value,
        brand: document.getElementById('product-brand').value,
        price: parseFloat(document.getElementById('product-price').value),
        quantity: parseInt(document.getElementById('product-quantity').value) || 0,
        userId: currentUser.uid,
        updatedAt: serverTimestamp()
    };

    showLoading(true);
    
    try {
        if (editingProduct) {
            await updateDoc(doc(db, 'products', editingProduct.id), data);
            const index = products.findIndex(p => p.id === editingProduct.id);
            products[index] = { ...editingProduct, ...data };
            showToast('Produit modifié');
        } else {
            const newDocRef = doc(collection(db, 'products'));
            data.createdAt = serverTimestamp();
            await setDoc(newDocRef, data);
            products.push({ id: newDocRef.id, ...data });
            showToast('Produit ajouté');
        }
        
        closeProductModal();
        renderProducts();
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        showToast('Erreur de sauvegarde', 'error');
    } finally {
        showLoading(false);
    }
};

// ============== MOUVEMENTS ==============

function renderMovements() {
    document.getElementById('app-container').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">🔄 Mouvements de Stock</h3>
            </div>
            <div style="background:#f9fafb;padding:20px;border-radius:12px;margin-bottom:20px;">
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;">
                    <div class="form-group">
                        <label>Type</label>
                        <select id="mov-type" onchange="updateMovementForm()">
                            <option value="in">Entrée (+)</option>
                            <option value="out">Sortie (-)</option>
                            <option value="transfer">Transfert</option>
                        </select>
                    </div>
                    <div class="form-group" id="pdv-select">
                        <label>Point de Vente</label>
                        <select id="mov-pdv">
                            <option value="">Stock Central</option>
                            ${pointsVente.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group" id="reason-select">
                        <label>Raison</label>
                        <select id="mov-reason">
                            <option value="Achat">Achat</option>
                            <option value="Vente">Vente</option>
                            <option value="Retour">Retour</option>
                        </select>
                    </div>
                    <div class="form-group" id="payment-select">
                        <label>Paiement</label>
                        <select id="mov-payment">
                            <option value="Espèce">Espèce</option>
                            <option value="Virement">Virement</option>
                        </select>
                    </div>
                </div>
                <button class="btn btn-success" onclick="validateMovement()" style="margin-top:15px;width:100%;">✓ VALIDER</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th><input type="checkbox" onclick="toggleAllMovements(this)"></th>
                            <th>Produit</th>
                            <th>Stock</th>
                            <th>Quantité</th>
                        </tr>
                    </thead>
                    <tbody id="mov-body">${renderMovRows(products)}</tbody>
                </table>
            </div>
        </div>
    `;
}

function renderMovRows(list) {
    if (list.length === 0) return '<tr><td colspan="4">Aucun produit</td></tr>';
    return list.map(p => `
        <tr>
            <td><input type="checkbox" class="mov-check" data-id="${p.id}"></td>
            <td><strong>${p.name}</strong></td>
            <td>${p.quantity || 0}</td>
            <td><input type="number" class="mov-qty" data-id="${p.id}" min="1" disabled style="width:100px;padding:8px;"></td>
        </tr>
    `).join('');
}

window.updateMovementForm = function() {
    const type = document.getElementById('mov-type').value;
    document.getElementById('pdv-select').style.display = type === 'transfer' ? 'none' : 'block';
    document.getElementById('reason-select').style.display = type === 'transfer' ? 'none' : 'block';
    document.getElementById('payment-select').style.display = type === 'transfer' ? 'none' : 'block';
};

window.toggleAllMovements = function(checkbox) {
    document.querySelectorAll('.mov-check').forEach(cb => {
        cb.checked = checkbox.checked;
        const qtyInput = document.querySelector(`.mov-qty[data-id="${cb.dataset.id}"]`);
        if (qtyInput) qtyInput.disabled = !cb.checked;
    });
};

document.addEventListener('change', function(e) {
    if (e.target.classList.contains('mov-check')) {
        const qtyInput = document.querySelector(`.mov-qty[data-id="${e.target.dataset.id}"]`);
        if (qtyInput) {
            qtyInput.disabled = !e.target.checked;
            if (!e.target.checked) qtyInput.value = '';
        }
    }
});

window.validateMovement = async function() {
    const type = document.getElementById('mov-type').value;
    const pdvId = document.getElementById('mov-pdv')?.value || '';
    const reason = document.getElementById('mov-reason')?.value || '';
    const payment = document.getElementById('mov-payment')?.value || '';
    
    const items = [];
    document.querySelectorAll('.mov-check:checked').forEach(cb => {
        const qtyInput = document.querySelector(`.mov-qty[data-id="${cb.dataset.id}"]`);
        const qty = parseInt(qtyInput.value) || 0;
        if (qty > 0) items.push({ productId: cb.dataset.id, quantity: qty });
    });
    
    if (items.length === 0) {
        showToast('Sélectionnez des produits', 'warning');
        return;
    }
    
    showLoading(true);
    
    try {
        const batch = writeBatch(db);
        
        for (const item of items) {
            const product = products.find(p => p.id === item.productId);
            if (!product) continue;
            
            let newQty = product.quantity || 0;
            if (type === 'in') newQty += item.quantity;
            else if (type === 'out') newQty -= item.quantity;
            
            if (newQty < 0) {
                showToast(`Stock insuffisant pour ${product.name}`, 'error');
                continue;
            }
            
            batch.update(doc(db, 'products', item.productId), { quantity: newQty });
            
            const movRef = doc(collection(db, 'movements'));
            batch.set(movRef, {
                userId: currentUser.uid,
                type,
                productId: item.productId,
                productName: product.name,
                quantity: item.quantity,
                pdv: pdvId,
                reason,
                payment,
                date: serverTimestamp()
            });
        }
        
        await batch.commit();
        await loadAllData();
        showToast('Mouvements enregistrés');
        renderMovements();
    } catch (error) {
        console.error('Erreur mouvements:', error);
        showToast('Erreur d\'enregistrement', 'error');
    } finally {
        showLoading(false);
    }
};

// ============== POINTS DE VENTE ==============

function renderPointsVente() {
    document.getElementById('app-container').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">🏪 Points de Vente</h3>
                <button class="btn btn-primary" onclick="addPointVente()">➕ Ajouter PDV</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:20px;">
                ${pointsVente.map(p => `
                    <div class="card" style="text-align:center;">
                        <h3 style="margin-bottom:15px;">${p.name}</h3>
                        <button class="btn btn-primary" onclick="viewPDV('${p.id}')">Voir détails</button>
                    </div>
                `).join('') || '<p style="padding:2rem;text-align:center;color:#999;">Aucun point de vente</p>'}
            </div>
        </div>
    `;
}

window.addPointVente = async function() {
    const name = prompt('Nom du point de vente :');
    if (!name || !name.trim()) return;
    
    showLoading(true);
    try {
        const newRef = doc(collection(db, 'pointsVente'));
        await setDoc(newRef, {
            name: name.trim(),
            userId: currentUser.uid,
            products: [],
            createdAt: serverTimestamp()
        });
        await loadPointsVente();
        showToast('Point de vente ajouté');
        renderPointsVente();
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur d\'ajout', 'error');
    } finally {
        showLoading(false);
    }
};

window.viewPDV = function(pdvId) {
    const pdv = pointsVente.find(p => p.id === pdvId);
    if (!pdv) return;
    
    document.getElementById('app-container').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">🏪 ${pdv.name}</h3>
                <button class="btn btn-secondary" onclick="renderPointsVente()">← Retour</button>
            </div>
            <p style="padding:2rem;text-align:center;color:#999;">Fonctionnalité en développement</p>
        </div>
    `;
};

// ============== HISTORIQUE ==============

function renderHistory() {
    document.getElementById('app-container').innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">📜 Historique des Mouvements</h3>
                <button class="btn btn-warning" onclick="exportHistory()">📥 Exporter</button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Produit</th>
                            <th>Quantité</th>
                            <th>Raison</th>
                        </tr>
                    </thead>
                    <tbody>${renderHistoryRows(movements)}</tbody>
                </table>
            </div>
        </div>
    `;
}

function renderHistoryRows(list) {
    if (list.length === 0) return '<tr><td colspan="5" style="text-align:center;padding:2rem;">Aucun mouvement</td></tr>';
    return list.map(m => {
        const date = m.date?.toDate ? m.date.toDate().toLocaleString('fr-FR') : 'Date inconnue';
        const icon = m.type === 'in' ? '➕' : m.type === 'out' ? '➖' : '🔄';
        const color = m.type === 'in' ? '#10b981' : m.type === 'out' ? '#ef4444' : '#f59e0b';
        return `
            <tr>
                <td>${date}</td>
                <td><span style="color:${color};font-weight:bold;">${icon} ${m.type === 'in' ? 'Entrée' : m.type === 'out' ? 'Sortie' : 'Transfert'}</span></td>
                <td><strong>${m.productName}</strong></td>
                <td><strong>${m.quantity}</strong></td>
                <td>${m.reason || '-'}</td>
            </tr>
        `;
    }).join('');
}

// ============== EXPORT ==============

window.exportProducts = function() {
    if (products.length === 0) {
        showToast('Aucun produit à exporter', 'warning');
        return;
    }
    
    const data = products.map(p => ({
        'IMAGE': p.image || '',
        'Real Name': p.name,
        'Conventional Name': p.conventionalName || '',
        'Référence': p.reference,
        'Barcode': p.barcode || '',
        'Category': p.category || '',
        'Brand': p.brand || '',
        'Selling Price': p.price || 0,
        'Quantity': p.quantity || 0
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Produits');
    XLSX.writeFile(wb, `produits_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Export réussi');
};

window.exportHistory = function() {
    if (movements.length === 0) {
        showToast('Aucun historique', 'warning');
        return;
    }
    
    const data = movements.map(m => ({
        'Date': m.date?.toDate ? m.date.toDate().toLocaleString('fr-FR') : '',
        'Type': m.type === 'in' ? 'Entrée' : m.type === 'out' ? 'Sortie' : 'Transfert',
        'Produit': m.productName,
        'Quantité': m.quantity,
        'Raison': m.reason || '',
        'Paiement': m.payment || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Historique');
    XLSX.writeFile(wb, `historique_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Export réussi');
};

// ============== IMAGE MODAL ==============

window.openImgModal = function(src) {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('modal-image');
    const match = src.match(/[?&]id=([^&]+)/);
    if (match) {
        const id = match[1];
        img.src = `https://drive.google.com/uc?export=view&id=${id}`;
    } else {
        img.src = src;
    }
    modal.classList.add('active');
};

window.closeImportModal = function() {
    document.getElementById('import-modal').classList.remove('active');
};

window.handleImport = async function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const pg = document.getElementById('import-progress');
    const fill = document.getElementById('progress-fill');
    const txt = document.getElementById('progress-text');
    
    pg.classList.remove('hidden');
    fill.style.width = '0%';
    txt.textContent = 'Lecture du fichier...';

    try {
        const data = await file.arrayBuffer();
        fill.style.width = '30%';
        txt.textContent = 'Analyse en cours...';

        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws);

        fill.style.width = '50%';
        txt.textContent = `${rows.length} produits détectés...`;

        if (rows.length === 0) {
            showToast('Aucun produit trouvé', 'error');
            closeImportModal();
            return;
        }

        fill.style.width = '70%';
        txt.textContent = 'Import des produits...';

        const batch = writeBatch(db);
        let count = 0;

        for (const row of rows) {
            const name = row['Real Name'] || row['RealName'] || row['name'] || row['Nom'] || '';
            const ref = row['Référence'] || row['Reference'] || row['reference'] || row['REF'] || '';
            
            if (!name && !ref) continue;

            const productData = {
                image: row['IMAGE'] || row['Image'] || '',
                name: name || ref,
                conventionalName: row['Conventional Name'] || row['ConventionalName'] || '',
                reference: ref || `REF_${Date.now()}_${count}`,
                barcode: row['Barcode'] || row['barcode'] || '',
                category: row['Category'] || row['category'] || row['Catégorie'] || '',
                brand: row['Brand'] || row['brand'] || row['Marque'] || '',
                price: parseFloat(row['Selling Price'] || row['Prix'] || row['Price'] || 0),
                quantity: parseInt(row['Quantity'] || row['QTY'] || row['Repetition'] || 0),
                userId: currentUser.uid,
                createdAt: serverTimestamp()
            };

            const newRef = doc(collection(db, 'products'));
            batch.set(newRef, productData);
            count++;

            if (count % 100 === 0) {
                fill.style.width = `${70 + (count / rows.length) * 20}%`;
            }
        }

        fill.style.width = '90%';
        txt.textContent = 'Enregistrement...';

        await batch.commit();
        await loadProducts();

        fill.style.width = '100%';
        txt.textContent = `✓ ${count} produits importés !`;
        showToast(`${count} produits importés avec succès`);

        setTimeout(() => {
            closeImportModal();
            renderProducts();
        }, 1500);

    } catch (error) {
        console.error('Erreur import:', error);
        txt.textContent = '❌ Erreur: ' + error.message;
        showToast('Erreur d\'importation: ' + error.message, 'error');
    }
};

// ============== HELPER FUNCTIONS ==============

async function addMovement(type, productId, quantity, reason) {
    showLoading(true);
    try {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        let newQty = product.quantity || 0;
        if (type === 'in') newQty += quantity;
        else if (type === 'out') newQty -= quantity;

        if (newQty < 0) {
            showToast('Stock insuffisant', 'error');
            return;
        }

        const batch = writeBatch(db);
        
        batch.update(doc(db, 'products', productId), { quantity: newQty });
        
        const movRef = doc(collection(db, 'movements'));
        batch.set(movRef, {
            userId: currentUser.uid,
            type,
            productId,
            productName: product.name,
            quantity,
            reason,
            date: serverTimestamp()
        });

        await batch.commit();
        await loadAllData();
        showToast('Stock mis à jour');
        renderDashboard();
    } catch (error) {
        console.error('Erreur:', error);
        showToast('Erreur de mise à jour', 'error');
    } finally {
        showLoading(false);
    }
}

window.showSettings = function() {
    showToast('Paramètres - Fonctionnalité en développement', 'warning');
};

console.log('✅ Application chargée avec succès');ageModal = function() {
    document.getElementById('image-modal').classList.remove('active');
};

// ============== IMPORT EXCEL ==============

window.openImportModal = function() {
    document.getElementById('import-modal').classList.add('active');
};

window.closeIm