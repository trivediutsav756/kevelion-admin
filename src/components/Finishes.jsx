import React, { useEffect, useMemo, useState } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const Finishes = () => {
  const API_BASE = 'https://adminapi.kevelion.com';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');

  const initialForm = { name: '', status: 'active', is_custom: 0 };
  const [form, setForm] = useState(initialForm);

  const normalizeList = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const fetchList = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const endpoints = [`${API_BASE}/finishes`, `${API_BASE}/finishes/`, `${API_BASE}/finish`, `${API_BASE}/finish/`];
      let data = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { headers: { Accept: 'application/json' } });
          if (res.ok) {
            data = await res.json();
            break;
          }
        } catch {}
      }
      setItems(normalizeList(data));
    } catch (e) {
      setItems([]);
      setError(e?.message || 'Failed to load finishes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter((c) => {
      const idStr = String(c?.id ?? '').toLowerCase();
      const nameStr = String(c?.name ?? '').toLowerCase();
      const statusStr = String(c?.status ?? '').toLowerCase();
      const isCustomStr = String(c?.is_custom ?? '').toLowerCase();
      return (
        idStr.includes(q) ||
        nameStr.includes(q) ||
        statusStr.includes(q) ||
        isCustomStr.includes(q)
      );
    });
  }, [items, search]);

  const handleEdit = (finish) => {
    setError('');
    setSuccess('');
    setForm({
      name: finish?.name || '',
      status: finish?.status || 'active',
      is_custom: Number(finish?.is_custom ?? 0),
    });
    setIsEditing(true);
    setEditingId(finish?.id ?? null);
    setShowForm(true);
  };

  const saveItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        name: String(form.name || '').trim(),
        status: String(form.status || 'active').trim(),
        is_custom: Number(form.is_custom ?? 0),
      };
      if (!payload.name) throw new Error('Name is required');

      if (isEditing && editingId) {
        const endpoints = [`${API_BASE}/finishes/${editingId}`, `${API_BASE}/finish/${editingId}`];
        let ok = false;
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, {
              method: 'PATCH',
              headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              ok = true;
              break;
            }
          } catch {}
        }
        if (!ok) throw new Error('Failed to update finish');
        setSuccess('Updated successfully');
      } else {
        const endpoints = [`${API_BASE}/finishes`, `${API_BASE}/finish`];
        let ok = false;
        for (const ep of endpoints) {
          try {
            const res = await fetch(ep, {
              method: 'POST',
              headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            if (res.ok) {
              ok = true;
              break;
            }
          } catch {}
        }
        if (!ok) throw new Error('Failed to create finish');
        setSuccess('Created successfully');
      }

      setShowForm(false);
      setIsEditing(false);
      setEditingId(null);
      setForm(initialForm);
      await fetchList();
    } catch (e2) {
      setError(e2?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this finish?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const endpoints = [`${API_BASE}/finishes/${id}`, `${API_BASE}/finish/${id}`];
      let ok = false;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { method: 'DELETE', headers: { Accept: 'application/json' } });
          if (res.ok) {
            ok = true;
            break;
          }
        } catch {}
      }
      if (!ok) throw new Error('Failed to delete finish');
      setSuccess('Deleted successfully');
      await fetchList();
    } catch (e) {
      setError(e?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h1 className="text-xl font-semibold text-gray-900">Finishes</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchList}
              className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 disabled:opacity-60"
              disabled={loading}
            >
              Refresh
            </button>
            <button
              onClick={() => {
                setShowForm(true);
                setIsEditing(false);
                setEditingId(null);
                setForm(initialForm);
              }}
              className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={loading}
            >
              Add Finish
            </button>
          </div>
        </div>

        {!!error && (
          <div className="mx-4 my-3 px-3 py-2 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}
        {!!success && (
          <div className="mx-4 my-3 px-3 py-2 rounded border border-green-200 bg-green-50 text-green-700 text-sm">
            {success}
          </div>
        )}

        <div className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by name or id"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              {loading && <span className="text-sm text-gray-500">Loading...</span>}
            </div>
            <div className="text-sm text-gray-500">Total: {items.length}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custom</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{c.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${String(c.status).toLowerCase() === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${Number(c.is_custom) === 1 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {Number(c.is_custom) === 1 ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-green-600 hover:text-green-900 p-1 transition duration-200"
                          title="Edit Finish"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteItem(c.id)}
                          className="text-red-600 hover:text-red-900 p-1 transition duration-200"
                          title="Delete Finish"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={5}>No finishes found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{isEditing ? 'Edit Finish' : 'Add Finish'}</h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setIsEditing(false);
                    setEditingId(null);
                    setForm(initialForm);
                  }}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={saveItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Enter finish name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    disabled={loading}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Number(form.is_custom) === 1}
                    onChange={(e) => setForm((p) => ({ ...p, is_custom: e.target.checked ? 1 : 0 }))}
                    className="h-4 w-4"
                    disabled={loading}
                  />
                  <span className="text-sm text-gray-700">Custom</span>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setIsEditing(false);
                      setEditingId(null);
                      setForm(initialForm);
                    }}
                    className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    disabled={loading}
                  >
                    {isEditing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finishes;
