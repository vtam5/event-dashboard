// backend/routes/questions.js
const express = require('express');
const pool    = require('../db');
const { body, param, validationResult } = require('express-validator');

const router = express.Router({ mergeParams: true });

// GET /api/events/:eventId/questions
router.get(
  '/',
  [ param('eventId').isInt().withMessage('Invalid eventId') ],
  async (req, res, next) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM Questions WHERE eventId=? ORDER BY questionId',
        [req.params.eventId]
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/events/:eventId/questions
router.post(
  '/',
  [
    param('eventId').isInt(),
    body('questionText').trim().notEmpty(),
    body('questionType')
      .isIn(['text','textarea','checkbox','dropdown']),
    body('isRequired').optional().isBoolean()
  ],
  async (req, res, next) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    try {
      const { questionText, questionType, isRequired=false } = req.body;
      const [r] = await pool.execute(
        `INSERT INTO Questions
           (eventId,questionText,questionType,isRequired)
         VALUES (?,?,?,?)`,
        [req.params.eventId, questionText, questionType, isRequired]
      );
      res.status(201).json({ questionId: r.insertId });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/events/:eventId/questions/:questionId
router.put(
  '/:questionId',
  [
    param('eventId').isInt(),
    param('questionId').isInt(),
    body('questionText').trim().notEmpty(),
    body('questionType')
      .isIn(['text','textarea','checkbox','dropdown']),
    body('isRequired').optional().isBoolean()
  ],
  async (req, res, next) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    try {
      const { questionText, questionType, isRequired } = req.body;
      const [r] = await pool.execute(
        `UPDATE Questions
           SET questionText=?, questionType=?, isRequired=?
         WHERE questionId=? AND eventId=?`,
        [questionText, questionType, isRequired, req.params.questionId, req.params.eventId]
      );
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
      res.json({ updated: r.affectedRows });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/events/:eventId/questions/:questionId
router.delete(
  '/:questionId',
  [
    param('eventId').isInt(),
    param('questionId').isInt()
  ],
  async (req, res, next) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    try {
      const [r] = await pool.execute(
        `DELETE FROM Questions
         WHERE questionId=? AND eventId=?`,
        [req.params.questionId, req.params.eventId]
      );
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });
      res.json({ deleted: r.affectedRows });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
