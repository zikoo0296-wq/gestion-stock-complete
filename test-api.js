const http = require('http');

const API_URL = process.env.API_URL || 'localhost';
const API_PORT = process.env.API_PORT || 3000;

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Fonction pour faire une requête HTTP
const makeRequest = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_URL,
      port: API_PORT,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';

      res.on('data', (chunk) => {
        body += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
};

// Tests
const tests = [
  {
    name: 'Connexion API',
    test: async () => {
      const result = await makeRequest('/products');
      return result.status === 200;
    }
  },
  {
    name: 'Récupérer tous les produits',
    test: async () => {
      const result = await makeRequest('/products');
      return result.status === 200 && Array.isArray(result.data);
    }
  },
  {
    name: 'Créer un produit de test',
    test: async () => {
      const testProduct = {
        realName: 'Produit Test API',
        conventionalName: 'Test',
        reference: 'TEST-API-' + Date.now(),
        barcode: '999999999999',
        quantity: 100,
        minStock: 10,
        category: 'Test',
        brand: 'Test Brand',
        warehouse: 'Entrepôt Test',
        image: 'https://via.placeholder.com/200'
      };
      
      const result = await makeRequest('/products', 'POST', testProduct);
      
      if (result.status === 201 && result.data.id) {
        // Sauvegarder l'ID pour les tests suivants
        global.testProductId = result.data.id;
        return true;
      }
      return false;
    }
  },
  {
    name: 'Récupérer un produit spécifique',
    test: async () => {
      if (!global.testProductId) return false;
      const result = await makeRequest(`/products/${global.testProductId}`);
      return result.status === 200 && result.data.id === global.testProductId;
    }
  },
  {
    name: 'Modifier un produit',
    test: async () => {
      if (!global.testProductId) return false;
      
      const updateData = {
        realName: 'Produit Test Modifié',
        conventionalName: 'Test Modifié',
        reference: 'TEST-API-MODIFIED',
        barcode: '999999999999',
        quantity: 150,
        minStock: 15,
        category: 'Test',
        brand: 'Test Brand',
        warehouse: 'Entrepôt Test',
        image: 'https://via.placeholder.com/200'
      };
      
      const result = await makeRequest(`/products/${global.testProductId}`, 'PUT', updateData);
      return result.status === 200 && result.data.quantity === 150;
    }
  },
  {
    name: 'Créer un mouvement d\'entrée',
    test: async () => {
      if (!global.testProductId) return false;
      
      const movementData = {
        products: [{ productId: global.testProductId, quantity: 50 }],
        type: 'entry',
        reason: 'Test',
        customer: null
      };
      
      const result = await makeRequest('/movements', 'POST', movementData);
      return result.status === 200 && result.data.success === true;
    }
  },
  {
    name: 'Créer un mouvement de sortie (vente)',
    test: async () => {
      if (!global.testProductId) return false;
      
      const movementData = {
        products: [{ productId: global.testProductId, quantity: 10 }],
        type: 'exit',
        reason: 'Vente',
        customer: 'Client Test'
      };
      
      const result = await makeRequest('/movements', 'POST', movementData);
      
      if (result.status === 200 && result.data.success === true) {
        // Sauvegarder l'ID de la vente pour le test de retour
        if (result.data.sales && result.data.sales.length > 0) {
          global.testSaleId = result.data.sales[0].id;
        }
        return true;
      }
      return false;
    }
  },
  {
    name: 'Récupérer tous les mouvements',
    test: async () => {
      const result = await makeRequest('/movements');
      return result.status === 200 && Array.isArray(result.data);
    }
  },
  {
    name: 'Récupérer toutes les ventes',
    test: async () => {
      const result = await makeRequest('/sales');
      return result.status === 200 && Array.isArray(result.data);
    }
  },
  {
    name: 'Créer un retour',
    test: async () => {
      if (!global.testSaleId) return false;
      
      const returnData = {
        saleId: global.testSaleId,
        quantity: 5,
        reason: 'Test retour'
      };
      
      const result = await makeRequest('/returns', 'POST', returnData);
      return result.status === 200 && result.data.success === true;
    }
  },
  {
    name: 'Récupérer tous les retours',
    test: async () => {
      const result = await makeRequest('/returns');
      return result.status === 200 && Array.isArray(result.data);
    }
  },
  {
    name: 'Récupérer les statistiques',
    test: async () => {
      const result = await makeRequest('/stats');
      return result.status === 200 && 
             result.data.hasOwnProperty('totalProducts') &&
             result.data.hasOwnProperty('totalReferences');
    }
  },
  {
    name: 'Import batch de produits',
    test: async () => {
      const batchData = {
        products: [
          {
            realName: 'Batch Test 1',
            conventionalName: 'BT1',
            reference: 'BATCH-TEST-1-' + Date.now(),
            barcode: '111111111111',
            quantity: 50,
            minStock: 10,
            category: 'Test Batch',
            brand: 'Test',
            warehouse: 'Entrepôt A',
            image: 'https://via.placeholder.com/200'
          },
          {
            realName: 'Batch Test 2',
            conventionalName: 'BT2',
            reference: 'BATCH-TEST-2-' + Date.now(),
            barcode: '222222222222',
            quantity: 75,
            minStock: 15,
            category: 'Test Batch',
            brand: 'Test',
            warehouse: 'Entrepôt A',
            image: 'https://via.placeholder.com/200'
          }
        ]
      };
      
      const result = await makeRequest('/products/batch', 'POST', batchData);
      return result.status === 200 && result.data.success === true && result.data.added === 2;
    }
  },
  {
    name: 'Supprimer le produit de test',
    test: async () => {
      if (!global.testProductId) return false;
      const result = await makeRequest(`/products/${global.testProductId}`, 'DELETE');
      return result.status === 200;
    }
  }
];

// Fonction principale pour exécuter les tests
const runTests = async () => {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║              🧪 TEST DE L\'API GESTION DE STOCK           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`🌐 API: http://${API_URL}:${API_PORT}/api\n`);
  
  let passed = 0;
  let failed = 0;
  const failedTests = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    process.stdout.write(`${i + 1}/${tests.length} ${test.name}... `);
    
    try {
      const result = await test.test();
      if (result) {
        console.log(`${colors.green}✅ PASS${colors.reset}`);
        passed++;
      } else {
        console.log(`${colors.red}❌ FAIL${colors.reset}`);
        failed++;
        failedTests.push(test.name);
      }
    } catch (error) {
      console.log(`${colors.red}❌ ERROR: ${error.message}${colors.reset}`);
      failed++;
      failedTests.push(`${test.name} (${error.message})`);
    }
    
    // Petit délai entre les tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`\n📊 Résultats:`);
  console.log(`${colors.green}✅ Réussis: ${passed}/${tests.length}${colors.reset}`);
  console.log(`${colors.red}❌ Échoués: ${failed}/${tests.length}${colors.reset}`);
  
  if (failed > 0) {
    console.log(`\n${colors.red}Tests échoués:${colors.reset}`);
    failedTests.forEach(name => console.log(`  - ${name}`));
  }

  const successRate = ((passed / tests.length) * 100).toFixed(1);
  console.log(`\n📈 Taux de réussite: ${successRate}%`);
  
  if (passed === tests.length) {
    console.log(`\n${colors.green}🎉 Tous les tests sont passés avec succès!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.yellow}⚠️  Certains tests ont échoué. Vérifiez la configuration.${colors.reset}\n`);
    process.exit(1);
  }
};

// Vérifier que l'API est accessible avant de lancer les tests
const checkConnection = () => {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: API_URL,
      port: API_PORT,
      path: '/api/products',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve(true);
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
};

// Point d'entrée
const main = async () => {
  try {
    console.log('🔍 Vérification de la connexion à l\'API...');
    await checkConnection();
    console.log(`${colors.green}✅ API accessible${colors.reset}`);
    await runTests();
  } catch (error) {
    console.log(`${colors.red}❌ Impossible de se connecter à l'API${colors.reset}`);
    console.log(`${colors.yellow}Assurez-vous que le serveur backend est démarré sur http://${API_URL}:${API_PORT}${colors.reset}`);
    console.log(`\n💡 Pour démarrer le backend:`);
    console.log(`   cd backend && npm start\n`);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

module.exports = { makeRequest, runTests };