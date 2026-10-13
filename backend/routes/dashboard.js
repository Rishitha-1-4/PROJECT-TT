/**
 * Smart Vehicle Maintenance Platform - Dashboard Statistics Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');
const reminderService = require('../services/reminderService');

router.use(requireAuth);

// GET /api/dashboard/stats - Real-time computed dashboard statistics
router.get('/stats', async (req, res, next) => {
  try {
    const userId = req.session.userId;

    // Refresh overdue statuses dynamically
    await reminderService.updateOverdueStatuses();

    // 1. Total vehicles
    const [vehiclesCount] = await query(
      'SELECT COUNT(*) as count FROM vehicles WHERE user_id = ?',
      [userId]
    );

    // 2. Upcoming & Overdue Reminders count
    const [remindersCount] = await query(`
      SELECT 
        SUM(CASE WHEN status = 'upcoming' THEN 1 ELSE 0 END) AS upcoming_count,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue_count
      FROM maintenance_reminders
      WHERE user_id = ?
    `, [userId]);

    // 3. Total maintenance expense
    const [expenseSum] = await query(
      'SELECT COALESCE(SUM(total_cost), 0) AS total_expense FROM service_records WHERE user_id = ?',
      [userId]
    );

    // 4. Recent Service Records (Last 5)
    const recentServices = await query(`
      SELECT 
        s.id, s.service_date, s.service_type, s.total_cost, s.odometer_reading, s.service_center,
        v.name AS vehicle_name, v.registration_number
      FROM service_records s
      JOIN vehicles v ON s.vehicle_id = v.id
      WHERE s.user_id = ?
      ORDER BY s.service_date DESC, s.id DESC
      LIMIT 5
    `, [userId]);

    // 5. Vehicles status overview
    const vehiclesList = await query(`
      SELECT 
        v.id, v.name, v.registration_number, v.vehicle_type, v.make, v.model, v.current_odometer,
        (SELECT MAX(s.service_date) FROM service_records s WHERE s.vehicle_id = v.id) AS latest_service_date,
        (SELECT s.next_service_date FROM service_records s WHERE s.vehicle_id = v.id ORDER BY s.service_date DESC LIMIT 1) AS next_service_date,
        (SELECT COUNT(*) FROM maintenance_reminders r WHERE r.vehicle_id = v.id AND r.status = 'upcoming') AS upcoming_reminders,
        (SELECT COUNT(*) FROM maintenance_reminders r WHERE r.vehicle_id = v.id AND r.status = 'overdue') AS overdue_reminders
      FROM vehicles v
      WHERE v.user_id = ?
      ORDER BY v.created_at DESC
    `, [userId]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vehicleStatuses = vehiclesList.map(v => {
      let status = 'Good';
      let badge = 'status-good';

      if (v.overdue_reminders > 0) {
        status = 'Overdue';
        badge = 'status-overdue';
      } else if (v.next_service_date) {
        const nextDate = new Date(v.next_service_date);
        const diffDays = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          status = 'Overdue';
          badge = 'status-overdue';
        } else if (diffDays <= 14) {
          status = 'Due Soon';
          badge = 'status-due';
        }
      } else if (v.upcoming_reminders > 0) {
        status = 'Due Soon';
        badge = 'status-due';
      }

      return {
        id: v.id,
        name: v.name,
        registration_number: v.registration_number,
        make: v.make,
        model: v.model,
        vehicle_type: v.vehicle_type,
        current_odometer: v.current_odometer,
        latest_service_date: v.latest_service_date,
        status,
        badge
      };
    });

    // 6. Monthly Expenses for the last 6 months (for Chart.js)
    const monthlyExpenses = await query(`
      SELECT 
        DATE_FORMAT(service_date, '%Y-%m') AS month_key,
        DATE_FORMAT(service_date, '%b %Y') AS month_label,
        SUM(total_cost) AS total_amount,
        COUNT(id) AS service_count
      FROM service_records
      WHERE user_id = ?
        AND service_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month_key, month_label
      ORDER BY month_key ASC
    `, [userId]);

    return res.json({
      success: true,
      stats: {
        totalVehicles: vehiclesCount.count || 0,
        upcomingReminders: remindersCount.upcoming_count || 0,
        overdueReminders: remindersCount.overdue_count || 0,
        totalExpenses: parseFloat(expenseSum.total_expense || 0),
        recentServices,
        vehicleStatuses,
        monthlyExpenses
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
