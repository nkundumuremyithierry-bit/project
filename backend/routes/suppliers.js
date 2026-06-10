const express = require('express');
const router  = express.Router();
const db      = require('../db/connection');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET /api/suppliers — list all suppliers
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM suppliers ORDER BY name ASC');
    return res.json(rows);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/suppliers/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Supplier not found.' });
    return res.json(rows[0]);
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/suppliers — create (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { name, contact_person, phone, email, address } = req.body;
  if (!name) return res.status(400).json({ message: 'Supplier name is required.' });
  try {
    await db.query(
      'INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), contact_person || '', phone || '', email || '', address || '']
    );
    return res.status(201).json({ message: 'Supplier created successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Supplier name already exists.' });
    console.error(err); return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/suppliers/:id — update (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const { name, contact_person, phone, email, address } = req.body;
  if (!name) return res.status(400).json({ message: 'Supplier name is required.' });
  try {
    const [existing] = await db.query('SELECT id FROM suppliers WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Supplier not found.' });
    await db.query(
      'UPDATE suppliers SET name=?, contact_person=?, phone=?, email=?, address=? WHERE id=?',
      [name.trim(), contact_person || '', phone || '', email || '', address || '', req.params.id]
    );
    return res.json({ message: 'Supplier updated successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Supplier name already exists.' });
    console.error(err); return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/suppliers/:id — delete (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id FROM suppliers WHERE id = ?', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Supplier not found.' });
    await db.query('DELETE FROM suppliers WHERE id = ?', [req.params.id]);
    return res.json({ message: 'Supplier deleted.' });
  } catch (err) { console.error(err); return res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;
