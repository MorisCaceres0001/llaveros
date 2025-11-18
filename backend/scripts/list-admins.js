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

    const [rows] = await connection.query('SELECT id, username, email, is_active, password FROM admins');
    console.log('Admins encontrados:', rows.length);
    rows.forEach(r => {
      console.log(`- id=${r.id} username=${r.username} email=${r.email} is_active=${r.is_active}`);
    });

    await connection.end();
  } catch (err) {
    console.error('Error consultando admins:', err.message || err);
    process.exit(1);
  }
})();
