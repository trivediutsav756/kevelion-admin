import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { FiEdit2, FiEye, FiTrash2 } from "react-icons/fi";

const Slider = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingSlider, setEditingSlider] = useState(null);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSlider, setViewingSlider] = useState(null);

  const [formData, setFormData] = useState({
    banner_image: "",
    tag_line: "",
    CTA_button: "",
    CTA_button_link: "",
    sort_order: "",
    status: "active",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const API_BASE_URL = "https://adminapi.kevelion.com";

  const api = useMemo(() => {
    return axios.create({
      baseURL: API_BASE_URL,
      timeout: 20000,
      headers: { Accept: "application/json" },
    });
  }, []);

  const buildImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  const extractSlidersArray = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.sliders)) return data.sliders;
    if (Array.isArray(data?.data?.sliders)) return data.data.sliders;
    return [];
  };

  const getBackendErrorMessage = (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;

    if (typeof data === "string") {
      const match = data.match(/<pre>(.*?)<\/pre>/i);
      const extracted = match?.[1]?.trim();
      return extracted
        ? `${extracted}${status ? ` (status ${status})` : ""}`
        : `${data.slice(0, 250)}${status ? ` (status ${status})` : ""}`;
    }

    if (data?.message) return `${data.message}${status ? ` (status ${status})` : ""}`;

    if (data?.errors && typeof data.errors === "object") {
      const k = Object.keys(data.errors)[0];
      const v = data.errors[k];
      const first =
        (Array.isArray(v) && v[0]) || (typeof v === "string" ? v : undefined);
      if (first) return `${first}${status ? ` (status ${status})` : ""}`;
    }

    return `${err?.message || "Request failed"}${status ? ` (status ${status})` : ""}`;
  };

  const fetchSliders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/sliders");
      setSliders(extractSlidersArray(res.data));
    } catch (err) {
      console.error("Error fetching sliders:", err);
      alert(getBackendErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchSlider = async (id) => {
    const res = await api.get(`/slider/${id}`);
    const data = res.data;

    const slider =
      data?.data && typeof data.data === "object"
        ? data.data
        : data?.slider && typeof data.slider === "object"
        ? data.slider
        : data;

    return slider;
  };

  const createSlider = async (submitData) => {
    try {
      const res = await api.post("/slider", submitData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchSliders();
      alert(res.data?.message || "Slider created successfully!");
      return res.data;
    } catch (err) {
      console.error("Create slider error full:", err);
      throw new Error(getBackendErrorMessage(err) || "Failed to create slider");
    }
  };

  const updateSlider = async (id, submitData) => {
    const config = {
      headers: { "Content-Type": "multipart/form-data" },
    };

    try {
      const res = await api.patch(`/slider/${id}`, submitData, config);
      await fetchSliders();
      alert(res.data?.message || "Slider updated successfully!");
      return res.data;
    } catch (err) {
      const status = err?.response?.status;

      if (status && status !== 404) {
        console.error("PATCH update failed (non-404):", err);
        throw new Error(getBackendErrorMessage(err));
      }

      const fallbacks = [
        { method: "post", url: `/slider/${id}/update` },
        { method: "post", url: `/slider/update/${id}` },
        { method: "post", url: `/slider/update-slider/${id}` },
      ];

      let lastErr = err;

      for (const fb of fallbacks) {
        try {
          const res = await api.request({
            method: fb.method,
            url: fb.url,
            data: submitData,
            ...config,
          });
          await fetchSliders();
          alert(res.data?.message || "Slider updated successfully!");
          return res.data;
        } catch (e) {
          lastErr = e;
          if (e?.response?.status !== 404) break;
        }
      }

      console.error("All update routes failed:", lastErr);
      throw new Error(getBackendErrorMessage(lastErr));
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await api.patch(
        `/slider/${id}`,
        { status: newStatus },
        { headers: { "Content-Type": "application/json" } }
      );
      await fetchSliders();
    } catch (err) {
      console.error("Error toggling status:", err);
      alert(getBackendErrorMessage(err));
    }
  };

  const deleteSlider = async (id) => {
    if (!window.confirm("Are you sure you want to delete this slider?")) return;
    try {
      await api.delete(`/slider/${id}`);
      await fetchSliders();
      alert("Slider deleted successfully!");
    } catch (err) {
      console.error("Error deleting slider:", err);
      alert(getBackendErrorMessage(err));
    }
  };

  useEffect(() => {
    fetchSliders();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  };

  const resetForm = () => {
    setFormData({
      banner_image: "",
      tag_line: "",
      CTA_button: "",
      CTA_button_link: "",
      sort_order: "",
      status: "active",
    });
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setEditingSlider(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingSlider && !imageFile) {
      alert("Please select a banner image.");
      return;
    }

    const ctaButtonText = (formData.CTA_button || "").trim();
    const ctaButtonRegex = /^[A-Za-z0-9\s]*$/;
    if (ctaButtonText.length > 30) {
      alert("CTA Button Text cannot exceed 30 characters.");
      return;
    }
    if (!ctaButtonRegex.test(ctaButtonText)) {
      alert("CTA Button Text can only contain letters, numbers, and spaces.");
      return;
    }

    if (Number(formData.sort_order) < 0) {
      alert("Sort Order must be a positive number or zero.");
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("tag_line", formData.tag_line || "");
      submitData.append("CTA_button", formData.CTA_button || "");
      submitData.append("CTA_button_link", formData.CTA_button_link || "");
      submitData.append("sort_order", String(formData.sort_order || 0));
      submitData.append("status", formData.status || "active");

      if (imageFile) submitData.append("banner_image", imageFile);

      if (editingSlider) {
        await updateSlider(editingSlider.id, submitData);
      } else {
        await createSlider(submitData);
      }

      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error("Error saving slider:", error);
      alert(`Error: ${error.message || "Failed to save slider"}`);
    }
  };

  const handleEdit = async (slider) => {
    setEditingSlider(slider);
    setShowModal(true);

    setFormData({
      banner_image: slider.banner_image || "",
      tag_line: slider.tag_line || "",
      CTA_button: slider.CTA_button || "",
      CTA_button_link: slider.CTA_button_link || "",
      sort_order: slider.sort_order != null ? Number(slider.sort_order) : 0,
      status: slider.status || "active",
    });

    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);

    try {
      const sliderData = await fetchSlider(slider.id);
      setFormData((prev) => ({
        ...prev,
        banner_image: sliderData.banner_image || prev.banner_image,
        tag_line: sliderData.tag_line || prev.tag_line,
        CTA_button: sliderData.CTA_button || prev.CTA_button,
        CTA_button_link: sliderData.CTA_button_link || prev.CTA_button_link,
        sort_order:
          sliderData.sort_order != null ? Number(sliderData.sort_order) : prev.sort_order,
        status: sliderData.status || prev.status,
      }));
    } catch (err) {
      console.warn("fetchSlider failed; using row data:", getBackendErrorMessage(err));
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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Slider Management</h1>
        <p className="text-gray-500 text-sm">Manage your website banner sliders</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-wrap justify-between items-center mb-5 gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-gray-700">All Sliders ({sliders.length})</h2>
          <button onClick={handleNewSlider} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
            Add New Slider
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : sliders.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="font-medium">No sliders found</p>
            <p className="text-sm mt-1">Click "Add New Slider" to create one</p>
          </div>
        ) : (
          <>
            {/* Mobile: Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
              {sliders.map((slider) => (
                <div key={slider.id} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  <img src={buildImageUrl(slider.banner_image)} alt={slider.tag_line} className="w-full h-32 object-cover" />
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 truncate">{slider.tag_line}</p>
                    <p className="text-xs text-gray-500 truncate">{slider.CTA_button}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span onClick={() => toggleStatus(slider.id, slider.status)} className={`text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer ${slider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{slider.status}</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleView(slider)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-md"><FiEye /></button>
                        <button onClick={() => handleEdit(slider)} className="p-2 text-green-500 hover:bg-green-50 rounded-md"><FiEdit2 /></button>
                        <button onClick={() => deleteSlider(slider.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-md"><FiTrash2 /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    {['Image', 'Tag Line', 'CTA Button', 'Sort Order', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sliders.map((slider) => (
                    <tr key={slider.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <img src={buildImageUrl(slider.banner_image)} alt={slider.tag_line} className="h-16 w-24 object-cover rounded" />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{slider.tag_line}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{slider.CTA_button}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{slider.sort_order}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span onClick={() => toggleStatus(slider.id, slider.status)} className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 transition-opacity ${slider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{slider.status}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleView(slider)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-md" title="View"><FiEye /></button>
                          <button onClick={() => handleEdit(slider)} className="p-2 text-green-500 hover:bg-green-50 rounded-md" title="Edit"><FiEdit2 /></button>
                          <button onClick={() => deleteSlider(slider.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-md" title="Delete"><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">
                {editingSlider ? "Edit Slider" : "Add New Slider"}
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
                      src={buildImageUrl(formData.banner_image)}
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
                    maxLength="30"
                    pattern="[A-Za-z0-9\s]+"
                    title="Only letters, numbers, and spaces are allowed. Maximum 30 characters."
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
                    min="0"
                    title="Sort Order must be at least 0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    {editingSlider ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingSlider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Slider Details</h3>

              <div className="rounded overflow-hidden mb-4">
                <img
                  src={buildImageUrl(viewingSlider.banner_image)}
                  alt={viewingSlider.tag_line}
                  className="w-full h-64 object-cover"
                />
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