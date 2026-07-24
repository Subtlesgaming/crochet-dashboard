import { daysUntil, daysUntilLabel, formatDateRange } from '../dates.js';
import { escapeHtml, fitTagBadges, categoryBadge, confidenceBadge, barrierBadge, makeSelect, makeTextFilter, makeCheckbox } from '../ui.js';
import { isApplied, toggleApplied, getAppliedNames } from '../appliedTracker.js';

const BARRIER_ORDER = { low: 0, 'low-medium': 1, medium: 2, 'medium-high': 3, high: 4, unknown: 5 };

function barrierRank(costData) {
  if (!costData?.barrierLevel) return 6;
  const key = costData.barrierLevel.toLowerCase().split(' ')[0];
  return BARRIER_ORDER[key] ?? 5;
}

export function render(container, data) {
  const conventions = data.conventions || [];
  const categories = [...new Set(conventions.map((c) => c.category))].sort();
  const fitTags = [...new Set(conventions.flatMap((c) => c.fitTags || []))].sort();

  let activeTab = 'all';

  container.innerHTML = `
    <h1>Convention Calendar</h1>
    <div class="view-tabs">
      <button type="button" class="view-tab active" data-tab="all">All Conventions</button>
      <button type="button" class="view-tab" data-tab="applied">My Applications <span class="view-tab-count" id="applied-count">0</span></button>
    </div>
    <div class="filter-bar">
      ${makeTextFilter('conv-search', 'Search conventions...')}
      ${makeSelect('conv-category', 'Category', [{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))])}
      ${makeSelect('conv-fit', 'Fit tag', [{ value: '', label: 'All fit tags' }, ...fitTags.map((t) => ({ value: t, label: t }))])}
      ${makeSelect('conv-sort', 'Sort', [
        { value: 'date-asc', label: 'Date (soonest first)' },
        { value: 'date-desc', label: 'Date (latest first)' },
        { value: 'name', label: 'Name (A-Z)' },
        { value: 'barrier-asc', label: 'Barrier to entry (lowest first)' },
      ])}
      ${makeCheckbox('conv-hide-past', 'Hide past events', { checked: true })}
    </div>
    <div id="conv-count" class="results-count"></div>
    <div id="conv-results" class="card-grid"></div>
  `;

  const tabEls = container.querySelectorAll('.view-tab');
  const appliedCountEl = container.querySelector('#applied-count');
  const searchEl = container.querySelector('#conv-search');
  const catEl = container.querySelector('#conv-category');
  const fitEl = container.querySelector('#conv-fit');
  const sortEl = container.querySelector('#conv-sort');
  const hidePastEl = container.querySelector('#conv-hide-past');
  const resultsEl = container.querySelector('#conv-results');
  const countEl = container.querySelector('#conv-count');

  function updateAppliedCount() {
    const applied = getAppliedNames();
    const count = conventions.filter((c) => applied.has(c.name)).length;
    appliedCountEl.textContent = String(count);
  }

  function apply() {
    const q = searchEl.value.trim().toLowerCase();
    const cat = catEl.value;
    const fit = fitEl.value;
    const sort = sortEl.value;
    const hidePast = hidePastEl.checked;

    let list = conventions
      .map((c) => ({ ...c, days: daysUntil(c.startDate) }))
      .filter((c) => {
        if (activeTab === 'applied' && !isApplied(c.name)) return false;
        if (hidePast && c.days !== null && c.days < 0) return false;
        if (cat && c.category !== cat) return false;
        if (fit && !(c.fitTags || []).includes(fit)) return false;
        if (q) {
          const hay = `${c.name} ${c.location} ${c.note}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

    list = list.slice().sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'barrier-asc') return barrierRank(a.costData) - barrierRank(b.costData);
      const da = a.startDate || '9999';
      const db = b.startDate || '9999';
      return sort === 'date-desc' ? db.localeCompare(da) : da.localeCompare(db);
    });

    countEl.textContent = `${list.length} convention${list.length === 1 ? '' : 's'}`;
    resultsEl.innerHTML = list.length
      ? list.map((c) => cardHtml(c)).join('')
      : `<p class="empty-note">${activeTab === 'applied' ? "You haven't marked any conventions as applied yet -- open a card's Vendor Details and hit \"Mark as Applied.\"" : 'No conventions match those filters.'}</p>`;
    updateAppliedCount();
  }

  function cardHtml(c) {
    const strong = (c.fitTags || []).includes('strong-fit');
    const isPast = c.days !== null && c.days < 0;
    const cost = c.costData;
    const applied = isApplied(c.name);
    const hasDetails = !!(cost || c.applicationWindow);
    return `
      <article class="card ${strong ? 'card-strong-fit' : ''} ${isPast ? 'card-past' : ''} ${applied ? 'card-applied' : ''}">
        <div class="card-header">
          <h3>${escapeHtml(c.name)}</h3>
          ${categoryBadge(c.category)}
        </div>
        <div class="card-meta">${escapeHtml(c.location)} &middot; ${escapeHtml(c.scale || '')}</div>
        <div class="card-meta">${escapeHtml(formatDateRange(c.startDate, c.endDate))}${c.recurrence ? ' (' + escapeHtml(c.recurrence) + ')' : ''}</div>
        <div class="days-badge">${c.startDate ? daysUntilLabel(c.days) : 'Date TBD'}</div>
        <div class="card-tags">${fitTagBadges(c.fitTags)}</div>
        <p class="card-note">${escapeHtml(c.note)}</p>
        <button type="button" class="applied-toggle ${applied ? 'applied' : ''}" data-name="${escapeHtml(c.name)}">
          ${applied ? '&#10003; Applied' : '+ Mark as Applied'}
        </button>
        ${hasDetails ? `
          <details class="vendor-details">
            <summary><span>Vendor Details</span><span class="chevron"></span></summary>
            <div class="vendor-details-body">
              ${cost ? `
                <div class="vendor-details-row">
                  <strong>${escapeHtml(cost.tableCost)}</strong>
                  ${barrierBadge(cost.barrierLevel)}
                </div>
                <div class="vendor-details-tags">
                  ${cost.juryRequired === true ? '<span class="badge badge-tag">Jury/application required</span>' : ''}
                  ${cost.juryRequired === false ? '<span class="badge badge-confirmed">No jury required</span>' : ''}
                  ${cost.attendanceEstimate ? `<span class="badge badge-tag">${escapeHtml(cost.attendanceEstimate)} attendance</span>` : ''}
                  ${confidenceBadge(cost.confidence)}
                </div>
              ` : ''}
              ${c.applicationWindow ? `
                <div class="app-window-box">
                  <div><strong>Opens:</strong> ${escapeHtml(c.applicationWindow.opens)}</div>
                  <div><strong>Closes:</strong> ${escapeHtml(c.applicationWindow.closes)}</div>
                  <div><strong>How:</strong> ${escapeHtml(c.applicationWindow.mechanism)}</div>
                </div>
              ` : ''}
            </div>
          </details>
        ` : ''}
      </article>
    `;
  }

  tabEls.forEach((tab) => {
    tab.addEventListener('click', () => {
      activeTab = tab.dataset.tab;
      tabEls.forEach((t) => t.classList.toggle('active', t === tab));
      apply();
    });
  });

  resultsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.applied-toggle');
    if (!btn) return;
    toggleApplied(btn.dataset.name);
    apply();
  });

  [searchEl, catEl, fitEl, sortEl, hidePastEl].forEach((elm) => elm.addEventListener('input', apply));
  apply();
}
