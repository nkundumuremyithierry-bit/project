const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

// Helper: get all item names from the items table
async function getItemNames() {
  const [rows] = await db.query('SELECT name FROM items ORDER BY name');
  return rows.map(r => r.name);
}

// GET /api/report/daily?date=YYYY-MM-DD
router.get('/daily', requireAuth, async (req, res) => {
  const { date } = req.query;
  try {
    const ITEMS = await getItemNames();

    const inQuery = date
      ? `SELECT itemname, SUM(quantityin) AS totalIn FROM stockin WHERE stockindate = ? GROUP BY itemname`
      : `SELECT itemname, SUM(quantityin) AS totalIn FROM stockin GROUP BY itemname`;
    const inParams = date ? [date] : [];

    const outQuery = date
      ? `SELECT itemname, SUM(quantityout) AS totalOut FROM stockout WHERE stockoutdate = ? GROUP BY itemname`
      : `SELECT itemname, SUM(quantityout) AS totalOut FROM stockout GROUP BY itemname`;
    const outParams = date ? [date] : [];

    const [[inRows], [outRows]] = await Promise.all([
      db.query(inQuery, inParams),
      db.query(outQuery, outParams),
    ]);

    const inMap = {};
    inRows.forEach(r => { inMap[r.itemname] = parseInt(r.totalIn) || 0; });
    const outMap = {};
    outRows.forEach(r => { outMap[r.itemname] = parseInt(r.totalOut) || 0; });

    const allItems = new Set([...ITEMS, ...Object.keys(inMap), ...Object.keys(outMap)]);
    const report = Array.from(allItems).map(item => {
      const totalIn  = inMap[item]  || 0;
      const totalOut = outMap[item] || 0;
      const remaining = totalIn - totalOut;
      return { itemname: item, totalIn, totalOut, remaining };
    });
    report.sort((a, b) => a.itemname.localeCompare(b.itemname));

    return res.json({ date: date || 'All Time', report });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/report/summary — dashboard summary cards
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const [[inTotal]]   = await db.query('SELECT COALESCE(SUM(quantityin),0)   AS total FROM stockin');
    const [[outTotal]]  = await db.query('SELECT COALESCE(SUM(quantityout),0)  AS total FROM stockout');
    const [[inCount]]   = await db.query('SELECT COUNT(*) AS cnt FROM stockin');
    const [[outCount]]  = await db.query('SELECT COUNT(*) AS cnt FROM stockout');
    const [[userCount]] = await db.query('SELECT COUNT(*) AS cnt FROM users');
    const [[itemCount]] = await db.query('SELECT COUNT(*) AS cnt FROM items');

    return res.json({
      totalStockIn:    inTotal.total,
      totalStockOut:   outTotal.total,
      stockInRecords:  inCount.cnt,
      stockOutRecords: outCount.cnt,
      totalUsers:      userCount.cnt,
      totalItems:      itemCount.cnt,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/report/trend?days=30
router.get('/trend', requireAuth, async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  try {
    const [inRows] = await db.query(
      `SELECT DATE(stockindate) AS day, SUM(quantityin) AS total
       FROM stockin
       WHERE stockindate >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(stockindate)
       ORDER BY day ASC`,
      [days]
    );
    const [outRows] = await db.query(
      `SELECT DATE(stockoutdate) AS day, SUM(quantityout) AS total
       FROM stockout
       WHERE stockoutdate >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(stockoutdate)
       ORDER BY day ASC`,
      [days]
    );

    const dateMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dateMap[key] = { date: key, stockIn: 0, stockOut: 0 };
    }
    inRows.forEach(r => {
      const k = r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10);
      if (dateMap[k]) dateMap[k].stockIn = parseInt(r.total) || 0;
    });
    outRows.forEach(r => {
      const k = r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10);
      if (dateMap[k]) dateMap[k].stockOut = parseInt(r.total) || 0;
    });

    return res.json(Object.values(dateMap));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/report/items — per-item totals for charts
router.get('/items', requireAuth, async (req, res) => {
  try {
    const ITEMS = await getItemNames();

    const [inRows]  = await db.query('SELECT itemname, SUM(quantityin)  AS totalIn  FROM stockin  GROUP BY itemname');
    const [outRows] = await db.query('SELECT itemname, SUM(quantityout) AS totalOut FROM stockout GROUP BY itemname');

    const inMap  = {};
    const outMap = {};
    inRows.forEach(r  => { inMap[r.itemname]  = parseInt(r.totalIn)  || 0; });
    outRows.forEach(r => { outMap[r.itemname] = parseInt(r.totalOut) || 0; });

    const allItems = new Set([...ITEMS, ...Object.keys(inMap), ...Object.keys(outMap)]);
    const result = Array.from(allItems).map(item => ({
      itemname:  item,
      totalIn:   inMap[item]  || 0,
      totalOut:  outMap[item] || 0,
      remaining: (inMap[item] || 0) - (outMap[item] || 0),
    })).sort((a, b) => a.itemname.localeCompare(b.itemname));

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/report/inventory — real-time stock per item with status
router.get('/inventory', requireAuth, async (req, res) => {
  try {
    const ITEMS = await getItemNames();

    const [inRows]  = await db.query(
      `SELECT si.itemname,
              SUM(si.quantityin)  AS totalIn,
              MAX(si.stockindate) AS lastIn,
              it.min_stock
       FROM stockin si
       LEFT JOIN items it ON si.item_id = it.id
       GROUP BY si.itemname, it.min_stock`
    );
    const [outRows] = await db.query(
      'SELECT itemname, SUM(quantityout) AS totalOut, MAX(stockoutdate) AS lastOut FROM stockout GROUP BY itemname'
    );

    // Also get items with no stock-in yet (from items table directly)
    const [itemRows] = await db.query('SELECT name, min_stock FROM items');
    const itemMeta = {};
    itemRows.forEach(r => { itemMeta[r.name] = { min_stock: r.min_stock }; });

    const inMap  = {};
    const outMap = {};
    inRows.forEach(r  => { inMap[r.itemname]  = { totalIn: parseInt(r.totalIn) || 0, lastIn: r.lastIn, min_stock: r.min_stock || 10 }; });
    outRows.forEach(r => { outMap[r.itemname] = { totalOut: parseInt(r.totalOut) || 0, lastOut: r.lastOut }; });

    const allItems = new Set([...ITEMS, ...Object.keys(inMap), ...Object.keys(outMap)]);
    const result = Array.from(allItems).map(item => {
      const totalIn   = inMap[item]?.totalIn   || 0;
      const totalOut  = outMap[item]?.totalOut  || 0;
      const remaining = totalIn - totalOut;
      const min_stock = inMap[item]?.min_stock || itemMeta[item]?.min_stock || 10;
      const pct = totalIn > 0 ? Math.round((totalOut / totalIn) * 100) : 0;
      const status = remaining <= 0 ? 'out' : remaining <= min_stock ? 'low' : 'ok';
      return {
        itemname:  item,
        totalIn,
        totalOut,
        remaining,
        min_stock,
        usagePct: pct,
        status,
        lastIn:   inMap[item]?.lastIn   || null,
        lastOut:  outMap[item]?.lastOut  || null,
      };
    }).sort((a, b) => a.itemname.localeCompare(b.itemname));

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/report/alerts — items that are low or out of stock
router.get('/alerts', requireAuth, async (req, res) => {
  try {
    const ITEMS = await getItemNames();

    const [inRows]   = await db.query(
      `SELECT si.itemname, SUM(si.quantityin) AS totalIn, it.min_stock
       FROM stockin si
       LEFT JOIN items it ON si.item_id = it.id
       GROUP BY si.itemname, it.min_stock`
    );
    const [outRows]  = await db.query('SELECT itemname, SUM(quantityout) AS totalOut FROM stockout GROUP BY itemname');
    const [itemRows] = await db.query('SELECT name, min_stock FROM items');

    const inMap  = {};
    const outMap = {};
    const metaMap = {};
    inRows.forEach(r   => { inMap[r.itemname]   = { totalIn: parseInt(r.totalIn) || 0, min_stock: r.min_stock || 10 }; });
    outRows.forEach(r  => { outMap[r.itemname]  = parseInt(r.totalOut) || 0; });
    itemRows.forEach(r => { metaMap[r.name]     = r.min_stock || 10; });

    const allItems = new Set([...ITEMS, ...Object.keys(inMap), ...Object.keys(outMap)]);
    const alerts   = [];

    Array.from(allItems).forEach(item => {
      const totalIn   = inMap[item]?.totalIn  || 0;
      const totalOut  = outMap[item] || 0;
      const remaining = totalIn - totalOut;
      const min_stock = inMap[item]?.min_stock || metaMap[item] || 10;
      const pct = totalIn > 0 ? Math.round((totalOut / totalIn) * 100) : 0;

      if (remaining <= 0) {
        alerts.push({ itemname: item, totalIn, totalOut, remaining, min_stock, usagePct: pct, severity: 'critical', message: 'Out of stock! Immediate restock required.' });
      } else if (remaining <= min_stock) {
        alerts.push({ itemname: item, totalIn, totalOut, remaining, min_stock, usagePct: pct, severity: 'warning', message: `Low stock — only ${remaining} units left (minimum: ${min_stock}).` });
      }
    });

    alerts.sort((a, b) => (a.severity === 'critical' ? -1 : 1));
    return res.json({ count: alerts.length, alerts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
