const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/items — list all items
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM items ORDER BY name ASC');
    return res.json(rows);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/items/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Item not found.' });
    return res.json(rows[0]);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/items — create (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { name, unit, min_stock, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Item name is required.' });
  try {
    await db.query(
      'INSERT INTO items (name, unit, min_stock, description) VALUES (?, ?, ?, ?)',
      [name.trim(), unit || 'units', min_stock || 10, description || '']
    );
    return res.status(201).json({ message: 'Item created successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Item name already exists.' });
    console.error(err); return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/items/:id — update (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, unit, min_stock, description } = req.body;
  if (!name) return res.status(400).json({ message: 'Item name is required.' });
  try {
    const [existing] = await db.query('SELECT id FROM items WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Item not found.' });
    await db.query(
      'UPDATE items SET name=?, unit=?, min_stock=?, description=? WHERE id=?',
      [name.trim(), unit || 'units', min_stock || 10, description || '', req.params.id]
    );
    return res.json({ message: 'Item updated successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Item name already exists.' });
    console.error(err); return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/items/:id — delete (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id FROM items WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Item not found.' });
    await db.query('DELETE FROM items WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Item deleted.' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;
