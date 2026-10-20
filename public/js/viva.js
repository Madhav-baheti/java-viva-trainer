// public/js/viva.js
// Session controller for Viva quizzes – pure state machine, UI‑agnostic.
// Usage: const ctrl = createVivaController();
//       ctrl.onQuestion = fn; ctrl.startSession({source:'code',code:'...'});

import { post } from './api.js';
import { getWeakTopics, recordAnswer } from './store.js';

function createVivaController() {
  // callbacks (assign by UI)
  let onLoading = () => {};
  let onQuestion = () => {};
  let onResult = () => {};
  let onSummary = () => {};
  let onError = () => {};

  const state = {
    source: null,
    code: null,
    topic: null,
    asked: [],
    lastScore: null,
    questionCount: 0,
    maxQuestions: 5,
    perTopic: {},
    totalScore: 0,
  };

  async function fetchQuestion() {
    try {
      onLoading(true);
      const payload = {
        source: state.source,
        code: state.code,
        topic: state.topic,
        focusTopics: state.source === 'weak' && state.topic ? [state.topic] : undefined,
        asked: state.asked,
        lastScore: state.lastScore ?? undefined,
      };
      const data = await post('/api/viva/question', payload);
      state.asked.push(data.question);
      onQuestion(data);
    } catch (e) {
      onError(e);
    } finally {
      onLoading(false);
    }
  }

  async function evaluateAnswer(answer) {
    try {
      onLoading(true);
      const payload = {
        question: state.asked[state.asked.length - 1],
        answer,
        topic: state.topic,
        code: state.code,
      };
      const data = await post('/api/viva/evaluate', payload);
      // update stats
      state.lastScore = data.score;
      state.questionCount += 1;
      state.totalScore += data.score;
      // perTopic aggregation
      if (!state.perTopic[data.topic]) state.perTopic[data.topic] = [];
      state.perTopic[data.topic].push(data.score);
      recordAnswer(data.topic, data.score);
      onResult(data);
      if (state.questionCount >= state.maxQuestions) {
        onSummary({ totalScore: state.totalScore, perTopic: state.perTopic });
      } else {
        if (state.source === 'weak') {
          const weak = getWeakTopics();
          state.topic = weak[0];
        }
        await fetchQuestion();
      }
    } catch (e) {
      onError(e);
    } finally {
      onLoading(false);
    }
  }

  function startSession({ source, code = null, topic = null }) {
    // reset state
    state.source = source;
    state.code = code;
    state.topic = topic;
    state.asked = [];
    state.lastScore = null;
    state.questionCount = 0;
    state.perTopic = {};
    state.totalScore = 0;
    // if source is weak, pick first weak topic
    if (source === 'weak') {
      const weak = getWeakTopics();
      state.topic = weak[0];
    }
    fetchQuestion();
  }

  return {
    startSession,
    submitAnswer: evaluateAnswer,
    // expose callbacks for UI to set
    set onLoading(cb) { onLoading = cb; },
    get onLoading() { return onLoading; },
    set onQuestion(cb) { onQuestion = cb; },
    set onResult(cb) { onResult = cb; },
    set onSummary(cb) { onSummary = cb; },
    set onError(cb) { onError = cb; },
  };
}

export { createVivaController };