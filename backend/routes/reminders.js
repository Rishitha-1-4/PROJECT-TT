/**
 * Smart Vehicle Maintenance Platform - Maintenance Reminders Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { requireAuth, verifyVehicleOwnership } = require('../middleware/auth');
const reminderService = require('../services/reminderService');

router.use(requireAuth);

// GET /api/reminders - List reminders with optional status & vehicle filter
router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { status, vehicle_id } = req.query;

    // Refresh overdue statuses dynamically
    await reminderService.updateOverdueStatuses();

    let sql = `
      SELECT 
        r.*,
        v.name AS vehicle_name,
        v.registration_number,
        v.make,
        v.model,
        v.current_odometer
      FROM maintenance_reminders r
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.user_id = ?
    `;
    const params = [userId];

    if (vehicle_id) {
      sql += ' AND r.vehicle_id = ?';
      params.push(vehicle_id);
    }

    if (status && status !== 'all') {
      sql += ' AND r.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY CASE r.status WHEN "overdue" THEN 1 WHEN "upcoming" THEN 2 ELSE 3 END, r.due_date ASC';

    const reminders = await query(sql, params);

    return res.json({
      success: true,
      reminders,
      emailEnabled: reminderService.isEmailConfigured()
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reminders/:id - Get single reminder
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const reminderId = req.params.id;

    const rows = await query(`
      SELECT r.*, v.name AS vehicle_name, v.registration_number
      FROM maintenance_reminders r
      JOIN vehicles v ON r.vehicle_id = v.id
      WHERE r.id = ? AND r.user_id = ?
    `, [reminderId, userId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Reminder not found.' });
    }

    return res.json({
      success: true,
      reminder: rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/reminders - Create maintenance reminder
router.post('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { vehicle_id, task_name, due_date, due_odometer, notes } = req.body;

    if (!vehicle_id || !task_name || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle, task name, and due date are required.'
      });
    }

    const owns = await verifyVehicleOwnership(vehicle_id, userId);
    if (!owns) {
      return res.status(403).json({ success: false, message: 'Unauthorized vehicle selection.' });
    }

    // Determine initial status based on due date
    const today = new Date().toISOString().split('T')[0];
    const initialStatus = due_date < today ? 'overdue' : 'upcoming';

    const odo = due_odometer ? parseInt(due_odometer, 10) : null;

    const result = await query(`
      INSERT INTO maintenance_reminders
      (vehicle_id, user_id, task_name, due_date, due_odometer, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      vehicle_id,
      userId,
      task_name.trim(),
      due_date,
      isNaN(odo) ? null : odo,
      notes ? notes.trim() : null,
      initialStatus
    ]);

    return res.status(201).json({
      success: true,
      message: 'Maintenance reminder created successfully.',
      reminderId: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/reminders/:id - Update reminder
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const reminderId = req.params.id;
    const { vehicle_id, task_name, due_date, due_odometer, notes, status } = req.body;

    const existing = await query('SELECT id FROM maintenance_reminders WHERE id = ? AND user_id = ?', [reminderId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Reminder not found.' });
    }

    const owns = await verifyVehicleOwnership(vehicle_id, userId);
    if (!owns) {
      return res.status(403).json({ success: false, message: 'Unauthorized vehicle selection.' });
    }

    const today = new Date().toISOString().split('T')[0];
    let finalStatus = status;
    if (!status || status === 'upcoming') {
      finalStatus = due_date < today ? 'overdue' : 'upcoming';
    }

    const odo = due_odometer ? parseInt(due_odometer, 10) : null;

    await query(`
      UPDATE maintenance_reminders SET
        vehicle_id = ?,
        task_name = ?,
        due_date = ?,
        due_odometer = ?,
        notes = ?,
        status = ?,
        reminder_sent = 0
      WHERE id = ? AND user_id = ?
    `, [
      vehicle_id,
      task_name.trim(),
      due_date,
      isNaN(odo) ? null : odo,
      notes ? notes.trim() : null,
      finalStatus,
      reminderId,
      userId
    ]);

    return res.json({
      success: true,
      message: 'Reminder updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/reminders/:id/complete - Mark reminder as completed
router.patch('/:id/complete', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const reminderId = req.params.id;

    const existing = await query('SELECT id FROM maintenance_reminders WHERE id = ? AND user_id = ?', [reminderId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Reminder not found.' });
    }

    const today = new Date().toISOString().split('T')[0];
    await query(`
      UPDATE maintenance_reminders 
      SET status = 'completed', completed_at = ?
      WHERE id = ? AND user_id = ?
    `, [today, reminderId, userId]);

    return res.json({
      success: true,
      message: 'Reminder marked as completed.'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/reminders/:id - Delete reminder
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const reminderId = req.params.id;

    const existing = await query('SELECT id FROM maintenance_reminders WHERE id = ? AND user_id = ?', [reminderId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Reminder not found.' });
    }

    await query('DELETE FROM maintenance_reminders WHERE id = ? AND user_id = ?', [reminderId, userId]);

    return res.json({
      success: true,
      message: 'Reminder deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/reminders/trigger-check - Run reminder notifications check
router.post('/trigger-check', async (req, res, next) => {
  try {
    const result = await reminderService.checkAndSendReminders();
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
