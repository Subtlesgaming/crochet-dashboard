import { escapeHtml, findingList, confidenceFilterBar, initConfidenceFilter } from '../ui.js';

/**
 * Generic renderer for the three research-heavy pages (Product Demand,
 * Materials, Business Setup), which share an identical structure:
 * title + intro + optional At-a-Glance synthesis + confidence/star filter bar
 * + one panel of findings per section. Each page is just a config here --
 * section lists and At-a-Glance bullets live in dashboard_data.json, so new
 * sections added to the data appear without touching view code.
 */
function renderResearchPage(container, data, config) {
  const src = data[config.dataKey] || {};
  const sections = config.sections
    .map(({ key, title }) => ({ title, items: src[key] }))
    .filter((s) => Array.isArray(s.items) && s.items.length);

  const glance = src.atAGlance;

  container.innerHTML = `
    <h1>${config.title}</h1>
    <p class="meta-note">${config.intro(src)}</p>

    ${glance && glance.length ? `
    <section class="at-a-glance">
      <div class="at-a-glance-label">
        <span class="at-a-glance-icon"><span></span><span></span></span>
        At a Glance
        <span class="at-a-glance-tag">synthesized takeaways -- see findings below for sources</span>
      </div>
      <ul class="at-a-glance-list">
        ${glance.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}
      </ul>
    </section>` : ''}

    ${confidenceFilterBar()}

    <div class="confidence-scope" data-confidence-filter="all">
      ${sections.map((s) => `
        <details class="panel research-section">
          <summary>
            <h2>${s.title}</h2>
            <span class="research-section-count">${s.items.length} finding${s.items.length === 1 ? '' : 's'}<span class="chevron"></span></span>
          </summary>
          <div class="research-section-body">${findingList(s.items)}</div>
        </details>
      `).join('')}
    </div>
  `;

  initConfidenceFilter(container.querySelector('.confidence-filter-bar'), container.querySelector('.confidence-scope'));
}

export const PAGES = {
  demand: {
    dataKey: 'productDemand',
    route: '#/demand',
    title: 'Product Demand',
    intro: () => `Research into what actually sells, at what price, and where the gaps are. Mostly craft-business
      consensus rather than raw sales data -- confidence badges and sources are included so you can judge
      how much weight to put on each finding. Competitor pricing itself lives on the
      <a href="#/competitors">Competitors</a> page.`,
    sections: [
      { key: 'bestsellers', title: 'Bestseller Item Types' },
      { key: 'priceRange', title: 'Most Common Sale Price Range' },
      { key: 'bundles', title: 'Bundled / Multi-Item Deals' },
      { key: 'gaps', title: 'Under-Represented Items / Buyer Gaps' },
    ],
  },
  materials: {
    dataKey: 'materialsSuppliers',
    route: '#/materials',
    title: 'Materials &amp; Suppliers',
    intro: (src) => `Yarn brands, pricing, quality reputation, and supply channels for plushie production.
      Researched ${escapeHtml(src.researchDate || '')} -- yarn prices shift and listings conflict
      (especially Walmart multipacks), so verify prices at checkout before bulk orders.`,
    sections: [
      { key: 'yarnBrands', title: 'Yarn Brands Makers Actually Use' },
      { key: 'yarnPricing', title: 'Price Comparison &amp; Where to Buy' },
      { key: 'qualityReputation', title: 'Quality Reputation (Praise &amp; Complaints)' },
      { key: 'bulkWholesale', title: 'Bulk &amp; Wholesale Options' },
      { key: 'eyesAndStuffing', title: 'Safety Eyes &amp; Stuffing' },
    ],
  },
  business: {
    dataKey: 'businessSetup',
    route: '#/business',
    title: 'Business Setup',
    intro: (src) => `Operating costs and practical setup: platform fees, card readers, booth equipment,
      pricing formulas, and marketing channels. Researched ${escapeHtml(src.researchDate || '')} --
      fee schedules change; re-verify before committing budget.`,
    sections: [
      { key: 'legal', title: 'California Legal Requirements' },
      { key: 'etsyFees', title: 'Etsy Seller Fees' },
      { key: 'paymentProcessing', title: 'In-Person Payment Processing' },
      { key: 'boothStartup', title: 'Booth &amp; Table Startup Costs' },
      { key: 'boothPresentation', title: 'Booth Presentation &amp; In-Person Marketing' },
      { key: 'emailListBuilding', title: 'Email List Building &amp; Usage' },
      { key: 'pricingFormulas', title: 'Pricing Formulas' },
      { key: 'marketingChannels', title: 'Marketing Channels' },
    ],
  },
};

export const demandView = { render: (c, d) => renderResearchPage(c, d, PAGES.demand) };
export const materialsView = { render: (c, d) => renderResearchPage(c, d, PAGES.materials) };
export const businessView = { render: (c, d) => renderResearchPage(c, d, PAGES.business) };
