// backend/server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');             // can stay here

const app = express();                  // ← app must be initialized before you use it
app.set('json spaces', 2);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ── Serve uploaded flyers statically at /uploads/<filename>
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../public/uploads'))
);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Event Dashboard API is running.');
});

// Health‑check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ database: 'OK' });
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(500).json({ database: 'ERROR' });
  }
});

// Mount event routes
const eventsRouter = require('./routes/events');
app.use('/api/events', eventsRouter);

// Mount Questions routes
const questionsRouter = require('./routes/questions');
app.use('/api/questions', questionsRouter);

// Mount Responses routes
const responsesRouter = require('./routes/responses');
app.use('/api/responses', responsesRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
