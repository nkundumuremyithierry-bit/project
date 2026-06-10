-- ============================================================
-- DAB Enterprise SMS — Database Migration v2
-- Adds: items (product catalog) and suppliers tables
-- Run this in phpMyAdmin or MySQL CLI:
--   USE sms;
--   SOURCE migration_v2.sql;
-- ============================================================

USE `sms`;

-- ── items (product catalog) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS `items` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150) NOT NULL,
  `unit`        VARCHAR(50)  NOT NULL DEFAULT 'units',
  `min_stock`   INT(11)      NOT NULL DEFAULT 10,
  `description` TEXT         DEFAULT NULL,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed with existing hardcoded items
INSERT IGNORE INTO `items` (`name`, `unit`, `min_stock`, `description`) VALUES
  ('Steel Bars',     'pieces', 20, 'Structural steel reinforcement bars'),
  ('Wheelbarrows',   'pieces', 5,  'Construction wheelbarrows'),
  ('Ceramic Tiles',  'boxes',  15, '60x60 cm floor tiles'),
  ('Cement',         'bags',   50, 'Portland cement 50kg bags'),
  ('Painting Brush', 'pieces', 20, 'Professional paint brushes'),
  ('Color Paint',    'gallons',10, 'Exterior weather-proof paint'),
  ('Masonry Nail',   'boxes',  30, '4-inch masonry nails box/1kg'),
  ('Iron Sheet',     'pieces', 10, 'Gauge 30 iron roofing sheets');

-- ── suppliers ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id`             INT(11)      NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(150) NOT NULL,
  `contact_person` VARCHAR(150) DEFAULT NULL,
  `phone`          VARCHAR(50)  DEFAULT NULL,
  `email`          VARCHAR(150) DEFAULT NULL,
  `address`        TEXT         DEFAULT NULL,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed with suppliers already mentioned in stockin records
INSERT IGNORE INTO `suppliers` (`name`, `contact_person`, `phone`, `email`, `address`) VALUES
  ('CIMERWA Ltd',          'Jean Pierre Habimana', '+250 788 000 001', 'info@cimerwa.rw',        'Rusizi, Rwanda'),
  ('Metalco Rwanda',       'Alice Uwase',          '+250 788 000 002', 'sales@metalco.rw',        'Kigali, Rwanda'),
  ('Tiles Africa Ltd',     'Emmanuel Nkusi',       '+250 788 000 003', 'contact@tilesafrica.rw',  'Kigali, Rwanda'),
  ('Paint & Deco Ltd',     'Grace Mukamana',       '+250 788 000 004', 'info@paintdeco.rw',       'Kigali, Rwanda'),
  ('Bralirwa Paints',      'Patrick Nzabonimpa',   '+250 788 000 005', 'paints@bralirwa.rw',      'Kigali, Rwanda'),
  ('Hardware Plus Rwanda', 'Diane Umutoni',        '+250 788 000 006', 'sales@hardwareplus.rw',   'Kigali, Rwanda');
