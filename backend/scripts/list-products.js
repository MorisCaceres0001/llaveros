const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || undefined,
    });

    const [rows] = await connection.query('SELECT id, image_url, shape, base_price, created_at FROM products ORDER BY created_at DESC LIMIT 100');
    console.log('Productos encontrados:', rows.length);
    rows.forEach(r => {
      console.log(`- id=${r.id} image_url=${r.image_url ? r.image_url.slice(0,200) : '<empty>'} shape=${r.shape} base_price=${r.base_price} created_at=${r.created_at}`);
    });

    await connection.end();
  } catch (err) {
    console.error('Error listando products:', err.message || err);
    process.exit(1);
  }
})();
