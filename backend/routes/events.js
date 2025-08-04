// backend/routes/events.js
const express = require('express');
const pool    = require('../db');
const multer  = require('multer');
const router  = express.Router();

// Multer setup (uploads folder)
const upload = multer({ dest: 'uploads/' });

// Simple admin-check (replace with real auth later)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'test123';
async function checkAdmin(req, res, next) {
  const [rows] = await pool.query(
    'SELECT 1 FROM Admins WHERE username=? AND password=?',
    [ADMIN_USERNAME, ADMIN_PASSWORD]
  );
  if (!rows.length) return res.status(403).json({ error: 'Not authorized' });
  next();
}

// GET /api/events?admin=1
router.get('/', async (req, res, next) => {
  try {
    const isAdmin = req.query.admin === '1';
    let sql = `
      SELECT e.eventId, e.name, e.date, e.time, e.location,
             e.description, e.flyerPath, e.isPublished,
             COUNT(r.submissionId) AS participantCount
      FROM Events e
      LEFT JOIN Responses r ON e.eventId=r.eventId
    `;
    if (!isAdmin) {
      sql += ` WHERE e.isPublished='public' `;
    }
    sql += ` GROUP BY e.eventId ORDER BY e.eventId DESC`;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/events
router.post('/', checkAdmin, async (req, res, next) => {
  try {
    const { name, date, time=null, location=null, description=null } = req.body;
    if (!name || !date) {
      return res.status(400).json({ error: 'Name and date required' });
    }
    const [r] = await pool.query(
      `INSERT INTO Events
         (name,date,time,location,description,flyerPath,isPublished,allowResponseEdit)
       VALUES (?, ?, ?, ?, ?, NULL, 'draft', 0)`,
      [name, date, time, location, description]
    );
    res.status(201).json({ eventId: r.insertId });
  } catch (err) {
    next(err);
  }
});

// PUT /api/events/:id
router.put('/:id', checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, date, time, location, description, isPublished, allowResponseEdit } = req.body;
    const valid = ['draft','private','public'];
    if (isPublished && !valid.includes(isPublished)) {
      return res.status(400).json({ error: 'Invalid state' });
    }
    await pool.query(
      `UPDATE Events
         SET name            = COALESCE(?,name),
             date            = COALESCE(?,date),
             time            = COALESCE(?,time),
             location        = COALESCE(?,location),
             description     = COALESCE(?,description),
             isPublished     = COALESCE(?,isPublished),
             allowResponseEdit = COALESCE(?,allowResponseEdit)
       WHERE eventId = ?`,
      [name,date,time,location,description,isPublished,allowResponseEdit,id]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/events/:id
router.delete('/:id', checkAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [r] = await pool.query('DELETE FROM Events WHERE eventId=?', [id]);
    if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
