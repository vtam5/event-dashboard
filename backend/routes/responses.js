// backend/routes/responses.js
const express = require('express');
const pool    = require('../db');
const { body, param, validationResult } = require('express-validator');

const router = express.Router({ mergeParams: true });

// Helper to enforce allowResponseEdit
async function assertEditsAllowed(eventId) {
  // pull back the event row
  const [rows] = await pool.query(
    'SELECT allowResponseEdit FROM Events WHERE eventId = ?',
    [eventId]
  );

  // 1) If there’s no such event, throw 404
  if (rows.length === 0) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }

  // 2) If edits aren’t allowed, throw 403
  const { allowResponseEdit } = rows[0];
  if (!allowResponseEdit) {
    const err = new Error('Editing responses is disabled for this event');
    err.status = 403;
    throw err;
  }
}

// GET all submissions for an event
router.get('/', async (req, res, next) => {
  try {
    const eventId = Number(req.params.eventId);
    // 1) fetch submissions + participant info
    const [subs] = await pool.query(
      `SELECT r.submissionId, r.createdAt,
              p.participantId, p.firstName, p.lastName, p.email, p.phone, p.address
       FROM Responses r
       JOIN Participants p ON r.participantId = p.participantId
       WHERE r.eventId = ?
       ORDER BY r.createdAt DESC`,
      [eventId]
    );

    const submissionIds = subs.map(s => s.submissionId);
    const answers = submissionIds.length
      ? (await pool.query(
          `SELECT a.responseId, q.questionText, a.answerText
           FROM Answers a
           JOIN Questions q ON a.questionId = q.questionId
           WHERE a.responseId IN (?)`,
          [submissionIds]
        ))[0]
      : [];

    // group answers
    const byId = {};
    subs.forEach(s => {
      byId[s.submissionId] = { 
        submissionId: s.submissionId,
        createdAt:    s.createdAt,
        participant: {
          participantId: s.participantId,
          firstName:     s.firstName,
          lastName:      s.lastName,
          email:         s.email,
          phone:         s.phone,
          address:       s.address
        },
        answers: []
      };
    });
    answers.forEach(a => {
      byId[a.responseId].answers.push({
        questionText: a.questionText,
        answerText:   a.answerText
      });
    });

    res.json(Object.values(byId));
  } catch (err) {
    next(err);
  }
});

router.get(
  '/:responseId',
  [
    param('eventId').isInt(),
    param('responseId').isInt()
  ],
  async (req, res, next) => {
    try {
      const eventId    = Number(req.params.eventId);
      const responseId = Number(req.params.responseId);

      // 1) fetch submission + participant
      const [[sub]] = await pool.query(
        `SELECT r.submissionId, r.createdAt,
                p.participantId, p.firstName, p.lastName,
                p.email, p.phone, p.address
           FROM Responses r
           JOIN Participants p ON r.participantId = p.participantId
          WHERE r.submissionId = ? AND r.eventId = ?`,
        [responseId, eventId]
      );
      if (!sub) return res.status(404).json({ error: 'Not found' });

      // 2) fetch its answers
      const [ansRows] = await pool.query(
        `SELECT q.questionText, a.answerText
           FROM Answers a
           JOIN Questions q ON a.questionId = q.questionId
          WHERE a.responseId = ?`,
        [responseId]
      );

      // 3) assemble payload
      res.json({
        submissionId: sub.submissionId,
        createdAt:    sub.createdAt,
        participant: {
          participantId: sub.participantId,
          firstName:     sub.firstName,
          lastName:      sub.lastName,
          email:         sub.email,
          phone:         sub.phone,
          address:       sub.address
        },
        answers: ansRows.map(a => ({
          questionText: a.questionText,
          answerText:   a.answerText
        }))
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/events/:eventId/responses/:responseId
router.get('/:responseId', async (req, res, next) => {
  try {
    const eventId    = Number(req.params.eventId);
    const responseId = Number(req.params.responseId);

    // 1) fetch the submission + participant
    const [[row]] = await pool.query(
      `SELECT r.submissionId, r.createdAt,
              p.participantId, p.firstName, p.lastName, p.email, p.phone, p.address
       FROM Responses r
       JOIN Participants p ON r.participantId = p.participantId
       WHERE r.eventId = ? AND r.submissionId = ?`,
      [eventId, responseId]
    );
    if (!row) {
      return res.status(404).json({ error: 'Not found' });
    }

    // 2) fetch its answers
    const [answers] = await pool.query(
      `SELECT q.questionText, a.answerText
       FROM Answers a
       JOIN Questions q ON a.questionId = q.questionId
       WHERE a.responseId = ?`,
      [responseId]
    );

    // 3) assemble and return
    res.json({
      submissionId: row.submissionId,
      createdAt:    row.createdAt,
      participant: {
        participantId: row.participantId,
        firstName:     row.firstName,
        lastName:      row.lastName,
        email:         row.email,
        phone:         row.phone,
        address:       row.address
      },
      answers
    });
  } catch (err) {
    next(err);
  }
});

// POST a new submission
router.post(
  '/',
  [
    param('eventId').isInt(),
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('phone').optional().trim().notEmpty(),
    body('address').optional().trim().notEmpty(),
    body('answers').isArray({ min: 1 }),
    body('answers.*.questionId').isInt(),
    body('answers.*.answerText').notEmpty()
  ],
  async (req, res, next) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

    const eventId = Number(req.params.eventId);
    const { firstName, lastName, email, phone, address, answers } = req.body;
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1) find or create Participant
      let [[part]] = await conn.query(
        'SELECT participantId FROM Participants WHERE email = ? OR phone = ? LIMIT 1',
        [email||null, phone||null]
      );
      let participantId;
      if (part && part.participantId) {
        participantId = part.participantId;
        // optionally update their info here...
      } else {
        const [ins] = await conn.query(
          `INSERT INTO Participants
             (firstName,lastName,email,phone,address)
           VALUES (?,?,?,?,?)`,
          [firstName||null, lastName||null, email||null, phone||null, address||null]
        );
        participantId = ins.insertId;
      }

      // 2) insert into Responses
      const [r] = await conn.query(
        'INSERT INTO Responses (eventId,participantId) VALUES (?,?)',
        [eventId, participantId]
      );
      const submissionId = r.insertId;

      // 3) bulk insert Answers
      const rows = answers.map(a => [submissionId, a.questionId, a.answerText]);
      await conn.query(
        'INSERT INTO Answers (responseId,questionId,answerText) VALUES ?',
        [rows]
      );

      await conn.commit();
      res.status(201).json({ submissionId });
    } catch (err) {
      await conn.rollback();
      next(err);
    } finally {
      conn.release();
    }
  }
);

// PUT edit a submission
router.put('/:responseId', async (req, res, next) => {
  const eventId    = Number(req.params.eventId);
  const responseId = Number(req.params.responseId);
  const { answers } = req.body;  // expect [{ questionId, answerText }, ...]

  try {
    // 1) Check if event exists and edits allowed
    const [[event]] = await pool.query(
      'SELECT allowResponseEdit FROM Events WHERE eventId = ?',
      [eventId]
    );
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (!event.allowResponseEdit) {
      return res.status(403).json({ error: 'Editing responses is disabled for this event' });
    }

    // 2) Delete old answers
    await pool.query(
      'DELETE FROM Answers WHERE responseId = ?',
      [responseId]
    );

    // 3) Insert new answers (if any)
    if (Array.isArray(answers) && answers.length) {
      const rows = answers.map(a => [responseId, a.questionId, a.answerText]);
      await pool.query(
        'INSERT INTO Answers (responseId, questionId, answerText) VALUES ?',
        [rows]
      );
    }

    // 4) Return success
    res.json({ success: true });

  } catch (err) {
    next(err);
  }
});

router.delete(
  '/:responseId',
  async (req, res, next) => {
    try {
      const eventId    = Number(req.params.eventId);
      const responseId = Number(req.params.responseId);

      // 1) Ensure the event exists and allows edits
      const [[event]] = await pool.query(
        'SELECT allowResponseEdit FROM Events WHERE eventId = ?',
        [eventId]
      );
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      if (!event.allowResponseEdit) {
        return res.status(403).json({ error: 'Editing responses is disabled for this event' });
      }

      // 2) Delete the response (cascades Answers)
      const [result] = await pool.query(
        'DELETE FROM Responses WHERE submissionId = ? AND eventId = ?',
        [responseId, eventId]
      );
      console.log(`Deleted response ${responseId} for event ${eventId}, affected rows=${result.affectedRows}`);

      // 3) If nothing was deleted, it wasn’t found
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Not found' });
      }

      // 4) Success
      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
