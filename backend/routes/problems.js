/**
 * Smart Vehicle Maintenance Platform - Problem Knowledge Base Routes
 */

const express = require('express');
const router = express.Router();
const { query } = require('../config/db');

// GET /api/problems - Searchable knowledge base (accessible for logged in users & preview)
router.get('/', async (req, res, next) => {
  try {
    const { q, category, urgency } = req.query;

    let sql = 'SELECT * FROM vehicle_problems WHERE 1=1';
    const params = [];

    if (q && q.trim() !== '') {
      const keyword = `%${q.trim()}%`;
      sql += ` AND (
        title LIKE ? OR 
        symptoms LIKE ? OR 
        possible_causes LIKE ? OR 
        affected_components LIKE ? OR 
        recommendations LIKE ?
      )`;
      params.push(keyword, keyword, keyword, keyword, keyword);
    }

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }

    if (urgency && urgency !== 'all') {
      sql += ' AND urgency = ?';
      params.push(urgency);
    }

    sql += ' ORDER BY CASE urgency WHEN "critical" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END, title ASC';

    const problems = await query(sql, params);

    // Get unique categories for filter dropdown
    const categoriesRows = await query('SELECT DISTINCT category FROM vehicle_problems ORDER BY category ASC');
    const categories = categoriesRows.map(r => r.category);

    return res.json({
      success: true,
      count: problems.length,
      categories,
      problems
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/problems/:id - Detailed problem view
router.get('/:id', async (req, res, next) => {
  try {
    const problemId = req.params.id;
    const rows = await query('SELECT * FROM vehicle_problems WHERE id = ?', [problemId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Problem record not found.' });
    }

    return res.json({
      success: true,
      problem: rows[0]
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
