import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Slider = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);       // Add/Edit modal
  const [editingSlider, setEditingSlider] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false); // View modal
  const [viewingSlider, setViewingSlider] = useState(null);

  const [formData, setFormData] = useState({
    banner_image: '',
    tag_line: '',
    CTA_button: '',
    CTA_button_link: '',
    sort_order: 0,
    status: 'active'
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const API_BASE_URL = 'https://rettalion.apxfarms.com';

  // Fetch all sliders
  const fetchSliders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/sliders`);
      setSliders(response.data);
    } catch (error) {
      console.error('Error fetching sliders:', error);
      alert('Error fetching sliders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single slider
  const fetchSlider = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/slider/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching slider:', error);
      throw error;
    }
  };

  // Create slider
  const createSlider = async (submitData) => {
    try {
      await axios.post(`${API_BASE_URL}/slider`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchSliders();
      alert('Slider created successfully!');
    } catch (error) {
      console.error('Error creating slider:', error);
      alert('Error creating slider');
      throw error;
    }
  };

  // Update slider
  const updateSlider = async (id, submitData) => {
    try {
      await axios.patch(`${API_BASE_URL}/slider/${id}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchSliders();
      alert('Slider updated successfully!');
    } catch (error) {
      console.error('Error updating slider:', error);
      alert('Error updating slider');
      throw error;
    }
  };

  // Toggle status (new function for quick status update without alert)
  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await axios.patch(`${API_BASE_URL}/slider/${id}`, { status: newStatus });
      await fetchSliders();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Error toggling status');
    }
  };

  // Delete slider
  const deleteSlider = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slider?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/slider/${id}`);
      await fetchSliders();
      alert('Slider deleted successfully!');
    } catch (error) {
      console.error('Error deleting slider:', error);
      alert('Error deleting slider');
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!editingSlider && !imageFile) {
      alert('Please select a banner image.');
      return;
    }
    try {
      const submitData = new FormData();
      // Only append banner_image if a new file is selected
      if (imageFile) {
        submitData.append('banner_image', imageFile);
      }
      // Append other fields except status
      Object.keys(formData).forEach(key => {
        if (key !== 'banner_image' && key !== 'status') {
          submitData.append(key, formData[key]);
        }
      });
      // Set status to active for new sliders
      if (!editingSlider) {
        submitData.append('status', 'active');
      }
      if (editingSlider) {
        await updateSlider(editingSlider.id, submitData);
      } else {
        await createSlider(submitData);
      }
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving slider:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      banner_image: '',
      tag_line: '',
      CTA_button: '',
      CTA_button_link: '',
      sort_order: 0,
      status: 'active'
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingSlider(null);
  };

  // Cleanup preview URL on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleEdit = async (slider) => {
    try {
      const sliderData = await fetchSlider(slider.id);
      setFormData(sliderData);
      setEditingSlider(slider);
      setImageFile(null);
      setImagePreview(null); // Clear any previous preview
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching slider for edit:', error);
    }
  };

  const handleNewSlider = () => {
    resetForm();
    setShowModal(true);
  };

  const handleView = (slider) => {
    setViewingSlider(slider);
    setShowViewModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Slider Management</h1>
        <p className="text-gray-600">Manage your website sliders with CRUD operations</p>
      </div>

      {/* Slider Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-700">Slider Management</h2>
          <button
            onClick={handleNewSlider}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Add New Slider
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tag Line
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTA Button
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sort Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sliders.map((slider) => (
                  <tr key={slider.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <img
                        src={`${API_BASE_URL}${slider.banner_image}`}
                        alt={slider.tag_line}
                        className="h-16 w-24 object-cover rounded"
                      />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {slider.tag_line}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {slider.CTA_button}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {slider.sort_order}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        onClick={() => toggleStatus(slider.id, slider.status)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                          slider.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {slider.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-4">
                        {/* View */}
                        <button
                          onClick={() => handleView(slider)}
                          className="p-2 rounded-full hover:bg-blue-50 transition-colors"
                          aria-label="View"
                          title="View"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 text-blue-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2.25 12c2.25-4.5 6.75-7.5 9.75-7.5s7.5 3 9.75 7.5c-2.25 4.5-6.75 7.5-9.75 7.5S4.5 16.5 2.25 12z" />
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleEdit(slider)}
                          className="p-2 rounded-full hover:bg-green-50 transition-colors"
                          aria-label="Edit"
                          title="Edit"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 text-green-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12.5 5.5l6 6" />
                            <path d="M4 20l3.5-.9L19 7.6a2.121 2.121 0 10-3-3L4.5 16.1 4 20z" />
                          </svg>
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => deleteSlider(slider.id)}
                          className="p-2 rounded-full hover:bg-red-50 transition-colors"
                          aria-label="Delete"
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6 text-red-600"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                            <path d="M10 11v6" />
                            <path d="M14 11v6" />
                            <path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
                          </svg>
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

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                {editingSlider ? 'Edit Slider' : 'Add New Slider'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Banner Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={!editingSlider}
                  />
                  {editingSlider && formData.banner_image && !imageFile && !imagePreview && (
                    <img
                      src={`${API_BASE_URL}${formData.banner_image}`}
                      alt="Current"
                      className="mt-2 w-full h-32 object-cover rounded"
                    />
                  )}
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-2 w-full h-32 object-cover rounded"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tag Line
                  </label>
                  <input
                    type="text"
                    name="tag_line"
                    value={formData.tag_line}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    name="CTA_button"
                    value={formData.CTA_button}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Button Link
                  </label>
                  <input
                    type="url"
                    name="CTA_button_link"
                    value={formData.CTA_button_link}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    name="sort_order"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    {editingSlider ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal for View */}
      {showViewModal && viewingSlider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Slider Details</h3>

              <div className="rounded overflow-hidden mb-4">
                <img
                  src={`${API_BASE_URL}${viewingSlider.banner_image}`}
                  alt={viewingSlider.tag_line}
                  className="w-full h-64 object-cover"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="w-32 text-gray-500">Tag Line:</span>
                  <span className="font-medium text-gray-900">{viewingSlider.tag_line}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 text-gray-500">CTA Text:</span>
                  <span className="text-gray-900">{viewingSlider.CTA_button}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 text-gray-500">CTA Link:</span>
                  <a
                    href={viewingSlider.CTA_button_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {viewingSlider.CTA_button_link}
                  </a>
                </div>
                <div className="flex items-center">
                  <span className="w-32 text-gray-500">Sort Order:</span>
                  <span className="text-gray-900">{viewingSlider.sort_order}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 text-gray-500">Status:</span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      viewingSlider.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {viewingSlider.status}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setViewingSlider(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingSlider);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Edit This Slider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Slider;