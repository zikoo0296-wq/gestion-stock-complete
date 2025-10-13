const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gestion_stock',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

const initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Initialisation de la base de données...\n');

    // Drop existing tables
    await client.query('DROP TABLE IF EXISTS returns CASCADE');
    await client.query('DROP TABLE IF EXISTS sales CASCADE');
    await client.query('DROP TABLE IF EXISTS movements CASCADE');
    await client.query('DROP TABLE IF EXISTS products CASCADE');
    
    console.log('✅ Tables existantes supprimées\n');

    // Create products table
    await client.query(`
      CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        real_name VARCHAR(255) NOT NULL,
        conventional_name VARCHAR(255),
        reference VARCHAR(100) NOT NULL UNIQUE,
        barcode VARCHAR(100),
        quantity INTEGER NOT NULL DEFAULT 0,
        min_stock INTEGER NOT NULL DEFAULT 10,
        category VARCHAR(100),
        brand VARCHAR(100),
        warehouse VARCHAR(100),
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "products" créée');

    // Create movements table
    await client.query(`
      CREATE TABLE movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL CHECK (type IN ('entry', 'exit')),
        quantity INTEGER NOT NULL,
        reason VARCHAR(100),
        customer VARCHAR(255),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        user_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "movements" créée');

    // Create sales table
    await client.query(`
      CREATE TABLE sales (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        customer VARCHAR(255) NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        user_name VARCHAR(100),
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "sales" créée');

    // Create returns table
    await client.query(`
      CREATE TABLE returns (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        customer VARCHAR(255) NOT NULL,
        reason VARCHAR(255),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        user_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table "returns" créée');

    // Create indexes for better performance
    await client.query('CREATE INDEX idx_products_reference ON products(reference)');
    await client.query('CREATE INDEX idx_products_category ON products(category)');
    await client.query('CREATE INDEX idx_products_brand ON products(brand)');
    await client.query('CREATE INDEX idx_movements_product_id ON movements(product_id)');
    await client.query('CREATE INDEX idx_movements_date ON movements(date)');
    await client.query('CREATE INDEX idx_sales_product_id ON sales(product_id)');
    await client.query('CREATE INDEX idx_sales_date ON sales(date)');
    await client.query('CREATE INDEX idx_returns_sale_id ON returns(sale_id)');
    
    console.log('✅ Index créés pour les performances');

    // Insert sample data
    await client.query(`
      INSERT INTO products (real_name, conventional_name, reference, barcode, quantity, min_stock, category, brand, warehouse, image)
      VALUES 
        ('Ordinateur Portable Dell XPS 13', 'Dell XPS', 'DELL-XPS-001', '1234567890123', 25, 5, 'Informatique', 'Dell', 'Entrepôt A', 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=200'),
        ('iPhone 15 Pro Max', 'iPhone 15', 'APPLE-IPH-015', '1234567890124', 3, 10, 'Téléphones', 'Apple', 'Entrepôt A', 'https://images.unsplash.com/photo-1592286927505-4a7b73891ce4?w=200'),
        ('Samsung Galaxy S24 Ultra', 'Galaxy S24', 'SAM-GAL-024', '1234567890125', 45, 15, 'Téléphones', 'Samsung', 'Entrepôt B', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200')
    `);
    console.log('✅ Données de démonstration insérées\n');

    console.log('✨ Base de données initialisée avec succès !');
    console.log('📋 Tables créées:');
    console.log('   - products');
    console.log('   - movements');
    console.log('   - sales');
    console.log('   - returns\n');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
};

initDatabase();