# Design Handoff: Crochet Plushie Business Dashboard

## What this is

A personal-use web dashboard for a crochet plushie business (sold at California conventions/Ren Faires and online). It replaces a research spreadsheet with a browsable, searchable site. Built functionally complete and verified working — this pass is purely about how it **looks and feels**, not what it does.

## Tech stack (please keep it this way)

Plain HTML/CSS/JS, no framework, no build step. Client-side hash routing (`#/conventions`, `#/home`, etc.), all styling in one file at `css/style.css` using CSS custom properties for theming. Please keep changes within this stack — don't introduce a framework, bundler, or CSS preprocessor.

## How to run it

`npx serve crochet-dashboard -l 5180` from the parent folder, then open `http://localhost:5180`. It fetches `data/dashboard_data.json` over HTTP, so it won't render correctly opened directly as a `file://` path.

## File map

```
crochet-dashboard/
  index.html          -- shell: header, search bar, nav, ticker bar, <main id="content">
  css/style.css        -- all styling, CSS variables for light/dark theme
  js/
    app.js              -- router, nav render, search UI, theme toggle, ticker bar
    ui.js                -- shared render helpers (badges, cards, filters, findingList)
    dates.js              -- date/season calculations
    search.js              -- global search index
    dataSource.js            -- data loading (currently static JSON, designed for a future live source)
    views/*.js                -- one file per page (see routes below)
  data/dashboard_data.json      -- all content, single source of truth
```

## Pages (13, in nav order)

1. **Home** (`#/home`) — "Right Now" snapshot: meta note, 4 stat tiles (next event, upcoming count, next strong-fit event, seasonal window), a "Best Value: Where to Sell" panel (two ranked lists with reasoning), a seasonal-window callout, a strong-fit highlight panel, and a "Next Up" event list
2. **Conventions** — filterable/sortable card grid; each card has date/location, fit-tag badges, cost/barrier-to-entry data, and a vendor-application-window callout box
3. **Competitors** — filterable table
4. **Product Demand** — 4 sections of research findings (bestsellers, price range, bundles, gaps), each finding is one list item with a confidence badge + source
5. **Materials** — 5 sections, same finding-list pattern (yarn brands, pricing, quality, wholesale, eyes/stuffing)
6. **Business Setup** — 6 sections, same finding-list pattern (CA legal, Etsy fees, payment processing, booth costs, pricing formulas, marketing)
7. **Shipping** — table
8. **Digital Patterns** — card grid
9. **Seasonal Cycle** — card grid with active/prep state highlighting
10. **Historical Trends** — vertical timeline with confidence badges
11. **Premium Features** — removable-parts research + Wix pricing table
12. **Clearance** — filterable card grid
13. **Copyright** — reference lists

## Current visual language

- Warm cream/navy-adjacent palette (`--bg`, `--panel-bg`, `--accent` etc., all CSS vars), full light/dark support (auto via `prefers-color-scheme`, plus a manual toggle button that overrides via `[data-theme]`)
- Cards (`.card`), panels (`.panel`), and a LOT of small rounded `.badge` elements (category, fit-tag, confidence, barrier, confirmed/unconfirmed) — badges are the primary way secondary metadata gets surfaced throughout
- A "finding-list" pattern (plain `<li>` + confidence badge + tiny gray source text) used identically across the three newest research pages (Product Demand, Materials, Business Setup) — 19–35 list items per page, currently just stacked vertically with no visual grouping beyond section headings
- Mobile: collapsible hamburger nav, single-column card grids

## What I'd like design eyes on specifically

1. **Nav has grown to 13 flat items** — original design assumed ~10. It's starting to wrap awkwardly and the labels compete for attention. Worth considering grouping/categorizing (e.g. a dropdown or grouped sections: "Sell" / "Research" / "Reference") rather than one flat row.
2. **Badge density** — convention cards in particular can stack 4-6 badges (category, fit tags, barrier, confidence, jury status, attendance). Check whether this reads as informative or as noise, and whether a hierarchy (primary badge vs. secondary metadata) would help.
3. **The finding-list pattern is doing a lot of work but has had zero dedicated design attention** — it's the container for ~80 research findings across 3 pages. As the plainest-styled part of the site, it's the best candidate for a real design pass: better scannability, maybe visual distinction by confidence level beyond just the badge color, source citation treatment.
4. **Home page has gotten dense** — stat grid + best-value panel + seasonal panel + strong-fit panel + next-up list, all as stacked `.panel` blocks. Check if the hierarchy still reads clearly or if the most important info (the whole point of "Right Now") gets buried.
5. **General polish pass**: typography scale, spacing rhythm, whether the warm/muted palette is doing its job, whether dark mode holds up as well as light mode, whether the persistent ticker bar under the header is well-integrated or feels bolted on.

## Constraints

- Keep it a static site (no backend/build step)
- Keep it mobile-friendly — this may get checked at a convention or Ren Faire on a phone
- Don't touch the data layer (`data/dashboard_data.json`, `dataSource.js`) — this is a design pass, not a data or feature pass
- Nothing has been deployed publicly yet — this is still local-only, so feel free to iterate freely
