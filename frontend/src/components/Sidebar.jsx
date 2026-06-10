import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const allNavItems = [
  { to: '/',         label: 'Dashboard', icon: '🏠', roles: ['admin', 'staff'] },
  { to: '/stockin',  label: 'Stock In',  icon: '📦', roles: ['admin', 'staff'] },
  { to: '/stockout', label: 'Stock Out', icon: '📤', roles: ['admin', 'staff'] },
  { to: '/users',    label: 'Users',     icon: '👥', roles: ['admin'] },         // admin only
  { to: '/report',   label: 'Report',    icon: '📊', roles: ['admin', 'staff'] },
];

const Sidebar = ({ open, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Filter nav items by user role
  const navItems = allNavItems.filter(item =>
    item.roles.includes(user?.role)
  );

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <>
      {open && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">DAB</div>
          <div className="brand-text">
            <span className="brand-name">DAB Enterprise</span>
            <span className="brand-sub">Store Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div>
              <p className="user-name">{user?.username}</p>
              <p className="user-role">{user?.role}</p>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>⏻ Logout</button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

