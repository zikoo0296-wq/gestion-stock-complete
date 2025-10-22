-- ============================================
-- SCRIPT SQL POUR SUPABASE
-- ============================================
-- 📝 Instructions :
-- 1. Connectez-vous à votre projet Supabase
-- 2. Allez dans SQL Editor
-- 3. Créez une nouvelle query
-- 4. Copiez-collez ce script complet
-- 5. Cliquez sur "Run" pour exécuter

-- ============================================
-- 1. SUPPRIMER LES TABLES EXISTANTES (si elles existent)
-- ============================================

DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS movements CASCADE;
DROP TABLE IF EXISTS points_vente CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- ============================================
-- 2. CRÉER LA TABLE user_profiles
-- ============================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    role TEXT DEFAULT 'user',
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. CRÉER LA TABLE products
-- ============================================

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    real_name TEXT NOT NULL,
    conventional_name TEXT,
    reference TEXT NOT NULL,
    barcode TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 10,
    category TEXT,
    brand TEXT,
    warehouse TEXT,
    image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, reference)
);

-- ============================================
-- 4. CRÉER LA TABLE points_vente
-- ============================================

CREATE TABLE points_vente (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    manager TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. CRÉER LA TABLE movements
-- ============================================

CREATE TABLE movements (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('entry', 'exit', 'transfer')),
    quantity INTEGER NOT NULL,
    reason TEXT,
    customer TEXT,
    from_location TEXT,
    to_location TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 6. CRÉER LA TABLE sales
-- ============================================

CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    customer TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_name TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. CRÉER LA TABLE returns
-- ============================================

CREATE TABLE returns (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    customer TEXT NOT NULL,
    reason TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    user_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. CRÉER LES INDEX POUR LES PERFORMANCES
-- ============================================

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_reference ON products(reference);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_movements_user_id ON movements(user_id);
CREATE INDEX idx_movements_product_id ON movements(product_id);
CREATE INDEX idx_movements_date ON movements(date);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_date ON sales(date);
CREATE INDEX idx_returns_user_id ON returns(user_id);
CREATE INDEX idx_returns_sale_id ON returns(sale_id);
CREATE INDEX idx_points_vente_user_id ON points_vente(user_id);

-- ============================================
-- 9. ACTIVER ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_vente ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 10. CRÉER LES POLICIES DE SÉCURITÉ
-- ============================================

-- Policies pour user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies pour products
CREATE POLICY "Users can view own products" ON products
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON products
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON products
    FOR DELETE USING (auth.uid() = user_id);

-- Policies pour points_vente
CREATE POLICY "Users can view own points_vente" ON points_vente
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points_vente" ON points_vente
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own points_vente" ON points_vente
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own points_vente" ON points_vente
    FOR DELETE USING (auth.uid() = user_id);

-- Policies pour movements
CREATE POLICY "Users can view own movements" ON movements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own movements" ON movements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour sales
CREATE POLICY "Users can view own sales" ON sales
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales" ON sales
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies pour returns
CREATE POLICY "Users can view own returns" ON returns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own returns" ON returns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 11. CRÉER UNE FONCTION POUR METTRE À JOUR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. CRÉER LES TRIGGERS POUR updated_at
-- ============================================

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_points_vente_updated_at
    BEFORE UPDATE ON points_vente
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 13. CRÉER UNE FONCTION POUR GÉRER L'INSCRIPTION
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, full_name, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NOW(), NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 14. CRÉER LE TRIGGER POUR L'INSCRIPTION
-- ============================================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 15. INSÉRER DES DONNÉES DE DÉMONSTRATION (OPTIONNEL)
-- ============================================
-- Décommentez les lignes ci-dessous si vous voulez des données de test
-- ATTENTION : Remplacez 'YOUR_USER_ID' par votre vrai UUID d'utilisateur

/*
INSERT INTO products (user_id, real_name, conventional_name, reference, barcode, quantity, min_stock, category, brand, warehouse, image)
VALUES 
    ('YOUR_USER_ID', 'Ordinateur Dell XPS 13', 'Dell XPS', 'DELL-XPS-001', '1234567890123', 25, 5, 'Informatique', 'Dell', 'Entrepôt A', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=200'),
    ('YOUR_USER_ID', 'iPhone 15 Pro Max', 'iPhone 15', 'APPLE-IPH-015', '1234567890124', 10, 10, 'Téléphones', 'Apple', 'Entrepôt A', 'https://images.unsplash.com/photo-1592286927505-4a7b73891ce4?w=200'),
    ('YOUR_USER_ID', 'Samsung Galaxy S24 Ultra', 'Galaxy S24', 'SAM-GAL-024', '1234567890125', 45, 15, 'Téléphones', 'Samsung', 'Entrepôt B', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200');
*/

-- ============================================
-- ✅ SCRIPT TERMINÉ
-- ============================================

SELECT 'Base de données créée avec succès! 🎉' AS status;
