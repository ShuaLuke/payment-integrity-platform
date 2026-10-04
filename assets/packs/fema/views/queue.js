/* Disaster-relief pack · Casework › Registrations.
   Pre-payment: every IHP award is scored before it pays; the analyst decides
   Pay · Hold · Deny, while verified survivors go straight through the fast lane.
   Post-payment: flagged registrations that already paid, for review and recovery.
   Replaces Views.queue. */
(function () {
  window.Views = window.Views || {};
  var F = window.FEMA, esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var OPEN = ["New", "Assigned", "Under review", "Returned", "Pending review"];

  function kpi(label, val, sub) {
    return '<div class="kpi"><div class="l">' + label + '</div><div class="v">' + val + '</div>' + (sub ? '<div style="font-size:11px;color:var(--text2);margin-top:2px">' + sub + '</div>' : '') + '</div>';
  }
  function awardTags(l) {
    return l.award.map(function (a) { return '<span class="tag" title="' + esc(a.label) + ' · ' + usd(a.amount) + '" style="font-size:10px">' + a.code + '</span>'; }).join(" ");
  }
  function declTag(l) { return '<span class="mono" style="font-size:10px;color:var(--text3)">' + l.dr + '</span>'; }

  window.Views.queue = {
    render: function (mount) {
      if (window.APP.isPrepay()) return renderPrepay(mount);
      return renderPost(mount);
    }
  };

  // ---------- pre-payment ----------
  function prepayRows() { return F.LEADS.filter(function (l) { return l.mode === "prepay"; }); }
  function stats() {
    var rows = prepayRows(), dec = window.APP.state.prepayDecisions, s = { total: rows.length, pending: 0, atRisk: 0, held: 0, released: 0 };
    rows.forEach(function (l) {
      var d = dec[l.id];
      if (!d) { s.pending++; if (l.recommendedAction !== "pay") s.atRisk += l.amount; }
      else if (d.action === "pay") s.released += l.amount; else s.held += l.amount;
    });
    return s;
  }
  function renderPrepay(mount) {
    var st = window.APP.state.femapp || (window.APP.state.femapp = { rec: "" });
    var S = stats(), I = F.INTAKE, D = F.PRIMARY;
    var seg = function (v, l) { return '<button class="qscope ppseg' + (st.rec === v ? " active" : "") + '" data-rec="' + v + '">' + l + '</button>'; };
    mount.innerHTML =
      '<div class="page">' +
      '<div class="page-head"><div><div class="page-title">Pre-payment review</div><div class="page-sub">' + esc(D.name) + ' · <span class="mono">' + D.id + '</span> · every award is scored <b>before</b> it pays. Decide Pay · Hold · Deny; verified survivors go straight through.</div></div>' +
      '<div style="display:flex;gap:10px;align-items:center"><div style="display:flex;gap:2px;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px">' + seg("", "All") + seg("deny", "Deny") + seg("hold", "Hold") + seg("pay", "Pay") + '</div>' + window.EXPORT.group("fpp") + '</div></div>' +
      '<div class="kpis">' +
      kpi("Awaiting a decision", S.pending + " / " + S.total, "flagged or sampled for review") +
      kpi("Amount at risk", usd(S.atRisk), "recommended Hold or Deny") +
      kpi("Payments held or prevented", '<span id="fpp-held" style="color:var(--low-tx)">' + usd(S.held) + '</span>', "not released pending verification") +
      kpi("Paid today · fast lane", '1,842 <span style="font-size:13px;color:var(--text2);font-weight:500">· $14.1M</span>', Math.round(I.sameDay * 100) + "% pass every check · no added wait") +
      '</div>' +
      '<div class="card" style="padding:0;overflow:hidden"><table><thead><tr><th>Risk</th><th>Registration</th><th>Registrant · damaged dwelling</th><th class="right">Award</th><th>Model recommends</th><th style="width:206px">Decision</th></tr></thead><tbody id="fpp-body"></tbody></table></div>' +
      '<div style="margin-top:10px;font-size:12px;color:var(--text2)"><i class="ti ti-shield-check" style="color:var(--accent-d)"></i> Holding here keeps the money in place until occupancy or identity is verified; nothing is taken away from a genuine survivor. Verified registrations flow straight through.</div>' +
      '</div>';
    draw();
    mount.querySelectorAll(".ppseg").forEach(function (b) { b.onclick = function () { st.rec = b.getAttribute("data-rec"); window.APP.nav("queue"); }; });
    var head = ["Registration", "Declaration", "Registrant", "Damaged dwelling", "Risk", "Pattern", "Award", "Model recommends", "Decision"];
    var rows = function () { return prepayRows().map(function (l) { var d = window.APP.prepayDecisionFor(l.id); return [l.id, l.dr, l.registrant, l.addr, l.riskScore, l.fwaType, l.amount, l.recommendedAction.toUpperCase(), d ? decidedLabel(d.action) : "Pending"]; }); };
    window.EXPORT.wire("fpp", {
      csv: function () { window.EXPORT.csv("pre-payment-review", head, rows()); },
      xls: function () { window.EXPORT.xls("pre-payment-review", "Pre-payment", head, rows()); },
      pdf: function () { window.EXPORT.pdf("Pre-payment review — " + D.id, window.EXPORT.tableHtml(head, rows())); }
    });
  }
  function draw() {
    var st = window.APP.state.femapp, rows = prepayRows();
    if (st.rec) rows = rows.filter(function (l) { return l.recommendedAction === st.rec; });
    rows.sort(function (a, b) { return b.riskScore - a.riskScore; });
    var body = document.getElementById("fpp-body");
    body.innerHTML = rows.map(function (l) {
      var dec = window.APP.prepayDecisionFor(l.id);
      return '<tr class="pprow" data-id="' + l.id + '" style="cursor:pointer">' +
        '<td>' + window.UI.riskChip(l.riskScore) + '</td>' +
        '<td><div style="display:flex;gap:6px;align-items:center"><span class="mono" style="font-weight:500">' + l.id + '</span>' + declTag(l) + '</div>' +
        '<div style="margin-top:3px;display:flex;gap:4px;flex-wrap:wrap;align-items:center"><span class="tag fwa">' + esc(l.fwaType) + '</span>' + awardTags(l) + '</div></td>' +
        '<td><div style="font-weight:500">' + esc(l.registrant) + ' <span style="font-weight:400;font-size:10.5px;color:var(--text3)">· ' + l.occupancy.toLowerCase() + '</span></div><div style="font-size:10.5px;color:var(--text2)">' + esc(l.addr) + '</div></td>' +
        '<td class="right" style="font-weight:600">' + usd(l.amount) + '</td>' +
        '<td>' + recPill(l) + '</td>' +
        '<td>' + (dec ? decidedPill(dec.action) : btns(l.id)) + '</td></tr>';
    }).join("") || '<tr><td colspan="6" class="muted" style="padding:16px;text-align:center">No registrations match this filter.</td></tr>';
    body.querySelectorAll(".ppbtn").forEach(function (b) {
      b.onclick = function (e) { e.stopPropagation(); window.APP.prepayDecide(b.getAttribute("data-id"), b.getAttribute("data-act")); window.APP.nav("queue"); };
    });
    body.querySelectorAll(".pp-rec").forEach(function (b) {
      b.onmouseenter = function () { showTip(b); };
      b.onmouseleave = hideTip;
      b.onclick = function (e) { e.stopPropagation(); hideTip(); if (window.COPILOT && window.COPILOT.explain) window.COPILOT.explain(b.getAttribute("data-id")); };
    });
    body.querySelectorAll(".pprow").forEach(function (tr) { tr.onclick = function () { window.APP.openAllegation(tr.getAttribute("data-id")); }; });
  }
  function btns(id) { return '<div style="display:flex;gap:4px">' + btn(id, "pay", "Pay", "check", "var(--low)") + btn(id, "hold", "Hold", "clock-hour-4", "var(--med)") + btn(id, "deny", "Deny", "ban", "var(--high)") + '</div>'; }
  function btn(id, act, label, icon, color) { return '<button class="ppbtn" data-id="' + id + '" data-act="' + act + '" style="border:0.5px solid ' + color + ';color:' + color + ';background:#fff;border-radius:6px;padding:3px 8px;font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:3px;font-family:var(--sans)"><i class="ti ti-' + icon + '"></i>' + label + '</button>'; }
  function recPill(l) {
    var m = { pay: ["Pay", "var(--low-tx)"], hold: ["Hold", "var(--med-tx)"], deny: ["Deny", "var(--high-tx)"] }[l.recommendedAction];
    return '<button class="pp-rec" data-id="' + l.id + '" style="border:0.5px dashed transparent;background:none;border-radius:6px;padding:2px 6px;margin-left:-6px;cursor:pointer;font-size:11.5px;font-weight:500;font-family:var(--sans);color:' + m[1] + ';display:inline-flex;align-items:center;gap:4px" onmouseover="this.style.borderColor=\'currentColor\'" onmouseout="this.style.borderColor=\'transparent\'"><i class="ti ti-sparkles"></i> ' + m[0] + ' <i class="ti ti-info-circle" style="font-size:12px;opacity:.7"></i></button>';
  }
  function decidedLabel(a) { return { pay: "Approved to pay", hold: "Held — verify", deny: "Denied" }[a]; }
  function decidedPill(action) {
    var m = { pay: ["var(--low-tx)", "var(--low-bg)", "check"], hold: ["var(--med-tx)", "var(--med-bg)", "clock-hour-4"], deny: ["var(--high-tx)", "var(--high-bg)", "ban"] }[action];
    return '<span class="pill" style="background:' + m[1] + ';color:' + m[0] + '"><i class="ti ti-' + m[2] + '"></i> ' + decidedLabel(action) + '</span>';
  }
  // hover card: why the model recommends this action
  function showTip(b) {
    var l = F.lead(b.getAttribute("data-id")); if (!l) return;
    var tip = document.getElementById("pp-rec-tip");
    if (!tip) { tip = document.createElement("div"); tip.id = "pp-rec-tip"; document.body.appendChild(tip); }
    var label = { pay: "Pay", hold: "Hold", deny: "Deny" }[l.recommendedAction], tone = { pay: "var(--low-tx)", hold: "var(--med-tx)", deny: "var(--high-tx)" }[l.recommendedAction];
    var top3 = (l.signals || []).slice(0, 3).map(function (s) { return '<div style="display:flex;gap:6px;margin-top:3px"><span style="width:6px;height:6px;border-radius:50%;flex:none;margin-top:6px;background:' + (s.sev === "high" ? "var(--high)" : s.sev === "med" ? "var(--med)" : "var(--low)") + '"></span><span>' + esc(s.label) + '</span></div>'; }).join("");
    tip.style.cssText = "position:fixed;z-index:300;width:330px;background:var(--card);border:0.5px solid var(--border);border-radius:10px;box-shadow:0 8px 28px rgba(0,0,0,.16);padding:11px 13px;font-size:12px;line-height:1.45;pointer-events:none";
    tip.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px"><span style="font-weight:600;color:' + tone + '"><i class="ti ti-sparkles"></i> Why ' + label + '</span><span style="font-size:10.5px;color:var(--text2)">risk <b>' + l.riskScore + '</b> · confidence <b>' + Math.round(l.confidence * 100) + '%</b></span></div>' +
      '<div>' + esc(l.reason) + '.</div>' + (top3 ? '<div style="margin-top:7px;padding-top:6px;border-top:0.5px solid var(--border2);font-size:11px;color:var(--text2)">' + top3 + '</div>' : '') +
      '<div style="margin-top:7px;font-size:11px;color:var(--accent-d);font-weight:500"><i class="ti ti-pointer"></i> Click for the full explanation</div>';
    var r = b.getBoundingClientRect(), w = 330, h = tip.offsetHeight;
    tip.style.left = Math.min(window.innerWidth - w - 12, Math.max(12, r.left + r.width / 2 - w / 2)) + "px";
    tip.style.top = (r.bottom + 8 + h > window.innerHeight - 8 ? r.top - h - 8 : r.bottom + 8) + "px";
  }
  function hideTip() { var t = document.getElementById("pp-rec-tip"); if (t) t.remove(); }

  // ---------- post-payment ----------
  function renderPost(mount) {
    var st = window.APP.state.femaq || (window.APP.state.femaq = { scope: "all" });
    var me = window.APP.ROLES[window.APP.state.role].name;
    var all = F.LEADS.filter(function (l) { return l.mode !== "prepay"; });
    var open = all.filter(function (l) { return OPEN.indexOf(l.status) >= 0; });
    var openPaid = open.reduce(function (t, l) { return t + l.amount; }, 0);
    var submitted = Object.keys(window.APP.state.decisions).reduce(function (t, id) { var d = window.APP.state.decisions[id], l = F.lead(id); return t + (l && d.outcome === "confirm" && d.reviewState === "approved" ? l.amount : 0); }, 0);
    var seg = function (v, l) { return '<button class="qscope fq-seg' + (st.scope === v ? " active" : "") + '" data-scope="' + v + '">' + l + '</button>'; };
    var rows = all.slice();
    if (st.scope === "all") rows = rows.filter(function (l) { return OPEN.indexOf(l.status) >= 0; });
    if (st.scope === "my") rows = rows.filter(function (l) { return l.assignee === me; });
    if (st.scope === "unassigned") rows = rows.filter(function (l) { return !l.assignee; });
    rows.sort(function (a, b) { return b.riskScore - a.riskScore; });
    mount.innerHTML =
      '<div class="page">' +
      '<div class="page-head"><div><div class="page-title">Flagged registrations</div><div class="page-sub">Awards already paid, flagged for post-payment review. Confirmed ones are recovered and placed on a case.</div></div>' +
      '<div style="display:flex;gap:2px;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px">' + seg("all", "All open") + seg("my", "My registrations") + seg("unassigned", "Unassigned") + seg("every", "Everything") + '</div></div>' +
      '<div class="kpis">' + kpi("Open", open.length) + kpi("Paid · under review", usd(openPaid)) + kpi("Approved for recovery", usd(submitted)) + kpi("Networks detected", F.NETS.length, "across " + F.PLAN.declarations + " declarations") + '</div>' +
      '<div class="card" style="padding:0;overflow:hidden"><table><thead><tr><th>Risk</th><th>Registration</th><th>Registrant · damaged dwelling</th><th class="right">Paid</th><th>Status</th><th>Assignee</th></tr></thead><tbody>' +
      (rows.map(function (l) {
        return '<tr class="row" data-id="' + l.id + '" style="cursor:pointer"><td>' + window.UI.riskChip(l.riskScore) + '</td>' +
          '<td><div style="display:flex;gap:6px;align-items:center"><span class="mono" style="font-weight:500">' + l.id + '</span>' + declTag(l) + '</div><div style="margin-top:3px"><span class="tag fwa">' + esc(l.fwaType) + '</span></div></td>' +
          '<td><div style="font-weight:500">' + esc(l.registrant) + '</div><div style="font-size:10.5px;color:var(--text2)">' + esc(l.addr) + '</div></td>' +
          '<td class="right" style="font-weight:600">' + usd(l.amount) + '<div style="font-size:10px;color:var(--text3);font-weight:400">paid ' + (l.paidDate || "") + '</div></td>' +
          '<td>' + window.UI.statusPill(l.status) + '</td><td style="font-size:12px">' + (l.assignee ? esc(l.assignee) : '<span class="muted">Unassigned</span>') + '</td></tr>';
      }).join("") || '<tr><td colspan="6" class="muted" style="padding:16px;text-align:center">Nothing here.</td></tr>') +
      '</tbody></table></div></div>';
    mount.querySelectorAll(".fq-seg").forEach(function (b) { b.onclick = function () { st.scope = b.getAttribute("data-scope"); window.APP.nav("queue"); }; });
    mount.querySelectorAll("tr.row").forEach(function (tr) { tr.onclick = function () { window.APP.openAllegation(tr.getAttribute("data-id")); }; });
  }
})();
