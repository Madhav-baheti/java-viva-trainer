// src/routes/viva.js
const express = require('express');
const router = express.Router();
router.post('/', (req, res) => {
  res.status(501).json({ error: 'Viva route not implemented yet' });
});
module.exports = router;
