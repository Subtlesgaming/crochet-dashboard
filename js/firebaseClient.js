/**
 * Firebase app initialization, loaded from the official CDN.
 *
 * Uses dynamic import() rather than a static `import ... from 'https://...'`
 * -- a static import of a remote URL can't survive the offline build's
 * esbuild bundling (IIFE output can't contain ES module import
 * declarations, so esbuild rewrites external static imports into a
 * `__require()` shim that doesn't exist in browsers and throws at runtime).
 * A dynamic import() is just an expression, not a declaration, so it stays
 * valid in any script context -- including that bundle -- and esbuild
 * leaves it alone as a real runtime import when passed --external.
 *
 * Memoized so the SDK only loads/initializes once no matter how many
 * callers ask for it. Resolves to nulls when firebaseConfig.js hasn't been
 * filled in yet, so the rest of the app can degrade gracefully.
 */
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig.js';

const CDN = 'https://www.gstatic.com/firebasejs/10.7.1';

let firebasePromise = null;

export function loadFirebase() {
  if (!isFirebaseConfigured) {
    return Promise.resolve({ auth: null, db: null, authApi: null, firestoreApi: null });
  }
  if (firebasePromise) return firebasePromise;

  firebasePromise = Promise.all([
    import(`${CDN}/firebase-app.js`),
    import(`${CDN}/firebase-auth.js`),
    import(`${CDN}/firebase-firestore.js`),
  ]).then(([{ initializeApp }, authApi, firestoreApi]) => {
    const app = initializeApp(firebaseConfig);
    return {
      auth: authApi.getAuth(app),
      db: firestoreApi.getFirestore(app),
      authApi,
      firestoreApi,
    };
  });

  return firebasePromise;
}
