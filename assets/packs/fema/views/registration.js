/* Disaster-relief pack · the registration record — the FEMA counterpart of the
   claim/lead file. Left rail: the registrant, the damaged dwelling, how it was
   filed, where the money went. Tabs: Overview (why flagged) · Verification ·
   Documents (lease comparison) · Award · Links · History · Decision.
   Replaces Views.claim, so APP.openAllegation(id) opens it. */
(function () {
  window.Views = window.Views || {};
  var F = window.FEMA, APP = function () { return window.APP; };
  var esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var curTab = "overview", lastId = null, ctx = null;
  var CASE = { key: "CASE-F-0031", name: "Crescent Relief network — application facilitator ring" };

  window.Views.claim = {
    render: function (mount, params) {
      var id = params.id || window.APP.state.allegationId;
      var a = F.get(id);
      if (!a) { mount.innerHTML = '<div class="page"><p>Registration not found.</p></div>'; return; }
      if (id !== lastId) { curTab = "overview"; lastId = id; }
      var prepay = a.mode === "prepay";
      var dec = prepay ? window.APP.prepayDecisionFor(id) : window.APP.decisionFor(id);
      ctx = { id: id, a: a, prepay: prepay, dec: dec };
      mount.innerHTML =
        '<div class="page">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">' +
        '<span class="btn" id="r-back" style="padding:5px 9px"><i class="ti ti-arrow-left"></i> ' + esc(window.APP.backLabel()) + '</span>' +
        '<span class="page-title">Registration ' + id + ' · ' + esc(a.registrant) + ' — ' + esc(a.fwaType) + '</span>' + window.UI.statusPill(a.status) +
        '<span class="pill" style="background:' + (prepay ? "var(--accent-l);color:var(--accent-d)" : "var(--surface);color:var(--text2)") + ';font-size:10.5px"><i class="ti ti-' + (prepay ? "clock-play" : "history") + '"></i> ' + (prepay ? "Pre-payment" : "Paid " + (a.paidDate || "")) + '</span>' +
        '<span class="mono" style="font-size:11px;color:var(--text2)">' + a.dr + ' · ' + esc(a.decl.name) + '</span>' +
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
    var s = F.store(a.store) || F.STOREFRONTS[0];
    return '<div id="r-thread" style="cursor:pointer;display:flex;align-items:center;gap:12px;background:#001141;color:#fff;border-radius:9px;padding:9px 14px;margin-bottom:12px">' +
      '<i class="ti ti-affiliate" style="font-size:20px;color:#78a9ff"></i>' +
      '<div style="flex:1;font-size:12.5px;line-height:1.45">Filed through <b>' + esc(s.name) + '</b> (' + esc(s.city) + ', ' + s.state + ') — an “application help” storefront. Same facilitator, same pattern: <b>' + s.regs + ' registrations</b>' + (s.id === "S1" ? ' · <b style="color:#ffb4a8">$2.7M</b> paid or pending' : '') + '. One of 4 storefronts in the Crescent Relief network.</div>' +
      '<span style="font-size:11.5px;color:#a6c8ff;white-space:nowrap">Open the network <i class="ti ti-arrow-right"></i></span></div>';
  }

  function tile(label, icon, title, lines, tone) {
    return '<div class="card" style="padding:10px 11px' + (tone ? ';border-color:' + tone : '') + '"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px"><i class="ti ti-' + icon + '"></i> ' + label + '</div>' +
      '<div style="font-weight:600;font-size:12.5px;line-height:1.3">' + title + '</div>' +
      lines.map(function (l) { return '<div style="font-size:11px;color:var(--text2);margin-top:2px;line-height:1.35">' + l + '</div>'; }).join("") + '</div>';
  }
  function rail(a) {
    var s = a.store ? F.store(a.store) : null, acct = a.acct ? F.ACCOUNTS[a.acct] : null, ll = a.landlord ? F.LANDLORDS[a.landlord] : null;
    var out = [tile("Registrant", "user", esc(a.registrant), ['<span class="mono">SSN 000-00-' + (1000 + parseInt(a.id.slice(-4), 10) % 9000) + '</span>', 'Registered ' + esc(a.registered || "")])];
    out.push(tile("Damaged dwelling", "home", esc(a.addr), [esc(a.parish) + (/County/.test(a.parish) ? "" : " Parish"), "Claims: " + a.occupancy.toLowerCase() + (ll ? " · landlord " + esc(ll.name) : "")], a.id === F.SEED || a.id === F.THREAD || a.id === F.DECISION ? "#f3c9c9" : null));
    if (s) out.push(tile("Filed through", "building-store", esc(s.name), [esc(s.city) + ", " + s.state + ' · <span class="mono">' + s.phone + '</span>', 'Device <span class="mono">' + (a.device || "—") + '</span>'], "#f3c9c9"));
    out.push(tile(a.mode === "prepay" ? "Payment to" : "Paid to", "building-bank", acct ? '<span class="mono">' + acct.mask + '</span>' : '<span class="mono">••' + (4000 + parseInt(a.id.slice(-3), 10)) + '</span>', [acct ? esc(acct.bank) : "Direct deposit", a.mode === "prepay" ? "Not released" : "Paid " + (a.paidDate || "")]));
    return out.join("");
  }

  function tracker(a, dec, prepay) {
    var steps = prepay ? ["Registered", "Scored", "Decision", "Paid or held"] : ["Flagged", "Assigned", "Under review", "Decision", "Supervisor review", "Case"];
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

  var TABS = [["overview", "Overview"], ["verification", "Verification"], ["documents", "Documents"], ["award", "Award"], ["links", "Links"], ["history", "History"], ["decision", "Decision"]];
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
    p.innerHTML = ({ overview: overview, verification: verification, documents: documents, award: award, links: links, history: history, decision: decision })[name](a);
    if (name === "decision") wireDecision(a);
    if (name === "links") p.querySelectorAll("[data-open]").forEach(function (r) { r.onclick = function () { window.APP.openAllegation(r.getAttribute("data-open")); }; });
    if (name === "overview") { var b = document.getElementById("r-explain"); if (b) b.onclick = function () { if (window.COPILOT) window.COPILOT.summarize(a.id); }; }
  }

  var SEV = { high: ["var(--high-bg)", "var(--high-tx)", "var(--high)"], med: ["var(--med-bg)", "var(--med-tx)", "var(--med)"], low: ["var(--low-bg)", "var(--low-tx)", "var(--low)"] };
  function overview(a) {
    var rec = { pay: ["Pay", "var(--low-tx)", "var(--low-bg)", "check"], hold: ["Hold — verify before paying", "var(--med-tx)", "var(--med-bg)", "clock-hour-4"], deny: ["Deny", "var(--high-tx)", "var(--high-bg)", "ban"], confirm: ["Confirm ineligible · recover", "var(--high-tx)", "var(--high-bg)", "alert-triangle"], dismiss: ["Clear — survivor verified", "var(--low-tx)", "var(--low-bg)", "circle-check"] }[a.recommendedAction];
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
      '<div style="font-size:11px;color:var(--text3);margin-top:3px">Rules + ML/AI · confidence ' + Math.round(a.confidence * 100) + '% · scored in 1.6 s at registration</div></div></div>' +
      sig + '</div>' +
      '<div style="flex:1;min-width:230px;display:flex;flex-direction:column;gap:12px">' +
      '<div class="card" style="margin:0;background:' + rec[2] + ';border-color:transparent"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:' + rec[1] + '">Model recommends</div><div style="font-weight:600;font-size:15px;color:' + rec[1] + ';margin-top:3px"><i class="ti ti-' + rec[3] + '"></i> ' + rec[0] + '</div>' +
      '<button class="btn" id="r-explain" style="margin-top:9px;font-size:11.5px;background:#fff"><i class="ti ti-sparkles"></i> Explain in full</button></div>' +
      '<div class="card" style="margin:0"><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px">Award</div>' +
      a.award.map(function (l) { return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>' + esc(l.label) + '</span><span class="mono">' + usd(l.amount) + '</span></div>'; }).join("") +
      '<div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:600;border-top:0.5px solid var(--border2);margin-top:4px;padding-top:5px"><span>Total</span><span class="mono">' + usd(a.amount) + '</span></div></div>' +
      '</div></div>';
  }

  function verification(a) {
    var ring = a.network === "N01";
    var V = [
      ["Identity", "id-badge-2", a.fwaType === "Identity" ? ["fail", "SSN matches a death record (2019)"] : ["pass", "Name, SSN and date of birth match"], "Identity verification · SSA DMF"],
      ["Occupancy", "home-check", ring ? ["fail", "No utility account at the address in the registrant's name; the owners registered as living there"] : a.fwaType === "Address farm" ? ["fail", "9 households claim one 2-bedroom home"] : a.fwaType === "Not primary residence" ? ["fail", "Primary residence is in Tennessee"] : ["pass", "Utility history matches the address"], "Utility records · Registration match"],
      ["Ownership / landlord", "building-community", ring ? ["fail", "Landlord on the lease owns none of the 61 addresses it leases"] : ["pass", a.occupancy === "Owner" ? "Owner of record matches" : "Landlord is the owner of record"], "Parish assessor"],
      ["Declared area", "map-pin", a.fwaType === "Out-of-area address" ? ["fail", "Address is outside the designated parishes"] : ["pass", "Inside the damage footprint (" + esc(a.parish) + ")"], "Geospatial · designations"],
      ["Damage", "camera", a.occupancy === "Owner" ? ["pass", "Remote inspection matched the reported damage"] : ["warn", "Renter — contents only; no inspection of the dwelling"], "Housing inspection"],
      ["Duplication of benefits", "receipt-2", a.fwaType === "Duplication of benefits" ? ["fail", "Insurance covers the same loss"] : ["pass", "No insurance claim or SBA loan for this loss"], "Insurance match · SBA"],
      ["Device & session", "device-mobile", a.device ? ["warn", "Device " + a.device + " filed 31 registrations in 48 hours"] : ["pass", "Ordinary session"], "Session telemetry"],
      ["Deposit account", "building-bank", a.acct ? ["warn", "Account " + F.ACCOUNTS[a.acct].mask + " receives other registrants' awards"] : ["pass", "Account in the registrant's name"], "Bank account verification"]
    ];
    var ico = { pass: ["circle-check", "var(--low)"], fail: ["circle-x", "var(--high)"], warn: ["alert-triangle", "var(--med)"] };
    return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:8px"><i class="ti ti-checklist" style="color:var(--accent-d)"></i> Verification checks <span class="muted" style="font-weight:400;font-size:11px">· run automatically at registration, before any payment</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px">' +
      V.map(function (v) {
        var r = v[2], c = ico[r[0]];
        return '<div style="border:0.5px solid var(--border);border-radius:8px;padding:9px 11px;display:flex;gap:9px"><i class="ti ti-' + c[0] + '" style="color:' + c[1] + ';font-size:18px"></i><div><div style="font-weight:500;font-size:12.5px">' + v[0] + '</div><div style="font-size:11.5px;color:var(--text2);line-height:1.4;margin-top:1px">' + r[1] + '</div><div style="font-size:10px;color:var(--text3);margin-top:3px"><i class="ti ti-' + v[1] + '"></i> ' + v[3] + '</div></div></div>';
      }).join("") + '</div></div>';
  }

  // ---- documents: the lease, side by side with the flagged registration's ----
  var LEASE_ID = { "R-103882": ["Marcus D. Thibodeaux", "77 Magnolia Ridge Ln, Houma, LA 70360", "March 1, 2026", "$1,150"], "R-104417": ["Kendra L. Batiste", "418 Cypress Bend Rd, Houma, LA 70360", "April 1, 2026", "$1,200"], "R-104102": ["Jarrod R. Fontenot", "2210 Grand Caillou Rd, Apt B, Houma, LA 70363", "February 1, 2026", "$950"], "R-103951": ["Tasha M. Robichaux", "1306 Canal Bend Dr, Houma, LA 70360", "January 1, 2026", "$1,100"] };
  function lease(id, label) {
    var d = LEASE_ID[id]; if (!d) return "";
    var same = function (t) { return '<span style="background:#fff3bf;border-radius:2px">' + t + '</span>'; };
    var landlord = id === "R-104102" ? "Bayou Terrace Properties" : "Fontenot Rentals LLC", signer = id === "R-104102" ? "D. Landry" : "J. R. Fontenot";
    return '<div style="flex:1;min-width:270px"><div style="font-size:10.5px;color:var(--text3);margin-bottom:5px"><span class="mono" style="color:var(--ink);font-weight:600">' + id + '</span> · ' + label + '</div>' +
      '<div style="background:#fff;border:0.5px solid var(--border);border-radius:6px;box-shadow:0 2px 8px rgba(0,17,65,.08);padding:16px 18px;font-family:Georgia,serif;font-size:11.5px;line-height:1.6;color:#21272a">' +
      '<div style="text-align:center;font-family:Arial Black,Arial,sans-serif;font-size:12.5px;letter-spacing:.06em;margin-bottom:8px">' + same("RESIDENTIAL LEASE AGREEMENT") + '</div>' +
      '<div>' + same("Landlord:") + ' ' + same(landlord) + '</div>' +
      '<div>' + same("Tenant:") + ' ' + d[0] + '</div>' +
      '<div>' + same("Premisis:") + ' ' + d[1] + '</div>' +
      '<div>' + same("Term: Month-to-month beginning") + ' ' + d[2] + '</div>' +
      '<div>' + same("Rent:") + ' ' + d[3] + same(" per month, due on the 1st") + '</div>' +
      '<div>' + same("Utilities: Included in rent") + '</div>' +
      '<div style="margin-top:6px">' + same("Tenant shall keep the premisis in good condition and shall not sublet without written consent of Landlord.") + '</div>' +
      '<div style="margin-top:12px;display:flex;justify-content:space-between;align-items:flex-end"><div><div style="font-family:\'Brush Script MT\',cursive;font-size:19px;line-height:1">' + same(signer) + '</div><div style="font-size:10px;border-top:0.5px solid #878d96;margin-top:2px">' + same("Landlord signature") + '</div></div>' +
      '<div><div style="font-family:\'Brush Script MT\',cursive;font-size:17px;line-height:1">' + d[0].split(" ")[0] + ' ' + d[0].split(" ").slice(-1) + '</div><div style="font-size:10px;border-top:0.5px solid #878d96;margin-top:2px">Tenant signature</div></div></div>' +
      '</div></div>';
  }
  function documents(a) {
    if (!LEASE_ID[a.id]) {
      return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px"><i class="ti ti-files" style="color:var(--accent-d)"></i> Documents on file</div>' +
        ['Registration (online)', a.occupancy === "Owner" ? "Proof of ownership — parish assessor record" : "Lease", "Proof of identity — verified electronically", a.occupancy === "Owner" ? "Inspection report" : "Utility bill"].map(function (d) { return '<div style="display:flex;gap:8px;padding:6px 0;border-top:0.5px solid var(--border2);font-size:12px"><i class="ti ti-file-text" style="color:var(--text3)"></i>' + d + '</div>'; }).join("") + '</div>';
    }
    var other = a.id === F.SEED ? "R-103882" : F.SEED;
    var fp = [["Template match", "98.7%"], ["Same misspelling", "“premisis” ×2"], ["Signature image", a.id === "R-104102" ? "different signer" : "identical (pixel hash)"], ["Fonts", "Georgia body · Arial Black title"], ["Same template on", "214 registrations · 4 storefronts"]];
    return '<div class="card" style="margin:0">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:10px"><div style="font-weight:500;font-size:13px"><i class="ti ti-file-search" style="color:var(--accent-d)"></i> Lease comparison <span class="muted" style="font-weight:400;font-size:11px">· document fingerprinting · highlighted text is identical</span></div>' +
      '<span class="pill" style="background:var(--high-bg);color:var(--high-tx)"><i class="ti ti-copy"></i> Same document template</span></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' + fp.map(function (f) { return '<div style="background:var(--surface);border:0.5px solid var(--border);border-radius:7px;padding:5px 9px;font-size:11px"><span style="color:var(--text3)">' + f[0] + '</span> <b>' + f[1] + '</b></div>'; }).join("") + '</div>' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap">' + lease(a.id, "this registration") + lease(other, other === F.SEED ? "the flagged registration (held before payment)" : "already paid") + '</div>' +
      '<div style="margin-top:12px;font-size:11.5px;color:var(--text2);line-height:1.5"><i class="ti ti-info-circle"></i> “Utilities included in rent” appears on every lease from this template, which is why none of these registrants has a utility account at the address. The parish assessor shows ' + (a.id === "R-104102" ? "Bayou Terrace Properties owns 1 of the 52 addresses" : "Fontenot Rentals LLC owns none of the 61 addresses") + ' on its leases.</div></div>';
  }

  function award(a) {
    var ha = a.award.filter(function (l) { return /RA|HRA/.test(l.code); }).reduce(function (t, l) { return t + l.amount; }, 0);
    var ona = a.amount - ha;
    var bar = function (label, v, max) { var p = Math.min(100, v / max * 100); return '<div style="margin-top:8px"><div style="display:flex;justify-content:space-between;font-size:11.5px"><span>' + label + '</span><span class="mono">' + usd(v) + ' of ' + usd(max) + '</span></div><div style="height:7px;background:var(--surface);border-radius:4px;margin-top:3px;overflow:hidden"><div style="width:' + p + '%;height:100%;background:var(--accent)"></div></div></div>'; };
    return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px"><i class="ti ti-receipt" style="color:var(--accent-d)"></i> IHP award</div>' +
      '<table><thead><tr><th>Category</th><th>Code</th><th class="right">Amount</th></tr></thead><tbody>' +
      a.award.map(function (l) { return '<tr><td>' + esc(l.label) + '</td><td class="mono">' + l.code + '</td><td class="right mono">' + usd(l.amount) + '</td></tr>'; }).join("") +
      '<tr><td style="font-weight:600">Total</td><td></td><td class="right mono" style="font-weight:600">' + usd(a.amount) + '</td></tr></tbody></table>' +
      bar("Housing Assistance toward the " + F.PROGRAM.fy + " cap", ha, F.PROGRAM.haMax) + bar("Other Needs Assistance toward the " + F.PROGRAM.fy + " cap", ona, F.PROGRAM.onaMax) +
      '<div style="font-size:10.5px;color:var(--text3);margin-top:8px">Rental Assistance isn\'t capped; Home Repair counts toward the Housing Assistance maximum. Serious Needs Assistance is a flat ' + usd(F.PROGRAM.sna) + '.</div></div>';
  }

  function links(a) {
    var mine = F.GRAPH.filter(function (g) { return g.id === a.id; })[0];
    if (!mine) return '<div class="card" style="margin:0;color:var(--text2);font-size:12px"><i class="ti ti-circle-dashed"></i> ' + (a.network ? "Part of " + esc(F.net(a.network).name) + "." : "No shared accounts, devices, phones or documents with other registrations.") + '</div>';
    var rel = F.GRAPH.filter(function (g) { return g.id !== a.id && (g.acct === mine.acct || g.store === mine.store || g.landlord === mine.landlord); });
    return '<div class="card" style="padding:0;overflow:hidden;margin:0"><div style="padding:10px 12px;font-weight:500;font-size:13px;border-bottom:0.5px solid var(--border2)"><i class="ti ti-link" style="color:var(--accent-d)"></i> Registrations linked to this one <span class="muted" style="font-weight:400;font-size:11px">· ' + rel.length + ' shown of 597 in the network</span></div>' +
      '<table><thead><tr><th>Registration</th><th>Registrant</th><th>Shares</th><th class="right">Amount</th><th>Status</th></tr></thead><tbody>' +
      rel.map(function (g) {
        var sh = [g.acct === mine.acct ? "account " + F.ACCOUNTS[g.acct].mask : null, g.store === mine.store ? "storefront" : null, g.landlord === mine.landlord ? "landlord" : null].filter(Boolean).join(" · ");
        var open = F.lead(g.id);
        return '<tr' + (open ? ' data-open="' + g.id + '" style="cursor:pointer"' : '') + '><td class="mono">' + g.id + '</td><td>' + esc(g.name) + '</td><td style="font-size:11.5px">' + sh + '</td><td class="right mono">' + usd(g.amount) + '</td><td style="font-size:11.5px">' + (g.state === "held" ? "Held" : g.state === "pending" ? "Pending" : "Paid") + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  function history(a) {
    var ev = [[a.registered, "Registered", "Online · " + (a.store ? "contact phone " + F.store(a.store).phone : "self-filed")], [a.registered, "Scored", "Risk " + a.riskScore + " · " + a.reason]];
    if (a.paidDate) ev.push([a.paidDate, "Paid", usd(a.amount) + " by direct deposit"]);
    if (a.paidDate && a.network) ev.push([a.paidDate, "Flagged post-payment", "Linked to " + F.net(a.network).name]);
    var audit = window.APP.state.audit.filter(function (x) { return (x.detail || "").indexOf(a.id) >= 0; }).slice().reverse().map(function (x) { return [window.APP.fmtTs(x.ts), x.action.replace(/_/g, " ").toLowerCase().replace(/^./, function (c) { return c.toUpperCase(); }), x.detail + " · " + x.user]; });
    return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px"><i class="ti ti-timeline" style="color:var(--accent-d)"></i> History</div>' +
      ev.concat(audit).map(function (e) { return '<div style="display:flex;gap:10px;padding:6px 0;border-top:0.5px solid var(--border2);font-size:12px"><span class="mono" style="color:var(--text3);width:120px;flex:none">' + esc(e[0] || "") + '</span><span style="font-weight:500;width:150px;flex:none">' + esc(e[1]) + '</span><span style="color:var(--text2)">' + esc(e[2]) + '</span></div>'; }).join("") + '</div>';
  }

  // ---- decision ----
  function decision(a) {
    if (a.mode === "prepay") {
      var d = window.APP.prepayDecisionFor(a.id);
      return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:8px">Pre-payment decision</div>' +
        (d ? '<div style="font-size:12.5px">' + { pay: "Approved to pay", hold: "Held pending verification", deny: "Denied" }[d.action] + ' · ' + esc(window.APP.reasonLabel(d.action, d.reason)) + '</div>'
          : '<div style="display:flex;gap:8px">' + ["pay", "hold", "deny"].map(function (x) { return '<button class="btn r-pp" data-act="' + x + '" style="flex:1;justify-content:center">' + { pay: "Pay", hold: "Hold — verify", deny: "Deny" }[x] + '</button>'; }).join("") + '</div>') + '</div>';
    }
    var dec = window.APP.decisionFor(a.id);
    if (dec) return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px">Decision recorded</div><div style="font-size:12.5px">' + esc({ confirm: "Confirmed ineligible", dismiss: "Cleared — survivor verified", escalate: "Escalated" }[dec.outcome]) + ' · ' + esc(window.APP.reasonLabel(dec.outcome, dec.reason)) + '</div><div style="font-size:12px;color:var(--text2);margin-top:4px">' + (dec.reviewState === "pending" ? "Waiting for supervisor review (Karen Boyd)." : dec.reviewState === "approved" ? "Approved by the supervisor." : "") + '</div></div>';
    var ring = a.network === "N01";
    return '<div class="card" style="margin:0">' +
      '<div style="font-weight:500;font-size:13px;margin-bottom:8px">Decision</div>' +
      '<div style="display:flex;gap:8px">' +
      '<button class="seg" data-d="c">Confirm ineligible<div class="sub">improper payment · recover</div></button>' +
      '<button class="seg" data-d="d">Clear<div class="sub">survivor verified · payment stands</div></button>' +
      '<button class="seg" data-d="e">Escalate<div class="sub">refer the scheme to DHS OIG</div></button></div>' +
      '<div id="r-dform" style="display:none;margin-top:12px">' +
      '<div style="font-size:11px;color:var(--text2);margin-bottom:3px">Reason</div><select id="r-reason" class="input"></select>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0 3px"><span style="font-size:11px;color:var(--text2)">Justification</span><button class="btn" id="r-draft" style="font-size:11px;padding:3px 8px"><i class="ti ti-sparkles"></i> Draft with AI</button></div>' +
      '<textarea id="r-just" class="input" style="min-height:74px" placeholder="Why this decision…"></textarea>' +
      '<div id="r-case" style="margin-top:12px"></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn primary" id="r-submit"><i class="ti ti-send"></i> Submit to supervisor</button></div></div>' +
      (ring ? '' : '') + '</div>';
  }
  function caseBox(a, outcome) {
    if (outcome === "d") return "";
    var ring = a.network === "N01";
    var opt = function (v, title, sub, on, tag) { return '<label style="display:flex;gap:9px;align-items:flex-start;border:0.5px solid ' + (on ? "var(--accent)" : "var(--border)") + ';background:' + (on ? "var(--accent-l)" : "#fff") + ';border-radius:8px;padding:8px 10px;cursor:pointer;margin-top:6px"><input type="radio" name="r-casech" value="' + v + '"' + (on ? " checked" : "") + ' style="margin-top:3px"><div style="flex:1"><div style="font-weight:500;font-size:12.5px">' + title + (tag ? ' <span class="pill" style="background:var(--accent);color:#fff;font-size:10px">' + tag + '</span>' : '') + '</div><div style="font-size:11.5px;color:var(--text2);margin-top:1px">' + sub + '</div></div></label>'; };
    return '<div style="font-size:11px;color:var(--text2)">Case placement after supervisor approval</div>' +
      (ring ? opt("existing", esc(CASE.key) + " · " + esc(CASE.name), "Recommended: shares the lease template, device D-7F3A and collection accounts with 597 registrations on this case · " + F.bigUsd(F.net("N01").atRisk), true, "suggested") : "") +
      opt("new", "Open a new case", "This registration alone", !ring);
  }
  function wireDecision(a) {
    var pp = document.querySelectorAll(".r-pp");
    pp.forEach(function (b) { b.onclick = function () { window.APP.prepayDecide(a.id, b.getAttribute("data-act")); window.APP.nav("claim", { id: a.id }); }; });
    var form = document.getElementById("r-dform"); if (!form) return;
    var outcome = null;
    document.querySelectorAll(".seg").forEach(function (s) {
      s.onclick = function () {
        outcome = s.getAttribute("data-d");
        document.querySelectorAll(".seg").forEach(function (x) { x.className = "seg" + (x === s ? " on-" + outcome : ""); });
        var key = { c: "confirm", d: "dismiss", e: "escalate" }[outcome];
        var def = F.defaultReason(a, key);
        document.getElementById("r-reason").innerHTML = window.APP.REASONS[key].map(function (r) { return '<option value="' + r.c + '"' + (r.c === def ? " selected" : "") + '>' + r.c + ' · ' + esc(r.t) + '</option>'; }).join("");
        document.getElementById("r-case").innerHTML = caseBox(a, outcome);
        document.getElementById("r-submit").innerHTML = outcome === "d" ? '<i class="ti ti-check"></i> Clear registration' : '<i class="ti ti-send"></i> Submit to supervisor';
        form.style.display = "block";
      };
    });
    document.getElementById("r-draft").onclick = function () {
      var t = document.getElementById("r-just"), key = { c: "confirm", d: "dismiss", e: "escalate" }[outcome] || "confirm";
      var txt = key === "dismiss" ? "Verified on review: " + a.signals.filter(function (s) { return s.sev === "low"; }).map(function (s) { return s.detail; }).join(" ") + " Clearing the flag; the payment stands."
        : a.id === F.DECISION ? "Jarrod R. Fontenot registered as a displaced renter at 2210 Grand Caillou Rd, Apt B. The parish assessor and USPS show a single-unit home with no Apt B, and its owner of record registered separately. Mr. Fontenot is also the signer for Fontenot Rentals LLC, the landlord of record on 61 registrations, none of which it owns. His award was paid to a prepaid card that received two other registrants' awards. The registration rests on false documentation; recover the $14,880 and place it on " + CASE.key + "."
        : "Registration " + a.id + ": " + a.signals.filter(function (s) { return s.sev !== "low"; }).map(function (s) { return s.detail; }).join(" ") + " The registration is not supported as submitted.";
      var i = 0; t.value = ""; var iv = setInterval(function () { i += 4; t.value = txt.slice(0, i); if (i >= txt.length) clearInterval(iv); }, 12);
      window.APP.auditLog("AI_JUSTIFICATION_DRAFTED", "Registration " + a.id);
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
