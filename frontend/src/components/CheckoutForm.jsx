import React, { useState } from 'react';
import { X, Phone, MapPin, Mail, User } from 'lucide-react';

const CheckoutForm = ({ cartItems, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    address: '',
    city: '',
    postalCode: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = 'El WhatsApp es requerido';
    } else if (!/^\d{8,15}$/.test(formData.whatsapp.replace(/\s/g, ''))) {
      newErrors.whatsapp = 'WhatsApp inválido (8-15 dígitos)';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Finalizar Pedido</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isLoading}
            >
              <X size={24} />
            </button>
          </div>

          {/* Resumen del pedido */}
          <div className="bg-purple-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Resumen del Pedido</h3>
            <div className="space-y-2">
              {cartItems.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.shape.name} x{item.quantity}</span>
                  <span className="font-semibold">${item.total.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-purple-200 pt-2 mt-2">
                <div className="flex justify-between font-bold text-purple-600">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-1" />
                Nombre Completo *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } focus:border-purple-500 focus:outline-none transition-colors`}
                placeholder="Juan Pérez"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="inline w-4 h-4 mr-1" />
                WhatsApp *
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.whatsapp ? 'border-red-500' : 'border-gray-300'
                } focus:border-purple-500 focus:outline-none transition-colors`}
                placeholder="50312345678"
                disabled={isLoading}
              />
              {errors.whatsapp && (
                <p className="text-red-500 text-sm mt-1">{errors.whatsapp}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="inline w-4 h-4 mr-1" />
                Email (Opcional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } focus:border-purple-500 focus:outline-none transition-colors`}
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Dirección de Entrega *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                className={`w-full px-4 py-3 rounded-xl border-2 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                } focus:border-purple-500 focus:outline-none transition-colors resize-none`}
                placeholder="Calle, número de casa, referencias..."
                disabled={isLoading}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            {/* Ciudad y Código Postal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ciudad *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-xl border-2 ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  } focus:border-purple-500 focus:outline-none transition-colors`}
                  placeholder="San Salvador"
                  disabled={isLoading}
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Código Postal
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none transition-colors"
                  placeholder="1101"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;