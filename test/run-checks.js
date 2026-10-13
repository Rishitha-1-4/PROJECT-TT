/**
 * Smart Vehicle Maintenance Platform - Automated Architecture & Functionality Tests
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Running Smart Vehicle Maintenance Platform Test Suite');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`✗ FAIL: ${name}`);
      console.error(`  Error: ${e.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (e) {
      console.error(`✗ FAIL: ${name}`);
      console.error(`  Error: ${e.message}`);
      failed++;
    }
  }

  // 1. Filesystem Checks
  test('All 10 required HTML views exist', () => {
    const requiredViews = [
      'index.html',
      'login.html',
      'register.html',
      'dashboard.html',
      'vehicles.html',
      'vehicle-details.html',
      'services.html',
      'reminders.html',
      'problems.html',
      'reports.html',
      'profile.html'
    ];
    for (const v of requiredViews) {
      const p = path.join(__dirname, '..', 'views', v);
      assert.ok(fs.existsSync(p), `Missing view: ${v}`);
      const stat = fs.statSync(p);
      assert.ok(stat.size > 200, `View ${v} is unexpectedly small or empty`);
    }
  });

  test('All required client-side scripts exist', () => {
    const requiredScripts = [
      'app-utils.js',
      'auth.js',
      'dashboard.js',
      'vehicles.js',
      'services.js',
      'reminders.js',
      'problems.js',
      'reports.js'
    ];
    for (const s of requiredScripts) {
      const p = path.join(__dirname, '..', 'public', 'js', s);
      assert.ok(fs.existsSync(p), `Missing client script: ${s}`);
    }
  });

  test('Automotive CSS stylesheet exists and defines core variables', () => {
    const cssPath = path.join(__dirname, '..', 'public', 'css', 'style.css');
    assert.ok(fs.existsSync(cssPath), 'style.css missing');
    const content = fs.readFileSync(cssPath, 'utf8');
    assert.ok(content.includes('--navy-dark'), 'CSS missing --navy-dark variable');
    assert.ok(content.includes('--blue-primary'), 'CSS missing --blue-primary variable');
    assert.ok(content.includes('@media print'), 'CSS missing print styles for reports');
  });

  test('Database schema and seed files exist', () => {
    const schema = path.join(__dirname, '..', 'database', 'schema.sql');
    const seed = path.join(__dirname, '..', 'database', 'seed.sql');
    assert.ok(fs.existsSync(schema), 'schema.sql missing');
    assert.ok(fs.existsSync(seed), 'seed.sql missing');
    const schemaSql = fs.readFileSync(schema, 'utf8');
    assert.ok(schemaSql.includes('smart_vehicle_maintenance'), 'Database name missing in schema');
    assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS `users`'), 'Users table missing in schema');
    assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS `vehicles`'), 'Vehicles table missing in schema');
    assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS `service_records`'), 'Service records table missing in schema');
    assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS `maintenance_reminders`'), 'Reminders table missing in schema');
    assert.ok(schemaSql.includes('CREATE TABLE IF NOT EXISTS `vehicle_problems`'), 'Vehicle problems table missing in schema');
  });

  // 2. Security & Bcrypt tests
  await asyncTest('Bcrypt password hashing and validation operates properly', async () => {
    const password = 'TestSecurePassword123!';
    const hash = await bcrypt.hash(password, 10);
    assert.notStrictEqual(password, hash);
    const isValid = await bcrypt.compare(password, hash);
    assert.strictEqual(isValid, true, 'Bcrypt compare returned false for matching password');
    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isInvalid, false, 'Bcrypt compare returned true for wrong password');
  });

  // 3. Reminder & Nodemailer Service Tests
  await asyncTest('Reminder service reports honest delivery without false positives', async () => {
    const reminderService = require('../services/reminderService');
    // Ensure email is recognized as not configured when SMTP credentials are empty
    const isConfigured = reminderService.isEmailConfigured();
    assert.strictEqual(typeof isConfigured, 'boolean');

    // Attempting to send email without config must return honest failure
    const res = await reminderService.sendEmail({
      to: 'owner@example.com',
      subject: 'Test Maintenance',
      text: 'Service due'
    });

    if (!isConfigured) {
      assert.strictEqual(res.sent, false);
      assert.ok(res.reason.includes('not configured'), 'Did not honestly state SMTP credentials missing');
    }
  });

  console.log('\n========================================================');
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
