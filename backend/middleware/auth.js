const jwt = require('jsonwebtoken');

exports.protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      console.log('❌ No se proporcionó token');
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Token no proporcionado'
      });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = decoded;
      console.log('✅ Token válido para:', decoded.username);
      next();
    } catch (err) {
      console.log('❌ Token inválido:', err.message);
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Token inválido'
      });
    }
    
  } catch (error) {
    console.error('💥 Error en middleware auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Error en autenticación'
    });
  }
};