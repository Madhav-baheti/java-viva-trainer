// public/js/app.js
// Main entry point for VivaPilot frontend.
// Wires the DOM elements to the feature controllers and handles UI state.

import { explainCode, startQuizFromExplain } from './explain.js';
import { createVivaController } from './viva.js';
import { getRankedTopics, drillWeakTopics } from './weak.js';
import { reset as resetStore } from './store.js';
import { revisionPack } from './revision.js';

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // GLOBAL: TOAST NOTIFICATIONS
  // =========================================================================
  const toastEl = document.getElementById('toast');
  const toastTextEl = document.getElementById('toast-text');
  const toastCloseBtn = document.getElementById('toast-close');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl || !toastTextEl) return;
    toastTextEl.textContent = message;
    toastEl.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 4500);
  }

  if (toastCloseBtn) {
    toastCloseBtn.addEventListener('click', () => {
      if (toastEl) toastEl.hidden = true;
    });
  }

  // =========================================================================
  // GLOBAL: TAB SWITCHING
  // =========================================================================
  const tabButtons = document.querySelectorAll('button.tab[data-tab]');
  const panels = document.querySelectorAll('section.panel[data-panel]');

  function switchTab(targetName) {
    tabButtons.forEach((btn) => {
      const isActive = btn.getAttribute('data-tab') === targetName;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    panels.forEach((panel) => {
      const matches = panel.getAttribute('data-panel') === targetName;
      panel.classList.toggle('is-active', matches);
      panel.hidden = !matches;
    });

    if (targetName === 'weak') {
      renderWeakTopics();
    }
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  const tileToViva = document.getElementById('tile-to-viva');
  if (tileToViva) {
    tileToViva.addEventListener('click', () => {
      switchTab('viva');
    });
  }

  const tileToExplain = document.getElementById('tile-to-explain');
  if (tileToExplain) {
    tileToExplain.addEventListener('click', () => {
      document.getElementById('explain-code')?.focus();
      document.getElementById('explain-code')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  document.getElementById('btn-notif')?.addEventListener('click', () => {
    showToast('Notifications: You are on track with your Java viva preparation!');
  });

  document.getElementById('btn-avatar')?.addEventListener('click', () => {
    showToast('VivaPilot Student Mode active.');
  });

  // =========================================================================
  // TAB 1: EXPLAIN CODE
  // =========================================================================
  const explainCodeEl = document.getElementById('explain-code');
  const explainCountEl = document.getElementById('explain-count');
  const explainBtn = document.getElementById('explain-btn');
  const explainLoadingEl = document.getElementById('explain-loading');
  const explainErrorEl = document.getElementById('explain-error');
  const explainResultEl = document.getElementById('explain-result');

  const explainSummaryEl = document.getElementById('explain-summary');
  const explainWalkthroughEl = document.getElementById('explain-walkthrough');
  const explainIssuesEl = document.getElementById('explain-issues');
  const explainNoIssuesEl = document.getElementById('explain-no-issues');
  const explainTimeEl = document.getElementById('explain-time');
  const explainSpaceEl = document.getElementById('explain-space');
  const explainReasonEl = document.getElementById('explain-complexity-reason');
  const explainTopicsEl = document.getElementById('explain-topics');
  const explainQuizBtn = document.getElementById('explain-quiz-btn');

  // Character counter
  if (explainCodeEl && explainCountEl) {
    explainCodeEl.addEventListener('input', () => {
      explainCountEl.textContent = `${explainCodeEl.value.length} chars`;
    });
  }

  // Explain action
  if (explainBtn) {
    explainBtn.addEventListener('click', async () => {
      const code = explainCodeEl.value.trim();
      explainErrorEl.hidden = true;
      explainErrorEl.textContent = '';

      if (!code) {
        explainErrorEl.textContent = 'Please paste some Java code first.';
        explainErrorEl.hidden = false;
        return;
      }

      explainLoadingEl.hidden = false;
      explainResultEl.hidden = true;
      explainBtn.disabled = true;

      try {
        const data = await explainCode(code);

        // Populate summary
        explainSummaryEl.textContent = data.summary || '';

        // Populate walkthrough
        explainWalkthroughEl.innerHTML = '';
        if (Array.isArray(data.walkthrough)) {
          data.walkthrough.forEach((step) => {
            const li = document.createElement('li');
            li.textContent = step;
            explainWalkthroughEl.appendChild(li);
          });
        }

        // Populate issues
        explainIssuesEl.innerHTML = '';
        const issues = Array.isArray(data.issues) ? data.issues : [];
        if (issues.length === 0) {
          explainNoIssuesEl.hidden = false;
        } else {
          explainNoIssuesEl.hidden = true;
          issues.forEach((issue) => {
            const li = document.createElement('li');
            const prefix = issue.severity ? `[${issue.severity.toUpperCase()}] ` : '';
            li.textContent = `${prefix}${issue.message || ''}`;
            explainIssuesEl.appendChild(li);
          });
        }

        // Complexity
        explainTimeEl.textContent = data.complexity?.time || '-';
        explainSpaceEl.textContent = data.complexity?.space || '-';
        explainReasonEl.textContent = data.complexity?.reason || '';

        // Topics chips
        explainTopicsEl.innerHTML = '';
        if (Array.isArray(data.topics)) {
          data.topics.forEach((t) => {
            const chip = document.createElement('span');
            chip.className = 'chip';
            chip.textContent = t;
            explainTopicsEl.appendChild(chip);
          });
        }

        explainResultEl.hidden = false;
      } catch (err) {
        explainErrorEl.textContent = err.message || 'Failed to explain code';
        explainErrorEl.hidden = false;
        showToast(err.message || 'Explain request failed');
      } finally {
        explainLoadingEl.hidden = true;
        explainBtn.disabled = false;
      }
    });
  }

  // "Quiz me on this code"
  if (explainQuizBtn) {
    explainQuizBtn.addEventListener('click', () => {
      const code = explainCodeEl.value.trim();
      if (!code) {
        showToast('No code available to quiz on.');
        return;
      }
      switchTab('viva');
      startQuizFromExplain(code, vivaController);
    });
  }

  // =========================================================================
  // TAB 2: VIVA PRACTICE
  // =========================================================================
  const vivaController = createVivaController();

  const vivaLoadingEl = document.getElementById('viva-loading');
  const vivaLoadingTextEl = document.getElementById('viva-loading-text');
  const vivaErrorEl = document.getElementById('viva-error');

  // Views inside Viva panel
  const vivaSetupView = document.getElementById('viva-setup-view');
  const vivaQuestionView = document.getElementById('viva-question-view');
  const vivaResultView = document.getElementById('viva-result-view');
  const vivaSummaryView = document.getElementById('viva-summary-view');

  // Setup view elements
  const sourceRadios = document.querySelectorAll('input[name="viva-source"]');
  const onlyCodeEl = document.querySelector('.only-code');
  const onlyTopicEl = document.querySelector('.only-topic');
  const onlyWeakEl = document.querySelector('.only-weak');
  const vivaCodeInput = document.getElementById('viva-code');
  const vivaTopicSelect = document.getElementById('viva-topic');
  const vivaStartBtn = document.getElementById('viva-start-btn');

  // Question view elements
  const vivaProgressText = document.getElementById('viva-progress-text');
  const vivaTopicTag = document.getElementById('viva-topic-tag');
  const vivaProgressBar = document.getElementById('viva-progress-bar');
  const vivaQuestionText = document.getElementById('viva-question-text');
  const vivaAnswerInput = document.getElementById('viva-answer');
  const vivaSubmitBtn = document.getElementById('viva-submit-btn');

  // Result view elements
  const vivaScoreEl = document.getElementById('viva-score');
  const vivaScoreNum = document.getElementById('viva-score-num');
  const vivaVerdict = document.getElementById('viva-verdict');
  const vivaModelAnswer = document.getElementById('viva-model-answer');
  const vivaMissedCard = document.getElementById('viva-missed-card');
  const vivaMissedList = document.getElementById('viva-missed');
  const vivaNextBtn = document.getElementById('viva-next-btn');

  // Summary view elements
  const vivaTotalScoreEl = document.getElementById('viva-total-score');
  const vivaTotalNum = document.getElementById('viva-total-num');
  const vivaSummaryText = document.getElementById('viva-summary-text');
  const vivaTopicBreakdown = document.getElementById('viva-topic-breakdown');
  const vivaWeakBtn = document.getElementById('viva-weak-btn');
  const vivaRestartBtn = document.getElementById('viva-restart-btn');

  // UI state for Viva navigation
  let pendingNextQuestion = null;
  let pendingSessionSummary = null;
  let currentQuestionIndex = 0;

  function showVivaView(viewName) {
    if (vivaSetupView) vivaSetupView.hidden = viewName !== 'setup';
    if (vivaQuestionView) vivaQuestionView.hidden = viewName !== 'question';
    if (vivaResultView) vivaResultView.hidden = viewName !== 'result';
    if (vivaSummaryView) vivaSummaryView.hidden = viewName !== 'summary';
  }

  // Radio button switching for viva source
  sourceRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      const val = radio.value;
      if (onlyCodeEl) onlyCodeEl.hidden = val !== 'code';
      if (onlyTopicEl) onlyTopicEl.hidden = val !== 'topic';
      if (onlyWeakEl) onlyWeakEl.hidden = val !== 'weak';
    });
  });

  // Start Viva session button
  if (vivaStartBtn) {
    vivaStartBtn.addEventListener('click', () => {
      const selectedSource = document.querySelector('input[name="viva-source"]:checked')?.value || 'code';
      vivaErrorEl.hidden = true;
      vivaErrorEl.textContent = '';

      let code = null;
      let topic = null;

      if (selectedSource === 'code') {
        code = vivaCodeInput.value.trim();
        if (!code) {
          vivaErrorEl.textContent = 'Please paste your Java code first.';
          vivaErrorEl.hidden = false;
          return;
        }
      } else if (selectedSource === 'topic') {
        topic = vivaTopicSelect.value;
      }

      currentQuestionIndex = 0;
      pendingNextQuestion = null;
      pendingSessionSummary = null;

      vivaController.startSession({ source: selectedSource, code, topic });
    });
  }

  // Controller callback: onLoading
  vivaController.onLoading = (loading) => {
    if (vivaLoadingEl) {
      vivaLoadingEl.hidden = !loading;
      if (vivaLoadingTextEl) {
        vivaLoadingTextEl.textContent = currentQuestionIndex === 0 ? 'Generating question...' : 'Evaluating your answer...';
      }
    }
    if (vivaSubmitBtn) vivaSubmitBtn.disabled = loading;
    if (vivaStartBtn) vivaStartBtn.disabled = loading;
    if (vivaNextBtn) vivaNextBtn.disabled = loading;
  };

  // Controller callback: onQuestion
  vivaController.onQuestion = (data) => {
    // If the user is currently looking at the result card of a previous question,
    // buffer the next question until they click "Next question".
    if (!vivaResultView.hidden) {
      pendingNextQuestion = data;
      return;
    }

    displayQuestion(data);
  };

  function displayQuestion(data) {
    currentQuestionIndex++;
    if (vivaProgressText) vivaProgressText.textContent = `Question ${currentQuestionIndex} of 5`;
    if (vivaTopicTag) vivaTopicTag.textContent = data.topic || 'General';
    if (vivaProgressBar) {
      const pct = (currentQuestionIndex / 5) * 100;
      vivaProgressBar.style.width = `${pct}%`;
    }
    if (vivaQuestionText) vivaQuestionText.textContent = data.question || '';
    if (vivaAnswerInput) vivaAnswerInput.value = '';

    showVivaView('question');
  }

  // Submit Answer button
  if (vivaSubmitBtn) {
    vivaSubmitBtn.addEventListener('click', () => {
      const answer = vivaAnswerInput.value.trim();
      vivaErrorEl.hidden = true;
      vivaErrorEl.textContent = '';

      if (!answer) {
        vivaErrorEl.textContent = 'Please type your answer before submitting.';
        vivaErrorEl.hidden = false;
        return;
      }

      vivaController.submitAnswer(answer);
    });
  }

  // Controller callback: onResult
  vivaController.onResult = (result) => {
    const score = typeof result.score === 'number' ? result.score : 0;
    if (vivaScoreNum) vivaScoreNum.textContent = String(score);

    // Color level for the score ring
    let level = 'mid';
    if (score < 6) level = 'weak';
    else if (score >= 8) level = 'good';
    if (vivaScoreEl) vivaScoreEl.setAttribute('data-level', level);

    if (vivaVerdict) vivaVerdict.textContent = result.verdict || '';
    if (vivaModelAnswer) vivaModelAnswer.textContent = result.modelAnswer || '';

    // Missed items
    if (vivaMissedList) vivaMissedList.innerHTML = '';
    const missed = Array.isArray(result.missed) ? result.missed : [];
    if (vivaMissedCard) {
      if (missed.length === 0) {
        vivaMissedCard.hidden = true;
      } else {
        vivaMissedCard.hidden = false;
        missed.forEach((item) => {
          const li = document.createElement('li');
          li.textContent = item;
          vivaMissedList.appendChild(li);
        });
      }
    }

    showVivaView('result');
    renderWeakTopics();
  };

  // Controller callback: onSummary
  vivaController.onSummary = (summary) => {
    pendingSessionSummary = summary;
  };

  // Controller callback: onError
  vivaController.onError = (err) => {
    if (vivaErrorEl) {
      vivaErrorEl.textContent = err.message || 'Something went wrong';
      vivaErrorEl.hidden = false;
    }
    showToast(err.message || 'Viva error');
  };

  // Next question button in Result View
  if (vivaNextBtn) {
    vivaNextBtn.addEventListener('click', () => {
      // If we've finished all 5 questions, show the summary
      if (pendingSessionSummary) {
        displaySummary(pendingSessionSummary);
        pendingSessionSummary = null;
        pendingNextQuestion = null;
        return;
      }

      // Otherwise show buffered next question
      if (pendingNextQuestion) {
        displayQuestion(pendingNextQuestion);
        pendingNextQuestion = null;
      }
    });
  }

  function displaySummary(summary) {
    const total = typeof summary.totalScore === 'number' ? summary.totalScore : 0;
    if (vivaTotalNum) vivaTotalNum.textContent = String(total);

    let level = 'mid';
    if (total < 30) level = 'weak';
    else if (total >= 40) level = 'good';
    if (vivaTotalScoreEl) vivaTotalScoreEl.setAttribute('data-level', level);

    if (vivaSummaryText) {
      vivaSummaryText.textContent = `You scored ${total} out of 50. Keep practicing to strengthen weak areas!`;
    }

    if (vivaTopicBreakdown) {
      vivaTopicBreakdown.innerHTML = '';
      const breakdown = summary.perTopic || {};
      for (const [t, scores] of Object.entries(breakdown)) {
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = t;
        const scoreSpan = document.createElement('strong');
        scoreSpan.textContent = scores.map((s) => `${s}/10`).join(', ');
        li.appendChild(nameSpan);
        li.appendChild(scoreSpan);
        vivaTopicBreakdown.appendChild(li);
      }
    }

    showVivaView('summary');
  }

  // Viva summary buttons
  if (vivaWeakBtn) {
    vivaWeakBtn.addEventListener('click', () => {
      switchTab('weak');
    });
  }

  if (vivaRestartBtn) {
    vivaRestartBtn.addEventListener('click', () => {
      showVivaView('setup');
    });
  }

  // =========================================================================
  // TAB 3: WEAK TOPICS
  // =========================================================================
  const weakListEl = document.getElementById('weak-list');
  const weakEmptyEl = document.getElementById('weak-empty');
  const weakResetBtn = document.getElementById('weak-reset-btn');
  const weakDrillBtn = document.getElementById('weak-drill-btn');
  const weakRowTemplate = document.getElementById('weak-row-template');

  function renderWeakTopics() {
    if (!weakListEl) return;
    const ranked = getRankedTopics();
    weakListEl.innerHTML = '';

    if (!ranked || ranked.length === 0) {
      if (weakEmptyEl) weakEmptyEl.hidden = false;
      weakListEl.hidden = true;
      return;
    }

    if (weakEmptyEl) weakEmptyEl.hidden = true;
    weakListEl.hidden = false;

    ranked.forEach((item) => {
      if (!weakRowTemplate) return;
      const clone = weakRowTemplate.content.cloneNode(true);
      const li = clone.querySelector('li.weak-row');
      li.setAttribute('data-level', item.level);

      const nameEl = clone.querySelector('[data-field="name"]');
      if (nameEl) nameEl.textContent = item.name;

      const barSpan = clone.querySelector('[data-field="bar"]');
      if (barSpan) {
        const pct = Math.min(100, Math.max(0, Math.round(item.avg * 10)));
        barSpan.style.width = `${pct}%`;
      }

      const avgEl = clone.querySelector('[data-field="avg"]');
      if (avgEl) avgEl.textContent = `${item.avg} / 10`;

      const attemptsEl = clone.querySelector('[data-field="attempts"]');
      if (attemptsEl) attemptsEl.textContent = `${item.attempts} ${item.attempts === 1 ? 'try' : 'tries'}`;

      const badgeEl = clone.querySelector('[data-field="badge"]');
      if (badgeEl) {
        badgeEl.textContent = item.level === 'weak' ? 'Weak' : item.level === 'good' ? 'Good' : 'OK';
      }

      const playBtn = clone.querySelector('.circle-play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          switchTab('viva');
          vivaController.startSession({ source: 'topic', topic: item.name });
        });
      }

      weakListEl.appendChild(clone);
    });
  }

  if (weakResetBtn) {
    weakResetBtn.addEventListener('click', () => {
      resetStore();
      renderWeakTopics();
      showToast('Progress has been reset.');
    });
  }

  if (weakDrillBtn) {
    weakDrillBtn.addEventListener('click', () => {
      switchTab('viva');
      drillWeakTopics(vivaController);
    });
  }

  // =========================================================================
  // TAB 4: REVISION PACK & FLASHCARDS
  // =========================================================================
  const revisionNotesEl = document.getElementById('revision-notes');
  const revisionCountEl = document.getElementById('revision-count');
  const revisionBtn = document.getElementById('revision-btn');
  const revisionLoadingEl = document.getElementById('revision-loading');
  const revisionErrorEl = document.getElementById('revision-error');
  const revisionResultEl = document.getElementById('revision-result');
  const revisionSummaryEl = document.getElementById('revision-summary');

  const flashcardBtn = document.getElementById('flashcard');
  const flashcardTopic = document.getElementById('flashcard-topic');
  const flashcardFront = document.getElementById('flashcard-front');
  const flashcardBack = document.getElementById('flashcard-back');
  const flashcardHint = document.getElementById('flashcard-hint');
  const flashcardPrev = document.getElementById('flashcard-prev');
  const flashcardNext = document.getElementById('flashcard-next');
  const flashcardCounter = document.getElementById('flashcard-counter');

  let flashcards = [];
  let currentCardIndex = 0;
  let isCardFlipped = false;

  // Character counter for notes
  if (revisionNotesEl && revisionCountEl) {
    revisionNotesEl.addEventListener('input', () => {
      revisionCountEl.textContent = `${revisionNotesEl.value.length} chars`;
    });
  }

  // Generate revision pack
  if (revisionBtn) {
    revisionBtn.addEventListener('click', async () => {
      const notes = revisionNotesEl.value.trim();
      revisionErrorEl.hidden = true;
      revisionErrorEl.textContent = '';

      if (!notes) {
        revisionErrorEl.textContent = 'Please paste your Java notes first.';
        revisionErrorEl.hidden = false;
        return;
      }

      revisionLoadingEl.hidden = false;
      revisionResultEl.hidden = true;
      revisionBtn.disabled = true;

      try {
        const data = await revisionPack(notes);

        // Populate summary
        revisionSummaryEl.innerHTML = '';
        if (Array.isArray(data.summary)) {
          data.summary.forEach((bullet) => {
            const li = document.createElement('li');
            li.textContent = bullet;
            revisionSummaryEl.appendChild(li);
          });
        }

        // Setup flashcards
        flashcards = Array.isArray(data.flashcards) ? data.flashcards : [];
        currentCardIndex = 0;
        isCardFlipped = false;

        if (flashcards.length > 0) {
          renderFlashcard();
        }

        revisionResultEl.hidden = false;
      } catch (err) {
        revisionErrorEl.textContent = err.message || 'Failed to generate revision pack';
        revisionErrorEl.hidden = false;
        showToast(err.message || 'Revision pack failed');
      } finally {
        revisionLoadingEl.hidden = true;
        revisionBtn.disabled = false;
      }
    });
  }

  function renderFlashcard() {
    if (!flashcards.length) return;
    const card = flashcards[currentCardIndex];

    if (flashcardTopic) flashcardTopic.textContent = card.topic || 'General';
    if (flashcardFront) flashcardFront.textContent = card.q || '';
    if (flashcardBack) flashcardBack.textContent = card.a || '';

    isCardFlipped = false;
    if (flashcardFront) flashcardFront.hidden = false;
    if (flashcardBack) flashcardBack.hidden = true;
    if (flashcardHint) flashcardHint.textContent = 'Click to show the answer';

    if (flashcardCounter) {
      flashcardCounter.textContent = `${currentCardIndex + 1} / ${flashcards.length}`;
    }

    if (flashcardPrev) flashcardPrev.disabled = currentCardIndex === 0;
    if (flashcardNext) flashcardNext.disabled = currentCardIndex === flashcards.length - 1;
  }

  // Flip flashcard
  if (flashcardBtn) {
    flashcardBtn.addEventListener('click', () => {
      if (!flashcards.length) return;
      isCardFlipped = !isCardFlipped;
      if (flashcardFront) flashcardFront.hidden = isCardFlipped;
      if (flashcardBack) flashcardBack.hidden = !isCardFlipped;
      if (flashcardHint) {
        flashcardHint.textContent = isCardFlipped ? 'Click to show the question' : 'Click to show the answer';
      }
    });
  }

  // Flashcard navigation
  if (flashcardPrev) {
    flashcardPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentCardIndex > 0) {
        currentCardIndex--;
        renderFlashcard();
      }
    });
  }

  if (flashcardNext) {
    flashcardNext.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentCardIndex < flashcards.length - 1) {
        currentCardIndex++;
        renderFlashcard();
      }
    });
  }

  // =========================================================================
  // INITIAL RENDER
  // =========================================================================
  renderWeakTopics();
});
