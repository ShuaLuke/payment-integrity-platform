/* Disaster-relief pack · Insights › Map — flagged registrations and fraud
   networks by state, county and parish, across declarations: the view
   emergency managers think in. An operations-center map:
     · drill down — the nation shades states by flagged dollars; click a state to
       fly into its counties, click a county for its detail; breadcrumb and Esc
       step back out; the declaration chips jump straight to that disaster;
     · money flows — each network's dashes stream from where it is based to the
       counties where its registrations claim damage (red: crosses state lines);
     · playback — run the 13 months from the first declaration to today: each
       disaster flashes as it is declared, hot spots fill in, and a callout
       appears when a ring seen in an earlier disaster turns up in a new one.
   Designated areas are outlined; dollars claimed outside any declared area are
   hatched. Boundaries: US Census via us-atlas (geo/counties-10m.json), drawn
   with d3-geo + topojson-client. Data: fema-geo.js. Adds Views.map. */
(function () {
  window.Views = window.Views || {};
  var F = window.FEMA, G = F.GEO;
  var esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var big = function (n) { return F.bigUsd(n); };
  var ABBR = {}; Object.keys(G.ST).forEach(function (a) { ABBR[G.ST[a]] = a; });
  var topoP = null;
  function topo() { return topoP || (topoP = fetch("assets/packs/fema/geo/counties-10m.json").then(function (r) { return r.json(); })); }

  // ---- state of the view ----
  var st = { dr: "", nets: true, level: "us", state: null, county: null, step: null };
  // ---- time: weekly steps from just before the first declaration to today ----
  var WEEK = 7 * 864e5, T0 = Date.parse("2025-08-18"), T1 = Date.parse("2026-10-03"), STEPS = Math.ceil((T1 - T0) / WEEK);
  function tOf(step) { return step == null || step >= STEPS ? null : T0 + step * WEEK; }
  function g(w) { return w <= 0 ? 0 : 1 - Math.exp(-w / 3); }        // a surge after landfall, then the long tail
  function frac(dr, t) { if (t == null) return 1; var d = Date.parse(F.DECLS[dr].declared), w = (t - d) / WEEK, we = (T1 - d) / WEEK; return Math.min(1, g(w) / g(we)); }
  function cval(c, dr, t) { var f = 0, r = 0; Object.keys(c.byDecl).forEach(function (k) { if (dr && k !== dr) return; var x = frac(k, t); f += c.byDecl[k].flagged * x; r += c.byDecl[k].regs * x; }); return { flagged: f, regs: Math.round(r) }; }
  function areas(id) { return (G.NET_GEO[id] || { areas: [] }).areas; }
  function netLive(n, t, dr) { return (!dr || n.drs.indexOf(dr) >= 0) && areas(n.id).some(function (a) { return (!dr || a[3] === dr) && frac(a[3], t) > 0; }); }
  function netHere(id, key, t, dr) { var n = F.net(id); return areas(id).reduce(function (s, a) { return s + (G.key(a[0], a[1]) === key && (!dr || a[3] === dr) ? n.atRisk * a[2] * frac(a[3], t) : 0); }, 0); }
  function countyLabel(c) { return c.name + (c.st === "LA" ? " Parish" : " County") + ", " + c.st; }
  function fmtDate(t) { return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }); }

  // playback events: each declaration, and each ring that reappears in a later disaster
  var EVENTS = (function () {
    var ev = Object.keys(G.DESIGNATED).map(function (dr) { return { t: Date.parse(F.DECLS[dr].declared), kind: "decl", dr: dr }; });
    F.NETS.forEach(function (n) {
      var seen = {}; areas(n.id).forEach(function (a) { seen[a[3]] = 1; });
      var drs = Object.keys(seen).sort(function (a, b) { return Date.parse(F.DECLS[a].declared) - Date.parse(F.DECLS[b].declared); });
      for (var i = 1; i < drs.length; i++) if (Date.parse(F.DECLS[drs[i]].declared) - Date.parse(F.DECLS[drs[0]].declared) > 20 * 864e5)
        ev.push({ t: Date.parse(F.DECLS[drs[i]].declared) + 2 * WEEK, kind: "repeat", net: n.id, from: drs[0], to: drs[i] });
    });
    return ev.sort(function (a, b) { return a.t - b.t; });
  })();

  var CSS = '<style id="mp-css">' +
    '@keyframes mp-flow{to{stroke-dashoffset:-24}}.mp-flow{animation:mp-flow 1.1s linear infinite}' +
    '@keyframes mp-pulse{0%{r:6px;opacity:.9}100%{r:24px;opacity:0}}.mp-pulse{animation:mp-pulse 1.8s ease-out infinite}' +
    '@keyframes mp-flash{0%{stroke-opacity:1;stroke-width:5px}100%{stroke-opacity:0;stroke-width:14px}}.mp-flash{animation:mp-flash 1.4s ease-out 2}' +
    '@keyframes mp-toast{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}' +
    '.mp-glass{background:rgba(10,20,52,.82);border:0.5px solid rgba(166,200,255,.22);border-radius:9px;color:#dde1e6;backdrop-filter:blur(4px)}' +
    '.mp-crumb button{background:none;border:none;color:#a6c8ff;font:inherit;cursor:pointer;padding:0}.mp-crumb button:hover{text-decoration:underline}' +
    '#mp-range{accent-color:#ff7a4d;width:100%}' +
    '@media (prefers-reduced-motion: reduce){.mp-flow,.mp-pulse,.mp-flash{animation:none}}</style>';

  window.Views.map = {
    render: function (mount) {
      var chip = function (v, l, sub) { return '<button class="qscope mp-dr' + (st.dr === v ? " active" : "") + '" data-dr="' + v + '" title="' + esc(sub || "") + '">' + l + '</button>'; };
      mount.innerHTML = (document.getElementById("mp-css") ? "" : CSS) + '<div class="page">' +
        '<div class="page-head"><div><div class="page-title">Map</div><div class="page-sub">Flagged registrations and fraud networks by state, county and parish, across declarations. Click a state to drill in.</div></div>' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2);cursor:pointer"><input type="checkbox" id="mp-nets"' + (st.nets ? " checked" : "") + '> Show networks</label></div>' +
        '<div style="display:flex;gap:2px;flex-wrap:wrap;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px;margin-bottom:12px;width:fit-content">' +
        chip("", "All declarations") + Object.keys(G.DESIGNATED).map(function (dr) { var d = F.DECLS[dr]; return chip(dr, dr, d.name + " · " + d.stateName); }).join("") + '</div>' +
        '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:420px;border-radius:12px;overflow:hidden;background:#0b1430;box-shadow:0 8px 28px rgba(0,17,65,.25)">' +
        '<div id="mp-map" style="position:relative;height:620px;background:radial-gradient(900px 500px at 60% 40%,#13245a 0%,#0b1430 70%)"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#a6c8ff;font-size:12px"><i class="ti ti-loader-2"></i>&nbsp;Loading county boundaries…</div></div>' +
        '<div id="mp-legend" style="display:flex;flex-wrap:wrap;gap:6px 16px;padding:9px 14px;border-top:0.5px solid rgba(166,200,255,.18);font-size:11px;color:#c1c7cd"></div></div>' +
        '<div id="mp-side" style="width:320px;flex:none;display:flex;flex-direction:column;gap:10px"></div></div></div>';
      var api = null;
      mount.querySelectorAll(".mp-dr").forEach(function (b) {
        b.onclick = function () {
          st.dr = b.getAttribute("data-dr");
          mount.querySelectorAll(".mp-dr").forEach(function (x) { x.classList.toggle("active", x === b); });
          if (!api) return;
          if (st.dr) api.drillState(G.ST[G.DESIGNATED[st.dr].state]); else api.toNation();
        };
      });
      document.getElementById("mp-nets").onchange = function () { st.nets = this.checked; if (api) api.paint(); };
      side();
      topo().then(function (t) {
        if (!document.getElementById("mp-map")) return;
        api = draw(t);
        if (st.level === "county" && st.county) api.drillCounty(st.county, true);
        else if (st.level === "state" && st.state) api.drillState(st.state, true);
        else if (st.dr) api.drillState(G.ST[G.DESIGNATED[st.dr].state], true);
        else api.toNation(true);
      }).catch(function () { var m = document.getElementById("mp-map"); if (m) m.innerHTML = '<div style="padding:30px;color:#c1c7cd;font-size:12px">The county boundaries could not be loaded.</div>'; });

      // ---------- side panel ----------
      function side() {
        var el = document.getElementById("mp-side"); if (!el) return;
        var t = tOf(st.step);
        el.innerHTML = st.level === "county" && G.counties[st.county] ? countyPanel(G.counties[st.county], t) : summaryPanel(st.level === "state" ? st.state : null, t);
        el.querySelectorAll("[data-county]").forEach(function (r) { r.onclick = function () { if (api) api.drillCounty(r.getAttribute("data-county")); }; });
        el.querySelectorAll("[data-net]").forEach(function (r) { r.onclick = function () { window.APP.state.networkScenario = r.getAttribute("data-net"); window.APP.nav("network"); }; });
        el.querySelectorAll("[data-open]").forEach(function (r) { r.onclick = function () { window.APP.openAllegation(r.getAttribute("data-open")); }; });
      }

      // ---------- the map ----------
      function draw(topology) {
        var el = document.getElementById("mp-map"); el.innerHTML = "";
        var W = el.clientWidth || 900, H = el.clientHeight || 620;
        var want = {}; G.states.forEach(function (s) { want[s] = 1; });
        var statesF = topojson.feature(topology, topology.objects.states).features;
        var stateByFips = {}; statesF.forEach(function (f) { stateByFips[f.id] = f; });
        var countiesF = topojson.feature(topology, topology.objects.counties).features.filter(function (f) { return want[f.id.slice(0, 2)]; });
        var byKey = {}; countiesF.forEach(function (f) { f.key = f.id.slice(0, 2) + "|" + f.properties.name; byKey[f.key] = f; });
        var proj = d3.geoAlbersUsa().fitExtent([[24, 40], [W - 24, H - 70]], { type: "FeatureCollection", features: statesF.filter(function (f) { return want[f.id]; }) });
        var path = d3.geoPath(proj);
        var svg = d3.select(el).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H).style("display", "block").style("font-family", "IBM Plex Sans,sans-serif");
        var defs = svg.append("defs");
        var hatch = defs.append("pattern").attr("id", "mp-hatch").attr("patternUnits", "userSpaceOnUse").attr("width", 5).attr("height", 5).attr("patternTransform", "rotate(45)");
        hatch.append("rect").attr("width", 5).attr("height", 5).attr("fill", "#3b2a10");
        hatch.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 5).attr("stroke", "#ffb347").attr("stroke-width", 2);
        var glow = defs.append("filter").attr("id", "mp-glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
        glow.append("feGaussianBlur").attr("stdDeviation", 3).attr("result", "b");
        var fm = glow.append("feMerge"); fm.append("feMergeNode").attr("in", "b"); fm.append("feMergeNode").attr("in", "SourceGraphic");

        var root = svg.append("g");
        var stP = root.append("g").selectAll("path").data(statesF).join("path").attr("d", path).attr("stroke", "#2b3d6b").attr("stroke-width", 0.8).attr("vector-effect", "non-scaling-stroke");
        var ctP = root.append("g").selectAll("path").data(countiesF).join("path").attr("d", path).attr("vector-effect", "non-scaling-stroke").attr("stroke", "#24366a").attr("stroke-width", 0.5).style("cursor", "pointer").style("display", "none");
        root.append("path").datum(topojson.mesh(topology, topology.objects.states, function (a, b) { return a !== b; })).attr("d", path).attr("fill", "none").attr("stroke", "#4a63a3").attr("stroke-width", 0.9).attr("vector-effect", "non-scaling-stroke").style("pointer-events", "none");
        var desig = root.append("g").style("pointer-events", "none");
        var over = svg.append("g"); // screen-space overlay: flows, hubs, pin, labels
        var lnG = over.append("g").style("pointer-events", "none"), labG = over.append("g").style("pointer-events", "none"), hubG = over.append("g"), pinG = over.append("g"), flashG = over.append("g").style("pointer-events", "none");
        var tip = d3.select(el).append("div").attr("class", "mp-glass").style("position", "absolute").style("padding", "8px 11px").style("font-size", "11px").style("line-height", "1.45").style("max-width", "270px").style("pointer-events", "none").style("opacity", 0).style("z-index", 5);
        function showTip(e, html) { var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; tip.html(html).style("opacity", 1).style("left", Math.max(4, Math.min(x + 14, W - 280)) + "px"); var th = tip.node().offsetHeight; tip.style("top", (y + th + 16 > H ? Math.max(4, y - th - 12) : y + 12) + "px"); }
        function hideTip() { tip.style("opacity", 0); }

        // breadcrumb, toasts, timeline
        var crumb = d3.select(el).append("div").attr("class", "mp-glass mp-crumb").style("position", "absolute").style("left", "12px").style("top", "12px").style("padding", "6px 11px").style("font-size", "12px").style("z-index", 4);
        var toasts = d3.select(el).append("div").style("position", "absolute").style("right", "12px").style("top", "12px").style("display", "flex").style("flex-direction", "column").style("gap", "6px").style("align-items", "flex-end").style("z-index", 4).style("pointer-events", "none");
        var bar = d3.select(el).append("div").attr("class", "mp-glass").style("position", "absolute").style("left", "12px").style("right", "12px").style("bottom", "12px").style("padding", "8px 12px").style("display", "flex").style("align-items", "center").style("gap", "12px").style("z-index", 4);
        bar.html('<button id="mp-play" title="Play the last 13 months" style="width:30px;height:30px;flex:none;border-radius:50%;border:none;background:#ff7a4d;color:#fff;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center"><i class="ti ti-player-play-filled"></i></button>' +
          '<div style="flex:1;min-width:0"><input type="range" id="mp-range" min="0" max="' + STEPS + '" step="1" value="' + (st.step == null ? STEPS : st.step) + '"><div style="display:flex;justify-content:space-between;font-size:10px;color:#8d9bb8"><span>' + fmtDate(T0) + '</span><span>Today</span></div></div>' +
          '<div style="width:150px;flex:none;text-align:right"><div id="mp-date" style="font-weight:600;font-size:13px;color:#fff"></div><div id="mp-when" style="font-size:10.5px;color:#a6c8ff"></div></div>');
        var playBtn = el.querySelector("#mp-play"), range = el.querySelector("#mp-range"), timer = null;

        var tr = d3.zoomIdentity;
        var zoom = d3.zoom().scaleExtent([1, 60]).on("zoom", function (e) { tr = e.transform; root.attr("transform", tr); hatch.attr("patternTransform", "rotate(45) scale(" + (1 / tr.k) + ")"); place(); });
        svg.call(zoom).on("dblclick.zoom", null);

        function stateVal(fips, t) { var s = { flagged: 0, regs: 0 }; Object.keys(G.counties).forEach(function (k) { if (k.slice(0, 2) !== fips) return; var v = cval(G.counties[k], st.dr, t); s.flagged += v.flagged; s.regs += v.regs; }); return s; }
        var heatI = d3.interpolateRgbBasis(["#3a1c3d", "#7a2440", "#c6362f", "#ef5a3c", "#ff9a5a"]);
        var overlay = { lines: [], hubs: [], pins: [], labels: [] };

        function paint() {
          var t = tOf(st.step), lvl = st.level;
          // states: shaded by flagged $ at the national level, a backdrop when drilled in
          var sv = {}, smax = 1; G.states.forEach(function (f) { sv[f] = stateVal(f, t); smax = Math.max(smax, sv[f].flagged); });
          var sHeat = d3.scaleSequentialSqrt([0, smax], function (x) { return heatI(0.12 + 0.88 * x); });
          stP.attr("fill", function (f) {
            if (!want[f.id]) return "#0f1a3c";
            if (lvl === "us") return sv[f.id].flagged > 0 ? sHeat(sv[f.id].flagged) : "#17275a";
            return f.id === st.state ? "#14234f" : "#101b40";
          }).attr("filter", function (f) { return lvl === "us" && want[f.id] && sv[f.id].flagged > smax * 0.45 ? "url(#mp-glow)" : null; })
            .style("cursor", function (f) { return want[f.id] && (lvl === "us" || f.id !== st.state) ? "pointer" : "default"; });
          // counties of the state in focus
          var inState = function (f) { return lvl !== "us" && f.id.slice(0, 2) === st.state; };
          var vals = {}, cmax = 1;
          countiesF.forEach(function (f) { if (!inState(f)) return; var c = G.counties[f.key]; var v = c ? cval(c, st.dr, t) : null; vals[f.key] = v; if (v) cmax = Math.max(cmax, v.flagged); });
          var cHeat = d3.scaleSequentialSqrt([0, cmax], function (x) { return heatI(0.12 + 0.88 * x); });
          ctP.style("display", function (f) { return inState(f) ? null : "none"; })
            .attr("fill", function (f) { var v = vals[f.key], c = G.counties[f.key]; if (!v || v.flagged < 1) return "#1a2c62"; return c.outside ? "url(#mp-hatch)" : cHeat(v.flagged); })
            .attr("filter", function (f) { var v = vals[f.key]; return v && v.flagged > cmax * 0.5 && !G.counties[f.key].outside ? "url(#mp-glow)" : null; })
            .attr("stroke", function (f) { return f.key === st.county ? "#ffffff" : "#24366a"; }).attr("stroke-width", function (f) { return f.key === st.county ? 2.4 : 0.5; });
          ctP.filter(function (f) { return f.key === st.county; }).raise();
          // designated areas of the selected declaration(s), in the state in focus
          var dfeat = [];
          if (lvl !== "us") (st.dr ? [st.dr] : Object.keys(G.DESIGNATED)).forEach(function (dr) { var d = G.DESIGNATED[dr]; if (G.ST[d.state] !== st.state || (t != null && frac(dr, t) === 0)) return; d.counties.forEach(function (n) { var f = byKey[G.ST[d.state] + "|" + n]; if (f) dfeat.push(f); }); });
          desig.selectAll("path").data(dfeat, function (f) { return f.id; }).join("path").attr("d", path).attr("fill", "none").attr("stroke", "#78a9ff").attr("stroke-width", 1.3).attr("stroke-dasharray", "3,2").attr("vector-effect", "non-scaling-stroke");
          // networks: flows from the hub to each county it reaches
          var ctr = function (k) { var f = byKey[k]; return f ? path.centroid(f) : null; };
          var maxR = d3.max(F.NETS, function (n) { return n.atRisk; });
          overlay.lines = []; overlay.hubs = []; overlay.pins = []; overlay.labels = [];
          if (st.nets) F.NETS.forEach(function (n) {
            if (!netLive(n, t, st.dr)) return;
            var hk = G.netHub(n.id), h = ctr(hk); if (!h) return;
            var seen = {};
            areas(n.id).concat(((G.NET_GEO[n.id] || {}).also || []).map(function (a) { return [a[0], a[1], 0, null]; })).forEach(function (a) {
              var ck = G.key(a[0], a[1]); if (ck === hk || seen[ck]) return; seen[ck] = 1;
              if (a[3] && ((st.dr && a[3] !== st.dr) || frac(a[3], t) === 0)) return;
              var c = ctr(ck); if (!c) return;
              overlay.lines.push({ id: n.id + ck, net: n, a: h, b: c, cross: ck.slice(0, 2) !== hk.slice(0, 2) });
            });
            overlay.hubs.push({ id: n.id, n: n, p: h, r: 4 + 8 * Math.sqrt(n.atRisk / maxR) });
          });
          if ((!st.dr || st.dr === "DR-9921-LA") && frac("DR-9921-LA", t) > 0.05) { var tp = ctr(G.key("Terrebonne", "LA")); if (tp) overlay.pins.push({ id: "seed", p: [tp[0] + 6, tp[1] - 6] }); }
          // labels: state totals nationally, county names when drilled in
          if (lvl === "us") G.states.forEach(function (f) { var s = stateByFips[f]; if (!s || sv[f].flagged < 1) return; var c = path.centroid(s); overlay.labels.push({ id: "s" + f, p: c, t1: ABBR[f], t2: big(sv[f].flagged) }); });
          else countiesF.forEach(function (f) { var v = vals[f.key]; if (!v || v.flagged < 1) return; overlay.labels.push({ id: f.key, p: path.centroid(f), t1: f.properties.name, t2: big(v.flagged) }); });
          drawOverlay(); crumbs(); legend(); clock(); side();
        }
        function drawOverlay() {
          lnG.selectAll("line").data(overlay.lines, function (d) { return d.id; }).join("line").attr("class", "mp-flow")
            .attr("stroke", function (d) { return d.cross ? "#ff8a5b" : F.SCHEMES[d.net.scheme].color; }).attr("stroke-width", function (d) { return d.cross ? 2 : 1.5; })
            .attr("stroke-dasharray", "6 6").attr("stroke-linecap", "round").attr("opacity", 0.9);
          hubG.selectAll("circle").data(overlay.hubs, function (d) { return d.id; }).join("circle").attr("r", function (d) { return d.r; }).attr("fill", "#0b1430").attr("stroke", function (d) { return F.SCHEMES[d.n.scheme].color; }).attr("stroke-width", 2.2).attr("filter", "url(#mp-glow)").style("cursor", "pointer")
            .on("mouseover", function (e, d) { showTip(e, "<div style='color:#78a9ff;margin-bottom:2px'>" + esc(F.SCHEMES[d.n.scheme].label) + "</div><b style='color:#fff'>" + esc(d.n.name) + "</b><div>" + d.n.regs.toLocaleString() + " registrations · " + big(d.n.atRisk) + " at risk<br>" + d.n.drs.join(" · ") + "<br><span style='color:#a6c8ff'>Click to open the network</span></div>"); })
            .on("mouseout", hideTip).on("click", function (e, d) { e.stopPropagation(); window.APP.state.networkScenario = d.id; window.APP.nav("network"); });
          var pins = pinG.selectAll("g").data(overlay.pins, function (d) { return d.id; }).join(function (en) { var gg = en.append("g").style("cursor", "pointer"); gg.append("circle").attr("class", "mp-pulse").attr("r", 6).attr("fill", "none").attr("stroke", "#ff4d4d").attr("stroke-width", 2); gg.append("circle").attr("r", 5).attr("fill", "#ff4d4d").attr("stroke", "#fff").attr("stroke-width", 1.5); return gg; });
          pins.on("mouseover", function (e) { showTip(e, "<div style='color:#ffb4a8;margin-bottom:2px'>Held before payment</div><b style='color:#fff'>R-104417 · $17,280</b><div>Kendra L. Batiste · Houma, Terrebonne Parish<br><span style='color:#a6c8ff'>Click to open the registration</span></div>"); })
            .on("mouseout", hideTip).on("click", function (e) { e.stopPropagation(); window.APP.openAllegation(F.SEED); });
          var labs = labG.selectAll("g").data(overlay.labels, function (d) { return d.id; }).join(function (en) { var gg = en.append("g"); gg.append("text").attr("class", "l1"); gg.append("text").attr("class", "l2"); return gg; });
          labs.select(".l1").text(function (d) { return d.t1; }).attr("text-anchor", "middle").attr("font-size", 11).attr("font-weight", 600).attr("fill", "#fff").attr("paint-order", "stroke").attr("stroke", "#0b1430").attr("stroke-width", 3);
          labs.select(".l2").text(function (d) { return d.t2; }).attr("text-anchor", "middle").attr("dy", 12).attr("font-size", 10).attr("font-family", "IBM Plex Mono,monospace").attr("fill", "#ffd27a").attr("paint-order", "stroke").attr("stroke", "#0b1430").attr("stroke-width", 3);
          place();
        }
        // overlay positions follow the zoom, in screen pixels
        function place() {
          var P = function (p) { return tr.apply(p); };
          lnG.selectAll("line").attr("x1", function (d) { return P(d.a)[0]; }).attr("y1", function (d) { return P(d.a)[1]; }).attr("x2", function (d) { return P(d.b)[0]; }).attr("y2", function (d) { return P(d.b)[1]; });
          hubG.selectAll("circle").attr("cx", function (d) { return P(d.p)[0]; }).attr("cy", function (d) { return P(d.p)[1]; });
          pinG.selectAll("g").attr("transform", function (d) { var q = P(d.p); return "translate(" + q[0] + "," + q[1] + ")"; });
          labG.selectAll("g").attr("transform", function (d) { var q = P(d.p); return "translate(" + q[0] + "," + (q[1] + 14) + ")"; })
            .attr("opacity", function () { return st.level === "us" || tr.k >= 2.5 ? 1 : 0; });
        }
        function crumbs() {
          var parts = ['<button data-c="us">United States</button>'];
          if (st.level !== "us" && st.state) parts.push(st.level === "county" ? '<button data-c="state">' + esc(stateByFips[st.state].properties.name) + '</button>' : '<span style="color:#fff;font-weight:600">' + esc(stateByFips[st.state].properties.name) + '</span>');
          if (st.level === "county" && G.counties[st.county]) parts.push('<span style="color:#fff;font-weight:600">' + esc(countyLabel(G.counties[st.county]).replace(/, [A-Z]{2}$/, "")) + '</span>');
          if (st.level === "us") parts[0] = '<span style="color:#fff;font-weight:600">United States</span>';
          crumb.html('<i class="ti ti-map-2" style="color:#78a9ff"></i> ' + parts.join(' <span style="color:#5d6f99">›</span> ') + (st.level !== "us" ? ' <span style="color:#5d6f99;font-size:10.5px;margin-left:6px">Esc to go back</span>' : ' <span style="color:#5d6f99;font-size:10.5px;margin-left:6px">click a state</span>'));
          crumb.selectAll("button").on("click", function () { var c = this.getAttribute("data-c"); if (c === "us") toNation(); else drillState(st.state); });
        }
        function legend() {
          var stops = [0.12, 0.35, 0.6, 0.85, 1].map(function (x) { return heatI(x); });
          document.getElementById("mp-legend").innerHTML =
            '<span style="display:flex;align-items:center;gap:6px"><span style="display:inline-flex;height:9px;width:70px;border-radius:2px;overflow:hidden">' + stops.map(function (c) { return '<span style="flex:1;background:' + c + '"></span>'; }).join("") + '</span>Flagged $</span>' +
            '<span style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:9px;border:1.3px dashed #78a9ff;border-radius:2px"></span>Designated area</span>' +
            '<span style="display:flex;align-items:center;gap:6px"><span style="width:14px;height:9px;border-radius:2px;background:repeating-linear-gradient(45deg,#ffb347 0 2px,#3b2a10 2px 5px)"></span>Claimed outside a declared area</span>' +
            '<span style="display:flex;align-items:center;gap:6px"><span style="width:18px;height:0;border-top:2px dashed #78a9ff"></span>Money flow · network</span>' +
            '<span style="display:flex;align-items:center;gap:6px"><span style="width:18px;height:0;border-top:2px dashed #ff8a5b"></span>Crosses state lines</span>' +
            '<span style="display:flex;align-items:center;gap:6px"><span style="width:9px;height:9px;border-radius:50%;background:#ff4d4d"></span>Held before payment</span>' +
            '<span style="color:#8d9bb8">Scroll to zoom · drag to pan</span>';
        }
        function clock() {
          var t = tOf(st.step), d = el.querySelector("#mp-date"), w = el.querySelector("#mp-when");
          if (d) d.textContent = t == null ? "Today" : "Week of " + fmtDate(t);
          if (w) { var last = EVENTS.filter(function (e) { return e.kind === "decl" && (t == null || e.t <= t); }).pop(); w.textContent = last ? "Latest: " + F.DECLS[last.dr].name + " (" + F.DECLS[last.dr].state + ")" : "Before the first declaration"; }
          if (range && +range.value !== (st.step == null ? STEPS : st.step)) range.value = st.step == null ? STEPS : st.step;
        }

        // ---------- interactions ----------
        stP.on("click", function (e, f) { if (!want[f.id]) return; if (st.level === "us" || f.id !== st.state) drillState(f.id); })
          .on("mouseover", function (e, f) { if (!want[f.id] || (st.level !== "us" && f.id === st.state)) return hideTip(); var v = stateVal(f.id, tOf(st.step)); showTip(e, "<b style='color:#fff'>" + esc(f.properties.name) + "</b><div>" + (v.flagged ? big(v.flagged) + " flagged · " + v.regs.toLocaleString() + " registrations" : "No flagged registrations") + "<br><span style='color:#a6c8ff'>Click to drill in</span></div>"); })
          .on("mouseout", hideTip);
        ctP.on("click", function (e, f) { if (G.counties[f.key]) drillCounty(f.key); })
          .on("mouseover", function (e, f) {
            var c = G.counties[f.key], v = c ? cval(c, st.dr, tOf(st.step)) : null, lbl = f.properties.name + (ABBR[f.id.slice(0, 2)] === "LA" ? " Parish" : " County");
            if (!c || !v || v.flagged < 1) return showTip(e, "<b style='color:#fff'>" + esc(lbl) + "</b><div>" + (c && c.decls.length ? "Designated · " + c.decls.join(", ") + "<br>" : "") + "No flagged registrations" + (c && c.hubs.length ? "<br>Base of " + c.hubs.length + " network" + (c.hubs.length > 1 ? "s" : "") : "") + "</div>");
            var nn = Object.keys(c.nets).filter(function (id) { return netHere(id, f.key, tOf(st.step), st.dr) > 0; }).length;
            showTip(e, "<b style='color:#fff'>" + esc(lbl) + "</b><div style='color:" + (c.outside ? "#ffd27a" : "#a6c8ff") + "'>" + (c.outside ? "Outside every declared area" : "Designated · " + c.decls.join(", ")) + "</div><div>" + big(v.flagged) + " flagged · " + v.regs.toLocaleString() + " registrations<br>" + nn + " network" + (nn === 1 ? "" : "s") + " active here</div>");
          }).on("mouseout", hideTip);

        function boundsOf(feats) { var b = [[Infinity, Infinity], [-Infinity, -Infinity]]; feats.forEach(function (f) { var x = path.bounds(f); b[0][0] = Math.min(b[0][0], x[0][0]); b[0][1] = Math.min(b[0][1], x[0][1]); b[1][0] = Math.max(b[1][0], x[1][0]); b[1][1] = Math.max(b[1][1], x[1][1]); }); return b; }
        function fly(b, pad, instant) {
          var dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1], cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2;
          var s = Math.max(1, Math.min(60, (1 - pad) / Math.max(dx / W, dy / (H - 90))));
          var to = d3.zoomIdentity.translate(W / 2 - s * cx, (H - 50) / 2 - s * cy).scale(s);
          (instant ? svg : svg.transition().duration(950).ease(d3.easeCubicInOut)).call(zoom.transform, to);
        }
        function toNation(instant) { st.level = "us"; st.state = null; st.county = null; paint(); (instant ? svg : svg.transition().duration(950).ease(d3.easeCubicInOut)).call(zoom.transform, d3.zoomIdentity); }
        function drillState(fips, instant) {
          st.level = "state"; st.state = fips; st.county = null; paint();
          var hot = countiesF.filter(function (f) { var c = G.counties[f.key]; return f.id.slice(0, 2) === fips && c && (c.flagged > 0 || (st.dr && c.decls.indexOf(st.dr) >= 0)); });
          fly(boundsOf(hot.length ? hot : [stateByFips[fips]]), hot.length ? 0.4 : 0.1, instant);
        }
        function drillCounty(key, instant) {
          var f = byKey[key]; if (!f) return;
          st.level = "county"; st.state = key.slice(0, 2); st.county = key; paint();
          fly(path.bounds(f), 0.62, instant);
        }
        function up() { if (st.level === "county") drillState(st.state); else if (st.level === "state") toNation(); }
        var onKey = function (e) { if (!document.body.contains(el)) { document.removeEventListener("keydown", onKey); return; } if (e.key === "Escape") up(); };
        document.addEventListener("keydown", onKey);

        // ---------- playback ----------
        var queue = [], showing = false;
        // callouts come one at a time, at most three on screen
        function toast(html, tone) { queue.push([html, tone]); if (!showing) next(); }
        function next() {
          var q = queue.shift(); if (!q) { showing = false; return; }
          showing = true;
          var kids = toasts.selectAll("div").nodes(); if (kids.length >= 3) d3.select(kids[0]).remove();
          show(q[0], q[1]); setTimeout(next, 650);
        }
        function show(html, tone) {
          var n = toasts.append("div").attr("class", "mp-glass").style("padding", "7px 11px").style("font-size", "11.5px").style("max-width", "300px").style("animation", "mp-toast .3s ease-out").style("border-color", tone || "rgba(166,200,255,.22)").html(html);
          setTimeout(function () { n.transition().duration(500).style("opacity", 0).remove(); }, 3600);
        }
        function flashDecl(dr) {
          var d = G.DESIGNATED[dr], feats = d.counties.map(function (n) { return byKey[G.ST[d.state] + "|" + n]; }).filter(Boolean);
          var c = path.centroid(stateByFips[G.ST[d.state]]); if (st.level !== "us" && st.state === G.ST[d.state]) { var b = boundsOf(feats); c = [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2]; }
          var q = tr.apply(c);
          var ring = flashG.append("circle").attr("cx", q[0]).attr("cy", q[1]).attr("r", 8).attr("fill", "none").attr("stroke", "#ff7a4d").attr("stroke-width", 3);
          ring.transition().duration(1400).attr("r", 60).style("opacity", 0).remove();
        }
        function fire(prev, now) {
          EVENTS.forEach(function (e) {
            if (!(e.t > prev && e.t <= now)) return;
            if (st.dr && e.kind === "decl" && e.dr !== st.dr) return;
            if (e.kind === "decl") { flashDecl(e.dr); toast('<b style="color:#ff9a6b">Declared · ' + e.dr + '</b><br>' + esc(F.DECLS[e.dr].name) + ' · ' + esc(F.DECLS[e.dr].stateName)); }
            else toast('<b style="color:#ffd27a">Seen before</b><br>' + esc(F.net(e.net).name) + ': first in ' + e.from + ', now in ' + e.to + '.', "rgba(255,210,122,.5)");
          });
        }
        function setStep(s, quiet) {
          var prev = tOf(st.step); prev = prev == null ? T1 : prev;
          st.step = s >= STEPS ? null : s;
          var now = tOf(st.step); now = now == null ? T1 : now;
          if (!quiet && now > prev) fire(prev, now);
          paint();
        }
        function stop() { if (timer) clearInterval(timer); timer = null; playBtn.innerHTML = '<i class="ti ti-player-play-filled"></i>'; }
        playBtn.onclick = function () {
          if (timer) return stop();
          if (st.step == null) setStep(0, true);
          playBtn.innerHTML = '<i class="ti ti-player-pause-filled"></i>';
          timer = setInterval(function () {
            if (!document.body.contains(el)) return stop();
            var s = (st.step == null ? STEPS : st.step) + 1;
            setStep(s);
            if (s >= STEPS) stop();
          }, 230);
        };
        range.oninput = function () { stop(); setStep(+range.value, true); };

        paint();
        return { paint: paint, drillState: drillState, drillCounty: drillCounty, toNation: toNation };
      }
    }
  };

  // ---------- side panels ----------
  function stat(l, v, s) { return '<div><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">' + l + '</div><div style="font-weight:600;font-size:18px;font-variant-numeric:tabular-nums">' + v + '</div>' + (s ? '<div style="font-size:10.5px;color:var(--text2)">' + s + '</div>' : '') + '</div>'; }
  function summaryPanel(fips, t) {
    var dr = st.dr, D = dr ? F.DECLS[dr] : null, T = { flagged: 0, regs: 0, counties: 0, outside: 0, outsideAmt: 0 };
    var rows = Object.keys(G.counties).filter(function (k) { return !fips || k.slice(0, 2) === fips; }).map(function (k) { return { k: k, c: G.counties[k], v: cval(G.counties[k], dr, t) }; }).filter(function (x) { return x.v.flagged >= 1; });
    rows.forEach(function (x) { T.flagged += x.v.flagged; T.regs += x.v.regs; T.counties++; if (x.c.outside) { T.outside++; T.outsideAmt += x.v.flagged; } });
    rows.sort(function (a, b) { return b.v.flagged - a.v.flagged; });
    var nets = F.NETS.filter(function (n) { return netLive(n, t, dr) && (!fips || areas(n.id).some(function (a) { return G.ST[a[1]] === fips; })); }).sort(function (a, b) { return b.atRisk - a.atRisk; });
    var title = fips ? esc(stateNameOf(fips)) : D ? esc(D.name) + ' · ' + D.stateName : "All declarations";
    var sub = (D ? D.id + " · declared " + D.declared : Object.keys(G.DESIGNATED).length + " declarations") + (t == null ? "" : " · as of " + fmtDate(t));
    return '<div class="card" style="margin:0"><div style="font-weight:600;font-size:13.5px;color:var(--ink)">' + title + '</div>' +
      '<div class="mono" style="font-size:10.5px;color:var(--text3);margin-bottom:10px">' + esc(sub) + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + stat("Flagged", big(T.flagged), T.regs.toLocaleString() + " registrations") + stat("Networks", nets.length, "active here") + stat("Counties / parishes", T.counties, "with flagged registrations") + stat("Outside declared areas", big(T.outsideAmt), T.outside + " count" + (T.outside === 1 ? "y" : "ies")) + '</div></div>' +
      '<div class="card" style="margin:0;padding:0;overflow:hidden"><div style="padding:9px 12px;font-weight:500;font-size:12.5px;border-bottom:0.5px solid var(--border2)">Most flagged · click to fly in</div>' +
      (rows.length ? rows.slice(0, 6).map(function (x) { return '<div data-county="' + x.k + '" style="display:flex;justify-content:space-between;gap:8px;padding:7px 12px;border-top:0.5px solid var(--border2);cursor:pointer;font-size:12px"><span>' + esc(countyLabel(x.c)) + (x.c.outside ? ' <span class="tag" style="background:var(--med-bg);color:var(--med-tx);font-size:9.5px">outside</span>' : '') + '</span><span class="mono" style="font-weight:600">' + big(x.v.flagged) + '</span></div>'; }).join("") : '<div style="padding:9px 12px;font-size:12px;color:var(--text3)">Nothing flagged yet</div>') + '</div>' +
      '<div class="card" style="margin:0;padding:0;overflow:hidden"><div style="padding:9px 12px;font-weight:500;font-size:12.5px;border-bottom:0.5px solid var(--border2)">Networks · click to open</div>' +
      (nets.length ? nets.slice(0, 6).map(function (n) { return '<div data-net="' + n.id + '" style="display:flex;justify-content:space-between;gap:8px;padding:7px 12px;border-top:0.5px solid var(--border2);cursor:pointer;font-size:12px"><span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + F.SCHEMES[n.scheme].color + ';margin-right:6px"></span>' + esc(n.name) + '</span><span class="mono" style="font-weight:600">' + big(n.atRisk) + '</span></div>'; }).join("") : '<div style="padding:9px 12px;font-size:12px;color:var(--text3)">None yet</div>') + '</div>';
  }
  var STATE_NAMES = { "22": "Louisiana", "28": "Mississippi", "48": "Texas", "12": "Florida", "37": "North Carolina", "06": "California", "13": "Georgia", "32": "Nevada", "40": "Oklahoma", "04": "Arizona", "47": "Tennessee", "01": "Alabama" };
  function stateNameOf(fips) { return STATE_NAMES[fips] || fips; }
  function countyPanel(c, t) {
    var v = cval(c, st.dr, t);
    var nets = Object.keys(c.nets).map(function (id) { return { n: F.net(id), amt: netHere(id, c.key, t, st.dr) }; }).filter(function (x) { return x.amt >= 1; }).sort(function (a, b) { return b.amt - a.amt; });
    var hubs = c.hubs.map(function (id) { return F.net(id); });
    var seed = c.key === G.key("Terrebonne", "LA") && (!st.dr || st.dr === "DR-9921-LA") && frac("DR-9921-LA", t) > 0.05;
    return '<div class="card" style="margin:0"><div style="font-weight:600;font-size:14px;color:var(--ink)">' + esc(countyLabel(c)) + '</div>' +
      '<div style="margin:5px 0 10px;display:flex;gap:4px;flex-wrap:wrap">' + (c.outside ? '<span class="tag" style="background:var(--med-bg);color:var(--med-tx)">Outside every declared area</span>' : c.decls.map(function (d) { return '<span class="tag mono" title="' + esc(F.DECLS[d].name) + '">' + d + '</span>'; }).join("")) + (t == null ? "" : '<span class="tag" style="font-size:10px">as of ' + fmtDate(t) + '</span>') + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + stat("Flagged", big(v.flagged)) + stat("Registrations", v.regs.toLocaleString()) + '</div>' +
      (c.outside && v.flagged >= 1 ? '<div style="font-size:11.5px;color:var(--text2);margin-top:8px;line-height:1.45">Registrations claim damaged homes here, but no declaration designates this area for Individual Assistance.</div>' : '') +
      (c.isoAmt && !c.outside && v.flagged >= 1 ? '<div style="font-size:11.5px;color:var(--text2);margin-top:8px">' + usd(Math.round(c.isoAmt * (v.flagged / c.flagged))) + ' of it is isolated flags with no network.</div>' : '') + '</div>' +
      (seed ? '<div class="card" data-open="' + F.SEED + '" style="margin:0;cursor:pointer;border-color:#f3c9c9;background:var(--high-bg)"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--high-tx)">Held before payment</div><div style="font-weight:600;font-size:13px;margin-top:2px">R-104417 · Kendra L. Batiste · $17,280</div><div style="font-size:11.5px;color:var(--text2)">418 Cypress Bend Rd, Houma · open the registration <i class="ti ti-arrow-right"></i></div></div>' : '') +
      '<div class="card" style="margin:0;padding:0;overflow:hidden"><div style="padding:9px 12px;font-weight:500;font-size:12.5px;border-bottom:0.5px solid var(--border2)">Networks with registrations here</div>' +
      (nets.length ? nets.map(function (x) { return '<div data-net="' + x.n.id + '" style="display:flex;justify-content:space-between;gap:8px;padding:7px 12px;border-top:0.5px solid var(--border2);cursor:pointer;font-size:12px"><span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + F.SCHEMES[x.n.scheme].color + ';margin-right:6px"></span>' + esc(x.n.name) + '</span><span class="mono" style="font-weight:600">' + big(x.amt) + '</span></div>'; }).join("") : '<div style="padding:9px 12px;font-size:12px;color:var(--text3)">None</div>') + '</div>' +
      (hubs.length ? '<div class="card" style="margin:0;padding:0;overflow:hidden"><div style="padding:9px 12px;font-weight:500;font-size:12.5px;border-bottom:0.5px solid var(--border2)">Networks based here</div>' + hubs.map(function (n) { return '<div data-net="' + n.id + '" style="display:flex;justify-content:space-between;gap:8px;padding:7px 12px;border-top:0.5px solid var(--border2);cursor:pointer;font-size:12px"><span>' + esc(n.name) + '</span><span style="font-size:11px;color:var(--text3)">' + esc(F.SCHEMES[n.scheme].hub) + '</span></div>'; }).join("") + '</div>' : '');
  }
})();
