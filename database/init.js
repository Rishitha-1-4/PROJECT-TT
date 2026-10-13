/**
 * Smart Vehicle Maintenance Platform - Database Initialization Script
 * Runs schema creation and seeds knowledge base records.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Helper to execute multi-statement SQL files safely
async function executeSqlFile(connection, filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Remove multi-line and single-line comments
  const cleanSql = content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
    .trim();

  // Split statements by semicolon while avoiding empty statements
  const statements = cleanSql
    .split(';')
    .map(st => st.trim())
    .filter(st => st.length > 0);

  for (const statement of statements) {
    await connection.query(statement);
  }
}

async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const databaseName = process.env.DB_NAME || 'smart_vehicle_maintenance';

  console.log('====================================================');
  console.log('Smart Vehicle Maintenance Platform - Database Setup');
  console.log('====================================================');
  console.log(`Connecting to MySQL at ${host}:${port} as '${user}'...`);

  let connection;
  try {
    // 1. Connect without specific database to create DB if needed
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });

    console.log('✓ Successfully connected to MySQL server.');

    // 2. Create database
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✓ Database '${databaseName}' confirmed.`);

    // 3. Select database
    await connection.changeUser({ database: databaseName });

    // 4. Run schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    await executeSqlFile(connection, schemaPath);
    console.log('✓ Tables initialized successfully (users, vehicles, service_records, maintenance_reminders, vehicle_problems).');

    // 5. Run seed.sql for knowledge base problems
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      await executeSqlFile(connection, seedPath);
      console.log('✓ Automotive Problem Knowledge Base seeded with realistic entries.');
    }

    console.log('====================================================');
    console.log('Database initialization completed successfully!');
    console.log('Ready to run: npm start');
    console.log('====================================================');
  } catch (err) {
    console.error('\n❌ Database Initialization Failed!');
    console.error('Error Code:', err.code);
    console.error('Message:', err.message);
    console.log('\n[Troubleshooting Tips for Windows]');
    console.log('1. Verify your MySQL service is running (e.g. "MySQL80" in Services.msc).');
    console.log('2. Check your .env file credentials:');
    console.log(`   DB_HOST=${host}`);
    console.log(`   DB_PORT=${port}`);
    console.log(`   DB_USER=${user}`);
    console.log(`   DB_PASSWORD=<ensure your local MySQL root password is set in .env>`);
    console.log(`   DB_NAME=${databaseName}`);
    console.log('3. Run "node database/init.js" again once credentials are set.\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase, executeSqlFile };
