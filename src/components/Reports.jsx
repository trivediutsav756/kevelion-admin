import React, { useEffect, useMemo, useState } from 'react';

const Reports = () => {
  const API_BASE = "https://adminapi.kevelion.com";

  const [orders, setOrders] = useState([]);
  const [buyerNameById, setBuyerNameById] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const stats = useMemo(() => {
    const now = new Date();
    const todayKey = toLocalDayKey(now);
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    let total = 0;
    let today = 0;
    let month = 0;

    orders.forEach((order) => {
      const created = safeDate(order?.created_at || order?.createdAt || order?.created);
      if (!created) return;

      total += 1;
      if (toLocalDayKey(created) === todayKey) today += 1;
      if (created.getMonth() === thisMonth && created.getFullYear() === thisYear) month += 1;
    });

    return { total, today, month };
  }, [orders]);

  const range = useMemo(() => {
    const start = startDate ? safeDate(`${startDate}T00:00:00`) : null;
    const end = endDate ? safeDate(`${endDate}T23:59:59.999`) : null;

    if (!start && !end) return { count: 0, hasFilter: false, invalid: false, items: [] };
    if ((startDate && !start) || (endDate && !end)) return { count: 0, hasFilter: true, invalid: true, items: [] };
    if (start && end && start > end) return { count: 0, hasFilter: true, invalid: true, items: [] };

    const items = orders
      .map((order) => {
        const created = safeDate(order?.created_at || order?.createdAt || order?.created);
        return { order, created };
      })
      .filter(({ created }) => !!created)
      .filter(({ created }) => {
        if (start && created < start) return false;
        if (end && created > end) return false;
        return true;
      })
      .sort((a, b) => b.created - a.created)
      .slice(0, 20);

    return { count: items.length, hasFilter: true, invalid: false, items };
  }, [orders, startDate, endDate]);

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

  const getBuyerName = (order) => {
    const direct =
      order?.buyer_name ??
      order?.buyerName ??
      order?.buyer?.name ??
      order?.buyer?.buyer_name;
    if (direct) return String(direct);

    const id = order?.buyer_id ?? order?.buyerId ?? order?.buyer?.id;
    if (id == null) return 'N/A';
    return buyerNameById[String(id)] || 'N/A';
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
                  setStartDate('');
                  setEndDate('');
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.total}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-xl">📦</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today’s Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.today}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600 text-xl">🗓️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Month</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{loading ? '...' : stats.month}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 text-xl">📈</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Date Filter</h2>
              <p className="text-sm text-gray-500">Select start and end date to filter orders</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            {range.hasFilter ? (
              range.invalid ? (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
                  Please select a valid date range (start date must be before end date).
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-semibold">{range.count}</span> orders in selected range
                  </div>

                  <div className="text-sm text-gray-500">
                    Preview (latest 20)
                  </div>
                </div>
              )
            ) : (
              <div className="text-sm text-gray-500">No date filter applied.</div>
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
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {range.items.map(({ order }) => (
                    <tr key={order?.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-blue-600">#{order?.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{formatDateTime(order?.created_at || order?.createdAt || order?.created)}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{getBuyerName(order)}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{order?.buyer_id ?? 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{order?.order_type ?? order?.orderType ?? 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
