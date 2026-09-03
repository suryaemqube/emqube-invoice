/*
  EmQube Invoice — Prototype shell interactions.
  Vanilla JS only, no framework/build dependency, so this stays fully
  isolated from the Angular application. Reproduces the same class-toggle
  behavior the real app's shell directives use (SidebarToggleDirective,
  MobileSidebarToggleDirective, NavDropdownDirective) so it stays a
  faithful, easily-portable reference for the eventual Angular build.
*/
(function () {
  'use strict';

  var body = document.body;

  /* ---- sidebar: desktop compact toggle ---- */
  var desktopToggle = document.getElementById('eq-toggle-desktop');
  if (desktopToggle) {
    desktopToggle.addEventListener('click', function () {
      body.classList.toggle('eq-sidebar-compact');
    });
  }

  /* ---- sidebar: mobile off-canvas toggle ---- */
  var mobileToggle = document.getElementById('eq-toggle-mobile');
  var backdrop = document.getElementById('eq-backdrop');
  function closeMobileSidebar() { body.classList.remove('eq-sidebar-mobile-show'); }
  if (mobileToggle) {
    mobileToggle.addEventListener('click', function () {
      body.classList.toggle('eq-sidebar-mobile-show');
    });
  }
  if (backdrop) { backdrop.addEventListener('click', closeMobileSidebar); }

  /* ---- sidebar minimizer (same control as the desktop compact toggle) ---- */
  var minimizer = document.getElementById('eq-sidebar-minimizer');
  if (minimizer) {
    minimizer.addEventListener('click', function () {
      body.classList.toggle('eq-sidebar-compact');
    });
  }

  /* ---- profile menu ---- */
  var profile = document.getElementById('eq-profile');
  var profileTrigger = document.getElementById('eq-profile-trigger');
  if (profileTrigger) {
    profileTrigger.addEventListener('click', function (e) {
      e.stopPropagation();
      profile.classList.toggle('is-open');
    });
    document.addEventListener('click', function (e) {
      if (profile.classList.contains('is-open') && !profile.contains(e.target)) {
        profile.classList.remove('is-open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { profile.classList.remove('is-open'); }
    });
  }

  /* ---- nav: active state + breadcrumb + header title + page switch ----
     Links to screens that are already built (e.g. index.html, invoices.html)
     are plain anchors with a real href and are left alone — the browser
     navigates normally. Only links marked data-page="placeholder" (screens
     not prototyped yet) are intercepted, to swap in this page's shared
     #eq-page-placeholder section instead of leaving the click. */
  var allNavLinks = document.querySelectorAll('.eq-nav-link');
  var placeholderLinks = document.querySelectorAll('.eq-nav-link[data-page="placeholder"]');
  var breadcrumb = document.getElementById('eq-breadcrumb');
  var headerGroup = document.getElementById('eq-header-group');
  var headerCurrent = document.getElementById('eq-header-current');
  var pageMain = document.getElementById('eq-page-main');
  var pagePlaceholder = document.getElementById('eq-page-placeholder');
  var placeholderIcon = document.getElementById('eq-placeholder-icon');
  var placeholderH1 = document.getElementById('eq-placeholder-h1');
  var placeholderTitle = document.getElementById('eq-placeholder-title');
  var placeholderDesc = document.getElementById('eq-placeholder-desc');
  var placeholderStage = document.getElementById('eq-placeholder-stage');

  placeholderLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      allNavLinks.forEach(function (l) { l.classList.remove('active'); });
      link.classList.add('active');

      var group = link.getAttribute('data-group') || '';
      var title = link.getAttribute('data-title') || link.textContent.trim();
      var icon = link.getAttribute('data-icon') || 'icon-doc';
      var stage = link.getAttribute('data-stage') || 'Not yet prototyped';
      var desc = link.getAttribute('data-desc') || '';

      if (headerGroup) { headerGroup.textContent = group; }
      if (headerCurrent) { headerCurrent.textContent = title; }
      if (breadcrumb) {
        breadcrumb.innerHTML =
          '<li>Home</li>' +
          '<li>' + group + '</li>' +
          '<li class="active">' + title + '</li>';
      }

      if (pageMain) { pageMain.hidden = true; }
      if (pagePlaceholder) { pagePlaceholder.hidden = false; }
      if (placeholderH1) { placeholderH1.textContent = title; }
      if (placeholderIcon) { placeholderIcon.className = 'eq-empty-icon ' + icon; }
      if (placeholderTitle) { placeholderTitle.textContent = title; }
      if (placeholderDesc) { placeholderDesc.textContent = desc; }
      if (placeholderStage) { placeholderStage.textContent = stage; }

      if (window.innerWidth <= 991) { closeMobileSidebar(); }
    });
  });
})();
