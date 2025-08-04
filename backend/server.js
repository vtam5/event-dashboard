// backend/server.js
require('dotenv').config();
const express = require('express');
const morgan  = require('morgan');
const fs      = require('fs');
const path    = require('path');

// 1) Import routers
const eventsRouter    = require('./routes/events');
const questionsRouter = require('./routes/questions');
const responsesRouter = require('./routes/responses');
const uploadRouter    = require('./routes/upload');  // flyer upload

// 2) Debug: log their types
console.log('eventsRouter:',    typeof eventsRouter);
console.log('questionsRouter:', typeof questionsRouter);
console.log('responsesRouter:', typeof responsesRouter);
console.log('uploadRouter:',    typeof uploadRouter);

const app = express();

// ensure uploads dir
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// middleware
app.use(express.json());
app.use(morgan('combined'));
app.use('/uploads', express.static(UPLOAD_DIR));

// mount your routers
app.use('/api/events',                    eventsRouter);
app.use('/api/events/:eventId/questions', questionsRouter);
app.use('/api/events/:eventId/responses', responsesRouter);

// COMMENT THIS OUT until we confirm uploadRouter is valid
// app.use('/api/events/:eventId/flyer',     uploadRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 404 & error handlers...
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status||500).json({ error: err.message });
});

app.listen(process.env.PORT||3000, ()=>
  console.log('🚀 listening on port', process.env.PORT||3000)
);
