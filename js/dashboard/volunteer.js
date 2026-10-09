/**
 * dashboard/volunteer.js — Volunteer Role Dashboard
 */

import { fmtBDT } from '../utils.js';

export function renderDashboard(container) {
  const tasks = [
    { id:'t1', title:'Setup Jumu\'ah hall',           priority:'high',   due:'Today 11AM',   done:false },
    { id:'t2', title:'Collect Friday donations',      priority:'high',   due:'Today 1PM',    done:false },
    { id:'t3', title:'Assist wudu area maintenance',  priority:'medium', due:'Saturday',     done:false },
    { id:'t4', title:'Distribute Zakat food parcels', priority:'high',   due:'Sunday 9AM',   done:false },
    { id:'t5', title:'Clean library books',           priority:'low',    due:'Next week',    done:true  },
    { id:'t6', title:'Prepare Eid event banners',     priority:'medium', due:'In 2 weeks',   done:true  },
  ];

  const donePct = Math.round((tasks.filter(t=>t.done).length / tasks.length) * 100);

  container.innerHTML = `
    <!-- KPI Row -->
    <div class="dash-kpi-row">
      ${[
        { label:'Hours This Month',   value:'32h',  sub:'Goal: 40h',      icon:'⏱️', color:'#0B3D2E' },
        { label:'Tasks Completed',    value:`${tasks.filter(t=>t.done).length}/${tasks.length}`, sub:`${donePct}% done`, icon:'✅', color:'#10B981' },
        { label:'Events Helped',      value:'8',    sub:'this year',       icon:'🎉', color:'#B8943A' },
        { label:'People Helped',      value:'1.2k', sub:'cumulative',      icon:'💚', color:'#6366F1' },
      ].map(kpiCard).join('')}
    </div>

    <div class="dash-main-grid">
      <div class="dash-left">

        <!-- Task list -->
        <div class="dash-widget">
          <div class="dash-widget-header">
            <span>📋 My Tasks</span>
            <span class="dw-badge">${tasks.filter(t=>!t.done).length} pending</span>
          </div>
          <div class="dash-widget-body">
            <div class="vol-progress-bar">
              <div class="vpb-fill" style="width:${donePct}%"></div>
            </div>
            <div class="vol-task-list" id="vol-tasks">
              ${tasks.map(renderTask).join('')}
            </div>
          </div>
        </div>

        <!-- Volunteer hours log -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>📊 Hours Log</span></div>
          <div class="dash-widget-body">
            <div class="dash-bar-chart">
              ${[
                { day:'Mon', val:2  },
                { day:'Tue', val:0  },
                { day:'Wed', val:4  },
                { day:'Thu', val:3  },
                { day:'Fri', val:6  },
                { day:'Sat', val:8  },
                { day:'Sun', val:5  },
              ].map(b => `
                <div class="dbc-col">
                  <div class="dbc-bar" style="height:${b.val * 15}px; background:var(--c-gold-600)"></div>
                  <div class="dbc-label">${b.day}</div>
                  <div class="dbc-value">${b.val}h</div>
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
                { icon:'📄', label:'Volunteer ID',     action:"window._generateDoc('volunteer_id')" },
                { icon:'⏱️', label:'Log Hours',        action:"" },
                { icon:'📝', label:'Report Task',      action:"" },
                { icon:'📢', label:'Wall Post',        action:"goTo('wall')" },
              ].map(q => `
                <button class="dash-quick-btn" onclick="${q.action}">
                  <span class="dqb-icon">${q.icon}</span>
                  <span class="dqb-label">${q.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Upcoming events -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>📅 Upcoming Events</span></div>
          <div class="dash-widget-body">
            ${[
              { event:"Friday Jumu'ah Setup",  date:'This Fri',  role:'Setup team' },
              { event:'Zakat Distribution',    date:'Sunday',    role:'Food parcels' },
              { event:'Eid Al-Fitr Event',     date:'In 3 weeks',role:'All volunteers' },
            ].map(e => `
              <div class="event-row">
                <div class="ev-date-badge">${e.date.split(' ')[0]}</div>
                <div class="ev-info">
                  <div class="ev-title">${e.event}</div>
                  <div class="ev-role">Your role: ${e.role}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Volunteer stats timeline -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>🏆 Milestones</span></div>
          <div class="dash-widget-body">
            <div class="vol-timeline">
              ${[
                { label:'Joined MasjidBD',  date:'Jan 2024',  done:true  },
                { label:'25 hours served',  date:'Mar 2024',  done:true  },
                { label:'100 hours served', date:'Aug 2024',  done:true  },
                { label:'250 hours served', date:'Target',    done:false },
              ].map(m => `
                <div class="vtl-item ${m.done ? 'done' : ''}">
                  <div class="vtl-dot"></div>
                  <div class="vtl-info">
                    <span class="vtl-label">${m.label}</span>
                    <span class="vtl-date">${m.date}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Task checkboxes
  document.querySelectorAll('.vol-task-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const row = cb.closest('.vol-task-row');
      if (row) row.classList.toggle('done', cb.checked);
    });
  });
}

function renderTask(task) {
  const priorityColors = { high:'#EF4444', medium:'#B8943A', low:'#6B7280' };
  return `
    <div class="vol-task-row ${task.done ? 'done' : ''}">
      <label class="vol-task-check-wrap">
        <input type="checkbox" class="vol-task-check" ${task.done ? 'checked' : ''}>
        <span class="vol-task-checkmark"></span>
      </label>
      <div class="vol-task-info">
        <span class="vol-task-title">${task.title}</span>
        <span class="vol-task-due">📅 ${task.due}</span>
      </div>
      <span class="vol-task-priority" style="color:${priorityColors[task.priority]}">
        ${task.priority.toUpperCase()}
      </span>
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
