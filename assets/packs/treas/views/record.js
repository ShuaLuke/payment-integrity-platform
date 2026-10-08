/* Treasury pack · the payment record — the Treasury counterpart of the claim/lead
   file. Left rail: the payee, the payment, the deposit account, the disbursement.
   Tabs: Overview (why flagged) · Checks (the list checks it passed, and the
   pattern checks it didn't) · Address (every federal payee at the mailbox) ·
   Account (the account batch, the W-2 employers, the deposit history) · Links ·
   History · Decision. Replaces Views.claim, so APP.openAllegation(id) opens it. */
(function () {
  window.Views = window.Views || {};
  var T = window.TREAS;
  var esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var curTab = "overview", lastId = null, ctx = null;
  var CASE = { key: "CASE-T-0007", name: "Delmont network — batch-opened accounts, fake W-2 employers, redirected benefits" };

  window.Views.claim = {
    render: function (mount, params) {
      var id = params.id || window.APP.state.allegationId;
      var a = T.get(id);
      if (!a) { mount.innerHTML = '<div class="page"><p>Payment not found.</p></div>'; return; }
      if (id !== lastId) { curTab = "overview"; lastId = id; }
      var prepay = a.mode === "prepay";
      var dec = prepay ? window.APP.prepayDecisionFor(id) : window.APP.decisionFor(id);
      ctx = { id: id, a: a, prepay: prepay, dec: dec };
      mount.innerHTML =
        '<div class="page">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">' +
        '<span class="btn" id="r-back" style="padding:5px 9px"><i class="ti ti-arrow-left"></i> ' + esc(window.APP.backLabel()) + '</span>' +
        '<span class="page-title">Payment ' + id + ' · ' + esc(a.payee) + ' — ' + esc(a.fwaType) + '</span>' + window.UI.statusPill(a.status) +
        '<span class="pill" style="background:' + (prepay ? "var(--accent-l);color:var(--accent-d)" : "var(--surface);color:var(--text2)") + ';font-size:10.5px"><i class="ti ti-' + (prepay ? "clock-play" : "history") + '"></i> ' + (prepay ? "Pre-payment" : "Paid " + (a.paidDate || "")) + '</span>' +
        '<span class="mono" style="font-size:11px;color:var(--text2)">' + a.agency + ' · ' + esc(a.prog.name) + '</span>' +
        '<span style="flex:1"></span><button class="btn primary" id="r-sum" style="font-size:12px"><i class="ti ti-file-analytics"></i> Summarize for adjudication</button></div>' +
        (a.network === "N01" ? threadBanner(a) : "") +
        '<div class="split" style="display:flex;gap:12px;align-items:flex-start">' +
        '<div class="rail" style="width:210px;flex:none;display:flex;flex-direction:column;gap:10px">' + rail(a) + '</div>' +
        '<div style="flex:1;min-width:0">' + tracker(a, dec, prepay) + tabBar(!dec) + '<div id="r-panel"></div></div>' +
        '</div></div>';
      document.getElementById("r-back").onclick = function () { window.APP.goBack(); };
      document.getElementById("r-sum").onclick = function () { if (window.COPILOT) window.COPILOT.summarize(id); };
      var tn = document.getElementById("r-thread"); if (tn) tn.onclick = function () { window.APP.state.networkScenario = "N01"; window.APP.nav("network"); };
      var am = document.getElementById("r-assign-me"); if (am) am.onclick = function () { window.APP.assignCase(id, window.APP.ROLES[window.APP.state.role].name); window.APP.startLeadReview(id); window.Views.claim.render(mount, { id: id }); };
      mount.querySelectorAll(".ctab").forEach(function (b) { b.onclick = function () { show(b.getAttribute("data-tab")); }; });
      show(curTab);
    },
    gotoDecision: function (action) {
      show("decision");
      var seg = { confirm: "c", "confirm-escalate": "c", dismiss: "d", escalate: "e" }[action];
      if (seg) setTimeout(function () { var el = document.querySelector('.seg[data-d="' + seg + '"]'); if (el) el.click(); }, 60);
    }
  };

  function threadBanner(a) {
    var b = a.batchRec;
    return '<div id="r-thread" style="cursor:pointer;display:flex;align-items:center;gap:12px;background:#001141;color:#fff;border-radius:9px;padding:9px 14px;margin-bottom:12px">' +
      '<i class="ti ti-affiliate" style="font-size:20px;color:#78a9ff"></i>' +
      '<div style="flex:1;font-size:12.5px;line-height:1.45">Paid into <b>' + esc(a.bank) + ' ' + a.acct + '</b>, one of ' + b.accts + ' accounts in batch ' + b.range + '. ' +
      'Mailbox <b>PMB 212, Carver Mill, GA</b> received <b>' + T.MAILBOX.payments + ' federal payments</b> for ' + T.MAILBOX.payees + ' payees · <b style="color:#ffb4a8">' + T.bigUsd(T.MAILBOX.amount) + '</b>. ' +
      'Part of the Delmont network.</div>' +
      '<span style="font-size:11.5px;color:#a6c8ff;white-space:nowrap">Open the network <i class="ti ti-arrow-right"></i></span></div>';
  }

  function tile(label, icon, title, lines, tone) {
    return '<div class="card" style="padding:10px 11px' + (tone ? ';border-color:' + tone : '') + '"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px"><i class="ti ti-' + icon + '"></i> ' + label + '</div>' +
      '<div style="font-weight:600;font-size:12.5px;line-height:1.3">' + title + '</div>' +
      lines.map(function (l) { return '<div style="font-size:11px;color:var(--text2);margin-top:2px;line-height:1.35">' + l + '</div>'; }).join("") + '</div>';
  }
  function rail(a) {
    var b = a.batchRec, hot = a.network === "N01" ? "#f3c9c9" : null;
    var out = [tile("Payee", "user", esc(a.payee), [esc(a.address), esc(a.city)], a.address === T.MAILBOX.line ? hot : null)];
    out.push(tile("Payment", "receipt", esc(a.prog.name), [T.AGENCIES[a.agency].name, '<span class="mono">' + esc(a.schedule) + '</span>']));
    out.push(tile("Deposit account", "building-bank", esc(a.bank) + ' <span class="mono">' + esc(a.acct) + '</span>', b ? ["Opened " + a.acctOpened, "Batch " + b.range + " · " + b.accts + " accounts"] : [a.acctOpened && /^\d{4}/.test(a.acctOpened) ? "Held since " + a.acctOpened.slice(0, 4) : "—"], b ? hot : null));
    out.push(tile(a.mode === "prepay" ? "Disbursement" : "Disbursed", "send", a.mode === "prepay" ? "Not released" : "Paid " + (a.paidDate || ""), [a.mode === "prepay" ? "Verified " + (a.submitted || "") : "Before the pattern was found"]));
    return out.join("");
  }

  function tracker(a, dec, prepay) {
    var steps = prepay ? ["Certified", "Verified", "Decision", "Paid or held"] : ["Flagged", "Assigned", "Under review", "Decision", "Supervisor review", "Case"];
    var at;
    if (prepay) at = dec ? 3 : 1;
    else {
      var st = a.status;
      at = st === "New" ? 0 : st === "Assigned" ? 1 : st === "Under review" || st === "Returned" ? 2 : st === "Pending review" ? 4 : st === "Dismissed" ? 3 : 5;
    }
    var dots = steps.map(function (t, i) {
      var done = i < at, cur = i === at;
      return (i ? '<div style="flex:1;height:2px;margin-top:9px;background:' + (i <= at ? "var(--accent)" : "var(--border)") + '"></div>' : '') +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:64px"><span style="width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;' +
        (done ? "background:var(--accent);color:#fff" : cur ? "background:#fff;border:2px solid var(--accent);color:var(--accent)" : "background:#fff;border:1px solid var(--border);color:var(--text3)") + '">' + (done ? '<i class="ti ti-check" style="font-size:11px"></i>' : "") + '</span>' +
        '<span style="font-size:10.5px;' + (cur ? "font-weight:600;color:var(--ink)" : "color:var(--text2)") + '">' + t + '</span></div>';
    }).join("");
    var cta = (!prepay && !a.assignee && !dec && !window.APP.isSupervisor()) ? '<div style="border-top:0.5px solid var(--border2);margin-top:6px;padding-top:8px;display:flex;align-items:center;gap:10px"><span style="font-size:11.5px;color:var(--text2)">Unassigned — claim it to begin your review.</span><button id="r-assign-me" class="btn primary" style="font-size:11px;padding:4px 10px"><i class="ti ti-user-plus"></i> Assign to me</button></div>' : "";
    return '<div class="card" style="padding:10px 14px 8px;margin-bottom:12px"><div style="display:flex;align-items:flex-start">' + dots + '</div>' + cta + '</div>';
  }

  var TABS = [["overview", "Overview"], ["checks", "Checks"], ["documents", "Address"], ["procurement", "Account"], ["links", "Links"], ["history", "History"], ["decision", "Decision"]];
  function tabBar(undecided) {
    return '<div style="display:flex;flex-wrap:wrap;gap:2px;border-bottom:0.5px solid var(--border);margin-bottom:10px">' + TABS.map(function (t) {
      return '<button class="ctab' + (t[0] === curTab ? " active" : "") + '" data-tab="' + t[0] + '">' + t[1] + (t[0] === "decision" && undecided ? ' <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);vertical-align:middle;margin-left:2px"></span>' : "") + '</button>';
    }).join("") + '</div>';
  }
  function show(name) {
    curTab = name;
    document.querySelectorAll(".ctab").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === name); });
    var p = document.getElementById("r-panel"); if (!p || !ctx) return;
    var a = ctx.a;
    p.innerHTML = ({ overview: overview, checks: checks, documents: address, procurement: account, links: links, history: history, decision: decision })[name](a);
    if (name === "decision") wireDecision(a);
    if (name === "links" || name === "documents") p.querySelectorAll("[data-open]").forEach(function (r) { r.onclick = function () { window.APP.openAllegation(r.getAttribute("data-open")); }; });
    if (name === "overview") { var b = document.getElementById("r-explain"); if (b) b.onclick = function () { if (window.COPILOT) window.COPILOT.summarize(a.id); }; }
  }

  var SEV = { high: ["var(--high-bg)", "var(--high-tx)", "var(--high)"], med: ["var(--med-bg)", "var(--med-tx)", "var(--med)"], low: ["var(--low-bg)", "var(--low-tx)", "var(--low)"] };
  function overview(a) {
    var rec = { pay: ["Pay", "var(--low-tx)", "var(--low-bg)", "check"], hold: ["Hold — verify the payee", "var(--med-tx)", "var(--med-bg)", "clock-hour-4"], deny: ["Return to agency", "var(--high-tx)", "var(--high-bg)", "arrow-back-up"], confirm: ["Reclaim · recover", "var(--high-tx)", "var(--high-bg)", "alert-triangle"], dismiss: ["Clear — payment stands", "var(--low-tx)", "var(--low-bg)", "circle-check"] }[a.recommendedAction];
    var sig = a.signals.map(function (s) {
      var c = SEV[s.sev] || SEV.low;
      return '<div style="display:flex;gap:10px;padding:9px 0;border-top:0.5px solid var(--border2)"><span style="width:8px;height:8px;border-radius:50%;background:' + c[2] + ';flex:none;margin-top:5px"></span>' +
        '<div style="flex:1"><div style="font-weight:500;font-size:12.5px">' + esc(s.label) + '</div><div style="font-size:12px;color:var(--text2);line-height:1.5;margin-top:1px">' + esc(s.detail) + '</div></div>' +
        '<span class="tag" style="font-size:10px;align-self:flex-start;white-space:nowrap">' + esc(s.src) + '</span></div>';
    }).join("");
    return '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
      '<div class="card" style="flex:2;min-width:340px;margin:0"><div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">' +
      '<div style="width:54px;height:54px;border-radius:50%;border:5px solid ' + (a.riskScore >= 80 ? "var(--high)" : a.riskScore >= 50 ? "var(--med)" : "var(--low)") + ';display:flex;align-items:center;justify-content:center;font-weight:600;font-size:17px">' + a.riskScore + '</div>' +
      '<div style="flex:1"><div style="font-weight:600;font-size:13.5px"><i class="ti ti-sparkles" style="color:var(--accent-d)"></i> Why this was flagged</div><div style="font-size:12px;color:var(--text2);margin-top:2px">' + esc(a.reason) + '.</div>' +
      '<div style="font-size:11px;color:var(--text3);margin-top:3px">Rules + ML/AI · confidence ' + Math.round(a.confidence * 100) + '% · scored during payment verification, before disbursement</div></div></div>' +
      sig + '</div>' +
      '<div style="flex:1;min-width:230px;display:flex;flex-direction:column;gap:12px">' +
      '<div class="card" style="margin:0;background:' + rec[2] + ';border-color:transparent"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:' + rec[1] + '">Model recommends</div><div style="font-weight:600;font-size:15px;color:' + rec[1] + ';margin-top:3px"><i class="ti ti-' + rec[3] + '"></i> ' + rec[0] + '</div>' +
      '<button class="btn" id="r-explain" style="margin-top:9px;font-size:11.5px;background:#fff"><i class="ti ti-sparkles"></i> Explain in full</button></div>' +
      '<div class="card" style="margin:0"><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px">Payment</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>' + esc(a.prog.name) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0;color:var(--text2)"><span>Certified by ' + esc(T.AGENCIES[a.agency].name) + '</span></div>' +
      (a.program === "REF" && a.network === "N01" ? '<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>Peer median</span><span class="mono">' + usd(T.PEER_MEDIAN) + '</span></div>' : '') +
      '<div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:600;border-top:0.5px solid var(--border2);margin-top:4px;padding-top:5px"><span>Amount</span><span class="mono">' + usd(a.amount) + '</span></div></div>' +
      '</div></div>';
  }

  function checks(a) {
    var ring = a.network === "N01", t = a.fwaType;
    var L = [
      ["Do Not Pay", "shield-check", t === "Deceased payee" ? ["fail", "Payee deceased 2026-08-30 (SSA Numident)"] : ["pass", "No match: Death Master File, Numident, SAM.gov exclusions and other sources"], "Do Not Pay"],
      ["Account ownership", "building-bank", t === "Vendor bank change" ? ["fail", "Account belongs to a different business"] : ["pass", a.acct === "—" ? "Each payee's own account" : "Account " + a.acct + " is in the payee's name"], "Account verification"],
      ["TIN", "id", ["pass", "Present, valid format, matches the payee"], "TIN verification"]
    ];
    var P = [
      ["Account age & batch", "calendar-time", a.batchRec ? ["fail", "Opened " + a.acctOpened + " · one of " + a.batchRec.accts + " neighboring accounts opened " + a.batchRec.opened] : t === "Vendor bank change" ? ["fail", "New account, opened " + a.acctOpened] : t === "New account · verified" ? ["warn", "Opened " + a.acctOpened + "; no other payee uses it"] : ["pass", "Long-held account, no neighbors with federal payments"], "Treasury payment history"],
      ["Mailing address", "mailbox", a.address === T.MAILBOX.line ? ["fail", "Private mailbox used by " + T.MAILBOX.payees + " federal payees in " + T.MAILBOX.months + " months"] : t === "Shared address" ? ["pass", "Shared address is a licensed care facility"] : ["pass", "Residential address, no other payees"], "Agency payment files · USPS mailbox list"],
      ["Payment destination changes", "arrows-exchange", /redirection/i.test(t) ? ["fail", "Changed by phone to a network account; the phone made 36 other changes"] : t === "Vendor bank change" ? ["fail", "Remit-to changed 2 days before payment by email"] : t === "New account · verified" ? ["pass", "Changed by the payee through a verified sign-in"] : ["pass", "No recent changes"], "Agency change logs"],
      ["Employer & preparer", "briefcase", a.program !== "REF" ? ["pass", "Not a tax refund"] : ring ? ["fail", "W-2 employer formed in the last year at the same mailbox; preparer has no PTIN"] : ["pass", "Long-standing employer and preparer"], "OpenCorporates · IRS return flag"],
      ["Amount vs. peers", "chart-histogram", a.program === "REF" && ring ? ["warn", "Well above peers for the reported wages"] : ["pass", "In line with similar payments"], "Peer comparison"]
    ];
    var ico = { pass: ["circle-check", "var(--low)"], fail: ["circle-x", "var(--high)"], warn: ["alert-triangle", "var(--med)"] };
    var grid = function (V) {
      return '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px">' + V.map(function (v) {
        var r = v[2], c = ico[r[0]];
        return '<div style="border:0.5px solid var(--border);border-radius:8px;padding:9px 11px;display:flex;gap:9px"><i class="ti ti-' + c[0] + '" style="color:' + c[1] + ';font-size:18px"></i><div><div style="font-weight:500;font-size:12.5px">' + v[0] + '</div><div style="font-size:11.5px;color:var(--text2);line-height:1.4;margin-top:1px">' + r[1] + '</div><div style="font-size:10px;color:var(--text3);margin-top:3px"><i class="ti ti-' + v[1] + '"></i> ' + v[3] + '</div></div></div>';
      }).join("") + '</div>';
    };
    var allPass = L.every(function (v) { return v[2][0] === "pass"; }), anyFail = P.some(function (v) { return v[2][0] === "fail"; });
    return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:8px"><i class="ti ti-list-check" style="color:var(--accent-d)"></i> List checks <span class="muted" style="font-weight:400;font-size:11px">· run on every payment before Treasury disburses it</span></div>' + grid(L) +
      '<div style="font-weight:500;font-size:13px;margin:14px 0 8px"><i class="ti ti-affiliate" style="color:var(--accent-d)"></i> Pattern checks <span class="muted" style="font-weight:400;font-size:11px">· this payment against every other payment, across agencies</span></div>' + grid(P) +
      (allPass && anyFail ? '<div style="margin-top:12px;font-size:12px;line-height:1.5;padding:9px 11px;border-radius:8px;background:var(--accent-l);color:var(--ink)"><i class="ti ti-info-circle" style="color:var(--accent-d)"></i> It passed every list check: the identity is real and the account is in that name. The pattern checks look at what\'s around the payment, and that\'s where it fails.</div>' : '') + '</div>';
  }

  // ---- address: every federal payee at the mailbox ----
  var BOX = [
    ["PV-73194", "Marisol T. Avery", "REF", 18940, "2026-10-06", "Brightpath ••6208", "held"],
    ["PV-73215", "Owen P. Strickland", "REF", 17760, "2026-10-06", "Corridor ••0874", "held"],
    ["PV-71588", "Lena M. Whitcomb", "REF", 17480, "2026-09-23", "Brightpath ••6219", "paid"],
    ["PV-71522", "Terrence D. Okafor", "REF", 16210, "2026-09-16", "Brightpath ••6203", "paid"],
    ["PV-72455", "Gloria A. Pruitt", "SSA", 1910, "2026-09-03", "Lumen Direct ••3317", "paid · 4 payments"],
    ["PV-72460", "Walter E. Hines", "SSA", 2030, "2026-09-03", "Lumen Direct ••3322", "paid · 4 payments"],
    ["PV-72488", "Harold B. Severs", "OPM", 2465, "2026-08-01", "Corridor ••2246", "paid · 4 payments"],
    ["PV-71640", "Rafael J. Quintero", "REF", 15920, "2026-04-14", "Lumen Direct ••5507", "paid"],
    ["PV-71409", "Curtis L. Banning", "REF", 19620, "2026-03-03", "Brightpath ••8834", "paid"]
  ];
  function address(a) {
    if (a.address !== T.MAILBOX.line) {
      return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px"><i class="ti ti-mailbox" style="color:var(--accent-d)"></i> Address</div><div style="font-size:12px;line-height:1.5;color:var(--text2)">' + esc(a.address) + ' · ' + esc(a.city) + '</div>' +
        (a.fwaType === "Shared address" ? '<div style="font-size:12px;line-height:1.5;padding:8px 10px;margin-top:8px;border-radius:7px;background:var(--low-bg)"><i class="ti ti-building-hospital"></i> A licensed assisted-living facility. 38 long-time beneficiaries live there, each with their own account; many have a representative payee on file with SSA.</div>' : '<div style="font-size:12px;color:var(--text2);margin-top:6px">No other federal payees use this address.</div>') + '</div>';
    }
    var M = T.MAILBOX;
    var facts = [["Address", "PMB 212 · Carver Mill, GA"], ["Kind", M.kind], ["Federal payments", M.payments + " in " + M.months + " months"], ["Different payees", M.payees], ["Agencies", "IRS · SSA · OPM"], ["Total", T.bigUsd(M.amount)]];
    return '<div class="card" style="margin:0">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:10px"><div style="font-weight:500;font-size:13px"><i class="ti ti-mailbox" style="color:var(--accent-d)"></i> Everyone paid at this address <span class="muted" style="font-weight:400;font-size:11px">· entity resolution across every agency\'s payment files</span></div>' +
      '<span class="pill" style="background:var(--high-bg);color:var(--high-tx)"><i class="ti ti-users"></i> ' + M.payees + ' payees · 3 agencies</span></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' + facts.map(function (f) { return '<div style="background:var(--surface);border:0.5px solid var(--border);border-radius:7px;padding:5px 9px;font-size:11px"><span style="color:var(--text3)">' + f[0] + '</span> <b>' + f[1] + '</b></div>'; }).join("") + '</div>' +
      '<table><thead><tr><th>Payment</th><th>Payee</th><th>Paid by</th><th class="right">Amount</th><th>Date</th><th>Account</th><th>Status</th></tr></thead><tbody>' +
      BOX.map(function (r) {
        var me = r[0] === a.id, open = T.lead(r[0]) && !me;
        return '<tr' + (me ? ' style="background:var(--accent-l)"' : open ? ' data-open="' + r[0] + '" style="cursor:pointer"' : '') + '><td class="mono">' + r[0] + (me ? ' <span class="pill" style="background:var(--accent);color:#fff;font-size:9.5px">this payment</span>' : '') + '</td><td>' + esc(r[1]) + '</td><td style="font-size:11.5px">' + T.PROGRAMS[r[2]].agency + ' · ' + T.PROGRAMS[r[2]].short + '</td><td class="right mono">' + usd(r[3]) + '</td><td class="mono" style="font-size:11px">' + r[4] + '</td><td class="mono" style="font-size:11px">' + r[5] + '</td><td style="font-size:11.5px">' + r[6] + '</td></tr>';
      }).join("") +
      '<tr><td colspan="7" class="muted" style="font-size:11px">… 37 more payments · 21 more payees</td></tr></tbody></table>' +
      '<div style="margin-top:10px;font-size:11.5px;color:var(--text2);line-height:1.5"><i class="ti ti-info-circle"></i> Each agency saw a handful of ordinary payees at an ordinary-looking address. Only across agencies does it show: 30 different people, from tax refunds to Social Security to federal annuities, all collecting mail at one box in a shipping store.</div></div>';
  }

  // ---- account: the batch, the employers behind the W-2s, the deposit history ----
  function account(a) {
    var b = a.batchRec;
    if (!b) {
      var txt = a.fwaType === "Vendor bank change" ? "The vendor's remit-to account was changed after an emailed request. The new account at " + esc(a.bank) + " belongs to a different business, and three other vendors moved to the same bank this month."
        : a.acct === "—" ? "Each beneficiary is paid into their own long-held account." : "Account " + esc(a.acct) + " at " + esc(a.bank) + (a.acctOpened && /^\d{4}/.test(a.acctOpened) ? ", held since " + a.acctOpened.slice(0, 4) : "") + ". No other federal payee is paid into it, and no accounts with neighboring numbers receive federal payments.";
      return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px"><i class="ti ti-building-bank" style="color:var(--accent-d)"></i> Deposit account</div><div style="font-size:12px;color:var(--text2);line-height:1.5">' + txt + '</div></div>';
    }
    var nb = T.GRAPH.filter(function (g) { return g.batch === a.batch; }).slice(0, 6);
    var batchTbl = '<table><thead><tr><th>Account</th><th>In the name of</th><th>Federal payment</th><th class="right">Amount</th></tr></thead><tbody>' +
      nb.map(function (g) { var me = g.id === a.id; return '<tr' + (me ? ' style="background:var(--accent-l)"' : '') + '><td class="mono">' + g.acct + '</td><td>' + esc(g.payee) + '</td><td style="font-size:11.5px">' + T.PROGRAMS[g.program].agency + ' · ' + T.PROGRAMS[g.program].short + ' · <span class="mono">' + g.id + '</span></td><td class="right mono">' + usd(g.amount) + '</td></tr>'; }).join("") +
      '<tr><td colspan="4" class="muted" style="font-size:11px">… ' + (b.accts - nb.length) + ' more accounts in the batch, each in a different name</td></tr></tbody></table>';
    var head = '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:10px"><div style="font-weight:500;font-size:13px"><i class="ti ti-building-bank" style="color:var(--accent-d)"></i> Account batch ' + esc(b.bank) + ' ' + b.range + ' <span class="muted" style="font-weight:400;font-size:11px">· neighboring account numbers, opened ' + b.opened + '</span></div>' +
      '<span class="pill" style="background:var(--high-bg);color:var(--high-tx)"><i class="ti ti-stack-2"></i> ' + b.accts + ' accounts · ' + b.payments + ' federal payments</span></div>';
    var why = '<div style="margin:10px 0 0;font-size:11.5px;color:var(--text2);line-height:1.5"><i class="ti ti-info-circle"></i> Each account is opened in one payee\'s name, so each passes the ownership check. What gives them away is the batch: runs of neighboring numbers, opened within days at the same online bank, each collecting a federal payment for a different person.</div>';
    if (/redirection/i.test(a.fwaType)) {
      var hist = [["2007-03 → 2026-05", "Augusta Teachers Credit Union ••5590", "Her account for 19 years", "low"], ["2026-05-12", "Lumen Direct ••3317 opened", "In her name, one of 38 in a batch", "med"], ["2026-05-28", "Direct deposit changed by phone", "From (470) 555-0148; mailing address moved to PMB 212", "high"], ["2026-06-03 → 09-03", "4 payments to ••3317", "$7,640, withdrawn within a day each time", "high"], ["2026-09-30", "Non-receipt reported", "Ms. Pruitt calls SSA about the missing payments", "high"]];
      return '<div class="card" style="margin:0">' + head +
        '<div style="font-weight:500;font-size:12px;margin-bottom:4px">Where Ms. Pruitt\'s benefit went</div>' +
        hist.map(function (h) { var c = SEV[h[3]]; return '<div style="display:flex;gap:10px;padding:6px 0;border-top:0.5px solid var(--border2);font-size:12px"><span style="width:8px;height:8px;border-radius:50%;background:' + c[2] + ';flex:none;margin-top:5px"></span><span class="mono" style="color:var(--text3);width:130px;flex:none;font-size:11px">' + h[0] + '</span><span style="font-weight:500;width:240px;flex:none">' + h[1] + '</span><span style="color:var(--text2)">' + h[2] + '</span></div>'; }).join("") +
        '<div style="font-weight:500;font-size:12px;margin:12px 0 4px">The rest of the batch</div>' + batchTbl + why + '</div>';
    }
    var share = function (t) { return '<span class="tag" style="font-size:10px;background:var(--high-bg);color:var(--high-tx)">' + t + '</span>'; };
    var emp = a.program === "REF" ? '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin:16px 0 8px"><div style="font-weight:500;font-size:13px"><i class="ti ti-briefcase" style="color:var(--accent-d)"></i> The employers on the W-2s <span class="muted" style="font-weight:400;font-size:11px">· business registrations + IRS return flags</span></div><span class="pill" style="background:var(--high-bg);color:var(--high-tx)"><i class="ti ti-link"></i> One registered agent · one mailbox</span></div>' +
      '<table><thead><tr><th>Employer</th><th>Formed</th><th class="right">W-2s issued</th><th class="right">Withholding claimed</th><th>Shares</th></tr></thead><tbody>' +
      T.EMPLOYERS.map(function (e, i) { return '<tr' + (i === 0 && (a.id === T.SEED || a.id === T.THREAD) ? ' style="background:var(--accent-l)"' : '') + '><td style="font-weight:500">' + esc(e.name) + '</td><td class="mono" style="font-size:11.5px">' + e.formed + '</td><td class="right mono">' + e.w2s + '</td><td class="right mono">' + T.bigUsd(e.withheld) + '</td><td><div style="display:flex;gap:4px;flex-wrap:wrap">' + share("agent") + share("PMB 212") + (i % 3 === 0 ? share("phone ••0148") : "") + '</div></td></tr>'; }).join("") +
      '</tbody></table><div style="margin-top:8px;font-size:11.5px;color:var(--text2);line-height:1.5"><i class="ti ti-info-circle"></i> Eight employers, all formed in the last year at the mailbox, with one registered agent (' + esc(T.OPERATOR.agent) + '). They issued 300 W-2s reporting $5.9M in withholding and deposited none of it. The returns were prepared by ' + esc(T.OPERATOR.preparer) + ', which has no preparer ID. IRS shares these as flags; the returns themselves stay with IRS.</div>' : '';
    return '<div class="card" style="margin:0">' + head + batchTbl + why + emp + '</div>';
  }

  function links(a) {
    var mine = T.GRAPH.filter(function (g) { return g.id === a.id; })[0];
    if (!mine) return '<div class="card" style="margin:0;color:var(--text2);font-size:12px"><i class="ti ti-circle-dashed"></i> ' + (a.network ? "Part of " + esc(T.net(a.network).name) + "." : "No shared accounts, addresses, phones or employers with other payees.") + '</div>';
    var rel = T.GRAPH.filter(function (g) { return g.id !== a.id && (g.batch === mine.batch || g.program === mine.program); }).slice(0, 12);
    return '<div class="card" style="padding:0;overflow:hidden;margin:0"><div style="padding:10px 12px;font-weight:500;font-size:13px;border-bottom:0.5px solid var(--border2)"><i class="ti ti-link" style="color:var(--accent-d)"></i> Payments linked to this one <span class="muted" style="font-weight:400;font-size:11px">· ' + rel.length + ' shown of ' + T.net("N01").payments + ' in the network</span></div>' +
      '<table><thead><tr><th>Payment</th><th>Payee</th><th>Shares</th><th class="right">Amount</th><th>Status</th></tr></thead><tbody>' +
      rel.map(function (g) {
        var sh = [g.batch === mine.batch ? "account batch" : null, "mailbox PMB 212", g.program === mine.program ? "same payment type" : null].filter(Boolean).join(" · ");
        var open = T.lead(g.id);
        return '<tr' + (open ? ' data-open="' + g.id + '" style="cursor:pointer"' : '') + '><td class="mono">' + g.id + '</td><td>' + esc(g.payee) + '</td><td style="font-size:11.5px">' + sh + '</td><td class="right mono">' + usd(g.amount) + '</td><td style="font-size:11.5px">' + (g.state === "held" ? "Held" : g.state === "pending" ? "Pending" : "Paid") + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  function history(a) {
    var ev = [[a.submitted, "Certified", "By " + T.AGENCIES[a.agency].name], [a.submitted, "Verified", "Risk " + a.riskScore + " · " + a.reason]];
    if (a.paidDate) ev.push([a.paidDate, "Paid", usd(a.amount) + " to " + a.bank + " " + a.acct]);
    if (a.paidDate && a.network) ev.push([a.paidDate, "Flagged post-payment", "Linked to " + T.net(a.network).name]);
    var audit = window.APP.state.audit.filter(function (x) { return (x.detail || "").indexOf(a.id) >= 0; }).slice().reverse().map(function (x) { return [window.APP.fmtTs(x.ts), x.action.replace(/_/g, " ").toLowerCase().replace(/^./, function (c) { return c.toUpperCase(); }), x.detail + " · " + x.user]; });
    return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px"><i class="ti ti-timeline" style="color:var(--accent-d)"></i> History</div>' +
      ev.concat(audit).map(function (e) { return '<div style="display:flex;gap:10px;padding:6px 0;border-top:0.5px solid var(--border2);font-size:12px"><span class="mono" style="color:var(--text3);width:120px;flex:none">' + esc(e[0] || "") + '</span><span style="font-weight:500;width:150px;flex:none">' + esc(e[1]) + '</span><span style="color:var(--text2)">' + esc(e[2]) + '</span></div>'; }).join("") + '</div>';
  }

  // ---- decision ----
  function decision(a) {
    if (a.mode === "prepay") {
      var d = window.APP.prepayDecisionFor(a.id);
      return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:8px">Pre-payment decision</div>' +
        (d ? '<div style="font-size:12.5px">' + { pay: "Released for disbursement", hold: "Held pending verification", deny: "Returned to the certifying agency" }[d.action] + ' · ' + esc(window.APP.reasonLabel(d.action, d.reason)) + '</div>'
          : '<div style="display:flex;gap:8px">' + ["pay", "hold", "deny"].map(function (x) { return '<button class="btn r-pp" data-act="' + x + '" style="flex:1;justify-content:center">' + { pay: "Pay", hold: "Hold — verify", deny: "Return to agency" }[x] + '</button>'; }).join("") + '</div>') + '</div>';
    }
    var dec = window.APP.decisionFor(a.id);
    if (dec) return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px">Decision recorded</div><div style="font-size:12.5px">' + esc({ confirm: "Reclaim · recover", dismiss: "Cleared — payment stands", escalate: "Referred" }[dec.outcome]) + ' · ' + esc(window.APP.reasonLabel(dec.outcome, dec.reason)) + '</div><div style="font-size:12px;color:var(--text2);margin-top:4px">' + (dec.reviewState === "pending" ? "Waiting for supervisor review (Karen Boyd)." : dec.reviewState === "approved" ? "Approved by the supervisor." : "") + '</div></div>';
    return '<div class="card" style="margin:0">' +
      '<div style="font-weight:500;font-size:13px;margin-bottom:8px">Decision</div>' +
      '<div style="display:flex;gap:8px">' +
      '<button class="seg" data-d="c">Reclaim<div class="sub">improper payment · recover from the bank</div></button>' +
      '<button class="seg" data-d="d">Clear<div class="sub">payment proper · it stands</div></button>' +
      '<button class="seg" data-d="e">Refer<div class="sub">to TIGTA / IRS-CI or the agency OIG</div></button></div>' +
      '<div id="r-dform" style="display:none;margin-top:12px">' +
      '<div style="font-size:11px;color:var(--text2);margin-bottom:3px">Reason</div><select id="r-reason" class="input"></select>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0 3px"><span style="font-size:11px;color:var(--text2)">Justification</span><button class="btn" id="r-draft" style="font-size:11px;padding:3px 8px"><i class="ti ti-sparkles"></i> Draft with AI</button></div>' +
      '<textarea id="r-just" class="input" style="min-height:74px" placeholder="Why this decision…"></textarea>' +
      '<div id="r-case" style="margin-top:12px"></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn primary" id="r-submit"><i class="ti ti-send"></i> Submit to supervisor</button></div></div></div>';
  }
  function caseBox(a, outcome) {
    if (outcome === "d") return "";
    var ring = a.network === "N01";
    var opt = function (v, title, sub, on, tag) { return '<label style="display:flex;gap:9px;align-items:flex-start;border:0.5px solid ' + (on ? "var(--accent)" : "var(--border)") + ';background:' + (on ? "var(--accent-l)" : "#fff") + ';border-radius:8px;padding:8px 10px;cursor:pointer;margin-top:6px"><input type="radio" name="r-casech" value="' + v + '"' + (on ? " checked" : "") + ' style="margin-top:3px"><div style="flex:1"><div style="font-weight:500;font-size:12.5px">' + title + (tag ? ' <span class="pill" style="background:var(--accent);color:#fff;font-size:10px">' + tag + '</span>' : '') + '</div><div style="font-size:11.5px;color:var(--text2);margin-top:1px">' + sub + '</div></div></label>'; };
    return '<div style="font-size:11px;color:var(--text2)">Case placement after supervisor approval</div>' +
      (ring ? opt("existing", esc(CASE.key) + " · " + esc(CASE.name), "Recommended: same account batches, mailbox and phone as the refunds on this case · " + T.net("N01").payees + " payees across IRS, SSA and OPM · " + T.bigUsd(T.net("N01").atRisk), true, "suggested") : "") +
      opt("new", "Open a new case", "This payment alone", !ring);
  }
  function wireDecision(a) {
    document.querySelectorAll(".r-pp").forEach(function (b) { b.onclick = function () { window.APP.prepayDecide(a.id, b.getAttribute("data-act")); window.APP.nav("claim", { id: a.id }); }; });
    var form = document.getElementById("r-dform"); if (!form) return;
    var outcome = null;
    document.querySelectorAll(".seg").forEach(function (s) {
      s.onclick = function () {
        outcome = s.getAttribute("data-d");
        document.querySelectorAll(".seg").forEach(function (x) { x.className = "seg" + (x === s ? " on-" + outcome : ""); });
        var key = { c: "confirm", d: "dismiss", e: "escalate" }[outcome];
        var def = T.defaultReason(a, key);
        document.getElementById("r-reason").innerHTML = window.APP.REASONS[key].map(function (r) { return '<option value="' + r.c + '"' + (r.c === def ? " selected" : "") + '>' + r.c + ' · ' + esc(r.t) + '</option>'; }).join("");
        document.getElementById("r-case").innerHTML = caseBox(a, outcome);
        document.getElementById("r-submit").innerHTML = outcome === "d" ? '<i class="ti ti-check"></i> Clear payment' : '<i class="ti ti-send"></i> Submit to supervisor';
        form.style.display = "block";
      };
    });
    document.getElementById("r-draft").onclick = function () {
      var t = document.getElementById("r-just"), key = { c: "confirm", d: "dismiss", e: "escalate" }[outcome] || "confirm";
      var txt = key === "dismiss" ? "Verified on review: " + a.signals.filter(function (s) { return s.sev === "low"; }).map(function (s) { return s.detail; }).join(" ") + " Clearing the flag; the payment stands."
        : a.id === T.DECISION ? "Gloria A. Pruitt's Social Security benefit was redirected on 2026-05-28, when a phone call from (470) 555-0148 changed her direct deposit from her credit union of 19 years to Lumen Direct ••3317, opened 16 days earlier in a batch of 38 neighboring accounts, and moved her mailing address to PMB 212, Carver Mill, GA. Four payments ($7,640) went to that account before she reported them missing on 2026-09-30. The same phone made 36 other direct-deposit changes for SSA and OPM payees. The payments were improper (RED-01): reclaim them from Lumen Direct under 31 CFR Part 210, ask SSA to restore her account and reissue, and place this on " + CASE.key + "."
        : "Payment " + a.id + ": " + a.signals.filter(function (s) { return s.sev !== "low"; }).map(function (s) { return s.detail; }).join(" ") + " The payment was not proper as certified.";
      var i = 0; t.value = ""; var iv = setInterval(function () { i += 4; t.value = txt.slice(0, i); if (i >= txt.length) clearInterval(iv); }, 12);
      window.APP.auditLog("AI_JUSTIFICATION_DRAFTED", "Payment " + a.id);
    };
    document.getElementById("r-submit").onclick = function () {
      if (!outcome) return;
      var key = { c: "confirm", d: "dismiss", e: "escalate" }[outcome];
      var ch = document.querySelector('input[name="r-casech"]:checked');
      if (key !== "dismiss") window.APP.setLeadCase(a.id, ch && ch.value === "existing" ? { mode: "existing", caseKey: CASE.key, caseName: CASE.name, linkType: "same-scheme" } : { mode: "new" });
      if (!a.assignee) window.APP.assignCase(a.id, window.APP.ROLES[window.APP.state.role].name);
      window.APP.applyDecision(a.id, key, (document.getElementById("r-just").value || "").trim(), document.getElementById("r-reason").value);
      window.APP.nav("claim", { id: a.id });
    };
  }
})();
