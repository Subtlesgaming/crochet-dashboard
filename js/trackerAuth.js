/**
 * Thin wrapper over Firebase Auth (email/password, single user) -- the
 * Tracker views (inventory.js, salesLog.js, login.js) only ever call these
 * functions, never Firebase directly, same seam pattern as dataSource.js.
 */
import { loadFirebase } from './firebaseClient.js';

let currentUser = null;
const listeners = new Set();
let initPromise = null;

function ensureInit() {
  if (!initPromise) {
    initPromise = loadFirebase().then(({ auth, authApi, db, firestoreApi }) => {
      if (auth) {
        authApi.onAuthStateChanged(auth, (user) => {
          currentUser = user;
          listeners.forEach((cb) => cb(user));
        });
      }
      return { auth, authApi, db, firestoreApi };
    });
  }
  return initPromise;
}

// Kick off eagerly so getCurrentUser()/onAuthChange() reflect real state
// soon after the module loads, without forcing every caller to await it.
ensureInit();

export function getCurrentUser() {
  return currentUser;
}

/** Registers a callback for sign-in/sign-out changes; returns an unsubscribe function. */
export function onAuthChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export async function signIn(email, password) {
  const { auth, authApi } = await ensureInit();
  if (!auth) throw new Error('Firebase is not configured yet -- see js/firebaseConfig.js.');
  await authApi.signInWithEmailAndPassword(auth, email, password);
}

/**
 * Signs out, then -- only once it's confirmed safe -- wipes the local
 * IndexedDB cache so previously-synced inventory/sales data doesn't linger
 * on this device after sign-out. "Safe" means no pending offline writes are
 * still waiting to reach the server; if there are (no connection right
 * now), clearing would destroy real unsynced data, so this asks first
 * instead of guessing. Reloads afterward so the next sign-in starts from a
 * genuinely fresh Firestore instance rather than a manually patched-up one.
 */
export async function signOutUser() {
  const { auth, authApi, db, firestoreApi } = await ensureInit();
  if (!auth) return;

  let hasPendingWrites = false;
  try {
    await Promise.race([
      firestoreApi.waitForPendingWrites(db),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);
  } catch {
    hasPendingWrites = true;
  }

  if (hasPendingWrites) {
    const proceed = window.confirm(
      "Some changes haven't synced to the server yet (likely no internet connection right now). " +
      'Signing out will leave them cached on this device until they can sync on your next sign-in ' +
      'here -- sign out anyway?'
    );
    if (!proceed) return;
  }

  await authApi.signOut(auth);

  if (!hasPendingWrites) {
    try {
      await firestoreApi.terminate(db);
      await firestoreApi.clearIndexedDbPersistence(db);
    } catch {
      // Best-effort -- sign-out already succeeded regardless of this.
    }
  }

  window.location.reload();
}
