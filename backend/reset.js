// reset.js
const pool = require('./db');

async function reset() {
  try {
    // disable FK checks so we can truncate in any order
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const tbl of [
      'Answers',
      'QuestionOptions',
      'Questions',
      'Responses',
      'Participants',
      'Events'
    ]) {
      await pool.query(`TRUNCATE TABLE \`${tbl}\``);
      console.log(`→ Truncated ${tbl}`);
    }
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Database reset complete');
  } catch (err) {
    console.error('❌ Reset failed:', err);
  } finally {
    await pool.end();
  }
}

reset();
