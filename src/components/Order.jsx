import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiEye, 
  FiEdit, 
  FiRefreshCw, 
  FiShoppingCart, 
  FiUser, 
  FiPackage, 
  FiDollarSign, 
  FiCalendar,
  FiTruck,
  FiCreditCard,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiFilter
} from 'react-icons/fi';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sellerId, setSellerId] = useState(6);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'new', 'pending', 'delivered'

  const BASE_URL = 'http://rettalion.apxfarms.com';

  // ✅ Status options matching API response
  const statusOptions = [
    { value: 'new', label: 'New', color: 'blue' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'confirmed', label: 'Confirmed', color: 'cyan' },
    { value: 'prepared', label: 'Prepared', color: 'indigo' },
    { value: 'shipped', label: 'Shipped', color: 'purple' },
    { value: 'delivered', label: 'Delivered', color: 'green' },
    { value: 'returned', label: 'Returned', color: 'orange' },
    { value: 'cancelled', label: 'Cancelled', color: 'red' }
  ];

  // Filter options for dropdown
  const filterOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'new', label: 'New' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'prepared', label: 'Prepared' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'returned', label: 'Returned' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Fetch Orders
  useEffect(() => {
    fetchOrders();
  }, [sellerId]);

  // Apply filter when orders or filter changes
  useEffect(() => {
    applyFilter();
  }, [orders, statusFilter]);

  // Apply filter function
  const applyFilter = () => {
    if (statusFilter === 'all') {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order => 
        order.orderStatus?.toLowerCase() === statusFilter.toLowerCase()
      );
      setFilteredOrders(filtered);
    }
  };

  // Show notification
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 4000);
  };

  // ✅ UPDATED: Handle Status Change using PATCH /order/{orderId}
  const handleStatusChange = async (order, newStatus) => {
    const updateKey = `${order.orderId}-${order.productId}`;
    
    try {
      setUpdatingOrderId(updateKey);
      
      console.log('🔄 Updating order status:', {
        orderId: order.orderId,
        productId: order.productId,
        newStatus: newStatus
      });

      // ✅ PATCH request to update order status
      const response = await axios.patch(
        `${BASE_URL}/order/${order.orderId}`,
        {
          products: [
            {
              product_id: order.productId,
              seller_id: order.sellerId,
              quantity: order.quantity,
              price: order.price,
              order_status: newStatus,
              payment_status: order.paymentStatus
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000
        }
      );

      console.log('✅ Status updated successfully:', response.data);
      
      // ✅ Update local state immediately for live update
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.orderId === order.orderId && o.productId === order.productId
            ? { ...o, orderStatus: newStatus }
            : o
        )
      );

      // Update selected order if modal is open
      if (selectedOrder && selectedOrder.orderId === order.orderId && selectedOrder.productId === order.productId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      }

      showNotification(`✅ Order #${order.orderId} status updated to "${newStatus}"`, 'success');

    } catch (err) {
      console.error('❌ Error updating status:', err);
      
      let errorMessage = 'Failed to update order status. ';
      
      if (err.response) {
        errorMessage += `Server returned ${err.response.status}. `;
        if (err.response.data?.message) {
          errorMessage += err.response.data.message;
        }
      } else if (err.request) {
        errorMessage += 'No response from server.';
      } else {
        errorMessage += err.message;
      }

      showNotification(errorMessage, 'error');
      
      // Refresh orders from server on error
      await fetchOrders();
      
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // ✅ Enhanced View Function with Modal
  const handleView = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  // ✅ FIXED: Fetch Orders Function - Shows ALL orders or filtered by seller
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Fetching all orders...');

      const response = await axios.get(
        `${BASE_URL}/orders`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      console.log('✅ API Response:', response.data);
      console.log('📊 Total orders from API:', response.data?.length);

      const processedOrders = [];
      
      if (Array.isArray(response.data)) {
        response.data.forEach(order => {
          console.log('📦 Processing Order:', order.id, 'Products:', order.products);
          
          if (order.products && Array.isArray(order.products)) {
            order.products.forEach(product => {
              console.log('🔍 Product seller_id:', product.seller_id, 'Target seller_id:', sellerId);
              
              // ✅ REMOVED FILTER - Show all orders (comment out if you want to filter by seller)
              // if (product.seller_id === sellerId) {
                processedOrders.push({
                  orderId: order.id,
                  buyerId: order.buyer_id,
                  orderType: order.order_type,
                  createdAt: order.created_at,
                  updatedAt: order.updated_at,
                  productId: product.product_id,
                  sellerId: product.seller_id,
                  quantity: product.quantity,
                  price: product.price,
                  orderStatus: product.order_status || 'new',
                  paymentStatus: product.payment_status || 'pending',
                  buyerName: order.buyer_name || `Buyer ${order.buyer_id}`,
                  buyerEmail: order.buyer_email || 'N/A',
                  buyerPhone: order.buyer_phone || 'N/A',
                  shippingAddress: order.shipping_address || 'Address not available',
                  productName: product.product_name || `Product ${product.product_id}`,
                  productImage: product.product_image || null,
                  category: product.category || 'General',
                  subcategory: product.subcategory || 'N/A'
                });
              // }
            });
          }
        });
      }
      
      console.log('✅ Total Processed Orders:', processedOrders.length);
      console.log('📋 Processed Orders Data:', processedOrders);
      
      setOrders(processedOrders);
      setError(null);

    } catch (err) {
      console.error('❌ Error:', err);
      console.error('❌ Error Details:', err.response?.data);
      
      let errorMessage = 'Failed to fetch orders. ';

      if (err.response) {
        errorMessage += `Server Error: ${err.response.status}`;
        console.error('Response data:', err.response.data);
      } else if (err.request) {
        errorMessage += 'No response from server.';
        console.error('No response received');
      } else {
        errorMessage += err.message;
      }

      setError(errorMessage);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Close Detail Modal
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  // ✅ Get Status Badge Color
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

  // Get Payment Status Color
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

  // Format Date
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

  // Calculate total amount
  const calculateTotal = (order) => {
    return (parseFloat(order.price || 0) * parseInt(order.quantity || 0)).toFixed(2);
  };

  // Get status counts for stats
  const getStatusCounts = () => {
    const counts = {
      all: orders.length,
      new: orders.filter(o => o.orderStatus?.toLowerCase() === 'new').length,
      pending: orders.filter(o => o.orderStatus?.toLowerCase() === 'pending').length,
      confirmed: orders.filter(o => o.orderStatus?.toLowerCase() === 'confirmed').length,
      prepared: orders.filter(o => o.orderStatus?.toLowerCase() === 'prepared').length,
      shipped: orders.filter(o => o.orderStatus?.toLowerCase() === 'shipped').length,
      delivered: orders.filter(o => o.orderStatus?.toLowerCase() === 'delivered').length,
      returned: orders.filter(o => o.orderStatus?.toLowerCase() === 'returned').length,
      cancelled: orders.filter(o => o.orderStatus?.toLowerCase() === 'cancelled').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  // Loading State
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

  // Error State
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
        
        {/* Notification Toast */}
        {notification.show && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}>
              {notification.type === 'success' ? (
                <FiCheck className="w-5 h-5" />
              ) : (
                <FiAlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Order Management</h1>
              <p className="text-gray-600 mt-1">All Orders (Seller ID: {sellerId})</p>
              <p className="text-sm text-gray-500 mt-1">Total Orders: {orders.length}</p>
            </div>
            <div className="flex gap-3">
              {/* Filter Dropdown */}
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
              <button
                onClick={fetchOrders}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Status Summary */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Status Summary:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                New: {statusCounts.new}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Pending: {statusCounts.pending}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                Confirmed: {statusCounts.confirmed}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                Prepared: {statusCounts.prepared}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Shipped: {statusCounts.shipped}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Delivered: {statusCounts.delivered}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Returned: {statusCounts.returned}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Cancelled: {statusCounts.cancelled}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Orders</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  {orders.filter(o => !['delivered', 'completed', 'cancelled', 'returned'].includes(o.orderStatus?.toLowerCase())).length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiPackage className="w-8 h-8 text-green-600" />
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

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">
                  ₹{orders.reduce((sum, order) => sum + parseFloat(calculateTotal(order)), 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FiDollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Info */}
        {statusFilter !== 'all' && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiFilter className="text-blue-600" />
                <span className="text-blue-800 font-medium">
                  Showing {filteredOrders.length} {statusFilter} orders
                </span>
              </div>
              <button
                onClick={() => setStatusFilter('all')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear Filter
              </button>
            </div>
          </div>
        )}

        {/* Orders Table - Desktop View */}
        <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Details</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order, index) => {
                    const updateKey = `${order.orderId}-${order.productId}`;
                    const isUpdating = updatingOrderId === updateKey;
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50 transition duration-150">
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
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                              {order.productName?.charAt(0) || 'P'}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{order.productName}</div>
                              <div className="text-sm text-gray-500">Qty: {order.quantity}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{order.buyerName}</div>
                          <div className="text-sm text-gray-500">ID: {order.buyerId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">₹{calculateTotal(order)}</div>
                        </td>
                        <td className="px-6 py-4">
                          {/* ✅ Status Dropdown */}
                          <div className="relative">
                            <select
                              value={order.orderStatus}
                              onChange={(e) => handleStatusChange(order, e.target.value)}
                              disabled={isUpdating}
                              className={`w-full px-3 py-2 text-xs font-semibold rounded-lg border-2 transition-all cursor-pointer
                                ${getStatusColor(order.orderStatus)}
                                ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                                focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none`}
                            >
                              {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {isUpdating && (
                              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                              </div>
                            )}
                          </div>
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">
                        {statusFilter === 'all' ? 'No orders found' : `No ${statusFilter} orders found`}
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        {statusFilter !== 'all' && (
                          <button
                            onClick={() => setStatusFilter('all')}
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

        {/* Orders Cards - Mobile/Tablet View */}
        <div className="lg:hidden space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, index) => {
              const updateKey = `${order.orderId}-${order.productId}`;
              const isUpdating = updatingOrderId === updateKey;
              
              return (
                <div key={index} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">Order #{order.orderId}</h3>
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        <FiCalendar className="w-4 h-4 mr-1" />
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs mr-3">
                          {order.productName?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.productName}</div>
                          <div className="text-xs text-gray-500">Qty: {order.quantity}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">₹{calculateTotal(order)}</div>
                        <span className={`px-2 py-1 text-xs rounded-full border ${getPaymentColor(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <FiUser className="w-4 h-4 mr-2" />
                      <span>{order.buyerName} (ID: {order.buyerId})</span>
                    </div>

                    {/* Mobile Status Dropdown */}
                    <div className="pt-2">
                      <label className="text-xs text-gray-600 font-medium mb-1 block">Order Status:</label>
                      <div className="relative">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                          disabled={isUpdating}
                          className={`w-full px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-all
                            ${getStatusColor(order.orderStatus)}
                            ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                            focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none`}
                        >
                          {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {isUpdating && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700"></div>
                          </div>
                        )}
                      </div>
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
                {statusFilter === 'all' ? 'No orders found' : `No ${statusFilter} orders found`}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {statusFilter !== 'all' && (
                  <button
                    onClick={() => setStatusFilter('all')}
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

      {/* Order Details Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                {/* Left Column - Order & Product Information */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Product Information Card */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center mb-4">
                      <FiPackage className="text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Product Information</h3>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {selectedOrder.productName?.charAt(0) || 'P'}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-800">{selectedOrder.productName}</h4>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div>
                            <p className="text-sm text-gray-600">Product ID</p>
                            <p className="font-medium">#{selectedOrder.productId}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Quantity</p>
                            <p className="font-medium">{selectedOrder.quantity} units</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Unit Price</p>
                            <p className="font-medium">₹{selectedOrder.price}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Category</p>
                            <p className="font-medium">{selectedOrder.category}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Timeline Card */}
                  <div className="bg-gray-50 p-6 rounded-xl">
                    <div className="flex items-center mb-4">
                      <FiCalendar className="text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Order Timeline</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Order Created:</span>
                        <div className="text-right">
                          <span className="font-semibold text-gray-800 block">
                            {formatDate(selectedOrder.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Last Updated:</span>
                        <div className="text-right">
                          <span className="font-semibold text-gray-800 block">
                            {formatDate(selectedOrder.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Update in Modal */}
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center mb-4">
                      <FiEdit className="text-blue-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Update Order Status</h3>
                    </div>
                    <div className="relative">
                      <select
                        value={selectedOrder.orderStatus}
                        onChange={(e) => {
                          handleStatusChange(selectedOrder, e.target.value);
                        }}
                        disabled={updatingOrderId === `${selectedOrder.orderId}-${selectedOrder.productId}`}
                        className={`w-full px-4 py-3 text-sm font-semibold rounded-lg border-2 transition-all
                          ${getStatusColor(selectedOrder.orderStatus)}
                          ${updatingOrderId === `${selectedOrder.orderId}-${selectedOrder.productId}` ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none`}
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {updatingOrderId === `${selectedOrder.orderId}-${selectedOrder.productId}` && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Payment Information */}
                <div className="space-y-6">
                  {/* Payment Summary Card */}
                  <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                    <div className="flex items-center mb-4">
                      <FiDollarSign className="text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold text-gray-800">Payment Summary</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Unit Price:</span>
                        <span className="font-semibold">₹{selectedOrder.price}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-semibold">{selectedOrder.quantity}</span>
                      </div>
                      <div className="border-t border-green-200 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                          <span className="text-xl font-bold text-green-600">₹{calculateTotal(selectedOrder)}</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentColor(selectedOrder.paymentStatus)}`}>
                          <FiCreditCard className="mr-1" />
                          Payment: {selectedOrder.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button 
                  onClick={closeDetailModal}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-semibold"
                >
                  Close
                </button>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold flex items-center">
                  <FiTruck className="mr-2" />
                  Track Shipment
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