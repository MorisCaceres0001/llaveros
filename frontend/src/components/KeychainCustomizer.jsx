import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Upload, Palette, Plus, Minus, Star, Menu, X, AlertCircle } from 'lucide-react';
import CheckoutForm from './CheckoutForm';
import OrderConfirmation from './OrderConfirmation';
import StripeCheckout from './StripeCheckout';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { paymentService } from '../services/paymentService';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const KeychainCustomizer = () => {
  // Estados principales
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedShape, setSelectedShape] = useState('round');
  const [selectedColor, setSelectedColor] = useState('#FFB6C1');
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('customizer');
  const [galleryProducts, setGalleryProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Estados para el swipe
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Paleta de colores pasteles
  const colors = [
    '#FFB6C1', '#E6E6FA', '#F0E68C', '#98FB98', '#87CEEB',
    '#DDA0DD', '#F5DEB3', '#FFA07A', '#20B2AA', '#FFE4E1'
  ];

  // Formas disponibles
  const shapes = [
    { id: 'round', name: 'Redondo', price: 2.50 },
    { id: 'square', name: 'Cuadrado', price: 2 },
    { id: 'custom', name: 'Recorte Personalizado', price: 3 }
  ];

  // Cargar productos de la galería
  useEffect(() => {
    loadGalleryProducts();
  }, []);

  const loadGalleryProducts = async () => {
    try {
      const response = await productService.getAllProducts();
      if (response.success) {
        setGalleryProducts(response.products);
      }
    } catch (error) {
      console.error('Error cargando galería:', error);
    }
  };

  // Función para cambiar forma por índice
  const changeShapeByIndex = (direction) => {
    const currentIndex = shapes.findIndex(shape => shape.id === selectedShape);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % shapes.length;
    } else {
      newIndex = currentIndex === 0 ? shapes.length - 1 : currentIndex - 1;
    }
    
    setIsTransitioning(true);
    setSelectedShape(shapes[newIndex].id);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  // Detectar swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      changeShapeByIndex('next');
    } else if (isRightSwipe) {
      changeShapeByIndex('prev');
    }
  };

  // Manejo de subida de imagen
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024;

      if (!validTypes.includes(file.type)) {
        setError('Por favor selecciona una imagen válida (JPEG, PNG o GIF)');
        return;
      }

      if (file.size > maxSize) {
        setError('La imagen es demasiado grande. Máximo 5MB permitido.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Agregar al carrito
  const addToCart = () => {
    if (!selectedImage) {
      setError('Por favor selecciona una imagen primero');
      return;
    }

    const selectedShapeInfo = shapes.find(s => s.id === selectedShape);
    const item = {
      id: Date.now(),
      image: selectedImage,
      shape: selectedShapeInfo,
      color: selectedColor,
      quantity: quantity,
      total: selectedShapeInfo.price * quantity
    };

    setCartItems([...cartItems, item]);
    setShowCart(true);
    
    // Reset
    setSelectedImage(null);
    setQuantity(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError(null);
  };

  // Agregar producto de galería al carrito
  const addGalleryProductToCart = (product) => {
    const basePrice = Number(product.base_price) || 0;
    const foundShape = shapes.find(s => s.id === product.shape) || { id: product.shape, name: product.shape, price: basePrice };
    const item = {
      id: Date.now(),
      image: product.image_url,
      shape: foundShape,
      color: '#FFB6C1',
      quantity: 1,
      total: Number(basePrice)
    };

    setCartItems([...cartItems, item]);
    setShowCart(true);
  };

  // Proceder al checkout
  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      setError('Tu carrito está vacío');
      return;
    }
    setShowCart(false);
    setShowCheckout(true);
  };

  // Procesar pedido
  const handleCheckoutSubmit = async (customerData) => {
    setIsLoading(true);
    setError(null);

    try {
      const total = cartItems.reduce((sum, item) => sum + item.total, 0);

      const orderData = {
        customer: customerData,
        items: cartItems,
        totalAmount: total,
        paymentMethod: 'pending',
        // Para entornos de prueba podemos marcar como pagado mediante REACT_APP_TEST_PAYMENTS=true
        paymentStatus: process.env.REACT_APP_TEST_PAYMENTS === 'true' ? 'paid' : 'pending'
      };

      const response = await orderService.createOrder(orderData);

      if (response.success) {
        setOrderNumber(response.orderNumber);
        setShowCheckout(false);
        setShowConfirmation(true);
        setCartItems([]);
      }
    } catch (error) {
      console.error('Error creando pedido:', error);
      // Mejor manejo de errores: el backend puede devolver un objeto con { message, error }
      const msg = (error && (error.message || error.error || error.data || JSON.stringify(error))) || 'Error al procesar el pedido';
      setError(typeof msg === 'string' ? msg : 'Error al procesar el pedido');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener el estilo del llavero
  const getKeychainStyle = () => {
    const baseStyle = {
      width: '250px',
      height: '250px',
      backgroundColor: selectedColor,
      backgroundImage: selectedImage ? `url(${selectedImage})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      border: '4px solid #fff',
      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
      position: 'relative',
      overflow: 'hidden',
      cursor: 'grab',
      transition: isTransitioning ? 'all 0.3s ease' : 'none',
      transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
      userSelect: 'none'
    };

    switch (selectedShape) {
      case 'round':
        return { ...baseStyle, borderRadius: '50%' };
      case 'square':
        return { ...baseStyle, borderRadius: '15px' };
      case 'custom':
        return { 
          ...baseStyle, 
          borderRadius: '25px',
          clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)'
        };
      default:
        return baseStyle;
    }
  };

  // Componente del carrito
  const CartComponent = () => {
    const total = cartItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Carrito de Compras</h2>
              <button 
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {cartItems.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Tu carrito está vacío</p>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-xl">
                      <div 
                        className="w-16 h-16 rounded-lg border-2 border-white shadow-md"
                        style={{
                          backgroundColor: item.color,
                          backgroundImage: `url(${item.image})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      ></div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.shape.name}</p>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        <p className="font-bold text-purple-600">${(Number(item.total) || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-gray-800">Total:</span>
                    <span className="text-2xl font-bold text-purple-600">${(Number(total) || 0).toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={proceedToCheckout}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
                  >
                    Proceder al Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl">
                <Star className="text-white" size={24} />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Llaveros
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <button 
                className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                  currentView === 'customizer' 
                    ? 'bg-purple-100 text-purple-700 font-semibold' 
                    : 'text-gray-600 hover:text-purple-600'
                }`}
                onClick={() => setCurrentView('customizer')}
              >
                Personalizar
              </button>
              <button 
                className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                  currentView === 'gallery' 
                    ? 'bg-purple-100 text-purple-700 font-semibold' 
                    : 'text-gray-600 hover:text-purple-600'
                }`}
                onClick={() => setCurrentView('gallery')}
              >
                Galería
              </button>
              <button
                onClick={() => setShowCart(true)}
                className="relative bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center space-x-2"
              >
                <ShoppingCart size={20} />
                <span>{cartItems.length}</span>
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={24} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 p-4">
            <div className="flex flex-col space-y-2">
              <button 
                className={`px-4 py-2 rounded-xl text-left transition-all duration-300 ${
                  currentView === 'customizer' 
                    ? 'bg-purple-100 text-purple-700 font-semibold' 
                    : 'text-gray-600 hover:text-purple-600'
                }`}
                onClick={() => {
                  setCurrentView('customizer');
                  setMobileMenuOpen(false);
                }}
              >
                Personalizar
              </button>
              <button 
                className={`px-4 py-2 rounded-xl text-left transition-all duration-300 ${
                  currentView === 'gallery' 
                    ? 'bg-purple-100 text-purple-700 font-semibold' 
                    : 'text-gray-600 hover:text-purple-600'
                }`}
                onClick={() => {
                  setCurrentView('gallery');
                  setMobileMenuOpen(false);
                }}
              >
                Galería
              </button>
              <button
                onClick={() => {
                  setShowCart(true);
                  setMobileMenuOpen(false);
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl flex items-center space-x-2"
              >
                <ShoppingCart size={20} />
                <span>Carrito ({cartItems.length})</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Alerta de errores */}
      {error && (
        <div className="container mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        {currentView === 'customizer' ? (
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
                Crea tu Llavero Perfecto
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Personaliza tu llavero con tu imagen favorita y elige entre diferentes formas y colores únicos
              </p>
            </div>

            {/* Bloque Unificado */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center">
                  <Palette className="mr-3 text-purple-500" />
                  Personaliza tu Llavero
                </h3>

                {/* Área de imagen / Vista previa */}
                <div className="mb-8">
                  {!selectedImage ? (
                    <div className="border-2 border-dashed border-purple-300 rounded-3xl p-12 text-center hover:border-purple-400 transition-colors duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label 
                        htmlFor="image-upload" 
                        className="cursor-pointer flex flex-col items-center space-y-4"
                      >
                        <Upload size={64} className="text-purple-400" />
                        <span className="text-xl font-semibold text-gray-700">
                          Haz clic para subir tu imagen
                        </span>
                        <span className="text-sm text-gray-500">
                          JPEG, PNG, GIF (máx. 5MB)
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="text-center">
                      {/* Indicadores */}
                      <div className="flex justify-center space-x-2 mb-6">
                        {shapes.map((shape) => (
                          <div
                            key={shape.id}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                              shape.id === selectedShape ? 'bg-purple-500 w-8' : 'bg-gray-300'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Área de swipe */}
                      <div 
                        className="relative flex justify-center mb-4"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                      >
                        <div style={getKeychainStyle()}>
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                            <div className="w-8 h-8 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full border-3 border-yellow-600 shadow-lg">
                              <div className="w-3 h-3 bg-yellow-600 rounded-full mx-auto mt-2.5"></div>
                            </div>
                          </div>
                        </div>

                        {/* Botones desktop */}
                        <button 
                          onClick={() => changeShapeByIndex('prev')}
                          className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-all duration-300 opacity-70 hover:opacity-100"
                        >
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>

                        <button 
                          onClick={() => changeShapeByIndex('next')}
                          className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition-all duration-300 opacity-70 hover:opacity-100"
                        >
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      {/* Info forma */}
                      <div className="text-center mb-4">
                        <p className="text-sm text-purple-600 mb-1">
                          <span className="md:hidden">Desliza para cambiar forma</span>
                          <span className="hidden md:inline">Usa las flechas para cambiar forma</span>
                        </p>
                        <p className="font-bold text-lg text-gray-800">
                          {shapes.find(shape => shape.id === selectedShape)?.name} - ${shapes.find(shape => shape.id === selectedShape)?.price}
                        </p>
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedImage(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-sm text-purple-600 hover:text-purple-700 underline mb-6"
                      >
                        Cambiar imagen
                      </button>
                    </div>
                  )}
                </div>

                {/* Selección de color */}
                {selectedImage && (
                  <div className="mb-8">
                    <label className="block text-lg font-semibold text-gray-700 mb-4 text-center">
                      Elige el color de fondo
                    </label>
                    <div className="flex justify-center">
                      <div className="grid grid-cols-5 gap-4">
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-14 h-14 rounded-full border-4 transition-all duration-300 ${
                              selectedColor === color 
                                ? 'border-gray-800 scale-110 shadow-lg' 
                                : 'border-white hover:scale-105 shadow-md'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Cantidad */}
                {selectedImage && (
                  <div className="mb-8">
                    <label className="block text-lg font-semibold text-gray-700 mb-4 text-center">
                      Cantidad
                    </label>
                    <div className="flex items-center justify-center space-x-6">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-12 h-12 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition-colors duration-300"
                      >
                        <Minus size={20} />
                      </button>
                      <span className="text-3xl font-bold text-gray-800 min-w-[4rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-12 h-12 bg-purple-100 hover:bg-purple-200 text-purple-600 rounded-full flex items-center justify-center transition-colors duration-300"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Resumen */}
                {selectedImage && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200">
                    <h4 className="font-bold text-gray-800 mb-3 text-center text-lg">Resumen del producto</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-gray-600">Forma</p>
                        <p className="font-semibold">{shapes.find(s => s.id === selectedShape)?.name}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Cantidad</p>
                        <p className="font-semibold">{quantity}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Precio unitario</p>
                        <p className="font-semibold">${shapes.find(s => s.id === selectedShape)?.price}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-600">Total</p>
                        <p className="font-bold text-purple-600 text-lg">${(shapes.find(s => s.id === selectedShape)?.price * quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Botón agregar */}
                {selectedImage && (
                  <button
                    onClick={addToCart}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 text-lg"
                  >
                    <ShoppingCart size={24} />
                    <span>Agregar al Carrito</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Vista de galería */
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
              Galería de Inspiración
            </h2>

            {galleryProducts.length > 0 ? (
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                {galleryProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="h-48 w-full">
                      {(() => {
                        const url = product.image_url || '';
                        const imgSrc = url.startsWith('http') ? url : (url.startsWith('/') ? `${BACKEND_ORIGIN}${url}` : url);
                        return (
                          <img
                            src={imgSrc}
                            alt={`Producto ${product.id}`}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.opacity = 0.5; }}
                          />
                        );
                      })()}
                    </div>
                    <div className="p-4">
                      <p className="text-gray-600 mb-2">{shapes.find(s => s.id === product.shape)?.name}</p>
                      <p className="font-bold text-purple-600 mb-3">${product.base_price}</p>
                      <button
                        onClick={() => addGalleryProductToCart(product)}
                        className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300"
                      >
                        Agregar al Carrito
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No hay productos en la galería aún</p>
                <p className="text-gray-400 text-sm mt-2">¡Sé el primero en crear un diseño!</p>
              </div>
            )}

            <div className="text-center">
              <button 
                onClick={() => setCurrentView('customizer')}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
              >
                ¡Crea el tuyo ahora!
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Llaveros Personalizados</h3>
              <p className="text-gray-300">
                Creamos llaveros personalizados únicos con la más alta calidad y atención al detalle.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Enlaces</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contacto</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Envíos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Devoluciones</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Llaveros Personalizados. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modales */}
      {showCart && <CartComponent />}
      {showCheckout && (
        <CheckoutForm
          cartItems={cartItems}
          onClose={() => setShowCheckout(false)}
          onSubmit={handleCheckoutSubmit}
          isLoading={isLoading}
        />
      )}
      {showConfirmation && (
        <OrderConfirmation
          orderNumber={orderNumber}
          onClose={() => {
            setShowConfirmation(false);
            setCurrentView('customizer');
          }}
        />
      )}
    </div>
  );
};

export default KeychainCustomizer;