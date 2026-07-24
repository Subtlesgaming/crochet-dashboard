/**
 * Firebase project config -- these values are NOT secret (they're meant to be
 * public in client-side code; Firestore security rules are what actually
 * protect the data, see firestore.rules).
 *
 * Note: this project loads Firebase from the gstatic CDN via dynamic
 * import() (see firebaseClient.js) rather than `npm install firebase` +
 * bare specifiers like "firebase/app" -- there's no build step, and the CDN
 * approach is what keeps the offline single-file build working. Analytics
 * isn't wired up since nothing here uses it.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyCkfxJX0gQF_RYrQXmtGRgk69FWXPjOxw0',
  authDomain: 'crochet-dashboard.firebaseapp.com',
  projectId: 'crochet-dashboard',
  storageBucket: 'crochet-dashboard.firebasestorage.app',
  messagingSenderId: '271202167409',
  appId: '1:271202167409:web:25296d1560fb632d7909d0',
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
