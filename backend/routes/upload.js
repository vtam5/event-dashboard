// backend/routes/upload.js
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    const base = path
      .basename(file.originalname || 'file', ext)
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, `${Date.now()}_${base || 'file'}${ext}`);
  },
});

const upload = multer({ storage });

// Generic upload endpoint used by tests in `upload.success.test.js`.
// Tests expect { path }, so we include both { path, flyerPath } for compatibility.
router.post('/', upload.any(), (req, res) => {
  const f = (req.files || [])[0];
  if (!f) return res.status(400).json({ error: 'No file uploaded' });

  const rel = `uploads/${f.filename}`;
  res.json({ path: rel, flyerPath: rel });
});

module.exports = router;
