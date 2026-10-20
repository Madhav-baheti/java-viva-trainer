// src/routes/revision.js
const express = require('express');
const router = express.Router();
const { getValidJson } = require('../validate');
const { buildRevisionPrompt } = require('../prompts');
const { normalizeTopic } = require('../topics');

/**
 * Validate the shape of the revision response.
 */
function checkRevisionShape(obj) {
  if (!Array.isArray(obj.summary)) throw new Error('summary must be an array');
  if (obj.summary.length < 5 || obj.summary.length > 7) throw new Error('summary must contain 5-7 items');
  obj.summary.forEach((s, i) => {
    if (typeof s !== 'string') throw new Error(`summary[${i}] must be a string`);
  });
  if (!Array.isArray(obj.flashcards)) throw new Error('flashcards must be an array');
  if (obj.flashcards.length < 8 || obj.flashcards.length > 10) throw new Error('flashcards must contain 8-10 items');
  obj.flashcards.forEach((c, i) => {
    if (typeof c.q !== 'string' || typeof c.a !== 'string' || typeof c.topic !== 'string') {
      throw new Error(`flashcards[${i}] must have q, a, topic strings`);
    }
  });
}

router.post('/', async (req, res) => {
  const { notes } = req.body;
  const maxChars = parseInt(process.env.MAX_INPUT_CHARS) || 6000;
  if (typeof notes !== 'string' || notes.trim() === '' || notes.length > maxChars) {
    return res.status(400).json({ error: 'notes must be a non-empty string under MAX_INPUT_CHARS' });
  }

  const { system, user } = buildRevisionPrompt(notes);
  try {
    const raw = await getValidJson({ system, user, check: checkRevisionShape });
    // Normalize topics in flashcards
    raw.flashcards = raw.flashcards.map(fc => ({
      q: fc.q,
      a: fc.a,
      topic: normalizeTopic(fc.topic),
    }));
    res.json(raw);
  } catch (err) {
    const status = err.status || 502;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
