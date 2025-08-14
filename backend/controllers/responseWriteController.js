// backend/controllers/responseWriteController.js
const pool = require('../db');
const service = require('../services/responseService');
const emailService = require('../services/emailService');

exports.createResponse = async (req, res, next) => {
  const eventId = +req.params.eventId;
  const conn = await pool.getConnection();

  try {
    // 1) Load event (include emailConfirmation since we use it)
    const [[event]] = await conn.query(
      `SELECT status, closeOn, capacityLimit, emailConfirmation
             , (SELECT COUNT(*) FROM Responses WHERE eventId = ?) AS responseCount
         FROM Events
        WHERE eventId = ?`,
      [eventId, eventId]
    );
    if (!event) return res.status(404).json({ error: 'event not found' });

    // (Optional) You can rely on router middleware for open/capacity checks.
    // Keeping this block lightweight is fine.

    // 2) Normalize fields
    const body = req.body || {};
    const p = body.participant || {};
    const participant = {
      firstName:   (p.firstName || '').trim(),
      lastName:    (p.lastName  || '').trim(),
      email:       (p.email     || '').trim(),
      phone:       (p.phone     || '').trim(),
      homeNumber:  (p.homeNumber|| '').trim(),
      street:      (p.street    || '').trim(),
      apartment:   (p.apartment || '').trim(),
      city:        (p.city      || '').trim(),
      state:       (p.state     || '').trim(),
      zipcode:     (p.zipcode   || '').trim(),
    };

    if (!participant.firstName || !participant.lastName || !participant.email ||
        !participant.phone || !participant.homeNumber || !participant.street ||
        !participant.city || !participant.state || !participant.zipcode) {
      return res.status(400).json({ error: 'Missing required participant fields' });
    }

    const answers = Array.isArray(body.answers) ? body.answers : [];

    // 3) Persist
    await conn.beginTransaction();
    const participantId = await service.findOrCreateParticipant(conn, participant);

    // ⬇️ destructure the object (includes token)
    const { submissionId, editToken } = await service.insertResponse(conn, eventId, participantId);

    await service.batchInsertAnswers(conn, submissionId, answers);
    await conn.commit();

    // 4) Optional email
    if (event.emailConfirmation && participant.email) {
      emailService
        .sendResponseEmail(participant.email, { eventId, submissionId })
        .catch(err => console.error('Email send failed:', err.message));
    }

    // ⬇️ return token to client
    return res.status(201).json({ submissionId, editToken });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    next(err);
  } finally {
    conn.release();
  }
};
