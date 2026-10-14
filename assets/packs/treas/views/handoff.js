/* Treasury pack · the recommendation package — what Treasury sends the agency that
   certified a payment. Treasury can't stop a payment; the agency can. The package
   shows two ways side by side: for people (the recommendation, the evidence, the
   checks, a PDF) and for systems (the same package as structured data in the shared
   schema, scoped to this request, sent from Treasury's instance to the agency's).
   Reached by APP.openHandoff(id, rec). */
(function () {
  window.Views = window.Views || {};
  var T = window.TREAS;
  var esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var draft = {}; // unsent choices, per payment, for this screen session

  var TONE = { high: ["var(--high-tx)", "var(--high-bg)"], med: ["var(--med-tx)", "var(--med-bg)"], low: ["var(--low-tx)", "var(--low-bg)"] };
  var NOT_SHARED = {
    IRS: ["Payments to other payees", "Other agencies' payee records", "IRS return data: it never leaves IRS (26 U.S.C. § 6103)"],
    other: ["Payments to other payees", "Other agencies' payee records", "Tax return information"]
  };

  window.Views.handoff = {
    render: function (mount, params) {
      var id = params.id || window.APP.state.allegationId, l = T.get(id);
      if (!l) { mount.innerHTML = '<div class="page"><p>Payment not found.</p></div>'; return; }
      var h = T.handoff(id), stage = l.mode === "prepay" ? "prepay" : "post", ready = T.packageReady(l), finding = T.findingFor(id);
      var d = draft[id] || (draft[id] = { rec: params.rec || T.defaultRec(l), note: null });
      if (params.rec && !h) d.rec = params.rec;
      var rec = h ? h.rec : d.rec, reason = h ? h.reason : reasonFor(l, rec);
      var note = h ? h.note : d.note != null ? d.note : window.AI.adjudicationSummary(l).recommendation.rationale;
      var ag = T.AGENCIES[l.agency], payload = h ? h.payload : T.payload(l, rec, reason);

      mount.innerHTML = '<div class="page">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">' +
        '<span class="btn" id="ho-back" style="padding:5px 9px"><i class="ti ti-arrow-left"></i> ' + esc(window.APP.backLabel()) + '</span>' +
        '<span class="page-title">Recommendation package · Payment ' + id + '</span>' +
        '<span class="pill" style="background:var(--surface);color:var(--text2)"><i class="ti ti-send"></i> To: ' + esc(ag.name) + '</span>' +
        (h ? statusPill(l, h) : '<span class="pill" style="background:var(--accent-l);color:var(--accent-d)">Draft</span>') + '</div>' +
        '<div class="page-sub" style="margin:-4px 0 12px">Only ' + esc(ag.name) + ' can stop or recover this payment. Treasury sends what it found and what it recommends; ' + l.agency + ' decides in its own system, and the decision comes back here.</div>' +
        instances(l) +
        '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">' +
        '<div style="flex:1.25;min-width:360px">' + human(l, h, stage, rec, reason, note) + '</div>' +
        '<div style="flex:1;min-width:320px">' + machine(l, payload) + '</div></div>' +
        (h ? sentCard(l, h) : ready ? '<div class="card" style="display:flex;align-items:center;gap:10px;margin-top:12px"><i class="ti ti-info-circle" style="color:var(--accent-d)"></i><div style="flex:1;font-size:12px;color:var(--text2)">Sending shares only the fields on the right. ' + l.agency + ' gets the readable view and the structured data together.</div>' +
          '<button class="btn primary" id="ho-send"><i class="ti ti-send"></i> Send to ' + l.agency + '</button></div>'
          : '<div class="card" style="display:flex;align-items:center;gap:10px;margin-top:12px;border-color:var(--med)"><i class="ti ti-clock" style="color:var(--med-tx);font-size:20px"></i><div style="flex:1;font-size:12px;color:var(--text2)"><b style="color:var(--ink)">Not sent yet.</b> ' + (finding ? 'The finding (' + esc(T.FINDING[finding.outcome]) + ') is with the supervisor. The package goes out once it\'s approved.' : 'Record Treasury\'s finding on the payment first; a supervisor approves it, then this package goes to ' + l.agency + '.') + '</div><button class="btn" id="ho-record2"><i class="ti ti-file-text"></i> Back to the payment</button></div>') +
        '</div>';

      document.getElementById("ho-back").onclick = function () { window.APP.goBack(); };
      document.getElementById("ho-pdf").onclick = function () { pdf(l, h ? h.rec : d.rec, h ? h.reason : reasonFor(l, d.rec), h ? h.note : noteVal(), payload); };
      var portal = document.getElementById("ho-portal"); if (portal) portal.onclick = function () { window.APP.openAgencyPortal(l.agency, id); };
      var win = document.getElementById("ho-window"); if (win) win.onclick = function () { window.APP.openAgencyWindow(l.agency); };
      var back = document.getElementById("ho-record"); if (back) back.onclick = function () { window.APP.openAllegation(id); };
      var back2 = document.getElementById("ho-record2"); if (back2) back2.onclick = function () { window.APP.openAllegation(id); };
      if (h || !ready) return;
      mount.querySelectorAll("input[name=ho-rec]").forEach(function (r) { r.onchange = function () { d.rec = r.value; d.note = noteVal(); window.Views.handoff.render(mount, { id: id }); }; });
      document.getElementById("ho-note").oninput = function () { d.note = noteVal(); };
      document.getElementById("ho-reason").onchange = function () { d.reason = this.value; refreshJson(l, d); };
      document.getElementById("ho-send").onclick = function () {
        window.APP.sendHandoff(id, d.rec, document.getElementById("ho-reason").value, noteVal());
        delete draft[id];
        window.Views.handoff.render(mount, { id: id });
      };
    }
  };

  function noteVal() { var t = document.getElementById("ho-note"); return t ? t.value : ""; }
  // the reason codes behind each recommended action (Treasury's own codes)
  function reasonsFor(l, rec) {
    var R = window.APP.REASONS;
    return { hold: R.hold, stop: R.deny, release: R.pay, reclaim: R.confirm, refer: R.escalate, none: R.dismiss }[rec] || [];
  }
  function reasonFor(l, rec) {
    var key = { hold: "hold", stop: "deny", release: "pay", reclaim: "confirm", refer: "escalate", none: "dismiss" }[rec];
    var d = draft[l.id], list = reasonsFor(l, rec);
    if (d && d.reason && list.some(function (r) { return r.c === d.reason; })) return d.reason;
    return key === "pay" ? "PAY-01" : T.defaultReason(l, key);
  }
  function refreshJson(l, d) {
    var pre = document.getElementById("ho-json"); if (pre) pre.innerHTML = json(T.payload(l, d.rec, reasonFor(l, d.rec)));
  }

  function statusPill(l, h) {
    if (!h.decision) return '<span class="pill" style="background:var(--med-bg);color:var(--med-tx)"><i class="ti ti-clock"></i> Sent · awaiting ' + l.agency + '</span>';
    var dd = T.agencyDecision(l, h.decision.c), c = TONE[dd.tone];
    return '<span class="pill" style="background:' + c[1] + ';color:' + c[0] + '"><i class="ti ti-' + dd.icon + '"></i> ' + l.agency + ': ' + esc(dd.t) + '</span>';
  }

  // Treasury's instance → the agency's instance, in the shared schema
  function instances(l) {
    var box = function (icon, t, s, dark) {
      return '<div style="flex:1;min-width:200px;display:flex;gap:10px;align-items:center;border-radius:9px;padding:10px 12px;background:' + (dark ? "#001141" : "var(--card)") + ';border:0.5px solid ' + (dark ? "#001141" : "var(--border)") + ';color:' + (dark ? "#fff" : "inherit") + '">' +
        '<i class="ti ti-' + icon + '" style="font-size:20px;color:' + (dark ? "#78a9ff" : "var(--accent-d)") + '"></i><div><div style="font-weight:600;font-size:12.5px">' + t + '</div><div style="font-size:10.5px;color:' + (dark ? "#c1c7cd" : "var(--text2)") + '">' + s + '</div></div></div>';
    };
    return '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
      box("building-bank", "Treasury · Fiscal Service", "IBM Payment Integrity instance", true) +
      '<div style="text-align:center;min-width:170px;color:var(--text2)"><div style="font-size:10.5px;font-weight:600;color:var(--accent-d)">' + esc(T.SCHEMA.name) + '</div><div style="color:var(--accent);font-size:18px;line-height:1"><i class="ti ti-arrow-narrow-right"></i></div><div style="font-size:10px">' + esc(T.SCHEMA.note) + '</div></div>' +
      box("building", esc(T.AGENCIES[l.agency].name), "Its own system · any vendor", false) + '</div>';
  }

  // ---- for people ----
  function human(l, h, stage, rec, reason, note) {
    var opts = T.REC_ACTIONS[stage].map(function (o) {
      var on = o.c === rec, c = TONE[o.tone];
      return '<label style="flex:1;min-width:150px;display:flex;gap:8px;align-items:flex-start;border:0.5px solid ' + (on ? c[0] : "var(--border)") + ';background:' + (on ? c[1] : "#fff") + ';border-radius:8px;padding:8px 10px;cursor:' + (h ? "default" : "pointer") + '">' +
        '<input type="radio" name="ho-rec" value="' + o.c + '"' + (on ? " checked" : "") + (h ? " disabled" : "") + ' style="margin-top:2px"><span style="font-size:12px;font-weight:500;color:' + (on ? c[0] : "var(--ink)") + '"><i class="ti ti-' + o.icon + '"></i> ' + o.t + (o.c === T.defaultRec(l) ? ' <span class="pill" style="background:var(--accent);color:#fff;font-size:9.5px">model</span>' : '') + '</span></label>';
    }).join("");
    var reasons = reasonsFor(l, rec).map(function (r) { return '<option value="' + r.c + '"' + (r.c === reason ? " selected" : "") + '>' + r.c + ' · ' + esc(r.t) + '</option>'; }).join("");
    var ev = (l.signals || []).filter(function (s) { return s.sev !== "low"; }).map(function (s) {
      return '<div style="display:flex;gap:9px;padding:6px 0;border-top:0.5px solid var(--border2)"><span style="width:7px;height:7px;border-radius:50%;flex:none;margin-top:6px;background:' + (s.sev === "high" ? "var(--high)" : "var(--med)") + '"></span><div style="flex:1;font-size:12px"><b style="font-weight:500">' + esc(s.label) + '.</b> <span style="color:var(--text2)">' + esc(s.detail) + '</span></div><span style="align-self:flex-start">' + T.laneTag(s.lane, s.src, true) + '</span></div>';
    }).join("");
    var tl = T.tlFor(l.id).filter(function (f) { return f.st !== "pass"; });
    var net = l.network ? T.net(l.network) : null;
    return '<div class="card" style="margin:0">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-weight:600;font-size:13.5px"><i class="ti ti-user" style="color:var(--accent-d)"></i> For people <span class="muted" style="font-weight:400;font-size:11px">· what ' + l.agency + '\'s reviewer reads</span></div>' +
      '<button class="btn" id="ho-pdf" style="font-size:11.5px"><i class="ti ti-file-type-pdf"></i> PDF</button></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;font-size:12px;margin-bottom:10px">' + kv("Payment", l.id + " · " + esc(l.prog.name)) + kv("Payee", esc(l.payee)) + kv("Amount", usd(l.amount)) + kv("Risk", l.riskScore + " / 100") + kv("Status", l.mode === "prepay" ? "Not yet disbursed" : "Paid " + esc(l.paidDate || "")) + '</div>' +
      '<div style="font-size:11px;color:var(--text2);margin-bottom:4px">Treasury recommends</div><div style="display:flex;gap:6px;flex-wrap:wrap">' + opts + '</div>' +
      '<div style="font-size:11px;color:var(--text2);margin:10px 0 3px">Reason</div><select id="ho-reason" class="input"' + (h ? " disabled" : "") + '>' + reasons + '</select>' +
      '<div style="font-size:11px;color:var(--text2);margin:10px 0 3px">Why <span class="muted">· drafted by the Investigative Assistant, edit before sending</span></div>' +
      '<textarea id="ho-note" class="input" style="min-height:78px"' + (h ? " disabled" : "") + '>' + esc(note) + '</textarea>' +
      '<div style="font-weight:500;font-size:12.5px;margin:12px 0 2px">Evidence</div>' + (ev || '<div class="muted" style="font-size:12px">No adverse findings.</div>') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
      '<div style="flex:1;min-width:170px;border-radius:8px;padding:8px 10px;background:var(--low-bg);font-size:11.5px"><b style="color:var(--low-tx)"><i class="ti ti-circle-check"></i> Do Not Pay: ' + (dnpFail(l) ? "1 match" : "all passed") + '</b><div style="color:var(--text2);margin-top:2px">' + T.DNP.length + ' source groups · account and TIN checks</div></div>' +
      '<div style="flex:1;min-width:170px;border-radius:8px;padding:8px 10px;background:' + (tl.length ? "var(--high-bg)" : "var(--surface)") + ';font-size:11.5px"><b style="color:' + (tl.length ? "var(--high-tx)" : "var(--text2)") + '">' + T.tlMark() + ' ' + (tl.length ? tl.length + " finding" + (tl.length > 1 ? "s" : "") : "no findings") + '</b><div style="color:var(--text2);margin-top:2px">' + (tl.length ? esc(tl.map(function (f) { return f.t; }).slice(0, 3).join(" · ")) : "Due-diligence sources") + '</div></div></div>' +
      (net ? '<div style="margin-top:10px;font-size:12px;line-height:1.5;padding:8px 10px;border-radius:8px;background:var(--accent-l)"><i class="ti ti-affiliate" style="color:var(--accent-d)"></i> Part of the <b>' + esc(net.name) + '</b>: ' + net.payees + ' payees, ' + net.agencies.join(", ") + ', ' + T.bigUsd(net.atRisk) + '. Treasury is coordinating with the other agencies.</div>' : '') +
      '</div>';
  }
  function dnpFail(l) { return l.fwaType === "Deceased payee"; }
  function kv(k, v) { return '<div style="background:var(--surface);border:0.5px solid var(--border);border-radius:7px;padding:4px 9px"><span style="color:var(--text3);font-size:10.5px">' + k + '</span> <b style="font-weight:600">' + v + '</b></div>'; }

  // ---- for systems ----
  function machine(l, payload) {
    var n = Object.keys(payload).filter(function (k) { return k !== "schema" && payload[k] != null; }).length;
    var not = NOT_SHARED[l.agency] || NOT_SHARED.other;
    return '<div class="card" style="margin:0">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px;flex-wrap:wrap"><div style="font-weight:600;font-size:13.5px"><i class="ti ti-braces" style="color:var(--accent-d)"></i> For systems <span class="muted" style="font-weight:400;font-size:11px">· what ' + l.agency + '\'s system reads</span></div>' +
      '<span class="pill" style="background:var(--accent-l);color:var(--accent-d)"><i class="ti ti-filter"></i> ' + n + ' fields · scoped to this request</span></div>' +
      '<pre id="ho-json" style="margin:0;max-height:430px;overflow:auto;background:#0b1526;color:#d0e2ff;border-radius:8px;padding:11px 12px;font-size:11px;line-height:1.5;white-space:pre-wrap;word-break:break-word">' + json(payload) + '</pre>' +
      '<div style="font-size:11px;color:var(--text2);margin-top:9px"><b style="font-weight:600;color:var(--ink)">Not shared</b>' + not.map(function (x) { return '<div style="margin-top:2px"><i class="ti ti-lock" style="color:var(--text3)"></i> ' + esc(x) + '</div>'; }).join("") + '</div>' +
      '<div style="font-size:10.5px;color:var(--text3);margin-top:8px"><i class="ti ti-info-circle"></i> Any agency system that reads the shared schema can take this in, whoever built it. The schema is shown as a concept.</div></div>';
  }
  function json(o) {
    var s = esc(JSON.stringify(o, null, 2));
    return s.replace(/(&quot;[^&]*?&quot;)(\s*:)/g, '<span style="color:#78a9ff">$1</span>$2').replace(/:\s(&quot;.*?&quot;)/g, ': <span style="color:#a7f0ba">$1</span>');
  }

  function sentCard(l, h) {
    var u = T.AGENCY_USERS[h.agency];
    var dec = h.decision ? T.agencyDecision(l, h.decision.c) : null, c = dec ? TONE[dec.tone] : null;
    return '<div class="card" style="margin-top:12px;border-color:' + (dec ? c[0] : "var(--border)") + '">' +
      '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
      '<i class="ti ti-' + (dec ? dec.icon : "send") + '" style="font-size:24px;color:' + (dec ? c[0] : "var(--accent-d)") + '"></i>' +
      '<div style="flex:1;min-width:240px"><div style="font-weight:600;font-size:13.5px">' + (dec ? esc(T.AGENCIES[h.agency].name) + ': ' + esc(dec.t) : 'Sent to ' + esc(T.AGENCIES[h.agency].name)) + '</div>' +
      '<div style="font-size:12px;color:var(--text2);margin-top:2px">' + (dec ? esc(h.decision.by) + ', ' + esc(h.decision.title) + ' · ' + window.APP.fmtTs(h.decision.ts) + ' · ' + esc(T.agencyReasonLabel(h.decision.reason)) + (h.decision.note ? ' · “' + esc(h.decision.note) + '”' : '')
        : h.pkg + ' · ' + window.APP.fmtTs(h.sentAt) + ' by ' + esc(h.sentBy) + '. Waiting for ' + h.agency + ' to decide (' + esc(u.name) + ', ' + esc(u.title) + ').') + '</div></div>' +
      '<button class="btn" id="ho-record"><i class="ti ti-file-text"></i> Back to the payment</button>' +
      '<button class="btn" id="ho-window" title="Open ' + h.agency + '\'s system in its own window, beside this one"><i class="ti ti-app-window"></i> New window</button>' +
      '<button class="btn primary" id="ho-portal"><i class="ti ti-external-link"></i> Open ' + h.agency + '\'s system</button></div></div>';
  }

  function pdf(l, rec, reason, note, payload) {
    var E = window.EXPORT, ag = T.AGENCIES[l.agency];
    var ev = (l.signals || []).filter(function (s) { return s.sev !== "low"; }).map(function (s) { return [s.label, s.detail, s.src]; });
    var tl = T.tlFor(l.id).filter(function (f) { return f.st !== "pass"; }).map(function (f) { return [f.t, f.text, f.src]; });
    var body = '<div class="card">' + E.kvHtml([["To", ag.name], ["Payment", l.id], ["Amount", usd(l.amount)], ["Risk", l.riskScore + " / 100"]]) +
      '<h2>Treasury recommends: ' + E.htmlEsc(T.recLabel(l, rec)) + '</h2><div>Reason ' + E.htmlEsc(window.APP.reasonLabel(rec === "stop" ? "deny" : rec === "release" ? "pay" : rec === "reclaim" ? "confirm" : rec === "refer" ? "escalate" : rec === "none" ? "dismiss" : "hold", reason)) + '</div><p>' + E.htmlEsc(note) + '</p></div>' +
      '<h2>Payee and payment</h2>' + E.tableHtml(["Payee", "Payment type", "Deposit account", "Status"], [[l.payee, l.prog.name, l.bank + " " + l.acct, l.mode === "prepay" ? "Not yet disbursed" : "Paid " + (l.paidDate || "")]]) +
      '<h2>Evidence</h2>' + E.tableHtml(["Finding", "Detail", "Source"], ev) +
      (tl.length ? '<h2>TrackLight due diligence</h2>' + E.tableHtml(["Check", "Finding", "Source"], tl) : '') +
      '<h2>Do Not Pay</h2><div>' + (dnpFail(l) ? "Matched: payee deceased." : "No match in " + T.DNP.map(function (g) { return g.t.toLowerCase(); }).join(", ") + ". Account ownership and TIN verified.") + '</div>' +
      '<h2>Structured package (' + E.htmlEsc(T.SCHEMA.name) + ')</h2><pre style="font-size:9.5px;background:#f2f4f8;padding:8px;border-radius:6px;white-space:pre-wrap">' + E.htmlEsc(JSON.stringify(payload, null, 2)) + '</pre>' +
      '<p>Only ' + E.htmlEsc(ag.name) + ' can stop or recover this payment. Please respond by ' + E.htmlEsc(payload.respondBy) + '.</p>';
    E.pdf("Recommendation package — Payment " + l.id + " to " + l.agency, body);
  }
})();
