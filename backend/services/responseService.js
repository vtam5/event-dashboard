/**
 * responseService.js
 * Transaction helpers for create/update flows.
 */
const crypto = require('crypto');

function newToken(len = 24) {
  // 48 hex chars; no extra deps
  return crypto.randomBytes(len).toString('hex');
}

async function findOrCreateParticipant(conn, participant) {
  const [result] = await conn.query(
    `INSERT INTO Participants
       (firstName, lastName, email, phone, homeNumber, street, apartment, city, state, zipcode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      participant.firstName,
      participant.lastName,
      participant.email,
      participant.phone,
      participant.homeNumber,
      participant.street,
      participant.apartment,
      participant.city,
      participant.state,
      participant.zipcode
    ]
  );
  return result.insertId;
}

async function insertResponse(conn, eventId, participantId) {
  const editToken = newToken();
  const [res] = await conn.query(
    'INSERT INTO Responses (eventId, participantId, editToken) VALUES (?, ?, ?)',
    [eventId, participantId, editToken]
  );
  return { submissionId: res.insertId, editToken };
}

async function batchInsertAnswers(conn, submissionId, answers) {
  if (!Array.isArray(answers) || !answers.length) return;
  const rows = answers.map(a => [submissionId, a.questionId, a.answerText]);
  await conn.query(
    'INSERT INTO Answers (responseId, questionId, answerText) VALUES ?',
    [rows]
  );
}

module.exports = { findOrCreateParticipant, insertResponse, batchInsertAnswers };
