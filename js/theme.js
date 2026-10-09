/* ═══════════════════════════════════════════════════════════
   MasjidBD v13 — Theme Manager
   js/theme.js
   Three themes: light | dark | glass
   Persisted in localStorage. No flash on load.
   ═══════════════════════════════════════════════════════════ */

const THEMES    = ['light', 'dark', 'glass'];
const ICONS     = { light: '☀️', dark: '🌙', glass: '✨' };
const LABELS    = { light: 'Light', dark: 'Dark', glass: 'Glass' };
const STORE_KEY = 'masjidbd-theme';

let currentTheme = 'light';

// ── Apply theme to <html> ────────────────────────────────
export function applyTheme(theme) {
  if (!THEMES.includes(theme)) theme = 'light';
  currentTheme = theme;

  // Add transition class, then apply, then remove
  document.documentElement.classList.add('theme-changing');
  document.documentElement.dataset.theme = theme;

  setTimeout(() => {
    document.documentElement.classList.remove('theme-changing');
  }, 400);

  // Update toggle buttons
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
    btn.title = LABELS[btn.dataset.theme];
  });

  // Persist
  try { localStorage.setItem(STORE_KEY, theme); } catch {}

  // Update meta theme-color for mobile status bar
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    const colors = { light: '#F2EFE8', dark: '#0b1a12', glass: '#071510' };
    meta.content = colors[theme] ?? '#0B3D2E';
  }
}

// ── Toggle through themes ────────────────────────────────
export function cycleTheme() {
  const idx  = THEMES.indexOf(currentTheme);
  const next = THEMES[(idx + 1) % THEMES.length];
  applyTheme(next);
}

// ── Get saved or system-preferred theme ─────────────────
export function getSavedTheme() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (THEMES.includes(saved)) return saved;
  } catch {}
  // Respect system dark mode
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  return 'light';
}

// ── Build theme toggle UI ────────────────────────────────
export function buildThemeToggle(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="theme-toggle" role="group" aria-label="Theme">
      ${THEMES.map(t => `
        <button class="theme-btn${t === currentTheme ? ' active' : ''}"
                data-theme="${t}"
                title="${LABELS[t]}"
                aria-label="${LABELS[t]} theme">
          ${ICONS[t]}
        </button>`).join('')}
    </div>`;

  container.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
}

// ── Init: run before DOM ready to avoid flash ────────────
export function initTheme() {
  const theme = getSavedTheme();
  // Apply instantly without transition
  document.documentElement.dataset.theme = theme;
  currentTheme = theme;
}

// Call immediately so the correct theme is set before paint
initTheme();
