/**
 * Smart Vehicle Maintenance Platform - Vehicle Management Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/vehicles - List all vehicles for current user
router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const vehicles = await query(`
      SELECT 
        v.*,
        (SELECT MAX(s.service_date) FROM service_records s WHERE s.vehicle_id = v.id) AS latest_service_date,
        (SELECT s.next_service_date FROM service_records s WHERE s.vehicle_id = v.id ORDER BY s.service_date DESC LIMIT 1) AS next_service_date,
        (SELECT COUNT(*) FROM service_records s WHERE s.vehicle_id = v.id) AS service_count,
        (SELECT COALESCE(SUM(s.total_cost), 0) FROM service_records s WHERE s.vehicle_id = v.id) AS total_expenses,
        (SELECT COUNT(*) FROM maintenance_reminders r WHERE r.vehicle_id = v.id AND r.status = 'upcoming') AS upcoming_reminders,
        (SELECT COUNT(*) FROM maintenance_reminders r WHERE r.vehicle_id = v.id AND r.status = 'overdue') AS overdue_reminders
      FROM vehicles v
      WHERE v.user_id = ?
      ORDER BY v.created_at DESC
    `, [userId]);

    // Compute status (Good, Due Soon, Overdue) based on actual dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const enrichedVehicles = vehicles.map(v => {
      let status = 'Good';
      let statusBadge = 'status-good';

      if (v.overdue_reminders > 0) {
        status = 'Overdue';
        statusBadge = 'status-overdue';
      } else if (v.next_service_date) {
        const nextDate = new Date(v.next_service_date);
        const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          status = 'Overdue';
          statusBadge = 'status-overdue';
        } else if (diffDays <= 14) {
          status = 'Due Soon';
          statusBadge = 'status-due';
        }
      } else if (v.upcoming_reminders > 0) {
        status = 'Due Soon';
        statusBadge = 'status-due';
      }

      return {
        ...v,
        maintenance_status: status,
        maintenance_badge: statusBadge
      };
    });

    return res.json({
      success: true,
      vehicles: enrichedVehicles
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/vehicles/:id - Detailed vehicle information and health
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const vehicleId = req.params.id;

    const vehicles = await query('SELECT * FROM vehicles WHERE id = ? AND user_id = ?', [vehicleId, userId]);
    if (vehicles.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found or unauthorized.' });
    }

    const vehicle = vehicles[0];

    // Get service history
    const services = await query(`
      SELECT * FROM service_records 
      WHERE vehicle_id = ? AND user_id = ? 
      ORDER BY service_date DESC, id DESC
    `, [vehicleId, userId]);

    // Get maintenance reminders
    const reminders = await query(`
      SELECT * FROM maintenance_reminders 
      WHERE vehicle_id = ? AND user_id = ? 
      ORDER BY due_date ASC
    `, [vehicleId, userId]);

    // Calculate aggregated stats
    const totalExpenses = services.reduce((sum, s) => sum + parseFloat(s.total_cost || 0), 0);
    const latestService = services.length > 0 ? services[0] : null;

    // Determine Maintenance Status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let status = 'Good';
    let statusMessage = 'Vehicle maintenance is up to date.';

    const overdueReminders = reminders.filter(r => r.status === 'overdue' || (r.status === 'upcoming' && new Date(r.due_date) < today));
    const dueSoonReminders = reminders.filter(r => {
      if (r.status === 'completed') return false;
      const d = new Date(r.due_date);
      const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= 14;
    });

    if (overdueReminders.length > 0) {
      status = 'Overdue';
      statusMessage = `${overdueReminders.length} maintenance task(s) are overdue.`;
    } else if (latestService && latestService.next_service_date && new Date(latestService.next_service_date) < today) {
      status = 'Overdue';
      statusMessage = 'Next scheduled service date has passed.';
    } else if (dueSoonReminders.length > 0) {
      status = 'Due Soon';
      statusMessage = `${dueSoonReminders.length} maintenance task(s) due within 14 days.`;
    } else if (latestService && latestService.next_service_date) {
      const diffDays = Math.ceil((new Date(latestService.next_service_date) - today) / (1000 * 60 * 60 * 24));
      if (diffDays <= 14) {
        status = 'Due Soon';
        statusMessage = `Service due in ${diffDays} day(s).`;
      }
    }

    return res.json({
      success: true,
      vehicle,
      health: {
        status,
        statusMessage,
        totalExpenses,
        serviceCount: services.length,
        latestService,
        upcomingTasksCount: reminders.filter(r => r.status === 'upcoming').length,
        overdueTasksCount: overdueReminders.length
      },
      services,
      reminders
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/vehicles - Create a vehicle
router.post('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const {
      name,
      registration_number,
      vehicle_type,
      make,
      model,
      year,
      fuel_type,
      current_odometer,
      purchase_date
    } = req.body;

    // Validation
    if (!name || !registration_number || !vehicle_type || !make || !model || !year || !fuel_type) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required vehicle fields.'
      });
    }

    const regNum = registration_number.trim().toUpperCase();

    // Check duplicate registration number for this user
    const existing = await query(
      'SELECT id FROM vehicles WHERE user_id = ? AND registration_number = ?',
      [userId, regNum]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A vehicle with this registration number is already registered in your account.'
      });
    }

    const odo = parseInt(current_odometer || 0, 10);
    const yr = parseInt(year, 10);

    const result = await query(`
      INSERT INTO vehicles 
      (user_id, name, registration_number, vehicle_type, make, model, year, fuel_type, current_odometer, purchase_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      name.trim(),
      regNum,
      vehicle_type.trim(),
      make.trim(),
      model.trim(),
      yr,
      fuel_type.trim(),
      isNaN(odo) ? 0 : odo,
      purchase_date || null
    ]);

    return res.status(201).json({
      success: true,
      message: 'Vehicle added successfully.',
      vehicleId: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/vehicles/:id - Update vehicle
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const vehicleId = req.params.id;
    const {
      name,
      registration_number,
      vehicle_type,
      make,
      model,
      year,
      fuel_type,
      current_odometer,
      purchase_date
    } = req.body;

    // Verify ownership
    const check = await query('SELECT id FROM vehicles WHERE id = ? AND user_id = ?', [vehicleId, userId]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found or unauthorized.' });
    }

    if (!name || !registration_number || !vehicle_type || !make || !model || !year || !fuel_type) {
      return res.status(400).json({
        success: false,
        message: 'All vehicle fields are required.'
      });
    }

    const regNum = registration_number.trim().toUpperCase();

    // Check duplicate registration number among user's other vehicles
    const duplicate = await query(
      'SELECT id FROM vehicles WHERE user_id = ? AND registration_number = ? AND id != ?',
      [userId, regNum, vehicleId]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Another vehicle already uses this registration number.'
      });
    }

    await query(`
      UPDATE vehicles SET
        name = ?,
        registration_number = ?,
        vehicle_type = ?,
        make = ?,
        model = ?,
        year = ?,
        fuel_type = ?,
        current_odometer = ?,
        purchase_date = ?
      WHERE id = ? AND user_id = ?
    `, [
      name.trim(),
      regNum,
      vehicle_type.trim(),
      make.trim(),
      model.trim(),
      parseInt(year, 10),
      fuel_type.trim(),
      parseInt(current_odometer || 0, 10),
      purchase_date || null,
      vehicleId,
      userId
    ]);

    return res.json({
      success: true,
      message: 'Vehicle updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/vehicles/:id - Delete vehicle
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const vehicleId = req.params.id;

    // Verify ownership
    const check = await query('SELECT id FROM vehicles WHERE id = ? AND user_id = ?', [vehicleId, userId]);
    if (check.length === 0) {
      return res.status(404).json({ success: false, message: 'Vehicle not found or unauthorized.' });
    }

    // Delete vehicle (cascades to service_records and maintenance_reminders due to DB foreign keys)
    await query('DELETE FROM vehicles WHERE id = ? AND user_id = ?', [vehicleId, userId]);

    return res.json({
      success: true,
      message: 'Vehicle and associated maintenance records deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
