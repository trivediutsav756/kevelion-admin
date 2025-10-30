// components/Subcategory.jsx
import React, { useState, useEffect } from 'react';
import { FiEye, FiRefreshCw, FiImage, FiX } from 'react-icons/fi';

const Subcategory = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  // Fetch subcategories from API
  const fetchSubcategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://rettalion.apxfarms.com/subcategories');
      if (!response.ok) {
        throw new Error('Failed to fetch subcategories');
      }
      const data = await response.json();
      setSubcategories(data);
    } catch (err) {
      setError('Error fetching subcategories: ' + err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubcategories();
  }, []);

  // Handle view subcategory
  const handleView = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setShowViewModal(true);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subcategory Management</h1>
          <p className="text-sm text-gray-600 mt-1">Manage all your product subcategories</p>
        </div>
        
      </div>

      {/* White Box Container for All Subcategories */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
        {/* Header Section inside White Box */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            All Subcategories ({subcategories.length})
          </h2>
        
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button 
              onClick={() => setError('')}
              className="float-right font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Subcategories Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mt-4">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : subcategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No subcategories found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subcategory Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subcategories.map((subcategory, index) => (
                    <tr key={subcategory.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {subcategory.image ? (
                          <img 
                            src={`http://rettalion.apxfarms.com${subcategory.image}`} 
                            alt={subcategory.subcategory_name || subcategory.name}
                            className="h-12 w-12 rounded-lg object-cover border"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/48';
                            }}
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border">
                            <FiImage className="text-gray-400 text-xl" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {subcategory.subcategory_name || subcategory.name}
                        </div>
                        {subcategory.subcategory_sku && (
                          <div className="text-xs text-gray-500 mt-1">
                            SKU: {subcategory.subcategory_sku}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {subcategory.category_name || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleView(subcategory)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <FiEye className="text-sm" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Subcategory Details Modal */}
      {showViewModal && selectedSubcategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-800">
                Subcategory Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Image */}
                <div className="flex flex-col items-center">
                  {selectedSubcategory.image ? (
                    <img 
                      src={`http://rettalion.apxfarms.com${selectedSubcategory.image}`} 
                      alt={selectedSubcategory.subcategory_name || selectedSubcategory.name}
                      className="w-48 h-48 rounded-lg object-cover border shadow-md"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/192';
                      }}
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-lg bg-gray-100 flex items-center justify-center border shadow-md">
                      <FiImage className="text-gray-400 text-4xl" />
                    </div>
                  )}
                  <span className="mt-4 text-sm text-gray-500">Subcategory Image</span>
                </div>

                {/* Right Column - Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Subcategory Name
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedSubcategory.subcategory_name || selectedSubcategory.name}
                    </p>
                  </div>

                  {selectedSubcategory.subcategory_sku && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        SKU
                      </label>
                      <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                        {selectedSubcategory.subcategory_sku}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Category Name
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                      {selectedSubcategory.category_name || 'Not Available'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Subcategory ID
                    </label>
                    <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border">
                      {selectedSubcategory.id}
                    </p>
                  </div>

                  {selectedSubcategory.status && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Status
                      </label>
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        selectedSubcategory.status === 'Active' 
                          ? 'bg-green-100 text-green-800'
                          : selectedSubcategory.status === 'Inactive'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedSubcategory.status}
                      </span>
                    </div>
                  )}

                  {selectedSubcategory.mobile && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Mobile
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                        {selectedSubcategory.mobile}
                      </p>
                    </div>
                  )}

                  {selectedSubcategory.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Email
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded border break-all">
                        {selectedSubcategory.email}
                      </p>
                    </div>
                  )}

                  {selectedSubcategory.device_token && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Device Token
                      </label>
                      <p className="text-sm text-gray-900 font-mono bg-gray-50 p-2 rounded border break-all">
                        {selectedSubcategory.device_token}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subcategory;