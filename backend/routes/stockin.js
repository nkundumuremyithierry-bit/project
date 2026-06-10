const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const { requireAuth, requireAdmin, requireAdminOrInsert } = require('../middleware/auth');

// GET /api/stockin — list all with optional search/date filter
router.get('/', requireAuth, async (req, res) => {
  const { search, date } = req.query;
  let query = `
    SELECT s.*, u.username AS recorded_by,
           sup.name AS supplier_name_full,
           it.unit  AS item_unit
    FROM   stockin s
    JOIN   users   u   ON s.user_id     = u.id
    LEFT JOIN suppliers sup ON s.supplier_id = sup.id
    LEFT JOIN items     it  ON s.item_id     = it.id
    WHERE 1=1
  `;
  const params = [];
  if (search) { query += ' AND (s.itemname LIKE ? OR s.suppliername LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  if (date)   { query += ' AND s.stockindate = ?'; params.push(date); }
  query += ' ORDER BY s.created_at DESC';
  try {
    const [rows] = await db.query(query, params);
    return res.json(rows);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/stockin/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.*, u.username AS recorded_by, sup.name AS supplier_name_full, it.unit AS item_unit
       FROM stockin s
       JOIN users u ON s.user_id = u.id
       LEFT JOIN suppliers sup ON s.supplier_id = sup.id
       LEFT JOIN items     it  ON s.item_id     = it.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Record not found.' });
    return res.json(rows[0]);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/stockin — create
router.post('/', requireAdminOrInsert, async (req, res) => {
  const { item_id, supplier_id, description, quantityin, stockindate } = req.body;
  if (!item_id || !quantityin || !stockindate)
    return res.status(400).json({ message: 'item_id, quantityin, and stockindate are required.' });
  if (!req.session?.user?.id)
    return res.status(401).json({ message: 'Unauthorized.' });

  try {
    // Resolve item name
    const [itemRows] = await db.query('SELECT name FROM items WHERE id = ?', [item_id]);
    if (!itemRows.length) return res.status(404).json({ message: 'Item not found.' });
    const itemname = itemRows[0].name;

    // Resolve supplier name (optional)
    let suppliername = '';
    let resolvedSupplierId = supplier_id || null;
    if (supplier_id) {
      const [supRows] = await db.query('SELECT name FROM suppliers WHERE id = ?', [supplier_id]);
      if (supRows.length) suppliername = supRows[0].name;
    }

    // Running total for this item
    const [prev] = await db.query(
      'SELECT COALESCE(MAX(totalquantityin), 0) AS lastTotal FROM stockin WHERE itemname = ?',
      [itemname]
    );
    const totalquantityin = parseInt(prev[0].lastTotal) + parseInt(quantityin);

    await db.query(
      `INSERT INTO stockin (item_id, itemname, description, quantityin, totalquantityin, supplier_id, suppliername, stockindate, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_id, itemname, description || '', quantityin, totalquantityin, resolvedSupplierId, suppliername, stockindate, req.session.user.id]
    );
    return res.status(201).json({ message: 'Stock-in recorded successfully.', totalquantityin });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/stockin/:id — update (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { item_id, supplier_id, description, quantityin, stockindate } = req.body;
  if (!item_id || !quantityin || !stockindate)
    return res.status(400).json({ message: 'item_id, quantityin, and stockindate are required.' });
  try {
    const [existing] = await db.query('SELECT * FROM stockin WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Record not found.' });

    const [itemRows] = await db.query('SELECT name FROM items WHERE id = ?', [item_id]);
    if (!itemRows.length) return res.status(404).json({ message: 'Item not found.' });
    const itemname = itemRows[0].name;

    let suppliername = '';
    const resolvedSupplierId = supplier_id || null;
    if (supplier_id) {
      const [supRows] = await db.query('SELECT name FROM suppliers WHERE id = ?', [supplier_id]);
      if (supRows.length) suppliername = supRows[0].name;
    }

    const old = existing[0];
    let totalquantityin = old.totalquantityin;
    if (String(item_id) !== String(old.item_id) || String(quantityin) !== String(old.quantityin)) {
      const [maxTotal] = await db.query(
        'SELECT COALESCE(MAX(totalquantityin), 0) AS lastTotal FROM stockin WHERE itemname = ? AND id != ?',
        [itemname, req.params.id]
      );
      totalquantityin = parseInt(maxTotal[0].lastTotal) + parseInt(quantityin);
    }

    await db.query(
      `UPDATE stockin SET item_id=?, itemname=?, description=?, quantityin=?, totalquantityin=?,
       supplier_id=?, suppliername=?, stockindate=? WHERE id=?`,
      [item_id, itemname, description || '', quantityin, totalquantityin, resolvedSupplierId, suppliername, stockindate, req.params.id]
    );
    return res.json({ message: 'Stock-in updated.' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

// DELETE /api/stockin/:id (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id FROM stockin WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Record not found.' });
    await db.query('DELETE FROM stockin WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Stock-in record deleted.' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;