import { escapeHtml, makeTextFilter, makeSelect } from '../ui.js';
import { getCurrentUser, signOutUser } from '../trackerAuth.js';
import { listInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../trackerData.js';

const CATEGORIES = ['Mini/Keychain', 'Small', 'Medium', 'Large', 'Custom/Commission'];

let editingId = null;

export function cleanup() {
  editingId = null;
}

// Auth is guaranteed by this point -- app.js's router gates every route
// behind sign-in before any view renders, so no per-view check is needed.
export function render(container, data) {
  renderInventoryPage(container, data, getCurrentUser());
}

function itemFormHtml(item) {
  const editing = !!item;
  return `
    <form id="inv-form" class="tracker-form">
      <div class="tracker-form-grid">
        <label class="filter-field" for="inv-name"><span>Name</span>
          <input type="text" id="inv-name" required value="${escapeHtml(item?.name || '')}" />
        </label>
        <label class="filter-field" for="inv-category"><span>Category</span>
          <select id="inv-category">
            ${CATEGORIES.map((c) => `<option value="${escapeHtml(c)}" ${item?.category === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
          </select>
        </label>
        <label class="filter-field" for="inv-cost"><span>Materials Cost ($)</span>
          <input type="number" id="inv-cost" min="0" step="0.01" value="${item?.materialsCost ?? ''}" />
        </label>
        <label class="filter-field" for="inv-qty"><span>Quantity in Stock</span>
          <input type="number" id="inv-qty" min="0" step="1" required value="${item?.quantity ?? 1}" />
        </label>
        <label class="filter-field" for="inv-date"><span>Date Made</span>
          <input type="date" id="inv-date" value="${escapeHtml(item?.madeDate || '')}" />
        </label>
      </div>
      <label class="filter-field" for="inv-notes"><span>Notes</span>
        <textarea id="inv-notes" rows="2">${escapeHtml(item?.notes || '')}</textarea>
      </label>
      <div class="tracker-form-actions">
        <button type="submit" class="login-submit">${editing ? 'Save Changes' : '+ Add Item'}</button>
        ${editing ? '<button type="button" class="tracker-cancel-edit">Cancel</button>' : ''}
        <p class="login-error" id="inv-form-error" hidden></p>
      </div>
    </form>
  `;
}

function itemCardHtml(item) {
  return `
    <article class="card tracker-item-card">
      <div class="card-header">
        <h3>${escapeHtml(item.name)}</h3>
        <span class="badge badge-tag">${escapeHtml(item.category || 'Uncategorized')}</span>
      </div>
      <div class="tracker-item-stats">
        <span class="tracker-stat">${item.quantity ?? 0} in stock</span>
        ${item.materialsCost != null ? `<span class="tracker-stat">$${Number(item.materialsCost).toFixed(2)} materials</span>` : ''}
        ${item.madeDate ? `<span class="tracker-stat">Made ${escapeHtml(item.madeDate)}</span>` : ''}
      </div>
      ${item.notes ? `<p class="card-note">${escapeHtml(item.notes)}</p>` : ''}
      <div class="tracker-item-actions">
        <button type="button" class="tracker-edit-btn" data-id="${escapeHtml(item.id)}">Edit</button>
        <button type="button" class="tracker-delete-btn" data-id="${escapeHtml(item.id)}">Delete</button>
      </div>
    </article>
  `;
}

async function renderInventoryPage(container, data, user) {
  container.innerHTML = `
    <div class="tracker-header">
      <h1>Inventory</h1>
      <div class="tracker-header-actions">
        <span class="tracker-signed-in">Signed in as ${escapeHtml(user.email)}</span>
        <button type="button" id="tracker-signout" class="link-more link-more-inline">Sign Out</button>
      </div>
    </div>
    <p class="meta-note">Your own stock -- what you've made, how much is left, and what it cost to make.
      Not part of the public research archive; only visible while signed in.</p>

    <section class="panel">
      <h2 id="inv-form-heading">Add New Item</h2>
      ${itemFormHtml(null)}
    </section>

    <div class="filter-bar">
      ${makeTextFilter('inv-search', 'Search inventory...')}
      ${makeSelect('inv-cat-filter', 'Category', [{ value: '', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))])}
    </div>
    <div id="inv-count" class="results-count"></div>
    <div id="inv-results" class="card-grid">
      <p class="loading-note">Loading inventory&hellip;</p>
    </div>
  `;

  container.querySelector('#tracker-signout').addEventListener('click', () => signOutUser());

  let items = [];
  try {
    items = await listInventoryItems();
  } catch (err) {
    container.querySelector('#inv-results').innerHTML = `<p class="empty-note">Couldn't load inventory: ${escapeHtml(err.message)}</p>`;
    return;
  }

  wireForm(container, data, items);

  const searchEl = container.querySelector('#inv-search');
  const catEl = container.querySelector('#inv-cat-filter');
  const resultsEl = container.querySelector('#inv-results');
  const countEl = container.querySelector('#inv-count');

  function applyFilters() {
    const q = searchEl.value.trim().toLowerCase();
    const cat = catEl.value;
    const list = items.filter((it) => {
      if (cat && it.category !== cat) return false;
      if (q && !`${it.name} ${it.notes || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    countEl.textContent = `${list.length} item${list.length === 1 ? '' : 's'}`;
    resultsEl.innerHTML = list.length
      ? list.map(itemCardHtml).join('')
      : '<p class="empty-note">No inventory items match those filters.</p>';
  }

  [searchEl, catEl].forEach((el) => el.addEventListener('input', applyFilters));

  resultsEl.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.tracker-edit-btn');
    const delBtn = e.target.closest('.tracker-delete-btn');
    if (editBtn) {
      editingId = editBtn.dataset.id;
      const item = items.find((it) => it.id === editingId);
      const formSection = container.querySelector('#inv-form-heading').closest('section');
      formSection.querySelector('#inv-form-heading').textContent = 'Edit Item';
      formSection.querySelector('.tracker-form').outerHTML = itemFormHtml(item);
      wireForm(container, data, items);
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (delBtn) {
      if (!window.confirm('Delete this inventory item? This cannot be undone.')) return;
      await deleteInventoryItem(delBtn.dataset.id);
      renderInventoryPage(container, data, user);
    }
  });

  applyFilters();
}

function wireForm(container, data, items) {
  const form = container.querySelector('#inv-form');
  const errorEl = container.querySelector('#inv-form-error');
  const cancelBtn = form.querySelector('.tracker-cancel-edit');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      editingId = null;
      const formSection = container.querySelector('#inv-form-heading').closest('section');
      formSection.querySelector('#inv-form-heading').textContent = 'Add New Item';
      formSection.querySelector('.tracker-form').outerHTML = itemFormHtml(null);
      wireForm(container, data, items);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    const payload = {
      name: form.querySelector('#inv-name').value.trim(),
      category: form.querySelector('#inv-category').value,
      materialsCost: form.querySelector('#inv-cost').value ? Number(form.querySelector('#inv-cost').value) : null,
      quantity: Number(form.querySelector('#inv-qty').value) || 0,
      madeDate: form.querySelector('#inv-date').value || null,
      notes: form.querySelector('#inv-notes').value.trim(),
    };
    const submitBtn = form.querySelector('.login-submit');
    submitBtn.disabled = true;
    try {
      if (editingId) {
        await updateInventoryItem(editingId, payload);
        editingId = null;
      } else {
        await addInventoryItem(payload);
      }
      const user = getCurrentUser();
      renderInventoryPage(container, data, user);
    } catch (err) {
      errorEl.textContent = `Couldn't save: ${err.message}`;
      errorEl.hidden = false;
      submitBtn.disabled = false;
    }
  });
}
