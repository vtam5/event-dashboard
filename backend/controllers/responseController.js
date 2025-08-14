/**
 * responseController.js
 * Read/delete/export handlers for Responses.
 */
const pool = require('../db');
const { Parser } = require('json2csv');

/**
 * Guard to check whether responses can be edited/deleted.
 */
async function assertEditsAllowed(eventId) {
  const [rows] = await pool.query(
    'SELECT allowResponseEdit FROM Events WHERE eventId = ?',
    [eventId]
  );
  if (!rows.length) {
    const err = new Error('Event not found');
    err.status = 404;
    throw err;
  }
  if (!rows[0].allowResponseEdit) {
    const err = new Error('Editing responses is disabled for this event');
    err.status = 403;
    throw err;
  }
}

// make the guard available to other modules:
exports.assertEditsAllowed = assertEditsAllowed;

/**
 * List all submissions for an event.
 */
exports.listResponses = async (req, res, next) => {
  try {
    const eventId = +req.params.eventId;

    // Fetch responses with participant details
    const [responses] = await pool.query(
      `SELECT r.submissionId,
              p.firstName,
              p.lastName,
              p.email,
              p.phone,
              r.createdAt
       FROM Responses r
       JOIN Participants p USING(participantId)
       WHERE r.eventId = ?
       ORDER BY r.createdAt DESC`,
      [eventId]
    );

    if (!responses.length) {
      return res.json([]);
    }

    // Get all answers for these responses
    const submissionIds = responses.map(r => r.submissionId);
    const [answers] = await pool.query(
      `SELECT a.submissionId, a.questionId, a.answerText
       FROM Answers a
       WHERE a.submissionId IN (?)`,
      [submissionIds]
    );

    // Attach answers to their respective response
    const enriched = responses.map(r => ({
      ...r,
      answers: answers.filter(a => a.submissionId === r.submissionId)
    }));

    res.json(enriched);
  } catch (err) {
    next(err);
  }
};

/**
 * Get a single submission.
 */
exports.getResponse = async (req, res, next) => {
  try {
    const eventId    = +req.params.eventId;
    const responseId = +req.params.responseId;

    const [[sub]] = await pool.query(
      `SELECT r.submissionId,
              r.createdAt,
              p.participantId,
              p.firstName,
              p.lastName,
              p.email,
              p.phone,
              p.homeNumber,
              p.street,
              p.apartment,
              p.city,
              p.state,
              p.zipcode
       FROM Responses r
       JOIN Participants p USING(participantId)
       WHERE r.eventId = ? AND r.submissionId = ?`,
      [eventId, responseId]
    );

    if (!sub) return res.status(404).json({ error: 'Not found' });

    const [ans] = await pool.query(
      `SELECT q.questionText, a.answerText
       FROM Answers a
       JOIN Questions q USING(questionId)
       WHERE a.submissionId = ?`,
      [responseId]
    );

    res.json({ ...sub, answers: ans });
  } catch (err) {
    next(err);
  }
};
/**
 * Delete a submission.
 */
exports.deleteResponse = async (req, res, next) => {
  try {
    const eventId    = +req.params.eventId;
    const responseId = +req.params.responseId;

    await assertEditsAllowed(eventId);

    const [r] = await pool.query(
      'DELETE FROM Responses WHERE submissionId = ? AND eventId = ?',
      [responseId, eventId]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Not found' });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * Export all responses for an event as CSV.
 */
exports.exportResponses = async (req, res, next) => {
  try {
    const eventId = +req.params.eventId;

    const [subs] = await pool.query(
      `SELECT r.submissionId, p.firstName, p.lastName,
              p.email, p.phone, p.address, r.createdAt
       FROM Responses r
       JOIN Participants p USING(participantId)
       WHERE r.eventId = ?`,
      [eventId]
    );

    const [ans] = await pool.query(
      `SELECT a.responseId, q.questionText, a.answerText
       FROM Answers a
       JOIN Questions q USING(questionId)
       WHERE a.responseId IN (?)`,
      [subs.map(s => s.submissionId)]
    );

    const questions = [...new Set(ans.map(a => a.questionText))];
    const data = subs.map(s => {
      const row = {
        submissionId: s.submissionId,
        firstName:    s.firstName,
        lastName:     s.lastName,
        email:        s.email,
        phone:        s.phone,
        address:      s.address,
        createdAt:    s.createdAt
      };
      questions.forEach(qt => {
        row[qt] = ans
          .filter(a => a.responseId === s.submissionId && a.questionText === qt)
          .map(a => a.answerText)
          .join('; ');
      });
      return row;
    });

    const csv = new Parser({ fields: Object.keys(data[0] || {}) }).parse(data);
    res
      .header('Content-Type', 'text/csv')
      .attachment(`event-${eventId}-responses.csv`)
      .send(csv);
  } catch (err) {
    next(err);
  }
};
