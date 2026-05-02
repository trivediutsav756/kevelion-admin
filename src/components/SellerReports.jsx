import React, { useState, useEffect } from 'react';
import { FiDownload, FiRefreshCw, FiTrendingUp, FiCalendar, FiUser } from 'react-icons/fi';

const API_BASE_URL = "https://adminapi.kevelion.com";

const SellerReports = () => {
  const [sellers, setSellers] = useState([]);
  const [selectedSellerId, setSelectedSellerId] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sellersLoading, setSellersLoading] = useState(true);
  const [error, setError] = useState('');

  const months = [
    { id: 1, name: 'January' },
    { id: 2, name: 'February' },
    { id: 3, name: 'March' },
    { id: 4, name: 'April' },
    { id: 5, name: 'May' },
    { id: 6, name: 'June' },
    { id: 7, name: 'July' },
    { id: 8, name: 'August' },
    { id: 9, name: 'September' },
    { id: 10, name: 'October' },
    { id: 11, name: 'November' },
    { id: 12, name: 'December' },
  ];

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear - 2; i <= currentYear + 4; i++) {
    years.push(i.toString());
  }

  // Fetch Sellers List
  const fetchSellers = async () => {
    setSellersLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sellers/`);
      if (!response.ok) throw new Error('Failed to fetch sellers');
      const data = await response.json();
      
      let sellersList = [];
      if (Array.isArray(data)) {
        sellersList = data;
      } else if (data.data && Array.isArray(data.data)) {
        sellersList = data.data;
      } else if (data.sellers && Array.isArray(data.sellers)) {
        sellersList = data.sellers;
      }
      
      setSellers(sellersList);
      if (sellersList.length > 0 && !selectedSellerId) {
        // Optionally set default seller
        // setSelectedSellerId(sellersList[0].id.toString());
      }
    } catch (err) {
      setError('Error loading sellers: ' + err.message);
    } finally {
      setSellersLoading(false);
    }
  };

  // Fetch Report for 12 months
  const fetchFullYearReport = async (sellerId, year) => {
    if (!sellerId || !year) return;
    setLoading(true);
    setError('');
    
    try {
      const promises = months.map(async (month) => {
        const response = await fetch(`${API_BASE_URL}/report/seller?seller_id=${sellerId}&month=${month.id}&year=${year}`);
        if (!response.ok) return { month: month.name, total: 0, error: true };
        const data = await response.json();
        
        let total = 0;
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          total = parseFloat(data.data[0].total_revenue || 0);
        } else if (data.total !== undefined) {
          total = parseFloat(data.total);
        } else if (data.revenue !== undefined) {
          total = parseFloat(data.revenue);
        }
        
        return { month: month.name, total: isNaN(total) ? 0 : total };
      });

      const results = await Promise.all(promises);
      setReportData(results);
    } catch (err) {
      setError('Error fetching report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  useEffect(() => {
    if (selectedSellerId && selectedYear) {
      fetchFullYearReport(selectedSellerId, selectedYear);
    }
  }, [selectedSellerId, selectedYear]);

  const handleDownloadCSV = () => {
    if (reportData.length === 0) return;
    
    const seller = sellers.find(s => s.id.toString() === selectedSellerId);
    const sellerName = seller ? seller.name : 'Unknown';
    
    const headers = ['Month', 'Total Revenue'];
    const rows = reportData.map(item => [item.month, item.total.toFixed(2)]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Seller_Report_${sellerName}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalAnnualRevenue = reportData.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiTrendingUp className="text-blue-500" /> Seller Reports
          </h1>
          <p className="text-gray-500 text-sm mt-1">Monthly revenue breakdown for selected seller</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => fetchFullYearReport(selectedSellerId, selectedYear)}
            disabled={loading || !selectedSellerId}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          
          <button 
            onClick={handleDownloadCSV}
            disabled={loading || reportData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md shadow-blue-100"
          >
            <FiDownload /> Download CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
            <FiUser size={24} />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Select Seller</label>
            <select 
              value={selectedSellerId}
              onChange={(e) => setSelectedSellerId(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-gray-800 font-medium p-0"
              disabled={sellersLoading}
            >
              <option value="">Choose a seller...</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>{seller.name} ({seller.mobile})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
            <FiCalendar size={24} />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Select Year</label>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-gray-800 font-medium p-0"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {selectedSellerId && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium">Annual Total Revenue ({selectedYear})</p>
            <h2 className="text-4xl font-extrabold mt-2">
              {loading ? "..." : `₹${totalAnnualRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
            </h2>
          </div>
          <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-10">
            <FiTrendingUp size={120} />
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {error && (
          <div className="p-4 m-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm italic">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reportData.length > 0 ? (
                reportData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-gray-700">{item.month}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-gray-900">₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="px-6 py-12 text-center text-gray-400 italic">
                    {loading ? "Fetching data..." : "Please select a seller and year to view report"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SellerReports;
