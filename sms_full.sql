-- ==============================================================
-- DAB Enterprise — Store Management System (SMS)
-- Full Database Dump — XAMPP / phpMyAdmin Ready
-- Version: 3.0  |  Date: 2026-06-10
-- ==============================================================
-- HOW TO IMPORT IN XAMPP:
--   1. Start XAMPP → Start Apache + MySQL
--   2. Open http://localhost/phpmyadmin
--   3. Click "Import" tab (top menu)
--   4. Click "Choose File" → select this file (sms_full.sql)
--   5. Click "Go"
-- ==============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------
-- Create & select database
-- --------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS `sms`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `sms`;

-- --------------------------------------------------------------
-- Drop tables in safe order (child first)
-- --------------------------------------------------------------
DROP TABLE IF EXISTS `stockout`;
DROP TABLE IF EXISTS `stockin`;
DROP TABLE IF EXISTS `items`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `users`;

-- ==============================================================
-- TABLE: users
-- ==============================================================
CREATE TABLE `users` (
  `id`         INT(11)                   NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(100)              NOT NULL,
  `password`   VARCHAR(255)              NOT NULL,
  `role`       ENUM('admin','staff')     NOT NULL DEFAULT 'staff',
  `created_at` TIMESTAMP                 NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ==============================================================
-- TABLE: suppliers
-- ==============================================================
CREATE TABLE `suppliers` (
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

-- ==============================================================
-- TABLE: items  (Product Catalog)
-- ==============================================================
CREATE TABLE `items` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(150) NOT NULL,
  `unit`        VARCHAR(50)  NOT NULL DEFAULT 'units',
  `min_stock`   INT(11)      NOT NULL DEFAULT 10,
  `description` TEXT         DEFAULT NULL,
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_item_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ==============================================================
-- TABLE: stockin  (linked to items, suppliers, users)
-- ==============================================================
CREATE TABLE `stockin` (
  `id`              INT(11)      NOT NULL AUTO_INCREMENT,
  `item_id`         INT(11)      NOT NULL,
  `itemname`        VARCHAR(150) NOT NULL,
  `description`     TEXT         DEFAULT NULL,
  `quantityin`      INT(11)      NOT NULL,
  `totalquantityin` INT(11)      NOT NULL DEFAULT 0,
  `supplier_id`     INT(11)      DEFAULT NULL,
  `suppliername`    VARCHAR(150) DEFAULT NULL,
  `stockindate`     DATE         NOT NULL,
  `user_id`         INT(11)      NOT NULL,
  `created_at`      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

-- ==============================================================
-- TABLE: stockout  (linked to items, users)
-- ==============================================================
CREATE TABLE `stockout` (
  `id`               INT(11)      NOT NULL AUTO_INCREMENT,
  `item_id`          INT(11)      NOT NULL,
  `itemname`         VARCHAR(150) NOT NULL,
  `quantityout`      INT(11)      NOT NULL,
  `totalquantityout` INT(11)      NOT NULL DEFAULT 0,
  `stockoutdate`     DATE         NOT NULL,
  `user_id`          INT(11)      NOT NULL,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_item_id_so`   (`item_id`),
  KEY `idx_user_id_so`   (`user_id`),
  KEY `idx_stockoutdate` (`stockoutdate`),
  CONSTRAINT `fk_so_item` FOREIGN KEY (`item_id`) REFERENCES `items`(`id`)  ON DELETE RESTRICT,
  CONSTRAINT `fk_so_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ==============================================================
-- SEED DATA
-- ==============================================================

-- Users (password: admin123 for admin, staff123 for staff)
INSERT INTO `users` (`username`, `password`, `role`) VALUES
  ('admin', '$2b$10$UgwujR.V60H0ZRSpj.zuru5/oDFJCzXQ7pEEV44jSjIqR8IMlgStK', 'admin'),
  ('staff', '$2b$10$aCU318o1IfEsjRQifOkL5uCOo6zF181rnIksbiTFS3hNQJgrepAb.', 'staff');

-- Suppliers
INSERT INTO `suppliers` (`name`, `contact_person`, `phone`, `email`, `address`) VALUES
  ('CIMERWA Ltd',          'Jean Pierre Habimana', '+250 788 000 001', 'info@cimerwa.rw',       'Rusizi, Rwanda'),
  ('Metalco Rwanda',       'Alice Uwase',          '+250 788 000 002', 'sales@metalco.rw',       'Kigali, Rwanda'),
  ('Tiles Africa Ltd',     'Emmanuel Nkusi',       '+250 788 000 003', 'contact@tilesafrica.rw', 'Kigali, Rwanda'),
  ('Paint & Deco Ltd',     'Grace Mukamana',       '+250 788 000 004', 'info@paintdeco.rw',      'Kigali, Rwanda'),
  ('Bralirwa Paints',      'Patrick Nzabonimpa',   '+250 788 000 005', 'paints@bralirwa.rw',     'Kigali, Rwanda'),
  ('Hardware Plus Rwanda', 'Diane Umutoni',        '+250 788 000 006', 'sales@hardwareplus.rw',  'Kigali, Rwanda');

-- Items (Product Catalog)
INSERT INTO `items` (`name`, `unit`, `min_stock`, `description`) VALUES
  ('Steel Bars',     'pieces', 20,  'Structural steel reinforcement bars'),
  ('Wheelbarrows',   'pieces',  5,  'Construction wheelbarrows'),
  ('Ceramic Tiles',  'boxes',  15,  '60x60 cm floor tiles'),
  ('Cement',         'bags',   50,  'Portland cement 50kg bags'),
  ('Painting Brush', 'pieces', 20,  'Professional paint brushes'),
  ('Color Paint',    'gallons',10,  'Exterior weather-proof paint'),
  ('Masonry Nail',   'boxes',  30,  '4-inch masonry nails box/1kg'),
  ('Iron Sheet',     'pieces', 10,  'Gauge 30 iron roofing sheets');

-- Stock In records (sample data)
-- user_id=1 (admin), item_id refs above, supplier_id refs above
INSERT INTO `stockin` (`item_id`,`itemname`,`description`,`quantityin`,`totalquantityin`,`supplier_id`,`suppliername`,`stockindate`,`user_id`) VALUES
  (4, 'Cement',         'First batch', 200, 200, 1, 'CIMERWA Ltd',          '2026-05-01', 1),
  (1, 'Steel Bars',     NULL,          100, 100, 2, 'Metalco Rwanda',       '2026-05-02', 1),
  (3, 'Ceramic Tiles',  NULL,           60,  60, 3, 'Tiles Africa Ltd',     '2026-05-03', 1),
  (6, 'Color Paint',    NULL,           40,  40, 4, 'Paint & Deco Ltd',     '2026-05-05', 1),
  (5, 'Painting Brush', NULL,           80,  80, 4, 'Paint & Deco Ltd',     '2026-05-06', 1),
  (7, 'Masonry Nail',   NULL,           50,  50, 6, 'Hardware Plus Rwanda', '2026-05-07', 1),
  (8, 'Iron Sheet',     NULL,           30,  30, 2, 'Metalco Rwanda',       '2026-05-08', 1),
  (2, 'Wheelbarrows',   NULL,           10,  10, 6, 'Hardware Plus Rwanda', '2026-05-10', 1),
  (4, 'Cement',         'Restock',     100, 300, 1, 'CIMERWA Ltd',          '2026-05-20', 1);

-- Stock Out records (sample data)
INSERT INTO `stockout` (`item_id`,`itemname`,`quantityout`,`totalquantityout`,`stockoutdate`,`user_id`) VALUES
  (4, 'Cement',         80,  80, '2026-05-10', 2),
  (1, 'Steel Bars',     30,  30, '2026-05-12', 2),
  (3, 'Ceramic Tiles',  20,  20, '2026-05-13', 2),
  (6, 'Color Paint',    15,  15, '2026-05-14', 2),
  (5, 'Painting Brush', 25,  25, '2026-05-15', 2),
  (7, 'Masonry Nail',   40,  40, '2026-05-16', 2),
  (8, 'Iron Sheet',     20,  20, '2026-05-17', 2),
  (4, 'Cement',        150, 230, '2026-05-25', 2),
  (2, 'Wheelbarrows',    8,   8, '2026-05-28', 2);

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================
-- DONE — Database "sms" is ready!
-- ==============================================================
-- Login credentials:
--   admin / admin123  (full access)
--   staff / staff123  (insert only)
-- ==============================================================
