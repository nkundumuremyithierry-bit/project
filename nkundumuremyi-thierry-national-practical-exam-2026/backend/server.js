const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const stockinRoutes = require('./routes/stockin');
const stockoutRoutes = require('./routes/stockout');
const reportRoutes = require('./routes/report');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'sms_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  },
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stockin', stockinRoutes);
app.use('/api/stockout', stockoutRoutes);
app.use('/api/report', reportRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'DAB Enterprise SMS API running.' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅  Server running on http://localhost:${PORT}`);
});
