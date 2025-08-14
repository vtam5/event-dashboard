// backend/routes/responses.js
const express = require('express');
const pool = require('../db');
const write = require('../controllers/responseWriteController');
const { checkAdmin } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// ---- Helpers ---------------------------------------------------------------
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

function isAdmin(req) {
  return req.query.admin === true || req.query.admin === 1 || req.query.admin === '1';
}

function getToken(req) {
  return (
    req.headers['x-edit-token'] ||
    req.query.token ||
    (req.body && req.body.token) ||
    ''
  );
}

// ---- Middleware ------------------------------------------------------------
// For creating new responses (enforces capacity)
const ensureEventOpen = async (req, res, next) => {
  try {
    const eventId = +req.params.eventId;
    const [[ev]] = await pool.query(
      `SELECT status, closeOn, capacityLimit, date, time, endTime
         FROM Events
        WHERE eventId = ?`,
      [eventId]
    );
    if (!ev) return res.status(404).json({ error: 'event not found' });

    if (String(ev.status || '').toLowerCase() !== 'open') {
      return res.status(403).json({ error: 'Event is not accepting responses' });
    }
    if (ev.closeOn && new Date(ev.closeOn).getTime() <= Date.now()) {
      return res.status(403).json({ error: 'Form closed' });
    }
    if (isPastNow(ev)) {
      return res.status(403).json({ error: 'Event has ended' });
    }
    if (ev.capacityLimit != null) {
      const [[cnt]] = await pool.query(
        'SELECT COUNT(*) AS c FROM Responses WHERE eventId = ?',
        [eventId]
      );
      if ((cnt.c || 0) >= Number(ev.capacityLimit)) {
        return res.status(403).json({ error: 'Capacity reached' });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

// For editing existing responses (NO capacity check)
const ensureEventEditable = async (req, res, next) => {
  try {
    const eventId = +req.params.eventId;
    const [[ev]] = await pool.query(
      `SELECT status, closeOn, date, time, endTime, allowResponseEdit
         FROM Events
        WHERE eventId = ?`,
      [eventId]
    );
    if (!ev) return res.status(404).json({ error: 'event not found' });

    // If you want edits allowed only while open, keep these checks.
    // If you want edits even when closed/past, remove them.
    if (String(ev.status || '').toLowerCase() !== 'open') {
      return res.status(403).json({ error: 'Event is not accepting edits' });
    }
    if (ev.closeOn && new Date(ev.closeOn).getTime() <= Date.now()) {
      return res.status(403).json({ error: 'Form closed' });
    }
    if (isPastNow(ev)) {
      return res.status(403).json({ error: 'Event has ended' });
    }

    if (!ev.allowResponseEdit) {
      return res.status(403).json({ error: 'editing responses disabled' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

// ---- Routes ----------------------------------------------------------------

// Create (returns { submissionId, editToken })
router.post('/', ensureEventOpen, (req, res, next) => {
  // Preserve legacy keys if your frontend expects id/responseId
  const orig = res.json.bind(res);
  res.json = (body) => {
    if (body && body.submissionId) {
      body.id ??= body.submissionId;
      body.responseId ??= body.submissionId;
    }
    return orig(body);
  };
  return write.createResponse(req, res, next);
});

// Get one response (ADMIN)
router.get('/:responseId', checkAdmin, async (req, res, next) => {
  try {
    const eventId = +req.params.eventId;
    const responseId = +req.params.responseId;

    const [responseRows] = await pool.query(
      `SELECT r.*, p.firstName, p.lastName, p.email, p.phone
         FROM Responses r
         LEFT JOIN Participants p ON r.participantId = p.participantId
        WHERE r.eventId = ? AND r.submissionId = ?`,
      [eventId, responseId]
    );
    if (!responseRows.length) {
      return res.status(404).json({ error: 'Response not found' });
    }

    const [answers] = await pool.query(
      `SELECT a.*, q.questionText, q.questionType
         FROM Answers a
         LEFT JOIN Questions q ON a.questionId = q.questionId
        WHERE a.responseId = ?`,
      [responseId]
    );

    res.json({ ...responseRows[0], answers });
  } catch (err) {
    next(err);
  }
});

// Update (ADMIN or token) + editable (no capacity check)
router.put('/:responseId', ensureEventEditable, async (req, res, next) => {
  const eventId = +req.params.eventId;
  const submissionId = +req.params.responseId;

  try {
    if (!Number.isInteger(submissionId)) {
      return res.status(400).json({ error: 'invalid response id' });
    }

    // Admin OR valid edit token
    if (!isAdmin(req)) {
      const token = getToken(req);
      const [[ok]] = await pool.query(
        'SELECT 1 FROM Responses WHERE submissionId = ? AND eventId = ? AND editToken = ?',
        [submissionId, eventId, token]
      );
      if (!ok) return res.status(403).json({ error: 'invalid or missing edit token' });
    } else {
      const [[exists]] = await pool.query(
        'SELECT 1 FROM Responses WHERE submissionId = ? AND eventId = ?',
        [submissionId, eventId]
      );
      if (!exists) return res.status(404).json({ error: 'response not found for this event' });
    }

    const { answers } = req.body || {};
    if (!Array.isArray(answers)) {
      return res.json({ success: true });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query('DELETE FROM Answers WHERE responseId = ?', [submissionId]);

      const rows = answers
        .filter(a => a && a.questionId)
        .map(a => [submissionId, a.questionId, a.answerText ?? null]);

      if (rows.length) {
        await conn.query(
          'INSERT INTO Answers (responseId, questionId, answerText) VALUES ?',
          [rows]
        );
      }

      await conn.commit();
      res.json({ success: true });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
});

// Delete (ADMIN or token)
router.delete('/:responseId', async (req, res, next) => {
  const eventId = +req.params.eventId;
  const submissionId = +req.params.responseId;

  try {
    if (!Number.isInteger(submissionId)) {
      return res.status(400).json({ error: 'invalid response id' });
    }

    // Admin OR valid edit token
    if (!isAdmin(req)) {
      const token = getToken(req);
      const [[ok]] = await pool.query(
        'SELECT 1 FROM Responses WHERE submissionId = ? AND eventId = ? AND editToken = ?',
        [submissionId, eventId, token]
      );
      if (!ok) return res.status(403).json({ error: 'invalid or missing edit token' });
    } else {
      const [[exists]] = await pool.query(
        'SELECT 1 FROM Responses WHERE submissionId = ? AND eventId = ?',
        [submissionId, eventId]
      );
      if (!exists) return res.status(404).json({ error: 'response not found for this event' });
    }

    // Optional: transaction for atomic delete across two tables
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM Answers WHERE responseId = ?', [submissionId]);
      const [r] = await conn.query(
        'DELETE FROM Responses WHERE submissionId = ? AND eventId = ?',
        [submissionId, eventId]
      );
      await conn.commit();
      res.json({ success: r.affectedRows > 0 });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
