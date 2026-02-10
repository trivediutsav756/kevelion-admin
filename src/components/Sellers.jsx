import React, { useState, useEffect } from 'react';
import {
  FiRefreshCw,
  FiUser,
  FiX,
  FiCreditCard,
  FiFileText,
  FiBriefcase,
  FiEdit2,
  FiTrash2,
  FiImage,
  FiPackage,
  FiEye,
  FiAlertCircle,
  FiCalendar,
  FiClock,
  FiSearch,
  FiPlus,
} from 'react-icons/fi';

const API_BASE_URL = "https://adminapi.kevelion.com";

// Company type options
const COMPANY_TYPE_OPTIONS = [
  { label: 'Proprietorship', value: 'Proprietorship' },
  { label: 'Partnership', value: 'Partnership' },
  { label: 'LLP', value: 'Limited Liability Partnership (LLP)' },
  { label: 'Private Limited Company', value: 'Private Limited Company' },
  { label: 'Public Limited Company', value: 'Public Limited Company' },
  { label: 'Proprietorship Firm', value: 'Proprietorship Firm' },
  { label: 'MSME', value: 'MSME' },
  { label: 'Other', value: 'other' },
];

const COMPANY_TYPE_MAP = {
  'Proprietorship': 'Proprietorship',
  'Partnership': 'Partnership',
  'Limited Liability Partnership (LLP)': 'Limited Liability Partnership (LLP)',
  'Private Limited Company': 'Private Limited Company',
  'Public Limited Company': 'Public Limited Company',
  'Proprietorship Firm': 'Proprietorship Firm',
  'MSME': 'MSME',
  'other': 'other',
  'Other': 'other',
  'LLP': 'Limited Liability Partnership (LLP)',
  'Private Limited': 'Private Limited Company',
  'Public Limited': 'Public Limited Company',
};

const normalizeCompanyType = (val) => COMPANY_TYPE_MAP[val] || 'Proprietorship';

const normalizeAnnualTurnover = (val) => {
  const lower = val?.toString().toLowerCase() || '';
  if (!lower) return '';
  if (lower.includes('below 20') || lower.includes('below_20') || lower.includes('below20')) return 'below 20 lakh';
  if (lower.includes('20-50') || lower.includes('20 50')) return '20-50 lakh';
  if (lower.includes('50-1') || lower.includes('50 lakh - 1')) return '50-1 cr';
  if (lower.includes('1-5') || lower.includes('1 5')) return '1-5 cr';
  if (lower.includes('5-10') || lower.includes('5 10')) return '5-10 cr';
  if (lower.includes('10-20') || lower.includes('10 20')) return '10-20 cr';
  return val;
};

const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" fill="#9ca3af" font-size="24" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>'
);

const toAbsoluteUrl = (base, path) => {
  if (!path) return '';
  const s = String(path).trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      const baseHost = new URL(base).host;
      if (u.protocol === 'http:' && u.host === baseHost) {
        u.protocol = 'https:';
        return encodeURI(u.toString());
      }
      return encodeURI(s);
    } catch {
      return s;
    }
  }
  const b = base.replace(/\/+$/, '');
  const rel = s.startsWith('/') ? s : `/${s}`;
  return encodeURI(`${b}${rel}`);
};

const getProductImageUrl = (product) => {
  let candidate = product?.f_image || product?.image_url || product?.image || 
                  product?.featured_image || product?.product_image || 
                  product?.main_image || product?.photo || product?.photo_url || 
                  (Array.isArray(product?.images) && product.images[0]) || 
                  product?.image_path || '';
  if (candidate && !candidate.startsWith('/') && !candidate.startsWith('http') && !candidate.includes('/storage/')) {
    candidate = `/storage/${candidate}`;
  }
  if (!candidate) return '';
  return toAbsoluteUrl(API_BASE_URL, candidate);
};

const safeParseJson = (text) => {
  if (!text) return {};
  const trimmed = text.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith('<!DOCTYPE html') || trimmed.startsWith('<html')) {
    return { raw: trimmed };
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return { raw: trimmed };
  }
};

const Seller = () => {
  const [sellers, setSellers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductDeleteModal, setShowProductDeleteModal] = useState(false);
  
  const [productFormData, setProductFormData] = useState({
    name: '',
    detail: '',
    price: '',
    moq: '',
    status: 'Active',
    f_image: null,
  });
  
  const [productFilePreview, setProductFilePreview] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [packageHistory, setPackageHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [subscriptionPackages, setSubscriptionPackages] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    status: 'Active',
    approve_status: 'Pending',
    device_token: 'default_device_token',
    subscription: 0,
    subscription_package_id: null,
    company_name: '',
    company_type: 'Proprietorship',
    company_GST_number: '',
    company_logo: null,
    company_website: '',
    IEC_code: '',
    annual_turnover: '20-50 lakh',
    facebook_link: '',
    linkedin_link: '',
    insta_link: '',
    city: '',
    state: '',
    pincode: '',
    aadhar_number: '',
    aadhar_front: null,
    aadhar_back: null,
    company_registration: null,
    company_pan_card: null,
    gst_certificate: null,
    cancelled_cheque_photo: null,
    bank_name: '',
    bank_IFSC_code: '',
    account_number: '',
    account_type: ''
  });

  const [filePreviews, setFilePreviews] = useState({
    company_logo: '',
    aadhar_front: '',
    aadhar_back: '',
    company_registration: '',
    company_pan_card: '',
    gst_certificate: '',
    cancelled_cheque_photo: ''
  });

  // ============ Fetch Subscription Packages ============
  const fetchSubscriptionPackages = async () => {
    try {
      // Try both with and without trailing slash to be resilient to server routing
      const endpoints = [
        `${API_BASE_URL}/subscription-packages`,
        `${API_BASE_URL}/subscription-packages/`,
      ];
      let data = null;
      let ok = false;
      for (const ep of endpoints) {
        try {
          const response = await fetch(ep, {
            headers: {
              'Accept': 'application/json',
            },
          });
          if (response.ok) {
            data = await response.json();
            ok = true;
            break;
          }
        } catch (e) {
          // continue to next endpoint
        }
      }
      if (!ok || data == null) {
        console.error('Failed to fetch subscription packages');
        return [];
      }
      
      // Handle different response formats
      let packages = [];
      if (Array.isArray(data)) {
        packages = data;
      } else if (data.data && Array.isArray(data.data)) {
        packages = data.data;
      } else if (data.packages && Array.isArray(data.packages)) {
        packages = data.packages;
      }
      
      return packages;
    } catch (error) {
      console.error('Error fetching subscription packages:', error);
      return [];
    }
  };

  // ============ Enhanced Seller Fetch with Package Details ============
  const fetchSellers = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch sellers
      const sellersResponse = await fetch(`${API_BASE_URL}/sellers`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!sellersResponse.ok) {
        throw new Error(`Failed to fetch sellers: ${sellersResponse.status}`);
      }

      const sellersData = await sellersResponse.json();
      let sellersList = [];

      // Handle different response formats
      if (Array.isArray(sellersData)) {
        sellersList = sellersData;
      } else if (sellersData.data && Array.isArray(sellersData.data)) {
        sellersList = sellersData.data;
      } else if (sellersData.sellers && Array.isArray(sellersData.sellers)) {
        sellersList = sellersData.sellers;
      } else {
        throw new Error('Unexpected response format from server');
      }

      const packages = await fetchSubscriptionPackages();
setSubscriptionPackages(packages);


      // Process sellers with package details
      const processedSellers = await Promise.all(
        sellersList.map(async (seller) => {
          let packageDetails = null;

          // Some APIs send subscription info as a nested object
          const nestedSub =
            seller.subscription ||
            seller.current_subscription ||
            seller.subscription_details ||
            seller.current_package ||
            null;

          // Try multiple possible field names for existing end date (including current_package_* from /sellers API)
          let packageEndDate =
            seller.subscription_end_date ||
            seller.package_end_date ||
            seller.current_package_end ||
            seller.end_date ||
            seller.subscription_expiry_date ||
            (nestedSub && (
              nestedSub.subscription_end_date ||
              nestedSub.package_end_date ||
              nestedSub.end_date ||
              nestedSub.expiry_date
            )) ||
            null;
let packageName =
  seller.package_name ||
  seller.subscription_package_name ||
  seller.plan_name ||

  // 🔥 VERY IMPORTANT (most APIs use this)
  seller.subscription_package?.name ||
  seller.subscription_package?.package_name ||

  seller.current_package?.name ||
  seller.current_package?.package_name ||

  (nestedSub && (
    nestedSub.package_name ||
    nestedSub.name ||
    nestedSub.plan_name ||
    nestedSub.package?.name ||
    nestedSub.package?.package_name
  )) ||

  'No Package';

          // Try multiple possible field names for package ID (including current_package_id from /sellers API)
       let packageId =
  seller.subscription_package_id ||
  seller.package_id ||
  seller.plan_id ||
  seller.current_package_id ||

  seller.subscription_package?.id ||
  seller.current_package?.id ||

  (nestedSub && (
    nestedSub.subscription_package_id ||
    nestedSub.package_id ||
    nestedSub.id
  )) ||

  null;


          // If seller has a package ID, get package details
          if (packageId) {
            // Match either by id or package_id so it works with different API shapes
            const packageFromList = packages.find(
              (p) => p.id == packageId || p.package_id == packageId
            );
            if (packageFromList) {
              packageDetails = packageFromList;
              packageName =
                packageFromList.package_name ||
                packageFromList.name ||
                packageFromList.title ||
                'Package';
              // Calculate end date if not provided but package has a duration/payment time
              const durationDays =
                packageFromList.duration_days ||
                packageFromList.payment_time ||
                0;

              // Try multiple possible start date fields (including current_package_start from /sellers API)
              const startDateRaw =
                seller.subscription_start_date ||
                seller.package_start_date ||
                seller.current_package_start ||
                seller.start_date ||
                seller.created_at ||
                null;

              if (!packageEndDate && startDateRaw && durationDays) {
                const startDate = new Date(startDateRaw);
                startDate.setDate(startDate.getDate() + Number(durationDays));
                packageEndDate = startDate.toISOString();
              }
            } else {
              // Try to fetch individual package details
              try {
                // Try both singular and plural endpoints for robustness
                const detailEndpoints = [
                  `${API_BASE_URL}/subscription-package/${packageId}`,
                  `${API_BASE_URL}/subscription-packages/${packageId}`,
                ];
                let detailData = null;
                for (const dep of detailEndpoints) {
                  try {
                    const packageResponse = await fetch(dep);
                    if (packageResponse.ok) {
                      detailData = await packageResponse.json();
                      break;
                    }
                  } catch {
                    // continue
                  }
                }
                if (detailData) {
                  packageDetails = detailData.data || detailData;
                  packageName =
                    packageDetails.package_name ||
                    packageDetails.name ||
                    packageDetails.title ||
                    'Package';

                  const durationDays =
                    packageDetails.duration_days ||
                    packageDetails.payment_time ||
                    0;

                  const startDateRaw =
                    seller.subscription_start_date ||
                    seller.package_start_date ||
                    seller.current_package_start ||
                    seller.start_date ||
                    seller.created_at ||
                    null;

                  if (!packageEndDate && startDateRaw && durationDays) {
                    const startDate = new Date(startDateRaw);
                    startDate.setDate(startDate.getDate() + Number(durationDays));
                    packageEndDate = startDate.toISOString();
                  }
                }
              } catch (packageError) {
                console.warn(`Could not fetch package ${packageId}:`, packageError);
              }
            }
          }

          if (packageName === 'No Package') {
            try {
              const detailEndpoints = [
                `${API_BASE_URL}/seller/${seller.id}`,
                `${API_BASE_URL}/seller/detail/${seller.id}`
              ];
              let detail = null;
              for (const dep of detailEndpoints) {
                try {
                  const r = await fetch(dep, { headers: { 'Accept': 'application/json' } });
                  if (r.ok) {
                    const d = await r.json();
                    detail = d.data || d.seller || d;
                    break;
                  }
                } catch {}
              }
              if (detail) {
                const pid =
                  detail.subscription_package_id ||
                  detail.package_id ||
                  detail.current_package?.id ||
                  null;
                const pname =
                  detail.package_name ||
                  detail.subscription_package?.name ||
                  detail.current_package?.name ||
                  null;
                if (pname) {
                  packageName = pname;
                } else if (pid) {
                  const fromList = packages.find((p) => p.id == pid || p.package_id == pid);
                  if (fromList) {
                    packageName =
                      fromList.package_name ||
                      fromList.name ||
                      fromList.title ||
                      'Package';
                  }
                }
              }
            } catch {}
          }

          if (packageName === 'No Package') {
            try {
              const histEp = `${API_BASE_URL}/seller/package-history/${seller.id}`;
              const r = await fetch(histEp, { headers: { 'Accept': 'application/json' } });
              if (r.ok) {
                const h = await r.json();
                const arr =
                  (h.success && Array.isArray(h.data) && h.data) ||
                  (Array.isArray(h.history) && h.history) ||
                  (Array.isArray(h) && h) ||
                  (Array.isArray(h.data) && h.data) ||
                  [];
                if (arr.length > 0) {
                  arr.sort((a, b) => {
                    const da = new Date(a.created_at || a.start_date || 0);
                    const db = new Date(b.created_at || b.start_date || 0);
                    return db - da;
                  });
                  const last = arr[0];
                  const histName =
                    last.package_name ||
                    last.packageName ||
                    last.package?.name ||
                    null;
                  const histId =
                    last.package_id ||
                    last.subscription_package_id ||
                    last.package?.id ||
                    null;
                  if (histName) {
                    packageName = histName;
                  } else if (histId) {
                    const fromList = packages.find((p) => p.id == histId || p.package_id == histId);
                    if (fromList) {
                      packageName =
                        fromList.package_name ||
                        fromList.name ||
                        fromList.title ||
                        'Package';
                    }
                  }
                  if (!packageEndDate) {
                    packageEndDate =
                      last.subscription_end_date ||
                      last.package_end_date ||
                      last.end_date ||
                      null;
                  }
                }
              }
            } catch {}
          }

          return {
            id: seller.id || '',
            name: seller.name || 'N/A',
            email: seller.email || 'N/A',
            mobile: seller.mobile || 'N/A',
            company_name: seller.company_name || 'N/A',
            company_type: seller.company_type || 'N/A',
            company_GST_number: seller.company_GST_number || 'N/A',
            company_website: seller.company_website || 'N/A',
            status: seller.status || 'inactive',
            approve_status: seller.approve_status || 'pending',
            subscription: seller.subscription || 0,
            subscription_package_id: seller.subscription_package_id || null,
            subscription_end_date: packageEndDate,
             package_name: packageName,
            package_details: packageDetails,
            company_logo: seller.company_logo || '',
            aadhar_number: seller.aadhar_number || '',
            aadhar_front: seller.aadhar_front || '',
            aadhar_back: seller.aadhar_back || '',
            company_registration: seller.company_registration || '',
            company_pan_card: seller.company_pan_card || '',
            gst_certificate: seller.gst_certificate || '',
            cancelled_cheque_photo: seller.cancelled_cheque_photo || '',
            bank_name: seller.bank_name || '',
            bank_IFSC_code: seller.bank_IFSC_code || '',
            account_number: seller.account_number || '',
            account_type: seller.account_type || 'savings',
            created_at: seller.created_at || '',
            updated_at: seller.updated_at || '',
            subscription_start_date: seller.subscription_start_date || seller.created_at,
          };
        })
      );

      setSellers(processedSellers);
    } catch (err) {
      console.error('Error in fetchSellers:', err);
      setError(err.message || 'Failed to fetch sellers. Please try again later.');
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  // ============ Format Subscription End Date with Warning ============
  const formatSubscriptionEndDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const endDate = new Date(dateString);
      const today = new Date();
      
      // Set both dates to start of day for accurate day calculation
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const diffTime = end - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const formattedDate = endDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Show red color when already expired or 10 or fewer days are remaining
      const isCritical = diffDays <= 10;

      let statusText;
      let className;

      if (diffDays < 0) {
        statusText = `${formattedDate} (Expired)`;
        className = 'text-red-600 font-medium';
      } else if (isCritical) {
        statusText = `${formattedDate} (${diffDays} day${diffDays !== 1 ? 's' : ''} left)`;
        className = 'text-red-600 font-medium';
      } else {
        statusText = `${formattedDate} (${diffDays} days left)`;
        className = 'text-gray-700';
      }

      return <span className={className}>{statusText}</span>;
    } catch (error) {
      console.error('Error formatting date:', error);
      return <span className="text-gray-500">Invalid date</span>;
    }
  };

  // ============ Handle Products Fetch with Better Error Handling ============
  const handleViewProducts = async (seller) => {
    setSelectedSeller(seller);
    setShowProductsModal(true);
    setProductsLoading(true);
    setProductsError('');
    setSellerProducts([]);
    
    try {
      const sellerId = seller.id;
      
      // Try multiple possible endpoints
      const endpoints = [
        `${API_BASE_URL}/product_seller/${sellerId}`,
        `${API_BASE_URL}/product/seller/${sellerId}`,
        `${API_BASE_URL}/products/seller/${sellerId}`,
        `${API_BASE_URL}/seller/${sellerId}/products`
      ];

      let response = null;
      let data = null;

      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
          });
          
          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch (err) {
          console.log(`Tried ${endpoint}:`, err.message);
          continue;
        }
      }

      if (!response || !response.ok) {
        // Fallback: Check if seller object already has products
        if (seller.products && Array.isArray(seller.products)) {
          setSellerProducts(seller.products);
        } else {
          throw new Error('Could not fetch products. The endpoint might not exist.');
        }
      } else {
        // Process the response data
        let products = [];
        
        if (data.success && Array.isArray(data.data)) {
          products = data.data;
        } else if (data.success && data.data && Array.isArray(data.data.products)) {
          products = data.data.products;
        } else if (Array.isArray(data.products)) {
          products = data.products;
        } else if (Array.isArray(data)) {
          products = data;
        } else if (data.data && Array.isArray(data.data)) {
          products = data.data;
        } else if (data.products && Array.isArray(data.products.data)) {
          products = data.products.data;
        }

        setSellerProducts(products);
        setProductsError(products.length === 0 ? '' : '');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setProductsError('Failed to load products. Please check if the products endpoint exists.');
    } finally {
      setProductsLoading(false);
    }
  };

  // ============ Handle View Seller Details ============
  const handleView = async (sellerId) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/seller/${sellerId}`, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch seller: ${response.status}`);
      }

      const sellerData = await response.json();
      
      // Process nested data structure
      let processedData = {};
      
      if (sellerData.seller) {
        processedData = {
          ...sellerData.seller,
          ...(sellerData.company || {}),
          ...(sellerData.kyc || {}),
          ...(sellerData.bank || {})
        };
      } else if (sellerData.data) {
        const data = sellerData.data;
        processedData = {
          ...(data.seller || {}),
          ...(data.company || {}),
          ...(data.kyc || {}),
          ...(data.bank || {})
        };
      } else {
        processedData = sellerData;
      }

      // Get package details if exists
      if (processedData.subscription_package_id) {
        try {
          const packageResponse = await fetch(`${API_BASE_URL}/subscription-package/${processedData.subscription_package_id}`);
          if (packageResponse.ok) {
            const packageData = await packageResponse.json();
            processedData.package_details = packageData.data || packageData;
            processedData.package_name = processedData.package_details.name || processedData.package_details.title || 'Package';
          }
        } catch (packageError) {
          console.warn('Could not fetch package details:', packageError);
        }
      }

      setSelectedSeller(processedData);
      setShowViewModal(true);
    } catch (err) {
      console.error('Error fetching seller details:', err);
      setError('Error fetching seller details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============ Component Helper Functions ============
  const StatusBadge = ({ status }) => (
    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
      status === 'Active' ? 'bg-green-100 text-green-800' :
      status === 'Inactive' ? 'bg-red-100 text-red-800' :
      'bg-gray-100 text-gray-800'
    }`}>
      {status || 'Unknown'}
    </span>
  );

  const ApproveStatusBadge = ({ status }) => (
    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
      status === 'Approved' ? 'bg-green-100 text-green-800' :
      status === 'Rejected' ? 'bg-red-100 text-red-800' :
      'bg-blue-100 text-blue-800'
    }`}>
      {status || 'Pending'}
    </span>
  );

  const HistoryStatusBadge = ({ status }) => {
    const isActive = status === 'Active' || status === 'active';
    const isExpired = status === 'Expired' || status === 'expired';
    const isPending = status === 'Pending' || status === 'pending';
    return (
      <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
        isActive ? 'bg-green-100 text-green-800' :
        isExpired ? 'bg-red-100 text-red-800' :
        isPending ? 'bg-yellow-100 text-yellow-800' :
        'bg-gray-100 text-gray-800'
      }`}>
        {status || 'Unknown'}
      </span>
    );
  };

  const ImagePreview = ({ src, alt, label }) => (
    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
      <span className="text-xs font-medium text-gray-600 mb-2">{label}</span>
      {src ? (
        <a href={src} target="_blank" rel="noopener noreferrer">
          <img
            src={src}
            alt={alt}
            className="h-20 w-20 object-cover rounded border-2 border-gray-300 hover:border-blue-500 cursor-pointer transition-all"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = PLACEHOLDER_IMG;
            }}
          />
        </a>
      ) : (
        <div className="h-20 w-20 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center">
          <FiImage className="text-gray-400 text-2xl" />
        </div>
      )}
    </div>
  );

  const ProductImage = ({ product, className = "h-12 w-12" }) => {
    const [imgSrc, setImgSrc] = useState(PLACEHOLDER_IMG);
    const [imgLoading, setImgLoading] = useState(true);

    useEffect(() => {
      const loadImage = async () => {
        if (!product) {
          setImgLoading(false);
          return;
        }
        const imageUrl = getProductImageUrl(product);
        if (!imageUrl) {
          setImgSrc(PLACEHOLDER_IMG);
          setImgLoading(false);
          return;
        }
        const img = new Image();
        img.onload = () => {
          setImgSrc(imageUrl);
          setImgLoading(false);
        };
        img.onerror = () => {
          setImgSrc(PLACEHOLDER_IMG);
          setImgLoading(false);
        };
        img.src = imageUrl;
      };
      loadImage();
    }, [product]);

    if (imgLoading) {
      return (
        <div className={`${className} bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    return (
      <div className={`${className} relative group`}>
        <img
          src={imgSrc}
          alt={product?.name || 'Product Image'}
          className={`${className} object-cover rounded border-2 border-gray-200 group-hover:border-purple-500 transition-all`}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = PLACEHOLDER_IMG;
          }}
        />
      </div>
    );
  };

  const InfoField = ({ label, value, type = 'text' }) => {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return 'N/A';
      }
    };

    return (
      <div className="py-2 border-b border-gray-100 last:border-0">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
          <span className="text-sm font-medium text-gray-600">{label}</span>
          <span className="text-sm text-gray-900 sm:text-right break-words">
            {type === 'date' ? formatDate(value) : (value || 'N/A')}
          </span>
        </div>
      </div>
    );
  };

  const FileUpload = ({ name, label, accept = "image/*", preview, required = false }) => {
    const hint = accept.includes('pdf') ? 'Max 5MB • JPG, PNG, GIF, PDF' : 'Max 5MB • JPG, PNG, GIF';
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="file"
              name={name}
              accept={accept}
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">{hint}</p>
          </div>
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="h-16 w-16 rounded object-cover border-2 border-gray-200"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PLACEHOLDER_IMG;
              }}
            />
          )}
        </div>
      </div>
    );
  };

  const ProductFileUpload = ({ name, label, preview, required = false }) => {
    const hint = 'Max 5MB • JPG, PNG, GIF';
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="file"
              name={name}
              accept="image/*"
              onChange={handleProductFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">{hint}</p>
          </div>
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="h-16 w-16 rounded object-cover border-2 border-gray-200"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = PLACEHOLDER_IMG;
              }}
            />
          )}
        </div>
      </div>
    );
  };

  const formatHistoryDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 30) {
        return `${diffDays} days`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''}`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `${years} year${years > 1 ? 's' : ''}`;
      }
    } catch {
      return 'N/A';
    }
  };

  const filteredSellers = sellers.filter(seller =>
    seller.id?.toString().includes(searchTerm) ||
    seller.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.mobile?.includes(searchTerm) ||
    seller.package_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    seller.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============ Event Handlers ============
  const handleApprovalStatusChange = async (sellerId, newStatus) => {
    try {
      setError('');
      const payload = { 
        approve_status: newStatus 
      };
      
      const res = await fetch(`${API_BASE_URL}/seller/${sellerId}`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error(`Failed to update status: ${res.status}`);
      }
      
      await fetchSellers();
      alert(`Approval status updated to ${newStatus}!`);
    } catch (err) {
      setError('Error updating approval status: ' + err.message);
    }
  };

  const handleEdit = async (sellerId) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE_URL}/seller/${sellerId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const text = await response.text();
      let sellerData;

      try {
        sellerData = text ? JSON.parse(text) : {};
      } catch (e) {
        throw new Error(`Server returned non‑JSON: ${text.slice(0, 200)}`);
      }

      if (!response.ok) {
        const msg =
          sellerData.message ||
          sellerData.error ||
          `Status ${response.status} ${response.statusText}`;
        throw new Error(msg);
      }

      const processedData =
        sellerData.data?.seller ||
        sellerData.data ||
        sellerData.seller ||
        sellerData;

      setFormData({
        name: processedData.name || '',
        mobile: processedData.mobile || '',
        email: processedData.email || '',
        password: '',
        status: processedData.status || 'Active',
        approve_status: processedData.approve_status || 'Pending',
        device_token: processedData.device_token || 'default_device_token',
        subscription: processedData.subscription || 0,
        subscription_package_id: processedData.subscription_package_id || null,
        company_name: processedData.company_name || '',
        company_type: normalizeCompanyType(processedData.company_type || 'Proprietorship'),
        company_GST_number: processedData.company_GST_number || '',
        company_logo: null,
        company_website: processedData.company_website || '',
        IEC_code: processedData.IEC_code || '',
        annual_turnover: normalizeAnnualTurnover(processedData.annual_turnover || '20-50 lakh'),
        facebook_link: processedData.facebook_link || '',
        linkedin_link: processedData.linkedin_link || '',
        insta_link: processedData.insta_link || '',
        city: processedData.city || '',
        state: processedData.state || '',
        pincode: processedData.pincode || '',
        aadhar_number: processedData.aadhar_number || '',
        aadhar_front: null,
        aadhar_back: null,
        company_registration: null,
        company_pan_card: null,
        gst_certificate: null,
        cancelled_cheque_photo: null,
        bank_name: processedData.bank_name || '',
        bank_IFSC_code: processedData.bank_IFSC_code || '',
        account_number: processedData.account_number || '',
        account_type: processedData.account_type || '',
      });

      setFilePreviews({
        company_logo: processedData.company_logo ? toAbsoluteUrl(API_BASE_URL, processedData.company_logo) : '',
        aadhar_front: processedData.aadhar_front ? toAbsoluteUrl(API_BASE_URL, processedData.aadhar_front) : '',
        aadhar_back: processedData.aadhar_back ? toAbsoluteUrl(API_BASE_URL, processedData.aadhar_back) : '',
        company_registration: processedData.company_registration ? toAbsoluteUrl(API_BASE_URL, processedData.company_registration) : '',
        company_pan_card: processedData.company_pan_card ? toAbsoluteUrl(API_BASE_URL, processedData.company_pan_card) : '',
        gst_certificate: processedData.gst_certificate ? toAbsoluteUrl(API_BASE_URL, processedData.gst_certificate) : '',
        cancelled_cheque_photo: processedData.cancelled_cheque_photo ? toAbsoluteUrl(API_BASE_URL, processedData.cancelled_cheque_photo) : '',
      });

      setSelectedSeller(processedData);
      setShowEditModal(true);
    } catch (err) {
      console.error('Error in handleEdit:', err);
      setError('Error fetching seller details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (seller) => {
    setSelectedSeller(seller);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedSeller) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/seller/${selectedSeller.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete seller: ${response.status}`);
      }

      setError('Seller deleted successfully!');
      await fetchSellers();
      
    } catch (err) {
      console.error('Error deleting seller:', err);
      setError(err.message || 'An error occurred while deleting the seller');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
      setSelectedSeller(null);
    }
  };

  const handleViewHistory = async (seller) => {
    setSelectedSeller(seller);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryError('');
    setPackageHistory([]);
    try {
      const sellerId = seller.id;
      const response = await fetch(`${API_BASE_URL}/seller/package-history/${sellerId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.status}`);
      }
      
      const data = await response.json();
      let historyData = [];
      
      if (data.success && Array.isArray(data.data)) {
        historyData = data.data;
      } else if (Array.isArray(data.history)) {
        historyData = data.history;
      } else if (Array.isArray(data)) {
        historyData = data;
      } else if (data.data && Array.isArray(data.data)) {
        historyData = data.data;
      }
      
      historyData.sort((a, b) => {
        const dateA = new Date(a.created_at || a.start_date || 0);
        const dateB = new Date(b.created_at || b.start_date || 0);
        return dateB - dateA;
      });
      
      setPackageHistory(historyData);
    } catch (err) {
      setHistoryError('Failed to load package history: ' + err.message);
      setPackageHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEditProduct = (product) => {
    setProductFormData({
      name: product.name || '',
      detail: product.detail || '',
      price: product.price || '',
      moq: product.moq || '',
      status: product.status || 'Active',
      f_image: null,
    });
    setProductFilePreview(getProductImageUrl(product) || '');
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setShowProductDeleteModal(true);
  };

  const confirmDeleteProduct = async () => {
    if (!selectedProduct) return;
    try {
      setProductsLoading(true);
      const response = await fetch(`${API_BASE_URL}/product/${selectedProduct.id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete product');
      }
      
      if (selectedSeller) {
        await handleViewProducts(selectedSeller);
      }
      
      setShowProductDeleteModal(false);
      setSelectedProduct(null);
      alert('Product deleted successfully!');
    } catch (err) {
      setProductsError('Error deleting product: ' + err.message);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProductFileChange = (e) => {
    const { name, files } = e.target;
    const file = files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setProductsError('File too large. Maximum size is 5MB.');
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setProductsError('Only JPG, PNG, GIF allowed.');
      return;
    }
    
    setProductFormData(prev => ({ ...prev, [name]: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setProductFilePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const resetProductForm = () => {
    setProductFormData({
      name: '',
      detail: '',
      price: '',
      moq: '',
      status: 'Active',
      f_image: null,
    });
    setProductFilePreview('');
    setProductsError('');
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductsLoading(true);
    setProductsError('');
    try {
      if (!productFormData.name.trim()) throw new Error('Name is required');
      
      const url = `${API_BASE_URL}/product/${selectedProduct.id}`;
      const method = 'PATCH';
      
      const fd = new FormData();
      fd.append('name', productFormData.name.trim());
      fd.append('detail', productFormData.detail.trim());
      fd.append('price', productFormData.price);
      fd.append('moq', productFormData.moq);
      fd.append('status', productFormData.status);
      
      if (productFormData.f_image instanceof File) {
        fd.append('f_image', productFormData.f_image);
      }
      
      const res = await fetch(url, {
        method,
        headers: {
          'Accept': 'application/json'
        },
        body: fd,
      });
      
      if (!res.ok) {
        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { raw: text };
        }
        const msg = data?.message || data?.error || `${method} failed (${res.status})`;
        throw new Error(msg);
      }
      
      if (selectedSeller) {
        await handleViewProducts(selectedSeller);
      }
      
      setShowProductModal(false);
      setSelectedProduct(null);
      resetProductForm();
      alert('Product updated successfully!');
    } catch (err) {
      setProductsError(err.message || 'Failed to save product');
    } finally {
      setProductsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? (checked ? 1 : 0) : 
                     name === 'bank_IFSC_code' ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [name]: nextValue }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      password: '',
      status: 'Active',
      approve_status: 'Pending',
      device_token: 'default_device_token',
      subscription: 0,
      subscription_package_id: null,
      company_name: '',
      company_type: 'Proprietorship',
      company_GST_number: '',
      company_logo: null,
      company_website: '',
      IEC_code: '',
      annual_turnover: '20-50 lakh',
      facebook_link: '',
      linkedin_link: '',
      insta_link: '',
      city: '',
      state: '',
      pincode: '',
      aadhar_number: '',
      aadhar_front: null,
      aadhar_back: null,
      company_registration: null,
      company_pan_card: null,
      gst_certificate: null,
      cancelled_cheque_photo: null,
      bank_name: '',
      bank_IFSC_code: '',
      account_number: '',
      account_type: ''
    });
    
    setFilePreviews({
      company_logo: '',
      aadhar_front: '',
      aadhar_back: '',
      company_registration: '',
      company_pan_card: '',
      gst_certificate: '',
      cancelled_cheque_photo: ''
    });
    
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.name?.trim()) throw new Error('Name is required');
      if (!formData.mobile?.trim()) throw new Error('Mobile is required');
      if (!formData.email?.trim()) throw new Error('Email is required');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(formData.mobile)) {
        throw new Error('Please enter a valid 10-digit mobile number');
      }

      const isEdit = showEditModal && selectedSeller?.id;
      const url = isEdit
        ? `${API_BASE_URL}/seller/${selectedSeller.id}`
        : `${API_BASE_URL}/seller`;

      const method = isEdit ? 'PATCH' : 'POST';

      const fd = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (isEdit && key === 'password' && !value) {
          return;
        }
        if (value !== null && value !== undefined) {
          if (value instanceof File) {
            fd.append(key, value);
          } else if (typeof value === 'object' && !(value instanceof File)) {
            fd.append(key, JSON.stringify(value));
          } else {
            fd.append(key, value);
          }
        }
      });

      const response = await fetch(url, {
        method,
        body: fd,
      });

      const responseText = await response.text();
      const responseData = safeParseJson(responseText);

      if (!response.ok) {
        const errorMsg =
          responseData.message ||
          responseData.error ||
          (typeof responseData.raw === 'string' ? responseData.raw : null) ||
          `Failed to ${isEdit ? 'update' : 'create'} seller`;
        throw new Error(errorMsg);
      }

      setError(`Seller ${isEdit ? 'updated' : 'created'} successfully!`);
      await fetchSellers();

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      console.error('Error saving seller:', err);
      setError(err.message || 'An error occurred while saving the seller');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews(prev => ({
            ...prev,
            [name]: reader.result
          }));
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreviews(prev => ({
          ...prev,
          [name]: file.name
        }));
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Seller Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage all your seller accounts with subscription details</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md font-medium"
            >
              <FiPlus className="text-lg" />
              <span className="hidden sm:inline">Add Seller</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Total Sellers</h2>
              <p className="text-3xl font-bold text-gray-900 mt-2">{sellers.length}</p>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Approved: {sellers.filter(s => s.approve_status === 'Approved').length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Pending: {sellers.filter(s => s.approve_status === 'Pending').length}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUser className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search sellers by ID, name, email, mobile, package, or company..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <FiAlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium whitespace-pre-line">{error}</p>
            </div>
            <button onClick={() => setError('')} className="ml-3 text-red-500 hover:text-red-700">
              <FiX className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* Products Error */}
      {productsError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <FiAlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium whitespace-pre-line">{productsError}</p>
            </div>
            <button onClick={() => setProductsError('')} className="ml-3 text-red-500 hover:text-red-700">
              <FiX className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading sellers...</p>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="text-center py-12">
            <FiUser className="mx-auto text-gray-400 text-5xl mb-4" />
            <p className="text-gray-600 text-lg">
              {searchTerm ? 'No sellers match your search' : 'No sellers yet'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Clear search
              </button>
            )}
            {!searchTerm && (
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg inline-flex items-center gap-2 transition-all shadow-sm hover:shadow-md font-medium"
              >
                <FiPlus />
                Add Your First Seller
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="w-48 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller Info</th>
                  <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Website</th>
                  <th className="w-24 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                  <th className="w-40 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                  <th className="w-32 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="w-24 px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
              {filteredSellers.map((seller, index) => (
  <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                 <td className="px-2 py-3 whitespace-nowrap text-xs font-medium text-gray-900 w-16">
  {index + 1}
</td>
                    <td className="px-2 py-3 w-48">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-xs">
                            {seller.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-gray-900 truncate" title={seller.name}>
                            {seller.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 truncate" title={seller.email}>
                            {seller.email || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400 truncate" title={seller.mobile}>
                            {seller.mobile || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-32">
                      <div className="text-xs font-medium text-gray-900 truncate" title={seller.company_name}>
                        {seller.company_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-28">
                      {seller.company_website ? (
                        <a
                          href={seller.company_website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 truncate block max-w-full"
                          title={seller.company_website}
                        >
                          {seller.company_website}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-24">
                      <select
                        value={seller.approve_status || 'Pending'}
                        onChange={(e) => handleApprovalStatusChange(seller.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-full"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-40">
                      {seller.package_name && seller.package_name !== 'No Package' ? (
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 bg-green-500 rounded-full"></div>
                          <div>
                            <div className="text-xs font-medium text-gray-900 truncate" title={seller.package_name}>
                              {seller.package_name}
                            </div>
                            <button
                              onClick={() => handleViewHistory(seller)}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-1"
                            >
                              <FiClock className="text-xs" />
                              History
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 bg-gray-400 rounded-full"></div>
                          <div>
                            <span className="text-xs text-gray-500">No Package</span>
                            <button
                              onClick={() => handleViewHistory(seller)}
                              className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-1"
                            >
                              <FiClock className="text-xs" />
                              History
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap w-32">
                      <div className="flex items-center gap-1">
                        <FiCalendar className="text-gray-400 text-xs" />
                        <div className="text-xs">
                          {formatSubscriptionEndDate(seller.subscription_end_date)}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap w-24">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleView(seller.id)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-1.5 rounded transition-colors"
                          title="View"
                        >
                          <FiEye className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleEdit(seller.id)}
                          className="bg-green-100 hover:bg-green-200 text-green-700 p-1.5 rounded transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleDelete(seller)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 p-1.5 rounded transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="text-xs" />
                        </button>
                        <button
                          onClick={() => handleViewProducts(seller)}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-700 p-1.5 rounded transition-colors"
                          title="Products"
                        >
                          <FiPackage className="text-xs" />
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

      {sellers.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredSellers.length} of {sellers.length} seller{filteredSellers.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FiUser className="text-white" />
                Seller Details - {selectedSeller.name}
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {/* Seller Information */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FiUser className="text-white" />
                  </div>
                  Seller Information
                </h3>
                <div className="space-y-1 bg-white rounded-lg p-4">
                  <InfoField label="Name" value={selectedSeller.name} />
                  <InfoField label="Mobile" value={selectedSeller.mobile} />
                  <InfoField label="Email" value={selectedSeller.email} />
                  <div className="py-2 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-sm font-medium text-gray-600">Status</span>
                      <StatusBadge status={selectedSeller.status} />
                    </div>
                  </div>
                  <div className="py-2 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-sm font-medium text-gray-600">Approval Status</span>
                      <ApproveStatusBadge status={selectedSeller.approve_status} />
                    </div>
                  </div>
                  <InfoField label="Subscription Package" value={selectedSeller.package_name} />
                  <InfoField label="Subscription End Date" value={selectedSeller.subscription_end_date} type="date" />
                  <InfoField label="Created Date" value={selectedSeller.created_at} type="date" />
                  <InfoField label="Updated Date" value={selectedSeller.updated_at} type="date" />
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                    <FiBriefcase className="text-white" />
                  </div>
                  Company Information
                </h3>
                <div className="space-y-1 bg-white rounded-lg p-4">
                  <InfoField label="Company Name" value={selectedSeller.company_name} />
                  <InfoField label="Company Type" value={selectedSeller.company_type} />
                  <InfoField label="GST Number" value={selectedSeller.company_GST_number} />
                  <InfoField label="Website" value={selectedSeller.company_website} />
                  <InfoField label="IEC Code" value={selectedSeller.IEC_code} />
                  <InfoField label="Annual Turnover" value={normalizeAnnualTurnover(selectedSeller.annual_turnover)} />
                  <InfoField label="Facebook" value={selectedSeller.facebook_link} />
                  <InfoField label="LinkedIn" value={selectedSeller.linkedin_link} />
                  <InfoField label="Instagram" value={selectedSeller.insta_link} />
                  <InfoField label="City" value={selectedSeller.city} />
                  <InfoField label="State" value={selectedSeller.state} />
                  <InfoField label="Pincode" value={selectedSeller.pincode} />
                  {selectedSeller.company_logo && (
                    <div className="py-2 border-t border-gray-100 mt-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <span className="text-sm font-medium text-gray-600">Company Logo</span>
                        <a
                          href={toAbsoluteUrl(API_BASE_URL, selectedSeller.company_logo)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={toAbsoluteUrl(API_BASE_URL, selectedSeller.company_logo)}
                            alt="Company Logo"
                            className="h-16 w-16 rounded object-cover border-2 border-gray-300 hover:border-green-500 cursor-pointer transition-all"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = PLACEHOLDER_IMG;
                            }}
                          />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* KYC Documents */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
                    <FiFileText className="text-white" />
                  </div>
                  KYC Documents
                </h3>
                <div className="bg-white rounded-lg p-4">
                  <InfoField label="Aadhar Number" value={selectedSeller.aadhar_number} />
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                    <ImagePreview
                      src={toAbsoluteUrl(API_BASE_URL, selectedSeller.aadhar_front)}
                      alt="Aadhar Front"
                      label="Aadhar Front"
                    />
                    <ImagePreview
                      src={toAbsoluteUrl(API_BASE_URL, selectedSeller.aadhar_back)}
                      alt="Aadhar Back"
                      label="Aadhar Back"
                    />
                    <ImagePreview
                      src={toAbsoluteUrl(API_BASE_URL, selectedSeller.company_pan_card)}
                      alt="PAN Card"
                      label="PAN Card"
                    />
                    <ImagePreview
                      src={toAbsoluteUrl(API_BASE_URL, selectedSeller.gst_certificate)}
                      alt="GST Certificate"
                      label="GST Certificate"
                    />
                    <ImagePreview
                      src={toAbsoluteUrl(API_BASE_URL, selectedSeller.company_registration)}
                      alt="Registration"
                      label="Registration"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Information */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center">
                    <FiCreditCard className="text-white" />
                  </div>
                  Bank Information
                </h3>
                <div className="space-y-1 bg-white rounded-lg p-4">
                  <InfoField label="Bank Name" value={selectedSeller.bank_name} />
                  <InfoField label="IFSC Code" value={selectedSeller.bank_IFSC_code} />
                  <InfoField label="Account Number" value={selectedSeller.account_number} />
                  <InfoField label="Account Type" value={selectedSeller.account_type} />
                  {selectedSeller.cancelled_cheque_photo && (
                    <div className="py-2 border-t border-gray-100 mt-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                        <span className="text-sm font-medium text-gray-600">Cancelled Cheque</span>
                        <a
                          href={toAbsoluteUrl(API_BASE_URL, selectedSeller.cancelled_cheque_photo)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={toAbsoluteUrl(API_BASE_URL, selectedSeller.cancelled_cheque_photo)}
                            alt="Cancelled Cheque"
                            className="h-16 w-32 object-cover rounded border-2 border-gray-300 hover:border-orange-500 cursor-pointer transition-all"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = PLACEHOLDER_IMG;
                            }}
                          />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-4 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => handleViewProducts(selectedSeller)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <FiPackage />
                View Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl my-8">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl sticky top-0 z-10">
              <h2 className="text-xl font-semibold text-white">
                {showAddModal ? '➕ Add New Seller' : '✏️ Edit Seller'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto">
              <div className="space-y-8">
                {/* Seller Information */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <FiUser className="text-white" />
                    </div>
                    Seller Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="Enter seller name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        required
                        maxLength="10"
                        pattern="[0-9]{10}"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="10-digit mobile number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder="seller@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password {showAddModal && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={showAddModal}
                        minLength="6"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        placeholder={showEditModal ? "Leave blank to keep current" : "Min 6 characters"}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
                      <select
                        name="approve_status"
                        value={formData.approve_status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Package</label>
                      <select
                        name="subscription_package_id"
                        value={formData.subscription_package_id || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="">No Package</option>
                        {subscriptionPackages.map(pkg => (
                          <option key={pkg.id} value={pkg.id}>
                            {(pkg.package_name || pkg.name || pkg.title) + ' - ₹' + (pkg.package_price || pkg.price || '')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Company Information */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <FiBriefcase className="text-white" />
                    </div>
                    Company Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Type</label>
                      <select
                        name="company_type"
                        value={formData.company_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                      >
                        {COMPANY_TYPE_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                      <input
                        type="text"
                        name="company_GST_number"
                        value={formData.company_GST_number}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        name="company_website"
                        value={formData.company_website}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IEC Code</label>
                      <input
                        type="text"
                        name="IEC_code"
                        value={formData.IEC_code}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="Enter IEC code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Annual Turnover</label>
                      <select
                        name="annual_turnover"
                        value={formData.annual_turnover}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                      >
                        <option value="below 20 lakh">below 20 lakh</option>
                        <option value="20-50 lakh">20-50 lakh</option>
                        <option value="50-1 cr">50-1 cr</option>
                        <option value="1-5 cr">1-5 cr</option>
                        <option value="5-10 cr">5-10 cr</option>
                        <option value="10-20 cr">10-20 cr</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="Enter city"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="Enter state"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        maxLength="6"
                        pattern="[0-9]{6}"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="6-digit pincode"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                      <input
                        type="url"
                        name="facebook_link"
                        value={formData.facebook_link}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="Facebook profile URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                      <input
                        type="url"
                        name="linkedin_link"
                        value={formData.linkedin_link}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="LinkedIn profile URL"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                      <input
                        type="url"
                        name="insta_link"
                        value={formData.insta_link}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                        placeholder="Instagram profile URL"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <FileUpload
                        name="company_logo"
                        label="Company Logo"
                        preview={filePreviews.company_logo}
                      />
                    </div>
                  </div>
                </div>

                {/* KYC Information */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <FiFileText className="text-white" />
                    </div>
                    KYC Documents
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                      <input
                        type="text"
                        name="aadhar_number"
                        value={formData.aadhar_number}
                        onChange={handleInputChange}
                        maxLength="12"
                        pattern="[0-9]{12}"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                        placeholder="12-digit Aadhar number"
                      />
                    </div>
                    <div></div>
                    <FileUpload
                      name="aadhar_front"
                      label="Aadhar Front"
                      accept="image/*"
                      preview={filePreviews.aadhar_front}
                    />
                    <FileUpload
                      name="aadhar_back"
                      label="Aadhar Back"
                      accept="image/*"
                      preview={filePreviews.aadhar_back}
                    />
                    <FileUpload
                      name="gst_certificate"
                      label="GST Certificate"
                      accept="image/*,application/pdf"
                      preview={filePreviews.gst_certificate}
                    />
                    <FileUpload
                      name="company_registration"
                      label="Company Registration"
                      accept="image/*,application/pdf"
                      preview={filePreviews.company_registration}
                    />
                    <FileUpload
                      name="company_pan_card"
                      label="Company PAN Card"
                      accept="image/*,application/pdf"
                      preview={filePreviews.company_pan_card}
                    />
                  </div>
                </div>

                {/* Bank Information */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center">
                      <FiCreditCard className="text-white" />
                    </div>
                    Bank Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        name="bank_name"
                        value={formData.bank_name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        placeholder="Enter bank name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                      <input
                        type="text"
                        name="bank_IFSC_code"
                        value={formData.bank_IFSC_code}
                        onChange={handleInputChange}
                        maxLength="11"
                        pattern="[A-Z]{4}0[A-Z0-9]{6}"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        placeholder="SBIN0001234"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                      <input
                        type="text"
                        name="account_number"
                        value={formData.account_number}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                        placeholder="Enter account number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                      <select
                        name="account_type"
                        value={formData.account_type}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                      >
                        <option value="">Select Type</option>
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                        <option value="Salary">Salary</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <FileUpload
                        name="cancelled_cheque_photo"
                        label="Cancelled Cheque Photo"
                        accept="image/*,application/pdf"
                        preview={filePreviews.cancelled_cheque_photo}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-8 pt-6 border-t sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {showAddModal ? 'Creating...' : 'Updating...'}
                    </span>
                  ) : (
                    showAddModal ? '✓ Create Seller' : '✓ Update Seller'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FiTrash2 className="text-red-600 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Delete Seller</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to delete <strong className="text-gray-900">{selectedSeller.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedSeller(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-4 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Deleting...
                    </span>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Modal */}
      {showProductsModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FiPackage className="text-white" />
                Products - {selectedSeller.name}
                <span className="text-sm font-normal bg-white bg-opacity-20 px-2 py-1 rounded">
                  {sellerProducts.length} product{sellerProducts.length !== 1 ? 's' : ''}
                </span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewProducts(selectedSeller)}
                  className="bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                  title="Refresh Products"
                >
                  <FiRefreshCw className="text-sm" />
                </button>
                <button
                  onClick={() => {
                    setShowProductsModal(false);
                    setSelectedSeller(null);
                    setSellerProducts([]);
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {productsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : productsError ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div className="flex items-start">
                    <FiAlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-800 font-medium">Failed to load products</p>
                      <p className="text-red-600 text-sm mt-1">{productsError}</p>
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">Possible reasons:</p>
                        <ul className="text-sm text-gray-600 list-disc pl-5">
                          <li>Products endpoint might not exist</li>
                          <li>API endpoint path might be different</li>
                          <li>No products added for this seller yet</li>
                        </ul>
                        <button
                          onClick={() => handleViewProducts(selectedSeller)}
                          className="mt-3 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : sellerProducts.length === 0 ? (
                <div className="text-center py-12">
                  <FiPackage className="mx-auto text-gray-400 text-5xl mb-4" />
                  <p className="text-gray-600 text-lg">No products found for this seller</p>
                  <p className="text-gray-500 text-sm mt-2">Products will appear here once added</p>
                </div>
              ) : (
                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.NO</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IMAGE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRODUCT NAME</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DETAILS</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PRICE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MOQ</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sellerProducts.map((product, index) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ProductImage product={product} className="h-12 w-12" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate" title={product.name}>
                              {product.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500 max-w-xs truncate" title={product.detail}>
                              {product.detail || 'No description'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-purple-600">
                              {product.price ? `₹${product.price}` : 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {product.moq || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={product.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEditProduct(product)}
                                className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors"
                                title="Edit Product"
                              >
                                <FiEdit2 className="text-sm" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product)}
                                className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"
                                title="Delete Product"
                              >
                                <FiTrash2 className="text-sm" />
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
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowProductsModal(false);
                  setSelectedSeller(null);
                  setSellerProducts([]);
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-4 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      {showProductModal && selectedSeller && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md my-8">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700 rounded-t-xl">
              <h2 className="text-xl font-semibold text-white">Edit Product</h2>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  resetProductForm();
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seller</label>
                  <input
                    type="text"
                    value={selectedSeller.name}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={productFormData.name}
                    onChange={handleProductInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="detail"
                    value={productFormData.detail}
                    onChange={handleProductInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      name="price"
                      value={productFormData.price}
                      onChange={handleProductInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., 150"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MOQ</label>
                    <input
                      type="number"
                      name="moq"
                      value={productFormData.moq}
                      onChange={handleProductInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g., 1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={productFormData.status}
                    onChange={handleProductInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <ProductFileUpload
                    name="f_image"
                    label="Featured Image"
                    preview={productFilePreview}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowProductModal(false);
                    resetProductForm();
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-4 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productsLoading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {productsLoading ? 'Saving...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Delete Confirmation Modal */}
      {showProductDeleteModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <FiTrash2 className="text-red-600 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Delete Product</h3>
              </div>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Are you sure you want to delete <strong className="text-gray-900">{selectedProduct.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProductDeleteModal(false);
                    setSelectedProduct(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-4 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteProduct}
                  disabled={productsLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {productsLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Package History Modal */}
      {showHistoryModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-orange-600 to-orange-700">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FiClock className="text-white" />
                Subscription Package History - {selectedSeller.name}
                <span className="text-sm font-normal bg-white bg-opacity-20 px-2 py-1 rounded">
                  {packageHistory.length} record{packageHistory.length !== 1 ? 's' : ''}
                </span>
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewHistory(selectedSeller)}
                  className="bg-white hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg transition-colors flex items-center gap-1"
                  title="Refresh History"
                >
                  <FiRefreshCw className="text-sm" />
                </button>
                <button
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedSeller(null);
                    setPackageHistory([]);
                    setHistoryError('');
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                  <p className="text-gray-600">Loading package history...</p>
                </div>
              ) : historyError ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <div className="flex items-start">
                    <FiAlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-800 font-medium">Error loading package history</p>
                      <p className="text-red-600 text-sm mt-1">{historyError}</p>
                      <button
                        onClick={() => handleViewHistory(selectedSeller)}
                        className="mt-3 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </div>
              ) : packageHistory.length === 0 ? (
                <div className="text-center py-12">
                  <FiClock className="mx-auto text-gray-400 text-5xl mb-4" />
                  <p className="text-gray-600 text-lg">No subscription history found for this seller</p>
                  <p className="text-gray-500 text-sm mt-2">Package purchases will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {packageHistory.map((history, index) => {
                    const packageName = history.package_name || history.packageName || history.package?.name || 'Package';
                    const packageDesc = history.package_description || history.packageDescription || history.description || history.package?.description || '';
                    const status = history.status || 'Unknown';
                    const price = history.price || history.package_price || history.packagePrice || history.amount || history.package?.price || null;
                    const startDate = history.start_date || history.startDate || history.package_start_date || history.created_at || null;
                    const endDate = history.end_date || history.endDate || history.package_end_date || history.expiry_date || null;
                    const paymentMethod = history.payment_method || history.paymentMethod || history.payment_mode || null;
                    const transactionId = history.transaction_id || history.transactionId || history.payment_id || null;
                    const notes = history.notes || history.remarks || null;

                    return (
                      <div key={history.id || index} className="relative pb-8 last:pb-0">
                        {index !== packageHistory.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                        )}
                        <div className="relative flex items-start space-x-3">
                          <div className="relative">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              status === 'Active' || status === 'active' ? 'bg-green-500' :
                              status === 'Expired' || status === 'expired' ? 'bg-red-500' :
                              'bg-gray-400'
                            }`}>
                              <FiPackage className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
                                    {packageName}
                                    <HistoryStatusBadge status={status} />
                                  </h4>
                                  {packageDesc && (
                                    <p className="text-sm text-gray-600 mt-1">{packageDesc}</p>
                                  )}
                                </div>
                                {price && (
                                  <div className="bg-white px-4 py-2 rounded-lg border border-orange-300 shadow-sm">
                                    <div className="text-xs text-gray-500">Price</div>
                                    <div className="text-xl font-bold text-orange-600">₹{price}</div>
                                  </div>
                                )}
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {startDate && (
                                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                      <FiCalendar className="text-blue-500" />
                                      Start Date
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatHistoryDate(startDate)}
                                    </div>
                                  </div>
                                )}
                                {endDate && (
                                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                      <FiCalendar className="text-red-500" />
                                      End Date
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatHistoryDate(endDate)}
                                    </div>
                                  </div>
                                )}
                                {startDate && endDate && (
                                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                      <FiClock className="text-purple-500" />
                                      Duration
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {calculateDuration(startDate, endDate)}
                                    </div>
                                  </div>
                                )}
                                {paymentMethod && (
                                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                      <FiCreditCard className="text-green-500" />
                                      Payment
                                    </div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {paymentMethod}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {(transactionId || notes) && (
                                <div className="mt-4 pt-4 border-t border-orange-200">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {transactionId && (
                                      <div>
                                        <span className="text-xs text-gray-500">Transaction ID:</span>
                                        <div className="text-sm font-mono text-gray-700 mt-1">
                                          {transactionId}
                                        </div>
                                      </div>
                                    )}
                                    {notes && (
                                      <div>
                                        <span className="text-xs text-gray-500">Notes:</span>
                                        <div className="text-sm text-gray-700 mt-1">
                                          {notes}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedSeller(null);
                  setPackageHistory([]);
                  setHistoryError('');
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-4 rounded-lg transition-colors font-medium"
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

export default Seller;
