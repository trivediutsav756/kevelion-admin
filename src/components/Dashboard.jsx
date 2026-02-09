// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  FiShoppingCart, 
  FiPackage, 
  FiUsers, 
  FiUser, 
  FiTag, 
  FiLayers,
  FiRefreshCw,
  FiAlertCircle,
  FiClock
} from 'react-icons/fi';

const Dashboard = ({ onNavigate }) => {
  const [buyerCount, setBuyerCount] = useState(0);
  const [activeBuyerCount, setActiveBuyerCount] = useState(0);
  const [pendingBuyerCount, setPendingBuyerCount] = useState(0);
  const [sellerCount, setSellerCount] = useState(0);
  const [pendingSellerCount, setPendingSellerCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [subcategoryCount, setSubcategoryCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [loading, setLoading] = useState({
    buyers: false,
    sellers: false,
    categories: false,
    subcategories: false,
    products: false,
    orders: false
  });
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const API_BASE = "https://adminapi.kevelion.com";

  // Fetch buyers count from API
  const fetchBuyersCount = async () => {
    setLoading(prev => ({ ...prev, buyers: true }));
    setError('');
    try {
      console.log('Fetching buyers count...');
      const response = await fetch(`${API_BASE}/buyers/`);
      
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
      } else if (data && Array.isArray(data.data)) {
        buyersArray = data.data;
      } else if (data && Array.isArray(data.buyers)) {
        buyersArray = data.buyers;
      } else {
        console.error('Invalid buyers data format:', data);
        throw new Error('Invalid buyers data format received from server');
      }

      const totalBuyersCount = buyersArray.length;
      const pendingBuyersCount = buyersArray.filter(buyer => {
        const approveStatus = buyer.approve_status || (buyer.buyer && buyer.buyer.approve_status);
        return approveStatus === 'Pending';
      }).length;
      const activeBuyersCount = buyersArray.filter(buyer => {
        const approveStatus = buyer.approve_status || (buyer.buyer && buyer.buyer.approve_status);
        return approveStatus === 'Approved';
      }).length;

      setBuyerCount(totalBuyersCount);
      setPendingBuyerCount(pendingBuyersCount);
      setActiveBuyerCount(activeBuyersCount);
      
    } catch (err) {
      console.error('Fetch buyers count error:', err);
      setError(err.message);
      setBuyerCount(0);
      setPendingBuyerCount(0);
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
      const response = await fetch(`${API_BASE}/sellerswithPackage`);
      
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
      
      const totalSellersCount = sellersArray.length;
      const pendingSellersCount = sellersArray.filter(s => s.approve_status === 'Pending').length;
      
      setSellerCount(totalSellersCount);
      setPendingSellerCount(pendingSellersCount);
      
    } catch (err) {
      console.error('Fetch sellers count error:', err);
      setSellerCount(0);
      setPendingSellerCount(0);
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

  // Fetch orders data and calculate statistics
  const fetchOrdersData = async () => {
    setLoading(prev => ({ ...prev, orders: true }));
    try {
      console.log('Fetching orders data...');
      const response = await fetch(`${API_BASE}/orders`);
      
      if (!response.ok) {
        console.error('Fetch orders error:', response.status);
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched orders data:', data);

      if (Array.isArray(data)) {
        const totalOrders = data.length;
        let pendingOrders = 0;
        data.forEach(order => {
          if (order.products && Array.isArray(order.products) && 
              order.products.some(product => product.order_status?.toLowerCase() === 'pending')) {
            pendingOrders++;
          }
        });
        setOrderCount(totalOrders);
        setPendingOrderCount(pendingOrders);
      } else {
        setOrderCount(0);
        setPendingOrderCount(0);
      }
      
    } catch (err) {
      console.error('Fetch orders data error:', err);
      setOrderCount(0);
      setPendingOrderCount(0);
    } finally {
      setLoading(prev => ({ ...prev, orders: false }));
    }
  };

  // Fetch all data function
  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchBuyersCount(),
        fetchSellersCount(),
        fetchCategoriesCount(),
        fetchSubcategoriesCount(),
        fetchProductsCount(),
        fetchOrdersData()
      ]);
    } catch (err) {
      console.error('Error fetching all data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const allStats = [
    {
      label: 'Total Orders',
      value: loading.orders ? '...' : orderCount.toString(),
      icon: <FiShoppingCart className="w-6 h-6" />,
      color: 'blue',
      loading: loading.orders,
      count: orderCount,
      description: 'All orders in system',
      route: 'orders'
    },
    {
      label: 'Pending Orders',
      value: loading.orders ? '...' : pendingOrderCount.toString(),
      icon: <FiClock className="w-6 h-6" />,
      color: 'yellow',
      loading: loading.orders,
      count: pendingOrderCount,
      description: 'Awaiting confirmation',
      route: 'orders'
    },
    { 
      label: 'Total Sellers', 
      value: loading.sellers ? '...' : sellerCount.toString(), 
      icon: <FiUser className="w-6 h-6" />, 
      color: 'orange',
      loading: loading.sellers,
      count: sellerCount,
      description: 'All registered sellers',
      route: 'sellers'
    },
    { 
      label: 'Pending Sellers', 
      value: loading.sellers ? '...' : pendingSellerCount.toString(), 
      icon: <FiClock className="w-6 h-6" />, 
      color: 'yellow',
      loading: loading.sellers,
      count: pendingSellerCount,
      description: 'Awaiting approval',
      route: 'sellers'
    },
    { 
      label: 'Total Buyers', 
      value: loading.buyers ? '...' : error ? '0' : buyerCount.toString(), 
      icon: <FiUsers className="w-6 h-6" />, 
      color: 'red',
      loading: loading.buyers,
      count: buyerCount,
      description: !loading.buyers && !error ? `${activeBuyerCount} active` : 'Registered buyers',
      route: 'buyers'
    },
    {
      label: 'Pending Buyers',
      value: loading.buyers ? '...' : pendingBuyerCount.toString(),
      icon: <FiClock className="w-6 h-6" />,
      color: 'yellow',
      loading: loading.buyers,
      count: pendingBuyerCount,
      description: 'Awaiting approval',
      route: 'buyers'
    },
    { 
      label: 'Total Categories', 
      value: loading.categories ? '...' : categoryCount.toString(), 
      icon: <FiTag className="w-6 h-6" />, 
      color: 'purple',
      loading: loading.categories,
      count: categoryCount,
      description: 'Product categories',
      route: 'categories'
    },
    { 
      label: 'Sub Categories', 
      value: loading.subcategories ? '...' : subcategoryCount.toString(), 
      icon: <FiLayers className="w-6 h-6" />, 
      color: 'green',
      loading: loading.subcategories,
      count: subcategoryCount,
      description: 'Product subcategories',
      route: 'subcategories'
    },
    { 
      label: 'Total Products', 
      value: loading.products ? '...' : productCount.toString(), 
      icon: <FiPackage className="w-6 h-6" />, 
      color: 'indigo',
      loading: loading.products,
      count: productCount,
      description: 'All products',
      route: 'products'
    },
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'blue':
        return { 
          bg: 'bg-blue-50', 
          text: 'text-blue-600', 
          border: 'border-blue-200'
        };
      case 'green':
        return { 
          bg: 'bg-green-50', 
          text: 'text-green-600', 
          border: 'border-green-200'
        };
      case 'purple':
        return { 
          bg: 'bg-purple-50', 
          text: 'text-purple-600', 
          border: 'border-purple-200'
        };
      case 'indigo':
        return { 
          bg: 'bg-indigo-50', 
          text: 'text-indigo-600', 
          border: 'border-indigo-200'
        };
      case 'orange':
        return { 
          bg: 'bg-orange-50', 
          text: 'text-orange-600', 
          border: 'border-orange-200'
        };
      case 'red':
        return { 
          bg: 'bg-red-50', 
          text: 'text-red-600', 
          border: 'border-red-200'
        };
      case 'yellow':
        return { 
          bg: 'bg-yellow-50', 
          text: 'text-yellow-600', 
          border: 'border-yellow-200'
        };
      default:
        return { 
          bg: 'bg-gray-50', 
          text: 'text-gray-600', 
          border: 'border-gray-200'
        };
    }
  };

  const StatCard = ({ stat, index }) => {
    const colorClasses = getColorClasses(stat.color);
    return (
      <div 
        key={index} 
        className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border"
        onClick={() => onNavigate && stat.route && onNavigate(stat.route)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
            
            {/* Description */}
            <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            
            {/* Loading state */}
            {stat.loading && (
              <p className="text-xs text-gray-500 mt-1">Loading...</p>
            )}
            
            {/* No data state */}
            {!stat.loading && stat.count === 0 && (
              <p className="text-xs text-red-500 mt-1">No data found</p>
            )}
            
            {/* Error state for buyers */}
            {stat.label === 'Total Buyers' && error && (
              <p className="text-xs text-red-500 mt-1">Failed to load</p>
            )}

            {/* Pending orders warning */}
            {stat.label === 'Pending Orders' && stat.count > 0 && (
              <p className="text-xs text-yellow-600 mt-1 font-medium">⚡ Requires attention</p>
            )}

            {/* Pending sellers warning */}
            {stat.label === 'Pending Sellers' && stat.count > 0 && (
              <p className="text-xs text-yellow-600 mt-1 font-medium">⚡ Requires attention</p>
            )}

            {/* Pending buyers warning */}
            {stat.label === 'Pending Buyers' && stat.count > 0 && (
              <p className="text-xs text-yellow-600 mt-1 font-medium">⚡ Requires attention</p>
            )}
          </div>
          
          <div className={`p-3 rounded-lg flex-shrink-0 ${colorClasses.bg}`}>
            <div className={colorClasses.text}>
              {stat.icon}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome to your hardware inventory management system</p>
        </div>
        
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="w-5 h-5" />
            <div>
              <strong>Error: </strong>{error}
            </div>
          </div>
          <button 
            onClick={() => setError('')}
            className="text-red-700 hover:text-red-900 font-bold text-xl"
          >
            
          </button>
        </div>
      )}

      {/* Orders Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {allStats.slice(0, 2).map((stat, index) => (
          <StatCard stat={stat} index={index} />
        ))}
      </div>

      {/* Sellers & Buyers Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {allStats.slice(2, 6).map((stat, index) => (
          <StatCard stat={stat} index={index + 2} />
        ))}
      </div>

      {/* Categories, Subcategories & Products Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {allStats.slice(6).map((stat, index) => (
          <StatCard stat={stat} index={index + 6} />
        ))}
      </div>

      {/* Loading Overlay */}
      {refreshing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex items-center gap-3">
            <FiRefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-700 font-medium">Refreshing data...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;