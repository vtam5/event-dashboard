/**
 * uploadController.js
 * Handle flyer file uploads.
 */
const pool = require('../db');

exports.uploadFlyer = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const dbPath = `uploads/${req.file.filename}`;
    const [r] = await pool.query(
      'UPDATE Events SET flyerPath=? WHERE eventId=?',
      [dbPath, req.params.eventId]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'Event not found' });
    res.json({ flyerPath: dbPath });
  } catch (err) {
    next(err);
  }
};
