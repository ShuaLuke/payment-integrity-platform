// Records the deck's demo clips from the local IBM Payment Integrity build.
// Usage: NODE_PATH=~/Desktop/aucket/node_modules node tools/record-clips-health.cjs [clip ...]
// Records from the platform site (?uc=health). Step numbers below follow the healthcare short tour;
// check them against assets/demo.js SHORT_STEPS before re-recording. Output: $CLIPS_DIR or ~/dev/health-clips.
const { chromium } = require("playwright-core");
const fs = require("fs"), path = require("path"), { execFileSync } = require("child_process");

const BASE = (process.env.SITE || "http://localhost:8171/") + "?uc=health";
const OUT = process.env.CLIPS_DIR || path.join(require("os").homedir(), "dev", "health-clips");
const VW = 1440, VH = 810, SCALE = 1920 / 1440; // 1440x810 CSS px -> 1920x1080 frames
const sleep = ms => new Promise(r => setTimeout(r, ms));

// drawn cursor + click pulse (headless Chromium has no visible pointer)
const CURSOR = `(() => {
  const c = document.createElement('div');
  c.id = 'rec-cursor';
  c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px)';
  c.innerHTML = '<svg width="22" height="22" viewBox="0 0 22 22"><path d="M3 2 L3 18 L7.5 13.8 L10.6 20.6 L13.4 19.4 L10.3 12.7 L16.4 12.7 Z" fill="#161616" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
  document.documentElement.appendChild(c);
  addEventListener('mousemove', e => { c.style.transform = 'translate(' + (e.clientX - 3) + 'px,' + (e.clientY - 2) + 'px)'; }, true);
  addEventListener('mousedown', e => {
    const r = document.createElement('div');
    r.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;left:' + (e.clientX - 16) + 'px;top:' + (e.clientY - 16) + 'px;width:32px;height:32px;border-radius:50%;border:2px solid #0f62fe;opacity:.9;transition:transform .45s ease-out,opacity .45s ease-out';
    document.documentElement.appendChild(r);
    requestAnimationFrame(() => { r.style.transform = 'scale(1.8)'; r.style.opacity = '0'; });
    setTimeout(() => r.remove(), 600);
  }, true);
})()`;

async function fresh(page, step) {
  await page.goto(BASE, { waitUntil: "load" });
  await page.waitForFunction(() => window.APP && window.APP.ready && window.DEMO);
  await sleep(400);
  await page.evaluate(CURSOR);
  if (step != null) await page.evaluate(n => window.DEMO.go(n), step);
  await sleep(900);
  await page.evaluate(() => {
    window.DEMO.hide();
    const p = document.getElementById("demo-pill"); if (p) p.remove();
    document.querySelectorAll("*").forEach(el => { if (el.style && el.style.outline) { el.style.outline = ""; el.style.outlineOffset = ""; } });
    window.scrollTo(0, 0);
  });
  await sleep(500);
}

// cursor helpers
let cur = { x: VW * 0.55, y: VH * 0.6 };
async function moveTo(page, x, y, ms = 700) {
  const steps = Math.max(8, Math.round(ms / 16));
  const sx = cur.x, sy = cur.y;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    await page.mouse.move(sx + (x - sx) * e, sy + (y - sy) * e);
    await sleep(ms / steps);
  }
  cur = { x, y };
}
async function box(page, sel) {
  const el = typeof sel === "string" ? await page.$(sel) : sel;
  if (!el) throw new Error("not found: " + sel);
  const b = await el.boundingBox();
  return { x: b.x + b.width / 2, y: b.y + b.height / 2, b };
}
async function moveToEl(page, sel, ms) { const p = await box(page, sel); await moveTo(page, p.x, p.y, ms); return p; }
async function click(page, sel, ms) { const p = await moveToEl(page, sel, ms); await sleep(250); await page.mouse.down(); await sleep(90); await page.mouse.up(); return p; }
async function smoothScroll(page, dy, ms = 1200, sel) {
  await page.evaluate(({ dy, ms, sel }) => new Promise(res => {
    const el = sel ? document.querySelector(sel) : null;
    const get = () => el ? el.scrollTop : window.scrollY, set = v => el ? (el.scrollTop = v) : window.scrollTo(0, v);
    const s = get(), t0 = performance.now();
    (function f(t) { const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; set(s + dy * e); k < 1 ? requestAnimationFrame(f) : res(); })(t0);
  }), { dy, ms, sel });
}
// element handles found in the page by text / predicate
const byText = (page, sel, re) => page.evaluateHandle(({ sel, src }) => [...document.querySelectorAll(sel)].find(e => new RegExp(src).test(e.textContent.trim())), { sel, src: re.source });
const svgNode = (page, pred) => page.evaluateHandle(pred);

// ---------- the clips ----------
const CLIPS = {
  // slide 1 (title): the whole portfolio, then the Meridian hub
  async title(page) {
    await fresh(page, 6);
    await smoothScroll(page, 0, 10);
    await rec(page, async () => {
      await sleep(600);
      await moveTo(page, 250, 260, 900); await sleep(500);
      await moveTo(page, 1180, 260, 1500); await sleep(500);
      await smoothScroll(page, await page.evaluate(() => document.getElementById("nv-map").getBoundingClientRect().top - 60), 1600);
      await sleep(900);
      const hub = await svgNode(page, () => [...document.querySelectorAll("#nv-map circle")].find(c => c.__data__ && c.__data__.id === "H-N01"));
      await moveToEl(page, hub, 1300); await sleep(2600);
      const hub2 = await svgNode(page, () => [...document.querySelectorAll("#nv-map circle")].find(c => c.__data__ && c.__data__.id === "H-N03"));
      await moveToEl(page, hub2, 1300); await sleep(2400);
    });
  },
  // slide 2: live intake
  async ingest(page) {
    await fresh(page, 0);
    await rec(page, async () => {
      await sleep(700);
      await moveTo(page, 380, 330, 900); await sleep(900);
      await moveTo(page, 420, 520, 900); await sleep(900);
      await moveTo(page, 1150, 420, 1200); await sleep(2600);
      await smoothScroll(page, 560, 1800);
      await moveTo(page, 720, 520, 900); await sleep(2200);
    });
  },
  // slide 3: prepay queue, deny the $17,280 claim
  async detect(page) {
    await fresh(page, 1);
    const row = await byText(page, "tbody tr", /20721/);
    await rec(page, async () => {
      await sleep(600);
      const rec = await row.evaluateHandle(r => [...r.querySelectorAll("td")][4]);
      await moveToEl(page, rec, 1100); await sleep(2200);
      const deny = await row.evaluateHandle(r => [...r.lastElementChild.querySelectorAll("button,span")].find(b => b.textContent.trim() === "Deny"));
      await click(page, deny, 1000); await sleep(1200);
      const tile = await byText(page, ".card, div", /^Payment prevented/);
      await moveToEl(page, tile, 1100); await sleep(2600);
    });
  },
  // slide 4: the flag explained down to the claim line
  async explain(page) {
    await fresh(page, 2);
    await rec(page, async () => {
      await sleep(600);
      const line = await byText(page, "tr", /^H0018/);
      await moveToEl(page, line, 1100); await sleep(700);
      await click(page, line, 300); await sleep(2400);
      await moveTo(page, 520, cur.y + 110, 900); await sleep(1500);
      await smoothScroll(page, 260, 1400); await sleep(1800);
    });
  },
  // slide 5: the three agents in the Investigative Assistant
  async agents(page) {
    await fresh(page, 3);
    const panel = await page.evaluateHandle(() => [...document.querySelectorAll("body > div")].find(d => d.style.width === "370px"));
    const scroller = await panel.evaluate(p => { const s = [...p.querySelectorAll("div")].find(d => d.scrollHeight > d.clientHeight + 40 && getComputedStyle(d).overflowY !== "visible"); if (s) s.id = "rec-scroll"; return !!s; });
    await rec(page, async () => {
      await sleep(600);
      await moveTo(page, 1250, 300, 1000); await sleep(1600);
      if (scroller) { await smoothScroll(page, 300, 2000, "#rec-scroll"); await sleep(1500); await smoothScroll(page, 320, 2000, "#rec-scroll"); }
      await moveTo(page, 1250, 520, 800); await sleep(2000);
    });
  },
  // slide 6: the analyst's decision on Pacific Sands
  async decision(page) {
    await fresh(page, null);
    await page.evaluate(() => {
      const me = window.APP.ROLES[window.APP.state.role].name;
      window.APP.assignCase("20538", me); window.APP.startLeadReview("20538"); window.APP.openAllegation("20538");
      const t = document.querySelector('.ctab[data-tab="decision"]'); if (t) t.click();
    });
    await sleep(900);
    await page.evaluate(() => { window.DEMO.hide(); const p = document.getElementById("demo-pill"); if (p) p.remove(); window.scrollTo(0, 0); });
    await sleep(400);
    await rec(page, async () => {
      await sleep(600);
      await click(page, '.seg[data-d="c"]', 1100); await sleep(1600);
      const sug = await byText(page, "label, div", /^Sonoran Recovery Center · CASE/);
      if (sug) { await moveToEl(page, sug, 1000); await sleep(1600); }
      await smoothScroll(page, 300, 1400);
      const gen = await byText(page, "button, span.btn", /Generate justification|Draft with AI/);
      if (gen && (await gen.evaluate(e => !!e))) { await click(page, gen, 1000); await sleep(2600); }
      else await sleep(2000);
    });
  },
  // slide 7: the chain, down to the claim
  async chain(page) {
    await fresh(page, 5);
    await page.evaluate(() => { const cv = document.getElementById("n-canvas"), nav = document.querySelector(".topnav"); window.scrollTo(0, cv.getBoundingClientRect().top + window.scrollY - nav.getBoundingClientRect().bottom - 8); });
    await sleep(500);
    const node = pred => svgNode(page, pred);
    await rec(page, async () => {
      await sleep(700);
      await moveToEl(page, await node(() => [...document.querySelectorAll("#n-canvas g")].find(g => g.__data__ && g.__data__.claim === "C00585")), 1300); await sleep(2600);
      await moveToEl(page, await node(() => [...document.querySelectorAll("#n-canvas g")].find(g => g.__data__ && g.__data__.claim === "C00576")), 1100); await sleep(2200);
      await moveToEl(page, await node(() => [...document.querySelectorAll("#n-canvas g")].find(g => g.__data__ && g.__data__.vet === "V0010" && !g.__data__.claim)), 1100); await sleep(2200);
      await moveToEl(page, await node(() => [...document.querySelectorAll("#n-canvas g")].find(g => g.__data__ && g.__data__.prov === "PR300" && !g.__data__.claim && !g.__data__.vet)), 1100); await sleep(2000);
    });
  },
  // slide 8: every network, and the links between them (Meridian <-> Arizona shell supply network)
  async allnets(page) {
    await fresh(page, 6); // short-tour step 7: networks linked to networks
    await page.evaluate(() => { const el = document.getElementById("nv-map"), nav = document.querySelector(".topnav"); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - nav.getBoundingClientRect().bottom - 8); });
    await sleep(2500); // let the providers settle around their hubs
    const hub = id => page.evaluateHandle(id => [...document.querySelectorAll("#nv-map circle")].find(c => c.__data__ && c.__data__.id === id), id);
    const bridge = await page.evaluateHandle(() => [...document.querySelectorAll("#nv-map line.hit")].find(l => { const d = l.__data__; return d && ((d.source.net === "N01" && d.target.net === "N18") || (d.source.net === "N18" && d.target.net === "N01")); }));
    await moveToEl(page, bridge, 300); await sleep(600); // start on the link tooltip, as the tour step shows it
    await rec(page, async () => {
      await sleep(3000);
      await moveToEl(page, await hub("H-N18"), 1000); await sleep(3200);
      await moveToEl(page, await hub("H-N11"), 1100); await sleep(2200);
      await moveToEl(page, await hub("H-N01"), 1300); await sleep(2000);
      await moveTo(page, 700, 760, 800);
      await smoothScroll(page, 470, 1600); await sleep(600);
      await moveTo(page, 520, 470, 900); await sleep(2400);
    });
  },
  // slide 9: from one claim to $102.7M
  async funnel(page) {
    await fresh(page, 6);
    await rec(page, async () => {
      await sleep(700);
      const stages = await page.$$(".fn-stage");
      for (let i = 0; i < stages.length; i++) { await moveToEl(page, stages[i], i ? 800 : 1100); await sleep(i === stages.length - 1 ? 1600 : 900); }
      const nf = await page.$("#nv-funnel");
      const b = (await nf.boundingBox());
      await moveTo(page, b.x + b.width * 0.72, b.y + b.height * 0.78, 1000); await sleep(2200);
      await moveTo(page, b.x + b.width * 0.25, b.y + b.height * 0.78, 1000); await sleep(2000);
    });
  }
};

// ---------- recording via CDP screencast ----------
let cdp;
async function rec(page, body) {
  const frames = [];
  const onFrame = async f => { frames.push({ data: f.data, t: f.metadata.timestamp }); try { await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }); } catch (e) {} };
  cdp.on("Page.screencastFrame", onFrame);
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  await body();
  await sleep(300);
  const t1 = Date.now() / 1000;
  await cdp.send("Page.stopScreencast");
  cdp.off("Page.screencastFrame", onFrame);
  page._frames = { frames, t0, t1 };
}

function assemble(name, { frames, t1 }) {
  const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  let list = "ffconcat version 1.0\n";
  frames.forEach((f, i) => {
    const fn = `f${String(i).padStart(5, "0")}.jpg`;
    fs.writeFileSync(path.join(dir, fn), Buffer.from(f.data, "base64"));
    const next = i + 1 < frames.length ? frames[i + 1].t : t1;
    list += `file ${fn}\nduration ${Math.max(0.001, next - f.t).toFixed(4)}\n`;
  });
  list += `file f${String(frames.length - 1).padStart(5, "0")}.jpg\n`;
  fs.writeFileSync(path.join(dir, "list.txt"), list);
  const mp4 = path.join(OUT, name + ".mp4");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", path.join(dir, "list.txt"),
    "-vf", "scale=1920:1080:flags=lanczos,fps=30,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", mp4]);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", mp4, "-frames:v", "1", path.join(OUT, name + "-poster.png")]);
  return mp4;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(CLIPS);
  const browser = await chromium.launch();
  for (const name of want) {
    const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: SCALE });
    const page = await ctx.newPage();
    const errors = []; page.on("pageerror", e => errors.push(e.message));
    cdp = await ctx.newCDPSession(page);
    cur = { x: VW * 0.55, y: VH * 0.6 };
    await page.mouse.move(cur.x, cur.y);
    try {
      await CLIPS[name](page);
      const mp4 = assemble(name, page._frames);
      const d = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).toString().trim();
      console.log(name, "ok", d + "s", page._frames.frames.length, "frames", errors.length ? "PAGE ERRORS: " + errors.join(" | ") : "");
    } catch (e) { console.log(name, "FAILED", e.message.split("\n")[0], errors.join(" | ")); }
    await ctx.close();
  }
  await browser.close();
})();
