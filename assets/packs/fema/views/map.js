/* Disaster-relief pack · Insights › Map — flagged registrations and fraud
   networks by county/parish, across declarations: the view emergency managers
   think in. Counties shade by flagged dollars; designated areas are outlined;
   dollars claimed outside a declared area are hatched; each network is drawn
   from where it is based to the counties where its registrations claim damage.
   Boundaries: US Census via us-atlas (geo/counties-10m.json), drawn with d3-geo
   + topojson-client. Data: fema-geo.js. Adds Views.map. */
(function () {
  window.Views = window.Views || {};
  var F = window.FEMA, G = F.GEO;
  var esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var big = function (n) { return F.bigUsd(n); };
  var ABBR = {}; Object.keys(G.ST).forEach(function (a) { ABBR[G.ST[a]] = a; });
  var topoP = null; // the boundary file, fetched once
  function topo() { return topoP || (topoP = fetch("assets/packs/fema/geo/counties-10m.json").then(function (r) { return r.json(); })); }
  var st = { dr: "", nets: true, county: null };

  window.Views.map = {
    render: function (mount) {
      var chip = function (v, l, sub) { return '<button class="qscope mp-dr' + (st.dr === v ? " active" : "") + '" data-dr="' + v + '" title="' + esc(sub || "") + '">' + l + '</button>'; };
      mount.innerHTML = '<div class="page">' +
        '<div class="page-head"><div><div class="page-title">Map</div><div class="page-sub">Flagged registrations and fraud networks by county and parish, across declarations.</div></div>' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2);cursor:pointer"><input type="checkbox" id="mp-nets"' + (st.nets ? " checked" : "") + '> Show networks</label></div>' +
        '<div style="display:flex;gap:2px;flex-wrap:wrap;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px;margin-bottom:12px;width:fit-content">' +
        chip("", "All declarations") + Object.keys(G.DESIGNATED).map(function (dr) { var d = F.DECLS[dr]; return chip(dr, dr, d.name + " · " + d.stateName); }).join("") + '</div>' +
        '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">' +
        '<div class="card" style="flex:1;min-width:420px;padding:0;overflow:hidden;margin:0"><div id="mp-map" style="position:relative;height:600px;background:var(--surface)"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text3);font-size:12px"><i class="ti ti-loader-2"></i>&nbsp;Loading county boundaries…</div></div>' +
        '<div class="legend" id="mp-legend" style="margin:0;padding:8px 12px;border-top:0.5px solid var(--border2)"></div></div>' +
        '<div id="mp-side" style="width:320px;flex:none;display:flex;flex-direction:column;gap:10px"></div></div></div>';
      mount.querySelectorAll(".mp-dr").forEach(function (b) { b.onclick = function () { st.dr = b.getAttribute("data-dr"); st.county = null; mount.querySelectorAll(".mp-dr").forEach(function (x) { x.classList.toggle("active", x === b); }); if (api) { api.paint(); api.zoomTo(st.dr); } side(); }; });
      document.getElementById("mp-nets").onchange = function () { st.nets = this.checked; if (api) api.paint(); };
      var api = null;
      side();
      topo().then(function (t) {
        if (!document.getElementById("mp-map")) return;
        api = draw(t);
        api.zoomTo(st.dr, true);
      }).catch(function () { var m = document.getElementById("mp-map"); if (m) m.innerHTML = '<div style="padding:30px;color:var(--text2);font-size:12px">The county boundaries could not be loaded.</div>'; });
      function side() { var el = document.getElementById("mp-side"); if (el) { el.innerHTML = st.county ? countyPanel(G.counties[st.county]) : summaryPanel(); wireSide(el); } }
      function wireSide(el) {
        el.querySelectorAll("[data-county]").forEach(function (r) { r.onclick = function () { st.county = r.getAttribute("data-county"); side(); if (api) { api.paint(); api.zoomCounty(st.county); } }; });
        el.querySelectorAll("[data-net]").forEach(function (r) { r.onclick = function () { window.APP.state.networkScenario = r.getAttribute("data-net"); window.APP.nav("network"); }; });
        el.querySelectorAll("[data-open]").forEach(function (r) { r.onclick = function () { window.APP.openAllegation(r.getAttribute("data-open")); }; });
        var b = el.querySelector("#mp-back"); if (b) b.onclick = function () { st.county = null; side(); if (api) { api.paint(); api.zoomTo(st.dr); } };
      }
      // ---------- the map ----------
      function draw(t) {
        var el = document.getElementById("mp-map"); el.innerHTML = "";
        var W = el.clientWidth || 900, H = el.clientHeight || 600;
        var want = {}; G.states.forEach(function (s) { want[s] = 1; });
        var statesF = topojson.feature(t, t.objects.states).features;
        var countiesF = topojson.feature(t, t.objects.counties).features.filter(function (f) { return want[f.id.slice(0, 2)]; });
        var byKey = {}; countiesF.forEach(function (f) { byKey[f.id.slice(0, 2) + "|" + f.properties.name] = f; });
        var proj = d3.geoAlbersUsa().fitExtent([[16, 16], [W - 16, H - 16]], { type: "FeatureCollection", features: statesF.filter(function (f) { return want[f.id]; }) });
        var path = d3.geoPath(proj);
        var svg = d3.select(el).append("svg").attr("width", "100%").attr("height", H).attr("viewBox", "0 0 " + W + " " + H).style("display", "block").style("font-family", "IBM Plex Sans,sans-serif");
        var defs = svg.append("defs");
        var hatch = defs.append("pattern").attr("id", "mp-hatch").attr("patternUnits", "userSpaceOnUse").attr("width", 5).attr("height", 5).attr("patternTransform", "rotate(45)");
        hatch.append("rect").attr("width", 5).attr("height", 5).attr("fill", "#fbe6cf");
        hatch.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 5).attr("stroke", "#c77d11").attr("stroke-width", 2.2);
        var root = svg.append("g");
        root.append("g").selectAll("path").data(statesF).join("path").attr("d", path).attr("fill", function (f) { return want[f.id] ? "#ffffff" : "#eef1f6"; }).attr("stroke", "none");
        var cty = root.append("g").selectAll("path").data(countiesF).join("path").attr("d", path).attr("vector-effect", "non-scaling-stroke").attr("stroke", "#dde3ec").attr("stroke-width", 0.5).style("cursor", "pointer");
        root.append("path").datum(topojson.mesh(t, t.objects.states, function (a, b) { return a !== b; })).attr("d", path).attr("fill", "none").attr("stroke", "#9aa8b6").attr("stroke-width", 0.9).attr("vector-effect", "non-scaling-stroke").style("pointer-events", "none");
        var desig = root.append("g").style("pointer-events", "none");
        var labG = root.append("g").style("pointer-events", "none");
        var netG = root.append("g");
        var tip = d3.select(el).append("div").style("position", "absolute").style("background", "#001141").style("color", "#f2f4f8").style("border-radius", "7px").style("padding", "8px 11px").style("font-size", "11px").style("line-height", "1.45").style("max-width", "270px").style("pointer-events", "none").style("opacity", 0).style("box-shadow", "0 6px 18px rgba(0,0,0,.2)");
        function showTip(e, html) { var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; tip.html(html).style("opacity", 1).style("left", Math.max(4, Math.min(x + 14, W - 280)) + "px"); var th = tip.node().offsetHeight; tip.style("top", (y + th + 16 > H ? Math.max(4, y - th - 12) : y + 12) + "px"); }
        var centroid = function (k) { var f = byKey[k]; return f ? path.centroid(f) : null; };
        var k = 1;
        var zoom = d3.zoom().scaleExtent([1, 40]).on("zoom", function (e) { k = e.transform.k; root.attr("transform", e.transform); netG.selectAll("circle.hub").attr("r", function (d) { return d.r / k; }).attr("stroke-width", 1.6 / k); netG.selectAll("line").attr("stroke-width", function (d) { return d.w / k; }); netG.selectAll("circle.pin").attr("r", 5 / k).attr("stroke-width", 1.5 / k);
          hatch.attr("patternTransform", "rotate(45) scale(" + (1 / k) + ")");
          labG.selectAll("text").attr("font-size", 10.5 / k).attr("stroke-width", 3 / k).attr("opacity", k >= 3 ? 1 : 0); });
        svg.call(zoom).on("dblclick.zoom", null);

        function valueOf(f) { var c = G.counties[f.id.slice(0, 2) + "|" + f.properties.name]; return c ? G.value(c, st.dr) : null; }
        function paint() {
          var vals = countiesF.map(valueOf).filter(function (v) { return v && v.flagged > 0; }).map(function (v) { return v.flagged; });
          var max = d3.max(vals) || 1;
          var color = d3.scaleSequentialSqrt([0, max], function (t) { return d3.interpolateRgb("#fde8e6", "#8b1a13")(0.1 + 0.9 * t); });
          cty.attr("fill", function (f) {
            var key = f.id.slice(0, 2) + "|" + f.properties.name, c = G.counties[key], v = valueOf(f);
            if (!c || !v || !v.flagged) return "transparent";
            if (c.outside) return "url(#mp-hatch)";
            return color(v.flagged);
          }).attr("stroke", function (f) { return (f.id.slice(0, 2) + "|" + f.properties.name) === st.county ? "#0f62fe" : "#dde3ec"; }).attr("stroke-width", function (f) { return (f.id.slice(0, 2) + "|" + f.properties.name) === st.county ? 2.5 : 0.5; });
          // designated areas of the selected declaration(s)
          var drs = st.dr ? [st.dr] : Object.keys(G.DESIGNATED);
          var dfeat = []; drs.forEach(function (dr) { var d = G.DESIGNATED[dr]; d.counties.forEach(function (n) { var f = byKey[G.ST[d.state] + "|" + n]; if (f) dfeat.push(f); }); });
          desig.selectAll("path").data(dfeat).join("path").attr("d", path).attr("fill", "none").attr("stroke", "#0043ce").attr("stroke-width", 1.4).attr("stroke-dasharray", "3,2").attr("vector-effect", "non-scaling-stroke");
          // networks: hub → the counties it reaches
          var nets = !st.nets ? [] : F.NETS.filter(function (n) { return !st.dr || n.drs.indexOf(st.dr) >= 0; });
          var maxR = d3.max(F.NETS, function (n) { return n.atRisk; });
          var lines = [], hubs = [];
          nets.forEach(function (n) {
            var hk = G.netHub(n.id), h = centroid(hk); if (!h) return;
            G.netCounties(n.id).forEach(function (ck) { var c = centroid(ck); if (!c || ck === hk) return; lines.push({ net: n.id, x1: h[0], y1: h[1], x2: c[0], y2: c[1], cross: ck.slice(0, 2) !== hk.slice(0, 2), w: ck.slice(0, 2) !== hk.slice(0, 2) ? 1.8 : 1.2 }); });
            hubs.push({ net: n.id, x: h[0], y: h[1], r: 4 + 9 * Math.sqrt(n.atRisk / maxR), n: n });
          });
          netG.selectAll("line").data(lines).join("line").attr("x1", function (d) { return d.x1; }).attr("y1", function (d) { return d.y1; }).attr("x2", function (d) { return d.x2; }).attr("y2", function (d) { return d.y2; })
            .attr("stroke", function (d) { return d.cross ? "#d9480f" : F.SCHEMES[F.net(d.net).scheme].color; }).attr("stroke-dasharray", function (d) { return d.cross ? "5,3" : null; }).attr("stroke-width", function (d) { return d.w / k; }).attr("opacity", 0.75).style("pointer-events", "none");
          netG.selectAll("circle.hub").data(hubs, function (d) { return d.net; }).join("circle").attr("class", "hub").attr("cx", function (d) { return d.x; }).attr("cy", function (d) { return d.y; })
            .attr("r", function (d) { return d.r / k; }).attr("fill", "#001141").attr("fill-opacity", 0.85).attr("stroke", function (d) { return F.SCHEMES[d.n.scheme].color; }).attr("stroke-width", 1.6 / k).style("cursor", "pointer")
            .on("mouseover", function (e, d) { showTip(e, "<div style='color:#78a9ff;margin-bottom:2px'>" + esc(F.SCHEMES[d.n.scheme].label) + "</div><b>" + esc(d.n.name) + "</b><div style='color:#c1c7cd'>" + d.n.regs.toLocaleString() + " registrations · " + big(d.n.atRisk) + " at risk<br>" + d.n.drs.join(" · ") + "<br>Click to open the network</div>"); })
            .on("mouseout", function () { tip.style("opacity", 0); })
            .on("click", function (e, d) { window.APP.state.networkScenario = d.net; window.APP.nav("network"); });
          // the held registration that started the Delphine story
          var seed = (!st.dr || st.dr === "DR-9921-LA") ? [centroid(G.key("Terrebonne", "LA"))].filter(Boolean) : [];
          netG.selectAll("circle.pin").data(seed).join("circle").attr("class", "pin").attr("cx", function (d) { return d[0] + 7; }).attr("cy", function (d) { return d[1] - 7; }).attr("r", 5 / k).attr("fill", "#c6362f").attr("stroke", "#fff").attr("stroke-width", 1.5 / k).style("cursor", "pointer")
            .on("mouseover", function (e) { showTip(e, "<div style='color:#ffb4a8;margin-bottom:2px'>Held before payment</div><b>R-104417 · $17,280</b><div style='color:#c1c7cd'>Kendra L. Batiste · Houma, Terrebonne Parish<br>Click to open the registration</div>"); })
            .on("mouseout", function () { tip.style("opacity", 0); })
            .on("click", function () { window.APP.openAllegation(F.SEED); });
          // names of the counties/parishes with flagged registrations (shown once zoomed in)
          var named = countiesF.filter(function (f) { var v = valueOf(f); return v && v.flagged > 0; });
          labG.selectAll("text").data(named, function (f) { return f.id; }).join("text").attr("x", function (f) { return path.centroid(f)[0]; }).attr("y", function (f) { return path.centroid(f)[1] + 14 / k; })
            .attr("text-anchor", "middle").attr("font-size", 10.5 / k).attr("font-weight", 600).attr("fill", "#001141").attr("paint-order", "stroke").attr("stroke", "#ffffff").attr("stroke-width", 3 / k).attr("opacity", k >= 3 ? 1 : 0)
            .text(function (f) { return f.properties.name; });
          document.getElementById("mp-legend").innerHTML = legend(max);
        }
        cty.on("mouseover", function (e, f) {
          var key = f.id.slice(0, 2) + "|" + f.properties.name, c = G.counties[key], v = valueOf(f), lbl = f.properties.name + (ABBR[f.id.slice(0, 2)] === "LA" ? " Parish" : " County") + ", " + ABBR[f.id.slice(0, 2)];
          if (!c || !v || !v.flagged) { showTip(e, "<b>" + esc(lbl) + "</b><div style='color:#c1c7cd'>" + (c && c.decls.length ? "Designated · " + c.decls.join(", ") + "<br>" : "") + "No flagged registrations" + (c && c.hubs.length ? "<br>Base of " + c.hubs.length + " network" + (c.hubs.length > 1 ? "s" : "") : "") + "</div>"); return; }
          var nn = Object.keys(c.nets).length;
          showTip(e, "<b>" + esc(lbl) + "</b><div style='color:" + (c.outside ? "#ffd27a" : "#a6c8ff") + "'>" + (c.outside ? "Outside every declared area" : "Designated · " + c.decls.join(", ")) + "</div><div style='color:#c1c7cd'>" + big(v.flagged) + " flagged · " + v.regs.toLocaleString() + " registrations<br>" + nn + " network" + (nn === 1 ? "" : "s") + " active here</div>");
        }).on("mouseout", function () { tip.style("opacity", 0); })
          .on("click", function (e, f) { var key = f.id.slice(0, 2) + "|" + f.properties.name; if (!G.counties[key]) return; st.county = key; paint(); side(); });
        function boundsOf(feats) { var b = [[Infinity, Infinity], [-Infinity, -Infinity]]; feats.forEach(function (f) { var x = path.bounds(f); b[0][0] = Math.min(b[0][0], x[0][0]); b[0][1] = Math.min(b[0][1], x[0][1]); b[1][0] = Math.max(b[1][0], x[1][0]); b[1][1] = Math.max(b[1][1], x[1][1]); }); return b; }
        function zoomToBounds(b, pad, instant) {
          var dx = b[1][0] - b[0][0], dy = b[1][1] - b[0][1], cx = (b[0][0] + b[1][0]) / 2, cy = (b[0][1] + b[1][1]) / 2;
          var s = Math.max(1, Math.min(40, (1 - pad) / Math.max(dx / W, dy / H)));
          var tr = d3.zoomIdentity.translate(W / 2 - s * cx, H / 2 - s * cy).scale(s);
          (instant ? svg : svg.transition().duration(750)).call(zoom.transform, tr);
        }
        paint();
        return {
          paint: paint,
          zoomTo: function (dr, instant) {
            if (!dr) return (instant ? svg : svg.transition().duration(750)).call(zoom.transform, d3.zoomIdentity);
            var d = G.DESIGNATED[dr], feats = d.counties.map(function (n) { return byKey[G.ST[d.state] + "|" + n]; }).filter(Boolean);
            zoomToBounds(boundsOf(feats), 0.55, instant);
          },
          zoomCounty: function (key) { var f = byKey[key]; if (f) zoomToBounds(path.bounds(f), 0.8); }
        };
      }
    }
  };

  function legend(max) {
    var stops = [0.1, 0.4, 0.7, 1].map(function (t) { return d3.interpolateRgb("#fde8e6", "#8b1a13")(t); });
    return '<span class="lg"><span style="display:inline-flex;height:10px;width:64px;border-radius:2px;overflow:hidden">' + stops.map(function (c) { return '<span style="flex:1;background:' + c + '"></span>'; }).join("") + '</span>Flagged $ (up to ' + big(max) + ')</span>' +
      '<span class="lg"><span style="width:14px;height:10px;border:1.4px dashed #0043ce;border-radius:2px"></span>Designated area</span>' +
      '<span class="lg"><span style="width:14px;height:10px;border-radius:2px;background:repeating-linear-gradient(45deg,#c77d11 0 2px,#fbe6cf 2px 5px)"></span>Claimed outside a declared area</span>' +
      '<span class="lg"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#001141;border:2px solid #c6362f"></span>Network (size = $ at risk)</span>' +
      '<span class="lg"><span style="width:16px;height:0;border-top:2px dashed #d9480f"></span>Crosses state lines</span>' +
      '<span class="lg" style="color:var(--text3)">Scroll to zoom · drag to pan</span>';
  }
  function decTotals(dr) {
    var t = { flagged: 0, regs: 0, counties: 0, outside: 0, outsideAmt: 0, net: 0 };
    Object.keys(G.counties).forEach(function (key) { var c = G.counties[key], v = G.value(c, dr); if (!v.flagged) return; t.flagged += v.flagged; t.regs += v.regs; t.counties++; if (c.outside) { t.outside++; t.outsideAmt += v.flagged; } });
    return t;
  }
  function summaryPanel() {
    var dr = st.dr, T = decTotals(dr), D = dr ? F.DECLS[dr] : null;
    var nets = F.NETS.filter(function (n) { return !dr || n.drs.indexOf(dr) >= 0; }).sort(function (a, b) { return b.atRisk - a.atRisk; });
    var top = Object.keys(G.counties).map(function (k) { return { k: k, c: G.counties[k], v: G.value(G.counties[k], dr) }; }).filter(function (x) { return x.v.flagged > 0; }).sort(function (a, b) { return b.v.flagged - a.v.flagged; }).slice(0, 6);
    var stat = function (l, v, s) { return '<div><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">' + l + '</div><div style="font-weight:600;font-size:18px;font-variant-numeric:tabular-nums">' + v + '</div>' + (s ? '<div style="font-size:10.5px;color:var(--text2)">' + s + '</div>' : '') + '</div>'; };
    return '<div class="card" style="margin:0"><div style="font-weight:600;font-size:13.5px;color:var(--ink)">' + (D ? esc(D.name) + ' · ' + D.stateName : "All declarations") + '</div>' +
      '<div class="mono" style="font-size:10.5px;color:var(--text3);margin-bottom:10px">' + (D ? D.id + " · declared " + D.declared : Object.keys(G.DESIGNATED).length + " declarations · 36-month lookback") + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + stat("Flagged", big(T.flagged), T.regs.toLocaleString() + " registrations") + stat("Networks", nets.length, "with registrations here") + stat("Counties / parishes", T.counties, "with flagged registrations") + stat("Outside declared areas", big(T.outsideAmt), T.outside + " count" + (T.outside === 1 ? "y" : "ies")) + '</div></div>' +
      '<div class="card" style="margin:0;padding:0;overflow:hidden"><div style="padding:9px 12px;font-weight:500;font-size:12.5px;border-bottom:0.5px solid var(--border2)">Most flagged · click to inspect</div>' +
      top.map(function (x) { return '<div data-county="' + x.k + '" style="display:flex;justify-content:space-between;gap:8px;padding:7px 12px;border-top:0.5px solid var(--border2);cursor:pointer;font-size:12px"><span>' + esc(x.c.name) + (x.c.st === "LA" ? " Parish" : " County") + ', ' + x.c.st + (x.c.outside ? ' <span class="tag" style="background:var(--med-bg);color:var(--med-tx);font-size:9.5px">outside</span>' : '') + '</span><span class="mono" style="font-weight:600">' + big(x.v.flagged) + '</span></div>'; }).join("") + '</div>' +
      '<div class="card" style="margin:0;padding:0;overflow:hidden"><div style="padding:9px 12px;font-weight:500;font-size:12.5px;border-bottom:0.5px solid var(--border2)">Networks · click to open</div>' +
      nets.slice(0, 6).map(function (n) { return '<div data-net="' + n.id + '" style="display:flex;justify-content:space-between;gap:8px;padding:7px 12px;border-top:0.5px solid var(--border2);cursor:pointer;font-size:12px"><span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + F.SCHEMES[n.scheme].color + ';margin-right:6px"></span>' + esc(n.name) + '</span><span class="mono" style="font-weight:600">' + big(n.atRisk) + '</span></div>'; }).join("") + '</div>';
  }
  function countyPanel(c) {
    if (!c) return summaryPanel();
    var v = G.value(c, st.dr), lbl = c.name + (c.st === "LA" ? " Parish" : " County") + ", " + c.st;
    var nets = Object.keys(c.nets).map(function (id) { return { n: F.net(id), amt: c.nets[id] }; }).filter(function (x) { return !st.dr || x.n.drs.indexOf(st.dr) >= 0; }).sort(function (a, b) { return b.amt - a.amt; });
    var hubs = c.hubs.map(function (id) { return F.net(id); });
    var seed = c.key === G.key("Terrebonne", "LA") && (!st.dr || st.dr === "DR-9921-LA");
    return '<div class="card" style="margin:0"><button id="mp-back" class="btn" style="font-size:11px;padding:3px 8px;margin-bottom:8px"><i class="ti ti-arrow-left"></i> ' + (st.dr ? st.dr : "All declarations") + '</button>' +
      '<div style="font-weight:600;font-size:14px;color:var(--ink)">' + esc(lbl) + '</div>' +
      '<div style="margin:5px 0 10px;display:flex;gap:4px;flex-wrap:wrap">' + (c.outside ? '<span class="tag" style="background:var(--med-bg);color:var(--med-tx)">Outside every declared area</span>' : c.decls.map(function (d) { return '<span class="tag mono" title="' + esc(F.DECLS[d].name) + '">' + d + '</span>'; }).join("")) + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Flagged</div><div style="font-weight:600;font-size:18px">' + big(v.flagged) + '</div></div>' +
      '<div><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">Registrations</div><div style="font-weight:600;font-size:18px">' + v.regs.toLocaleString() + '</div></div></div>' +
      (c.outside ? '<div style="font-size:11.5px;color:var(--text2);margin-top:8px;line-height:1.45">Registrations claim damaged homes here, but no declaration designates this area for Individual Assistance.</div>' : '') +
      (c.isoAmt && !c.outside ? '<div style="font-size:11.5px;color:var(--text2);margin-top:8px">' + usd(c.isoAmt) + ' of it is isolated flags with no network.</div>' : '') + '</div>' +
      (seed ? '<div class="card" data-open="' + F.SEED + '" style="margin:0;cursor:pointer;border-color:#f3c9c9;background:var(--high-bg)"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--high-tx)">Held before payment</div><div style="font-weight:600;font-size:13px;margin-top:2px">R-104417 · Kendra L. Batiste · $17,280</div><div style="font-size:11.5px;color:var(--text2)">418 Cypress Bend Rd, Houma · open the registration <i class="ti ti-arrow-right"></i></div></div>' : '') +
      '<div class="card" style="margin:0;padding:0;overflow:hidden"><div style="padding:9px 12px;font-weight:500;font-size:12.5px;border-bottom:0.5px solid var(--border2)">Networks with registrations here</div>' +
      (nets.length ? nets.map(function (x) { return '<div data-net="' + x.n.id + '" style="display:flex;justify-content:space-between;gap:8px;padding:7px 12px;border-top:0.5px solid var(--border2);cursor:pointer;font-size:12px"><span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + F.SCHEMES[x.n.scheme].color + ';margin-right:6px"></span>' + esc(x.n.name) + '</span><span class="mono" style="font-weight:600">' + big(x.amt) + '</span></div>'; }).join("") : '<div style="padding:9px 12px;font-size:12px;color:var(--text3)">None</div>') + '</div>' +
      (hubs.length ? '<div class="card" style="margin:0;padding:0;overflow:hidden"><div style="padding:9px 12px;font-weight:500;font-size:12.5px;border-bottom:0.5px solid var(--border2)">Networks based here</div>' + hubs.map(function (n) { return '<div data-net="' + n.id + '" style="display:flex;justify-content:space-between;gap:8px;padding:7px 12px;border-top:0.5px solid var(--border2);cursor:pointer;font-size:12px"><span>' + esc(n.name) + '</span><span style="font-size:11px;color:var(--text3)">' + esc(F.SCHEMES[n.scheme].hub) + '</span></div>'; }).join("") + '</div>' : '');
  }
})();
