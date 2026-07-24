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
};

// Standalone top-level links (no group label) -- these get the more
// prominent, larger nav-link styling instead of the smaller grouped-item
// style.
const TOP_LINKS = ['#/home', '#/gameplan'];

const NAV_GROUPS = [
  { label: 'Sell', routes: ['#/conventions', '#/competitors', '#/clearance'] },
  { label: 'Research', routes: ['#/demand', '#/materials', '#/business', '#/timeline'] },
  { label: 'Reference', routes: ['#/shipping', '#/patterns', '#/seasonal', '#/copyright'] },
];

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

function router() {
  const route = ROUTES[window.location.hash] ? window.location.hash : '#/home';
  if (window.location.hash !== route) {
    window.location.hash = route;
    return;
  }
  setActiveNav(route);
  contentEl.innerHTML = '';
  ROUTES[route].view.render(contentEl, dashboardData);
  contentEl.scrollIntoView({ behavior: 'instant', block: 'start' });
  closeMobileNav();
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
