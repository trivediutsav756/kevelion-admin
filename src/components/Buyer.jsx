import React, { useState, useEffect } from 'react';
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
  const [viewModalActiveTab, setViewModalActiveTab] = useState('buyer');

  const [originalContact, setOriginalContact] = useState({ email: '', mobile: '' });

  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    approve_status: 'Pending',
    company: {
      company_name: '',
      company_website: '',
      company_GST_number: '',
      IEC_code: '',
      annual_turnover: '',
      facebook_link: '',
      linkedin_link: '',
      insta_link: '',
      city: '',
      state: '',
      pincode: '',
      company_address: '',
    },
    kyc: {
      aadhar_number: '',
      driving_license_number: '',
      driving_license_dob: '',
      aadhar_front: null,
      aadhar_back: null,
      driving_license_front: null,
      driving_license_back: null,
    },
    image: null,

    // flattened fields used in form inputs
    company_name: '',
    company_website: '',
    company_GST_number: '',
    IEC_code: '',
    annual_turnover: '',
    facebook_link: '',
    linkedin_link: '',
    insta_link: '',
    city: '',
    state: '',
    pincode: '',
    company_address: '',

    aadhar_number: '',
    driving_license_number: '',
    driving_license_dob: '',
    aadhar_front: null,
    aadhar_back: null,
    driving_license_front: null,
    driving_license_back: null,
  });

  const [formErrors, setFormErrors] = useState({});
  const [filePreviews, setFilePreviews] = useState({
    image: '',
    aadhar_front: '',
    aadhar_back: '',
    driving_license_front: '',
    driving_license_back: '',
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
      approve_status: 'Pending',
      company: {
        company_name: '',
        company_website: '',
        company_GST_number: '',
        IEC_code: '',
        annual_turnover: '',
        facebook_link: '',
        linkedin_link: '',
        insta_link: '',
        city: '',
        state: '',
        pincode: '',
        company_address: '',
      },
      kyc: {
        aadhar_number: '',
        driving_license_number: '',
        driving_license_dob: '',
        aadhar_front: null,
        aadhar_back: null,
        driving_license_front: null,
        driving_license_back: null,
      },
      image: null,

      // flattened fields used in form inputs
      company_name: '',
      company_website: '',
      company_GST_number: '',
      IEC_code: '',
      annual_turnover: '',
      facebook_link: '',
      linkedin_link: '',
      insta_link: '',
      city: '',
      state: '',
      pincode: '',
      company_address: '',

      aadhar_number: '',
      driving_license_number: '',
      driving_license_dob: '',
      aadhar_front: null,
      aadhar_back: null,
      driving_license_front: null,
      driving_license_back: null,
    });

    setFilePreviews({
      image: '',
      aadhar_front: '',
      aadhar_back: '',
      driving_license_front: '',
      driving_license_back: '',
    });
    setOriginalContact({ email: '', mobile: '' });
    setFormErrors({});
    setError('');
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name || typeof formData.name !== 'string' || formData.name.trim() === '') {
      errors.name = 'Name is required';
    }

    if (!formData.mobile || typeof formData.mobile !== 'string' || formData.mobile.trim() === '') {
      errors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      errors.mobile = 'Please enter a valid 10-digit mobile number';
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

      let buyersArray = [];
      if (Array.isArray(data)) {
        buyersArray = data;
      } else if (data && Array.isArray(data.data)) {
        buyersArray = data.data;
      } else if (data && Array.isArray(data.buyers)) {
        buyersArray = data.buyers;
      } else {
        throw new Error('Invalid buyers data format received from server');
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
    return raw && raw.data ? raw.data : raw;
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
        } catch (_) {}
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

  const updateBuyerStatus = async (buyerId, newStatus) => {
    setLoading(true);
    setError('');
    try {
      const requestData = {
        buyer: {
          approve_status: newStatus,
        },
      };

      const formDataPayload = new FormData();
      formDataPayload.append('data', JSON.stringify(requestData));

      const response = await fetch(`${API_BASE}/buyer/${buyerId}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
        },
        body: formDataPayload,
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.message) errorMessage = errorData.message;
          else if (errorData.error) errorMessage = errorData.error;
        } catch (_) {}
        throw new Error(errorMessage);
      }

      setAllBuyers((prev) =>
        prev.map((item) => (getBuyerId(item) === buyerId ? { ...item, approve_status: newStatus } : item))
      );

      alert('Buyer status updated successfully!');
    } catch (err) {
      setError(err.message);
      console.error('Update status error:', err);
      alert('Failed to update buyer status');
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
      setViewModalActiveTab('buyer');
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
    try {
      const buyerDetails = await fetchBuyerById(buyerId);
      setSelectedBuyer(buyerDetails);

      setOriginalContact({
        email: buyerDetails.email || '',
        mobile: buyerDetails.mobile || '',
      });

      const company = buyerDetails.company || {};
      const kyc = buyerDetails.kyc || {};

      setFormData((prev) => ({
        ...prev,
        name: buyerDetails.name || '',
        mobile: buyerDetails.mobile || '',
        email: buyerDetails.email || '',
        password: '',
        approve_status: buyerDetails.approve_status || 'Pending',

        company_name: company.company_name || buyerDetails.company_name || '',
        company_website: company.company_website || buyerDetails.company_website || '',
        company_GST_number: company.company_GST_number || buyerDetails.company_GST_number || '',
        IEC_code: company.IEC_code || buyerDetails.IEC_code || '',
        annual_turnover: company.annual_turnover || buyerDetails.annual_turnover || '',
        facebook_link: company.facebook_link || buyerDetails.facebook_link || '',
        linkedin_link: company.linkedin_link || buyerDetails.linkedin_link || '',
        insta_link: company.insta_link || buyerDetails.insta_link || '',
        city: company.city || buyerDetails.city || '',
        state: company.state || buyerDetails.state || '',
        pincode: company.pincode || buyerDetails.pincode || '',
        company_address: company.company_address || buyerDetails.company_address || '',

        aadhar_number: kyc.aadhar_number || buyerDetails.aadhar_number || '',
        driving_license_number: kyc.driving_license_number || buyerDetails.driving_license_number || '',
        driving_license_dob: kyc.driving_license_dob || buyerDetails.driving_license_dob || '',

        image: null,
        aadhar_front: null,
        aadhar_back: null,
        driving_license_front: null,
        driving_license_back: null,
      }));

      setFilePreviews({
        image: buyerDetails.image ? `${API_BASE}${buyerDetails.image}` : '',
        aadhar_front: kyc.aadhar_front ? `${API_BASE}${kyc.aadhar_front}` : '',
        aadhar_back: kyc.aadhar_back ? `${API_BASE}${kyc.aadhar_back}` : '',
        driving_license_front: kyc.driving_license_front ? `${API_BASE}${kyc.driving_license_front}` : '',
        driving_license_back: kyc.driving_license_back ? `${API_BASE}${kyc.driving_license_back}` : '',
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
      const buyerId = getBuyerId(selectedBuyer);
      const isEdit = showEditModal && buyerId;
      const url = isEdit ? `${API_BASE}/buyer/${buyerId}` : `${API_BASE}/buyer`;
      const method = isEdit ? 'PATCH' : 'POST';

      const currentEmail = (formData.email || '').trim();
      const currentMobile = (formData.mobile || '').trim();
      const originalEmail = (originalContact.email || '').trim();
      const originalMobile = (originalContact.mobile || '').trim();

      const shouldSendEmail = !isEdit || currentEmail.toLowerCase() !== originalEmail.toLowerCase();
      const shouldSendMobile =
        !isEdit || currentMobile.replace(/\D/g, '') !== originalMobile.replace(/\D/g, '');

      console.log('[Buyer.handleSubmit]', {
        isEdit,
        buyerId,
        method,
        url,
        shouldSendEmail,
        shouldSendMobile,
      });

      const payload = {
        buyer: {
          name: formData.name || '',
          ...(shouldSendMobile ? { mobile: formData.mobile || '' } : {}),
          ...(shouldSendEmail ? { email: formData.email || '' } : {}),
          approve_status: formData.approve_status || 'Pending',
          ...(showAddModal || (formData.password && formData.password.trim() !== '')
            ? { password: formData.password }
            : {}),
          company: {
            company_name: formData.company_name || '',
            company_website: formData.company_website || '',
            company_GST_number: formData.company_GST_number || '',
            IEC_code: formData.IEC_code || '',
            annual_turnover: formData.annual_turnover || '',
            facebook_link: formData.facebook_link || '',
            linkedin_link: formData.linkedin_link || '',
            insta_link: formData.insta_link || '',
            city: formData.city || '',
            state: formData.state || '',
            pincode: formData.pincode || '',
            company_address: formData.company_address || '',
          },
          kyc: {
            aadhar_number: formData.aadhar_number || '',
            driving_license_number: formData.driving_license_number || '',
            driving_license_dob: formData.driving_license_dob || '',
          },
        },
      };

      const fd = new FormData();
      fd.append('data', JSON.stringify(payload));
      if (shouldSendEmail) fd.append('email', formData.email || '');
      if (shouldSendMobile) fd.append('mobile', formData.mobile || '');
      fd.append('name', payload.buyer.name || '');

      if (formData.image) fd.append('image', formData.image);
      if (formData.aadhar_front) fd.append('aadhar_front', formData.aadhar_front);
      if (formData.aadhar_back) fd.append('aadhar_back', formData.aadhar_back);
      if (formData.driving_license_front) fd.append('driving_license_front', formData.driving_license_front);
      if (formData.driving_license_back) fd.append('driving_license_back', formData.driving_license_back);

      const response = await fetch(url, {
        method,
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
        } catch (_) {}
        throw new Error(msg);
      }

      await fetchAllBuyers();

      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedBuyer(null);
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
        {type === 'date' ? formatDate(value) : value || 'N/A'}
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

  const renderAllBuyersTab = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">All Buyers ({allBuyers.length})</h3>
          <div className="flex gap-3">
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FiPlus className="text-lg" />
              Add Buyer
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buyer Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Website
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Approval Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allBuyers.map((buyerData, index) => {
                const buyer = getBuyerData(buyerData);
                const company = getCompanyData(buyerData);
                const buyerId = getBuyerId(buyer);

                return (
                  <tr key={buyerId || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiUser className="text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{buyer.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{buyer.email || 'N/A'}</div>
                          <div className="text-xs text-gray-400">{buyer.mobile || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{company.company_name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {company.company_website ? (
                          <a
                            href={company.company_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 break-all"
                          >
                            {company.company_website}
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={buyer.approve_status || 'Pending'}
                        onChange={(e) => updateBuyerStatus(buyerId, e.target.value)}
                        disabled={loading || !buyerId}
                        className={`text-sm px-2 py-1 rounded-md border focus:outline-none focus:ring-2 transition-colors ${
                          loading || !buyerId
                            ? 'bg-gray-100 cursor-not-allowed'
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400'
                        }`}
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

                    const productNamesArray = products.map((p) => p.name || 'Unknown Product');
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
                <div className="mb-6 border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setViewModalActiveTab('buyer')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        viewModalActiveTab === 'buyer'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FiUser className="text-lg" />
                        Buyer Information
                      </div>
                    </button>
                    <button
                      onClick={() => setViewModalActiveTab('company')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        viewModalActiveTab === 'company'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FiBriefcase className="text-lg" />
                        Company Details
                      </div>
                    </button>
                    <button
                      onClick={() => setViewModalActiveTab('kyc')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        viewModalActiveTab === 'kyc'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FiFileText className="text-lg" />
                        KYC Details
                      </div>
                    </button>
                  </nav>
                </div>

                {viewModalActiveTab === 'buyer' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-1">
                      <InfoField label="ID" value={selectedBuyer.id} />
                      <InfoField label="Name" value={selectedBuyer.name} />
                      <InfoField label="Mobile" value={selectedBuyer.mobile} />
                      <InfoField label="Email" value={selectedBuyer.email} />
                      <InfoField label="Approval Status" value={selectedBuyer.approve_status} />
                      <InfoField label="Device Token" value={selectedBuyer.device_token} />
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
                )}

                {viewModalActiveTab === 'company' && selectedBuyer.company && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-1">
                      <InfoField label="Company Name" value={selectedBuyer.company.company_name} />
                      <InfoField label="Company Website" value={selectedBuyer.company.company_website} />
                      <InfoField label="GST Number" value={selectedBuyer.company.company_GST_number} />
                      <InfoField label="IEC Code" value={selectedBuyer.company.IEC_code} />
                      <InfoField label="Annual Turnover" value={selectedBuyer.company.annual_turnover} />
                      <InfoField label="Facebook Link" value={selectedBuyer.company.facebook_link} />
                      <InfoField label="LinkedIn Link" value={selectedBuyer.company.linkedin_link} />
                      <InfoField label="Instagram Link" value={selectedBuyer.company.insta_link} />
                      <InfoField label="City" value={selectedBuyer.company.city} />
                      <InfoField label="State" value={selectedBuyer.company.state} />
                      <InfoField label="Pincode" value={selectedBuyer.company.pincode} />
                    </div>
                  </div>
                )}

                {viewModalActiveTab === 'kyc' && selectedBuyer.kyc && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-1">
                      <InfoField label="Aadhar Number" value={selectedBuyer.kyc.aadhar_number} />
                      <InfoField
                        label="Driving License Number"
                        value={selectedBuyer.kyc.driving_license_number}
                      />
                      <InfoField
                        label="Driving License DOB"
                        value={selectedBuyer.kyc.driving_license_dob}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                        <ImagePreview
                          src={selectedBuyer.kyc.aadhar_front ? `${API_BASE}${selectedBuyer.kyc.aadhar_front}` : ''}
                          alt="Aadhar Front"
                          label="Aadhar Front"
                        />
                        <ImagePreview
                          src={selectedBuyer.kyc.aadhar_back ? `${API_BASE}${selectedBuyer.kyc.aadhar_back}` : ''}
                          alt="Aadhar Back"
                          label="Aadhar Back"
                        />
                        <ImagePreview
                          src={
                            selectedBuyer.kyc.driving_license_front
                              ? `${API_BASE}${selectedBuyer.kyc.driving_license_front}`
                              : ''
                          }
                          alt="Driving License Front"
                          label="License Front"
                        />
                        <ImagePreview
                          src={
                            selectedBuyer.kyc.driving_license_back
                              ? `${API_BASE}${selectedBuyer.kyc.driving_license_back}`
                              : ''
                          }
                          alt="Driving License Back"
                          label="License Back"
                        />
                      </div>
                    </div>
                  </div>
                )}

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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            formErrors.name
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            formErrors.mobile
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            formErrors.email
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
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            formErrors.password
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

                      <div className="md:col-span-3">
                        <FileUpload name="image" label="Profile Image" preview={filePreviews.image} />
                      </div>
                    </div>
                  </div>

                  {/* company + kyc sections unchanged */}
                  {/* (rest of your original form remains exactly same) */}

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FiBriefcase className="text-green-500" />
                      Company Information
                      <span className="text-xs text-gray-500 ml-2">Optional fields</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input
                          type="text"
                          name="company_name"
                          value={formData.company_name || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter company name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Company Website</label>
                        <input
                          type="url"
                          name="company_website"
                          value={formData.company_website || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter company website URL"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                        <input
                          type="text"
                          name="company_GST_number"
                          value={formData.company_GST_number || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter GST number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">IEC Code</label>
                        <input
                          type="text"
                          name="IEC_code"
                          value={formData.IEC_code || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter IEC code"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Annual Turnover</label>
                        <select
                          name="annual_turnover"
                          value={formData.annual_turnover || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select Annual Turnover</option>
                          <option value="below 20 lakh">Below 20 Lakh</option>
                          <option value="20-50 lakh">20-50 Lakh</option>
                          <option value="50-1 cr">50 Lakh - 1 Cr</option>
                          <option value="1-5 cr">1-5 Cr</option>
                          <option value="5-10 cr">5-10 Cr</option>
                          <option value="10-20 cr">10-20 Cr</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facebook Link</label>
                        <input
                          type="url"
                          name="facebook_link"
                          value={formData.facebook_link || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter Facebook URL"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Link</label>
                        <input
                          type="url"
                          name="linkedin_link"
                          value={formData.linkedin_link || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter LinkedIn URL"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Link</label>
                        <input
                          type="url"
                          name="insta_link"
                          value={formData.insta_link || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter Instagram URL"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter city"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter state"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter pincode"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FiFileText className="text-purple-500" />
                      KYC Documents
                      <span className="text-xs text-gray-500 ml-2">Optional fields</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                        <input
                          type="text"
                          name="aadhar_number"
                          value={formData.aadhar_number || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter Aadhar number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Driving License Number
                        </label>
                        <input
                          type="text"
                          name="driving_license_number"
                          value={formData.driving_license_number || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter driving license number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driving License DOB</label>
                        <input
                          type="date"
                          name="driving_license_dob"
                          value={formData.driving_license_dob || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div></div>

                      <FileUpload name="aadhar_front" label="Aadhar Front" preview={filePreviews.aadhar_front} />
                      <FileUpload name="aadhar_back" label="Aadhar Back" preview={filePreviews.aadhar_back} />
                      <FileUpload
                        name="driving_license_front"
                        label="Driving License Front"
                        preview={filePreviews.driving_license_front}
                      />
                      <FileUpload
                        name="driving_license_back"
                        label="Driving License Back"
                        preview={filePreviews.driving_license_back}
                      />
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