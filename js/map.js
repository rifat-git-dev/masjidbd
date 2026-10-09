/**
 * js/pages/map.js — Map Page Renderer
 * Renders the full map layout (sidebar + Leaflet container)
 * then delegates all Leaflet logic to js/map.js
 */

import { initMap } from '../map.js';
import { $ }       from '../utils.js';

let rendered = false;

/* ─────────────────────────────────────────────
   Public init — called by app.js router
───────────────────────────────────────────── */
export function initMapPage() {
  const page = $('#page-map');
  if (!page) return;

  if (!rendered) {
    page.innerHTML = buildMapLayout();
    rendered = true;
  }

  // Always (re)init Leaflet — the map must reinitialise on each page visit
  // because the container was hidden (display:none) while on another tab.
  requestAnimationFrame(() => {
    initMap();
  });
}

/* ─────────────────────────────────────────────
   HTML layout
───────────────────────────────────────────── */
function buildMapLayout() {
  return `
<div class="map-page-wrap">

  <!-- ── Sidebar ──────────────────────────── -->
  <aside class="map-sidebar" id="map-sidebar">

    <div class="map-sidebar-header">
      <h2 class="map-sidebar-title">🕌 Find a Mosque</h2>
      <p class="map-sidebar-sub">Search across all 64 districts of Bangladesh</p>
    </div>

    <!-- Search -->
    <div class="map-search-wrap">
      <svg class="map-search-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6"/>
        <path d="M13.5 13.5L17 17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
      <input
        id="mosque-search"
        class="map-search-input"
        type="search"
        placeholder="Search by name, district, imam…"
        autocomplete="off"
        aria-label="Search mosques"
      >
    </div>

    <!-- Filter chips -->
    <div class="map-filters" role="group" aria-label="Filter mosques">
      <button class="map-filter-chip active" data-map-filter="all">All</button>
      <button class="map-filter-chip" data-map-filter="juma">Juma</button>
      <button class="map-filter-chip" data-map-filter="women">Women's section</button>
      <button class="map-filter-chip" data-map-filter="parking">Parking</button>
      <button class="map-filter-chip" data-map-filter="disability">Disability access</button>
      <button class="map-filter-chip" data-map-filter="madrasah">Madrasah</button>
    </div>

    <!-- Result count -->
    <div class="map-result-meta">
      <span data-map-count>0</span> mosques found
    </div>

    <!-- Mosque list -->
    <ul class="mosque-list" id="mosque-list" aria-label="Mosque results">
      <li class="mosque-list-empty">
        <div class="mosque-list-spinner"></div>
        <p>Loading mosques…</p>
      </li>
    </ul>

    <!-- Detail panel (hidden until a marker/list-item is clicked) -->
    <div class="mosque-detail" id="mosque-detail" hidden>
      <!-- Populated by map.js -->
    </div>

  </aside>

  <!-- ── Map controls ──────────────────────── -->
  <div class="map-controls">
    <button class="map-ctrl-btn" id="map-locate-btn" title="Go to my location" aria-label="Locate me">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
        <circle cx="12" cy="12" r="8" stroke-dasharray="4 2"/>
      </svg>
    </button>
    <button class="map-ctrl-btn" id="map-bd-btn" title="Zoom to Bangladesh" aria-label="Zoom to Bangladesh">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M3 15h18M9 3v18"/>
      </svg>
    </button>
  </div>

  <!-- ── Leaflet map container ─────────────── -->
  <!-- id="leaflet-map" is referenced by js/map.js and L.map('leaflet-map', …) -->
  <div id="leaflet-map" class="leaflet-map-container" aria-label="Interactive mosque map"></div>

</div>
`;
}
