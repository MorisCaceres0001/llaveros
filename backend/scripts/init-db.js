const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function run() {
  try {
    const sqlPath = path.resolve(__dirname, '..', 'database', 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Conectar sin seleccionar una base de datos para poder crearla
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true,
    });

    console.log('Conectado a MySQL. Ejecutando script de esquema...');
    await connection.query(sql);
    console.log('✅ Script ejecutado correctamente.');
    await connection.end();
  } catch (err) {
    console.error('❌ Error ejecutando el script de esquema:', err.message);
    process.exit(1);
  }
}

run();
