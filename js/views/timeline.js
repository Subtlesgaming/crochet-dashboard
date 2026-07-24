import { escapeHtml, confidenceBadge } from '../ui.js';

export function render(container, data) {
  const timeline = (data.historicalTimeline || []).slice();

  container.innerHTML = `
    <h1>Historical Trends</h1>
    <p class="meta-note">Confidence badges reflect how well-sourced each data point is -- some are directional only.</p>
    <ol class="timeline">
      ${timeline.map((t) => `
        <li class="timeline-item">
          <div class="timeline-year">${escapeHtml(t.year)}</div>
          <div class="timeline-event">${escapeHtml(t.event)} ${confidenceBadge(t.confidence)}</div>
          <div class="timeline-relevance">${escapeHtml(t.relevance)}</div>
          <div class="timeline-source">Source: ${escapeHtml(t.source)}</div>
        </li>
      `).join('')}
    </ol>
  `;
}
