const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Crear nuevo pedido
router.post('/', orderController.createOrder);

// Obtener detalles de un pedido
router.get('/:orderNumber', orderController.getOrderDetails);

module.exports = router;