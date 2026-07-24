import { escapeHtml, makeTextFilter } from '../ui.js';

export function render(container, data) {
  const strategies = data.clearingOldInventory || [];

  container.innerHTML = `
    <h1>Clearing Old Inventory / Mystery Bag Strategies</h1>
    <div class="filter-bar">
      ${makeTextFilter('clear-search', 'Search strategies...')}
    </div>
    <div id="clear-results" class="card-grid"></div>
  `;

  const searchEl = container.querySelector('#clear-search');
  const resultsEl = container.querySelector('#clear-results');

  function apply() {
    const q = searchEl.value.trim().toLowerCase();
    const list = strategies.filter((s) => {
      if (!q) return true;
      return `${s.strategy} ${s.howItWorks} ${s.note}`.toLowerCase().includes(q);
    });

    resultsEl.innerHTML = list.length ? list.map((s) => `
      <article class="card">
        <h3>${escapeHtml(s.strategy)}</h3>
        <div class="card-price">${escapeHtml(s.pricing)}</div>
        <p class="card-note"><strong>How it works:</strong> ${escapeHtml(s.howItWorks)}</p>
        <p class="card-note">${escapeHtml(s.note)}</p>
      </article>
    `).join('') : '<p class="empty-note">No strategies match that search.</p>';
  }

  searchEl.addEventListener('input', apply);
  apply();
}
