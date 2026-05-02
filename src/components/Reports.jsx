import React, { useEffect, useMemo, useState } from 'react';
import { FiShoppingBag, FiDollarSign, FiBarChart2, FiCalendar } from 'react-icons/fi';

const Reports = () => {
  const API_BASE = "https://adminapi.kevelion.com";

  const [orders, setOrders] = useState([]);
  const [buyerNameById, setBuyerNameById] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Hierarchical Filter State
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedDay, setSelectedDay] = useState('All');

  const normalizeOrdersPayload = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.orders)) return data.orders;
    return [];
  };

  const normalizeBuyersPayload = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.buyers)) return data.buyers;
    return [];
  };

  const fetchBuyers = async () => {
    try {
      const response = await fetch(`${API_BASE}/buyers`);
      if (!response.ok) {
        throw new Error(`Failed to fetch buyers: ${response.status}`);
      }

      const data = await response.json();
      const buyers = normalizeBuyersPayload(data);
      const map = {};
      buyers.forEach((b) => {
        const id = b?.id ?? b?.buyer_id ?? b?.buyerId;
        const name = b?.name ?? b?.buyer_name ?? b?.buyerName;
        if (id != null && name) {
          map[String(id)] = String(name);
        }
      });
      setBuyerNameById(map);
    } catch (e) {
      setBuyerNameById({});
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/orders`);
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`);
      }

      const data = await response.json();
      setOrders(normalizeOrdersPayload(data));
    } catch (e) {
      setOrders([]);
      setError(e?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchBuyers();
    fetchOrders();
  }, []);

  const toLocalDayKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const safeDate = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  };

  const getOrderCreatedAt = (order) => {
    return order?.created_at || order?.createdAt || order?.created || null;
  };

  const getBuyerId = (order) => {
    return (
      order?.buyer_details?.buyer_id ??
      order?.buyer_details?.id ??
      order?.buyer_id ??
      order?.buyerId ??
      order?.buyer?.id ??
      'N/A'
    );
  };

  const getBuyerName = (order) => {
    const direct =
      order?.buyer_name ??
      order?.buyerName ??
      order?.buyer?.name ??
      order?.buyer?.buyer_name ??
      order?.buyer_details?.name ??
      order?.buyer_details?.buyer_name;
    if (direct) return String(direct);

    const id = getBuyerId(order);
    if (id === 'N/A') return 'N/A';
    return buyerNameById[String(id)] || 'N/A';
  };

  const getSellerNames = (order) => {
    const products = order?.products;
    if (!Array.isArray(products) || products.length === 0) return 'N/A';
    const names = Array.from(
      new Set(
        products
          .map((p) => p?.seller_details?.seller_name || p?.seller_details?.sellerName || null)
          .filter(Boolean)
          .map(String)
      )
    );
    return names.length ? names.join(', ') : 'N/A';
  };

  const getProductNames = (order) => {
    const products = order?.products;
    if (!Array.isArray(products) || products.length === 0) return 'N/A';
    const names = products.map((p) => {
      const name = p?.product_details?.name || p?.name || p?.title || `Product ${p?.product_id || p?.id || ''}`.trim() || 'Unknown Product';
      const qty = p?.quantity || 1;
      return `${name} (x${qty})`;
    });
    return names.join(', ');
  };

  const getTotalAmount = (order) => {
    const products = order?.products;
    if (!Array.isArray(products) || products.length === 0) return 0;
    const total = products.reduce((sum, p) => sum + (parseFloat(p?.price || 0) * (p?.quantity || 1)), 0);
    return total.toFixed(2);
  };

  const formatDateTime = (value) => {
    const d = safeDate(value);
    if (!d) return 'N/A';
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = useMemo(() => {
    const now = new Date();
    const todayKey = toLocalDayKey(now);
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let total = 0;
    let today = 0;
    let month = 0;

    orders.forEach((order) => {
      const created = safeDate(getOrderCreatedAt(order));
      if (!created) return;

      total += 1;
      if (toLocalDayKey(created) === todayKey) today += 1;
      if (created.getMonth() === thisMonth && created.getFullYear() === thisYear) month += 1;
    });

    return { total, today, month };
  }, [orders]);

  const range = useMemo(() => {
    // Priority 1: Range Filter (if dates are selected)
    const start = startDate ? safeDate(`${startDate}T00:00:00`) : null;
    const end = endDate ? safeDate(`${endDate}T23:59:59.999`) : null;

    if (start || end) {
      const items = orders
        .map((order) => {
          const created = safeDate(getOrderCreatedAt(order));
          return { order, created };
        })
        .filter(({ created }) => !!created)
        .filter(({ created }) => {
          if (start && created < start) return false;
          if (end && created > end) return false;
          return true;
        })
        .sort((a, b) => b.created - a.created);

      return { count: items.length, hasFilter: true, invalid: start && end && start > end, items };
    }

    // Priority 2: Hierarchical Filter
    const items = orders
      .map((order) => {
        const created = safeDate(getOrderCreatedAt(order));
        return { order, created };
      })
      .filter(({ created }) => !!created)
      .filter(({ created }) => {
        if (selectedYear !== 'All') {
          if (created.getFullYear().toString() !== selectedYear) return false;
        }
        if (selectedMonth !== 'All') {
          if ((created.getMonth() + 1).toString() !== selectedMonth) return false;
        }
        if (selectedDay !== 'All') {
          if (created.getDate().toString() !== selectedDay) return false;
        }
        return true;
      })
      .sort((a, b) => b.created - a.created);

    return { count: items.length, hasFilter: selectedYear !== 'All' || selectedMonth !== 'All' || selectedDay !== 'All', invalid: false, items };
  }, [orders, startDate, endDate, selectedYear, selectedMonth, selectedDay]);

  const reportData = useMemo(() => {
    let total_orders = range.items.length;
    let total_quantity = 0;
    let total_revenue = 0;

    range.items.forEach(({ order }) => {
      total_revenue += parseFloat(getTotalAmount(order));
      const products = order?.products;
      if (Array.isArray(products)) {
        products.forEach(p => {
          total_quantity += (parseInt(p?.quantity || 1, 10));
        });
      }
    });

    return {
      total_orders,
      total_quantity,
      total_revenue
    };
  }, [range.items]);

  const avgOrderValue = useMemo(() => {
    const total = parseFloat(reportData.total_revenue || 0);
    const count = parseInt(reportData.total_orders || 0);
    if (count === 0) return 0;
    return (total / count).toFixed(2);
  }, [reportData]);

  const computeFilteredOrdersForExport = () => {
    const start = startDate ? safeDate(`${startDate}T00:00:00`) : null;
    const end = endDate ? safeDate(`${endDate}T23:59:59.999`) : null;
    if ((startDate && !start) || (endDate && !end)) return { invalid: true, items: [] };
    if (start && end && start > end) return { invalid: true, items: [] };

    const items = orders
      .map((order) => ({ order, created: safeDate(getOrderCreatedAt(order)) }))
      .filter(({ created }) => !!created)
      .filter(({ created }) => {
        if (start && created < start) return false;
        if (end && created > end) return false;
        return true;
      })
      .sort((a, b) => b.created - a.created)
      .map(({ order }) => order);

    return { invalid: false, items };
  };

  const downloadCsv = (rows, filename) => {
    const escape = (value) => {
      if (value == null) return '';
      const s = String(value);
      const needsQuotes = /[",\n\r]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };

    const headers = ['Order ID', 'Created At', 'Buyer ID', 'Buyer Name', 'Seller Name', 'Products', 'Total Price'];
    const lines = [headers.join(',')];

    rows.forEach((order) => {
      const orderId = order?.id ?? 'N/A';
      const createdAt = formatDateTime(getOrderCreatedAt(order));
      const buyerId = getBuyerId(order);
      const buyerName = getBuyerName(order);
      const sellerNames = getSellerNames(order);
      const productNames = getProductNames(order);

      lines.push(
        [
          escape(orderId),
          escape(createdAt),
          escape(buyerId),
          escape(buyerName),
          escape(sellerNames),
          escape(productNames),
          escape(getTotalAmount(order)),
        ].join(',')
      );
    });

    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Reports</h1>
              <p className="text-gray-600 mt-1">Orders summary with date filters</p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => {
                  fetchBuyers();
                  fetchOrders();
                }}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <button
                onClick={() => {
                  const result = computeFilteredOrdersForExport();
                  if (result.invalid) return;
                  const hasFilter = !!startDate || !!endDate;
                  const startLabel = startDate || 'all';
                  const endLabel = endDate || 'all';
                  const filename = hasFilter
                    ? `reports_orders_${startLabel}_to_${endLabel}.csv`
                    : 'reports_orders_all.csv';
                  downloadCsv(result.items, filename);
                }}
                disabled={loading || range.invalid || orders.length === 0}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                Download CSV
              </button>
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSelectedYear('All');
                  setSelectedMonth('All');
                  setSelectedDay('All');
                }}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Clear Filter
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Hierarchical Date Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FiCalendar className="text-indigo-600 text-xl" />
              <h2 className="text-lg font-semibold text-gray-800">Hierarchical Date Filter</h2>
            </div>
            <button
              onClick={() => {
                const now = new Date();
                setSelectedYear(now.getFullYear().toString());
                setSelectedMonth((now.getMonth() + 1).toString());
                setSelectedDay(now.getDate().toString());
                setStartDate('');
                setEndDate('');
              }}
              className="px-4 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              Today
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-indigo-600 uppercase mb-2">1. SELECT YEAR</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer font-medium"
              >
                <option value="All">All Available Years</option>
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-600 uppercase mb-2">2. SELECT MONTH</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer font-medium"
              >
                <option value="All">All Months</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-600 uppercase mb-2">3. SELECT DAY</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer font-medium"
              >
                <option value="All">All Days</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Filtered Orders Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <FiShoppingBag className="text-indigo-600 text-2xl" />
            </div>
            <div>
              <p className="text-gray-500 font-medium text-sm">Filtered Orders</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? '...' : reportData.total_orders}</p>
            </div>
          </div>

          {/* Total Revenue Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center">
              <FiDollarSign className="text-green-600 text-2xl" />
            </div>
            <div>
              <p className="text-gray-500 font-medium text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">₹{loading ? '...' : parseFloat(reportData.total_revenue).toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Average Order Value Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <FiBarChart2 className="text-blue-600 text-2xl" />
            </div>
            <div>
              <p className="text-gray-500 font-medium text-sm">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900">₹{loading ? '...' : parseFloat(avgOrderValue).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {range.hasFilter ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-gray-700">
                Showing <span className="font-semibold text-indigo-600">{range.count}</span> orders for the selected period
              </div>
              <div className="text-xs font-medium px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                Filtered View
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No date filter applied. Showing all records.</div>
          )}
        </div>

        {!range.invalid && range.items.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created At</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Buyer Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Buyer ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Seller</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Products</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Total Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {range.items.map(({ order }) => (
                  <tr key={order?.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">#{order?.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{formatDateTime(order?.created_at || order?.createdAt || order?.created)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{getBuyerName(order)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{getBuyerId(order)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{getSellerNames(order)}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{getProductNames(order)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">₹{getTotalAmount(order)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>

  );
};

export default Reports;
