// Drives the Treasury demo's real buttons, the way a presenter would, in both modes:
// same tab (Treasury → IRS's system → back) and two windows (Treasury and IRS side by
// side, synced). Run before every deploy. Needs the site served locally (platform-dev
// :8171, or SITE=<url>) and Playwright: NODE_PATH=~/Desktop/aucket/node_modules
// Usage: node tools/click-test-treas.cjs        → prints PASS/FAIL per check, exits 1 on any FAIL
const { chromium } = require("playwright-core");
const BASE = (process.env.SITE || "http://localhost:8171/") + "?uc=treas";
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
function check(name, ok, detail) { console.log((ok ? "PASS" : "FAIL") + "  " + name + (detail ? "  · " + detail : "")); if (!ok) fails++; }

async function open(ctx, url) {
  const p = await ctx.newPage(); p.on("pageerror", e => check("no page error", false, e.message));
  await p.goto(url); await p.waitForFunction(() => window.APP && window.APP.ready && window.DEMO);
  await p.evaluate(() => { window.DEMO.hide(); document.documentElement.style.setProperty("--ribbon-h", "0px"); });
  await sleep(300); return p;
}
const view = p => p.evaluate(() => window.APP.state.view);
const text = (p, sel) => p.$eval(sel, e => e.textContent.trim()).catch(() => null);

(async () => {
  const browser = await chromium.launch();

  // ---------- A. same tab ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await open(ctx, BASE);
    await p.evaluate(() => { window.APP.setMode("prepay"); window.APP.nav("queue"); }); await sleep(300);
    await p.click('.ppbtn[data-id="PV-73194"][data-act="refer"]'); await sleep(400);
    check("A1 queue: Refer to IRS opens the package", await view(p) === "handoff");
    await p.click("#ho-send"); await sleep(300);
    check("A2 package sends", !!(await text(p, "#ho-portal")));
    await p.click("#ho-portal"); await sleep(300);
    check("A3 Open IRS's system lands on the sign-in", await view(p) === "agencyportal" && !!(await p.$("#ap-login")));
    await p.click("#ap-login"); await sleep(300);
    check("A4 sign-in lands in the inbox with the new package", (await p.$$(".ap-row")).length === 1);
    await p.click(".ap-row"); await sleep(300);
    check("A5 package opens; Stop pre-selected", await p.$eval('input[name="ap-dec"]:checked', e => e.value) === "stop");
    await p.fill("#ap-note", "Taxpayer confirmed she didn't file this return."); await p.click("#ap-submit"); await sleep(300);
    check("A6 decision recorded", /Decision sent to Treasury/.test(await p.$eval("#view", e => e.innerText)));
    await p.click("#ap-back-treas"); await sleep(400);
    check("A7 'See it in Treasury' returns to the record with IRS's decision", await view(p) === "claim" && /Stop the payment/.test((await text(p, "#r-hbanner")) || ""));
    // browser Back and the logo
    await p.goBack(); await sleep(400);
    check("A8 browser Back goes to the previous screen (IRS's system), not off the site", await view(p) === "agencyportal" && /localhost|github/.test(p.url()));
    await p.goForward(); await sleep(400);
    check("A9 browser Forward returns to the record", await view(p) === "claim");
    await p.click(".brand"); await sleep(300);
    check("A10 the logo opens IRS's system", await view(p) === "agencyportal");
    await p.click(".brand"); await sleep(300);
    check("A11 the logo again returns to Treasury", await view(p) !== "agencyportal");
    // the network referral
    await p.evaluate(() => { window.APP.state.networkScenario = "N01"; window.APP.nav("network"); }); await sleep(900);
    await p.click("#n-refer"); await sleep(300); await p.click("#nr-send"); await sleep(300);
    check("A12 network referral sends to three agencies", (await p.$$(".nr-portal")).length === 3);
    await p.click('.nr-portal[data-ag="IRS"]'); await sleep(300);
    check("A13 'Open IRS's system' lands on the referral (already signed in)", /Network referral from Treasury/i.test(await p.$eval("#view", e => e.innerText)) && !!(await p.$("#ap-nsubmit")));
    await p.click("#ap-nsubmit"); await sleep(300);
    check("A14 IRS opens a case; pending refunds held", await p.evaluate(() => window.TREAS.lead("PV-73215").status === "Held by IRS · case"));
    await p.click("#ap-back-net"); await sleep(300);
    check("A15 back to the referral with IRS's decision", await view(p) === "netreferral" && /Open a case/.test(await p.$eval("#view", e => e.innerText)));
    await p.evaluate(() => window.APP.nav("home")); await sleep(300);
    check("A16 Home counts the package and the referral", /1 case opened/.test(await p.$eval("#h-agencies", e => e.innerText)));
    // Reset
    p.once("dialog", d => d.accept());
    await p.click("#reset-demo"); await p.waitForFunction(() => window.APP && window.APP.ready); await sleep(300);
    check("A17 Reset clears everything", await p.evaluate(() => Object.keys(window.APP.state.handoffs).length === 0 && Object.keys(window.APP.state.netRefs).length === 0));
    await ctx.close();
  }

  // ---------- B. two windows ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    const t = await open(ctx, BASE);
    const irs = await open(ctx, BASE + "&sys=irs"); await sleep(500);
    check("B1 IRS window opens on its sign-in, no Treasury chrome", await view(irs) === "agencyportal" && await irs.$eval(".navitems", e => getComputedStyle(e).visibility) === "hidden");
    check("B2 IRS window shows it is linked to Treasury's", /Linked to Treasury/.test(await irs.$eval("#view", e => e.innerText)));
    await irs.click("#ap-login"); await sleep(300);
    check("B3 IRS inbox starts empty, waiting", /Waiting for Treasury/.test(await irs.$eval("#view", e => e.innerText)));
    await t.evaluate(() => { window.APP.setMode("prepay"); window.APP.nav("queue"); }); await sleep(300);
    await t.click('.ppbtn[data-id="PV-73194"][data-act="refer"]'); await sleep(300); await t.click("#ho-send"); await sleep(900);
    check("B4 the package appears in the IRS window on its own", (await irs.$$(".ap-row")).length === 1);
    await irs.click(".ap-row"); await sleep(300); await irs.click("#ap-submit"); await sleep(900);
    check("B5 IRS's decision appears in Treasury's window on its own", /Stop the payment/.test(await t.$eval("#view", e => e.innerText)));
    await t.evaluate(() => { window.APP.state.networkScenario = "N01"; window.APP.nav("network"); }); await sleep(900);
    await t.click("#n-refer"); await sleep(300); await t.click("#nr-send"); await sleep(900);
    check("B6a a live update keeps the IRS window on the item it was reviewing", /Decision sent to Treasury/.test(await irs.$eval("#view", e => e.innerText)));
    await irs.click("#ap-inbox"); await sleep(400);
    check("B6 the network referral appears in the IRS window", (await irs.$$(".ap-ref")).length === 1);
    await irs.click(".ap-ref"); await sleep(300); await irs.click("#ap-nsubmit"); await sleep(900);
    check("B7 the case decision reaches Treasury's referral screen", /Open a case/.test(await t.$eval("#view", e => e.innerText)));
    const late = await open(ctx, BASE + "&sys=irs"); await sleep(900);
    await late.click("#ap-login"); await sleep(300);
    check("B8 a window opened late catches up", (await late.$$(".ap-row")).length === 1 && (await late.$$(".ap-ref")).length === 1);
    await ctx.close();
  }

  await browser.close();
  console.log(fails ? "\n" + fails + " FAILED" : "\nall passed");
  process.exit(fails ? 1 : 0);
})();
