import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', unit: 'units', min_stock: 10, description: '' };
const UNITS = ['units', 'pieces', 'bags', 'boxes', 'gallons', 'kg', 'tons', 'meters', 'rolls'];

/* ── Modal ──────────────────────────────────────────────────── */
function ItemModal({ mode, initial, onClose, onSaved }) {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(initial || emptyForm);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  const close = () => { setVisible(false); setTimeout(onClose, 240); };
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      if (isEdit) { await api.put(`/items/${initial.id}`, form); toast.success('Item updated!'); }
      else        { await api.post('/items', form); toast.success('Item created!'); }
      onSaved(); close();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving item.'); }
    finally { setLoading(false); }
  };

  return (
    <div className={`um-overlay ${visible ? 'um-overlay--in' : ''}`}
      onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className={`um-modal ${visible ? 'um-modal--in' : ''}`}>
        <div className="um-modal-header"
          style={{ background: isEdit ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : 'linear-gradient(135deg,#0f172a,#065f46)' }}>
          <div className="um-modal-icon">{isEdit ? '✏️' : '📦'}</div>
          <div>
            <h2 className="um-modal-title">{isEdit ? 'Edit Item' : 'Add New Item'}</h2>
            <p className="um-modal-sub">{isEdit ? `Editing: ${initial.name}` : 'Add item to product catalog'}</p>
          </div>
          <button className="um-close-btn" onClick={close}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="um-form record-form-grid">
          <div className="um-field">
            <label className="um-label">Item Name <span className="um-required">*</span></label>
            <input className="um-input" name="name" type="text" value={form.name}
              onChange={handleChange} required placeholder="e.g. Cement" />
          </div>
          <div className="um-field">
            <label className="um-label">Unit</label>
            <select className="um-input" name="unit" value={form.unit} onChange={handleChange}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="um-field">
            <label className="um-label">Minimum Stock Level</label>
            <input className="um-input" name="min_stock" type="number" min="0"
              value={form.min_stock} onChange={handleChange} placeholder="10" />
          </div>
          <div className="um-field um-field--full">
            <label className="um-label">Description</label>
            <textarea className="um-input um-textarea" name="description" rows={3}
              value={form.description} onChange={handleChange} placeholder="Optional description..." />
          </div>
          <div className="um-actions">
            <button type="button" className="um-btn-cancel" onClick={close}>Cancel</button>
            <button type="submit" className="um-btn-submit" disabled={loading}
              style={{ background: isEdit ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : 'linear-gradient(135deg,#065f46,#059669)' }}>
              {loading ? <><span className="btn-spinner" /> Saving…</> : isEdit ? '✅ Save Changes' : '✅ Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function Items() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems]   = useState([]);
  const [modal, setModal]   = useState(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    try { const r = await api.get('/items'); setItems(r.data); }
    catch { toast.error('Failed to load items.'); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async id => {
    if (!window.confirm('Delete this item from the catalog?')) return;
    try { await api.delete(`/items/${id}`); toast.success('Item deleted.'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete.'); }
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page">
      {modal && <ItemModal mode={modal.mode} initial={modal.item} onClose={() => setModal(null)} onSaved={load} />}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Product Catalog</h1>
          <p className="page-sub">Manage all items available in the store</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setModal({ mode: 'create', item: { ...emptyForm } })}>
            + Add Item
          </button>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Items', value: items.length, icon: '📦', color: '#3b82f6' },
          { label: 'Units',       value: [...new Set(items.map(i => i.unit))].length, icon: '📏', color: '#7c3aed' },
          { label: 'Avg Min Stock', value: items.length ? Math.round(items.reduce((s,i) => s + Number(i.min_stock), 0) / items.length) : 0, icon: '⚖️', color: '#059669' },
        ].map(c => (
          <div key={c.label} style={{
            background: '#fff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0',
            boxShadow: '0 2px 12px rgba(15,23,42,.06)', display: 'flex', alignItems: 'center', gap: 14,
            transition: 'box-shadow .2s, transform .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 24px ${c.color}22`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(15,23,42,.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${c.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{c.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 className="card-title">All Items</h2>
            <span className="badge-blue">{filtered.length}</span>
          </div>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" type="text" placeholder="Search item…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th><th>Item Name</th><th>Unit</th>
                <th>Min Stock</th><th>Description</th><th>Created</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isAdmin ? 7 : 6} className="empty-cell">
                  {search ? 'No items match your search.' : 'No items in catalog yet.'}
                </td></tr>
              ) : filtered.map((item, i) => (
                <tr key={item.id} className="record-row">
                  <td style={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f618,#7c3aed18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
                      <span className="item-badge">{item.name}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 600 }}>{item.unit}</span>
                  </td>
                  <td>
                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                      ⚖️ {item.min_stock}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: '#64748b', maxWidth: 200 }}>
                    {item.description || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 12, color: '#94a3b8' }}>
                    {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  {isAdmin && (
                    <td className="action-cell">
                      <button className="btn-edit-icon" title="Edit item"
                        onClick={() => setModal({ mode: 'edit', item: { id: item.id, name: item.name, unit: item.unit, min_stock: item.min_stock, description: item.description || '' } })}>
                        ✏️
                      </button>
                      <button className="btn-delete" title="Delete item" onClick={() => handleDelete(item.id)}>🗑️</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
