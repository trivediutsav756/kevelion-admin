import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiEye,
  FiRefreshCw,
  FiShoppingCart,
  FiUser,
  FiPackage,
  FiCalendar,
  FiCreditCard,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiFilter,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerId, setSellerId] = useState(6);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [orderTypeOptions, setOrderTypeOptions] = useState([{ value: 'all', label: 'All Types' }]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const BASE_URL = 'http://rettalion.apxfarms.com';
  const filterOptions = [
    { value: 'all', label: 'All Orders', color: 'gray' },
    { value: 'new', label: 'New', color: 'blue' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', color: 'cyan' },
    { value: 'shipped', label: 'Shipped', color: 'purple' },
    { value: 'delivered', label: 'Delivered', color: 'green' },
    { value: 'returned', label: 'Returned', color: 'orange' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ];

  useEffect(() => {
    fetchOrders();
  }, [sellerId]);

  useEffect(() => {
    if (orders.length > 0) {
      const uniqueTypes = [...new Set(orders.map(o => o.orderType).filter(Boolean))];
      const options = [
        { value: 'all', label: 'All Types' },
        ...uniqueTypes.map(type => ({
          value: type.toLowerCase(),
          label: type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
        }))
      ];
      setOrderTypeOptions(options);
    }
  }, [orders]);

  useEffect(() => {
    applyFilter();
  }, [orders, statusFilter, orderTypeFilter]);

  const applyFilter = () => {
    let filtered = orders;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order =>
        order.orderStatus?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (orderTypeFilter !== 'all') {
      filtered = filtered.filter(order =>
        order.orderType?.toLowerCase() === orderTypeFilter.toLowerCase()
      );
    }
    setFilteredOrders(filtered);
  };

  // ✅ Toggle product expansion
  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  // ✅ Fetch and Group Orders by Order ID
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching all orders for seller...');
      // Fetch orders
      const ordersResponse = await axios.get(
        `${BASE_URL}/orders?seller_id=${sellerId}`,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      // Fetch products for seller
      const productsResponse = await axios.get(
        `${BASE_URL}/products?seller_id=${sellerId}`,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      // Fetch categories
      const categoriesResponse = await axios.get(
        `${BASE_URL}/categories`,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      // Fetch subcategories
      const subcategoriesResponse = await axios.get(
        `${BASE_URL}/subcategories`,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );
      console.log('✅ API Response - Orders:', ordersResponse.data);
      console.log('✅ API Response - Products:', productsResponse.data);
      // Create maps
      const productMap = {};
      (productsResponse.data.data || []).forEach(p => {
        productMap[p.id] = p;
      });
      const categoryMap = {};
      (categoriesResponse.data || []).forEach(c => {
        categoryMap[c.id] = c.category_name;
      });
      const subcategoryMap = {};
      (subcategoriesResponse.data || []).forEach(s => {
        subcategoryMap[s.id] = s;
      });
      const groupedOrders = [];
  
      if (Array.isArray(ordersResponse.data)) {
        ordersResponse.data.forEach(order => {
          if (order.products && Array.isArray(order.products)) {
            const sellerProducts = order.products;
           
            if (sellerProducts.length > 0) {
              const orderStatus = sellerProducts[0]?.order_status?.toLowerCase() || 'new';
              const paymentStatus = sellerProducts[0]?.payment_status?.toLowerCase() || 'pending';
              const totalQuantity = sellerProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
              const totalAmount = sellerProducts.reduce((sum, p) => sum + (parseFloat(p.price || 0) * (p.quantity || 0)), 0);
              groupedOrders.push({
                orderId: order.id,
                buyerId: order.buyer_id,
                orderType: order.order_type,
                createdAt: order.created_at,
                updatedAt: order.updated_at,
                orderStatus: orderStatus,
                paymentStatus: paymentStatus,
                buyerName: order.buyer_name || `Buyer ${order.buyer_id}`,
                buyerEmail: order.buyer_email || 'N/A',
                buyerPhone: order.buyer_mobile || order.buyer_phone || 'N/A',
                shippingAddress: order.shipping_address || 'Address not available',
                totalQuantity: totalQuantity,
                totalAmount: totalAmount.toFixed(2),
                productCount: sellerProducts.length,
                products: sellerProducts.map(product => {
                  const fullProduct = productMap[product.product_id];
                  const catName = fullProduct ? categoryMap[fullProduct.cat_id] || 'Unknown' : 'Unknown';
                  const subCat = fullProduct ? subcategoryMap[fullProduct.cat_sub_id] : null;
                  const subCatName = subCat ? subCat.subcategory_name : 'N/A';
                  return {
                    orderProductId: product.id,
                    productId: product.product_id,
                    sellerId: product.seller_id,
                    quantity: product.quantity,
                    price: parseFloat(product.price) || 0,
                    orderStatus: (product.order_status || 'new').toLowerCase(),
                    paymentStatus: (product.payment_status || 'pending').toLowerCase(),
                    productName: fullProduct?.name || `Product ${product.product_id}`,
                    productImage: fullProduct?.f_image ? `${BASE_URL}/uploads/${fullProduct.f_image}` : null,
                    sku: fullProduct?.sku || 'N/A',
                    category: fullProduct ? `${catName} / ${subCatName}` : 'General',
                    subcategory: subCatName
                  };
                })
              });
            }
          }
        });
      }
  
      console.log('✅ Total Grouped Orders:', groupedOrders.length);
  
      setOrders(groupedOrders);
      setError(null);
    } catch (err) {
      console.error('❌ Error:', err);
  
      let errorMessage = 'Failed to fetch orders. ';
      if (err.response) {
        errorMessage += `Server Error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage += 'No response from server.';
      } else {
        errorMessage += err.message;
      }
      setError(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    switch (statusLower) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'prepared':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'shipped':
      case 'shipping':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'returned':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'cancelled':
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPaymentColor = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    switch (statusLower) {
      case 'paid':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusCounts = () => {
    const counts = {
      all: orders.length,
      new: orders.filter(o => o.orderStatus?.toLowerCase() === 'new').length,
      pending: orders.filter(o => o.orderStatus?.toLowerCase() === 'pending').length,
      confirmed: orders.filter(o => o.orderStatus?.toLowerCase() === 'confirmed').length,
      shipped: orders.filter(o => o.orderStatus?.toLowerCase() === 'shipped').length,
      delivered: orders.filter(o => o.orderStatus?.toLowerCase() === 'delivered').length,
      returned: orders.filter(o => o.orderStatus?.toLowerCase() === 'returned').length,
      cancelled: orders.filter(o => o.orderStatus?.toLowerCase() === 'cancelled').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-red-500 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Orders</h3>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>
            <button
              onClick={fetchOrders}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
            >
              <FiRefreshCw className="mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
    
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Order Management</h1>
              <p className="text-gray-600 mt-1">Seller Orders (Seller ID: {sellerId})</p>
              <p className="text-sm text-gray-500 mt-1">Total Orders: {orders.length}</p>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {filterOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} {option.value !== 'all' && `(${statusCounts[option.value]})`}
                    </option>
                  ))}
                </select>
                <FiFilter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={orderTypeFilter}
                  onChange={(e) => setOrderTypeFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {orderTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FiFilter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                  Clear All
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Filter Chips */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map(option => {
              const count = option.value === 'all' ? statusCounts.all : statusCounts[option.value] || 0;
              const isActive = statusFilter === option.value;
          
              const getButtonColor = () => {
                if (!isActive) return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
            
                switch(option.color) {
                  case 'blue': return 'bg-blue-600 text-white shadow-lg';
                  case 'yellow': return 'bg-yellow-500 text-white shadow-lg';
                  case 'green': return 'bg-green-600 text-white shadow-lg';
                  case 'red': return 'bg-red-600 text-white shadow-lg';
                  case 'purple': return 'bg-purple-600 text-white shadow-lg';
                  case 'cyan': return 'bg-cyan-600 text-white shadow-lg';
                  case 'orange': return 'bg-orange-600 text-white shadow-lg';
                  case 'gray': return 'bg-gray-700 text-white shadow-lg';
                  default: return 'bg-gray-600 text-white shadow-lg';
                }
              };
          
              return (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all transform hover:scale-105 ${getButtonColor()}`}
                >
                  {option.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{orders.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiShoppingCart className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending Payment</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {orders.filter(o => o.paymentStatus?.toLowerCase() === 'pending').length}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FiCreditCard className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
        {/* Filter Info Banner */}
        {(statusFilter !== 'all' || orderTypeFilter !== 'all') && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiFilter className="text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Showing {filteredOrders.length} orders
                  {statusFilter !== 'all' && ` filtered by ${filterOptions.find(f => f.value === statusFilter)?.label}`}
                  {orderTypeFilter !== 'all' && statusFilter !== 'all' && ` and `}
                  {orderTypeFilter !== 'all' && `${orderTypeOptions.find(o => o.value === orderTypeFilter)?.label}`}
                </span>
              </div>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setOrderTypeFilter('all');
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
        {/* ✅ Orders Table - Desktop View - GROUPED BY ORDER ID */}
        <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Details</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Type</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => {
                    const isExpanded = expandedOrders[order.orderId];
                
                    return (
                      <React.Fragment key={index}>
                        <tr className="hover:bg-gray-50 transition duration-150">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">Order #{order.orderId}</div>
                              <div className="text-sm text-gray-500 flex items-center mt-1">
                                <FiCalendar className="w-4 h-4 mr-1" />
                                {formatDate(order.createdAt)}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">{order.orderType}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 font-medium">
                              {order.orderType || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{order.buyerName}</div>
                            <div className="text-sm text-gray-500">ID: {order.buyerId}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {order.productCount} {order.productCount === 1 ? 'Product' : 'Products'}
                              </span>
                              <button
                                onClick={() => toggleOrderExpansion(order.orderId)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title={isExpanded ? 'Hide products' : 'Show products'}
                              >
                                {isExpanded ? (
                                  <FiChevronUp className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <FiChevronDown className="w-4 h-4 text-blue-600" />
                                )}
                              </button>
                            </div>
                            <div className="text-sm text-gray-500">Qty: {order.totalQuantity}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-gray-900">₹{order.totalAmount}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPaymentColor(order.paymentStatus)}`}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleView(order)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <FiEye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                       
                        {/* ✅ Expandable Products Row */}
                        {isExpanded && (
                          <tr className="bg-gray-50">
                            <td colSpan="8" className="px-6 py-4">
                              <div className="bg-white rounded-lg p-4 shadow-inner">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Products in this order:</h4>
                                <div className="space-y-2">
                                  {order.products.map((product, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                      <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                          {product.productImage ? (
                                            <img
                                              src={product.productImage}
                                              alt={product.productName}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                              {product.productName?.charAt(0) || 'P'}
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                                          <div className="text-xs text-gray-500">
                                            SKU: {product.sku} | Product ID: {product.productId} | Category: {product.category}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-6">
                                        <div className="text-right">
                                          <div className="text-sm text-gray-600">Quantity</div>
                                          <div className="text-sm font-semibold">{product.quantity}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm text-gray-600">Unit Price</div>
                                          <div className="text-sm font-semibold">₹{product.price}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm text-gray-600">Total</div>
                                          <div className="text-sm font-semibold text-blue-600">
                                            ₹{(product.price * product.quantity).toFixed(2)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">
                        {(statusFilter !== 'all' || orderTypeFilter !== 'all') ? 'No matching orders found' : 'No orders found'}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        {(statusFilter !== 'all' || orderTypeFilter !== 'all') && (
                          <button
                            onClick={() => {
                              setStatusFilter('all');
                              setOrderTypeFilter('all');
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Show all orders
                          </button>
                        )}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* ✅ Orders Cards - Mobile/Tablet View */}
        <div className="lg:hidden space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, index) => {
              const isExpanded = expandedOrders[order.orderId];
          
              return (
                <div key={index} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">Order #{order.orderId}</h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        <FiCalendar className="w-4 h-4 mr-1" />
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{order.orderType || 'N/A'}</p>
                    </div>
                  </div>
              
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiPackage className="w-4 h-4 mr-2" />
                        <span>{order.productCount} Products (Qty: {order.totalQuantity})</span>
                      </div>
                      <button
                        onClick={() => toggleOrderExpansion(order.orderId)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <FiChevronUp className="w-5 h-5 text-blue-600" />
                        ) : (
                          <FiChevronDown className="w-5 h-5 text-blue-600" />
                        )}
                      </button>
                    </div>
                    {/* Expandable Products */}
                    {isExpanded && (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                        {order.products.map((product, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                {product.productImage ? (
                                  <img
                                    src={product.productImage}
                                    alt={product.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                                    {product.productName?.charAt(0) || 'P'}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                                <div className="text-xs text-gray-500">SKU: {product.sku} | ID: {product.productId}</div>
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Qty: {product.quantity}</span>
                              <span>₹{product.price} × {product.quantity} = ₹{(product.price * product.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                
                    <div className="flex items-center text-sm text-gray-600">
                      <FiUser className="w-4 h-4 mr-2" />
                      <span>{order.buyerName} (ID: {order.buyerId})</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="text-lg font-bold text-gray-900">₹{order.totalAmount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Payment:</span>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getPaymentColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleView(order)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center justify-center"
                    >
                      <FiEye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-600">
                {(statusFilter !== 'all' || orderTypeFilter !== 'all') ? 'No matching orders found' : 'No orders found'}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {(statusFilter !== 'all' || orderTypeFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setOrderTypeFilter('all');
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Show all orders
                  </button>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* ✅ Order Details Modal - Enhanced */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    #{selectedOrder.orderId}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">Order #{selectedOrder.orderId}</h2>
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        <FiShoppingCart className="mr-1" />
                        {selectedOrder.orderType}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.orderStatus)}`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          selectedOrder.orderStatus === 'delivered' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        {selectedOrder.orderStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX />
                </button>
              </div>
              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Products List */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center mb-4">
                      <FiPackage className="text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">
                        Products ({selectedOrder.productCount})
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {selectedOrder.products.map((product, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-4">
                            <div className="flex-shrink-0 relative h-16 w-16 rounded-lg overflow-hidden">
                              {product.productImage ? (
                                <img
                                  src={product.productImage}
                                  alt={product.productName}
                                  className="w-full h-full object-cover border"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                                  {product.productName?.charAt(0) || 'P'}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-semibold text-gray-800">{product.productName}</h4>
                              <p className="text-sm text-gray-500 mb-2">SKU: {product.sku}</p>
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                <div>
                                  <p className="text-xs text-gray-600">Product ID</p>
                                  <p className="text-sm font-medium">#{product.productId}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Category</p>
                                  <p className="text-sm font-medium">{product.category}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Quantity</p>
                                  <p className="text-sm font-medium">{product.quantity} units</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600">Unit Price</p>
                                  <p className="text-sm font-medium">₹{product.price}</p>
                                </div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Subtotal:</span>
                                  <span className="text-base font-bold text-blue-600">
                                    ₹{(product.price * product.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Buyer Information */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center mb-4">
                      <FiUser className="text-purple-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Buyer Information</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-gray-800">{selectedOrder.buyerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Buyer ID</p>
                        <p className="font-medium text-gray-800">#{selectedOrder.buyerId}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-800">{selectedOrder.buyerEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-800">{selectedOrder.buyerPhone}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-sm text-gray-600">Shipping Address</p>
                        <p className="font-medium text-gray-800">{selectedOrder.shippingAddress}</p>
                      </div>
                    </div>
                  </div>
                  {/* Order Timeline */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center mb-4">
                      <FiCalendar className="text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Order Timeline</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Order Created:</span>
                        <span className="font-semibold text-gray-800">
                          {formatDate(selectedOrder.createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-semibold text-gray-800">
                          {formatDate(selectedOrder.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Right Column - Payment Summary */}
                <div className="space-y-6">
                  <div className="bg-green-50 p-6 rounded-xl border border-green-100 sticky top-4">
                    <div className="flex items-center mb-4">
                      <FiCreditCard className="text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Order Summary</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Products:</span>
                        <span className="font-semibold">{selectedOrder.productCount}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Quantity:</span>
                        <span className="font-semibold">{selectedOrder.totalQuantity}</span>
                      </div>
                      <div className="border-t border-green-200 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                          <span className="text-2xl font-bold text-green-600">₹{selectedOrder.totalAmount}</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <span className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium w-full justify-center ${getPaymentColor(selectedOrder.paymentStatus)}`}>
                          <FiCreditCard className="mr-2" />
                          Payment: {selectedOrder.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={closeDetailModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;