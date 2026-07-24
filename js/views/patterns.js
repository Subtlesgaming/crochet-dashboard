import { escapeHtml } from '../ui.js';

export function render(container, data) {
  const patterns = data.digitalPatternPricing || [];
  container.innerHTML = `
    <h1>Digital Pattern Pricing Benchmarks</h1>
    <div class="card-grid">
      ${patterns.map((p) => `
        <article class="card">
          <h3>${escapeHtml(p.type)}</h3>
          <div class="card-price">${escapeHtml(p.priceRange)}</div>
          <p class="card-note">${escapeHtml(p.example)}</p>
        </article>
      `).join('')}
    </div>
  `;
}
