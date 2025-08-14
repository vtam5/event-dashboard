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

// =======================
// Event list (public)
// =======================
router.get('/', eventsCtrl.listEvents);

// =======================
// Create Event (admin)
// =======================
router.post('/', requireAdmin, eventsCtrl.createEvent);

// =======================
// CSV export (admin)
// =======================
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

router.get('/:id(\\d+)', eventsCtrl.getEvent);

// =======================
// Reorder Events (admin)
// =======================
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

      if (new Set(order).size !== order.length) {
        return res.status(400).json({ success: false, error: 'Duplicate IDs in order' });
      }

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

// =======================
// Public: Get Single Event
// =======================
router.get(
  '/:id(\\d+)',
  [param('id').isInt().toInt(), checkValidation],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(
        'SELECT * FROM Events WHERE eventId = ? LIMIT 1',
        [id]
      );
      if (!rows.length) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// =======================
// Admin: Get Participants
// =======================
router.get(
  '/:id(\\d+)/participants',
  [requireAdmin, param('id').isInt().toInt(), checkValidation],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(
        `SELECT * FROM Participants WHERE eventId = ? ORDER BY createdAt DESC`,
        [id]
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

// =======================
// Public: Submit Response
// =======================
router.post(
  '/:id(\\d+)/responses',
  [param('id').isInt().toInt(), checkValidation],
  async (req, res, next) => {
    try {
      const eventId = +req.params.id;
      const { firstName, lastName, email, phone, homeNumber, street, apartment, city, state, zipcode, answers } = req.body;

      // 1️⃣ Create or find participant
      const [participantResult] = await pool.query(
        `INSERT INTO Participants 
          (firstName, lastName, email, phone, homeNumber, street, apartment, city, state, zipcode)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE participantId = LAST_INSERT_ID(participantId)`,
        [firstName, lastName, email, phone, homeNumber, street, apartment, city, state, zipcode]
      );

      const participantId = participantResult.insertId;

      // 2️⃣ Insert into Responses table
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      const [responseResult] = await pool.query(
        'INSERT INTO Responses (eventId, name, participantId) VALUES (?, ?, ?)',
        [eventId, fullName, participantId]
      );

      const responseId = responseResult.insertId;

      // 3️⃣ Insert answers (if using a separate Answers table)
      if (Array.isArray(answers) && answers.length > 0) {
        const answerRows = answers.map(a => [responseId, a.questionId, a.value]);
        await pool.query(
          'INSERT INTO Answers (responseId, questionId, answerValue) VALUES ?',
          [answerRows]
        );
      }

      res.json({ success: true, responseId });
    } catch (err) {
      next(err);
    }
  }
);

// =======================
// Admin: Get Responses
// =======================
router.get(
  '/:id(\\d+)/responses',
  [requireAdmin, param('id').isInt().toInt(), checkValidation],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const [rows] = await pool.query(
        'SELECT * FROM Responses WHERE eventId = ? ORDER BY createdAt DESC',
        [id]
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id(\\d+)',
  [param('id').isInt().toInt(), checkValidation],
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const v = String(req.query.admin || '').toLowerCase();
      const isAdmin = (v === '1' || v === 'true');

      let sql = `SELECT eventId, name, date, time, location, description, status, createdAt
                 FROM Events WHERE eventId = ?`;
      const params = [id];

      if (!isAdmin) {
        sql += ` AND status = 'published'`;
      }

      const [rows] = await pool.query(sql, params);
      if (!rows.length) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// =======================
// Update Event (admin)
// =======================
router.put(
  '/:id(\\d+)',
  [requireAdmin, param('id').isInt().toInt(), checkValidation],
  eventsCtrl.updateEvent
);

// =======================
// Delete Event (admin)
// =======================
router.delete(
  '/:id(\\d+)',
  [requireAdmin, param('id').isInt().toInt(), checkValidation],
  eventsCtrl.deleteEvent
);

module.exports = router;
