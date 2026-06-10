import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', contact_person: '', phone: '', email: '', address: '' };

/* ── Modal ──────────────────────────────────────────────────── */
function SupplierModal({ mode, initial, onClose, onSaved }) {
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
      if (isEdit) { await api.put(`/suppliers/${initial.id}`, form); toast.success('Supplier updated!'); }
      else        { await api.post('/suppliers', form); toast.success('Supplier created!'); }
      onSaved(); close();
    } catch (err) { toast.error(err.response?.data?.message || 'Error saving supplier.'); }
    finally { setLoading(false); }
  };

  const fields = [
    { name: 'name',           label: 'Company Name',    type: 'text',  required: true,  placeholder: 'e.g. CIMERWA Ltd' },
    { name: 'contact_person', label: 'Contact Person',  type: 'text',  required: false, placeholder: 'e.g. Jean Pierre' },
    { name: 'phone',          label: 'Phone Number',    type: 'tel',   required: false, placeholder: '+250 788 000 000' },
    { name: 'email',          label: 'Email Address',   type: 'email', required: false, placeholder: 'info@company.rw' },
  ];

  return (
    <div className={`um-overlay ${visible ? 'um-overlay--in' : ''}`}
      onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className={`um-modal ${visible ? 'um-modal--in' : ''}`}>
        <div className="um-modal-header"
          style={{ background: isEdit ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'linear-gradient(135deg,#0f172a,#1e3a5f)' }}>
          <div className="um-modal-icon">{isEdit ? '✏️' : '🏢'}</div>
          <div>
            <h2 className="um-modal-title">{isEdit ? 'Edit Supplier' : 'Add New Supplier'}</h2>
            <p className="um-modal-sub">{isEdit ? `Editing: ${initial.name}` : 'Add a new supplier to the system'}</p>
          </div>
          <button className="um-close-btn" onClick={close}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="um-form record-form-grid">
          {fields.map(f => (
            <div key={f.name} className="um-field">
              <label className="um-label">
                {f.label} {f.required && <span className="um-required">*</span>}
              </label>
              <input className="um-input" name={f.name} type={f.type}
                value={form[f.name]} onChange={handleChange}
                required={f.required} placeholder={f.placeholder} />
            </div>
          ))}
          <div className="um-field um-field--full">
            <label className="um-label">Address</label>
            <textarea className="um-input um-textarea" name="address" rows={2}
              value={form.address} onChange={handleChange} placeholder="Physical address..." />
          </div>
          <div className="um-actions">
            <button type="button" className="um-btn-cancel" onClick={close}>Cancel</button>
            <button type="submit" className="um-btn-submit" disabled={loading}
              style={{ background: isEdit ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'linear-gradient(135deg,#0f172a,#1e3a5f)' }}>
              {loading ? <><span className="btn-spinner" /> Saving…</> : isEdit ? '✅ Save Changes' : '✅ Add Supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
export default function Suppliers() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [suppliers, setSuppliers] = useState([]);
  const [modal, setModal]         = useState(null);
  const [search, setSearch]       = useState('');

  const load = async () => {
    try { const r = await api.get('/suppliers'); setSuppliers(r.data); }
    catch { toast.error('Failed to load suppliers.'); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async id => {
    if (!window.confirm('Delete this supplier?')) return;
    try { await api.delete(`/suppliers/${id}`); toast.success('Supplier deleted.'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to delete.'); }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_person || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      {modal && <SupplierModal mode={modal.mode} initial={modal.supplier} onClose={() => setModal(null)} onSaved={load} />}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🏢 Suppliers</h1>
          <p className="page-sub">Manage supplier information and contacts</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setModal({ mode: 'create', supplier: { ...emptyForm } })}>
            + Add Supplier
          </button>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Suppliers', value: suppliers.length,       icon: '🏢', color: '#7c3aed' },
          { label: 'With Email',      value: suppliers.filter(s => s.email).length,   icon: '📧', color: '#3b82f6' },
          { label: 'With Phone',      value: suppliers.filter(s => s.phone).length,   icon: '📞', color: '#059669' },
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

      {/* Supplier Cards grid */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
          <p style={{ color: '#64748b', fontSize: 15 }}>
            {search ? 'No suppliers match your search.' : 'No suppliers added yet.'}
          </p>
          {isAdmin && !search && (
            <button className="btn-primary" style={{ marginTop: 16 }}
              onClick={() => setModal({ mode: 'create', supplier: { ...emptyForm } })}>
              + Add First Supplier
            </button>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 className="card-title">All Suppliers</h2>
              <span className="badge-blue">{filtered.length}</span>
            </div>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" type="text" placeholder="Search supplier or contact…"
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Company</th><th>Contact Person</th>
                  <th>Phone</th><th>Email</th><th>Address</th><th>Joined</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className="record-row">
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: 'linear-gradient(135deg,#7c3aed22,#5b21b622)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18,
                        }}>🏢</div>
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>{s.name}</span>
                      </div>
                    </td>
                    <td>
                      {s.contact_person
                        ? <span className="user-pill">{s.contact_person}</span>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {s.phone
                        ? <a href={`tel:${s.phone}`} style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>📞 {s.phone}</a>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {s.email
                        ? <a href={`mailto:${s.email}`} style={{ color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>📧 {s.email}</a>
                        : <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b', maxWidth: 160 }}>
                      {s.address || <span style={{ color: '#cbd5e1' }}>—</span>}
                    </td>
                    <td style={{ fontSize: 12, color: '#94a3b8' }}>
                      {new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    {isAdmin && (
                      <td className="action-cell">
                        <button className="btn-edit-icon" title="Edit supplier"
                          onClick={() => setModal({ mode: 'edit', supplier: { id: s.id, name: s.name, contact_person: s.contact_person || '', phone: s.phone || '', email: s.email || '', address: s.address || '' } })}>
                          ✏️
                        </button>
                        <button className="btn-delete" title="Delete supplier" onClick={() => handleDelete(s.id)}>🗑️</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
