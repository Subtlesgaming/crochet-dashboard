/** Date/season helper functions shared across views. */

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function parseISO(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return isNaN(d.getTime()) ? null : d;
}

/** Whole days from today until dateStr. Negative if in the past, null if no date. */
export function daysUntil(dateStr) {
  const target = parseISO(dateStr);
  if (!target) return null;
  const today = parseISO(todayISO());
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((target - today) / msPerDay);
}

export function formatDateRange(startDate, endDate) {
  if (!startDate) return 'Date TBD';
  const opts = { month: 'short', day: 'numeric', year: 'numeric' };
  const start = parseISO(startDate);
  const startStr = start.toLocaleDateString('en-US', opts);
  if (!endDate || endDate === startDate) return startStr;
  const end = parseISO(endDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.toLocaleDateString('en-US', { month: 'short' })} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${startStr} - ${end.toLocaleDateString('en-US', opts)}`;
}

export function daysUntilLabel(days) {
  if (days === null) return 'Date TBD';
  if (days < 0) return 'Past';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
}

/** Conventions with a days-until value attached, future/TBD only, soonest first (TBD dates last). */
export function getUpcomingConventions(conventions, { limit = Infinity } = {}) {
  return conventions
    .map((c) => ({ ...c, days: daysUntil(c.startDate) }))
    .filter((c) => c.days === null || c.days >= 0)
    .sort((a, b) => {
      if (a.days === null) return 1;
      if (b.days === null) return -1;
      return a.days - b.days;
    })
    .slice(0, limit);
}

/**
 * Given today's date, figure out which seasonal window (from seasonalCycle
 * data) we're currently in or approaching, based on rough month ranges
 * baked into the season names (e.g. "Halloween (Sept-Oct)").
 */
const SEASON_MONTH_RANGES = {
  'Halloween (Sept-Oct)': [8, 9],       // Sep, Oct (0-indexed)
  'Christmas (Nov-Dec)': [10, 11],
  "Valentine's Day (Jan-Feb)": [0, 1],
  'Easter/Spring (Mar-Apr)': [2, 3],
};

export function getSeasonalStatus(seasonalCycle) {
  const now = new Date();
  const month = now.getMonth();

  const results = seasonalCycle.map((season) => {
    const range = SEASON_MONTH_RANGES[season.season];
    if (!range) return { ...season, status: 'unknown', weeksAway: null };

    const [startMonth] = range;
    // Prep typically starts 6-8 weeks before the window opens.
    const prepStart = new Date(now.getFullYear(), startMonth, 1);
    prepStart.setDate(prepStart.getDate() - 49);

    const seasonStart = new Date(now.getFullYear(), startMonth, 1);
    const seasonEnd = new Date(now.getFullYear(), range[1] + 1, 0);

    let adjSeasonStart = seasonStart;
    let adjSeasonEnd = seasonEnd;
    let adjPrepStart = prepStart;
    if (seasonEnd < now && (seasonEnd - now) < -60 * 24 * 60 * 60 * 1000) {
      // Season already passed this year by a lot -- look at next year's window.
      adjSeasonStart = new Date(now.getFullYear() + 1, startMonth, 1);
      adjSeasonEnd = new Date(now.getFullYear() + 1, range[1] + 1, 0);
      adjPrepStart = new Date(adjSeasonStart);
      adjPrepStart.setDate(adjPrepStart.getDate() - 49);
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    let status = 'later';
    if (now >= adjSeasonStart && now <= adjSeasonEnd) status = 'active';
    else if (now >= adjPrepStart && now < adjSeasonStart) status = 'prep';

    const daysToStart = Math.round((adjSeasonStart - now) / msPerDay);
    const daysToPrep = Math.round((adjPrepStart - now) / msPerDay);

    return {
      ...season,
      status,
      daysToStart,
      daysToPrep,
      weeksAway: Math.max(0, Math.round(daysToPrep / 7)),
    };
  });

  return results;
}
