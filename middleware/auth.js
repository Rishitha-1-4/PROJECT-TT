/**
 * Smart Vehicle Maintenance Platform - Authentication Middleware
 */

const { query } = require('../config/db');

// Middleware to ensure user is logged in
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }

  // If request is an API request, return 401 JSON
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please log in to continue.'
    });
  }

  // If browser page request, redirect to login page
  return res.redirect('/login.html');
}

// Helper to verify a user owns the requested vehicle
async function verifyVehicleOwnership(vehicleId, userId) {
  const rows = await query('SELECT id FROM vehicles WHERE id = ? AND user_id = ?', [vehicleId, userId]);
  return rows.length > 0;
}

module.exports = {
  requireAuth,
  verifyVehicleOwnership
};
