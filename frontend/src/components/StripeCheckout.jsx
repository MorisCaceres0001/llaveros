import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

// Cargar Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Formulario de pago
const CheckoutForm = ({ clientSecret, orderId, amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
        },
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        onError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage({ type: 'success', text: '¡Pago exitoso!' });
        onSuccess(paymentIntent.id);
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al procesar el pago' });
      onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element de Stripe */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <PaymentElement />
      </div>

      {/* Mensaje de estado */}
      {message && (
        <div className={`flex items-start space-x-3 p-4 rounded-xl ${
          message.type === 'error' 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-green-50 border border-green-200'
        }`}>
          {message.type === 'error' ? (
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          ) : (
            <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
          )}
          <div className="flex-1">
            <p className={`font-medium ${
              message.type === 'error' ? 'text-red-700' : 'text-green-700'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Resumen del pago */}
      <div className="bg-purple-50 p-4 rounded-xl">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Total a pagar:</span>
          <span className="text-2xl font-bold text-purple-600">${amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Botón de pago */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>Procesando...</span>
          </>
        ) : (
          <>
            <Lock size={20} />
            <span>Pagar ${amount.toFixed(2)}</span>
          </>
        )}
      </button>

      {/* Seguridad */}
      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <Lock size={14} />
        <span>Pago seguro procesado por Stripe</span>
      </div>
    </form>
  );
};

// Componente principal
const StripeCheckout = ({ orderId, amount, customerEmail, onSuccess, onError, onCancel }) => {
  const [clientSecret, setClientSecret] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    createPaymentIntent();
  }, []);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          orderId,
          customerEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        setClientSecret(data.clientSecret);
      } else {
        setError(data.message || 'Error al inicializar el pago');
      }
    } catch (err) {
      setError('Error de conexión al procesar el pago');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <Loader className="animate-spin mx-auto mb-4 text-purple-600" size={48} />
          <p className="text-gray-700 font-medium">Preparando pago seguro...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Error</h3>
            <p className="text-gray-600">{error}</p>
          </div>
          <button
            onClick={onCancel}
            className="w-full bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-300 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#9333ea',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      borderRadius: '12px',
    }
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full my-8">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard size={32} className="text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Pago Seguro</h2>
            <p className="text-gray-600 mt-2">Orden #{orderId}</p>
          </div>

          {/* Stripe Elements */}
          {clientSecret && (
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm
                clientSecret={clientSecret}
                orderId={orderId}
                amount={amount}
                onSuccess={onSuccess}
                onError={onError}
              />
            </Elements>
          )}

          {/* Cancelar */}
          <button
            onClick={onCancel}
            className="w-full mt-4 text-gray-600 hover:text-gray-800 font-medium py-2"
          >
            Cancelar y volver
          </button>
        </div>
      </div>
    </div>
  );
};

export default StripeCheckout;