/**
 * dashboard/member.js — Member Role Dashboard
 */

import { fmtBDT, pad2 } from '../utils.js';
import { nextPrayer, secsUntil, computePrayers, PRAYER_META } from '../prayer-engine.js';

export function renderDashboard(container) {
  const now    = new Date();
  const next   = nextPrayer('dhaka', now);
  const secs   = secsUntil(next, 'dhaka', now);
  const h      = Math.floor(secs / 3600);
  const m      = Math.floor((secs % 3600) / 60);
  const prayers= computePrayers('dhaka', now);

  container.innerHTML = `
    <!-- KPI Row -->
    <div class="dash-kpi-row">
      ${[
        { label: 'Prayers Attended', value: '127',  sub: 'this month',      icon: '🕌', color: '#0B3D2E' },
        { label: 'Donations Made',   value: fmtBDT(5250), sub: 'total',     icon: '💚', color: '#10B981' },
        { label: 'Volunteer Hours',  value: '48h',  sub: 'this year',       icon: '🤝', color: '#B8943A' },
        { label: 'Wall Posts',       value: '12',   sub: 'by you',          icon: '📝', color: '#6366F1' },
      ].map(k => kpiCard(k)).join('')}
    </div>

    <!-- Main grid -->
    <div class="dash-main-grid">
      <!-- Left column -->
      <div class="dash-left">

        <!-- Prayer times widget -->
        <div class="dash-widget">
          <div class="dash-widget-header">
            <span>🕌 Today's Prayer Times</span>
            <span class="dw-city">Dhaka</span>
          </div>
          <div class="dash-widget-body">
            <div class="dw-next-prayer">
              Next: <strong>${next.name}</strong> in
              <span class="dw-countdown">${h}h ${m}m</span>
            </div>
            <div class="dash-prayer-list">
              ${Object.entries(prayers).map(([key, t]) => {
                const meta     = PRAYER_META[key] || {};
                const isCurrent = key === next.key;
                return `
                  <div class="dpl-row ${isCurrent ? 'current' : ''}">
                    <span class="dpl-name">${meta.icon || ''} ${meta.name || key}</span>
                    <span class="dpl-time">${t[0]}:${pad2(t[1])}</span>
                    ${isCurrent ? '<span class="dpl-pulse"></span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Recent activity -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>📋 Recent Activity</span></div>
          <div class="dash-widget-body">
            ${[
              { icon:'💚', text:'Donated ৳500 to Flood Relief',        time:'2h ago' },
              { icon:'🕌', text:'Attended Fajr at Baitul Mukarram',     time:'Today' },
              { icon:'📝', text:'Posted on Community Wall',             time:'Yesterday' },
              { icon:'🤝', text:'Volunteered for Eid cleanup drive',    time:'3 days ago' },
              { icon:'📖', text:'Downloaded Prayer Schedule PDF',       time:'Last week' },
            ].map(a => `
              <div class="activity-row">
                <span class="ar-icon">${a.icon}</span>
                <span class="ar-text">${a.text}</span>
                <span class="ar-time">${a.time}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Right sidebar -->
      <div class="dash-right">

        <!-- Quick actions -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>⚡ Quick Actions</span></div>
          <div class="dash-widget-body">
            <div class="dash-quick-grid">
              ${[
                { icon:'🕌', label:'Find Mosque',      action:"goTo('map')" },
                { icon:'🤲', label:'Donate',           action:"goTo('donate')" },
                { icon:'📝', label:'Write Post',       action:"goTo('wall')" },
                { icon:'📄', label:'Get Certificate',  action:"window._generateDoc('registration')" },
                { icon:'📊', label:'Zakat Calc',       action:"window._generateDoc('zakat_cert')" },
                { icon:'🗓️', label:'Calendar',         action:"goTo('prayer')" },
              ].map(q => `
                <button class="dash-quick-btn" onclick="${q.action}">
                  <span class="dqb-icon">${q.icon}</span>
                  <span class="dqb-label">${q.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Announcements -->
        <div class="dash-widget">
          <div class="dash-widget-header">
            <span>📢 Announcements</span>
            <button class="dw-link" onclick="goTo('wall')">See all</button>
          </div>
          <div class="dash-widget-body">
            ${[
              { title:"Jumu'ah at 1:00 PM", sub:'Every Friday, Baitul Mukarram', time:'Today' },
              { title:'Ramadan Prep Meeting', sub:'Saturday 8 PM — All welcome', time:'2 days' },
              { title:'Mosque Renovation Update', sub:'90% complete — donation needed', time:'1 week' },
            ].map(a => `
              <div class="ann-row">
                <div class="ann-info">
                  <div class="ann-title">${a.title}</div>
                  <div class="ann-sub">${a.sub}</div>
                </div>
                <div class="ann-time">${a.time}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function kpiCard({ label, value, sub, icon, color }) {
  return `
    <div class="dash-kpi-card" style="--kpi-color:${color}">
      <div class="dkc-icon">${icon}</div>
      <div class="dkc-value">${value}</div>
      <div class="dkc-label">${label}</div>
      <div class="dkc-sub">${sub}</div>
    </div>
  `;
}
