import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

/* ══════════════════════════════════════════════════════════════
   Forgot Password Modal  (2-step: username → new password)
══════════════════════════════════════════════════════════════ */
const ForgotPasswordModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleVerify = e => {
    e.preventDefault();
    if (!username.trim()) return toast.error('Please enter your username.');
    setStep(2);
  };

  const handleReset = async e => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match.');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { username, newPassword });
      toast.success(res.data.message);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength = newPassword.length >= 10 ? 'strong' : newPassword.length >= 6 ? 'medium' : 'weak';
  const pwdLabel   = newPassword.length < 6 ? 'Too short' : newPassword.length < 10 ? 'Fair' : 'Strong';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon"></div>
          <div>
            <h2 className="modal-title">Reset Password</h2>
            <p className="modal-subtitle">
              {step === 1 ? 'Enter your username to continue' : `Reset password for "${username}"`}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-steps">
          <div className={`modal-step ${step >= 1 ? 'active' : ''}`}>
            <span className="step-dot">1</span>
            <span className="step-label">Identify</span>
          </div>
          <div className="step-line" />
          <div className={`modal-step ${step >= 2 ? 'active' : ''}`}>
            <span className="step-dot">2</span>
            <span className="step-label">Reset</span>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleVerify} className="modal-form">
            <div className="form-group">
              <label htmlFor="fp-username">Username</label>
              <div className="input-wrapper">
                <span className="input-icon"></span>
                <input id="fp-username" type="text" placeholder="Enter your username"
                  value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
              </div>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary">Continue →</button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset} className="modal-form">
            <div className="form-group">
              <label htmlFor="fp-new">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon"></span>
                <input id="fp-new" type={showNew ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoFocus />
                <button type="button" className="input-eye" onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                  {showNew ? '' : ''}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="fp-confirm">Confirm New Password</label>
              <div className="input-wrapper">
                <span className="input-icon"></span>
                <input id="fp-confirm" type={showConfirm ? 'text' : 'password'} placeholder="Re-enter new password"
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                <button type="button" className="input-eye" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  {showConfirm ? '' : ''}
                </button>
              </div>
            </div>
            {newPassword && (
              <div className="pwd-strength">
                <div className="pwd-bars">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`pwd-bar ${newPassword.length >= i * 3 ? pwdStrength : ''}`} />
                  ))}
                </div>
                <span className="pwd-label">{pwdLabel}</span>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   Create Account Modal
══════════════════════════════════════════════════════════════ */
const CreateAccountModal = ({ onClose }) => {
  const [form, setForm] = useState({ username: '', password: '', confirm: '', role: 'staff' });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const pwdStrength = form.password.length >= 10 ? 'strong' : form.password.length >= 6 ? 'medium' : 'weak';
  const pwdLabel   = form.password.length < 6 ? 'Too short' : form.password.length < 10 ? 'Fair' : 'Strong';

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        username: form.username,
        password: form.password,
        role: form.role,
      });
      toast.success(`Account "${form.username}" created! You can now log in.`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon" style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)' }}>✨</div>
          <div>
            <h2 className="modal-title">Create Account</h2>
            <p className="modal-subtitle">Set up your DAB Enterprise login</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Username */}
          <div className="form-group">
            <label htmlFor="ca-username">Username</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input id="ca-username" name="username" type="text"
                placeholder="Choose a username" value={form.username}
                onChange={handleChange} required autoFocus />
            </div>
          </div>

          {/* Role */}
          <div className="form-group">
            <label htmlFor="ca-role">Role</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <select id="ca-role" name="role" value={form.role} onChange={handleChange}
                style={{ paddingLeft: '40px' }}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="ca-password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input id="ca-password" name="password" type={showPwd ? 'text' : 'password'}
                placeholder="Min. 6 characters" value={form.password}
                onChange={handleChange} required />
              <button type="button" className="input-eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                {showPwd ? '' : ''}
              </button>
            </div>
            {form.password && (
              <div className="pwd-strength" style={{ marginTop: 4 }}>
                <div className="pwd-bars">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={`pwd-bar ${form.password.length >= i * 3 ? pwdStrength : ''}`} />
                  ))}
                </div>
                <span className="pwd-label">{pwdLabel}</span>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div className="form-group">
            <label htmlFor="ca-confirm">Confirm Password</label>
            <div className="input-wrapper">
              <span className="input-icon"></span>
              <input id="ca-confirm" name="confirm" type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter password" value={form.confirm}
                onChange={handleChange} required />
              <button type="button" className="input-eye" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                {showConfirm ? '' : ''}
              </button>
            </div>
            {form.confirm && form.password !== form.confirm && (
              <p className="field-error">⚠ Passwords do not match</p>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary btn-green" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   Login Page
══════════════════════════════════════════════════════════════ */
const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot]   = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.username, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-page">
        <div className="login-bg">
          <div className="login-bg-shape shape1" />
          <div className="login-bg-shape shape2" />
          <div className="login-bg-shape shape3" />
        </div>

        <div className="login-card">
          {/* ── Header ── */}
          <div className="login-header">
            <div className="login-logo">DAB</div>
            <h1 className="login-title">DAB Enterprise Ltd</h1>
            <p className="login-subtitle">Store Management System</p>
            <p className="login-location"> </p>
          </div>

          {/* ── Form ── */}
          <form className="login-form" onSubmit={handleSubmit} id="login-form">

            {/* Username */}
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <span className="input-icon"></span>
                <input id="username" name="username" type="text"
                  placeholder="Enter your username" value={form.username}
                  onChange={handleChange} required autoFocus />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon"></span>
                <input id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password" value={form.password}
                  onChange={handleChange} required />
                <button type="button" className="input-eye"
                  onClick={() => setShowPassword(v => !v)} tabIndex={-1}
                  aria-label="Toggle password visibility">
                  {showPassword ? '' : ''}
                </button>
              </div>
              {/* ── Forgot password lives HERE, below the input ── */}
              <button type="button" id="forgot-password-btn"
                className="forgot-link forgot-link--below"
                onClick={() => setShowForgot(true)}>
                 Forgot your password?
              </button>
            </div>

            {/* Sign In */}
            <button id="login-btn" type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Sign In'}
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="login-divider">
            <span>or</span>
          </div>

          {/* ── Create Account ── */}
          <button id="create-account-btn" type="button"
            className="btn-outline-green btn-full"
            onClick={() => setShowCreate(true)}>
             No account? Create one now
          </button>

          <p className="login-hint">Default credentials: admin / admin123</p>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      {showCreate && <CreateAccountModal  onClose={() => setShowCreate(false)} />}
    </>
  );
};

export default Login;
