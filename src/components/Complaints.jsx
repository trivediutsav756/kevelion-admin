import React, { useState, useEffect, useRef } from 'react';
import {
  FiRefreshCw,
  FiSearch,
  FiMessageSquare,
  FiUser,
  FiTruck,
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiX,
  FiSend,
  FiAlertCircle,
  FiChevronDown
} from 'react-icons/fi';

const API_BASE_URL = "https://adminapi.kevelion.com";

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('resolved');
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/complaint`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setComplaints(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      setError(`Failed to fetch complaints: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        order_product_id: selectedComplaint.order_product_id,
        complaint: selectedComplaint.complaint,
        admin_reply: replyText.trim(),
        status: replyStatus
      };

      const updateUrl = `${API_BASE_URL}/complaint/${selectedComplaint.id}`;
      console.log('Hitting API with PATCH (JSON):', updateUrl, payload);

      const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`Server error (${response.status}): ${errorText || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('API Success Response:', result);

      if (result.success === false) {
        throw new Error(result.message || 'Server rejected the update (success: false)');
      }

      // Instead of manual update, refetch to verify persistence
      await fetchComplaints();

      setShowReplyModal(false);
      setSelectedComplaint(null);
      setReplyText('');
      setReplyStatus('resolved'); // Reset to default for next time
      alert('Admin reply and status updated and verified successfully!');
    } catch (err) {
      console.error('Submit Error:', err);
      alert(`Submission Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const filteredComplaints = complaints.filter(c =>
    !searchTerm ||
    (c.complaint && c.complaint.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.buyer_name && c.buyer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.seller_name && c.seller_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.id && String(c.id).includes(searchTerm))
  );

  const normalizeStatus = (s) => (s || '').toLowerCase().replace(/_|\s+/g, '');

  const StatusDropdown = ({ complaint }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const dropdownRef = useRef(null);

    const statusOptions = [
      { id: 'open', value: 'open', label: 'Open', color: 'bg-amber-50 text-amber-700 border-amber-200' },
      { id: 'in_progress', value: 'In Progress', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      { id: 'resolved', value: 'resolved', label: 'Resolved', color: 'bg-green-50 text-green-700 border-green-200' },
      { id: 'rejected', value: 'Rejected', label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200' }
    ];

    const currentStatus = statusOptions.find(opt => normalizeStatus(opt.id) === normalizeStatus(complaint.status)) || statusOptions[0];

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateStatus = async (newStatus) => {
      if (normalizeStatus(newStatus) === normalizeStatus(complaint.status)) {
        setIsOpen(false);
        return;
      }
      setUpdating(true);
      try {
        const payload = {
          order_product_id: complaint.order_product_id,
          complaint: complaint.complaint,
          admin_reply: complaint.admin_reply || "Status updated by Admin",
          status: newStatus
        };

        const response = await fetch(`${API_BASE_URL}/complaint/${complaint.id}`, {
          method: 'PATCH',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        if (result.success === false) throw new Error(result.message || 'Update failed');

        await fetchComplaints();
        setIsOpen(false);
      } catch (err) {
        alert(`Status Update Error: ${err.message}`);
      } finally {
        setUpdating(false);
      }
    };

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!updating) setIsOpen(!isOpen);
          }}
          className={`group flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all ${currentStatus.color} ${updating ? 'opacity-50' : 'hover:brightness-95 hover:shadow-sm'}`}
          disabled={updating}
        >
          {updating ? <FiRefreshCw className="animate-spin" /> : currentStatus.label}
          <FiChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'opacity-40 group-hover:opacity-100'}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {statusOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus(opt.value);
                }}
                className={`w-full text-left px-3 py-2 text-[10px] font-bold uppercase transition-colors hover:bg-gray-50 flex items-center justify-between ${normalizeStatus(complaint.status) === normalizeStatus(opt.id) ? 'text-blue-600 bg-blue-50/30' : 'text-gray-500'}`}
              >
                {opt.label}
                {normalizeStatus(complaint.status) === normalizeStatus(opt.id) && <div className="w-1 h-1 bg-blue-600 rounded-full" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiMessageSquare className="text-blue-600" />
              Complaint Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and resolve customer complaints efficiently.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by ID, User, or Content..."
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none w-full md:w-72 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={fetchComplaints}
              disabled={loading}
              className="p-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-all shadow-sm"
              title="Refresh Data"
            >
              <FiRefreshCw className={`${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="p-6 pb-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Complaints</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{complaints.length}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            <FiMessageSquare />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{complaints.filter(c => c.status?.toLowerCase() !== 'resolved').length}</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
            <FiClock />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{complaints.filter(c => c.status?.toLowerCase() === 'resolved').length}</p>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
            <FiCheckCircle />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-pulse">
            <FiAlertCircle className="flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Complaint Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Parties</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Reply</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-medium">Loading Data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredComplaints.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FiMessageSquare className="text-gray-200 text-5xl" />
                        <p className="text-gray-500 font-medium">No complaints found matching your criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredComplaints.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-gray-400">#{c.id}</td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs md:max-w-md">
                        <p className="text-xs text-blue-600 font-bold mb-1 flex items-center gap-1">
                          <FiTruck className="text-[10px]" />
                          Order Ref: {c.order_product_id}
                        </p>
                        <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed" title={c.complaint}>
                          {c.complaint}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">Submited: {formatDate(c.created_at)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center text-[10px] text-indigo-600 font-bold">B</div>
                          <span className="text-xs font-bold text-gray-700">{c.buyer_name || `Buyer #${c.buyer_id}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center text-[10px] text-orange-600 font-bold">S</div>
                          <span className="text-xs font-bold text-gray-700">{c.seller_name || `Seller #${c.seller_id}`}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusDropdown complaint={c} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[200px]">
                        {c.admin_reply ? (
                          <p className="text-xs text-gray-600 line-clamp-2 italic font-medium">
                            "{c.admin_reply}"
                          </p>
                        ) : (
                          <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">No Reply Yet</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedComplaint(c);
                          setReplyText(c.admin_reply || '');
                          setShowReplyModal(true);
                        }}
                        className="p-2.5 bg-white border border-gray-200 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white shadow-sm transition-all group-hover:scale-105"
                        title="View & Reply"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reply Modal */}
      {showReplyModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
            {/* Modal Top */}
            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FiMessageSquare className="text-blue-100" />
                  Complaint Action Panel
                </h2>
                <p className="text-blue-100/80 text-xs mt-1 font-medium italic">Resolving Issue #{selectedComplaint.id}</p>
              </div>
              <button
                onClick={() => setShowReplyModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
                disabled={submitting}
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-3">Customer Information</label>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <FiUser />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{selectedComplaint.buyer_name || 'N/A'}</p>
                      <p className="text-[10px] text-gray-500 font-medium">Buyer UID: {selectedComplaint.buyer_id}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-3">Vendor Information</label>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                      <FiTruck />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{selectedComplaint.seller_name || 'N/A'}</p>
                      <p className="text-[10px] text-gray-500 font-medium">Seller UID: {selectedComplaint.seller_id}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-3">The Complaint</label>
                <div className="p-5 bg-indigo-50/50 rounded-2xl border-2 border-dashed border-indigo-100">
                  <p className="text-sm text-indigo-900 italic leading-relaxed">
                    "{selectedComplaint.complaint}"
                  </p>
                </div>
              </div>

              {selectedComplaint.seller_reply && (
                <div className="mb-8 pl-8 border-l-4 border-orange-200">
                  <label className="block text-[10px] font-bold text-orange-400 uppercase tracking-[2px] mb-3">Seller Reply History</label>
                  <div className="p-5 bg-orange-50/30 rounded-2xl border border-orange-100">
                    <p className="text-sm text-gray-700 font-medium leading-relaxed">
                      {selectedComplaint.seller_reply}
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-8 p-6 bg-gray-50 border border-gray-100 rounded-3xl">
                <div className="mb-6">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-3">Update Resolution Status</label>
                  <div className="flex flex-wrap gap-2">
                    {['open', 'In Progress', 'resolved', 'Rejected'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setReplyStatus(status)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border-2 transition-all ${replyStatus === status
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 scale-105'
                          : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                          }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleReplySubmit}>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-3 flex items-center justify-between">
                    Admin Resolution Response
                    {selectedComplaint.admin_reply && <span className="text-amber-500 font-bold tracking-normal italic">(Editing Previous Reply)</span>}
                  </label>
                  <div className="relative">
                    <textarea
                      className="w-full h-40 p-5 bg-white border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none transition-all text-sm font-medium leading-relaxed shadow-inner"
                      placeholder="Provide a professional resolution message..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      required
                      disabled={submitting}
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] text-gray-400 font-bold">
                      {replyText.length} characters
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      type="button"
                      onClick={() => setShowReplyModal(false)}
                      className="flex-1 px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl hover:bg-gray-200 transition-all font-bold text-sm"
                      disabled={submitting}
                    >
                      Discard Changes
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] px-8 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-200 active:scale-[0.98]"
                      disabled={submitting || !replyText.trim()}
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Syncing with Server...
                        </>
                      ) : (
                        <>
                          <FiSend className="text-lg" />
                          {selectedComplaint.admin_reply ? 'Update Resolution' : 'Finalize & Send Reply'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles for scrollbar */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

// Removed duplicate import
export default Complaints;
