const db = require('../config/database');
const cloudinary = require('../config/cloudinary');

// Crear nuevo pedido
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { customer, items, totalAmount, paymentMethod } = req.body;
    
    // 1. Insertar o buscar cliente
    const [existingCustomer] = await connection.query(
      'SELECT id FROM customers WHERE whatsapp = ?',
      [customer.whatsapp]
    );
    
    let customerId;
    
    if (existingCustomer.length > 0) {
      customerId = existingCustomer[0].id;
      // Actualizar datos del cliente
      await connection.query(
        'UPDATE customers SET name = ?, email = ?, address = ?, city = ?, postal_code = ? WHERE id = ?',
        [customer.name, customer.email, customer.address, customer.city, customer.postalCode, customerId]
      );
    } else {
      // Insertar nuevo cliente
      const [result] = await connection.query(
        'INSERT INTO customers (name, email, whatsapp, address, city, postal_code) VALUES (?, ?, ?, ?, ?, ?)',
        [customer.name, customer.email, customer.whatsapp, customer.address, customer.city, customer.postalCode]
      );
      customerId = result.insertId;
    }
    
    // 2. Generar número de orden único
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // 3. Crear pedido
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_id, order_number, total_amount, payment_method) VALUES (?, ?, ?, ?)',
      [customerId, orderNumber, totalAmount, paymentMethod]
    );
    
    const orderId = orderResult.insertId;
    
    // 4. Insertar items del pedido y subir imágenes a Cloudinary
    for (const item of items) {
      let imageUrl = item.image;
      
      // Si la imagen es base64, subirla a Cloudinary
      if (item.image && item.image.startsWith('data:image')) {
        try {
          const uploadResult = await cloudinary.uploader.upload(item.image, {
            folder: 'keychain-orders',
            transformation: [
              { width: 500, height: 500, crop: 'fit' }
            ]
          });
          imageUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error('Error subiendo imagen a Cloudinary:', uploadError);
          // Si falla Cloudinary, continuar con la imagen base64
        }
      }
      
      await connection.query(
        'INSERT INTO order_items (order_id, product_image, shape, background_color, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, imageUrl, item.shape.id, item.color, item.quantity, item.shape.price, item.total]
      );
      
      // Agregar a galería si no existe (solo si se subió a Cloudinary)
      if (!item.image.startsWith('data:image')) {
        try {
          await connection.query(
            'INSERT IGNORE INTO products (image_url, shape, base_price) VALUES (?, ?, ?)',
            [imageUrl, item.shape.id, item.shape.price]
          );
        } catch (err) {
          console.error('Error agregando a galería:', err);
        }
      }
    }
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      orderNumber,
      orderId
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error creando pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el pedido',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Obtener detalles de un pedido
exports.getOrderDetails = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const [orders] = await db.query(`
      SELECT 
        o.*,
        c.name as customer_name,
        c.email,
        c.whatsapp,
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
    const [items] = await db.query(`
      SELECT * FROM order_items WHERE order_id = ?
    `, [order.id]);
    
    res.json({
      success: true,
      order: {
        ...order,
        items
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el pedido'
    });
  }
};