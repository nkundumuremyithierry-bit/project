import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const emptyForm = {
  item_id: '', supplier_id: '', description: '',
  quantityin: '', stockindate: new Date().toISOString().slice(0, 10),
};

/* ── Confirm Delete Dialog ──────────────────────────────────── */
const ConfirmDialog = ({ record, onConfirm, onCancel }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  const close = (cb) => { setVisible(false); setTimeout(cb, 220); };
  return (
    <div className={`um-overlay ${visible ? 'um-overlay--in' : ''}`}
      onMouseDown={e => e.target === e.currentTarget && close(onCancel)}>
      <div className={`confirm-dialog ${visible ? 'um-modal--in' : ''}`}>
        <div className="confirm-icon">🗑️</div>
        <h3 className="confirm-title">Delete Record?</h3>
        <p className="confirm-msg">
          This will permanently remove the stock-in entry for<br />
          <strong>{record.itemname}</strong> — <span className="qty-in">+{record.quantityin} units</span>
        </p>
        <div className="confirm-actions">
          <button className="um-btn-cancel" onClick={() => close(onCancel)}>Cancel</button>
          <button className="confirm-btn-delete" onClick={() => close(onConfirm)}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
};

/* ── Edit / Create Modal ────────────────────────────────────── */
const StockInModal = ({ mode, initial, items, suppliers, onClose, onSaved }) => {
  const isEdit = mode === 'edit';
  const [form, setForm]     = useState(initial || emptyForm);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  const close = () => { setVisible(false); setTimeout(onClose, 240); };
  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/stockin/${initial.id}`, form);
        toast.success('Record updated successfully!');
      } else {
        await api.post('/stockin', form);
        toast.success('Stock-in recorded!');
      }
      onSaved(); close();
    } catch (err) {
      toast.error(err.response?.data?.message || `Error ${isEdit ? 'updating' : 'saving'} record.`);
    } finally { setLoading(false); }
  };

  return (
    <div className={`um-overlay ${visible ? 'um-overlay--in' : ''}`}
      onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className={`um-modal record-modal ${visible ? 'um-modal--in' : ''}`}>

        <div className="um-modal-header"
          style={{ background: isEdit ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : 'linear-gradient(135deg,#0f172a,#065f46)' }}>
          <div className="um-modal-icon">{isEdit ? '✏️' : '📥'}</div>
          <div>
            <h2 className="um-modal-title">{isEdit ? 'Edit Stock-In Record' : 'New Stock-In'}</h2>
            <p className="um-modal-sub">{isEdit ? `Editing record #${initial.id}` : 'Record items received into store'}</p>
          </div>
          <button className="um-close-btn" onClick={close}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="um-form record-form-grid">

          {/* Item */}
          <div className="um-field">
            <label className="um-label">Item <span className="um-required">*</span></label>
            <select className="um-input" name="item_id" value={form.item_id} onChange={handleChange} required>
              <option value="">-- Select Item --</option>
              {items.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
            </select>
          </div>

          {/* Quantity */}
          <div className="um-field">
            <label className="um-label">Quantity In <span className="um-required">*</span></label>
            <input className="um-input" name="quantityin" type="number" min="1"
              value={form.quantityin} onChange={handleChange} required placeholder="e.g. 50" />
          </div>

          {/* Supplier */}
          <div className="um-field">
            <label className="um-label">Supplier</label>
            <select className="um-input" name="supplier_id" value={form.supplier_id} onChange={handleChange}>
              <option value="">-- Select Supplier (optional) --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Date */}
          <div className="um-field">
            <label className="um-label">Stock-In Date <span className="um-required">*</span></label>
            <input className="um-input" name="stockindate" type="date"
              value={form.stockindate} onChange={handleChange} required />
          </div>

          {/* Description — full width */}
          <div className="um-field um-field--full">
            <label className="um-label">Description</label>
            <textarea className="um-input um-textarea" name="description" rows={3}
              value={form.description} onChange={handleChange} placeholder="Optional notes..." />
          </div>

          <div className="um-actions">
            <button type="button" className="um-btn-cancel" onClick={close}>Cancel</button>
            <button type="submit" className="um-btn-submit" disabled={loading}
              style={{ background: isEdit ? 'linear-gradient(135deg,#0f4c75,#1b6ca8)' : 'linear-gradient(135deg,#065f46,#059669)' }}>
              {loading ? <><span className="btn-spinner" /> Saving…</> : isEdit ? '✅ Update Record' : '✅ Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
const StockIn = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [records, setRecords]       = useState([]);
  const [items, setItems]           = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [modal, setModal]           = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch]         = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchAll = async () => {
    try {
      const [rRes, iRes, sRes] = await Promise.all([
        api.get('/stockin', { params: { search: search || undefined, date: dateFilter || undefined } }),
        api.get('/items'),
        api.get('/suppliers'),
      ]);
      setRecords(rRes.data);
      setItems(iRes.data);
      setSuppliers(sRes.data);
    } catch { toast.error('Failed to load data.'); }
  };

  useEffect(() => { fetchAll(); }, [search, dateFilter]);

  const handleDelete = async () => {
    try {
      await api.delete(`/stockin/${deleteTarget.id}`);
      toast.success('Record deleted.');
      fetchAll();
    } catch { toast.error('Failed to delete record.'); }
    setDeleteTarget(null);
  };

  const openEdit = r => setModal({
    mode: 'edit',
    record: {
      id: r.id,
      item_id: r.item_id,
      supplier_id: r.supplier_id || '',
      description: r.description || '',
      quantityin: r.quantityin,
      stockindate: r.stockindate?.slice(0, 10),
    },
  });

  const totalIn    = records.reduce((s, r) => s + Number(r.quantityin), 0);
  const uniqueItems = [...new Set(records.map(r => r.itemname))].length;

  return (
    <div className="page">
      {modal && (
        <StockInModal
          mode={modal.mode}
          initial={modal.record}
          items={items}
          suppliers={suppliers}
          onClose={() => setModal(null)}
          onSaved={fetchAll}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          record={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📦 Stock In</h1>
          <p className="page-sub">Record and manage items received into the store</p>
        </div>
        <button id="add-stockin-btn" className="btn-primary"
          onClick={() => setModal({ mode: 'create', record: { ...emptyForm } })}>
          + New Stock-In
        </button>
      </div>

      {/* Summary strip */}
      <div className="record-summary-strip">
        <div className="rs-item rs-item--blue">
          <span className="rs-val">{records.length}</span>
          <span className="rs-lbl">Total Records</span>
        </div>
        <div className="rs-item rs-item--green">
          <span className="rs-val">{totalIn.toLocaleString()}</span>
          <span className="rs-lbl">Units Received</span>
        </div>
        <div className="rs-item rs-item--purple">
          <span className="rs-val">{uniqueItems}</span>
          <span className="rs-lbl">Item Types</span>
        </div>
      </div>

      {/* Table card */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Stock-In Records</h2>
          <div className="filter-bar">
            <input id="stockin-search" type="text" placeholder=" Search item or supplier..."
              value={search} onChange={e => setSearch(e.target.value)} className="search-input" />
            <input id="stockin-date-filter" type="date" value={dateFilter}
              onChange={e => setDateFilter(e.target.value)} className="date-input" />
            {(search || dateFilter) && (
              <button className="btn-ghost" onClick={() => { setSearch(''); setDateFilter(''); }}>Clear</button>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th><th>Item</th><th>Description</th>
                <th>Qty In</th><th>Total Qty</th>
                <th>Supplier</th><th>Date</th><th>Recorded By</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={9} className="empty-cell">
                  {search || dateFilter ? 'No records match your filters.' : 'No stock-in records yet.'}
                </td></tr>
              ) : records.map((r, i) => (
                <tr key={r.id} className="record-row">
                  <td style={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="item-badge">{r.itemname}</span>
                      {r.item_unit && <span style={{ fontSize: 11, color: '#94a3b8' }}>/{r.item_unit}</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: '#64748b', maxWidth: 160 }}>
                    <span title={r.description}>{r.description ? r.description.slice(0, 40) + (r.description.length > 40 ? '…' : '') : '—'}</span>
                  </td>
                  <td><span className="qty-in">+{r.quantityin}</span></td>
                  <td><strong style={{ fontSize: 14 }}>{r.totalquantityin}</strong></td>
                  <td style={{ fontSize: 13 }}>
                    {r.suppliername
                      ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 14 }}>🏢</span>{r.suppliername}</span>
                      : '—'}
                  </td>
                  <td style={{ fontSize: 13 }}>{r.stockindate?.slice(0, 10)}</td>
                  <td><span className="user-pill">{r.recorded_by}</span></td>
                  <td className="action-cell">
                    {isAdmin ? (
                      <>
                        <button className="btn-edit-icon" title="Edit record" onClick={() => openEdit(r)}>✏️</button>
                        <button className="btn-delete" title="Delete record" onClick={() => setDeleteTarget(r)}>🗑️</button>
                      </>
                    ) : (
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>View only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockIn;
