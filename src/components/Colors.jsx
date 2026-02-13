import React, { useEffect, useMemo, useState } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

const Colors = () => {
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
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;
    if (data && Array.isArray(data.colors)) return data.colors;
    return [];
  };

  const normalizeItem = (data) => {
    if (!data || typeof data !== 'object') return initialForm;
    return {
      name: data.name || '',
      status: data.status || 'active',
      is_custom: Number(data.is_custom ?? 0),
    };
  };

  const fetchList = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const endpoints = [`${API_BASE}/colors`, `${API_BASE}/colors/`];
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
      setError(e?.message || 'Failed to load colors');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (color) => {
    setError('');
    setSuccess('');
    setForm({
      name: color?.name || '',
      status: color?.status || 'active',
      is_custom: Number(color?.is_custom ?? 0),
    });
    setIsEditing(true);
    setEditingId(color?.id ?? null);
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const body = {
        name: String(form.name).trim(),
        status: form.status || 'active',
        is_custom: Number(form.is_custom) ? 1 : 0,
      };
      const urls = isEditing && editingId
        ? [`${API_BASE}/colors/${editingId}`, `${API_BASE}/color/${editingId}`]
        : [`${API_BASE}/colors`, `${API_BASE}/color`];
      const method = isEditing && editingId ? 'PATCH' : 'POST';
      let ok = false, lastText = '';
      for (const url of urls) {
        try {
          const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(body),
          });
          const text = await res.text();
          lastText = text;
          if (res.ok) {
            ok = true;
            break;
          }
        } catch (e) {
          lastText = e?.message || '';
        }
      }
      if (!ok) throw new Error(lastText || 'Failed to save');
      setSuccess('Saved successfully');
      setForm(initialForm);
      setIsEditing(false);
      setEditingId(null);
      setShowForm(false);
      await fetchList();
    } catch (e) {
      setError(e?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this color?')) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const urls = [`${API_BASE}/colors/${id}`, `${API_BASE}/color/${id}`];
      let ok = false, lastText = '';
      for (const url of urls) {
        try {
          const res = await fetch(url, { method: 'DELETE', headers: { Accept: 'application/json' } });
          const text = await res.text();
          lastText = text;
          if (res.ok) {
            ok = true;
            break;
          }
        } catch (e) {
          lastText = e?.message || '';
        }
      }
      if (!ok) throw new Error(lastText || 'Failed to delete');
      setSuccess('Deleted successfully');
      await fetchList();
    } catch (e) {
      setError(e?.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => (c.name || '').toLowerCase().includes(q) || String(c.id || '').includes(q));
  }, [items, search]);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Colors</h1>
            <p className="text-sm text-gray-600">Manage color options</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              disabled={loading}
            >
              Add Color
            </button>
            <button
              onClick={() => fetchList()}
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200"
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-lg">{success}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by name or id"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
              {loading && <span className="text-sm text-gray-500">Loading...</span>}
            </div>
            <div className="text-sm text-gray-500">Total: {items.length}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Custom</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3 text-sm text-gray-800">#{c.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-sm">{Number(c.is_custom) ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        (c.status || '').toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {c.status || 'inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {c.created_at ? new Date(c.created_at).toLocaleString('en-IN') : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-green-600 hover:text-green-900 p-1 transition duration-200"
                          title="Edit Color"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteItem(c.id)}
                          className="text-red-600 hover:text-red-900 p-1 transition duration-200"
                          title="Delete Color"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-gray-500" colSpan={6}>No colors found</td>
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
                <h2 className="text-lg font-semibold text-gray-900">{isEditing ? 'Edit Color' : 'Add Color'}</h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setIsEditing(false);
                    setEditingId(null);
                    setForm(initialForm);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  ✖️
                </button>
              </div>

              <form onSubmit={submitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 bg-white"
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

export default Colors;
