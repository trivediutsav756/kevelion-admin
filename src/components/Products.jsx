import React, { useState, useEffect } from 'react';

const BASE_URL = "https://adminapi.kevelion.com";

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  if (imagePath.startsWith('data:')) return imagePath;
  if (imagePath.startsWith('/')) return `${BASE_URL}${imagePath}`;
  if (imagePath.includes('/')) return `${BASE_URL}/${imagePath}`;
  return `${BASE_URL}/uploads/${imagePath}`;
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
        onError={() => { setImageError(true); setImageLoading(false); }}
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

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [sellers, setSellers] = useState({});
  const [colors, setColors] = useState({});
  const [finishes, setFinishes] = useState({});
  const [materials, setMaterials] = useState({});
  const [countries, setCountries] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const parseSpecifications = (specString) => {
    if (!specString) return null;
    try {
      const parsed = JSON.parse(specString);
      return parsed.specifications || parsed;
    } catch (e) { return null; }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat && cat.id == categoryId);
    return category ? category.category_name : 'N/A';
  };

  const getSubCategoryName = (subCategoryId) => {
    const subCategory = subCategories.find(sub => sub && sub.id == subCategoryId);
    return subCategory ? subCategory.subcategory_name : 'N/A';
  };

  const getSellerName = (sellerId) => sellers[sellerId] || `Seller ${sellerId}`;

  const parsePricingTiers = (tiersString) => {
    if (!tiersString || tiersString.trim() === '') return [];
    try {
      let cleaned = tiersString.replace(/\\"/g, '"').replace(/^"|"$/g, '');
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) { return []; }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return dateStr; }
  };

  const fetchProducts = async () => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${BASE_URL}/products`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : (data.data || data.products || []));
    } catch (error) { setError(`Failed to fetch products: ${error.message}`); }
    finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/categories`);
      if (!res.ok) return;
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : (data.data || data.categories || []));
    } catch (e) {}
  };

  const fetchSubCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/subcategories`);
      if (!res.ok) return;
      const data = await res.json();
      setSubCategories(Array.isArray(data) ? data : (data.data || data.subcategories || []));
    } catch (e) {}
  };

  const fetchAuxiliaryData = async (endpoint, setter, nameField = 'name') => {
    try {
      const res = await fetch(`${BASE_URL}/${endpoint}`);
      if (!res.ok) return;
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.data || data[endpoint] || []);
      const map = {};
      arr.forEach(item => { map[item.id] = item[nameField] || `ID ${item.id}`; });
      setter(map);
    } catch (e) {}
  };

  const fetchSellers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/sellers`);
      if (!res.ok) return;
      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data.data || data.sellers || []);
      const map = {};
      arr.forEach(s => { map[s.id] = s.name || s.company_name || `Seller ${s.id}`; });
      setSellers(map);
    } catch (e) {}
  };

  useEffect(() => {
    fetchProducts(); fetchCategories(); fetchSubCategories(); fetchSellers();
    fetchAuxiliaryData('colors', setColors);
    fetchAuxiliaryData('finishes', setFinishes);
    fetchAuxiliaryData('materials', setMaterials);
    fetchAuxiliaryData('countries', setCountries);
  }, []);

  const getColorName = id => colors[id] || (id ? `${id}` : 'N/A');
  const getFinishName = id => finishes[id] || (id ? `${id}` : 'N/A');
  const getMaterialName = id => materials[id] || (id ? `${id}` : 'N/A');
  const getCountryName = id => countries[id] || (id ? `${id}` : 'N/A');

  const toggleHighlight = async (productId) => {
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) return;
    const old = { ...products[idx] };
    const newH = (old.highlight === 'Yes' || old.highlight === 'yes') ? 'No' : 'Yes';
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, highlight: newH } : p));
    if (showModal && selectedProduct?.id === productId) setSelectedProduct(prev => ({ ...prev, highlight: newH }));
    try { await fetch(`${BASE_URL}/product/${productId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ highlight: newH }) }); }
    catch (e) { setProducts(prev => prev.map((p, i) => i === idx ? old : p)); if (showModal && selectedProduct?.id === productId) setSelectedProduct(old); }
  };

  const toggleFeatured = async (productId) => {
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) return;
    const old = { ...products[idx] };
    const newF = (old.featured === 'Yes' || old.featured === 'yes') ? 'No' : 'Yes';
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, featured: newF } : p));
    if (showModal && selectedProduct?.id === productId) setSelectedProduct(prev => ({ ...prev, featured: newF }));
    try { await fetch(`${BASE_URL}/product/${productId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ featured: newF }) }); }
    catch (e) { setProducts(prev => prev.map((p, i) => i === idx ? old : p)); if (showModal && selectedProduct?.id === productId) setSelectedProduct(old); }
  };

  const toggleStatus = async (productId) => {
    const idx = products.findIndex(p => p.id === productId);
    if (idx === -1) return;
    const old = { ...products[idx] };
    const newS = old.status === 'Active' ? 'Inactive' : 'Active';
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, status: newS } : p));
    if (showModal && selectedProduct?.id === productId) setSelectedProduct(prev => ({ ...prev, status: newS }));
    try { await fetch(`${BASE_URL}/product/${productId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newS }) }); }
    catch (e) { setProducts(prev => prev.map((p, i) => i === idx ? old : p)); if (showModal && selectedProduct?.id === productId) setSelectedProduct(old); }
  };

  const filteredProducts = products.filter(p =>
    !searchQuery ||
    (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center max-w-sm w-full">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Error Loading Products</h3>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button onClick={fetchProducts} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors w-full">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ─── */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Product Catalog</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {products.length} products &nbsp;·&nbsp; {categories.length} categories
            </p>
          </div>
          {/* Search */}
          <div className="w-full sm:w-72">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 0 5 11a6 6 0 0 0 12 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, SKU, brand…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <svg className="mx-auto w-14 h-14 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 text-lg font-medium">No products found</p>
            {searchQuery && <p className="text-gray-400 text-sm mt-1">Try a different search term</p>}
          </div>
        ) : (
          <>
            {/* ─── Mobile: Card Grid ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
              {filteredProducts.map((product, index) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Card top row */}
                  <div className="flex items-start gap-3 p-3">
                    <div className="flex-shrink-0">
                      <ProductImage
                        src={product.f_image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium mb-0.5">#{index + 1}</p>
                      <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">{product.name || 'Unnamed Product'}</h3>
                      {product.brand && <p className="text-xs text-gray-500 mt-0.5">{product.brand}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{getCategoryName(product.cat_id)}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedProduct(product); setShowModal(true); }}
                      className="flex-shrink-0 p-2 text-blue-600 hover:bg-blue-50 rounded-full border border-blue-200 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                  {/* Card footer */}
                  <div className="flex flex-wrap items-center justify-between border-t border-gray-100 px-3 py-2 bg-gray-50 gap-2">
                    <div className="text-xs text-gray-500 w-full sm:w-auto mb-1 sm:mb-0">MOQ: <span className="font-semibold text-blue-600">{product.moq || 1}</span></div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleFeatured(product.id)}
                        className={`text-xs font-bold px-2 py-1 rounded-full border transition-colors ${(product.featured === 'Yes' || product.featured === 'yes') ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}
                      >
                        {(product.featured === 'Yes' || product.featured === 'yes') ? '✨ Featured' : 'Feature'}
                      </button>
                      <button
                        onClick={() => toggleHighlight(product.id)}
                        className={`text-xs font-bold px-2 py-1 rounded-full border transition-colors ${(product.highlight === 'Yes' || product.highlight === 'yes') ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}
                      >
                        {(product.highlight === 'Yes' || product.highlight === 'yes') ? '⭐ Highlighted' : 'Highlight'}
                      </button>
                      <button
                        onClick={() => toggleStatus(product.id)}
                        className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${product.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {product.status || 'Active'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── Desktop: Table ─── */}
            <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#', 'Image', 'Product', 'Category', 'Brand', 'Seller', 'MOQ', 'Highlight', 'Featured', 'Status', ''].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredProducts.map((product, index) => (
                      <tr key={product.id} className="hover:bg-blue-50 transition duration-150">
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-gray-400">{index + 1}</td>
                        <td className="px-3 py-3 whitespace-nowrap"><ProductImage src={product.f_image} alt={product.name} className="w-12 h-12 object-cover rounded-lg border border-gray-200" /></td>
                        <td className="px-3 py-3 max-w-[180px]">
                          <div className="text-sm font-semibold text-gray-900 truncate">{product.name}</div>
                          {product.sku && <div className="text-xs text-gray-400">SKU: {product.sku}</div>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs font-medium text-gray-800">{getCategoryName(product.cat_id)}</div>
                          <div className="text-xs text-gray-400">{getSubCategoryName(product.cat_sub_id)}</div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{product.brand || '—'}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-700">{getSellerName(product.seller_id)}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-semibold text-blue-600">{product.moq || 1}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <button onClick={() => toggleHighlight(product.id)} className={`text-xs font-bold px-2 py-1 rounded-full border transition-opacity hover:opacity-70 ${(product.highlight === 'Yes' || product.highlight === 'yes') ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                            {(product.highlight === 'Yes' || product.highlight === 'yes') ? 'Yes' : 'No'}
                          </button>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <button onClick={() => toggleFeatured(product.id)} className={`text-xs font-bold px-2 py-1 rounded-full border transition-opacity hover:opacity-70 ${(product.featured === 'Yes' || product.featured === 'yes') ? 'bg-purple-100 text-purple-800 border-purple-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                            {(product.featured === 'Yes' || product.featured === 'yes') ? 'Yes' : 'No'}
                          </button>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <button onClick={() => toggleStatus(product.id)} className={`text-xs font-bold px-2 py-1 rounded-full transition-opacity hover:opacity-70 ${product.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {product.status || 'Active'}
                          </button>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <button onClick={() => { setSelectedProduct(product); setShowModal(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full border border-blue-200 transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Product Details Modal ─── */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
          <div className="flex items-end sm:items-center justify-center min-h-screen">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
            {/* Panel */}
            <div className="relative bg-white w-full sm:rounded-xl sm:max-w-3xl sm:mx-4 max-h-screen sm:max-h-[92vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">{selectedProduct.name || 'Product Details'}</h2>
                    <p className="text-blue-200 text-xs sm:text-sm mt-0.5">SKU: {selectedProduct.sku || 'N/A'}</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="ml-4 text-white hover:text-blue-200 p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Hero: Image + Quick Badges */}
                <div className="flex gap-4 items-start">
                  <ProductImage
                    src={selectedProduct.f_image}
                    alt={selectedProduct.name}
                    className="w-24 h-24 sm:w-36 sm:h-36 object-cover rounded-xl flex-shrink-0 border border-gray-200 shadow"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <h3 className="text-base sm:text-xl font-bold text-gray-900 leading-tight">{selectedProduct.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${selectedProduct.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{selectedProduct.status || 'Active'}</span>
                      {(selectedProduct.highlight === 'Yes' || selectedProduct.highlight === 'yes') && (
                        <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">⭐ Highlighted</span>
                      )}
                      {(selectedProduct.featured === 'Yes' || selectedProduct.featured === 'yes') && (
                        <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">✨ Featured</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 pt-1">
                      <span>MOQ: <strong className="text-blue-600">{selectedProduct.moq || 1}</strong></span>
                      <span>MRP: <strong className="text-green-600">₹{selectedProduct.product_MRP || 'N/A'}</strong></span>
                      <span>GST: <strong>{selectedProduct.gst ? `${selectedProduct.gst}%` : 'N/A'}</strong></span>
                      <span>Brand: <strong>{selectedProduct.brand || 'N/A'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Category / Seller */}
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Category', value: getCategoryName(selectedProduct.cat_id) },
                    { label: 'Subcategory', value: getSubCategoryName(selectedProduct.cat_sub_id) },
                    { label: 'Seller', value: getSellerName(selectedProduct.seller_id) },
                    { label: 'Color', value: getColorName(selectedProduct.color_id) },
                    { label: 'Finish', value: getFinishName(selectedProduct.finish_id) },
                    { label: 'Country', value: getCountryName(selectedProduct.country_id) },
                    { label: 'Material', value: getMaterialName(selectedProduct.material_id) || selectedProduct.material || 'N/A' },
                    { label: 'Made In', value: selectedProduct.made_in || 'N/A' },
                    { label: 'Warranty', value: selectedProduct.warranty ? `${selectedProduct.warranty} months` : 'N/A' },
                  ].map(item => (
                    <div key={item.label} className="space-y-0.5">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                {selectedProduct.detail && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{selectedProduct.detail}</p>
                  </div>
                )}

                {/* Tech Specs */}
                {(() => {
                  const specs = parseSpecifications(selectedProduct.specifications);
                  if (!specs || Object.keys(specs).length === 0) return null;
                  return (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Technical Specifications</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {Object.entries(specs).map(([key, data]) => (
                          <div key={key} className="bg-white rounded-lg p-2.5 border border-gray-100">
                            <p className="text-xs font-medium text-gray-400 capitalize">{key.replace(/_/g, ' ')}</p>
                            <p className="text-sm font-semibold text-gray-800 mt-0.5">
                              {typeof data === 'object' ? data.value : data}
                              {typeof data === 'object' && data.unit && data.unit !== 'NONE' ? ` ${data.unit}` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Images Gallery */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Images</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {['f_image', 'image_2', 'image_3', 'image_4'].map((imgKey, i) => {
                      const src = selectedProduct[imgKey];
                      if (!src) return null;
                      return (
                        <div key={i} className="relative aspect-square">
                          <ProductImage src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                          {imgKey === 'f_image' && (
                            <span className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">Main</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Timestamps */}
                {(selectedProduct.created_at || selectedProduct.updated_at) && (
                  <div className="flex flex-col sm:flex-row gap-3 text-xs text-gray-400 border-t border-gray-100 pt-3">
                    {selectedProduct.created_at && <span>Created: <strong className="text-gray-600">{formatDate(selectedProduct.created_at)}</strong></span>}
                    {selectedProduct.updated_at && <span>Updated: <strong className="text-gray-600">{formatDate(selectedProduct.updated_at)}</strong></span>}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3 sm:px-6 flex flex-wrap gap-3">
                <button
                  onClick={() => toggleStatus(selectedProduct.id)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${selectedProduct.status === 'Active' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                >
                  {selectedProduct.status === 'Active' ? 'Set Inactive' : 'Set Active'}
                </button>
                <button
                  onClick={() => toggleHighlight(selectedProduct.id)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${(selectedProduct.highlight === 'Yes' || selectedProduct.highlight === 'yes') ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}
                >
                  {(selectedProduct.highlight === 'Yes' || selectedProduct.highlight === 'yes') ? 'Remove Highlight' : '⭐ Highlight'}
                </button>
                <button
                  onClick={() => toggleFeatured(selectedProduct.id)}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors ${(selectedProduct.featured === 'Yes' || selectedProduct.featured === 'yes') ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                >
                  {(selectedProduct.featured === 'Yes' || selectedProduct.featured === 'yes') ? 'Remove Feature' : '✨ Feature'}
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;