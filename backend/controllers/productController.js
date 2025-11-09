const db = require('../config/database');

// Obtener todos los productos de la galería
exports.getAllProducts = async (req, res) => {
  try {
    const [products] = await db.query(`
      SELECT * FROM products 
      WHERE is_active = TRUE 
      ORDER BY created_at DESC
      LIMIT 50
    `);
    
    res.json({
      success: true,
      products,
      count: products.length
    });
    
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      products: []
    });
  }
};

// Obtener producto por ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [products] = await db.query(
      'SELECT * FROM products WHERE id = ? AND is_active = TRUE',
      [id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    res.json({
      success: true,
      product: products[0]
    });
    
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto'
    });
  }
};