// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    categories: 0,
    subcategories: 0,
    products: 0,
    orders: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://rettalion.apxfarms.com';
  const SELLER_ID = 6; // You can make this dynamic based on logged-in user

  // ✅ Authentication Check - Redirect if not logged in
  useEffect(() => {
    const checkAuth = () => {
      const savedAuth = localStorage.getItem('retaillian_auth');
      const savedUser = localStorage.getItem('retaillian_user');
      
      if (!savedAuth || savedAuth !== 'true' || !savedUser) {
        console.log('⚠️ No authentication found, redirecting to login...');
        localStorage.removeItem('retaillian_auth');
        localStorage.removeItem('retaillian_user');
        window.location.reload();
      } else {
        console.log('✅ User authenticated:', JSON.parse(savedUser));
      }
    };
    
    checkAuth();
  }, []);

  // Fetch dashboard stats from API
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch all data in parallel
        const [categoriesRes, subcategoriesRes, productsRes, ordersRes] = await Promise.all([
          fetch(`${API_BASE_URL}/categories`),
          fetch(`${API_BASE_URL}/subcategories`),
          fetch(`${API_BASE_URL}/products`),
          fetch(`${API_BASE_URL}/orderseller/${SELLER_ID}`)
        ]);

        // Parse categories
        let categoriesCount = 0;
        if (categoriesRes && categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          categoriesCount = Array.isArray(categoriesData) ? categoriesData.length : 0;
          console.log('📂 Categories count:', categoriesCount);
        } else {
          console.error('❌ Failed to fetch categories:', categoriesRes?.status);
        }

        // Parse subcategories
        let subcategoriesCount = 0;
        if (subcategoriesRes && subcategoriesRes.ok) {
          const subcategoriesData = await subcategoriesRes.json();
          subcategoriesCount = Array.isArray(subcategoriesData) ? subcategoriesData.length : 0;
          console.log('📁 Subcategories count:', subcategoriesCount);
        } else {
          console.error('❌ Failed to fetch subcategories:', subcategoriesRes?.status);
        }

        // Parse products - Enhanced parsing to handle different response formats
        let productsCount = 0;
        if (productsRes && productsRes.ok) {
          const productsData = await productsRes.json();
          
          if (Array.isArray(productsData)) {
            productsCount = productsData.length;
          } else if (productsData && Array.isArray(productsData.data)) {
            productsCount = productsData.data.length;
          } else if (productsData && Array.isArray(productsData.products)) {
            productsCount = productsData.products.length;
          } else if (productsData && typeof productsData === 'object') {
            // Count the number of product objects if it's an object with product IDs as keys
            const productKeys = Object.keys(productsData).filter(key => 
              !['success', 'message', 'count', 'total'].includes(key)
            );
            productsCount = productKeys.length;
          }
          
          console.log('📦 Products count:', productsCount);
        } else {
          console.error('❌ Failed to fetch products:', productsRes?.status);
        }

        // Parse orders - Count individual order items
        let ordersCount = 0;
        if (ordersRes && ordersRes.ok) {
          const ordersData = await ordersRes.json();
          
          if (Array.isArray(ordersData)) {
            // Count all product items across all orders
            ordersData.forEach(order => {
              if (order.products && Array.isArray(order.products)) {
                ordersCount += order.products.length;
              }
            });
          } else if (ordersData && Array.isArray(ordersData.orders)) {
            ordersData.orders.forEach(order => {
              if (order.products && Array.isArray(order.products)) {
                ordersCount += order.products.length;
              }
            });
          }
          
          console.log('🛒 Orders count:', ordersCount);
        } else {
          console.error('❌ Failed to fetch orders:', ordersRes?.status);
        }

        setStats({
          categories: categoriesCount,
          subcategories: subcategoriesCount,
          products: productsCount,
          orders: ordersCount
        });

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Function to manually refresh stats
  const refreshStats = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [categoriesRes, subcategoriesRes, productsRes, ordersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/categories`),
        fetch(`${API_BASE_URL}/subcategories`),
        fetch(`${API_BASE_URL}/products`),
        fetch(`${API_BASE_URL}/orderseller/${SELLER_ID}`)
      ]);

      let categoriesCount = 0;
      if (categoriesRes && categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        categoriesCount = Array.isArray(categoriesData) ? categoriesData.length : 0;
      }

      let subcategoriesCount = 0;
      if (subcategoriesRes && subcategoriesRes.ok) {
        const subcategoriesData = await subcategoriesRes.json();
        subcategoriesCount = Array.isArray(subcategoriesData) ? subcategoriesData.length : 0;
      }

      let productsCount = 0;
      if (productsRes && productsRes.ok) {
        const productsData = await productsRes.json();
        
        if (Array.isArray(productsData)) {
          productsCount = productsData.length;
        } else if (productsData && Array.isArray(productsData.data)) {
          productsCount = productsData.data.length;
        } else if (productsData && Array.isArray(productsData.products)) {
          productsCount = productsData.products.length;
        } else if (productsData && typeof productsData === 'object') {
          const productKeys = Object.keys(productsData).filter(key => 
            !['success', 'message', 'count', 'total'].includes(key)
          );
          productsCount = productKeys.length;
        }
      }

      let ordersCount = 0;
      if (ordersRes && ordersRes.ok) {
        const ordersData = await ordersRes.json();
        
        if (Array.isArray(ordersData)) {
          ordersData.forEach(order => {
            if (order.products && Array.isArray(order.products)) {
              ordersCount += order.products.length;
            }
          });
        } else if (ordersData && Array.isArray(ordersData.orders)) {
          ordersData.orders.forEach(order => {
            if (order.products && Array.isArray(order.products)) {
              ordersCount += order.products.length;
            }
          });
        }
      }

      setStats({
        categories: categoriesCount,
        subcategories: subcategoriesCount,
        products: productsCount,
        orders: ordersCount
      });

      console.log('✅ Stats refreshed successfully');

    } catch (err) {
      console.error('Error refreshing stats:', err);
      setError('Failed to refresh statistics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with User Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome back, <span className="font-semibold text-blue-600">{user?.name || 'Admin'}</span>
          </p>
        </div>
       
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
          <button 
            onClick={() => setError('')}
            className="float-right font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Grid - Now 4 columns with Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Categories */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Categories</h3>
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {loading ? (
              <span className="animate-pulse bg-gray-200 rounded w-16 h-8 inline-block"></span>
            ) : (
              stats.categories.toLocaleString()
            )}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total categories</p>
        </div>

        {/* Subcategories */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Subcategories</h3>
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {loading ? (
              <span className="animate-pulse bg-gray-200 rounded w-16 h-8 inline-block"></span>
            ) : (
              stats.subcategories.toLocaleString()
            )}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total subcategories</p>
        </div>

        {/* Products */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow relative">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Products</h3>
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {loading ? (
              <span className="animate-pulse bg-gray-200 rounded w-16 h-8 inline-block"></span>
            ) : (
              stats.products.toLocaleString()
            )}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total products</p>
          
          {/* Live indicator */}
          {!loading && (
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          )}
        </div>

        {/* ✅ NEW: Orders */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow relative">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-700">Orders</h3>
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {loading ? (
              <span className="animate-pulse bg-gray-200 rounded w-16 h-8 inline-block"></span>
            ) : (
              stats.orders.toLocaleString()
            )}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total orders</p>
          
          {/* Live indicator */}
          {!loading && (
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Additional Info Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">📊 Dashboard Summary</h3>
            <p className="text-sm text-gray-600">
              You have <span className="font-bold text-blue-600">{stats.products}</span> products across{' '}
              <span className="font-bold text-blue-600">{stats.categories}</span> categories with{' '}
              <span className="font-bold text-purple-600">{stats.orders}</span> total orders.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Last updated</p>
            <p className="text-sm font-semibold text-gray-700">
              {new Date().toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;