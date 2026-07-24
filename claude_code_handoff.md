# Claude Code Handoff: Crochet Plushie Business Dashboard

## Context

I run a crochet plushie business (sold at California conventions and online). I've done extensive market research with Claude over several conversations, covering shipping/packaging costs, competitor pricing, convention calendars, seasonal trends, copyright considerations, and inventory-clearance strategies. That research is compiled in an Excel workbook, which is genuinely useful but hard to browse, search, or keep "at a glance" current.

I want to replace/supplement it with a lightweight web dashboard.

## What to build

A **free-to-host, static web dashboard** (no ongoing server/database costs) that makes this research easy to browse, search, and act on. Attached is `dashboard_data.json`, containing all the structured research data — use it as the initial data source.

### Must-have features

1. **"Right now" snapshot / home view**
   - Auto-calculate and display days-until for every convention in the data
   - Surface the next 3-5 upcoming events prominently
   - Flag which seasonal window we're currently in (e.g. "Halloween prep starts in ~3 weeks") based on today's date
   - Highlight any event tagged `strong-fit` for dark-fantasy that's coming up soon

2. **Convention calendar / browser**
   - Full list, sortable by date
   - Filterable by category (anime / comics / horror / renfaire / general / multi) and by fit-tag (fandom / general / dark-fantasy / seasonal-*)
   - Visually distinguish "strong fit" dark-fantasy/horror venues (Sinister Creature Con, Sinister Halloween Con, the two Renaissance Faires) from general ones
   - Show location, dates, scale, and the fit note for each

3. **Competitor pricing browser**
   - Searchable/filterable table: platform, niche, price range, notes, link out to their shop/social
   - Group by niche (general / fandom / dark-fantasy / premium-custom)

4. **Section-based pages mirroring the workbook's other tabs**, each with search/filter where it makes sense:
   - Shipping tiers & packaging costs
   - Digital pattern pricing benchmarks
   - Seasonal cycle (general holiday calendar)
   - Historical/trend timeline (with confidence-level indicators — some data points are well-sourced, some are directional only; preserve that distinction visually, e.g. a badge showing High/Medium/Low confidence)
   - Removable-parts premium feature research
   - Clearing old inventory / mystery bag strategies
   - Copyright quick-reference (safe categories, Lovecraft-specific notes, the Baby Yoda cease-and-desist precedent as a cautionary example)

5. **Global search** across all sections (a simple client-side search over the JSON is fine — no need for a search backend)

6. **Data freshness indicators** — since a lot of this data has a "verify before relying on it" caveat (postage rates, platform pricing, unconfirmed convention dates), show a "last verified" date per data point where available, and visually flag anything marked as unconfirmed/estimated vs. sourced-and-confirmed.

### Nice-to-have / design for later

- **Future shop integration**: architect the data layer so that a future step (e.g. pulling live Etsy listing data, or inventory counts from a shop platform) could plug in as an additional data source without a rebuild. Don't build the integration now — just don't paint us into a corner. A clean `data/` folder with typed JSON and a simple fetch/load abstraction is enough.
- A way to add new data points (new conventions found later, new competitor entries) by editing JSON rather than code — keep the data format simple and well-commented so I can hand you updates in the future and you can regenerate the JSON, or so I could edit it directly if needed.
- Mobile-friendly — I may check this while at a convention or Ren Faire deciding on the fly.

### Tech suggestions (your call, but here's my thinking)

- Plain HTML/CSS/JS or a lightweight framework (Vite + vanilla JS, or a small React app) — avoid heavy frameworks/backends given this is a personal tool with no login/auth needs
- Static JSON as the data source for now (the attached file)
- Deployable free via GitHub Pages, Cloudflare Pages, or Vercel's free tier
- No build complexity that requires paid CI/CD

## Attached data

`dashboard_data.json` — structured export of all research to date: conventions (with dates, categories, fit tags, notes), shipping tiers, competitor pricing, digital pattern pricing, seasonal cycle, historical timeline (with confidence levels), removable-parts research, inventory-clearance strategies, Wix pricing tiers, and copyright quick-reference notes.

## What I'd like from you first

Before writing code, give me a short plan: proposed file/folder structure, how you'll structure the data-loading layer (for future shop-integration extensibility), and what the page/navigation structure will look like. Then build it.
