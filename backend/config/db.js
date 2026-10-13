/**
 * Smart Vehicle Maintenance Platform - Database Connection Pool Configuration
 * Supports Local MySQL, Cloud MySQL (Aiven, TiDB, Render, Clever Cloud), and DATABASE_URL
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Parse database configuration
function getDbConfig() {
  const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

  let baseConfig = {};

  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl);
      baseConfig = {
        host: parsed.hostname,
        port: parseInt(parsed.port || '3306', 10),
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'smart_vehicle_maintenance'
      };
    } catch (e) {
      console.warn('Could not parse DATABASE_URL, falling back to standard env variables.');
    }
  }

  if (!baseConfig.host) {
    baseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'smart_vehicle_maintenance'
    };
  }

  // Handle SSL for cloud providers
  const useSsl = process.env.DB_SSL === 'true' || 
                 (baseConfig.host !== 'localhost' && baseConfig.host !== '127.0.0.1' && process.env.DB_SSL !== 'false');

  if (useSsl) {
    baseConfig.ssl = { rejectUnauthorized: false };
  }

  return {
    ...baseConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  };
}

const pool = mysql.createPool(getDbConfig());

// Helper for running parameterized queries
async function query(sql, params = []) {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', {
      sql: sql.substring(0, 100),
      message: error.message,
      code: error.code
    });
    throw error;
  }
}

// Auto-initialize schema in production if tables are missing
async function autoInitSchema() {
  try {
    // Check if tables exist
    const [rows] = await pool.query("SHOW TABLES LIKE 'users'");
    if (rows.length === 0) {
      console.log('📦 Database tables not found. Automatically running schema initialization...');
      const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
      const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');

      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/--.*$/gm, '')
          .trim();
        const statements = schemaSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (const st of statements) {
          // Avoid creating database if already in cloud database
          if (!st.toUpperCase().startsWith('CREATE DATABASE') && !st.toUpperCase().startsWith('USE ')) {
            try { await pool.query(st); } catch (e) { /* ignore duplicate errors */ }
          }
        }
        console.log('✓ Tables initialized automatically.');
      }

      if (fs.existsSync(seedPath)) {
        const seedSql = fs.readFileSync(seedPath, 'utf8')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/--.*$/gm, '')
          .trim();
        const statements = seedSql.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (const st of statements) {
          if (!st.toUpperCase().startsWith('USE ')) {
            try { await pool.query(st); } catch (e) { /* ignore */ }
          }
        }
        console.log('✓ Automotive problem knowledge base seeded automatically.');
      }
    }
  } catch (err) {
    // Non-fatal warning if user lacks DDL privileges
    console.warn('Auto-init check warning:', err.message);
  }
}

// Connection check with actionable feedback
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const config = getDbConfig();
    console.log(`✓ Connected to MySQL database "${config.database}" on ${config.host}:${config.port}`);
    connection.release();

    // Run auto-init check
    await autoInitSchema();
    return true;
  } catch (error) {
    console.warn('\n⚠️  WARNING: Could not connect to MySQL database!');
    console.warn(`Reason: [${error.code}] ${error.message}`);
    console.warn('Action Required:');
    console.warn('1. Check that MySQL Server is running or cloud credentials are correct.');
    console.warn('2. Ensure DB_PASSWORD, DB_USER, DB_HOST, DB_NAME in .env or Render match your MySQL setup.\n');
    return false;
  }
}

module.exports = {
  pool,
  query,
  testConnection
};
