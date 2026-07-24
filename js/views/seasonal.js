import { getSeasonalStatus } from '../dates.js';
import { escapeHtml } from '../ui.js';

export function render(container, data) {
  const seasons = getSeasonalStatus(data.seasonalCycle || []);

  container.innerHTML = `
    <h1>Seasonal Cycle</h1>
    <div class="card-grid">
      ${seasons.map((s) => `
        <article class="card ${s.status === 'active' ? 'card-season-active' : ''}">
          <div class="card-header">
            <h3>${escapeHtml(s.season)}</h3>
            ${s.status === 'active' ? '<span class="badge badge-confirmed">Active now</span>' : ''}
            ${s.status === 'prep' ? '<span class="badge badge-confidence-medium">Prep window</span>' : ''}
          </div>
          <p class="card-note"><strong>Themes:</strong> ${escapeHtml(s.themes)}</p>
          <p class="card-note"><strong>Pricing:</strong> ${escapeHtml(s.pricing)}</p>
          <p class="card-note"><strong>Tip:</strong> ${escapeHtml(s.productionTip)}</p>
        </article>
      `).join('')}
    </div>
  `;
}
