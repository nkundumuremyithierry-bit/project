// Middleware to check if user is authenticated via session
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized. Please log in.' });
};

// Middleware to require admin role (full control)
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admins only.' });
};

// Middleware: admin = full control, staff = insert (POST) only
const requireAdminOrInsert = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
  const role = req.session.user.role;
  if (role === 'admin') return next(); // admin can do everything
  // staff can only POST (insert)
  if (req.method === 'POST') return next();
  return res.status(403).json({ message: 'Access denied. Staff can only insert records.' });
};

module.exports = { requireAuth, requireAdmin, requireAdminOrInsert };
