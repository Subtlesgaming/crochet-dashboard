/** Small shared rendering helpers used by every view. */
import { isStarred, toggleStarred } from './starTracker.js';

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function confidenceBadge(level) {
  if (!level) return '';
  const lower = level.toLowerCase();
  let cls = 'tag';
  if (lower.startsWith('low')) cls = 'confidence-low';
  else if (lower.startsWith('medium')) cls = 'confidence-medium';
  else if (lower.startsWith('high')) cls = 'confidence-high';
  return `<span class="badge badge-${cls}" title="Confidence level">${escapeHtml(level)}</span>`;
}

export function fitTagBadges(tags) {
  if (!tags || !tags.length) return '';
  return tags
    .map((t) => {
      const strong = t === 'strong-fit';
      return `<span class="badge ${strong ? 'badge-strong-fit' : 'badge-tag'}">${escapeHtml(t)}</span>`;
    })
    .join(' ');
}

export function categoryBadge(category) {
  if (!category) return '';
  return `<span class="badge badge-category badge-cat-${escapeHtml(category)}">${escapeHtml(category)}</span>`;
}

export function makeSelect(id, label, options) {
  const opts = options.map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join('');
  return `
    <label class="filter-field" for="${id}">
      <span>${escapeHtml(label)}</span>
      <select id="${id}">${opts}</select>
    </label>
  `;
}

const BARRIER_CLASS = {
  'low': 'confidence-high',
  'low-medium': 'confidence-medium',
  'medium': 'confidence-medium',
  'medium-high': 'confidence-low',
  'high': 'confidence-low',
};

export function barrierBadge(level) {
  if (!level) return '';
  const key = level.toLowerCase().split(' ')[0];
  const cls = BARRIER_CLASS[key] || 'tag';
  return `<span class="badge badge-${cls}" title="Estimated barrier to entry">${escapeHtml(level)} barrier</span>`;
}

function confidenceClass(level) {
  const lower = (level || '').toLowerCase();
  if (lower.startsWith('high')) return 'conf-high';
  if (lower.startsWith('medium')) return 'conf-medium';
  if (lower.startsWith('low')) return 'conf-low';
  return 'conf-unknown';
}

const CONFIDENCE_GROUPS = [
  { key: 'conf-high', label: 'High Confidence', tier: 'high' },
  { key: 'conf-medium', label: 'Medium Confidence', tier: 'medium' },
  { key: 'conf-low', label: 'Low Confidence & Data Gaps', tier: 'low' },
  { key: 'conf-unknown', label: 'Low Confidence & Data Gaps', tier: 'low' },
];

function findingRowHtml(f) {
  const starred = isStarred(f.finding);
  return `
    <div class="finding-row-wrap" data-starred="${starred}">
      <button type="button" class="star-toggle ${starred ? 'starred' : ''}" data-star-key="${escapeHtml(f.finding)}" aria-label="${starred ? 'Unmark as important' : 'Mark as important'}" title="${starred ? 'Unmark as important' : 'Mark as important'}">${starred ? '&#9733;' : '&#9734;'}</button>
      <details class="finding-row ${confidenceClass(f.confidence)}">
        <summary>
          <span class="finding-text">${escapeHtml(f.finding)}</span>
          <span class="finding-side">
            <span class="finding-dot"></span>
            <span class="finding-conf-label">${escapeHtml(f.confidence || 'Unknown')}</span>
            <span class="chevron"></span>
          </span>
        </summary>
        <div class="finding-source"><span class="finding-source-label">Source</span>${escapeHtml(f.source)}</div>
      </details>
    </div>
  `;
}

/**
 * Renders research findings ({finding, confidence, source}) as click-to-expand rows,
 * grouped under confidence sub-headers (High / Medium / Low & Data Gaps) so the most
 * solid findings surface first and long lists are easier to scan.
 */
export function findingList(items) {
  const list = items || [];
  const byClass = new Map();
  list.forEach((f) => {
    const cls = confidenceClass(f.confidence);
    if (!byClass.has(cls)) byClass.set(cls, []);
    byClass.get(cls).push(f);
  });

  // Merge conf-low + conf-unknown into one visual group, preserving relative order.
  const groups = [];
  CONFIDENCE_GROUPS.forEach(({ key, label, tier }) => {
    const items = byClass.get(key);
    if (!items || !items.length) return;
    let group = groups.find((g) => g.label === label);
    if (!group) {
      group = { label, tier, items: [] };
      groups.push(group);
    }
    group.items.push(...items);
  });

  return `
    <div class="finding-groups">
      ${groups.map((g) => `
        <div class="finding-group" data-tier="${g.tier}">
          <div class="finding-group-label">${escapeHtml(g.label)} <span class="finding-group-count">${g.items.length}</span></div>
          <div class="finding-list">${g.items.map(findingRowHtml).join('')}</div>
        </div>
      `).join('')}
    </div>
  `;
}

/** Renders a confidence filter chip row plus an independent "Starred Only" toggle. Pair with initConfidenceFilter(). */
export function confidenceFilterBar() {
  return `
    <div class="confidence-filter-bar">
      <button type="button" class="filter-chip active" data-filter="all">All</button>
      <button type="button" class="filter-chip" data-filter="high">High only</button>
      <button type="button" class="filter-chip" data-filter="medium">Medium &amp; up</button>
      <span class="filter-bar-divider"></span>
      <button type="button" class="filter-chip star-toggle-chip" data-starred-filter-toggle="1">&#9733; Starred Only<span class="star-count"></span></button>
    </div>
  `;
}

function applyFindingFilters(scopeEl) {
  const confFilter = scopeEl.dataset.confidenceFilter || 'all';
  const starredOnly = scopeEl.dataset.starredFilter === 'on';
  scopeEl.querySelectorAll('.finding-group').forEach((group) => {
    const tier = group.dataset.tier;
    const tierOk = confFilter === 'all' || (confFilter === 'high' && tier === 'high') || (confFilter === 'medium' && tier !== 'low');
    let anyVisible = false;
    group.querySelectorAll('.finding-row-wrap').forEach((wrap) => {
      const starred = wrap.dataset.starred === 'true';
      const visible = tierOk && (!starredOnly || starred);
      wrap.style.display = visible ? '' : 'none';
      if (visible) anyVisible = true;
    });
    group.style.display = anyVisible ? '' : 'none';
  });
}

function updateStarCount(scopeEl, starChip) {
  if (!starChip) return;
  const count = scopeEl.querySelectorAll('.finding-row-wrap[data-starred="true"]').length;
  const countEl = starChip.querySelector('.star-count');
  if (countEl) countEl.textContent = count ? ` (${count})` : '';
}

/**
 * Wires up a confidenceFilterBar(): confidence chips filter which .finding-group
 * tiers show, the Starred Only toggle filters to just starred rows, and clicking
 * any star toggles that finding's starred state -- all composable inside scopeEl.
 */
export function initConfidenceFilter(barEl, scopeEl) {
  if (!barEl || !scopeEl) return;
  const confChips = barEl.querySelectorAll('.filter-chip[data-filter]');
  const starChip = barEl.querySelector('[data-starred-filter-toggle]');

  confChips.forEach((btn) => {
    btn.addEventListener('click', () => {
      confChips.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      scopeEl.dataset.confidenceFilter = btn.dataset.filter;
      applyFindingFilters(scopeEl);
    });
  });

  if (starChip) {
    starChip.addEventListener('click', () => {
      const on = starChip.classList.toggle('active');
      scopeEl.dataset.starredFilter = on ? 'on' : 'off';
      applyFindingFilters(scopeEl);
    });
  }

  scopeEl.addEventListener('click', (e) => {
    const starBtn = e.target.closest('.star-toggle');
    if (!starBtn) return;
    const key = starBtn.dataset.starKey;
    const nowStarred = toggleStarred(key);
    const wrap = starBtn.closest('.finding-row-wrap');
    wrap.dataset.starred = String(nowStarred);
    starBtn.classList.toggle('starred', nowStarred);
    starBtn.textContent = nowStarred ? '★' : '☆';
    starBtn.title = nowStarred ? 'Unmark as important' : 'Mark as important';
    starBtn.setAttribute('aria-label', starBtn.title);
    updateStarCount(scopeEl, starChip);
    applyFindingFilters(scopeEl);
  });

  updateStarCount(scopeEl, starChip);
  applyFindingFilters(scopeEl);
}

export function makeCheckbox(id, label, { checked = false } = {}) {
  return `
    <label class="filter-field filter-field-checkbox" for="${id}">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} />
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

export function makeTextFilter(id, placeholder) {
  return `
    <label class="filter-field filter-field-text" for="${id}">
      <span class="sr-only">${escapeHtml(placeholder)}</span>
      <input type="search" id="${id}" placeholder="${escapeHtml(placeholder)}" />
    </label>
  `;
}
