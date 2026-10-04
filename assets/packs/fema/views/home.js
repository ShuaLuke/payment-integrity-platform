/* Disaster-relief pack · Home — what's on my plate today, for the analyst or the
   supervisor, in the active declaration. Replaces Views.home. */
(function () {
  window.Views = window.Views || {};
  var F = window.FEMA;
  var esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var OPEN = ["New", "Assigned", "Under review", "Pending review", "Returned"];
  function kpis(list) { return '<div class="kpis">' + list.map(function (k) { return '<div class="kpi"><div class="l">' + k[0] + '</div><div class="v">' + k[1] + '</div>' + (k[2] ? '<div style="font-size:11px;color:var(--text2);margin-top:2px">' + k[2] + '</div>' : '') + '</div>'; }).join("") + '</div>'; }
  function row(l, right) {
    return '<div class="h-row" data-id="' + l.id + '" style="display:flex;gap:10px;align-items:center;padding:7px 0;border-top:0.5px solid var(--border2);cursor:pointer">' + window.UI.riskChip(l.riskScore) +
      '<div style="flex:1;min-width:0"><div style="font-size:12.5px;font-weight:500">' + l.id + ' · ' + esc(l.registrant) + '</div><div style="font-size:11px;color:var(--text2)">' + esc(l.fwaType) + ' · ' + esc(l.reason) + '</div></div>' +
      '<div style="font-size:12px;font-weight:600" class="mono">' + usd(l.amount) + '</div>' + (right || "") + '</div>';
  }
  window.Views.home = {
    render: function (mount) {
      var r = window.APP.ROLES[window.APP.state.role], D = F.PRIMARY, I = F.INTAKE, sup = window.APP.isSupervisor();
      var held = F.LEADS.filter(function (l) { return l.mode === "prepay" && l.recommendedAction !== "pay" && !window.APP.prepayDecisionFor(l.id); }).sort(function (a, b) { return b.riskScore - a.riskScore; });
      var mine = F.LEADS.filter(function (l) { return l.mode !== "prepay" && l.assignee === r.name && OPEN.indexOf(l.status) >= 0; });
      var next = held[0];
      var pend = window.APP.pendingReviews().filter(function (p) { return p.a && p.a.uc === "fema"; });
      var nets = F.NETS.slice().sort(function (a, b) { return b.atRisk - a.atRisk; }).slice(0, 4);
      mount.innerHTML = '<div class="page">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px"><div class="avatar" style="width:34px;height:34px">' + r.initials + '</div>' +
        '<div><div class="page-title" style="font-size:18px">Welcome back, ' + esc(r.name) + '</div><div class="page-sub">' + r.title + ' workspace · ' + esc(D.name) + ' · <span class="mono">' + D.id + '</span> · registration open until ' + D.deadline + '</div></div></div>' +
        (sup ? kpis([["Awaiting my approval", pend.length], ["Registrations held today", I.held.toLocaleString(), "pending verification"], ["Networks under review", F.NETS.filter(function (n) { return n.status !== "New"; }).length, "of " + F.NETS.length + " detected"], ["Straight to payment", Math.round(I.sameDay * 100) + "%", "passed every check"]])
          : kpis([["Awaiting a payment decision", held.length, "flagged before payment"], ["My open registrations", mine.length, "post-payment review"], ["Straight to payment", Math.round(I.sameDay * 100) + "%", "passed every check"], ["IHP approved · " + D.id, "$" + (I.approved / 1e6).toFixed(1) + "M", I.registrations.toLocaleString() + " registrations"]])) +
        (!sup && next ? '<div class="card" style="margin-bottom:10px;border:0.5px solid #f3c9c9;background:linear-gradient(90deg,var(--high-bg),var(--card) 40%)"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--high-tx)"><i class="ti ti-player-play"></i> Next up · before it pays</div>' +
          '<div style="font-weight:600;font-size:14px;margin-top:3px">' + next.id + ' · ' + esc(next.registrant) + ' · ' + usd(next.amount) + '</div><div style="font-size:12px;color:var(--text2);margin-top:2px">' + esc(next.reason) + '</div></div>' +
          '<button class="btn primary" id="h-next"><i class="ti ti-arrow-right"></i> Review</button></div></div>' : '') +
        (sup && pend.length ? '<div class="card" style="margin-bottom:10px"><div style="font-weight:500;font-size:13px;margin-bottom:4px"><i class="ti ti-inbox" style="color:var(--med)"></i> Awaiting my approval</div>' + pend.map(function (p) { return row(p.a); }).join("") + '</div>' : '') +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        '<div class="card" style="flex:1.3;min-width:320px;margin:0"><div style="font-weight:500;font-size:13px;margin-bottom:2px">' + (sup ? "Held before payment" : "Pre-payment · awaiting my decision") + '</div>' + held.map(function (l) { return row(l); }).join("") + '</div>' +
        '<div class="card" style="flex:1;min-width:280px;margin:0"><div style="display:flex;justify-content:space-between;align-items:center"><div style="font-weight:500;font-size:13px">Largest networks</div><button class="btn" id="h-nets" style="font-size:11px;padding:3px 9px">All networks</button></div>' +
        nets.map(function (n) { return '<div class="h-net" data-id="' + n.id + '" style="display:flex;gap:8px;align-items:center;padding:7px 0;border-top:0.5px solid var(--border2);cursor:pointer"><span style="width:9px;height:9px;border-radius:50%;background:' + F.SCHEMES[n.scheme].color + '"></span><div style="flex:1;font-size:12.5px"><div style="font-weight:500">' + esc(n.name) + '</div><div style="font-size:10.5px;color:var(--text3)">' + n.drs.join(" · ") + '</div></div><span class="mono" style="font-size:12px;font-weight:600">' + F.bigUsd(n.atRisk) + '</span></div>'; }).join("") + '</div>' +
        '</div>' +
        (mine.length ? '<div class="card" style="margin-top:10px"><div style="font-weight:500;font-size:13px;margin-bottom:2px">My registrations · post-payment</div>' + mine.map(function (l) { return row(l); }).join("") + '</div>' : '') +
        '</div>';
      mount.querySelectorAll(".h-row").forEach(function (el) { el.onclick = function () { var id = el.getAttribute("data-id"), l = F.lead(id); if (l && l.mode === "prepay" && !window.APP.isPrepay()) window.APP.state.mode = "prepay", window.APP.setModeHeader(); window.APP.openAllegation(id); }; });
      mount.querySelectorAll(".h-net").forEach(function (el) { el.onclick = function () { window.APP.state.networkScenario = el.getAttribute("data-id"); window.APP.nav("network"); }; });
      var hn = document.getElementById("h-next"); if (hn) hn.onclick = function () { window.APP.openAllegation(next.id); };
      var nb = document.getElementById("h-nets"); if (nb) nb.onclick = function () { window.APP.nav("network"); };
    }
  };
})();
