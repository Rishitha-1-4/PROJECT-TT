/**
 * Smart Vehicle Maintenance Platform - Service History Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { requireAuth, verifyVehicleOwnership } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/services - Get service records with filtering and search
router.get('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { vehicle_id, search, startDate, endDate, sort } = req.query;

    let sql = `
      SELECT 
        s.*,
        v.name AS vehicle_name,
        v.registration_number,
        v.make,
        v.model
      FROM service_records s
      JOIN vehicles v ON s.vehicle_id = v.id
      WHERE s.user_id = ?
    `;
    const params = [userId];

    if (vehicle_id) {
      sql += ' AND s.vehicle_id = ?';
      params.push(vehicle_id);
    }

    if (startDate) {
      sql += ' AND s.service_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND s.service_date <= ?';
      params.push(endDate);
    }

    if (search && search.trim() !== '') {
      const keyword = `%${search.trim()}%`;
      sql += ` AND (
        s.service_type LIKE ? OR 
        s.description LIKE ? OR 
        s.parts_replaced LIKE ? OR 
        s.service_center LIKE ? OR 
        v.name LIKE ? OR 
        v.registration_number LIKE ?
      )`;
      params.push(keyword, keyword, keyword, keyword, keyword, keyword);
    }

    // Sorting
    if (sort === 'cost_desc') {
      sql += ' ORDER BY s.total_cost DESC';
    } else if (sort === 'cost_asc') {
      sql += ' ORDER BY s.total_cost ASC';
    } else if (sort === 'date_asc') {
      sql += ' ORDER BY s.service_date ASC, s.id ASC';
    } else {
      sql += ' ORDER BY s.service_date DESC, s.id DESC';
    }

    const services = await query(sql, params);

    return res.json({
      success: true,
      services
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/services/:id - Get single service record
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const serviceId = req.params.id;

    const rows = await query(`
      SELECT s.*, v.name AS vehicle_name, v.registration_number
      FROM service_records s
      JOIN vehicles v ON s.vehicle_id = v.id
      WHERE s.id = ? AND s.user_id = ?
    `, [serviceId, userId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Service record not found.' });
    }

    return res.json({
      success: true,
      service: rows[0]
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/services - Add service record
router.post('/', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const {
      vehicle_id,
      service_date,
      odometer_reading,
      service_type,
      description,
      parts_replaced,
      service_center,
      total_cost,
      next_service_date
    } = req.body;

    if (!vehicle_id || !service_date || odometer_reading === undefined || !service_type) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle, service date, odometer reading, and service type are required.'
      });
    }

    // Verify user owns the vehicle
    const owns = await verifyVehicleOwnership(vehicle_id, userId);
    if (!owns) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized vehicle selection.'
      });
    }

    const cost = parseFloat(total_cost || 0);
    const odo = parseInt(odometer_reading, 10);

    const result = await query(`
      INSERT INTO service_records
      (vehicle_id, user_id, service_date, odometer_reading, service_type, description, parts_replaced, service_center, total_cost, next_service_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      vehicle_id,
      userId,
      service_date,
      isNaN(odo) ? 0 : odo,
      service_type.trim(),
      description ? description.trim() : null,
      parts_replaced ? parts_replaced.trim() : null,
      service_center ? service_center.trim() : null,
      isNaN(cost) ? 0.00 : cost,
      next_service_date || null
    ]);

    // Update vehicle's current odometer if this service reading is higher
    if (!isNaN(odo) && odo > 0) {
      await query(`
        UPDATE vehicles 
        SET current_odometer = GREATEST(current_odometer, ?) 
        WHERE id = ? AND user_id = ?
      `, [odo, vehicle_id, userId]);
    }

    return res.status(201).json({
      success: true,
      message: 'Service record logged successfully.',
      serviceId: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/services/:id - Edit service record
router.put('/:id', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const serviceId = req.params.id;
    const {
      vehicle_id,
      service_date,
      odometer_reading,
      service_type,
      description,
      parts_replaced,
      service_center,
      total_cost,
      next_service_date
    } = req.body;

    // Check ownership of existing service record
    const existing = await query('SELECT * FROM service_records WHERE id = ? AND user_id = ?', [serviceId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Service record not found.' });
    }

    // Verify ownership of the target vehicle
    const owns = await verifyVehicleOwnership(vehicle_id, userId);
    if (!owns) {
      return res.status(403).json({ success: false, message: 'Unauthorized vehicle selection.' });
    }

    const cost = parseFloat(total_cost || 0);
    const odo = parseInt(odometer_reading, 10);

    await query(`
      UPDATE service_records SET
        vehicle_id = ?,
        service_date = ?,
        odometer_reading = ?,
        service_type = ?,
        description = ?,
        parts_replaced = ?,
        service_center = ?,
        total_cost = ?,
        next_service_date = ?
      WHERE id = ? AND user_id = ?
    `, [
      vehicle_id,
      service_date,
      isNaN(odo) ? 0 : odo,
      service_type.trim(),
      description ? description.trim() : null,
      parts_replaced ? parts_replaced.trim() : null,
      service_center ? service_center.trim() : null,
      isNaN(cost) ? 0.00 : cost,
      next_service_date || null,
      serviceId,
      userId
    ]);

    // Keep vehicle odometer synced if new reading is higher
    if (!isNaN(odo) && odo > 0) {
      await query(`
        UPDATE vehicles 
        SET current_odometer = GREATEST(current_odometer, ?) 
        WHERE id = ? AND user_id = ?
      `, [odo, vehicle_id, userId]);
    }

    return res.json({
      success: true,
      message: 'Service record updated successfully.'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/services/:id - Delete service record
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const serviceId = req.params.id;

    const existing = await query('SELECT id FROM service_records WHERE id = ? AND user_id = ?', [serviceId, userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Service record not found.' });
    }

    await query('DELETE FROM service_records WHERE id = ? AND user_id = ?', [serviceId, userId]);

    return res.json({
      success: true,
      message: 'Service record deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
