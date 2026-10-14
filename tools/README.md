# tools

Scripts for producing the presentation assets from this site. Not loaded by the site.

| Script | What it makes |
|---|---|
| `record-clips-fema.cjs` | The 9 Disaster Relief demo clips (picker, ingest, detect, explain, agents, decision, chain, allnets, funnel) as 1920×1080 MP4s + poster PNGs |
| `record-clips-health.cjs` | The healthcare short-tour clips |
| `build-fema-deck.py` | The Disaster Relief deck: takes the presented healthcare deck (unzipped), swaps in the FEMA clips, text and speaker notes |
| `record-clips-prep.cjs` | The 8 Preparedness Grants clips (ingest, detect, explain, agents, decision, chain, allnets, funnel) |
| `build-prep-deck.py` | The Preparedness Grants deck: takes the presented Disaster Relief deck (`~/Desktop/IBM-Payment-Integrity-Disaster-Relief.pptx`, used as-is, not unzipped), swaps in the clips, text and notes, and adds a hidden appendix slide |
| `record-clips-treas.cjs` | The 11 Treasury clips, following the 12-step tour: ingest, detect, tracklight, explain, agents, decision, chain, allnets, funnel, handoff, irs |
| `build-treas-deck.py` | The Treasury deck (15 slides): takes the Preparedness Grants deck, swaps in the clips, text and notes, and adds three slides (TrackLight checks, the hand-off, the IRS decision) by copying its clip slide 3 |
| `backup-slide.cjs` | The technology-stack backup slide (PptxGenJS) |

**Setup:** serve the site locally (preview config `platform-dev`, port 8171, or `python3 -m http.server 8171` from the repo root). The recorders need Playwright (`NODE_PATH=~/Desktop/aucket/node_modules`) and `ffmpeg`.

**Output** goes outside the repo (`~/dev/fema-clips`, `~/dev/health-clips`, `~/dev/prep-clips`, or `$CLIPS_DIR`): each clip leaves a folder of frame images that can be deleted once the MP4 exists. `SITE=<url>` points a recorder at another copy of the site.

Run a single clip by name, e.g. `node tools/record-clips-fema.cjs detect`.
