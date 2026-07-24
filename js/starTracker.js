/**
 * Tracks which research findings the user has personally starred as important,
 * persisted in this browser's localStorage. Separate axis from "confidence"
 * (how well-sourced a finding is) -- this is "how much this matters to me,"
 * decided by the reader, not the research. Device-local, same caveats as
 * appliedTracker.js (won't sync across devices, lost if browser data is cleared).
 */

const STORAGE_KEY = 'hb-starred-findings';

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
    // localStorage unavailable -- fail silently.
  }
}

/** Findings don't have IDs, so the finding text itself is the stable key. */
export function isStarred(findingText) {
  return readSet().has(findingText);
}

export function toggleStarred(findingText) {
  const set = readSet();
  if (set.has(findingText)) set.delete(findingText);
  else set.add(findingText);
  writeSet(set);
  return set.has(findingText);
}
