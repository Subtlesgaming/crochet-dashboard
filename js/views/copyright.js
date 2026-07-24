import { escapeHtml } from '../ui.js';

export function render(container, data) {
  const c = data.copyrightNotes || {};

  container.innerHTML = `
    <h1>Copyright Quick-Reference</h1>

    <section class="panel">
      <h2>Generally Safe</h2>
      <ul class="check-list">
        ${(c.generallySafe || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
      </ul>
    </section>

    <section class="panel">
      <h2>Lovecraft-Specific Notes</h2>
      <p class="card-note">${escapeHtml(c.lovecraftSpecific)}</p>
    </section>

    <section class="panel panel-warning">
      <h2 class="warning-heading">Risk Evidence: Baby Yoda Precedent</h2>
      <p class="card-note">${escapeHtml(c.riskEvidence)}</p>
    </section>
  `;
}
