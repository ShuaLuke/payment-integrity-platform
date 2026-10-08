/* Treasury pack · Insights › Networks.
   All networks: the funnel from one held payment to every detected network, the
   map of all networks and their cross-network links, the split by scheme type,
   and the network table. A network: a layered graph — organizer → account
   batches → payments → the agencies that certified them — down to the payment.
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
    render: function (mount) {
      var btn = function (id, label, sub) { return '<button class="nscn" data-scn="' + id + '" style="border:none;background:none;border-radius:6px;padding:5px 11px;font-size:12px;cursor:pointer;color:var(--text2);font-family:var(--sans);display:flex;flex-direction:column;align-items:flex-start;line-height:1.2"><span style="font-weight:500">' + label + '</span><span style="font-size:9.5px;color:var(--text3)">' + sub + '</span></button>'; };
      mount.innerHTML = '<div class="page">' +
        '<div class="page-head"><div><div class="page-title">Payment networks</div><div class="page-sub" id="n-sub">Payees linked by an account batch, mailbox, phone, employer or preparer — across agencies and payment types.</div></div>' +
        '<div style="display:flex;gap:10px;align-items:center"><div style="display:flex;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px">' + btn("all", "All networks", F.NETS.length + " detected") + btn("N01", "Delmont network", "IRS · SSA · OPM · 9 account batches") + '</div>' + window.EXPORT.group("fnw") + '</div></div>' +
        '<div id="n-overview" hidden></div><div id="n-back" hidden style="margin-bottom:8px"></div>' +
        '<div class="canvas" id="n-canvas" style="position:relative"></div><div class="legend" id="n-legend"></div><div id="n-boxes" style="display:flex;gap:10px;margin-top:4px"></div></div>';
      var current = "all";
      function setActive(s) { mount.querySelectorAll(".nscn").forEach(function (b) { var on = b.getAttribute("data-scn") === s; b.style.background = on ? "var(--card)" : "none"; b.style.color = on ? "var(--ink)" : "var(--text2)"; b.style.boxShadow = on ? "0 1px 2px rgba(0,17,65,.08)" : "none"; }); }
      function paint(scn) {
        current = scn; setActive(scn === "N01" ? "N01" : "all");
        var ov = document.getElementById("n-overview"), cv = document.getElementById("n-canvas"), back = document.getElementById("n-back"), lg = document.getElementById("n-legend"), bx = document.getElementById("n-boxes");
        ov.hidden = scn !== "all"; cv.hidden = scn === "all"; lg.hidden = scn === "all"; back.hidden = scn === "all";
        back.innerHTML = '<button class="btn" id="n-back-btn"><i class="ti ti-arrow-left"></i> All networks</button>';
        document.getElementById("n-back-btn").onclick = function () { paint("all"); };
        if (scn === "all") { ov.innerHTML = overviewHtml(); bx.innerHTML = ""; wireOverview(ov, paint); return; }
        var m = scn === "N01" ? coreModel() : seedModel(F.net(scn));
        cv.style.height = "580px";
        lg.innerHTML = legendHtml(m);
        bx.innerHTML = boxesHtml(F.net(scn), m);
        drawLayered(cv, m, 580);
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
      '<div style="font-weight:500;font-size:12.5px"><i class="ti ti-chart-dots-3" style="color:var(--accent-d)"></i> Everything connected <span class="muted" style="font-weight:400;font-size:10.5px">· ' + S.networks + ' networks · ' + F.BRIDGES.length + ' cross-network links · ' + F.PLAN.states + ' states</span></div>' +
      '<div style="font-size:10.5px;color:var(--text3)"><i class="ti ti-pointer"></i> Hover a hub or a red link · click a hub to open its network</div></div>' +
      '<div id="nv-map" style="position:relative;height:540px;background:var(--surface)"></div>' +
      '<div class="legend" style="margin:0;padding:8px 12px;border-top:0.5px solid var(--border2)">' + mapLegend() + '</div></div>' +
      '<div class="card"><div style="font-weight:500;font-size:12.5px;margin-bottom:4px"><i class="ti ti-category" style="color:var(--accent-d)"></i> At risk by scheme type</div>' + bars + '</div>' +
      '<div class="card" style="padding:0;overflow:hidden"><div style="padding:9px 12px;border-bottom:0.5px solid var(--border2);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><div style="font-weight:500;font-size:12.5px"><i class="ti ti-affiliate" style="color:var(--accent-d)"></i> Networks <span class="muted" style="font-weight:400;font-size:10.5px">· click a row to open its graph</span></div>' +
      '<div style="display:flex;gap:2px;flex-wrap:wrap;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px">' + chip("", "All") + F.SCHEME_ORDER.map(function (k) { return chip(k, F.SCHEMES[k].short); }).join("") + '</div></div>' +
      '<div style="overflow-x:auto"><table style="width:100%"><thead><tr><th>Network</th><th>Scheme</th><th>Agencies</th><th class="right">Payees</th><th class="right">At risk · ' + F.PLAN.fys + '</th><th>Status</th><th class="right">Risk</th></tr></thead><tbody id="nv-body">' + rowsHtml() + '</tbody></table></div></div>' +
      '</div>';
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
  function drawMap(el, paint) {
    if (!el) return;
    if (typeof d3 === "undefined") { setTimeout(function () { drawMap(el, paint); }, 80); return; }
    var G = F.fullGraph(), W = el.clientWidth || 1000, H = el.clientHeight || 540;
    d3.select(el).selectAll("*").remove();
    var hubs = G.nodes.filter(function (n) { return n.kind === "hub"; });
    var maxR = d3.max(hubs, function (n) { return n.atRisk; }) || 1;
    var R = function (n) { return n.kind === "hub" ? 10 + 14 * Math.sqrt(n.atRisk / maxR) : n.kind === "spoke" ? 6.5 : 3.2; };
    var pcol = function (r) { return r >= 80 ? "#c6362f" : r >= 50 ? "#c77d11" : "#001141"; };
    hubs.forEach(function (h, i) { var a = i / hubs.length * Math.PI * 2; h.x = W / 2 + Math.cos(a) * 200; h.y = H / 2 + Math.sin(a) * 150; });
    var hs = d3.forceSimulation(hubs).stop()
      .force("link", d3.forceLink(G.links.filter(function (l) { return l.kind === "bridge"; }).map(function (l) { return { source: l.source, target: l.target }; })).id(function (d) { return d.id; }).distance(130).strength(0.6))
      .force("charge", d3.forceManyBody().strength(-700)).force("x", d3.forceX(W / 2).strength(0.04)).force("y", d3.forceY(H / 2).strength(0.07));
    for (var t = 0; t < 400; t++) hs.tick();
    var padX = 90, padTop = 58, padBot = 58, xs = d3.extent(hubs, function (h) { return h.x; }), ys = d3.extent(hubs, function (h) { return h.y; });
    hubs.forEach(function (h) { h.fx = h.x = padX + (h.x - xs[0]) / ((xs[1] - xs[0]) || 1) * (W - padX * 2); h.fy = h.y = padTop + (h.y - ys[0]) / ((ys[1] - ys[0]) || 1) * (H - padTop - padBot); });
    var hubOf = {}; hubs.forEach(function (h) { hubOf[h.net] = h; });
    G.nodes.forEach(function (n) { if (n.kind !== "hub") { var h = hubOf[n.net]; n.x = h.x + (Math.random() - 0.5) * 30; n.y = h.y + (Math.random() - 0.5) * 30; } });
    var svg = d3.select(el).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H).style("display", "block").style("font-family", "IBM Plex Sans,sans-serif");
    var gL = svg.append("g"), gN = svg.append("g"), gT = svg.append("g");
    var lk = gL.selectAll("line").data(G.links).join("line")
      .attr("stroke", function (d) { return d.kind === "bridge" ? "#d9480f" : d.kind === "hub" ? "#9aa8b6" : "#c9d3dc"; })
      .attr("stroke-width", function (d) { return d.kind === "bridge" ? 2.2 : d.kind === "hub" ? 1.1 : 0.7; })
      .attr("stroke-dasharray", function (d) { return d.kind === "bridge" ? "6,4" : null; });
    var hit = gL.selectAll("line.hit").data(G.links.filter(function (d) { return d.kind === "bridge"; })).join("line").attr("class", "hit").attr("stroke", "transparent").attr("stroke-width", 12).style("cursor", "help");
    var nd = gN.selectAll("circle").data(G.nodes).join("circle").attr("r", R)
      .attr("fill", function (d) { return d.kind === "hub" ? "#001141" : d.kind === "spoke" ? pcol(d.risk) + "33" : "#bae6ff"; })
      .attr("stroke", function (d) { return d.kind === "hub" ? F.SCHEMES[d.scheme].color : d.kind === "spoke" ? pcol(d.risk) : "#1192e8"; })
      .attr("stroke-width", function (d) { return d.kind === "hub" ? 3 : d.kind === "spoke" ? 1.3 : 0.8; })
      .style("cursor", function (d) { return d.kind === "hub" ? "pointer" : "default"; });
    var lab = gT.selectAll("text").data(hubs).join("text").text(function (d) { return shortHub(d.name); }).attr("text-anchor", "middle").attr("font-size", 10).attr("font-weight", 600).attr("fill", "#001141")
      .attr("paint-order", "stroke").attr("stroke", "#f4f6f8").attr("stroke-width", 3).style("pointer-events", "none");
    var sim = d3.forceSimulation(G.nodes)
      .force("link", d3.forceLink(G.links).id(function (d) { return d.id; }).distance(function (l) { return l.kind === "hub" ? 28 : 14; }).strength(function (l) { return l.kind === "bridge" ? 0 : 1; }))
      .force("charge", d3.forceManyBody().strength(function (d) { return d.kind === "spoke" ? -45 : d.kind === "reg" ? -10 : -60; }).distanceMax(70))
      .force("collide", d3.forceCollide().radius(function (d) { return R(d) + (d.kind === "hub" ? 4 : 1.5); }));
    function ticked() {
      G.nodes.forEach(function (n) { var r = R(n) + 2; n.x = Math.max(r, Math.min(W - r, n.x)); n.y = Math.max(r + 12, Math.min(H - r, n.y)); });
      lk.attr("x1", function (d) { return d.source.x; }).attr("y1", function (d) { return d.source.y; }).attr("x2", function (d) { return d.target.x; }).attr("y2", function (d) { return d.target.y; });
      hit.attr("x1", function (d) { return d.source.x; }).attr("y1", function (d) { return d.source.y; }).attr("x2", function (d) { return d.target.x; }).attr("y2", function (d) { return d.target.y; });
      nd.attr("cx", function (d) { return d.x; }).attr("cy", function (d) { return d.y; });
      lab.attr("x", function (d) { return d.x; }).attr("y", function (d) { return d.y - R(d) - 5; });
    }
    sim.on("tick", function () { if (!document.body.contains(el)) { sim.stop(); return; } ticked(); });
    ticked();
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
  function coreModel() {
    var used = {}; F.GRAPH.forEach(function (g) { used[g.program] = 1; });
    return {
      core: true, hub: { name: F.OPERATOR.name, sub: F.OPERATOR.batches + " account batches · 3 banks · 1 mailbox · 1 phone" },
      captions: { mid: "ACCOUNT BATCHES · " + F.BATCHES.length + " SHOWN OF " + F.OPERATOR.batches + " · EACH ACCOUNT IN A DIFFERENT NAME", reg: "PAYMENTS · 1 HELD + 17 FROM THE SAME NETWORK · 3 AGENCIES", bot: "CERTIFIED BY · EACH AGENCY SEES ITS OWN PAYEES" },
      mids: F.BATCHES.map(function (b) { return { id: b.id, name: b.bank + " " + b.range, line2: b.accts + " accounts · opened " + b.opened.replace(/, 2026$/, ""), tag: b.role.toLowerCase(), risk: b.risk, regs: b.payments }; }),
      regs: F.GRAPH.map(function (g) { return { id: g.id, mid: g.batch, bot: g.program, amount: g.amount, seed: g.seed, name: g.payee, program: F.PROGRAMS[g.program].short, acct: g.acct, state: g.state }; }),
      bots: Object.keys(used).map(progBot)
    };
  }
  function seedModel(n) {
    var r = (function (seed) { var x = seed; return function () { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; })(n.id.charCodeAt(1) * 977 + n.id.charCodeAt(2) * 31);
    var mids = n.spokes.map(function (s, i) { return { id: "M" + i, name: s, line2: n.states[i % n.states.length] + " · " + n.agencies[i % n.agencies.length], tag: F.SCHEMES[n.scheme].spoke.toLowerCase().replace(/s$/, ""), risk: Math.max(60, n.risk - Math.floor(r() * 15)) }; });
    var bots = n.programs.map(progBot), regs = [];
    for (var i = 0; i < 12; i++) regs.push({ id: n.id + "-" + (100 + i), mid: mids[i % mids.length].id, bot: bots[i % bots.length].id, amount: Math.round((n.payments ? n.atRisk / n.payments : 9000) * (0.7 + r() * 0.6) / 10) * 10, seed: false, name: "", state: "paid" });
    return { core: false, hub: { name: n.name, sub: F.SCHEMES[n.scheme].label + " · " + n.agencies.join(" · ") }, captions: { mid: F.SCHEMES[n.scheme].spoke.toUpperCase() + " · " + n.states.join(" · "), reg: "PAYMENTS · SAMPLE OF " + n.payments.toLocaleString(), bot: "CERTIFIED BY" }, mids: mids, regs: regs, bots: bots };
  }
  function legendHtml(m) {
    var box = function (stroke, label) { return '<span class="lg"><span style="width:14px;height:10px;border:1.5px solid ' + stroke + ';border-radius:3px;background:#fff"></span>' + label + '</span>'; };
    var pill = function (bg, stroke, label) { return '<span class="lg"><span style="width:16px;height:9px;border:1.2px solid ' + stroke + ';border-radius:5px;background:' + bg + '"></span>' + label + '</span>'; };
    var dot = function (stroke, bg, label) { return '<span class="lg"><span class="dot" style="border-color:' + stroke + ';background:' + bg + '"></span>' + label + '</span>'; };
    return dot("#001141", "#001141", m.core ? "Organizer" : "Hub") + box("#c6362f", m.core ? "Account batch · high risk" : "Spoke · high risk") + pill("#c6362f", "#c6362f", "Held payment") + pill("#fff", "#878d96", "Other payment") + dot("#8a3ffc", "#f1e8ff", "Certifying agency") +
      '<span class="lg"><span style="width:16px;height:0;border-top:1.1px solid #a2a9b0"></span>Account batch → payment → certified by</span>';
  }
  function boxesHtml(n, m) {
    if (m.core) {
      return '<div style="flex:1;background:var(--high-bg);border:0.5px solid #f3c9c9;border-radius:8px;padding:10px 12px"><div style="font-weight:600;font-size:12.5px;color:var(--high-tx);margin-bottom:5px"><i class="ti ti-alert-triangle"></i> One organizer, ' + n.payees + ' payees</div>' +
        '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:6px"><span class="tag">' + F.OPERATOR.batches + ' account batches · 3 banks</span><span class="tag">1 mailbox · ' + F.MAILBOX.payees + ' payees</span><span class="tag">8 W-2 employers · 300 W-2s</span><span class="tag">phone ' + F.OPERATOR.phone + '</span><span class="tag">IRS · SSA · OPM</span></div>' +
        '<div style="font-size:11.5px;color:#5c1a14;line-height:1.5">Every one of these payments passed Do Not Pay, account ownership and TIN checks. In the data they share account batches opened days apart, one mailbox, eight employers formed in the last year and one phone. <b>' + n.payees + ' payees · ' + n.payments + ' payments · ' + big(n.atRisk) + '</b> in the pattern.</div></div>';
    }
    return '<div style="flex:1;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:10px 12px"><div style="font-weight:600;font-size:12.5px;margin-bottom:6px"><i class="ti ti-affiliate"></i> ' + esc(n.name) + '</div>' +
      '<div style="display:flex;gap:5px;flex-wrap:wrap"><span class="tag">' + esc(F.SCHEMES[n.scheme].label) + '</span><span class="tag">' + n.agencies.join(" · ") + '</span><span class="tag">' + n.states.join(" · ") + '</span></div>' +
      '<div style="font-size:11.5px;color:var(--text2);margin-top:8px">' + n.payees + ' payees · <b>' + big(n.atRisk) + '</b> at risk · status <b>' + esc(n.status) + '</b> · risk ' + n.risk + '.</div></div>';
  }
  function trunc(t, n) { t = String(t || ""); return t.length > n ? t.slice(0, n - 1) + "…" : t; }
  function drawLayered(el, m, H) {
    if (typeof d3 === "undefined") { setTimeout(function () { drawLayered(el, m, H); }, 80); return; }
    d3.select(el).selectAll("*").remove();
    var W = el.clientWidth || 1000;
    var yHub = Math.round(H * 0.09), yMid = Math.round(H * 0.31), yReg = Math.round(H * 0.6), yBot = Math.round(H * 0.86);
    var nM = m.mids.length, span = Math.min(W - 40, nM * 250), cw = Math.min(210, span / nM - 18), ch = 60;
    var M = {}; m.mids.forEach(function (x, i) { M[x.id] = { x: W / 2 - span / 2 + span * (i + 0.5) / nM, d: x }; });
    var regs = m.regs.slice().sort(function (a, b) { return M[a.mid].x - M[b.mid].x; });
    var k = regs.length, cspan = W - 40, pw = Math.max(34, Math.min(58, cspan / k - 5)), R = {};
    regs.forEach(function (r, i) { R[r.id] = { x: 20 + cspan * (i + 0.5) / k, w: r.seed ? Math.max(pw, 62) : pw, d: r }; });
    var bots = m.bots.slice(); bots.forEach(function (b) { var xs = regs.filter(function (r) { return r.bot === b.id; }).map(function (r) { return R[r.id].x; }); b._x = xs.length ? xs.reduce(function (a, c) { return a + c; }, 0) / xs.length : W / 2; }); bots.sort(function (a, b) { return a._x - b._x; });
    var nb = bots.length, bspan = Math.min(W - 80, Math.max(nb * 170, span * 0.7)), B = {};
    bots.forEach(function (b, i) { B[b.id] = { x: W / 2 - bspan / 2 + bspan * (i + 0.5) / nb, d: b }; });
    var svg = d3.select(el).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H).style("display", "block").style("font-family", "IBM Plex Sans,sans-serif");
    var cap = svg.append("g").attr("font-size", 8.5).attr("font-family", "IBM Plex Mono,monospace").attr("letter-spacing", "0.06em").attr("fill", "#878d96");
    cap.append("text").attr("x", 12).attr("y", yHub - 24).text(m.core ? "ORGANIZER" : "HUB");
    cap.append("text").attr("x", 12).attr("y", yMid - ch / 2 - 8).text(m.captions.mid);
    cap.append("text").attr("x", 12).attr("y", yReg - 30).text(m.captions.reg);
    cap.append("text").attr("x", 12).attr("y", yBot - 22).text(m.captions.bot);
    var gE = svg.append("g"), gN = svg.append("g");
    var hubE = m.mids.map(function (x) { var t = M[x.id]; return gE.append("path").attr("d", "M" + (W / 2) + "," + (yHub + 20) + " C" + (W / 2) + "," + (yHub + 50) + " " + t.x + "," + (yHub + 34) + " " + t.x + "," + (yMid - ch / 2)).attr("fill", "none").attr("stroke", "#c6362f").attr("stroke-width", 1.6).attr("stroke-dasharray", "4,3").attr("opacity", 0.75).datum({ mid: x.id }); });
    var regE = [];
    regs.forEach(function (r) {
      var a = R[r.id], t = M[r.mid], b = B[r.bot], col = r.seed ? "#c6362f" : "#a2a9b0";
      regE.push(gE.append("path").attr("d", "M" + t.x + "," + (yMid + ch / 2) + " C" + t.x + "," + (yMid + ch / 2 + 30) + " " + a.x + "," + (yReg - 40) + " " + a.x + "," + (yReg - 11)).attr("fill", "none").attr("stroke", col).attr("stroke-width", r.seed ? 2 : 1).attr("opacity", 0.7).datum(r));
      if (b) regE.push(gE.append("path").attr("d", "M" + a.x + "," + (yReg + 11) + " C" + a.x + "," + (yReg + 40) + " " + b.x + "," + (yBot - 40) + " " + b.x + "," + (yBot - 8)).attr("fill", "none").attr("stroke", r.seed ? "#c6362f" : "#b39ddb").attr("stroke-width", r.seed ? 2 : 1).attr("opacity", 0.7).datum(r));
    });
    var bw = Math.min(380, W - 40), hub = gN.append("g").attr("transform", "translate(" + (W / 2 - bw / 2) + "," + (yHub - 20) + ")");
    hub.append("rect").attr("width", bw).attr("height", 40).attr("rx", 9).attr("fill", "#001141");
    hub.append("text").attr("x", 14).attr("y", 17).attr("fill", "#fff").attr("font-size", 12).attr("font-weight", 600).text("◆  " + trunc(m.hub.name, 44));
    hub.append("text").attr("x", 14).attr("y", 31).attr("fill", "#a6c8ff").attr("font-size", 9.5).text(trunc(m.hub.sub, 64));
    var midN = m.mids.map(function (x) {
      var t = M[x.id], c = x.risk >= 80 ? "#c6362f" : "#c77d11";
      var g = gN.append("g").attr("transform", "translate(" + (t.x - cw / 2) + "," + (yMid - ch / 2) + ")").attr("cursor", "pointer").datum({ mid: x.id });
      g.append("rect").attr("width", cw).attr("height", ch).attr("rx", 8).attr("fill", "#fff").attr("stroke", c).attr("stroke-width", 1.4);
      g.append("rect").attr("width", 4).attr("height", ch - 12).attr("y", 6).attr("rx", 2).attr("fill", c);
      g.append("text").attr("x", 11).attr("y", 16).attr("font-size", 11).attr("font-weight", 600).attr("fill", "#001141").text(trunc(x.name, Math.floor(cw / 6.4)));
      g.append("text").attr("x", 11).attr("y", 30).attr("font-size", 9.5).attr("fill", "#4d5358").attr("font-family", "IBM Plex Mono,monospace").text(trunc(x.line2, Math.floor(cw / 5.8)));
      g.append("text").attr("x", 11).attr("y", ch - 9).attr("font-size", 9).attr("font-weight", 600).attr("fill", "#b5730e").text(x.tag);
      g.append("text").attr("x", cw - 9).attr("y", ch - 9).attr("text-anchor", "end").attr("font-size", 9).attr("font-weight", 600).attr("fill", c).text("risk " + x.risk);
      return g;
    });
    var kf = function (n) { return "$" + (n / 1000).toFixed(1) + "K"; };
    var regN = regs.map(function (r) {
      var a = R[r.id], g = gN.append("g").attr("transform", "translate(" + a.x + "," + yReg + ")").attr("cursor", "pointer").datum(r);
      g.append("rect").attr("x", -a.w / 2).attr("y", -11).attr("width", a.w).attr("height", 22).attr("rx", 11).attr("fill", r.seed ? "#c6362f" : "#fff").attr("stroke", r.seed ? "#c6362f" : r.state === "paid" ? "#878d96" : "#c77d11").attr("stroke-width", r.seed ? 2 : 1).attr("stroke-dasharray", r.state === "pending" ? "3,2" : null);
      g.append("text").attr("y", 3.5).attr("text-anchor", "middle").attr("font-size", a.w < 42 ? 8 : 9).attr("font-weight", 600).attr("font-family", "IBM Plex Mono,monospace").attr("fill", r.seed ? "#fff" : "#343a3f").text(kf(r.amount));
      if (r.seed) g.append("text").attr("y", -17).attr("text-anchor", "middle").attr("font-size", 8.5).attr("font-weight", 700).attr("letter-spacing", "0.04em").attr("fill", "#c6362f").text("HELD");
      return g;
    });
    var botN = bots.map(function (b) {
      var p = B[b.id], g = gN.append("g").attr("transform", "translate(" + p.x + "," + yBot + ")").attr("cursor", "help").datum(b);
      g.append("rect").attr("x", -40).attr("y", -14).attr("width", 80).attr("height", 50).attr("fill", "transparent");
      g.append("rect").attr("x", -68).attr("y", -9).attr("width", 136).attr("height", 18).attr("rx", 4).attr("fill", "#f1e8ff").attr("stroke", "#8a3ffc").attr("stroke-width", 1.2);
      g.append("text").attr("y", 4).attr("text-anchor", "middle").attr("font-size", 9.5).attr("font-weight", 600).attr("font-family", "IBM Plex Mono,monospace").attr("fill", "#491d8b").text(b.name);
      var cnt = regs.filter(function (r) { return r.bot === b.id; }), stores = cnt.map(function (r) { return r.mid; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; });
      g.append("text").attr("y", 22).attr("text-anchor", "middle").attr("font-size", 8.5).attr("fill", "#4d5358").text(cnt.length + " payment" + (cnt.length > 1 ? "s" : "") + " · " + stores.length + " batch" + (stores.length > 1 ? "es" : ""));
      return g;
    });
    var tip = d3.select(el).append("div").style("position", "absolute").style("background", "#001141").style("border-radius", "7px").style("padding", "8px 11px").style("font-size", "11px").style("color", "#f2f4f8").style("pointer-events", "none").style("opacity", 0).style("z-index", 10).style("max-width", "270px").style("line-height", "1.45").style("box-shadow", "0 6px 18px rgba(0,0,0,.2)");
    function showTip(e, html) { var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; tip.html(html).style("opacity", 1).style("left", Math.max(4, Math.min(x + 14, W - 280)) + "px").style("top", (y + 120 > H ? y - 110 : y + 12) + "px"); }
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
        focus(function (q) { return q.id === r.id; });
        showTip(e, (r.seed ? "<div style='color:#ffb4a8;margin-bottom:2px'>Held before payment · passed every list check</div>" : "<div style='color:#c1c7cd;margin-bottom:2px'>Payment · " + (r.state === "pending" ? "pending" : "paid") + "</div>") +
          "<b>" + esc(r.id) + " · " + usd(r.amount) + "</b>" + (r.name ? "<div style='color:#c1c7cd'>" + esc(r.name) + " · " + esc(r.program || "") + "<br>Into account " + esc(r.acct || "") + " · certified by " + esc(F.PROGRAMS[r.bot] ? F.PROGRAMS[r.bot].agency : "") + "</div>" : "") +
          (F.lead(r.id) ? "<div style='color:#a6c8ff;margin-top:2px'>Click to open the payment</div>" : ""));
      }).on("mouseout", reset).on("click", function () { if (F.lead(r.id)) window.APP.openAllegation(r.id); });
    });
    botN.forEach(function (g) {
      var b = g.datum();
      g.on("mouseover", function (e) {
        focus(function (r) { return r.bot === b.id; });
        var rs = regs.filter(function (r) { return r.bot === b.id; });
        showTip(e, "<div style='color:#d4bbff;margin-bottom:2px'>" + "Certifying agency · " + esc(b.agency) + "</div><b>" + esc(b.full) + "</b><div style='color:#c1c7cd'>" + (m.core ? "Certified " + rs.length + " payment" + (rs.length > 1 ? "s" : "") + " into " + rs.map(function (r) { return r.mid; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; }).length + " account batch(es) in this network, each to an ordinary-looking payee who passed every check" : rs.length + " payments") + "</div>");
      }).on("mouseout", reset);
    });
  }
})();
