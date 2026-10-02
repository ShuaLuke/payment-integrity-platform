/* Disaster-relief pack · Insights › Intake — registrations arriving for the
   declaration, the verification sources each one is checked against, and a live
   24-hour pipeline from registration to payment (or hold). Simulated activity on
   synthetic figures, like everything else in the demo. Replaces Views.edi. */
(function () {
  window.Views = window.Views || {};
  var F = window.FEMA;
  function esc(s) { return window.APP.esc(s); }
  function num(n) { return Math.round(n).toLocaleString(); }
  function money(n) { return "$" + Math.round(n).toLocaleString(); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function ago(ms) { var s = Math.max(1, Math.round((Date.now() - ms) / 1000)); return s < 60 ? s + "s ago" : Math.round(s / 60) + "m ago"; }
  function kpi(label, val, sub) {
    return '<div class="card" style="flex:1;min-width:150px;margin:0"><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">' + label + '</div>' +
      '<div style="font-weight:600;font-size:22px;margin-top:2px">' + val + '</div>' + (sub ? '<div style="font-size:11px;color:var(--text2);margin-top:1px">' + sub + '</div>' : '') + '</div>';
  }

  var SOURCES = [
    { k: "web", grp: "Registrations", name: "Online & mobile", from: "Disaster assistance website · app", feed: "registrations", cad: "streaming", n: 1412, unit: "registrations" },
    { k: "tel", grp: "Registrations", name: "Helpline", from: "FEMA Helpline", feed: "registrations", cad: "streaming", n: 506, unit: "registrations" },
    { k: "drc", grp: "Registrations", name: "Disaster Recovery Centers", from: "In person · 6 centers", feed: "registrations", cad: "streaming", n: 188, unit: "registrations" },
    { k: "insp", grp: "Registrations", name: "Housing inspections", from: "Remote and on-site", feed: "inspection results", cad: "streaming", n: 642, unit: "results" },
    { k: "idv", grp: "Verification & external", name: "Identity verification", from: "Identity proofing service", feed: "name · SSN · DOB", cad: "per registration", n: 2106, unit: "checks", hits: 14 },
    { k: "dnp", grp: "Verification & external", name: "Death & prisoner records", from: "Do Not Pay · SSA DMF", feed: "matches", cad: "per registration", n: 2106, unit: "screened", hits: 3 },
    { k: "prop", grp: "Verification & external", name: "Property records", from: "Parish & county assessors", feed: "owner of record", cad: "per registration", n: 2106, unit: "lookups", hits: 9 },
    { k: "usps", grp: "Verification & external", name: "Address validation", from: "USPS", feed: "deliverable · unit", cad: "per registration", n: 2106, unit: "checks", hits: 5 },
    { k: "geo", grp: "Verification & external", name: "Damage footprint", from: "Designated areas · imagery", feed: "geospatial", cad: "per registration", n: 2106, unit: "checks", hits: 4 },
    { k: "ins", grp: "Verification & external", name: "Insurance", from: "Flood and homeowner insurers", feed: "policies · settlements", cad: "daily", n: 311, unit: "matches", hits: 6 },
    { k: "sba", grp: "Verification & external", name: "SBA disaster loans", from: "SBA", feed: "loan approvals", cad: "daily", n: 84, unit: "matches", hits: 1 },
    { k: "bank", grp: "Verification & external", name: "Bank account verification", from: "Account-ownership service", feed: "owner match", cad: "per payment", n: 1720, unit: "checks", hits: 11 },
    { k: "dev", grp: "Verification & external", name: "Device & session telemetry", from: "Registration sessions", feed: "device · IP", cad: "per registration", n: 2106, unit: "sessions", hits: 7 }
  ];
  var STAGES = [
    { k: "reg", t: "Register", s: "registrations received" },
    { k: "idv", t: "Verify identity", s: "identity confirmed" },
    { k: "occ", t: "Verify occupancy", s: "residence & ownership" },
    { k: "insp", t: "Inspect", s: "damage assessed" },
    { k: "score", t: "Score", s: "rules + ML/AI" },
    { k: "pay", t: "Pay", s: "paid same day" },
    { k: "hold", t: "Hold or recover", s: "not released" }
  ];
  var FIRST = ["James", "Maria", "Tyrone", "Linda", "Michael", "Keisha", "David", "Brenda", "William", "Yolanda", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Danielle", "Charles", "Karen", "Andre", "Nancy", "Anthony", "Lisa", "Darnell", "Betty", "Steven", "Sandra", "Kevin", "Donna", "Brian", "Carol"];
  var LAST = ["Achee", "Boudreaux", "Callais", "Dantin", "Eschete", "Falgout", "Gautreaux", "Hymel", "Ledet", "Lirette", "Matherne", "Naquin", "Ordoyne", "Pellegrin", "Rome", "Savoie", "Toups", "Usie", "Verret", "Wallace", "Billiot", "Cheramie", "Duplantis", "Fanguy", "Guidry", "Kraemer", "LeBlanc", "Marcel", "Prosperie", "Robichaux"];
  var TOWNS = ["Houma", "Thibodaux", "Morgan City", "Raceland", "Golden Meadow", "Dulac", "Chauvin", "Gray", "Lockport", "Cut Off", "New Iberia", "Abbeville", "Franklin", "Napoleonville"];

  var liveCss = '<style>@keyframes edi-pulse{0%{box-shadow:0 0 0 0 rgba(15,98,254,.55)}70%{box-shadow:0 0 0 6px rgba(15,98,254,0)}100%{box-shadow:0 0 0 0 rgba(15,98,254,0)}}' +
    '.edi-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#0f62fe;animation:edi-pulse 1.6s infinite}' +
    '@keyframes edi-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}.edi-ev{animation:edi-in .35s ease-out}' +
    '@keyframes edi-bump{0%{color:var(--accent-d)}100%{color:inherit}}.edi-bump{animation:edi-bump .9s ease-out}' +
    '.edi-stage{flex:1;min-width:128px;background:#0a1640;border-radius:9px;padding:10px 12px;color:#fff}' +
    '.edi-arrow{align-self:center;color:#0f62fe;font-size:16px;padding:0 2px}</style>';

  function sourcesPanel() {
    var rows = "", grp = "";
    SOURCES.forEach(function (x) {
      if (x.grp !== grp) { grp = x.grp; rows += '<tr><td colspan="5" style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;padding-top:8px">' + grp + '</td></tr>'; }
      rows += '<tr><td><div style="font-weight:500;font-size:12px">' + x.name + '</div><div style="font-size:10.5px;color:var(--text2)">' + x.from + ' · <span class="mono">' + x.feed + '</span></div></td>' +
        '<td style="font-size:10.5px;color:var(--text2);white-space:nowrap">' + x.cad + '</td>' +
        '<td class="right mono" style="font-size:11.5px;white-space:nowrap"><span data-src-n="' + x.k + '"></span> <span style="color:var(--text3);font-size:10px">' + x.unit + '</span></td>' +
        '<td class="right" style="white-space:nowrap">' + (x.hits != null ? '<span data-src-h="' + x.k + '"></span>' : '') + '</td>' +
        '<td class="right mono" style="font-size:10.5px;color:var(--text2);white-space:nowrap"><span class="edi-dot" style="width:6px;height:6px;margin-right:5px"></span><span data-src-a="' + x.k + '"></span></td></tr>';
    });
    return '<div class="card" style="padding:0;overflow:hidden">' +
      '<div style="padding:10px 12px;border-bottom:0.5px solid var(--border2);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
      '<div style="font-weight:500;font-size:12.5px"><i class="ti ti-plug-connected" style="color:var(--accent-d)"></i> Data sources <span class="muted" style="font-weight:400;font-size:10.5px">· last 24 hours · every registration is checked against each one before payment</span></div>' +
      '<div style="font-size:11px;color:var(--text2);display:flex;align-items:center;gap:6px"><span class="edi-dot"></span> Live · ' + SOURCES.length + ' feeds connected</div></div>' +
      '<div style="display:flex;flex-wrap:wrap">' +
      '<div style="flex:1.5;min-width:420px;overflow-x:auto;padding:0 12px 8px"><table style="width:100%"><thead><tr><th>Source</th><th>Cadence</th><th class="right">24h</th><th class="right">Hits</th><th class="right">Last received</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div style="flex:1;min-width:300px;border-left:0.5px solid var(--border2);padding:10px 12px;background:var(--surface);display:flex;flex-direction:column">' +
      '<div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">Incoming registrations</div>' +
      '<div style="flex:1;min-height:420px;position:relative"><div id="edi-feed" style="position:absolute;inset:0;display:flex;flex-direction:column;gap:5px;overflow:hidden"></div></div></div>' +
      '</div></div>';
  }
  function pipelinePanel() {
    var boxes = STAGES.map(function (st, i) {
      return (i ? '<div class="edi-arrow"><i class="ti ti-arrow-right"></i></div>' : '') +
        '<div class="edi-stage"' + (st.k === "hold" ? ' style="background:#3d0f0b"' : '') + '><div style="display:flex;justify-content:space-between;align-items:baseline;gap:6px"><span style="font-weight:600;font-size:12.5px">' + st.t + '</span></div>' +
        '<div class="mono" style="font-size:19px;font-weight:600;margin-top:6px" data-p="' + st.k + '"></div>' +
        '<div style="font-size:10.5px;color:#a6c8ff">' + st.s + '</div>' +
        '<div style="font-size:10.5px;color:#dde1e6;margin-top:6px;min-height:28px;line-height:1.35" data-pd="' + st.k + '"></div></div>';
    }).join("");
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px">' +
      '<div style="font-weight:500;font-size:12.5px"><i class="ti ti-sitemap" style="color:var(--accent-d)"></i> Pipeline <span class="muted" style="font-weight:400;font-size:10.5px">· last 24 hours · registration to payment</span></div>' +
      '<div style="font-size:11px;color:var(--text2);display:flex;align-items:center;gap:6px"><span class="edi-dot"></span> Live · updated <span id="edi-upd">1s ago</span></div></div>' +
      '<div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:2px">' + boxes + '</div>' +
      '<div style="font-size:10.5px;color:var(--text3);margin-top:8px"><i class="ti ti-refresh"></i> Verified registrations pay the same day. Only the ones that fail a check are held, and analyst decisions feed back into the models.</div></div>';
  }

  var liveRun = 0;
  function startLive(root) {
    var run = ++liveRun;
    var S = { src: SOURCES.map(function (x) { return { k: x.k, n: x.n, hits: x.hits, last: Date.now() - Math.round(Math.random() * 40000) }; }),
      p: { reg: 2106, idv: 2092, occ: 2071, insp: 642, score: 2106, flagged: 96, pay: 1842, paid: 14100000, hold: 41, held: 487300 }, feed: [], updated: Date.now() };
    var q = function (sel) { return root.querySelector(sel); };
    var srcOf = function (k) { return S.src.filter(function (x) { return x.k === k; })[0]; };
    var n = function (el, v) { if (!el) return; var t = typeof v === "number" ? v.toLocaleString() : v; if (el.textContent !== t) { el.textContent = t; el.classList.remove("edi-bump"); void el.offsetWidth; el.classList.add("edi-bump"); } };
    var script = [
      { at: 3, ev: { src: "WEB", cls: "hi", txt: "R-104417 · Houma · renter · rental + personal property · $17,280", out: "scored 94 · held for verification" } },
      { at: 7, ev: { src: "PROP", cls: "hi", txt: "Parish assessor · 418 Cypress Bend Rd, Houma", out: "owner of record registered separately" } },
      { at: 11, ev: { src: "DEV", cls: "md", txt: "Device D-7F3A · registration session", out: "31 registrations in 48 hours" } }
    ];
    function paint() {
      S.src.forEach(function (x) {
        n(q('[data-src-n="' + x.k + '"]'), x.n);
        var h = q('[data-src-h="' + x.k + '"]');
        if (h) h.innerHTML = x.hits ? '<span class="tag" style="background:var(--high-bg);color:var(--high-tx)">' + x.hits + '</span>' : '<span style="color:var(--text3);font-size:11px">0</span>';
        var a = q('[data-src-a="' + x.k + '"]'); if (a) a.textContent = ago(x.last);
      });
      var P = S.p;
      n(q('[data-p="reg"]'), P.reg); n(q('[data-p="idv"]'), P.idv); n(q('[data-p="occ"]'), P.occ); n(q('[data-p="insp"]'), P.insp); n(q('[data-p="score"]'), P.score); n(q('[data-p="pay"]'), P.pay); n(q('[data-p="hold"]'), P.hold);
      var d = function (k, html) { var el = q('[data-pd="' + k + '"]'); if (el) el.innerHTML = html; };
      d("reg", "online · helpline · recovery centers");
      d("idv", '<span style="color:#ffb4a8">' + (P.reg - P.idv) + ' not verified</span> · death & prisoner records');
      d("occ", "assessor · USPS · utilities");
      d("insp", "remote and on-site");
      d("score", '<span style="color:#ffd27a;font-weight:600">' + P.flagged + ' flagged</span> · median 1.6s to score');
      d("pay", money(P.paid) + " · " + Math.round(F.INTAKE.sameDay * 100) + "% same day");
      d("hold", '<span style="color:#ffb4a8">' + money(P.held) + '</span> held pending verification');
      var u = q("#edi-upd"); if (u) u.textContent = ago(S.updated);
    }
    function push(ev) {
      var feed = q("#edi-feed"); if (!feed) return;
      var tone = ev.cls === "hi" ? "background:var(--high-bg);color:var(--high-tx)" : ev.cls === "md" ? "background:var(--med-bg);color:var(--med-tx)" : ev.cls === "ok" ? "background:var(--low-bg);color:var(--low-tx)" : "background:var(--card);color:var(--text2)";
      var t = new Date(), ts = ("0" + t.getHours()).slice(-2) + ":" + ("0" + t.getMinutes()).slice(-2) + ":" + ("0" + t.getSeconds()).slice(-2);
      var row = document.createElement("div");
      row.className = "edi-ev";
      row.style.cssText = "display:flex;gap:7px;align-items:flex-start;font-size:11px;line-height:1.35;padding:5px 7px;border-radius:6px;background:var(--card);border:0.5px solid var(--border2)";
      row.innerHTML = '<span class="mono" style="color:var(--text3);font-size:10px;padding-top:1px">' + ts + '</span>' +
        '<span class="mono" style="font-size:9.5px;font-weight:600;padding:1px 5px;border-radius:4px;background:var(--surface);color:var(--accent-d);min-width:34px;text-align:center">' + ev.src + '</span>' +
        '<span style="flex:1"><span>' + esc(ev.txt) + '</span><br><span style="font-size:10.5px;padding:0 4px;border-radius:3px;' + tone + '">→ ' + esc(ev.out) + '</span></span>';
      feed.insertBefore(row, feed.firstChild);
      while (feed.children.length > 1 && feed.scrollHeight > feed.clientHeight + 1) feed.removeChild(feed.lastChild);
    }
    function regEvent() {
      var P = S.p, ch = pick(["web", "web", "web", "tel", "drc"]), x = srcOf(ch); x.n++; x.last = Date.now(); P.reg++; P.score++;
      ["idv", "dnp", "prop", "usps", "geo", "dev"].forEach(function (k) { var s = srcOf(k); s.n++; s.last = Date.now(); });
      var renter = Math.random() < 0.42, amt = renter ? 790 + Math.random() * 6000 : 790 + Math.random() * 22000;
      var who = pick(FIRST) + " " + pick(LAST).charAt(0) + ".", town = pick(TOWNS);
      var txt = "R-" + (104500 + Math.floor(Math.random() * 400)) + " · " + town + " · " + (renter ? "renter" : "owner") + " · " + money(amt);
      var r = Math.random();
      if (r < 0.04) { P.flagged++; P.hold++; P.held += amt; return { src: ch.toUpperCase(), cls: "md", txt: txt, out: pick(["scored " + (78 + Math.floor(Math.random() * 15)) + " · held · lease template match", "scored " + (72 + Math.floor(Math.random() * 15)) + " · held · shared deposit account", "scored " + (80 + Math.floor(Math.random() * 12)) + " · held · address outside declared area"]) }; }
      P.idv++; P.occ++;
      if (r < 0.12) return { src: ch.toUpperCase(), cls: "", txt: txt, out: "scored " + (30 + Math.floor(Math.random() * 30)) + " · inspection scheduled" };
      P.pay++; P.paid += amt;
      return { src: ch.toUpperCase(), cls: "ok", txt: txt, out: "scored " + (3 + Math.floor(Math.random() * 25)) + " · verified · paid today" };
    }
    function otherEvent() {
      var r = Math.random();
      if (r < 0.4) { var i = srcOf("insp"); i.n++; i.last = Date.now(); S.p.insp++; return { src: "INSP", cls: "", txt: "Inspection · " + pick(TOWNS) + " · " + pick(["roof", "flooring", "HVAC", "water heater", "contents"]), out: "damage confirmed" }; }
      if (r < 0.65) { var b = srcOf("bank"); b.n++; b.last = Date.now(); return { src: "BANK", cls: "", txt: "Deposit account · owner match", out: "name matches registrant" }; }
      if (r < 0.85) { var s = srcOf("ins"); s.n++; s.last = Date.now(); return { src: "INS", cls: "", txt: "Insurance · " + pick(["flood policy", "homeowner policy"]) + " · " + pick(TOWNS), out: pick(["no settlement for this loss", "settlement pending · award adjusted"]) }; }
      var sb = srcOf("sba"); sb.n++; sb.last = Date.now(); return { src: "SBA", cls: "", txt: "SBA disaster loan · " + pick(TOWNS), out: "no overlap with IHP award" };
    }
    paint();
    for (var i = 0; i < 18; i++) push(Math.random() < 0.65 ? regEvent() : otherEvent());
    paint();
    var tick = 0;
    var timer = setInterval(function () {
      if (run !== liveRun || !document.body.contains(root) || !root.querySelector("#edi-feed")) { clearInterval(timer); return; }
      tick++;
      var sc = script.filter(function (x) { return x.at === tick; })[0];
      if (sc) {
        push(sc.ev); S.updated = Date.now();
        if (sc.ev.src === "WEB") { S.p.reg++; S.p.score++; S.p.flagged++; S.p.hold++; S.p.held += 17280; srcOf("web").n++; srcOf("web").last = Date.now(); }
        if (sc.ev.src === "PROP") { srcOf("prop").hits++; srcOf("prop").last = Date.now(); }
        if (sc.ev.src === "DEV") { srcOf("dev").hits++; srcOf("dev").last = Date.now(); }
      } else if (Math.random() < 0.85) { push(Math.random() < 0.68 ? regEvent() : otherEvent()); S.updated = Date.now(); }
      paint();
    }, 1400);
  }

  function sparkline(data) {
    var w = 260, h = 44, max = Math.max.apply(null, data);
    var pts = data.map(function (v, i) { return (i / (data.length - 1) * w).toFixed(1) + "," + (h - v / max * (h - 6) - 3).toFixed(1); }).join(" ");
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" preserveAspectRatio="none" style="max-width:100%"><polyline points="' + pts + '" fill="none" stroke="var(--accent-d)" stroke-width="1.6"/></svg>';
  }

  window.Views.edi = {
    render: function (mount) {
      var D = F.PRIMARY, I = F.INTAKE;
      // daily registrations since the declaration: a surge, then a long tail
      var trend = [1200, 6400, 9800, 8100, 6200, 4900, 3900, 3300, 2900, 2600, 2350, 2200, 2150, 2100];
      mount.innerHTML = liveCss +
        '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div style="font-weight:600;font-size:14px"><i class="ti ti-tornado" style="color:var(--accent-d)"></i> Registration intake <span class="muted" style="font-weight:400;font-size:11.5px">· ' + esc(D.name) + ' · ' + D.stateName + '</span></div>' +
        '<span class="tag mono" style="background:var(--surface)">' + D.id + ' · declared ' + D.declared + '</span></div>' +
        '<div style="font-size:11px;color:var(--text2);margin-top:4px">Individuals and Households Program · registration period open until ' + D.deadline + ' · ' + F.PROGRAM.fy + ' caps ' + window.DP.usd(F.PROGRAM.haMax) + ' housing / ' + window.DP.usd(F.PROGRAM.onaMax) + ' other needs.</div></div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
        kpi("Registrations", num(I.registrations), "since " + D.declared) +
        kpi("IHP approved", "$" + (I.approved / 1e6).toFixed(1) + "M", "to date") +
        kpi("Paid the same day", Math.round(I.sameDay * 100) + "%", "verified registrations") +
        kpi("Held for verification", num(I.held), "failed a check · not paid yet") +
        kpi("Inspections", num(I.inspections), "remote and on-site") +
        '</div>' +
        sourcesPanel() +
        '<div class="card"><div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px"><div style="font-weight:500;font-size:12.5px"><i class="ti ti-chart-line" style="color:var(--accent-d)"></i> Registrations per day <span class="muted" style="font-weight:400;font-size:10.5px">· the surge after landfall, then the long tail</span></div>' + sparkline(trend) + '</div></div>' +
        pipelinePanel() +
        '</div>';
      startLive(mount);
    }
  };
})();
