const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(403).json({ success: false, message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}

module.exports = { verifyToken };
