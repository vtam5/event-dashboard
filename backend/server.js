// backend/server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const eventsRouter    = require('./routes/events');
const questionsRouter = require('./routes/questions');
const responsesRouter = require('./routes/responses');
const uploadRouter    = require('./routes/upload'); // generic upload (/api/upload)
const eventUpload     = require('./middleware/upload'); // multer with eventId in name
const uploadCtrl      = require('./controllers/uploadController');

const app = express();

// Minimal CORS + body parsers (tests don't care about CORS, keep it simple)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// serve uploaded files for convenience (not required by tests)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ----- ROUTES -----
// Events CRUD/list/sort/reorder/csv
app.use('/api/events', eventsRouter);

// Nested Questions
app.use('/api/events/:eventId/questions', questionsRouter);

// Nested Responses (create/list/update/delete)
app.use('/api/events/:eventId/responses', responsesRouter);

// Event-specific flyer upload (expects form field "flyer" and returns { flyerPath })
app.post('/api/events/:eventId/upload', eventUpload.single('flyer'), uploadCtrl.uploadFlyer);

// Generic upload (tests expect { path })
app.use('/api/upload', uploadRouter);

// --- Global error handler ---
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;

// Export app for tests; only listen when not under test
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
