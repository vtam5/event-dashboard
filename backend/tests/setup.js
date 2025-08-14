const pool = require('../db');

module.exports = async () => {
  // Global setup if needed
};

module.exports.teardown = async () => {
  await pool.end();
  await new Promise(resolve => setTimeout(resolve, 500));
};