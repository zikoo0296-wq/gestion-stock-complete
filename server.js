const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'gestion_stock',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err);
  } else {
    console.log('✅ Connecté à PostgreSQL:', res.rows[0].now);
  }
});

// ==================== PRODUCTS API ====================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Create product
app.post('/api/products', async (req, res) => {
  try {
    const {
      realName,
      conventionalName,
      reference,
      barcode,
      quantity,
      minStock,
      category,
      brand,
      warehouse,
      image
    } = req.body;

    const result = await pool.query(
      `INSERT INTO products (real_name, conventional_name, reference, barcode, quantity, min_stock, category, brand, warehouse, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [realName, conventionalName, reference, barcode, quantity, minStock, category, brand, warehouse, image]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de la création' });
  }
});

// Batch create/update products (for Excel import)
app.post('/api/products/batch', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { products } = req.body;
    
    await client.query('BEGIN');
    
    let added = 0;
    let updated = 0;

    for (const product of products) {
      const {
        realName,
        conventionalName,
        reference,
        barcode,
        quantity,
        minStock,
        category,
        brand,
        warehouse,
        image
      } = product;

      // Check if product exists
      const existing = await client.query(
        'SELECT id FROM products WHERE reference = $1',
        [reference]
      );

      if (existing.rows.length > 0) {
        // Update existing product
        await client.query(
          `UPDATE products 
           SET real_name = $1, conventional_name = $2, barcode = $3, quantity = $4, 
               min_stock = $5, category = $6, brand = $7, warehouse = $8, image = $9, updated_at = NOW()
           WHERE reference = $10`,
          [realName, conventionalName, barcode, quantity, minStock, category, brand, warehouse, image, reference]
        );
        updated++;
      } else {
        // Insert new product
        await client.query(
          `INSERT INTO products (real_name, conventional_name, reference, barcode, quantity, min_stock, category, brand, warehouse, image)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [realName, conventionalName, reference, barcode, quantity, minStock, category, brand, warehouse, image]
        );
        added++;
      }
    }

    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      added, 
      updated,
      total: products.length 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur batch:', error);
    res.status(500).json({ message: 'Erreur lors de l\'import batch' });
  } finally {
    client.release();
  }
});

// Update product
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      realName,
      conventionalName,
      reference,
      barcode,
      quantity,
      minStock,
      category,
      brand,
      warehouse,
      image
    } = req.body;

    const result = await pool.query(
      `UPDATE products 
       SET real_name = $1, conventional_name = $2, reference = $3, barcode = $4, 
           quantity = $5, min_stock = $6, category = $7, brand = $8, warehouse = $9, image = $10, updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [realName, conventionalName, reference, barcode, quantity, minStock, category, brand, warehouse, image, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    
    res.json({ message: 'Produit supprimé', product: result.rows[0] });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
});

// ==================== MOVEMENTS API ====================

// Get all movements
app.get('/api/movements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM movements ORDER BY date DESC, id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Create movement(s)
app.post('/api/movements', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { products, type, reason, customer } = req.body;
    
    await client.query('BEGIN');
    
    const movements = [];
    const sales = [];

    for (const item of products) {
      const { productId, quantity } = item;

      // Get product
      const productResult = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
      
      if (productResult.rows.length === 0) {
        throw new Error(`Produit ${productId} non trouvé`);
      }

      const product = productResult.rows[0];
      let newQuantity;

      if (type === 'entry') {
        newQuantity = product.quantity + quantity;
      } else {
        newQuantity = product.quantity - quantity;
        
        if (newQuantity < 0) {
          throw new Error(`Stock insuffisant pour ${product.real_name}. Stock disponible: ${product.quantity}`);
        }
      }

      // Update product quantity
      await client.query(
        'UPDATE products SET quantity = $1, updated_at = NOW() WHERE id = $2',
        [newQuantity, productId]
      );

      // Insert movement
      const movementResult = await client.query(
        `INSERT INTO movements (product_id, type, quantity, reason, customer, date, user_name)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6)
         RETURNING *`,
        [productId, type, quantity, reason, customer, 'Admin']
      );
      
      movements.push(movementResult.rows[0]);

      // If sale, create sale record
      if (type === 'exit' && reason === 'Vente') {
        const saleResult = await client.query(
          `INSERT INTO sales (product_id, product_name, quantity, customer, date, user_name, status)
           VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6)
           RETURNING *`,
          [productId, product.real_name, quantity, customer, 'Admin', 'completed']
        );
        
        sales.push(saleResult.rows[0]);
      }
    }

    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      movements,
      sales 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur mouvement:', error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
});

// ==================== SALES API ====================

// Get all sales
app.get('/api/sales', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sales ORDER BY date DESC, id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== RETURNS API ====================

// Get all returns
app.get('/api/returns', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM returns ORDER BY date DESC, id DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Create return
app.post('/api/returns', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { saleId, quantity, reason } = req.body;
    
    await client.query('BEGIN');

    // Get sale
    const saleResult = await client.query('SELECT * FROM sales WHERE id = $1', [saleId]);
    
    if (saleResult.rows.length === 0) {
      throw new Error('Vente non trouvée');
    }

    const sale = saleResult.rows[0];

    if (quantity > sale.quantity) {
      throw new Error('Quantité de retour supérieure à la vente');
    }

    // Update product quantity
    await client.query(
      'UPDATE products SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2',
      [quantity, sale.product_id]
    );

    // Insert return
    const returnResult = await client.query(
      `INSERT INTO returns (sale_id, product_id, product_name, quantity, customer, reason, date, user_name)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7)
       RETURNING *`,
      [saleId, sale.product_id, sale.product_name, quantity, sale.customer, reason, 'Admin']
    );

    // Insert movement
    await client.query(
      `INSERT INTO movements (product_id, type, quantity, reason, customer, date, user_name)
       VALUES ($1, 'entry', $2, 'Retour', $3, CURRENT_DATE, $4)`,
      [sale.product_id, quantity, sale.customer, 'Admin']
    );

    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      return: returnResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur retour:', error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
});

// ==================== STATISTICS API ====================

// Get dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const totalProducts = await pool.query('SELECT SUM(quantity) as total FROM products');
    const totalReferences = await pool.query('SELECT COUNT(*) as total FROM products');
    const lowStock = await pool.query('SELECT COUNT(*) as total FROM products WHERE quantity <= min_stock');
    const monthlySales = await pool.query(
      "SELECT COUNT(*) as total FROM sales WHERE date >= date_trunc('month', CURRENT_DATE)"
    );

    res.json({
      totalProducts: parseInt(totalProducts.rows[0].total) || 0,
      totalReferences: parseInt(totalReferences.rows[0].total) || 0,
      lowStock: parseInt(lowStock.rows[0].total) || 0,
      monthlySales: parseInt(monthlySales.rows[0].total) || 0
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
  });
});