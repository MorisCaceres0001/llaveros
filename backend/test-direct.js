const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testDirectLogin() {
  console.log('\n🔍 TEST DIRECTO DE LOGIN\n');
  console.log('='.repeat(50));
  
  // Probar conexión
  console.log('1️⃣ Probando conexión a MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'keychain_studio'
    });
    console.log('   ✅ Conexión exitosa');
    
    // Buscar admin
    console.log('\n2️⃣ Buscando usuario admin...');
    const [admins] = await connection.query(
      'SELECT * FROM admins WHERE username = ?',
      ['admin']
    );
    
    if (admins.length === 0) {
      console.log('   ❌ Usuario admin NO encontrado');
      console.log('\n💡 SOLUCIÓN: Ejecuta este comando en MySQL:');
      console.log('   mysql -u root -p < backend/database/schema.sql');
      await connection.end();
      return;
    }
    
    console.log('   ✅ Usuario encontrado');
    const admin = admins[0];
    console.log('   📋 Username:', admin.username);
    console.log('   📋 Email:', admin.email);
    console.log('   📋 Activo:', admin.is_active ? 'SÍ' : 'NO');
    
    // Probar password
    console.log('\n3️⃣ Probando password "admin123"...');
    const isValid = await bcrypt.compare('admin123', admin.password);
    
    if (isValid) {
      console.log('   ✅ Password CORRECTA');
      console.log('\n🎉 TODO ESTÁ BIEN EN LA BASE DE DATOS');
      console.log('   El problema debe estar en el servidor o la conexión');
    } else {
      console.log('   ❌ Password INCORRECTA');
      console.log('\n🔧 Generando nuevo hash...');
      const newHash = await bcrypt.hash('admin123', 10);
      console.log('\n💡 SOLUCIÓN: Ejecuta este comando en MySQL:');
      console.log(`   UPDATE admins SET password = '${newHash}' WHERE username = 'admin';`);
    }
    
    await connection.end();
    
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
    console.log('\n💡 Verifica tu archivo .env:');
    console.log('   DB_HOST=localhost');
    console.log('   DB_USER=root');
    console.log('   DB_PASSWORD=admin');
    console.log('   DB_NAME=keychain_studio');
  }
  
  console.log('='.repeat(50));
}

testDirectLogin();