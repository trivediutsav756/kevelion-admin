import React, { useState, useEffect } from 'react';

const Subscription = () => {
  const [packages, setPackages] = useState([]);
  const [packageUsageCountById, setPackageUsageCountById] = useState({});
  const initialFormData = {
    package_name: '',
    total_sales: '',
    max_product_add: '',
    payment_time: '',
    package_price: '',
    product_high_priority: 'No',
    product_top_search: 'No',
    product_supplier_tag: 'No'
  };
  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const API_BASE = "https://adminapi.kevelion.com";

  const fetchPackageUsage = async () => {
    try {
      const response = await fetch(`${API_BASE}/sellerswithPackage`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) {
        setPackageUsageCountById({});
        return;
      }
      const data = await response.json();
      const sellers = Array.isArray(data) ? data : (Array.isArray(data?.sellers) ? data.sellers : []);
      const map = {};
      sellers.forEach((s) => {
        const pid = s?.package_id ?? s?.subscription_package_id ?? s?.current_package_id ?? null;
        if (pid == null) return;
        const key = String(pid);
        map[key] = (map[key] || 0) + 1;
      });
      setPackageUsageCountById(map);
    } catch {
      setPackageUsageCountById({});
    }
  };

  // Fetch all packages from API
  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/subscription-packages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched packages:', data);
      setPackages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError(`Failed to load packages: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch single package for editing
  const fetchPackage = async (id) => {
    try {
      setError('');
      const existing = packages.find((p) => String(p?.id) === String(id));
      if (existing) {
        setFormData({
          package_name: existing.package_name || '',
          total_sales: existing.total_sales?.toString() || '',
          max_product_add: existing.max_product_add?.toString() || '',
          payment_time: existing.payment_time?.toString() || '',
          package_price: existing.package_price?.toString() || '',
          product_high_priority: existing.product_high_priority || 'No',
          product_top_search: existing.product_top_search || 'No',
          product_supplier_tag: existing.product_supplier_tag || 'No'
        });

        setIsEditing(true);
        setEditingId(id);
        setShowForm(true);
        return;
      }

      const response = await fetch(`${API_BASE}/subscription-package/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const pkg = await response.json();
      console.log('Fetched package for editing:', pkg);

      // Set editable fields with proper data conversion
      setFormData({
        package_name: pkg.package_name || '',
        total_sales: pkg.total_sales?.toString() || '',
        max_product_add: pkg.max_product_add?.toString() || '',
        payment_time: pkg.payment_time?.toString() || '',
        package_price: pkg.package_price?.toString() || '',
        product_high_priority: pkg.product_high_priority || 'No',
        product_top_search: pkg.product_top_search || 'No',
        product_supplier_tag: pkg.product_supplier_tag || 'No'
      });

      setIsEditing(true);
      setEditingId(id);
      setShowForm(true);
    } catch (err) {
      console.error('Error fetching package:', err);
      setError(`Failed to load package: ${err.message}`);
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    try {
      setError('');
      const response = await fetch(`${API_BASE}/subscription-package/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ package_status: newStatus }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status} - ${errorText}`);
      }

      // Update local state optimistically
      setPackages((prev) =>
        prev.map((pkg) =>
          pkg.id === id ? { ...pkg, package_status: newStatus } : pkg
        )
      );

      console.log(`Status updated to: ${newStatus}`);
    } catch (err) {
      console.error('Error toggling status:', err);
      setError(`Failed to update status: ${err.message}`);
      await fetchPackages();
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Prepare data for API submission
  const prepareSubmissionData = () => {
    const submissionData = {
      package_name: formData.package_name.trim(),
      total_sales: parseInt(formData.total_sales) || 0,
      max_product_add: parseInt(formData.max_product_add) || 0,
      payment_time: parseInt(formData.payment_time) || 0,
      package_price: parseFloat(formData.package_price) || 0,
      product_high_priority: formData.product_high_priority,
      product_top_search: formData.product_top_search,
      product_supplier_tag: formData.product_supplier_tag
    };
    // Format price to 2 decimal places
    if (submissionData.package_price) {
      submissionData.package_price = submissionData.package_price.toFixed(2);
    }
    return submissionData;
  };

  // Handle form submission (Add or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const submissionData = prepareSubmissionData();
      console.log('Submitting data:', submissionData);

      let url, method;
      if (isEditing && editingId) {
        url = `${API_BASE}/subscription-package/${editingId}`;
        method = 'PATCH';
      } else {
        url = `${API_BASE}/subscription-package`;
        method = 'POST';
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });
      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        throw new Error(`Failed to save package: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Success response:', result);

      await fetchPackages();

      setFormData(initialFormData);
      setIsEditing(false);
      setEditingId(null);
      setShowForm(false);

    } catch (err) {
      console.error('Error submitting form:', err);
      setError(`Failed to save package: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    const usedCount = packageUsageCountById[String(id)] || 0;
    if (usedCount > 0) {
      setError(`Cannot delete this package because ${usedCount} seller(s) are using it.`);
      return;
    }
    if (!window.confirm('Are you sure you want to delete this package?')) {
      return;
    }

    try {
      setError('');
      const response = await fetch(`${API_BASE}/subscription-package/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchPackages();
      await fetchPackageUsage();
    } catch (err) {
      console.error('Error deleting package:', err);
      setError(`Failed to delete package: ${err.message}`);
    }
  };

  // Handle edit
  const handleEdit = (id) => {
    fetchPackage(id);
  };

  // Handle view
  const handleView = (pkg) => {
    setSelectedPackage(pkg);
    setShowViewModal(true);
  };

  // Handle cancel edit
  const handleCancel = () => {
    setFormData(initialFormData);
    setIsEditing(false);
    setEditingId(null);
    setShowForm(false);
  };

  // Handle close view modal
  const handleCloseView = () => {
    setShowViewModal(false);
    setSelectedPackage(null);
  };

  useEffect(() => {
    fetchPackages();
    fetchPackageUsage();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-2 text-sm text-gray-500">Manage all your subscription packages</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
            <button
              onClick={() => setError('')}
              className="float-right text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Add Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            All Subscriptions ({packages.length})
          </h2>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition duration-200"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Subscription</span>
          </button>
        </div>

        {/* View Modal */}
        {showViewModal && selectedPackage && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto transform transition-all duration-300 scale-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-t-2xl p-8 text-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-2">{selectedPackage.package_name}</h2>
                    <p className="text-indigo-100">Subscription Package Details</p>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border-2 ${
                        selectedPackage.package_status === 'Active'
                          ? 'bg-white text-indigo-700 border-white shadow-lg'
                          : 'bg-gray-200 text-gray-700 border-gray-300 shadow-lg'
                      }`}
                    >
                      {selectedPackage.package_status || 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-blue-600 font-medium">Price</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">₹{selectedPackage.package_price || 0}</h3>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                      </div>
                      <span className="text-sm text-green-600 font-medium">Sales Limit</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedPackage.total_sales?.toLocaleString() || 0}</h3>
                    <p className="text-sm text-gray-600">Total allowed sales</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 6m0 0l-8-6m8 6V7m-4 7h8M4 7h8m-8 0v10m0 0l4 6m0 0l4-6" />
                        </svg>
                      </div>
                      <span className="text-sm text-purple-600 font-medium">Product Limit</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{selectedPackage.max_product_add || 0}</h3>
                    <p className="text-sm text-gray-600">Max products per seller</p>
                  </div>
                </div>

                {/* Basic Information - flattened (no box/border backgrounds) */}
                <div className="rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Basic Information
                  </h3>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Package ID</label>
                      <p className="text-sm font-mono text-gray-900">{selectedPackage.id}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Payment Duration</label>
                      <p className="text-sm font-semibold text-gray-900">{selectedPackage.payment_time || 0} days</p>
                    </div>

                    {selectedPackage.created_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Created At</label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedPackage.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}

                    {selectedPackage.updated_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Updated At</label>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedPackage.updated_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features - flattened container (no card/border) */}
                <div className="rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Package Features
                  </h3>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">High Priority Products</h4>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          selectedPackage.product_high_priority === 'Yes'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {selectedPackage.product_high_priority || 'No'}
                      </span>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9V3" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">Top Search Ranking</h4>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          selectedPackage.product_top_search === 'Yes'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {selectedPackage.product_top_search || 'No'}
                      </span>
                    </div>

                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">Supplier Tag</h4>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                          selectedPackage.product_supplier_tag === 'Yes'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {selectedPackage.product_supplier_tag || 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-gray-50 rounded-b-2xl border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseView}
                  className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 font-semibold transition duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Close</span>
                </button>
                <button
                  onClick={() => {
                    handleCloseView();
                    handleEdit(selectedPackage.id);
                  }}
                  className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 font-semibold transition duration-200 flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Edit Package</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Edit Subscription' : 'Add New Subscription'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition duration-200"
                  disabled={loading}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                    <input
                      type="text"
                      name="package_name"
                      placeholder="Enter package name"
                      value={formData.package_name}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Sales</label>
                    <input
                      type="number"
                      name="total_sales"
                      placeholder="Enter total sales"
                      value={formData.total_sales}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Product Add</label>
                    <input
                      type="number"
                      name="max_product_add"
                      placeholder="Enter max products"
                      value={formData.max_product_add}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Time (days)</label>
                    <input
                      type="number"
                      name="payment_time"
                      placeholder="Enter payment time"
                      value={formData.payment_time}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Price</label>
                    <input
                      type="number"
                      step="0.01"
                      name="package_price"
                      placeholder="0.00"
                      value={formData.package_price}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">High Priority</label>
                    <select
                      name="product_high_priority"
                      value={formData.product_high_priority}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={loading}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Top Search</label>
                    <select
                      name="product_top_search"
                      value={formData.product_top_search}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={loading}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Tag</label>
                    <select
                      name="product_supplier_tag"
                      value={formData.product_supplier_tag}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={loading}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition duration-200"
                  >
                    {loading ? 'Processing...' : (isEditing ? 'Update Package' : 'Add Package')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 font-medium transition duration-200"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Packages List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Top Search</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Tag</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && !packages.length ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading packages...</span>
                      </div>
                    </td>
                  </tr>
                ) : packages.length === 0 ? (
                  <tr>
                    <td colSpan="11" className="px-6 py-12 text-center text-gray-500">
                      No subscription packages found.
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg, index) => (
                    <tr key={pkg.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{pkg.package_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.total_sales?.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.max_product_add}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pkg.payment_time} days</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{pkg.package_price}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pkg.product_high_priority === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {pkg.product_high_priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pkg.product_top_search === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {pkg.product_top_search}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pkg.product_supplier_tag === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {pkg.product_supplier_tag}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleToggleStatus(pkg.id, pkg.package_status)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition duration-200 ${
                            pkg.package_status === 'Active'
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                          title={`Toggle to ${pkg.package_status === 'Active' ? 'Inactive' : 'Active'}`}
                        >
                          {pkg.package_status || 'Inactive'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleView(pkg)}
                            className="text-blue-600 hover:text-blue-900 p-1 transition duration-200"
                            title="View Details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEdit(pkg.id)}
                            className="text-green-600 hover:text-green-900 p-1 transition duration-200"
                            title="Edit Package"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(pkg.id)}
                            disabled={(packageUsageCountById[String(pkg.id)] || 0) > 0}
                            className={`p-1 transition duration-200 ${
                              (packageUsageCountById[String(pkg.id)] || 0) > 0
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-900'
                            }`}
                            title={
                              (packageUsageCountById[String(pkg.id)] || 0) > 0
                                ? `Cannot delete (used by ${packageUsageCountById[String(pkg.id)]} seller(s))`
                                : 'Delete Package'
                            }
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Subscription;
