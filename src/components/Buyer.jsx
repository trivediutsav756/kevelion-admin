import React, { useState, useEffect } from 'react';
import { FiUser, FiX, FiEdit2, FiTrash2, FiPlus, FiEye, FiBriefcase, FiFileText, FiImage, FiPackage } from 'react-icons/fi';

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
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    approve_status: 'Pending',
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
    aadhar_number: '',
    driving_license_number: '',
    driving_license_dob: '',
    aadhar_front: null,
    aadhar_back: null,
    driving_license_front: null,
    driving_license_back: null,
    image: null
  });
  const [formErrors, setFormErrors] = useState({});
  const [filePreviews, setFilePreviews] = useState({
    image: '',
    aadhar_front: '',
    aadhar_back: '',
    driving_license_front: '',
    driving_license_back: ''
  });
  const API_BASE = 'http://rettalion.apxfarms.com';

  const validateForm = () => {
    const errors = {};
    // Required fields validation
    if (!formData.name?.trim()) errors.name = 'Name is required';
    if (!formData.mobile?.trim()) errors.mobile = 'Mobile number is required';
    if (!formData.email?.trim()) errors.email = 'Email is required';
    if (showAddModal && !formData.password?.trim()) errors.password = 'Password is required for new buyers';
    // Format validation
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
      errors.mobile = 'Please enter a valid 10-digit mobile number';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchAllBuyers = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching all buyers...');
      const response = await fetch(`${API_BASE}/buyers`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch buyers error response:', errorText);
        throw new Error(`Failed to fetch buyers list: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log('Fetched buyers data:', data);
      // Ensure data is an array before setting it
      if (Array.isArray(data)) {
        setAllBuyers(data);
      } else if (data && Array.isArray(data.buyers)) {
        setAllBuyers(data.buyers);
      } else {
        console.error('Invalid buyers data format:', data);
        setAllBuyers([]);
        throw new Error('Invalid buyers data format received from server');
      }
    } catch (err) {
      console.error('Fetch all buyers error:', err);
      setError(err.message);
      setAllBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyerOrders = async (buyerId) => {
    setLoading(true);
    setError('');
    try {
      console.log(`Fetching orders for buyer ${buyerId}...`);
      const response = await fetch(`${API_BASE}/orderbuyer/${buyerId}`);
      // Handle 404 specifically - it means no orders found
      if (response.status === 404) {
        console.log(`No orders found for buyer ${buyerId}`);
        setBuyerProducts([]);
        setError(''); // Clear any previous errors
        return;
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch orders for buyer: ${response.status} ${response.statusText}`);
      }
      let data = await response.json();
      console.log('Fetched buyer orders data:', data);
      // Assuming data is an array of orders, each with products
      if (Array.isArray(data)) {
        // Enrich with product names
        data = await Promise.all(data.map(async (order) => {
          const enrichedProducts = await Promise.all(order.products.map(async (prod) => {
            try {
              const prodRes = await fetch(`${API_BASE}/product/${prod.product_id}`);
              if (prodRes.ok) {
                const prodData = await prodRes.json();
                console.log(`Product data for ${prod.product_id}:`, prodData);
                // Try multiple possible structures for product name
                const productName = prodData.data ? 
                  (prodData.data.name || prodData.data.product?.name) : 
                  (prodData.product ? prodData.product.name : (prodData.name || 'Unknown Product'));
                prod.name = productName;
              } else {
                console.error(`Failed to fetch product ${prod.product_id}: ${prodRes.status}`);
                prod.name = 'Unknown Product';
              }
            } catch (err) {
              console.error(`Error fetching product ${prod.product_id}:`, err);
              prod.name = 'Unknown Product';
            }
            return prod;
          }));
          order.products = enrichedProducts;
          return order;
        }));
      } else if (data && Array.isArray(data.orders)) {
        // Similar enrichment for data.orders
        data.orders = await Promise.all(data.orders.map(async (order) => {
          const enrichedProducts = await Promise.all(order.products.map(async (prod) => {
            try {
              const prodRes = await fetch(`${API_BASE}/product/${prod.product_id}`);
              if (prodRes.ok) {
                const prodData = await prodRes.json();
                console.log(`Product data for ${prod.product_id}:`, prodData);
                // Try multiple possible structures for product name
                const productName = prodData.data ? 
                  (prodData.data.name || prodData.data.product?.name) : 
                  (prodData.product ? prodData.product.name : (prodData.name || 'Unknown Product'));
                prod.name = productName;
              } else {
                console.error(`Failed to fetch product ${prod.product_id}: ${prodRes.status}`);
                prod.name = 'Unknown Product';
              }
            } catch (err) {
              console.error(`Error fetching product ${prod.product_id}:`, err);
              prod.name = 'Unknown Product';
            }
            return prod;
          }));
          order.products = enrichedProducts;
          return order;
        }));
        data = data.orders;
      } else {
        data = [];
      }
      setBuyerProducts(data);
    } catch (err) {
      console.error('Fetch buyer orders error:', err);
      // Don't set error for 404 - it's normal when no orders exist
      if (!err.message.includes('404')) {
        setError(err.message);
      } else {
        setError(''); // Clear error for 404 cases
      }
      setBuyerProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProducts = async (buyerId) => {
    try {
      const buyerResponse = await fetch(`${API_BASE}/buyer/${buyerId}`);
      if (buyerResponse.ok) {
        const buyerDetails = await buyerResponse.json();
        setSelectedBuyer(buyerDetails);
      } else {
        setSelectedBuyer({ id: buyerId, buyer: { name: 'Unknown' } });
      }
    } catch (err) {
      console.error('Error fetching buyer details for orders:', err);
      setSelectedBuyer({ id: buyerId, buyer: { name: 'Unknown' } });
    }
    // Clear previous products and error before fetching new ones
    setBuyerProducts([]);
    setError('');
    await fetchBuyerOrders(buyerId);
    setShowProductsModal(true);
  };

  const updateBuyerStatus = async (buyerId, newStatus) => {
    setLoading(true);
    setError('');
    try {
      // Structure the data according to API format
      const requestData = {
        buyer: {
          approve_status: newStatus
        }
      };
      // Create FormData for the request
      const formDataPayload = new FormData();
      formDataPayload.append('data', JSON.stringify(requestData));
      console.log(`Updating status for buyer ${buyerId} to ${newStatus}...`);
      const response = await fetch(`${API_BASE}/buyer/${buyerId}`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
        },
        body: formDataPayload,
      });
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }
      // Update local state
      setAllBuyers(prev => prev.map(item => {
        if (item.buyer?.id === buyerId) {
          return { ...item, buyer: { ...item.buyer, approve_status: newStatus } };
        }
        // Fallback for flat structure
        if (item.id === buyerId) {
          return { ...item, approve_status: newStatus };
        }
        return item;
      }));
      alert('Buyer status updated successfully!');
    } catch (err) {
      setError(err.message);
      console.error('Update status error:', err);
      alert('Failed to update buyer status');
    } finally {
      setLoading(false);
    }
  };

  const addBuyer = async (buyerData) => {
    setLoading(true);
    setError('');
    try {
      // Validate required fields
      if (!buyerData.name?.trim()) throw new Error('Name is required');
      if (!buyerData.mobile?.trim()) throw new Error('Mobile number is required');
      if (!buyerData.email?.trim()) throw new Error('Email is required');
      if (!buyerData.password?.trim()) throw new Error('Password is required');
      // Structure the data according to API format
      const requestData = {
        buyer: {
          name: buyerData.name.trim(),
          mobile: buyerData.mobile.trim(),
          email: buyerData.email.trim(),
          password: buyerData.password.trim(),
          approve_status: buyerData.approve_status || 'Pending'
        },
        company: {
          company_name: buyerData.company_name?.trim() || '',
          company_website: buyerData.company_website?.trim() || '',
          company_GST_number: buyerData.company_GST_number?.trim() || '',
          IEC_code: buyerData.IEC_code?.trim() || '',
          annual_turnover: buyerData.annual_turnover?.trim() || '',
          facebook_link: buyerData.facebook_link?.trim() || '',
          linkedin_link: buyerData.linkedin_link?.trim() || '',
          insta_link: buyerData.insta_link?.trim() || '',
          city: buyerData.city?.trim() || '',
          state: buyerData.state?.trim() || '',
          pincode: buyerData.pincode?.trim() || ''
        },
        kyc: {
          aadhar_number: buyerData.aadhar_number?.trim() || '',
          driving_license_number: buyerData.driving_license_number?.trim() || '',
          driving_license_dob: buyerData.driving_license_dob?.trim() || ''
        }
      };
      // Create FormData for the request
      const formDataPayload = new FormData();
      formDataPayload.append('data', JSON.stringify(requestData));
      // Append files if they exist
      if (buyerData.image) formDataPayload.append('image', buyerData.image);
      if (buyerData.aadhar_front) formDataPayload.append('aadhar_front', buyerData.aadhar_front);
      if (buyerData.aadhar_back) formDataPayload.append('aadhar_back', buyerData.aadhar_back);
      if (buyerData.driving_license_front) formDataPayload.append('driving_license_front', buyerData.driving_license_front);
      if (buyerData.driving_license_back) formDataPayload.append('driving_license_back', buyerData.driving_license_back);
      console.log('Creating buyer with FormData...');
      const response = await fetch(`${API_BASE}/buyer`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
        body: formDataPayload,
      });
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error('Server error response:', errorData);
          if (errorData.errors && Array.isArray(errorData.errors)) {
            const fieldErrors = errorData.errors.map(err => `${err.field}: ${err.message}`).join(', ');
            errorMessage = `Validation Error: ${fieldErrors}`;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          try {
            const errorText = await response.text();
            errorMessage = `Server error: ${errorText}`;
          } catch (textError) {
            console.error('Could not get error text:', textError);
          }
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      await fetchAllBuyers();
      setShowAddModal(false);
      resetForm();
      alert('Buyer added successfully!');
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Add buyer error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateBuyer = async (buyerId, updatedData) => {
    setLoading(true);
    setError('');
    try {
      // Create structured data for API
      const requestData = {
        buyer: {
          name: updatedData.name?.trim() || '',
          mobile: updatedData.mobile?.trim() || '',
          email: updatedData.email?.trim() || '',
          approve_status: updatedData.approve_status || 'Pending'
        },
        company: {
          company_name: updatedData.company_name?.trim() || '',
          company_website: updatedData.company_website?.trim() || '',
          company_GST_number: updatedData.company_GST_number?.trim() || '',
          IEC_code: updatedData.IEC_code?.trim() || '',
          annual_turnover: updatedData.annual_turnover?.trim() || '',
          facebook_link: updatedData.facebook_link?.trim() || '',
          linkedin_link: updatedData.linkedin_link?.trim() || '',
          insta_link: updatedData.insta_link?.trim() || '',
          city: updatedData.city?.trim() || '',
          state: updatedData.state?.trim() || '',
          pincode: updatedData.pincode?.trim() || ''
        },
        kyc: {
          aadhar_number: updatedData.aadhar_number?.trim() || '',
          driving_license_number: updatedData.driving_license_number?.trim() || '',
          driving_license_dob: updatedData.driving_license_dob?.trim() || ''
        }
      };
      // Add password only if provided
      if (updatedData.password?.trim()) {
        requestData.buyer.password = updatedData.password.trim();
      }
      // Create FormData and append the structured data
      const formDataPayload = new FormData();
      formDataPayload.append('data', JSON.stringify(requestData));
      // Append files if they exist
      if (updatedData.image) formDataPayload.append('image', updatedData.image);
      if (updatedData.aadhar_front) formDataPayload.append('aadhar_front', updatedData.aadhar_front);
      if (updatedData.aadhar_back) formDataPayload.append('aadhar_back', updatedData.aadhar_back);
      if (updatedData.driving_license_front) formDataPayload.append('driving_license_front', updatedData.driving_license_front);
      if (updatedData.driving_license_back) formDataPayload.append('driving_license_back', updatedData.driving_license_back);
      console.log('Updating buyer with data:', requestData);
      const response = await fetch(`${API_BASE}/buyer/${buyerId}`, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
        },
        body: formDataPayload,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update buyer data');
      }
      const data = await response.json();
      await fetchAllBuyers();
      setShowEditModal(false);
      alert('Buyer data updated successfully!');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBuyer = async (buyerId) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/buyer/${buyerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete buyer');
      }
      await fetchAllBuyers();
      setShowDeleteModal(false);
      setSelectedBuyer(null);
      alert('Buyer deleted successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Update form data directly
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
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

  const resetForm = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      password: '',
      approve_status: 'Pending',
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
      aadhar_number: '',
      driving_license_number: '',
      driving_license_dob: '',
      aadhar_front: null,
      aadhar_back: null,
      driving_license_front: null,
      driving_license_back: null,
      image: null
    });
    setFilePreviews({
      image: '',
      aadhar_front: '',
      aadhar_back: '',
      driving_license_front: '',
      driving_license_back: ''
    });
    setFormErrors({});
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormErrors({});
    if (!validateForm()) {
      return;
    }
    try {
      console.log('Submitting form data...');
      // Create structured data for API
      const requestData = {
        buyer: {
          name: formData.name.trim(),
          mobile: formData.mobile.trim(),
          email: formData.email.trim(),
          password: formData.password?.trim(),
          approve_status: formData.approve_status || 'Pending'
        },
        company: {
          company_name: formData.company_name?.trim() || '',
          company_website: formData.company_website?.trim() || '',
          company_GST_number: formData.company_GST_number?.trim() || '',
          IEC_code: formData.IEC_code?.trim() || '',
          annual_turnover: formData.annual_turnover?.trim() || '',
          facebook_link: formData.facebook_link?.trim() || '',
          linkedin_link: formData.linkedin_link?.trim() || '',
          insta_link: formData.insta_link?.trim() || '',
          city: formData.city?.trim() || '',
          state: formData.state?.trim() || '',
          pincode: formData.pincode?.trim() || ''
        },
        kyc: {
          aadhar_number: formData.aadhar_number?.trim() || '',
          driving_license_number: formData.driving_license_number?.trim() || '',
          driving_license_dob: formData.driving_license_dob?.trim() || ''
        }
      };
      console.log('Request data:', requestData);
      // Create FormData and append the structured data
      const formDataPayload = new FormData();
      formDataPayload.append('data', JSON.stringify(requestData));
      // Append files if they exist
      if (formData.image) formDataPayload.append('image', formData.image);
      if (formData.aadhar_front) formDataPayload.append('aadhar_front', formData.aadhar_front);
      if (formData.aadhar_back) formDataPayload.append('aadhar_back', formData.aadhar_back);
      if (formData.driving_license_front) formDataPayload.append('driving_license_front', formData.driving_license_front);
      if (formData.driving_license_back) formDataPayload.append('driving_license_back', formData.driving_license_back);
      if (showAddModal) {
        console.log('Adding new buyer...');
        const response = await fetch(`${API_BASE}/buyer`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
          },
          body: formDataPayload,
        });
        let responseData;
        const responseText = await response.text();
        console.log('Server response text:', responseText);
        try {
          responseData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Failed to parse response as JSON:', parseError);
          throw new Error('Invalid response from server');
        }
        if (!response.ok) {
          console.error('Server error response:', responseData);
          throw new Error(responseData.message || responseData.error || 'Failed to add buyer');
        }
        console.log('Buyer added successfully:', responseData);
        setShowAddModal(false);
        resetForm();
        // Wait a moment before fetching updated buyer list
        setTimeout(async () => {
          try {
            await fetchAllBuyers();
          } catch (fetchError) {
            console.error('Error fetching updated buyer list:', fetchError);
          }
        }, 1000);
        alert('Buyer added successfully!');
      } else if (showEditModal && selectedBuyer) {
        console.log('Updating existing buyer...');
        await updateBuyer(selectedBuyer.buyer.id, formData);
        setShowEditModal(false);
        // Wait a moment before fetching updated buyer list
        setTimeout(async () => {
          try {
            await fetchAllBuyers();
          } catch (fetchError) {
            console.error('Error fetching updated buyer list:', fetchError);
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Submit error:', err);
      // Handle field-specific errors
      if (err.message.includes('required')) {
        const fieldName = err.message.split(' is ')[0].toLowerCase();
        setFormErrors(prev => ({
          ...prev,
          [fieldName]: err.message
        }));
        setError('Please fill in all required fields');
      } else if (err.message.includes('Missing required fields')) {
        setError('Please ensure all required fields are filled correctly');
        validateForm(); // Re-run validation to show field-specific errors
      } else {
        setError('Error saving buyer: ' + err.message);
      }
    }
  };

  const handleView = async (buyerId) => {
    try {
      const response = await fetch(`${API_BASE}/buyer/${buyerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch buyer details');
      }
      const buyerDetails = await response.json();
      setSelectedBuyer(buyerDetails);
      setViewModalActiveTab('buyer'); // Reset to buyer tab
      setShowViewModal(true);
    } catch (err) {
      setError('Error fetching buyer details: ' + err.message);
    }
  };

  const handleEdit = async (buyerId) => {
    try {
      const response = await fetch(`${API_BASE}/buyer/${buyerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch buyer details');
      }
      const buyerDetails = await response.json();
      setFormData({
        name: buyerDetails.buyer?.name || '',
        mobile: buyerDetails.buyer?.mobile || '',
        email: buyerDetails.buyer?.email || '',
        password: '',
        approve_status: buyerDetails.buyer?.approve_status || 'Pending',
        company_name: buyerDetails.company?.company_name || '',
        company_website: buyerDetails.company?.company_website || '',
        company_GST_number: buyerDetails.company?.company_GST_number || '',
        IEC_code: buyerDetails.company?.IEC_code || '',
        annual_turnover: buyerDetails.company?.annual_turnover || '',
        facebook_link: buyerDetails.company?.facebook_link || '',
        linkedin_link: buyerDetails.company?.linkedin_link || '',
        insta_link: buyerDetails.company?.insta_link || '',
        city: buyerDetails.company?.city || '',
        state: buyerDetails.company?.state || '',
        pincode: buyerDetails.company?.pincode || '',
        aadhar_number: buyerDetails.kyc?.aadhar_number || '',
        driving_license_number: buyerDetails.kyc?.driving_license_number || '',
        driving_license_dob: buyerDetails.kyc?.driving_license_dob || '',
        aadhar_front: null,
        aadhar_back: null,
        driving_license_front: null,
        driving_license_back: null,
        image: null
      });
      setFilePreviews({
        image: buyerDetails.buyer?.image ? `${API_BASE}${buyerDetails.buyer.image}` : '',
        aadhar_front: buyerDetails.kyc?.aadhar_front ? `${API_BASE}${buyerDetails.kyc.aadhar_front}` : '',
        aadhar_back: buyerDetails.kyc?.aadhar_back ? `${API_BASE}${buyerDetails.kyc.aadhar_back}` : '',
        driving_license_front: buyerDetails.kyc?.driving_license_front ? `${API_BASE}${buyerDetails.kyc.driving_license_front}` : '',
        driving_license_back: buyerDetails.kyc?.driving_license_back ? `${API_BASE}${buyerDetails.kyc.driving_license_back}` : ''
      });
      setSelectedBuyer(buyerDetails);
      setShowEditModal(true);
    } catch (err) {
      setError('Error fetching buyer details: ' + err.message);
    }
  };

  const handleDelete = (buyerData) => {
    setSelectedBuyer(buyerData);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedBuyer) return;
    await deleteBuyer(selectedBuyer.id || selectedBuyer.buyer?.id);
  };

  useEffect(() => {
    fetchAllBuyers();
  }, []);

  // Improved helper function to extract company data
  const getCompanyData = (buyerData) => {
    console.log('Buyer data for company extraction:', buyerData);
    // Check different possible structures
    if (buyerData.company && typeof buyerData.company === 'object') {
      return buyerData.company;
    }
    if (buyerData.buyer && buyerData.buyer.company && typeof buyerData.buyer.company === 'object') {
      return buyerData.buyer.company;
    }
    // If company data is directly in buyer object
    if (buyerData.company_name || buyerData.company_website) {
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
        pincode: buyerData.pincode
      };
    }
    return {};
  };

  // Improved helper function to extract buyer data
  const getBuyerData = (buyerData) => {
    console.log('Raw buyer data:', buyerData);
    if (buyerData.buyer && typeof buyerData.buyer === 'object') {
      return buyerData.buyer;
    }
    return buyerData;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ApproveStatusBadge = ({ status }) => (
    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
      status === 'Approved'
        ? 'bg-green-100 text-green-800'
        : status === 'Rejected'
        ? 'bg-red-100 text-red-800'
        : 'bg-blue-100 text-blue-800'
    }`}>
      {status || 'Pending'}
    </span>
  );

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
            required={required}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="h-16 w-16 rounded object-cover border"
          />
        )}
      </div>
    </div>
  );

  const InfoField = ({ label, value, type = 'text' }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-600 mb-1 sm:mb-0 sm:w-1/3">{label}</span>
      <span className="text-sm text-gray-800 sm:w-2/3 break-words">
        {type === 'date' ? formatDate(value) : value || 'N/A'}
      </span>
    </div>
  );

  const ImagePreview = ({ src, alt, label }) => (
    <div className="flex flex-col items-center">
      <span className="text-sm font-medium text-gray-600 mb-2">{label}</span>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-24 w-24 object-cover rounded-lg border border-gray-300"
        />
      ) : (
        <div className="h-24 w-24 bg-gray-100 rounded-lg border border-gray-300 flex items-center justify-center">
          <FiImage className="text-gray-400 text-xl" />
        </div>
      )}
    </div>
  );

  const renderAllBuyersTab = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            All Buyers ({allBuyers.length})
          </h3>
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
                // Extract buyer and company data properly using helper functions
                const buyer = getBuyerData(buyerData);
                const company = getCompanyData(buyerData);
                console.log(`Buyer ${index + 1}:`, buyer);
                console.log(`Company ${index + 1}:`, company);
                return (
                  <tr key={buyer.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiUser className="text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {buyer.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {buyer.email || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {buyer.mobile || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {company.company_name || 'N/A'}
                      </div>
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
                        onChange={(e) => updateBuyerStatus(buyer.id, e.target.value)}
                        disabled={loading}
                        className={`text-sm px-2 py-1 rounded-md border focus:outline-none focus:ring-2 transition-colors ${
                          loading
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
                        {/* View Button - Blue with Eye Icon */}
                        <button
                          onClick={() => handleView(buyer.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Buyer Details"
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        {/* Edit Button - Green with Pencil Icon */}
                        <button
                          onClick={() => handleEdit(buyer.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="Edit Buyer"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        {/* Delete Button - Red with Trash Icon */}
                        <button
                          onClick={() => handleDelete(buyerData)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete Buyer"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                        {/* Orders Button - Purple with Package Icon */}
                        <button
                          onClick={() => handleProducts(buyer.id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                          title="View Buyer Orders"
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
        {allBuyers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No buyers found
          </div>
        )}
      </div>
    </div>
  );

  const renderProductsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FiPackage className="text-purple-500" />
            Buyer Orders - {selectedBuyer?.buyer?.name || 'Unknown'}
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
                    const totalQuantity = order.products.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0);
                    const totalAmount = order.products.reduce((sum, p) => sum + (parseFloat(p.price || 0) * parseInt(p.quantity || 0)), 0);
                    const productNamesArray = order.products.map(p => p.name || 'Unknown Product');
                    const uniqueProductNames = [...new Set(productNamesArray)].join(', ');
                    const statuses = order.products.map(p => p.order_status).filter(Boolean);
                    const uniqueStatuses = [...new Set(statuses)];
                    const orderStatus = uniqueStatuses.length === 1 ? uniqueStatuses[0] : uniqueStatuses.join(', ');
                    const statusClass = orderStatus === 'Delivered'
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
                          {uniqueProductNames.length > 50 ? `${uniqueProductNames.substring(0, 50)}...` : uniqueProductNames}
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Buyer Management</h1>
          <p className="text-gray-600 mt-2">Manage and view all buyers</p>
        </div>
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error: </strong>{error}
            <button
              onClick={() => setError('')}
              className="float-right font-bold"
            >
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
                  Buyer Details - {selectedBuyer.buyer?.name}
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
              <div className="p-6">
                {/* View Modal Tabs */}
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
                {/* Buyer Information Tab */}
                {viewModalActiveTab === 'buyer' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-1">
                      <InfoField label="ID" value={selectedBuyer.buyer?.id} />
                      <InfoField label="Name" value={selectedBuyer.buyer?.name} />
                      <InfoField label="Mobile" value={selectedBuyer.buyer?.mobile} />
                      <InfoField label="Email" value={selectedBuyer.buyer?.email} />
                      <InfoField label="Approval Status" value={selectedBuyer.buyer?.approve_status} />
                      <InfoField label="Device Token" value={selectedBuyer.buyer?.device_token} />
                      <InfoField label="Created Date" value={selectedBuyer.buyer?.created_at} type="date" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-600 mb-2 sm:mb-0">Profile Image</span>
                        {selectedBuyer.buyer?.image ? (
                          <img
                            src={`${API_BASE}${selectedBuyer.buyer.image}`}
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
                {/* Company Information Tab */}
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
                {/* KYC Information Tab */}
                {viewModalActiveTab === 'kyc' && selectedBuyer.kyc && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-1">
                      <InfoField label="Aadhar Number" value={selectedBuyer.kyc.aadhar_number} />
                      <InfoField label="Driving License Number" value={selectedBuyer.kyc.driving_license_number} />
                      <InfoField label="Driving License DOB" value={selectedBuyer.kyc.driving_license_dob} />
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
                          src={selectedBuyer.kyc.driving_license_front ? `${API_BASE}${selectedBuyer.kyc.driving_license_front}` : ''}
                          alt="Driving License Front"
                          label="License Front"
                        />
                        <ImagePreview
                          src={selectedBuyer.kyc.driving_license_back ? `${API_BASE}${selectedBuyer.kyc.driving_license_back}` : ''}
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
                      handleEdit(selectedBuyer.buyer?.id);
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
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter buyer name"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            formErrors.name
                              ? 'border-red-500 focus:ring-red-200'
                              : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                          }`}
                        />
                        {formErrors.name && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                        )}
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
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
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter email address"
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            formErrors.email
                              ? 'border-red-500 focus:ring-red-200'
                              : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                          }`}
                        />
                        {formErrors.email && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                        )}
                      </div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {showAddModal ? "Password" : "Password (Optional)"} {showAddModal && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder={showAddModal ? "Enter password" : "Leave blank to keep current"}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                            formErrors.password
                              ? 'border-red-500 focus:ring-red-200'
                              : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                          }`}
                        />
                        {formErrors.password && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                        )}
                        {!showAddModal && (
                          <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
                        )}
                      </div>
                      {showEditModal && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Approval Status</label>
                          <select
                            name="approve_status"
                            value={formData.approve_status}
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
                        <FileUpload
                          name="image"
                          label="Profile Image"
                          preview={filePreviews.image}
                        />
                      </div>
                    </div>
                  </div>
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
                          value={formData.company_name}
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
                          value={formData.company_website}
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
                          value={formData.company_GST_number}
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
                          value={formData.IEC_code}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter IEC code"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Annual Turnover</label>
                        <select
                          name="annual_turnover"
                          value={formData.annual_turnover}
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
                          value={formData.facebook_link}
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
                          value={formData.linkedin_link}
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
                          value={formData.insta_link}
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
                          value={formData.city}
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
                          value={formData.state}
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
                          value={formData.pincode}
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
                          value={formData.aadhar_number}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter Aadhar number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driving License Number</label>
                        <input
                          type="text"
                          name="driving_license_number"
                          value={formData.driving_license_number}
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
                          value={formData.driving_license_dob}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    {loading ? 'Saving...' : (showAddModal ? 'Create Buyer' : 'Update Buyer')}
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
                  Are you sure you want to delete buyer <strong>{selectedBuyer.buyer?.name || selectedBuyer.name}</strong>? This action cannot be undone.
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