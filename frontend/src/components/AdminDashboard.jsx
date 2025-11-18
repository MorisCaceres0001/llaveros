import React, { useState, useEffect } from 'react';
import { 
  Package, Users, DollarSign, TrendingUp, Search, Eye, X, Clock, 
  Truck, LogOut, ShoppingBag, AlertCircle, Check, ChevronLeft, ChevronRight
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('admin_token');
  const setToken = (token) => localStorage.setItem('admin_token', token);
  const removeToken = () => localStorage.removeItem('admin_token');

  // Crear instancia de axios con interceptores
  const apiRequest = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
  });

  apiRequest.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiRequest.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        handleLogout();
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, filterStatus, currentPage]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/admin/login`, loginData);
      if (response.data.success) {
        setToken(response.data.token);
        setIsAuthenticated(true);
        setLoginData({ username: '', password: '' });
      } else {
        setError(response.data.message || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Error de conexión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
    setOrders([]);
    setStats(null);
    setSelectedOrder(null);
    setSearchTerm('');
    setFilterStatus('all');
    setCurrentPage(1);
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar estadísticas (validar que la respuesta tenga estructura esperada)
      const statsResponse = await apiRequest.get('/admin/stats');
      const statsData = statsResponse?.data;
      if (statsData?.success) {
        setStats(statsData.stats ?? null);
      } else {
        setStats(null);
      }

      // Cargar pedidos
      const params = { 
        page: currentPage, 
        limit: 10 
      };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const ordersResponse = await apiRequest.get('/admin/orders', { params });
      if (ordersResponse.data.success) {
        setOrders(ordersResponse.data.orders || []);
        setTotalPages(ordersResponse.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await apiRequest.put(`/admin/orders/${orderId}/status`, { 
        status: newStatus 
      });
      
      if (response.data.success) {
        await loadDashboardData();
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError('Error al actualizar el estado del pedido');
    }
  };

  const viewOrderDetails = async (orderNumber) => {
    try {
      const response = await apiRequest.get(`/orders/${orderNumber}`);
      if (response.data.success) {
        setSelectedOrder(response.data.order);
      }
    } catch (err) {
      console.error('Error al cargar detalles:', err);
      setError('Error al cargar los detalles del pedido');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      order.order_number?.toLowerCase().includes(term) ||
      order.customer_name?.toLowerCase().includes(term) ||
      order.whatsapp?.includes(term)
    );
  });

  const StatusBadge = ({ status }) => {
    const statusMap = {
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pendiente', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-700', label: 'Procesando', icon: Package },
      ready: { color: 'bg-purple-100 text-purple-700', label: 'Listo', icon: Check },
      delivered: { color: 'bg-green-100 text-green-700', label: 'Entregado', icon: Truck },
      cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelado', icon: X }
    };
    const config = statusMap[status] || statusMap.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon size={14} className="mr-1" />
        {config.label}
      </span>
    );
  };

  // Modal de detalles del pedido
  const OrderDetailsModal = () => {
    if (!selectedOrder) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Detalles del Pedido</h2>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Información del pedido */}
            <div className="space-y-6">
              {/* Número de orden y estado */}
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Número de Orden</span>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <p className="text-2xl font-bold text-purple-600">{selectedOrder.order_number}</p>
              </div>

              {/* Información del cliente */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Información del Cliente</h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nombre:</span>
                    <span className="font-semibold">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">WhatsApp:</span>
                    <span className="font-semibold">{selectedOrder.whatsapp}</span>
                  </div>
                  {selectedOrder.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold">{selectedOrder.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dirección:</span>
                    <span className="font-semibold text-right">{selectedOrder.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ciudad:</span>
                    <span className="font-semibold">{selectedOrder.city}</span>
                  </div>
                </div>
              </div>

              {/* Items del pedido */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Productos</h3>
                <div className="space-y-3">
                  {selectedOrder.items && selectedOrder.items.map((item, index) => {
                    const img = item.image_url || '';
                    const imageSrc = img.startsWith('http') ? img : (img.startsWith('/') ? `${BACKEND_ORIGIN}${img}` : img);
                    return (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 flex items-center space-x-4">
                        {item.image_url && (
                          <div 
                            className="w-16 h-16 rounded-lg border-2 border-white shadow-md"
                            style={{
                              backgroundImage: `url(${imageSrc})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{item.shape_name || 'Llavero'}</p>
                          <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-purple-600">${item.subtotal}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800">Total:</span>
                  <span className="text-2xl font-bold text-purple-600">${selectedOrder.total}</span>
                </div>
              </div>

              {/* Acciones */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Actualizar Estado</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'processing')}
                    disabled={selectedOrder.status === 'processing'}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Procesando
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                    disabled={selectedOrder.status === 'ready'}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Listo
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    disabled={selectedOrder.status === 'delivered'}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Entregado
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    disabled={selectedOrder.status === 'cancelled'}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Pantalla de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package size={32} className="text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
            <p className="text-gray-600 mt-2">Gestión de Llaveros</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario</label>
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="admin"
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard principal
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Package size={24} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Panel de Administración</h1>
              <p className="text-sm text-gray-500">Gestión de Pedidos</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        {/* Alertas */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={ShoppingBag} title="Total de Ventas" value={stats.total_orders || 0} color="purple" />
            <StatCard icon={DollarSign} title="Ingresos Totales" value={`$${stats.total_income || 0}`} color="green" />
            <StatCard icon={TrendingUp} title="Pedidos Entregados" value={stats.delivered_orders || 0} color="blue" />
            <StatCard icon={Users} title="Clientes" value={stats.customers_count || 0} color="pink" />
          </div>
        )}

        {/* Tabla de pedidos */}
        <div className="bg-white shadow-sm rounded-xl p-6">
          {/* Header de la tabla */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-bold text-gray-700">Pedidos Recientes</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar pedidos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none w-full sm:w-64"
                />
              </div>

              {/* Filtro de estado */}
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="processing">Procesando</option>
                <option value="ready">Listo</option>
                <option value="delivered">Entregado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Tabla */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="text-gray-600 mt-4">Cargando pedidos...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No se encontraron pedidos</p>
            </div>
          ) : (
            <>
              {/* Vista de escritorio */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-4 text-left font-semibold">Pedido</th>
                      <th className="py-3 px-4 text-left font-semibold">Cliente</th>
                      <th className="py-3 px-4 text-left font-semibold">WhatsApp</th>
                      <th className="py-3 px-4 text-left font-semibold">Total</th>
                      <th className="py-3 px-4 text-left font-semibold">Estado</th>
                      <th className="py-3 px-4 text-left font-semibold">Fecha</th>
                      <th className="py-3 px-4 text-center font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-purple-600">{order.order_number}</td>
                        <td className="py-3 px-4">{order.customer_name}</td>
                        <td className="py-3 px-4">{order.whatsapp}</td>
                        <td className="py-3 px-4 text-green-600 font-bold">${order.total}</td>
                        <td className="py-3 px-4"><StatusBadge status={order.status} /></td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => viewOrderDetails(order.order_number)}
                            className="text-purple-600 hover:text-purple-800 font-medium inline-flex items-center"
                          >
                            <Eye size={16} className="mr-1" />
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vista móvil */}
              <div className="md:hidden space-y-4">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-purple-600">{order.order_number}</p>
                        <p className="text-sm text-gray-600">{order.customer_name}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-lg font-bold text-green-600">${order.total}</span>
                      <button
                        onClick={() => viewOrderDetails(order.order_number)}
                        className="text-purple-600 hover:text-purple-800 font-medium inline-flex items-center"
                      >
                        <Eye size={16} className="mr-1" />
                        Ver detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de detalles */}
      {selectedOrder && <OrderDetailsModal />}
    </div>
  );
};

// Componente para tarjetas de estadísticas
const StatCard = ({ icon: Icon, title, value, color }) => {
  const colorClasses = {
    purple: 'border-purple-500 bg-purple-100 text-purple-600',
    green: 'border-green-500 bg-green-100 text-green-600',
    blue: 'border-blue-500 bg-blue-100 text-blue-600',
    pink: 'border-pink-500 bg-pink-100 text-pink-600'
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${colorClasses[color].split(' ')[0]}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-gray-500 text-sm font-semibold uppercase tracking-wide">{title}</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color].split(' ').slice(1).join(' ')}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;