const bcrypt = require('bcryptjs');

// Cambiar 'admin123' por tu contraseña deseada
const password = 'admin123';

bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('\n🔐 Hash generado:');
  console.log(hash);
  console.log('\nCopia este hash y actualízalo en database/schema.sql\n');
  console.log('Busca la línea:');
  console.log("INSERT INTO admins (username, password, email) VALUES");
  console.log('Y reemplaza el password con este hash\n');
});
