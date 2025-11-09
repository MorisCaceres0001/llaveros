const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Rutas públicas
router.post('/create-payment-intent', paymentController.createPaymentIntent);
router.post('/confirm-payment', paymentController.confirmPayment);

// Webhook de Stripe (debe ser RAW body)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.webhookHandler
);

// Rutas protegidas (solo admin)
router.get('/payment/:paymentIntentId', protect, paymentController.getPaymentDetails);
router.post('/refund', protect, paymentController.createRefund);

module.exports = router;