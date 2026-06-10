const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

// GET /api/stockin — list all with optional search
router.get('/', requireAuth, async (req, res) => {
  const { search, date } = req.query;
  let query = `
    SELECT s.*, u.username AS recorded_by
    FROM stockin s
    JOIN users u ON s.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  if (search) {
    query += ' AND (s.itemname LIKE ? OR s.suppliername LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (date) {
    query += ' AND s.stockindate = ?';
    params.push(date);
  }
  query += ' ORDER BY s.created_at DESC';

  try {
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/stockin/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.username AS recorded_by FROM stockin s
       JOIN users u ON s.user_id = u.id WHERE s.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Record not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/stockin — create new stock-in
router.post('/', requireAuth, async (req, res) => {
  const { itemname, description, quantityin, suppliername, stockindate } = req.body;
  if (!itemname || !quantityin || !stockindate) {
    return res.status(400).json({ message: 'itemname, quantityin, and stockindate are required.' });
  }
  if (!req.session?.user?.id) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }
  try {
    // Calculate running totalquantityin for this item
    const [prev] = await db.query(
      'SELECT COALESCE(MAX(totalquantityin), 0) AS lastTotal FROM stockin WHERE itemname = ?',
      [itemname]
    );
    const lastTotal = prev[0].lastTotal;
    const totalquantityin = parseInt(lastTotal) + parseInt(quantityin);

    await db.query(
      `INSERT INTO stockin (itemname, description, quantityin, totalquantityin, suppliername, stockindate, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [itemname, description || '', quantityin, totalquantityin, suppliername || '', stockindate, req.session.user.id]
    );
    res.status(201).json({ message: 'Stock-in recorded successfully.', totalquantityin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/stockin/:id — update
router.put('/:id', requireAuth, async (req, res) => {
  const { itemname, description, quantityin, suppliername, stockindate } = req.body;
  if (!itemname || !quantityin || !stockindate) {
    return res.status(400).json({ message: 'itemname, quantityin, and stockindate are required.' });
  }
  try {
    // Check if record exists
    const [existing] = await db.query('SELECT id FROM stockin WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Record not found.' });
    }

    // Recalculate totalquantityin if itemname or quantityin changed
    const [prevRecord] = await db.query('SELECT itemname, quantityin FROM stockin WHERE id = ?', [req.params.id]);
    const oldItemname = prevRecord[0].itemname;
    const oldQuantityin = prevRecord[0].quantityin;

    if (itemname !== oldItemname || quantityin !== oldQuantityin) {
      const [maxTotal] = await db.query(
        'SELECT COALESCE(MAX(totalquantityin), 0) AS lastTotal FROM stockin WHERE itemname = ?',
        [itemname]
      );
      const lastTotal = maxTotal[0].lastTotal;
      const totalquantityin = parseInt(lastTotal) + parseInt(quantityin);

      await db.query(
        `UPDATE stockin SET itemname=?, description=?, quantityin=?, totalquantityin=?, suppliername=?, stockindate=?
         WHERE id=?`,
        [itemname, description || '', quantityin, totalquantityin, suppliername || '', stockindate, req.params.id]
      );
    } else {
      await db.query(
        `UPDATE stockin SET description=?, suppliername=?, stockindate=?
         WHERE id=?`,
        [description || '', suppliername || '', stockindate, req.params.id]
      );
    }
    res.json({ message: 'Stock-in updated.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/stockin/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // Check if record exists
    const [existing] = await db.query('SELECT id FROM stockin WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Record not found.' });
    }
    await db.query('DELETE FROM stockin WHERE id = ?', [req.params.id]);
    res.json({ message: 'Stock-in record deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;