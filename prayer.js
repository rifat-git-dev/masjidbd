/**
 * pages/prayer.js — Prayer Times Page
 * Renders: live clock, prayer grid, 64-zilla table, Qibla compass, calendar
 */

import { $, $$, pad2, toBnDigit, showToast } from '../utils.js';
import {
  computePrayers, PRAYER_META, nextPrayer, secsUntil, iqamah,
  ZILLA_OFFSETS, zillaTimesFromBase, applyOffset, CITIES
} from '../prayer-engine.js';

/* ─────────────────────────────────────────────
   State
───────────────────────────────────────────── */
let selectedCity     = localStorage.getItem('masjidbd_city') || 'dhaka';
let selectedDistrict = localStorage.getItem('masjidbd_district') || 'dhaka';
let clockInterval    = null;

/* ─────────────────────────────────────────────
   Main init
───────────────────────────────────────────── */
export function initPrayer() {
  renderCitySelector();
  renderPrayerHero();
  renderPrayerGrid();
  renderZillaTable();
  renderQiblaCompass();
  startLiveClock();
  bindPrayerControls();

  // Delegate calendar rendering to calendar module
  import('../calendar.js').then(({ initCalendar }) => {
    initCalendar();
  }).catch(console.warn);
}

/* ─────────────────────────────────────────────
   City selector
───────────────────────────────────────────── */
function renderCitySelector() {
  const el = document.getElementById('prayer-city-select');
  if (!el) return;

  el.innerHTML = Object.entries(CITIES).map(([key, city]) => `
    <option value="${key}" ${key === selectedCity ? 'selected' : ''}>${city.name}</option>
  `).join('');

  el.addEventListener('change', () => {
    selectedCity = el.value;
    localStorage.setItem('masjidbd_city', selectedCity);
    renderPrayerHero();
    renderPrayerGrid();
  });
}

/* ─────────────────────────────────────────────
   Hero section — live clock + next prayer
───────────────────────────────────────────── */
function renderPrayerHero() {
  const el = document.getElementById('prayer-hero');
  if (!el) return;

  const now    = new Date();
  const next   = nextPrayer(selectedCity, now);
  const secs   = secsUntil(next, selectedCity, now);
  const h      = Math.floor(secs / 3600);
  const m      = Math.floor((secs % 3600) / 60);
  const cityObj= CITIES[selectedCity] || CITIES.dhaka;

  // Format current time
  const timeStr= now.toLocaleTimeString('en-BD', { hour:'2-digit', minute:'2-digit' });
  const dateStr= now.toLocaleDateString('en-BD', { weekday:'long', day:'numeric', month:'long' });

  el.innerHTML = `
    <div class="ph-clock">
      <div class="ph-time" id="ph-live-time">${timeStr}</div>
      <div class="ph-date">${dateStr}</div>
      <div class="ph-city">📍 ${cityObj.name || 'Dhaka'}</div>
    </div>
    <div class="ph-next">
      <div class="ph-next-label">Next Prayer</div>
      <div class="ph-next-name">${next.name}</div>
      <div class="ph-next-countdown" id="prayer-countdown">${h}h ${m}m</div>
    </div>
  `;
}

/* ─────────────────────────────────────────────
   Prayer grid (5 daily prayers)
───────────────────────────────────────────── */
function renderPrayerGrid() {
  const el = document.getElementById('prayer-grid');
  if (!el) return;

  const now     = new Date();
  const prayers = computePrayers(selectedCity, now);
  const next    = nextPrayer(selectedCity, now);

  el.innerHTML = Object.entries(prayers).map(([key, t]) => {
    const meta      = PRAYER_META[key] || {};
    const isCurrent = key === next.key;
    const iqTime    = iqamah(t);

    return `
      <div class="pg-card${isCurrent ? ' current' : ''}">
        <div class="pgc-icon">${meta.icon || '🕌'}</div>
        <div class="pgc-name">${meta.name || key}</div>
        <div class="pgc-name-ar">${meta.ar || ''}</div>
        <div class="pgc-time">${t[0]}:${pad2(t[1])}</div>
        <div class="pgc-iqamah">Iqamah: ${iqTime[0]}:${pad2(iqTime[1])}</div>
        ${isCurrent ? '<div class="pgc-pulse-dot"></div>' : ''}
      </div>
    `;
  }).join('');
}

/* ─────────────────────────────────────────────
   64-Zilla district times table
───────────────────────────────────────────── */
function renderZillaTable() {
  const el = document.getElementById('zilla-table-body');
  if (!el) return;

  const now = new Date();

  // Get all 64 district times
  const rows = Object.entries(ZILLA_OFFSETS).map(([distId, offset]) => {
    const baseTimes = computePrayers('dhaka', now);
    const adjusted  = applyOffset(baseTimes, offset);
    const prayers   = Object.entries(adjusted);

    return { distId, offset, prayers, name: distId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) };
  });

  el.innerHTML = rows.map((r, idx) => `
    <tr class="${idx % 2 === 0 ? '' : 'alt'} ${r.distId === selectedDistrict ? 'current-zilla' : ''}">
      <td class="zt-name">${r.name}</td>
      ${r.prayers.map(([key, t]) => `
        <td class="zt-time zt-${key}">${t[0]}:${pad2(t[1])}</td>
      `).join('')}
      <td class="zt-offset">${r.offset >= 0 ? '+' : ''}${r.offset}m</td>
    </tr>
  `).join('');
}

/* ─────────────────────────────────────────────
   Qibla compass
───────────────────────────────────────────── */
function renderQiblaCompass() {
  const el = document.getElementById('qibla-compass');
  if (!el) return;

  // Dhaka coords: 23.8103° N, 90.4125° E
  // Kaaba: 21.4225° N, 39.8262° E
  const lat1 = 23.8103 * Math.PI / 180;
  const lng1 = 90.4125 * Math.PI / 180;
  const lat2 = 21.4225 * Math.PI / 180;
  const lng2 = 39.8262 * Math.PI / 180;

  const dLng = lng2 - lng1;
  const y    = Math.sin(dLng) * Math.cos(lat2);
  const x    = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
  const distance = haversineKm(23.8103, 90.4125, 21.4225, 39.8262);

  el.innerHTML = `
    <div class="qibla-wrap">
      <div class="compass-ring">
        <div class="compass-rose">
          <span class="cr-n">N</span>
          <span class="cr-s">S</span>
          <span class="cr-e">E</span>
          <span class="cr-w">W</span>
        </div>
        <div class="compass-needle" style="transform:rotate(${bearing}deg)">
          <div class="cn-arrow"></div>
          <div class="cn-kaaba">🕋</div>
        </div>
      </div>
      <div class="qibla-info">
        <div class="qi-bearing">${Math.round(bearing)}° from North</div>
        <div class="qi-distance">Distance: ${Math.round(distance).toLocaleString()} km to Kaaba</div>
        <div class="qi-city">📍 Dhaka, Bangladesh</div>
      </div>
    </div>
  `;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R  = 6371;
  const dL = (lat2 - lat1) * Math.PI / 180;
  const dG = (lng2 - lng1) * Math.PI / 180;
  const a  = Math.sin(dL/2) ** 2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dG/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─────────────────────────────────────────────
   Live clock (ticks every second)
───────────────────────────────────────────── */
function startLiveClock() {
  if (clockInterval) clearInterval(clockInterval);

  clockInterval = setInterval(() => {
    const now = new Date();

    // Update hero clock
    const timeEl = document.getElementById('ph-live-time');
    if (timeEl) {
      timeEl.textContent = now.toLocaleTimeString('en-BD', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    }

    // Update countdown
    const countEl = document.getElementById('prayer-countdown');
    if (countEl) {
      const next = nextPrayer(selectedCity, now);
      const secs = secsUntil(next, selectedCity, now);
      const h    = Math.floor(secs / 3600);
      const m    = Math.floor((secs % 3600) / 60);
      const s    = secs % 60;
      countEl.textContent = `${h}h ${m}m ${pad2(s)}s`;
    }
  }, 1000);
}

/* ─────────────────────────────────────────────
   District search / filter in zilla table
───────────────────────────────────────────── */
function bindPrayerControls() {
  // Zilla table search
  const searchEl = document.getElementById('zilla-search');
  if (searchEl) {
    searchEl.addEventListener('input', debounceSearch);
  }

  // Zilla table district selector (user picks their district)
  const districtEl = document.getElementById('zilla-my-district');
  if (districtEl) {
    districtEl.value = selectedDistrict;
    districtEl.addEventListener('change', () => {
      selectedDistrict = districtEl.value;
      localStorage.setItem('masjidbd_district', selectedDistrict);
      renderMyDistrictCard();
      // Highlight row in table
      document.querySelectorAll('.current-zilla').forEach(r => r.classList.remove('current-zilla'));
      const rows = document.querySelectorAll('#zilla-table-body tr');
      rows.forEach(row => {
        if (row.querySelector('.zt-name')?.textContent.toLowerCase().includes(selectedDistrict.replace(/-/g, ' '))) {
          row.classList.add('current-zilla');
          row.scrollIntoView({ behavior:'smooth', block:'center' });
        }
      });
    });
  }

  renderMyDistrictCard();
}

function renderMyDistrictCard() {
  const el = document.getElementById('my-district-card');
  if (!el) return;

  const now    = new Date();
  const offset = ZILLA_OFFSETS[selectedDistrict] || 0;
  const base   = computePrayers('dhaka', now);
  const times  = applyOffset(base, offset);
  const next   = nextPrayer(selectedDistrict, now);

  const districtName = selectedDistrict.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  el.innerHTML = `
    <div class="mdc-header">
      <span>📍 ${districtName}</span>
      <span style="font-size:12px;color:var(--c-text-muted)">
        ${offset >= 0 ? '+' : ''}${offset} min from Dhaka
      </span>
    </div>
    <div class="mdc-times">
      ${Object.entries(times).map(([key, t]) => {
        const meta = PRAYER_META[key] || {};
        return `
          <div class="mdc-row ${key === next.key ? 'current' : ''}">
            <span>${meta.icon || ''} ${meta.name || key}</span>
            <strong>${t[0]}:${pad2(t[1])}</strong>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

let searchTimer;
function debounceSearch(e) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = e.target.value.toLowerCase().trim();
    document.querySelectorAll('#zilla-table-body tr').forEach(row => {
      const name = row.querySelector('.zt-name')?.textContent.toLowerCase() || '';
      row.style.display = (!q || name.includes(q)) ? '' : 'none';
    });
  }, 200);
}
