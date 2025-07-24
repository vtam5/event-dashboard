// backend/routes/responses.js

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
    let sql = 'SELECT * FROM Responses';
    const params = [];
    if (eventId) { sql += ' WHERE eventId = ?'; params.push(eventId); }
    const [rows] = await db.query(sql + ' ORDER BY createdAt DESC', params);
    res.json(rows);
  }
);

// GET one
router.get(
  '/:id',
  param('id').isInt().withMessage('Response ID must be an integer'),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    const { id } = req.params;
    const [rows] = await db.query('SELECT * FROM Responses WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Response not found' });
    res.json(rows[0]);
  }
);

// POST create
router.post(
  '/',
  [
    body('eventId').isInt().withMessage('eventId must be an integer'),
    body('participantName').optional().isString(),
    body('participantEmail').optional().isEmail(),
    body('answers').custom(a => typeof a === 'object').withMessage('answers must be an object')
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    const { eventId, participantName, participantEmail, answers } = req.body;
    const answersJson = JSON.stringify(answers);
    const [result] = await db.query(
      `INSERT INTO Responses
         (eventId,participantName,participantEmail,answers)
       VALUES (?,?,?,?)`,
      [eventId, participantName||null, participantEmail||null, answersJson]
    );
    res.status(201).json({ id: result.insertId });
  }
);

// PUT update
router.put(
  '/:id',
  [
    param('id').isInt().withMessage('Response ID must be an integer'),
    body('participantName').optional().isString(),
    body('participantEmail').optional().isEmail(),
    body('answers').custom(a => typeof a === 'object').withMessage('answers must be an object')
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    const { id } = req.params;
    const { participantName, participantEmail, answers } = req.body;
    const answersJson = JSON.stringify(answers);
    const [result] = await db.query(
      `UPDATE Responses
         SET participantName=?, participantEmail=?, answers=?
       WHERE id=?`,
      [participantName||null, participantEmail||null, answersJson, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Response not found' });
    res.json({ message: 'Response updated' });
  }
);

// DELETE
router.delete(
  '/:id',
  param('id').isInt().withMessage('Response ID must be an integer'),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM Responses WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Response not found' });
    res.json({ message: 'Response deleted' });
  }
);

module.exports = router;
