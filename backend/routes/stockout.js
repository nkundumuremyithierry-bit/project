const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth, requireAdmin, requireAdminOrInsert } = require('../middleware/auth');

// GET /api/stockout — list all with optional search
router.get('/', requireAuth, async (req, res) => {
  const { search, date } = req.query;
  let query = `
    SELECT s.*, u.username AS recorded_by
    FROM stockout s
    JOIN users u ON s.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (search) {
    query += ' AND s.itemname LIKE ?';
    params.push(`%${search}%`);
  }
  if (date) {
    query += ' AND s.stockoutdate = ?';
    params.push(date);
  }
  query += ' ORDER BY s.created_at DESC';
  try {
    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/stockout/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.username AS recorded_by FROM stockout s
       JOIN users u ON s.user_id = u.id WHERE s.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Record not found.' });
    return res.json(rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/stockout — create new stock-out
router.post('/', requireAdminOrInsert, async (req, res) => {
  const { itemname, quantityout, stockoutdate } = req.body;
  if (!itemname || !quantityout || !stockoutdate)
    return res.status(400).json({ message: 'itemname, quantityout and stockoutdate are required.' });

  try {
    // Calculate running totalquantityout for this item
    const [prev] = await db.query(
      'SELECT COALESCE(MAX(totalquantityout), 0) AS lastTotal FROM stockout WHERE itemname = ?',
      [itemname]
    );
    const lastTotal = prev[0].lastTotal;
    const totalquantityout = parseInt(lastTotal) + parseInt(quantityout);

    // Check available stock
    const [inData] = await db.query(
      'SELECT COALESCE(SUM(quantityin), 0) AS totalIn FROM stockin WHERE itemname = ?',
      [itemname]
    );
    const totalIn = inData[0].totalIn;
    if (totalquantityout > totalIn) {
      return res.status(400).json({
        message: `Insufficient stock. Available: ${totalIn - (lastTotal)}, Requested: ${quantityout}`
      });
    }

    await db.query(
      `INSERT INTO stockout (itemname, quantityout, totalquantityout, stockoutdate, user_id)
       VALUES (?, ?, ?, ?, ?)`,
      [itemname, quantityout, totalquantityout, stockoutdate, req.session.user.id]
    );
    return res.status(201).json({ message: 'Stock-out recorded successfully.', totalquantityout });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/stockout/:id — update
router.put('/:id', requireAdmin, async (req, res) => {
  const { itemname, quantityout, stockoutdate } = req.body;
  if (!itemname || !quantityout || !stockoutdate) {
    return res.status(400).json({ message: 'itemname, quantityout, and stockoutdate are required.' });
  }
  try {
    // Check if record exists
    const [existing] = await db.query('SELECT id FROM stockout WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Record not found.' });
    }

    // Recalculate totalquantityout if needed
    const [prevRecord] = await db.query('SELECT itemname, quantityout FROM stockout WHERE id = ?', [req.params.id]);
    const oldQuantityout = prevRecord[0].quantityout;

    let totalquantityout = null;
    if (itemname !== prevRecord[0].itemname || quantityout !== oldQuantityout) {
      const [maxTotal] = await db.query(
        'SELECT COALESCE(MAX(totalquantityout), 0) AS lastTotal FROM stockout WHERE itemname = ?',
        [itemname]
      );
      const lastTotal = maxTotal[0].lastTotal;
      totalquantityout = parseInt(lastTotal) + parseInt(quantityout);

      // Check available stock
      const [inData] = await db.query(
        'SELECT COALESCE(SUM(quantityin), 0) AS totalIn FROM stockin WHERE itemname = ?',
        [itemname]
      );
      const totalIn = inData[0].totalIn;
      if (totalquantityout > totalIn) {
        return res.status(400).json({
          message: `Insufficient stock. Available: ${totalIn - (lastTotal)}, Requested: ${quantityout}`
        });
      }

      await db.query(
        `UPDATE stockout SET itemname=?, quantityout=?, totalquantityout=?, stockoutdate=? WHERE id=?`,
        [itemname, quantityout, totalquantityout, stockoutdate, req.params.id]
      );
    } else {
      await db.query(
        `UPDATE stockout SET quantityout=?, stockoutdate=? WHERE id=?`,
        [quantityout, stockoutdate, req.params.id]
      );
    }
    return res.json({ message: 'Stock-out updated.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/stockout/:id
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Check if record exists
    const [existing] = await db.query('SELECT id FROM stockout WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Record not found.' });
    }
    await db.query('DELETE FROM stockout WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Stock-out record deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
