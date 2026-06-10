import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

/* ─── helpers ─────────────────────────────────────────────── */
const fmt = n => Number(n ?? 0).toLocaleString();

const ITEM_COLORS = [
  '#3b82f6','#f59e0b','#16a34a','#7c3aed',
  '#db2777','#0891b2','#ea580c','#84cc16',
];

/* ─── KPI Card ────────────────────────────────────────────── */
const KpiCard = ({ label, value, icon, color, sub, to }) => (
  <Link to={to || '#'} className={`kpi-card kpi-card--${color}`}>
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-body">
      <p className="kpi-value">{value}</p>
      <p className="kpi-label">{label}</p>
      {sub && <p className="kpi-sub">{sub}</p>}
    </div>
    <div className="kpi-glow" />
  </Link>
);

/* ─── Section header ──────────────────────────────────────── */
const SectionHead = ({ title, subtitle, children }) => (
  <div className="dash-section-head">
    <div>
      <h2 className="dash-section-title">{title}</h2>
      {subtitle && <p className="dash-section-sub">{subtitle}</p>}
    </div>
    {children}
  </div>
);

/* ══════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user } = useAuth();
  const [summary,  setSummary]  = useState(null);
  const [trend,    setTrend]    = useState([]);
  const [items,    setItems]    = useState([]);
  const [recent,   setRecent]   = useState({ in: [], out: [] });
  const [trendDays, setTrendDays] = useState(30);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, t, it, si, so] = await Promise.all([
          api.get('/report/summary'),
          api.get(`/report/trend?days=${trendDays}`),
          api.get('/report/items'),
          api.get('/stockin'),
          api.get('/stockout'),
        ]);
        setSummary(s.data);
        setTrend(t.data);
        setItems(it.data);
        setRecent({ in: si.data.slice(0, 6), out: so.data.slice(0, 6) });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [trendDays]);

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const netStock  = Number(summary?.totalStockIn ?? 0) - Number(summary?.totalStockOut ?? 0);
  const stockRate = summary?.totalStockIn > 0
    ? Math.round((summary.totalStockOut / summary.totalStockIn) * 100)
    : 0;

  /* ── Trend line chart data ── */
  const trendLabels = trend.map(d => {
    const dt = new Date(d.date + 'T00:00:00');
    return dt.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  });

  const periodTotalIn  = trend.reduce((s, d) => s + d.stockIn,  0);
  const periodTotalOut = trend.reduce((s, d) => s + d.stockOut, 0);
  const periodNet      = periodTotalIn - periodTotalOut;
  const peakIn         = Math.max(...trend.map(d => d.stockIn),  0);
  const peakOut        = Math.max(...trend.map(d => d.stockOut), 0);

  const lineData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Stock In',
        data: trend.map(d => d.stockIn),
        borderColor: '#3b82f6',
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { chartArea } = chart;
          if (!chartArea) return 'rgba(59,130,246,0.10)';
          const gradient = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(59,130,246,0.28)');
          gradient.addColorStop(1, 'rgba(59,130,246,0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.45,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
      {
        label: 'Stock Out',
        data: trend.map(d => d.stockOut),
        borderColor: '#f59e0b',
        backgroundColor: (ctx) => {
          const chart = ctx.chart;
          const { chartArea } = chart;
          if (!chartArea) return 'rgba(245,158,11,0.08)';
          const gradient = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(245,158,11,0.22)');
          gradient.addColorStop(1, 'rgba(245,158,11,0.01)');
          return gradient;
        },
        fill: true,
        tension: 0.45,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#f59e0b',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderWidth: 2.5,
      },
      {
        label: 'Net (In − Out)',
        data: trend.map(d => d.stockIn - d.stockOut),
        borderColor: '#22c55e',
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.45,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#22c55e',
        borderWidth: 2,
        borderDash: [6, 4],
      },
    ],
  };
  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true, boxWidth: 8,
          font: { size: 12, weight: '600' },
          padding: 18,
          generateLabels: chart => {
            const ds = chart.data.datasets;
            return ds.map((d, i) => ({
              text: d.label,
              fillStyle: d.borderColor,
              strokeStyle: d.borderColor,
              pointStyle: i === 2 ? 'line' : 'circle',
              hidden: !chart.isDatasetVisible(i),
              datasetIndex: i,
              lineDash: i === 2 ? [6, 4] : [],
            }));
          },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleFont: { size: 13, weight: '700' },
        bodyFont: { size: 12 },
        padding: 12,
        cornerRadius: 10,
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        callbacks: {
          label: ctx => {
            const v = ctx.parsed.y;
            const prefix = ctx.datasetIndex === 2
              ? (v >= 0 ? '+' : '') : ctx.datasetIndex === 0 ? '↑ ' : '↓ ';
            return ` ${prefix}${v.toLocaleString()} units`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 11 }, maxTicksLimit: trendDays <= 7 ? 7 : 10, color: '#94a3b8' },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(241,245,249,0.8)', lineWidth: 1 },
        ticks: { font: { size: 11 }, color: '#94a3b8', padding: 8 },
        border: { display: false },
        beginAtZero: true,
      },
    },
    animation: { duration: 700, easing: 'easeInOutQuart' },
  };

  /* ── Bar chart data ── */
  const barData = {
    labels: items.map(i => i.itemname),
    datasets: [
      {
        label: 'Received',
        data: items.map(i => i.totalIn),
        backgroundColor: 'rgba(59,130,246,.8)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Issued',
        data: items.map(i => i.totalOut),
        backgroundColor: 'rgba(245,158,11,.8)',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Remaining',
        data: items.map(i => i.remaining),
        backgroundColor: 'rgba(22,163,74,.8)',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };
  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } } },
      tooltip: { backgroundColor: '#1e293b', padding: 10, cornerRadius: 8 },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } }, beginAtZero: true },
    },
  };

  /* ── Doughnut chart data ── */
  const doughnutData = {
    labels: items.map(i => i.itemname),
    datasets: [{
      data: items.map(i => Math.max(i.remaining, 0)),
      backgroundColor: ITEM_COLORS,
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  };
  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 }, padding: 12 } },
      tooltip: { backgroundColor: '#1e293b', padding: 10, cornerRadius: 8 },
    },
    cutout: '65%',
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="dash-loader">
        <div className="spinner" />
        <p style={{ color: '#64748b', marginTop: 12, fontSize: 14 }}>Loading dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="page dash-page">

      {/* ══ PAGE HEADER ══════════════════════════════════════ */}
      <div className="dash-hero">
        <div className="dash-hero-left">
          <div className="dash-greeting">
             Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},&nbsp;
            <strong>{user?.username}</strong>
          </div>
          <h1 className="dash-title">Store Dashboard</h1>
          <p className="dash-subtitle">📍 DAB Enterprise Ltd · Kigali, Rwanda · {today}</p>
        </div>
        <div className="dash-hero-badges">
          <div className="hero-badge hero-badge--blue">
            <span className="hero-badge-val">{fmt(summary?.totalStockIn)}</span>
            <span className="hero-badge-lbl">Total In</span>
          </div>
          <div className="hero-badge hero-badge--amber">
            <span className="hero-badge-val">{fmt(summary?.totalStockOut)}</span>
            <span className="hero-badge-lbl">Total Out</span>
          </div>
          <div className={`hero-badge ${netStock >= 0 ? 'hero-badge--green' : 'hero-badge--red'}`}>
            <span className="hero-badge-val">{fmt(netStock)}</span>
            <span className="hero-badge-lbl">Net Stock</span>
          </div>
        </div>
      </div>

      {/* ══ KPI CARDS ════════════════════════════════════════ */}
      <div className="kpi-grid">
        <KpiCard label="Items Received"   value={fmt(summary?.totalStockIn)}    icon="" color="blue"   sub={`${summary?.stockInRecords} transactions`}  to="/stockin"  />
        <KpiCard label="Items Issued"     value={fmt(summary?.totalStockOut)}   icon="" color="amber"  sub={`${summary?.stockOutRecords} transactions`} to="/stockout" />
        <KpiCard label="Net Stock"        value={fmt(netStock)}                 icon="" color={netStock >= 0 ? 'green' : 'red'} sub="Received − Issued" />
        <KpiCard label="Issue Rate"       value={`${stockRate}%`}              icon="" color="purple" sub="Of total received issued" />
        <KpiCard label="Stock-In Records" value={fmt(summary?.stockInRecords)}  icon="" color="cyan"   to="/stockin"  />
        <KpiCard label="System Users"     value={fmt(summary?.totalUsers)}      icon="" color="pink"   to="/users"    />
      </div>

      {/* ══ TREND CHART ══════════════════════════════════════ */}
      <div className="dash-card">
        <SectionHead
          title=" Activity Trend"
          subtitle={`Daily stock movement — last ${trendDays} days`}
        >
          <div className="trend-toggle">
            {[7, 14, 30].map(d => (
              <button key={d}
                className={`trend-btn ${trendDays === d ? 'active' : ''}`}
                onClick={() => setTrendDays(d)}
              >
                {d}d
              </button>
            ))}
          </div>
        </SectionHead>

        {/* Period summary stats */}
        <div className="trend-stats-bar">
          <div className="trend-stat trend-stat--blue">
            <span className="trend-stat-icon">↑</span>
            <div>
              <span className="trend-stat-val">{fmt(periodTotalIn)}</span>
              <span className="trend-stat-lbl">Period In</span>
            </div>
          </div>
          <div className="trend-stat-sep" />
          <div className="trend-stat trend-stat--amber">
            <span className="trend-stat-icon">↓</span>
            <div>
              <span className="trend-stat-val">{fmt(periodTotalOut)}</span>
              <span className="trend-stat-lbl">Period Out</span>
            </div>
          </div>
          <div className="trend-stat-sep" />
          <div className={`trend-stat ${periodNet >= 0 ? 'trend-stat--green' : 'trend-stat--red'}`}>
            <span className="trend-stat-icon">{periodNet >= 0 ? '≈' : '!'}</span>
            <div>
              <span className="trend-stat-val">{periodNet >= 0 ? '+' : ''}{fmt(periodNet)}</span>
              <span className="trend-stat-lbl">Period Net</span>
            </div>
          </div>
          <div className="trend-stat-sep" />
          <div className="trend-stat trend-stat--blue" style={{ opacity: 0.7 }}>
            <span className="trend-stat-icon">⬆</span>
            <div>
              <span className="trend-stat-val">{fmt(peakIn)}</span>
              <span className="trend-stat-lbl">Peak In</span>
            </div>
          </div>
          <div className="trend-stat-sep" />
          <div className="trend-stat trend-stat--amber" style={{ opacity: 0.7 }}>
            <span className="trend-stat-icon"></span>
            <div>
              <span className="trend-stat-val">{fmt(peakOut)}</span>
              <span className="trend-stat-lbl">Peak Out</span>
            </div>
          </div>
        </div>

        <div className="chart-area chart-area--lg">
          <Line data={lineData} options={lineOptions} />
        </div>

        {/* Empty state */}
        {trend.every(d => d.stockIn === 0 && d.stockOut === 0) && (
          <div className="trend-empty">
            <span className="trend-empty-icon"></span>
            <p>No transactions recorded in the last {trendDays} days.</p>
            <p style={{ fontSize: 12, color: '#434850' }}>Add stock-in or stock-out records to see activity here.</p>
          </div>
        )}
      </div>


      {/* ══ BAR + DOUGHNUT ═══════════════════════════════════ */}
      <div className="dash-charts-row">

        {/* Bar chart */}
        <div className="dash-card dash-card--flex">
          <SectionHead title=" Inventory by Item" subtitle="Received vs Issued vs Remaining" />
          <div className="chart-area chart-area--md">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>

        {/* Doughnut */}
        <div className="dash-card dash-card--sm">
          <SectionHead title=" Stock Distribution" subtitle="Remaining units per item" />
          <div className="chart-area chart-area--md">
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          {/* Centre label */}
          <div className="donut-centre">
            <p className="donut-centre-val">{fmt(netStock)}</p>
            <p className="donut-centre-lbl">units left</p>
          </div>
        </div>
      </div>

      {/* ══ ITEM STATUS TABLE ════════════════════════════════ */}
      <div className="dash-card">
        <SectionHead title=" Item Inventory Status" subtitle="All items with current stock levels" />
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Total Received</th>
                <th>Total Issued</th>
                <th>Remaining</th>
                <th>Status</th>
                <th>Usage %</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const pct    = item.totalIn > 0 ? Math.round((item.totalOut / item.totalIn) * 100) : 0;
                const status = item.remaining <= 0 ? 'out' : item.remaining < item.totalIn * 0.2 ? 'low' : 'ok';
                const statusLabel = { ok: ' OK', low: ' Low', out: ' Out' }[status];
                return (
                  <tr key={item.itemname}>
                    <td style={{ color: '#5c708b', fontSize: 12 }}>{idx + 1}</td>
                    <td><span className="item-badge">{item.itemname}</span></td>
                    <td><span className="qty-in">+{fmt(item.totalIn)}</span></td>
                    <td><span className="qty-out">−{fmt(item.totalOut)}</span></td>
                    <td><strong style={{ fontSize: 15 }}>{fmt(item.remaining)}</strong></td>
                    <td><span className={`status-badge status-${status}`}>{statusLabel}</span></td>
                    <td>
                      <div className="usage-bar-wrap">
                        <div className="usage-bar">
                          <div
                            className={`usage-fill usage-fill--${status}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="usage-pct">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={7} className="empty-cell">No inventory data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ RECENT TRANSACTIONS ══════════════════════════════ */}
      <div className="dash-recent-row">

        {/* Recent Stock-In */}
        <div className="dash-card">
          <SectionHead title=" Recent Stock-In" subtitle="Latest 6 receipts">
            <Link to="/stockin" className="card-link">View All →</Link>
          </SectionHead>
          {recent.in.length === 0 ? (
            <p className="empty-msg">No stock-in records yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Item</th><th>Qty</th><th>Supplier</th><th>Date</th><th>By</th></tr>
                </thead>
                <tbody>
                  {recent.in.map(r => (
                    <tr key={r.id}>
                      <td><span className="item-badge">{r.itemname}</span></td>
                      <td><span className="qty-in">+{r.quantityin}</span></td>
                      <td style={{ fontSize: 13, color: '#64748b' }}>{r.suppliername || '—'}</td>
                      <td style={{ fontSize: 13 }}>{r.stockindate?.slice(0, 10)}</td>
                      <td><span className="user-pill">{r.recorded_by}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Stock-Out */}
        <div className="dash-card">
          <SectionHead title=" Recent Stock-Out" subtitle="Latest 6 issues">
            <Link to="/stockout" className="card-link">View All →</Link>
          </SectionHead>
          {recent.out.length === 0 ? (
            <p className="empty-msg">No stock-out records yet.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th>Item</th><th>Qty</th><th>Date</th><th>By</th></tr>
                </thead>
                <tbody>
                  {recent.out.map(r => (
                    <tr key={r.id}>
                      <td><span className="item-badge">{r.itemname}</span></td>
                      <td><span className="qty-out">−{r.quantityout}</span></td>
                      <td style={{ fontSize: 13 }}>{r.stockoutdate?.slice(0, 10)}</td>
                      <td><span className="user-pill">{r.recorded_by}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
