/**
 * calendar.js — Triple Gregorian / Bengali / Hijri Calendar
 * Depends on: utils.js (toHijri, fromHijri, HIJRI_MONTHS_EN, ISLAMIC_EVENTS, toBnDigit, toArDigit)
 *             prayer-engine.js (computePrayers, PRAYER_META, CITIES)
 */

import {
  toHijri, fromHijri, HIJRI_MONTHS_EN,
  ISLAMIC_EVENTS, toBnDigit, pad2,
  $, $$, el
} from './utils.js';

/* ─────────────────────────────────────────────
   Bengali calendar constants
───────────────────────────────────────────── */
const BN_MONTHS = [
  'বৈশাখ','জ্যৈষ্ঠ','আষাঢ়','শ্রাবণ',
  'ভাদ্র','আশ্বিন','কার্তিক','অগ্রহায়ণ',
  'পৌষ','মাঘ','ফাল্গুন','চৈত্র'
];
const BN_DAYS = ['রবি','সোম','মঙ্গল','বুধ','বৃহস্পতি','শুক্র','শনি'];
const EN_MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const EN_DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/* ─────────────────────────────────────────────
   Bengali date conversion (Bangla Calendar / বাংলা পঞ্জিকা)
   Reference: Bangladesh government formula
───────────────────────────────────────────── */
function toBengaliDate(gYear, gMonth, gDay) {
  // Bangla year starts ~April 14 (Pohela Boishakh)
  // Offset: Bangla year = Gregorian year - 593 (roughly)
  // Precise mapping month by month:
  const bnMonthStart = [
    // [gMonth(0-based), gDay] when each Bangla month starts
    [3, 14], // Boishakh starts Apr 14
    [4, 15], // Joishtho starts May 15
    [5, 15], // Asharh  starts Jun 15
    [6, 16], // Shraban starts Jul 16
    [7, 16], // Bhadra  starts Aug 16
    [8, 16], // Ashwin  starts Sep 16
    [9, 16], // Kartik  starts Oct 16
    [10,15], // Agrohayon starts Nov 15
    [11,15], // Poush  starts Dec 15
    [0, 14], // Magh   starts Jan 14
    [1, 13], // Falgun starts Feb 13
    [2, 14], // Chaitra starts Mar 14
  ];

  // Find which Bangla month
  let bnMonth = 0;
  for (let i = 11; i >= 0; i--) {
    const [sm, sd] = bnMonthStart[i];
    const startDate = new Date(gYear, sm, sd);
    const testDate  = new Date(gYear, gMonth, gDay);
    if (testDate >= startDate) {
      bnMonth = i;
      break;
    }
  }

  const [sm, sd] = bnMonthStart[bnMonth];
  const startDate = new Date(gYear, sm, sd);
  const testDate  = new Date(gYear, gMonth, gDay);
  const diffMs    = testDate - startDate;
  const bnDay     = Math.floor(diffMs / 86400000) + 1;

  // Bangla year: if month index >= 0 (Boishakh) the year starts Apr 14
  // Bangla year = Gregorian year - 593 if on/after Apr 14, else -594
  const boishakhStart = new Date(gYear, 3, 14);
  const bnYear = new Date(gYear, gMonth, gDay) >= boishakhStart
    ? gYear - 593
    : gYear - 594;

  return { year: bnYear, month: bnMonth, day: bnDay };
}

/* ─────────────────────────────────────────────
   State — one object per calendar type
───────────────────────────────────────────── */
const state = {
  en:    { year: 0, month: 0 },  // Gregorian
  bn:    { year: 0, month: 0 },  // Bengali
  hijri: { year: 0, month: 0 },  // Hijri
  activeTab: 'en'
};

/* ─────────────────────────────────────────────
   Init — call from prayer page mount
───────────────────────────────────────────── */
export function initCalendar() {
  const now   = new Date();
  const today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };

  // Gregorian state
  state.en.year  = today.y;
  state.en.month = today.m;

  // Bengali state
  const bnToday = toBengaliDate(today.y, today.m, today.d);
  state.bn.year  = bnToday.year;
  state.bn.month = bnToday.month;

  // Hijri state
  const hToday = toHijri(today.y, today.m + 1, today.d);
  state.hijri.year  = hToday.year;
  state.hijri.month = hToday.month - 1; // 0-based

  renderAllCals(today);
  bindCalTabs();
  bindNavButtons();
}

/* ─────────────────────────────────────────────
   Tab switching
───────────────────────────────────────────── */
function bindCalTabs() {
  const tabs = $$('.calendar-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      const which = btn.dataset.cal;
      state.activeTab = which;
      $$('.calendar-panel').forEach(p => p.classList.remove('active'));
      const panel = $(`#cal-panel-${which}`);
      if (panel) panel.classList.add('active');
    });
  });
}

/* ─────────────────────────────────────────────
   Nav buttons — exposed globally so onclick attrs work
───────────────────────────────────────────── */
export function navEnCal(delta) {
  const now = new Date();
  state.en.month += delta;
  if (state.en.month < 0)  { state.en.month = 11; state.en.year--; }
  if (state.en.month > 11) { state.en.month = 0;  state.en.year++; }
  const today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
  renderEnCal(today);
}

export function navBnCal(delta) {
  const now = new Date();
  state.bn.month += delta;
  if (state.bn.month < 0)  { state.bn.month = 11; state.bn.year--; }
  if (state.bn.month > 11) { state.bn.month = 0;  state.bn.year++; }
  const today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
  renderBnCal(today);
}

export function navHijriCal(delta) {
  const now = new Date();
  state.hijri.month += delta;
  if (state.hijri.month < 0)  { state.hijri.month = 11; state.hijri.year--; }
  if (state.hijri.month > 11) { state.hijri.month = 0;  state.hijri.year++; }
  const today = { y: now.getFullYear(), m: now.getMonth(), d: now.getDate() };
  renderHijriCal(today);
}

// Expose globally so inline onclick="navEnCal(1)" works
window.navEnCal    = navEnCal;
window.navBnCal    = navBnCal;
window.navHijriCal = navHijriCal;

function bindNavButtons() {
  // Also wire up data-cal-nav buttons (alternative to onclick attrs)
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-cal-nav]');
    if (!btn) return;
    const cal   = btn.dataset.calNav;
    const delta = btn.dataset.dir === 'prev' ? -1 : 1;
    if (cal === 'en')    navEnCal(delta);
    if (cal === 'bn')    navBnCal(delta);
    if (cal === 'hijri') navHijriCal(delta);
  });
}

/* ─────────────────────────────────────────────
   Render all three calendars
───────────────────────────────────────────── */
function renderAllCals(today) {
  renderEnCal(today);
  renderBnCal(today);
  renderHijriCal(today);
  renderIslamicEvents();
}

/* ─────────────────────────────────────────────
   Gregorian Calendar
───────────────────────────────────────────── */
function renderEnCal(today) {
  const { year, month } = state.en;
  const container = $(`#cal-panel-en`);
  if (!container) return;

  const firstDay  = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const daysInPrev= new Date(year, month, 0).getDate();

  let html = `
    <div class="cal-wrap">
      <div class="cal-header">
        <button class="cal-nav-btn" onclick="navEnCal(-1)">&#8592;</button>
        <span class="cal-title">${EN_MONTHS[month]} ${year}</span>
        <button class="cal-nav-btn" onclick="navEnCal(1)">&#8594;</button>
      </div>
      <div class="cal-grid">
        ${EN_DAYS_SHORT.map(d => `<div class="cal-dow">${d}</div>`).join('')}
  `;

  // Prev month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-cell other-month">${daysInPrev - i}</div>`;
  }

  // Current month days
  for (let d = 1; d <= daysInMon; d++) {
    const isToday = year === today.y && month === today.m && d === today.d;
    const isFriday = new Date(year, month, d).getDay() === 5;
    const islamicEvent = getIslamicEventForGregorian(year, month + 1, d);
    const classes = [
      'cal-cell',
      isToday ? 'today' : '',
      isFriday ? 'friday' : '',
      islamicEvent ? 'has-event' : ''
    ].filter(Boolean).join(' ');

    html += `<div class="${classes}" title="${islamicEvent || ''}">
      ${d}
      ${islamicEvent ? '<span class="cal-event-dot"></span>' : ''}
    </div>`;
  }

  // Next month leading days
  const totalCells = Math.ceil((firstDay + daysInMon) / 7) * 7;
  const remaining  = totalCells - firstDay - daysInMon;
  for (let d = 1; d <= remaining; d++) {
    html += `<div class="cal-cell other-month">${d}</div>`;
  }

  html += `</div></div>`; // close cal-grid, cal-wrap
  container.innerHTML = html;
}

/* ─────────────────────────────────────────────
   Bengali Calendar
───────────────────────────────────────────── */
function renderBnCal(today) {
  const { year, month } = state.bn;
  const container = $(`#cal-panel-bn`);
  if (!container) return;

  // Days in each Bangla month (non-leap year):
  // Boishakh–Bhadra: 31 days each (6 months)
  // Ashwin–Chaitra: 30 days each (5 months)
  // Falgun: 29 days (30 in leap year)
  const bnLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInBnMonth = [31,31,31,31,31,31,30,30,30,30, bnLeap ? 30 : 29, 30];

  // Find the Gregorian date for day 1 of this Bangla month
  const startGreg = bnDayToGregorian(year, month, 1);
  const firstDay  = startGreg ? new Date(startGreg.y, startGreg.m, startGreg.d).getDay() : 0;
  const daysInMon = daysInBnMonth[month];

  // Today in Bangla
  const todayBn = toBengaliDate(today.y, today.m, today.d);

  let html = `
    <div class="cal-wrap">
      <div class="cal-header">
        <button class="cal-nav-btn" onclick="navBnCal(-1)">&#8592;</button>
        <span class="cal-title">${BN_MONTHS[month]} ${toBnDigit(year)}</span>
        <button class="cal-nav-btn" onclick="navBnCal(1)">&#8594;</button>
      </div>
      <div class="cal-grid">
        ${BN_DAYS.map(d => `<div class="cal-dow">${d}</div>`).join('')}
  `;

  // Empty leading cells
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-cell other-month"></div>`;
  }

  // Days
  for (let d = 1; d <= daysInMon; d++) {
    const isToday = todayBn.year === year && todayBn.month === month && todayBn.day === d;
    // Find Gregorian for this Bangla day
    const greg = bnDayToGregorian(year, month, d);
    const isFriday = greg ? new Date(greg.y, greg.m, greg.d).getDay() === 5 : false;

    const classes = [
      'cal-cell',
      isToday ? 'today' : '',
      isFriday ? 'friday' : ''
    ].filter(Boolean).join(' ');

    html += `<div class="${classes}">${toBnDigit(d)}</div>`;
  }

  // Fill remaining
  const totalCells = Math.ceil((firstDay + daysInMon) / 7) * 7;
  for (let i = firstDay + daysInMon; i < totalCells; i++) {
    html += `<div class="cal-cell other-month"></div>`;
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

/* Convert Bangla year/month/day(1-based) to Gregorian */
function bnDayToGregorian(bnYear, bnMonthIdx, bnDay) {
  // Boishakh 1 = April 14 in Gregorian (bnYear + 593)
  const gregYear = bnYear + 593;
  const bnMonthStartGreg = [
    { m: 3, d: 14 }, // Boishakh
    { m: 4, d: 15 }, // Joishtho
    { m: 5, d: 15 }, // Asharh
    { m: 6, d: 16 }, // Shraban
    { m: 7, d: 16 }, // Bhadra
    { m: 8, d: 16 }, // Ashwin
    { m: 9, d: 16 }, // Kartik
    { m: 10,d: 15 }, // Agrohayon
    { m: 11,d: 15 }, // Poush
    { m: 0, d: 14 }, // Magh (next greg year)
    { m: 1, d: 13 }, // Falgun
    { m: 2, d: 14 }, // Chaitra
  ];

  const { m: gm, d: gd } = bnMonthStartGreg[bnMonthIdx];
  // Magh and later months fall in the next Gregorian year
  const useYear = bnMonthIdx >= 9 ? gregYear + 1 : gregYear;
  const startDate = new Date(useYear, gm, gd);
  startDate.setDate(startDate.getDate() + bnDay - 1);

  return { y: startDate.getFullYear(), m: startDate.getMonth(), d: startDate.getDate() };
}

/* ─────────────────────────────────────────────
   Hijri Calendar
───────────────────────────────────────────── */
const HIJRI_MONTH_DAYS = [30,29,30,29,30,29,30,29,30,29,30,29]; // base pattern
const AR_MONTHS = [
  'محرم','صفر','ربيع الأول','ربيع الثاني',
  'جمادى الأولى','جمادى الآخرة','رجب','شعبان',
  'رمضان','شوال','ذو القعدة','ذو الحجة'
];

function hijriDaysInMonth(hYear, hMonth) {
  // Standard algorithmic approximation: odd months = 30, even = 29
  // Leap year adds 1 day to Dhul-Hijja (month 12)
  const leapYears = [2,5,7,10,13,15,18,21,24,26,29]; // 30-year cycle
  const cycleYear = ((hYear - 1) % 30) + 1;
  const isLeap    = leapYears.includes(cycleYear);
  if (hMonth === 12 && isLeap) return 30;
  return HIJRI_MONTH_DAYS[hMonth - 1];
}

function renderHijriCal(today) {
  const { year, month } = state.hijri;
  const hMonth1Based    = month + 1;
  const container = $(`#cal-panel-hijri`);
  if (!container) return;

  const daysInMon = hijriDaysInMonth(year, hMonth1Based);

  // Get Gregorian for Hijri day 1 to determine weekday
  const gregDay1 = hijriToGregorian(year, hMonth1Based, 1);
  const firstDay = gregDay1 ? new Date(gregDay1.y, gregDay1.m, gregDay1.d).getDay() : 0;

  // Today in Hijri
  const hToday = toHijri(today.y, today.m + 1, today.d);
  const todayH = { year: hToday.year, month: hToday.month, day: hToday.day };

  // Islamic events in this month
  const eventsThisMonth = ISLAMIC_EVENTS[hMonth1Based] || {};

  let html = `
    <div class="cal-wrap">
      <div class="cal-header">
        <button class="cal-nav-btn" onclick="navHijriCal(-1)">&#8592;</button>
        <span class="cal-title">${AR_MONTHS[month]} ${year} هـ</span>
        <button class="cal-nav-btn" onclick="navHijriCal(1)">&#8594;</button>
      </div>
      <div class="cal-grid">
        ${EN_DAYS_SHORT.map(d => `<div class="cal-dow">${d}</div>`).join('')}
  `;

  // Empty leading cells
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-cell other-month"></div>`;
  }

  // Days
  for (let d = 1; d <= daysInMon; d++) {
    const isToday   = todayH.year === year && todayH.month === hMonth1Based && todayH.day === d;
    const gregD     = hijriToGregorian(year, hMonth1Based, d);
    const isFriday  = gregD ? new Date(gregD.y, gregD.m, gregD.d).getDay() === 5 : false;
    const eventName = eventsThisMonth[d];

    const classes = [
      'cal-cell',
      isToday   ? 'today'    : '',
      isFriday  ? 'friday'   : '',
      eventName ? 'has-event': ''
    ].filter(Boolean).join(' ');

    html += `<div class="${classes}" title="${eventName || ''}">
      ${d}
      ${eventName ? `<span class="cal-event-dot" title="${eventName}"></span>` : ''}
    </div>`;
  }

  // Fill remaining
  const totalCells = Math.ceil((firstDay + daysInMon) / 7) * 7;
  for (let i = firstDay + daysInMon; i < totalCells; i++) {
    html += `<div class="cal-cell other-month"></div>`;
  }

  html += `</div></div>`;
  container.innerHTML = html;

  // Render events list below
  renderIslamicEvents(hMonth1Based);
}

/* Hijri → Gregorian (Kuwaiti algorithm inverse) */
function hijriToGregorian(hy, hm, hd) {
  // Julian Day Number for Hijri date
  const jdn = Math.trunc((11 * hy + 3) / 30) +
    354 * hy + 30 * hm -
    Math.trunc((hm - 1) / 2) + hd + 1948440 - 385;

  // JDN to Gregorian
  let l = jdn + 68569;
  const n = Math.trunc((4 * l) / 146097);
  l = l - Math.trunc((146097 * n + 3) / 4);
  const i = Math.trunc((4000 * (l + 1)) / 1461001);
  l = l - Math.trunc((1461 * i) / 4) + 31;
  const j = Math.trunc((80 * l) / 2447);
  const gd = l - Math.trunc((2447 * j) / 80);
  l = Math.trunc(j / 11);
  const gm = j + 2 - 12 * l;
  const gy = 100 * (n - 49) + i + l;

  return { y: gy, m: gm - 1, d: gd };
}

/* ─────────────────────────────────────────────
   Islamic Events List (below Hijri calendar)
───────────────────────────────────────────── */
function renderIslamicEvents(hMonth) {
  const container = $('#islamic-events-list');
  if (!container) return;

  if (!hMonth) {
    const now = new Date();
    const h = toHijri(now.getFullYear(), now.getMonth() + 1, now.getDate());
    hMonth = h.month;
  }

  const events = ISLAMIC_EVENTS[hMonth] || {};
  const entries = Object.entries(events);

  if (entries.length === 0) {
    container.innerHTML = `<p class="cal-no-events">No major Islamic events this month</p>`;
    return;
  }

  container.innerHTML = entries.map(([day, name]) => `
    <div class="islamic-event-item">
      <span class="iev-day">${day} ${AR_MONTHS[(hMonth || 1) - 1]}</span>
      <span class="iev-name">${name}</span>
    </div>
  `).join('');
}

/* ─────────────────────────────────────────────
   Helper: get Islamic event name for a Gregorian date
───────────────────────────────────────────── */
function getIslamicEventForGregorian(gy, gm, gd) {
  const h = toHijri(gy, gm, gd);
  const events = ISLAMIC_EVENTS[h.month] || {};
  return events[h.day] || null;
}

/* ─────────────────────────────────────────────
   Monthly prayer schedule table (all days of selected month)
   Used in prayer page bottom section
───────────────────────────────────────────── */
export function renderMonthlyPrayerTable(cityKey) {
  const container = $('#monthly-prayer-table');
  if (!container) return;

  const { year, month } = state.en;
  const daysInMon = new Date(year, month + 1, 0).getDate();
  const now = new Date();

  let rows = '';
  for (let d = 1; d <= daysInMon; d++) {
    const date    = new Date(year, month, d);
    const prayers = computePrayers ? computePrayers(cityKey || 'dhaka', date) : null;
    const isToday = date.toDateString() === now.toDateString();

    rows += `<tr class="${isToday ? 'today-row' : ''}">
      <td>${d} ${EN_MONTHS[month].slice(0,3)}</td>
      ${prayers ? Object.entries(prayers).map(([, t]) =>
        `<td>${t[0]}:${pad2(t[1])}</td>`).join('') : '<td colspan="6">—</td>'}
    </tr>`;
  }

  container.innerHTML = `
    <table class="prayer-monthly-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Fajr</th><th>Sunrise</th><th>Dhuhr</th>
          <th>Asr</th><th>Maghrib</th><th>Isha</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// Lazy import prayer-engine to avoid circular deps
let computePrayers = null;
async function loadPrayerEngine() {
  if (!computePrayers) {
    const mod = await import('./prayer-engine.js');
    computePrayers = mod.computePrayers;
  }
}
loadPrayerEngine();
