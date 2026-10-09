/**
 * dashboard/imam.js — Imam Role Dashboard
 */

import { fmtBDT, pad2 } from '../utils.js';
import { computePrayers, PRAYER_META, nextPrayer } from '../prayer-engine.js';

export function renderDashboard(container) {
  const now    = new Date();
  const prayers= computePrayers('dhaka', now);
  const next   = nextPrayer('dhaka', now);
  const secs   = 0; // simplified
  const dayName= now.toLocaleDateString('en-BD', { weekday:'long' });

  container.innerHTML = `
    <!-- KPI Row -->
    <div class="dash-kpi-row">
      ${[
        { label: 'Congregation Today',  value: '1,240', sub: 'avg this week',    icon: '👥', color: '#0B3D2E' },
        { label: "Jumu'ah Last Friday", value: '4,320', sub: 'record: 5,200',    icon: '🕌', color: '#B8943A' },
        { label: 'Lessons This Month',  value: '14',    sub: 'Quran & Fiqh',     icon: '📖', color: '#6366F1' },
        { label: 'Students (Hifz)',     value: '38',    sub: 'active this year', icon: '🎓', color: '#10B981' },
      ].map(kpiCard).join('')}
    </div>

    <div class="dash-main-grid">
      <div class="dash-left">

        <!-- Today's schedule -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>🕰️ Today's Schedule — ${dayName}</span></div>
          <div class="dash-widget-body">
            <div class="dash-prayer-list">
              ${Object.entries(prayers).map(([key, t]) => {
                const meta = PRAYER_META[key] || {};
                const isCurrent = key === next.key;
                return `
                  <div class="dpl-row ${isCurrent ? 'current' : ''}">
                    <span class="dpl-name">${meta.icon || ''} ${meta.name || key}</span>
                    <span class="dpl-time">${t[0]}:${pad2(t[1])}</span>
                    <span class="dpl-iqamah">Iqamah: ${t[0]}:${pad2(t[1] + 15)}</span>
                    ${isCurrent ? '<span class="dpl-pulse"></span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Lessons & khutbah planner -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>📖 Lesson & Khutbah Planner</span></div>
          <div class="dash-widget-body">
            ${[
              { day:"Today (Fajr lesson)",     topic:"Surah Al-Kahf — Ayah 45-50",    type:'quran'  },
              { day:"Today (Asr lesson)",       topic:"Fiqh: Rules of Wudu",           type:'fiqh'   },
              { day:"Friday Khutbah",           topic:"Patience in Difficult Times",   type:'khutbah'},
              { day:"Sunday Hifz class",        topic:"Juz 12 revision",               type:'hifz'   },
            ].map(l => `
              <div class="lesson-row">
                <span class="lr-type lr-${l.type}">${l.type.toUpperCase()}</span>
                <div class="lr-info">
                  <div class="lr-day">${l.day}</div>
                  <div class="lr-topic">${l.topic}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Congregation chart (CSS bar chart) -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>📊 Weekly Congregation</span></div>
          <div class="dash-widget-body">
            <div class="dash-bar-chart">
              ${[
                { day:'Sun', val:820,  max:1500 },
                { day:'Mon', val:740,  max:1500 },
                { day:'Tue', val:910,  max:1500 },
                { day:'Wed', val:680,  max:1500 },
                { day:'Thu', val:1050, max:1500 },
                { day:'Fri', val:4320, max:5000 },
                { day:'Sat', val:890,  max:1500 },
              ].map(b => `
                <div class="dbc-col">
                  <div class="dbc-bar" style="height:${Math.round((b.val/b.max)*120)}px"></div>
                  <div class="dbc-label">${b.day}</div>
                  <div class="dbc-value">${b.val >= 1000 ? (b.val/1000).toFixed(1)+'k' : b.val}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="dash-right">
        <!-- Quick actions -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>⚡ Quick Actions</span></div>
          <div class="dash-widget-body">
            <div class="dash-quick-grid">
              ${[
                { icon:'📢', label:'Post Announcement', action:"goTo('wall')" },
                { icon:'📋', label:'Appointment Letter', action:"window._generateDoc('imam_letter')" },
                { icon:'📅', label:'Prayer Schedule',    action:"window._generateDoc('prayer_schedule')" },
                { icon:'📊', label:'Attendance Record',  action:"window._generateDoc('jumah_record')" },
                { icon:'📖', label:'Wall Post',          action:"goTo('wall')" },
                { icon:'💰', label:'View Donations',     action:"goTo('donate')" },
              ].map(q => `
                <button class="dash-quick-btn" onclick="${q.action}">
                  <span class="dqb-icon">${q.icon}</span>
                  <span class="dqb-label">${q.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Student progress -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>🎓 Hifz Student Progress</span></div>
          <div class="dash-widget-body">
            ${[
              { name:'Ahmed Hossain',  juz:18, total:30, pct:60 },
              { name:'Fatima Khatun',  juz:25, total:30, pct:83 },
              { name:'Yusuf Rahman',   juz:8,  total:30, pct:27 },
              { name:'Maryam Islam',   juz:30, total:30, pct:100 },
            ].map(s => `
              <div class="student-row">
                <div class="sr-info">
                  <span class="sr-name">${s.name}</span>
                  <span class="sr-juz">Juz ${s.juz}/${s.total}</span>
                </div>
                <div class="sr-bar-wrap">
                  <div class="sr-bar" style="width:${s.pct}%; background: ${s.pct===100 ? '#10B981' : '#0B3D2E'}"></div>
                </div>
                ${s.pct === 100 ? '<span class="sr-done">✅ Complete!</span>' : ''}
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
