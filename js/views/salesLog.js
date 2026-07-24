import { escapeHtml, makeSelect } from '../ui.js';
import { getCurrentUser, signOutUser } from '../trackerAuth.js';
import { listSales, addSale, updateSale, deleteSale, listInventoryItems } from '../trackerData.js';

const PLATFORMS = ['In-Person', 'Etsy', 'Instagram/DM', 'Other'];

let editingId = null;

export function cleanup() {
  editingId = null;
}

// Auth is guaranteed by this point -- app.js's router gates every route
// behind sign-in before any view renders, so no per-view check is needed.
export function render(container, data) {
  renderSalesPage(container, data, getCurrentUser());
}

function saleFormHtml(sale, eventNames, itemNames) {
  const editing = !!sale;
  return `
    <form id="sale-form" class="tracker-form">
      <div class="tracker-form-grid">
        <label class="filter-field" for="sale-item"><span>Item</span>
          <input type="text" id="sale-item" list="sale-item-options" required value="${escapeHtml(sale?.itemName || '')}" />
          <datalist id="sale-item-options">${itemNames.map((n) => `<option value="${escapeHtml(n)}"></option>`).join('')}</datalist>
        </label>
        <label class="filter-field" for="sale-event"><span>Event / Venue</span>
          <input type="text" id="sale-event" list="sale-event-options" value="${escapeHtml(sale?.eventName || '')}" placeholder="or type a custom venue" />
          <datalist id="sale-event-options">${eventNames.map((n) => `<option value="${escapeHtml(n)}"></option>`).join('')}</datalist>
        </label>
        <label class="filter-field" for="sale-date"><span>Date</span>
          <input type="date" id="sale-date" required value="${escapeHtml(sale?.saleDate || new Date().toISOString().slice(0, 10))}" />
        </label>
        <label class="filter-field" for="sale-price"><span>Sale Price ($)</span>
          <input type="number" id="sale-price" min="0" step="0.01" required value="${sale?.salePrice ?? ''}" />
        </label>
        <label class="filter-field" for="sale-qty"><span>Quantity</span>
          <input type="number" id="sale-qty" min="1" step="1" value="${sale?.quantity ?? 1}" />
        </label>
        <label class="filter-field" for="sale-platform"><span>Platform</span>
          <select id="sale-platform">
            ${PLATFORMS.map((p) => `<option value="${escapeHtml(p)}" ${sale?.platform === p ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
          </select>
        </label>
      </div>
      <label class="filter-field" for="sale-notes"><span>Notes</span>
        <textarea id="sale-notes" rows="2">${escapeHtml(sale?.notes || '')}</textarea>
      </label>
      <div class="tracker-form-actions">
        <button type="submit" class="login-submit">${editing ? 'Save Changes' : '+ Log Sale'}</button>
        ${editing ? '<button type="button" class="tracker-cancel-edit">Cancel</button>' : ''}
        <p class="login-error" id="sale-form-error" hidden></p>
      </div>
    </form>
  `;
}

function saleRowHtml(sale) {
  const total = (Number(sale.salePrice) || 0) * (Number(sale.quantity) || 1);
  return `
    <article class="card tracker-item-card">
      <div class="card-header">
        <h3>${escapeHtml(sale.itemName)}</h3>
        <span class="competitor-price">$${total.toFixed(2)}</span>
      </div>
      <div class="tracker-item-stats">
        <span class="tracker-stat">${escapeHtml(sale.saleDate)}</span>
        ${sale.eventName ? `<span class="tracker-stat">${escapeHtml(sale.eventName)}</span>` : ''}
        <span class="tracker-stat">${escapeHtml(sale.platform || 'Other')}</span>
        ${sale.quantity > 1 ? `<span class="tracker-stat">Qty ${sale.quantity}</span>` : ''}
      </div>
      ${sale.notes ? `<p class="card-note">${escapeHtml(sale.notes)}</p>` : ''}
      <div class="tracker-item-actions">
        <button type="button" class="tracker-edit-btn" data-id="${escapeHtml(sale.id)}">Edit</button>
        <button type="button" class="tracker-delete-btn" data-id="${escapeHtml(sale.id)}">Delete</button>
      </div>
    </article>
  `;
}

async function renderSalesPage(container, data, user) {
  const eventNames = (data.conventions || []).map((c) => c.name);

  container.innerHTML = `
    <div class="tracker-header">
      <h1>Sales Log</h1>
      <div class="tracker-header-actions">
        <span class="tracker-signed-in">Signed in as ${escapeHtml(user.email)}</span>
        <button type="button" id="tracker-signout" class="link-more link-more-inline">Sign Out</button>
      </div>
    </div>
    <p class="meta-note">What's sold, where, and for how much. Not part of the public research archive;
      only visible while signed in.</p>

    <div class="stat-chip-row" id="sale-stats"></div>

    <section class="panel">
      <h2 id="sale-form-heading">Log a Sale</h2>
      <p class="loading-note">Loading item list&hellip;</p>
    </section>

    <div class="filter-bar">
      ${makeSelect('sale-platform-filter', 'Platform', [{ value: '', label: 'All platforms' }, ...PLATFORMS.map((p) => ({ value: p, label: p }))])}
    </div>
    <div id="sale-count" class="results-count"></div>
    <div id="sale-results" class="card-grid">
      <p class="loading-note">Loading sales&hellip;</p>
    </div>
  `;

  container.querySelector('#tracker-signout').addEventListener('click', () => signOutUser());

  let sales = [];
  let inventoryItems = [];
  try {
    [sales, inventoryItems] = await Promise.all([listSales(), listInventoryItems()]);
  } catch (err) {
    container.querySelector('#sale-results').innerHTML = `<p class="empty-note">Couldn't load sales: ${escapeHtml(err.message)}</p>`;
    return;
  }

  const itemNames = inventoryItems.map((it) => it.name);
  const formSection = container.querySelector('#sale-form-heading').closest('section');
  formSection.innerHTML = `<h2 id="sale-form-heading">Log a Sale</h2>${saleFormHtml(null, eventNames, itemNames)}`;
  wireForm(container, data, sales, eventNames, itemNames);

  const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.salePrice) || 0) * (Number(s.quantity) || 1), 0);
  container.querySelector('#sale-stats').innerHTML = `
    <div class="stat-chip">
      <div class="stat-chip-label">Sales Logged</div>
      <div class="stat-chip-value">${sales.length}</div>
      <div class="stat-chip-caption">total transactions</div>
    </div>
    <div class="stat-chip">
      <div class="stat-chip-label">Total Revenue</div>
      <div class="stat-chip-value">$${totalRevenue.toFixed(2)}</div>
      <div class="stat-chip-caption">all logged sales</div>
    </div>
  `;

  const platformEl = container.querySelector('#sale-platform-filter');
  const resultsEl = container.querySelector('#sale-results');
  const countEl = container.querySelector('#sale-count');

  function applyFilters() {
    const platform = platformEl.value;
    const list = sales.filter((s) => !platform || s.platform === platform);
    countEl.textContent = `${list.length} sale${list.length === 1 ? '' : 's'}`;
    resultsEl.innerHTML = list.length
      ? list.map(saleRowHtml).join('')
      : '<p class="empty-note">No sales match that filter.</p>';
  }

  platformEl.addEventListener('input', applyFilters);

  resultsEl.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.tracker-edit-btn');
    const delBtn = e.target.closest('.tracker-delete-btn');
    if (editBtn) {
      editingId = editBtn.dataset.id;
      const sale = sales.find((s) => s.id === editingId);
      formSection.innerHTML = `<h2 id="sale-form-heading">Edit Sale</h2>${saleFormHtml(sale, eventNames, itemNames)}`;
      wireForm(container, data, sales, eventNames, itemNames);
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (delBtn) {
      if (!window.confirm('Delete this sale entry? This cannot be undone.')) return;
      await deleteSale(delBtn.dataset.id);
      renderSalesPage(container, data, user);
    }
  });

  applyFilters();
}

function wireForm(container, data, sales, eventNames, itemNames) {
  const form = container.querySelector('#sale-form');
  const errorEl = container.querySelector('#sale-form-error');
  const cancelBtn = form.querySelector('.tracker-cancel-edit');
  const formSection = form.closest('section');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      editingId = null;
      formSection.innerHTML = `<h2 id="sale-form-heading">Log a Sale</h2>${saleFormHtml(null, eventNames, itemNames)}`;
      wireForm(container, data, sales, eventNames, itemNames);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    const payload = {
      itemName: form.querySelector('#sale-item').value.trim(),
      eventName: form.querySelector('#sale-event').value.trim() || null,
      saleDate: form.querySelector('#sale-date').value,
      salePrice: Number(form.querySelector('#sale-price').value) || 0,
      quantity: Number(form.querySelector('#sale-qty').value) || 1,
      platform: form.querySelector('#sale-platform').value,
      notes: form.querySelector('#sale-notes').value.trim(),
    };
    const submitBtn = form.querySelector('.login-submit');
    submitBtn.disabled = true;
    try {
      if (editingId) {
        await updateSale(editingId, payload);
        editingId = null;
      } else {
        await addSale(payload);
      }
      const user = getCurrentUser();
      renderSalesPage(container, data, user);
    } catch (err) {
      errorEl.textContent = `Couldn't save: ${err.message}`;
      errorEl.hidden = false;
      submitBtn.disabled = false;
    }
  });
}
