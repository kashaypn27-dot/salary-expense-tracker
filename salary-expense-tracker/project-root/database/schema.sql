-- =====================================================================
-- Salary & Expense Tracker - Database Schema
-- =====================================================================

CREATE DATABASE IF NOT EXISTS salary_expense_tracker
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE salary_expense_tracker;

-- ---------------------------------------------------------------------
-- Users table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,          -- bcrypt hash
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Income table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS income (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  source VARCHAR(150) NOT NULL,             -- e.g. "Acme Corp Payroll"
  category VARCHAR(50) NOT NULL,            -- Salary, Bonus, Freelance, Investment, Other
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  income_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_income_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_income_user_date (user_id, income_date),
  INDEX idx_income_category (category)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Expenses table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category VARCHAR(50) NOT NULL,            -- Food, Rent, Travel, Bills, Shopping, Health, Other
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_expense_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_expense_user_date (user_id, expense_date),
  INDEX idx_expense_category (category)
) ENGINE=InnoDB;
