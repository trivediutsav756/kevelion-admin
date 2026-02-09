import React, { useState, useEffect } from 'react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const BASE_URL = "https://adminapi.kevelion.com";

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
  
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
  
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }
  
    if (imagePath.startsWith('/')) {
      return `${BASE_URL}${imagePath}`;
    }
  
    if (imagePath.includes('/')) {
      return `${BASE_URL}/${imagePath}`;
    }
  
    return `${BASE_URL}/uploads/${imagePath}`;
  };

  const parsePricingTiers = (tiersString) => {
    if (!tiersString || tiersString.trim() === '') return [];
    try {
      // Handle potential escaping issues
      let cleaned = tiersString.replace(/\\"/g, '"').replace(/^"|"$/g, '');
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Error parsing pricing tiers:', err);
      return [];
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
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

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/products`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
      const data = await response.json();
      let productsArray = [];
    
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data && Array.isArray(data.data)) {
        productsArray = data.data;
      } else if (data && Array.isArray(data.products)) {
        productsArray = data.products;
      }
    
      setProducts(productsArray);
      console.log(`✅ Fetched ${productsArray.length} products`);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(`Failed to fetch products: ${error.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BASE_URL}/categories`);
      const data = await response.json();
    
      let categoriesArray = [];
      if (Array.isArray(data)) {
        categoriesArray = data;
      } else if (data && Array.isArray(data.data)) {
        categoriesArray = data.data;
      } else if (data && Array.isArray(data.categories)) {
        categoriesArray = data.categories;
      }
    
      setCategories(categoriesArray);
      console.log(`✅ Fetched ${categoriesArray.length} categories`);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const fetchSubCategories = async () => {
    try {
      const response = await fetch(`${BASE_URL}/subcategories`);
      const data = await response.json();
    
      let subCategoriesArray = [];
      if (Array.isArray(data)) {
        subCategoriesArray = data;
      } else if (data && Array.isArray(data.data)) {
        subCategoriesArray = data.data;
      } else if (data && Array.isArray(data.subcategories)) {
        subCategoriesArray = data.subcategories;
      }
    
      setSubCategories(subCategoriesArray);
      console.log(`✅ Fetched ${subCategoriesArray.length} subcategories`);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setSubCategories([]);
    }
  };

  const fetchSellers = async () => {
    try {
      const response = await fetch(`${BASE_URL}/sellers`);
      if (!response.ok) throw new Error('Failed to fetch sellers');
      const data = await response.json();
    
      const sellersMap = {};
      let sellersArray = [];
    
      if (Array.isArray(data)) {
        sellersArray = data;
      } else if (data && Array.isArray(data.data)) {
        sellersArray = data.data;
      } else if (data && Array.isArray(data.sellers)) {
        sellersArray = data.sellers;
      }
    
      sellersArray.forEach(seller => {
        sellersMap[seller.id] = seller.name || seller.company_name || `Seller ${seller.id}`;
      });
    
      setSellers(sellersMap);
      console.log(`✅ Fetched ${sellersArray.length} sellers`);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  };

  const toggleHighlight = async (productId) => {
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    const oldProduct = { ...products[productIndex] };
    const newHighlight = (oldProduct.highlight === 'Yes' || oldProduct.highlight === 'yes') ? 'No' : 'Yes';

    // Optimistic update
    setProducts(prev => prev.map((p, i) => i === productIndex ? { ...p, highlight: newHighlight } : p));

    // Update modal if open
    if (showModal && selectedProduct?.id === productId) {
      setSelectedProduct(prev => ({ ...prev, highlight: newHighlight }));
    }

    try {
      const response = await fetch(`${BASE_URL}/product/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highlight: newHighlight })
      });
      if (!response.ok) throw new Error(`Failed to update highlight: ${response.status}`);
    } catch (error) {
      console.error('Error updating highlight:', error);
      // Revert on error
      setProducts(prev => prev.map((p, i) => i === productIndex ? oldProduct : p));
      if (showModal && selectedProduct?.id === productId) {
        setSelectedProduct(oldProduct);
      }
      alert('Failed to update highlight. Please try again.');
    }
  };

  const toggleStatus = async (productId) => {
    const productIndex = products.findIndex(p => p.id === productId);
    if (productIndex === -1) return;

    const oldProduct = { ...products[productIndex] };
    const newStatus = oldProduct.status === 'Active' ? 'Inactive' : 'Active';

    // Optimistic update
    setProducts(prev => prev.map((p, i) => i === productIndex ? { ...p, status: newStatus } : p));

    // Update modal if open
    if (showModal && selectedProduct?.id === productId) {
      setSelectedProduct(prev => ({ ...prev, status: newStatus }));
    }

    try {
      const response = await fetch(`${BASE_URL}/product/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error(`Failed to update status: ${response.status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      // Revert on error
      setProducts(prev => prev.map((p, i) => i === productIndex ? oldProduct : p));
      if (showModal && selectedProduct?.id === productId) {
        setSelectedProduct(oldProduct);
      }
      alert('Failed to update status. Please try again.');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSubCategories();
    fetchSellers();
  }, []);

  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'N/A';
    const category = categories.find(cat => cat && cat.id == categoryId);
    return category ? category.category_name : 'N/A';
  };

  const getSubCategoryName = (subCategoryId) => {
    if (!subCategoryId) return 'N/A';
    const subCategory = subCategories.find(sub => sub && sub.id == subCategoryId);
    return subCategory ? subCategory.subcategory_name : 'N/A';
  };

  const getSellerName = (sellerId) => {
    return sellers[sellerId] || `Seller ${sellerId}`;
  };

  const ProductImage = ({ src, alt, className, showBadge = false }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
  
    const imageUrl = getImageUrl(src);
    if (!imageUrl || imageError) {
      return (
        <div className={`${className} bg-gradient-to-br from-gray-200 to-gray-300 flex flex-col items-center justify-center`}>
          <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs text-gray-500">No Image</p>
        </div>
      );
    }
    return (
      <div className="relative group">
        {imageLoading && (
          <div className={`${className} bg-gray-200 flex items-center justify-center absolute inset-0`}>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        <img
          src={imageUrl}
          alt={alt || 'Product Image'}
          className={`${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onLoad={() => setImageLoading(false)}
          onError={(e) => {
            console.error('Image failed to load:', imageUrl);
            setImageError(true);
            setImageLoading(false);
          }}
          loading="lazy"
        />
        {showBadge && !imageLoading && !imageError && (
          <span className="absolute top-1 left-1 bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
            ⭐ Featured
          </span>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Products</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={fetchProducts}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-full mx-auto"> {/* Changed from max-w-7xl to max-w-full for better fit */}
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Product Catalog</h1>
              <p className="text-gray-600 mt-1">Browse all products in the inventory</p>
            </div>
          </div>
        
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-gray-700">
                  Total Products: {products.length}
                </span>
                <span className="text-sm text-gray-500">
                  Categories: {categories.length} | Subcategories: {subCategories.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto md:overflow-x-visible"> {/* Keep scroll only on mobile, remove on md+ */}
              <table className="min-w-full divide-y divide-gray-200 table-fixed"> {/* Added table-fixed for consistent widths */}
                <thead className="bg-white border-b-2 border-gray-200">
                  <tr>
                    <th className="w-8 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">S.No</th>
                    <th className="w-16 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                    <th className="w-40 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product Name</th>
                    <th className="w-32 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="w-20 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Brand</th>
                    <th className="w-32 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Seller</th>
                    <th className="w-12 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">MOQ</th>
                    <th className="w-16 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Highlight</th>
                    <th className="w-16 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="w-12 px-2 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <p className="text-gray-500 text-lg font-medium">No products found</p>
                          <p className="text-gray-400 text-sm mt-1">Product catalog is empty</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((product, index) => (
                      <tr key={product.id} className="hover:bg-blue-50 transition duration-150">
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{index + 1}</div>
                        </td>
                      
                        <td className="px-2 py-3 whitespace-nowrap">
                          <ProductImage
                            src={product.f_image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm" // Reduced size
                          />
                        </td>
                      
                        <td className="px-2 py-3">
                          <div className="max-w-xs">
                            <div className="text-sm font-semibold text-gray-900 truncate" title={product.name || 'Unnamed Product'}>
                              {product.name || 'Unnamed Product'}
                            </div>
                            {product.detail && (
                              <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {product.detail.substring(0, 60)}...
                              </div>
                            )}
                          </div>
                        </td>
                      
                        <td className="px-2 py-3">
                          <div className="text-xs font-medium text-gray-900 truncate" title={getCategoryName(product.cat_id)}>
                            {getCategoryName(product.cat_id)}
                          </div>
                          <div className="text-xs text-gray-500 truncate" title={getSubCategoryName(product.cat_sub_id)}>
                            {getSubCategoryName(product.cat_sub_id)}
                          </div>
                        </td>
                      
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900 truncate" title={product.brand || '-'}>
                            {product.brand || '-'}
                          </div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {/* Removed avatar to save space; just show name */}
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[100px]" title={getSellerName(product.seller_id)}>
                              {getSellerName(product.seller_id)}
                            </div>
                            <div className="text-xs text-gray-500 ml-1">({product.seller_id})</div>
                          </div>
                        </td>
                      
                        <td className="px-2 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">{product.moq || 1}</div>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-bold rounded-full cursor-pointer hover:opacity-75 transition-opacity ${
                              (product.highlight === 'Yes' || product.highlight === 'yes')
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                            }`}
                            onClick={() => toggleHighlight(product.id)}
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              {(product.highlight === 'Yes' || product.highlight === 'yes') ? (
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              ) : (
                                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              )}
                            </svg>
                            {(product.highlight === 'Yes' || product.highlight === 'yes') ? 'Yes' : 'No'}
                          </span>
                        </td>
                      
                        <td className="px-2 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-bold rounded-full cursor-pointer hover:opacity-75 transition-opacity ${
                              product.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                            onClick={() => toggleStatus(product.id)}
                          >
                            {product.status || 'Active'}
                          </span>
                        </td>
                        <td className="px-2 py-3 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowModal(true);
                            }}
                            className="inline-flex items-center justify-center w-6 h-6 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-full transition-all duration-200 shadow-sm border border-blue-200"
                            title="View Details"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Product Details Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                onClick={() => setShowModal(false)}
              ></div>
              <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 pt-6 pb-4 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-white bg-opacity-20 rounded-full">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl leading-6 font-bold text-white">Product Details</h3>
                        <p className="text-blue-100 text-sm">View complete information</p>
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="text-white hover:text-gray-200 p-2 rounded-full hover:bg-white bg-opacity-20 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Modal Body */}
                <div className="p-6 space-y-6">
                  {selectedProduct && (
                    <div className="space-y-6">
                      {/* Hero Section: Main Image and Basic Info */}
                      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                          <ProductImage
                            src={selectedProduct.f_image}
                            alt={selectedProduct.name}
                            className="w-32 h-32 lg:w-48 lg:h-48 object-cover rounded-lg flex-shrink-0 shadow-md"
                          />
                          <div className="flex-1 space-y-3">
                            <h4 className="text-2xl font-bold text-gray-900 leading-tight">{selectedProduct.name || 'Unnamed Product'}</h4>
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <p className="text-gray-600">Product Name: <span className="font-semibold text-gray-900">{selectedProduct.name || 'Unnamed Product'}</span></p>
                              <p className="text-gray-600">SKU: <span className="font-semibold text-gray-900">{selectedProduct.sku || 'N/A'}</span></p>
                              <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                                selectedProduct.status === 'Active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {selectedProduct.status || 'Active'}
                              </span>
                              {(selectedProduct.highlight === 'Yes' || selectedProduct.highlight === 'yes') && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Key Details Grid */}
                      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Key Details
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
                            <p className="text-sm font-semibold text-gray-900">{getCategoryName(selectedProduct.cat_id)}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Subcategory</label>
                            <p className="text-sm font-semibold text-gray-900">{getSubCategoryName(selectedProduct.cat_sub_id)}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Brand</label>
                            <p className="text-sm font-semibold text-gray-900">{selectedProduct.brand || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Seller</label>
                            <p className="text-sm font-semibold text-gray-900">{getSellerName(selectedProduct.seller_id)}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">MOQ</label>
                            <p className="text-sm font-semibold text-blue-600">{selectedProduct.moq || 1}</p>
                          </div>
                        </div>
                      </div>
                      {/* Images Gallery */}
                      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          Images
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {['f_image', 'image_2', 'image_3', 'image_4'].map((imgKey, i) => {
                            const src = selectedProduct[imgKey];
                            if (!src) return null;
                            return (
                              <div key={i} className="relative">
                                <ProductImage
                                  src={src}
                                  alt={`${selectedProduct.name} image ${i + 1}`}
                                  className="w-full h-24 object-cover rounded-lg shadow-sm"
                                />
                                {imgKey === 'f_image' && (
                                  <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">Featured</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {/* Description */}
                      {selectedProduct.detail && (
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                          <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Description
                          </h5>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedProduct.detail}</p>
                          </div>
                        </div>
                      )}
                      {/* Product Specifications */}
                      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Specifications
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Material</label>
                            <p className="text-sm font-semibold text-gray-900">{selectedProduct.material || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Made In</label>
                            <p className="text-sm font-semibold text-gray-900">{selectedProduct.made_in || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Specification</label>
                            <p className="text-sm font-semibold text-gray-900">{selectedProduct.specification || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Warranty</label>
                            <p className="text-sm font-semibold text-gray-900">{selectedProduct.warranty || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      {/* Pricing Tiers */}
                      {selectedProduct.pricing_tiers && (
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                          <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08 .402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Pricing Tiers
                          </h5>
                          {(() => {
                            const tiers = parsePricingTiers(selectedProduct.pricing_tiers);
                            if (tiers.length === 0) {
                              return <p className="text-gray-500 text-sm">No pricing tiers available</p>;
                            }
                            return (
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Quantity</th>
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {tiers.map((tier, index) => (
                                      <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tier.min || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">${tier.price || 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      {/* Timestamps */}
                      {(selectedProduct.created_at || selectedProduct.updated_at) && (
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                          <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Timestamps
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedProduct.created_at && (
                              <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Created</label>
                                <p className="text-sm font-semibold text-gray-900">{formatDate(selectedProduct.created_at)}</p>
                              </div>
                            )}
                            {selectedProduct.updated_at && (
                              <div className="space-y-1">
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">Updated</label>
                                <p className="text-sm font-semibold text-gray-900">{formatDate(selectedProduct.updated_at)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Additional Details (for any unexpected fields) */}
                      {Object.entries(selectedProduct).filter(([key, value]) =>
                        value &&
                        !['id', 'name', 'sku', 'detail', 'f_image', 'image_2', 'image_3', 'image_4', 'cat_id', 'cat_sub_id', 'brand', 'seller_id', 'moq', 'highlight', 'status', 'material', 'made_in', 'specification', 'warranty', 'pricing_tiers', 'created_at', 'updated_at', 'product_catalogue'].includes(key)
                      ).length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                          <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Additional Details
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(selectedProduct).filter(([key, value]) =>
                              value &&
                              !['id', 'name', 'sku', 'detail', 'f_image', 'image_2', 'image_3', 'image_4', 'cat_id', 'cat_sub_id', 'brand', 'seller_id', 'moq', 'highlight', 'status', 'material', 'made_in', 'specification', 'warranty', 'pricing_tiers', 'created_at', 'updated_at', 'product_catalogue'].includes(key)
                            ).map(([key, value]) => (
                              <div key={key} className="space-y-1">
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide capitalize">
                                  {key.replace(/_/g, ' ')}
                                </label>
                                <p className="text-sm font-semibold text-gray-900 break-words">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Modal Footer */}
                <div className="bg-gray-50 px-6 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-6 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;