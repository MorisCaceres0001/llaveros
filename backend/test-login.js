const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testLogin() {
  console.log('🔍 Probando login...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  try {
    // 1. Buscar admin
    const [admins] = await connection.query(
      'SELECT * FROM admins WHERE username = ?',
      ['admin']
    );
    
    if (admins.length === 0) {
      console.log('❌ Admin no encontrado en la base de datos');
      return;
    }
    
    const admin = admins[0];
    console.log('✅ Admin encontrado:');
    console.log('   - ID:', admin.id);
    console.log('   - Username:', admin.username);
    console.log('   - Email:', admin.email);
    console.log('   - Activo:', admin.is_active);
    console.log('   - Password hash:', admin.password.substring(0, 30) + '...');
    console.log('');
    
    // 2. Probar contraseña
    const password = 'admin123';
    console.log('🔑 Probando password:', password);
    
    const isValid = await bcrypt.compare(password, admin.password);
    
    if (isValid) {
      console.log('✅ ¡Password correcta!');
      console.log('✅ Login debería funcionar');
    } else {
      console.log('❌ Password incorrecta');
      console.log('');
      console.log('🔧 Generando nuevo hash...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('📋 Nuevo hash generado:');
      console.log(newHash);
      console.log('');
      console.log('💡 Ejecuta este comando en MySQL:');
      console.log(`UPDATE admins SET password = '${newHash}' WHERE username = 'admin';`);
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await connection.end();
  }
}

testLogin();