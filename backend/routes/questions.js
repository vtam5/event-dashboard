const express = require('express');
const { body, param } = require('express-validator');
const pool = require('../db');
const qc = require('../controllers/questionController');
const { checkValidation } = require('../middleware/validation');

const router = express.Router({ mergeParams: true });

// ---- Questions CRUD ----
router.get('/', qc.listQuestions);

router.post(
  '/',
  [
    body('questionText').isString().isLength({ min: 1 }),
    body('questionType').isString().isLength({ min: 1 }),
    checkValidation,
  ],
  qc.createQuestion
);

router.put(
  '/:questionId',
  [
    param('questionId').isInt().toInt(),
    body('questionText').optional().isString().isLength({ min: 1 }),
    body('questionType').optional().isString().isLength({ min: 1 }),
    checkValidation,
  ],
  qc.updateQuestion
);

router.delete(
  '/:questionId',
  [param('questionId').isInt().toInt(), checkValidation],
  qc.deleteQuestion
);

// ---- Options CRUD ----
const isTextType = (t) => {
  const s = String(t || '').trim().toLowerCase();
  return ['text','textarea','paragraph','shorttext','longtext','input'].includes(s);
};

const getQuestion = async (eventId, questionId) => {
  const [[q]] = await pool.query(
    'SELECT questionId, questionType FROM Questions WHERE eventId = ? AND questionId = ?',
    [eventId, questionId]
  );
  return q || null;
};

// List options
router.get(
  '/:questionId/options',
  [param('questionId').isInt().toInt(), checkValidation],
  async (req, res, next) => {
    try {
      const questionId = +req.params.questionId;
      const [rows] = await pool.query(
        'SELECT optionId as id, questionId, optionText FROM QuestionOptions WHERE questionId = ? ORDER BY optionId',
        [questionId]
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }
);

// Create option
router.post(
  '/:questionId/options',
  [
    param('questionId').isInt().toInt(),
    body('optionText').isString().isLength({ min: 1 }),
    checkValidation,
  ],
  async (req, res, next) => {
    try {
      const eventId = +req.params.eventId;
      const questionId = +req.params.questionId;
      const { optionText } = req.body;

      const q = await getQuestion(eventId, questionId);
      if (!q) return res.status(404).json({ error: 'question not found' });
      if (isTextType(q.questionType)) {
        return res.status(400).json({ 
          id: questionId,
          error: 'options not allowed for text-type questions' 
        });
      }

      const [result] = await pool.query(
        'INSERT INTO QuestionOptions (questionId, optionText) VALUES (?, ?)',
        [questionId, optionText]
      );

      const [[newOption]] = await pool.query(
        'SELECT optionId as id, questionId, optionText FROM QuestionOptions WHERE optionId = ?',
        [result.insertId]
      );

      res.status(201).json(newOption);
    } catch (err) {
      next(err);
    }
  }
);

// Update option
router.put(
  '/:questionId/options/:optionId',
  [
    param('questionId').isInt().toInt(),
    param('optionId').isInt().toInt(),
    body('optionText').optional().isString().isLength({ min: 1 }),
    checkValidation,
  ],
  async (req, res, next) => {
    try {
      const eventId = +req.params.eventId;
      const questionId = +req.params.questionId;
      const optionId = +req.params.optionId;

      const q = await getQuestion(eventId, questionId);
      if (!q) return res.status(404).json({ error: 'question not found' });
      if (isTextType(q.questionType)) {
        return res.status(400).json({ error: 'options not allowed for text-type questions' });
      }

      const { optionText = null } = req.body;
      const [r] = await pool.query(
        'UPDATE QuestionOptions SET optionText = COALESCE(?, optionText) WHERE optionId = ? AND questionId = ?',
        [optionText, optionId, questionId]
      );
      res.json({ updated: r.affectedRows });
    } catch (err) {
      next(err);
    }
  }
);

// Delete option
router.delete(
  '/:questionId/options/:optionId',
  [
    param('questionId').isInt().toInt(),
    param('optionId').isInt().toInt(),
    checkValidation,
  ],
  async (req, res, next) => {
    try {
      const questionId = +req.params.questionId;
      const optionId = +req.params.optionId;
      const [r] = await pool.query(
        'DELETE FROM QuestionOptions WHERE optionId = ? AND questionId = ?',
        [optionId, questionId]
      );
      res.json({ deleted: r.affectedRows });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;