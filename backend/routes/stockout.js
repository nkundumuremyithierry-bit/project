const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const { requireAuth, requireAdmin, requireAdminOrInsert } = require('../middleware/auth');

// GET /api/stockout — list with optional search/date filter
router.get('/', requireAuth, async (req, res) => {
  const { search, date } = req.query;
  let query = `
    SELECT s.*, u.username AS recorded_by, it.unit AS item_unit
    FROM   stockout s
    JOIN   users    u  ON s.user_id  = u.id
    LEFT JOIN items it ON s.item_id  = it.id
    WHERE 1=1
  `;
  const params = [];
  if (search) { query += ' AND s.itemname LIKE ?'; params.push(`%${search}%`); }
  if (date)   { query += ' AND s.stockoutdate = ?'; params.push(date); }
  query += ' ORDER BY s.created_at DESC';
  try {
    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/stockout/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.username AS recorded_by, it.unit AS item_unit
       FROM stockout s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN items it ON s.item_id = it.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Record not found.' });
    return res.json(rows[0]);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/stockout — create
router.post('/', requireAdminOrInsert, async (req, res) => {
  const { item_id, quantityout, stockoutdate } = req.body;
  if (!item_id || !quantityout || !stockoutdate)
    return res.status(400).json({ message: 'item_id, quantityout, and stockoutdate are required.' });
  if (!req.session?.user?.id)
    return res.status(401).json({ message: 'Unauthorized.' });

  try {
    const [itemRows] = await db.query('SELECT name FROM items WHERE id = ?', [item_id]);
    if (!itemRows.length) return res.status(404).json({ message: 'Item not found.' });
    const itemname = itemRows[0].name;

    const [prev] = await db.query(
      'SELECT COALESCE(MAX(totalquantityout), 0) AS lastTotal FROM stockout WHERE itemname = ?',
      [itemname]
    );
    const totalquantityout = parseInt(prev[0].lastTotal) + parseInt(quantityout);

    await db.query(
      `INSERT INTO stockout (item_id, itemname, quantityout, totalquantityout, stockoutdate, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [item_id, itemname, quantityout, totalquantityout, stockoutdate, req.session.user.id]
    );
    return res.status(201).json({ message: 'Stock-out recorded.', totalquantityout });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/stockout/:id (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { item_id, quantityout, stockoutdate } = req.body;
  if (!item_id || !quantityout || !stockoutdate)
    return res.status(400).json({ message: 'item_id, quantityout, and stockoutdate are required.' });
  try {
    const [existing] = await db.query('SELECT * FROM stockout WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Record not found.' });

    const [itemRows] = await db.query('SELECT name FROM items WHERE id = ?', [item_id]);
    if (!itemRows.length) return res.status(404).json({ message: 'Item not found.' });
    const itemname = itemRows[0].name;

    const old = existing[0];
    let totalquantityout = old.totalquantityout;
    if (String(item_id) !== String(old.item_id) || String(quantityout) !== String(old.quantityout)) {
      const [maxTotal] = await db.query(
        'SELECT COALESCE(MAX(totalquantityout), 0) AS lastTotal FROM stockout WHERE itemname = ? AND id != ?',
        [itemname, req.params.id]
      );
      totalquantityout = parseInt(maxTotal[0].lastTotal) + parseInt(quantityout);
    }

    await db.query(
      'UPDATE stockout SET item_id=?, itemname=?, quantityout=?, totalquantityout=?, stockoutdate=? WHERE id=?',
      [item_id, itemname, quantityout, totalquantityout, stockoutdate, req.params.id]
    );
    return res.json({ message: 'Stock-out updated.' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

// DELETE /api/stockout/:id (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id FROM stockout WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Record not found.' });
    await db.query('DELETE FROM stockout WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Stock-out record deleted.' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;
