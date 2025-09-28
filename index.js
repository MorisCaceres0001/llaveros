import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Upload, Palette, Eye, Plus, Minus, Star, Menu, X } from 'lucide-react';

const KeychainCustomizer = () => {
  // Estados principales
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedShape, setSelectedShape] = useState('round');
  const [selectedColor, setSelectedColor] = useState('#FFB6C1');
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('customizer');
  const fileInputRef = useRef(null);

  // Paleta de colores pasteles
  const colors = [
    '#FFB6C1', // Rosa pastel
    '#E6E6FA', // Lavanda
    '#F0E68C', // Amarillo pastel
    '#98FB98', // Verde pastel
    '#87CEEB', // Azul cielo
    '#DDA0DD', // Ciruela pastel
    '#F5DEB3', // Trigo
    '#FFA07A', // Salmón claro
    '#20B2AA', // Verde azulado
    '#FFE4E1'  // Rosa brumoso
  ];

  // Formas disponibles
  const shapes = [
    { id: 'round', name: 'Redondo', price: 12.99 },
    { id: 'square', name: 'Cuadrado', price: 12.99 },
    { id: 'custom', name: 'Recorte Personalizado', price: 16.99 }
  ];

  // Manejo de subida de imagen
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validación de seguridad
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        alert('Por favor selecciona una imagen válida (JPEG, PNG o GIF)');
        return;
      }

      if (file.size > maxSize) {
        alert('La imagen es demasiado grande. Máximo 5MB permitido.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Agregar al carrito
  const addToCart = () => {
    if (!selectedImage) {
      alert('Por favor selecciona una imagen primero');
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
    
    // Reset del formulario
    setSelectedImage(null);
    setQuantity(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Componente de previsualización
  const KeychainPreview = () => {
    const getShapeStyle = () => {
      const baseStyle = {
        width: '200px',
        height: '200px',
        backgroundColor: selectedColor,
        backgroundImage: selectedImage ? `url(${selectedImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '3px solid #fff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden'
      };

      switch (selectedShape) {
        case 'round':
          return { ...baseStyle, borderRadius: '50%' };
        case 'square':
          return { ...baseStyle, borderRadius: '10px' };
        case 'custom':
          return { 
            ...baseStyle, 
            borderRadius: '20px',
            clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)'
          };
        default:
          return baseStyle;
      }
    };

    return (
      <div className="flex flex-col items-center space-y-4">
        <div style={getShapeStyle()}>
          {!selectedImage && (
            <div className="flex items-center justify-center h-full text-white font-medium">
              Tu diseño aquí
            </div>
          )}
          {/* Anilla del llavero */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-6 h-6 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full border-2 border-yellow-600">
              <div className="w-2 h-2 bg-yellow-600 rounded-full mx-auto mt-2"></div>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Previsualización de tu llavero personalizado
        </p>
      </div>
    );
  };

  // Componente del carrito
  const CartComponent = () => {
    const total = cartItems.reduce((sum, item) => sum + item.total, 0);

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
                        <p className="font-bold text-purple-600">${item.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-gray-800">Total:</span>
                    <span className="text-2xl font-bold text-purple-600">${total.toFixed(2)}</span>
                  </div>
                  <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg">
                    Proceder al Pago
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
                KeyChain Studio
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

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Panel de personalización */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <Palette className="mr-3 text-purple-500" />
                  Personalización
                </h3>

                {/* Subir imagen */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    1. Sube tu imagen
                  </label>
                  <div className="border-2 border-dashed border-purple-300 rounded-2xl p-6 text-center hover:border-purple-400 transition-colors duration-300">
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
                      className="cursor-pointer flex flex-col items-center space-y-3"
                    >
                      <Upload size={48} className="text-purple-400" />
                      <span className="text-gray-600">
                        Haz clic para seleccionar una imagen
                      </span>
                      <span className="text-sm text-gray-400">
                        JPEG, PNG, GIF (máx. 5MB)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Seleccionar forma */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    2. Elige la forma
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {shapes.map((shape) => (
                      <label 
                        key={shape.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                          selectedShape === shape.id 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="shape"
                            value={shape.id}
                            checked={selectedShape === shape.id}
                            onChange={(e) => setSelectedShape(e.target.value)}
                            className="mr-3"
                          />
                          <span className="font-medium text-gray-800">{shape.name}</span>
                        </div>
                        <span className="font-bold text-purple-600">${shape.price}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Seleccionar color */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    3. Elige el color de fondo
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-12 h-12 rounded-full border-4 transition-all duration-300 ${
                          selectedColor === color 
                            ? 'border-gray-800 scale-110' 
                            : 'border-white hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Cantidad */}
                <div className="mb-8">
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    4. Cantidad
                  </label>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors duration-300"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="text-2xl font-bold text-gray-800 min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-12 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors duration-300"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Botón agregar al carrito */}
                <button
                  onClick={addToCart}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg flex items-center justify-center space-x-2"
                >
                  <ShoppingCart size={20} />
                  <span>Agregar al Carrito</span>
                </button>
              </div>

              {/* Panel de previsualización */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <Eye className="mr-3 text-purple-500" />
                  Vista Previa
                </h3>
                
                <div className="flex justify-center items-center min-h-[400px]">
                  <KeychainPreview />
                </div>

                {selectedImage && (
                  <div className="mt-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                    <h4 className="font-bold text-gray-800 mb-2">Resumen del producto:</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Forma:</strong> {shapes.find(s => s.id === selectedShape)?.name}</p>
                      <p><strong>Cantidad:</strong> {quantity}</p>
                      <p><strong>Precio unitario:</strong> ${shapes.find(s => s.id === selectedShape)?.price}</p>
                      <p className="text-lg font-bold text-purple-600">
                        <strong>Total:</strong> ${(shapes.find(s => s.id === selectedShape)?.price * quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Vista de galería */
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-8">
              Galería de Inspiración
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="h-48 bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                    <span className="text-gray-500 font-medium">Ejemplo {item}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-gray-600">Diseño personalizado</p>
                    <p className="font-bold text-purple-600">$12.99</p>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setCurrentView('customizer')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg"
            >
              ¡Crea el tuyo ahora!
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">KeyChain Studio</h3>
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
            <p>&copy; 2025 KeyChain Studio. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Modal del carrito */}
      {showCart && <CartComponent />}
    </div>
  );
};

export default KeychainCustomizer;