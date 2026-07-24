/** Builds a flat, searchable index across every section of the dashboard data. */

function entry(section, route, title, subtitle, textParts) {
  return {
    section,
    route,
    title,
    subtitle,
    text: [title, subtitle, ...textParts].filter(Boolean).join(' ').toLowerCase(),
  };
}

export function buildSearchIndex(data) {
  const index = [];

  index.push(entry(
    'Game Plan', '#/gameplan', 'Game Plan',
    'Top picks, at-a-glance takeaways, and starred findings in one report',
    ['strategy', 'report', 'summary', 'starred']
  ));

  (data.conventions || []).forEach((c) => {
    index.push(entry(
      'Conventions', '#/conventions', c.name,
      `${c.location}${c.startDate ? ' · ' + c.startDate : ''}`,
      [c.category, ...(c.fitTags || []), c.note, c.scale, c.costData?.tableCost, c.costData?.barrierLevel,
       c.applicationWindow?.opens, c.applicationWindow?.closes, c.applicationWindow?.mechanism]
    ));
  });

  (data.competitors || []).forEach((c) => {
    index.push(entry(
      'Competitors', '#/competitors', c.name,
      `${c.platform} · ${c.priceRange}`,
      [c.niche, c.note]
    ));
  });

  if (data.productDemand) {
    const sections = [
      ['Bestsellers', data.productDemand.bestsellers],
      ['Sale Price Range', data.productDemand.priceRange],
      ['Bundled Deals', data.productDemand.bundles],
      ['Under-Represented Items', data.productDemand.gaps],
    ];
    sections.forEach(([label, items]) => {
      (items || []).forEach((f) => {
        index.push(entry(
          'Product Demand', '#/demand', `${label}: ${f.finding.slice(0, 60)}${f.finding.length > 60 ? '...' : ''}`,
          f.confidence, [f.finding, f.source]
        ));
      });
    });
  }

  if (data.materialsSuppliers) {
    const sections = [
      ['Yarn Brands', data.materialsSuppliers.yarnBrands],
      ['Yarn Pricing', data.materialsSuppliers.yarnPricing],
      ['Yarn Quality', data.materialsSuppliers.qualityReputation],
      ['Bulk/Wholesale', data.materialsSuppliers.bulkWholesale],
      ['Eyes & Stuffing', data.materialsSuppliers.eyesAndStuffing],
    ];
    sections.forEach(([label, items]) => {
      (items || []).forEach((f) => {
        index.push(entry(
          'Materials', '#/materials', `${label}: ${f.finding.slice(0, 60)}${f.finding.length > 60 ? '...' : ''}`,
          f.confidence, [f.finding, f.source]
        ));
      });
    });
  }

  if (data.businessSetup) {
    const sections = [
      ['CA Legal', data.businessSetup.legal],
      ['Etsy Fees', data.businessSetup.etsyFees],
      ['Payment Processing', data.businessSetup.paymentProcessing],
      ['Booth Startup', data.businessSetup.boothStartup],
      ['Booth Presentation', data.businessSetup.boothPresentation],
      ['Email List', data.businessSetup.emailListBuilding],
      ['Pricing Formulas', data.businessSetup.pricingFormulas],
      ['Marketing', data.businessSetup.marketingChannels],
    ];
    sections.forEach(([label, items]) => {
      (items || []).forEach((f) => {
        index.push(entry(
          'Business Setup', '#/business', `${label}: ${f.finding.slice(0, 60)}${f.finding.length > 60 ? '...' : ''}`,
          f.confidence, [f.finding, f.source]
        ));
      });
    });
  }

  (data.shippingTiers || []).forEach((s) => {
    index.push(entry(
      'Shipping', '#/shipping', `Tier ${s.tier}: ${s.examples}`,
      `${s.weight} · ${s.estShippingCost}`,
      [s.packaging]
    ));
  });

  (data.digitalPatternPricing || []).forEach((p) => {
    index.push(entry(
      'Digital Patterns', '#/patterns', p.type, p.priceRange, [p.example]
    ));
  });

  (data.seasonalCycle || []).forEach((s) => {
    index.push(entry(
      'Seasonal Cycle', '#/seasonal', s.season, s.themes, [s.pricing, s.productionTip]
    ));
  });

  (data.historicalTimeline || []).forEach((t) => {
    index.push(entry(
      'Historical Trends', '#/timeline', `${t.year}: ${t.event}`, t.relevance,
      [t.confidence, t.source]
    ));
  });

  (data.clearingOldInventory || []).forEach((s) => {
    index.push(entry(
      'Clearing Inventory', '#/clearance', s.strategy, s.pricing,
      [s.howItWorks, s.note]
    ));
  });

  if (data.copyrightNotes) {
    const c = data.copyrightNotes;
    index.push(entry(
      'Copyright', '#/copyright', 'Copyright quick-reference', null,
      [...(c.generallySafe || []), c.lovecraftSpecific, c.riskEvidence]
    ));
  }

  return index;
}

export function searchIndex(index, query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);

  return index
    .map((item) => {
      const hits = terms.every((t) => item.text.includes(t));
      if (!hits) return null;
      const titleBoost = item.title.toLowerCase().includes(q) ? 10 : 0;
      return { item, score: titleBoost + 1 };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map((r) => r.item);
}
