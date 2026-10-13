/**
 * Smart Vehicle Maintenance Platform - Main Express Application Server
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { testConnection } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const vehicleRoutes = require('./routes/vehicles');
const serviceRoutes = require('./routes/services');
const reminderRoutes = require('./routes/reminders');
const problemRoutes = require('./routes/problems');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');

// Import middleware
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session configuration
app.use(session({
  name: 'svm.sid',
  secret: process.env.SESSION_SECRET || 'smart_vehicle_maintenance_session_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static assets from public/ directory
app.use(express.static(path.join(__dirname, 'public')));

// HTML Views Routing
// Public Views
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Protected Views (Require Authentication)
app.get('/dashboard.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/vehicles.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'vehicles.html'));
});

app.get('/vehicle-details.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'vehicle-details.html'));
});

app.get('/services.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'services.html'));
});

app.get('/reminders.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'reminders.html'));
});

app.get('/problems.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'problems.html'));
});

app.get('/reports.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'reports.html'));
});

app.get('/profile.html', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

// Mount REST API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Database Health Check API
app.get('/api/health', async (req, res) => {
  const isDbConnected = await testConnection();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: isDbConnected ? 'connected' : 'disconnected',
    instructions: isDbConnected ? 'Operating normally' : 'Ensure MySQL is running and .env credentials are correct.'
  });
});

// 404 handler for unknown routes
app.use((req, res) => {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API route not found.' });
  }
  return res.redirect('/');
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);

  const statusCode = err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log('========================================================');
  console.log(`🚀 Smart Vehicle Maintenance Platform`);
  console.log(`📡 Server running at http://localhost:${PORT}`);
  console.log(`⏱  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('========================================================');

  // Verify DB connection
  await testConnection();
});
