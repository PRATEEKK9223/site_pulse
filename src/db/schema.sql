-- create database manually or run: CREATE DATABASE site_pulse;
CREATE TABLE IF NOT EXISTS scans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(1024) NOT NULL,
  status ENUM('queued','running','done','error') DEFAULT 'queued',
  score_security INT DEFAULT 0,
  score_performance INT DEFAULT 0,
  score_seo INT DEFAULT 0,
  score_a11y INT DEFAULT 0,
  overall_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scan_id INT NOT NULL,
  category ENUM('security','performance','seo','accessibility') NOT NULL,
  severity ENUM('low','medium','high','critical') NOT NULL,
  code VARCHAR(128),
  message TEXT,
  recommendation TEXT,
  meta JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scan_id) REFERENCES scans(id) ON DELETE CASCADE
);
