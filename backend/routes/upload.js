// backend/routes/upload.js
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../db');

const router = express.Router({ mergeParams: true });

// Ensure uploads folder
const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `event-${req.params.eventId}-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

router.post('/', upload.single('flyer'), async (req, res, next) => {
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
});

module.exports = router;
