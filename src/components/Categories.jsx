// components/Category.jsx
import React, { useState, useEffect } from 'react';
import { FiEye, FiEdit2, FiTrash2, FiPlus, FiImage, FiX } from 'react-icons/fi';

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const [selectedDeleteName, setSelectedDeleteName] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    category_name: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState('');

  const API_BASE_URL = 'http://rettalion.apxfarms.com';

  // Fetch all categories
  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned invalid response format');
      }

      const data = await response.json();
      setCategories(Array.isArray(data) ? data : []);
      
    } catch (err) {
      setError(err.message || 'Failed to fetch categories');
      console.error('Fetch error:', err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));

      // Generate preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.category_name.trim()) {
      setError('Category name is required');
      setSubmitLoading(false);
      return;
    }

    if (!formData.image) {
      setError('Category image is required');
      setSubmitLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('category_name', formData.category_name.trim());
    formDataToSend.append('image', formData.image);

    try {
      const response = await fetch(`${API_BASE_URL}/category`, {
        method: 'POST',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to add category');
      }

      const result = await response.json();
      setSuccess('Category added successfully!');
      resetForm();
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to add category');
      console.error('Add category error:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Update category
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    if (!formData.category_name.trim()) {
      setError('Category name is required');
      setSubmitLoading(false);
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('category_name', formData.category_name.trim());
    
    // Only append image if a new file is selected
    if (formData.image instanceof File) {
      formDataToSend.append('image', formData.image);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/category/${selectedCategory.id}`, {
        method: 'PATCH',
        body: formDataToSend
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update category');
      }

      const result = await response.json();
      setSuccess('Category updated successfully!');
      resetForm();
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update category');
      console.error('Update category error:', err);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (id, categoryName) => {
    setSelectedDeleteId(id);
    setSelectedDeleteName(categoryName);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedDeleteId) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/category/${selectedDeleteId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete category');
      }

      setSuccess('Category deleted successfully!');
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete category');
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setSelectedDeleteId(null);
      setSelectedDeleteName('');
    }
  };

  // View category details
  const handleViewCategory = async (id) => {
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/category/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch category details');
      }

      const data = await response.json();
      setSelectedCategory(data);
      setShowViewModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch category details');
      console.error('View error:', err);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    resetForm();
    setIsEditMode(false);
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = async (id) => {
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/category/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch category details');
      }

      const data = await response.json();
      
      setSelectedCategory(data);
      setFormData({
        category_name: data.category_name || '',
        image: null
      });
      setImagePreview(data.image ? `${API_BASE_URL}${data.image}` : '');
      setIsEditMode(true);
      setShowAddEditModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch category details');
      console.error('Edit error:', err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      category_name: '',
      image: null
    });
    setImagePreview('');
    setShowAddEditModal(false);
    setShowViewModal(false);
    setSelectedCategory(null);
    setIsEditMode(false);
    setError('');
  };

  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedDeleteId(null);
    setSelectedDeleteName('');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
        <p className="text-gray-600 mt-1">Manage all your product categories</p>
      </div>

      {/* Categories Count and Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">
          All Categories ({categories.length})
        </h2>
        
        {/* Add Category Button */}
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FiPlus className="text-lg" />
          Add Category
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
          <strong className="font-bold">Success: </strong>
          <span className="block sm:inline">{success}</span>
          <button 
            onClick={() => setSuccess('')}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button 
            onClick={() => setError('')}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading && !showAddEditModal && !showViewModal ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="flex flex-col items-center">
              <FiImage className="text-gray-300 text-6xl mb-4" />
              <p className="text-lg font-medium">No categories found</p>
              <p className="text-sm text-gray-400 mt-2">
                Click "Add Category" to create your first category
              </p>
            </div>
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
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
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
                {categories.map((category, index) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {category.id || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.image ? (
                        <img 
                          src={`${API_BASE_URL}${category.image}`} 
                          alt={category.category_name}
                          className="h-12 w-12 rounded-lg object-cover border"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/48?text=No+Image';
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
                        {category.category_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewCategory(category.id)}
                          className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                        >
                          <FiEye className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(category.id)}
                          className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="Edit Category"
                        >
                          <FiEdit2 className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.category_name)}
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Category"
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Modal */}
      {showViewModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-800">Category Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center">
                  {selectedCategory.image ? (
                    <img 
                      src={`${API_BASE_URL}${selectedCategory.image}`} 
                      alt={selectedCategory.category_name}
                      className="w-48 h-48 rounded-lg object-cover border shadow-md"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/192?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-lg bg-gray-100 flex items-center justify-center border shadow-md">
                      <FiImage className="text-gray-400 text-4xl" />
                    </div>
                  )}
                  <span className="mt-4 text-sm text-gray-500">Category Image</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Category ID
                    </label>
                    <p className="text-sm text-gray-900 font-mono">
                      {selectedCategory.id}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Category Name
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedCategory.category_name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Confirm Delete</h2>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-bold text-lg mb-2">
                  Warning: Deleting this category will also delete all its subcategories!
                </p>
                <p className="text-red-700 text-sm">
                  This action cannot be undone. Are you sure you want to delete &quot;{selectedDeleteName}&quot; and all associated subcategories?
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Delete Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-lg">
              <h2 className="text-xl font-semibold">
                {isEditMode ? 'Edit Category' : 'Add New Category'}
              </h2>
            </div>

            <form onSubmit={isEditMode ? handleUpdateCategory : handleAddCategory} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="category_name"
                    value={formData.category_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter category name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Image {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={!isEditMode}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported: JPG, PNG, GIF (Max 5MB)
                  </p>
                </div>

                {imagePreview && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Preview
                    </label>
                    <div className="w-full h-48 border-2 border-gray-300 rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    isEditMode ? 'Update Category' : 'Add Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;