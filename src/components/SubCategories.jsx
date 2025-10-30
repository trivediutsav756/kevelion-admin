import React, { useState, useEffect } from 'react';

// Constants
const API_BASE_URL = 'http://rettalion.apxfarms.com';

// Custom hook for API calls
const useSubCategories = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
    }
  };

  const fetchSubcategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/subcategories`);
      if (!response.ok) throw new Error('Failed to fetch subcategories');
      const data = await response.json();
      setSubcategories(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { 
    subcategories, 
    categories, 
    loading, 
    error, 
    fetchCategories, 
    fetchSubcategories, 
    setSubcategories,
    setError
  };
};

// Modal Components
const ViewModal = ({ subcategory, categories, imagePreview, onClose }) => {
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.category_name : 'N/A';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        <div className="bg-blue-500 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">View SubCategory Details</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select 

                Category</label>
              <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">{getCategoryName(subcategory.category_id)}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
              <p className="text-lg text-gray-900 bg-gray-50 p-3 rounded-lg">{subcategory.subcategory_name}</p>
            </div>

            {imagePreview && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">SubCategory Image</label>
                <div className="w-full h-64 border-2 border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt={subcategory.subcategory_name}
                    className="w-full h-full object-contain bg-gray-50"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-gray-700 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddEditModal = ({ 
  showModal, 
  editMode, 
  currentSubCategory, 
  categories,
  imagePreview, 
  loading, 
  onClose, 
  onSubmit, 
  onInputChange, 
  onImageChange 
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold">
            {editMode ? 'Edit SubCategory' : 'Add New SubCategory'}
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6">
          {/* Select SubCategory field first */}
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Select Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category_id"
              value={currentSubCategory.category_id}
              onChange={onInputChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition duration-200"
              required
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          {/* Name field second */}
          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subcategory_name"
              value={currentSubCategory.subcategory_name}
              onChange={onInputChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition duration-200"
              placeholder="Enter subcategory name"
              required
            />
          </div>

          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2">
              SubCategory Image {!editMode && <span className="text-red-500">*</span>}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition duration-200"
              required={!editMode}
            />
          </div>

          {imagePreview && (
            <div className="mb-5">
              <label className="block text-gray-700 font-semibold mb-2">Preview</label>
              <div className="w-full h-48 border-2 border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-400 transition duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                editMode ? 'Update SubCategory' : 'Add SubCategory'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Alert Component
const Alert = ({ type, message, onClose }) => {
  if (!message) return null;

  const styles = {
    error: 'bg-red-50 border-l-4 border-red-500 text-red-700',
    success: 'bg-green-50 border-l-4 border-green-500 text-green-700'
  };

  const icons = {
    error: (
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    )
  };

  return (
    <div className={`p-4 mb-6 rounded ${styles[type]}`}>
      <div className="flex items-center">
        {icons[type]}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

// Table Row Component
const SubCategoryRow = ({ subcategory, index, categories, onView, onEdit, onDelete }) => {
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.category_name : 'N/A';
  };

  return (
    <tr key={subcategory.id} className="hover:bg-gray-50 transition duration-150">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{index + 1}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex-shrink-0 h-16 w-16">
          {subcategory.image ? (
            <img
              src={`${API_BASE_URL}${subcategory.image}`}
              alt={subcategory.subcategory_name}
              className="h-16 w-16 rounded-lg object-cover border-2 border-gray-200"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {getCategoryName(subcategory.category_id)}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-medium text-gray-900">
          {subcategory.subcategory_name || 'N/A'}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-4">
          <ActionButton 
            onClick={() => onView(subcategory.id)}
            color="blue"
            title="View SubCategory"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            }
          />
          <ActionButton 
            onClick={() => onEdit(subcategory.id)}
            color="green"
            title="Edit SubCategory"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
          />
          <ActionButton 
            onClick={() => onDelete(subcategory.id)}
            color="red"
            title="Delete SubCategory"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            }
          />
        </div>
      </td>
    </tr>
  );
};

// Action Button Component
const ActionButton = ({ onClick, color, title, icon }) => {
  const colors = {
    blue: 'text-blue-500 hover:text-blue-600 hover:bg-blue-50',
    green: 'text-green-500 hover:text-green-600 hover:bg-green-50',
    red: 'text-red-500 hover:text-red-600 hover:bg-red-50'
  };

  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md transition-colors ${colors[color]}`}
      title={title}
    >
      {icon}
    </button>
  );
};

// Empty State Component
const EmptyState = () => (
  <tr>
    <td colSpan="5" className="px-6 py-12 text-center">
      <div className="flex flex-col items-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-gray-500 text-lg font-medium">No subcategories found</p>
        <p className="text-gray-400 text-sm mt-1">Add your first subcategory to get started</p>
      </div>
    </td>
  </tr>
);

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
  </div>
);

// Main Component
const SubCategory = () => {
  const { 
    subcategories, 
    categories, 
    loading, 
    error, 
    fetchCategories, 
    fetchSubcategories,
    setError
  } = useSubCategories();
  
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSubCategory, setCurrentSubCategory] = useState({
    subcategory_id: '',
    subcategory_name: '',
    category_id: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState('');
  const [apiLoading, setApiLoading] = useState(false);
  
  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentSubCategory(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentSubCategory(prev => ({
        ...prev,
        image: file
      }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSubCategory = async (e) => {
    e.preventDefault();
    
    if (!currentSubCategory.subcategory_name || !currentSubCategory.category_id) {
      setError('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('subcategory_name', currentSubCategory.subcategory_name);
    formData.append('category_id', currentSubCategory.category_id);
    if (currentSubCategory.image) {
      formData.append('image', currentSubCategory.image);
    }

    await performApiCall(
      `${API_BASE_URL}/subcategory`,
      'POST',
      formData,
      'Subcategory added successfully!'
    );
  };

  const handleUpdateSubCategory = async (e) => {
    e.preventDefault();
    
    if (!currentSubCategory.subcategory_name || !currentSubCategory.category_id) {
      setError('Please fill in all required fields');
      return;
    }

    const formData = new FormData();
    formData.append('subcategory_name', currentSubCategory.subcategory_name);
    formData.append('category_id', currentSubCategory.category_id);
    if (currentSubCategory.image instanceof File) {
      formData.append('image', currentSubCategory.image);
    }

    await performApiCall(
      `${API_BASE_URL}/subcategory/${currentSubCategory.subcategory_id}`,
      'PATCH',
      formData,
      'Subcategory updated successfully!'
    );
  };

  const handleDeleteSubCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return;
    
    await performApiCall(
      `${API_BASE_URL}/subcategory/${id}`,
      'DELETE',
      null,
      'Subcategory deleted successfully!'
    );
  };

  const performApiCall = async (url, method, body, successMessage) => {
    setApiLoading(true);
    setError('');
    setSuccess('');

    try {
      const options = {
        method: method,
        headers: {}
      };

      if (body && !(body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
      }

      if (body) {
        options.body = body instanceof FormData ? body : JSON.stringify(body);
      }

      console.log('API Call:', { url, method, body: options.body });

      const response = await fetch(url, options);
      
      const contentType = response.headers.get('content-type');
      let responseData;

      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = `API endpoint not found (404). Please check if the endpoint exists: ${url}`;
        } else if (response.status === 405) {
          errorMessage = `Method not allowed (405). The endpoint doesn't support ${method} method. Try using a different HTTP method.`;
        }
        
        throw new Error(errorMessage);
      }

      console.log('API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Failed to ${method === 'POST' ? 'add' : method === 'DELETE' ? 'delete' : 'update'} subcategory. Status: ${response.status}`);
      }
      
      setSuccess(successMessage);
      resetForm();
      fetchSubcategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('API Error:', err);
      
      if (err.message.includes('API endpoint not found')) {
        setError(err.message);
      } else if (err.message.includes('Method not allowed')) {
        setError(err.message);
      } else if (err.message.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and CORS settings.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setApiLoading(false);
    }
  };

  const handleViewClick = async (id) => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/subcategory/${id}`);
      if (!response.ok) throw new Error('Failed to fetch subcategory details');
      const data = await response.json();
      
      setCurrentSubCategory({
        subcategory_id: data.id,
        subcategory_name: data.subcategory_name,
        category_id: data.category_id,
        image: null
      });
      setImagePreview(data.image ? `${API_BASE_URL}${data.image}` : '');
      setShowViewModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditClick = async (id) => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/subcategory/${id}`);
      if (!response.ok) throw new Error('Failed to fetch subcategory details');
      const data = await response.json();
      
      setCurrentSubCategory({
        subcategory_id: data.id,
        subcategory_name: data.subcategory_name,
        category_id: data.category_id,
        image: null
      });
      setImagePreview(data.image ? `${API_BASE_URL}${data.image}` : '');
      setEditMode(true);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setCurrentSubCategory({
      subcategory_id: '',
      subcategory_name: '',
      category_id: '',
      image: null
    });
    setImagePreview('');
    setShowModal(false);
    setShowViewModal(false);
    setEditMode(false);
  };

  const handleAddClick = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">SubCategory Management</h1>
              <p className="text-gray-600 mt-1">Manage all your product subcategories</p>
            </div>
            <button
              onClick={handleAddClick}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-200 shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add SubCategory
            </button>
          </div>
          
          {/* SubCategory Count */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-gray-700">
                  All SubCategories ({subcategories.length})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <Alert type="error" message={error} onClose={() => setError('')} />
        <Alert type="success" message={success} onClose={() => setSuccess('')} />

        {/* Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {(loading || apiLoading) && !showModal && !showViewModal ? (
            <LoadingSpinner />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Select SubCategory
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subcategories.length === 0 ? (
                    <EmptyState />
                  ) : (
                    subcategories.map((subcategory, index) => (
                      <SubCategoryRow
                        key={subcategory.id}
                        subcategory={subcategory}
                        index={index}
                        categories={categories}
                        onView={handleViewClick}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteSubCategory}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Info */}
        {subcategories.length > 0 && (
          <div className="mt-4 flex justify-between items-center px-2">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{subcategories.length}</span> subcategories
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showViewModal && (
        <ViewModal
          subcategory={currentSubCategory}
          categories={categories}
          imagePreview={imagePreview}
          onClose={resetForm}
        />
      )}

      <AddEditModal
        showModal={showModal}
        editMode={editMode}
        currentSubCategory={currentSubCategory}
        categories={categories}
        imagePreview={imagePreview}
        loading={apiLoading}
        onClose={resetForm}
        onSubmit={editMode ? handleUpdateSubCategory : handleAddSubCategory}
        onInputChange={handleInputChange}
        onImageChange={handleImageChange}
      />
    </div>
  );
};

export default SubCategory;