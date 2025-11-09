import api from './api';

export const orderService = {
  // Crear nuevo pedido
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders', orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener detalles de pedido
  getOrderDetails: async (orderNumber) => {
    try {
      const response = await api.get(`/orders/${orderNumber}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};