# Session Handoff: Hella Bella Crochet Dashboard

Paste this into a fresh Claude Code session to continue work with full context.

## What this is

A static web dashboard for a crochet plushie business ("Hella Bella," Instagram @darksundesigns) selling at California conventions/Ren Faires and online. It aggregates convention listings, competitor pricing, and ~15 research passes worth of business/market findings into one browsable, searchable, filterable site. Plain HTML/CSS/JS, no framework, no build step for the dev version. Currently **local-only** — nothing has been deployed or pushed anywhere.

**Important boundary:** this project lives at `C:\Users\kfoti\Desktop\General\Claude\crochet-dashboard`, is unrelated to the user's day job, and does **not** use the externa.io/Vercel deployment workflow described in the user's global CLAUDE.md (that workflow is for a different repo, `callerservices/kfoti`, at a different local path). Don't conflate the two.

## Running it

- Dev server: `.claude/launch.json` has a `crochet-dashboard` config (`npx serve crochet-dashboard -l 5180`). Start/stop it via the `mcp__Claude_Browser__preview_start` / `preview_stop` tools, not Bash.
- The folder is named `crochet-dashboard` (no space) deliberately — it was originally `Crochet Dashboard` but the space broke the preview tool's command parsing.
- **Offline distribution**: `node scripts/build-offline.js` from the project root bundles everything (via esbuild) into `dist-offline/` — a single `bundle.js` with the JSON data inlined, openable via double-click with no server. This is a **manual step, not automatic** — re-run it after any change you want reflected in the offline copy. Verify it with a real headless-Chrome `file://` screenshot (not just localhost), e.g.:
  ```
  chrome.exe --headless --disable-gpu --no-sandbox --screenshot=out.png --window-size=1280,900 --virtual-time-budget=3000 "file:///.../dist-offline/index.html"
  ```
  (Both `fetch()` and ES modules are blocked by Chrome under `file://`, which is why this bundling step exists at all.)

## File structure

```
crochet-dashboard/
  index.html              sidebar shell (brand, moon-phase decor, search, nav)
  css/style.css            single dark "Hella Bella" theme -- OKLCH tokens, no light mode
  js/
    app.js                  router, grouped nav (Sell/Research/Reference), global search, ticker bar
    ui.js                    shared render helpers: badges, findingList() (confidence-grouped,
                              star-toggleable finding rows), confidenceFilterBar()/initConfidenceFilter()
    dates.js                 days-until / season-status calculations
    search.js                 builds the global search index from all data sections
    dataSource.js              fetch-based data loader (dev/live only -- offline build swaps this)
    appliedTracker.js           localStorage: which conventions user marked "Applied" (Set of names)
    starTracker.js               localStorage: which findings user starred (Set of finding text)
    views/
      home.js                     hero cards, stat chips, Best Value panel, seasonal/strong-fit row
      conventions.js                filters + sort + hide-past + All/My-Applications tabs + Vendor Details disclosure
      competitors.js, clearance.js, shipping.js, patterns.js, seasonal.js, timeline.js, copyright.js
      researchPage.js                config-driven generic renderer for Product Demand / Materials /
                                       Business Setup -- these 3 pages are just PAGES{} entries here now
                                       (dataKey, title, intro, sections[]). Add a section to the data +
                                       to this config; no new view file needed.
  data/dashboard_data.json    single source of truth (see schema below)
  assets/*.jpg                 3 photos (moon-lake, dragon-moon, moon-trees) used as design accents
  scripts/build-offline.js      the offline bundler described above
  dist-offline/                 generated output -- not hand-edited, regenerate via the script
  design_handoff.md               original written design brief (superseded -- see below)
  Crochet dashboard design handoff/   prototype bundle from "Claude Design" (reference only, not code)
```

## Data schema (`data/dashboard_data.json`)

Top-level keys: `meta, conventions, shippingTiers, competitors, digitalPatternPricing, seasonalCycle, historicalTimeline, clearingOldInventory, copyrightNotes, conventionRankings, productDemand, materialsSuppliers, businessSetup`

- **`meta.notes`** is the short 2-sentence blurb shown on Home -- keep it short. **`meta.changelog`** is an array of edit-history strings that is *not* rendered anywhere; append session notes there, never to `meta.notes` again (it grew to 2,500 chars and broke the Home layout once already -- fixed this session).
- **`conventions`** (43 entries): `{ name, location, startDate, endDate, recurrence?, category, scale, fitTags[], note, costData: {tableCost, juryRequired, attendanceEstimate, barrierLevel, confidence, source}, applicationWindow?: {opens, closes, mechanism, confidence, source} }`. Categories now include `oddities`, `craft`, `furry`, `gaming` (added this session) alongside the originals -- badges/filters pick these up automatically, no special-casing needed. **10 of the 43 have `startDate: null`** (dates not yet confirmed for 2026/2027) -- worth periodically re-checking.
- **`conventionRankings`**: `{ researchDate, currentInventoryTopPicks[], darkFantasyTopPicks[], caveat }` -- curated (not auto-derived) picks shown in Home's Best Value panel, each `{name, reason}` referencing a convention by exact name match.
- **`productDemand` / `materialsSuppliers` / `businessSetup`**: each has a `researchDate`, an `atAGlance` array of synthesized-takeaway strings (editorial, not sourced -- rendered in a gold callout box), and several arrays of `{finding, confidence, source}` objects rendered via `findingList()`. **118 findings total** across these three pages. `confidence` is free text (`"High"`, `"Medium-High"`, `"Low"`, `"Data gap"`, etc.) -- `confidenceClass()` in ui.js normalizes it via `startsWith()`, so new values are fine as long as they start with high/medium/low or you accept the "unknown" bucket.
- **Removed**: `removablePartsPremium` and `wixPricing` (the old Premium Features page) were deleted entirely at the owner's request -- don't re-add without being asked.

## Interaction patterns already built (don't rebuild differently)

- **Confidence grouping + filtering**: every `findingList()` groups items into High/Medium/Low-&-Data-Gaps sub-headers with counts, using native `<details>/<summary>` for expand (zero JS state needed for that part). `confidenceFilterBar()` + `initConfidenceFilter()` add All/High-only/Medium-&-up chips plus an independent "★ Starred Only" toggle, composable together (`applyFindingFilters()` in ui.js hides whole `.finding-group`s when no child row is visible).
- **Star tracking** (`starTracker.js`): personal "this matters to me" flag per finding, keyed by the finding's own text (no IDs exist). Device-local via localStorage, separate axis from confidence.
- **Applied tracking** (`appliedTracker.js`): same pattern, scoped to conventions by name, surfaced as an "All Conventions" / "My Applications" tab pair on the Conventions page plus a toggle button per card.
- Both trackers were verified to persist correctly under `file://` (tested via two separate headless-Chrome launches sharing a profile dir) -- Chrome's localStorage does work for local files, contrary to the fetch/ES-module restriction.

## Design system

Single dark "Hella Bella" gothic/moonlit theme -- Cinzel (headings) / Manrope (body) / Cormorant Garamond (italic captions), OKLCH color tokens, sidebar layout with grouped nav (Sell / Research / Reference), moon-phase dots + Cancer zodiac glyph as brand decoration. This came from a design bundle produced by "Claude Design" (see the `Crochet dashboard design handoff/` folder for the original prototype spec if a future design question comes up) and was fully implemented this session, replacing an earlier plain light/dark-toggle version -- the toggle was intentionally dropped in favor of one cohesive theme, confirmed with the user.

## Known open items / things worth re-checking

1. **November 2026 event pileup**: Oddities & Curiosities Expo Sacramento (Nov 14-15), Kearney Renaissance Faire (Nov 14-15, possibly Nov 7-8 -- unconfirmed), Anime Destiny (Nov 15), Harvest Festival (Nov 20-22), Crocker Holiday Artisan Market (Nov 27-29) all cluster together -- the user will need to choose, this hasn't been resolved.
2. **10 conventions have unconfirmed 2026 dates** (see above) -- re-verify periodically, especially anything close on the calendar.
3. **"Chico Renaissance and Fantasy Faire" inaugural-vs-returning status is explicitly unresolved** -- sources conflicted (one says "inaugural," another says "returns to"); its own note field documents the conflict rather than picking a side. Don't state it confidently either way without re-researching.
4. Several `costData`/`applicationWindow` entries are genuinely `"Not publicly posted"` / Low confidence -- that's a real data gap, not a bug to fix.
5. The `mcp__Claude_Browser__computer` screenshot action was intermittently flaky this session ("Browser pane is not displayed"). Reliable fallback used throughout: headless Chrome via Bash with `--screenshot=path.png --window-size=W,H`, then Read the resulting PNG.
6. Not deployed anywhere yet. User has discussed but not decided on GitHub Pages / Netlify / Vercel / Cloudflare Pages, and separately has the offline single-file build as a no-hosting alternative. Don't deploy or push without explicit confirmation.

## Working conventions established this session

- Every new research claim goes into the JSON as `{finding, confidence, source}` with an honest confidence level -- "Data gap" is a valid, expected value when research turned up nothing, not a failure state.
- After any `data/dashboard_data.json` or `js/` edit, verify in the live preview (console errors + relevant DOM checks) **and** rebuild + spot-check `dist-offline/` before considering a task done -- both copies need to stay in sync.
- Small standalone Node scripts in the scratchpad directory (not committed) are the standard way to apply JSON edits programmatically rather than hand-editing the ~3,000-line data file directly.
