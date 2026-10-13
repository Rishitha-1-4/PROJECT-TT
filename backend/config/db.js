/**
 * Smart Vehicle Maintenance Platform - Database Connection Pool Configuration
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_vehicle_maintenance',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

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

// Connection check with actionable console feedback
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`✓ Connected to MySQL database "${process.env.DB_NAME || 'smart_vehicle_maintenance'}" on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '3306'}`);
    connection.release();
    return true;
  } catch (error) {
    console.warn('\n⚠️  WARNING: Could not connect to MySQL database!');
    console.warn(`Reason: [${error.code}] ${error.message}`);
    console.warn('Action Required:');
    console.warn('1. Check that MySQL Server is running on your machine.');
    console.warn('2. Ensure DB_PASSWORD and DB_USER in your .env file match your MySQL setup.');
    console.warn('3. Run `npm run db:init` to create the schema and tables.\n');
    return false;
  }
}

module.exports = {
  pool,
  query,
  testConnection
};
