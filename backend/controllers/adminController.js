const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Login de administrador
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 Intento de login con usuario:', username);
    
    // Validar que vengan los datos
    if (!username || !password) {
      console.log('❌ Faltan credenciales');
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }
    
    // Buscar admin
    const [admins] = await db.query(
      'SELECT * FROM admins WHERE username = ? AND is_active = TRUE',
      [username]
    );
    
    console.log('📊 Admins encontrados:', admins.length);
    
    if (admins.length === 0) {
      console.log('❌ Usuario no encontrado o inactivo');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    const admin = admins[0];
    console.log('👤 Admin encontrado:', admin.username);
    
    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, admin.password);
    console.log('🔑 Contraseña válida:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Generar token
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Token generado exitosamente');
    
    // Actualizar último login
    await db.query(
      'UPDATE admins SET last_login = NOW() WHERE id = ?',
      [admin.id]
    );
    
    console.log('✅ Login exitoso para:', admin.username);
    
    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        full_name: admin.full_name
      }
    });
    
  } catch (error) {
    console.error('💥 Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// Obtener estadísticas
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas...');
    
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT p.id) as total_products,
        IFNULL(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) as total_revenue,
        SUM(CASE WHEN o.order_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN o.order_status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN o.order_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN DATE(o.created_at) = CURDATE() THEN 1 ELSE 0 END) as today_orders
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN products p ON p.is_active = TRUE
    `);
    
    console.log('✅ Estadísticas obtenidas:', stats[0]);
    
    res.json({
      success: true,
      stats: stats[0]
    });
    
  } catch (error) {
    console.error('💥 Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// Obtener todos los pedidos
exports.getAllOrders = async (req, res) => {
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
        COUNT(oi.id) as items_count
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
    `;
    
    const params = [];
    
    if (status && status !== 'all') {
      query += ' WHERE o.order_status = ?';
      params.push(status);
    }
    
    query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const [orders] = await db.query(query, params);
    
    // Obtener total
    const countQuery = 'SELECT COUNT(*) as count FROM orders' + 
                      (status && status !== 'all' ? ' WHERE order_status = ?' : '');
    const [total] = await db.query(
      countQuery,
      status && status !== 'all' ? [status] : []
    );
    
    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total[0].count,
        totalPages: Math.ceil(total[0].count / limit)
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos'
    });
  }
};

// Actualizar estado del pedido
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;
    
    await db.query(
      'UPDATE orders SET order_status = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [status, notes || null, orderId]
    );
    
    res.json({
      success: true,
      message: 'Estado actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado'
    });
  }
};