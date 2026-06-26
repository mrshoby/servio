/* SERVIO v35 — Shared App JS + v36.10 global dark theme/state visibility */
(function() {
  'use strict';



  // ===== Global theme state =====
  var THEME_KEY = 'servio_theme';
  function normalizeTheme(mode) { return mode === 'dark' ? 'dark' : 'light'; }
  function applyGlobalTheme(mode, opts) {
    opts = opts || {};
    mode = normalizeTheme(mode);
    var dark = mode === 'dark';
    var root = document.documentElement;
    var body = document.body;
    root.classList.toggle('sv35-dark', dark);
    root.classList.toggle('theme-dark', dark);
    root.classList.toggle('theme-light', !dark);
    root.setAttribute('data-theme', mode);
    if (body) {
      body.classList.toggle('sv35-dark', dark);
      body.classList.toggle('theme-dark', dark);
      body.classList.toggle('theme-light', !dark);
      body.setAttribute('data-theme', mode);
    }
    localStorage.setItem(THEME_KEY, mode);
    localStorage.setItem('servio_ui_theme', mode);
    document.querySelectorAll('[data-theme-set]').forEach(function(btn) {
      var on = btn.getAttribute('data-theme-set') === mode;
      btn.classList.toggle('active', on);
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('#settingTheme').forEach(function(sel) { sel.value = mode; });
    if (opts.closeTransient) {
      document.querySelectorAll('#userMenu.open,#settingsModal.open,#filterPanel.open,.sidebar-overlay.open').forEach(function(el) { el.classList.remove('open'); });
    }
    window.dispatchEvent(new CustomEvent('servio:themechange', { detail: { theme: mode } }));
  }
  window.SERVIO = window.SERVIO || {};
  window.SERVIO.applyTheme = applyGlobalTheme;
  applyGlobalTheme(localStorage.getItem(THEME_KEY) || localStorage.getItem('servio_ui_theme') || 'light', { silent: true });
  document.addEventListener('click', function(e) {
    var btn = e.target && e.target.closest ? e.target.closest('[data-theme-set]') : null;
    if (!btn) return;
    applyGlobalTheme(btn.getAttribute('data-theme-set'), { closeTransient: false });
  });

  // ===== Sidebar collapse =====
  var sidebar = document.getElementById('sidebar');
  var collapseBtn = document.getElementById('collapse-btn');
  var mobileBtn = document.getElementById('mobile-menu-btn');
  var overlay = document.getElementById('sidebar-overlay');

  var COLLAPSE_KEY = 'servio_sidebar_collapsed';
  var collapsed = localStorage.getItem(COLLAPSE_KEY) === '1';

  function applySidebarState() {
    if (!sidebar) return;
    if (collapsed) {
      sidebar.classList.add('collapsed'); document.body && document.body.classList.add('sidebar-collapsed');
      if (collapseBtn) {
        var icon = collapseBtn.querySelector('svg');
        if (icon) icon.style.transform = 'rotate(180deg)';
      }
    } else {
      sidebar.classList.remove('collapsed'); document.body && document.body.classList.remove('sidebar-collapsed');
      if (collapseBtn) {
        var icon = collapseBtn.querySelector('svg');
        if (icon) icon.style.transform = '';
      }
    }
  }

  applySidebarState();

  if (collapseBtn) {
    collapseBtn.addEventListener('click', function() {
      collapsed = !collapsed;
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
      applySidebarState();
    });
  }

  // ===== Mobile drawer =====
  function openMobile() {
    if (sidebar) sidebar.classList.add('mobile-open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeMobile() {
    if (sidebar) sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (mobileBtn) mobileBtn.addEventListener('click', openMobile);
  if (overlay) overlay.addEventListener('click', closeMobile);

  // ===== Active nav item =====
  var currentPath = location.pathname.replace(/\/$/, '') || '/';
  var navItems = document.querySelectorAll('.nav-item[data-route]');
  navItems.forEach(function(item) {
    var route = item.getAttribute('data-route');
    if (!route) return;
    var href = item.getAttribute('href') || '';
    if (href === currentPath ||
        (route === 'consum' && currentPath.includes('curba-sarcina')) ||
        (route === 'bess' && currentPath.includes('battery')) ||
        (route === 'day-ahead' && currentPath.includes('day-ahead')) ||
        (route === 'scenarios' && currentPath.includes('future')) ||
        (route === 'map' && currentPath.includes('electricity-map'))
    ) {
      item.classList.add('active');
    }
  });

  // ===== Sidebar search =====
  var ssInput = document.querySelector('.ss-input');
  if (ssInput) {
    document.addEventListener('keydown', function(e) {
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey &&
          document.activeElement.tagName !== 'INPUT' &&
          document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        ssInput.focus();
      }
    });

    ssInput.addEventListener('input', function() {
      var q = ssInput.value.toLowerCase().trim();
      navItems.forEach(function(item) {
        var text = item.textContent.toLowerCase();
        item.style.display = (!q || text.includes(q)) ? '' : 'none';
      });
      var sections = document.querySelectorAll('.nav-section');
      sections.forEach(function(s) {
        var visible = Array.from(s.querySelectorAll('.nav-item')).some(function(i) {
          return i.style.display !== 'none';
        });
        s.style.display = (q && !visible) ? 'none' : '';
      });
    });

    ssInput.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') { ssInput.value = ''; ssInput.dispatchEvent(new Event('input')); ssInput.blur(); }
    });
  }

  // ===== Topbar status: live check =====
  var statusDot = document.getElementById('topbar-status-dot');
  var statusText = document.getElementById('topbar-status-text');

  function updateTopbarStatus(ok, text) {
    if (statusDot) {
      statusDot.className = 'status-dot ' + (ok ? 'live' : 'error');
    }
    if (statusText) {
      statusText.textContent = text || (ok ? 'Live' : 'Offline');
    }
  }

  // Quick health ping
  fetch('/api/servio/health')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) { updateTopbarStatus(d && d.ok, d && d.ok ? 'Live' : 'Offline'); })
    .catch(function() { updateTopbarStatus(false, 'Offline'); });

  // ===== Utility: format number =====
  window.SERVIO = window.SERVIO || {};
  window.SERVIO.fmt = function(n, dec) {
    if (n === null || n === undefined || !isFinite(n)) return '—';
    return Number(n).toFixed(dec !== undefined ? dec : 0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  window.SERVIO.fmtRon = function(n) {
    return SERVIO.fmt(n, 2) + ' RON/MWh';
  };
  window.SERVIO.fmtEur = function(n) {
    return SERVIO.fmt(n, 2) + ' EUR/MWh';
  };
  window.SERVIO.ago = function(isoStr) {
    if (!isoStr) return '—';
    var d = new Date(isoStr);
    var now = Date.now();
    var diff = now - d.getTime();
    if (diff < 0) return 'recently';
    var s = Math.floor(diff / 1000);
    if (s < 60) return s + 's ago';
    var m = Math.floor(s / 60);
    if (m < 60) return m + 'm ago';
    var h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  };
  window.SERVIO.el = function(id) { return document.getElementById(id); };
  window.SERVIO.setText = function(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text !== null && text !== undefined ? text : '—';
  };
  window.SERVIO.badge = function(condition, trueClass, falseClass, trueText, falseText) {
    var cls = condition ? trueClass : falseClass;
    var text = condition ? (trueText || 'OK') : (falseText || 'Error');
    return '<span class="badge ' + cls + '">' + text + '</span>';
  };

})();
