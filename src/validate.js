// src/validate.js
// Simple validation placeholder. In production, this will strip code fences, parse JSON, verify shape and retry.
module.exports = {
  validateResponse: (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  },
};
