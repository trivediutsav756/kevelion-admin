import React, { useEffect, useMemo, useState } from 'react';
import { FiEye, FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

const Faqs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    status: 'active'
  });

  const API_BASE_URL = 'https://kevelionapi.kevelion.com';

  const endpoints = useMemo(
    () => ({
      list: `${API_BASE_URL}/faqs`,
      active: `${API_BASE_URL}/activefaq`,
      byId: (id) => `${API_BASE_URL}/faq/${id}`,
      create: `${API_BASE_URL}/faq`,
      update: (id) => `${API_BASE_URL}/faq/${id}`,
      delete: (id) => `${API_BASE_URL}/faq/${id}`
    }),
    [API_BASE_URL]
  );

  const normalizeFaqList = (data) => {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.faqs)) return data.faqs;
    if (data && data.data && Array.isArray(data.data.faqs)) return data.data.faqs;
    return [];
  };

  const normalizeFaqItem = (data) => {
    if (!data) return null;
    if (data.data && typeof data.data === 'object') return data.data;
    if (data.faq && typeof data.faq === 'object') return data.faq;
    return data;
  };

  const buildFaqIdUrlCandidates = (id) => {
    const base = API_BASE_URL;
    const cleanId = String(id);
    return [
      `${base}/faq/${cleanId}`,
      `${base}/faq/${cleanId}/`,
      `${base}/faqs/${cleanId}`,
      `${base}/faqs/${cleanId}/`
    ];
  };

  const tryFetchFirstOk = async (candidates, options) => {
    let lastResponse;
    let lastPayload;

    for (const url of candidates) {
      try {
        const response = await fetch(url, options);
        lastResponse = response;

        const contentType = response.headers.get('content-type');
        const payload =
          contentType && contentType.includes('application/json') ? await response.json() : await response.text();
        lastPayload = payload;

        if (response.ok) {
          return { response, payload };
        }

        if (response.status !== 404) {
          const message = typeof payload === 'string' ? payload : payload?.message;
          throw new Error(message || `Request failed (HTTP ${response.status})`);
        }
      } catch (err) {
        if (!lastResponse) {
          throw err;
        }
      }
    }

    if (lastResponse) {
      const message = typeof lastPayload === 'string' ? lastPayload : lastPayload?.message;
      throw new Error(message || `Route not found (HTTP ${lastResponse.status})`);
    }

    throw new Error('Request failed');
  };

  const getFaqQuestion = (faq) => faq?.question ?? faq?.Question ?? faq?.faq_question ?? faq?.faqQuestion ?? '';
  const getFaqAnswer = (faq) => faq?.answer ?? faq?.Answer ?? faq?.faq_answer ?? faq?.faqAnswer ?? '';
  const getFaqStatus = (faq) => faq?.status ?? faq?.Status ?? faq?.faq_status ?? faq?.faqStatus ?? '';

  const fetchFaqs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(endpoints.list, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      });

      const contentType = response.headers.get('content-type');
      const payload = contentType && contentType.includes('application/json') ? await response.json() : await response.text();

      if (!response.ok) {
        const message = typeof payload === 'string' ? payload : payload?.message;
        throw new Error(message || `Failed to fetch FAQs (HTTP ${response.status})`);
      }

      setFaqs(normalizeFaqList(payload));
    } catch (err) {
      setFaqs([]);
      setError(err?.message || 'Failed to fetch FAQs');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaq = async (id) => {
    const candidates = buildFaqIdUrlCandidates(id);
    const { payload } = await tryFetchFirstOk(candidates, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    });

    return normalizeFaqItem(payload);
  };

  const resetForm = () => {
    setFormData({
      question: '',
      answer: '',
      status: 'active'
    });
    setSelectedFaq(null);
    setIsEditMode(false);
    setShowAddEditModal(false);
    setShowViewModal(false);
    setShowDeleteModal(false);
    setDeleteTarget(null);
    setError('');
  };

  const openDeleteModal = (faq) => {
    setError('');
    setDeleteTarget(faq);
    setShowDeleteModal(true);
  };

  const deleteFaq = async (id) => {
    const candidates = buildFaqIdUrlCandidates(id);
    const { payload } = await tryFetchFirstOk(candidates, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json'
      }
    });

    return payload;
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    setSubmitLoading(true);
    setError('');
    setSuccess('');

    try {
      await deleteFaq(deleteTarget.id);
      setSuccess('FAQ deleted successfully!');
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchFaqs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to delete FAQ');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsEditMode(false);
    setShowAddEditModal(true);
  };

  const handleViewFaq = async (id) => {
    setError('');
    try {
      const data = await fetchFaq(id);
      setSelectedFaq(data);
      setShowViewModal(true);
    } catch (err) {
      setError(err?.message || 'Failed to fetch FAQ details');
    }
  };

  const handleOpenEditModal = async (id) => {
    setError('');
    try {
      const data = await fetchFaq(id);
      setSelectedFaq(data);
      setFormData({
        question: getFaqQuestion(data) || '',
        answer: getFaqAnswer(data) || '',
        status: getFaqStatus(data) || 'active'
      });
      setIsEditMode(true);
      setShowAddEditModal(true);
    } catch (err) {
      setError(err?.message || 'Failed to fetch FAQ details');
    }
  };

  const createFaq = async (payload) => {
    const response = await fetch(endpoints.create, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const contentType = response.headers.get('content-type');
    const data = contentType && contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      const message = typeof data === 'string' ? data : data?.message;
      throw new Error(message || `Failed to create FAQ (HTTP ${response.status})`);
    }

    return data;
  };

  const updateFaq = async (id, payload) => {
    const candidates = buildFaqIdUrlCandidates(id);
    const { payload: data } = await tryFetchFirstOk(candidates, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      question: (formData.question || '').trim(),
      answer: (formData.answer || '').trim(),
      status: formData.status
    };

    if (!payload.question) {
      setError('Question is required');
      setSubmitLoading(false);
      return;
    }

    if (!payload.answer) {
      setError('Answer is required');
      setSubmitLoading(false);
      return;
    }

    if (!payload.status) {
      setError('Status is required');
      setSubmitLoading(false);
      return;
    }

    try {
      if (isEditMode) {
        if (!selectedFaq?.id) {
          throw new Error('FAQ id missing for update');
        }
        await updateFaq(selectedFaq.id, payload);
        setSuccess('FAQ updated successfully!');
      } else {
        await createFaq(payload);
        setSuccess('FAQ created successfully!');
      }

      await fetchFaqs();
      setTimeout(() => setSuccess(''), 3000);
      resetForm();
    } catch (err) {
      setError(err?.message || (isEditMode ? 'Failed to update FAQ' : 'Failed to create FAQ'));
    } finally {
      setSubmitLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">FAQ Management</h1>
        <p className="text-gray-600 mt-1">Manage Frequently Asked Questions</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-700">All FAQs ({faqs.length})</h2>
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FiPlus className="text-lg" />
          Add FAQ
        </button>
      </div>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
          <strong className="font-bold">Success: </strong>
          <span className="block sm:inline">{success}</span>
          <button onClick={() => setSuccess('')} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button onClick={() => setError('')} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <span className="text-2xl">&times;</span>
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {loading && !showAddEditModal && !showViewModal ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No FAQs found</p>
            <p className="text-sm text-gray-400 mt-2">Click "Add FAQ" to create your first FAQ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {faqs.map((faq, index) => (
                  <tr key={faq.id || index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">{faq.id ?? 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{getFaqQuestion(faq) || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 max-w-md truncate" title={getFaqAnswer(faq) || ''}>
                        {getFaqAnswer(faq) || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          (getFaqStatus(faq) || '').toLowerCase() === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {getFaqStatus(faq) || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewFaq(faq.id)}
                          className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Details"
                          disabled={!faq.id}
                        >
                          <FiEye className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(faq.id)}
                          className="p-2 text-green-500 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                          title="Edit FAQ"
                          disabled={!faq.id}
                        >
                          <FiEdit2 className="text-lg" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(faq)}
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete FAQ"
                          disabled={!faq.id}
                        >
                          <FiTrash2 className="text-lg" />
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

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Confirm Delete</h2>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTarget(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800 font-bold text-lg mb-2">Warning</p>
                <p className="text-red-700 text-sm">
                  This action cannot be undone. Are you sure you want to delete this FAQ?
                </p>
                {deleteTarget?.question && (
                  <p className="text-red-800 text-sm mt-3">
                    <span className="font-semibold">Question:</span> {deleteTarget.question}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                  disabled={submitLoading}
                >
                  {submitLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showViewModal && selectedFaq && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold text-gray-800">FAQ Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">FAQ ID</label>
                <p className="text-sm text-gray-900 font-mono">{selectedFaq.id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Question</label>
                <p className="text-gray-900">{selectedFaq.question || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Answer</label>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedFaq.answer || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <p className="text-gray-900">{selectedFaq.status || 'N/A'}</p>
              </div>
            </div>

            <div className="flex justify-end p-6 border-t bg-gray-50 gap-3">
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  if (selectedFaq?.id) {
                    handleOpenEditModal(selectedFaq.id);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                disabled={!selectedFaq?.id}
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-lg">
              <h2 className="text-xl font-semibold">{isEditMode ? 'Edit FAQ' : 'Add New FAQ'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="question"
                    value={formData.question}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter question"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="answer"
                    value={formData.answer}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter answer"
                    rows={5}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : isEditMode ? (
                    'Update FAQ'
                  ) : (
                    'Add FAQ'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faqs;
