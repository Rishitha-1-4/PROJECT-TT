/**
 * Smart Vehicle Maintenance Platform - Profile Management Routes
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/profile
router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const users = await query('SELECT id, name, email, created_at FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const user = users[0];

    // Account statistics
    const [vehiclesCount] = await query('SELECT COUNT(*) as count FROM vehicles WHERE user_id = ?', [userId]);
    const [servicesCount] = await query('SELECT COUNT(*) as count FROM service_records WHERE user_id = ?', [userId]);
    const [remindersCount] = await query('SELECT COUNT(*) as count FROM maintenance_reminders WHERE user_id = ?', [userId]);

    return res.json({
      success: true,
      user,
      stats: {
        totalVehicles: vehiclesCount.count || 0,
        totalServices: servicesCount.count || 0,
        totalReminders: remindersCount.count || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/profile
router.put('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    // Check if email is already taken by another user
    const existing = await query('SELECT id FROM users WHERE email = ? AND id != ?', [trimmedEmail, userId]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email address is already in use by another account.' });
    }

    await query('UPDATE users SET name = ?, email = ? WHERE id = ?', [trimmedName, trimmedEmail, userId]);

    // Update session
    req.session.user.name = trimmedName;
    req.session.user.email = trimmedEmail;

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: userId,
        name: trimmedName,
        email: trimmedEmail
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/profile/password
router.put('/password', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const users = await query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password does not match our records.'
      });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

    return res.json({
      success: true,
      message: 'Password updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
