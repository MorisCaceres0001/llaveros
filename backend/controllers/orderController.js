const db = require('../config/database');
const { cloudinary, isConfigured } = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Crear nuevo pedido
exports.createOrder = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    console.log('📥 createOrder body:', JSON.stringify(req.body).slice(0, 1000));
    await connection.beginTransaction();
    
    const { customer, items, totalAmount, paymentMethod, paymentStatus } = req.body;
    
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
    const finalPaymentStatus = paymentStatus || 'pending';

    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_id, order_number, total_amount, payment_method, payment_status) VALUES (?, ?, ?, ?, ?)',
      [customerId, orderNumber, totalAmount, paymentMethod, finalPaymentStatus]
    );
    
    const orderId = orderResult.insertId;
    
    // 4. Insertar items del pedido y subir imágenes a Cloudinary (o fallback local)
    for (const item of items) {
      let imageUrl = item.image || '';

      // Si la imagen es base64, intentar subirla a Cloudinary si está configurado
      if (item.image && typeof item.image === 'string' && item.image.startsWith('data:image')) {
        let uploaded = false;

        if (isConfigured) {
          try {
            const uploadResult = await cloudinary.uploader.upload(item.image, {
              folder: 'keychain-orders',
              transformation: [
                { width: 500, height: 500, crop: 'fit' }
              ]
            });
            imageUrl = uploadResult.secure_url;
            uploaded = true;
          } catch (uploadError) {
            console.error('Error subiendo imagen a Cloudinary:', uploadError?.message || uploadError);
            // continue to fallback to local storage
          }
        }

        // Fallback: si Cloudinary no está configurado o subida falló, guardar el archivo en /backend/uploads
        if (!uploaded) {
          try {
            const matches = item.image.match(/^data:(image\/(\w+));base64,(.+)$/);
            if (matches) {
              const mimeType = matches[1];
              const ext = matches[2] === 'jpeg' ? 'jpg' : matches[2];
              const b64 = matches[3];
              const buffer = Buffer.from(b64, 'base64');

              const uploadsDir = path.join(__dirname, '..', 'uploads');
              if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

              const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
              const filePath = path.join(uploadsDir, fileName);
              fs.writeFileSync(filePath, buffer);

              const backendBase = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
              imageUrl = `${backendBase.replace(/\/$/, '')}/uploads/${fileName}`;
            } else {
              // No coincide el formato data:, no guardar
              imageUrl = '';
            }
          } catch (fsErr) {
            console.error('Error guardando imagen localmente:', fsErr?.message || fsErr);
            imageUrl = '';
          }
        }
      }
      
      await connection.query(
        'INSERT INTO order_items (order_id, product_image, shape, background_color, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [orderId, imageUrl, (item.shape && item.shape.id) || item.shape || null, item.color, item.quantity, (item.shape && item.shape.price) || null, item.total]
      );
      
      // Agregar a galería si no existe (solo si se subió a Cloudinary)
      // Agregar a galería si hay una URL válida (evitar errores si item.image es undefined)
      try {
        // Insert into products only when we have a valid URL (e.g. from Cloudinary)
        const isValidUrl = !!(imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http'));
        if (isValidUrl) {
          const shapeId = (item.shape && (item.shape.id || item.shape)) || null;
          const basePrice = (item.shape && item.shape.price) || null;
          await connection.query(
            'INSERT IGNORE INTO products (image_url, shape, base_price) VALUES (?, ?, ?)',
            [imageUrl, shapeId, basePrice]
          );
        }
      } catch (err) {
        console.error('Error agregando a galería:', err);
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
    console.error('Error creando pedido:', error.stack || error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el pedido',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? (error.stack || '') : undefined
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
        id: order.id,
        order_number: order.order_number,
        total: order.total_amount,
        payment_status: order.payment_status,
        status: order.order_status,
        created_at: order.created_at,
        customer_name: order.customer_name,
        email: order.email,
        whatsapp: order.whatsapp,
        address: order.address,
        city: order.city,
        items: items.map(i => ({
          id: i.id,
          image_url: i.product_image,
          shape_name: i.shape,
          background_color: i.background_color,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
          created_at: i.created_at
        }))
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