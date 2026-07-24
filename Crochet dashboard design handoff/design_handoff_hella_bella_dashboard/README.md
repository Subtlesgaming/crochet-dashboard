# Handoff: Hella Bella Dashboard — Visual/UX Redesign

## Overview
This is a visual/UX redesign pass on an existing, functionally-complete static dashboard for a crochet plushie business ("Hella Bella", Instagram @darksundesigns). The dashboard tracks conventions, competitor pricing, market research, materials sourcing, business setup costs, and reference material across 13 pages, all driven by one JSON data file. The original app is plain HTML/CSS/JS with client-side hash routing — **this redesign does not change that requirement**; it only restyles and reorganizes the UI.

Original codebase structure (for reference — not included in this bundle, the developer already has it):
```
crochet-dashboard/
  index.html
  css/style.css
  js/app.js, ui.js, dates.js, search.js, dataSource.js
  js/views/*.js   (one per page)
  data/dashboard_data.json
```

## About the Design Files
The files in this bundle (`Hella Bella Dashboard.dc.html`, `FindingList.dc.html`) are **design references built in an HTML prototyping tool** — they demonstrate the intended look, layout, and interaction, but are NOT production code to copy verbatim (they use a custom templating runtime — `<sc-if>`, `<sc-for>`, `<x-import>`, `{{ }}` bindings — that only exists in the prototyping tool, and all styling is written as inline styles for that tool's constraints). **The task is to recreate this design in the target codebase's existing stack** (plain HTML/CSS/JS with hash routing, matching the original app's architecture): a real `css/style.css` with proper classes/custom properties, and view logic ported into `js/views/*.js` following the existing per-page-module pattern. Do not import the prototype's runtime or its templating syntax into the app.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and component treatments below are final — implement pixel-close, not just "in the spirit of." Where an exact value isn't listed, look it up directly in `Hella Bella Dashboard.dc.html` (all styling is inline on each element, so it's fully inspectable).

## Design Concept
Dark fantasy / gothic aesthetic, tying together three motifs the user asked for: the **Cancer zodiac** (the business owner's sign), the **Moon**, and **calm water** (explicitly not deep/ocean water — avoid anything that reads as open-ocean/abyss). Concretely:
- A moon-over-lake photo (`assets/moon-lake.jpg`) is used as a fixed, full-viewport background image behind the entire app (all pages), scrimmed dark and overlaid with soft "moonglow" radial gradients so content stays legible.
- A small hand-drawn Cancer zodiac glyph (SVG, two circles + curved tails) sits next to the wordmark in the sidebar.
- A 7-dot "moon phase" cycle (new moon → full → waning) is a decorative divider under the sidebar brand block.
- A crescent-moon mark (two offset overlapping circles) is used as the logo mark, the ticker-bar icon, and a small flourish before the "Best Value" heading.
- Cards/panels get a soft outer glow (`filter: drop-shadow(...)`, moonlit-blue tint) as if lit by moonlight, plus a subtle inset top sheen.
- "Good/high-confidence" states use a calm teal (not green) to tie the data-confidence system into the water motif.
- Two more photos (`assets/dragon-moon.jpg`, a dragon silhouette under a moon — used for the dark-fantasy "Strong-Fit Event" hero accent; `assets/moon-trees.jpg`, a full moon through bare branches — used as the sidebar backdrop) reinforce the theme without repeating the same image everywhere.

## Global Layout
- **Structure**: fixed-height (100vh) flex row — a 264px sidebar (fixed chrome, does not scroll with content) + a flex:1 main content area that scrolls independently.
- **Sidebar** (`oklch(0.17 0.025 300)` bg, right border `oklch(0.45 0.05 290 / 0.5)`):
  - Brand block: crescent-moon logo mark (26px, two overlapping circles) + "Hella Bella" wordmark (Cinzel 700 21px) + Cancer SVG glyph + italic tagline "@darksundesigns · convention & craft intelligence" (Cormorant Garamond italic 14px, muted). A faint background photo (`moon-trees.jpg`, opacity 0.28, dark gradient scrim over it) sits behind this block only.
  - 7-dot moon-phase strip below the brand block (each dot 10px circle, partial linear-gradient fills simulating phases).
  - A thin decorative "scallop" divider (repeating radial-gradient bumps, `background-size:16px 8px`) under the moon-phase strip.
  - Search input (full width, rounded 8px) with a live-filtered dropdown of results below it (see Search behavior).
  - Nav: a top-level "Home" link, then three grouped sections — **Sell** (Conventions, Competitors, Clearance, Premium Features), **Research** (Product Demand, Materials, Business Setup, Historical Trends), **Reference** (Shipping, Digital Patterns, Seasonal Cycle, Copyright). Group labels are 10.5px uppercase muted. Active nav item: crimson-tinted background + 3px crimson left border + bold bright text. Inactive: transparent, muted text, transparent left border (reserve the space so active/inactive don't jump).
- **Main area**: sticky mobile top bar (hamburger + wordmark) shown only under ~900px viewport width; a persistent "ticker" bar (next-upcoming-convention countdown, crescent-moon icon, moonlit teal/purple gradient background) sits above the scrollable content; content is padded 36px/40px, max-width 1100px.
- **Mobile (<900px)**: sidebar becomes a fixed, full-height off-canvas panel (slides in via `transform: translateX`) triggered by the hamburger button, with a dark semi-transparent backdrop behind it that closes it on click.

## Design Tokens

### Colors (all OKLCH)
- Background base (page, under the fixed moon-lake photo + scrim): `oklch(0.13 0.018 295)`
- Moonglow ambient gradients (layered over the photo): soft radial washes at `oklch(0.55 0.06 235 / 0.4)`, `oklch(0.5 0.07 250 / 0.28)`, `oklch(0.55 0.05 220 / 0.22)` — spread across the whole viewport (not one central hotspot), plus a dark linear scrim `oklch(0.13 0.018 295 / 0.78→0.86)` between the gradients and the photo for text legibility.
- Sidebar bg: `oklch(0.17 0.025 300)`
- Panel/section bg: `oklch(0.25 0.032 296)`
- Card bg (nested inside panels/grids): `oklch(0.28 0.035 293)`
- Border (default, most panels/cards): `oklch(0.45 0.05 290 / 0.5)`
- Text primary: `oklch(0.94 0.015 85)` (headings) / `oklch(0.92 0.015 85)` (card titles)
- Text secondary/muted: `oklch(0.65 0.025 280)`, `oklch(0.62 0.025 280)`
- Text faint (labels, captions): `oklch(0.55 0.02 280)`, `oklch(0.5 0.02 280)`
- Accent — crimson (primary CTA, "Next Up" hero, price figures): `oklch(0.55 0.17 20)`; lighter variants `oklch(0.75 0.13 20)`, `oklch(0.68 0.11 20)`
- Accent — purple/arcane (dark-fantasy / strong-fit / active nav underlay tint on search labels): `oklch(0.64 0.15 300)`, `oklch(0.55 0.14 300)`
- Accent — gold (moon highlight, "active now" badge): `oklch(0.78 0.11 85)`
- Accent — moonlight silver (moon/water/Cancer motif — logo, moon-phase dots, ticker icon, Cancer glyph): `oklch(0.88 0.03 250)` / `oklch(0.94 0.02 250)` (higher-contrast use)
- Confidence/status — high or "good" (shifted to calm teal, not green, to tie into the water motif): `oklch(0.65 0.09 200)`; medium: `oklch(0.75 0.12 70)`; low: `oklch(0.62 0.12 15)`; unknown: `oklch(0.55 0.02 280)`
- Category tag colors: anime `oklch(0.68 0.13 300)`, comics `oklch(0.68 0.13 250)`, general `oklch(0.65 0.02 280)`, multi `oklch(0.7 0.11 85)`, renfaire `oklch(0.62 0.13 145)`, horror `oklch(0.6 0.15 20)`

### Typography
- **Display / headings**: "Cinzel" (Google Font, weights 500/600/700). Used for the wordmark, all `h1`/`h2`/`h3`, stat values, price figures.
  - Page H1: 32px / 600
  - Section H2: 18–20px / 600
  - Card H3: 15–17px / 600
- **Body / UI**: "Manrope" (Google Font, weights 400–800). Used for all body copy, labels, badges, inputs, nav.
  - Body text: 13–15px / 400–600
  - Labels/eyebrows: 10.5–11px, uppercase, letter-spacing 0.04–0.12em, weight 700
- **Accent/italic**: "Cormorant Garamond" (Google Font, italic 500/600). Used for meta notes, taglines, captions — anywhere the copy wants a quieter, literary tone.
- Google Fonts URL used: `https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&family=Cormorant+Garamond:ital,wght@0,500;1,500;1,600&display=swap`

### Shape / effects
- Panel/section border-radius: 14px. Card border-radius: 12px. Small chips/wix rows: 10px. Banners/hero images: 16px.
- Cards/panels: `box-shadow: inset 0 1px 0 oklch(0.88 0.03 250 / 0.1–0.12)` (subtle top sheen) + `filter: drop-shadow(0 0 18–22px oklch(0.62 0.07 235 / 0.2–0.3))` (moonlit outer glow — tinted purple/gold instead of blue on strong-fit / active-season cards). Hover state on interactive cards: `transform: translateY(-3px)` + a stronger `box-shadow: 0 16px 34px oklch(0.05 0 0 / 0.45), inset 0 1px 0 oklch(0.88 0.03 250 / 0.18)`, transition `0.18s ease`.
- Badges/pills: fully rounded (`border-radius:20px`), 10.5px bold uppercase text, background = the semantic color at 18% opacity, 1px border at 40% opacity, text at full color.

## Pages (13, unchanged information architecture from the original app)
All pages share the panel/card language above. Per-page specifics:

1. **Home** — Meta note (italic, top). Two-column hero row: "Next Up" card (crimson gradient, big Cinzel day-count, event name/location/date, moon-photo circle accent bottom-right at low opacity blended into the card via a radial scrim) + "Next Strong-Fit Event" card (same pattern, purple/arcane gradient, dragon-moon photo accent). Below: two compact stat chips (Upcoming Conventions count, Seasonal Window). Then a "Best Value: Where to Sell" panel with a small crescent-moon flourish before the heading, two side-by-side ranked lists (Current Inventory / Future Dark-Fantasy Inventory) — each item is name + barrier-colored left border + table cost + reasoning text. Then a two-column row: Seasonal Window panel (active-season highlight box + prep-window mini cards) and Strong-Fit Dark-Fantasy Events panel (compact list). Finally a "Next Up" panel: a plain list of the next 5–6 conventions (name + category badge + days-until + location/date), with a "See full convention calendar →" text link at the bottom.
2. **Conventions** — Filter bar (search input, category select, fit-tag select, sort select, "hide past events" checkbox) driving a real client-side filter/sort over the full convention list (must be ported as real JS — see Interactions below). Result count line. Responsive card grid (`auto-fill, minmax(320px,1fr)`). Each card: name + category badge, location/scale, date range, days-until, fit-tag badges, note text, then a click-to-expand "Vendor Details" disclosure (chevron rotates 45°→225° via CSS transform on toggle) revealing table cost + barrier badge + jury/attendance/confidence badges + the application-window block (opens/closes/mechanism). This disclosure is the fix for "6 badges visible at once" — only the category + fit tags show by default; everything else is tucked behind one tap.
3. **Competitors** — Filter bar (search + niche select) over a card list (not a table) — each card: name + price range, platform · niche, note, "Visit shop →" link.
4/5/6. **Product Demand / Materials / Business Setup** — Intro italic paragraph, then N panels (one per research sub-topic, per the original data structure), each containing the **finding-list component** (see below) instead of the old plain `<li>` + badge + gray text pattern.
7. **Shipping** — Rows (not a plain table) — each row: tier badge, examples + weight, packaging + cost + estimated shipping cost, in a 3-column grid per row.
8. **Digital Patterns** — Simple card grid, no filters: type, price range (Cinzel, crimson), example text.
9. **Seasonal Cycle** — Card grid; the currently-active season gets a highlighted gradient background + "Active now" badge; upcoming/prep seasons get a "Prep window" badge.
10. **Historical Trends** — Vertical timeline: a left border line, gold dot per entry, year in gold Cinzel, event text + confidence badge, relevance line, source line.
11. **Premium Features** — Hero card (crimson/purple gradient) with the confirmed price point, a "category confirmed" badge, evidence + caveat text. Below: Wix pricing rows (plan, cost, ecommerce yes/no badge, note).
12. **Clearance** — Search input + card grid: strategy name, pricing, how-it-works, note.
13. **Copyright** — Three stacked panels: "Generally Safe" bullet list (teal dot bullets), "Lovecraft-Specific Notes" text panel, and a "Risk Evidence" panel with a warning-tinted (crimson) background.

## The Finding-List Component (highest-priority piece to get right)
This replaces the old plain-`<li>`-plus-badge pattern used identically across Demand/Materials/Business Setup (~80 items total). Implement as a shared, reusable piece of view logic (matching the original's shared `findingList()` helper pattern in `ui.js`) — do not duplicate the markup three times.

Per finding item:
- A row, not a bare list item: background = card color, `border-left: 3px solid <confidence color>`, asymmetric border-radius (`2px 8px 8px 2px` — sharp on the accent-border side, rounded on the other), padding `13px 16px`, cursor pointer, subtle inset sheen.
- Default (collapsed) state shows: the finding text (15px, full opacity) on the left, and on the right a small dot (7px circle, glowing via `box-shadow: 0 0 6px <color>`) + the confidence label (11px bold uppercase, colored) + a small chevron (rotates on toggle, same 45°→225° CSS transform trick as the convention cards).
- Clicking the row expands it: reveals a top-bordered sub-row with "SOURCE" (uppercase label) + the source citation text (12.5px, muted).
- Confidence color mapping: High → teal `oklch(0.65 0.09 200)`, Medium → amber `oklch(0.75 0.12 70)`, Low → rose `oklch(0.62 0.12 15)`, anything else → gray `oklch(0.55 0.02 280)`.
- Hover state: background lightens slightly + adds outer glow shadow.

This directly answers the "ease of use + at-a-glance readability + expand for detail" requirement from the original brief.

## Interactions & Behavior
- **Routing**: preserve the original's hash-based router (`#/home`, `#/conventions`, etc.) — the prototype uses in-memory React state for page switching (since it's a single-file prototype), but the production app must keep real hash routes so links/back-button/deep-linking keep working.
- **Search**: a global search box in the sidebar filters across all page content (conventions, competitors, every finding, shipping tiers, patterns, seasons, timeline, clearance strategies, premium, copyright) as the user types, showing up to ~8 results grouped with a section label; clicking a result navigates to that page. Port the existing `search.js` index-building logic — the visual redesign only needs to restyle the dropdown, not replace the matching logic.
- **Conventions filters**: search text, category select, fit-tag select, sort (date asc/desc, name A–Z, barrier-to-entry ascending), hide-past-events checkbox — all client-side, live-updating, exactly like the original `conventions.js`. Keep a live result count.
- **Competitors / Clearance filters**: simple text (+ niche select for Competitors) filtering, same pattern as today.
- **Expand/collapse**: convention "Vendor Details" and every finding-list row are independent, per-item toggle state (not accordion — multiple can be open at once).
- **Theme**: this redesign intentionally ships as a **single dark gothic theme** — the original's light/dark toggle was dropped in favor of one cohesive moonlit palette. Confirm with the design owner before adding a light mode back; if requested, treat it as a new palette pass, not a mechanical inversion of these tokens.
- **Responsive**: sidebar collapses to an off-canvas drawer under ~900px (see Global Layout). Card grids use `auto-fill`/`minmax` so they reflow to single-column on narrow viewports without extra breakpoints needed.

## Assets
- `assets/moon-lake.jpg` — full moon reflected in a still lake, used as the fixed full-page background (all pages) and the Home page's hero circle water-motif crop, and on several page banners in the exploration phase (banners were later removed from the final layout — the photo now only appears as the page background and the Home/Seasonal circle accents).
- `assets/dragon-moon.jpg` — dragon silhouette under a moon, used for the "Next Strong-Fit Event" hero card's circular photo accent (dark-fantasy motif).
- `assets/moon-trees.jpg` — full moon through bare branches, used as the sidebar's faint background photo (opacity 0.28, under a dark scrim) and the "Next Up" hero card's circular photo accent.
- All three were supplied directly by the business owner (not stock photos) — reuse them as-is; do not regenerate or replace them.
- `image-slot.js` (bundled here for reference only) is a prototyping-tool-specific drag/drop web component — **do not port this into production**. In the real app, these image spots should simply be `<img>` tags pointing at the three JPGs above (or a normal file-upload flow if the business owner wants to swap them later).

## Data
`dashboard_data.json` (bundled here) is the single source of truth, unchanged from the original app — this redesign does not touch its shape. Do not modify `dataSource.js` or the JSON structure; only the presentation layer changes.

## Screenshots
`screenshots/` contains a full-page capture of each of the 13 pages (01-home.png through 13-copyright.png), for quick visual reference alongside the live prototype file.

## Files in this bundle
- `Hella Bella Dashboard.dc.html` — full-site design reference (all 13 pages, all interactions, as a single-file prototype). This is the primary visual spec — every inline style in it is the source of truth for exact values.
- `FindingList.dc.html` — the reusable finding-list component reference described above, in isolation.
- `dashboard_data.json` — the real data the design was built against.
- `assets/*.jpg` — the three photos described above.
- `image-slot.js` — reference only, do not port (see Assets section).
