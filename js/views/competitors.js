import { escapeHtml, makeSelect, makeTextFilter } from '../ui.js';

export function render(container, data) {
  const competitors = data.competitors || [];
  const niches = [...new Set(competitors.map((c) => c.niche))].sort();

  container.innerHTML = `
    <h1>Competitor Pricing</h1>
    <div class="filter-bar">
      ${makeTextFilter('comp-search', 'Search competitors...')}
      ${makeSelect('comp-niche', 'Niche', [{ value: '', label: 'All niches' }, ...niches.map((n) => ({ value: n, label: n }))])}
    </div>
    <div id="comp-results" class="competitor-list"></div>
  `;

  const searchEl = container.querySelector('#comp-search');
  const nicheEl = container.querySelector('#comp-niche');
  const resultsEl = container.querySelector('#comp-results');

  function apply() {
    const q = searchEl.value.trim().toLowerCase();
    const niche = nicheEl.value;
    const list = competitors.filter((c) => {
      if (niche && c.niche !== niche) return false;
      if (q) {
        const hay = `${c.name} ${c.platform} ${c.note}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    resultsEl.innerHTML = list.length ? list.map((c) => `
      <div class="card competitor-card">
        <div class="card-header">
          <h3>${escapeHtml(c.name)}</h3>
          <span class="competitor-price">${escapeHtml(c.priceRange)}</span>
        </div>
        <div class="card-meta">${escapeHtml(c.platform)} &middot; <span class="competitor-niche">${escapeHtml(c.niche)}</span></div>
        <p class="card-note">${escapeHtml(c.note)}</p>
        ${c.url ? `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener" class="link-more">Visit shop &rarr;</a>` : ''}
      </div>
    `).join('') : '<p class="empty-note">No competitors match those filters.</p>';
  }

  [searchEl, nicheEl].forEach((elm) => elm.addEventListener('input', apply));
  apply();
}
