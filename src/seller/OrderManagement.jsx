import React, { useState, useEffect } from 'react';

const ALLOWED_ORDER_STATUSES = ['New', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
const ALLOWED_PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded', 'Cancelled'];

const normalizeToAllowed = (value, allowed, fallback) => {
  if (value === null || value === undefined || value === '') return fallback;
  const v = String(value).trim();
  if (!v) return fallback;
  const found = allowed.find(opt => opt.toLowerCase() === v.toLowerCase());
  return found || fallback;
};

const OrderDashboard = () => {
  const SELLER_ID = 15; // ✅ Show orders for this seller only
  const API_BASE_URL = 'https://rettalion.apxfarms.com';

  const [orders, setOrders] = useState([]);
  const [buyers, setBuyers] = useState({});
  const [products, setProducts] = useState({});
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);

  const [formData, setFormData] = useState({
    buyer_id: '',
    order_type: 'Inquiry',
    products: [
      {
        product_id: '',
        seller_id: SELLER_ID, // default to seller 15
        quantity: '',
        price: '',
        order_status: 'New',
        payment_status: 'Pending'
      }
    ]
  });

  // ✅ Fetch buyers to get names
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

  // ✅ Fetch products to get names
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products`);
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

  // ✅ Fetch sellers to get names
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

  const sanitizeDataForAPI = (data) => ({
    buyer_id: parseInt(data.buyer_id) || 0,
    order_type: data.order_type || 'Inquiry',
    products: (data.products || []).map(p => ({
      product_id: parseInt(p.product_id) || 0,
      seller_id: parseInt(p.seller_id) || 0,
      quantity: parseInt(p.quantity) || 0,
      price: parseFloat(p.price) || 0.0,
      order_status: normalizeToAllowed(p.order_status, ALLOWED_ORDER_STATUSES, 'New'),
      payment_status: normalizeToAllowed(p.payment_status, ALLOWED_PAYMENT_STATUSES, 'Pending'),
    })),
  });

  // ✅ Fetch orders ONLY for seller 15
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/orderseller/${SELLER_ID}`);
      if (!res.ok) throw new Error('Failed to fetch orders for seller 15');
      const data = await res.json();

      // Normalize and keep only products for seller 15 within each order
      const normalizedOrders = (Array.isArray(data) ? data : []).map(order => {
        const filteredProducts = (order.products || []).filter(p => Number(p.seller_id) === SELLER_ID);
        const normalizedProducts = filteredProducts.map(p => ({
          ...p,
          order_status: normalizeToAllowed(p.order_status, ALLOWED_ORDER_STATUSES, 'New'),
          payment_status: normalizeToAllowed(p.payment_status, ALLOWED_PAYMENT_STATUSES, 'Pending'),
        }));
        return {
          ...order,
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

  // ✅ Fetch single order and show only seller 15 products
  const fetchSingleOrder = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/order/${orderId}`);
      if (!res.ok) throw new Error('Failed to fetch order');
      const data = await res.json();
      const normalized = {
        ...data,
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

  const createOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = sanitizeDataForAPI(formData);
      const res = await fetch(`${API_BASE_URL}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to create order: ${await res.text()}`);
      await res.json();
      setShowModal(false);
      resetForm();
      await fetchOrders();
      alert('✅ Order created successfully!');
    } catch (err) {
      setError(err.message || 'Failed to create order');
      alert('❌ ' + (err.message || 'Failed to create order'));
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const payload = sanitizeDataForAPI(formData);
      const res = await fetch(`${API_BASE_URL}/order/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Failed to update order: ${await res.text()}`);
      await res.json();
      setShowModal(false);
      setEditingOrder(null);
      resetForm();
      await fetchOrders();
      alert('✅ Order updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update order');
      alert('❌ ' + (err.message || 'Failed to update order'));
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('⚠️ Are you sure you want to delete this order?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/order/${orderId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete order');
      await fetchOrders();
      alert('✅ Order deleted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to delete order');
      alert('❌ ' + (err.message || 'Failed to delete order'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, index = null, field = null) => {
    const { name, value } = e.target;
    if (index !== null && field) {
      setFormData(prev => {
        const products = [...prev.products];
        products[index] = { ...products[index], [field]: value };
        return { ...prev, products };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const addProductRow = () => {
    setFormData(prev => ({
      ...prev,
      products: [
        ...prev.products,
        { product_id: '', seller_id: SELLER_ID, quantity: '', price: '', order_status: 'New', payment_status: 'Pending' },
      ],
    }));
  };

  const removeProductRow = (index) => {
    if (formData.products.length === 1) {
      setError('❌ At least one product is required');
      return;
    }
    setFormData(prev => ({ ...prev, products: prev.products.filter((_, i) => i !== index) }));
  };

  const resetForm = () => {
    setFormData({
      buyer_id: '',
      order_type: 'Inquiry',
      products: [
        { product_id: '', seller_id: SELLER_ID, quantity: '', price: '', order_status: 'New', payment_status: 'Pending' },
      ],
    });
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    const productsData = (order.products || []).length
      ? order.products.map(p => ({
          product_id: p.product_id ?? '',
          seller_id: p.seller_id ?? SELLER_ID,
          quantity: p.quantity ?? '',
          price: p.price ?? '',
          order_status: normalizeToAllowed(p.order_status, ALLOWED_ORDER_STATUSES, 'New'),
          payment_status: normalizeToAllowed(p.payment_status, ALLOWED_PAYMENT_STATUSES, 'Pending'),
        }))
      : [{ product_id: '', seller_id: SELLER_ID, quantity: '', price: '', order_status: 'New', payment_status: 'Pending' }];
    setFormData({
      buyer_id: order.buyer_id ?? '',
      order_type: order.order_type || 'Inquiry',
      products: productsData,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.buyer_id || parseInt(formData.buyer_id) <= 0) {
      setError('❌ Valid Buyer ID is required');
      return;
    }
    for (let i = 0; i < formData.products.length; i++) {
      const p = formData.products[i];
      if (!p.product_id || parseInt(p.product_id) <= 0) return setError(`❌ Valid Product ID required (item ${i+1})`);
      if (!p.seller_id || parseInt(p.seller_id) <= 0) return setError(`❌ Valid Seller ID required (item ${i+1})`);
      if (!p.quantity || parseInt(p.quantity) <= 0) return setError(`❌ Valid Quantity required (item ${i+1})`);
      if (p.price === '' || isNaN(parseFloat(p.price)) || parseFloat(p.price) < 0) return setError(`❌ Valid Price required (item ${i+1})`);
      if (!ALLOWED_ORDER_STATUSES.includes(p.order_status))
        return setError(`❌ Order Status invalid (item ${i+1})`);
      if (!ALLOWED_PAYMENT_STATUSES.includes(p.payment_status))
        return setError(`❌ Payment Status invalid (item ${i+1})`);
    }
    if (editingOrder) updateOrder(editingOrder.id); else createOrder();
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

  // ✅ Helper functions to get names
  const getBuyerName = (buyerId) => buyers[buyerId] || `Buyer ${buyerId}`;
  const getProductName = (productId) => products[productId] || `Product ${productId}`;
  const getSellerName = (sellerId) => sellers[sellerId] || `Seller ${sellerId}`;

  // ✅ Order statistics calculations (based on seller 15 products)
  const getOrderStats = () => {
    const totalOrders = orders.length;
    const newOrders = orders.filter(order => order.products?.some(p => p.order_status === 'New')).length;
    const pendingOrders = orders.filter(order => order.products?.some(p => p.order_status === 'Pending')).length;
    const deliveredOrders = orders.filter(order => order.products?.some(p => p.order_status === 'Delivered')).length;
    return { totalOrders, newOrders, pendingOrders, deliveredOrders };
  };

  // ✅ Fetch all data on mount
  useEffect(() => { 
    fetchOrders();
    fetchBuyers();
    fetchProducts();
    fetchSellers();
  }, []);

  const stats = getOrderStats();

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
            <button
              onClick={() => { setEditingOrder(null); resetForm(); setError(null); setShowModal(true); }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add New Order
            </button>
          </div>
        </div>

        {/* Totals Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Total Orders</h2>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    New: {stats.newOrders}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Pending: {stats.pendingOrders}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Delivered: {stats.deliveredOrders}
                  </span>
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

        {/* Orders Table (Seller 15 only) */}
        {!loading && orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Buyer Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Order Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Products</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => {
                    // total amount for seller 15 products only
                    const totalAmount = order.products?.reduce((sum, p) => 
                      sum + (parseFloat(p.price || 0) * parseInt(p.quantity || 0)), 0
                    ) || 0;

                    return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-blue-600">#{order.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 font-medium">
                          {getBuyerName(order.buyer_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">{order.order_type}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {order.products ? order.products.length : 0} items
                          </span>
                          {order.products && order.products.slice(0, 2).map((p, i) => (
                            <span key={i} className="text-xs text-gray-600 truncate max-w-xs">
                              {getProductName(p.product_id)} • Qty {p.quantity} • 
                              <span className={`ml-1 px-2 py-0.5 rounded-full ${getOrderStatusColor(p.order_status)} text-[10px]`}>
                                {p.order_status}
                              </span>
                            </span>
                          ))}
                          {order.products && order.products.length > 2 && (
                            <span className="text-xs text-gray-500">+{order.products.length - 2} more</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-green-700">
                          ₹{totalAmount.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center items-center gap-4">
                          <button 
                            onClick={() => fetchSingleOrder(order.id)} 
                            className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" 
                            title="View Order"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          <button 
                            onClick={() => handleEdit(order)} 
                            className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors" 
                            title="Edit Order"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button 
                            onClick={() => deleteOrder(order.id)} 
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" 
                            title="Delete Order"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Orders Found</h3>
            <p className="text-gray-500">No orders found for Seller ID {SELLER_ID}</p>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full my-8">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg z-10">
                <h2 className="text-2xl font-bold">{editingOrder ? `Edit Order #${editingOrder.id}` : 'Create New Order'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 max-height-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 bg-blue-50 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Buyer ID <span className="text-red-500">*</span></label>
                    <input type="number" name="buyer_id" value={formData.buyer_id} onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" min="1" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Order Type <span className="text-red-500">*</span></label>
                    <select name="order_type" value={formData.order_type} onChange={handleInputChange}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white" required>
                      <option value="Inquiry">Inquiry</option>
                      <option value="Order">Order</option>
                      <option value="Purchase">Purchase</option>
                      <option value="Return">Return</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-800">Products ({formData.products.length})</h3>
                    <button type="button" onClick={addProductRow} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors shadow-md">+ Add Product</button>
                  </div>

                  {formData.products.map((product, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4 border-2 border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-gray-700">Product #{index + 1}</h4>
                        {formData.products.length > 1 && (
                          <button type="button" onClick={() => removeProductRow(index)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition-colors">Remove</button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Product ID <span className="text-red-500">*</span></label>
                          <input type="number" value={product.product_id} onChange={(e) => handleInputChange(e, index, 'product_id')}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required min="1" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Seller ID <span className="text-red-500">*</span></label>
                          <input type="number" value={product.seller_id} onChange={(e) => handleInputChange(e, index, 'seller_id')}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required min="1" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
                          <input type="number" value={product.quantity} onChange={(e) => handleInputChange(e, index, 'quantity')}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required min="1" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Price (₹) <span className="text-red-500">*</span></label>
                          <input type="number" step="0.01" value={product.price} onChange={(e) => handleInputChange(e, index, 'price')}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required min="0" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Order Status <span className="text-red-500">*</span></label>
                          <select
                            value={product.order_status}
                            onChange={(e) => handleInputChange(e, index, 'order_status')}
                            className="w-full px-3 py-2 border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-600 bg-white font-medium" required
                          >
                            {ALLOWED_ORDER_STATUSES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Status <span className="text-red-500">*</span></label>
                          <select
                            value={product.payment_status}
                            onChange={(e) => handleInputChange(e, index, 'payment_status')}
                            className="w-full px-3 py-2 border-2 border-green-400 rounded-lg focus:ring-2 focus:ring-green-600 bg-white font-medium" required
                          >
                            {ALLOWED_PAYMENT_STATUSES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t-2 border-gray-200 sticky bottom-0 bg-white">
                  <button type="button" onClick={() => { setShowModal(false); setEditingOrder(null); resetForm(); setError(null); }}
                    className="px-6 py-3 border-2 border-gray-400 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md">
                    {editingOrder ? '💾 Update Order' : '✅ Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal (Seller 15 products only) */}
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
                  
                  {/* Order Summary */}
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
                    onClick={() => handleEdit(viewingOrder)}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-md flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Order
                  </button>
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