// components/Seller.jsx
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
  FiPlus, 
  FiImage, 
  FiPackage, 
  FiEye, 
  FiAlertCircle,
  FiUserCheck,
  FiCheckCircle 
} from 'react-icons/fi';

// API Base URL
const API_BASE_URL = 'http://rettalion.apxfarms.com';

const Seller = () => {
  const [sellers, setSellers] = useState([]);
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
  const [debugMode, setDebugMode] = useState(false);

  // Form states
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
    annual_turnover: '20-50_lakh',
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

  // File preview states
  const [filePreviews, setFilePreviews] = useState({
    company_logo: '',
    aadhar_front: '',
    aadhar_back: '',
    company_registration: '',
    company_pan_card: '',
    gst_certificate: '',
    cancelled_cheque_photo: ''
  });

  // Fetch sellers from API
  const fetchSellers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/sellers`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sellers: ${response.status}`);
      }
      
      const data = await response.json();
      if (debugMode) console.log('Fetched sellers:', data);
      setSellers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Error fetching sellers: ' + err.message);
      console.error('Fetch error:', err);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  // Handle view seller details
  const handleView = async (sellerId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/seller/${sellerId}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch seller details');
      }
      
      const sellerData = await response.json();
      if (debugMode) console.log('Seller details:', sellerData);
      setSelectedSeller(sellerData);
      setShowViewModal(true);
    } catch (err) {
      setError('Error fetching seller details: ' + err.message);
      console.error('View error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit seller
  const handleEdit = async (sellerId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/seller/${sellerId}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch seller details');
      }
      
      const sellerData = await response.json();
      if (debugMode) console.log('Editing seller:', sellerData);
      
      setFormData({
        name: sellerData.seller?.name || '',
        mobile: sellerData.seller?.mobile || '',
        email: sellerData.seller?.email || '',
        password: '',
        status: sellerData.seller?.status || 'Active',
        approve_status: sellerData.seller?.approve_status || 'Pending',
        device_token: sellerData.seller?.device_token || 'default_device_token',
        subscription: sellerData.seller?.subscription || 0,
        subscription_package_id: sellerData.seller?.subscription_package_id || null,
        company_name: sellerData.company?.company_name || '',
        company_type: sellerData.company?.company_type || 'Proprietorship',
        company_GST_number: sellerData.company?.company_GST_number || '',
        company_logo: null,
        company_website: sellerData.company?.company_website || '',
        IEC_code: sellerData.company?.IEC_code || '',
        annual_turnover: sellerData.company?.annual_turnover || '20-50_lakh',
        facebook_link: sellerData.company?.facebook_link || '',
        linkedin_link: sellerData.company?.linkedin_link || '',
        insta_link: sellerData.company?.insta_link || '',
        city: sellerData.company?.city || '',
        state: sellerData.company?.state || '',
        pincode: sellerData.company?.pincode || '',
        aadhar_number: sellerData.kyc?.aadhar_number || '',
        aadhar_front: null,
        aadhar_back: null,
        company_registration: null,
        company_pan_card: null,
        gst_certificate: null,
        cancelled_cheque_photo: null,
        bank_name: sellerData.bank?.bank_name || '',
        bank_IFSC_code: sellerData.bank?.bank_IFSC_code || '',
        account_number: sellerData.bank?.account_number || '',
        account_type: sellerData.bank?.account_type || ''
      });

      setFilePreviews({
        company_logo: sellerData.company?.company_logo ? `${API_BASE_URL}${sellerData.company.company_logo}` : '',
        aadhar_front: sellerData.kyc?.aadhar_front ? `${API_BASE_URL}${sellerData.kyc.aadhar_front}` : '',
        aadhar_back: sellerData.kyc?.aadhar_back ? `${API_BASE_URL}${sellerData.kyc.aadhar_back}` : '',
        company_registration: sellerData.kyc?.company_registration ? `${API_BASE_URL}${sellerData.kyc.company_registration}` : '',
        company_pan_card: sellerData.kyc?.company_pan_card ? `${API_BASE_URL}${sellerData.kyc.company_pan_card}` : '',
        gst_certificate: sellerData.kyc?.gst_certificate ? `${API_BASE_URL}${sellerData.kyc.gst_certificate}` : '',
        cancelled_cheque_photo: sellerData.bank?.cancelled_cheque_photo ? `${API_BASE_URL}${sellerData.bank.cancelled_cheque_photo}` : ''
      });
      
      setSelectedSeller(sellerData);
      setShowEditModal(true);
    } catch (err) {
      setError('Error fetching seller details: ' + err.message);
      console.error('Edit error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle delete seller
  const handleDelete = (seller) => {
    setSelectedSeller(seller);
    setShowDeleteModal(true);
  };

  // Handle view products
  const handleViewProducts = async (seller) => {
    setSelectedSeller(seller);
    setShowProductsModal(true);
    setProductsLoading(true);
    setProductsError('');
    setSellerProducts([]);
    
    try {
      const response = await fetch(`${API_BASE_URL}/product_seller/${seller.id}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const data = await response.json();
      if (debugMode) console.log('Products response:', data);
      
      if (data.success && Array.isArray(data.data)) {
        setSellerProducts(data.data);
      } else {
        setSellerProducts([]);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setProductsError('Failed to load products: ' + err.message);
      setSellerProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Confirm delete
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete seller');
      }

      await fetchSellers();
      setShowDeleteModal(false);
      setSelectedSeller(null);
      setError('');
    } catch (err) {
      setError('Error deleting seller: ' + err.message);
      console.error('Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };

  // Handle file input changes
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size is 5MB.`);
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError(`File ${file.name} is not a valid image. Only JPG, PNG, and GIF are allowed.`);
        return;
      }

      setFormData(prev => ({
        ...prev,
        [name]: file
      }));

      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviews(prev => ({
          ...prev,
          [name]: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset form
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
      annual_turnover: '20-50_lakh',
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

  // Handle form submission with multiple strategies
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name.trim()) throw new Error('Name is required');
      if (!formData.mobile.trim()) throw new Error('Mobile is required');
      if (!formData.email.trim()) throw new Error('Email is required');
      if (showAddModal && !formData.password) throw new Error('Password is required for new sellers');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) throw new Error('Please enter a valid email address');

      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(formData.mobile)) throw new Error('Please enter a valid 10-digit mobile number');

      let url = `${API_BASE_URL}/seller`;
      let method = 'POST';

      if (showEditModal && selectedSeller?.seller?.id) {
        url = `${API_BASE_URL}/seller/${selectedSeller.seller.id}`;
        method = 'PATCH';
      }

      console.log(`🚀 Submitting to ${url} with method ${method}`);

      let response;
      let success = false;

      // Strategy 1: Try FormData (multipart/form-data)
      if (!success) {
        try {
          console.log('📦 Strategy 1: Trying FormData (multipart/form-data)...');
          const formDataPayload = new FormData();
          
          // Add all text fields
          formDataPayload.append('name', formData.name.trim());
          formDataPayload.append('mobile', formData.mobile.trim());
          formDataPayload.append('email', formData.email.trim());
          if (formData.password) formDataPayload.append('password', formData.password);
          formDataPayload.append('status', formData.status);
          formDataPayload.append('approve_status', formData.approve_status);
          formDataPayload.append('device_token', formData.device_token);
          formDataPayload.append('subscription', formData.subscription.toString());

          // Add optional fields only if they have values
          if (formData.company_name) formDataPayload.append('company_name', formData.company_name.trim());
          if (formData.company_type) formDataPayload.append('company_type', formData.company_type);
          if (formData.company_GST_number) formDataPayload.append('company_GST_number', formData.company_GST_number.trim());
          if (formData.company_website) formDataPayload.append('company_website', formData.company_website.trim());
          if (formData.IEC_code) formDataPayload.append('IEC_code', formData.IEC_code.trim());
          if (formData.annual_turnover) formDataPayload.append('annual_turnover', formData.annual_turnover);
          if (formData.facebook_link) formDataPayload.append('facebook_link', formData.facebook_link.trim());
          if (formData.linkedin_link) formDataPayload.append('linkedin_link', formData.linkedin_link.trim());
          if (formData.insta_link) formDataPayload.append('insta_link', formData.insta_link.trim());
          if (formData.city) formDataPayload.append('city', formData.city.trim());
          if (formData.state) formDataPayload.append('state', formData.state.trim());
          if (formData.pincode) formDataPayload.append('pincode', formData.pincode.trim());

          // Add files
          if (formData.company_logo) formDataPayload.append('company_logo', formData.company_logo);
          if (formData.aadhar_number) formDataPayload.append('aadhar_number', formData.aadhar_number.trim());
          if (formData.aadhar_front) formDataPayload.append('aadhar_front', formData.aadhar_front);
          if (formData.aadhar_back) formDataPayload.append('aadhar_back', formData.aadhar_back);
          if (formData.company_registration) formDataPayload.append('company_registration', formData.company_registration);
          if (formData.company_pan_card) formDataPayload.append('company_pan_card', formData.company_pan_card);
          if (formData.gst_certificate) formDataPayload.append('gst_certificate', formData.gst_certificate);
          if (formData.bank_name) formDataPayload.append('bank_name', formData.bank_name.trim());
          if (formData.bank_IFSC_code) formDataPayload.append('bank_IFSC_code', formData.bank_IFSC_code.trim());
          if (formData.account_number) formDataPayload.append('account_number', formData.account_number.trim());
          if (formData.account_type) formDataPayload.append('account_type', formData.account_type);
          if (formData.cancelled_cheque_photo) formDataPayload.append('cancelled_cheque_photo', formData.cancelled_cheque_photo);

          if (debugMode) {
            console.log('FormData contents:');
            for (let [key, value] of formDataPayload.entries()) {
              console.log(`  ${key}:`, typeof value === 'object' && value instanceof File ? `File(${value.name})` : value);
            }
          }

          response = await fetch(url, {
            method: method,
            body: formDataPayload,
          });

          if (response.ok) {
            console.log('✅ FormData strategy succeeded');
            success = true;
          } else {
            const errorText = await response.text();
            console.log('❌ FormData strategy failed:', response.status, errorText);
          }
        } catch (err) {
          console.log('❌ FormData strategy error:', err.message);
        }
      }

      // Strategy 2: Try JSON with nested structure (matching API response format)
      if (!success) {
        try {
          console.log('📦 Strategy 2: Trying JSON with nested structure...');
          const jsonPayload = {
            seller: {
              name: formData.name.trim(),
              mobile: formData.mobile.trim(),
              email: formData.email.trim(),
              password: formData.password || undefined,
              status: formData.status,
              approve_status: formData.approve_status,
              device_token: formData.device_token,
              subscription: formData.subscription,
              subscription_package_id: null
            },
            company: formData.company_name ? {
              company_name: formData.company_name.trim(),
              company_type: formData.company_type,
              company_GST_number: formData.company_GST_number || '',
              company_website: formData.company_website || '',
              IEC_code: formData.IEC_code || '',
              annual_turnover: formData.annual_turnover,
              facebook_link: formData.facebook_link || '',
              linkedin_link: formData.linkedin_link || '',
              insta_link: formData.insta_link || '',
              city: formData.city || '',
              state: formData.state || '',
              pincode: formData.pincode || ''
            } : undefined,
            kyc: formData.aadhar_number ? {
              aadhar_number: formData.aadhar_number.trim()
            } : undefined,
            bank: formData.bank_name ? {
              bank_name: formData.bank_name.trim(),
              bank_IFSC_code: formData.bank_IFSC_code || '',
              account_number: formData.account_number || '',
              account_type: formData.account_type || ''
            } : undefined
          };

          // Remove undefined values
          Object.keys(jsonPayload).forEach(key => 
            jsonPayload[key] === undefined && delete jsonPayload[key]
          );

          if (debugMode) console.log('Nested JSON payload:', JSON.stringify(jsonPayload, null, 2));

          response = await fetch(url, {
            method: method,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(jsonPayload),
          });

          if (response.ok) {
            console.log('✅ Nested JSON strategy succeeded');
            success = true;
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.log('❌ Nested JSON strategy failed:', response.status, errorData);
          }
        } catch (err) {
          console.log('❌ Nested JSON strategy error:', err.message);
        }
      }

      // Strategy 3: Try JSON with flat structure
      if (!success) {
        try {
          console.log('📦 Strategy 3: Trying JSON with flat structure...');
          const flatPayload = {
            name: formData.name.trim(),
            mobile: formData.mobile.trim(),
            email: formData.email.trim(),
            password: formData.password || undefined,
            status: formData.status,
            approve_status: formData.approve_status,
            device_token: formData.device_token,
            subscription: formData.subscription,
            subscription_package_id: null
          };

          // Add optional fields
          if (formData.company_name) {
            Object.assign(flatPayload, {
              company_name: formData.company_name.trim(),
              company_type: formData.company_type,
              company_GST_number: formData.company_GST_number || '',
              company_website: formData.company_website || '',
              IEC_code: formData.IEC_code || '',
              annual_turnover: formData.annual_turnover,
              facebook_link: formData.facebook_link || '',
              linkedin_link: formData.linkedin_link || '',
              insta_link: formData.insta_link || '',
              city: formData.city || '',
              state: formData.state || '',
              pincode: formData.pincode || ''
            });
          }

          if (formData.aadhar_number) {
            flatPayload.aadhar_number = formData.aadhar_number.trim();
          }

          if (formData.bank_name) {
            Object.assign(flatPayload, {
              bank_name: formData.bank_name.trim(),
              bank_IFSC_code: formData.bank_IFSC_code || '',
              account_number: formData.account_number || '',
              account_type: formData.account_type || ''
            });
          }

          // Remove undefined values
          Object.keys(flatPayload).forEach(key => 
            flatPayload[key] === undefined && delete flatPayload[key]
          );

          if (debugMode) console.log('Flat JSON payload:', JSON.stringify(flatPayload, null, 2));

          response = await fetch(url, {
            method: method,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(flatPayload),
          });

          if (response.ok) {
            console.log('✅ Flat JSON strategy succeeded');
            success = true;
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.log('❌ Flat JSON strategy failed:', response.status, errorData);
          }
        } catch (err) {
          console.log('❌ Flat JSON strategy error:', err.message);
        }
      }

      // Strategy 4: Try minimal required fields only
      if (!success) {
        try {
          console.log('📦 Strategy 4: Trying minimal required fields...');
          const minimalPayload = {
            name: formData.name.trim(),
            mobile: formData.mobile.trim(),
            email: formData.email.trim(),
            password: formData.password
          };

          if (debugMode) console.log('Minimal payload:', JSON.stringify(minimalPayload, null, 2));

          response = await fetch(url, {
            method: method,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(minimalPayload),
          });

          if (response.ok) {
            console.log('✅ Minimal strategy succeeded');
            success = true;
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.log('❌ Minimal strategy failed:', response.status, errorData);
          }
        } catch (err) {
          console.log('❌ Minimal strategy error:', err.message);
        }
      }

      // If all strategies failed, throw error
      if (!success || !response.ok) {
        let errorMessage = 'All submission strategies failed. ';
        try {
          const errorData = await response.json();
          console.error('❌ Final error response:', errorData);
          
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.errors) {
            if (Array.isArray(errorData.errors)) {
              errorMessage = errorData.errors.map(err => 
                typeof err === 'string' ? err : `${err.field}: ${err.message}`
              ).join(', ');
            } else if (typeof errorData.errors === 'object') {
              errorMessage = Object.entries(errorData.errors)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                .join(', ');
            }
          }
          
          // Add API documentation hint
          errorMessage += '\n\n💡 Please check the API documentation for required fields.';
        } catch (parseError) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Success response:', result);

      await fetchSellers();
      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedSeller(null);
      resetForm();
      setError('');
      
    } catch (err) {
      setError(err.message);
      console.error('❌ Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format date
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

  // Status badge
  const StatusBadge = ({ status }) => (
    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
      status === 'Active' 
        ? 'bg-green-100 text-green-800'
        : status === 'Inactive'
        ? 'bg-red-100 text-red-800'
        : 'bg-gray-100 text-gray-800'
    }`}>
      {status || 'Unknown'}
    </span>
  );

  // Approve status badge
  const ApproveStatusBadge = ({ status }) => (
    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
      status === 'Approved' 
        ? 'bg-green-100 text-green-800'
        : status === 'Rejected'
        ? 'bg-red-100 text-red-800'
        : 'bg-blue-100 text-blue-800'
    }`}>
      {status || 'Pending'}
    </span>
  );

  // File upload component
  const FileUpload = ({ name, label, accept = "image/*", preview, required = false }) => (
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
          <p className="text-xs text-gray-500 mt-1">Max 5MB • JPG, PNG, GIF</p>
        </div>
        {preview && (
          <img 
            src={preview}
            alt="Preview"
            className="h-16 w-16 rounded object-cover border-2 border-gray-200"
          />
        )}
      </div>
    </div>
  );

  // Info field
  const InfoField = ({ label, value, type = 'text' }) => (
    <div className="py-2 border-b border-gray-100 last:border-0">
      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-sm text-gray-900 sm:text-right break-words">
          {type === 'date' ? formatDate(value) : (value || 'N/A')}
        </span>
      </div>
    </div>
  );

  // Image preview
  const ImagePreview = ({ src, alt, label }) => (
    <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
      <span className="text-xs font-medium text-gray-600 mb-2">{label}</span>
      {src ? (
        <a href={src} target="_blank" rel="noopener noreferrer">
          <img 
            src={src} 
            alt={alt}
            className="h-20 w-20 object-cover rounded border-2 border-gray-300 hover:border-blue-500 cursor-pointer transition-all"
          />
        </a>
      ) : (
        <div className="h-20 w-20 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center">
          <FiImage className="text-gray-400 text-2xl" />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      {/* Debug Mode Toggle */}
      <div className="">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={` ${
            debugMode 
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
              : 'bg-gray-100 text-gray-600 border border-gray-300'
          }`}
        >
          {debugMode ? '' : ''}
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Seller Management</h1>
            <p className="text-sm text-gray-600 mt-1">Manage all your seller accounts</p>
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

        {/* Total Sellers Card - Reference Image Style */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Total Sellers</h2>
              <p className="text-3xl font-bold text-gray-900 mt-2">{sellers.length}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Active: {sellers.filter(seller => seller.status === 'Active').length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Approved: {sellers.filter(seller => seller.approve_status === 'Approved').length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">
                    Pending: {sellers.filter(seller => seller.approve_status === 'Pending').length}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-16 w-16 bg-blue-100 rounded-lg flex items-center justify-center">
              <FiUser className="text-blue-600 text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
          <div className="flex items-start">
            <FiAlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium whitespace-pre-line">{error}</p>
            </div>
            <button 
              onClick={() => setError('')}
              className="ml-3 text-red-500 hover:text-red-700"
            >
              <FiX className="text-lg" />
            </button>
          </div>
        </div>
      )}

      {/* Sellers Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading sellers...</p>
          </div>
        ) : sellers.length === 0 ? (
          <div className="text-center py-12">
            <FiUser className="mx-auto text-gray-400 text-5xl mb-4" />
            <p className="text-gray-600 text-lg">No sellers yet</p>
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
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sellers.map((seller) => (
                  <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-sm">
                            {seller.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{seller.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{seller.email || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{seller.mobile || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={seller.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <ApproveStatusBadge status={seller.approve_status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {seller.subscription ? (
                          <>
                            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-900">Active</span>
                          </>
                        ) : (
                          <>
                            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                            <span className="text-sm text-gray-500">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(seller.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(seller.id)}
                          className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 rounded-lg transition-colors"
                          title="View"
                        >
                          <FiEye className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleEdit(seller.id)}
                          className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDelete(seller)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleViewProducts(seller)}
                          className="bg-purple-100 hover:bg-purple-200 text-purple-700 p-2 rounded-lg transition-colors"
                          title="Products"
                        >
                          <FiPackage className="text-sm" />
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
          Showing {sellers.length} seller{sellers.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* View Seller Modal */}
      {showViewModal && selectedSeller && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl my-8">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FiUser className="text-white" />
                Seller Details - {selectedSeller.seller?.name}
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
                  <InfoField label="Name" value={selectedSeller.seller?.name} />
                  <InfoField label="Mobile" value={selectedSeller.seller?.mobile} />
                  <InfoField label="Email" value={selectedSeller.seller?.email} />
                  <div className="py-2 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-sm font-medium text-gray-600">Status</span>
                      <StatusBadge status={selectedSeller.seller?.status} />
                    </div>
                  </div>
                  <div className="py-2 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                      <span className="text-sm font-medium text-gray-600">Approval Status</span>
                      <ApproveStatusBadge status={selectedSeller.seller?.approve_status} />
                    </div>
                  </div>
                  <InfoField label="Device Token" value={selectedSeller.seller?.device_token} />
                  <InfoField label="Subscription" value={selectedSeller.seller?.subscription ? 'Active' : 'Inactive'} />
                  <InfoField label="Created Date" value={selectedSeller.seller?.created_at} type="date" />
                  <InfoField label="Updated Date" value={selectedSeller.seller?.updated_at} type="date" />
                </div>
              </div>

              {/* Company Information */}
              {selectedSeller.company && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-5 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <FiBriefcase className="text-white" />
                    </div>
                    Company Information
                  </h3>
                  <div className="space-y-1 bg-white rounded-lg p-4">
                    <InfoField label="Company Name" value={selectedSeller.company.company_name} />
                    <InfoField label="Company Type" value={selectedSeller.company.company_type} />
                    <InfoField label="GST Number" value={selectedSeller.company.company_GST_number} />
                    <InfoField label="Website" value={selectedSeller.company.company_website} />
                    <InfoField label="IEC Code" value={selectedSeller.company.IEC_code} />
                    <InfoField label="Annual Turnover" value={selectedSeller.company.annual_turnover} />
                    <InfoField label="Facebook" value={selectedSeller.company.facebook_link} />
                    <InfoField label="LinkedIn" value={selectedSeller.company.linkedin_link} />
                    <InfoField label="Instagram" value={selectedSeller.company.insta_link} />
                    <InfoField label="City" value={selectedSeller.company.city} />
                    <InfoField label="State" value={selectedSeller.company.state} />
                    <InfoField label="Pincode" value={selectedSeller.company.pincode} />
                    
                    {selectedSeller.company.company_logo && (
                      <div className="py-2 border-t border-gray-100 mt-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                          <span className="text-sm font-medium text-gray-600">Company Logo</span>
                          <a href={`${API_BASE_URL}${selectedSeller.company.company_logo}`} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={`${API_BASE_URL}${selectedSeller.company.company_logo}`}
                              alt="Company Logo"
                              className="h-16 w-16 rounded object-cover border-2 border-gray-300 hover:border-green-500 cursor-pointer transition-all"
                            />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* KYC Information */}
              {selectedSeller.kyc && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-5 border border-purple-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <FiFileText className="text-white" />
                    </div>
                    KYC Documents
                  </h3>
                  <div className="bg-white rounded-lg p-4">
                    <InfoField label="Aadhar Number" value={selectedSeller.kyc.aadhar_number} />
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
                      <ImagePreview 
                        src={selectedSeller.kyc.aadhar_front ? `${API_BASE_URL}${selectedSeller.kyc.aadhar_front}` : ''}
                        alt="Aadhar Front"
                        label="Aadhar Front"
                      />
                      <ImagePreview 
                        src={selectedSeller.kyc.aadhar_back ? `${API_BASE_URL}${selectedSeller.kyc.aadhar_back}` : ''}
                        alt="Aadhar Back"
                        label="Aadhar Back"
                      />
                      <ImagePreview 
                        src={selectedSeller.kyc.company_pan_card ? `${API_BASE_URL}${selectedSeller.kyc.company_pan_card}` : ''}
                        alt="PAN Card"
                        label="PAN Card"
                      />
                      <ImagePreview 
                        src={selectedSeller.kyc.gst_certificate ? `${API_BASE_URL}${selectedSeller.kyc.gst_certificate}` : ''}
                        alt="GST Certificate"
                        label="GST Certificate"
                      />
                      <ImagePreview 
                        src={selectedSeller.kyc.company_registration ? `${API_BASE_URL}${selectedSeller.kyc.company_registration}` : ''}
                        alt="Registration"
                        label="Registration"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Information */}
              {selectedSeller.bank && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 bg-orange-600 rounded-lg flex items-center justify-center">
                      <FiCreditCard className="text-white" />
                    </div>
                    Bank Information
                  </h3>
                  <div className="space-y-1 bg-white rounded-lg p-4">
                    <InfoField label="Bank Name" value={selectedSeller.bank.bank_name} />
                    <InfoField label="IFSC Code" value={selectedSeller.bank.bank_IFSC_code} />
                    <InfoField label="Account Number" value={selectedSeller.bank.account_number} />
                    <InfoField label="Account Type" value={selectedSeller.bank.account_type} />
                    
                    {selectedSeller.bank.cancelled_cheque_photo && (
                      <div className="py-2 border-t border-gray-100 mt-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                          <span className="text-sm font-medium text-gray-600">Cancelled Cheque</span>
                          <a href={`${API_BASE_URL}${selectedSeller.bank.cancelled_cheque_photo}`} target="_blank" rel="noopener noreferrer">
                            <img 
                              src={`${API_BASE_URL}${selectedSeller.bank.cancelled_cheque_photo}`}
                              alt="Cancelled Cheque"
                              className="h-16 w-32 object-cover rounded border-2 border-gray-300 hover:border-orange-500 cursor-pointer transition-all"
                            />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-4 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(selectedSeller.seller?.id);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium"
              >
                Edit Seller
              </button>
              <button
                onClick={() => handleViewProducts(selectedSeller.seller)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <FiPackage />
                View Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Seller Modal */}
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
                    <div className="flex items-center pt-6">
                      <input
                        type="checkbox"
                        name="subscription"
                        checked={formData.subscription === 1}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          subscription: e.target.checked ? 1 : 0
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm font-medium text-gray-700">
                        Subscription Active
                      </label>
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
                        <option value="Proprietorship">Proprietorship</option>
                        <option value="Partnership">Partnership</option>
                        <option value="LLP">LLP</option>
                        <option value="Private Limited">Private Limited</option>
                        <option value="Public Limited">Public Limited</option>
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
                        <option value="0-5_lakh">0-5 Lakh</option>
                        <option value="5-10_lakh">5-10 Lakh</option>
                        <option value="10-20_lakh">10-20 Lakh</option>
                        <option value="20-50_lakh">20-50 Lakh</option>
                        <option value="50_lakh-1_crore">50 Lakh - 1 Crore</option>
                        <option value="1-5_crore">1-5 Crore</option>
                        <option value="5-10_crore">5-10 Crore</option>
                        <option value="10+_crore">10+ Crore</option>
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
                      preview={filePreviews.aadhar_front}
                    />
                    <FileUpload 
                      name="aadhar_back"
                      label="Aadhar Back"
                      preview={filePreviews.aadhar_back}
                    />
                    <FileUpload 
                      name="company_registration"
                      label="Company Registration"
                      preview={filePreviews.company_registration}
                    />
                    <FileUpload 
                      name="company_pan_card"
                      label="Company PAN Card"
                      preview={filePreviews.company_pan_card}
                    />
                    <FileUpload 
                      name="gst_certificate"
                      label="GST Certificate"
                      preview={filePreviews.gst_certificate}
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
                      Saving...
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
                Are you sure you want to delete <strong className="text-gray-900">{selectedSeller.name}</strong>? 
                This action cannot be undone and will permanently remove all seller data.
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <FiPackage className="text-white" />
                Products - {selectedSeller.name}
              </h2>
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

            <div className="flex-1 overflow-y-auto p-6">
              {productsLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : productsError ? (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                  <p className="text-red-800">{productsError}</p>
                </div>
              ) : sellerProducts.length === 0 ? (
                <div className="text-center py-12">
                  <FiPackage className="mx-auto text-gray-400 text-5xl mb-4" />
                  <p className="text-gray-600 text-lg">No products found for this seller</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sellerProducts.map((product) => (
                    <div key={product.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                      {product.product_images && product.product_images.length > 0 ? (
                        <img
                          src={`${API_BASE_URL}${product.product_images[0]}`}
                          alt={product.product_name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <FiPackage className="text-gray-400 text-4xl" />
                        </div>
                      )}
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 mb-2 truncate" title={product.product_name}>
                          {product.product_name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {product.product_description || 'No description'}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-purple-600">
                            ₹{product.price || 'N/A'}
                          </span>
                          {product.stock && (
                            <span className="text-sm text-gray-500">
                              Stock: {product.stock}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
};

export default Seller;