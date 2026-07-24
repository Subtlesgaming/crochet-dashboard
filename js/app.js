import { loadDashboardData } from './dataSource.js';
import { buildSearchIndex, searchIndex } from './search.js';
import { escapeHtml } from './ui.js';
import { getUpcomingConventions, daysUntilLabel } from './dates.js';

import * as homeView from './views/home.js';
import * as gamePlanView from './views/gamePlan.js';
import * as conventionsView from './views/conventions.js';
import * as competitorsView from './views/competitors.js';
import { demandView, materialsView, businessView } from './views/researchPage.js';
import * as shippingView from './views/shipping.js';
import * as patternsView from './views/patterns.js';
import * as seasonalView from './views/seasonal.js';
import * as timelineView from './views/timeline.js';
import * as clearanceView from './views/clearance.js';
import * as copyrightView from './views/copyright.js';
import * as inventoryView from './views/inventory.js';
import * as salesLogView from './views/salesLog.js';
import { renderLogin } from './views/login.js';
import { getCurrentUser, onAuthChange } from './trackerAuth.js';

const ROUTES = {
  '#/home': { label: 'Home', view: homeView },
  '#/gameplan': { label: 'Game Plan', view: gamePlanView },
  '#/conventions': { label: 'Conventions', view: conventionsView },
  '#/competitors': { label: 'Competitors', view: competitorsView },
  '#/clearance': { label: 'Clearance', view: clearanceView },
  '#/demand': { label: 'Product Demand', view: demandView },
  '#/materials': { label: 'Materials', view: materialsView },
  '#/business': { label: 'Business Setup', view: businessView },
  '#/timeline': { label: 'Historical Trends', view: timelineView },
  '#/shipping': { label: 'Shipping', view: shippingView },
  '#/patterns': { label: 'Digital Patterns', view: patternsView },
  '#/seasonal': { label: 'Seasonal Cycle', view: seasonalView },
  '#/copyright': { label: 'Copyright', view: copyrightView },
  '#/inventory': { label: 'Inventory', view: inventoryView },
  '#/sales': { label: 'Sales Log', view: salesLogView },
};

// Standalone top-level links (no group label) -- these get the more
// prominent, larger nav-link styling instead of the smaller grouped-item
// style, so Inventory/Sales Log read as top-priority rather than tucked
// under a collapsible section.
const TOP_LINKS = ['#/home', '#/gameplan', '#/inventory', '#/sales'];

const NAV_GROUPS = [
  { label: 'Sell', routes: ['#/conventions', '#/competitors', '#/clearance'] },
  { label: 'Research', routes: ['#/demand', '#/materials', '#/business', '#/timeline'] },
  { label: 'Reference', routes: ['#/shipping', '#/patterns', '#/seasonal', '#/copyright'] },
];

// Firebase Auth's session/state resolution never fires under file:// (confirmed
// by isolated testing: every setup step succeeds except onAuthStateChanged's
// callback, which just never runs, even after 20+ seconds) -- so the offline
// single-file build can't use the login gate at all. It skips the gate
// entirely except for the two Tracker pages, which can't work offline
// regardless of protocol (no live backend to talk to).
const isFileProtocol = window.location.protocol === 'file:';
const OFFLINE_UNAVAILABLE_ROUTES = ['#/inventory', '#/sales'];
const LIVE_SITE_URL = 'https://subtlesgaming.github.io/crochet-dashboard/';

const navEl = document.getElementById('sidebar-nav');
const contentEl = document.getElementById('content');
const searchInput = document.getElementById('global-search');
const searchResultsEl = document.getElementById('search-results');
const tickerEl = document.getElementById('ticker');
const tickerTextEl = document.getElementById('ticker-text');
const sidebarEl = document.getElementById('sidebar');
const navToggleEl = document.getElementById('nav-toggle');
const backdropEl = document.getElementById('mobile-backdrop');

let dashboardData = null;
let searchIdx = null;
let searchResultsList = [];
let activeIndex = -1;
let activeView = null;
let authReady = false;

function renderNav() {
  const groupsHtml = NAV_GROUPS.map((group) => `
    <div class="nav-group">
      <div class="nav-group-label">${escapeHtml(group.label)}</div>
      ${group.routes.map((route) => `<a href="${route}" class="nav-link" data-route="${route}">${escapeHtml(ROUTES[route].label)}</a>`).join('')}
    </div>
  `).join('');

  const topLinksHtml = TOP_LINKS.map((route) => {
    const gameplanClass = route === '#/gameplan' ? ' nav-link-gameplan' : '';
    return `<a href="${route}" class="nav-link${gameplanClass}" data-route="${route}">${escapeHtml(ROUTES[route].label)}</a>`;
  }).join('');

  navEl.innerHTML = `${topLinksHtml}${groupsHtml}`;
}

function setActiveNav(route) {
  navEl.querySelectorAll('.nav-link').forEach((a) => {
    const isActive = a.dataset.route === route;
    a.classList.toggle('active', isActive);
    if (isActive) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function closeMobileNav() {
  sidebarEl.classList.remove('open');
  backdropEl.classList.remove('open');
  navToggleEl.setAttribute('aria-expanded', 'false');
}

function renderRoute(route) {
  document.body.classList.remove('gate-active');
  setActiveNav(route);
  activeView = ROUTES[route].view;
  contentEl.innerHTML = '';
  activeView.render(contentEl, dashboardData);
  contentEl.scrollIntoView({ behavior: 'instant', block: 'start' });
  closeMobileNav();
}

function renderOfflineUnavailable(route) {
  document.body.classList.remove('gate-active');
  setActiveNav(route);
  contentEl.innerHTML = `
    <h1>${escapeHtml(ROUTES[route].label)}</h1>
    <section class="panel panel-warning">
      <h2 class="warning-heading">Not available in the offline copy</h2>
      <p class="card-note">Firebase sign-in needs a live internet connection and doesn't resolve when this
        dashboard is opened directly from a file -- open the live site instead:
        <a href="${LIVE_SITE_URL}" target="_blank" rel="noopener">${LIVE_SITE_URL}</a></p>
    </section>
  `;
  closeMobileNav();
}

/**
 * The whole dashboard sits behind one login gate -- not just the Tracker
 * pages -- since it's meant to be a private site once deployed. This runs
 * before any route's view renders, so no view needs its own auth check.
 *
 * Exception: the offline single-file build (opened via file://) skips the
 * gate entirely except for the two Tracker routes -- see isFileProtocol above.
 */
function router() {
  const route = ROUTES[window.location.hash] ? window.location.hash : '#/home';
  if (window.location.hash !== route) {
    window.location.hash = route;
    return;
  }

  if (activeView?.cleanup) activeView.cleanup();
  activeView = null;

  if (isFileProtocol) {
    if (OFFLINE_UNAVAILABLE_ROUTES.includes(route)) renderOfflineUnavailable(route);
    else renderRoute(route);
    return;
  }

  if (!authReady) {
    document.body.classList.add('gate-active');
    contentEl.innerHTML = '<p class="loading-note">Checking session&hellip;</p>';
    return;
  }

  if (!getCurrentUser()) {
    document.body.classList.add('gate-active');
    contentEl.innerHTML = '';
    renderLogin(contentEl);
    return;
  }

  renderRoute(route);
}

/* --- Persistent "next event" ticker --- */
function renderTicker() {
  const next = getUpcomingConventions(dashboardData.conventions || [], { limit: 1 })[0];
  if (!next) {
    tickerEl.hidden = true;
    return;
  }
  tickerEl.hidden = false;
  tickerTextEl.textContent = `Next up: ${next.name} · ${daysUntilLabel(next.days)}`;
}

/* --- Global search with keyboard navigation --- */
function updateActiveDescendant() {
  const items = searchResultsEl.querySelectorAll('.search-result');
  items.forEach((el, i) => {
    el.classList.toggle('active', i === activeIndex);
    if (i === activeIndex) {
      searchInput.setAttribute('aria-activedescendant', el.id);
      el.scrollIntoView({ block: 'nearest' });
    }
  });
  if (activeIndex === -1) searchInput.removeAttribute('aria-activedescendant');
}

function renderSearchResults(query) {
  activeIndex = -1;
  if (!query.trim()) {
    searchResultsEl.hidden = true;
    searchResultsEl.innerHTML = '';
    searchResultsList = [];
    return;
  }
  searchResultsList = searchIndex(searchIdx, query);
  searchResultsEl.hidden = false;
  searchResultsEl.innerHTML = searchResultsList.length
    ? searchResultsList.map((r, i) => `
        <a class="search-result" id="search-result-${i}" role="option" href="${r.route}">
          <span class="search-result-section">${escapeHtml(r.section)}</span>
          <span class="search-result-title">${escapeHtml(r.title)}</span>
          ${r.subtitle ? `<span class="search-result-subtitle">${escapeHtml(r.subtitle)}</span>` : ''}
        </a>
      `).join('')
    : '<div class="search-result search-result-empty">No matches in the archive.</div>';
}

function closeSearch() {
  searchResultsEl.hidden = true;
  searchResultsEl.innerHTML = '';
  searchResultsList = [];
  activeIndex = -1;
  searchInput.removeAttribute('aria-activedescendant');
}

function initSearch() {
  searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
  searchInput.addEventListener('focus', (e) => {
    if (e.target.value.trim()) renderSearchResults(e.target.value);
  });
  searchInput.addEventListener('keydown', (e) => {
    if (!searchResultsList.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, searchResultsList.length - 1);
      updateActiveDescendant();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, -1);
      updateActiveDescendant();
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      window.location.hash = searchResultsList[activeIndex].route;
      searchInput.value = '';
      closeSearch();
    } else if (e.key === 'Escape') {
      closeSearch();
      searchInput.blur();
    }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sidebar-search')) closeSearch();
  });
  searchResultsEl.addEventListener('click', () => {
    searchInput.value = '';
    closeSearch();
  });
}

function initMobileNav() {
  navToggleEl.addEventListener('click', () => {
    const open = sidebarEl.classList.toggle('open');
    backdropEl.classList.toggle('open', open);
    navToggleEl.setAttribute('aria-expanded', String(open));
  });
  backdropEl.addEventListener('click', closeMobileNav);
}

async function init() {
  renderNav();
  initMobileNav();
  try {
    dashboardData = await loadDashboardData();
  } catch (err) {
    contentEl.innerHTML = `<section class="panel"><h1>Couldn't load data</h1><p class="empty-note">${escapeHtml(err.message)}</p></section>`;
    return;
  }
  searchIdx = buildSearchIndex(dashboardData);
  initSearch();
  renderTicker();
  window.addEventListener('hashchange', router);
  if (!isFileProtocol) {
    onAuthChange(() => {
      authReady = true;
      router();
    });
  }
  router();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // Installability is a nice-to-have -- a failed registration shouldn't block the app.
    });
  });
}

init();
