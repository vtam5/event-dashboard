// backend/controllers/questionOptionsController.js
const pool = require('../db');

exports.createOption = async (req, res, next) => {
  try {
    const eventId = +req.params.eventId;
    const questionId = +req.params.questionId;
    const { label } = req.body;

    // Check that the question type supports options
    const [[question]] = await pool.query(
      'SELECT questionType FROM Questions WHERE questionId = ? AND eventId = ?',
      [questionId, eventId]
    );

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    if (!['multiple-choice', 'checkbox', 'dropdown'].includes(question.questionType)) {
      return res.status(400).json({ error: 'Options only allowed for multiple-choice/checkbox/dropdown questions' });
    }

    const [result] = await pool.query(
      'INSERT INTO QuestionOptions (questionId, label) VALUES (?, ?)',
      [questionId, label]
    );

    // ✅ Return { id: ... } to match test expectation
    res.status(201).json({ id: result.insertId, questionId });
  } catch (err) {
    next(err);
  }
};

exports.listOptions = async (req, res, next) => {
  try {
    const questionId = +req.params.questionId;
    const [rows] = await pool.query(
      'SELECT optionId AS id, questionId, label FROM QuestionOptions WHERE questionId = ? ORDER BY optionId',
      [questionId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.updateOption = async (req, res, next) => {
  try {
    const optionId = +req.params.optionId;
    const { label } = req.body;
    const [result] = await pool.query(
      'UPDATE QuestionOptions SET label = ? WHERE optionId = ?',
      [label, optionId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Option not found' });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

exports.deleteOption = async (req, res, next) => {
  try {
    const optionId = +req.params.optionId;
    const [result] = await pool.query(
      'DELETE FROM QuestionOptions WHERE optionId = ?',
      [optionId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Option not found' });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
