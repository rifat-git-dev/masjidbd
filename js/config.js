/* ═══════════════════════════════════════════════════════════
   MasjidBD v13 — Config & Service Initialisation
   js/config.js
   All API clients initialised here. Import this first.
   ═══════════════════════════════════════════════════════════ */

// ── Environment — injected by Cloudflare Pages ───────────
// In development: window.__ENV is set via a <script> block in index.html or wrangler.
// In production: Cloudflare Pages → Settings → Environment Variables.
//
// IMPORTANT: CHAT_WORKER_URL is the URL of the Cloudflare Worker that proxies
// calls to the Gemini API. The Gemini API key NEVER appears in browser code.
// Default '' means the Worker is on the same origin at /api/chat.
export const ENV = {
  SUPABASE_URL:      window.__ENV?.SUPABASE_URL      ?? '',
  SUPABASE_ANON_KEY: window.__ENV?.SUPABASE_ANON_KEY ?? '',
  CLERK_PUBLISHABLE: window.__ENV?.CLERK_PUBLISHABLE ?? '',
  NOVU_API_KEY:      window.__ENV?.NOVU_API_KEY      ?? '',

  // URL for the chat proxy Worker.
  // Blank = same origin /api/chat (Cloudflare Pages serves it automatically).
  // Set to an external Worker URL if you host the Worker separately.
  CHAT_WORKER_URL:   window.__ENV?.CHAT_WORKER_URL   ?? '',
};

// ── Supabase client ──────────────────────────────────────
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export let supabase = null;

export function initSupabase() {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
    console.warn('[MasjidBD] Supabase not configured — running in demo mode');
    return null;
  }
  supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);
  console.log('[MasjidBD] Supabase connected');
  return supabase;
}

// ── Feature flags ────────────────────────────────────────
export const FEATURES = {
  supabase:      !!ENV.SUPABASE_URL,
  auth:          !!ENV.CLERK_PUBLISHABLE,
  chat:          true,          // Worker-based — always available in demo mode
  notifications: !!ENV.NOVU_API_KEY,
  map:           true,          // Leaflet + OSM, no key needed
  prayerCalc:    true,          // Pure JS sun-position formula, no key needed
};

// ── App-wide constants ───────────────────────────────────
export const APP = {
  name:         'MasjidBD',
  version:      '13.0',
  supportEmail: 'support@masjidbd.gov.bd',
  govWebsite:   'https://mora.gov.bd',
  helpline:     '16789',
  defaultCity:  'dhaka',
};

// ── Cloudflare Worker API base ───────────────────────────
// Dev:  http://localhost:8788  (wrangler dev)
// Prod: '' — same origin; Cloudflare Pages serves /api/* from Workers
export const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:8788'
  : '';

// ── Helper: fetch from our own Worker API ────────────────
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}/api${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `API error ${res.status}`);
  }
  return res.json();
}
