/**
 * Data-loading layer.
 *
 * Today there is exactly one source: the static JSON file exported from
 * research conversations. To add a live source later (e.g. Etsy listings,
 * inventory counts from a shop platform), add a new loader function below
 * and merge its output into the returned object in loadDashboardData().
 * View code never talks to fetch() directly -- it only calls
 * loadDashboardData() and reads the merged result, so adding a source
 * here doesn't require touching any view.
 */

const DATA_URL = 'data/dashboard_data.json';

async function loadStaticResearchData() {
  const res = await fetch(DATA_URL);
  if (!res.ok) {
    throw new Error(`Failed to load ${DATA_URL}: ${res.status}`);
  }
  return res.json();
}

// Placeholder seam for a future live source, e.g.:
// async function loadEtsyListings() {
//   const res = await fetch('https://api.etsy.com/...');
//   return res.json();
// }

let cachedData = null;

export async function loadDashboardData({ forceReload = false } = {}) {
  if (cachedData && !forceReload) return cachedData;

  const staticData = await loadStaticResearchData();

  // Future: merge additional sources here, e.g.
  // const liveListings = await loadEtsyListings();
  // staticData.competitors = mergeCompetitors(staticData.competitors, liveListings);

  cachedData = staticData;
  return cachedData;
}
