/**
 * app.js — MasjidBD Main Boot Entry Point
 * Initializes all modules after DOM ready
 */

import { initTheme }     from './theme.js';
import { initRouter, goTo } from './router.js';
import { showToast }     from './utils.js';

/* ─────────────────────────────────────────────
   Module lazy-loader map
   Each page module is imported only when first
   needed, keeping initial parse time minimal.
───────────────────────────────────────────── */
const PAGE_MODULES = {
  home:      () => import('./pages/home.js'),
  prayer:    () => import('./pages/prayer.js'),
  map:       () => import('./pages/map.js'),
  donate:    () => import('./pages/donate.js'),
  wall:      () => import('./pages/wall.js'),
  dashboard: () => import('./dashboard/index.js'),
  pdf:       () => import('./pdf.js'),
};

const loaded = new Set();

/* ─────────────────────────────────────────────
   Page init dispatcher
   Called by router whenever hash changes
───────────────────────────────────────────── */
async function initPage(pageId) {
  try {
    switch (pageId) {

      case 'home': {
        if (loaded.has('home')) break;
        const { initHome } = await import('./pages/home.js');
        initHome();
        loaded.add('home');
        break;
      }

      case 'prayer': {
        if (loaded.has('prayer')) break;
        const { initPrayer } = await import('./pages/prayer.js');
        initPrayer();
        loaded.add('prayer');
        break;
      }

      case 'map': {
        // Map page re-initialises on every visit (Leaflet needs visible container)
        // pages/map.js renders the layout (sidebar + leaflet-map div) then calls initMap()
        const { initMapPage } = await import('./pages/map.js');
        initMapPage();
        // NOTE: do NOT add 'map' to loaded — always reinit so Leaflet resizes correctly
        break;
      }

      case 'donate': {
        if (loaded.has('donate')) break;
        const { initDonate } = await import('./donate.js');
        initDonate();
        loaded.add('donate');
        break;
      }

      case 'wall': {
        if (loaded.has('wall')) break;
        const { initWall } = await import('./wall.js');
        initWall();
        loaded.add('wall');
        break;
      }

      case 'dashboard': {
        if (loaded.has('dashboard')) break;
        const { initDashboard } = await import('./dashboard/index.js');
        await initDashboard();
        loaded.add('dashboard');
        break;
      }

      case 'pdf': {
        if (loaded.has('pdf')) break;
        const { initPDF } = await import('./pdf.js');
        initPDF();
        loaded.add('pdf');
        break;
      }

      case 'calendar': {
        if (loaded.has('calendar')) break;
        const { initCalendar } = await import('./calendar.js');
        initCalendar();
        loaded.add('calendar');
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[MasjidBD] Failed to init page "${pageId}":`, err);
    showToast(`Failed to load ${pageId} page. Please refresh.`, 'error');
  }
}

/* ─────────────────────────────────────────────
   Global document generator (called from any page)
───────────────────────────────────────────── */
async function bootstrapPDFGenerator() {
  try {
    const { initPDF } = await import('./pdf.js');
    initPDF();
  } catch (e) {
    console.warn('[MasjidBD] PDF module not loaded yet:', e);
  }
}

/* ─────────────────────────────────────────────
   Nav / Tab bar active state
───────────────────────────────────────────── */
function syncNavActive(pageId) {
  // Nav links
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.classList.toggle('active', link.dataset.nav === pageId);
  });
  // Tab bar
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === pageId);
  });
  // Demo role bar (only on dashboard)
  const demoBar = document.getElementById('demo-role-bar');
  if (demoBar) {
    demoBar.style.display = pageId === 'dashboard' ? 'flex' : 'none';
  }
}

/* ─────────────────────────────────────────────
   Chat FAB toggle (global, not page-specific)
───────────────────────────────────────────── */
function initChatFAB() {
  const fab    = document.getElementById('chat-fab');
  const win    = document.getElementById('chat-window');
  const close  = document.getElementById('chat-close');

  if (fab && win) {
    fab.addEventListener('click', () => {
      win.classList.toggle('open');
      fab.classList.toggle('active');
    });
  }
  if (close && win) {
    close.addEventListener('click', () => {
      win.classList.remove('open');
      if (fab) fab.classList.remove('active');
    });
  }
}

/* ─────────────────────────────────────────────
   Notification badge (demo)
───────────────────────────────────────────── */
function initNotifBadge() {
  const btn = document.getElementById('dash-notif-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      showToast('3 new notifications');
    });
  }
}

/* ─────────────────────────────────────────────
   Prayer time live countdown
   Ticks every second and updates every minute
───────────────────────────────────────────── */
async function startPrayerCountdown() {
  try {
    const { nextPrayer, secsUntil } = await import('./prayer-engine.js');

    function tick() {
      const now   = new Date();
      const next  = nextPrayer('dhaka', now);
      const secs  = secsUntil(next, 'dhaka', now);
      const h     = Math.floor(secs / 3600);
      const m     = Math.floor((secs % 3600) / 60);
      const s     = secs % 60;

      // Update any countdown element in the live prayer widget
      const el = document.querySelector('.dw-countdown');
      if (el) el.textContent = `${h}h ${m}m`;

      // Update hero clock if on prayer page
      const heroTime = document.getElementById('prayer-hero-time');
      if (heroTime) {
        heroTime.textContent = now.toLocaleTimeString('en-BD', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      }
    }

    tick();
    setInterval(tick, 1000);
  } catch (e) {
    console.warn('[MasjidBD] Prayer countdown error:', e);
  }
}

/* ─────────────────────────────────────────────
   Theme toggle button (nav)
───────────────────────────────────────────── */
function initThemeButton() {
  // Theme toggle is handled by theme.js initTheme() — no-op here
}

/* ─────────────────────────────────────────────
   Preload next likely pages for snappy navigation
───────────────────────────────────────────── */
function schedulePreloads(currentPage) {
  // After a small delay, preload adjacent pages
  setTimeout(() => {
    if (currentPage === 'home') {
      import('./pages/prayer.js').catch(() => {});
      import('./donate.js').catch(() => {});
    } else if (currentPage === 'prayer') {
      import('./calendar.js').catch(() => {});
      import('./map.js').catch(() => {});
    }
  }, 2000);
}

/* ─────────────────────────────────────────────
   BOOT
───────────────────────────────────────────── */
async function boot() {
  // 1. Apply theme (before any rendering to avoid flash)
  initTheme();

  // 2. Register page-change hook
  const { onPageChange } = await import('./router.js');
  onPageChange(async (pageId) => {
    syncNavActive(pageId);
    await initPage(pageId);
    schedulePreloads(pageId);
    // Re-bind notification badge after dashboard redraws
    initNotifBadge();
  });

  // 3. Start router (reads hash, shows initial page)
  initRouter();

  // 4. Global utilities
  initChatFAB();
  startPrayerCountdown();

  // 5. Bootstrap PDF _generateDoc global (needed across pages)
  bootstrapPDFGenerator();

  // 6. Chat module (loads FAB quickly, binds send)
  try {
    const { initChat } = await import('./chat.js');
    initChat();
  } catch (e) {
    console.warn('[MasjidBD] Chat failed to load:', e);
  }

  // 7. Register global goTo on window so inline onclick works
  window.goTo = goTo;

  // 8. Remove loading overlay if present
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 400);
  }

  console.log('[MasjidBD] v13 booted ✓');
}

/* ─────────────────────────────────────────────
   Entry point
───────────────────────────────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
