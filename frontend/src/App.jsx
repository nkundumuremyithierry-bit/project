import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StockIn from './pages/StockIn';
import StockOut from './pages/StockOut';
import Report from './pages/Report';
import Users from './pages/Users';
import Inventory from './pages/Inventory';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Items from './pages/Items';
import Suppliers from './pages/Suppliers';
import toast from 'react-hot-toast';

/* ── Profile Widget ─────────────────────────────────────────── */
const ProfileWidget = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const dropRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const openDropdown = () => { setOpen(true); requestAnimationFrame(() => setVisible(true)); };
  const closeDropdown = () => { setVisible(false); setTimeout(() => setOpen(false), 250); };
  const toggleDropdown = () => open ? closeDropdown() : openDropdown();

  const handleLogout = async () => {
    closeDropdown();
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!user) return null;

  const initials = user.username?.slice(0, 2).toUpperCase() || '?';
  const roleColors = {
    admin: 'var(--primary)',
    manager: '#7c3aed',
    storekeeper: '#059669',
  };
  const roleColor = roleColors[user.role?.toLowerCase()] || 'var(--primary)';
  const roleLabel = user.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'User';

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? '🌅 Good morning' : hour < 17 ? '☀️ Good afternoon' : '🌙 Good evening';

  return (
    <div className="profile-widget" ref={dropRef}>
      <button
        className={`profile-trigger ${open ? 'active' : ''}`}
        onClick={toggleDropdown}
        aria-label="User profile menu"
        aria-expanded={open}
      >
        <div className="profile-avatar-wrap">
          <div className="profile-avatar" style={{ '--role-color': roleColor }}>
            {initials}
          </div>
          <span className="profile-online-dot" />
        </div>
        <div className="profile-info">
          <span className="profile-name">{user.username}</span>
          <span className="profile-role-badge" style={{ background: roleColor }}>{roleLabel}</span>
        </div>
        <span className={`profile-chevron ${open ? 'rotated' : ''}`}>›</span>
      </button>

      {open && (
        <div className={`profile-dropdown ${visible ? 'dropdown-visible' : ''}`}>
          {/* Header */}
          <div className="dropdown-header">
            <div className="dropdown-avatar" style={{ '--role-color': roleColor }}>{initials}</div>
            <div className="dropdown-user-meta">
              <p className="dropdown-greeting">{greeting},</p>
              <p className="dropdown-username">{user.username}!</p>
              <span className="dropdown-role-pill" style={{ background: roleColor }}>{roleLabel}</span>
            </div>
          </div>

          <div className="dropdown-divider" />

          {/* Info rows */}
          <div className="dropdown-info-list">
            <div className="dropdown-info-row">
              <span className="di-icon">👤</span>
              <span className="di-label">User ID</span>
              <span className="di-value">#{user.id}</span>
            </div>
            <div className="dropdown-info-row">
              <span className="di-icon">🔐</span>
              <span className="di-label">Role</span>
              <span className="di-value" style={{ color: roleColor }}>{roleLabel}</span>
            </div>
            <div className="dropdown-info-row">
              <span className="di-icon">📍</span>
              <span className="di-label">Location</span>
              <span className="di-value">Kigali, Rwanda</span>
            </div>
            <div className="dropdown-info-row">
              <span className="di-icon">🏢</span>
              <span className="di-label">Company</span>
              <span className="di-value">DAB Enterprise</span>
            </div>
          </div>

          <div className="dropdown-divider" />

          <button className="dropdown-logout-btn" onClick={handleLogout}>
            <span>⏻</span> Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

/* ── Layout ─────────────────────────────────────────────────── */
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <header className="topbar">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div className="topbar-title">DAB Enterprise · Store Management System</div>
          <ProfileWidget />
        </header>
        <main className="content-area">{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/stockin" element={
            <ProtectedRoute>
              <Layout><StockIn /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/stockout" element={
            <ProtectedRoute>
              <Layout><StockOut /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute>
              <Layout><Report /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute>
              <Layout><Users /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute>
              <Layout><Inventory /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/alerts" element={
            <ProtectedRoute>
              <Layout><Alerts /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/items" element={
            <ProtectedRoute>
              <Layout><Items /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/suppliers" element={
            <ProtectedRoute>
              <Layout><Suppliers /></Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
