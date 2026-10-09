/**
 * dashboard/index.js — Role System Orchestrator
 * Loads the correct role module and renders the dashboard.
 *
 * FIX vs uploaded version:
 *   window.switchDemoRole is now exposed so that the demo-role bar
 *   buttons (onclick="switchRole(role,btn)") work from inline HTML.
 */

import { $, $$, showToast } from '../utils.js';

/* ─────────────────────────────────────────────
   Available roles
───────────────────────────────────────────── */
export const ROLES = {
  member:    { label: 'Member',       icon: '👤', color: '#3B82F6' },
  imam:      { label: 'Imam',         icon: '☪️',  color: '#0B3D2E' },
  volunteer: { label: 'Volunteer',    icon: '🤝',  color: '#10B981' },
  finance:   { label: 'Finance',      icon: '💰',  color: '#B8943A' },
  admin:     { label: 'Admin',        icon: '⚙️',  color: '#6366F1' },
  govt:      { label: 'Govt Officer', icon: '🏛️',  color: '#EF4444' },
};

/* ─────────────────────────────────────────────
   State
───────────────────────────────────────────── */
let currentRole = localStorage.getItem('masjidbd_demo_role') || 'member';

/* ─────────────────────────────────────────────
   Init — called by app.js when visiting /dashboard
───────────────────────────────────────────── */
export async function initDashboard() {
  renderDashboardFrame();
  await loadRoleModule(currentRole);
  bindRoleSwitch();
  updateRoleBadge(currentRole);
}

/* ─────────────────────────────────────────────
   Role badge in nav (#nav-role-badge)
───────────────────────────────────────────── */
function updateRoleBadge(role) {
  const badge = $('#nav-role-badge');
  const info  = ROLES[role] || ROLES.member;
  if (badge) {
    badge.textContent = `${info.icon} ${info.label}`;
    badge.style.background = info.color + '22';
    badge.style.color      = info.color;
    badge.classList.add('show');
  }
}

/* ─────────────────────────────────────────────
   Dashboard frame (always-present elements)
───────────────────────────────────────────── */
function renderDashboardFrame() {
  const page = $('#page-dashboard');
  if (!page) return;

  const role = ROLES[currentRole] || ROLES.member;
  const now  = new Date();

  page.innerHTML = `
    <!-- Welcome header -->
    <div class="dash-header">
      <div class="dash-welcome">
        <div class="dash-welcome-text">Assalamu Alaikum</div>
        <div class="dash-user-name">[Your Name] <span class="dash-mosque-tag">🕌 [Mosque]</span></div>
        <div class="dash-date">${now.toLocaleDateString('en-BD', {
          weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        })}</div>
      </div>
      <div class="dash-header-right">
        <button class="dash-notif-btn" id="dash-notif-btn">
          🔔 <span class="dash-notif-badge">3</span>
        </button>
        <select class="dash-role-select" id="dash-role-select">
          ${Object.entries(ROLES).map(([id, r]) =>
            `<option value="${id}" ${id === currentRole ? 'selected' : ''}>${r.icon} ${r.label}</option>`
          ).join('')}
        </select>
      </div>
    </div>

    <!-- Role alert -->
    <div class="dash-role-alert" id="dash-role-alert">
      ${role.icon} You are viewing the <strong>${role.label}</strong> dashboard.
      Use the selector above to switch roles.
    </div>

    <!-- Role-specific content injected here -->
    <div id="dash-role-content"></div>
  `;
}

/* ─────────────────────────────────────────────
   Load role-specific module
───────────────────────────────────────────── */
async function loadRoleModule(role) {
  const contentEl = $('#dash-role-content');
  if (!contentEl) return;

  contentEl.innerHTML = `<div class="skeleton" style="height:200px; border-radius:12px;"></div>`;

  try {
    let mod;
    switch (role) {
      case 'imam':      mod = await import('./imam.js');      break;
      case 'volunteer': mod = await import('./volunteer.js'); break;
      case 'finance':   mod = await import('./finance.js');   break;
      case 'admin':     mod = await import('./admin.js');     break;
      case 'govt':      mod = await import('./govt.js');      break;
      default:          mod = await import('./member.js');    break;
    }
    mod.renderDashboard(contentEl);
  } catch (e) {
    console.error('[Dashboard] Failed to load role module:', e);
    contentEl.innerHTML = `
      <div style="padding:40px 20px; text-align:center; color:var(--c-text-muted);">
        <div style="font-size:2rem; margin-bottom:12px;">⚠️</div>
        <p>Could not load ${role} dashboard.<br><small>${e.message}</small></p>
      </div>`;
  }
}

/* ─────────────────────────────────────────────
   Role switching
───────────────────────────────────────────── */
function bindRoleSwitch() {
  // Demo bar buttons — [data-demo-role="..."] set in index.html
  $$('[data-demo-role]').forEach(btn => {
    btn.addEventListener('click', () => {
      switchRole(btn.dataset.demoRole);
    });
  });

  // In-dashboard <select> — id="dash-role-select"
  document.addEventListener('change', e => {
    if (e.target?.id === 'dash-role-select') {
      switchRole(e.target.value);
    }
  });
}

function switchRole(role) {
  if (!ROLES[role]) return;
  currentRole = role;
  localStorage.setItem('masjidbd_demo_role', role);

  // Highlight active demo-bar button
  $$('[data-demo-role]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.demoRole === role);
  });

  updateRoleBadge(role);
  renderDashboardFrame();
  loadRoleModule(role);

  showToast(`Switched to ${ROLES[role].label} view`);
}

/* ─────────────────────────────────────────────
   Expose to global scope for inline onclick handlers
   in index.html:
     onclick="switchRole('imam', this)"
   and for the demo-bar (which uses data-demo-role
   via bindRoleSwitch, but some callers use global fn)
───────────────────────────────────────────── */
window.switchDemoRole = switchRole;

export { currentRole };
