/**
 * Smart Vehicle Maintenance Platform - Reports & Analytics Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// GET /api/reports/analytics - High-level analytics and breakdown
router.get('/analytics', async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { startDate, endDate, vehicle_id } = req.query;

    let baseFilter = 'WHERE s.user_id = ?';
    const params = [userId];

    if (vehicle_id && vehicle_id !== 'all') {
      baseFilter += ' AND s.vehicle_id = ?';
      params.push(vehicle_id);
    }
    if (startDate) {
      baseFilter += ' AND s.service_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      baseFilter += ' AND s.service_date <= ?';
      params.push(endDate);
    }

    // 1. Overall totals in range
    const [overall] = await query(`
      SELECT 
        COUNT(s.id) AS total_services,
        COALESCE(SUM(s.total_cost), 0) AS total_expense,
        COALESCE(AVG(s.total_cost), 0) AS avg_service_cost
      FROM service_records s
      ${baseFilter}
    `, params);

    // 2. Monthly Expenses trend (for Line/Bar Chart)
    const monthlyExpenses = await query(`
      SELECT 
        DATE_FORMAT(s.service_date, '%Y-%m') AS month_key,
        DATE_FORMAT(s.service_date, '%b %Y') AS month_label,
        SUM(s.total_cost) AS total_amount,
        COUNT(s.id) AS service_count
      FROM service_records s
      ${baseFilter}
      GROUP BY month_key, month_label
      ORDER BY month_key ASC
    `, params);

    // 3. Vehicle-wise expense breakdown (for Doughnut Chart)
    const vehicleBreakdown = await query(`
      SELECT 
        v.id,
        v.name,
        v.registration_number,
        COALESCE(SUM(s.total_cost), 0) AS total_spent,
        COUNT(s.id) AS service_count
      FROM vehicles v
      LEFT JOIN service_records s ON v.id = s.vehicle_id 
        ${startDate ? 'AND s.service_date >= ?' : ''}
        ${endDate ? 'AND s.service_date <= ?' : ''}
      WHERE v.user_id = ?
      GROUP BY v.id, v.name, v.registration_number
      ORDER BY total_spent DESC
    `, [
      ...(startDate ? [startDate] : []),
      ...(endDate ? [endDate] : []),
      userId
    ]);

    // 4. Service Type Breakdown (e.g. Oil Change, Brakes, Tires)
    const serviceTypeBreakdown = await query(`
      SELECT 
        s.service_type,
        COUNT(s.id) AS count,
        SUM(s.total_cost) AS total_cost
      FROM service_records s
      ${baseFilter}
      GROUP BY s.service_type
      ORDER BY total_cost DESC
    `, params);

    // 5. Detailed filtered records for printable tabular report
    const detailedRecords = await query(`
      SELECT 
        s.*,
        v.name AS vehicle_name,
        v.registration_number
      FROM service_records s
      JOIN vehicles v ON s.vehicle_id = v.id
      ${baseFilter}
      ORDER BY s.service_date DESC, s.id DESC
    `, params);

    return res.json({
      success: true,
      summary: {
        totalServices: overall.total_services || 0,
        totalExpense: parseFloat(overall.total_expense || 0),
        avgCost: parseFloat(overall.avg_service_cost || 0)
      },
      monthlyExpenses,
      vehicleBreakdown,
      serviceTypeBreakdown,
      detailedRecords
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
