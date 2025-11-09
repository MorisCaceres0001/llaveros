// ===================================================
// 📦 Importaciones
// ===================================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// ===================================================
// 🚀 Inicialización del servidor
// ===================================================
const app = express();

// ===================================================
// ⚙️ Middleware de seguridad y configuración
// ===================================================

// Seguridad de cabeceras HTTP
app.use(helmet());

// CORS — permitir acceso desde el frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Stripe webhook — necesita raw body (antes del JSON parser)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger HTTP
app.use(process.env.NODE_ENV === 'development' ? morgan('dev') : morgan('combined'));

// ===================================================
// 📁 Rutas principales
// ===================================================
app.use('/api/admin', require('./routes/admin'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/products', require('./routes/products'));
app.use('/api/payments', require('./routes/payments'));

// ===================================================
// 💓 Ruta de salud del servidor
// ===================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running correctly ✅',
    environment: process.env.NODE_ENV || 'development',
    frontend: process.env.FRONTEND_URL || 'http://localhost:3000',
    timestamp: new Date().toISOString(),
  });
});

// ===================================================
// 🌍 Ruta raíz informativa
// ===================================================
app.get('/', (req, res) => {
  res.json({
    message: '🧩 KeyChain Studio API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      orders: '/api/orders',
      products: '/api/products',
      admin: '/api/admin',
      payments: '/api/payments',
    },
  });
});

// ===================================================
// 🚨 Manejo de errores
// ===================================================

// 404 — ruta no encontrada
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
  });
});

// Errores generales
app.use((err, req, res, next) => {
  console.error('❌ Error interno:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// ===================================================
// 🖥️ Iniciar servidor
// ===================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 SERVIDOR INICIADO');
  console.log('='.repeat(50));
  console.log(`📡 Puerto: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🔧 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎨 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(
    `💳 Stripe: ${
      process.env.STRIPE_SECRET_KEY?.startsWith('sk_test') ? 'TEST ✅' : 'LIVE 🔴'
    }`
  );
  console.log(`🗄️  Base de datos: ${process.env.DB_NAME || 'No configurada'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configurado' : '❌ No definido'}`);
  console.log('='.repeat(50));
  console.log('✨ Servidor listo para recibir peticiones');
  console.log('='.repeat(50));
});

// ===================================================
// 🧠 Manejadores de señales del sistema
// ===================================================
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT recibido. Cerrando servidor...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// ===================================================
// 📦 Exportar app (útil para testing)
// ===================================================
module.exports = app;
