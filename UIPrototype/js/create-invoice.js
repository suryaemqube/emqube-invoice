/*
  EmQube Invoice — Create/Edit Invoice screen (Stage 3 prototype)
  Every field on this page is static display data (matches the real
  app's own field set for invoice 2026-77). The only interactivity is
  the shared "not wired up yet" toast used on inert actions (Save,
  Print, Copy, Cancel, Add Row, Remove line) — same pattern as the
  Invoice List screen.
*/
(function () {
  'use strict';

  var toast = document.getElementById('eq-toast');
  var toastTimer;
  function showToast(message) {
    toast.textContent = message + ' — not wired up in this prototype.';
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }
  document.addEventListener('click', function (e) {
    var target = e.target.closest('[data-coming-soon]');
    if (!target) { return; }
    e.preventDefault();
    showToast(target.getAttribute('data-coming-soon'));
  });
})();
