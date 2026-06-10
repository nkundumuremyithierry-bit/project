-- Create database
CREATE DATABASE IF NOT EXISTS sms;
USE sms;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock In table
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
);

-- Create indexes for stockin table
CREATE INDEX idx_itemname ON stockin(itemname);
CREATE INDEX idx_stockindate ON stockin(stockindate);

-- Stock Out table
CREATE TABLE IF NOT EXISTS stockout (
  id INT AUTO_INCREMENT PRIMARY KEY,
  itemname VARCHAR(150) NOT NULL,
  quantityout INT NOT NULL,
  totalquantityout INT NOT NULL,
  stockoutdate DATE NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);