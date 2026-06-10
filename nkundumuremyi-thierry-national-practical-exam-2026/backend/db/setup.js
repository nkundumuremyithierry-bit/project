/**
 * db/setup.js
 * Runs once to create the sms database, tables, and seed the default admin user.
 * Usage: node db/setup.js
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function setup() {
  // Connect without specifying a database first
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  });

  console.log('✅  Connected to MySQL');

  // Create database
  await conn.query('CREATE DATABASE IF NOT EXISTS sms');
  await conn.query('USE sms');
  console.log('✅  Database "sms" ready');

  // Users table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin','staff') DEFAULT 'staff',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stock In table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS stockin (
      id INT AUTO_INCREMENT PRIMARY KEY,
      itemname VARCHAR(150) NOT NULL,
      description TEXT,
      quantityin INT NOT NULL,
      totalquantityin INT NOT NULL,
      suppliername VARCHAR(150),
      stockindate DATE NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Stock Out table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS stockout (
      id INT AUTO_INCREMENT PRIMARY KEY,
      itemname VARCHAR(150) NOT NULL,
      quantityout INT NOT NULL,
      totalquantityout INT NOT NULL,
      stockoutdate DATE NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('✅  Tables created (users, stockin, stockout)');

  // Seed default admin user
  const [existing] = await conn.query('SELECT id FROM users WHERE username = ?', ['admin']);
  if (existing.length === 0) {
    const hashed = await bcrypt.hash('admin123', 10);
    await conn.query(
      "INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')",
      ['admin', hashed]
    );
    console.log('✅  Default admin user created  →  username: admin  |  password: admin123');
  } else {
    console.log('ℹ️   Admin user already exists, skipping seed.');
  }

  // Seed sample stock-in records
  const [adminRow] = await conn.query("SELECT id FROM users WHERE username = 'admin'");
  const adminId = adminRow[0].id;

  const today = new Date().toISOString().slice(0, 10);
  const sampleItems = [
    ['Steel Bars',     'High-tensile steel bars 12mm', 200, 200, 'Kigali Steel Ltd',   today],
    ['Cement',         'Portland cement 50kg bags',    300, 300, 'CIMERWA Ltd',         today],
    ['Iron Sheet',     'Gauge 30 iron roofing sheets', 150, 150, 'Metalco Rwanda',      today],
    ['Ceramic Tiles',  '60x60 cm floor tiles',         100, 100, 'Tiles Africa Ltd',    today],
    ['Wheelbarrows',   'Heavy-duty contractor barrows', 20,  20,  'Tool World Kigali',   today],
    ['Painting Brush', 'Professional paint brushes',   80,  80,  'Paint & Deco Ltd',    today],
    ['Color Paint',    'Exterior weather-proof paint',  60,  60,  'Bralirwa Paints',     today],
    ['Masonry Nail',   '4-inch masonry nails box/1kg', 500, 500, 'Hardware Plus Rwanda', today],
  ];

  const [hasStock] = await conn.query('SELECT COUNT(*) AS cnt FROM stockin');
  if (hasStock[0].cnt === 0) {
    for (const [itemname, description, qty, total, supplier, date] of sampleItems) {
      await conn.query(
        `INSERT INTO stockin (itemname, description, quantityin, totalquantityin, suppliername, stockindate, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [itemname, description, qty, total, supplier, date, adminId]
      );
    }
    console.log('✅  Sample stock-in data seeded for all 8 items');
  } else {
    console.log('ℹ️   Stock-in data already exists, skipping sample seed.');
  }

  await conn.end();
  console.log('\n🎉  SMS database setup complete! Run: node server.js');
}

setup().catch(err => {
  console.error('❌  Setup failed:', err.message);
  process.exit(1);
});
