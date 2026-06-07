-- 1. Create the Database
CREATE DATABASE IF NOT EXISTS master_car_db;
USE master_car_db;

-- 2. Create the Users Table
-- Stores registration data and hashed passwords
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Stores the hashed password
    google_id VARCHAR(255) DEFAULT NULL, -- Stores ID if they sign in with Google
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create the Password Resets Table
-- Stores temporary tokens when a user clicks "Forgot Password"
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    INDEX (email),
    INDEX (token)
);

-- 4. Create an Orders Table (Optional - for your 'order.htm' page)
CREATE TABLE IF NOT EXISTS orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    item_name VARCHAR(255),
    price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'Pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);