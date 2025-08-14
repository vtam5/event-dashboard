// backend/routes/events.js
const express = require('express');
const { body, param } = require('express-validator');
const pool = require('../db');
const eventsCtrl = require('../controllers/eventController');
const { checkValidation } = require('../middleware/validation');

const router = express.Router();

// Simple admin guard via query (?admin=1 or ?admin=true)
const requireAdmin = (req, res, next) => {
  const v = String(req.query.admin || '').toLowerCase();
  if (v === '1' || v === 'true') return next();
  return res.status(403).json({ error: 'admin=1 required' });
};

// List
router.get('/', eventsCtrl.listEvents);

// Create (admin only)
router.post('/', requireAdmin, eventsCtrl.createEvent);

// CSV export (falls back to inline exporter if controller fn not present)
router.get(
  '/export',
  eventsCtrl.exportCSV
  || eventsCtrl.exportEventsCSV
  || eventsCtrl.exportAllEvents
  || (async (_req, res, next) => {
      try {
        const [rows] = await pool.query(
          `SELECT eventId, name, date, time, location, description, status, createdAt
             FROM Events
            ORDER BY createdAt DESC`
        );
        const cols = [
          'eventId','name','date','time','location','description','status','createdAt'
        ];
        const esc = (s) =>
          s == null
            ? ''
            : /[",\n]/.test(String(s))
              ? `"${String(s).replace(/"/g, '""')}"`
              : String(s);

        const header = cols.join(',');
        const lines = rows.map(r => cols.map(c => esc(r[c])).join(','));
        const csv = [header, ...lines].join('\n');

        res.type('text/csv').send(csv);
      } catch (e) {
        next(e);
      }
    })
);

// Reorder (admin only) — place BEFORE the :id route
router.put(
  '/reorder',
  [
    requireAdmin,
    body('order')
      .custom(arr => Array.isArray(arr) && arr.length > 0 && arr.every(Number.isInteger))
      .withMessage('order must be a non-empty array of integers'),
    checkValidation,
  ],
  async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
      const { order } = req.body;

      // Check duplicates
      if (new Set(order).size !== order.length) {
        return res.status(400).json({ success: false, error: 'Duplicate IDs in order' });
      }

      // Ensure all IDs exist
      const [existing] = await conn.query(
        'SELECT eventId FROM Events WHERE eventId IN (?)',
        [order]
      );
      if (existing.length !== order.length) {
        return res.status(400).json({ success: false, error: 'One or more events not found' });
      }

      await conn.beginTransaction();
      for (let i = 0; i < order.length; i++) {
        await conn.query('UPDATE Events SET sortOrder = ? WHERE eventId = ?', [i + 1, order[i]]);
      }
      await conn.commit();

      res.json({ success: true, updated: order.length });
    } catch (err) {
      try { await conn.rollback(); } catch {}
      next(err);
    } finally {
      conn.release();
    }
  }
);

// Update (admin only)
router.put(
  '/:id(\\d+)',
  [requireAdmin, param('id').isInt().toInt(), checkValidation],
  eventsCtrl.updateEvent
);

// Delete (admin only)
router.delete(
  '/:id(\\d+)',
  [requireAdmin, param('id').isInt().toInt(), checkValidation],
  eventsCtrl.deleteEvent
);

module.exports = router;
