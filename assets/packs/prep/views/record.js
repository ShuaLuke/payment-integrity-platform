/* Preparedness Grants pack · the reimbursement request — the grants counterpart
   of the claim/lead file. Left rail: the subrecipient, the vendor, the award,
   where the money went. Tabs: Overview (why flagged) · Checks · Deliverable
   (plan comparison, or the radio serial-number check) · Procurement (the bids) ·
   Links · History · Decision. Replaces Views.claim, so APP.openAllegation(id)
   opens it. */
(function () {
  window.Views = window.Views || {};
  var P = window.PREP;
  var esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var curTab = "overview", lastId = null, ctx = null;
  var CASE = { key: "CASE-P-0012", name: "Tidewater network — related vendors, copied deliverables, double-billed equipment" };

  window.Views.claim = {
    render: function (mount, params) {
      var id = params.id || window.APP.state.allegationId;
      var a = P.get(id);
      if (!a) { mount.innerHTML = '<div class="page"><p>Request not found.</p></div>'; return; }
      if (id !== lastId) { curTab = "overview"; lastId = id; }
      var prepay = a.mode === "prepay";
      var dec = prepay ? window.APP.prepayDecisionFor(id) : window.APP.decisionFor(id);
      ctx = { id: id, a: a, prepay: prepay, dec: dec };
      mount.innerHTML =
        '<div class="page">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">' +
        '<span class="btn" id="r-back" style="padding:5px 9px"><i class="ti ti-arrow-left"></i> ' + esc(window.APP.backLabel()) + '</span>' +
        '<span class="page-title">Request ' + id + ' · ' + esc(a.subrecipient.name) + ', ' + a.state + ' — ' + esc(a.fwaType) + '</span>' + window.UI.statusPill(a.status) +
        '<span class="pill" style="background:' + (prepay ? "var(--accent-l);color:var(--accent-d)" : "var(--surface);color:var(--text2)") + ';font-size:10.5px"><i class="ti ti-' + (prepay ? "clock-play" : "history") + '"></i> ' + (prepay ? "Pre-payment" : "Reimbursed " + (a.paidDate || "")) + '</span>' +
        '<span class="mono" style="font-size:11px;color:var(--text2)">' + a.award.program + ' ' + a.award.fy + ' · ' + a.award.no + '</span>' +
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
    var v = a.vendorRec;
    var same = a.deliverable === P.SAME_PLAN.name;
    return '<div id="r-thread" style="cursor:pointer;display:flex;align-items:center;gap:12px;background:#001141;color:#fff;border-radius:9px;padding:9px 14px;margin-bottom:12px">' +
      '<i class="ti ti-affiliate" style="font-size:20px;color:#78a9ff"></i>' +
      '<div style="flex:1;font-size:12.5px;line-height:1.45">Paid to <b>' + esc(v.name) + '</b> (' + esc(v.city) + ', ' + v.state + '). ' +
      (same ? 'The same communications plan was paid for by <b>' + P.SAME_PLAN.jurisdictions + ' jurisdictions</b> in 4 states · <b style="color:#ffb4a8">' + P.bigUsd(P.SAME_PLAN.atRisk) + '</b>. ' : '') +
      'One of 5 related vendors in the Tidewater network.</div>' +
      '<span style="font-size:11.5px;color:#a6c8ff;white-space:nowrap">Open the network <i class="ti ti-arrow-right"></i></span></div>';
  }

  function tile(label, icon, title, lines, tone) {
    return '<div class="card" style="padding:10px 11px' + (tone ? ';border-color:' + tone : '') + '"><div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px"><i class="ti ti-' + icon + '"></i> ' + label + '</div>' +
      '<div style="font-weight:600;font-size:12.5px;line-height:1.3">' + title + '</div>' +
      lines.map(function (l) { return '<div style="font-size:11px;color:var(--text2);margin-top:2px;line-height:1.35">' + l + '</div>'; }).join("") + '</div>';
  }
  function rail(a) {
    var v = a.vendorRec, s = a.subrecipient, st = P.STATES[a.state];
    var hot = a.network === "N01" ? "#f3c9c9" : null;
    var out = [tile("Subrecipient", "building-community", esc(s.name) + ", " + a.state, [esc(s.kind) + ' · through ' + esc(st.saa), s.coordinator ? "Grant coordinator " + esc(s.coordinator) : "Submitted " + esc(a.submitted || "")])];
    out.push(tile("Award", "certificate", P.PROGRAMS[a.award.program].short + " · " + a.award.fy, ['<span class="mono">' + a.award.no + '</span>', "Budget line: " + esc(a.budgetLine)]));
    out.push(tile("Paid to", "building-store", esc(a.payee), v ? [esc(v.city) + ", " + v.state + ' · <span class="mono">' + v.phone + '</span>', 'UEI <span class="mono">' + v.uei + '</span> · formed ' + v.formed] : ["Established payee"], hot));
    out.push(tile(a.mode === "prepay" ? "Reimbursement to" : "Reimbursed to", "building-bank", esc(s.name), [a.mode === "prepay" ? "Not released" : "Paid " + (a.paidDate || ""), v && (v.id === "V3" || v.id === "V4") ? 'Vendor paid into <span class="mono">' + P.OPERATOR.acct + '</span>' : "Vendor paid by county check"]));
    return out.join("");
  }

  function tracker(a, dec, prepay) {
    var steps = prepay ? ["Submitted", "Scored", "Decision", "Paid or held"] : ["Flagged", "Assigned", "Under review", "Decision", "Supervisor review", "Case"];
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

  var TABS = [["overview", "Overview"], ["checks", "Checks"], ["documents", "Deliverable"], ["procurement", "Procurement"], ["links", "Links"], ["history", "History"], ["decision", "Decision"]];
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
    p.innerHTML = ({ overview: overview, checks: checks, documents: documents, procurement: procurement, links: links, history: history, decision: decision })[name](a);
    if (name === "decision") wireDecision(a);
    if (name === "links") p.querySelectorAll("[data-open]").forEach(function (r) { r.onclick = function () { window.APP.openAllegation(r.getAttribute("data-open")); }; });
    if (name === "overview") { var b = document.getElementById("r-explain"); if (b) b.onclick = function () { if (window.COPILOT) window.COPILOT.summarize(a.id); }; }
  }

  var SEV = { high: ["var(--high-bg)", "var(--high-tx)", "var(--high)"], med: ["var(--med-bg)", "var(--med-tx)", "var(--med)"], low: ["var(--low-bg)", "var(--low-tx)", "var(--low)"] };
  function overview(a) {
    var rec = { pay: ["Pay", "var(--low-tx)", "var(--low-bg)", "check"], hold: ["Hold — request documentation", "var(--med-tx)", "var(--med-bg)", "clock-hour-4"], deny: ["Deny", "var(--high-tx)", "var(--high-bg)", "ban"], confirm: ["Disallow · recover", "var(--high-tx)", "var(--high-bg)", "alert-triangle"], dismiss: ["Clear — cost supported", "var(--low-tx)", "var(--low-bg)", "circle-check"] }[a.recommendedAction];
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
      '<div style="font-size:11px;color:var(--text3);margin-top:3px">Rules + ML/AI · confidence ' + Math.round(a.confidence * 100) + '% · scored when the state received the request</div></div></div>' +
      sig + '</div>' +
      '<div style="flex:1;min-width:230px;display:flex;flex-direction:column;gap:12px">' +
      '<div class="card" style="margin:0;background:' + rec[2] + ';border-color:transparent"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:' + rec[1] + '">Model recommends</div><div style="font-weight:600;font-size:15px;color:' + rec[1] + ';margin-top:3px"><i class="ti ti-' + rec[3] + '"></i> ' + rec[0] + '</div>' +
      '<button class="btn" id="r-explain" style="margin-top:9px;font-size:11.5px;background:#fff"><i class="ti ti-sparkles"></i> Explain in full</button></div>' +
      '<div class="card" style="margin:0"><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px">Request</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>' + esc(a.deliverable) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0;color:var(--text2)"><span>' + esc(a.budgetLine) + ' · ' + a.award.program + ' ' + a.award.fy + '</span></div>' +
      (a.id === P.SEED || a.id === P.THREAD ? '<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>Peer median</span><span class="mono">' + usd(P.PEER_MEDIAN) + '</span></div>' : '') +
      '<div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:600;border-top:0.5px solid var(--border2);margin-top:4px;padding-top:5px"><span>Amount</span><span class="mono">' + usd(a.amount) + '</span></div></div>' +
      '</div></div>';
  }

  function checks(a) {
    var ring = a.network === "N01", t = a.fwaType;
    var V = [
      ["Vendor registration", "id-badge-2", t === "Excluded vendor" ? ["fail", "Active SAM.gov exclusion (debarred 2025-06)"] : ["pass", a.vendorRec ? "Active in SAM.gov since " + a.vendorRec.formed.slice(0, 4) : "Active, no exclusions"], "SAM.gov · Do Not Pay"],
      ["Vendor age & ownership", "building", ring ? ["warn", "Formed " + a.vendorRec.formed + "; shares a registered agent with 2 other vendors"] : ["pass", "Established business, no shared officers"], "State business registries"],
      ["Competition", "users-group", a.vendor === "V4" ? ["fail", "No competition; the cooperative contract cited doesn't list this seller"] : a.vendor === "V5" ? ["warn", "Subcontract, selected by the official it's tied to"] : ring ? ["fail", "All three quotes came from related vendors"] : ["pass", "Independent bidders"], "Procurement file · entity resolution"],
      ["Price", "receipt-2", a.id === P.SEED || a.id === P.THREAD ? ["fail", "3.4× the $25,400 peer median"] : ring ? ["warn", "Above the peer range"] : ["pass", "Within the peer range"], "Peer pricing · subaward ledgers"],
      ["Deliverable originality", "file-search", t === "Copy-paste deliverable" ? ["fail", "Text matches deliverables sold to other jurisdictions"] : t === "Shared template" ? ["pass", "Match is the federal HSEEP template"] : ["pass", "No matches outside federal templates"], "Document fingerprint"],
      ["Equipment received", "device-mobile", t === "Double-billed equipment" ? ["fail", "31 of 48 serial numbers already on another county's inventory"] : a.budgetLine === "Equipment" ? ["pass", "Serial numbers on the inventory, delivery signed"] : ["pass", "Not an equipment purchase"], "Equipment inventories"],
      ["Conflict of interest", "user-exclamation", ring && a.sub === "C1" ? ["fail", "Subcontractor registered at the grant coordinator's home"] : ["pass", "Disclosures on file, no ties found"], "Entity resolution · disclosures"],
      ["Personnel time", "clock", t === "Payroll overcharge" ? ["fail", "Same person charged more than 100% across grants"] : a.budgetLine === "Personnel" ? ["pass", "Timesheets support the charge"] : ["pass", "Not a personnel cost"], "Subaward ledgers · timesheets"]
    ];
    var ico = { pass: ["circle-check", "var(--low)"], fail: ["circle-x", "var(--high)"], warn: ["alert-triangle", "var(--med)"] };
    return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:8px"><i class="ti ti-checklist" style="color:var(--accent-d)"></i> Checks <span class="muted" style="font-weight:400;font-size:11px">· run automatically when the state receives the request, before it pays</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:8px">' +
      V.map(function (v) {
        var r = v[2], c = ico[r[0]];
        return '<div style="border:0.5px solid var(--border);border-radius:8px;padding:9px 11px;display:flex;gap:9px"><i class="ti ti-' + c[0] + '" style="color:' + c[1] + ';font-size:18px"></i><div><div style="font-weight:500;font-size:12.5px">' + v[0] + '</div><div style="font-size:11.5px;color:var(--text2);line-height:1.4;margin-top:1px">' + r[1] + '</div><div style="font-size:10px;color:var(--text3);margin-top:3px"><i class="ti ti-' + v[1] + '"></i> ' + v[3] + '</div></div></div>';
      }).join("") + '</div></div>';
  }

  // ---- deliverable: the plan, side by side with another county's copy ----
  var PLAN_ID = {
    "RR-58214": { county: "Larkspur County", state: "Virginia", date: "September 2026", contact: "Dale R. Hutchins, Grant Coordinator", leftover: true },
    "RR-57390": { county: "Brandt County", state: "Maryland", date: "September 2025", contact: "Office of Emergency Management" }
  };
  function plan(id, label) {
    var d = PLAN_ID[id]; if (!d) return "";
    var same = function (t) { return '<span style="background:#fff3bf;border-radius:2px">' + t + '</span>'; };
    var bad = function (t) { return '<span style="background:#ffd7d9;border-radius:2px;outline:1px solid #da1e28">' + t + '</span>'; };
    return '<div style="flex:1;min-width:280px"><div style="font-size:10.5px;color:var(--text3);margin-bottom:5px"><span class="mono" style="color:var(--ink);font-weight:600">' + id + '</span> · ' + label + '</div>' +
      '<div style="background:#fff;border:0.5px solid var(--border);border-radius:6px;box-shadow:0 2px 8px rgba(0,17,65,.08);padding:16px 18px;font-family:Georgia,serif;font-size:11.5px;line-height:1.6;color:#21272a">' +
      '<div style="font-family:Arial,sans-serif;font-size:9.5px;letter-spacing:.08em;color:#6f6f6f">' + same("PREPARED BY TIDEWATER PREPAREDNESS PARTNERS LLC") + '</div>' +
      '<div style="font-family:Arial Black,Arial,sans-serif;font-size:13px;margin:4px 0 2px">' + d.county + ' ' + same("Regional Interoperable Communications Plan") + '</div>' +
      '<div style="font-size:10.5px;color:#525252;margin-bottom:8px">' + d.state + ' · ' + d.date + ' · ' + d.contact + '</div>' +
      '<div style="font-weight:700;font-family:Arial,sans-serif;font-size:11px">' + same("3. Interoperabilty Goals") + '</div>' +
      '<div>' + same("3.1 The County will maintain voice interoperabilty with all neighboring jurisdictions during a regional incident, consistent with the Statewide Communication Interoperability Plan.") + '</div>' +
      '<div style="margin-top:4px">' + same("3.2 Primary mutual-aid talkgroup:") + ' ' + (d.leftover ? bad("BRANDT-OPS-2") : "BRANDT-OPS-2") + same(" · secondary: VCALL10 / VTAC11.") + '</div>' +
      '<div style="margin-top:4px">' + same("3.3 Communications unit leaders shall complete COML training within 12 months of plan adoption.") + '</div>' +
      '<div style="margin-top:10px;font-weight:700;font-family:Arial,sans-serif;font-size:11px">' + same("Table 3-1 · Gap analysis") + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 60px;gap:0 8px;font-size:10.5px;margin-top:2px">' + ["Governance", "Standard operating procedures", "Technology", "Training & exercises", "Usage"].map(function (r, i) { return '<span>' + same(r) + '</span><span>' + same(["Medium", "High", "High", "Medium", "Low"][i]) + '</span>'; }).join("") + '</div>' +
      '<div style="margin-top:10px;font-size:10px;color:#6f6f6f;border-top:0.5px solid #c1c7cd;padding-top:4px">Page 3 of 41</div>' +
      '</div></div>';
  }
  function documents(a) {
    if (a.id === P.DECISION) return serials(a);
    if (!PLAN_ID[a.id]) {
      return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px"><i class="ti ti-files" style="color:var(--accent-d)"></i> Documents on file</div>' +
        ["Reimbursement request", "Vendor invoice", a.budgetLine === "Equipment" ? "Receiving report and inventory record" : a.budgetLine === "Personnel" ? "Timesheets" : "Deliverable as accepted", "Procurement file"].map(function (d) { return '<div style="display:flex;gap:8px;padding:6px 0;border-top:0.5px solid var(--border2);font-size:12px"><i class="ti ti-file-text" style="color:var(--text3)"></i>' + d + '</div>'; }).join("") + '</div>';
    }
    var other = a.id === P.SEED ? P.THREAD : P.SEED;
    var fp = [["Text match", "94.1%"], ["Same typo", "“interoperabilty” ×2"], ["Section order & tables", "identical"], ["Left in from another county", "BRANDT-OPS-2"], ["Same plan paid for by", P.SAME_PLAN.jurisdictions + " jurisdictions · 4 states"]];
    return '<div class="card" style="margin:0">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:10px"><div style="font-weight:500;font-size:13px"><i class="ti ti-file-search" style="color:var(--accent-d)"></i> Deliverable comparison <span class="muted" style="font-weight:400;font-size:11px">· document fingerprinting · highlighted text is identical</span></div>' +
      '<span class="pill" style="background:var(--high-bg);color:var(--high-tx)"><i class="ti ti-copy"></i> Same document</span></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">' + fp.map(function (f) { return '<div style="background:var(--surface);border:0.5px solid var(--border);border-radius:7px;padding:5px 9px;font-size:11px"><span style="color:var(--text3)">' + f[0] + '</span> <b>' + f[1] + '</b></div>'; }).join("") + '</div>' +
      '<div style="display:flex;gap:16px;flex-wrap:wrap">' + plan(a.id, a.id === P.SEED ? "this request (held before payment)" : "this request (reimbursed)") + plan(other, other === P.SEED ? "the flagged request, a year later" : "a year earlier, in Maryland · reimbursed") + '</div>' +
      '<div style="margin-top:12px;font-size:11.5px;color:var(--text2);line-height:1.5"><i class="ti ti-info-circle"></i> Larkspur County, Virginia\'s plan names <b>BRANDT-OPS-2</b>, a Maryland county\'s radio talkgroup, as its primary mutual-aid channel. Only the cover details were changed. Federal templates (CPG 101, HSEEP) are excluded from the match, so this isn\'t shared boilerplate.</div></div>';
  }
  function serials(a) {
    var rows = [["XTS-7A41-0912", "in transit", "Brandt County, MD · FY2023 · received 2025-03-11"], ["XTS-7A41-0913", "in transit", "Brandt County, MD · FY2023 · received 2025-03-11"], ["XTS-7A41-0927", "in transit", "Brandt County, MD · FY2023 · received 2025-03-11"], ["XTS-7A41-0930", "in transit", "Brandt County, MD · FY2023 · received 2025-03-11"], ["XTS-7A42-1150", "received", "—"], ["XTS-7A42-1151", "received", "—"]];
    return '<div class="card" style="margin:0">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:10px"><div style="font-weight:500;font-size:13px"><i class="ti ti-device-mobile" style="color:var(--accent-d)"></i> Equipment check <span class="muted" style="font-weight:400;font-size:11px">· invoice serial numbers against every subrecipient\'s inventory</span></div>' +
      '<span class="pill" style="background:var(--high-bg);color:var(--high-tx)"><i class="ti ti-copy"></i> 31 of 48 billed before</span></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">' +
      [["Radios on the invoice", "48"], ["Already on another inventory", "31"], ["Signed receiving report", "17"], ["Seller", "Coastline Comm Supply · paid into ••4471"]].map(function (f) { return '<div style="background:var(--surface);border:0.5px solid var(--border);border-radius:7px;padding:5px 9px;font-size:11px"><span style="color:var(--text3)">' + f[0] + '</span> <b>' + f[1] + '</b></div>'; }).join("") + '</div>' +
      '<table><thead><tr><th>Serial number</th><th>Merrow County inventory</th><th>Also on</th></tr></thead><tbody>' +
      rows.map(function (r) { var dup = r[2] !== "—"; return '<tr' + (dup ? ' style="background:var(--high-bg)"' : '') + '><td class="mono">' + r[0] + '</td><td>' + r[1] + '</td><td style="font-size:11.5px">' + (dup ? '<b style="color:var(--high-tx)">' + r[2] + '</b> <span class="mono" style="color:var(--text3)">RR-57288</span>' : '<span class="muted">—</span>') + '</td></tr>'; }).join("") +
      '<tr><td colspan="3" class="muted" style="font-size:11px">… 42 more · 27 more duplicates</td></tr></tbody></table>' +
      '<div style="margin-top:10px;font-size:11.5px;color:var(--text2);line-height:1.5"><i class="ti ti-info-circle"></i> Equipment bought with grant funds has to be recorded with its serial number and inventoried at least every two years (2 CFR 200.313). Matching those inventories across counties and states is what turns up the same radio billed twice.</div></div>';
  }

  // ---- procurement: the "competing" bids ----
  function procurement(a) {
    if (["V1", "V2", "V3"].indexOf(a.vendor) < 0) {
      var txt = a.vendor === "V4" ? "Bought from Coastline Comm Supply without competition, citing a cooperative purchasing contract. Coastline isn't an authorized dealer on that contract, and it is paid into account " + P.OPERATOR.acct + ", the same account as Seaboard Continuity Advisors."
        : a.vendor === "V5" ? "A subcontract under Tidewater Preparedness Partners. The county official who approved the invoices has an undisclosed tie to the subcontractor (2 CFR 200.318(c))."
        : /payroll|in-house/i.test(a.payee) ? "No procurement: a personnel or in-house cost."
        : "Three independent quotes; the lowest responsive bidder was selected. No shared agents, officers, phones or accounts among the bidders.";
      return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px"><i class="ti ti-users-group" style="color:var(--accent-d)"></i> Procurement</div><div style="font-size:12px;color:var(--text2);line-height:1.5">' + txt + '</div></div>';
    }
    var bids = [
      { v: P.vendor("V1"), amt: a.id === P.SEED ? 86400 : 84900, win: a.vendor === "V1" },
      { v: P.vendor("V2"), amt: 92150, win: a.vendor === "V2" },
      { v: P.vendor("V3"), amt: 95800, win: a.vendor === "V3" }
    ];
    var share = function (t) { return '<span class="tag" style="font-size:10px;background:var(--high-bg);color:var(--high-tx)">' + t + '</span>'; };
    return '<div class="card" style="margin:0">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:10px"><div style="font-weight:500;font-size:13px"><i class="ti ti-users-group" style="color:var(--accent-d)"></i> The three quotes <span class="muted" style="font-weight:400;font-size:11px">· entity resolution across state registries, SAM.gov and payment accounts</span></div>' +
      '<span class="pill" style="background:var(--high-bg);color:var(--high-tx)"><i class="ti ti-link"></i> Bidders are related</span></div>' +
      '<table><thead><tr><th>Bidder</th><th>Formed</th><th class="right">Quote</th><th>Shares with the others</th></tr></thead><tbody>' +
      bids.map(function (b) {
        var sh = [share("agent: Atlantic Registered Agents")];
        if (b.v.id !== "V3") sh.push(share("phone " + P.OPERATOR.phone));
        if (b.v.id === "V3") sh.push(share("account " + P.OPERATOR.acct));
        if (b.v.id !== "V2") sh.push(share("officer " + P.OPERATOR.officer));
        return '<tr' + (b.win ? ' style="background:var(--accent-l)"' : '') + '><td><div style="font-weight:500">' + esc(b.v.name) + (b.win ? ' <span class="pill" style="background:var(--accent);color:#fff;font-size:10px">selected</span>' : '') + '</div><div style="font-size:10.5px;color:var(--text2)">' + esc(b.v.city) + ', ' + b.v.state + ' · UEI <span class="mono">' + b.v.uei + '</span></div></td><td class="mono" style="font-size:11.5px">' + b.v.formed + '</td><td class="right mono">' + usd(b.amt) + '</td><td><div style="display:flex;gap:4px;flex-wrap:wrap">' + sh.join("") + '</div></td></tr>';
      }).join("") + '</tbody></table>' +
      '<div style="margin-top:10px;font-size:11.5px;color:var(--text2);line-height:1.5"><i class="ti ti-info-circle"></i> Three quotes look like competition. All three bidders use one registered agent, and they share a phone, a deposit account and an officer between them, so this was one business bidding against itself. The procurement file has no cost or price analysis (2 CFR 200.319, 200.324).</div></div>';
  }

  function links(a) {
    var mine = P.GRAPH.filter(function (g) { return g.id === a.id; })[0];
    if (!mine) return '<div class="card" style="margin:0;color:var(--text2);font-size:12px"><i class="ti ti-circle-dashed"></i> ' + (a.network ? "Part of " + esc(P.net(a.network).name) + "." : "No shared agents, officers, phones, accounts or deliverables with other vendors.") + '</div>';
    var rel = P.GRAPH.filter(function (g) { return g.id !== a.id && (g.vendor === mine.vendor || g.deliverable === mine.deliverable || g.sub === mine.sub); });
    return '<div class="card" style="padding:0;overflow:hidden;margin:0"><div style="padding:10px 12px;font-weight:500;font-size:13px;border-bottom:0.5px solid var(--border2)"><i class="ti ti-link" style="color:var(--accent-d)"></i> Requests linked to this one <span class="muted" style="font-weight:400;font-size:11px">· ' + rel.length + ' shown of ' + P.net("N01").invoices + ' in the network</span></div>' +
      '<table><thead><tr><th>Request</th><th>Subrecipient</th><th>Shares</th><th class="right">Amount</th><th>Status</th></tr></thead><tbody>' +
      rel.map(function (g) {
        var sh = [g.vendor === mine.vendor ? "vendor" : null, g.deliverable === mine.deliverable ? "same deliverable" : null, g.sub === mine.sub ? "same county" : null].filter(Boolean).join(" · ");
        var s = P.SUBS[g.sub], open = P.lead(g.id);
        return '<tr' + (open ? ' data-open="' + g.id + '" style="cursor:pointer"' : '') + '><td class="mono">' + g.id + '</td><td>' + esc(s.name) + ', ' + s.state + '</td><td style="font-size:11.5px">' + sh + '</td><td class="right mono">' + usd(g.amount) + '</td><td style="font-size:11.5px">' + (g.state === "held" ? "Held" : g.state === "pending" ? "Pending" : "Reimbursed") + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  function history(a) {
    var ev = [[a.submitted, "Submitted", "Through " + P.STATES[a.state].saa], [a.submitted, "Scored", "Risk " + a.riskScore + " · " + a.reason]];
    if (a.paidDate) ev.push([a.paidDate, "Reimbursed", usd(a.amount) + " to " + a.subrecipient.name]);
    if (a.paidDate && a.network) ev.push([a.paidDate, "Flagged post-payment", "Linked to " + P.net(a.network).name]);
    var audit = window.APP.state.audit.filter(function (x) { return (x.detail || "").indexOf(a.id) >= 0; }).slice().reverse().map(function (x) { return [window.APP.fmtTs(x.ts), x.action.replace(/_/g, " ").toLowerCase().replace(/^./, function (c) { return c.toUpperCase(); }), x.detail + " · " + x.user]; });
    return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px"><i class="ti ti-timeline" style="color:var(--accent-d)"></i> History</div>' +
      ev.concat(audit).map(function (e) { return '<div style="display:flex;gap:10px;padding:6px 0;border-top:0.5px solid var(--border2);font-size:12px"><span class="mono" style="color:var(--text3);width:120px;flex:none">' + esc(e[0] || "") + '</span><span style="font-weight:500;width:150px;flex:none">' + esc(e[1]) + '</span><span style="color:var(--text2)">' + esc(e[2]) + '</span></div>'; }).join("") + '</div>';
  }

  // ---- decision ----
  function decision(a) {
    if (a.mode === "prepay") {
      var d = window.APP.prepayDecisionFor(a.id);
      return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:8px">Pre-payment decision</div>' +
        (d ? '<div style="font-size:12.5px">' + { pay: "Approved for reimbursement", hold: "Held pending documentation", deny: "Denied" }[d.action] + ' · ' + esc(window.APP.reasonLabel(d.action, d.reason)) + '</div>'
          : '<div style="display:flex;gap:8px">' + ["pay", "hold", "deny"].map(function (x) { return '<button class="btn r-pp" data-act="' + x + '" style="flex:1;justify-content:center">' + { pay: "Pay", hold: "Hold — documentation", deny: "Deny" }[x] + '</button>'; }).join("") + '</div>') + '</div>';
    }
    var dec = window.APP.decisionFor(a.id);
    if (dec) return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px">Decision recorded</div><div style="font-size:12.5px">' + esc({ confirm: "Cost disallowed", dismiss: "Cleared — cost supported", escalate: "Escalated" }[dec.outcome]) + ' · ' + esc(window.APP.reasonLabel(dec.outcome, dec.reason)) + '</div><div style="font-size:12px;color:var(--text2);margin-top:4px">' + (dec.reviewState === "pending" ? "Waiting for supervisor review (Karen Boyd)." : dec.reviewState === "approved" ? "Approved by the supervisor." : "") + '</div></div>';
    return '<div class="card" style="margin:0">' +
      '<div style="font-weight:500;font-size:13px;margin-bottom:8px">Decision</div>' +
      '<div style="display:flex;gap:8px">' +
      '<button class="seg" data-d="c">Disallow<div class="sub">unsupported cost · recover</div></button>' +
      '<button class="seg" data-d="d">Clear<div class="sub">cost supported · payment stands</div></button>' +
      '<button class="seg" data-d="e">Escalate<div class="sub">refer the scheme to DHS OIG</div></button></div>' +
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
      (ring ? opt("existing", esc(CASE.key) + " · " + esc(CASE.name), "Recommended: the reseller is paid into account " + P.OPERATOR.acct + ", the same as a related bidder · " + P.net("N01").subs + " subrecipients on this case · " + P.bigUsd(P.net("N01").atRisk), true, "suggested") : "") +
      opt("new", "Open a new case", "This request alone", !ring);
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
        var def = P.defaultReason(a, key);
        document.getElementById("r-reason").innerHTML = window.APP.REASONS[key].map(function (r) { return '<option value="' + r.c + '"' + (r.c === def ? " selected" : "") + '>' + r.c + ' · ' + esc(r.t) + '</option>'; }).join("");
        document.getElementById("r-case").innerHTML = caseBox(a, outcome);
        document.getElementById("r-submit").innerHTML = outcome === "d" ? '<i class="ti ti-check"></i> Clear request' : '<i class="ti ti-send"></i> Submit to supervisor';
        form.style.display = "block";
      };
    });
    document.getElementById("r-draft").onclick = function () {
      var t = document.getElementById("r-just"), key = { c: "confirm", d: "dismiss", e: "escalate" }[outcome] || "confirm";
      var txt = key === "dismiss" ? "Verified on review: " + a.signals.filter(function (s) { return s.sev === "low"; }).map(function (s) { return s.detail; }).join(" ") + " Clearing the flag; the reimbursement stands."
        : a.id === P.DECISION ? "Merrow County, NC was reimbursed $212,600 for 48 portable radios from Coastline Comm Supply. 31 of the 48 serial numbers already appear in Brandt County, MD's inventory, sold by the same reseller a year earlier (RR-57288), and there is no signed receiving report for those 31. Coastline is paid into account ••4471, which also receives payments for Seaboard Continuity Advisors, a related bidder in the Tidewater network. The cost is unsupported (2 CFR 200.313); disallow it, recover it through North Carolina Emergency Management, and place it on " + CASE.key + "."
        : "Request " + a.id + ": " + a.signals.filter(function (s) { return s.sev !== "low"; }).map(function (s) { return s.detail; }).join(" ") + " The cost is not supported as submitted.";
      var i = 0; t.value = ""; var iv = setInterval(function () { i += 4; t.value = txt.slice(0, i); if (i >= txt.length) clearInterval(iv); }, 12);
      window.APP.auditLog("AI_JUSTIFICATION_DRAFTED", "Request " + a.id);
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
