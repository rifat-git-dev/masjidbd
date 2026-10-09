/* ═══════════════════════════════════════════════════════════
   MasjidBD v13 — Shared Utilities
   js/utils.js
   ═══════════════════════════════════════════════════════════ */

// ── DOM helpers ──────────────────────────────────────────
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
export const el = (tag, cls = '', html = '') => {
  const e = document.createElement(tag);
  if (cls)  e.className = cls;
  if (html) e.innerHTML = html;
  return e;
};

// ── Toast notification ───────────────────────────────────
let toastTimer = null;
export function showToast(msg, type = 'default', duration = 3200) {
  const t = $('#toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast${type !== 'default' ? ' toast-' + type : ''}`;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

// ── Bengali digits ───────────────────────────────────────
const BN_DIGITS = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
export function toBnDigit(n) {
  return String(n).replace(/[0-9]/g, d => BN_DIGITS[+d]);
}

// ── Arabic-Indic digits ──────────────────────────────────
const AR_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
export function toArDigit(n) {
  return String(n).replace(/[0-9]/g, d => AR_DIGITS[+d]);
}

// ── Zero pad ─────────────────────────────────────────────
export const pad2 = n => String(n).padStart(2, '0');

// ── Format [h, m] → "3:42 PM" ───────────────────────────
export function fmtTime([h, m]) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${pad2(m)} ${ampm}`;
}

// ── Minutes since midnight ───────────────────────────────
export const toMin = ([h, m]) => h * 60 + m;

// ── Date helpers ─────────────────────────────────────────
export const MONTHS_EN  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTHS_BN  = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
export const DAYS_EN    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const DAYS_EN_S  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const DAYS_BN    = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
export const DAYS_BN_S  = ['রবি','সোম','মঙ্গল','বুধ','বৃহ','শুক্র','শনি'];

// ── Hijri conversion (Kuwaiti algorithm) ─────────────────
export function toHijri(gy, gm, gd) {
  const jd = Math.floor((1461*(gy+4800+Math.floor((gm-14)/12)))/4) +
    Math.floor((367*(gm-2-12*Math.floor((gm-14)/12)))/12) -
    Math.floor((3*Math.floor((gy+4900+Math.floor((gm-14)/12))/100))/4) + gd - 32075;
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l-1)/10631);
  l = l - 10631*n + 354;
  const j = Math.floor((10985-l)/5316)*Math.floor((50*l)/17719) +
    Math.floor(l/5670)*Math.floor((43*l)/15238);
  l = l - Math.floor((30-j)/15)*Math.floor((17719*j)/50) -
    Math.floor(j/16)*Math.floor((15238*j)/43) + 29;
  const hm = Math.floor((24*l)/709);
  const hd = l - Math.floor((709*hm)/24);
  const hy = 30*n + j - 30;
  return { y:hy, m:hm, d:hd };
}

// Hijri → Gregorian (Kuwaiti algorithm reverse)
export function fromHijri(hy, hm, hd) {
  const jd = Math.floor((11*hy + 3)/30) + 354*hy + 30*hm -
    Math.floor((hm-1)/2) + hd + 1948440 - 385;
  let n = jd - 1401;
  let l, j, i;
  l = n + Math.floor((Math.floor((4*n+274277)/146097)*3)/4) - 38;
  j = 12*l - 1;
  i = Math.floor(j/354);
  const gm_out = (j - 12*Math.floor(i/12) + 1);
  const gd_out = l - Math.floor(i/12)*365 - Math.floor(i/48);
  // This is a simplified variant; for full accuracy use established libraries
  // Returning approximate Gregorian date
  const approxDate = new Date(1970, 0, 1);
  approxDate.setDate(approxDate.getDate() + jd - 2440588);
  return {
    y: approxDate.getFullYear(),
    m: approxDate.getMonth() + 1,
    d: approxDate.getDate(),
  };
}

export const HIJRI_MONTHS_EN = [
  'Muharram','Safar','Rabi al-Awwal','Rabi al-Thani',
  "Jumada al-Ula","Jumada al-Akhirah",'Rajab',"Sha'ban",
  'Ramadan','Shawwal','Dhu al-Qadah','Dhu al-Hijjah'
];
export const HIJRI_MONTHS_AR = [
  'مُحَرَّم','صَفَر','رَبِيعُ الأَوَّل','رَبِيعُ الآخِر',
  'جُمَادَى الأُولَى','جُمَادَى الآخِرَة','رَجَب','شَعْبَان',
  'رَمَضَان','شَوَّال','ذُو القَعْدَة','ذُو الحِجَّة'
];

export const ISLAMIC_EVENTS = {
  '1-1':  'Islamic New Year',
  '1-10': 'Day of Ashura',
  '3-12': 'Mawlid an-Nabi',
  '7-27': 'Laylat al-Miraj',
  '8-15': "Laylat al-Bara'at",
  '9-1':  'Ramadan begins',
  '9-21': 'Laylat al-Qadr (21st)',
  '9-23': 'Laylat al-Qadr (23rd)',
  '9-25': 'Laylat al-Qadr (25th)',
  '9-27': 'Laylat al-Qadr (27th)',
  '9-29': 'Laylat al-Qadr (29th)',
  '10-1': 'Eid ul-Fitr',
  '12-9': 'Day of Arafah',
  '12-10':'Eid ul-Adha',
};

// ── Modal helpers ────────────────────────────────────────
export function openModal(id) {
  const m = $(`#${id}`);
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
export function closeModal(id) {
  const m = $(`#${id}`);
  if (m) {
    m.classList.remove('open');
    document.body.style.overflow = '';
    m.querySelectorAll('.success-state').forEach(s => s.style.display = 'none');
  }
}

// ── Generate random ID ───────────────────────────────────
export const randId = (prefix = '') =>
  prefix + Math.floor(10000 + Math.random() * 90000);

// ── Debounce ─────────────────────────────────────────────
export function debounce(fn, ms = 250) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ── Format currency (BDT) ───────────────────────────────
export function fmtBDT(n) {
  const num = Number(n);
  if (num >= 10000000) return '৳' + (num / 10000000).toFixed(2) + ' Cr';
  if (num >= 100000)   return '৳' + (num / 100000).toFixed(2) + ' L';
  if (num >= 1000)     return '৳' + num.toLocaleString('en-BD');
  return '৳' + num;
}

// ── Copy to clipboard ────────────────────────────────────
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  } catch {
    showToast('Copy failed', 'error');
  }
}
