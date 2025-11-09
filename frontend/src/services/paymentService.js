import api from './api';

export const paymentService = {
  // Crear Payment Intent
  createPaymentIntent: async (amount, orderId, customerEmail) => {
    try {
      const response = await api.post('/payments/create-payment-intent', {
        amount,
        orderId,
        customerEmail
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Confirmar pago
  confirmPayment: async (paymentIntentId, orderId) => {
    try {
      const response = await api.post('/payments/confirm-payment', {
        paymentIntentId,
        orderId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener detalles de pago (admin)
  getPaymentDetails: async (paymentIntentId, token) => {
    try {
      const response = await api.get(`/payments/payment/${paymentIntentId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};