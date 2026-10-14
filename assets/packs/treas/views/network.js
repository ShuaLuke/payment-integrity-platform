/* Treasury pack · Insights › Networks.
   All networks: the funnel from one held payment to every detected network, the
   map of all networks and their cross-network links, the split by scheme type,
   and the network table. A network: a layered graph — organizer → account
   batches → payments → the agencies that certified them — down to the payment,
   with TrackLight's badges on people who aren't who the payment says (deceased,
   in custody, identity stolen) and a link where one identity uses two accounts.
   Adapted from the Preparedness Grants network view (shared-component debt, see
   docs/ARCHITECTURE.md §7). Replaces Views.network. Data: treas-data.js. */
(function () {
  window.Views = window.Views || {};
  var F = window.TREAS;
  var esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  function big(n) { var t = function (x) { return String(x < 10 ? Math.round(x * 100) / 100 : Math.round(x * 10) / 10); }; return n >= 1e9 ? "$" + t(n / 1e9) + "B" : n >= 1e6 ? "$" + t(n / 1e6) + "M" : n >= 1e5 ? "$" + Math.round(n / 1e3) + "K" : usd(n); }
  var STATUS_TONE = { "New": ["var(--surface)", "var(--text2)"], "Under review": ["var(--med-bg)", "var(--med-tx)"], "Case open": ["var(--accent-l)", "var(--accent-d)"], "Referred to OIG": ["var(--high-bg)", "var(--high-tx)"] };
  var ovFilter = { scheme: "" };

  window.Views.network = {
    // the network drawn inside a payment's record, that payment marked
    embed: function (el, netId, currentId, H) {
      var n = F.net(netId); if (!n) return;
      var m = netId === "N01" ? coreModel() : seedModel(n);
      if (currentId && !m.regs.some(function (r) { return r.id === currentId; })) {
        var l = F.lead(currentId);
        if (l) m.regs.unshift({ id: l.id, mid: m.mids[0].id, bot: l.program, amount: l.amount, seed: false, name: l.payee, program: l.prog.short, acct: l.acct, state: l.mode === "prepay" ? "held" : "paid" });
      }
      m.regs.forEach(function (r) { r.cur = r.id === currentId; });
      el.style.height = H + "px"; el.style.position = "relative";
      drawLayered(el, m, H);
      return m;
    },
    render: function (mount) {
      var btn = function (id, label, sub) { return '<button class="nscn" data-scn="' + id + '" style="border:none;background:none;border-radius:6px;padding:5px 11px;font-size:12px;cursor:pointer;color:var(--text2);font-family:var(--sans);display:flex;flex-direction:column;align-items:flex-start;line-height:1.2"><span style="font-weight:500">' + label + '</span><span style="font-size:9.5px;color:var(--text3)">' + sub + '</span></button>'; };
      mount.innerHTML = '<div class="page">' +
        '<div class="page-head"><div><div class="page-title">Payment networks</div><div class="page-sub" id="n-sub">Payees linked by an account batch, mailbox, phone, employer or preparer — across agencies and payment types.</div></div>' +
        '<div style="display:flex;gap:10px;align-items:center"><div style="display:flex;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px">' + btn("all", "All networks", F.NETS.length + " detected") + btn("N01", "Delmont network", "IRS · SSA · OPM · 9 account batches") + '</div>' + window.EXPORT.group("fnw") + '</div></div>' +
        '<div id="n-overview" hidden></div><div id="n-back" hidden style="margin-bottom:8px"></div>' +
        '<div class="canvas" id="n-canvas" style="position:relative"></div><div class="legend" id="n-legend"></div><div id="n-boxes" style="display:flex;gap:10px;margin-top:4px;flex-wrap:wrap"></div><div id="n-extra"></div></div>';
      var current = "all";
      function setActive(s) { mount.querySelectorAll(".nscn").forEach(function (b) { var on = b.getAttribute("data-scn") === s; b.style.background = on ? "var(--card)" : "none"; b.style.color = on ? "var(--ink)" : "var(--text2)"; b.style.boxShadow = on ? "0 1px 2px rgba(0,17,65,.08)" : "none"; }); }
      function paint(scn) {
        current = scn; setActive(scn === "N01" ? "N01" : "all");
        var ov = document.getElementById("n-overview"), cv = document.getElementById("n-canvas"), back = document.getElementById("n-back"), lg = document.getElementById("n-legend"), bx = document.getElementById("n-boxes");
        ov.hidden = scn !== "all"; cv.hidden = scn === "all"; lg.hidden = scn === "all"; back.hidden = scn === "all";
        var hist = window.APP.state.hist || [], last = hist[hist.length - 1], fromRec = last && last.view === "claim" && last.allegationId;
        back.innerHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap">' + (fromRec ? '<button class="btn primary" id="n-back-rec"><i class="ti ti-arrow-left"></i> Back to payment ' + esc(fromRec) + '</button>' : '') + '<button class="btn" id="n-back-btn">' + (fromRec ? '' : '<i class="ti ti-arrow-left"></i> ') + 'All networks</button></div>';
        document.getElementById("n-back-btn").onclick = function () { paint("all"); };
        var nbr = document.getElementById("n-back-rec"); if (nbr) nbr.onclick = function () { window.APP.goBack(); };
        if (scn === "all") { ov.innerHTML = overviewHtml(); bx.innerHTML = ""; document.getElementById("n-extra").innerHTML = ""; wireOverview(ov, paint); return; }
        var m = scn === "N01" ? coreModel() : seedModel(F.net(scn));
        cv.style.height = "520px";
        lg.innerHTML = legendHtml(m);
        bx.innerHTML = boxesHtml(F.net(scn), m);
        document.getElementById("n-extra").innerHTML = m.core ? discoveryHtml() : "";
        var rf = document.getElementById("n-refer"); if (rf) rf.onclick = function () { window.APP.openNetReferral("network", scn); };
        drawLayered(cv, m, 520);
        var ph = document.getElementById("n-phone"), phoneOff = false;
        if (ph) ph.onclick = function () {
          phoneOff = !phoneOff;
          var dim = ["A3", "A6"]; // the batches the phone fed: benefit and annuity redirects
          cv.querySelectorAll(".nmid, .nreg, .nedge").forEach(function (el) { var hit = dim.some(function (b) { return el.classList.contains("nmid-" + b) || el.classList.contains("nreg-" + b) || el.classList.contains("nedge-" + b); }); el.style.opacity = phoneOff && hit ? 0.15 : ""; });
          ph.innerHTML = phoneOff ? "Put the phone back" : "Take away the phone";
          document.getElementById("n-phone-txt").innerHTML = phoneOff ? '<b style="color:var(--ink)">It holds.</b> Without the phone, the two redirect batches drop out: 62 accounts, 278 payments, $1.8M. The mailbox, the other seven batches and the eight employers still tie <b>' + (F.net("N01").payees - 62) + ' payees and ' + F.bigUsd(F.net("N01").atRisk - 1800000) + '</b> together, and the held refund is still in it.' : 'A real ring rotates burner phones. Ours reused one number for 37 changes, which is convenient. Take it away and see what\'s left.';
        };
      }
      mount.querySelectorAll(".nscn").forEach(function (b) { b.onclick = function () { paint(b.getAttribute("data-scn")); }; });
      var head = ["Network", "Scheme", "Agencies", "States", "Payees", "Payments", "At risk (" + F.PLAN.fys + ")", "Status", "Risk"];
      var rows = function () { return F.NETS.map(function (n) { return [n.name, F.SCHEMES[n.scheme].label, n.agencies.join(" / "), n.states.join("/"), n.payees, n.payments, n.atRisk, n.status, n.risk]; }); };
      window.EXPORT.wire("fnw", {
        csv: function () { window.EXPORT.csv("fraud-networks", head, rows()); },
        xls: function () { window.EXPORT.xls("fraud-networks", "Networks", head, rows()); },
        pdf: function () { var S = F.stats(); window.EXPORT.pdf("Detected payment networks", "<div class='sub'>" + S.networks + " networks · " + S.payees + " payees · " + big(S.atRisk) + " at risk · " + F.PLAN.fys + "</div>" + window.EXPORT.tableHtml(head, rows())); }
      });
      paint(window.APP.state.networkScenario || "all");
      window.APP.state.networkScenario = null;
    }
  };

  // ---------- overview ----------
  function tile(label, val, sub) { return '<div class="card" style="flex:1;min-width:140px;margin:0"><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">' + label + '</div><div style="font-weight:600;font-size:22px;margin-top:2px;font-variant-numeric:tabular-nums">' + val + '</div>' + (sub ? '<div style="font-size:11px;color:var(--text2);margin-top:1px">' + sub + '</div>' : '') + '</div>'; }
  function overviewHtml() {
    var S = F.stats();
    var byScheme = F.SCHEME_ORDER.map(function (k) { var rs = F.NETS.filter(function (n) { return n.scheme === k; }); return { k: k, n: rs.length, atRisk: rs.reduce(function (t, n) { return t + n.atRisk; }, 0), regs: rs.reduce(function (t, n) { return t + n.payees; }, 0) }; });
    var maxS = Math.max.apply(null, byScheme.map(function (b) { return b.atRisk; }));
    var bars = byScheme.map(function (b) {
      var sc = F.SCHEMES[b.k];
      return '<div style="display:grid;grid-template-columns:minmax(170px,230px) 1fr 190px;gap:10px;align-items:center;padding:5px 0"><div style="font-size:12px"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + sc.color + ';margin-right:6px"></span>' + esc(sc.label) + ' <span class="muted" style="font-size:10.5px">· ' + b.n + '</span></div>' +
        '<div style="height:16px;background:var(--surface);border-radius:4px;overflow:hidden"><div style="width:' + (b.atRisk / maxS * 100) + '%;height:100%;background:' + sc.color + ';opacity:.85"></div></div>' +
        '<div class="mono" style="font-size:11px;text-align:right">' + big(b.atRisk) + ' · ' + b.regs + ' payees</div></div>';
    }).join("");
    var chip = function (v, l) { var on = ovFilter.scheme === v; return '<button class="qscope nv-f' + (on ? " active" : "") + '" data-v="' + v + '">' + l + '</button>'; };
    return '<div style="display:flex;flex-direction:column;gap:10px">' + funnelHtml() +
      '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
      tile("Networks detected", S.networks, "refunds · redirection · vendor changes · mule accounts") +
      tile("Span more than one agency", S.cross + ' <span style="font-size:14px;color:var(--text2);font-weight:500">· ' + S.crossPct + '%</span>', "invisible to any one agency") +
      tile("Payees involved", S.payees.toLocaleString(), "across " + F.PLAN.states + " states") +
      tile("Identified at risk", big(S.atRisk), F.PLAN.fys + " · " + S.payments.toLocaleString() + " payments") +
      '</div>' +
      '<div class="card" style="padding:0;overflow:hidden">' +
      '<div style="padding:9px 12px;border-bottom:0.5px solid var(--border2);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
      '<div style="font-weight:500;font-size:12.5px"><i class="ti ti-chart-dots-3" style="color:var(--accent-d)"></i> Everything connected <span class="muted" style="font-weight:400;font-size:10.5px">· ' + S.networks + ' networks · ' + big(S.atRisk) + ' at risk · ' + F.BRIDGES.length + ' cross-network links · ' + F.PLAN.states + ' states</span></div>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><div style="font-size:10.5px;color:var(--text3)"><i class="ti ti-pointer"></i> Delmont in the middle, the networks linked to it beside it · click a hub to open it</div>' + allReferBtn() + '</div></div>' +
      '<div id="nv-map" style="position:relative;height:540px;background:var(--surface)"></div>' +
      '<div class="legend" style="margin:0;padding:8px 12px;border-top:0.5px solid var(--border2)">' + mapLegend() + '</div></div>' +
      '<div class="card"><div style="font-weight:500;font-size:12.5px;margin-bottom:4px"><i class="ti ti-category" style="color:var(--accent-d)"></i> At risk by scheme type</div>' + bars + '</div>' +
      '<div class="card" style="padding:0;overflow:hidden"><div style="padding:9px 12px;border-bottom:0.5px solid var(--border2);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div style="font-weight:500;font-size:12.5px"><i class="ti ti-affiliate" style="color:var(--accent-d)"></i> Networks <span class="muted" style="font-weight:400;font-size:10.5px">· click a row to open its graph</span></div>' +
      '<div style="display:flex;gap:2px;flex-wrap:wrap;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px">' + chip("", "All") + F.SCHEME_ORDER.map(function (k) { return chip(k, F.SCHEMES[k].short); }).join("") + '</div></div>' +
      '<div style="overflow-x:auto"><table style="width:100%"><thead><tr><th>Network</th><th>Scheme</th><th>Agencies</th><th class="right">Payees</th><th class="right">At risk · ' + F.PLAN.fys + '</th><th>Status</th><th class="right">Risk</th></tr></thead><tbody id="nv-body">' + rowsHtml() + '</tbody></table></div></div>' +
      '</div>';
  }
  function allReferBtn() {
    var refs = F.netRefsOf("all"), dec = refs.filter(function (r) { return r.decision; }).length;
    return '<button class="btn' + (refs.length ? '' : ' primary') + '" id="nv-refer-all" style="font-size:11px;padding:3px 9px"><i class="ti ti-' + (refs.length ? 'package' : 'send') + '"></i> ' + (refs.length ? 'Referred to ' + refs.length + ' agencies' + (dec ? ' · ' + dec + ' acted' : '') : 'Refer every network to its agencies') + '</button>';
  }
  function rowsHtml() {
    return F.NETS.filter(function (n) { return !ovFilter.scheme || n.scheme === ovFilter.scheme; }).slice().sort(function (a, b) { return b.atRisk - a.atRisk; }).map(function (n) {
      var tone = STATUS_TONE[n.status] || STATUS_TONE.New;
      return '<tr class="nv-row" data-id="' + n.id + '" style="cursor:pointer"><td><div style="font-weight:500">' + esc(n.name) + '</div><div style="font-size:10.5px;color:var(--text3)">' + n.states.join(", ") + '</div></td>' +
        '<td style="font-size:11.5px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + F.SCHEMES[n.scheme].color + ';margin-right:5px"></span>' + esc(F.SCHEMES[n.scheme].short) + '</td>' +
        '<td>' + n.agencies.map(function (d) { return '<span class="tag mono" style="font-size:10px" title="' + esc(F.AGENCIES[d].name) + '">' + d + '</span>'; }).join(" ") + (n.crossAgency ? ' <i class="ti ti-arrows-exchange" title="Spans agencies" style="color:var(--text3);font-size:12px"></i>' : '') + '</td>' +
        '<td class="right mono">' + n.payees + '</td><td class="right mono" style="font-weight:600">' + big(n.atRisk) + '</td>' +
        '<td><span class="pill" style="background:' + tone[0] + ';color:' + tone[1] + ';font-size:10.5px">' + esc(n.status) + '</span></td><td class="right">' + window.UI.riskChip(n.risk) + '</td></tr>';
    }).join("");
  }
  function wireOverview(ov, paint) {
    var wireRows = function () { ov.querySelectorAll(".nv-row").forEach(function (tr) { tr.onclick = function () { paint(tr.getAttribute("data-id")); window.scrollTo(0, 0); }; }); };
    ov.querySelectorAll(".nv-f").forEach(function (b) { b.onclick = function () { ovFilter.scheme = b.getAttribute("data-v"); ov.querySelectorAll(".nv-f").forEach(function (x) { x.classList.toggle("active", x === b); }); ov.querySelector("#nv-body").innerHTML = rowsHtml(); wireRows(); }; });
    wireRows();
    ov.querySelectorAll(".fn-stage").forEach(function (el) {
      el.onclick = function () {
        var k = el.getAttribute("data-k");
        if (k === "reg") window.APP.openAllegation(F.SEED);
        else if (k === "store") window.APP.openAllegation(F.THREAD);
        else if (k === "network") { paint("N01"); window.scrollTo(0, 0); }
        else { var m = ov.querySelector(k === "linked" ? "#nv-map" : "#nv-body"); if (m) m.scrollIntoView({ behavior: "smooth", block: "center" }); }
      };
    });
    drawMap(ov.querySelector("#nv-map"), paint);
    var ra = ov.querySelector("#nv-refer-all"); if (ra) ra.onclick = function () { window.APP.openNetReferral("all"); };
  }

  // ---------- the funnel: one payment → every network ----------
  function funnelHtml() {
    var Fn = F.funnel(), S = F.stats(), total = S.atRisk, hours = Math.round(S.payments * F.PLAN.minutesPerPayment / 60);
    var stages = Fn.map(function (f, i) {
      var last = i === Fn.length - 1, mult = i ? Math.round(f.amount / Fn[i - 1].amount) : 0;
      return (i ? '<div class="fn-arrow" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--text3);min-width:34px"><i class="ti ti-chevron-right" style="font-size:16px"></i><span class="mono" style="font-size:11.5px;font-weight:600;color:var(--accent-d)">×' + mult + '</span></div>' : '') +
        '<div class="fn-stage" data-k="' + f.key + '" style="flex:1;min-width:128px;border-radius:8px;padding:9px 10px;cursor:pointer;' + (i === 0 ? 'background:var(--high-bg);border:0.5px solid #f3c9c9' : last ? 'background:#001141;color:#fff' : 'background:var(--surface);border:0.5px solid var(--border)') + '">' +
        '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;' + (last ? 'color:#78a9ff' : i === 0 ? 'color:var(--high-tx)' : 'color:var(--text3)') + '">' + esc(f.label) + '</div>' +
        '<div style="font-weight:600;font-size:' + (last ? 24 : 19) + 'px;margin-top:2px;font-variant-numeric:tabular-nums">' + (i === 0 ? usd(f.amount) : big(f.amount)) + '</div>' +
        '<div style="font-size:10.5px;line-height:1.35;margin-top:2px;' + (last ? 'color:#dde1e6' : 'color:var(--text2)') + '">' + esc(f.detail) + '</div>' +
        '<div class="mono" style="font-size:9.5px;margin-top:3px;' + (last ? 'color:#c1c7cd' : 'color:var(--text3)') + '">' + esc(f.count) + '</div></div>';
    }).join("");
    return '<div class="card" id="nv-funnel" style="margin:0">' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:8px"><div style="font-weight:600;font-size:13.5px"><i class="ti ti-zoom-money" style="color:var(--accent-d)"></i> From one held payment to ' + big(total) + '</div>' +
      '<div style="font-size:10.5px;color:var(--text3)">' + F.PLAN.states + ' states · ' + F.PLAN.fys + '</div></div>' +
      '<div style="display:flex;align-items:stretch;overflow-x:auto;padding-bottom:2px">' + stages + '</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">' +
      '<div style="flex:1;min-width:240px;border:0.5px dashed var(--border);border-radius:8px;padding:9px 11px;color:var(--text2)"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--text3)"><i class="ti ti-list-details"></i> One payment at a time</div>' +
      '<div style="font-size:12px;line-height:1.5;margin-top:3px">Finding ' + big(total) + ' one payment at a time means picking <b>' + S.payments.toLocaleString() + ' payments</b> out of more than a billion a year, about <b>' + hours.toLocaleString() + ' analyst hours</b> once found, and still missing the account batches, mailboxes and phones that tie them together across agencies.</div></div>' +
      '<div style="flex:1;min-width:240px;background:var(--accent-l);border:0.5px solid var(--accent);border-radius:8px;padding:9px 11px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--accent-d)"><i class="ti ti-affiliate"></i> Network first</div>' +
      '<div style="font-size:12px;line-height:1.5;margin-top:3px;color:var(--ink)">One flag opens the network. Analysts work <b>' + S.networks + ' cases</b>, each with its evidence already assembled, and the other 99.96% of payments go out on schedule.</div></div></div>' +
      '<div style="font-size:10.5px;color:var(--text3);margin-top:8px"><i class="ti ti-info-circle"></i> For context: in April 2026, federal prosecutors charged a stolen-identity scheme that filed more than 300 false returns seeking over $100 million in refunds (DOJ). Demo figures are synthetic.</div></div>';
  }

  // ---------- the map ----------
  function mapLegend() {
    var dot = function (c, bg, label, r) { return '<span class="lg"><span style="display:inline-block;width:' + r + 'px;height:' + r + 'px;border-radius:50%;background:' + bg + ';border:2px solid ' + c + '"></span>' + label + '</span>'; };
    return F.SCHEME_ORDER.map(function (k) { return dot(F.SCHEMES[k].color, "#001141", F.SCHEMES[k].hub, 11); }).join("") + dot("#c6362f", "#fbe3e3", "Account batch / cluster", 9) + dot("#1192e8", "#bae6ff", "Payee", 7) +
      '<span class="lg"><span style="width:18px;height:0;border-top:2px dashed #d9480f"></span>Cross-network link</span><span class="lg" style="color:var(--text3)">Hub size = dollars at risk</span>';
  }
  function shortHub(n) { n = String(n || ""); return n.length > 26 ? n.slice(0, 25) + "…" : n; }
  function twoLines(n) { n = String(n || ""); if (n.length <= 19) return [n]; var i = n.lastIndexOf(" ", 19); if (i < 8) i = n.indexOf(" ", 19); return i > 0 ? [n.slice(0, i), n.slice(i + 1)] : [n]; }
  function drawMap(el, paint) {
    if (!el) return;
    if (typeof d3 === "undefined") { setTimeout(function () { drawMap(el, paint); }, 80); return; }
    var G = F.fullGraph(), W = el.clientWidth || 1000, H = el.clientHeight || 540;
    d3.select(el).selectAll("*").remove();
    var hubs = G.nodes.filter(function (n) { return n.kind === "hub"; }), hubOf = {}; hubs.forEach(function (h) { hubOf[h.net] = h; });
    var maxR = d3.max(hubs, function (n) { return n.atRisk; }) || 1;
    var R = function (n) { return n.kind === "hub" ? 11 + 24 * Math.sqrt(n.atRisk / maxR) : n.kind === "spoke" ? 5.5 : 2.8; };
    var pcol = function (r) { return r >= 80 ? "#c6362f" : r >= 50 ? "#c77d11" : "#001141"; };
    // layout with meaning: the core network in the middle, the networks linked to it beside it,
    // every other network on a ring, grouped by scheme type
    var core = "N01", linked = F.linked(core).filter(function (n) { return n.id !== core; }).map(function (n) { return n.id; });
    var cx = W / 2, cy = H / 2 - 6;
    hubOf[core].fx = cx; hubOf[core].fy = cy;
    linked.forEach(function (id, i) { var a = i === 0 ? 0 : Math.PI; hubOf[id].fx = cx + Math.cos(a) * 185; hubOf[id].fy = cy + Math.sin(a) * 185 * 0.35 + 30; });
    // clockwise from the top: networks that share a link sit next to each other, and the one
    // linked to Ridgeway (on Delmont's right) sits on the right
    var RING = ["N06", "N13", "N14", "N05", "N10", "N03", "N09", "N12", "N02", "N08", "N11"];
    var ring = RING.filter(function (id) { return hubOf[id] && id !== core && linked.indexOf(id) < 0; });
    F.NETS.forEach(function (n) { if (ring.indexOf(n.id) < 0 && n.id !== core && linked.indexOf(n.id) < 0) ring.push(n.id); });
    var rx = W * 0.41, ry = H * 0.37;
    ring.forEach(function (id, i) { var a = -Math.PI / 2 + i / ring.length * Math.PI * 2; hubOf[id].fx = cx + Math.cos(a) * rx; hubOf[id].fy = cy + Math.sin(a) * ry; });
    hubs.forEach(function (h) { h.x = h.fx; h.y = h.fy; });
    G.nodes.forEach(function (n) { if (n.kind !== "hub") { var h = hubOf[n.net]; n.x = h.x + (Math.random() - 0.5) * 30; n.y = h.y + (Math.random() - 0.5) * 30; } });
    var svg = d3.select(el).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H).style("display", "block").style("font-family", "IBM Plex Sans,sans-serif");
    var gL = svg.append("g"), gN = svg.append("g"), gT = svg.append("g"), gB = svg.append("g");
    var lk = gL.selectAll("line").data(G.links).join("line")
      .attr("stroke", function (d) { return d.kind === "bridge" ? "#d9480f" : d.kind === "hub" ? "#9aa8b6" : "#c9d3dc"; })
      .attr("stroke-width", function (d) { return d.kind === "bridge" ? (d.source.net === core || d.target.net === core || d.source === "H-" + core || d.target === "H-" + core ? 2.6 : 1.8) : d.kind === "hub" ? 1.1 : 0.7; })
      .attr("stroke-dasharray", function (d) { return d.kind === "bridge" ? "6,4" : null; });
    var hit = gL.selectAll("line.hit").data(G.links.filter(function (d) { return d.kind === "bridge"; })).join("line").attr("class", "hit").attr("stroke", "transparent").attr("stroke-width", 12).style("cursor", "help");
    var nd = gN.selectAll("circle").data(G.nodes).join("circle").attr("r", R)
      .attr("fill", function (d) { return d.kind === "hub" ? "#001141" : d.kind === "spoke" ? pcol(d.risk) + "33" : "#bae6ff"; })
      .attr("stroke", function (d) { return d.kind === "hub" ? F.SCHEMES[d.scheme].color : d.kind === "spoke" ? pcol(d.risk) : "#1192e8"; })
      .attr("stroke-width", function (d) { return d.kind === "hub" ? (d.net === core ? 4 : 3) : d.kind === "spoke" ? 1.3 : 0.8; })
      .style("cursor", function (d) { return d.kind === "hub" ? "pointer" : "default"; });
    // labels under each hub: the name (two lines if long) and its dollars
    var lab = gT.selectAll("g").data(hubs).join("g").style("pointer-events", "none").attr("paint-order", "stroke").attr("stroke", "#f4f6f8").attr("stroke-width", 3.5).attr("text-anchor", "middle");
    lab.each(function (d) {
      var g = d3.select(this), lines = twoLines(d.name), core1 = d.net === core;
      lines.forEach(function (t, i) { g.append("text").attr("dy", 12 + i * 12).attr("font-size", core1 ? 11.5 : 10.5).attr("font-weight", 600).attr("fill", "#001141").text(t); });
      g.append("text").attr("dy", 12 + lines.length * 12).attr("font-size", 10).attr("font-weight", 600).attr("fill", core1 ? "#c6362f" : "#4d5358").attr("font-family", "IBM Plex Mono,monospace").text(big(d.atRisk));
    });
    // Delmont's links say what they share, always
    var coreBridges = G.links.filter(function (d) { return d.kind === "bridge" && (d.source === "H-" + core || d.target === "H-" + core); });
    var blab = gB.selectAll("text").data(coreBridges).join("text").attr("text-anchor", "middle").attr("font-size", 9.5).attr("font-weight", 600).attr("fill", "#b03a0e").attr("paint-order", "stroke").attr("stroke", "#f4f6f8").attr("stroke-width", 3.5).style("pointer-events", "none").text(function (d) { return d.type.toLowerCase(); });
    var sim = d3.forceSimulation(G.nodes)
      .force("link", d3.forceLink(G.links).id(function (d) { return d.id; }).distance(function (l) { return l.kind === "hub" ? 26 : 13; }).strength(function (l) { return l.kind === "bridge" ? 0 : 1; }))
      .force("charge", d3.forceManyBody().strength(function (d) { return d.kind === "spoke" ? -40 : d.kind === "reg" ? -9 : -60; }).distanceMax(60))
      .force("collide", d3.forceCollide().radius(function (d) { return R(d) + (d.kind === "hub" ? 4 : 1.5); }));
    function ticked() {
      G.nodes.forEach(function (n) { if (n.kind === "hub") return; var r = R(n) + 2; n.x = Math.max(r, Math.min(W - r, n.x)); n.y = Math.max(r + 12, Math.min(H - r, n.y)); });
      lk.attr("x1", function (d) { return d.source.x; }).attr("y1", function (d) { return d.source.y; }).attr("x2", function (d) { return d.target.x; }).attr("y2", function (d) { return d.target.y; });
      hit.attr("x1", function (d) { return d.source.x; }).attr("y1", function (d) { return d.source.y; }).attr("x2", function (d) { return d.target.x; }).attr("y2", function (d) { return d.target.y; });
      nd.attr("cx", function (d) { return d.x; }).attr("cy", function (d) { return d.y; });
      lab.attr("transform", function (d) { return "translate(" + d.x + "," + (d.y + R(d)) + ")"; });
      blab.attr("x", function (d) { return (d.source.x + d.target.x) / 2; }).attr("y", function (d) { return (d.source.y + d.target.y) / 2 - 7; });
    }
    sim.on("tick", function () { if (!document.body.contains(el)) { sim.stop(); return; } ticked(); });
    ticked();
    // the numbers, where the eye is: the linked three, and all fourteen
    var ln = F.linked(core), lsum = ln.reduce(function (t, n) { return t + n.atRisk; }, 0), S = F.stats();
    var call = d3.select(el).append("div").style("position", "absolute").style("left", "12px").style("top", "10px").style("background", "#fff").style("border", "0.5px solid #f3c9c9").style("border-radius", "8px").style("padding", "8px 11px").style("font-size", "11px").style("line-height", "1.45").style("box-shadow", "0 2px 8px rgba(0,17,65,.06)").style("max-width", "250px");
    call.html("<div style='font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#c6362f'>Delmont + " + (ln.length - 1) + " linked networks</div><div style='font-weight:600;font-size:16px;color:#001141'>" + big(lsum) + "</div>" +
      F.BRIDGES.filter(function (b) { return b.a === core || b.b === core; }).map(function (b) { var o = F.net(b.a === core ? b.b : b.a); return "<div style='color:#4d5358;margin-top:2px'><span style='color:#d9480f'>— —</span> " + esc(b.type.toLowerCase()) + " → " + esc(o.name) + "</div>"; }).join(""));
    d3.select(el).append("div").style("position", "absolute").style("right", "12px").style("top", "10px").style("background", "#001141").style("color", "#fff").style("border-radius", "8px").style("padding", "8px 11px").style("font-size", "11px").style("line-height", "1.45").style("text-align", "right")
      .html("<div style='font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#78a9ff'>Every network · " + F.PLAN.fys + "</div><div style='font-weight:600;font-size:16px'>" + big(S.atRisk) + "</div><div style='color:#c1c7cd'>" + S.networks + " networks · " + S.payees.toLocaleString() + " payees · " + F.PLAN.states + " states</div>");
    var tip = d3.select(el).append("div").style("position", "absolute").style("background", "#001141").style("color", "#f2f4f8").style("border-radius", "7px").style("padding", "8px 11px").style("font-size", "11px").style("line-height", "1.45").style("max-width", "270px").style("pointer-events", "none").style("opacity", 0).style("box-shadow", "0 6px 18px rgba(0,0,0,.2)");
    function showTip(e, html) { var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; tip.html(html).style("opacity", 1).style("left", Math.max(4, Math.min(x + 14, W - 280)) + "px"); var th = tip.node().offsetHeight; tip.style("top", (y + th + 16 > H ? Math.max(4, y - th - 12) : y + 12) + "px"); }
    function focusNets(nets) { nd.attr("opacity", function (d) { return nets[d.net] ? 1 : 0.12; }); lab.attr("opacity", function (d) { return nets[d.net] ? 1 : 0.2; }); lk.attr("opacity", function (d) { return nets[d.source.net] && nets[d.target.net] ? 1 : 0.06; }); }
    function reset() { nd.attr("opacity", 1); lab.attr("opacity", 1); lk.attr("opacity", 1); tip.style("opacity", 0); }
    var bridgesOf = function (net) { return F.BRIDGES.filter(function (b) { return b.a === net || b.b === net; }); };
    nd.filter(function (d) { return d.kind === "hub"; })
      .on("mouseover", function (e, d) {
        var nets = {}; nets[d.net] = 1; var br = bridgesOf(d.net); br.forEach(function (b) { nets[b.a] = 1; nets[b.b] = 1; }); focusNets(nets);
        var n = F.net(d.net);
        showTip(e, "<div style='color:#78a9ff;margin-bottom:2px'>" + esc(F.SCHEMES[n.scheme].label) + "</div><b>" + esc(n.name) + "</b><div style='color:#c1c7cd'>" + n.payees + " payees · " + n.agencies.join(", ") + " · " + n.states.join(", ") + "<br>" + big(n.atRisk) + " at risk" + (br.length ? "<br><span style='color:#ffb89a'>Linked to " + br.length + " other network" + (br.length > 1 ? "s" : "") + "</span>" : "") + "<br>Click to open its network</div>");
      }).on("mouseout", reset).on("click", function (e, d) { paint(d.net); window.scrollTo(0, 0); });
    nd.filter(function (d) { return d.kind !== "hub"; }).on("mouseover", function (e, d) {
      var nets = {}; nets[d.net] = 1; focusNets(nets);
      showTip(e, d.kind === "spoke" ? "<div style='color:#ffb4a8;margin-bottom:2px'>" + esc(F.SCHEMES[F.net(d.net).scheme].spoke.replace(/s$/, "")) + "</div><b>" + esc(d.name) + "</b><div style='color:#c1c7cd'>risk " + d.risk + "</div>" : "<div style='color:#82cfff;margin-bottom:2px'>Payee</div><div style='color:#c1c7cd'>Paid into one or more account batches in this network</div>");
    }).on("mouseout", reset);
    hit.on("mouseover", function (e, d) {
      var nets = {}; nets[d.source.net] = 1; nets[d.target.net] = 1; focusNets(nets);
      showTip(e, "<div style='color:#ffb89a;margin-bottom:2px'>Cross-network link · " + esc(d.type) + "</div><b>" + esc(shortHub(d.source.name)) + " ↔ " + esc(shortHub(d.target.name)) + "</b><div style='color:#c1c7cd'>" + esc(d.detail) + "</div>");
    }).on("mouseout", reset);
  }

  // ---------- one network, down to the payment ----------
  function progBot(code) { var p = F.PROGRAMS[code]; return { id: code, name: p.agency + " · " + p.short.replace(/^SSA |^VA /, ""), full: p.name, sub: "", agency: p.agency }; }
  // the 12 payments drawn: the held one, the story's people, and one or two per batch
  var SHOWN = ["PV-73194", "PV-71588", "PV-71522", "PV-72466", "PV-73215", "PV-71824", "PV-72455", "PV-72488", "PV-71409", "PV-71640", "PV-71760", "PV-72493", "PV-71915"];
  var AG_COLOR = { IRS: "#6929c4", SSA: "#0072c3", OPM: "#198038", VA: "#b28600", GSA: "#8a3800" };
  function coreModel() {
    var used = {}, n = F.net("N01"); F.GRAPH.forEach(function (g) { used[g.program] = 1; });
    var regs = F.GRAPH.filter(function (g) { return SHOWN.indexOf(g.id) >= 0; });
    return {
      core: true, hub: { name: F.OPERATOR.name, sub: F.OPERATOR.batches + " batches · 3 banks + 1 prepaid issuer · 1 mailbox · 1 phone · 8 shell employers" },
      title: n.payees + " payees · " + n.agencies.join(", ") + " · " + big(n.atRisk) + " · every payment passed every check",
      captions: { mid: ["Account batches", F.BATCHES.length + " shown of " + F.OPERATOR.batches + " · neighboring account numbers, each in a different name"], reg: ["Payments", "1 held + " + (regs.length - 1) + " of " + n.payments + " in the network · who the payee really is, from TrackLight"], bot: ["Certified by", "each agency sees only its own payees · the color on each payment"] },
      mids: F.BATCHES.map(function (b) { return { id: b.id, name: b.bank + " " + b.range, line2: b.accts + " accounts · opened " + b.opened.replace(/, 2026$/, ""), tag: b.role.toLowerCase(), risk: b.risk, regs: b.payments }; }),
      regs: regs.map(function (g) { return { id: g.id, mid: g.batch, bot: g.program, amount: g.amount, seed: g.seed, name: g.payee, program: F.PROGRAMS[g.program].short, acct: g.acct, state: g.state }; }),
      bots: Object.keys(used).map(progBot)
    };
  }
  function seedModel(n) {
    var r = (function (seed) { var x = seed; return function () { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; })(n.id.charCodeAt(1) * 977 + n.id.charCodeAt(2) * 31);
    var mids = n.spokes.map(function (s, i) { return { id: "M" + i, name: s, line2: n.states[i % n.states.length] + " · " + n.agencies[i % n.agencies.length], tag: F.SCHEMES[n.scheme].spoke.toLowerCase().replace(/s$/, ""), risk: Math.max(60, n.risk - Math.floor(r() * 15)) }; });
    var bots = n.programs.map(progBot), regs = [];
    for (var i = 0; i < 12; i++) regs.push({ id: n.id + "-" + (100 + i), mid: mids[i % mids.length].id, bot: bots[i % bots.length].id, amount: Math.round((n.payments ? n.atRisk / n.payments : 9000) * (0.7 + r() * 0.6) / 10) * 10, seed: false, name: "", state: "paid" });
    return { core: false, hub: { name: n.name, sub: F.SCHEMES[n.scheme].label + " · " + n.agencies.join(" · ") }, title: n.payees + " payees · " + n.agencies.join(", ") + " · " + big(n.atRisk), captions: { mid: [F.SCHEMES[n.scheme].spoke, n.states.join(" · ")], reg: ["Payments", "a sample of " + n.payments.toLocaleString()], bot: ["Certified by", "the color on each payment"] }, mids: mids, regs: regs, bots: bots };
  }
  function legendHtml(m) {
    var box = function (stroke, label) { return '<span class="lg"><span style="width:14px;height:10px;border:1.5px solid ' + stroke + ';border-radius:3px;background:#fff"></span>' + label + '</span>'; };
    var pill = function (bg, stroke, label) { return '<span class="lg"><span style="width:16px;height:9px;border:1.2px solid ' + stroke + ';border-radius:5px;background:' + bg + '"></span>' + label + '</span>'; };
    var dot = function (stroke, bg, label) { return '<span class="lg"><span class="dot" style="border-color:' + stroke + ';background:' + bg + '"></span>' + label + '</span>'; };
    return dot("#001141", "#001141", m.core ? "Organizer" : "Hub") + box("#c6362f", m.core ? "Account batch · high risk" : "Spoke · high risk") + pill("#c6362f", "#c6362f", "Held payment") +
      m.bots.map(function (b) { return pill("#fff", AG_COLOR[b.agency] || "#878d96", "Paid · certified by " + b.agency); }).join("") +
      (m.core ? '<span class="lg"><span style="width:16px;height:0;border-top:1.6px dashed #0f62fe"></span>Same person, two accounts</span>' +
        Object.keys(BADGE).map(function (k) { return '<span class="lg"><span style="font-size:8.5px;font-weight:700;letter-spacing:.04em;color:' + BADGE[k].c + ';border:1px solid ' + BADGE[k].c + ';border-radius:3px;padding:0 3px;background:#fff">' + BADGE[k].t + '</span></span>'; }).join("") +
        '<span class="lg" style="color:var(--text3)">Badges and links: ' + F.tlMark("link analysis") + '</span>' : '');
  }
  // refer the network to every agency in it; after sending, what each agency did
  function referBox(n) {
    var refs = F.netRefsOf("network", n.id), split = F.netSplit("network", n.id);
    var chips = split.map(function (b) {
      var r = refs.filter(function (x) { return x.agency === b.agency; })[0], dd = r && r.decision ? F.netDecision(r.decision.c) : null;
      return '<div style="display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-top:0.5px solid var(--border2);font-size:11.5px"><span><span class="tag mono" style="font-size:10px">' + b.agency + '</span> ' + b.payments.toLocaleString() + ' payments · ' + F.bigUsd(b.atRisk) + (b.pending ? ' · <b style="color:var(--high-tx)">' + b.pending + ' not yet paid</b>' : '') + '</span>' +
        '<span style="white-space:nowrap;color:' + (dd ? (dd.tone === "high" ? "var(--high-tx)" : "var(--med-tx)") : r ? "var(--accent-d)" : "var(--text3)") + ';font-weight:' + (dd || r ? 600 : 400) + '">' + (dd ? esc(dd.status.replace(/ by $/, "")) : r ? "Sent · awaiting " + b.agency : "not yet referred") + '</span></div>';
    }).join("");
    return '<div style="flex:1;min-width:280px;background:var(--card);border:0.5px solid var(--border);border-radius:8px;padding:10px 12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px"><div style="font-weight:600;font-size:12.5px"><i class="ti ti-send" style="color:var(--accent-d)"></i> Refer the whole network</div>' +
      '<button class="btn' + (refs.length ? '' : ' primary') + '" id="n-refer" style="font-size:11px;padding:3px 9px"><i class="ti ti-' + (refs.length ? 'package' : 'send') + '"></i> ' + (refs.length ? 'View referrals' : 'Refer to ' + split.map(function (b) { return b.agency; }).join(", ")) + '</button></div>' +
      '<div style="font-size:11px;color:var(--text2);margin-bottom:4px">One referral per certifying agency: the ring, that agency\'s payments in it, and what to do.</div>' + chips + '</div>';
  }
  // how the network was found: nine dated events, each from one lane
  function discoveryHtml() {
    var D = F.DISCOVERY, first = D[0].d, last = D[D.length - 1].d;
    var weeks = Math.round((Date.parse(last) - Date.parse(first)) / 6048e5);
    return '<div class="card" id="n-discovery" style="margin:10px 0 0;padding:0;overflow:hidden"><div style="padding:10px 14px;border-bottom:0.5px solid var(--border2);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div><div style="font-weight:600;font-size:13px"><i class="ti ti-route" style="color:var(--accent-d)"></i> How this network was found</div><div style="font-size:11.5px;color:var(--text2)">' + D.length + ' events in ' + weeks + ' weeks, each from one source lane. The rings this is modeled on took investigators two years to assemble by hand.</div></div>' + F.laneLegend() + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:0">' + D.map(function (e, i) {
        return '<div style="padding:10px 14px;border-top:0.5px solid var(--border2);border-right:0.5px solid var(--border2);display:flex;gap:10px"><div style="width:22px;height:22px;border-radius:50%;flex:none;background:' + (i === D.length - 1 ? "var(--high)" : "var(--accent)") + ';color:#fff;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center">' + (i + 1) + '</div>' +
          '<div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;gap:6px;align-items:center"><span class="mono" style="font-size:10.5px;color:var(--text3)">' + e.d + '</span>' + F.laneTag(e.lane, null, true) + '</div><div style="font-weight:600;font-size:12.5px;margin-top:2px">' + esc(e.t) + '</div><div style="font-size:11.5px;color:var(--text2);line-height:1.45;margin-top:1px">' + esc(e.x) + '</div></div></div>';
      }).join("") + '</div></div>';
  }
  function phoneBox() {
    return '<div style="flex:1;min-width:260px;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:10px 12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div style="font-weight:600;font-size:12.5px"><i class="ti ti-phone-off" style="color:var(--accent-d)"></i> Would it hold without the phone?</div><button class="btn" id="n-phone" style="font-size:11px;padding:3px 9px">Take away the phone</button></div>' +
      '<div id="n-phone-txt" style="font-size:11.5px;color:var(--text2);line-height:1.5;margin-top:4px">A real ring rotates burner phones. Ours reused one number for 37 changes, which is convenient. Take it away and see what\'s left.</div></div>';
  }
  function boxesHtml(n, m) {
    if (m.core) {
      return referBox(n) + phoneBox() + '<div style="flex:1;background:var(--high-bg);border:0.5px solid #f3c9c9;border-radius:8px;padding:10px 12px"><div style="font-weight:600;font-size:12.5px;color:var(--high-tx);margin-bottom:5px"><i class="ti ti-alert-triangle"></i> One organizer, ' + n.payees + ' payees</div>' +
        '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px">' + F.tlMark() + ' <span class="tag" style="background:var(--card)">1 deceased · 1 in custody · 2 stolen identities · 2 people on two accounts</span><span class="tag" style="background:var(--card)">' + F.VICTIMS.count + ' of ' + F.VICTIMS.of + ' identities from one clinic</span><span class="tag">' + F.OPERATOR.batches + ' account batches · ' + F.OPERATOR.banksText + '</span><span class="tag">1 mailbox · ' + F.MAILBOX.payees + ' payees</span><span class="tag">8 W-2 employers · 300 W-2s</span><span class="tag">phone ' + F.OPERATOR.phone + '</span><span class="tag">IRS · SSA · OPM</span></div>' +
        '<div style="font-size:11.5px;color:#5c1a14;line-height:1.5">Every one of these payments passed Do Not Pay, account ownership and TIN checks. In the data they share account batches opened days apart, one mailbox, eight employers formed in the last year and one phone. <b>' + n.payees + ' payees · ' + n.payments + ' payments · ' + big(n.atRisk) + '</b> in the pattern.</div></div>';
    }
    return '<div style="flex:1;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:10px 12px"><div style="font-weight:600;font-size:12.5px;margin-bottom:6px"><i class="ti ti-affiliate"></i> ' + esc(n.name) + '</div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap"><span class="tag">' + esc(F.SCHEMES[n.scheme].label) + '</span><span class="tag">' + n.agencies.join(" · ") + '</span><span class="tag">' + n.states.join(" · ") + '</span></div>' +
      '<div style="font-size:11.5px;color:var(--text2);margin-top:8px">' + n.payees + ' payees · <b>' + big(n.atRisk) + '</b> at risk · status <b>' + esc(n.status) + '</b> · risk ' + n.risk + '.</div></div>';
  }
  var BADGE = { deceased: { t: "DECEASED", c: "#161616" }, custody: { t: "IN CUSTODY", c: "#8a3ffc" }, stolen: { t: "ID STOLEN", c: "#c6362f" } };
  function trunc(t, n) { t = String(t || ""); return t.length > n ? t.slice(0, n - 1) + "…" : t; }
  function drawLayered(el, m, H) {
    if (typeof d3 === "undefined") { setTimeout(function () { drawLayered(el, m, H); }, 80); return; }
    d3.select(el).selectAll("*").remove();
    var W = el.clientWidth || 1000;
    var yHub = Math.round(H * 0.1), yMid = Math.round(H * 0.34), yReg = Math.round(H * 0.66), yBot = Math.round(H * 0.9);
    var nM = m.mids.length, span = Math.min(W - 40, nM * 250), cw = Math.min(210, span / nM - 18), ch = 60;
    var M = {}; m.mids.forEach(function (x, i) { M[x.id] = { x: W / 2 - span / 2 + span * (i + 0.5) / nM, d: x }; });
    var regs = m.regs.slice().sort(function (a, b) { return M[a.mid].x - M[b.mid].x; });
    var named = regs.some(function (r) { return r.name; });
    var k = regs.length, cspan = W - 40, pw = Math.max(44, Math.min(named ? 124 : 60, cspan / k - 8)), ph = named ? 32 : 22, R = {};
    regs.forEach(function (r, i) { R[r.id] = { x: 20 + cspan * (i + 0.5) / k, w: pw, d: r }; });
    var bots = m.bots.slice(); bots.forEach(function (b) { var xs = regs.filter(function (r) { return r.bot === b.id; }).map(function (r) { return R[r.id].x; }); b._x = xs.length ? xs.reduce(function (a, c) { return a + c; }, 0) / xs.length : W / 2; }); bots.sort(function (a, b) { return a._x - b._x; });
    var nb = bots.length, bspan = Math.min(W - 80, Math.max(nb * 190, span * 0.7)), B = {};
    bots.forEach(function (b, i) { B[b.id] = { x: W / 2 - bspan / 2 + bspan * (i + 0.5) / nb, d: b }; });
    var agColor = function (r) { var b = bots.filter(function (x) { return x.id === r.bot; })[0]; return (b && AG_COLOR[b.agency]) || "#878d96"; };
    var svg = d3.select(el).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H).style("display", "block").style("font-family", "IBM Plex Sans,sans-serif");
    // row headers, readable
    var head = function (y, cap) { var g = svg.append("g").attr("paint-order", "stroke").attr("stroke", "#f4f6f8").attr("stroke-width", 4); g.append("text").attr("x", 12).attr("y", y).attr("font-size", 11).attr("font-weight", 600).attr("fill", "#343a3f").text(cap[0]); g.append("text").attr("x", 12 + cap[0].length * 6.6 + 8).attr("y", y).attr("font-size", 9.5).attr("fill", "#878d96").text("· " + cap[1]); };
    head(yHub - 28, [m.core ? "Organizer" : "Hub", m.hub.sub]);
    head(yMid - ch / 2 - 10, m.captions.mid);
    head(yReg - ph / 2 - 30, m.captions.reg);
    head(yBot - 24, m.captions.bot);
    if (m.title) svg.append("text").attr("x", W - 12).attr("y", yHub - 28).attr("text-anchor", "end").attr("font-size", 11).attr("font-weight", 600).attr("fill", "#c6362f").text(m.title);
    var gE = svg.append("g"), gA = svg.append("g"), gN = svg.append("g");
    var hubE = m.mids.map(function (x) { var t = M[x.id]; return gE.append("path").attr("d", "M" + (W / 2) + "," + (yHub + 20) + " C" + (W / 2) + "," + (yHub + 50) + " " + t.x + "," + (yHub + 34) + " " + t.x + "," + (yMid - ch / 2)).attr("fill", "none").attr("stroke", "#c6362f").attr("stroke-width", 1.6).attr("stroke-dasharray", "4,3").attr("opacity", 0.75).datum({ mid: x.id }); });
    var regE = regs.map(function (r) {
      var a = R[r.id], t = M[r.mid];
      return gE.append("path").attr("class", "nedge nedge-" + r.mid).attr("d", "M" + t.x + "," + (yMid + ch / 2) + " C" + t.x + "," + (yMid + ch / 2 + 30) + " " + a.x + "," + (yReg - 40) + " " + a.x + "," + (yReg - ph / 2)).attr("fill", "none").attr("stroke", r.seed ? "#c6362f" : "#a2a9b0").attr("stroke-width", r.seed ? 2 : 1).attr("opacity", 0.7).datum(r);
    });
    var bw = Math.min(380, W - 40), hub = gN.append("g").attr("transform", "translate(" + (W / 2 - bw / 2) + "," + (yHub - 20) + ")");
    hub.append("rect").attr("width", bw).attr("height", 40).attr("rx", 9).attr("fill", "#001141");
    hub.append("text").attr("x", 14).attr("y", 17).attr("fill", "#fff").attr("font-size", 12).attr("font-weight", 600).text("◆  " + trunc(m.hub.name, 44));
    hub.append("text").attr("x", 14).attr("y", 31).attr("fill", "#a6c8ff").attr("font-size", 9.5).text(trunc(m.hub.sub, 64));
    var midN = m.mids.map(function (x) {
      var t = M[x.id], c = x.risk >= 80 ? "#c6362f" : "#c77d11";
      var g = gN.append("g").attr("class", "nmid nmid-" + x.id).attr("transform", "translate(" + (t.x - cw / 2) + "," + (yMid - ch / 2) + ")").attr("cursor", "pointer").datum({ mid: x.id });
      g.append("rect").attr("width", cw).attr("height", ch).attr("rx", 8).attr("fill", "#fff").attr("stroke", c).attr("stroke-width", 1.4);
      g.append("rect").attr("width", 4).attr("height", ch - 12).attr("y", 6).attr("rx", 2).attr("fill", c);
      g.append("text").attr("x", 11).attr("y", 16).attr("font-size", 11).attr("font-weight", 600).attr("fill", "#001141").text(trunc(x.name, Math.floor(cw / 6.4)));
      g.append("text").attr("x", 11).attr("y", 30).attr("font-size", 9.5).attr("fill", "#4d5358").attr("font-family", "IBM Plex Mono,monospace").text(trunc(x.line2, Math.floor(cw / 5.8)));
      g.append("text").attr("x", 11).attr("y", ch - 9).attr("font-size", 9).attr("font-weight", 600).attr("fill", "#b5730e").text(x.tag);
      g.append("text").attr("x", cw - 9).attr("y", ch - 9).attr("text-anchor", "end").attr("font-size", 9).attr("font-weight", 600).attr("fill", c).text("risk " + x.risk);
      return g;
    });
    var kf = function (n) { return "$" + (n / 1000).toFixed(1) + "K"; };
    var shortName = function (n) { var p = String(n || "").replace(/ [A-Z]\. /, " ").split(" "); return p.length > 1 ? p[0][0] + ". " + p.slice(1).join(" ") : n; };
    var regN = regs.map(function (r) {
      var a = R[r.id], c = agColor(r), g = gN.append("g").attr("class", "nreg nreg-" + r.mid).attr("transform", "translate(" + a.x + "," + yReg + ")").attr("cursor", "pointer").datum(r);
      var cur = r.cur && !r.seed;
      g.append("rect").attr("x", -a.w / 2).attr("y", -ph / 2).attr("width", a.w).attr("height", ph).attr("rx", named ? 8 : 11).attr("fill", r.seed ? "#c6362f" : cur ? "#edf5ff" : "#fff").attr("stroke", r.seed ? "#c6362f" : cur ? "#0f62fe" : c).attr("stroke-width", r.seed ? 2 : cur ? 2.4 : 1.4).attr("stroke-dasharray", r.state === "pending" ? "3,2" : null);
      if (cur) g.append("text").attr("y", -ph / 2 - 6).attr("text-anchor", "middle").attr("font-size", 8.5).attr("font-weight", 700).attr("letter-spacing", "0.04em").attr("fill", "#0f62fe").text("THIS PAYMENT");
      if (r.name) {
        g.append("text").attr("y", -3).attr("text-anchor", "middle").attr("font-size", a.w < 90 ? 8.5 : 9.5).attr("font-weight", 600).attr("fill", r.seed ? "#fff" : "#001141").text(trunc(shortName(r.name), Math.floor(a.w / (a.w < 90 ? 5 : 5.6))));
        g.append("text").attr("y", 9).attr("text-anchor", "middle").attr("font-size", 8.5).attr("font-family", "IBM Plex Mono,monospace").attr("fill", r.seed ? "#ffd7d9" : "#4d5358").text(kf(r.amount) + " · " + (F.PROGRAMS[r.bot] ? F.PROGRAMS[r.bot].agency : r.bot));
      } else g.append("text").attr("y", 3.5).attr("text-anchor", "middle").attr("font-size", a.w < 42 ? 8 : 9).attr("font-weight", 600).attr("font-family", "IBM Plex Mono,monospace").attr("fill", r.seed ? "#fff" : "#343a3f").text(kf(r.amount));
      if (r.seed) g.append("text").attr("y", -ph / 2 - 6).attr("text-anchor", "middle").attr("font-size", 8.5).attr("font-weight", 700).attr("letter-spacing", "0.04em").attr("fill", "#c6362f").text(r.state === "held" ? "HELD" : "THIS PAYMENT");
      return g;
    });
    // TrackLight: who each person really is, and one identity on two accounts
    var byName = {}; regs.forEach(function (r) { if (r.name) (byName[r.name] = byName[r.name] || []).push(r); });
    var pairs = Object.keys(byName).filter(function (n) { return byName[n].length > 1; }).map(function (n) { var rs = byName[n]; return { name: n, x1: Math.min(R[rs[0].id].x, R[rs[1].id].x), x2: Math.max(R[rs[0].id].x, R[rs[1].id].x) }; }).sort(function (a, b) { return (a.x2 - a.x1) - (b.x2 - b.x1); });
    pairs.forEach(function (p, i) {
      var top = yReg - ph / 2 - 34 - i * 22;
      gA.append("path").attr("d", "M" + p.x1 + "," + (yReg - ph / 2) + " C" + p.x1 + "," + top + " " + p.x2 + "," + top + " " + p.x2 + "," + (yReg - ph / 2)).attr("fill", "none").attr("stroke", "#0f62fe").attr("stroke-width", 1.6).attr("stroke-dasharray", "5,3");
      gA.append("text").attr("x", (p.x1 + p.x2) / 2).attr("y", top + 9).attr("text-anchor", "middle").attr("font-size", 9).attr("font-weight", 600).attr("fill", "#0043ce").attr("paint-order", "stroke").attr("stroke", "#fff").attr("stroke-width", 3).text("same person on two accounts · " + shortName(p.name));
    });
    regN.forEach(function (g) {
      var r = g.datum(), idn = F.IDENTITY[r.name]; if (!idn) return;
      var b = BADGE[idn.status], w = b.t.length * 5.4 + 10;
      g.append("rect").attr("x", -w / 2).attr("y", ph / 2 + 4).attr("width", w).attr("height", 13).attr("rx", 3).attr("fill", "#fff").attr("stroke", b.c).attr("stroke-width", 1);
      g.append("text").attr("y", ph / 2 + 13.5).attr("text-anchor", "middle").attr("font-size", 7.5).attr("font-weight", 700).attr("letter-spacing", "0.04em").attr("fill", b.c).text(b.t);
    });
    var botN = bots.map(function (b) {
      var p = B[b.id], c = AG_COLOR[b.agency] || "#8a3ffc", g = gN.append("g").attr("transform", "translate(" + p.x + "," + yBot + ")").attr("cursor", "help").datum(b);
      var cnt = regs.filter(function (r) { return r.bot === b.id; }), stores = cnt.map(function (r) { return r.mid; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; });
      g.append("rect").attr("x", -78).attr("y", -12).attr("width", 156).attr("height", 24).attr("rx", 6).attr("fill", "#fff").attr("stroke", c).attr("stroke-width", 1.6);
      g.append("rect").attr("x", -78).attr("y", -12).attr("width", 6).attr("height", 24).attr("rx", 3).attr("fill", c);
      g.append("text").attr("x", -64).attr("y", 4).attr("font-size", 10.5).attr("font-weight", 600).attr("fill", c).text(b.name);
      g.append("text").attr("y", 24).attr("text-anchor", "middle").attr("font-size", 8.5).attr("fill", "#4d5358").text(cnt.length + " shown · " + stores.length + " batch" + (stores.length > 1 ? "es" : "") + " · sees only its own payees");
      return g;
    });
    var tip = d3.select(el).append("div").style("position", "absolute").style("background", "#001141").style("border-radius", "7px").style("padding", "8px 11px").style("font-size", "11px").style("color", "#f2f4f8").style("pointer-events", "none").style("opacity", 0).style("z-index", 10).style("max-width", "280px").style("line-height", "1.45").style("box-shadow", "0 6px 18px rgba(0,0,0,.2)");
    function showTip(e, html) { var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; tip.html(html).style("opacity", 1).style("left", Math.max(4, Math.min(x + 14, W - 290)) + "px").style("top", (y + 130 > H ? y - 120 : y + 12) + "px"); }
    function focus(test) {
      regN.forEach(function (g) { g.attr("opacity", test(g.datum()) ? 1 : 0.18); });
      regE.forEach(function (e) { var on = test(e.datum()); e.attr("opacity", on ? 1 : 0.05).attr("stroke-width", on ? 2 : 1); });
      var mids = {}, bs = {}; regs.forEach(function (r) { if (test(r)) { mids[r.mid] = 1; bs[r.bot] = 1; } });
      midN.forEach(function (g) { g.attr("opacity", mids[g.datum().mid] ? 1 : 0.3); });
      hubE.forEach(function (e) { e.attr("opacity", mids[e.datum().mid] ? 1 : 0.1); });
      botN.forEach(function (g) { g.attr("opacity", bs[g.datum().id] ? 1 : 0.25); });
    }
    function reset() { regN.concat(midN, botN).forEach(function (g) { g.attr("opacity", 1); }); regE.forEach(function (e) { e.attr("opacity", 0.7).attr("stroke-width", e.datum().seed ? 2 : 1); }); hubE.forEach(function (e) { e.attr("opacity", 0.75); }); tip.style("opacity", 0); }
    midN.forEach(function (g) {
      var x = m.mids.filter(function (q) { return q.id === g.datum().mid; })[0];
      g.on("mouseover", function (e) { focus(function (r) { return r.mid === x.id; }); showTip(e, "<div style='color:#ffb4a8;margin-bottom:2px'>" + (m.core ? "Account batch · " + esc(x.tag) : "Spoke") + "</div><b>" + esc(x.name) + "</b><div style='color:#c1c7cd'>" + esc(x.line2) + (x.regs ? "<br>" + x.regs + " federal payments into these accounts" : "") + "</div>"); }).on("mouseout", reset);
    });
    regN.forEach(function (g) {
      var r = g.datum();
      g.on("mouseover", function (e) {
        focus(function (q) { return q.id === r.id || (r.name && q.name === r.name); });
        showTip(e, (r.seed ? "<div style='color:#ffb4a8;margin-bottom:2px'>Held before payment · passed every list check</div>" : "<div style='color:#c1c7cd;margin-bottom:2px'>Payment · " + (r.state === "pending" ? "pending" : "paid") + "</div>") +
          "<b>" + esc(r.id) + " · " + usd(r.amount) + "</b>" + (r.name ? "<div style='color:#c1c7cd'>" + esc(r.name) + " · " + esc(r.program || "") + "<br>Into account " + esc(r.acct || "") + " · certified by " + esc(F.PROGRAMS[r.bot] ? F.PROGRAMS[r.bot].agency : "") + "</div>" : "") +
          (F.IDENTITY[r.name] ? "<div style='color:#ffd7a8;margin-top:3px'>TrackLight · " + esc(F.IDENTITY[r.name].label) + ": " + esc(F.IDENTITY[r.name].note) + "</div>" : "") +
          ((byName[r.name] || []).length > 1 ? "<div style='color:#a6c8ff;margin-top:2px'>Same identity on " + byName[r.name].map(function (q) { return esc(q.acct); }).join(" and ") + "</div>" : "") +
          (F.lead(r.id) ? "<div style='color:#a6c8ff;margin-top:2px'>Click to open the payment</div>" : ""));
      }).on("mouseout", reset).on("click", function () { if (F.lead(r.id)) window.APP.openAllegation(r.id); });
    });
    botN.forEach(function (g) {
      var b = g.datum();
      g.on("mouseover", function (e) {
        focus(function (r) { return r.bot === b.id; });
        var rs = regs.filter(function (r) { return r.bot === b.id; });
        showTip(e, "<div style='color:#d4bbff;margin-bottom:2px'>" + "Certifying agency · " + esc(b.agency) + "</div><b>" + esc(b.full) + "</b><div style='color:#c1c7cd'>" + (m.core ? "Certified " + rs.length + " of the payments shown, into " + rs.map(function (r) { return r.mid; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; }).length + " account batch(es), each to an ordinary-looking payee who passed every check" : rs.length + " payments") + "</div>");
      }).on("mouseout", reset);
    });
  }
})();
