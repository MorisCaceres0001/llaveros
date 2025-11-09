import React, { useState, useEffect } from 'react';
import { 
  Package, Users, DollarSign, TrendingUp, Search, Eye, Edit, Check, X, Clock, 
  Truck, LogOut, Plus, Trash2, ShoppingBag 
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
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

  const apiRequest = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
  });

  apiRequest.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  useEffect(() => {
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
      loadDashboardData();
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadDashboardData();
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
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
    setOrders([]);
    setStats(null);
  };

  const loadDashboardData = async () => {
    try {
      const statsResponse = await apiRequest.get('/admin/stats');
      setStats(statsResponse.data.stats);

      const params = { page: currentPage, limit: 10 };
      if (filterStatus !== 'all') params.status = filterStatus;

      const ordersResponse = await apiRequest.get('/admin/orders', { params });
      setOrders(ordersResponse.data.orders);
      setTotalPages(ordersResponse.data.pagination.totalPages);
    } catch (err) {
      console.error('Error cargando datos:', err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const updateOrderStatus = async (orderId, newStatus, notes = '') => {
    try {
      await apiRequest.put(`/admin/orders/${orderId}/status`, { status: newStatus, notes });
      loadDashboardData();
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError('Error al actualizar el estado');
    }
  };

  const viewOrderDetails = async (orderNumber) => {
    try {
      const response = await apiRequest.get(`/orders/${orderNumber}`);
      setSelectedOrder(response.data.order);
    } catch (err) {
      console.error('Error al cargar detalles del pedido:', err);
    }
  };

  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase();
    return (
      order.order_number.toLowerCase().includes(term) ||
      order.customer_name.toLowerCase().includes(term) ||
      order.whatsapp.includes(term)
    );
  });

  const StatusBadge = ({ status }) => {
    const map = {
      pending: { color: 'bg-yellow-100 text-yellow-700', label: 'Pendiente', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-700', label: 'Procesando', icon: Package },
      ready: { color: 'bg-purple-100 text-purple-700', label: 'Listo', icon: Check },
      delivered: { color: 'bg-green-100 text-green-700', label: 'Entregado', icon: Truck },
      cancelled: { color: 'bg-red-100 text-red-700', label: 'Cancelado', icon: X }
    };
    const { color, label, icon: Icon } = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${color}`}>
        <Icon size={14} className="mr-1" />
        {label}
      </span>
    );
  };

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
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Usuario</label>
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                placeholder="admin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg disabled:opacity-50"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
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
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Dashboard */}
      <div className="container mx-auto px-4 py-8">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={ShoppingBag} title="Total de Ventas" value={stats.total_orders} color="purple" />
            <StatCard icon={DollarSign} title="Ingresos Totales" value={`$${stats.total_income}`} color="green" />
            <StatCard icon={TrendingUp} title="Pedidos Entregados" value={stats.delivered_orders} color="blue" />
            <StatCard icon={Users} title="Clientes Registrados" value={stats.customers_count} color="pink" />
          </div>
        )}

        {/* Tabla de pedidos */}
        <div className="bg-white shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-700">Pedidos recientes</h2>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <table className="w-full text-sm text-left border-t">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4">Pedido</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-semibold text-gray-700">{order.order_number}</td>
                  <td className="py-3 px-4">{order.customer_name}</td>
                  <td className="py-3 px-4 text-green-600 font-bold">${order.total}</td>
                  <td className="py-3 px-4"><StatusBadge status={order.status} /></td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => viewOrderDetails(order.order_number)}
                      className="text-purple-600 hover:underline flex items-center"
                    >
                      <Eye size={16} className="mr-1" /> Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Componente para tarjetas de estadísticas
const StatCard = ({ icon: Icon, title, value, color }) => (
  <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 border-${color}-500`}>
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-gray-500 text-sm font-semibold">{title}</h3>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`bg-${color}-100 p-3 rounded-lg`}>
        <Icon size={24} className={`text-${color}-600`} />
      </div>
    </div>
  </div>
);

export default AdminDashboard;
