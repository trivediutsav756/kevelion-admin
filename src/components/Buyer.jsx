import React, { useState, useEffect, useRef } from 'react';
import {
  FiUser,
  FiX,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiEye,
  FiBriefcase,
  FiFileText,
  FiImage,
  FiPackage,
} from 'react-icons/fi';

// API base URL
const API_BASE = "https://adminapi.kevelion.com";

const Buyer = () => {
  const [allBuyers, setAllBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [buyerProducts, setBuyerProducts] = useState([]);

  const [originalContact, setOriginalContact] = useState({ email: '', mobile: '' });
  // Ref to reliably hold the buyer id being edited (state updates are async, ref is synchronous)
  const editingBuyerIdRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    image: null,
    address: '',
    status: 'Active',
    approve_status: 'Pending',
    device_token: '',
    company_GST_number: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [filePreviews, setFilePreviews] = useState({
    image: '',
  });

  const getBuyerId = (buyer) => {
    if (!buyer) return null;
    return buyer.id ?? buyer._id ?? buyer.buyer_id ?? buyer.buyerId ?? null;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      password: '',
      image: null,
      address: '',
      status: 'Active',
      approve_status: 'Pending',
      device_token: '',
      company_GST_number: '',
    });

    setFilePreviews({
      image: '',
    });
    setOriginalContact({ email: '', mobile: '' });
    setFormErrors({});
    setError('');
    editingBuyerIdRef.current = null; // Clear any stored edit id
  };

  const validateForm = () => {
    const errors = {};
    const isEdit = showEditModal;

    if (!formData.name || typeof formData.name !== 'string' || formData.name.trim() === '') {
      errors.name = 'Name is required';
    }

    if (!formData.mobile || typeof formData.mobile !== 'string' || formData.mobile.trim() === '') {
      errors.mobile = 'Mobile number is required';
    } else {
      const mobileChanged = formData.mobile.trim() !== (originalContact.mobile || '').trim();
      if ((!isEdit || mobileChanged) && !/^[6-9][0-9]{9}$/.test(formData.mobile.replace(/\D/g, ''))) {
        errors.mobile = 'Please enter a valid 10-digit mobile number';
      }
    }

    if (!formData.email || typeof formData.email !== 'string' || formData.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (
      showAddModal &&
      (!formData.password || typeof formData.password !== 'string' || formData.password.trim() === '')
    ) {
      errors.password = 'Password is required for new buyers';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------------------- INPUT HANDLERS ----------------------

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const { name, files } = event.target;
    const file = files && files[0] ? files[0] : null;

    setFormData((prev) => ({
      ...prev,
      [name]: file,
    }));

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreviews((prev) => ({
        ...prev,
        [name]: previewUrl,
      }));
    } else {
      setFilePreviews((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  // ---------------------- API CALLS ----------------------

  const fetchAllBuyers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/buyers`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch buyers list: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      // Handle: { status: true, data: [...] } OR { data: [...] } OR [...]
      let buyersArray = [];
      if (Array.isArray(data)) {
        buyersArray = data;
      } else if (data && Array.isArray(data.data)) {
        buyersArray = data.data;
      } else if (data && Array.isArray(data.buyers)) {
        buyersArray = data.buyers;
      } else if (data && data.status && Array.isArray(data.data)) {
        buyersArray = data.data;
      } else {
        // If nothing matches, log for debugging
        console.warn('Unexpected buyers list format:', data);
        buyersArray = [];
      }

      setAllBuyers(buyersArray);
    } catch (err) {
      console.error('Fetch all buyers error:', err);
      setError(err.message);
      setAllBuyers([]);
    } finally {
      setLoading(false);
    }
  };


  const fetchBuyerById = async (buyerId) => {
    const response = await fetch(`${API_BASE}/buyer/${buyerId}`);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch buyer: ${response.status} ${response.statusText} - ${text}`);
    }
    const raw = await response.json();

    // API format can be: 
    // 1. { status: true, data: { ...flat fields... } }
    // 2. { status: true, data: { buyer: { ... }, company: { ... }, kyc: { ... } } }
    // 3. { ...flat fields... }
    
    let flat = {};
    if (raw && raw.data && typeof raw.data === 'object') {
      const d = raw.data;
      if (d.buyer && typeof d.buyer === 'object') {
        flat = { ...d.buyer, ...(d.company || {}), ...(d.kyc || {}), ...(d.bank || {}) };
      } else {
        flat = { ...d };
      }
    } else if (raw && raw.buyer && typeof raw.buyer === 'object') {
      flat = { ...raw.buyer, ...(raw.company || {}), ...(raw.kyc || {}), ...(raw.bank || {}) };
    } else {
      flat = raw;
    }

    // Ensure address is mapped correctly (API often returns company_address)
    if (!flat.address && flat.company_address) {
      flat.address = flat.company_address;
    }

    // Ensure id is always present
    if (!flat.id && !flat._id && !flat.buyer_id && !flat.buyerId) {
      flat.id = buyerId;
    }

    return flat;
  };


  const deleteBuyer = async (buyerId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/buyer/${buyerId}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        let msg = `Failed to delete buyer: ${response.status} ${response.statusText}`;
        try {
          const errJson = await response.json();
          msg = errJson.message || errJson.error || msg;
        } catch (_) { }
        throw new Error(msg);
      }

      setAllBuyers((prev) => prev.filter((b) => getBuyerId(b) !== buyerId));
      setShowDeleteModal(false);
      setSelectedBuyer(null);
      alert('Buyer deleted successfully!');
    } catch (err) {
      console.error('Delete buyer error:', err);
      setError(err.message);
      alert('Failed to delete buyer');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyerOrders = async (buyerId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/orderbuyer/${buyerId}`);

      if (response.status === 404) {
        setBuyerProducts([]);
        setError('');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch orders for buyer: ${response.status} ${response.statusText}`);
      }

      let data = await response.json();
      if (Array.isArray(data)) {
        // ok
      } else if (data && Array.isArray(data.orders)) {
        data = data.orders;
      } else if (data && Array.isArray(data.data)) {
        data = data.data;
      } else {
        data = [];
      }

      setBuyerProducts(data);
    } catch (err) {
      console.error('Fetch buyer orders error:', err);
      setBuyerProducts([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProducts = async (buyerId) => {
    try {
      const buyerDetails = await fetchBuyerById(buyerId);
      setSelectedBuyer(buyerDetails);
    } catch (err) {
      console.error('Error fetching buyer details for orders:', err);
      setSelectedBuyer({ id: buyerId, name: 'Unknown' });
    }

    setBuyerProducts([]);
    setError('');
    await fetchBuyerOrders(buyerId);
    setShowProductsModal(true);
  };

  const updateBuyerStatus = async (buyerId, field, newValue) => {
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append(field, newValue);
      fd.append('_method', 'PATCH'); // Essential for the backend to process PATCH with FormData

      const response = await fetch(`${API_BASE}/buyer/${buyerId}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
        },
        body: fd,
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) errorMessage = errorData.message;
          else if (errorData.error) errorMessage = errorData.error;
        } catch (_) { }
        throw new Error(errorMessage);
      }

      setAllBuyers((prev) =>
        prev.map((item) => (getBuyerId(item) === buyerId ? { ...item, [field]: newValue } : item))
      );

      alert(`${field.replace('_', ' ')} updated successfully!`);
    } catch (err) {
      setError(err.message);
      console.error('Update status error:', err);
      alert(`Failed to update buyer ${field.replace('_', ' ')}`);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (buyerId) => {
    setLoading(true);
    setError('');
    try {
      const buyerDetails = await fetchBuyerById(buyerId);
      setSelectedBuyer(buyerDetails);
      setShowViewModal(true);
    } catch (err) {
      console.error('handleView error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (buyerId) => {
    setLoading(true);
    setError('');
    // Store buyerId synchronously in ref so handleSubmit can always access it
    editingBuyerIdRef.current = buyerId;
    try {
      const buyerDetails = await fetchBuyerById(buyerId);
      setSelectedBuyer(buyerDetails);

      setOriginalContact({
        email: buyerDetails.email || '',
        mobile: buyerDetails.mobile || '',
      });

      const company = buyerDetails.company || {};
      const kyc = buyerDetails.kyc || {};

      setFormData({
        name: buyerDetails.name || '',
        mobile: buyerDetails.mobile || '',
        email: buyerDetails.email || '',
        password: '',
        image: null,
        address: buyerDetails.address || buyerDetails.company_address || '',
        status: buyerDetails.status || 'Active',
        approve_status: buyerDetails.approve_status || 'Pending',
        device_token: buyerDetails.device_token || '',
        company_GST_number: buyerDetails.company_GST_number || company.company_GST_number || '',
      });

      setFilePreviews({
        image: buyerDetails.image ? `${API_BASE}${buyerDetails.image}` : '',
      });

      setShowEditModal(true);
      setShowAddModal(false);
    } catch (err) {
      console.error('handleEdit error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Use ref for id (synchronous) — do NOT rely solely on selectedBuyer which updates async
      const buyerId = editingBuyerIdRef.current || getBuyerId(selectedBuyer);
      const isEdit = showEditModal && !!buyerId;
      const url = isEdit ? `${API_BASE}/buyer/${buyerId}` : `${API_BASE}/buyer`;
      const method = isEdit ? 'PATCH' : 'POST';

      const fd = new FormData();

      // The API requires a completely flat data structure, as seen in the /buyers response.
      // All fields, including company and kyc, must be at the top level.

      // Main buyer fields
      fd.append('name', formData.name || '');
      fd.append('mobile', formData.mobile || '');
      fd.append('email', formData.email || '');
      fd.append('approve_status', formData.approve_status || 'Pending');
      fd.append('status', formData.status || 'Active');
      fd.append('address', formData.address || '');
      fd.append('company_address', formData.address || ''); // Redundant alias to improve API hit rate
      fd.append('fcm_token', formData.device_token || ''); // Redundant alias to improve API hit rate
      fd.append('company_GST_number', formData.company_GST_number || '');

      if (formData.password && formData.password.trim() !== '') {
        fd.append('password', formData.password);
      }

      // Files
      if (formData.image instanceof File) fd.append('image', formData.image);

      // Add _method for PATCH requests with FormData if the server needs it, but it seems it doesn't
      if (isEdit) {
        fd.append('_method', 'PATCH');
      }

      const response = await fetch(url, {
        method: method,
        headers: { Accept: 'application/json' },
        body: fd,
      });

      if (!response.ok) {
        let msg = `Failed to save buyer: ${response.status} ${response.statusText}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errJson = await response.json();
            msg = errJson.message || errJson.error || msg;
          } else {
            const errText = await response.text();
            if (errText) msg = errText;
          }
        } catch (_) { }
        throw new Error(msg);
      }

      await fetchAllBuyers();

      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedBuyer(null);
      editingBuyerIdRef.current = null; // Clear after successful save
      resetForm();

      alert(isEdit ? 'Buyer updated successfully!' : 'Buyer created successfully!');
    } catch (err) {
      console.error('handleSubmit error:', err);
      setError(err.message);
      alert('Failed to save buyer');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (buyerData) => {
    setSelectedBuyer(buyerData);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedBuyer) return;
    await deleteBuyer(getBuyerId(selectedBuyer));
  };

  useEffect(() => {
    fetchAllBuyers();
  }, []);

  const getBuyerData = (buyerData) => buyerData;

  const getCompanyData = (buyerData) => {
    if (buyerData && buyerData.company && typeof buyerData.company === 'object') {
      return buyerData.company;
    }

    if (buyerData && (buyerData.company_name || buyerData.company_website)) {
      return {
        company_name: buyerData.company_name,
        company_website: buyerData.company_website,
        company_GST_number: buyerData.company_GST_number,
        IEC_code: buyerData.IEC_code,
        annual_turnover: buyerData.annual_turnover,
        facebook_link: buyerData.facebook_link,
        linkedin_link: buyerData.linkedin_link,
        insta_link: buyerData.insta_link,
        city: buyerData.city,
        state: buyerData.state,
        pincode: buyerData.pincode,
        company_address: buyerData.company_address,
      };
    }

    return {};
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const InfoField = ({ label, value, type = 'text' }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0 sm:w-1/3">{label}</span>
      <span className="text-sm text-gray-800 sm:w-2/3 break-words">
        {type === 'date' ? formatDate(value) : (value !== null && value !== undefined && value !== '' ? value : 'N/A')}
      </span>
    </div>
  );

  const FileUpload = ({ name, label, accept = 'image/*', preview }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="file"
            name={name}
            accept={accept}
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        {preview && <img src={preview} alt="Preview" className="h-16 w-16 rounded object-cover border" />}
      </div>
    </div>
  );

  const ImagePreview = ({ src, alt, label }) => (
    <div className="flex flex-col items-center border rounded-lg p-2 bg-white">
      <span className="text-sm font-medium text-gray-600 mb-2">{label}</span>
      {src ? (
        <a href={src} target="_blank" rel="noopener noreferrer">
          <img src={src} alt={alt} className="h-24 w-full object-cover rounded" />
        </a>
      ) : (
        <div className="h-24 w-full flex items-center justify-center bg-gray-100 rounded text-gray-400 text-sm">
          No Image
        </div>
      )}
    </div>
  );

  const renderAllBuyersTab = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
          <h3 className="text-base sm:text-xl font-semibold text-gray-800">All Buyers ({allBuyers.length})</h3>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
          >
            <FiPlus />
            Add Buyer
          </button>
        </div>

        {/* Mobile: Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
          {allBuyers.map((buyerData, index) => {
            const buyer = getBuyerData(buyerData);
            const company = getCompanyData(buyerData);
            const buyerId = getBuyerId(buyer);
            return (
              <div key={buyerId || index} className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {buyer.image ? (
                      <img src={`${API_BASE}${buyer.image}`} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <FiUser className="text-blue-600 w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{buyer.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500 truncate">{buyer.email || 'N/A'}</p>
                    <p className="text-xs text-gray-400">{buyer.mobile || 'N/A'}</p>
                    {company.company_GST_number && <p className="text-[10px] text-blue-500 font-medium">GST: {company.company_GST_number}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-end mt-2">
                    <div className="flex gap-1">
                      <select
                        value={buyer.approve_status || 'Pending'}
                        onChange={(e) => buyerId && updateBuyerStatus(buyerId, 'approve_status', e.target.value)}
                        className={`text-[10px] font-semibold rounded-full px-2 py-0.5 border-0 cursor-pointer focus:ring-1 focus:ring-blue-500 mr-2 ${
                          buyer.approve_status === 'Approved' ? 'bg-green-100 text-green-800' :
                          buyer.approve_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                        disabled={!buyerId || loading}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <button onClick={() => buyerId && handleView(buyerId)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-md" disabled={!buyerId}><FiEye className="w-4 h-4" /></button>
                      <button onClick={() => buyerId && handleEdit(buyerId)} className="p-2 text-green-600 hover:bg-green-50 rounded-md" disabled={!buyerId}><FiEdit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(buyerData)} className="p-2 text-red-600 hover:bg-red-50 rounded-md" disabled={!buyerId || loading}><FiTrash2 className="w-4 h-4" /></button>
                      <button onClick={() => buyerId && handleProducts(buyerId)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-md" disabled={!buyerId}><FiPackage className="w-4 h-4" /></button>
                    </div>
                </div>
              </div>
            );
          })}
          {allBuyers.length === 0 && <div className="col-span-2 text-center py-8 text-gray-400 text-sm">No buyers found</div>}
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allBuyers.map((buyerData, index) => {
                const buyer = getBuyerData(buyerData);
                const company = getCompanyData(buyerData);
                const buyerId = getBuyerId(buyer);

                return (
                  <tr key={buyerId || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {buyer.image ? (
                        <img src={`${API_BASE}${buyer.image}`} alt="Profile" className="h-10 w-10 rounded-full object-cover border" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                          <FiUser className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{buyer.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">{buyer.mobile || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800">{buyer.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-800 font-medium text-blue-600">{company.company_GST_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={buyer.approve_status || 'Pending'}
                        onChange={(e) => buyerId && updateBuyerStatus(buyerId, 'approve_status', e.target.value)}
                        className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${
                          buyer.approve_status === 'Approved' ? 'bg-green-100 text-green-800' :
                          buyer.approve_status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                        disabled={!buyerId || loading}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => buyerId && handleView(buyerId)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Buyer Details"
                          disabled={!buyerId}
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => buyerId && handleEdit(buyerId)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="Edit Buyer"
                          disabled={!buyerId}
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(buyerData)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Buyer"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => buyerId && handleProducts(buyerId)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                          title="View Buyer Orders"
                          disabled={!buyerId}
                        >
                          <FiPackage className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {allBuyers.length === 0 && <div className="text-center py-8 text-gray-500">No buyers found</div>}
      </div>
    </div>
  );

  const renderProductsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FiPackage className="text-purple-500" />
            Buyer Orders - {selectedBuyer?.name || 'Unknown'}
          </h2>
          <button
            onClick={() => setShowProductsModal(false)}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <FiX className="text-xl" />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : buyerProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiPackage className="mx-auto text-4xl text-gray-300 mb-4" />
              <p className="text-lg font-medium text-gray-600">No orders found for this buyer.</p>
              <p className="text-sm text-gray-500 mt-2">This buyer hasn't placed any orders yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {buyerProducts.map((order) => {
                    const products = order.products || [];
                    const totalQuantity = products.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0);
                    const totalAmount = products.reduce(
                      (sum, p) => sum + parseFloat(p.price || 0) * parseInt(p.quantity || 0),
                      0
                    );

                    const productNamesArray = products.map((p) => {
                      return (
                        p.product_details?.name ||
                        p.product_name ||
                        p.name ||
                        p.title ||
                        `Product ${p.product_id || p.id || ''}`.trim() ||
                        'Unknown Product'
                      );
                    });
                    const uniqueProductNames = [...new Set(productNamesArray)].join(', ');

                    const statuses = products.map((p) => p.order_status).filter(Boolean);
                    const uniqueStatuses = [...new Set(statuses)];
                    const orderStatus =
                      uniqueStatuses.length === 1 ? uniqueStatuses[0] : uniqueStatuses.join(', ');

                    const statusClass =
                      orderStatus === 'Delivered'
                        ? 'bg-green-100 text-green-800'
                        : orderStatus === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : orderStatus === 'Shipped'
                            ? 'bg-blue-100 text-blue-800'
                            : orderStatus === 'Returned'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800';

                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs" title={uniqueProductNames}>
                          {uniqueProductNames.length > 50
                            ? `${uniqueProductNames.substring(0, 50)}...`
                            : uniqueProductNames}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {totalQuantity || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          ₹{totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                            {orderStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ---------------------- MAIN RETURN ----------------------

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Buyer Management</h1>
          <p className="text-gray-600 mt-2">Manage and view all buyers</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error: </strong>
            {error}
            <button onClick={() => setError('')} className="float-right font-bold">
              ×
            </button>
          </div>
        )}

        {loading && !showProductsModal && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {renderAllBuyersTab()}

        {showViewModal && selectedBuyer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FiUser className="text-blue-500" />
                  Buyer Details - {selectedBuyer.name}
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-1">
                    <InfoField label="ID" value={selectedBuyer.id} />
                    <InfoField label="Name" value={selectedBuyer.name} />
                    <InfoField label="Mobile" value={selectedBuyer.mobile} />
                    <InfoField label="Email" value={selectedBuyer.email} />
                    <InfoField label="Status" value={selectedBuyer.status} />
                    <InfoField label="Approved Status" value={selectedBuyer.approve_status} />
                    <InfoField label="Address" value={selectedBuyer.address} />
                    <InfoField label="Device Token" value={selectedBuyer.device_token} />
                    <InfoField label="GST Number" value={selectedBuyer.company_GST_number || (selectedBuyer.company && selectedBuyer.company.company_GST_number)} />
                    <InfoField label="Created Date" value={selectedBuyer.created_at} type="date" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600 mb-2 sm:mb-0">
                        Profile Image
                      </span>
                      {selectedBuyer.image ? (
                        <img
                          src={`${API_BASE}${selectedBuyer.image}`}
                          alt="Profile"
                          className="h-16 w-16 rounded object-cover border"
                        />
                      ) : (
                        <span className="text-sm text-gray-500">No image uploaded</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleEdit(getBuyerId(selectedBuyer));
                    }}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Edit Buyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {(showAddModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
                <h2 className="text-xl font-semibold text-gray-800">
                  {showAddModal ? 'Add New Buyer' : 'Edit Buyer'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* YOUR ORIGINAL FORM JSX CONTINUES BELOW (UNCHANGED) */}
                {/* ----------------- (I kept it identical to your code) ----------------- */}

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FiUser className="text-blue-500" />
                      Buyer Information
                      <span className="text-xs text-red-500 ml-2">* Required fields</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name || ''}
                          onChange={handleInputChange}
                          placeholder="Enter buyer name"
                          maxLength="50"
                          pattern="[A-Za-z\s-]+"
                          title="Only letters, spaces, and hyphens are allowed (max 50 characters)"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${formErrors.name
                              ? 'border-red-500 focus:ring-red-200'
                              : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                            }`}
                        />
                        {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile || ''}
                          onChange={handleInputChange}
                          placeholder="Enter 10-digit mobile"
                          maxLength="10"
                          pattern="[6-9][0-9]{9}"
                          title="Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${formErrors.mobile
                              ? 'border-red-500 focus:ring-red-200'
                              : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                            }`}
                        />
                        {formErrors.mobile && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.mobile}</p>
                        )}
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ''}
                          onChange={handleInputChange}
                          placeholder="Enter email address"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${formErrors.email
                              ? 'border-red-500 focus:ring-red-200'
                              : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                            }`}
                        />
                        {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {showAddModal ? 'Password' : 'Password (Optional)'}{' '}
                          {showAddModal && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password || ''}
                          onChange={handleInputChange}
                          placeholder={showAddModal ? 'Enter password' : 'Leave blank to keep current'}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${formErrors.password
                              ? 'border-red-500 focus:ring-red-200'
                              : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                            }`}
                        />
                        {formErrors.password && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                        )}
                        {!showAddModal && <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>}
                      </div>

                      {showEditModal && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
                          <select
                            name="approve_status"
                            value={formData.approve_status || 'Pending'}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </div>
                      )}

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          name="status"
                          value={formData.status || 'Active'}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <textarea
                          name="address"
                          value={formData.address || ''}
                          onChange={handleInputChange}
                          placeholder="Enter address"
                          rows="2"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Device Token</label>
                        <input
                          type="text"
                          name="device_token"
                          value={formData.device_token || ''}
                          onChange={handleInputChange}
                          placeholder="Enter device token"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                        <input
                          type="text"
                          name="company_GST_number"
                          value={formData.company_GST_number || ''}
                          onChange={handleInputChange}
                          placeholder="Enter 15-digit GST number"
                          maxLength="15"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <FileUpload name="image" label="Profile Image" preview={filePreviews.image} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setShowEditModal(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : showAddModal ? 'Create Buyer' : 'Update Buyer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && selectedBuyer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <FiTrash2 className="text-red-600 text-xl" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Delete Buyer</h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete buyer{' '}
                  <strong>{selectedBuyer.buyer?.name || selectedBuyer.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={loading}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showProductsModal && renderProductsModal()}
      </div>
    </div>
  );
};

export default Buyer;