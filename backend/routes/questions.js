// backend/routes/questions.js

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const db = require('../db');
const router = express.Router();

// GET all (filter by eventId)
router.get(
  '/',
  query('eventId').optional().isInt().withMessage('eventId must be an integer'),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    const { eventId } = req.query;
    let sql = 'SELECT * FROM Questions';
    const params = [];
    if (eventId) { sql += ' WHERE eventId = ?'; params.push(eventId); }
    const [rows] = await db.query(sql + ' ORDER BY id', params);
    res.json(rows);
  }
);

// GET one
router.get(
  '/:id',
  param('id').isInt().withMessage('Question ID must be an integer'),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM Questions WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Question not found' });
    res.json(rows[0]);
  }
);

// POST create
router.post(
  '/',
  [
    body('eventId').isInt().withMessage('eventId must be an integer'),
    body('questionText').isString().notEmpty().withMessage('questionText is required'),
    body('fieldType')
      .isIn(['text','email','number','select','checkbox'])
      .withMessage('Invalid fieldType'),
    body('options').optional().isString(),
    body('isRequired').optional().isBoolean()
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    const { eventId, questionText, fieldType, options, isRequired } = req.body;
    const [result] = await db.query(
      `INSERT INTO Questions (eventId,questionText,fieldType,options,isRequired)
       VALUES (?,?,?,?,?)`,
      [eventId, questionText, fieldType, options||null, isRequired ?? true]
    );
    res.status(201).json({ id: result.insertId });
  }
);

// PUT update
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Question ID must be an integer'),
    body('questionText').optional().isString(),
    body('fieldType').optional().isIn(['text','email','number','select','checkbox']),
    body('options').optional().isString(),
    body('isRequired').optional().isBoolean()
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    const { id } = req.params;
    const { questionText, fieldType, options, isRequired } = req.body;
    const [result] = await db.query(
      `UPDATE Questions
         SET questionText=?, fieldType=?, options=?, isRequired=?
       WHERE id=?`,
      [questionText, fieldType, options||null, isRequired ?? true, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question updated' });
  }
);

// DELETE
router.delete(
  '/:id',
  param('id').isInt().withMessage('Question ID must be an integer'),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM Questions WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question deleted' });
  }
);

module.exports = router;
