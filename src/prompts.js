// src/prompts.js
// Placeholder for prompt builders per mode
module.exports = {
  explainPrompt: (code) => {
    return { system: "Explain mode", user: code };
  },
  vivaQuestionPrompt: (params) => {
    return { system: "Viva question", user: JSON.stringify(params) };
  },
  vivaEvalPrompt: (qa) => {
    return { system: "Viva evaluate", user: JSON.stringify(qa) };
  },
  revisionPrompt: (notes) => {
    return { system: "Revision", user: notes };
  },
};
