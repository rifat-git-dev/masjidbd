/**
 * donate.js — Donation Campaigns, Form, Milestones
 */

import { $, $$, el, showToast, fmtBDT, randId } from './utils.js';

/* ─────────────────────────────────────────────
   State
───────────────────────────────────────────── */
let selectedAmount   = 500;
let customAmount     = '';
let donationType     = 'sadaqah'; // 'zakat' | 'sadaqah'
let paymentMethod    = 'bkash';
let selectedCampaign = null;

/* ─────────────────────────────────────────────
   Demo campaign data
───────────────────────────────────────────── */
const CAMPAIGNS = [
  {
    id: 'c1',
    title: 'Mosque Renovation — Baitul Mukarram',
    desc:  'Repair the old roof sections and refurbish the wudu area for 40,000 worshippers.',
    target:   5000000,
    raised:   3720000,
    donors:   1243,
    daysLeft: 28,
    mosque:   'Baitul Mukarram',
    urgent:   false,
    category: 'renovation',
    image:    null,
  },
  {
    id: 'c2',
    title: 'Flood Relief — Sylhet Districts',
    desc:  'Emergency fund for flood-affected families in Sylhet. Food, clean water and medicines.',
    target:   2000000,
    raised:   1890000,
    donors:   3421,
    daysLeft: 5,
    mosque:   'Sylhet Islamic Centre',
    urgent:   true,
    category: 'relief',
    image:    null,
  },
  {
    id: 'c3',
    title: 'Quran Distribution — Barisal Schools',
    desc:  'Distribute 500 Qurans to government primary schools in Barisal district.',
    target:   300000,
    raised:   178000,
    donors:   456,
    daysLeft: 45,
    mosque:   'Barisal Central Mosque',
    urgent:   false,
    category: 'education',
    image:    null,
  },
  {
    id: 'c4',
    title: 'Solar Panels — Chittagong Mosque',
    desc:  'Install 30 solar panels to make Chittagong Grand Mosque energy self-sufficient.',
    target:   800000,
    raised:   240000,
    donors:   312,
    daysLeft: 60,
    mosque:   'Chittagong Grand Mosque',
    urgent:   false,
    category: 'green',
    image:    null,
  },
];

const MILESTONES = [
  { label: '1st Mosque',     amount: 100000,  reached: true  },
  { label: '10 Mosques',     amount: 1000000, reached: true  },
  { label: 'All 64 Zillas',  amount: 5000000, reached: true  },
  { label: 'National Fund',  amount: 10000000,reached: false, current: true },
  { label: 'Endowment',      amount: 25000000,reached: false },
];

const FUND_BREAKDOWN = [
  { label: 'Mosque Renovation', pct: 40, color: 'var(--c-forest-600)' },
  { label: 'Emergency Relief',  pct: 25, color: 'var(--c-red-500)'    },
  { label: 'Education',         pct: 20, color: 'var(--c-gold-600)'   },
  { label: 'Operations',        pct: 15, color: 'var(--c-blue-600)'   },
];

const RECENT_TRANSACTIONS = [
  { donor: 'Anonymous', amount: 5000,  time: new Date(Date.now()-600000),  campaign: 'Flood Relief' },
  { donor: 'M. Rahman',  amount: 2500,  time: new Date(Date.now()-1800000), campaign: 'Renovation' },
  { donor: 'Anonymous', amount: 10000, time: new Date(Date.now()-3600000), campaign: 'Quran Distribution' },
  { donor: 'Sister Faria', amount: 1000, time: new Date(Date.now()-7200000), campaign: 'Flood Relief' },
];

const PRESET_AMOUNTS = [100, 250, 500, 1000, 2500, 5000];

/* ─────────────────────────────────────────────
   Init
───────────────────────────────────────────── */
export function initDonate() {
  renderCampaigns();
  renderDonateHero();
  renderDonationForm();
  renderMilestones();
  renderTransparency();
  bindDonateControls();
}

/* ─────────────────────────────────────────────
   Hero stats
───────────────────────────────────────────── */
function renderDonateHero() {
  const totalRaised  = CAMPAIGNS.reduce((s, c) => s + c.raised, 0);
  const totalDonors  = CAMPAIGNS.reduce((s, c) => s + c.donors, 0);
  const totalCampaigns = CAMPAIGNS.length;
  const largestTarget  = Math.max(...CAMPAIGNS.map(c => c.target));
  const overallPct     = Math.round((totalRaised / largestTarget) * 100);

  const heroes = {
    '#donate-total-raised':   fmtBDT(totalRaised),
    '#donate-donors-count':   totalDonors.toLocaleString(),
    '#donate-campaigns-count': totalCampaigns,
  };
  Object.entries(heroes).forEach(([sel, val]) => {
    const el_ = $(sel);
    if (el_) el_.textContent = val;
  });

  const bar = $('#donate-hero-bar');
  if (bar) bar.style.setProperty('--w', `${overallPct}%`);
}

/* ─────────────────────────────────────────────
   Campaign grid
───────────────────────────────────────────── */
function renderCampaigns(filter = 'all') {
  const grid = $('#campaigns-grid');
  if (!grid) return;

  const filtered = filter === 'all'
    ? CAMPAIGNS
    : CAMPAIGNS.filter(c => c.category === filter);

  grid.innerHTML = filtered.map(renderCampaignCard).join('');
}

function renderCampaignCard(c) {
  const pct      = Math.min(100, Math.round((c.raised / c.target) * 100));
  const daysClass = c.daysLeft <= 7 ? 'urgent-badge' : 'days-badge';

  return `
    <div class="campaign-card" onclick="window._selectCampaign('${c.id}')">
      <div class="cc-image-wrap">
        ${c.image
          ? `<img src="${c.image}" alt="${c.title}" class="cc-image">`
          : `<div class="cc-image-placeholder">🕌</div>`}
        ${c.urgent ? '<span class="cc-urgent-badge">🔥 Urgent</span>' : ''}
        <span class="${daysClass}">${c.daysLeft} days left</span>
      </div>
      <div class="cc-body">
        <span class="cc-mosque">🕌 ${c.mosque}</span>
        <h3 class="cc-title">${c.title}</h3>
        <p class="cc-desc">${c.desc}</p>

        <div class="cc-progress-wrap">
          <div class="cc-progress-bar">
            <div class="cc-progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="cc-progress-meta">
            <span>${fmtBDT(c.raised)} raised</span>
            <span>${pct}%</span>
          </div>
        </div>

        <div class="cc-stats">
          <span>👥 ${c.donors.toLocaleString()} donors</span>
          <span>🎯 Goal: ${fmtBDT(c.target)}</span>
        </div>

        <button class="btn btn-primary btn-sm cc-donate-btn">
          Donate Now
        </button>
      </div>
    </div>
  `;
}

window._selectCampaign = function(id) {
  selectedCampaign = CAMPAIGNS.find(c => c.id === id);
  if (!selectedCampaign) return;
  const label = $('#donation-campaign-label');
  if (label) label.textContent = selectedCampaign.title;
  // Scroll to form
  const form = $('#donation-form-card');
  if (form) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

/* ─────────────────────────────────────────────
   Donation form
───────────────────────────────────────────── */
function renderDonationForm() {
  const amtGrid = $('#donation-amount-grid');
  if (amtGrid) {
    amtGrid.innerHTML = PRESET_AMOUNTS.map(amt => `
      <button class="daf-amount-btn ${amt === selectedAmount ? 'active' : ''}"
        onclick="window._selectAmount(${amt})">
        ৳${amt.toLocaleString()}
      </button>
    `).join('') + `
      <input class="daf-custom-input" id="daf-custom"
        type="number" placeholder="Custom amount"
        oninput="window._customAmount(this.value)"
        min="10"
      />
    `;
  }

  renderSummary();
}

window._selectAmount = function(amt) {
  selectedAmount = amt;
  customAmount   = '';
  const custom = $('#daf-custom');
  if (custom) custom.value = '';
  $$('.daf-amount-btn').forEach(b => {
    b.classList.toggle('active', +b.textContent.replace(/[৳,]/g, '') === amt);
  });
  renderSummary();
};

window._customAmount = function(val) {
  customAmount   = val;
  selectedAmount = +val || 0;
  $$('.daf-amount-btn').forEach(b => b.classList.remove('active'));
  renderSummary();
};

window._selectDonationType = function(type) {
  donationType = type;
  $$('.daf-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  renderSummary();
};

window._selectPayment = function(method) {
  paymentMethod = method;
  $$('.daf-payment-btn').forEach(b => b.classList.toggle('active', b.dataset.method === method));
};

function renderSummary() {
  const amt    = selectedAmount || 0;
  const el_    = $('#donation-summary-amount');
  const title  = $('#donation-summary-campaign');
  if (el_)   el_.textContent  = `৳${amt.toLocaleString()}`;
  if (title) title.textContent = selectedCampaign?.title || 'General Fund';
}

/* ─────────────────────────────────────────────
   Process donation (demo)
───────────────────────────────────────────── */
export function processDonation() {
  const amt = selectedAmount || 0;
  if (amt < 10) {
    showToast('Minimum donation is ৳10', 'error');
    return;
  }

  const name = $('#donor-name')?.value?.trim() || 'Anonymous';
  const anon = $('#donor-anonymous')?.checked;

  // Show loading
  const btn = $('#donate-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processing…'; }

  // Simulate payment processing
  setTimeout(() => {
    if (btn) { btn.disabled = false; btn.textContent = 'Donate Now'; }

    // Update campaign raised amount
    if (selectedCampaign) {
      const camp = CAMPAIGNS.find(c => c.id === selectedCampaign.id);
      if (camp) {
        camp.raised  += amt;
        camp.donors  += 1;
      }
    }

    // Add to recent transactions
    RECENT_TRANSACTIONS.unshift({
      donor:    anon ? 'Anonymous' : name,
      amount:   amt,
      time:     new Date(),
      campaign: selectedCampaign?.title || 'General',
    });

    renderCampaigns();
    renderDonateHero();
    renderTransparency();
    showDonationSuccess(amt, name, anon);
  }, 1800);
}
window.processDonation = processDonation;

function showDonationSuccess(amt, name, anon) {
  const modal = $('#donation-success-modal');
  if (modal) {
    const display = $('#ds-donor-name');
    const amtEl   = $('#ds-amount');
    if (display) display.textContent = anon ? 'your' : `${name}'s`;
    if (amtEl)   amtEl.textContent   = `৳${amt.toLocaleString()}`;
    modal.classList.add('open');
  } else {
    showToast(`JazakAllah Khair! ৳${amt.toLocaleString()} donated 🤲`, 'success');
  }
}

/* ─────────────────────────────────────────────
   Milestones
───────────────────────────────────────────── */
function renderMilestones() {
  const track = $('#milestones-track');
  if (!track) return;

  track.innerHTML = MILESTONES.map((m, i) => `
    <div class="milestone-item ${m.reached ? 'reached' : ''} ${m.current ? 'current' : ''}">
      <div class="mi-dot">
        ${m.reached ? '✓' : (m.current ? '●' : '')}
      </div>
      <div class="mi-info">
        <span class="mi-label">${m.label}</span>
        <span class="mi-amount">${fmtBDT(m.amount)}</span>
      </div>
    </div>
  `).join('');
}

/* ─────────────────────────────────────────────
   Transparency section
───────────────────────────────────────────── */
function renderTransparency() {
  // Fund breakdown bars
  const breakdown = $('#fund-breakdown');
  if (breakdown) {
    breakdown.innerHTML = FUND_BREAKDOWN.map(item => `
      <div class="fund-item">
        <div class="fi-label">
          <span>${item.label}</span>
          <span>${item.pct}%</span>
        </div>
        <div class="fi-bar-wrap">
          <div class="fi-bar" style="width:${item.pct}%; background:${item.color}"></div>
        </div>
      </div>
    `).join('');
  }

  // Recent transactions
  const txList = $('#recent-transactions');
  if (txList) {
    txList.innerHTML = RECENT_TRANSACTIONS.slice(0, 6).map(tx => `
      <div class="tx-item">
        <div class="tx-avatar">💚</div>
        <div class="tx-info">
          <span class="tx-donor">${tx.donor}</span>
          <span class="tx-campaign">${tx.campaign}</span>
        </div>
        <div class="tx-meta">
          <span class="tx-amount">৳${tx.amount.toLocaleString()}</span>
          <span class="tx-time">${formatAgo(tx.time)}</span>
        </div>
      </div>
    `).join('');
  }
}

function formatAgo(date) {
  const m = Math.floor((Date.now() - date) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m/60)}h ago`;
}

/* ─────────────────────────────────────────────
   Controls
───────────────────────────────────────────── */
function bindDonateControls() {
  // Campaign filter tabs
  $$('[data-campaign-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('[data-campaign-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCampaigns(btn.dataset.campaignFilter);
    });
  });

  // Donation type tabs
  $$('.daf-type-btn').forEach(btn => {
    btn.addEventListener('click', () => window._selectDonationType(btn.dataset.type));
  });

  // Payment method
  $$('.daf-payment-btn').forEach(btn => {
    btn.addEventListener('click', () => window._selectPayment(btn.dataset.method));
  });

  // Submit
  const submitBtn = $('#donate-submit-btn');
  if (submitBtn) submitBtn.addEventListener('click', processDonation);
}
