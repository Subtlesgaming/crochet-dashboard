import { signIn } from '../trackerAuth.js';
import { isFirebaseConfigured } from '../firebaseConfig.js';

/**
 * Renders a full-site sign-in gate into `container`. Used by app.js's
 * router as a global gate in front of every route -- not page-specific
 * anymore, so it doesn't take a title/copy per caller.
 */
export function renderLogin(container) {
  if (!isFirebaseConfigured) {
    container.innerHTML = `
      <div class="login-gate">
        <h1>Hella Bella Dashboard</h1>
        <section class="panel panel-warning login-panel">
          <h2 class="warning-heading">Not configured yet</h2>
          <p class="card-note">This dashboard needs a Firebase project connected before it'll work --
            fill in <code>js/firebaseConfig.js</code> with your project's web config
            (Firebase Console &rarr; Project Settings &rarr; Your apps), then reload.</p>
        </section>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="login-gate">
      <h1>Hella Bella Dashboard</h1>
      <section class="panel login-panel">
        <p class="meta-note meta-note-tight">This dashboard is private -- sign in with the one account
          set up for it.</p>
        <form id="login-form" class="login-form">
          <label class="filter-field" for="login-email">
            <span>Email</span>
            <input type="email" id="login-email" required autocomplete="username" />
          </label>
          <label class="filter-field" for="login-password">
            <span>Password</span>
            <input type="password" id="login-password" required autocomplete="current-password" />
          </label>
          <button type="submit" class="login-submit">Sign In</button>
          <p id="login-error" class="login-error" hidden></p>
        </form>
      </section>
    </div>
  `;

  const form = container.querySelector('#login-form');
  const errorEl = container.querySelector('#login-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    const email = form.querySelector('#login-email').value.trim();
    const password = form.querySelector('#login-password').value;
    const submitBtn = form.querySelector('.login-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    try {
      await signIn(email, password);
      // No manual re-render here -- the caller's onAuthChange subscription
      // (app.js's router) reacts to the resulting auth-state change itself.
    } catch (err) {
      errorEl.textContent = 'Sign-in failed -- check the email and password and try again.';
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}
