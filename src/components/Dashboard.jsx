// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [buyerCount, setBuyerCount] = useState(0);
  const [activeBuyerCount, setActiveBuyerCount] = useState(0);
  const [sellerCount, setSellerCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [subcategoryCount, setSubcategoryCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState({
    buyers: false,
    sellers: false,
    categories: false,
    subcategories: false,
    products: false
  });
  const [error, setError] = useState('');

  const API_BASE = 'http://rettalion.apxfarms.com';

  // Fetch buyers count from API
  const fetchBuyersCount = async () => {
    setLoading(prev => ({ ...prev, buyers: true }));
    setError('');
    try {
      console.log('Fetching buyers count...');
      const response = await fetch(`${API_BASE}/buyers`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch buyers error response:', errorText);
        throw new Error(`Failed to fetch buyers: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched buyers data:', data);
      
      let buyersArray = [];
      if (Array.isArray(data)) {
        buyersArray = data;
      } else if (data && Array.isArray(data.buyers)) {
        buyersArray = data.buyers;
      } else {
        console.error('Invalid buyers data format:', data);
        throw new Error('Invalid buyers data format received from server');
      }

      const totalBuyersCount = buyersArray.length;
      const activeBuyersCount = buyersArray.filter(buyer => buyer.status === 'Active').length;

      setBuyerCount(totalBuyersCount);
      setActiveBuyerCount(activeBuyersCount);
      
    } catch (err) {
      console.error('Fetch buyers count error:', err);
      setError(err.message);
      setBuyerCount(0);
      setActiveBuyerCount(0);
    } finally {
      setLoading(prev => ({ ...prev, buyers: false }));
    }
  };

  // Fetch sellers count from API
  const fetchSellersCount = async () => {
    setLoading(prev => ({ ...prev, sellers: true }));
    try {
      console.log('Fetching sellers count...');
      const response = await fetch(`${API_BASE}/sellers`);
      
      if (!response.ok) {
        console.error('Fetch sellers error:', response.status);
        throw new Error(`Failed to fetch sellers: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched sellers data:', data);
      
      let sellersArray = [];
      if (Array.isArray(data)) {
        sellersArray = data;
      } else if (data && Array.isArray(data.sellers)) {
        sellersArray = data.sellers;
      }
      
      setSellerCount(sellersArray.length);
      
    } catch (err) {
      console.error('Fetch sellers count error:', err);
      setSellerCount(0);
    } finally {
      setLoading(prev => ({ ...prev, sellers: false }));
    }
  };

  // Fetch categories count from API
  const fetchCategoriesCount = async () => {
    setLoading(prev => ({ ...prev, categories: true }));
    try {
      console.log('Fetching categories count...');
      const response = await fetch(`${API_BASE}/categories`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch categories error response:', errorText);
        throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched categories data:', data);
      
      if (Array.isArray(data)) {
        setCategoryCount(data.length);
      } else {
        console.error('Invalid categories data format:', data);
        setCategoryCount(0);
      }
      
    } catch (err) {
      console.error('Fetch categories count error:', err);
      setCategoryCount(0);
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  // Fetch subcategories count from API
  const fetchSubcategoriesCount = async () => {
    setLoading(prev => ({ ...prev, subcategories: true }));
    try {
      console.log('Fetching subcategories count...');
      const response = await fetch(`${API_BASE}/subcategories`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch subcategories error response:', errorText);
        throw new Error(`Failed to fetch subcategories: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched subcategories data:', data);
      
      if (Array.isArray(data)) {
        setSubcategoryCount(data.length);
      } else {
        console.error('Invalid subcategories data format:', data);
        setSubcategoryCount(0);
      }
      
    } catch (err) {
      console.error('Fetch subcategories count error:', err);
      setSubcategoryCount(0);
    } finally {
      setLoading(prev => ({ ...prev, subcategories: false }));
    }
  };

  // Fetch products count from API
  const fetchProductsCount = async () => {
    setLoading(prev => ({ ...prev, products: true }));
    try {
      console.log('Fetching products count...');
      const response = await fetch(`${API_BASE}/products`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch products error response:', errorText);
        throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched products data:', data);
      
      let productsArray = [];
      
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && Array.isArray(data.data)) {
        productsArray = data.data;
      } else if (data && Array.isArray(data.products)) {
        productsArray = data.products;
      } else if (data && typeof data === 'object') {
        productsArray = [data];
      } else {
        console.warn('Unexpected products API response format:', data);
        productsArray = [];
      }
      
      setProductCount(productsArray.length);
      
    } catch (err) {
      console.error('Fetch products count error:', err);
      setProductCount(0);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  // Fetch all data function
  const fetchAllData = () => {
    fetchBuyersCount();
    fetchSellersCount();
    fetchCategoriesCount();
    fetchSubcategoriesCount();
    fetchProductsCount();
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Check if any loading is active
  const isAnyLoading = Object.values(loading).some(status => status);

  const stats = [
    { 
      label: 'Total Categories', 
      value: loading.categories ? '...' : categoryCount.toString(), 
      icon: '🛠️', 
      color: 'blue',
      loading: loading.categories,
      count: categoryCount
    },
    { 
      label: 'Sub Categories', 
      value: loading.subcategories ? '...' : subcategoryCount.toString(), 
      icon: '🔩', 
      color: 'green',
      loading: loading.subcategories,
      count: subcategoryCount
    },
    { 
      label: 'Total Products', 
      value: loading.products ? '...' : productCount.toString(), 
      icon: '📦', 
      color: 'purple',
      loading: loading.products,
      count: productCount
    },
    { 
      label: 'Total Sellers', 
      value: loading.sellers ? '...' : sellerCount.toString(), 
      icon: '🏪', 
      color: 'indigo',
      loading: loading.sellers,
      count: sellerCount
    },
    { 
      label: 'Total Buyers', 
      value: loading.buyers ? '...' : error ? '0' : buyerCount.toString(), 
      icon: '👥', 
      color: 'orange',
      loading: loading.buyers,
      count: buyerCount,
      subtitle: !loading.buyers && !error ? `${activeBuyerCount} active` : null
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to your hardware inventory management system</p>
        </div>
        
        {/* Refresh Button */}
       
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <div>
            <strong>Error: </strong>{error}
          </div>
          <button 
            onClick={() => setError('')}
            className="text-red-700 hover:text-red-900 font-bold text-xl"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                
                {/* Loading state */}
                {stat.loading && (
                  <p className="text-xs text-gray-500 mt-1">Loading...</p>
                )}
                
                {/* Subtitle (for active buyers) */}
                {stat.subtitle && (
                  <p className="text-xs text-green-600 mt-1">{stat.subtitle}</p>
                )}
                
                {/* No data state */}
                {!stat.loading && !stat.subtitle && stat.count === 0 && (
                  <p className="text-xs text-red-500 mt-1">No data found</p>
                )}
                
                {/* Error state for buyers */}
                {stat.label === 'Total Buyers' && error && (
                  <p className="text-xs text-red-500 mt-1">Failed to load</p>
                )}
              </div>
              
              <div className={`text-2xl p-3 rounded-lg flex-shrink-0 ${
                stat.color === 'blue' ? 'bg-blue-50' :
                stat.color === 'green' ? 'bg-green-50' :
                stat.color === 'purple' ? 'bg-purple-50' :
                stat.color === 'indigo' ? 'bg-indigo-50' :
                'bg-orange-50'
              }`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;