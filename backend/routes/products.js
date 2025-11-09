const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Obtener todos los productos (galería)
router.get('/', productController.getAllProducts);

// Obtener producto por ID
router.get('/:id', productController.getProductById);

module.exports = router;