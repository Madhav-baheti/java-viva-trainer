// src/routes/viva.js
const express = require('express');
const router = express.Router();
const { getValidJson } = require('../validate');
const { buildQuestionPrompt, buildEvaluatePrompt } = require('../prompts');
const { normalizeTopic } = require('../topics');

/**
 * Shape check for /api/viva/question
 */
function checkQuestionShape(obj) {
  if (typeof obj.question !== 'string' || obj.question.trim() === '') {
    throw new Error('question must be a non-empty string');
  }
  if (typeof obj.topic !== 'string' || obj.topic.trim() === '') {
    throw new Error('topic must be a non-empty string');
  }
  if (typeof obj.difficulty !== 'string') {
    throw new Error('difficulty must be a string');
  }
}

/**
 * Shape check for /api/viva/evaluate
 */
function checkEvaluateShape(obj) {
  if (typeof obj.score !== 'number' || !Number.isInteger(obj.score) || obj.score < 0 || obj.score > 10) {
    throw new Error('score must be an integer between 0 and 10');
  }
  if (typeof obj.verdict !== 'string') {
    throw new Error('verdict must be a string');
  }
  if (typeof obj.modelAnswer !== 'string') {
    throw new Error('modelAnswer must be a string');
  }
  if (!Array.isArray(obj.missed)) {
    throw new Error('missed must be an array of strings');
  }
  obj.missed.forEach((m, idx) => {
    if (typeof m !== 'string') throw new Error(`missed[${idx}] must be a string`);
  });
  if (typeof obj.topic !== 'string') {
    throw new Error('topic must be a string');
  }
}

/**
 * POST /api/viva/question
 */
router.post('/question', async (req, res) => {
  const { source, code, topic, focusTopics, asked, lastScore } = req.body;
  const validSources = ['code', 'topic', 'weak'];
  if (!validSources.includes(source)) {
    return res.status(400).json({ error: 'source must be "code", "topic", or "weak"' });
  }

  if (source === 'code') {
    if (typeof code !== 'string' || code.trim() === '') {
      return res.status(400).json({ error: 'code must be a non-empty string' });
    }
  }

  const { system, user } = buildQuestionPrompt({ source, code, topic, focusTopics, asked, lastScore });

  try {
    const raw = await getValidJson({ system, user, check: checkQuestionShape });
    raw.topic = normalizeTopic(raw.topic);
    res.json(raw);
  } catch (err) {
    const status = err.status || 502;
    res.status(status).json({ error: err.message });
  }
});

/**
 * POST /api/viva/evaluate
 */
router.post('/evaluate', async (req, res) => {
  const { question, answer, topic, code } = req.body;
  if (typeof question !== 'string' || question.trim() === '') {
    return res.status(400).json({ error: 'question must be a non-empty string' });
  }
  if (typeof answer !== 'string' || answer.trim() === '') {
    return res.status(400).json({ error: 'answer must be a non-empty string' });
  }

  const { system, user } = buildEvaluatePrompt({ question, answer, topic, code });

  try {
    const raw = await getValidJson({ system, user, check: checkEvaluateShape });
    raw.topic = normalizeTopic(raw.topic);
    res.json(raw);
  } catch (err) {
    const status = err.status || 502;
    res.status(status).json({ error: err.message });
  }
});

module.exports = router;
module.exports.checkQuestionShape = checkQuestionShape;
module.exports.checkEvaluateShape = checkEvaluateShape;
