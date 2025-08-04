// backend/seed.js
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // 1) Wipe all tables
    await conn.query('SET FOREIGN_KEY_CHECKS=0');
    for (let t of ['Answers','Questions','Responses','Participants','Admins','Events']) {
      await conn.query(`TRUNCATE TABLE \`${t}\``);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS=1');

    // 2) Seed Admin
    await conn.query(
      'INSERT INTO Admins (username,password) VALUES (?,?)',
      ['admin','test123']  // replace with bcrypt hash in production
    );

    // 3) Seed a Participant
    const [p] = await conn.query(
      'INSERT INTO Participants (firstName,lastName,email) VALUES (?,?,?)',
      ['Alice','Zhang','alice@example.com']
    );
    const participantId = p.insertId;

    // 4) Seed an Event
    const [e] = await conn.query(
      `INSERT INTO Events
         (name,date,time,location,description,isPublished,allowResponseEdit)
       VALUES (?,?,?,?,?,?,?)`,
      ['Demo Event','2025-08-15','14:00','Main Hall','Test event','public',1]
    );
    const eventId = e.insertId;

    // 5) Seed a Question
    const [q] = await conn.query(
      `INSERT INTO Questions
         (eventId,questionText,questionType,isRequired)
       VALUES (?,?,?,?)`,
      [eventId,'What is your favorite color?','text',1]
    );
    const questionId = q.insertId;

    // 6) Seed a Response
    const [r] = await conn.query(
      'INSERT INTO Responses (eventId,participantId) VALUES (?,?)',
      [eventId,participantId]
    );
    const responseId = r.insertId;

    // 7) Seed an Answer
    await conn.query(
      'INSERT INTO Answers (responseId,questionId,answerText) VALUES (?,?,?)',
      [responseId,questionId,'Blue']
    );

    console.log('✅ Seed complete');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await conn.end();
    process.exit();
  }
})();
