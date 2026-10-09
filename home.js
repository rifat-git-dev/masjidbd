/**
 * pages/home.js — Home Page
 * Renders the full home page layout into #page-home
 */

import { pad2, fmtBDT, showToast } from '../utils.js';
import { nextPrayer, computePrayers, PRAYER_META, secsUntil } from '../prayer-engine.js';

/* ─────────────────────────────────────────────
   Main init — renders full page then activates dynamics
───────────────────────────────────────────── */
export function initHome() {
  const page = document.getElementById('page-home');
  if (!page) return;

  const now    = new Date();
  const next   = nextPrayer('dhaka', now);
  const secs   = secsUntil(next, 'dhaka', now);
  const h      = Math.floor(secs / 3600);
  const m      = Math.floor((secs % 3600) / 60);
  const prayers = computePrayers('dhaka', now);
  const dayName = now.toLocaleDateString('en-BD', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

  page.innerHTML = `

    <!-- ── HERO ── -->
    <section class="hero-section">
      <div class="hero-blob blob-1"></div>
      <div class="hero-blob blob-2"></div>
      <div class="hero-grid">

        <!-- Left text -->
        <div class="hero-left">
          <div class="hero-badge">🕌 Official Platform — Ministry of Religious Affairs</div>
          <h1 class="hero-headline">
            Bangladesh's National<br>
            <span class="hero-headline-accent">Mosque Platform</span>
          </h1>
          <p class="hero-sub">
            Connecting every mosque, Imam, volunteer and Muslim across all 64 districts.
            Prayer times, donations, community wall — all in one place.
          </p>
          <div class="hero-ctas">
            <button class="btn btn-solid btn-lg" onclick="goTo('map')">🗺️ Find Your Mosque</button>
            <button class="btn btn-outline btn-lg" onclick="goTo('register')">🕌 Register Mosque</button>
          </div>
          <div class="hero-trust">
            <span>✓ 1,247 Mosques</span>
            <span>✓ 64 Districts</span>
            <span>✓ 28,000+ Members</span>
          </div>
        </div>

        <!-- Right: Prayer card -->
        <div class="hero-right">
          <div class="hero-prayer-card">
            <div class="hpc-header">
              <span class="hpc-title">🕌 Today's Prayers</span>
              <span class="hpc-date">${dayName}</span>
            </div>
            <div class="hpc-next-wrap">
              <span class="hpc-next-label">Next Prayer</span>
              <span class="hpc-next-name">${next.name}</span>
              <span class="hpc-countdown" id="hero-prayer-countdown">${h}h ${m}m</span>
            </div>
            <div class="hpc-list">
              ${Object.entries(prayers).map(([key, t]) => {
                const meta = PRAYER_META[key] || {};
                const isCurrent = key === next.key;
                return `
                  <div class="hpc-row${isCurrent ? ' current' : ''}">
                    <span>${meta.icon || ''} ${meta.name || key}</span>
                    <span>${t[0]}:${pad2(t[1])}</span>
                  </div>
                `;
              }).join('')}
            </div>
            <button class="btn btn-ghost btn-sm" style="width:100%;margin-top:12px" onclick="goTo('prayer')">
              View full schedule →
            </button>
          </div>
        </div>
      </div>

      <!-- Mosque skyline decoration -->
      <div class="hero-skyline" aria-hidden="true">
        <svg viewBox="0 0 1200 180" preserveAspectRatio="none">
          <path d="M0,160 L60,160 L60,120 L80,80 L80,60 L90,40 L90,30 L100,20 L110,30 L110,40 L120,60 L120,80 L140,80 L140,160 L200,160 L200,130 L220,100 L220,80 L230,60 L230,50 L240,35 L250,50 L250,60 L260,80 L260,100 L280,100 L280,160 L350,160 L350,140 L370,110 L370,90 L380,70 L380,55 L390,42 L400,55 L400,70 L410,90 L410,110 L430,110 L430,160 L500,160 L500,145 L520,120 L520,95 L530,72 L530,55 L540,38 L550,55 L550,72 L560,95 L560,120 L580,120 L580,160 L650,160 L650,140 L670,110 L670,90 L680,70 L680,55 L690,42 L700,55 L700,70 L710,90 L710,110 L730,110 L730,160 L800,160 L800,130 L820,100 L820,80 L830,60 L840,45 L850,60 L860,80 L860,100 L880,100 L880,160 L950,160 L950,120 L970,90 L970,70 L980,50 L980,38 L990,25 L1000,38 L1000,50 L1010,70 L1010,90 L1030,90 L1030,160 L1100,160 L1100,140 L1120,115 L1120,95 L1130,75 L1140,95 L1140,115 L1160,115 L1160,160 L1200,160 Z" fill="currentColor" opacity=".08"/>
        </svg>
      </div>
    </section>

    <!-- ── FEATURES GRID ── -->
    <section class="section features-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Everything for Your Mosque</h2>
          <p class="section-sub">A complete digital infrastructure for Bangladesh's mosque ecosystem</p>
        </div>
        <div class="features-grid" id="home-features">
          <!-- rendered below -->
        </div>
      </div>
    </section>

    <!-- ── STATS BAND ── -->
    <section class="stats-band">
      <div class="container">
        <div class="stats-grid" id="home-stats">
          <!-- rendered below -->
        </div>
      </div>
    </section>

    <!-- ── HOW IT WORKS ── -->
    <section class="section steps-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">How It Works</h2>
          <p class="section-sub">Get started in minutes</p>
        </div>
        <div class="steps-grid">
          ${[
            { n:'01', title:'Register Your Mosque', desc:'Submit official documents for verification by the Islamic Foundation Bangladesh.' },
            { n:'02', title:'Set Up Your Profile',  desc:'Add prayer times, Imam details, events and connect your local community.' },
            { n:'03', title:'Invite Members',       desc:'Share your mosque link and let members track prayer times and donate.' },
            { n:'04', title:'Manage & Grow',        desc:'Use role-based dashboards for Imams, volunteers, finance officers and admins.' },
          ].map((s, i) => `
            <div class="step-card reveal">
              <div class="step-number">${s.n}</div>
              <h3 class="step-title">${s.title}</h3>
              <p class="step-desc">${s.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <!-- ── WALL TEASER ── -->
    <section class="section">
      <div class="container">
        <div class="wall-teaser-wrap">
          <div class="wall-teaser-left">
            <h2 class="section-title">Community Wall</h2>
            <p class="section-sub">Latest announcements, events and duas from mosques across Bangladesh.</p>
            <button class="btn btn-solid" onclick="goTo('wall')">Join the Community →</button>
          </div>
          <div class="wall-teaser-right">
            <div class="dash-widget" id="home-wall-teaser" style="max-width:420px">
              <!-- rendered below -->
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── GOVT TEASER ── -->
    <section class="govt-teaser-band">
      <div class="container govt-teaser-inner">
        <div>
          <div class="govt-badge">🏛️ Ministry of Religious Affairs — Bangladesh</div>
          <h2 style="font-size:1.6rem;margin:.5rem 0">Government Oversight Portal</h2>
          <p style="opacity:.8;max-width:480px">District-level compliance reporting, mosque census data and Zakat accountability for all 64 zilas.</p>
        </div>
        <button class="btn btn-outline btn-lg" style="border-color:rgba(255,255,255,.4);color:#fff" onclick="goTo('govt')">
          Access Govt Portal →
        </button>
      </div>
    </section>

    <!-- ── CTA ── -->
    <section class="cta-section">
      <div class="container" style="text-align:center">
        <h2 class="section-title">Ready to bring your mosque online?</h2>
        <p class="section-sub" style="max-width:560px;margin:0 auto 24px">
          Join 1,247 mosques already on MasjidBD. Free forever for registered mosques.
        </p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-solid btn-lg" onclick="goTo('register')">Register Your Mosque</button>
          <button class="btn btn-outline btn-lg" onclick="goTo('map')">Browse Mosques</button>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ── -->
    <footer class="site-footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <div class="logo-text" style="margin-bottom:12px">
            <div class="logo-name">MasjidBD</div>
            <div class="logo-tagline">National Mosque Platform</div>
          </div>
          <p style="font-size:13px;color:var(--c-text-muted);max-width:260px;line-height:1.6">
            Developed in partnership with the Islamic Foundation Bangladesh. Serving every mosque across 64 districts.
          </p>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">Platform</div>
          <a onclick="goTo('prayer')">Prayer Times</a>
          <a onclick="goTo('map')">Find Mosque</a>
          <a onclick="goTo('donate')">Donate</a>
          <a onclick="goTo('wall')">Community Wall</a>
          <a onclick="goTo('dashboard')">Dashboard</a>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">Resources</div>
          <a href="#">Quran Online</a>
          <a href="#">Islamic Calendar</a>
          <a href="#">Zakat Calculator</a>
          <a href="#">Hadith Search</a>
          <a href="#">Prayer Guide</a>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">Government</div>
          <a onclick="goTo('govt')">Govt Portal</a>
          <a onclick="goTo('register')">Register Mosque</a>
          <a href="#">Compliance Reports</a>
          <a href="#">Waqf Management</a>
          <a href="#">IFB Bangladesh</a>
        </div>
        <div class="footer-col">
          <div class="footer-col-title">Contact</div>
          <a>Helpline: 16789</a>
          <a>info@masjidbd.gov.bd</a>
          <a>Islamic Foundation Bhaban</a>
          <a>Agargaon, Dhaka 1207</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2024 MasjidBD — Islamic Foundation Bangladesh. All rights reserved.</span>
        <span>Built with ♥ for every Muslim in Bangladesh</span>
      </div>
    </footer>
  `;

  // Now fill dynamic sections
  renderFeaturesGrid();
  renderStatsSection();
  renderWallTeaser();
  startHeroCountdown();
  initScrollAnimations();
}

/* ─────────────────────────────────────────────
   Features grid
───────────────────────────────────────────── */
function renderFeaturesGrid() {
  const el = document.getElementById('home-features');
  if (!el) return;

  const features = [
    { icon:'🕐', title:'Prayer Times',         desc:'Auto-calculated for all 64 zilas using sun position formula — no API needed.',        href:"#prayer" },
    { icon:'🗺️', title:'Mosque Finder',         desc:'Interactive Leaflet map with every Bangladesh mosque, filterable by type and district.', href:"#map" },
    { icon:'💚', title:'Digital Donations',     desc:'Secure Zakat, Sadaqah & campaign donations with full transparency reports.',           href:"#donate" },
    { icon:'📊', title:'Role Dashboards',       desc:'Tailored views for members, Imams, volunteers, finance officers, admins & govt.',      href:"#dashboard" },
    { icon:'🤖', title:'AI Islamic Assistant',  desc:'Ask about Islamic rulings, prayer guidance, Quran and Hadith via MasjidBot.',         href:"javascript:document.getElementById('chat-fab').click()" },
    { icon:'📢', title:'Community Wall',        desc:'Post announcements, events, duas and community news verified by mosque admins.',       href:"#wall" },
    { icon:'📄', title:'Official Documents',    desc:'Generate Imam letters, Zakat certificates, volunteer IDs and more as PDF.',           href:"#dashboard" },
    { icon:'🗓️', title:'Islamic Calendar',      desc:'Gregorian, Bengali Panjika and Hijri calendars with Ramadan and Eid dates.',          href:"#prayer" },
  ];

  el.innerHTML = features.map(f => `
    <a class="feat-card" onclick="goTo('${f.href.replace('#','')}')">
      <span class="feat-icon">${f.icon}</span>
      <h3 class="feat-title">${f.title}</h3>
      <p class="feat-desc">${f.desc}</p>
    </a>
  `).join('');
}

/* ─────────────────────────────────────────────
   Stats with animated counters
───────────────────────────────────────────── */
function renderStatsSection() {
  const el = document.getElementById('home-stats');
  if (!el) return;

  const stats = [
    { value:1247,  suffix:'',   label:'Registered Mosques',   icon:'🕌' },
    { value:64,    suffix:'',   label:'Bangladesh Districts',  icon:'🗺️' },
    { value:28400, suffix:'+',  label:'Registered Members',    icon:'👥' },
    { value:4820,  suffix:'',   label:'Active Imams',          icon:'☪️'  },
    { value:92,    suffix:'M৳', label:'Donations Tracked',     icon:'💰' },
    { value:18400, suffix:'+',  label:'Hifz Students',         icon:'📖' },
  ];

  el.innerHTML = stats.map((s, i) => `
    <div class="stat-card" data-target="${s.value}" data-suffix="${s.suffix}" style="animation-delay:${i*0.1}s">
      <div class="stat-icon">${s.icon}</div>
      <div class="stat-value" id="stat-val-${i}">0</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join('');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const card  = entry.target;
      const target= parseInt(card.dataset.target);
      const suffix= card.dataset.suffix;
      const vEl   = card.querySelector('.stat-value');
      if (!vEl || vEl.dataset.done) return;
      vEl.dataset.done = '1';
      animateCount(vEl, 0, target, suffix, 1400);
      observer.unobserve(card);
    });
  }, { threshold: 0.3 });

  el.querySelectorAll('.stat-card').forEach(c => observer.observe(c));
}

function animateCount(el, from, to, suffix, dur) {
  const start = performance.now();
  (function step(now) {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (to - from) * e).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(step);
  })(start);
}

/* ─────────────────────────────────────────────
   Wall teaser
───────────────────────────────────────────── */
function renderWallTeaser() {
  const el = document.getElementById('home-wall-teaser');
  if (!el) return;
  el.innerHTML = `
    <div class="dash-widget-header"><span>📢 Latest Announcements</span></div>
    <div class="dash-widget-body" style="padding-top:0">
      ${[
        { icon:'📢', title:"Jumu'ah at 1:00 PM this Friday",      mosque:'Baitul Mukarram National Mosque', time:'2h ago'     },
        { icon:'🎉', title:'Eid celebration — All families welcome', mosque:'Shahi Mosque, Barisal',          time:'Yesterday'  },
        { icon:'🤲', title:'Zakat distribution starts Sunday 9AM',  mosque:'Central Mosque Chittagong',       time:'2 days ago' },
      ].map(p => `
        <div class="wall-teaser-row">
          <span class="wtr-icon">${p.icon}</span>
          <div class="wtr-info">
            <div class="wtr-title">${p.title}</div>
            <div class="wtr-meta">${p.mosque} · ${p.time}</div>
          </div>
        </div>
      `).join('')}
      <button class="btn btn-outline" style="width:100%;margin-top:12px" onclick="goTo('wall')">View All Posts →</button>
    </div>
  `;
}

/* ─────────────────────────────────────────────
   Live countdown
───────────────────────────────────────────── */
function startHeroCountdown() {
  setInterval(() => {
    const el = document.getElementById('hero-prayer-countdown');
    if (!el) return;
    const now  = new Date();
    const next = nextPrayer('dhaka', now);
    const secs = secsUntil(next, 'dhaka', now);
    el.textContent = `${Math.floor(secs/3600)}h ${Math.floor((secs%3600)/60)}m`;
  }, 60000);
}

/* ─────────────────────────────────────────────
   Scroll reveal
───────────────────────────────────────────── */
function initScrollAnimations() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal, .feat-card, .step-card').forEach(el => obs.observe(el));
}
