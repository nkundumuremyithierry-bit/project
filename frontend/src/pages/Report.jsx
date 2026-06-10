import React, { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Report = () => {
  const [report, setReport] = useState([]);
  const [date, setDate] = useState('');
  const [reportDate, setReportDate] = useState('All Time');
  const [loading, setLoading] = useState(false);
  const printRef = useRef();

  const fetchReport = async (d) => {
    setLoading(true);
    try {
      const params = d ? { date: d } : {};
      const res = await api.get('/report/daily', { params });
      setReport(res.data.report);
      setReportDate(res.data.date);
    } catch { toast.error('Failed to load report.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(''); }, []);

  const handleFilter = e => {
    e.preventDefault();
    fetchReport(date);
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head>
        <title>DAB Enterprise - Daily Stock Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
          h1 { color: #1e40af; } h2 { color: #475569; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #1e40af; color: white; padding: 10px; text-align: left; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
          tr:nth-child(even) td { background: #f8fafc; }
          .ok { color: #16a34a; font-weight: bold; }
          .low { color: #dc2626; font-weight: bold; }
          .zero { color: #9ca3af; }
        </style>
      </head><body>${content}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const totalIn = report.reduce((s, r) => s + r.totalIn, 0);
  const totalOut = report.reduce((s, r) => s + r.totalOut, 0);
  const totalRemaining = report.reduce((s, r) => s + r.remaining, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title"> Daily Stock Status Report</h1>
          <p className="page-sub">Comprehensive inventory status for all items</p>
        </div>
        <button id="print-report-btn" className="btn-primary" onClick={handlePrint}>download Report</button>
      </div>

      <div className="card">
        <form id="report-filter-form" className="report-filter" onSubmit={handleFilter}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Filter by Date</label>
            <input
              id="report-date"
              type="date" value={date}
              onChange={e => setDate(e.target.value)}
              className="date-input"
            />
          </div>
          <button id="report-filter-btn" type="submit" className="btn-primary">Apply Filter</button>
          <button type="button" className="btn-secondary" onClick={() => { setDate(''); fetchReport(''); }}>
            Show All Time
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading-box"><div className="spinner" /></div>
      ) : (
        <div className="card" ref={printRef}>
          <div className="report-header">
            <div>
              <h1 style={{ color: '#1e40af', margin: 0 }}>DAB Enterprise Ltd</h1>
              <h2 style={{ color: '#475569', margin: '4px 0 0', fontWeight: 500 }}>
                Daily Stock Status Report — {reportDate}
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>
                Kigali, Rwanda · Generated: {new Date().toLocaleString()}
              </p>
            </div>
            <div className="report-totals">
              <span className="badge-blue"> Total In: {totalIn}</span>
              <span className="badge-orange"> Total Out: {totalOut}</span>
              <span className="badge-green"> Balance: {totalRemaining}</span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Item Name</th>
                  <th>Total Qty Received</th>
                  <th>Total Qty Issued</th>
                  <th>Remaining Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.map((r, i) => {
                  const status = r.remaining <= 0 ? 'Out of Stock'
                    : r.remaining <= 5 ? 'Low Stock' : 'In Stock';
                  const cls = r.remaining <= 0 ? 'status-out'
                    : r.remaining <= 5 ? 'status-low' : 'status-ok';
                  return (
                    <tr key={r.itemname}>
                      <td>{i + 1}</td>
                      <td><span className="item-badge">{r.itemname}</span></td>
                      <td><span className="qty-in">{r.totalIn}</span></td>
                      <td><span className="qty-out">{r.totalOut}</span></td>
                      <td><strong>{r.remaining}</strong></td>
                      <td><span className={`status-badge ${cls}`}>{status}</span></td>
                    </tr>
                  );
                })}
                <tr className="totals-row">
                  <td colSpan={2}><strong>TOTAL</strong></td>
                  <td><strong className="qty-in">{totalIn}</strong></td>
                  <td><strong className="qty-out">{totalOut}</strong></td>
                  <td><strong>{totalRemaining}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
