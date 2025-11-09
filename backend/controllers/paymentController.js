const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/database');

// Crear Payment Intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, orderId, customerEmail } = req.body;

    // Validar monto mínimo (Stripe requiere mínimo $0.50 USD)
    if (amount < 0.50) {
      return res.status(400).json({
        success: false,
        message: 'El monto mínimo es $0.50 USD'
      });
    }

    // Crear Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe usa centavos
      currency: 'usd',
      metadata: {
        orderId: orderId.toString(),
        integration: 'keychain_studio'
      },
      receipt_email: customerEmail,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creando Payment Intent:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el pago',
      error: error.message
    });
  }
};

// Confirmar pago exitoso
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    // Verificar el pago con Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Actualizar orden en la base de datos
      await db.query(
        `UPDATE orders 
         SET payment_status = 'paid', 
             payment_id = ?,
             payment_method = 'stripe',
             order_status = 'processing',
             updated_at = NOW()
         WHERE id = ?`,
        [paymentIntentId, orderId]
      );

      res.json({
        success: true,
        message: 'Pago confirmado exitosamente',
        paymentIntent
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'El pago no se completó',
        status: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Error confirmando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al confirmar el pago',
      error: error.message
    });
  }
};

// Webhook para eventos de Stripe
exports.webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Pago exitoso:', paymentIntent.id);
      
      // Actualizar estado del pedido
      const orderId = paymentIntent.metadata.orderId;
      if (orderId) {
        await db.query(
          `UPDATE orders 
           SET payment_status = 'paid',
               order_status = 'processing'
           WHERE id = ?`,
          [orderId]
        );
      }
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('❌ Pago fallido:', failedPayment.id);
      
      const failedOrderId = failedPayment.metadata.orderId;
      if (failedOrderId) {
        await db.query(
          `UPDATE orders 
           SET payment_status = 'failed'
           WHERE id = ?`,
          [failedOrderId]
        );
      }
      break;

    default:
      console.log(`Evento no manejado: ${event.type}`);
  }

  res.json({ received: true });
};

// Obtener detalles de un pago
exports.getPaymentDetails = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      success: true,
      payment: {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        created: new Date(paymentIntent.created * 1000),
        receipt_email: paymentIntent.receipt_email
      }
    });

  } catch (error) {
    console.error('Error obteniendo detalles del pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalles del pago'
    });
  }
};

// Crear reembolso
exports.createRefund = async (req, res) => {
  try {
    const { paymentIntentId, amount, reason } = req.body;

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || 'requested_by_customer'
    });

    // Actualizar orden
    const [orders] = await db.query(
      'SELECT id FROM orders WHERE payment_id = ?',
      [paymentIntentId]
    );

    if (orders.length > 0) {
      await db.query(
        `UPDATE orders 
         SET payment_status = 'refunded'
         WHERE id = ?`,
        [orders[0].id]
      );
    }

    res.json({
      success: true,
      message: 'Reembolso procesado exitosamente',
      refund
    });

  } catch (error) {
    console.error('Error creando reembolso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el reembolso',
      error: error.message
    });
  }
};