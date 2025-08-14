/**
 * questionController.js
 * Handlers for Questions CRUD.
 */
const pool = require('../db');

// ---- Utilities -------------------------------------------------------------
function isPastNow(ev) {
  const now = new Date();
  const [y, m, d] = String(ev.date || '').split('-').map(Number);
  if (!y || !m || !d) return false;
  const baseDate = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (baseDate < today) return true;
  if (baseDate > today) return false;

  const parseTime = (t) => {
    if (!t) return null;
    const [hh, mm, ss] = String(t).split(':').map(Number);
    return (hh ?? 0) * 3600 + (mm ?? 0) * 60 + (ss || 0);
  };
  const endS = parseTime(ev.endTime);
  const startS = parseTime(ev.time);
  const nowS = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  if (endS != null) return nowS > endS;
  if (startS != null) return nowS > startS;
  return false;
}

/** Ensure event exists and is open (status model) */
async function checkEventOpen(eventId) {
  const [rows] = await pool.query(
    'SELECT status, closeOn, date, time, endTime FROM Events WHERE eventId = ?',
    [eventId]
  );
  if (!rows.length) { const err = new Error('Event not found'); err.status = 404; throw err; }
  const ev = rows[0];
  if (String(ev.status || '').toLowerCase() !== 'open') {
    const err = new Error('Event is not open'); err.status = 403; throw err;
  }
  if (ev.closeOn && new Date(ev.closeOn).getTime() <= Date.now()) {
    const err = new Error('Event submissions are closed'); err.status = 403; throw err;
  }
  if (isPastNow(ev)) { const err = new Error('Event has ended'); err.status = 403; throw err; }
}
exports.checkEventOpen = checkEventOpen;

// ---- Questions CRUD --------------------------------------------------------
exports.listQuestions = async (req, res, next) => {
  try {
    const eventId = +req.params.eventId;
    const [rows] = await pool.query(
      'SELECT * FROM Questions WHERE eventId = ? ORDER BY questionId',
      [eventId]
    );
    res.json(rows);
  } catch (err) { next(err); }
};

exports.createQuestion = async (req, res, next) => {
  try {
    const eventId = +req.params.eventId;
    const { questionText, questionType, isRequired = false } = req.body || {};
    if (!questionText || !questionType) {
      return res.status(400).json({ error: 'questionText and questionType are required' });
    }
    const [[exists]] = await pool.query('SELECT 1 FROM Events WHERE eventId = ?', [eventId]);
    if (!exists) return res.status(404).json({ error: 'Event not found' });

    const [result] = await pool.query(
      `INSERT INTO Questions (eventId, questionText, questionType, isRequired)
       VALUES (?, ?, ?, ?)`,
      [eventId, questionText, questionType, !!isRequired]
    );
    res.status(201).json({ questionId: result.insertId });
  } catch (err) { next(err); }
};

exports.updateQuestion = async (req, res, next) => {
  try {
    const eventId    = +req.params.eventId;
    const questionId = +req.params.questionId;
    const { questionText, questionType, isRequired } = req.body || {};

    const fields = [], values = [];
    if (questionText !== undefined) { fields.push('questionText = ?'); values.push(questionText); }
    if (questionType !== undefined) { fields.push('questionType = ?'); values.push(questionType); }
    if (isRequired   !== undefined) { fields.push('isRequired = ?');   values.push(!!isRequired); }

    if (!fields.length) return res.status(400).json({ error: 'No valid fields provided for update' });
    values.push(questionId, eventId);

    const [r] = await pool.query(
      `UPDATE Questions SET ${fields.join(', ')} WHERE questionId = ? AND eventId = ?`,
      values
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Question not found' });
    res.json({ updated: r.affectedRows });
  } catch (err) { next(err); }
};

exports.deleteQuestion = async (req, res, next) => {
  try {
    const eventId    = +req.params.eventId;
    const questionId = +req.params.questionId;
    const [r] = await pool.query(
      'DELETE FROM Questions WHERE questionId = ? AND eventId = ?',
      [questionId, eventId]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Question not found' });
    res.json({ deleted: r.affectedRows });
  } catch (err) { next(err); }
};

// Optional stub for legacy route
exports.listResponses = async (req, res, next) => {
  try {
    const eventId = +req.params.eventId;
    await checkEventOpen(eventId);
    return res.status(501).json({
      error: 'Not implemented in questionController. Use responseController.listResponses instead.'
    });
  } catch (err) { next(err); }
};
