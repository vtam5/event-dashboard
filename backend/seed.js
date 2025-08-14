// seed.js
if (process.env.NODE_ENV === 'test') {
  console.log('👋  Skipping seeding in test environment');
  process.exit(0);
}

require('dotenv').config();
const pool = require('./db');

async function seed() {
  console.log('Seeding database…');

  // 1) Draft event (won’t show in non-admin list)
  let [r] = await pool.query(
    `INSERT INTO Events
      (name, date, time, location, description,
       isPublished, allowResponseEdit,
       capacityLimit, closeOn, emailConfirmation,
       sortOrder)
     VALUES
      (?, ?, ?, ?, ?,
       'draft', 0,
       NULL, NULL, 0,
       1)`,
    [
      'Draft Event',
      '2025-12-01',
      '12:00:00',
      'Draft Hall',
      'Only visible to admins'
    ]
  );
  console.log(`→ Created draft event ${r.insertId}`);

  // 2) Public event
  [r] = await pool.query(
    `INSERT INTO Events
      (name, date, time, location, description,
       isPublished, allowResponseEdit,
       capacityLimit, closeOn, emailConfirmation,
       sortOrder)
     VALUES
      (?, ?, ?, ?, ?,
       'public', 1,
       10, NULL, 0,
       2)`,
    [
      'Demo Event',
      '2025-12-05',
      '18:00:00',
      'Main Auditorium',
      'This is a seeded public event'
    ]
  );
  const publicEventId = r.insertId;
  console.log(`→ Created public event ${publicEventId}`);

  // 3) One sample question for the public event
  [r] = await pool.query(
    `INSERT INTO Questions
       (eventId, questionText, questionType, isRequired)
     VALUES (?, ?, ?, ?)`,
    [publicEventId, 'What’s your favorite color?', 'text', 0]
  );
  console.log(`→ Created question ${r.insertId} for event ${publicEventId}`);

  console.log('Seeding complete.');
  await pool.end();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
