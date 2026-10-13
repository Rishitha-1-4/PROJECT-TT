-- =====================================================================
-- Smart Vehicle Maintenance Platform - Database Schema
-- Database Name: smart_vehicle_maintenance
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `smart_vehicle_maintenance`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `smart_vehicle_maintenance`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Vehicles Table
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `registration_number` VARCHAR(50) NOT NULL,
  `vehicle_type` VARCHAR(50) NOT NULL,
  `make` VARCHAR(50) NOT NULL,
  `model` VARCHAR(50) NOT NULL,
  `year` INT NOT NULL,
  `fuel_type` VARCHAR(30) NOT NULL,
  `current_odometer` INT NOT NULL DEFAULT 0,
  `purchase_date` DATE NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_vehicles_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uk_user_registration` (`user_id`, `registration_number`),
  INDEX `idx_vehicles_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Service Records Table
CREATE TABLE IF NOT EXISTS `service_records` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vehicle_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `service_date` DATE NOT NULL,
  `odometer_reading` INT NOT NULL,
  `service_type` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `parts_replaced` TEXT NULL,
  `service_center` VARCHAR(150) NULL,
  `total_cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `next_service_date` DATE NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_service_vehicle` FOREIGN KEY (`vehicle_id`) 
    REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_service_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_service_vehicle` (`vehicle_id`),
  INDEX `idx_service_user` (`user_id`),
  INDEX `idx_service_date` (`service_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Maintenance Reminders Table
CREATE TABLE IF NOT EXISTS `maintenance_reminders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vehicle_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `task_name` VARCHAR(150) NOT NULL,
  `due_date` DATE NOT NULL,
  `due_odometer` INT NULL,
  `notes` TEXT NULL,
  `status` ENUM('upcoming', 'overdue', 'completed') NOT NULL DEFAULT 'upcoming',
  `completed_at` DATE NULL,
  `reminder_sent` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_reminder_vehicle` FOREIGN KEY (`vehicle_id`) 
    REFERENCES `vehicles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reminder_user` FOREIGN KEY (`user_id`) 
    REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_reminder_vehicle` (`vehicle_id`),
  INDEX `idx_reminder_user` (`user_id`),
  INDEX `idx_reminder_due_date` (`due_date`),
  INDEX `idx_reminder_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Vehicle Problems Knowledge Base Table
CREATE TABLE IF NOT EXISTS `vehicle_problems` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(150) NOT NULL,
  `category` VARCHAR(50) DEFAULT 'Engine',
  `symptoms` TEXT NOT NULL,
  `possible_causes` TEXT NOT NULL,
  `affected_components` VARCHAR(255) NOT NULL,
  `recommendations` TEXT NOT NULL,
  `urgency` ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
  `consult_mechanic_note` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_problems_title` (`title`),
  INDEX `idx_problems_urgency` (`urgency`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
