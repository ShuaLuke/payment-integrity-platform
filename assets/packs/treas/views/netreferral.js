/* Treasury pack · a network referral — the ring and its payments, sent to every
   agency that certified a payment in it, one referral per agency. Three scopes:
   one network, every network, or payments picked by hand. Same shape as the
   single-payment package: for people on the left (the ring, each agency's share,
   the recommendation, the worked example), for systems on the right (the
   structured referral in the shared schema). Reached by APP.openNetReferral. */
(function () {
  window.Views = window.Views || {};
  var T = window.TREAS;
  var esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var TONE = { high: ["var(--high-tx)", "var(--high-bg)"], med: ["var(--med-tx)", "var(--med-bg)"], low: ["var(--low-tx)", "var(--low-bg)"] };
  var draft = {};

  function title(scope, net, ids) {
    return scope === "all" ? "Every network · " + T.NETS.length + " networks" : scope === "selected" ? ids.length + " payment" + (ids.length > 1 ? "s" : "") + " picked by hand" : esc(T.net(net).name);
  }

  window.Views.netreferral = {
    render: function (mount, params) {
      var scope = params.scope || "network", net = params.net || "N01", ids = params.ids || [];
      var key0 = scope + "|" + (net || "") + "|" + ids.join(",");
      var d = draft[key0] || (draft[key0] = { recs: {}, note: null });
      var split = T.netSplit(scope, net, ids);
      var sent = split.map(function (b) { return T.netRef(T.refKey(scope, net, b.agency)); }).filter(Boolean);
      var isSent = sent.length === split.length && split.length > 0;
      var note = isSent ? sent[0].note : d.note != null ? d.note : T.netNote(scope, net);
      var first = split[0], firstRec = isSent ? sent[0].rec : d.recs[first.agency] || T.netRecFor(first);
      var sample = isSent ? sent[0] : { id: "NR-" + (scope === "all" ? "ALL" : scope === "selected" ? "SEL" : net) + "-" + first.agency, scope: scope, net: net, agency: first.agency, payments: first.payments, pending: first.pending, atRisk: first.atRisk, networks: first.networks || null, ids: first.ids, rec: firstRec, note: note };
      var payload = isSent ? sent[0].payload : T.netPayload(sample);

      mount.innerHTML = '<div class="page">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">' +
        '<span class="btn" id="nr-back" style="padding:5px 9px"><i class="ti ti-arrow-left"></i> ' + esc(window.APP.backLabel()) + '</span>' +
        '<span class="page-title">Network referral · ' + title(scope, net, ids) + '</span>' +
        '<span class="pill" style="background:var(--surface);color:var(--text2)"><i class="ti ti-send"></i> To: ' + split.map(function (b) { return b.agency; }).join(", ") + '</span>' +
        (isSent ? '<span class="pill" style="background:var(--accent-l);color:var(--accent-d)"><i class="ti ti-check"></i> Sent to ' + sent.length + ' agenc' + (sent.length > 1 ? 'ies' : 'y') + '</span>' : '<span class="pill" style="background:var(--accent-l);color:var(--accent-d)">Draft</span>') + '</div>' +
        '<div class="page-sub" style="margin:-4px 0 12px">One referral per certifying agency: the ring, that agency\'s payments in it, and what Treasury recommends. Each agency decides in its own system; the decisions come back here.</div>' +
        instances(split) +
        '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">' +
        '<div style="flex:1.25;min-width:360px">' + human(scope, net, ids, split, sent, isSent, d, note) + '</div>' +
        '<div style="flex:1;min-width:320px">' + machine(first, payload, split.length) + '</div></div>' +
        (isSent ? sentCards(sent) : '<div class="card" style="display:flex;align-items:center;gap:10px;margin-top:12px"><i class="ti ti-info-circle" style="color:var(--accent-d)"></i><div style="flex:1;font-size:12px;color:var(--text2)">Each agency receives only its own payments and the ring that ties them together. Nothing about another agency\'s payees leaves Treasury.</div>' +
          '<button class="btn primary" id="nr-send"><i class="ti ti-send"></i> Send to ' + split.map(function (b) { return b.agency; }).join(", ") + '</button></div>') +
        '</div>';

      document.getElementById("nr-back").onclick = function () { window.APP.goBack(); };
      document.getElementById("nr-pdf").onclick = function () { pdf(scope, net, ids, split, note, payload); };
      mount.querySelectorAll(".nr-portal").forEach(function (b) { b.onclick = function () { window.APP.openAgencyPortal(b.getAttribute("data-ag"), null, b.getAttribute("data-key")); }; });
      mount.querySelectorAll(".nr-window").forEach(function (b) { b.onclick = function () { window.APP.openAgencyWindow(b.getAttribute("data-ag")); }; });
      mount.querySelectorAll("[data-open]").forEach(function (r) { r.onclick = function () { window.APP.openAllegation(r.getAttribute("data-open")); }; });
      if (isSent) return;
      mount.querySelectorAll("select.nr-rec").forEach(function (s) { s.onchange = function () { d.recs[s.getAttribute("data-ag")] = s.value; d.note = document.getElementById("nr-note").value; window.Views.netreferral.render(mount, params); }; });
      document.getElementById("nr-note").oninput = function () { d.note = this.value; };
      document.getElementById("nr-send").onclick = function () {
        var recs = {}; split.forEach(function (b) { recs[b.agency] = d.recs[b.agency] || T.netRecFor(b); });
        window.APP.sendNetReferral(scope, net, ids, recs, document.getElementById("nr-note").value);
        delete draft[key0];
        window.Views.netreferral.render(mount, params);
      };
    }
  };

  function instances(split) {
    var box = function (icon, t, s, dark) {
      return '<div style="flex:1;min-width:200px;display:flex;gap:10px;align-items:center;border-radius:9px;padding:10px 12px;background:' + (dark ? "#001141" : "var(--card)") + ';border:0.5px solid ' + (dark ? "#001141" : "var(--border)") + ';color:' + (dark ? "#fff" : "inherit") + '">' +
        '<i class="ti ti-' + icon + '" style="font-size:20px;color:' + (dark ? "#78a9ff" : "var(--accent-d)") + '"></i><div><div style="font-weight:600;font-size:12.5px">' + t + '</div><div style="font-size:10.5px;color:' + (dark ? "#c1c7cd" : "var(--text2)") + '">' + s + '</div></div></div>';
    };
    return '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px">' +
      box("building-bank", "Treasury · Fiscal Service", "IBM Payment Integrity instance", true) +
      '<div style="text-align:center;min-width:170px;color:var(--text2)"><div style="font-size:10.5px;font-weight:600;color:var(--accent-d)">' + esc(T.SCHEMA.name) + '</div><div style="color:var(--accent);font-size:18px;line-height:1"><i class="ti ti-arrow-narrow-right"></i></div><div style="font-size:10px">' + split.length + ' referral' + (split.length > 1 ? 's, one per agency' : '') + '</div></div>' +
      box("building", split.map(function (b) { return esc(T.AGENCIES[b.agency].name); }).join(" · "), "Each in its own system · any vendor", false) + '</div>';
  }

  // ---- for people ----
  function human(scope, net, ids, split, sent, isSent, d, note) {
    var ring = scope === "network" ? T.ringSummary(net) : null;
    var kv = function (k, v) { return '<div style="display:flex;gap:8px;padding:5px 0;border-top:0.5px solid var(--border2);font-size:12px"><span style="width:110px;flex:none;color:var(--text3)">' + k + '</span><span style="flex:1">' + v + '</span></div>'; };
    var ringHtml = ring ? '<div style="font-weight:500;font-size:12.5px;margin:12px 0 2px"><i class="ti ti-affiliate" style="color:var(--accent-d)"></i> The ring</div>' +
      kv("Organizer", esc(ring.organizer)) + kv("Accounts", esc(ring.batches)) + kv("Mailbox", esc(ring.mailbox)) + kv("Phone", esc(ring.phone)) + kv("Employers", esc(ring.employers)) + kv("Identities", esc(ring.victims)) + kv("Scale", ring.payees + " payees · " + ring.payments + " payments · " + T.bigUsd(ring.atRisk) + " · " + esc(ring.agencies))
      : scope === "all" ? '<div style="font-weight:500;font-size:12.5px;margin:12px 0 2px"><i class="ti ti-affiliate" style="color:var(--accent-d)"></i> ' + T.NETS.length + ' networks · ' + T.bigUsd(T.stats().atRisk) + '</div><div style="font-size:11.5px;color:var(--text2)">Each agency\'s referral lists its networks and its share of each.</div>' : "";
    var rows = split.map(function (b) {
      var r = isSent ? T.netRef(T.refKey(scope, net, b.agency)) : null, rec = r ? r.rec : d.recs[b.agency] || T.netRecFor(b);
      var sel = isSent ? '<span style="font-size:11.5px">' + esc(T.netRecLabel(rec)) + '</span>' : '<select class="input nr-rec" data-ag="' + b.agency + '" style="font-size:11.5px;padding:3px 6px">' + T.NET_RECS.map(function (o) { return '<option value="' + o.c + '"' + (o.c === rec ? " selected" : "") + '>' + esc(o.t) + '</option>'; }).join("") + '</select>';
      return '<tr><td><span class="tag mono" style="font-size:10px">' + b.agency + '</span> ' + esc(T.AGENCIES[b.agency].name) + (b.networks && scope === "all" ? '<div style="font-size:10.5px;color:var(--text2)">' + b.networks.length + ' network' + (b.networks.length > 1 ? 's' : '') + '</div>' : '') + '</td>' +
        '<td class="right mono">' + b.payments.toLocaleString() + '</td><td class="right mono" style="color:' + (b.pending ? "var(--high-tx)" : "var(--text3)") + ';font-weight:600">' + b.pending + '</td><td class="right mono" style="font-weight:600">' + T.bigUsd(b.atRisk) + '</td><td>' + sel + '</td></tr>';
    }).join("");
    var ex = split[0].ids.slice(0, 4).map(function (id) {
      var l = T.lead(id), g = T.GRAPH.filter(function (x) { return x.id === id; })[0]; if (!l && !g) return "";
      var top = l ? (l.signals || []).filter(function (s) { return s.sev === "high"; }).slice(0, 2) : [];
      return '<div style="display:flex;gap:9px;padding:6px 0;border-top:0.5px solid var(--border2);font-size:12px;align-items:flex-start' + (l ? ';cursor:pointer' : '') + '"' + (l ? ' data-open="' + id + '"' : '') + '><span class="mono" style="width:76px;flex:none">' + id + '</span><div style="flex:1"><b style="font-weight:500">' + esc(l ? l.payee : g.payee) + '</b> · ' + usd(l ? l.amount : g.amount) + (l && l.mode === "prepay" ? ' · <span style="color:var(--high-tx)">not yet paid</span>' : '') + (top.length ? '<div style="color:var(--text2);font-size:11.5px">' + top.map(function (s) { return esc(s.label); }).join(" · ") + '</div>' : '') + '</div>' + (top.length ? T.laneTag(top[0].lane, null, true) : '') + '</div>';
    }).join("");
    return '<div class="card" style="margin:0">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-weight:600;font-size:13.5px"><i class="ti ti-user" style="color:var(--accent-d)"></i> For people <span class="muted" style="font-weight:400;font-size:11px">· what each agency\'s reviewer reads</span></div>' +
      '<button class="btn" id="nr-pdf" style="font-size:11.5px"><i class="ti ti-file-type-pdf"></i> PDF</button></div>' +
      '<div style="font-size:11px;color:var(--text2);margin-bottom:3px">Each agency\'s share, and what Treasury recommends to it</div>' +
      '<table><thead><tr><th>Agency</th><th class="right">Payments</th><th class="right">Not yet paid</th><th class="right">At risk</th><th>Treasury recommends</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div style="font-size:11px;color:var(--text2);margin:10px 0 3px">Why <span class="muted">· drafted by the Investigative Assistant, edit before sending</span></div>' +
      '<textarea id="nr-note" class="input" style="min-height:78px"' + (isSent ? " disabled" : "") + '>' + esc(note) + '</textarea>' +
      ringHtml +
      '<div style="font-weight:500;font-size:12.5px;margin:12px 0 2px">Worked examples <span class="muted" style="font-weight:400;font-size:11px">· ' + split[0].agency + '\'s payments, with the full list in the structured referral</span></div>' + (ex || '<div class="muted" style="font-size:12px">The payment IDs travel in the structured referral.</div>') +
      '</div>';
  }

  // ---- for systems ----
  function machine(b, payload, nAg) {
    var n = Object.keys(payload).filter(function (k) { return k !== "schema" && payload[k] != null; }).length;
    return '<div class="card" style="margin:0">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px;flex-wrap:wrap"><div style="font-weight:600;font-size:13.5px"><i class="ti ti-braces" style="color:var(--accent-d)"></i> For systems <span class="muted" style="font-weight:400;font-size:11px">· ' + b.agency + '\'s referral' + (nAg > 1 ? '; the other ' + (nAg - 1) + ' differ only in the share and the payment list' : '') + '</span></div>' +
      '<span class="pill" style="background:var(--accent-l);color:var(--accent-d)"><i class="ti ti-filter"></i> ' + n + ' fields · ' + b.agency + '\'s payments only</span></div>' +
      '<pre style="margin:0;max-height:460px;overflow:auto;background:#0b1526;color:#d0e2ff;border-radius:8px;padding:11px 12px;font-size:11px;line-height:1.5;white-space:pre-wrap;word-break:break-word">' + json(payload) + '</pre>' +
      '<div style="font-size:11px;color:var(--text2);margin-top:9px"><b style="font-weight:600;color:var(--ink)">Not shared</b><div style="margin-top:2px"><i class="ti ti-lock" style="color:var(--text3)"></i> Other agencies\' payees and amounts</div><div style="margin-top:2px"><i class="ti ti-lock" style="color:var(--text3)"></i> IRS return data: flags only (26 U.S.C. § 6103)</div></div></div>';
  }
  function json(o) {
    var s = esc(JSON.stringify(o, null, 2));
    return s.replace(/(&quot;[^&]*?&quot;)(\s*:)/g, '<span style="color:#78a9ff">$1</span>$2').replace(/:\s(&quot;.*?&quot;)/g, ': <span style="color:#a7f0ba">$1</span>');
  }

  function sentCards(sent) {
    return '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">' + sent.map(function (r) {
      var u = T.AGENCY_USERS[r.agency], dec = r.decision ? T.netDecision(r.decision.c) : null, c = dec ? TONE[dec.tone] : null;
      return '<div class="card" style="flex:1;min-width:280px;margin:0;border-color:' + (dec ? c[0] : "var(--border)") + '">' +
        '<div style="display:flex;align-items:center;gap:10px"><i class="ti ti-' + (dec ? dec.icon : "send") + '" style="font-size:22px;color:' + (dec ? c[0] : "var(--accent-d)") + '"></i><div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13px">' + esc(T.AGENCIES[r.agency].name) + (dec ? ': ' + esc(dec.t) : '') + '</div>' +
        '<div style="font-size:11.5px;color:var(--text2)">' + (dec ? esc(r.decision.by) + ' · ' + window.APP.fmtTs(r.decision.ts) + ' · ' + esc(T.netReasonLabel(r.decision.reason)) : r.id + ' · ' + window.APP.fmtTs(r.sentAt) + ' · waiting for ' + esc(u.name) + ', ' + esc(u.title)) + '</div></div></div>' +
        '<div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap"><button class="btn nr-window" data-ag="' + r.agency + '" style="font-size:11px" title="Open in its own window"><i class="ti ti-app-window"></i> New window</button><button class="btn primary nr-portal" data-ag="' + r.agency + '" data-key="' + r.key + '" style="font-size:11px;flex:1;justify-content:center"><i class="ti ti-external-link"></i> Open ' + r.agency + '\'s system</button></div>' +
        trail(r) + '</div>';
    }).join("") + '</div>';
  }
  function trail(r) {
    return '<div style="margin-top:10px;border-top:0.5px solid var(--border2);padding-top:6px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--text3)">Trail</div>' +
      (r.trail || []).map(function (t) { return '<div style="display:flex;gap:8px;font-size:11px;padding:3px 0"><span class="mono" style="color:var(--text3);white-space:nowrap">' + window.APP.fmtTs(t.ts) + '</span><span class="tag" style="font-size:9.5px">' + (t.side === "agency" ? r.agency : "Treasury") + '</span><span style="color:var(--text2)">' + esc(t.who) + ' · ' + esc(t.text) + '</span></div>'; }).join("") + '</div>';
  }

  function pdf(scope, net, ids, split, note, payload) {
    var E = window.EXPORT, ring = scope === "network" ? T.ringSummary(net) : null;
    var body = '<div class="card"><h2>Treasury recommends</h2>' + E.tableHtml(["Agency", "Payments", "Not yet paid", "At risk", "Recommendation"], split.map(function (b) { return [T.AGENCIES[b.agency].name, b.payments, b.pending, T.bigUsd(b.atRisk), T.netRecLabel(T.netRecFor(b))]; })) + '<p>' + E.htmlEsc(note) + '</p></div>' +
      (ring ? '<h2>The ring</h2>' + E.tableHtml(["", ""], [["Organizer", ring.organizer], ["Accounts", ring.batches], ["Mailbox", ring.mailbox], ["Phone", ring.phone], ["Employers", ring.employers], ["Scale", ring.payees + " payees · " + ring.payments + " payments · " + T.bigUsd(ring.atRisk)]]) : '') +
      '<h2>Structured referral (' + E.htmlEsc(T.SCHEMA.name) + ')</h2><pre style="font-size:9.5px;background:#f2f4f8;padding:8px;border-radius:6px;white-space:pre-wrap">' + E.htmlEsc(JSON.stringify(payload, null, 2)) + '</pre>';
    E.pdf("Network referral — " + (scope === "all" ? "every network" : scope === "selected" ? ids.length + " payments" : T.net(net).name), body);
  }
})();
