// ============================================
// CONFIGURATION SUPABASE
// ============================================
// 📝 Instructions :
// 1. Créez un compte sur https://supabase.com
// 2. Créez un nouveau projet
// 3. Copiez l'URL et la clé API depuis Project Settings > API
// 4. Remplacez les valeurs ci-dessous

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ⚠️ IMPORTANT : Remplacez ces valeurs par vos propres identifiants Supabase
const SUPABASE_URL = 'https://djnaayhhntopupixzitm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqbmFheWhobnRvcHVwaXh6aXRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5NzY0NTIsImV4cCI6MjA3NjU1MjQ1Mn0.AzrxJ7h7SNEgn-i8qgdGYPvoEpWdRohX1E8N_Ko_Gc0';

// Exemple de valeurs (NE PAS UTILISER) :
// const SUPABASE_URL = 'https://xyzcompany.supabase.co';
// const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Créer le client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Vérifier la connexion
supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
        console.error('❌ Erreur Supabase:', error);
    } else {
        console.log('✅ Supabase connecté avec succès');
    }
});

// Configuration
export const config = {
    url: SUPABASE_URL,
    isConfigured: SUPABASE_URL !== 'VOTRE_SUPABASE_URL_ICI'
};

export default supabase;
