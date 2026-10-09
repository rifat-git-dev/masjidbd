/* ═══════════════════════════════════════════════════════════
   MasjidBD v13 — Prayer Time Engine
   js/prayer-engine.js

   Full astronomical calculation — no external API needed.
   Algorithm: Jean Meeus "Astronomical Algorithms" + ISNA/IFB method.

   Method used: Islamic Foundation Bangladesh (IFB)
     Fajr angle : 15°
     Isha angle : 15°
     Madhab     : Shafi (Asr = 1× shadow)
     Timezone   : Asia/Dhaka (UTC+6)
   ═══════════════════════════════════════════════════════════ */

import { pad2, fmtTime, toMin } from './utils.js';

// ── City coordinates (divisional HQs) ───────────────────
export const CITIES = {
  dhaka:      { name: 'Dhaka',      lat: 23.7104, lng: 90.4074, tz: 6 },
  chittagong: { name: 'Chittagong', lat: 22.3569, lng: 91.7832, tz: 6 },
  rajshahi:   { name: 'Rajshahi',   lat: 24.3745, lng: 88.6042, tz: 6 },
  sylhet:     { name: 'Sylhet',     lat: 24.8949, lng: 91.8687, tz: 6 },
  khulna:     { name: 'Khulna',     lat: 22.8456, lng: 89.5403, tz: 6 },
  barishal:   { name: 'Barishal',   lat: 22.7010, lng: 90.3535, tz: 6 },
  mymensingh: { name: 'Mymensingh', lat: 24.7471, lng: 90.4203, tz: 6 },
  rangpur:    { name: 'Rangpur',    lat: 25.7439, lng: 89.2752, tz: 6 },
};

// ── IFB calculation method parameters ───────────────────
const IFB = {
  fajrAngle:   15,    // degrees below horizon
  ishaAngle:   15,    // degrees below horizon
  asrFactor:   1,     // 1 = Shafi, 2 = Hanafi
  highLat:     'NightMiddle',
};

// ── Degree/radian conversions ────────────────────────────
const rad  = d => d * Math.PI / 180;
const deg  = r => r * 180 / Math.PI;
const fixAngle  = a => a - 360 * Math.floor(a / 360);
const fixHour   = h => h - 24  * Math.floor(h / 24);

// ── Julian Day Number ────────────────────────────────────
function julianDay(year, month, day) {
  if (month <= 2) { year--; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) +
         Math.floor(30.6001 * (month + 1)) +
         day + B - 1524.5;
}

// ── Sun position (simplified Meeus, accurate to ~0.01°) ─
function sunPosition(jd) {
  const D  = jd - 2451545.0;        // days since J2000
  const g  = fixAngle(357.529 + 0.98560028 * D);   // mean anomaly
  const q  = fixAngle(280.459 + 0.98564736 * D);   // mean longitude
  const L  = fixAngle(q + 1.915 * Math.sin(rad(g)) + 0.020 * Math.sin(rad(2*g)));
  const e  = 23.439 - 0.00000036 * D;               // obliquity
  const RA = deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(L)), Math.cos(rad(L)))) / 15;
  const decl = deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(L))));
  const eqT  = q/15 - fixHour(RA);  // equation of time (hours)
  return { decl, eqT };
}

// ── Time for sun at given angle below/above horizon ─────
function sunAngleTime(jd, lat, lng, tz, angle, direction, decl, eqT) {
  const cosHour = (Math.cos(rad(angle)) -
                   Math.sin(rad(lat)) * Math.sin(rad(decl))) /
                  (Math.cos(rad(lat)) * Math.cos(rad(decl)));

  if (Math.abs(cosHour) > 1) return null; // never rises/sets

  const hour = deg(Math.acos(cosHour)) / 15;

  // direction: 'rise' or 'set'
  const noon = 12 + tz - lng/15 - eqT;
  return direction === 'rise' ? noon - hour : noon + hour;
}

// ── Midday (Dhuhr) ───────────────────────────────────────
function midday(jd, lng, tz, eqT) {
  return fixHour(12 + tz - lng/15 - eqT);
}

// ── Asr time (shadow = factor × height + noon shadow) ───
function asrTime(jd, lat, lng, tz, factor, decl, eqT) {
  const p = factor + Math.tan(rad(Math.abs(lat - decl)));
  const angle = -deg(Math.atan(1 / p));
  return sunAngleTime(jd, lat, lng, tz, angle, 'set', decl, eqT);
}

// ── Hours → [h, m] ──────────────────────────────────────
function hoursToHM(h) {
  if (h === null || isNaN(h)) return null;
  h = fixHour(h);
  const hr  = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  return min === 60 ? [hr + 1, 0] : [hr, min];
}

// ── Main: compute prayer times for a city + date ─────────
export function computePrayers(cityKey, date = new Date()) {
  const city = CITIES[cityKey] ?? CITIES.dhaka;
  const { lat, lng, tz } = city;

  const jd   = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const { decl, eqT } = sunPosition(jd);

  const fajrHours    = sunAngleTime(jd, lat, lng, tz, 90 + IFB.fajrAngle, 'rise', decl, eqT);
  const sunriseHours = sunAngleTime(jd, lat, lng, tz, 90.833, 'rise', decl, eqT);
  const dhuhrHours   = midday(jd, lng, tz, eqT);
  const asrHours     = asrTime(jd, lat, lng, tz, IFB.asrFactor, decl, eqT);
  const sunsetHours  = sunAngleTime(jd, lat, lng, tz, 90.833, 'set', decl, eqT);
  const ishaHours    = sunAngleTime(jd, lat, lng, tz, 90 + IFB.ishaAngle, 'set', decl, eqT);

  return {
    fajr:    hoursToHM(fajrHours),
    sunrise: hoursToHM(sunriseHours),
    dhuhr:   hoursToHM(dhuhrHours),
    asr:     hoursToHM(asrHours),
    maghrib: hoursToHM(sunsetHours),
    isha:    hoursToHM(ishaHours),
  };
}

// ── Prayer names & metadata ──────────────────────────────
export const PRAYER_META = {
  fajr:    { name: 'Fajr',    bn: 'ফজর',     ar: 'الفجر',   icon: '🌙', note: 'Dawn prayer' },
  sunrise: { name: 'Sunrise', bn: 'সূর্যোদয়', ar: 'الشروق', icon: '🌅', note: 'Makruh time', noIqamah: true },
  dhuhr:   { name: 'Dhuhr',   bn: 'যোহর',     ar: 'الظهر',  icon: '☀️', note: 'Midday prayer' },
  asr:     { name: 'Asr',     bn: 'আসর',      ar: 'العصر',  icon: '🌤️', note: 'Afternoon prayer' },
  maghrib: { name: 'Maghrib', bn: 'মাগরিব',   ar: 'المغرب', icon: '🌇', note: 'Sunset prayer' },
  isha:    { name: 'Isha',    bn: 'ইশা',      ar: 'العشاء', icon: '🌃', note: 'Night prayer' },
};

export const PRAYER_ORDER = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
export const SALAH_ORDER  = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];  // without sunrise

// ── Find next prayer ─────────────────────────────────────
export function nextPrayer(times) {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  for (const key of SALAH_ORDER) {
    if (times[key] && toMin(times[key]) > nowMin) return key;
  }
  return 'fajr'; // tomorrow's fajr
}

// ── Seconds until next prayer ────────────────────────────
export function secsUntil(times, key) {
  const now = new Date();
  const nowSec = now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds();
  if (!times[key]) return null;
  let targetSec = toMin(times[key]) * 60;
  if (targetSec <= nowSec) targetSec += 86400; // tomorrow
  return targetSec - nowSec;
}

// ── Iqamah = Adhan + 15 min ──────────────────────────────
export function iqamah([h, m]) {
  const total = h * 60 + m + 15;
  return [Math.floor(total / 60) % 24, total % 60];
}

// ── 64 Zilla offsets (minutes relative to Dhaka) ─────────
// Positive = later than Dhaka, Negative = earlier
// Order: [fajr, sunrise, dhuhr, asr, maghrib, isha]
export const ZILLA_OFFSETS = [
  // DHAKA DIVISION
  { z:'Dhaka',             bn:'ঢাকা',             div:'Dhaka',      hq:true,  off:[0,0,0,0,0,0]   },
  { z:'Gazipur',           bn:'গাজীপুর',           div:'Dhaka',      hq:false, off:[0,1,0,0,0,0]   },
  { z:'Narayanganj',       bn:'নারায়ণগঞ্জ',       div:'Dhaka',      hq:false, off:[0,2,0,2,2,2]   },
  { z:'Narsingdi',         bn:'নরসিংদী',           div:'Dhaka',      hq:false, off:[-2,0,-2,-2,-2,-2]},
  { z:'Manikganj',         bn:'মানিকগঞ্জ',         div:'Dhaka',      hq:false, off:[1,-1,1,1,1,1]  },
  { z:'Munshiganj',        bn:'মুন্সিগঞ্জ',        div:'Dhaka',      hq:false, off:[0,1,0,0,0,0]   },
  { z:'Shariatpur',        bn:'শরিয়তপুর',         div:'Dhaka',      hq:false, off:[2,2,2,2,2,2]   },
  { z:'Madaripur',         bn:'মাদারীপুর',         div:'Dhaka',      hq:false, off:[3,3,3,3,3,3]   },
  { z:'Gopalganj',         bn:'গোপালগঞ্জ',         div:'Dhaka',      hq:false, off:[4,4,4,4,4,4]   },
  { z:'Faridpur',          bn:'ফরিদপুর',           div:'Dhaka',      hq:false, off:[4,4,4,4,4,4]   },
  { z:'Rajbari',           bn:'রাজবাড়ী',           div:'Dhaka',      hq:false, off:[4,4,4,4,4,4]   },
  { z:'Kishoreganj',       bn:'কিশোরগঞ্জ',         div:'Dhaka',      hq:false, off:[-3,-2,-3,-3,-3,-3]},
  { z:'Tangail',           bn:'টাঙ্গাইল',          div:'Dhaka',      hq:false, off:[2,1,2,2,2,2]   },
  // CHITTAGONG DIVISION
  { z:'Chittagong',        bn:'চট্টগ্রাম',         div:'Chittagong', hq:true,  off:[-4,-5,-4,-3,-4,-5]},
  { z:"Cox's Bazar",       bn:'কক্সবাজার',         div:'Chittagong', hq:false, off:[-6,-7,-6,-5,-6,-7]},
  { z:'Rangamati',         bn:'রাঙ্গামাটি',        div:'Chittagong', hq:false, off:[-5,-6,-5,-4,-5,-6]},
  { z:'Bandarban',         bn:'বান্দরবান',         div:'Chittagong', hq:false, off:[-5,-6,-5,-4,-5,-6]},
  { z:'Khagrachari',       bn:'খাগড়াছড়ি',        div:'Chittagong', hq:false, off:[-5,-6,-5,-4,-5,-6]},
  { z:'Feni',              bn:'ফেনী',              div:'Chittagong', hq:false, off:[-3,-4,-3,-2,-3,-4]},
  { z:'Noakhali',          bn:'নোয়াখালী',         div:'Chittagong', hq:false, off:[-2,-3,-2,-1,-2,-3]},
  { z:'Lakshmipur',        bn:'লক্ষ্মীপুর',        div:'Chittagong', hq:false, off:[-2,-3,-2,-1,-2,-3]},
  { z:'Comilla',           bn:'কুমিল্লা',          div:'Chittagong', hq:false, off:[-1,-2,-1,0,-1,-2] },
  { z:'Chandpur',          bn:'চাঁদপুর',           div:'Chittagong', hq:false, off:[0,-1,0,1,0,-1]  },
  { z:'Brahmanbaria',      bn:'ব্রাহ্মণবাড়িয়া',  div:'Chittagong', hq:false, off:[-2,-3,-2,-1,-2,-3]},
  // RAJSHAHI DIVISION
  { z:'Rajshahi',          bn:'রাজশাহী',           div:'Rajshahi',   hq:true,  off:[6,7,6,6,6,6]   },
  { z:'Chapai Nawabganj',  bn:'চাঁপাইনবাবগঞ্জ',   div:'Rajshahi',   hq:false, off:[8,9,8,8,8,8]   },
  { z:'Natore',            bn:'নাটোর',             div:'Rajshahi',   hq:false, off:[5,6,5,5,5,5]   },
  { z:'Naogaon',           bn:'নওগাঁ',             div:'Rajshahi',   hq:false, off:[5,6,5,5,5,5]   },
  { z:'Bogura',            bn:'বগুড়া',             div:'Rajshahi',   hq:false, off:[4,5,4,4,4,4]   },
  { z:'Joypurhat',         bn:'জয়পুরহাট',         div:'Rajshahi',   hq:false, off:[4,5,4,4,4,4]   },
  { z:'Sirajganj',         bn:'সিরাজগঞ্জ',         div:'Rajshahi',   hq:false, off:[3,4,3,3,3,3]   },
  { z:'Pabna',             bn:'পাবনা',             div:'Rajshahi',   hq:false, off:[3,4,3,3,3,3]   },
  // KHULNA DIVISION
  { z:'Khulna',            bn:'খুলনা',             div:'Khulna',     hq:true,  off:[4,5,4,4,4,4]   },
  { z:'Satkhira',          bn:'সাতক্ষীরা',         div:'Khulna',     hq:false, off:[7,8,7,7,7,7]   },
  { z:'Bagerhat',          bn:'বাগেরহাট',          div:'Khulna',     hq:false, off:[5,6,5,5,5,5]   },
  { z:'Jessore',           bn:'যশোর',              div:'Khulna',     hq:false, off:[5,6,5,5,5,5]   },
  { z:'Narail',            bn:'নড়াইল',             div:'Khulna',     hq:false, off:[4,5,4,4,4,4]   },
  { z:'Magura',            bn:'মাগুরা',            div:'Khulna',     hq:false, off:[3,4,3,3,3,3]   },
  { z:'Jhenaidah',         bn:'ঝিনাইদহ',          div:'Khulna',     hq:false, off:[4,5,4,4,4,4]   },
  { z:'Chuadanga',         bn:'চুয়াডাঙ্গা',        div:'Khulna',     hq:false, off:[5,6,5,5,5,5]   },
  { z:'Meherpur',          bn:'মেহেরপুর',          div:'Khulna',     hq:false, off:[6,7,6,6,6,6]   },
  { z:'Kushtia',           bn:'কুষ্টিয়া',          div:'Khulna',     hq:false, off:[4,5,4,4,4,4]   },
  // BARISHAL DIVISION
  { z:'Barishal',          bn:'বরিশাল',            div:'Barishal',   hq:true,  off:[2,3,2,2,2,2]   },
  { z:'Patuakhali',        bn:'পটুয়াখালী',        div:'Barishal',   hq:false, off:[2,3,2,2,2,2]   },
  { z:'Barguna',           bn:'বরগুনা',            div:'Barishal',   hq:false, off:[3,4,3,3,3,3]   },
  { z:'Pirojpur',          bn:'পিরোজপুর',          div:'Barishal',   hq:false, off:[4,5,4,4,4,4]   },
  { z:'Jhalokati',         bn:'ঝালকাঠি',          div:'Barishal',   hq:false, off:[3,4,3,3,3,3]   },
  { z:'Bhola',             bn:'ভোলা',             div:'Barishal',   hq:false, off:[0,1,0,0,0,0]   },
  // SYLHET DIVISION
  { z:'Sylhet',            bn:'সিলেট',             div:'Sylhet',     hq:true,  off:[-7,-8,-7,-7,-7,-7]},
  { z:'Moulvibazar',       bn:'মৌলভীবাজার',       div:'Sylhet',     hq:false, off:[-6,-7,-6,-6,-6,-6]},
  { z:'Habiganj',          bn:'হবিগঞ্জ',           div:'Sylhet',     hq:false, off:[-5,-6,-5,-5,-5,-5]},
  { z:'Sunamganj',         bn:'সুনামগঞ্জ',        div:'Sylhet',     hq:false, off:[-6,-7,-6,-6,-6,-6]},
  // MYMENSINGH DIVISION
  { z:'Mymensingh',        bn:'ময়মনসিংহ',         div:'Mymensingh', hq:true,  off:[-1,-1,-1,-1,-1,-1]},
  { z:'Sherpur',           bn:'শেরপুর',            div:'Mymensingh', hq:false, off:[0,-1,0,0,0,0]   },
  { z:'Jamalpur',          bn:'জামালপুর',          div:'Mymensingh', hq:false, off:[1,0,1,1,1,1]   },
  { z:'Netrokona',         bn:'নেত্রকোণা',        div:'Mymensingh', hq:false, off:[-2,-3,-2,-2,-2,-2]},
  // RANGPUR DIVISION
  { z:'Rangpur',           bn:'রংপুর',             div:'Rangpur',    hq:true,  off:[8,9,8,8,8,8]   },
  { z:'Dinajpur',          bn:'দিনাজপুর',          div:'Rangpur',    hq:false, off:[9,10,9,9,9,9]   },
  { z:'Thakurgaon',        bn:'ঠাকুরগাঁও',        div:'Rangpur',    hq:false, off:[9,10,9,9,9,9]   },
  { z:'Panchagarh',        bn:'পঞ্চগড়',           div:'Rangpur',    hq:false, off:[10,11,10,10,10,10]},
  { z:'Nilphamari',        bn:'নীলফামারী',        div:'Rangpur',    hq:false, off:[8,9,8,8,8,8]   },
  { z:'Lalmonirhat',       bn:'লালমনিরহাট',       div:'Rangpur',    hq:false, off:[7,8,7,7,7,7]   },
  { z:'Kurigram',          bn:'কুড়িগ্রাম',        div:'Rangpur',    hq:false, off:[6,7,6,6,6,6]   },
  { z:'Gaibandha',         bn:'গাইবান্ধা',        div:'Rangpur',    hq:false, off:[5,6,5,5,5,5]   },
];

// ── Apply offset to a base time [h, m] ───────────────────
export function applyOffset([h, m], offsetMin) {
  const total = h * 60 + m + offsetMin;
  const wrapped = ((total % 1440) + 1440) % 1440;
  return [Math.floor(wrapped / 60), wrapped % 60];
}

// ── Get times for a zilla using Dhaka as base ────────────
export function zillaTimesFromBase(dhakaTimes, offsets) {
  const keys = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const result = {};
  keys.forEach((k, i) => {
    result[k] = dhakaTimes[k] ? applyOffset(dhakaTimes[k], offsets[i]) : null;
  });
  return result;
}
