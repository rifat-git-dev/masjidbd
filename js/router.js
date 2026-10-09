/* ═══════════════════════════════════════════════════════════
   MasjidBD v13 — Tab Router
   js/router.js
   Hash-based routing. URL: /#prayer, /#map, etc.
   ═══════════════════════════════════════════════════════════ */

const PAGES = ['home','prayer','map','wall','donate','features','govt','register','dashboard'];
const DEFAULT_PAGE = 'home';

let currentPage = DEFAULT_PAGE;
const listeners = [];   // page-change callbacks

// ── Navigate to a page ───────────────────────────────────
export function goTo(page, pushHistory = true) {
  if (!PAGES.includes(page)) page = DEFAULT_PAGE;

  // Deactivate current
  const prev = document.getElementById(`page-${currentPage}`);
  const prevTab = document.getElementById(`tb-${currentPage}`);
  if (prev)    prev.classList.remove('active');
  if (prevTab) prevTab.classList.remove('active');

  // Activate new
  currentPage = page;
  const next = document.getElementById(`page-${page}`);
  const nextTab = document.getElementById(`tb-${page}`);
  if (next)    next.classList.add('active');
  if (nextTab) nextTab.classList.add('active');

  // Update nav link highlights
  document.querySelectorAll('.nav-links a[data-page]').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });

  // Hash URL (no reload)
  if (pushHistory) {
    history.pushState({ page }, '', page === DEFAULT_PAGE ? '/' : `/#${page}`);
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Close mobile menu
  const mobileNav = document.getElementById('navMobile');
  const ham       = document.getElementById('hamburger');
  if (mobileNav) mobileNav.classList.remove('open');
  if (ham)       ham.classList.remove('open');

  // Notify listeners (prayer page needs clock re-render, etc.)
  listeners.forEach(cb => cb(page));
}

// ── Register a page-change listener ─────────────────────
export function onPageChange(cb) { listeners.push(cb); }

// ── Read hash from URL ───────────────────────────────────
function pageFromHash() {
  const hash = window.location.hash.replace('#', '').trim();
  return PAGES.includes(hash) ? hash : DEFAULT_PAGE;
}

// ── Init router ──────────────────────────────────────────
export function initRouter() {
  // Handle browser back/forward
  window.addEventListener('popstate', e => {
    const page = e.state?.page ?? pageFromHash();
    goTo(page, false);
  });

  // Load initial page from URL hash
  const initial = pageFromHash();
  goTo(initial, false);
}

// ── Expose goTo globally for inline onclick attributes ───
window.goTo = goTo;
