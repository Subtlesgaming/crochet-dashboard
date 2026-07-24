import { escapeHtml } from '../ui.js';

export function render(container, data) {
  const tiers = data.shippingTiers || [];
  container.innerHTML = `
    <h1>Shipping Tiers &amp; Packaging Costs</h1>
    <div class="shipping-rows">
      ${tiers.map((t) => `
        <div class="shipping-row">
          <span class="shipping-tier-badge">Tier ${escapeHtml(t.tier)}</span>
          <div>
            <div class="shipping-examples">${escapeHtml(t.examples)}</div>
            <div class="shipping-weight">${escapeHtml(t.weight)}</div>
          </div>
          <div>
            <div class="shipping-packaging">
              ${t.packagingSource ? `<a href="${escapeHtml(t.packagingSource)}" target="_blank" rel="noopener">${escapeHtml(t.packaging)}</a>` : escapeHtml(t.packaging)}
              <span class="shipping-cost">${escapeHtml(t.packagingCostPerUnit)}</span>
            </div>
            <div class="shipping-ship-cost">Ship: ${escapeHtml(t.estShippingCost)}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
