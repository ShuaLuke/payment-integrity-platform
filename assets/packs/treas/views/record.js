/* Treasury pack · the payment record — the Treasury counterpart of the claim/lead
   file. Left rail: the payee, the payment, the deposit account, the disbursement.
   Tabs: Overview (why flagged: risk factors, agency flags) · Checks (Do Not Pay
   beside TrackLight, then the pattern checks) · Address (every federal payee at the mailbox) ·
   Account (the account batch, the W-2 employers, the deposit history) · Network
   (the payment's network drawn in place, this payment marked, linked payments) ·
   History · Decision. Header: Send to the certifying agency (the recommendation
   package), and a strip showing what the agency decided. Replaces Views.claim,
   so APP.openAllegation(id) opens it. */
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
        '<span style="flex:1"></span><button class="btn" id="r-send" style="font-size:12px"><i class="ti ti-' + (T.handoff(id) ? "package" : "send") + '"></i> ' + (T.handoff(id) ? "View package" : "Send to " + a.agency) + '</button>' +
        '<button class="btn primary" id="r-sum" style="font-size:12px"><i class="ti ti-file-analytics"></i> Summarize for adjudication</button></div>' +
        inboundBanner(a) + handoffBanner(a) +
        (a.network === "N01" ? threadBanner(a) : "") +
        '<div class="split" style="display:flex;gap:12px;align-items:flex-start">' +
        '<div class="rail" style="width:210px;flex:none;display:flex;flex-direction:column;gap:10px">' + rail(a) + '</div>' +
        '<div style="flex:1;min-width:0">' + tracker(a, dec, prepay) + tabBar(!dec) + '<div id="r-panel"></div></div>' +
        '</div></div>';
      document.getElementById("r-back").onclick = function () { window.APP.goBack(); };
      document.getElementById("r-sum").onclick = function () { if (window.COPILOT) window.COPILOT.summarize(id); };
      document.getElementById("r-send").onclick = function () { window.APP.openHandoff(id); };
      var hb = document.getElementById("r-hbanner"); if (hb) hb.onclick = function () { window.APP.openHandoff(id); };
      var rb = document.getElementById("r-refbanner"); if (rb) rb.onclick = function () { var r = T.refsForPayment(id)[0]; window.APP.openNetReferral(r.scope, r.net, r.ids); };
      var tn = document.getElementById("r-thread"); if (tn) tn.onclick = function () { show("links"); };
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

  // the flag an agency sent about this payment, and what Treasury matched it to
  function inboundBanner(a) {
    var s = T.signalOn(a.id); if (!s) return "";
    var L = s.clear ? { c: "var(--low-tx)", bg: "var(--low-bg)" } : { c: T.LANES.flag.c, bg: T.LANES.flag.bg };
    return '<div style="display:flex;align-items:flex-start;gap:12px;background:' + L.bg + ';border:0.5px solid ' + L.c + ';border-radius:9px;padding:9px 14px;margin-bottom:12px">' +
      '<i class="ti ti-inbox" style="font-size:20px;color:' + L.c + ';margin-top:1px"></i>' +
      '<div style="flex:1;font-size:12.5px;line-height:1.45;color:var(--ink)"><b style="color:' + L.c + '">' + (s.clear ? s.agency + ' confirmed this change' : 'Flagged by ' + esc(T.AGENCIES[s.agency].name)) + '</b> · received ' + esc(s.received) + ' · <span class="mono" style="font-size:11px">' + s.id + '</span> · ' + esc(s.kind) +
      '<div style="margin-top:2px">' + esc(s.detail) + '</div>' +
      (s.matched.length ? '<div style="margin-top:2px;color:' + L.c + '"><i class="ti ti-link"></i> <b>Treasury matched it:</b> ' + esc(s.match) + '</div>' : '') + '</div>' +
      '<span style="white-space:nowrap">' + T.laneTag("flag", T.SCHEMA.name.replace(/ \(.*$/, ""), true) + '</span></div>';
  }

  // what the certifying agency did with Treasury's recommendation; or, for a payment
  // that went over inside a network referral, what the agency did with the referral
  function handoffBanner(a) {
    var h = T.handoff(a.id);
    if (!h) {
      var r = T.refsForPayment(a.id)[0]; if (!r) return "";
      var dd = r.decision ? T.netDecision(r.decision.c) : null, tn = !dd ? ["var(--med-tx)", "var(--med-bg)", "clock"] : [TONE_OF(dd.tone), TONE_BG(dd.tone), dd.icon];
      return '<div id="r-refbanner" style="cursor:pointer;display:flex;align-items:center;gap:12px;background:' + tn[1] + ';border:0.5px solid ' + tn[0] + ';border-radius:9px;padding:9px 14px;margin-bottom:12px"><i class="ti ti-' + tn[2] + '" style="font-size:20px;color:' + tn[0] + '"></i>' +
        '<div style="flex:1;font-size:12.5px;line-height:1.45"><b style="color:' + tn[0] + '">' + (dd ? esc(T.AGENCIES[r.agency].name) + ': ' + esc(dd.t) : 'In network referral to ' + esc(T.AGENCIES[r.agency].name)) + '</b> · ' + r.id + ' · ' + (r.scope === "all" ? 'every network' : r.scope === "selected" ? r.ids.length + ' payments' : esc(T.net(r.net).name)) + ' · ' + (dd ? esc(r.decision.by) + ' · ' + window.APP.fmtTs(r.decision.ts) : 'sent ' + window.APP.fmtTs(r.sentAt) + ' · awaiting ' + r.agency) + '</div>' +
        '<span style="font-size:11.5px;color:' + tn[0] + ';white-space:nowrap">View referral <i class="ti ti-arrow-right"></i></span></div>';
    }
    var d = h.decision ? T.agencyDecision(a, h.decision.c) : null;
    var tone = !d ? ["var(--med-tx)", "var(--med-bg)", "clock"] : d.tone === "high" ? ["var(--high-tx)", "var(--high-bg)", d.icon] : d.tone === "low" ? ["var(--low-tx)", "var(--low-bg)", d.icon] : ["var(--med-tx)", "var(--med-bg)", d.icon];
    return '<div id="r-hbanner" style="cursor:pointer;display:flex;align-items:center;gap:12px;background:' + tone[1] + ';border:0.5px solid ' + tone[0] + ';border-radius:9px;padding:9px 14px;margin-bottom:12px">' +
      '<i class="ti ti-' + tone[2] + '" style="font-size:20px;color:' + tone[0] + '"></i>' +
      '<div style="flex:1;font-size:12.5px;line-height:1.45;color:var(--ink)">' + (d
        ? '<b style="color:' + tone[0] + '">' + esc(T.AGENCIES[h.agency].name) + ': ' + esc(d.t) + '</b> · ' + esc(h.decision.by) + ' · ' + window.APP.fmtTs(h.decision.ts) + ' · ' + esc(T.agencyReasonLabel(h.decision.reason)) + (h.decision.note ? '<div style="color:var(--text2)">“' + esc(h.decision.note) + '”</div>' : '')
        : '<b style="color:' + tone[0] + '">Sent to ' + esc(T.AGENCIES[h.agency].name) + '</b> · Treasury recommends: ' + esc(T.recLabel(a, h.rec)) + ' · ' + h.pkg + ' · ' + window.APP.fmtTs(h.sentAt) + '. Only ' + h.agency + ' can stop or recover the payment.') + '</div>' +
      '<span style="font-size:11.5px;color:' + tone[0] + ';white-space:nowrap">View package <i class="ti ti-arrow-right"></i></span></div>';
  }

  function TONE_OF(t) { return t === "high" ? "var(--high-tx)" : t === "low" ? "var(--low-tx)" : "var(--med-tx)"; }
  function TONE_BG(t) { return t === "high" ? "var(--high-bg)" : t === "low" ? "var(--low-bg)" : "var(--med-bg)"; }
  function threadBanner(a) {
    var b = a.batchRec;
    return '<div id="r-thread" style="cursor:pointer;display:flex;align-items:center;gap:12px;background:#001141;color:#fff;border-radius:9px;padding:9px 14px;margin-bottom:12px">' +
      '<i class="ti ti-affiliate" style="font-size:20px;color:#78a9ff"></i>' +
      '<div style="flex:1;font-size:12.5px;line-height:1.45">Paid into <b>' + esc(a.bank) + ' ' + a.acct + '</b>, one of ' + b.accts + ' accounts in batch ' + b.range + '. ' +
      'Mailbox <b>PMB 212, Carver Mill, GA</b> received <b>' + T.MAILBOX.payments + ' federal payments</b> for ' + T.MAILBOX.payees + ' payees · <b style="color:#ffb4a8">' + T.bigUsd(T.MAILBOX.amount) + '</b>. ' +
      'Part of the Delmont network.</div>' +
      '<span style="font-size:11.5px;color:#a6c8ff;white-space:nowrap">See the network <i class="ti ti-arrow-right"></i></span></div>';
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
    var h = T.handoff(a.id), released = dec && dec.action === "pay";
    var steps = prepay ? (released ? ["Certified", "Verified", "Released", "Paid"] : ["Certified", "Verified", "Sent to " + a.agency, a.agency + " decision"]) : ["Flagged", "Assigned", "Under review", "Decision", "Supervisor review", "Case"];
    var at;
    if (prepay) at = released || (h && h.decision) ? 4 : h ? 3 : 1;
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

  var TABS = [["overview", "Overview"], ["checks", "Checks"], ["documents", "Address"], ["procurement", "Account"], ["links", "Network"], ["history", "History"], ["decision", "Decision"]];
  function tabBar(undecided) {
    return '<div style="display:flex;flex-wrap:wrap;gap:2px;border-bottom:0.5px solid var(--border);margin-bottom:10px">' + TABS.map(function (t) {
      return '<button class="ctab' + (t[0] === curTab ? " active" : "") + '" data-tab="' + t[0] + '">' + (t[0] === "decision" && ctx && ctx.a.mode !== "prepay" ? "Finding" : t[1]) + (t[0] === "decision" && undecided ? ' <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);vertical-align:middle;margin-left:2px"></span>' : "") + '</button>';
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
    if (name === "links" && a.network) {
      var cv = document.getElementById("r-netcanvas"); if (cv && window.Views.network.embed) window.Views.network.embed(cv, a.network, a.id, 440);
      var full = document.getElementById("r-netfull"); if (full) full.onclick = function () { window.APP.openNetwork(a.network); };
      var nrf = document.getElementById("r-netrefer"); if (nrf) nrf.onclick = function () { window.APP.openNetReferral("network", a.network); };
      var lsel = {};
      p.querySelectorAll(".r-lsel").forEach(function (c) { c.onclick = function (e) { e.stopPropagation(); lsel[c.getAttribute("data-id")] = c.checked; var ids = Object.keys(lsel).filter(function (k) { return lsel[k]; }), bar = document.getElementById("r-lbar"); if (bar) { bar.style.display = ids.length ? "flex" : "none"; document.getElementById("r-lmsg").textContent = ids.length + " selected, plus this payment"; document.getElementById("r-lrefer").onclick = function () { window.APP.openNetReferral("selected", a.network, [a.id].concat(ids)); }; } }; });
    }
    p.querySelectorAll(".r-tonet").forEach(function (b) { b.onclick = function () { show("links"); }; });
    if (name === "overview") { var b = document.getElementById("r-explain"); if (b) b.onclick = function () { if (window.COPILOT) window.COPILOT.summarize(a.id); }; }
  }

  var SEV = { high: ["var(--high-bg)", "var(--high-tx)", "var(--high)"], med: ["var(--med-bg)", "var(--med-tx)", "var(--med)"], low: ["var(--low-bg)", "var(--low-tx)", "var(--low)"] };
  function overview(a) {
    var rec = { pay: ["Release", "var(--low-tx)", "var(--low-bg)", "check"], hold: ["Refer to " + a.agency + " · recommend hold", "var(--med-tx)", "var(--med-bg)", "send"], deny: ["Refer to " + a.agency + " · recommend stop", "var(--high-tx)", "var(--high-bg)", "send"], confirm: ["Reclaim · recover", "var(--high-tx)", "var(--high-bg)", "alert-triangle"], dismiss: ["Clear — payment stands", "var(--low-tx)", "var(--low-bg)", "circle-check"] }[a.recommendedAction];
    var sig = a.signals.map(function (s) {
      var c = SEV[s.sev] || SEV.low;
      return '<div style="display:flex;gap:10px;padding:9px 0;border-top:0.5px solid var(--border2)"><span style="width:8px;height:8px;border-radius:50%;background:' + c[2] + ';flex:none;margin-top:5px"></span>' +
        '<div style="flex:1"><div style="font-weight:500;font-size:12.5px">' + esc(s.label) + '</div><div style="font-size:12px;color:var(--text2);line-height:1.5;margin-top:1px">' + esc(s.detail) + '</div></div>' +
        '<span style="align-self:flex-start">' + T.laneTag(s.lane, s.src) + '</span></div>';
    }).join("");
    return '<div style="display:flex;gap:12px;flex-wrap:wrap">' +
      '<div class="card" style="flex:2;min-width:340px;margin:0"><div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">' +
      '<div style="width:54px;height:54px;border-radius:50%;border:5px solid ' + (a.riskScore >= 80 ? "var(--high)" : a.riskScore >= 50 ? "var(--med)" : "var(--low)") + ';display:flex;align-items:center;justify-content:center;font-weight:600;font-size:17px">' + a.riskScore + '</div>' +
      '<div style="flex:1"><div style="font-weight:600;font-size:13.5px"><i class="ti ti-sparkles" style="color:var(--accent-d)"></i> Why this was flagged</div><div style="font-size:12px;color:var(--text2);margin-top:2px">' + esc(a.reason) + '.</div>' +
      '<div style="font-size:11px;color:var(--text3);margin-top:3px">Rules + ML/AI + TrackLight · confidence ' + Math.round(a.confidence * 100) + '% · scored during payment verification, before disbursement · alert threshold ' + T.ALERT + '</div></div></div>' +
      factors(a) + sig + '<div style="margin-top:10px;padding-top:8px;border-top:0.5px solid var(--border2);display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="font-size:10.5px;color:var(--text3)">Where it comes from</span>' + T.laneLegend() + '</div></div>' +
      '<div style="flex:1;min-width:230px;display:flex;flex-direction:column;gap:12px">' +
      '<div class="card" style="margin:0;background:' + rec[2] + ';border-color:transparent"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:' + rec[1] + '">Model recommends</div><div style="font-weight:600;font-size:15px;color:' + rec[1] + ';margin-top:3px"><i class="ti ti-' + rec[3] + '"></i> ' + rec[0] + '</div>' +
      '<button class="btn" id="r-explain" style="margin-top:9px;font-size:11.5px;background:#fff"><i class="ti ti-sparkles"></i> Explain in full</button></div>' +
      agencyFlags(a) +
      '<div class="card" style="margin:0"><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:5px">Payment</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>' + esc(a.prog.name) + '</span></div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0;color:var(--text2)"><span>Certified by ' + esc(T.AGENCIES[a.agency].name) + '</span></div>' +
      (a.program === "REF" && a.network === "N01" ? '<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>Peer median</span><span class="mono">' + usd(T.PEER_MEDIAN) + '</span></div>' : '') +
      '<div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:600;border-top:0.5px solid var(--border2);margin-top:4px;padding-top:5px"><span>Amount</span><span class="mono">' + usd(a.amount) + '</span></div></div>' +
      '</div></div>';
  }

  // what drives the score: the flagged signals and TrackLight findings, weighted
  // high 3 · medium 2, sharing the score above a base of 10
  function factors(a) {
    var f = (a.signals || []).filter(function (s) { return s.sev !== "low"; }).map(function (s) { return { t: s.label, w: s.sev === "high" ? 3 : 2, src: s.src }; });
    var seen = f.map(function (x) { return x.src; }).join(" ");
    T.tlFor(a.id).forEach(function (x) { if (x.st === "fail" && x.k !== "network" && seen.indexOf("TrackLight") < 0) f.push({ t: x.t, w: 2, src: "TrackLight" }); });
    if (!f.length || a.riskScore < 30) return "";
    var sum = f.reduce(function (t, x) { return t + x.w; }, 0), pool = a.riskScore - 10;
    f.sort(function (x, y) { return y.w - x.w; });
    var top = f.slice(0, 4);
    return '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 6px"><span style="font-size:10.5px;color:var(--text3);align-self:center">Top factors</span>' + top.map(function (x) {
      return '<span class="pill" style="background:var(--surface);border:0.5px solid var(--border);color:var(--ink);font-size:10.5px">' + esc(x.t) + ' <b class="mono" style="color:var(--high-tx)">+' + Math.round(pool * x.w / sum) + '</b></span>';
    }).join("") + '</div>';
  }
  // flags other agencies shared that Treasury matched to this payment
  function agencyFlags(a) {
    var S = T.signalsFor(a.id); if (!S.length) return "";
    return '<div class="card" style="margin:0;border-color:' + T.LANES.flag.c + '"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px"><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em"><i class="ti ti-inbox" style="color:' + T.LANES.flag.c + '"></i> Agency flags matched to this payment</div>' + T.laneTag("flag", null, true) + '</div>' +
      S.map(function (s) {
        var own = s.payment === a.id;
        return '<div style="padding:6px 0;border-top:0.5px solid var(--border2);font-size:11.5px;line-height:1.45"><div><span class="tag" style="font-size:9.5px">' + s.agency + '</span> <b style="font-weight:500">' + esc(s.kind) + '</b> <span class="muted" style="font-size:10.5px">· ' + esc(s.received.slice(0, 10)) + '</span></div>' +
          '<div style="color:var(--text2);margin-top:2px">' + (own ? esc(s.detail) : esc(s.subject) + ' (' + s.payment + '): ' + esc(s.match)) + '</div></div>';
      }).join("") + '</div>';
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
    var dnp = T.DNP.map(function (g) {
      var hit = g.k === "death" && t === "Deceased payee";
      return row(hit ? "fail" : "pass", g.t, hit ? "Payee deceased 2026-08-30 (SSA Numident)" : "No match", g.src);
    }).join("") + row(t === "Vendor bank change" ? "fail" : "pass", "Account ownership", t === "Vendor bank change" ? "Account belongs to a different business" : "In the payee's name", "Account verification") + row("pass", "TIN", "Valid and matches the payee", "TIN verification");
    var tl = T.tlFor(a.id), found = tl.filter(function (f) { return f.st !== "pass"; }), quiet = tl.filter(function (f) { return f.st === "pass"; }), hits = found.length;
    var byGroup = function (list) { return T.TL_GROUPS.map(function (g) { var rs = list.filter(function (f) { return f.g === g[0]; }); return rs.length ? '<div style="font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text3);margin:8px 0 -3px">' + g[0] + ' <span style="font-weight:400;text-transform:none;letter-spacing:0">· ' + g[1] + '</span></div>' + rs.map(function (f) { return row(f.st, f.t, f.text, f.src); }).join("") : ""; }).join(""); };
    var tlRows = byGroup(found) + (quiet.length ? '<details style="margin-top:8px"><summary style="cursor:pointer;font-size:11.5px;color:var(--text2);padding:4px 0"><i class="ti ti-circle-check" style="color:var(--low)"></i> ' + quiet.length + ' checks with no adverse findings · ' + T.TL_CATS.length + ' in all</summary>' + byGroup(quiet) + '</details>' : '');
    var col = function (icon, title, sub, badge, body, tone) {
      return '<div style="flex:1;min-width:300px;border:0.5px solid var(--border);border-radius:9px;overflow:hidden"><div style="padding:9px 12px;background:' + tone + ';display:flex;justify-content:space-between;align-items:center;gap:8px"><div><div style="font-weight:600;font-size:12.5px"><i class="ti ti-' + icon + '"></i> ' + title + '</div><div style="font-size:10.5px;color:var(--text2)">' + sub + '</div></div>' + badge + '</div><div style="padding:2px 12px 6px">' + body + '</div></div>';
    };
    var buy = '<div style="font-size:10px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text3);margin:12px 0 -3px">Available to buy <span style="font-weight:400;text-transform:none;letter-spacing:0">· checks Treasury could add with purchased data · not run</span></div>' + T.BUYABLE.map(function (b) { return row("na", b.t, b.text, b.src); }).join("");
    dnp += buy;
    var dnpOk = t !== "Deceased payee" && t !== "Vendor bank change";
    return '<div class="card" style="margin:0"><div style="display:flex;gap:10px;flex-wrap:wrap">' +
      col("shield-check", "Today's checks", "Do Not Pay, account ownership and TIN · run on every payment", '<span class="pill" style="background:' + (dnpOk ? "var(--low-bg);color:var(--low-tx)" : "var(--high-bg);color:var(--high-tx)") + '">' + (dnpOk ? "All passed" : "Match") + '</span>', dnp, "var(--surface)") +
      col("radar-2", T.tlMark("due diligence"), "What TrackLight adds beyond Do Not Pay", '<span class="pill" style="background:' + (hits ? "var(--high-bg);color:var(--high-tx)" : "var(--low-bg);color:var(--low-tx)") + '">' + (hits ? hits + " finding" + (hits > 1 ? "s" : "") : "No findings") + '</span>', tlRows, hits ? "var(--high-bg)" : "var(--surface)") +
      '</div>' +
      (dnpOk && hits ? '<div style="margin-top:10px;font-size:12px;line-height:1.5;padding:9px 11px;border-radius:8px;background:var(--accent-l);color:var(--ink)"><i class="ti ti-info-circle" style="color:var(--accent-d)"></i> Every check Treasury runs today passed: Do Not Pay asks whether a payee is on a list. TrackLight asks who the payee really is, who stands behind the employer, and what\'s on record about them.</div>' : '') +
      '<div style="font-weight:500;font-size:13px;margin:14px 0 8px"><i class="ti ti-affiliate" style="color:var(--accent-d)"></i> Pattern checks <span class="muted" style="font-weight:400;font-size:11px">· this payment against every other payment, across agencies</span></div>' + grid(P) +
      (allPass && anyFail ? '<div style="margin-top:12px;font-size:12px;line-height:1.5;padding:9px 11px;border-radius:8px;background:var(--accent-l);color:var(--ink)"><i class="ti ti-info-circle" style="color:var(--accent-d)"></i> It passed every list check: the identity is real and the account is in that name. The pattern checks look at what\'s around the payment, and that\'s where it fails.</div>' : '') + '</div>';
  }

  function row(st, title, text, src) {
    var c = { pass: ["circle-check", "var(--low)"], fail: ["circle-x", "var(--high)"], warn: ["alert-triangle", "var(--med)"], na: ["circle-dashed", "var(--text3)"] }[st];
    return '<div style="display:flex;gap:9px;padding:7px 0;border-top:0.5px solid var(--border2)' + (st === "na" ? ';opacity:.75' : '') + '"><i class="ti ti-' + c[0] + '" style="color:' + c[1] + ';font-size:16px;margin-top:1px"></i><div style="flex:1;min-width:0"><div style="font-size:12px"><b style="font-weight:500">' + esc(title) + '</b>' + (st === "pass" ? ' <span style="color:var(--text2)">· ' + esc(text) + '</span>' : st === "na" ? ' ' + T.laneTag("buy", null, true) : '') + '</div>' + (st === "fail" || st === "warn" ? '<div style="font-size:11.5px;color:var(--ink);line-height:1.4;margin-top:1px">' + esc(text) + '</div>' : st === "na" ? '<div style="font-size:11.5px;color:var(--text2);line-height:1.4;margin-top:1px">' + esc(text) + '</div>' : '') + '<div style="font-size:10px;color:var(--text3);margin-top:1px">' + esc(src) + '</div></div></div>';
  }

  // ---- address: every federal payee at the mailbox ----
  var BOX = [
    ["PV-73194", "Anna Reed", "REF", 18940, "2026-10-06", "Brightpath ••6208", "held"],
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

  // the payment's network, drawn here so the analyst never has to leave the record
  function links(a) {
    if (!a.network) return '<div class="card" style="margin:0;color:var(--text2);font-size:12px"><i class="ti ti-circle-dashed"></i> No network: this payment shares no account batch, address, phone or employer with other payees.</div>';
    var n = T.net(a.network), mine = T.GRAPH.filter(function (g) { return g.id === a.id; })[0];
    var graph = '<div class="card" style="margin:0 0 12px;padding:0;overflow:hidden"><div style="padding:10px 12px;border-bottom:0.5px solid var(--border2);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">' +
      '<div><div style="font-weight:500;font-size:13px"><i class="ti ti-affiliate" style="color:var(--accent-d)"></i> ' + esc(n.name) + ' <span class="muted" style="font-weight:400;font-size:11px">· ' + esc(T.SCHEMES[n.scheme].label.toLowerCase()) + ' · ' + n.payees + ' payees · ' + n.agencies.join(", ") + ' · ' + T.bigUsd(n.atRisk) + '</span></div><div style="font-size:11px;color:var(--text2)">This payment is outlined in ' + (a.id === T.SEED ? 'red' : 'blue') + '. Hover a batch, a payment or an agency; click a payment to open it.</div></div>' +
      '<div style="display:flex;gap:6px"><button class="btn" id="r-netrefer" style="font-size:11.5px"><i class="ti ti-send"></i> Refer this network</button><button class="btn" id="r-netfull" style="font-size:11.5px"><i class="ti ti-arrows-maximize"></i> Open the full network view</button></div></div>' +
      '<div id="r-netcanvas" style="background:var(--surface)"></div></div>';
    if (!mine) return graph;
    var rel = T.GRAPH.filter(function (g) { return g.id !== a.id && (g.batch === mine.batch || g.program === mine.program); }).slice(0, 12);
    return graph + '<div class="card" style="padding:0;overflow:hidden;margin:0"><div style="padding:10px 12px;border-bottom:0.5px solid var(--border2);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div style="font-weight:500;font-size:13px"><i class="ti ti-link" style="color:var(--accent-d)"></i> Payments linked to this one <span class="muted" style="font-weight:400;font-size:11px">· ' + rel.length + ' shown of ' + T.net("N01").payments + ' in the network · tick some to refer them with this one</span></div>' +
      '<div id="r-lbar" style="display:none;align-items:center;gap:8px"><span id="r-lmsg" style="font-size:11.5px"></span><button class="btn primary" id="r-lrefer" style="font-size:11px;padding:3px 9px"><i class="ti ti-send"></i> Refer together</button></div></div>' +
      '<table><thead><tr><th style="width:28px"></th><th>Payment</th><th>Payee</th><th>Shares</th><th class="right">Amount</th><th>Status</th></tr></thead><tbody>' +
      rel.map(function (g) {
        var sh = [g.batch === mine.batch ? "account batch" : null, "mailbox PMB 212", g.program === mine.program ? "same payment type" : null].filter(Boolean).join(" · ");
        var open = T.lead(g.id);
        return '<tr' + (open ? ' data-open="' + g.id + '" style="cursor:pointer"' : '') + '><td>' + (open ? '<input type="checkbox" class="r-lsel" data-id="' + g.id + '">' : '') + '</td><td class="mono">' + g.id + '</td><td>' + esc(g.payee) + '</td><td style="font-size:11.5px">' + sh + '</td><td class="right mono">' + usd(g.amount) + '</td><td style="font-size:11.5px">' + (g.state === "held" ? "Held" : g.state === "pending" ? "Pending" : "Paid") + '</td></tr>';
      }).join("") + '</tbody></table></div>';
  }

  function history(a) {
    var ev = [[a.submitted, "Certified", "By " + T.AGENCIES[a.agency].name], [a.submitted, "Verified", "Risk " + a.riskScore + " · " + a.reason]];
    if (a.paidDate) ev.push([a.paidDate, "Paid", usd(a.amount) + " to " + a.bank + " " + a.acct]);
    if (a.paidDate && a.network) ev.push([a.paidDate, "Flagged post-payment", "Linked to " + T.net(a.network).name]);
    T.signalsFor(a.id).forEach(function (s) { ev.push([s.received, s.agency + " flag received", s.kind + (s.payment === a.id ? "" : " · " + s.subject + " (" + s.payment + ") · " + s.match)]); });
    var h = T.handoff(a.id); if (h) (h.trail || []).forEach(function (t) { ev.push([window.APP.fmtTs(t.ts), (t.side === "agency" ? h.agency : "Treasury") + " · package", t.who + " · " + t.text]); });
    T.refsForPayment(a.id).forEach(function (r) { (r.trail || []).forEach(function (t) { ev.push([window.APP.fmtTs(t.ts), (t.side === "agency" ? r.agency : "Treasury") + " · " + r.id, t.who + " · " + t.text]); }); });
    var audit = window.APP.state.audit.filter(function (x) { return (x.detail || "").indexOf(a.id) >= 0; }).slice().reverse().map(function (x) { return [window.APP.fmtTs(x.ts), x.action.replace(/_/g, " ").toLowerCase().replace(/^./, function (c) { return c.toUpperCase(); }), x.detail + " · " + x.user]; });
    return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:6px"><i class="ti ti-timeline" style="color:var(--accent-d)"></i> History</div>' +
      ev.concat(audit).map(function (e) { return '<div style="display:flex;gap:10px;padding:6px 0;border-top:0.5px solid var(--border2);font-size:12px"><span class="mono" style="color:var(--text3);width:120px;flex:none">' + esc(e[0] || "") + '</span><span style="font-weight:500;width:150px;flex:none">' + esc(e[1]) + '</span><span style="color:var(--text2)">' + esc(e[2]) + '</span></div>'; }).join("") + '</div>';
  }

  // ---- decision ----
  function decision(a) {
    if (a.mode === "prepay") {
      var d = window.APP.prepayDecisionFor(a.id), h = T.handoff(a.id), refer = a.recommendedAction !== "pay";
      return '<div class="card" style="margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:3px">Pre-payment action</div>' +
        '<div style="font-size:11.5px;color:var(--text2);margin-bottom:10px">Treasury releases payments with no concerns. For the rest, only ' + esc(T.AGENCIES[a.agency].name) + ' can stop the payment, so Treasury sends a recommendation and ' + a.agency + ' decides.</div>' +
        (d && d.action === "pay" ? '<div style="font-size:12.5px"><i class="ti ti-check" style="color:var(--low)"></i> Released for disbursement · ' + esc(window.APP.reasonLabel("pay", d.reason)) + '</div>'
          : h ? '<div style="font-size:12.5px">' + (h.decision ? '<i class="ti ti-' + T.agencyDecision(a, h.decision.c).icon + '"></i> ' + esc(T.agencyDecision(a, h.decision.c).t) + ' by ' + a.agency + ' · ' + esc(T.agencyReasonLabel(h.decision.reason)) : '<i class="ti ti-clock"></i> Sent to ' + a.agency + ': ' + esc(T.recLabel(a, h.rec)) + ' · awaiting ' + a.agency + '\'s decision') + '</div><button class="btn r-pkg" style="margin-top:10px"><i class="ti ti-package"></i> View package</button>'
          : '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="seg r-pp" data-act="pay" style="flex:1"><i class="ti ti-check"></i> Release<div class="sub">no concerns · pays on schedule</div></button>' +
          '<button class="seg r-pp" data-act="refer" style="flex:1;' + (refer ? "border-color:var(--accent);background:var(--accent-l)" : "") + '"><i class="ti ti-send"></i> Refer to ' + a.agency + (refer ? ' <span class="pill" style="background:var(--accent);color:#fff;font-size:9.5px">model</span>' : '') + '<div class="sub">recommend ' + esc(T.recLabel(a, T.defaultRec(a)).toLowerCase()) + ' · ' + a.agency + ' decides</div></button></div>') + (a.network ? '<div style="margin-top:10px"><button type="button" class="btn r-tonet" style="font-size:11px;padding:3px 9px"><i class="ti ti-affiliate"></i> See where this payment sits in the network</button></div>' : '') + '</div>';
    }
    var dec = window.APP.decisionFor(a.id);
    var netBtn = a.network ? '<button type="button" class="btn r-tonet" style="font-size:11px;padding:3px 9px"><i class="ti ti-affiliate"></i> See where this payment sits in the network</button>' : '';
    var intro = '<div style="font-size:11.5px;color:var(--text2);margin-bottom:10px">Treasury records what it found. A supervisor approves the finding, and the recommendation goes to ' + esc(T.AGENCIES[a.agency].name) + ', which decides on recovery. Only ' + a.agency + ' can act on the payment.</div>';
    if (dec) return '<div class="card" style="margin:0 0 12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:3px"><div style="font-weight:500;font-size:13px">Treasury\'s finding</div>' + netBtn + '</div>' + intro + '<div style="font-size:12.5px"><b>' + esc(T.FINDING[dec.outcome]) + '</b> · ' + esc(window.APP.reasonLabel(dec.outcome, dec.reason)) + '</div><div style="font-size:12px;color:var(--text2);margin-top:4px">' + (dec.reviewState === "pending" ? '<i class="ti ti-clock"></i> With the supervisor (Karen Boyd) for approval.' : dec.reviewState === "approved" ? '<i class="ti ti-check" style="color:var(--low)"></i> Approved by the supervisor.' : dec.reviewState === "returned" ? '<i class="ti ti-arrow-back"></i> Returned by the supervisor' + (dec.returnNote ? ': ' + esc(dec.returnNote) : '.') : "") + '</div></div>' + agencyCard(a);
    return '<div class="card" style="margin:0 0 12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:3px"><div style="font-weight:500;font-size:13px">Treasury\'s finding</div>' + netBtn + '</div>' + intro +
      '<div style="display:flex;gap:8px">' +
      '<button class="seg" data-d="c">Improper<div class="sub">recommend ' + a.agency + ' reclaim it from the bank</div></button>' +
      '<button class="seg" data-d="d">Proper<div class="sub">the payment stands</div></button>' +
      '<button class="seg" data-d="e">Needs investigation<div class="sub">recommend a referral to TIGTA / IRS-CI or the OIG</div></button></div>' +
      '<div id="r-dform" style="display:none;margin-top:12px">' +
      '<div style="font-size:11px;color:var(--text2);margin-bottom:3px">Reason</div><select id="r-reason" class="input"></select>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0 3px"><span style="font-size:11px;color:var(--text2)">Justification</span><button class="btn" id="r-draft" style="font-size:11px;padding:3px 8px"><i class="ti ti-sparkles"></i> Draft with AI</button></div>' +
      '<textarea id="r-just" class="input" style="min-height:74px" placeholder="Why this decision…"></textarea>' +
      '<div id="r-case" style="margin-top:12px"></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn primary" id="r-submit"><i class="ti ti-send"></i> Submit finding to supervisor</button></div></div></div>' + agencyCard(a);
  }
  // post-payment: the recommendation to the agency follows the finding, once approved
  function agencyCard(a) {
    var h = T.handoff(a.id), d = T.findingFor(a.id), ag = esc(T.AGENCIES[a.agency].name);
    var title, sub, btn = "", tone = "var(--border)";
    if (h && h.decision) { title = ag + ': ' + esc(T.agencyDecision(a, h.decision.c).t); sub = 'Treasury recommended: ' + esc(T.recLabel(a, h.rec)); btn = '<button class="btn r-pkg"><i class="ti ti-package"></i> View package</button>'; tone = "var(--low-tx)"; }
    else if (h) { title = 'Sent to ' + ag + ' · awaiting its decision'; sub = 'Treasury recommends: ' + esc(T.recLabel(a, h.rec)); btn = '<button class="btn r-pkg"><i class="ti ti-package"></i> View package</button>'; tone = "var(--accent)"; }
    else if (!d) { title = 'Recommendation to ' + ag; sub = 'Drafts from the finding above. It goes out once a supervisor approves.'; }
    else if (d.outcome === "dismiss") { title = 'No recommendation to ' + ag; sub = 'The payment is proper; nothing for ' + a.agency + ' to act on.'; }
    else if (d.reviewState !== "approved") { title = 'Recommendation to ' + ag + ' · waiting on the supervisor'; sub = 'Will recommend: ' + esc(T.recLabel(a, T.defaultRec(a))) + '. Sent once the finding is approved.'; }
    else { title = 'Finding approved · send ' + ag + ' the recommendation'; sub = 'Treasury recommends: ' + esc(T.recLabel(a, T.defaultRec(a))) + '. ' + a.agency + ' decides in its own system.'; btn = '<button class="btn primary r-pkg"><i class="ti ti-send"></i> Send to ' + a.agency + '</button>'; tone = "var(--accent)"; }
    return '<div class="card" style="margin:0;display:flex;gap:10px;align-items:center;flex-wrap:wrap;border-color:' + tone + '"><i class="ti ti-send" style="font-size:20px;color:' + (btn ? "var(--accent-d)" : "var(--text3)") + '"></i><div style="flex:1;min-width:220px"><div style="font-weight:500;font-size:13px">' + title + '</div><div style="font-size:11.5px;color:var(--text2)">' + sub + '</div></div>' + btn + '</div>';
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
    document.querySelectorAll(".r-pp").forEach(function (b) { b.onclick = function () { if (b.getAttribute("data-act") === "refer") return window.APP.openHandoff(a.id); window.APP.prepayDecide(a.id, "pay"); window.APP.nav("claim", { id: a.id }); }; });
    document.querySelectorAll(".r-pkg").forEach(function (b) { b.onclick = function () { window.APP.openHandoff(a.id); }; });
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
        document.getElementById("r-submit").innerHTML = outcome === "d" ? '<i class="ti ti-check"></i> Record as proper' : '<i class="ti ti-send"></i> Submit finding to supervisor';
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
