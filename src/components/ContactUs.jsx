import React, { useState, useEffect } from 'react';
import {
  FiRefreshCw,
  FiSearch,
  FiMail,
  FiUser,
  FiPhone,
  FiMessageSquare,
  FiCalendar,
  FiX,
  FiAlertCircle,
  FiTrash2
} from 'react-icons/fi';

const API_BASE_URL = "https://adminapi.kevelion.com";

const ContactUs = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/contact/`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setContacts(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      setError(`Failed to fetch contact messages: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    setDeletingId(id);
    try {
      const response = await fetch(`${API_BASE_URL}/contact/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete message: ${response.status}`);
      }

      // Optimistically update the UI or refetch
      setContacts(contacts.filter(c => c.id !== id));
      alert("Message deleted successfully!");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

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

  const filteredContacts = contacts.filter(c =>
    !searchTerm ||
    (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.mobile && c.mobile.includes(searchTerm)) ||
    (c.message && c.message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiMail className="text-blue-600" />
              Contact Submissions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review and manage messages from the website contact form.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search by name, email, or message..."
                className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none w-full md:w-72 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={fetchContacts}
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
      <div className="p-6 pb-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Messages</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{contacts.length}</p>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            <FiMail />
          </div>
        </div>
         <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Latest Submission</p>
            <p className="text-sm font-bold text-gray-900 mt-1 truncate max-w-[150px]">
              {contacts.length > 0 ? formatDate(contacts[0].created_at) : 'N/A'}
            </p>
          </div>
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
            <FiCalendar />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 flex-1">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <FiAlertCircle className="flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Message Content</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-medium">Loading Submissions...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FiMessageSquare className="text-gray-200 text-5xl" />
                        <p className="text-gray-500 font-medium">No contact messages found.</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-gray-400">#{c.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <FiUser className="text-gray-400 text-xs" />
                          <span className="text-sm font-bold text-gray-800">{c.name || 'Anonymous'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiMail className="text-gray-400 text-xs" />
                          <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">{c.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiPhone className="text-gray-400 text-xs" />
                          <span className="text-xs text-gray-500">{c.mobile || 'No Mobile'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs md:max-w-md">
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed" title={c.message}>
                          {c.message || <span className="italic text-gray-400">No message provided</span>}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
                        {formatDate(c.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedContact(c);
                            setShowModal(true);
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-xs font-bold"
                          title="View Message"
                        >
                          View Full
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className={`p-2 rounded-lg transition-all ${deletingId === c.id ? 'bg-gray-100 text-gray-400' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                          title="Delete Message"
                        >
                          {deletingId === c.id ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <FiTrash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-blue-600 text-white flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FiMail />
                Message from {selectedContact.name}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-sm font-semibold text-gray-800 break-all">{selectedContact.email}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mobile</p>
                    <p className="text-sm font-semibold text-gray-800">{selectedContact.mobile || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Message</p>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 min-h-[150px]">
                    <p className="text-sm text-gray-800 leading-relaxed italic">
                      "{selectedContact.message || 'Empty message'}"
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase px-1">
                  <span>Sent on: {formatDate(selectedContact.created_at)}</span>
                  <span>ID: #{selectedContact.id}</span>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUs;
