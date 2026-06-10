const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/connection');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password are required.' });

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0)
      return res.status(401).json({ message: 'Invalid username or password.' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ message: 'Invalid username or password.' });

    req.session.user = { id: user.id, username: user.username, role: user.role };
    return res.json({ message: 'Login successful.', user: req.session.user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: 'Could not log out.' });
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully.' });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.session && req.session.user)
    return res.json({ user: req.session.user });
  return res.status(401).json({ message: 'Not authenticated.' });
});

// POST /api/auth/reset-password — reset password by username
router.post('/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword)
    return res.status(400).json({ message: 'Username and new password are required.' });
  if (newPassword.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  try {
    const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'No account found with that username.' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE username = ?', [hashed, username]);
    return res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/register  (admin only)
router.post('/register', requireAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: 'Username and password required.' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashed, role || 'staff']
    );
    return res.status(201).json({ message: 'User created successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Username already exists.' });
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/auth/users - list all users
router.get('/users', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// DELETE /api/auth/users/:id
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    // Check if record exists
    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    return res.json({ message: 'User deleted.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/auth/users/:id — update username, role, and optionally password
router.put('/users/:id', requireAdmin, async (req, res) => {
  const { username, role, password } = req.body;
  const { id } = req.params;
  if (!username || !role)
    return res.status(400).json({ message: 'Username and role are required.' });
  try {
    // Check if user exists
    const [existing] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0)
      return res.status(404).json({ message: 'User not found.' });

    if (password) {
      if (password.length < 6)
        return res.status(400).json({ message: 'Password must be at least 6 characters.' });
      const hashed = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET username = ?, role = ?, password = ? WHERE id = ?',
        [username, role, hashed, id]
      );
    } else {
      await db.query(
        'UPDATE users SET username = ?, role = ? WHERE id = ?',
        [username, role, id]
      );
    }
    return res.json({ message: 'User updated successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Username already taken.' });
    console.error(err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
