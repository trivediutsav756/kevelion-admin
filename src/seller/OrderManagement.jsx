import React, { useState, useEffect } from 'react';
import { FiFilter, FiX, FiChevronDown } from 'react-icons/fi';

const ALLOWED_ORDER_STATUSES = ['New', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
const ALLOWED_PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded', 'Cancelled'];
const ORDER_TYPES = ['Order', 'inquiry'];

const normalizeToAllowed = (value, allowed, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  const v = String(value).trim();
  if (!v) return fallback;
  const found = allowed.find(opt => opt.toLowerCase() === v.toLowerCase());
  return found || fallback;
};

const StatusDropdown = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);

  const statusColors = {
    New: 'blue',
    Pending: 'yellow',
    Confirmed: 'cyan',
    Shipped: 'purple',
    Delivered: 'green',
    Cancelled: 'red',
    Returned: 'orange',
  };

  const getStatusColorClasses = (status, selected = false) => {
    const baseColor = statusColors[status] || 'gray';
    if (selected) {
      return `bg-${baseColor}-100 text-${baseColor}-800 border-${baseColor}-300`;
    }
    return `bg-${baseColor}-50 text-${baseColor}-700 border-${baseColor}-200 hover:bg-${baseColor}-100`;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`px-3 py-1 rounded-md text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors ${getStatusColorClasses(value, true)}`}
      >
        {value || 'Select Status'}
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[140px] overflow-hidden">
          {ALLOWED_ORDER_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                onChange(status);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${getStatusColorClasses(status, status === value)}`}
            >
              <div className={`w-2 h-2 rounded-full bg-${statusColors[status] || 'gray'}-500`}></div>
              {status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const OrderDashboard = () => {
  const SELLER_ID = 6;
  const API_BASE_URL = 'http://rettalion.apxfarms.com';

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [buyers, setBuyers] = useState({});
  const [products, setProducts] = useState({});
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);

  // Filter Options
  const filterOptions = [
    { value: 'all', label: 'All Orders', color: 'gray' },
    { value: 'new', label: 'New Orders', color: 'blue' },
    { value: 'pending', label: 'Pending Orders', color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed Orders', color: 'cyan' },
    { value: 'shipped', label: 'Shipped Orders', color: 'purple' },
    { value: 'delivered', label: 'Delivered Orders', color: 'green' },
    { value: 'cancelled', label: 'Cancelled Orders', color: 'red' },
    { value: 'returned', label: 'Returned Orders', color: 'orange' }
  ];

  // Order Type Filter Options
  const orderTypeOptions = [
    { value: 'all', label: 'All Types', icon: '📦' },
    { value: 'Order', label: 'Orders', icon: '🛒' },
    { value: 'inquiry', label: 'Inquiries', icon: '❓' }
  ];

  const getOrderStatus = (order) => {
    if (!order.products || order.products.length === 0) return 'New';
    return order.products[0].order_status || 'New';
  };

  const getPaymentStatus = (order) => {
    if (!order.products || order.products.length === 0) return 'Pending';
    return order.products[0].payment_status || 'Pending';
  };

  const toggleExpanded = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Update status function
  const updateStatus = async (orderProductId, newStatus) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/orderProduct/${orderProductId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_product_id: orderProductId,
          order_status: newStatus 
        })
      });
      if (!res.ok) throw new Error(`Failed to update status: ${res.status}`);
      await fetchOrders();
    } catch (err) {
      setError(err.message);
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update order type function with optimistic update
  const updateOrderType = async (orderId, newType) => {
    setOrders(prevOrders => prevOrders.map(order => 
      order.id === orderId ? { ...order, order_type: newType } : order
    ));

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/ordersOrderType`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order_id: orderId,
          order_type: newType 
        })
      });
      if (!res.ok) throw new Error(`Failed to update order type: ${res.status}`);
      await fetchOrders();
    } catch (err) {
      await fetchOrders();
      setError(err.message);
      console.error('Update order type error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/buyers`);
      if (!res.ok) throw new Error('Failed to fetch buyers');
      const data = await res.json();
      const buyersMap = {};
      if (Array.isArray(data)) {
        data.forEach(buyer => {
          buyersMap[buyer.id] = buyer.name || `Buyer ${buyer.id}`;
        });
      }
      setBuyers(buyersMap);
    } catch (err) {
      console.error('Error fetching buyers:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/product_seller/${SELLER_ID}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      const productsMap = {};
      let productsArray = [];
      
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && Array.isArray(data.data)) {
        productsArray = data.data;
      } else if (data && Array.isArray(data.products)) {
        productsArray = data.products;
      }
      
      productsArray.forEach(product => {
        productsMap[product.id] = product.name || `Product ${product.id}`;
      });
      
      setProducts(productsMap);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchSellers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/sellers`);
      if (!res.ok) throw new Error('Failed to fetch sellers');
      const data = await res.json();
      const sellersMap = {};
      let sellersArray = [];
      
      if (Array.isArray(data)) {
        sellersArray = data;
      } else if (data && Array.isArray(data.data)) {
        sellersArray = data.data;
      } else if (data && Array.isArray(data.sellers)) {
        sellersArray = data.sellers;
      }
      
      sellersArray.forEach(seller => {
        sellersMap[seller.id] = seller.name || seller.company_name || `Seller ${seller.id}`;
      });
      
      setSellers(sellersMap);
    } catch (err) {
      console.error('Error fetching sellers:', err);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orderseller/${SELLER_ID}`);
      if (!res.ok) throw new Error('Failed to fetch orders for seller 6');
      const data = await res.json();

      const normalizedOrders = (Array.isArray(data) ? data : []).map(order => {
        const filteredProducts = (order.products || []).filter(p => Number(p.seller_id) === SELLER_ID);
        const normalizedProducts = filteredProducts.map(p => ({
          ...p,
          order_status: normalizeToAllowed(p.order_status, ALLOWED_ORDER_STATUSES, 'New'),
          payment_status: normalizeToAllowed(p.payment_status, ALLOWED_PAYMENT_STATUSES, 'Pending'),
        }));
        return {
          ...order,
          order_type: normalizeToAllowed(order.order_type, ORDER_TYPES, 'Order'),
          products: normalizedProducts
        };
      }).filter(o => Array.isArray(o.products) && o.products.length > 0);

      setOrders(normalizedOrders);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply Both Filters (Status + Order Type)
  useEffect(() => {
    let filtered = orders;
    
    // Filter by order type
    if (orderTypeFilter !== 'all') {
      filtered = filtered.filter(o => o.order_type === orderTypeFilter);
    }
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(o => getOrderStatus(o) === statusFilter);
    }
    
    setFilteredOrders(filtered);
  }, [statusFilter, orderTypeFilter, orders]);

  const fetchSingleOrder = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/order/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch order');
      const data = await res.json();
      const normalized = {
        ...data,
        order_type: normalizeToAllowed(data.order_type, ORDER_TYPES, 'Order'),
        products: (data.products || [])
          .filter(p => Number(p.seller_id) === SELLER_ID)
          .map(p => ({
            ...p,
            order_status: normalizeToAllowed(p.order_status, ALLOWED_ORDER_STATUSES, 'New'),
            payment_status: normalizeToAllowed(p.payment_status, ALLOWED_PAYMENT_STATUSES, 'Pending'),
          })),
      };
      setViewingOrder(normalized);
      setShowViewModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Confirmed': 'bg-indigo-100 text-indigo-800',
      'Shipped': 'bg-purple-100 text-purple-800',
      'Delivered': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'Returned': 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Paid': 'bg-green-100 text-green-800',
      'Failed': 'bg-red-100 text-red-800',
      'Refunded': 'bg-gray-100 text-gray-800',
      'Cancelled': 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getOrderTypeColor = (orderType) => {
    if (orderType === 'Order') {
      return 'bg-blue-100 text-blue-800';
    } else if (orderType === 'inquiry') {
      return 'bg-orange-100 text-orange-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getBuyerName = (buyerId) => buyers[buyerId] || `Buyer ${buyerId}`;
  const getProductName = (productId) => products[productId] || `Product ${productId}`;
  const getSellerName = (sellerId) => sellers[sellerId] || `Seller ${sellerId}`;

  // Order statistics calculations
  const getStats = () => {
    const totalOrders = orders.length;
    const newOrders = orders.filter(o => getOrderStatus(o) === 'New').length;
    const pendingOrders = orders.filter(o => getOrderStatus(o) === 'Pending').length;
    const deliveredOrders = orders.filter(o => getOrderStatus(o) === 'Delivered').length;
    const confirmedOrders = orders.filter(o => getOrderStatus(o) === 'Confirmed').length;
    const shippedOrders = orders.filter(o => getOrderStatus(o) === 'Shipped').length;
    const cancelledOrders = orders.filter(o => getOrderStatus(o) === 'Cancelled').length;
    const returnedOrders = orders.filter(o => getOrderStatus(o) === 'Returned').length;
    
    // Order Type counts
    const orderOrders = orders.filter(o => o.order_type === 'Order').length;
    const inquiryOrders = orders.filter(o => o.order_type === 'inquiry').length;
    
    return { 
      totalOrders, 
      newOrders, 
      pendingOrders, 
      deliveredOrders,
      confirmedOrders,
      shippedOrders,
      cancelledOrders,
      returnedOrders,
      orderOrders,
      inquiryOrders
    };
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const dayMonthYear = date.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    }).toLowerCase();
    return `${dayMonthYear}, ${time}`;
  };

  useEffect(() => { 
    fetchOrders();
    fetchBuyers();
    fetchProducts();
    fetchSellers();
  }, []);

  const stats = getStats();
  const currentFilterLabel = filterOptions.find(f => f.value === statusFilter)?.label || 'Orders';
  const currentOrderTypeLabel = orderTypeOptions.find(f => f.value === orderTypeFilter)?.label || 'All Types';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                📦 Order Management Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Showing orders for Seller ID: {SELLER_ID}</p>
            </div>
            
            {/* Filter Dropdowns */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Order Type Filter */}
              <div className="relative">
                <select
                  value={orderTypeFilter}
                  onChange={(e) => setOrderTypeFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm font-medium"
                >
                  {orderTypeOptions.map(option => {
                    const count = option.value === 'all' ? stats.totalOrders : option.value === 'Order' ? stats.orderOrders : stats.inquiryOrders;
                    return (
                      <option key={option.value} value={option.value}>
                        {option.icon} {option.label} ({count})
                      </option>
                    );
                  })}
                </select>
                <FiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                >
                  {filterOptions.map(option => {
                    const count = option.value === 'all' ? stats.totalOrders : stats[`${option.value}Orders`] || 0;
                    return (
                      <option key={option.value} value={option.value}>
                        {option.label} ({count})
                      </option>
                    );
                  })}
                </select>
                <FiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {(statusFilter !== 'all' || orderTypeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setOrderTypeFilter('all');
                  }}
                  className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  <FiX className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter by Order Type:</h3>
            <div className="flex flex-wrap gap-2">
              {orderTypeOptions.map(option => {
                const count = option.value === 'all' ? stats.totalOrders : option.value === 'Order' ? stats.orderOrders : stats.inquiryOrders;
                const isActive = orderTypeFilter === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => setOrderTypeFilter(option.value)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                      isActive
                        ? option.value === 'Order'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : option.value === 'inquiry'
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'bg-gray-700 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.icon} {option.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter by Status:</h3>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(option => {
                const countKey = option.value === 'all' ? 'totalOrders' : `${option.value}Orders`;
                const count = stats[countKey] || 0;
                const isActive = statusFilter === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${
                      isActive
                        ? option.value === 'all'
                          ? 'bg-gray-700 text-white shadow-lg'
                          : option.color === 'blue'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : option.color === 'yellow'
                          ? 'bg-yellow-500 text-white shadow-lg'
                          : option.color === 'green'
                          ? 'bg-green-600 text-white shadow-lg'
                          : option.color === 'red'
                          ? 'bg-red-600 text-white shadow-lg'
                          : option.color === 'purple'
                          ? 'bg-purple-600 text-white shadow-lg'
                          : option.color === 'cyan'
                          ? 'bg-cyan-600 text-white shadow-lg'
                          : option.color === 'orange'
                          ? 'bg-orange-600 text-white shadow-lg'
                          : 'bg-gray-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Totals Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {statusFilter === 'all' && orderTypeFilter === 'all' 
                  ? 'Total Orders' 
                  : `Filtered: ${currentOrderTypeLabel} - ${currentFilterLabel}`}
              </h2>
              <p className="text-3xl font-bold text-gray-900 mt-2">{filteredOrders.length}</p>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Orders: {stats.orderOrders}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Inquiries: {stats.inquiryOrders}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Delivered: {stats.deliveredOrders}</span>
                </div>
              </div>
            </div>
            <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-700 font-medium">{error}</p>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">✖</button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Filter Info Banner */}
        {(statusFilter !== 'all' || orderTypeFilter !== 'all') && filteredOrders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiFilter className="text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Showing {filteredOrders.length} orders
                  {orderTypeFilter !== 'all' && ` • ${currentOrderTypeLabel}`}
                  {statusFilter !== 'all' && ` • ${currentFilterLabel}`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        {!loading && filteredOrders.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Buyer Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Products</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Payment Status</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const isExpanded = expandedOrders.has(order.id);
                    const orderStatus = getOrderStatus(order);
                    const paymentStatus = getPaymentStatus(order);
                    const totalQty = order.products.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0);
                    const totalAmount = order.products.reduce((sum, p) => sum + (parseFloat(p.price || 0) * parseInt(p.quantity || 0)), 0);
                    const numProducts = order.products.length;
                    const currentType = order.order_type || 'Order';
                    const newOrderType = currentType === 'Order' ? 'inquiry' : 'Order';
                    return (
                      <>
                        <tr 
                          key={order.id} 
                          onClick={() => toggleExpanded(order.id)} 
                          className="cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-blue-600">#{order.id}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900">{formatDate(order.created_at)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <span 
                              className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-all ${getOrderTypeColor(currentType)}`}
                              onClick={() => updateOrderType(order.id, newOrderType)}
                              title={`Click to toggle to ${newOrderType}`}
                            >
                              {currentType}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-900 font-medium">
                              {getBuyerName(order.buyer_id)} ID: {order.buyer_id}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-900">{numProducts} Product{numProducts !== 1 ? 's' : ''}</span>
                              <FiChevronDown 
                                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              />
                              <span className="text-sm text-gray-600">Qty: {totalQty}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-green-700">₹{totalAmount.toFixed(2)}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getOrderStatusColor(orderStatus)}`}>
                              {orderStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(paymentStatus)}`}>
                              {paymentStatus || 'Not Set'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-center items-center gap-4">
                              <button 
                                onClick={() => fetchSingleOrder(order.id)} 
                                className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                                title="View Order"
                                disabled={loading}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && order.products.map((p) => {
                          const productTotal = (parseFloat(p.price || 0) * parseInt(p.quantity || 0)).toFixed(2);
                          return (
                            <tr key={`${order.id}-${p.id}`} className="bg-gray-50">
                              <td colSpan={9} className="px-6 py-4">
                                <div className="pl-12 border-l-4 border-blue-300 bg-blue-50 rounded p-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm">
                                    <div className="flex-1 min-w-0">
                                      <strong>Product:</strong> {getProductName(p.product_id)}
                                    </div>
                                    <div className="min-w-[80px]">
                                      <strong>Qty:</strong> {p.quantity}
                                    </div>
                                    <div className="min-w-[100px]">
                                      <strong>Unit Price:</strong> ₹{p.price}
                                    </div>
                                    <div className="min-w-[100px]">
                                      <strong>Total:</strong> ₹{productTotal}
                                    </div>
                                    <div className="min-w-[120px] whitespace-nowrap">
                                      <StatusDropdown
                                        value={p.order_status}
                                        onChange={(newStatus) => updateStatus(p.id, newStatus)}
                                        disabled={loading}
                                      />
                                    </div>
                                    <div className="min-w-[80px] whitespace-nowrap">
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(p.payment_status)}`}>
                                        {p.payment_status || 'Not Set'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No Orders Found
            </h3>
            <p className="text-gray-500">
              {statusFilter === 'all' && orderTypeFilter === 'all'
                ? `No orders found for Seller ID ${SELLER_ID}` 
                : `No orders matching the selected filters`}
            </p>
            {(statusFilter !== 'all' || orderTypeFilter !== 'all') && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setOrderTypeFilter('all');
                }}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-lg z-10">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">📋 Order Details #{viewingOrder.id}</h2>
                  <button onClick={() => { setShowViewModal(false); setViewingOrder(null); }} className="text-white hover:text-gray-200 text-2xl font-bold transition-colors">✖</button>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-blue-50 rounded-lg p-4 mb-6 border-2 border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><span className="text-xs font-semibold text-gray-600 block mb-1">Order ID:</span><p className="text-gray-900 font-bold text-lg">#{viewingOrder.id}</p></div>
                    <div><span className="text-xs font-semibold text-gray-600 block mb-1">Buyer Name:</span><p className="text-gray-900 font-bold text-lg">{getBuyerName(viewingOrder.buyer_id)}</p></div>
                    <div><span className="text-xs font-semibold text-gray-600 block mb-1">Order Type:</span><p className="text-gray-900 font-bold text-lg">{viewingOrder.order_type}</p></div>
                    <div><span className="text-xs font-semibold text-gray-600 block mb-1">Created At:</span>
                      <p className="text-gray-900 font-semibold">{viewingOrder.created_at ? new Date(viewingOrder.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</p>
                    </div>
                    <div><span className="text-xs font-semibold text-gray-600 block mb-1">Last Updated:</span>
                      <p className="text-gray-900 font-semibold">{viewingOrder.updated_at ? new Date(viewingOrder.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">🛒 Products ({viewingOrder.products?.length || 0})</h3>
                  <div className="space-y-4">
                    {viewingOrder.products && viewingOrder.products.map((p, i) => (
                      <div key={i} className="bg-white border-2 border-gray-300 rounded-lg p-5 hover:shadow-md transition-shadow">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <span className="text-xs font-semibold text-gray-600 block mb-1">📦 Product Name:</span>
                            <p className="text-gray-900 font-bold text-lg">{getProductName(p.product_id)}</p>
                            <p className="text-xs text-gray-500 mt-1">Product ID: {p.product_id}</p>
                          </div>
                          
                          <div>
                            <span className="text-xs font-semibold text-gray-600 block mb-1">🏪 Seller Name:</span>
                            <p className="text-gray-900 font-bold text-lg">{getSellerName(p.seller_id)}</p>
                            <p className="text-xs text-gray-500 mt-1">Seller ID: {p.seller_id}</p>
                          </div>
                          
                          <div>
                            <span className="text-xs font-semibold text-gray-600 block mb-1">Quantity:</span>
                            <p className="text-gray-900 font-bold text-lg">{p.quantity} pcs</p>
                          </div>
                          
                          <div>
                            <span className="text-xs font-semibold text-gray-600 block mb-1">Price:</span>
                            <p className="text-gray-900 font-bold text-lg">₹{parseFloat(p.price).toFixed(2)}</p>
                          </div>
                          
                          <div>
                            <span className="text-xs font-semibold text-gray-600 block mb-1">Total Amount:</span>
                            <p className="text-green-700 font-bold text-xl">₹{(parseFloat(p.price) * parseInt(p.quantity)).toFixed(2)}</p>
                          </div>
                          
                          <div>
                            <span className="text-xs font-semibold text-gray-600 block mb-1">Order Status:</span>
                            <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full mt-1 ${getOrderStatusColor(p.order_status)}`}>
                              {p.order_status || 'Not Set'}
                            </span>
                          </div>
                          
                          <div>
                            <span className="text-xs font-semibold text-gray-600 block mb-1">Payment Status:</span>
                            <span className={`inline-block px-3 py-1 text-sm font-bold rounded-full mt-1 ${getPaymentStatusColor(p.payment_status)}`}>
                              {p.payment_status || 'Not Set'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {viewingOrder.products && viewingOrder.products.length > 0 && (
                    <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-6">
                      <h4 className="text-lg font-bold text-gray-800 mb-4">💰 Order Summary</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Total Items:</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {viewingOrder.products.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0)} pcs
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Grand Total:</p>
                          <p className="text-3xl font-bold text-green-700">
                            ₹{viewingOrder.products.reduce((sum, p) => sum + (parseFloat(p.price || 0) * parseInt(p.quantity || 0)), 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t-2 border-gray-200 flex justify-end gap-3">
                  <button 
                    onClick={() => { setShowViewModal(false); setViewingOrder(null); }}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors shadow-md">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDashboard;