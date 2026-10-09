/**
 * dashboard/admin.js — Admin Dashboard
 */

import { fmtBDT } from '../utils.js';

export function renderDashboard(container) {
  const mosques = [
    { id:'m1', name:'Baitul Mukarram National Mosque', district:'Dhaka',      status:'active',  members:4200, verified:true  },
    { id:'m2', name:'Shahi Mosque Barisal',             district:'Barisal',   status:'active',  members:1850, verified:true  },
    { id:'m3', name:'Atia Mosque Tangail',              district:'Tangail',   status:'pending', members:620,  verified:false },
    { id:'m4', name:'Star Mosque Old Dhaka',            district:'Dhaka',     status:'active',  members:980,  verified:true  },
    { id:'m5', name:'Shat Gambuj Mosque',               district:'Bagerhat',  status:'active',  members:750,  verified:true  },
  ];

  const recentUsers = [
    { name:'Rahul Islam',      role:'member',    joined:'2h ago',     mosque:'Baitul Mukarram' },
    { name:'Fatima Begum',     role:'volunteer', joined:'5h ago',     mosque:'Shahi Mosque'    },
    { name:'Yusuf Ahmed',      role:'imam',      joined:'Yesterday',  mosque:'Atia Mosque'     },
    { name:'Mariam Khatun',    role:'finance',   joined:'2 days ago', mosque:'Star Mosque'     },
    { name:'Abdul Karim',      role:'member',    joined:'3 days ago', mosque:'Shat Gambuj'     },
  ];

  const roleColors = {
    member:'#3B82F6', imam:'#0B3D2E', volunteer:'#10B981',
    finance:'#B8943A', admin:'#6366F1', govt:'#EF4444'
  };

  container.innerHTML = `
    <!-- KPI Row -->
    <div class="dash-kpi-row">
      ${[
        { label:'Total Mosques',   value:'1,247', sub:'+12 this month',   icon:'🕌', color:'#0B3D2E' },
        { label:'Registered Users',value:'28.4k', sub:'+340 this week',   icon:'👥', color:'#6366F1' },
        { label:'Active Volunteers',value:'892',  sub:'across 64 zilas',  icon:'🤝', color:'#10B981' },
        { label:'Pending Reviews',  value:'23',   sub:'need attention',   icon:'⏳', color:'#EF4444' },
      ].map(kpiCard).join('')}
    </div>

    <div class="dash-main-grid">
      <div class="dash-left">

        <!-- System analytics chart -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>📈 Platform Growth</span></div>
          <div class="dash-widget-body">
            <div class="dash-bar-chart">
              ${[
                { mon:'May', users:18200 },
                { mon:'Jun', users:20500 },
                { mon:'Jul', users:22100 },
                { mon:'Aug', users:24800 },
                { mon:'Sep', users:26900 },
                { mon:'Oct', users:28400 },
              ].map(b => `
                <div class="dbc-col">
                  <div class="dbc-bar" style="height:${Math.round((b.users/35000)*110)}px; background:var(--c-forest-700)"></div>
                  <div class="dbc-label">${b.mon}</div>
                  <div class="dbc-value">${(b.users/1000).toFixed(1)}k</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Mosque registry table -->
        <div class="dash-widget">
          <div class="dash-widget-header">
            <span>🕌 Mosque Registry</span>
            <span class="dw-badge">${mosques.length} shown</span>
          </div>
          <div class="dash-widget-body" style="padding:0">
            <table class="fin-ledger-table">
              <thead>
                <tr><th>Mosque</th><th>District</th><th>Members</th><th>Status</th></tr>
              </thead>
              <tbody>
                ${mosques.map(m => `
                  <tr class="flt-row">
                    <td>
                      <div style="font-weight:600;font-size:13px">${m.name}</div>
                      ${m.verified ? '<span style="font-size:11px;color:#10B981">✓ Verified</span>' : '<span style="font-size:11px;color:#B8943A">Pending verification</span>'}
                    </td>
                    <td class="flt-date">${m.district}</td>
                    <td style="font-weight:600">${m.members.toLocaleString()}</td>
                    <td>
                      <span style="
                        display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;
                        background:${m.status === 'active' ? '#10B98122' : '#B8943A22'};
                        color:${m.status === 'active' ? '#10B981' : '#B8943A'}
                      ">${m.status.toUpperCase()}</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
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
                { icon:'📢', label:'Broadcast',     action:"goTo('wall')" },
                { icon:'🕌', label:'Add Mosque',    action:"" },
                { icon:'👤', label:'Manage Users',  action:"" },
                { icon:'📄', label:'System Report', action:"window._generateDoc('audit_report')" },
                { icon:'📊', label:'Analytics',     action:"" },
                { icon:'⚙️', label:'Settings',      action:"" },
              ].map(q => `
                <button class="dash-quick-btn" onclick="${q.action}">
                  <span class="dqb-icon">${q.icon}</span>
                  <span class="dqb-label">${q.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Recent user signups -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>👤 Recent Signups</span></div>
          <div class="dash-widget-body">
            ${recentUsers.map(u => `
              <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--c-border)">
                <div style="
                  width:36px;height:36px;border-radius:50%;
                  background:${roleColors[u.role]}22;
                  display:flex;align-items:center;justify-content:center;
                  font-size:16px;flex-shrink:0
                ">👤</div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:13px">${u.name}</div>
                  <div style="font-size:12px;color:var(--c-text-muted)">${u.mosque}</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <span style="
                    display:block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;
                    background:${roleColors[u.role]}22;color:${roleColors[u.role]}
                  ">${u.role.toUpperCase()}</span>
                  <span style="font-size:11px;color:var(--c-text-muted)">${u.joined}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- System health -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>🖥️ System Health</span></div>
          <div class="dash-widget-body">
            ${[
              { label:'Database',      status:'Operational', ok:true  },
              { label:'Auth Service',  status:'Operational', ok:true  },
              { label:'File Storage',  status:'Operational', ok:true  },
              { label:'AI Chatbot',    status:'Degraded',    ok:false },
              { label:'Map Service',   status:'Operational', ok:true  },
            ].map(s => `
              <div style="display:flex;align-items:center;gap:8px;padding:6px 0">
                <div style="
                  width:8px;height:8px;border-radius:50%;flex-shrink:0;
                  background:${s.ok ? '#10B981' : '#EF4444'};
                  box-shadow:0 0 6px ${s.ok ? '#10B981' : '#EF4444'}
                "></div>
                <span style="flex:1;font-size:13px">${s.label}</span>
                <span style="font-size:12px;color:${s.ok ? '#10B981' : '#EF4444'}">${s.status}</span>
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
