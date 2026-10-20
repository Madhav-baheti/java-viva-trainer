// public/js/app.js
// Simple tab switching logic
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('nav button[data-tab]');
  const sections = document.querySelectorAll('section.tab');

  function showTab(name) {
    sections.forEach((sec) => {
      if (sec.id === name) {
        sec.hidden = false;
      } else {
        sec.hidden = true;
      }
    });
  }

  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      showTab(target);
    });
  });

  // Show first tab by default
  if (tabs.length > 0) {
    showTab(tabs[0].getAttribute('data-tab'));
  }
});
