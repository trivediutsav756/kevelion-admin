// components/Products.jsx
import React, { useState, useEffect } from 'react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = 'http://rettalion.apxfarms.com';

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
          <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
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
          <span className="absolute top-3 left-3 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            ⭐ Featured
          </span>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-white border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">S.No</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Brand</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Seller Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">MOQ</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Highlight</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="px-6 py-12 text-center">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900">{index + 1}</div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ProductImage 
                            src={product.f_image}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                          />
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <div className="text-sm font-semibold text-gray-900">
                              {product.name || 'Unnamed Product'}
                            </div>
                            {product.detail && (
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                {product.detail.substring(0, 50)}...
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{getCategoryName(product.cat_id)}</div>
                          <div className="text-xs text-gray-500">{getSubCategoryName(product.cat_sub_id)}</div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{product.brand || '-'}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">
                                {getSellerName(product.seller_id)}
                              </div>
                              <div className="text-xs text-gray-500">ID: {product.seller_id}</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">{product.moq || 1}</div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.highlight === 'Yes' || product.highlight === 'yes' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                              No
                            </span>
                          )}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-bold rounded-full ${
                            product.status === 'Active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}  
        </div>
      </div>
    </div>
  );
};

export default Products;