/**
 * dashboard/finance.js — Finance Officer Dashboard
 */

import { fmtBDT } from '../utils.js';

export function renderDashboard(container) {
  const ledger = [
    { id:'L001', date:'09 Oct',  type:'income',  category:'Donations',      desc:'Friday Jumu\'ah donations',        amount:28500  },
    { id:'L002', date:'08 Oct',  type:'income',  category:'Zakat Fund',     desc:'Monthly Zakat collection',         amount:75000  },
    { id:'L003', date:'07 Oct',  type:'expense', category:'Utilities',      desc:'Electricity bill — Oct',           amount:-8200  },
    { id:'L004', date:'07 Oct',  type:'expense', category:'Maintenance',    desc:'Wudu area pipe repair',            amount:-3500  },
    { id:'L005', date:'05 Oct',  type:'income',  category:'Donations',      desc:'Renovation fund deposit',          amount:50000  },
    { id:'L006', date:'04 Oct',  type:'expense', category:'Salaries',       desc:'Imam & staff October salary',      amount:-45000 },
    { id:'L007', date:'03 Oct',  type:'income',  category:'Events',         desc:'Eid fundraiser proceeds',          amount:32000  },
    { id:'L008', date:'01 Oct',  type:'expense', category:'Education',      desc:'Hifz class materials',             amount:-6500  },
  ];

  const totalIncome  = ledger.filter(l => l.type === 'income').reduce((s, l) => s + l.amount, 0);
  const totalExpense = Math.abs(ledger.filter(l => l.type === 'expense').reduce((s, l) => s + l.amount, 0));
  const netBalance   = totalIncome - totalExpense;

  const budgetItems = [
    { label:'Utilities',    spent:8200,  budget:12000 },
    { label:'Salaries',     spent:45000, budget:50000 },
    { label:'Maintenance',  spent:3500,  budget:10000 },
    { label:'Education',    spent:6500,  budget:8000  },
    { label:'Events',       spent:12000, budget:20000 },
  ];

  container.innerHTML = `
    <!-- KPI Row -->
    <div class="dash-kpi-row">
      ${[
        { label:'Total Income',     value: fmtBDT(totalIncome),  sub:'This month',        icon:'📈', color:'#10B981' },
        { label:'Total Expenses',   value: fmtBDT(totalExpense), sub:'This month',        icon:'📉', color:'#EF4444' },
        { label:'Net Balance',      value: fmtBDT(netBalance),   sub:'Available funds',   icon:'💰', color:'#B8943A' },
        { label:'Zakat Collected',  value: fmtBDT(75000),        sub:'Pending disbursal', icon:'🤲', color:'#0B3D2E' },
      ].map(kpiCard).join('')}
    </div>

    <div class="dash-main-grid">
      <div class="dash-left">

        <!-- Income vs Expense Chart -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>📊 Monthly Overview</span></div>
          <div class="dash-widget-body">
            <div class="fin-summary-bars">
              <div class="fsb-row">
                <span class="fsb-label income">Income</span>
                <div class="fsb-track">
                  <div class="fsb-fill income" style="width:${Math.round((totalIncome/(totalIncome+totalExpense))*100)}%"></div>
                </div>
                <span class="fsb-value">${fmtBDT(totalIncome)}</span>
              </div>
              <div class="fsb-row">
                <span class="fsb-label expense">Expense</span>
                <div class="fsb-track">
                  <div class="fsb-fill expense" style="width:${Math.round((totalExpense/(totalIncome+totalExpense))*100)}%"></div>
                </div>
                <span class="fsb-value">${fmtBDT(totalExpense)}</span>
              </div>
            </div>
            <!-- 6-month bar chart -->
            <div class="dash-bar-chart" style="margin-top:16px">
              ${[
                { mon:'May', inc:95000,  exp:58000 },
                { mon:'Jun', inc:120000, exp:62000 },
                { mon:'Jul', inc:88000,  exp:55000 },
                { mon:'Aug', inc:145000, exp:71000 },
                { mon:'Sep', inc:110000, exp:63000 },
                { mon:'Oct', inc:totalIncome, exp:totalExpense },
              ].map(b => `
                <div class="dbc-col">
                  <div style="display:flex;gap:2px;align-items:flex-end">
                    <div class="dbc-bar" style="height:${Math.round((b.inc/200000)*100)}px; background:#10B981; width:10px; border-radius:3px 3px 0 0"></div>
                    <div class="dbc-bar" style="height:${Math.round((b.exp/200000)*100)}px; background:#EF4444; width:10px; border-radius:3px 3px 0 0"></div>
                  </div>
                  <div class="dbc-label">${b.mon}</div>
                </div>
              `).join('')}
            </div>
            <div style="display:flex;gap:16px;margin-top:8px;font-size:12px">
              <span><span style="color:#10B981">■</span> Income</span>
              <span><span style="color:#EF4444">■</span> Expense</span>
            </div>
          </div>
        </div>

        <!-- Ledger -->
        <div class="dash-widget">
          <div class="dash-widget-header">
            <span>📋 Recent Transactions</span>
            <span class="dw-badge">${ledger.length} entries</span>
          </div>
          <div class="dash-widget-body" style="padding:0">
            <table class="fin-ledger-table">
              <thead>
                <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr>
              </thead>
              <tbody>
                ${ledger.map(l => `
                  <tr class="flt-row ${l.type}">
                    <td class="flt-date">${l.date}</td>
                    <td class="flt-desc">${l.desc}</td>
                    <td><span class="flt-cat">${l.category}</span></td>
                    <td class="flt-amount ${l.type}">
                      ${l.type === 'income' ? '+' : '−'}${fmtBDT(Math.abs(l.amount))}
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
                { icon:'📄', label:'Audit Report',    action:"window._generateDoc('audit_report')" },
                { icon:'🧮', label:'Zakat Report',    action:"window._generateDoc('zakat_cert')" },
                { icon:'🧾', label:'Donation Receipt',action:"window._generateDoc('donation_receipt')" },
                { icon:'💰', label:'View Donations',  action:"goTo('donate')" },
              ].map(q => `
                <button class="dash-quick-btn" onclick="${q.action}">
                  <span class="dqb-icon">${q.icon}</span>
                  <span class="dqb-label">${q.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Budget tracker -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>📊 Budget Tracker</span></div>
          <div class="dash-widget-body">
            ${budgetItems.map(b => {
              const pct = Math.round((b.spent / b.budget) * 100);
              const color = pct >= 90 ? '#EF4444' : pct >= 70 ? '#B8943A' : '#10B981';
              return `
                <div class="budget-item" style="margin-bottom:14px">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px">
                    <span>${b.label}</span>
                    <span style="color:${color}">${fmtBDT(b.spent)} / ${fmtBDT(b.budget)}</span>
                  </div>
                  <div class="sr-bar-wrap">
                    <div class="sr-bar" style="width:${pct}%; background:${color}; transition:width 0.8s ease"></div>
                  </div>
                  <div style="text-align:right;font-size:11px;color:var(--c-text-muted);margin-top:2px">${pct}% used</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Fund allocation -->
        <div class="dash-widget">
          <div class="dash-widget-header"><span>🏦 Fund Allocation</span></div>
          <div class="dash-widget-body">
            ${[
              { label:'General Operations', pct:35, color:'#0B3D2E' },
              { label:'Zakat Distribution',  pct:30, color:'#10B981' },
              { label:'Renovation Fund',     pct:20, color:'#B8943A' },
              { label:'Education Program',   pct:10, color:'#6366F1' },
              { label:'Emergency Reserve',   pct:5,  color:'#EF4444' },
            ].map(f => `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:13px">
                <div style="width:12px;height:12px;border-radius:50%;background:${f.color};flex-shrink:0"></div>
                <span style="flex:1">${f.label}</span>
                <strong>${f.pct}%</strong>
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
