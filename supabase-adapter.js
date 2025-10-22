// ============================================
// ADAPTATEUR SUPABASE POUR VOTRE APP EXISTANTE
// ============================================

// Configuration Supabase
const SUPABASE_URL = 'https://djnaayhhntopupixzitm.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbmFheWhobnRvcHVwaXh6aXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NzY0NTIsImV4cCI6MjA3NjU1MjQ1Mn0.AzrxJ7h7SNEgn-i8qgdGYPvoEpWdRohX1E8N_Ko_Gc0';

// ✅ استعمال Supabase من نافذة المتصفح
const { createClient } = window.supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// ID utilisateur fixe pour admin
const ADMIN_USER_ID = '00000000-0000-0000-0000-000000000001';

// ============================================
// FONCTIONS DE SYNCHRONISATION
// ============================================

async function saveToSupabase(products, movements, pdvs) {
  console.log('💾 Sauvegarde dans Supabase...');

  try {
    await supabaseClient.from('products').delete().eq('user_id', ADMIN_USER_ID);
    await supabaseClient.from('movements').delete().eq('user_id', ADMIN_USER_ID);
    await supabaseClient.from('points_vente').delete().eq('user_id', ADMIN_USER_ID);

    if (products?.length) {
      const { error } = await supabaseClient.from('products').insert(
        products.map(p => ({
          user_id: ADMIN_USER_ID,
          real_name: p.realName || p.name,
          conventional_name: p.conventionalName || '',
          reference: p.reference,
          barcode: p.barcode || '',
          quantity: p.quantity || 0,
          min_stock: 10,
          category: p.category || '',
          brand: p.brand || '',
          warehouse: 'Entrepôt A',
          image: p.imageUrl || ''
        }))
      );
      if (error) console.error('Erreur produits:', error);
      else console.log(`✅ ${products.length} produits sauvegardés`);
    }

    if (movements?.length) {
      const { error } = await supabaseClient.from('movements').insert(
        movements.map(m => ({
          user_id: ADMIN_USER_ID,
          type: m.type === 'in' ? 'entry' : m.type === 'transfer' ? 'transfer' : 'exit',
          quantity: m.quantity || 0,
          reason: m.reason || '',
          customer: m.pdv || '',
          from_location: m.from || '',
          to_location: m.to || '',
          date: m.date ? new Date(m.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          user_name: 'Admin'
        }))
      );
      if (error) console.error('Erreur mouvements:', error);
      else console.log(`✅ ${movements.length} mouvements sauvegardés`);
    }

    if (pdvs?.length) {
      const { error } = await supabaseClient.from('points_vente').insert(
        pdvs.map(p => ({
          user_id: ADMIN_USER_ID,
          name: p.name,
          address: p.location || '',
          phone: '',
          email: '',
          manager: ''
        }))
      );
      if (error) console.error('Erreur PDV:', error);
      else console.log(`✅ ${pdvs.length} points de vente sauvegardés`);
    }

    console.log('✅ Sauvegarde Supabase réussie !');
  } catch (error) {
    console.error('❌ Erreur sauvegarde Supabase:', error);
  }
}

async function loadFromSupabase() {
  console.log('📥 Chargement depuis Supabase...');

  try {
    const { data: productsData } = await supabaseClient
      .from('products')
      .select('*')
      .eq('user_id', ADMIN_USER_ID);
    const { data: movementsData } = await supabaseClient
      .from('movements')
      .select('*')
      .eq('user_id', ADMIN_USER_ID);
    const { data: pdvsData } = await supabaseClient
      .from('points_vente')
      .select('*')
      .eq('user_id', ADMIN_USER_ID);

    const products = productsData?.map(p => ({
      id: p.id.toString(),
      name: p.real_name,
      reference: p.reference,
      quantity: p.quantity,
      category: p.category,
      brand: p.brand
    })) || [];

    const movements = movementsData?.map(m => ({
      id: m.id.toString(),
      type: m.type,
      quantity: m.quantity,
      reason: m.reason
    })) || [];

    const pdvs = pdvsData?.map(p => ({
      id: p.id.toString(),
      name: p.name,
      location: p.address
    })) || [];

    console.log(`✅ Chargé: ${products.length} produits`);
    return { products, movements, pdvs };
  } catch (error) {
    console.error('❌ Erreur chargement Supabase:', error);
    return null;
  }
}

// Synchronisation automatique
async function syncWithSupabase() {
  const localData = localStorage.getItem('stockData');
  if (localData) {
    try {
      const parsed = JSON.parse(localData);
      await saveToSupabase(parsed.products || [], parsed.movements || [], parsed.pdvs || []);
    } catch (e) {
      console.error('Erreur sync:', e);
    }
  }
}

async function initSupabase() {
  const supabaseData = await loadFromSupabase();
  if (supabaseData) {
    localStorage.setItem('stockData', JSON.stringify(supabaseData));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupabase);
} else {
  initSupabase();
}

setInterval(syncWithSupabase, 5 * 60 * 1000);

console.log('✅ Adaptateur Supabase chargé');
