import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ITEMS = [
  'Steel Bars','Wheelbarrows','Ceramic Tiles','Cement',
  'Painting Brush','Color Paint','Masonry Nail','Iron Sheet',
];

const emptyForm = {
  itemname: '', quantityout: '',
  stockoutdate: new Date().toISOString().slice(0,10),
};

const StockOut = () => {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (dateFilter) params.date = dateFilter;
      const res = await api.get('/stockout', { params });
      setRecords(res.data);
    } catch { toast.error('Failed to load records.'); }
  };

  useEffect(() => { fetchRecords(); }, [search, dateFilter]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await api.put(`/stockout/${editId}`, form);
        toast.success('Record updated!');
      } else {
        await api.post('/stockout', form);
        toast.success('Stock-out recorded!');
      }
      setForm(emptyForm); setEditId(null); setShowForm(false);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving record.');
    } finally { setLoading(false); }
  };

  const handleEdit = r => {
    setForm({
      itemname: r.itemname, quantityout: r.quantityout,
      stockoutdate: r.stockoutdate?.slice(0,10),
    });
    setEditId(r.id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await api.delete(`/stockout/${id}`);
      toast.success('Record deleted.');
      fetchRecords();
    } catch { toast.error('Failed to delete.'); }
  };

  const cancelForm = () => { setForm(emptyForm); setEditId(null); setShowForm(false); };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"> Stock Out</h1>
          <p className="page-sub">Record items issued from the store</p>
        </div>
        <button id="add-stockout-btn" className="btn-primary" onClick={() => { cancelForm(); setShowForm(true); }}>
          + New Stock-Out
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <h2 className="card-title">{editId ? 'Edit Stock-Out Record' : 'New Stock-Out Record'}</h2>
          <form id="stockout-form" onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Item Name *</label>
              <select name="itemname" value={form.itemname} onChange={handleChange} required id="stockout-itemname">
                <option value="">-- Select Item --</option>
                {ITEMS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity Out *</label>
              <input id="stockout-qty" name="quantityout" type="number" min="1" value={form.quantityout} onChange={handleChange} required placeholder="e.g. 10" />
            </div>
            <div className="form-group">
              <label>Stock-Out Date *</label>
              <input id="stockout-date" name="stockoutdate" type="date" value={form.stockoutdate} onChange={handleChange} required />
            </div>
            <div className="form-actions">
              <button id="stockout-submit" type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="btn-spinner"/> : editId ? 'Update Record' : 'Save Record'}
              </button>
              <button type="button" className="btn-secondary" onClick={cancelForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Stock-Out Records</h2>
          <div className="filter-bar">
            <input
              id="stockout-search"
              type="text" placeholder=" Search item..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            <input
              id="stockout-date-filter"
              type="date" value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="date-input"
            />
            {(search || dateFilter) && (
              <button className="btn-ghost" onClick={() => { setSearch(''); setDateFilter(''); }}>Clear</button>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th><th>Item Name</th>
                <th>Quantity Out</th><th>Total Quantityty Out</th>
                <th>Date</th><th>Recorded By</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={7} className="empty-cell">No records found.</td></tr>
              ) : records.map((r, i) => (
                <tr key={r.id}>
                  <td>{i + 1}</td>
                  <td><span className="item-badge">{r.itemname}</span></td>
                  <td><span className="qty-out">-{r.quantityout}</span></td>
                  <td><strong>{r.totalquantityout}</strong></td>
                  <td>{r.stockoutdate?.slice(0,10)}</td>
                  <td>{r.recorded_by}</td>
                  <td className="action-cell">
                    <button className="btn-edit" onClick={() => handleEdit(r)}>✏️</button>
                    <button className="btn-delete" onClick={() => handleDelete(r.id)}></button>
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

export default StockOut;
