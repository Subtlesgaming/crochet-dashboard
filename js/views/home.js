import { daysUntil, daysUntilLabel, formatDateRange, getSeasonalStatus, getUpcomingConventions } from '../dates.js';
import { escapeHtml, categoryBadge, barrierBadge } from '../ui.js';

export function valueListHtml(picks, conventionsByName) {
  return `
    <ul class="value-list">
      ${picks.map((p) => {
        const c = conventionsByName.get(p.name);
        return `
          <li class="value-list-item">
            <div class="value-list-name">${escapeHtml(p.name)}</div>
            ${c?.costData ? `<div class="value-list-cost">${escapeHtml(c.costData.tableCost)}</div>` : ''}
            <div class="value-list-reason">${escapeHtml(p.reason)}</div>
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

/** Merges both top-pick lists, keeps only ones tied to a confirmed upcoming date, soonest first. */
function condensedTopPicks(rankings, conventionsByName, limit) {
  const tag = (arr, pickType) => (arr || []).map((p) => ({ ...p, pickType }));
  return [...tag(rankings.currentInventoryTopPicks, 'current'), ...tag(rankings.darkFantasyTopPicks, 'dark-fantasy')]
    .map((p) => ({ ...p, convention: conventionsByName.get(p.name) }))
    .filter((p) => p.convention?.startDate)
    .map((p) => ({ ...p, days: daysUntil(p.convention.startDate) }))
    .filter((p) => p.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, limit);
}

function condensedPickRowHtml(p) {
  const cost = p.convention.costData;
  return `
    <div class="bestvalue-row">
      <div class="bestvalue-row-main">
        <span class="badge badge-pick-${p.pickType}">${p.pickType === 'current' ? 'Current' : 'Dark-Fantasy'}</span>
        <span class="bestvalue-name">${escapeHtml(p.name)}</span>
        <span class="bestvalue-days">${escapeHtml(daysUntilLabel(p.days))}</span>
      </div>
      <div class="bestvalue-row-meta">
        ${cost?.tableCost ? `<span class="bestvalue-cost">${escapeHtml(cost.tableCost)}</span>` : ''}
        ${barrierBadge(cost?.barrierLevel)}
      </div>
      <div class="bestvalue-reason">${escapeHtml(p.reason)}</div>
    </div>
  `;
}

/**
 * Shared "Best Value: Where to Sell" panel body -- used on both Home and the
 * Game Plan. Condenses the curated top-pick lists down to the soonest 4-6
 * upcoming ones for a quick compare, with the full ranked list one click away.
 */
export function bestValueHtml(rankings, conventionsByName, { limit = 6 } = {}) {
  const condensed = condensedTopPicks(rankings, conventionsByName, limit);
  const totalCount = (rankings.currentInventoryTopPicks?.length || 0) + (rankings.darkFantasyTopPicks?.length || 0);

  return `
    <h2 class="value-heading"><span class="value-heading-icon"><span></span><span></span></span>Best Value: Where to Sell</h2>
    <p class="meta-note meta-note-tight">${escapeHtml(rankings.caveat || '')}</p>
    ${condensed.length ? `
      <div class="bestvalue-condensed">
        ${condensed.map(condensedPickRowHtml).join('')}
      </div>
    ` : '<p class="empty-note">No top picks with confirmed upcoming dates right now.</p>'}
    <details class="bestvalue-expand">
      <summary>View full ranked list <span class="research-section-count">${totalCount}<span class="chevron"></span></span></summary>
      <div class="value-grid">
        <div>
          <h3 class="value-col-heading">Current Inventory</h3>
          ${valueListHtml(rankings.currentInventoryTopPicks || [], conventionsByName)}
        </div>
        <div>
          <h3 class="value-col-heading">Future Dark-Fantasy Inventory</h3>
          ${valueListHtml(rankings.darkFantasyTopPicks || [], conventionsByName)}
        </div>
      </div>
    </details>
  `;
}

export function render(container, data) {
  const allUpcoming = getUpcomingConventions(data.conventions || []);
  const upcoming = allUpcoming.slice(0, 6);

  const strongFitSoon = allUpcoming.filter(
    (c) => c.days !== null && c.days <= 90 && (c.fitTags || []).includes('strong-fit')
  );

  const seasons = getSeasonalStatus(data.seasonalCycle || []);
  const activeSeason = seasons.find((s) => s.status === 'active');
  const prepSeasons = seasons.filter((s) => s.status === 'prep').sort((a, b) => a.daysToStart - b.daysToStart);

  const conventionsByName = new Map((data.conventions || []).map((c) => [c.name, c]));
  const rankings = data.conventionRankings;

  const nextEvent = allUpcoming[0];
  const nextStrongFit = strongFitSoon[0];
  const seasonStatusText = activeSeason
    ? activeSeason.season.split(' (')[0]
    : (prepSeasons[0] ? `${prepSeasons[0].season.split(' (')[0]} prep` : 'None active');

  container.innerHTML = `
    <p class="meta-note">${escapeHtml(data.meta?.notes || '')}<span class="last-updated">Last updated ${escapeHtml(data.meta?.lastUpdated || '')}</span></p>

    <a href="#/gameplan" class="gameplan-banner">
      <span class="gameplan-banner-label">Game Plan</span>
      <span class="gameplan-banner-text">One report: top picks, at-a-glance takeaways, and everything you've starred, pulled together.</span>
      <span class="gameplan-banner-arrow">&rarr;</span>
    </a>

    <div class="hero-row">
      <div class="hero-card ${nextEvent ? 'hero-card-next' : 'hero-card-empty'}">
        ${nextEvent ? `
          <div class="hero-photo-circle tint-crimson"><img src="assets/moon-trees.jpg" alt="" /></div>
        ` : ''}
        <div class="hero-body">
          <div class="hero-label">Next Up</div>
          <div class="hero-value">${nextEvent ? escapeHtml(daysUntilLabel(nextEvent.days)) : '&mdash;'}</div>
          <div class="hero-name">${nextEvent ? escapeHtml(nextEvent.name) : 'Nothing scheduled'}</div>
          ${nextEvent ? `<div class="hero-meta">${escapeHtml(nextEvent.location)} &middot; ${escapeHtml(formatDateRange(nextEvent.startDate, nextEvent.endDate))}</div>` : ''}
        </div>
      </div>
      <div class="hero-card ${nextStrongFit ? 'hero-card-strong' : 'hero-card-empty'}">
        ${nextStrongFit ? `
          <div class="hero-photo-circle tint-purple"><img src="assets/dragon-moon.jpg" alt="" /></div>
        ` : ''}
        <div class="hero-body">
          <div class="hero-label">Next Strong-Fit Event</div>
          <div class="hero-value">${nextStrongFit ? escapeHtml(daysUntilLabel(nextStrongFit.days)) : 'None soon'}</div>
          <div class="hero-name">${nextStrongFit ? escapeHtml(nextStrongFit.name) : 'within the next 90 days'}</div>
          ${nextStrongFit ? `<div class="hero-meta">${escapeHtml(nextStrongFit.location)}</div>` : ''}
        </div>
      </div>
    </div>

    <div class="stat-chip-row">
      <div class="stat-chip">
        <div class="stat-chip-label">Upcoming Conventions</div>
        <div class="stat-chip-value">${allUpcoming.length}</div>
        <div class="stat-chip-caption">tracked in this data set</div>
      </div>
      <div class="stat-chip">
        <div class="stat-chip-label">Seasonal Window</div>
        <div class="stat-chip-value">${escapeHtml(seasonStatusText)}</div>
        <div class="stat-chip-caption">see detail below</div>
      </div>
    </div>

    ${rankings ? `
    <section class="panel">
      ${bestValueHtml(rankings, conventionsByName)}
    </section>` : ''}

    <div class="two-col-row">
      <section class="panel">
        <h2>Seasonal Window</h2>
        ${activeSeason
          ? `<div class="season-callout season-active">
              <strong>${escapeHtml(activeSeason.season)}</strong><span class="season-active-tag">ACTIVE NOW</span>
              <div class="season-detail">${escapeHtml(activeSeason.themes)} &middot; ${escapeHtml(activeSeason.pricing)}</div>
              <div class="season-tip">${escapeHtml(activeSeason.productionTip)}</div>
            </div>`
          : ''}
        ${prepSeasons.map((s) => `
          <div class="season-callout season-prep">
            <strong>${escapeHtml(s.season)}</strong><span class="season-prep-tag">prep in ~${s.weeksAway}wk</span>
            <div class="season-detail">${escapeHtml(s.themes)}</div>
          </div>
        `).join('')}
        ${!activeSeason && !prepSeasons.length ? '<p class="empty-note">No seasonal window flagged right now.</p>' : ''}
      </section>

      <section class="panel panel-highlight">
        <h2>Strong-Fit Dark-Fantasy Events</h2>
        <div class="strongfit-list">
          ${strongFitSoon.map((c) => `
            <div class="strongfit-item">
              <div class="strongfit-name">${escapeHtml(c.name)} <span class="strongfit-days">${escapeHtml(daysUntilLabel(c.days))}</span></div>
              <div class="strongfit-meta">${escapeHtml(c.location)} &middot; ${escapeHtml(formatDateRange(c.startDate, c.endDate))}</div>
            </div>
          `).join('')}
          ${!strongFitSoon.length ? '<div class="empty-note">None flagged in the next 90 days.</div>' : ''}
        </div>
      </section>
    </div>

    <section class="panel">
      <h2>Next Up</h2>
      <div class="next-up-list">
        ${upcoming.map((c) => `
          <div class="next-up-row">
            <div>
              <div class="next-up-name">${escapeHtml(c.name)} ${categoryBadge(c.category)}</div>
              <div class="next-up-meta">${escapeHtml(c.location)} &middot; ${escapeHtml(formatDateRange(c.startDate, c.endDate))}</div>
            </div>
            <div class="next-up-days">${escapeHtml(daysUntilLabel(c.days))}</div>
          </div>
        `).join('')}
      </div>
      <a class="link-more" href="#/conventions">See full convention calendar &rarr;</a>
    </section>
  `;
}
