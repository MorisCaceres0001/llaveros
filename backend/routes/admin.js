const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyToken } = require('../middleware/authMiddleware');
require('dotenv').config();

// =========================
// 🔐 LOGIN DE ADMIN
// =========================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('🔐 Intento de login:', username);

  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ? AND is_active = TRUE', [username]);

    console.log('📊 Admins encontrados:', Array.isArray(rows) ? rows.length : 'no rows');

    if (!rows || rows.length === 0) {
      console.log('❌ Usuario no encontrado:', username);
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    const admin = rows[0];
    console.log('👤 Admin record fetched:', { id: admin.id, username: admin.username, email: admin.email });

    const validPassword = await bcrypt.compare(password, admin.password);
    console.log('🔑 Password válida:', validPassword === true);

    if (!validPassword) {
      console.log('❌ Contraseña incorrecta para usuario:', username);
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await pool.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    console.log('✅ Login exitoso para:', admin.username);

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        full_name: admin.full_name
      }
    });
  } catch (err) {
    console.error('💥 Error en login:', err.message || err);
    res.status(500).json({ success: false, message: err.message || 'Error en el servidor' });
  }
});

// =========================
// 📊 ESTADÍSTICAS DEL DASHBOARD
// =========================
router.get('/stats', verifyToken, async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas...');

    // ✅ CORRECCIÓN: Usar [rows] en lugar de [[stats]]
    const [rows] = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        IFNULL(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_income,
        COUNT(DISTINCT c.id) as customers_count,
        SUM(CASE WHEN o.order_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN o.order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN o.order_status = 'processing' THEN 1 ELSE 0 END) as processing_orders
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
    `);

    // ✅ CORRECCIÓN: Extraer correctamente el primer resultado
    const stats = rows[0];
    
    console.log('✅ Estadísticas obtenidas:', stats);

    res.json({
      success: true,
      stats: {
        total_orders: stats.total_orders || 0,
        total_income: parseFloat(stats.total_income) || 0,
        customers_count: stats.customers_count || 0,
        delivered_orders: stats.delivered_orders || 0,
        pending_orders: stats.pending_orders || 0,
        processing_orders: stats.processing_orders || 0
      }
    });
  } catch (err) {
    console.error('💥 Error obteniendo estadísticas:', err);
    res.status(500).json({ success: false, message: 'Error obteniendo estadísticas' });
  }
});

// =========================
// 📦 OBTENER TODOS LOS PEDIDOS
// =========================
router.get('/orders', verifyToken, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.total_amount as total,
        o.payment_status,
        o.order_status as status,
        o.created_at,
        c.name as customer_name,
        c.whatsapp,
        c.address,
        c.city,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
    `;
    
    const params = [];
    
    if (status && status !== 'all') {
      query += ' WHERE o.order_status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [orders] = await pool.query(query, params);
    
    // Obtener total
    const countQuery = 'SELECT COUNT(*) as count FROM orders' + 
                      (status && status !== 'all' ? ' WHERE order_status = ?' : '');
    const [[{ count }]] = await pool.query(
      countQuery,
      status && status !== 'all' ? [status] : []
    );
    
    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
    
  } catch (err) {
    console.error('Error obteniendo pedidos:', err);
    res.status(500).json({ success: false, message: 'Error obteniendo pedidos' });
  }
});

// =========================
// 🔄 ACTUALIZAR ESTADO DE PEDIDO
// =========================
router.put('/orders/:orderId/status', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    
    await pool.query(
      'UPDATE orders SET order_status = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [status, notes || null, orderId]
    );
    
    res.json({
      success: true,
      message: 'Estado actualizado exitosamente'
    });
    
  } catch (err) {
    console.error('Error actualizando estado:', err);
    res.status(500).json({ success: false, message: 'Error actualizando estado' });
  }
});

// =========================
// 💳 MARCAR PEDIDO COMO PAGADO (útil para pruebas)
// =========================
router.post('/orders/:orderId/mark-paid', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentId } = req.body;

    await pool.query(
      'UPDATE orders SET payment_status = ?, payment_id = ?, updated_at = NOW() WHERE id = ?',
      ['paid', paymentId || null, orderId]
    );

    res.json({ success: true, message: 'Pedido marcado como pagado' });
  } catch (err) {
    console.error('Error marcando pedido como pagado:', err);
    res.status(500).json({ success: false, message: 'Error marcando pedido como pagado' });
  }
});

module.exports = router;