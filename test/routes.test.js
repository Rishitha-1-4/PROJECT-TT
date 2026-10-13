/**
 * Smart Vehicle Maintenance Platform - Express Route & Middleware Integration Test
 */

const assert = require('assert');
const http = require('http');
const express = require('express');
const session = require('express-session');

// Import all application routers
const authRoutes = require('../routes/auth');
const vehicleRoutes = require('../routes/vehicles');
const serviceRoutes = require('../routes/services');
const reminderRoutes = require('../routes/reminders');
const problemRoutes = require('../routes/problems');
const reportRoutes = require('../routes/reports');
const dashboardRoutes = require('../routes/dashboard');

async function testRoutes() {
  console.log('Testing Express Routes & Auth Middleware Protection...');

  const app = express();
  app.use(express.json());
  app.use(session({
    secret: 'test_secret_123',
    resave: false,
    saveUninitialized: false
  }));

  app.use('/api/auth', authRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/services', serviceRoutes);
  app.use('/api/reminders', reminderRoutes);
  app.use('/api/problems', problemRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/dashboard', dashboardRoutes);

  const server = app.listen(0);
  const port = server.address().port;

  function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: { 'Content-Type': 'application/json' }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let json = null;
          try { json = JSON.parse(data); } catch(e) {}
          resolve({ status: res.statusCode, data: json, raw: data });
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  try {
    // 1. Unauthenticated requests to protected endpoints MUST return 401
    const resVehicles = await makeRequest('/api/vehicles');
    assert.strictEqual(resVehicles.status, 401, 'Unauthenticated /api/vehicles did not return 401');
    assert.strictEqual(resVehicles.data.success, false);
    console.log('✓ /api/vehicles correctly enforces 401 Unauthorized for unauthenticated requests');

    const resServices = await makeRequest('/api/services');
    assert.strictEqual(resServices.status, 401, 'Unauthenticated /api/services did not return 401');
    console.log('✓ /api/services correctly enforces 401 Unauthorized for unauthenticated requests');

    const resReminders = await makeRequest('/api/reminders');
    assert.strictEqual(resReminders.status, 401, 'Unauthenticated /api/reminders did not return 401');
    console.log('✓ /api/reminders correctly enforces 401 Unauthorized for unauthenticated requests');

    const resDashboard = await makeRequest('/api/dashboard/stats');
    assert.strictEqual(resDashboard.status, 401, 'Unauthenticated /api/dashboard/stats did not return 401');
    console.log('✓ /api/dashboard/stats correctly enforces 401 Unauthorized for unauthenticated requests');

    // 2. Validation tests on auth registration
    const resInvalidReg = await makeRequest('/api/auth/register', 'POST', {
      name: '',
      email: 'bad-email',
      password: '123'
    });
    assert.strictEqual(resInvalidReg.status, 400, 'Invalid registration did not return 400 Bad Request');
    console.log('✓ /api/auth/register rejects invalid user inputs with 400 Bad Request');

    const resInvalidLogin = await makeRequest('/api/auth/login', 'POST', {
      email: '',
      password: ''
    });
    assert.strictEqual(resInvalidLogin.status, 400, 'Empty login credentials did not return 400');
    console.log('✓ /api/auth/login rejects empty credentials with 400 Bad Request');

    console.log('\nAll route security & validation integration checks PASSED!');
  } finally {
    server.close();
  }
}

testRoutes().catch(err => {
  console.error('Route integration test failed:', err);
  process.exit(1);
});
