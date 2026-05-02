import React, { useState, useEffect } from 'react';
import { FiSearch, FiRefreshCw, FiArrowUp, FiArrowDown, FiInfo } from 'react-icons/fi';

const BASE_URL = "https://adminapi.kevelion.com";

const InventoryLog = () => {
  const [logs, setLogs] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'history'

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      // Fetch both simultaneously
      const [stockRes, logsRes] = await Promise.all([
        fetch(`${BASE_URL}/stock`),
        fetch(`${BASE_URL}/product-inventory/`)
      ]);

      if (!stockRes.ok) throw new Error(`Stock API error! status: ${stockRes.status}`);
      if (!logsRes.ok) throw new Error(`Log API error! status: ${logsRes.status}`);

      const stockResult = await stockRes.json();
      const logsResult = await logsRes.json();

      setStock(Array.isArray(stockResult) ? stockResult : (stockResult.data || []));
      setLogs(Array.isArray(logsResult) ? logsResult : (logsResult.data || []));
    } catch (err) {
      setError(`Failed to fetch inventory data: ${err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const filteredLogs = logs.filter(log =>
    !searchQuery ||
    (log.product_name && log.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (log.product_sku && log.product_sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (log.seller_name && log.seller_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (log.note && log.note.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredStock = stock.filter(item =>
    !searchQuery ||
    (item.product_name && item.product_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.product_sku && item.product_sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.seller_name && item.seller_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalStockQuantity = stock.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalProductsInStock = stock.filter(item => item.quantity > 0).length;
  const lowStockCount = stock.filter(item => item.quantity > 0 && item.quantity <= 10).length;

  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center max-w-sm w-full border border-red-100">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Inventory</h3>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button 
            onClick={() => fetchData()} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time stock tracking and historical change logs
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className={`p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh Data"
          >
            <FiRefreshCw />
          </button>
          
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search product, SKU, seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Total Stock Units</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{loading ? '...' : totalStockQuantity}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Active Products</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{loading ? '...' : totalProductsInStock}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Total Change Logs</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{loading ? '...' : logs.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Low Stock Alerts</p>
          <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
            {loading ? '...' : lowStockCount}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'stock'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          Current Stock Status
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          All Activity Logs
        </button>
      </div>

      {loading && !refreshing ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (activeTab === 'stock' ? filteredStock : filteredLogs).length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiInfo className="text-gray-300 text-2xl" />
          </div>
          <p className="text-gray-500 text-lg font-medium">No {activeTab === 'stock' ? 'stock' : 'history'} data found</p>
          {searchQuery && <p className="text-gray-400 text-sm mt-1">Try a different search term</p>}
        </div>
      ) : activeTab === 'stock' ? (
        /* Current Stock Table */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Info</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredStock.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                      <div className="text-xs text-gray-400">SKU: {item.product_sku || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.seller_name || `Seller #${item.seller_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-lg font-bold ${item.quantity <= 10 ? 'text-red-500' : 'text-gray-800'}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.quantity <= 0 ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase">Out of Stock</span>
                      ) : item.quantity <= 10 ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">Low Stock</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">In Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Inventory History Table */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Info</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seller</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Change</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Note</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(log.created_at).split(',')[0]}</div>
                      <div className="text-xs text-gray-400">{formatDate(log.created_at).split(',')[1]}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={log.product_name}>
                        {log.product_name}
                      </div>
                      <div className="text-xs text-gray-400">SKU: {log.product_sku}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {log.seller_name || `Seller #${log.seller_id}`}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        log.change_type === 'add' || log.change_type === 'restock'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {log.change_type === 'add' || log.change_type === 'restock' ? (
                          <FiArrowUp className="w-3 h-3" />
                        ) : (
                          <FiArrowDown className="w-3 h-3" />
                        )}
                        {log.quantity_change} {log.change_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-400">
                          {log.quantity_before} →
                        </div>
                        <div className="text-sm font-bold text-gray-800">
                          {log.quantity_after}
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Current Total: {log.current_quantity}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-500 max-w-[200px] truncate" title={log.note}>
                        {log.note || '—'}
                      </div>
                      {log.order_id && (
                        <div className="text-[10px] text-blue-500 font-medium">
                          Order ID: {log.order_id}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryLog;
