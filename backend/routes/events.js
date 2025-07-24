// backend/routes/events.js

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const upload = require('../middleware/upload');
const db = require('../db');
const fs = require('fs');
const path = require('path');

const router = express.Router();

/**
 * GET /api/events
 * Fetch all events, ordered by date descending
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Events ORDER BY date DESC');
    return res.json(rows);
  } catch (err) {
    console.error('Failed to fetch events:', err);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/:id
 * Fetch one event by ID
 */
router.get(
  '/:id',
  param('id').isInt().withMessage('Event ID must be an integer'),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

    const { id } = req.params;
    try {
      const [rows] = await db.query('SELECT * FROM Events WHERE id = ?', [id]);
      if (!rows.length) return res.status(404).json({ error: 'Event not found' });
      return res.json(rows[0]);
    } catch (err) {
      console.error('Failed to fetch event:', err);
      return res.status(500).json({ error: 'Failed to fetch event' });
    }
  }
);

/**
 * POST /api/events
 * Create a new event, with optional flyer upload
 */
router.post(
  '/',
  upload.single('flyer'),
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('date').isISO8601().withMessage('Date must be YYYY-MM-DD'),
    body('time').isString().notEmpty().withMessage('Time is required'),
    body('place').isString().notEmpty().withMessage('Place is required'),
    body('description').optional().isString(),
    body('isPublished').optional().isBoolean()
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

    const flyerPath = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.flyerPath || null;

    const { name, date, time, place, description, isPublished } = req.body;

    try {
      const [result] = await db.query(
        `INSERT INTO Events
           (name, date, time, place, description, flyerPath, isPublished)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, date, time, place, description || null, flyerPath, isPublished ?? true]
      );
      return res.status(201).json({ id: result.insertId });
    } catch (err) {
      console.error('Failed to create event:', err);
      return res.status(500).json({ error: 'Failed to create event' });
    }
  }
);

/**
 * PUT /api/events/:id
 * Update an existing event, optionally replacing its flyer
 */
router.put(
  '/:id',
  upload.single('flyer'),
  [
    param('id').isInt().withMessage('Event ID must be an integer'),
    body('name').optional().isString(),
    body('date').optional().isISO8601(),
    body('time').optional().isString(),
    body('place').optional().isString(),
    body('description').optional().isString(),
    body('isPublished').optional().isBoolean()
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

    const { id } = req.params;
    const flyerPath = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.flyerPath;

    const { name, date, time, place, description, isPublished } = req.body;

    try {
      const [result] = await db.query(
        `UPDATE Events
           SET name = ?, date = ?, time = ?, place = ?, description = ?, flyerPath = ?, isPublished = ?
         WHERE id = ?`,
        [name, date, time, place, description || null, flyerPath, isPublished ?? true, id]
      );
      if (result.affectedRows === 0)
        return res.status(404).json({ error: 'Event not found' });
      return res.json({ message: 'Event updated' });
    } catch (err) {
      console.error('Failed to update event:', err);
      return res.status(500).json({ error: 'Failed to update event' });
    }
  }
);

/**
 * DELETE /api/events/:id
 * Deletes the DB record AND removes the associated flyer file from disk
 */
router.delete(
  '/:id',
  param('id').isInt().withMessage('Event ID must be an integer'),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

    const { id } = req.params;
    let flyerPath;

    // 1) Look up flyerPath
    try {
      const [rows] = await db.query('SELECT flyerPath FROM Events WHERE id = ?', [id]);
      if (!rows.length) return res.status(404).json({ error: 'Event not found' });
      flyerPath = rows[0].flyerPath;
    } catch (err) {
      console.error('Error fetching flyerPath:', err);
      return res.status(500).json({ error: 'Failed to delete event' });
    }

    // 2) Delete file from disk if present
    if (flyerPath) {
      const relPath = flyerPath.replace(/^\//, '');               // e.g. "uploads/123.png"
      const fullPath = path.join(__dirname, '..', '..', 'public', relPath);
      fs.unlink(fullPath, err => {
        if (err && err.code !== 'ENOENT') {
          console.error('Failed to delete flyer file:', err);
        }
      });
    }

    // 3) Delete the DB record (cascades to questions & responses)
    try {
      const [result] = await db.query('DELETE FROM Events WHERE id = ?', [id]);
      return res.json({ message: 'Event deleted' });
    } catch (err) {
      console.error('Failed to delete event:', err);
      return res.status(500).json({ error: 'Failed to delete event' });
    }
  }
);

module.exports = router;
