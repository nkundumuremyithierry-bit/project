import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const STATUS_META = {
  ok:  { label: '✅ In Stock',    cls: 'status-ok',  bg: '#dcfce7', color: '#16a34a' },
  low: { label: '⚠️ Low Stock',  cls: 'status-low', bg: '#fef9c3', color: '#ca8a04' },
  out: { label: '🔴 Out of Stock',cls: 'status-out', bg: '#fee2e2', color: '#dc2626' },
};

const fmt = n => Number(n ?? 0).toLocaleString();

export default function Inventory() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all'); // all | ok | low | out
  const [sortBy, setSortBy]     = useState('name'); // name | remaining | pct
  const [sortDir, setSortDir]   = useState('asc');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/report/inventory');
      setItems(res.data);
    } catch { toast.error('Failed to load inventory.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  /* ── filtering & sorting ── */
  const processed = items
    .filter(i => {
      const matchSearch = i.itemname.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' || i.status === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name')      cmp = a.itemname.localeCompare(b.itemname);
      if (sortBy === 'remaining') cmp = a.remaining - b.remaining;
      if (sortBy === 'pct')       cmp = a.usagePct - b.usagePct;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const totalItems    = items.length;
  const inStockCount  = items.filter(i => i.status === 'ok').length;
  const lowCount      = items.filter(i => i.status === 'low').length;
  const outCount      = items.filter(i => i.status === 'out').length;
  const totalUnits    = items.reduce((s, i) => s + Math.max(i.remaining, 0), 0);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => sortBy === col
    ? <span style={{ marginLeft: 4, fontSize: 11 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
    : <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.3 }}>⇅</span>;

  if (loading) return (
    <div className="loading-screen">
      <div className="dash-loader">
        <div className="spinner" />
        <p style={{ color: '#64748b', marginTop: 12, fontSize: 14 }}>Loading inventory…</p>
      </div>
    </div>
  );

  return (
    <div className="page">

      {/* ══ HEADER ═══════════════════════════════════════════ */}
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Inventory</h1>
          <p className="page-sub">Real-time stock levels for all items · Last updated just now</p>
        </div>
        <button className="btn-primary" onClick={load} style={{ gap: 8 }}>
          🔄 Refresh
        </button>
      </div>

      {/* ══ SUMMARY CARDS ════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Items',    value: totalItems,   icon: '📦', bg: 'linear-gradient(135deg,#3b82f6,#2563eb)', shadow: '#3b82f640' },
          { label: 'In Stock',       value: inStockCount, icon: '✅', bg: 'linear-gradient(135deg,#22c55e,#16a34a)', shadow: '#22c55e40' },
          { label: 'Low Stock',      value: lowCount,     icon: '⚠️', bg: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: '#f59e0b40' },
          { label: 'Out of Stock',   value: outCount,     icon: '🔴', bg: 'linear-gradient(135deg,#ef4444,#dc2626)', shadow: '#ef444440' },
          { label: 'Total Units',    value: fmt(totalUnits), icon: '🔢', bg: 'linear-gradient(135deg,#7c3aed,#6d28d9)', shadow: '#7c3aed40' },
        ].map(c => (
          <div key={c.label} style={{
            background: c.bg, borderRadius: 16, padding: '20px 18px',
            color: '#fff', boxShadow: `0 8px 24px ${c.shadow}`,
            display: 'flex', flexDirection: 'column', gap: 6,
            cursor: 'default', transition: 'transform .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: 28 }}>{c.icon}</span>
            <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{c.value}</span>
            <span style={{ fontSize: 12, opacity: .85, fontWeight: 500 }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* ══ TABLE CARD ═══════════════════════════════════════ */}
      <div className="card">
        {/* Toolbar */}
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 className="card-title">Stock Levels</h2>
            <span className="badge-blue">{processed.length} / {totalItems}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {/* Search */}
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search item…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
            </div>
            {/* Filter */}
            <select
              className="role-filter"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="ok">✅ In Stock</option>
              <option value="low">⚠️ Low Stock</option>
              <option value="out">🔴 Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Item Name <SortIcon col="name" />
                </th>
                <th>Total Received</th>
                <th>Total Issued</th>
                <th onClick={() => toggleSort('remaining')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Remaining <SortIcon col="remaining" />
                </th>
                <th>Status</th>
                <th onClick={() => toggleSort('pct')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Usage % <SortIcon col="pct" />
                </th>
                <th>Last Received</th>
                <th>Last Issued</th>
              </tr>
            </thead>
            <tbody>
              {processed.length === 0 ? (
                <tr><td colSpan={9} className="empty-cell">
                  {search || filter !== 'all' ? 'No items match your filters.' : 'No inventory data yet.'}
                </td></tr>
              ) : processed.map((item, i) => {
                const sm = STATUS_META[item.status];
                return (
                  <tr key={item.itemname} className="record-row">
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: `linear-gradient(135deg, ${sm.color}22, ${sm.color}44)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 16, flexShrink: 0,
                        }}>📦</div>
                        <span className="item-badge">{item.itemname}</span>
                      </div>
                    </td>
                    <td><span className="qty-in">+{fmt(item.totalIn)}</span></td>
                    <td><span className="qty-out">−{fmt(item.totalOut)}</span></td>
                    <td>
                      <strong style={{
                        fontSize: 16,
                        color: item.remaining <= 0 ? '#dc2626' : item.status === 'low' ? '#ca8a04' : '#16a34a'
                      }}>
                        {fmt(item.remaining)}
                      </strong>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                        background: sm.bg, color: sm.color, whiteSpace: 'nowrap',
                        border: `1px solid ${sm.color}33`,
                      }}>
                        {sm.label}
                      </span>
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <div className="usage-bar-wrap">
                        <div className="usage-bar">
                          <div
                            className={`usage-fill usage-fill--${item.status}`}
                            style={{ width: `${Math.min(item.usagePct, 100)}%` }}
                          />
                        </div>
                        <span className="usage-pct">{item.usagePct}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {item.lastIn ? new Date(item.lastIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>
                      {item.lastOut ? new Date(item.lastOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
