import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Section = ({ icon, title, subtitle, children }) => (
  <div style={{
    background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0',
    overflow: 'hidden', marginBottom: 24,
    boxShadow: '0 2px 12px rgba(15,23,42,.06)',
  }}>
    <div style={{
      padding: '20px 28px', borderBottom: '1px solid #f1f5f9',
      background: 'linear-gradient(135deg,#f8fafc,#f1f5f9)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        boxShadow: '0 4px 12px #3b82f640',
      }}>{icon}</div>
      <div>
        <h3 style={{ margin: 0, fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{title}</h3>
        {subtitle && <p style={{ margin: 0, fontSize: 13, color: '#64748b', marginTop: 2 }}>{subtitle}</p>}
      </div>
    </div>
    <div style={{ padding: '24px 28px' }}>{children}</div>
  </div>
);

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  /* ── Change password state ── */
  const [pwdForm, setPwdForm]   = useState({ current: '', newPwd: '', confirm: '' });
  const [showPwd, setShowPwd]   = useState({ current: false, newPwd: false, confirm: false });
  const [pwdLoading, setPwdLoading] = useState(false);

  const handlePwdChange = async e => {
    e.preventDefault();
    if (pwdForm.newPwd.length < 6) return toast.error('New password must be at least 6 characters.');
    if (pwdForm.newPwd !== pwdForm.confirm) return toast.error('Passwords do not match.');
    setPwdLoading(true);
    try {
      await api.post('/auth/reset-password', {
        username: user.username,
        newPassword: pwdForm.newPwd,
      });
      toast.success('Password changed successfully!');
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally { setPwdLoading(false); }
  };

  const EyeBtn = ({ field }) => (
    <button type="button" onClick={() => setShowPwd(s => ({ ...s, [field]: !s[field] }))}
      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16 }}>
      {showPwd[field] ? '👁️' : '🙈'}
    </button>
  );

  return (
    <div className="page">

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <div className="page-header" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title">⚙️ Settings</h1>
          <p className="page-sub">Manage your account and system preferences</p>
        </div>
      </div>

      {/* ══ PROFILE INFO ════════════════════════════════════════ */}
      <Section icon="👤" title="Profile Information" subtitle="Your account details">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* Avatar */}
          <div style={{
            width: 80, height: 80, borderRadius: 20, flexShrink: 0,
            background: 'linear-gradient(135deg,#3b82f6,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, color: '#fff',
            boxShadow: '0 8px 24px #3b82f640',
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 16 }}>
              {[
                { label: 'Username',   value: user?.username },
                { label: 'User ID',    value: `#${user?.id}` },
                { label: 'Role',       value: user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) },
                { label: 'Location',   value: 'Kigali, Rwanda' },
                { label: 'Company',    value: 'DAB Enterprise Ltd' },
                { label: 'System',     value: 'Store Management v1.0' },
              ].map(f => (
                <div key={f.label} style={{
                  background: '#f8fafc', borderRadius: 12, padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ══ CHANGE PASSWORD ══════════════════════════════════════ */}
      <Section icon="🔐" title="Change Password" subtitle="Update your account password">
        <form onSubmit={handlePwdChange}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 16, maxWidth: 700 }}>
            {[
              { key: 'newPwd',  label: 'New Password',     placeholder: 'Min 6 characters' },
              { key: 'confirm', label: 'Confirm Password', placeholder: 'Repeat new password' },
            ].map(f => (
              <div key={f.key} className="um-field">
                <label className="um-label">{f.label} <span className="um-required">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="um-input"
                    type={showPwd[f.key] ? 'text' : 'password'}
                    value={pwdForm[f.key]}
                    onChange={e => setPwdForm(p => ({ ...p, [f.key]: e.target.value }))}
                    required
                    minLength={6}
                    placeholder={f.placeholder}
                    style={{ paddingRight: 44 }}
                  />
                  <EyeBtn field={f.key} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <button type="submit" className="um-btn-submit" disabled={pwdLoading}
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', padding: '12px 28px' }}>
              {pwdLoading ? <><span className="btn-spinner" /> Saving…</> : '🔐 Update Password'}
            </button>
          </div>
        </form>
      </Section>

      {/* ══ SYSTEM INFO ══════════════════════════════════════════ */}
      <Section icon="🏢" title="System Information" subtitle="About DAB Enterprise SMS">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 14 }}>
          {[
            { icon: '🏷️', label: 'Application',  value: 'DAB Enterprise SMS' },
            { icon: '📦', label: 'Version',       value: 'v1.0.0' },
            { icon: '⚛️', label: 'Frontend',      value: 'React + Vite' },
            { icon: '🟢', label: 'Backend',       value: 'Node.js + Express' },
            { icon: '🗄️', label: 'Database',      value: 'MySQL (MariaDB)' },
            { icon: '📍', label: 'Location',      value: 'Kigali, Rwanda' },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#f8fafc', borderRadius: 12, padding: '14px 16px',
              border: '1px solid #e2e8f0', transition: 'border-color .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
            >
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{s.label}</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ══ DANGER ZONE (admin only) ══════════════════════════════ */}
      {isAdmin && (
        <div style={{
          background: '#fff5f5', borderRadius: 20,
          border: '1.5px solid #fca5a5',
          padding: '24px 28px',
          boxShadow: '0 2px 12px #ef444412',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <h3 style={{ margin: 0, color: '#991b1b', fontWeight: 700 }}>Admin Zone</h3>
              <p style={{ margin: 0, fontSize: 13, color: '#b91c1c' }}>Actions reserved for administrators only</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/users" style={{
              padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13,
              background: '#dc2626', color: '#fff', textDecoration: 'none',
              border: 'none', cursor: 'pointer', transition: 'opacity .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              👥 Manage Users
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
