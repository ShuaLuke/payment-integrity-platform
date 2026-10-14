/* Treasury pack · Home — what's on my plate today, for the analyst or the
   supervisor. Replaces Views.home. */
(function () {
  window.Views = window.Views || {};
  var T = window.TREAS;
  var esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var OPEN = ["New", "Assigned", "Under review", "Pending review", "Returned"];
  function kpis(list) { return '<div class="kpis">' + list.map(function (k) { return '<div class="kpi"><div class="l">' + k[0] + '</div><div class="v">' + k[1] + '</div>' + (k[2] ? '<div style="font-size:11px;color:var(--text2);margin-top:2px">' + k[2] + '</div>' : '') + '</div>'; }).join("") + '</div>'; }
  function row(l) {
    return '<div class="h-row" data-id="' + l.id + '" style="display:flex;gap:10px;align-items:center;padding:7px 0;border-top:0.5px solid var(--border2);cursor:pointer">' + window.UI.riskChip(l.riskScore) +
      '<div style="flex:1;min-width:0"><div style="font-size:12.5px;font-weight:500">' + l.id + ' · ' + esc(l.payee) + '</div><div style="font-size:11px;color:var(--text2)">' + esc(l.fwaType) + ' · ' + esc(l.prog.short) + ' · ' + l.agency + '</div></div>' +
      '<div style="font-size:12px;font-weight:600" class="mono">' + usd(l.amount) + '</div></div>';
  }
  // what agencies did with Treasury's recommendations: the visibility Treasury lacks today
  function agencies() {
    var S = T.agencyStats(), tot = S.total;
    var tile = function (l, v, sub, tone) { return '<div style="flex:1;min-width:130px;border-radius:8px;padding:8px 11px;background:' + (tone || "var(--surface)") + '"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--text3)">' + l + '</div><div style="font-weight:600;font-size:19px;margin-top:1px;font-variant-numeric:tabular-nums">' + v + '</div>' + (sub ? '<div style="font-size:10.5px;color:var(--text2)">' + sub + '</div>' : '') + '</div>'; };
    var rows = S.rows.map(function (r) {
      return '<tr><td><span class="tag mono" style="font-size:10px">' + r.agency + '</span> <span style="font-size:11.5px">' + esc(T.AGENCIES[r.agency].name) + '</span>' + (r.today ? ' <span class="pill" style="background:var(--accent-l);color:var(--accent-d);font-size:9.5px">+' + r.today + ' today</span>' : '') + '</td>' +
        '<td class="right mono">' + r.sent + '</td><td class="right mono" style="color:var(--high-tx);font-weight:600">' + r.acted + '</td><td class="right mono">' + r.released + '</td><td class="right mono" style="color:' + (r.pending ? "var(--med-tx)" : "var(--text3)") + '">' + r.pending + '</td>' +
        '<td class="right mono" style="font-weight:600">' + (r.usd ? T.bigUsd(r.usd) : "—") + '</td><td class="right mono">' + r.days.toFixed(1) + ' d</td></tr>';
    }).join("");
    return '<div class="card" id="h-agencies" style="margin-bottom:10px;padding:0;overflow:hidden">' +
      '<div style="padding:10px 14px;border-bottom:0.5px solid var(--border2);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div><div style="font-weight:600;font-size:13.5px"><i class="ti ti-send" style="color:var(--accent-d)"></i> Recommendations to agencies <span class="muted" style="font-weight:400;font-size:11px">· last 30 days</span></div><div style="font-size:11.5px;color:var(--text2)">Treasury recommends; the certifying agency decides. This is what came back.</div></div>' + T.laneTag("flag", T.SCHEMA.name.replace(/ \(.*$/, ""), true) + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;padding:10px 14px">' +
      tile("Sent", tot.sent, tot.today ? tot.today + " today" : "across 5 agencies") + tile("Acted on", tot.acted, "stopped or reclaimed", "var(--high-bg)") + tile("Released · no action", tot.released, "the agency verified the payee") + tile("Awaiting the agency", tot.pending, "or asked Treasury for more", tot.pending ? "var(--med-bg)" : null) +
      tile("Stopped or recovered", T.bigUsd(tot.usd), "on Treasury's recommendation", "var(--low-bg)") + tile("Median response", tot.days.toFixed(1) + " days", "from package to decision") + '</div>' + refsStrip() +
      '<table><thead><tr><th>Certifying agency</th><th class="right">Sent</th><th class="right">Acted on</th><th class="right">Released</th><th class="right">Pending</th><th class="right">Stopped / recovered</th><th class="right">Response</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  // network referrals: the ring sent to every agency in it, and what came back
  function refsStrip() {
    var refs = Object.keys(window.APP.state.netRefs || {}).map(function (k) { return window.APP.state.netRefs[k]; });
    if (!refs.length) return '<div style="padding:0 14px 10px;font-size:11.5px;color:var(--text2)"><i class="ti ti-affiliate" style="color:var(--accent-d)"></i> Network referrals: none sent yet. Refer a whole network from its network view, or every network from the map.</div>';
    var cases = refs.filter(function (r) { return r.decision && r.decision.c === "case"; }), held = cases.reduce(function (t, r) { return t + r.pending; }, 0), usdU = cases.reduce(function (t, r) { return t + r.atRisk; }, 0);
    return '<div style="margin:0 14px 10px;padding:8px 11px;border-radius:8px;background:var(--accent-l);display:flex;gap:14px;flex-wrap:wrap;align-items:center;font-size:12px"><b><i class="ti ti-affiliate" style="color:var(--accent-d)"></i> Network referrals</b>' +
      '<span>' + refs.length + ' sent to ' + refs.map(function (r) { return r.agency; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(", ") + '</span>' +
      (cases.length ? '<span><b style="color:var(--high-tx)">' + cases.length + ' case' + (cases.length > 1 ? 's' : '') + ' opened</b> · ' + held + ' pending payment' + (held !== 1 ? 's' : '') + ' held · ' + T.bigUsd(usdU) + ' under review</span>' : '<span style="color:var(--text2)">awaiting the agencies</span>') +
      refs.filter(function (r) { return r.decision && r.decision.c !== "case"; }).map(function (r) { return '<span style="color:var(--text2)">' + r.agency + ': ' + esc(T.netDecision(r.decision.c).t.toLowerCase()) + '</span>'; }).join("") + '</div>';
  }

  window.Views.home = {
    render: function (mount) {
      var r = window.APP.ROLES[window.APP.state.role], I = T.INTAKE, sup = window.APP.isSupervisor();
      var held = T.LEADS.filter(function (l) { return l.mode === "prepay" && l.recommendedAction !== "pay" && !window.APP.prepayDecisionFor(l.id); }).sort(function (a, b) { return b.riskScore - a.riskScore; });
      var mine = T.LEADS.filter(function (l) { return l.mode !== "prepay" && l.assignee === r.name && OPEN.indexOf(l.status) >= 0; });
      var next = held[0];
      var pend = window.APP.pendingReviews().filter(function (p) { return p.a && p.a.uc === "treas"; });
      var nets = T.NETS.slice().sort(function (a, b) { return b.atRisk - a.atRisk; }).slice(0, 4);
      var fast = (I.fastLane * 100).toFixed(2) + "%";
      mount.innerHTML = '<div class="page">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div class="avatar" style="width:34px;height:34px">' + r.initials + '</div>' +
        '<div><div class="page-title" style="font-size:18px">Welcome back, ' + esc(r.name) + '</div><div class="page-sub">' + r.title + ' workspace · Treasury payments · tax refunds, benefits, annuities and vendor payments, verified before they go out · ' + T.PLAN.fys + '</div></div></div>' +
        (sup ? kpis([["Awaiting my approval", pend.length], ["Payments held today", I.held.toLocaleString(), "pending verification"], ["Networks under review", T.NETS.filter(function (n) { return n.status !== "New"; }).length, "of " + T.NETS.length + " detected"], ["Straight to payment", fast, "passed every check"]])
          : kpis([["Awaiting a payment decision", held.length, "flagged before disbursement"], ["My open payments", mine.length, "post-payment review"], ["Straight to payment", fast, "passed every check"], ["Verified this morning", (I.payments / 1e6).toFixed(2) + "M", "$" + (I.amount / 1e9).toFixed(1) + "B certified by agencies"]])) +
        agencies() +
        (!sup && next ? '<div class="card" style="margin-bottom:10px;border:0.5px solid #f3c9c9;background:linear-gradient(90deg,var(--high-bg),var(--card) 40%)"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--high-tx)"><i class="ti ti-player-play"></i> Next up · before it pays</div>' +
          '<div style="font-weight:600;font-size:14px;margin-top:3px">' + next.id + ' · ' + esc(next.payee) + ' · ' + usd(next.amount) + '</div><div style="font-size:12px;color:var(--text2);margin-top:2px">' + esc(next.reason) + '</div></div>' +
          '<button class="btn primary" id="h-next"><i class="ti ti-arrow-right"></i> Review</button></div></div>' : '') +
        (sup && pend.length ? '<div class="card" style="margin-bottom:10px"><div style="font-weight:500;font-size:13px;margin-bottom:4px"><i class="ti ti-inbox" style="color:var(--med)"></i> Awaiting my approval</div>' + pend.map(function (p) { return row(p.a); }).join("") + '</div>' : '') +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<div class="card" style="flex:1.3;min-width:320px;margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:2px">' + (sup ? "Held before payment" : "Pre-payment · awaiting my decision") + '</div>' + held.map(row).join("") + '</div>' +
        '<div class="card" style="flex:1;min-width:280px;margin:0"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-weight:500;font-size:13px">Largest networks</div><button class="btn" id="h-nets" style="font-size:11px;padding:3px 9px">All networks</button></div>' +
        nets.map(function (n) { return '<div class="h-net" data-id="' + n.id + '" style="display:flex;gap:8px;align-items:center;padding:7px 0;border-top:0.5px solid var(--border2);cursor:pointer"><span style="width:9px;height:9px;border-radius:50%;background:' + T.SCHEMES[n.scheme].color + '"></span><div style="flex:1;font-size:12.5px"><div style="font-weight:500">' + esc(n.name) + '</div><div style="font-size:10.5px;color:var(--text3)">' + n.states.join(" · ") + ' · ' + n.agencies.join(" · ") + '</div></div><span class="mono" style="font-size:12px;font-weight:600">' + T.bigUsd(n.atRisk) + '</span></div>'; }).join("") + '</div>' +
        '</div>' +
        (mine.length ? '<div class="card" style="margin-top:10px"><div style="font-weight:500;font-size:13px;margin-bottom:2px">My payments · post-payment</div>' + mine.map(row).join("") + '</div>' : '') +
        '</div>';
      mount.querySelectorAll(".h-row").forEach(function (el) { el.onclick = function () { var id = el.getAttribute("data-id"), l = T.lead(id); if (l && l.mode === "prepay" && !window.APP.isPrepay()) window.APP.state.mode = "prepay", window.APP.setModeHeader(); window.APP.openAllegation(id); }; });
      mount.querySelectorAll(".h-net").forEach(function (el) { el.onclick = function () { window.APP.state.networkScenario = el.getAttribute("data-id"); window.APP.nav("network"); }; });
      var hn = document.getElementById("h-next"); if (hn) hn.onclick = function () { window.APP.openAllegation(next.id); };
      var nb = document.getElementById("h-nets"); if (nb) nb.onclick = function () { window.APP.nav("network"); };
    }
  };
})();
