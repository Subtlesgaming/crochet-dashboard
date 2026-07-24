import { escapeHtml, findingList } from '../ui.js';
import { isStarred } from '../starTracker.js';
import { PAGES } from './researchPage.js';
import { bestValueHtml } from './home.js';
import { getUpcomingConventions, daysUntilLabel, formatDateRange } from '../dates.js';

/** Pulls every finding across the research pages that the reader has starred, grouped by source page. */
function collectStarredByPage(data) {
  return Object.values(PAGES)
    .map((page) => {
      const src = data[page.dataKey] || {};
      const items = page.sections
        .flatMap(({ key }) => src[key] || [])
        .filter((f) => isStarred(f.finding));
      return { title: page.title.replace('&amp;', '&'), route: page.route, items };
    })
    .filter((g) => g.items.length);
}

function atAGlanceSection(data, page, label) {
  const src = data[page.dataKey] || {};
  const glance = src.atAGlance || [];
  if (!glance.length) return '';
  return `
    <section class="panel gameplan-section">
      <div class="gameplan-section-header">
        <h2>${escapeHtml(label)}</h2>
        <a href="${page.route}" class="link-more link-more-inline">Full findings &rarr;</a>
      </div>
      <ul class="at-a-glance-list">
        ${glance.map((g) => `<li>${escapeHtml(g)}</li>`).join('')}
      </ul>
    </section>
  `;
}

export function render(container, data) {
  const conventionsByName = new Map((data.conventions || []).map((c) => [c.name, c]));
  const rankings = data.conventionRankings;
  const strongFitSoon = getUpcomingConventions(data.conventions || [])
    .filter((c) => c.days !== null && c.days <= 90 && (c.fitTags || []).includes('strong-fit'))
    .slice(0, 3);

  const starredGroups = collectStarredByPage(data);
  const starredTotal = starredGroups.reduce((sum, g) => sum + g.items.length, 0);

  container.innerHTML = `
    <h1>Game Plan</h1>
    <p class="meta-note">The short version of everything else in this archive: curated top picks, the
      at-a-glance takeaways from each research page, and anything you've personally starred as important.
      This page updates itself as you star findings and as the underlying data changes -- it doesn't need
      separate upkeep. For sources and full detail, follow the "Full findings" links into each page.</p>

    ${rankings ? `
    <section class="panel">
      ${bestValueHtml(rankings, conventionsByName)}
      ${strongFitSoon.length ? `
        <div class="gameplan-strongfit">
          <div class="gameplan-strongfit-label">Strong-fit events in the next 90 days</div>
          ${strongFitSoon.map((c) => `
            <div class="strongfit-item">
              <div class="strongfit-name">${escapeHtml(c.name)} <span class="strongfit-days">${escapeHtml(daysUntilLabel(c.days))}</span></div>
              <div class="strongfit-meta">${escapeHtml(c.location)} &middot; ${escapeHtml(formatDateRange(c.startDate, c.endDate))}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      <a class="link-more" href="#/conventions">See full convention calendar &rarr;</a>
    </section>` : ''}

    ${atAGlanceSection(data, PAGES.demand, 'What to Make')}
    ${atAGlanceSection(data, PAGES.materials, 'Materials &amp; Costs')}
    ${atAGlanceSection(data, PAGES.business, 'Running the Business')}

    <section class="panel gameplan-section">
      <div class="gameplan-section-header">
        <h2>&#9733; Your Starred Priorities</h2>
        ${starredTotal ? `<span class="research-section-count">${starredTotal} starred</span>` : ''}
      </div>
      ${starredTotal ? starredGroups.map((g) => `
        <div class="gameplan-starred-group">
          <div class="gameplan-starred-group-header">
            <h3>${escapeHtml(g.title)}</h3>
            <a href="${g.route}" class="link-more link-more-inline">Open page &rarr;</a>
          </div>
          ${findingList(g.items)}
        </div>
      `).join('') : `
        <p class="empty-note">Nothing starred yet. Open the <a href="#/demand">Product Demand</a>,
          <a href="#/materials">Materials</a>, or <a href="#/business">Business Setup</a> pages and click the
          &#9734; next to any finding that matters most to you -- it'll show up here.</p>
      `}
    </section>
  `;
}
