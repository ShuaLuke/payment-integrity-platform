/* Treasury pack · Casework › Payments.
   Pre-payment: every payment is verified before Treasury disburses it; the
   analyst releases a payment with no concerns or refers it to the certifying
   agency with a recommendation (only the agency can stop it), while clean
   payments go straight through. Payments at or above the alert threshold alert.
   Post-payment: paid payments flagged for review and reclamation.
   Replaces Views.queue. */
(function () {
  window.Views = window.Views || {};
  var P = window.TREAS, esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var OPEN = ["New", "Assigned", "Under review", "Returned", "Pending review"];

  function kpi(label, val, sub) {
    return '<div class="kpi"><div class="l">' + label + '</div><div class="v">' + val + '</div>' + (sub ? '<div style="font-size:11px;color:var(--text2);margin-top:2px">' + sub + '</div>' : '') + '</div>';
  }
  function progTag(l) { return '<span class="tag" title="' + esc(l.prog.name) + '" style="font-size:10px">' + l.agency + '</span>'; }
  function lineTag(l) { return '<span class="tag" style="font-size:10px">' + esc(l.prog.short) + '</span>'; }
  function sub(l) { return esc(l.bank) + ' ' + esc(l.acct) + (l.acctOpened && /^\d{4}/.test(l.acctOpened) ? ' · opened ' + l.acctOpened : '') + ' · ' + esc(l.city); }

  window.Views.queue = {
    render: function (mount) {
      if (window.APP.isPrepay()) return renderPrepay(mount);
      return renderPost(mount);
    }
  };

  // ---------- pre-payment ----------
  function prepayRows() { return P.LEADS.filter(function (l) { return l.mode === "prepay"; }); }
  function stats() {
    var rows = prepayRows(), dec = window.APP.state.prepayDecisions, s = { total: rows.length, pending: 0, atRisk: 0, referred: 0, stopped: 0, released: 0, alerts: 0 };
    rows.forEach(function (l) {
      var d = dec[l.id];
      if (l.riskScore >= P.ALERT) s.alerts++;
      if (!d) { s.pending++; if (l.recommendedAction !== "pay") s.atRisk += l.amount; }
      else if (d.action === "pay") s.released += l.amount;
      else { s.referred += l.amount; if (d.agency && d.agency.c === "stop") s.stopped += l.amount; }
    });
    return s;
  }
  function renderPrepay(mount) {
    var st = window.APP.state.trq || (window.APP.state.trq = { rec: "" });
    var S = stats(), I = P.INTAKE;
    var seg = function (v, l) { return '<button class="qscope ppseg' + (st.rec === v ? " active" : "") + '" data-rec="' + v + '">' + l + '</button>'; };
    mount.innerHTML =
      '<div class="page">' +
      '<div class="page-head"><div><div class="page-title">Pre-payment review</div><div class="page-sub">Payments certified by federal agencies · every payment is verified <b>before</b> Treasury disburses it. Release what has no concerns; refer the rest to the certifying agency with a recommendation. Only the agency can stop a payment.</div></div>' +
      '<div style="display:flex;gap:10px;align-items:center"><div style="display:flex;gap:2px;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px">' + seg("", "All") + seg("deny", "Recommend stop") + seg("hold", "Recommend hold") + seg("pay", "Release") + '</div>' + window.EXPORT.group("ppq") + '</div></div>' +
      '<div class="kpis">' +
      kpi("Awaiting a decision", S.pending + " / " + S.total, "flagged or sampled for review") +
      kpi("Amount at risk", usd(S.atRisk), "recommended Hold or Return") +
      kpi("Referred to agencies", '<span id="ppq-held" style="color:var(--accent-d)">' + usd(S.referred) + '</span>', S.stopped ? '<b style="color:var(--low-tx)">' + usd(S.stopped) + '</b> stopped by the agency' : "with Treasury's recommendation") +
      kpi("Paid this morning · fast lane", (I.payments / 1e6).toFixed(2) + 'M <span style="font-size:13px;color:var(--text2);font-weight:500">· $' + (I.amount / 1e9).toFixed(1) + 'B</span>', (I.fastLane * 100).toFixed(2) + "% pass every check · no added wait") +
      '</div>' +
      '<div id="ppq-selbar" style="display:none;align-items:center;gap:10px;margin:0 0 8px;padding:8px 12px;border-radius:8px;background:var(--accent-l);border:0.5px solid var(--accent)"><i class="ti ti-checkbox" style="color:var(--accent-d)"></i><span id="ppq-selmsg" style="flex:1;font-size:12px"></span><button class="btn primary" id="ppq-refer" style="font-size:11.5px"><i class="ti ti-send"></i> Refer together</button></div>' +
      '<div class="card" style="padding:0;overflow:hidden"><table><thead><tr><th style="width:28px"><input type="checkbox" id="ppq-all" title="Select every undecided payment"></th><th>Risk</th><th>Payment</th><th>Payee · deposit account</th><th class="right">Amount</th><th>Model recommends</th><th style="width:206px">Treasury action</th></tr></thead><tbody id="ppq-body"></tbody></table></div>' +
      '<div style="margin-top:10px;font-size:12px;color:var(--text2)"><i class="ti ti-shield-check" style="color:var(--accent-d)"></i> Do Not Pay, account ownership and TIN checks run on every payment. These are the payments that need a person: some failed a check, and some passed every check but don\'t fit the pattern around them. ' + S.alerts + ' scored at or above the alert threshold of ' + P.ALERT + '.</div>' +
      '</div>';
    draw();
    mount.querySelectorAll(".ppseg").forEach(function (b) { b.onclick = function () { st.rec = b.getAttribute("data-rec"); window.APP.nav("queue"); }; });
    var head = ["Payment", "Agency", "Type", "Payee", "City", "Bank", "Account", "Risk", "Pattern", "Amount", "Model recommends", "Treasury action"];
    var rows = function () { return prepayRows().map(function (l) { var d = window.APP.prepayDecisionFor(l.id); return [l.id, l.agency, l.prog.name, l.payee, l.city, l.bank, l.acct, l.riskScore, l.fwaType, l.amount, l.recommendedAction.toUpperCase(), d ? decidedLabel(d, l) : "Pending"]; }); };
    window.EXPORT.wire("ppq", {
      csv: function () { window.EXPORT.csv("pre-payment-review", head, rows()); },
      xls: function () { window.EXPORT.xls("pre-payment-review", "Pre-payment", head, rows()); },
      pdf: function () { window.EXPORT.pdf("Pre-payment review — Treasury payments", window.EXPORT.tableHtml(head, rows())); }
    });
  }
  var sel = {};
  function selBar() {
    var ids = Object.keys(sel).filter(function (k) { return sel[k]; }), bar = document.getElementById("ppq-selbar"); if (!bar) return;
    bar.style.display = ids.length ? "flex" : "none"; if (!ids.length) return;
    var ags = ids.map(function (id) { return P.lead(id).agency; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var total = ids.reduce(function (t, id) { return t + P.lead(id).amount; }, 0);
    document.getElementById("ppq-selmsg").innerHTML = ids.length + ' payment' + (ids.length > 1 ? 's' : '') + ' selected · ' + usd(total) + ' · ' + ags.join(", ") + (ags.length > 1 ? ' <span style="color:var(--text2)">· one referral per agency</span>' : '');
    document.getElementById("ppq-refer").onclick = function () { window.APP.openNetReferral("selected", null, ids); };
  }
  function draw() {
    var st = window.APP.state.trq, rows = prepayRows();
    if (st.rec) rows = rows.filter(function (l) { return l.recommendedAction === st.rec; });
    rows.sort(function (a, b) { return b.riskScore - a.riskScore; });
    var body = document.getElementById("ppq-body");
    var crossed = false;
    body.innerHTML = rows.map(function (l) {
      var dec = window.APP.prepayDecisionFor(l.id);
      var line = !crossed && l.riskScore < P.ALERT ? (crossed = true, '<tr><td colspan="7" style="padding:3px 10px;background:var(--surface);font-size:10.5px;color:var(--text2);border-top:1.5px dashed var(--high)"><i class="ti ti-bell"></i> Alert threshold ' + P.ALERT + ' · above it, analysts are alerted; below it, payments are sampled</td></tr>') : "";
      return line + '<tr class="pprow" data-id="' + l.id + '" style="cursor:pointer">' +
        '<td>' + (dec ? '' : '<input type="checkbox" class="ppsel" data-id="' + l.id + '"' + (sel[l.id] ? ' checked' : '') + '>') + '</td>' +
        '<td>' + window.UI.riskChip(l.riskScore) + '</td>' +
        '<td><div style="display:flex;gap:6px;align-items:center"><span class="mono" style="font-weight:500">' + l.id + '</span>' + progTag(l) + '</div>' +
        '<div style="margin-top:3px;display:flex;gap:4px;flex-wrap:wrap;align-items:center"><span class="tag fwa">' + esc(l.fwaType) + '</span>' + lineTag(l) + '</div></td>' +
        '<td><div style="font-weight:500">' + esc(l.payee) + '</div><div style="font-size:10.5px;color:var(--text2)">' + sub(l) + '</div></td>' +
        '<td class="right" style="font-weight:600">' + usd(l.amount) + '</td>' +
        '<td>' + recPill(l) + '</td>' +
        '<td>' + (dec ? decidedPill(dec, l) : btns(l)) + '</td></tr>';
    }).join("") || '<tr><td colspan="7" class="muted" style="padding:16px;text-align:center">No payments match this filter.</td></tr>';
    body.querySelectorAll(".ppsel").forEach(function (c) { c.onclick = function (e) { e.stopPropagation(); sel[c.getAttribute("data-id")] = c.checked; selBar(); }; });
    var all = document.getElementById("ppq-all"); if (all) all.onclick = function () { body.querySelectorAll(".ppsel").forEach(function (c) { c.checked = all.checked; sel[c.getAttribute("data-id")] = all.checked; }); selBar(); };
    selBar();
    body.querySelectorAll(".ppbtn").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        var id = b.getAttribute("data-id");
        if (b.getAttribute("data-act") === "refer") return window.APP.openHandoff(id);
        window.APP.prepayDecide(id, "pay"); window.APP.nav("queue");
      };
    });
    body.querySelectorAll(".pp-rec").forEach(function (b) {
      b.onmouseenter = function () { showTip(b); };
      b.onmouseleave = hideTip;
      b.onclick = function (e) { e.stopPropagation(); hideTip(); if (window.COPILOT && window.COPILOT.explain) window.COPILOT.explain(b.getAttribute("data-id")); };
    });
    body.querySelectorAll(".pprow").forEach(function (tr) { tr.onclick = function () { window.APP.openAllegation(tr.getAttribute("data-id")); }; });
  }
  function btns(l) { return '<div style="display:flex;gap:4px">' + btn(l.id, "pay", "Release", "check", "var(--low)") + btn(l.id, "refer", "Refer to " + l.agency, "send", "var(--accent)") + '</div>'; }
  function btn(id, act, label, icon, color) { return '<button class="ppbtn" data-id="' + id + '" data-act="' + act + '" style="border:0.5px solid ' + color + ';color:' + color + ';background:#fff;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:3px;font-family:var(--sans)"><i class="ti ti-' + icon + '"></i>' + label + '</button>'; }
  function recPill(l) {
    var m = { pay: ["Release", "var(--low-tx)"], hold: ["Refer · hold", "var(--med-tx)"], deny: ["Refer · stop", "var(--high-tx)"] }[l.recommendedAction];
    return '<button class="pp-rec" data-id="' + l.id + '" style="border:0.5px dashed transparent;background:none;border-radius:6px;padding:2px 6px;margin-left:-6px;cursor:pointer;font-size:11.5px;font-weight:500;font-family:var(--sans);color:' + m[1] + ';display:inline-flex;align-items:center;gap:4px" onmouseover="this.style.borderColor=\'currentColor\'" onmouseout="this.style.borderColor=\'transparent\'"><i class="ti ti-sparkles"></i> ' + m[0] + ' <i class="ti ti-info-circle" style="font-size:12px;opacity:.7"></i></button>';
  }
  // released by Treasury, sent to the agency, or decided by the agency
  function decidedLabel(d, l) {
    if (d.action === "pay") return "Released to pay";
    if (d.agency) { var x = P.agencyDecision(l, d.agency.c); return x.status + l.agency; }
    return "Sent to " + l.agency;
  }
  function decidedPill(d, l) {
    var m = d.action === "pay" ? ["var(--low-tx)", "var(--low-bg)", "check"] : !d.agency ? ["var(--accent-d)", "var(--accent-l)", "send"]
      : d.agency.c === "stop" ? ["var(--high-tx)", "var(--high-bg)", "hand-stop"] : d.agency.c === "release" ? ["var(--low-tx)", "var(--low-bg)", "check"] : ["var(--med-tx)", "var(--med-bg)", "message-question"];
    return '<span class="pill" style="background:' + m[1] + ';color:' + m[0] + '"><i class="ti ti-' + m[2] + '"></i> ' + decidedLabel(d, l) + '</span>';
  }
  function showTip(b) {
    var l = P.lead(b.getAttribute("data-id")); if (!l) return;
    var tip = document.getElementById("pp-rec-tip");
    if (!tip) { tip = document.createElement("div"); tip.id = "pp-rec-tip"; document.body.appendChild(tip); }
    var label = { pay: "Release", hold: "Refer to " + l.agency + " · recommend hold", deny: "Refer to " + l.agency + " · recommend stop" }[l.recommendedAction], tone = { pay: "var(--low-tx)", hold: "var(--med-tx)", deny: "var(--high-tx)" }[l.recommendedAction];
    var top3 = (l.signals || []).slice(0, 3).map(function (s) { return '<div style="display:flex;gap:6px;margin-top:3px"><span style="width:6px;height:6px;border-radius:50%;flex:none;margin-top:6px;background:' + (s.sev === "high" ? "var(--high)" : s.sev === "med" ? "var(--med)" : "var(--low)") + '"></span><span>' + esc(s.label) + '</span></div>'; }).join("");
    tip.style.cssText = "position:fixed;z-index:300;width:330px;background:var(--card);border:0.5px solid var(--border);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.16);padding:11px 13px;font-size:12px;line-height:1.45;pointer-events:none";
    tip.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px"><span style="font-weight:600;color:' + tone + '"><i class="ti ti-sparkles"></i> ' + label + '</span><span style="font-size:10.5px;color:var(--text2)">risk <b>' + l.riskScore + '</b> · confidence <b>' + Math.round(l.confidence * 100) + '%</b></span></div>' +
      '<div>' + esc(l.reason) + '.</div>' + (top3 ? '<div style="margin-top:7px;padding-top:6px;border-top:0.5px solid var(--border2);font-size:11px;color:var(--text2)">' + top3 + '</div>' : '') +
      '<div style="margin-top:7px;font-size:11px;color:var(--accent-d);font-weight:500"><i class="ti ti-pointer"></i> Click for the full explanation</div>';
    var r = b.getBoundingClientRect(), w = 330, h = tip.offsetHeight;
    tip.style.left = Math.min(window.innerWidth - w - 12, Math.max(12, r.left + r.width / 2 - w / 2)) + "px";
    tip.style.top = (r.bottom + 8 + h > window.innerHeight - 8 ? r.top - h - 8 : r.bottom + 8) + "px";
  }
  function hideTip() { var t = document.getElementById("pp-rec-tip"); if (t) t.remove(); }

  // ---------- post-payment ----------
  function renderPost(mount) {
    var st = window.APP.state.trqp || (window.APP.state.trqp = { scope: "all" });
    var me = window.APP.ROLES[window.APP.state.role].name;
    var all = P.LEADS.filter(function (l) { return l.mode !== "prepay"; });
    var open = all.filter(function (l) { return OPEN.indexOf(l.status) >= 0; });
    var openPaid = open.reduce(function (t, l) { return t + l.amount; }, 0);
    var submitted = Object.keys(window.APP.state.decisions).reduce(function (t, id) { var d = window.APP.state.decisions[id], l = P.lead(id); return t + (l && d.outcome === "confirm" && d.reviewState === "approved" ? l.amount : 0); }, 0);
    var seg = function (v, l) { return '<button class="qscope pq-seg' + (st.scope === v ? " active" : "") + '" data-scope="' + v + '">' + l + '</button>'; };
    var rows = all.slice();
    if (st.scope === "all") rows = rows.filter(function (l) { return OPEN.indexOf(l.status) >= 0; });
    if (st.scope === "my") rows = rows.filter(function (l) { return l.assignee === me; });
    if (st.scope === "unassigned") rows = rows.filter(function (l) { return !l.assignee; });
    rows.sort(function (a, b) { return b.riskScore - a.riskScore; });
    mount.innerHTML =
      '<div class="page">' +
      '<div class="page-head"><div><div class="page-title">Flagged payments</div><div class="page-sub">Payments already disbursed, flagged for post-payment review. Improper payments are reclaimed from the receiving bank and placed on a case.</div></div>' +
      '<div style="display:flex;gap:2px;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px">' + seg("all", "All open") + seg("my", "My payments") + seg("unassigned", "Unassigned") + seg("every", "Everything") + '</div></div>' +
      '<div class="kpis">' + kpi("Open", open.length) + kpi("Paid · under review", usd(openPaid)) + kpi("Approved for reclamation", usd(submitted)) + kpi("Networks detected", P.NETS.length, "across " + P.PLAN.states + " states") + '</div>' +
      '<div class="card" style="padding:0;overflow:hidden"><table><thead><tr><th>Risk</th><th>Payment</th><th>Payee · deposit account</th><th class="right">Paid</th><th>Status</th><th>Assignee</th></tr></thead><tbody>' +
      (rows.map(function (l) {
        return '<tr class="row" data-id="' + l.id + '" style="cursor:pointer"><td>' + window.UI.riskChip(l.riskScore) + '</td>' +
          '<td><div style="display:flex;gap:6px;align-items:center"><span class="mono" style="font-weight:500">' + l.id + '</span>' + progTag(l) + '</div><div style="margin-top:3px"><span class="tag fwa">' + esc(l.fwaType) + '</span></div></td>' +
          '<td><div style="font-weight:500">' + esc(l.payee) + '</div><div style="font-size:10.5px;color:var(--text2)">' + sub(l) + '</div></td>' +
          '<td class="right" style="font-weight:600">' + usd(l.amount) + '<div style="font-size:10px;color:var(--text3);font-weight:400">paid ' + (l.paidDate || "") + '</div></td>' +
          '<td>' + window.UI.statusPill(l.status) + '</td><td style="font-size:12px">' + (l.assignee ? esc(l.assignee) : '<span class="muted">Unassigned</span>') + '</td></tr>';
      }).join("") || '<tr><td colspan="6" class="muted" style="padding:16px;text-align:center">Nothing here.</td></tr>') +
      '</tbody></table></div></div>';
    mount.querySelectorAll(".pq-seg").forEach(function (b) { b.onclick = function () { st.scope = b.getAttribute("data-scope"); window.APP.nav("queue"); }; });
    mount.querySelectorAll("tr.row").forEach(function (tr) { tr.onclick = function () { window.APP.openAllegation(tr.getAttribute("data-id")); }; });
  }
})();
