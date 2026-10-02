# IBM Payment Integrity — platform demo

One static, no-build web app that demonstrates IBM Payment Integrity across several government programs. A **program picker** opens first; each program (use case) runs on the same shared engine — rules + ML/AI scoring, network analytics, case management with supervisor approval, the Investigative Assistant and the audit trail — with its own data, screens and guided tour. **All data is synthetic** (see the banner).

| Program | `?uc=` | Status |
|---|---|---|
| Healthcare claims (Medicaid · TRICARE · commercial) | `health` | Live |
| Disaster Relief (FEMA Individual Assistance) | `fema` | Live |
| Unemployment Insurance, federal workers' comp (DOL) · tax refunds, Do Not Pay, rental assistance (Treasury) · student aid (ED) · VHA, VBA (VA) | `ui` `feca` `irs` `dnp` `era` `fsa` `vha` `vba` | Coming soon |

`opportunities.html` is the one-page opportunity map, linked from the picker; its figures are sourced in the page footer.

Links: `/` opens the picker · `/?uc=fema` opens Disaster Relief directly · `/?uc=health` opens Healthcare. The program switch next to the logo returns to the picker from anywhere. Each program opens with its short guided tour.

## Releasing an update
Script and style links in `index.html` carry a version tag (`?v=...`). Change it on every release (one find-and-replace in `index.html`) so browsers fetch the new files instead of cached ones; pack files pick up the same tag automatically.

## Add a program
1. Create `assets/packs/<id>/` with the program's files. A pack loads after the shared engine and before boot, and overrides what it needs:
   - data (e.g. `<id>-data.js`), attached to a global like `window.FEMA`;
   - wiring (`<id>-pack.js`): adds its records as leads, sets `APP.SUBS`/`APP.VIEW_AREA` (navigation), `APP.REASONS` (decision codes), wraps `window.AI` for the assistant, sets `window.UC_PACK.vocab`;
   - screens in `views/`, each replacing a shared view by name (`Views.home`, `Views.queue`, `Views.claim`, `Views.edi`, `Views.network`, ...);
   - the tour (`<id>-tour.js`): `window.UC_PACK.tour = function (helpers) { return { trail, steps } }`, read by `assets/demo.js`.
2. Add one entry to `assets/programs.js` with `live: true` and the pack's scripts in load order.

`assets/packs/fema/` is the worked example. Healthcare is still the shared base data and screens; `assets/packs/health/pack.js` only sets its tour mode.

## Run
No build step, no dependencies. Serve statically:
```
python3 -m http.server 8137     # then open http://localhost:8137
```
(or just open `index.html`). It runs in **local mode** (`supabaseUrl: ""` in `assets/config.js`): the program picker replaces login and state resets on reload. Login and persistence can be added back later by pointing `assets/config.js` at a Supabase project; give saved state a per-program key so programs don't collide.

**→ Full from-scratch setup (new machine / new accounts, local · Supabase · GitHub Pages): [`SETUP.md`](SETUP.md).**
Everything environment-specific lives in one file: [`assets/config.js`](assets/config.js).

## Regenerate data
```
npm run gen:data      # -> src/data/dataset.json + assets/data.js (deterministic, seed 20260701)
```

## Deploy (GitHub Pages)
Push this folder to a repo → Settings › Pages › Deploy from branch `main` `/ (root)`. Any static host works too. See [`SETUP.md`](SETUP.md).

## Structure
```
index.html            app shell (chrome, nav, script order)
assets/programs.js    the program list + loader (?uc=<id>) and the header program switch
assets/picker.js      the program picker
assets/packs/<id>/    one folder per program (fema = Disaster Relief; health = Healthcare)
assets/
  styles.css          design system (locked tokens, PIVOT_DEMO_DESIGN.md §7b)
  data.js             generated: window.PIVOT_DATA
  provider.js         DataProvider seam (window.DP) — swap for Neo4j later, same shapes
  collusion.js        shared collusion analysis + network graph + business-entity node (window.Collusion)
  ai.js               deterministic "Gen AI" (window.AI) — adjudication brief, copilot, rationale
  export.js           zero-dependency CSV / Excel / PDF exports (window.EXPORT)
  app.js              router, state, prepay/retro mode, watchlists, audit, decisions (window.APP)
  views/              home · queue (retro + prepay triage) · claim (tabbed) · provider report card ·
                      businesses (registry + profile) · network · analytics · heatmap · rules · audit · …
scripts/generate-data.mjs   synthetic-data generator (also a Neo4j loader later)
src/data/dataset.json       canonical graph-shaped snapshot
```

## Swappable seams
- `assets/provider.js` — `window.DP`; today reads the JSON snapshot, later a Neo4j provider returns the same shapes.
- `assets/ai.js` — `window.AI`; today deterministic, later a live Gemini/Claude call via a serverless proxy.
- **See [`DATA_SPEC.md`](DATA_SPEC.md)** for the full `window.DP` contract, `window.PIVOT_DATA` shapes, three swap recipes, and where each real-data deliverable drops in. No UI change either way.
