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
   Layout builder — injects page scaffold
───────────────────────────────────────────── */
function buildDonateLayout() {
  const page = document.getElementById('page-donate');
  if (!page || page.querySelector('.donate-page')) return;

  page.innerHTML = `
<div class="donate-page">

  <!-- Hero stats -->
  <section class="donate-hero-section">
    <h1 class="donate-hero-title">💚 Donate to Bangladesh Mosques</h1>
    <p class="donate-hero-sub">Every taka goes directly to mosque projects across all 64 districts</p>
    <div class="donate-stats-row">
      <div class="donate-stat">
        <div class="ds-value" id="donate-total-raised">—</div>
        <div class="ds-label">Total Raised</div>
      </div>
      <div class="donate-stat">
        <div class="ds-value" id="donate-donors-count">—</div>
        <div class="ds-label">Donors</div>
      </div>
      <div class="donate-stat">
        <div class="ds-value" id="donate-campaigns-count">—</div>
        <div class="ds-label">Active Campaigns</div>
      </div>
    </div>
    <div class="donate-hero-progress">
      <div class="donate-hero-bar" id="donate-hero-bar"></div>
    </div>
  </section>

  <!-- Campaign filter tabs -->
  <section class="campaigns-section">
    <div class="campaign-filters">
      <button class="campaign-filter-btn active" data-campaign-filter="all">All</button>
      <button class="campaign-filter-btn" data-campaign-filter="renovation">🏗️ Renovation</button>
      <button class="campaign-filter-btn" data-campaign-filter="relief">🆘 Relief</button>
      <button class="campaign-filter-btn" data-campaign-filter="education">📚 Education</button>
      <button class="campaign-filter-btn" data-campaign-filter="green">🌿 Green</button>
    </div>
    <div class="campaigns-grid" id="campaigns-grid"></div>
  </section>

  <!-- Donation form -->
  <section class="donation-form-section">
    <div class="donation-form-card" id="donation-form-card">
      <h2 class="daf-title">Make a Donation</h2>
      <p class="daf-campaign-row">
        Campaign: <strong id="donation-campaign-label">General Fund</strong>
      </p>

      <!-- Amount grid -->
      <div class="daf-label">Select Amount</div>
      <div class="donation-amount-grid" id="donation-amount-grid"></div>

      <!-- Donation type -->
      <div class="daf-label">Donation Type</div>
      <div class="daf-type-row">
        <button class="daf-type-btn active" data-type="sadaqah">🤲 Sadaqah</button>
        <button class="daf-type-btn" data-type="zakat">🌙 Zakat</button>
        <button class="daf-type-btn" data-type="fitrana">🌟 Fitrana</button>
        <button class="daf-type-btn" data-type="lillah">💚 Lillah</button>
      </div>

      <!-- Payment method -->
      <div class="daf-label">Payment Method</div>
      <div class="daf-payment-row">
        <button class="daf-payment-btn active" data-method="bkash">📱 bKash</button>
        <button class="daf-payment-btn" data-method="nagad">💳 Nagad</button>
        <button class="daf-payment-btn" data-method="rocket">🚀 Rocket</button>
        <button class="daf-payment-btn" data-method="card">💵 Card</button>
      </div>

      <!-- Donor info -->
      <div class="daf-donor-row">
        <input id="donor-name" class="daf-input" type="text" placeholder="Your name (optional)" />
        <label class="daf-anon-label">
          <input id="donor-anonymous" type="checkbox" />
          Donate anonymously
        </label>
      </div>

      <!-- Summary + submit -->
      <div class="daf-summary">
        <span>You are donating <strong id="donation-summary-amount">৳500</strong></span>
        <span>to <strong id="donation-summary-campaign">General Fund</strong></span>
      </div>
      <button class="btn btn-primary daf-submit-btn" id="donate-submit-btn">
        Donate Now 🤲
      </button>
    </div>
  </section>

  <!-- Milestones -->
  <section class="milestones-section">
    <h2 class="section-title">🏆 Campaign Milestones</h2>
    <div class="milestones-track" id="milestones-track"></div>
  </section>

  <!-- Transparency -->
  <section class="transparency-section">
    <h2 class="section-title">📊 Fund Transparency</h2>
    <div class="transparency-grid">
      <div class="transparency-card">
        <h3 class="tc-title">Fund Breakdown</h3>
        <div id="fund-breakdown"></div>
      </div>
      <div class="transparency-card">
        <h3 class="tc-title">Recent Donations</h3>
        <div id="recent-transactions"></div>
      </div>
    </div>
  </section>

</div>

<!-- Success modal -->
<div class="donation-success-modal" id="donation-success-modal">
  <div class="dsm-box">
    <div class="dsm-icon">🤲</div>
    <h2 class="dsm-title">JazakAllah Khair!</h2>
    <p class="dsm-body">
      <span id="ds-donor-name">Your</span> donation of
      <strong id="ds-amount"></strong> has been received.
      May Allah accept it.
    </p>
    <button class="btn btn-primary" onclick="document.getElementById('donation-success-modal').classList.remove('open')">
      Ameen 🌙
    </button>
  </div>
</div>`;
}

/* ─────────────────────────────────────────────
   Init
───────────────────────────────────────────── */
export function initDonate() {
  buildDonateLayout();
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
