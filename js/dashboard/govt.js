/**
 * dashboard/govt.js — Government Officer Dashboard
 * Provides district-level oversight of all 64 Bangladesh zilas
 */

import { fmtBDT } from '../utils.js';

/* All 8 divisions with summary stats */
const DIVISIONS = [
  { id:'dhaka',      name:'Dhaka',      mosques:348, members:12400, donations:4820000, verified:312 },
  { id:'chittagong', name:'Chittagong', mosques:284, members:9200,  donations:3650000, verified:258 },
  { id:'sylhet',     name:'Sylhet',     mosques:142, members:4100,  donations:1920000, verified:130 },
  { id:'rajshahi',   name:'Rajshahi',   mosques:198, members:6800,  donations:2430000, verified:185 },
  { id:'khulna',     name:'Khulna',     mosques:156, members:5200,  donations:1870000, verified:141 },
  { id:'barisal',    name:'Barisal',    mosques:118, members:3900,  donations:1340000, verified:105 },
  { id:'rangpur',    name:'Rangpur',    mosques:132, members:4500,  donations:1520000, verified:120 },
  { id:'mymensingh', name:'Mymensingh', mosques:89,  members:3100,  donations:980000,  verified:78  },
];

const totalMosques   = DIVISIONS.reduce((s, d) => s + d.mosques, 0);
const totalMembers   = DIVISIONS.reduce((s, d) => s + d.members, 0);
const totalDonations = DIVISIONS.reduce((s, d) => s + d.donations, 0);
const totalVerified  = DIVISIONS.reduce((s, d) => s + d.verified, 0);

const COMPLIANCE_REPORTS = [
  { district:'Dhaka',     submitted:'2024-10-01', status:'approved',  score:94 },
  { district:'Narayanganj',submitted:'2024-10-03',status:'approved',  score:88 },
  { district:'Gazipur',   submitted:'2024-10-07', status:'pending',   score:null },
  { district:'Tangail',   submitted:'2024-09-28', status:'approved',  score:76 },
  { district:'Munshiganj',submitted:'—',          status:'overdue',   score:null },
];

export function renderDashboard(container) {
  container.innerHTML = `
    <!-- KPI Row -->
    <div class="dash-kpi-row">
      ${[
        { label:'Registered Mosques',  value: totalMosques.toLocaleString(), sub:`${totalVerified} verified`,        icon:'🕌', color:'#0B3D2E' },
        { label:'Total Members',       value:`${(totalMembers/1000).toFixed(1)}k`,sub:'across 8 divisions',         icon:'👥', color:'#6366F1' },
        { label:'Annual Donations',    value:fmtBDT(totalDonations),           sub:'all divisions combined',        icon:'💰', color:'#B8943A' },
        { label:'Compliance Rate',     value:`${Math.round((totalVerified/totalMosques)*100)}%`,sub:'national avg', icon:'✅', color:'#10B981' },
      ].map(kpiCard).join('')}
    </div>

    <div class="dash-main-grid">
      <div class="dash-left">

        <!-- Division-level bar chart -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>📊 Mosques by Division</span></div>
          <div class="dash-widget-body">
            <div class="dash-bar-chart">
              ${DIVISIONS.map(d => `
                <div class="dbc-col">
                  <div class="dbc-bar" style="height:${Math.round((d.mosques/400)*110)}px; background:var(--c-forest-700)"></div>
                  <div class="dbc-label" style="font-size:9px">${d.name.substring(0,5)}</div>
                  <div class="dbc-value">${d.mosques}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Division table -->
        <div class="dash-widget">
          <div class="dash-widget-header">
            <span>🏛️ Division Summary</span>
            <span class="dw-badge">8 Divisions</span>
          </div>
          <div class="dash-widget-body" style="padding:0">
            <table class="fin-ledger-table">
              <thead>
                <tr><th>Division</th><th>Mosques</th><th>Members</th><th>Donations</th><th>Compliance</th></tr>
              </thead>
              <tbody>
                ${DIVISIONS.map(d => {
                  const comp = Math.round((d.verified/d.mosques)*100);
                  const color = comp >= 90 ? '#10B981' : comp >= 75 ? '#B8943A' : '#EF4444';
                  return `
                    <tr class="flt-row">
                      <td style="font-weight:700">${d.name}</td>
                      <td>${d.mosques}</td>
                      <td>${(d.members/1000).toFixed(1)}k</td>
                      <td>${fmtBDT(d.donations)}</td>
                      <td style="color:${color};font-weight:700">${comp}%</td>
                    </tr>
                  `;
                }).join('')}
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
                { icon:'📊', label:'National Report',  action:"window._generateDoc('audit_report')" },
                { icon:'🗺️', label:'District Map',     action:"goTo('map')" },
                { icon:'📢', label:'Announcement',     action:"goTo('wall')" },
                { icon:'📄', label:'Reg. Certificate', action:"window._generateDoc('registration')" },
              ].map(q => `
                <button class="dash-quick-btn" onclick="${q.action}">
                  <span class="dqb-icon">${q.icon}</span>
                  <span class="dqb-label">${q.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Compliance reports -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>📋 Compliance Reports</span></div>
          <div class="dash-widget-body">
            ${COMPLIANCE_REPORTS.map(r => {
              const statusColor = r.status === 'approved' ? '#10B981' : r.status === 'pending' ? '#B8943A' : '#EF4444';
              const statusLabel = r.status === 'approved' ? '✅ Approved' : r.status === 'pending' ? '⏳ Pending' : '🔴 Overdue';
              return `
                <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--c-border)">
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:600;font-size:13px">${r.district}</div>
                    <div style="font-size:11px;color:var(--c-text-muted)">Submitted: ${r.submitted}</div>
                  </div>
                  <div style="text-align:right;flex-shrink:0">
                    <div style="font-size:12px;color:${statusColor};font-weight:600">${statusLabel}</div>
                    ${r.score ? `<div style="font-size:11px;color:var(--c-text-muted)">Score: ${r.score}/100</div>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- National stats -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>🇧🇩 National Statistics</span></div>
          <div class="dash-widget-body">
            ${[
              { label:'Jumu\'ah Attendance (national avg)', value:'2.1M weekly' },
              { label:'Active Imams registered',            value:'4,820'        },
              { label:'Hifz students enrolled',             value:'18,400'       },
              { label:'Zakat distributed (this year)',      value:fmtBDT(92000000) },
              { label:'Mosques with digital records',       value:`${totalVerified} (${Math.round((totalVerified/totalMosques)*100)}%)` },
            ].map(s => `
              <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--c-border);font-size:13px">
                <span style="color:var(--c-text-muted)">${s.label}</span>
                <strong>${s.value}</strong>
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
