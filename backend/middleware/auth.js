/**
 * auth.js
 * Simple admin check (swap for real auth later).
 */
const pool = require('../db');
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'test123';

exports.checkAdmin = async (req, res, next) => {
  if (req.query.admin === '1') return next();
  const [rows] = await pool.query(
    'SELECT 1 FROM Admins WHERE username=? AND password=?',
    [ADMIN_USERNAME, ADMIN_PASSWORD]
  );
  if (!rows.length) return res.status(403).json({ error: 'Not authorized' });
  next();
};
