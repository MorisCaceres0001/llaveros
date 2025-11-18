require('dotenv').config();

// Configuración simple para el modelo OpenAI
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5-mini';

module.exports = {
  model: OPENAI_MODEL,
};
