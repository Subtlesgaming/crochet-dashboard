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
    initPromise = loadFirebase().then(({ auth, authApi }) => {
      if (auth) {
        authApi.onAuthStateChanged(auth, (user) => {
          currentUser = user;
          listeners.forEach((cb) => cb(user));
        });
      }
      return { auth, authApi };
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

export async function signOutUser() {
  const { auth, authApi } = await ensureInit();
  if (!auth) return;
  await authApi.signOut(auth);
}
