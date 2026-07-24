import { escapeHtml } from '../ui.js';
import { signIn } from '../trackerAuth.js';
import { isFirebaseConfigured } from '../firebaseConfig.js';

/**
 * Renders a sign-in form into `container` and calls `onSignedIn()` once auth
 * succeeds (the caller re-renders its own view in response). Shared by both
 * Tracker pages so signing in on one immediately unlocks the other too.
 */
export function renderLogin(container, { title = 'Sign In' } = {}) {
  if (!isFirebaseConfigured) {
    container.innerHTML = `
      <h1>${escapeHtml(title)}</h1>
      <section class="panel panel-warning">
        <h2 class="warning-heading">Tracker not configured yet</h2>
        <p class="card-note">This section needs a Firebase project connected before it'll work --
          fill in <code>js/firebaseConfig.js</code> with your project's web config
          (Firebase Console &rarr; Project Settings &rarr; Your apps), then reload.</p>
      </section>
    `;
    return;
  }

  container.innerHTML = `
    <h1>${escapeHtml(title)}</h1>
    <section class="panel login-panel">
      <p class="meta-note meta-note-tight">This section holds real inventory and sales figures, so it's kept
        signed out by default -- sign in with the one account set up for this dashboard.</p>
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
    } catch (err) {
      errorEl.textContent = 'Sign-in failed -- check the email and password and try again.';
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}
