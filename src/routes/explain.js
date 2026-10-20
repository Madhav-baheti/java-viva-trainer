// src/routes/explain.js
const express = require('express');
const router = express.Router();
const { getValidJson } = require('../validate');
const { buildExplainPrompt } = require('../prompts');
const { normalizeTopic } = require('../topics');

// Helper to validate the shape of the Gemini response
function checkExplainShape(obj) {
  if (typeof obj.summary !== 'string') throw new Error('summary must be a string');
  if (!Array.isArray(obj.walkthrough)) throw new Error('walkthrough must be an array');
  if (!Array.isArray(obj.issues)) throw new Error('issues must be an array');
  obj.issues.forEach((i, idx) => {
    if (typeof i.severity !== 'string' || typeof i.message !== 'string') {
      throw new Error(`issues[${idx}] must have severity and message strings`);
    }
  });
  if (typeof obj.complexity !== 'object' || obj.complexity === null) throw new Error('complexity must be an object');
  const { time, space, reason } = obj.complexity;
  if (typeof time !== 'string') throw new Error('complexity.time must be a string');
  if (typeof space !== 'string') throw new Error('complexity.space must be a string');
  if (typeof reason !== 'string') throw new Error('complexity.reason must be a string');
  if (!Array.isArray(obj.topics)) throw new Error('topics must be an array');
  obj.topics.forEach(t => {
    if (typeof t !== 'string') throw new Error('topic entries must be strings');
  });
}

router.post('/', async (req, res) => {
  const { code } = req.body;
  const maxChars = parseInt(process.env.MAX_INPUT_CHARS) || 6000;
  if (typeof code !== 'string' || code.trim() === '' || code.length > maxChars) {
    return res.status(400).json({ error: 'code must be a non‑empty string under MAX_INPUT_CHARS' });
  }

  const { system, user } = buildExplainPrompt(code);
  try {
    const rawObj = await getValidJson({ system, user, check: checkExplainShape });
    // Normalize topics
    rawObj.topics = rawObj.topics.map(normalizeTopic);
    res.json(rawObj);
  } catch (err) {
    const status = err.status || 502;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
module.exports.checkExplainShape = checkExplainShape;
