/**
 * Tracks which conventions the user has marked as "applied to," persisted in
 * this browser's localStorage. This is personal, device-local tracking state --
 * separate from the read-only research data in dashboard_data.json -- so it
 * won't sync across devices/browsers and is lost if browser data is cleared.
 */

const STORAGE_KEY = 'hb-applied-conventions';

function readSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    // localStorage unavailable (private browsing, storage disabled, etc.) -- fail silently.
  }
}

export function isApplied(name) {
  return readSet().has(name);
}

export function getAppliedNames() {
  return readSet();
}

export function toggleApplied(name) {
  const set = readSet();
  if (set.has(name)) set.delete(name);
  else set.add(name);
  writeSet(set);
  return set.has(name);
}
