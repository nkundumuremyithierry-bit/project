/**
 * db/setup.js — DAB Enterprise SMS v2.0
 * Creates all tables with proper foreign keys and seeds data.
 * Usage: node db/setup.js
 */
const mysql   = require('mysql2/promise');
const bcrypt  = require('bcryptjs');
require('dotenv').config();

async function setup() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  console.log('✅  Connected to MySQL');

  // Database
  await conn.query('CREATE DATABASE IF NOT EXISTS `sms` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');
  await conn.query('USE `sms`');
  console.log('✅  Database "sms" ready');

  // ── 1. USERS ────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         INT(11)      NOT NULL AUTO_INCREMENT,
      username   VARCHAR(100) NOT NULL,
      password   VARCHAR(255) NOT NULL,
      role       ENUM('admin','staff') NOT NULL DEFAULT 'staff',
      created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_username (username)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // ── 2. SUPPLIERS ────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id             INT(11)      NOT NULL AUTO_INCREMENT,
      name           VARCHAR(150) NOT NULL,
      contact_person VARCHAR(150) DEFAULT NULL,
      phone          VARCHAR(50)  DEFAULT NULL,
      email          VARCHAR(150) DEFAULT NULL,
      address        TEXT         DEFAULT NULL,
      created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_supplier_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // ── 3. ITEMS ────────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS items (
      id          INT(11)      NOT NULL AUTO_INCREMENT,
      name        VARCHAR(150) NOT NULL,
      unit        VARCHAR(50)  NOT NULL DEFAULT 'units',
      min_stock   INT(11)      NOT NULL DEFAULT 10,
      description TEXT         DEFAULT NULL,
      created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_item_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // ── 4. STOCKIN ──────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS stockin (
      id               INT(11)      NOT NULL AUTO_INCREMENT,
      item_id          INT(11)      NOT NULL,
      itemname         VARCHAR(150) NOT NULL,
      description      TEXT         DEFAULT NULL,
      quantityin       INT(11)      NOT NULL,
      totalquantityin  INT(11)      NOT NULL DEFAULT 0,
      supplier_id      INT(11)      DEFAULT NULL,
      suppliername     VARCHAR(150) DEFAULT NULL,
      stockindate      DATE         NOT NULL,
      user_id          INT(11)      NOT NULL,
      created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_item_id     (item_id),
      KEY idx_supplier_id (supplier_id),
      KEY idx_itemname    (itemname),
      KEY idx_stockindate (stockindate),
      CONSTRAINT fk_si_item     FOREIGN KEY (item_id)     REFERENCES items(id)     ON DELETE RESTRICT,
      CONSTRAINT fk_si_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
      CONSTRAINT fk_si_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  // ── 5. STOCKOUT ─────────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS stockout (
      id               INT(11)      NOT NULL AUTO_INCREMENT,
      item_id          INT(11)      NOT NULL,
      itemname         VARCHAR(150) NOT NULL,
      quantityout      INT(11)      NOT NULL,
      totalquantityout INT(11)      NOT NULL DEFAULT 0,
      stockoutdate     DATE         NOT NULL,
      user_id          INT(11)      NOT NULL,
      created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_item_id_so   (item_id),
      KEY idx_user_id_so   (user_id),
      KEY idx_stockoutdate (stockoutdate),
      CONSTRAINT fk_so_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE RESTRICT,
      CONSTRAINT fk_so_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `);

  console.log('✅  All 5 tables created (users, suppliers, items, stockin, stockout)');

  // ── SEED: Admin user ─────────────────────────────────────────
  const [existingAdmin] = await conn.query("SELECT id FROM users WHERE username = 'admin'");
  if (!existingAdmin.length) {
    const hashed = await bcrypt.hash('admin123', 10);
    await conn.query("INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')", [hashed]);
    console.log('✅  Admin user created  →  username: admin | password: admin123');
  }
  const [existingStaff] = await conn.query("SELECT id FROM users WHERE username = 'staff'");
  if (!existingStaff.length) {
    const hashed = await bcrypt.hash('staff123', 10);
    await conn.query("INSERT INTO users (username, password, role) VALUES ('staff', ?, 'staff')", [hashed]);
    console.log('✅  Staff user created  →  username: staff | password: staff123');
  }

  const [[adminRow]] = await conn.query("SELECT id FROM users WHERE username = 'admin'");
  const adminId = adminRow.id;

  // ── SEED: Suppliers ─────────────────────────────────────────
  const [supCount] = await conn.query('SELECT COUNT(*) AS cnt FROM suppliers');
  if (!supCount[0].cnt) {
    const suppliers = [
      ['CIMERWA Ltd',          'Jean Pierre Habimana', '+250 788 000 001', 'info@cimerwa.rw',       'Rusizi, Rwanda'],
      ['Metalco Rwanda',       'Alice Uwase',          '+250 788 000 002', 'sales@metalco.rw',       'Kigali, Rwanda'],
      ['Tiles Africa Ltd',     'Emmanuel Nkusi',       '+250 788 000 003', 'contact@tilesafrica.rw', 'Kigali, Rwanda'],
      ['Paint & Deco Ltd',     'Grace Mukamana',       '+250 788 000 004', 'info@paintdeco.rw',      'Kigali, Rwanda'],
      ['Bralirwa Paints',      'Patrick Nzabonimpa',   '+250 788 000 005', 'paints@bralirwa.rw',     'Kigali, Rwanda'],
      ['Hardware Plus Rwanda', 'Diane Umutoni',        '+250 788 000 006', 'sales@hardwareplus.rw',  'Kigali, Rwanda'],
    ];
    for (const [name, contact, phone, email, address] of suppliers) {
      await conn.query(
        'INSERT IGNORE INTO suppliers (name, contact_person, phone, email, address) VALUES (?,?,?,?,?)',
        [name, contact, phone, email, address]
      );
    }
    console.log('✅  6 suppliers seeded');
  }

  // ── SEED: Items ─────────────────────────────────────────────
  const [itemCount] = await conn.query('SELECT COUNT(*) AS cnt FROM items');
  if (!itemCount[0].cnt) {
    const items = [
      ['Steel Bars',     'pieces', 20, 'Structural steel reinforcement bars'],
      ['Wheelbarrows',   'pieces',  5, 'Construction wheelbarrows'],
      ['Ceramic Tiles',  'boxes',  15, '60x60 cm floor tiles'],
      ['Cement',         'bags',   50, 'Portland cement 50kg bags'],
      ['Painting Brush', 'pieces', 20, 'Professional paint brushes'],
      ['Color Paint',    'gallons',10, 'Exterior weather-proof paint'],
      ['Masonry Nail',   'boxes',  30, '4-inch masonry nails box/1kg'],
      ['Iron Sheet',     'pieces', 10, 'Gauge 30 iron roofing sheets'],
    ];
    for (const [name, unit, min_stock, desc] of items) {
      await conn.query(
        'INSERT IGNORE INTO items (name, unit, min_stock, description) VALUES (?,?,?,?)',
        [name, unit, min_stock, desc]
      );
    }
    console.log('✅  8 items seeded');
  }

  // ── SEED: Sample Stock-In ───────────────────────────────────
  const [stockCount] = await conn.query('SELECT COUNT(*) AS cnt FROM stockin');
  if (!stockCount[0].cnt) {
    const today = new Date().toISOString().slice(0, 10);
    const seedData = [
      ['Cement',         'Portland cement 50kg bags',    300, 'CIMERWA Ltd'],
      ['Iron Sheet',     'Gauge 30 iron roofing sheets', 150, 'Metalco Rwanda'],
      ['Ceramic Tiles',  '60x60 cm floor tiles',         100, 'Tiles Africa Ltd'],
      ['Painting Brush', 'Professional paint brushes',    80, 'Paint & Deco Ltd'],
      ['Color Paint',    'Exterior weather-proof paint',   60, 'Bralirwa Paints'],
      ['Masonry Nail',   '4-inch masonry nails box/1kg',  500, 'Hardware Plus Rwanda'],
      ['Wheelbarrows',   'Construction wheelbarrows',      20, 'Hardware Plus Rwanda'],
      ['Steel Bars',     'Structural steel bars',         200, 'Metalco Rwanda'],
    ];
    for (const [itemname, desc, qty, supname] of seedData) {
      const [[item]] = await conn.query('SELECT id FROM items WHERE name = ?', [itemname]);
      const [supRows]  = await conn.query('SELECT id FROM suppliers WHERE name = ?', [supname]);
      const supplier_id   = supRows[0]?.id || null;
      if (!item) continue;
      await conn.query(
        `INSERT INTO stockin (item_id, itemname, description, quantityin, totalquantityin, supplier_id, suppliername, stockindate, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, itemname, desc, qty, qty, supplier_id, supname, today, adminId]
      );
    }
    console.log('✅  Sample stock-in data seeded for all 8 items');
  }

  await conn.end();
  console.log('\n🎉  SMS v2.0 setup complete!');
  console.log('   → Start server: node server.js');
  console.log('   → Admin: admin / admin123');
  console.log('   → Staff: staff / staff123');
}

setup().catch(err => {
  console.error('❌  Setup failed:', err.message);
  process.exit(1);
});
