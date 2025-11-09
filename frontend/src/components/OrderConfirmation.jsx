import React from 'react';
import { CheckCircle, Package, Phone } from 'lucide-react';

const OrderConfirmation = ({ orderNumber, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
        {/* Icono de éxito */}
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-4">
            <CheckCircle size={64} className="text-green-500" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          ¡Pedido Confirmado!
        </h2>

        {/* Número de orden */}
        <div className="bg-purple-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Número de Pedido</p>
          <p className="text-2xl font-bold text-purple-600">{orderNumber}</p>
        </div>

        {/* Información */}
        <div className="text-left space-y-3 mb-6">
          <div className="flex items-start space-x-3">
            <Package className="text-purple-500 mt-1 flex-shrink-0" size={20} />
            <p className="text-sm text-gray-600">
              Tu pedido ha sido recibido y está siendo procesado. Te contactaremos pronto vía WhatsApp.
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <Phone className="text-purple-500 mt-1 flex-shrink-0" size={20} />
            <p className="text-sm text-gray-600">
              Recibirás un mensaje de confirmación con los detalles de entrega.
            </p>
          </div>
        </div>

        {/* Botón */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
        >
          Continuar Comprando
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation;