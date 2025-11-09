const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const pool = require('../config/database');

// Crear nuevo pedido
router.post('/', orderController.createOrder);

// Obtener detalles de un pedido con items
router.get('/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    console.log('🔍 Buscando pedido:', orderNumber);
    
    // Obtener orden con datos del cliente
    const [orders] = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount as total,
        o.payment_status,
        o.order_status as status,
        o.created_at,
        c.name as customer_name,
        c.whatsapp,
        c.email,
        c.address,
        c.city,
        c.postal_code
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.order_number = ?
    `, [orderNumber]);
    
    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    const order = orders[0];
    
    // Obtener items del pedido
    const [items] = await pool.query(`
      SELECT 
        product_image as image_url,
        shape as shape_name,
        background_color,
        quantity,
        unit_price,
        subtotal
      FROM order_items 
      WHERE order_id = ?
    `, [order.id]);
    
    order.items = items;
    
    console.log('✅ Pedido encontrado con', items.length, 'items');
    
    res.json({
      success: true,
      order: order
    });
    
  } catch (error) {
    console.error('💥 Error obteniendo pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el pedido',
      error: error.message
    });
  }
});

module.exports = router;