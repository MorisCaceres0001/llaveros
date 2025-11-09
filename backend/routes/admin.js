const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // ⬅️ CAMBIAR AQUÍ: bcryptjs en lugar de bcrypt
const { verifyToken } = require('../middleware/authMiddleware');
require('dotenv').config();

// =========================
// 🔐 LOGIN DE ADMIN
// =========================
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  console.log('🔐 Intento de login:', username); // ⬅️ Log para debug

  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ? AND is_active = TRUE', [username]);

    console.log('📊 Admins encontrados:', rows.length); // ⬅️ Log

    if (rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    const admin = rows[0];
    console.log('👤 Admin:', admin.username, '| Email:', admin.email); // ⬅️ Log

    const validPassword = await bcrypt.compare(password, admin.password);
    console.log('🔑 Password válida:', validPassword); // ⬅️ Log

    if (!validPassword) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await pool.query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    console.log('✅ Login exitoso para:', admin.username); // ⬅️ Log

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
    console.error('💥 Error en login:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// =========================
// 📊 ESTADÍSTICAS DEL DASHBOARD
// =========================
router.get('/stats', verifyToken, async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas...');

    const [[stats]] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT IFNULL(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as total_products,
        (SELECT COUNT(*) FROM customers) as total_customers,
        (SELECT COUNT(*) FROM orders WHERE order_status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE order_status = 'processing') as processing_orders,
        (SELECT COUNT(*) FROM orders WHERE order_status = 'delivered') as delivered_orders
    `);

    console.log('✅ Estadísticas obtenidas:', stats);

    res.json({
      success: true,
      stats
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
        o.*,
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

module.exports = router;