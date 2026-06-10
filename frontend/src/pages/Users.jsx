import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const emptyForm = { username: '', password: '', role: 'staff' };

const ROLE_OPTIONS = [
  { value: 'staff',      label: 'Staff',      color: '#45885e' },
  { value: 'admin',      label: 'Admin',      color: '#1e40af' },
  { value: 'manager',    label: 'Manager',    color: '#6b5d83' },
  { value: 'storekeeper',label: 'Storekeeper',color: '#0b6177' },
];

const roleColor = role => ROLE_OPTIONS.find(r => r.value === role)?.color || '#64748b';
const roleLabel = role => ROLE_OPTIONS.find(r => r.value === role)?.label || role;

/* ── Eye icon ───────────────────────────────────────────────── */
const EyeIcon = ({ show }) => show
  ? <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
  : <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;

/* ── Modal ──────────────────────────────────────────────────── */
const UserModal = ({ mode, initial, onClose, onSaved }) => {
  const isEdit = mode === 'edit';
  const [form, setForm] = useState(initial || emptyForm);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 240);
  };

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        const payload = { username: form.username, role: form.role };
        if (form.password) payload.password = form.password;
        await api.put(`/auth/users/${initial.id}`, payload);
        toast.success('User updated successfully!');
      } else {
        await api.post('/auth/register', form);
        toast.success('User created successfully!');
      }
      onSaved();
      close();
    } catch (err) {
      toast.error(err.response?.data?.message || `Error ${isEdit ? 'updating' : 'creating'} user.`);
    } finally { setLoading(false); }
  };

  return (
    <div className={`um-overlay ${visible ? 'um-overlay--in' : ''}`} onMouseDown={e => e.target === e.currentTarget && close()}>
      <div className={`um-modal ${visible ? 'um-modal--in' : ''}`}>
        {/* Header */}
        <div className="um-modal-header" style={{ background: isEdit ? 'linear-gradient(135deg,#1e1b4b,#312e81)' : 'linear-gradient(135deg,#0f172a,#1e3a5f)' }}>
          <div className="um-modal-icon">{isEdit ? '' : ''}</div>
          <div>
            <h2 className="um-modal-title">{isEdit ? 'Edit User' : 'Create New User'}</h2>
            <p className="um-modal-sub">{isEdit ? `Updating: ${initial.username}` : 'Add a new system account'}</p>
          </div>
          <button className="um-close-btn" onClick={close} aria-label="Close">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="um-form">
          {/* Username */}
          <div className="um-field">
            <label className="um-label">Username <span className="um-required">*</span></label>
            <input
              className="um-input"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="Enter username"
              autoComplete="off"
            />
          </div>

          {/* Password */}
          <div className="um-field">
            <label className="um-label">
              {isEdit ? 'New Password' : 'Password'} {!isEdit && <span className="um-required">*</span>}
              {isEdit && <span className="um-hint"> (leave blank to keep current)</span>}
            </label>
            <div className="um-pwd-wrap">
              <input
                className="um-input"
                name="password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                required={!isEdit}
                placeholder={isEdit ? '••••••  (optional)' : 'Min 6 characters'}
                minLength={isEdit ? undefined : 6}
                autoComplete="new-password"
              />
              <button type="button" className="um-eye" onClick={() => setShowPwd(s => !s)}>
                <EyeIcon show={showPwd} />
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="um-field">
            <label className="um-label">Role</label>
            <div className="um-role-grid">
              {ROLE_OPTIONS.map(r => (
                <label
                  key={r.value}
                  className={`um-role-card ${form.role === r.value ? 'selected' : ''}`}
                  style={{ '--rc': r.color }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={form.role === r.value}
                    onChange={handleChange}
                    hidden
                  />
                  <span className="um-role-dot" />
                  <span className="um-role-name">{r.label}</span>
                  {form.role === r.value && <span className="um-role-check">✓</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="um-actions">
            <button type="button" className="um-btn-cancel" onClick={close}>Cancel</button>
            <button type="submit" className="um-btn-submit" disabled={loading}>
              {loading
                ? <><span className="btn-spinner" /> {isEdit ? 'Saving…' : 'Creating…'}</>
                : isEdit ? ' Save Changes' : ' Create User'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
const Users = () => {
  const [users, setUsers]       = useState([]);
  const [modal, setModal]       = useState(null); // null | { mode:'create'|'edit', user? }
  const [searchQ, setSearchQ]   = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch { toast.error('Failed to load users.'); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async u => {
    if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/auth/users/${u.id}`);
      toast.success(`User "${u.username}" deleted.`);
      fetchUsers();
    } catch { toast.error('Failed to delete user.'); }
  };

  /* Filtered list */
  const filtered = users.filter(u => {
    const matchQ = u.username.toLowerCase().includes(searchQ.toLowerCase());
    const matchR = filterRole === 'all' || u.role === filterRole;
    return matchQ && matchR;
  });

  return (
    <div className="page">
      {/* Modal */}
      {modal && (
        <UserModal
          mode={modal.mode}
          initial={modal.user}
          onClose={() => setModal(null)}
          onSaved={fetchUsers}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title"> User Management</h1>
          <p className="page-sub">Create, edit and manage system user accounts</p>
        </div>
        <button
          id="add-user-btn"
          className="btn-primary"
          onClick={() => setModal({ mode: 'create', user: { ...emptyForm } })}
        >
          + Add User
        </button>
      </div>

      {/* Stats row */}
      <div className="user-stats-row">
        {ROLE_OPTIONS.map(r => {
          const cnt = users.filter(u => u.role === r.value).length;
          return (
            <div key={r.value} className="user-stat-card" style={{ '--rc': r.color }}>
              <span className="user-stat-val">{cnt}</span>
              <span className="user-stat-lbl">{r.label}</span>
            </div>
          );
        })}
        <div className="user-stat-card" style={{ '--rc': '#0f172a' }}>
          <span className="user-stat-val">{users.length}</span>
          <span className="user-stat-lbl">Total</span>
        </div>
      </div>

      {/* Table card */}
      <div className="card">
        {/* Toolbar */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 className="card-title">System Users</h2>
            <span className="badge-blue">{filtered.length} / {users.length}</span>
          </div>
          <div className="user-toolbar">
            <div className="search-wrap">
              <span className="search-icon"></span>
              <input
                className="search-input"
                type="text"
                placeholder="Search username…"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
              />
              {searchQ && <button className="search-clear" onClick={() => setSearchQ('')}>✕</button>}
            </div>
            <select
              className="role-filter"
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="empty-cell">
                  {searchQ || filterRole !== 'all' ? 'No users match your filters.' : 'No users found.'}
                </td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.id} className="user-row">
                  <td style={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                  <td>
                    <div className="user-cell">
                      <div
                        className="user-avatar-sm"
                        style={{ background: `linear-gradient(135deg, ${roleColor(u.role)}, ${roleColor(u.role)}aa)` }}
                      >
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="user-name-cell">{u.username}</span>
                        <span className="user-id-cell">ID #{u.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="role-badge-pill"
                      style={{ background: roleColor(u.role) + '22', color: roleColor(u.role), border: `1px solid ${roleColor(u.role)}44` }}
                    >
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: '#64748b' }}>
                    {new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="action-cell">
                    <button
                      className="btn-edit-icon"
                      title="Edit user"
                      onClick={() => setModal({ mode: 'edit', user: { id: u.id, username: u.username, role: u.role, password: '' } })}
                    >
                      
                    </button>
                    <button
                      className="btn-delete"
                      title="Delete user"
                      onClick={() => handleDelete(u)}
                    >
                      
                    </button>
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

export default Users;
