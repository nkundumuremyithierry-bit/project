-- =============================================================
-- DAB Enterprise — Store Management System
-- Full Database Schema v2.0
-- Tables: users, items, suppliers, stockin, stockout
-- =============================================================

CREATE DATABASE IF NOT EXISTS `sms`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `sms`;

-- =============================================================
-- 1. USERS
-- =============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(100) NOT NULL,
  `password`   VARCHAR(255) NOT NULL,
  `role`       ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================
-- 2. SUPPLIERS
-- =============================================================
CREATE TABLE IF NOT EXISTS `suppliers` (
  `id`             INT(11)      NOT NULL AUTO_INCREMENT,
  `name`           VARCHAR(150) NOT NULL,
  `contact_person` VARCHAR(150) DEFAULT NULL,
  `phone`          VARCHAR(50)  DEFAULT NULL,
  `email`          VARCHAR(150) DEFAULT NULL,
  `address`        TEXT         DEFAULT NULL,
  `created_at`     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_supplier_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================
-- 3. ITEMS (Product Catalog)
-- =============================================================
CREATE TABLE IF NOT EXISTS `items` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150) NOT NULL,
  `unit`        VARCHAR(50)  NOT NULL DEFAULT 'units',
  `min_stock`   INT(11)      NOT NULL DEFAULT 10,
  `description` TEXT         DEFAULT NULL,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_item_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================
-- 4. STOCK IN  (linked to items, suppliers, users)
-- =============================================================
CREATE TABLE IF NOT EXISTS `stockin` (
  `id`             INT(11)  NOT NULL AUTO_INCREMENT,
  `item_id`        INT(11)  NOT NULL,
  `itemname`       VARCHAR(150) NOT NULL,          -- denormalized for fast display
  `description`    TEXT         DEFAULT NULL,
  `quantityin`     INT(11)  NOT NULL,
  `totalquantityin` INT(11) NOT NULL DEFAULT 0,
  `supplier_id`    INT(11)  DEFAULT NULL,
  `suppliername`   VARCHAR(150) DEFAULT NULL,      -- denormalized for fast display
  `stockindate`    DATE     NOT NULL,
  `user_id`        INT(11)  NOT NULL,
  `created_at`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_id`     (`item_id`),
  KEY `idx_supplier_id` (`supplier_id`),
  KEY `idx_user_id_si`  (`user_id`),
  KEY `idx_itemname`    (`itemname`),
  KEY `idx_stockindate` (`stockindate`),
  CONSTRAINT `fk_si_item`     FOREIGN KEY (`item_id`)     REFERENCES `items`(`id`)     ON DELETE RESTRICT,
  CONSTRAINT `fk_si_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_si_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`(`id`)     ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================
-- 5. STOCK OUT  (linked to items, users)
-- =============================================================
CREATE TABLE IF NOT EXISTS `stockout` (
  `id`              INT(11)  NOT NULL AUTO_INCREMENT,
  `item_id`         INT(11)  NOT NULL,
  `itemname`        VARCHAR(150) NOT NULL,         -- denormalized
  `quantityout`     INT(11)  NOT NULL,
  `totalquantityout` INT(11) NOT NULL DEFAULT 0,
  `stockoutdate`    DATE     NOT NULL,
  `user_id`         INT(11)  NOT NULL,
  `created_at`      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_id_so`   (`item_id`),
  KEY `idx_user_id_so`   (`user_id`),
  KEY `idx_stockoutdate` (`stockoutdate`),
  CONSTRAINT `fk_so_item` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`)  ON DELETE RESTRICT,
  CONSTRAINT `fk_so_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =============================================================
-- SEED DATA
-- =============================================================

-- Admin user  (password: admin123)
INSERT IGNORE INTO `users` (`username`, `password`, `role`) VALUES
  ('admin', '$2b$10$UgwujR.V60H0ZRSpj.zuru5/oDFJCzXQ7pEEV44jSjIqR8IMlgStK', 'admin'),
  ('staff', '$2b$10$aCU318o1IfEsjRQifOkL5uCOo6zF181rnIksbiTFS3hNQJgrepAb.', 'staff');

-- Suppliers
INSERT IGNORE INTO `suppliers` (`name`, `contact_person`, `phone`, `email`, `address`) VALUES
  ('CIMERWA Ltd',          'Jean Pierre Habimana', '+250 788 000 001', 'info@cimerwa.rw',       'Rusizi, Rwanda'),
  ('Metalco Rwanda',       'Alice Uwase',          '+250 788 000 002', 'sales@metalco.rw',       'Kigali, Rwanda'),
  ('Tiles Africa Ltd',     'Emmanuel Nkusi',       '+250 788 000 003', 'contact@tilesafrica.rw', 'Kigali, Rwanda'),
  ('Paint & Deco Ltd',     'Grace Mukamana',       '+250 788 000 004', 'info@paintdeco.rw',      'Kigali, Rwanda'),
  ('Bralirwa Paints',      'Patrick Nzabonimpa',   '+250 788 000 005', 'paints@bralirwa.rw',     'Kigali, Rwanda'),
  ('Hardware Plus Rwanda', 'Diane Umutoni',        '+250 788 000 006', 'sales@hardwareplus.rw',  'Kigali, Rwanda');

-- Items
INSERT IGNORE INTO `items` (`name`, `unit`, `min_stock`, `description`) VALUES
  ('Steel Bars',     'pieces', 20, 'Structural steel reinforcement bars'),
  ('Wheelbarrows',   'pieces',  5, 'Construction wheelbarrows'),
  ('Ceramic Tiles',  'boxes',  15, '60x60 cm floor tiles'),
  ('Cement',         'bags',   50, 'Portland cement 50kg bags'),
  ('Painting Brush', 'pieces', 20, 'Professional paint brushes'),
  ('Color Paint',    'gallons',10, 'Exterior weather-proof paint'),
  ('Masonry Nail',   'boxes',  30, '4-inch masonry nails box/1kg'),
  ('Iron Sheet',     'pieces', 10, 'Gauge 30 iron roofing sheets');