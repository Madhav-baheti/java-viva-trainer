// server.js
require('dotenv').config();

const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;
const RATE_LIMIT_PER_MIN = parseInt(process.env.RATE_LIMIT_PER_MIN) || 30;

// Middleware
app.use(express.json({ limit: '20kb' }));

// Rate limiter per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: RATE_LIMIT_PER_MIN,
  message: { error: 'Too many requests, try again later' },
});
app.use(limiter);

// Serve static files from public
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Import route modules (placeholders)
const explainRouter = require('./src/routes/explain');
const vivaRouter = require('./src/routes/viva');
const revisionRouter = require('./src/routes/revision');

app.use('/api/explain', explainRouter);
app.use('/api/viva', vivaRouter);
app.use('/api/revision', revisionRouter);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
