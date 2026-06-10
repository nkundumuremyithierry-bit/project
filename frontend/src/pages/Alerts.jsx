import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = n => Number(n ?? 0).toLocaleString();

export default function Alerts() {
  const [data, setData] = useState({ count: 0, alerts: [] });
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/report/alerts');
      setData(res.data);
    } catch { toast.error('Failed to load alerts.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const critical = data.alerts.filter(a => a.severity === 'critical' && !dismissed.has(a.itemname));
  const warnings = data.alerts.filter(a => a.severity === 'warning' && !dismissed.has(a.itemname));
  const visible = [...critical, ...warnings];

  const dismiss = (name) => {
    setDismissed(prev => new Set([...prev, name]));
    toast.success(`Alert for "${name}" dismissed.`);
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="dash-loader">
        <div className="spinner" />
        <p style={{ color: '#64748b', marginTop: 12, fontSize: 14 }}>Checking alerts…</p>
      </div>
    </div>
  );

  return (
    <div className="page">

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Stock Alerts
            {visible.length > 0 && (
              <span style={{
                marginLeft: 12, background: '#ef4444', color: '#fff',
                borderRadius: '50%', padding: '2px 9px', fontSize: 14, fontWeight: 800,
                verticalAlign: 'middle',
              }}>{visible.length}</span>
            )}
          </h1>
          <p className="page-sub">Items that need immediate attention — low or out of stock</p>
        </div>
        <button className="btn-primary" onClick={load}>🔄 Refresh</button>
      </div>

      {/* ══ SUMMARY BANNER ═══════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          {
            label: 'Critical Alerts', value: critical.length, icon: '🔴',
            bg: 'linear-gradient(135deg,#ef4444,#dc2626)', shadow: '#ef444440',
          },
          {
            label: 'Low Stock Warnings', value: warnings.length, icon: '⚠️',
            bg: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: '#f59e0b40',
          },
          {
            label: 'Total Active Alerts', value: visible.length, icon: '🔔',
            bg: visible.length === 0
              ? 'linear-gradient(135deg,#22c55e,#16a34a)'
              : 'linear-gradient(135deg,#7c3aed,#6d28d9)',
            shadow: '#7c3aed40',
          },
        ].map(c => (
          <div key={c.label} style={{
            background: c.bg, borderRadius: 16, padding: '20px 18px',
            color: '#fff', boxShadow: `0 8px 24px ${c.shadow}`,
            display: 'flex', alignItems: 'center', gap: 16,
            transition: 'transform .2s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span style={{ fontSize: 36 }}>{c.icon}</span>
            <div>
              <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{c.value}</div>
              <div style={{ fontSize: 12, opacity: .9, marginTop: 2 }}>{c.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ ALL CLEAR ════════════════════════════════════════════ */}
      {visible.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '2px solid #86efac', borderRadius: 20, padding: '48px 32px',
          textAlign: 'center', marginBottom: 28,
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h2 style={{ color: '#16a34a', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>
            All Stock Levels Are Healthy!
          </h2>
          <p style={{ color: '#4ade80', fontSize: 15 }}>
            No critical or low-stock alerts at this time. Keep up the great work!
          </p>
          <Link to="/inventory" className="btn-primary" style={{ display: 'inline-block', marginTop: 20 }}>
            View Full Inventory
          </Link>
        </div>
      )}

      {/* ══ CRITICAL ALERTS ══════════════════════════════════════ */}
      {critical.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ color: '#dc2626', fontWeight: 700, fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            Critical — Out of Stock
            <span style={{ background: '#fee2e2', color: '#dc2626', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{critical.length} items</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {critical.map(alert => (
              <AlertCard key={alert.itemname} alert={alert} onDismiss={dismiss} />
            ))}
          </div>
        </div>
      )}

      {/* ══ LOW STOCK WARNINGS ═══════════════════════════════════ */}
      {warnings.length > 0 && (
        <div>
          <h2 style={{ color: '#ca8a04', fontWeight: 700, fontSize: 16, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            Warning — Low Stock
            <span style={{ background: '#fef9c3', color: '#ca8a04', borderRadius: 20, padding: '2px 10px', fontSize: 12 }}>{warnings.length} items</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {warnings.map(alert => (
              <AlertCard key={alert.itemname} alert={alert} onDismiss={dismiss} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Alert Card ─────────────────────────────────────────────── */
function AlertCard({ alert, onDismiss }) {
  const isCritical = alert.severity === 'critical';
  const borderColor = isCritical ? '#ef4444' : '#f59e0b';
  const bgColor = isCritical ? '#fff5f5' : '#fffbeb';
  const iconBg = isCritical ? '#fee2e2' : '#fef3c7';
  const textColor = isCritical ? '#991b1b' : '#92400e';
  const pct = Math.min(alert.usagePct, 100);

  return (
    <div style={{
      background: bgColor,
      border: `1.5px solid ${borderColor}33`,
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: 14,
      padding: '18px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 18,
      boxShadow: `0 4px 16px ${borderColor}18`,
      transition: 'transform .2s, box-shadow .2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${borderColor}30`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = `0 4px 16px ${borderColor}18`; }}
    >
      {/* Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, flexShrink: 0,
      }}>
        {isCritical ? '' : ''}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: textColor }}>{alert.itemname}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
            background: isCritical ? '#dc2626' : '#ca8a04', color: '#fff',
            textTransform: 'uppercase', letterSpacing: .5,
          }}>
            {isCritical ? 'OUT OF STOCK' : 'LOW STOCK'}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: textColor, opacity: .85, marginBottom: 10 }}>
          {alert.message}
        </p>
        {/* Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`, borderRadius: 99,
              background: isCritical ? '#ef4444' : '#f59e0b',
              transition: 'width .5s ease',
            }} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: textColor, whiteSpace: 'nowrap' }}>
            {pct}% used
          </span>
        </div>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 20, marginTop: 8, fontSize: 12, color: textColor, opacity: .7 }}>
          <span> Received: <strong>{alert.totalIn}</strong></span>
          <span> Issued: <strong>{alert.totalOut}</strong></span>
          <span> Left: <strong style={{ color: isCritical ? '#dc2626' : '#ca8a04' }}>{alert.remaining}</strong></span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
        <Link
          to="/stockin"
          style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: isCritical ? '#dc2626' : '#ca8a04', color: '#fff',
            textDecoration: 'none', display: 'block', textAlign: 'center',
            transition: 'opacity .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          + Restock Now
        </Link>
        <button
          onClick={() => onDismiss(alert.itemname)}
          style={{
            padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600,
            background: 'transparent', border: `1px solid ${borderColor}55`,
            color: textColor, cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
