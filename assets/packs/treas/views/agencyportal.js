/* Treasury pack · the agency's own system (simulated) — a separate instance that
   receives Treasury's recommendation packages in the shared schema. A reviewer at
   the certifying agency (IRS by default) signs in, opens the new package, and
   decides: stop, release or ask for more. The decision goes back to Treasury.
   Deliberately its own chrome and clearly labeled as simulated: no agency seal,
   no copy of any agency's site. Reached by APP.openAgencyPortal(agency, id) or the
   logo. */
(function () {
  window.Views = window.Views || {};
  var T = window.TREAS;
  var esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var TONE = { high: ["var(--high-tx)", "var(--high-bg)"], med: ["var(--med-tx)", "var(--med-bg)"], low: ["var(--low-tx)", "var(--low-bg)"] };
  var pick = {}; // the reviewer's unsent choice, per payment
  // older, already-decided items so the inbox isn't empty before the first package
  var PAST = {
    IRS: [["PKG-70948-01", "PV-70948", "Stolen-identity refund", 16420, "Stopped", "Oct 9"], ["PKG-70912-01", "PV-70912", "Stolen-identity refund", 17950, "Stopped", "Oct 8"], ["PKG-70655-01", "PV-70655", "New account · verified", 2310, "Released", "Oct 6"]],
    SSA: [["PKG-70533-01", "PV-70533", "Benefit redirection", 1880, "Reclamation requested", "Oct 7"]]
  };

  window.Views.agencyportal = {
    render: function (mount, params) {
      var agency = params.agency || "IRS", ag = T.AGENCIES[agency], u = T.AGENCY_USERS[agency];
      var signedIn = !!window.APP.state.agencyAuth[agency];
      var id = params.id && T.handoff(params.id) && T.handoff(params.id).agency === agency ? params.id : null;
      mount.innerHTML =
        '<div style="min-height:calc(100vh - 120px);background:linear-gradient(180deg,#123b36 0 150px,var(--surface) 150px)">' +
        '<div style="max-width:980px;margin:0 auto;padding:20px 24px 40px">' +
        '<div style="display:flex;align-items:center;gap:12px;color:#fff;padding:6px 0 20px">' +
        '<div style="width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center"><i class="ti ti-building" style="font-size:20px;color:#9ef0d8"></i></div>' +
        '<div><div style="font-weight:600;font-size:15px;letter-spacing:-0.01em">' + esc(ag.name) + ' · Payment integrity workspace</div>' +
        '<div style="font-size:11.5px;color:#c6d8d4">The agency\'s own system · a separate instance · receives Treasury packages in the shared schema</div></div>' +
        '<span style="flex:1"></span>' +
        '<span class="pill" style="background:rgba(255,255,255,0.14);color:#e2f2ee"><i class="ti ti-flask"></i> Simulated agency system</span></div>' +
        (signedIn ? workspace(agency, u, id) : login(agency, ag, u)) +
        '</div></div>';
      wire(mount, agency, id);
    }
  };

  function rerender(agency, id) { window.Views.agencyportal.render(document.getElementById("view"), { agency: agency, id: id }); }

  function login(agency, ag, u) {
    return '<div class="card" style="max-width:420px;margin:30px auto 0;padding:22px 24px">' +
      '<div style="font-weight:600;font-size:15px">Sign in</div><div class="muted" style="font-size:11.5px;margin-top:2px">' + esc(ag.name) + ' (simulated)</div>' +
      '<div style="font-size:11px;color:var(--text2);margin:16px 0 3px">User</div><input class="input" id="ap-user" value="' + esc(u.login) + '" readonly>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-top:12px;padding:8px 10px;border-radius:8px;background:var(--low-bg);font-size:11.5px;color:var(--low-tx)"><i class="ti ti-id-badge-2" style="font-size:17px"></i> PIV card detected</div>' +
      '<button class="btn primary" id="ap-login" style="width:100%;justify-content:center;margin-top:14px"><i class="ti ti-login"></i> Sign in as ' + esc(u.name) + '</button>' +
      '<div style="font-size:10.5px;color:var(--text3);margin-top:10px;text-align:center">Demo sign-in. No credentials are checked or stored.</div>' +
      (window.APP.state.sysWindow ? '' : '<div style="text-align:center;margin-top:12px"><span class="btn" id="ap-exit" style="font-size:11.5px"><i class="ti ti-arrow-left"></i> Back to Treasury</span></div>') + '</div>';
  }

  function workspace(agency, u, id) {
    var items = T.handoffsFor(agency);
    var fresh = items.filter(function (h) { return !h.decision; }).length;
    return '<div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:12px">' +
      '<div class="avatar" style="width:34px;height:34px;flex:none;background:#1a6b5f">' + u.initials + '</div>' +
      '<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13.5px">' + esc(u.name) + '</div><div style="font-size:11px;color:var(--text2)">' + esc(u.title) + ' · ' + agency + '</div></div>' +
      (fresh ? '<span class="pill" style="background:var(--high-bg);color:var(--high-tx)"><i class="ti ti-bell"></i> ' + fresh + ' new from Treasury</span>' : '') +
      (window.APP.state.sysWindow ? '' : '<span class="btn" id="ap-exit" style="font-size:11.5px"><i class="ti ti-arrow-left"></i> Return to Treasury</span>') + '</div>' +
      (id ? detail(agency, T.handoff(id)) : inbox(agency, items));
  }

  function inbox(agency, items) {
    var rows = items.map(function (h) {
      var l = T.lead(h.id), dd = h.decision ? T.agencyDecision(l, h.decision.c) : null;
      return '<tr class="ap-row" data-id="' + h.id + '" style="cursor:pointer' + (dd ? "" : ";background:#f2fbf8") + '"><td>' + (dd ? '' : '<span class="pill" style="background:#1a6b5f;color:#fff;font-size:9.5px">New from Treasury</span> ') + '<span class="mono">' + h.pkg + '</span></td>' +
        '<td class="mono">' + h.id + '</td><td>' + esc(l.payee) + '<div style="font-size:10.5px;color:var(--text2)">' + esc(l.fwaType) + '</div></td><td class="right mono">' + usd(l.amount) + '</td>' +
        '<td style="font-size:11.5px">' + esc(T.recLabel(l, h.rec)) + '</td><td style="font-size:11.5px">' + (dd ? '<b style="color:' + TONE[dd.tone][0] + '">' + esc(dd.status.replace(/ by $/, "")) + '</b>' : 'Awaiting decision') + '</td></tr>';
    }).join("");
    var past = (PAST[agency] || []).map(function (p) {
      return '<tr style="color:var(--text2)"><td class="mono">' + p[0] + '</td><td class="mono">' + p[1] + '</td><td>' + esc(p[2]) + '</td><td class="right mono">' + usd(p[3]) + '</td><td style="font-size:11.5px">—</td><td style="font-size:11.5px">' + p[4] + ' · ' + p[5] + '</td></tr>';
    }).join("");
    return '<div class="card" style="padding:0;overflow:hidden"><div style="padding:10px 12px;border-bottom:0.5px solid var(--border2);display:flex;justify-content:space-between;align-items:center"><div style="font-weight:600;font-size:13px"><i class="ti ti-inbox" style="color:#1a6b5f"></i> Recommendations from Treasury</div><span style="font-size:10.5px;color:var(--text3)">' + esc(T.SCHEMA.name) + '</span></div>' +
      '<table><thead><tr><th>Package</th><th>Payment</th><th>Payee</th><th class="right">Amount</th><th>Treasury recommends</th><th>Status</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6" class="muted" style="padding:14px;text-align:center">No new packages from Treasury.</td></tr>') + past + '</tbody></table></div>';
  }

  function detail(agency, h) {
    var l = T.get(h.id), stage = l.mode === "prepay" ? "prepay" : "post";
    var p = pick[h.id] || (pick[h.id] = { c: stage === "prepay" ? (h.rec === "release" ? "release" : "stop") : (h.rec === "none" ? "none" : "reclaim") });
    var ev = h.payload.evidence.map(function (e) { return '<div style="display:flex;gap:9px;padding:6px 0;border-top:0.5px solid var(--border2);font-size:12px"><i class="ti ti-point-filled" style="color:var(--high)"></i><span style="flex:1">' + esc(e.finding) + '</span><span class="tag" style="font-size:9.5px">' + esc(e.source) + '</span></div>'; }).join("");
    var tl = T.tlFor(h.id).filter(function (f) { return f.st !== "pass"; });
    var dec = h.decision ? T.agencyDecision(l, h.decision.c) : null;
    var decide = dec ? '<div class="card" style="margin:0;border-color:' + TONE[dec.tone][0] + '"><div style="display:flex;gap:10px;align-items:center"><i class="ti ti-circle-check" style="font-size:24px;color:var(--low)"></i><div><div style="font-weight:600;font-size:13.5px">Decision sent to Treasury: ' + esc(dec.t) + '</div><div style="font-size:11.5px;color:var(--text2);margin-top:2px">' + esc(T.agencyReasonLabel(h.decision.reason)) + ' · ' + window.APP.fmtTs(h.decision.ts) + '</div></div></div>' +
      (window.APP.state.sysWindow ? '<div style="margin-top:12px;font-size:11.5px;color:var(--text2);text-align:center"><i class="ti ti-arrows-exchange"></i> Treasury\'s window has it now.</div></div>'
        : '<button class="btn primary" id="ap-back-treas" style="width:100%;justify-content:center;margin-top:12px"><i class="ti ti-arrow-back-up"></i> See it in Treasury</button></div>')
      : '<div class="card" style="margin:0"><div style="font-weight:600;font-size:13.5px;margin-bottom:8px">Your decision</div>' +
      T.AGENCY_DECISIONS[stage].map(function (o) {
        var on = o.c === p.c, c = TONE[o.tone];
        return '<label style="display:flex;gap:8px;align-items:center;border:0.5px solid ' + (on ? c[0] : "var(--border)") + ';background:' + (on ? c[1] : "#fff") + ';border-radius:8px;padding:8px 10px;cursor:pointer;margin-top:6px"><input type="radio" name="ap-dec" value="' + o.c + '"' + (on ? " checked" : "") + '><span style="font-size:12.5px;font-weight:500;color:' + (on ? c[0] : "var(--ink)") + '"><i class="ti ti-' + o.icon + '"></i> ' + o.t + '</span></label>';
      }).join("") +
      '<div style="font-size:11px;color:var(--text2);margin:10px 0 3px">Reason</div><select id="ap-reason" class="input">' + T.AGENCY_REASONS[p.c].map(function (r) { return '<option value="' + r.c + '">' + r.c + ' · ' + esc(r.t) + '</option>'; }).join("") + '</select>' +
      '<div style="font-size:11px;color:var(--text2);margin:10px 0 3px">Note to Treasury <span class="muted">· optional</span></div><textarea id="ap-note" class="input" style="min-height:58px" placeholder="' + (stage === "prepay" ? "e.g. Taxpayer confirmed she didn't file this return." : "e.g. Beneficiary confirmed she didn't request the change.") + '"></textarea>' +
      '<button class="btn primary" id="ap-submit" style="width:100%;justify-content:center;margin-top:12px"><i class="ti ti-send"></i> Record decision · notify Treasury</button></div>';
    return '<div style="margin-bottom:10px"><span class="btn" id="ap-inbox" style="font-size:11.5px"><i class="ti ti-arrow-left"></i> Inbox</span></div>' +
      '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">' +
      '<div style="flex:1.4;min-width:360px;display:flex;flex-direction:column;gap:12px">' +
      '<div class="card" style="margin:0"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">From Treasury · Fiscal Service · ' + h.pkg + '</div>' +
      '<div style="font-weight:600;font-size:15px;margin-top:3px">' + esc(l.payee) + ' · ' + usd(l.amount) + '</div><div style="font-size:12px;color:var(--text2)">' + esc(l.prog.name) + ' · ' + h.id + ' · ' + (stage === "prepay" ? "not yet disbursed" : "paid " + esc(l.paidDate || "")) + '</div></div>' +
      '<div style="text-align:right"><div style="font-size:10.5px;color:var(--text3)">Risk</div><div style="font-weight:600;font-size:20px;color:var(--high-tx)">' + h.payload.riskScore + '</div></div></div>' +
      '<div style="margin-top:10px;padding:9px 11px;border-radius:8px;background:var(--med-bg)"><div style="font-size:10.5px;color:var(--med-tx);text-transform:uppercase;letter-spacing:.04em">Treasury recommends</div><div style="font-weight:600;font-size:13.5px;color:var(--med-tx);margin-top:2px">' + esc(T.recLabel(l, h.rec)) + '</div>' +
      '<div style="font-size:12px;line-height:1.5;margin-top:4px;color:var(--ink)">' + esc(h.note) + '</div></div>' +
      '<div style="font-weight:500;font-size:12.5px;margin:12px 0 2px">What Treasury found</div>' + ev +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;font-size:11.5px"><span class="pill" style="background:var(--low-bg);color:var(--low-tx)"><i class="ti ti-circle-check"></i> Do Not Pay passed</span>' + (tl.length ? T.tlMark(tl.length + ' findings') : '') + (h.payload.network ? '<span class="pill" style="background:var(--accent-l);color:var(--accent-d)"><i class="ti ti-affiliate"></i> Network: ' + h.payload.network.payees + ' payees · ' + h.payload.network.agencies.join(", ") + '</span>' : '') + '</div></div>' +
      '<details class="card" style="margin:0"><summary style="cursor:pointer;font-weight:500;font-size:12.5px"><i class="ti ti-braces" style="color:#1a6b5f"></i> Structured package as received · ' + esc(T.SCHEMA.name) + '</summary><pre style="margin:8px 0 0;max-height:300px;overflow:auto;background:#0b1526;color:#d0e2ff;border-radius:8px;padding:10px;font-size:10.5px;white-space:pre-wrap">' + esc(JSON.stringify(h.payload, null, 2)) + '</pre></details>' +
      '</div><div style="flex:1;min-width:280px">' + decide + '</div></div>';
  }

  function wire(mount, agency, id) {
    var g = function (x) { return document.getElementById(x); };
    if (g("ap-exit")) g("ap-exit").onclick = function () { window.APP.leaveAgencyPortal(); };
    if (g("ap-login")) g("ap-login").onclick = function () {
      window.APP.state.agencyAuth[agency] = true;
      window.APP.auditLog("AGENCY_SIGN_IN", T.AGENCY_USERS[agency].name + " signed in to " + agency + "'s system (simulated)");
      rerender(agency, null); // land in the inbox, where the new package is waiting
    };
    mount.querySelectorAll(".ap-row").forEach(function (r) { r.onclick = function () { rerender(agency, r.getAttribute("data-id")); }; });
    if (g("ap-inbox")) g("ap-inbox").onclick = function () { rerender(agency, null); };
    mount.querySelectorAll("input[name=ap-dec]").forEach(function (r) { r.onchange = function () { pick[id].c = r.value; rerender(agency, id); }; });
    if (g("ap-submit")) g("ap-submit").onclick = function () {
      window.APP.agencyDecide(id, pick[id].c, g("ap-reason").value, (g("ap-note").value || "").trim());
      rerender(agency, id);
    };
    // back to Treasury's record of the payment, without the agency screens in the back trail
    if (g("ap-back-treas")) g("ap-back-treas").onclick = function () {
      window.APP.state._preAgencySnap = null;
      window.APP.state.hist = (window.APP.state.hist || []).filter(function (s) { return s.view !== "agencyportal" && s.view !== "handoff" && !(s.view === "claim" && s.allegationId === id); });
      window.APP.state.allegationId = id; window.APP.nav("claim", { id: id });
    };
  }
})();
