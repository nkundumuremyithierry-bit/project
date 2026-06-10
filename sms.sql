-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 06, 2026 at 03:26 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sms`
--

-- --------------------------------------------------------

--
-- Table structure for table `stockin`
--

CREATE TABLE `stockin` (
  `id` int(11) NOT NULL,
  `itemname` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `quantityin` int(11) NOT NULL,
  `totalquantityin` int(11) NOT NULL,
  `suppliername` varchar(150) DEFAULT NULL,
  `stockindate` date NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stockin`
--

INSERT INTO `stockin` (`id`, `itemname`, `description`, `quantityin`, `totalquantityin`, `suppliername`, `stockindate`, `user_id`, `created_at`) VALUES
(2, 'Cement', 'Portland cement 50kg bags', 300, 300, 'CIMERWA Ltd', '2026-06-05', 1, '2026-06-05 16:33:25'),
(3, 'Iron Sheet', 'Gauge 30 iron roofing sheets', 150, 150, 'Metalco Rwanda', '2026-06-05', 1, '2026-06-05 16:33:25'),
(4, 'Ceramic Tiles', '60x60 cm floor tiles', 100, 100, 'Tiles Africa Ltd', '2026-06-05', 1, '2026-06-05 16:33:25'),
(6, 'Painting Brush', 'Professional paint b', 80, 80, 'Paint & Deco Ltd', '2026-06-05', 1, '2026-06-05 16:33:25'),
(7, 'Color Paint', 'Exterior weather-proof paint', 60, 60, 'Bralirwa Paints', '2026-06-05', 1, '2026-06-05 16:33:25'),
(8, 'Masonry Nail', '4-inch masonry nails box/1kg', 500, 500, 'Hardware Plus Rwanda', '2026-06-05', 1, '2026-06-05 16:33:25'),
(11, 'Wheelbarrows', 'ok', 34, 54, 'rummyd', '2026-06-08', 1, '2026-06-05 22:15:33');

-- --------------------------------------------------------

--
-- Table structure for table `stockout`
--

CREATE TABLE `stockout` (
  `id` int(11) NOT NULL,
  `itemname` varchar(150) NOT NULL,
  `quantityout` int(11) NOT NULL,
  `totalquantityout` int(11) NOT NULL,
  `stockoutdate` date NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stockout`
--

INSERT INTO `stockout` (`id`, `itemname`, `quantityout`, `totalquantityout`, `stockoutdate`, `user_id`, `created_at`) VALUES
(1, 'Steel Bars', 1255, 12, '2026-06-07', 1, '2026-06-05 16:46:46'),
(2, 'Cement', 20, 20, '0000-00-00', 1, '2026-06-05 16:52:47'),
(3, 'Painting Brush', 12, 12, '2026-06-09', 1, '2026-06-05 22:14:56'),
(4, 'Wheelbarrows', 24, 24, '2026-06-05', 1, '2026-06-06 01:23:06');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','staff') DEFAULT 'staff',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `role`, `created_at`) VALUES
(1, 'admin', '$2b$10$UgwujR.V60H0ZRSpj.zuru5/oDFJCzXQ7pEEV44jSjIqR8IMlgStK', 'admin', '2026-06-05 16:33:25'),
(2, 'staff', '$2b$10$aCU318o1IfEsjRQifOkL5uCOo6zF181rnIksbiTFS3hNQJgrepAb.', 'staff', '2026-06-05 17:00:24'),
(5, 'Manager', '$2b$10$q.J4d7qoxbibqn/V1g18X./ZXFl/NnrwV5z1A4eKOQse8gsaOa5o6', '', '2026-06-05 23:45:20'),
(6, 'moise', '$2b$10$Rza4C/H0k/SxrG6C1to3i.F21g6c2rjTvO8mgTAziDpYB5nJgl6d2', 'staff', '2026-06-06 00:23:23'),
(8, 'emmy', '$2b$10$pDZa8UzW37mB5Y/JbL.doeyVMGWcb/ojUYqBFhErbE3cYrI.qtZuK', 'staff', '2026-06-06 01:24:49');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `stockin`
--
ALTER TABLE `stockin`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_itemname` (`itemname`),
  ADD KEY `idx_stockindate` (`stockindate`);

--
-- Indexes for table `stockout`
--
ALTER TABLE `stockout`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `stockin`
--
ALTER TABLE `stockin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `stockout`
--
ALTER TABLE `stockout`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `stockin`
--
ALTER TABLE `stockin`
  ADD CONSTRAINT `stockin_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stockout`
--
ALTER TABLE `stockout`
  ADD CONSTRAINT `stockout_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
