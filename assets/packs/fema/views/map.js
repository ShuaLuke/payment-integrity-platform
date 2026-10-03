/* Disaster-relief pack · Insights › Map — flagged registrations and fraud
   networks by state, county and parish, across declarations: the view
   emergency managers think in.
     · drill down — the nation shades states by flagged dollars; click a state to
       fly into its counties, click a county for its detail; breadcrumb and Esc
       step back out; the declaration chips jump straight to that disaster;
     · networks — each network's dashes stream from where it is based to every
       county it reaches. A dot marks a county where its registrations claim
       damage; a diamond marks a related location (an operator, device, mailbox
       or storefront based elsewhere). Curved lines cross state lines. Hover a
       line for what it represents;
     · playback — with "All declarations", run the 13 months from the first
       declaration to today (declarations flash, "Seen before" callouts when a
       ring turns up in a later disaster). With one declaration chosen, run that
       storm day by day from its incident date: the registration surge, each
       network's first filings, flagged-dollar milestones and, for DR-9921-LA,
       the story from R-104417 to $103.4M.
   Light by default; a Light/Dark switch (remembered per viewer) themes the map
   with the site's navy. Designated areas are outlined; dollars claimed outside
   any declared area are hatched. Boundaries: US Census via us-atlas
   (geo/counties-10m.json), drawn with d3-geo + topojson-client.
   Data: fema-geo.js. Adds Views.map. */
(function () {
  window.Views = window.Views || {};
  var F = window.FEMA, G = F.GEO;
  var esc = function (s) { return window.APP.esc(s); }, usd = function (n) { return window.DP.usd(n); };
  var big = function (n) { return F.bigUsd(n); };
  var ABBR = {}; Object.keys(G.ST).forEach(function (a) { ABBR[G.ST[a]] = a; });
  var topoP = null;
  function topo() { return topoP || (topoP = fetch("assets/packs/fema/geo/counties-10m.json").then(function (r) { return r.json(); })); }

  // ---- theme: light by default, dark remembered per viewer ----
  var THEME_KEY = "pi.map.theme";
  function loadTheme() { try { return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light"; } catch (e) { return "light"; } }
  function saveTheme(v) { try { localStorage.setItem(THEME_KEY, v); } catch (e) { /* private window: keep it for this visit only */ } }
  var THEMES = {
    light: {
      bg: "#f7f8fb", off: "#eceff4", quiet: "#e3e8ef", focus: "#e6ebf2", other: "#eef1f5", none: "#f4f6f9",
      cStroke: "#c9d1dc", sStroke: "#b8c2d0", mesh: "#97a3b6", sel: "#001141",
      heat: ["#fbe3e3", "#f2a7a1", "#e0605a", "#c6362f", "#8b1a13"],
      hatchBg: "#fbe6cf", hatch: "#c77d11", desig: "#0f62fe", glow: false, heatTop: 0.8,
      lab1: "#001141", lab2: "#8b1a13", halo: "#ffffff", pin: "#da1e28",
      tone: { decl: "#0043ce", seen: "#7a4a06", held: "#8b1a13", story: "#001141", net: "#0043ce", mile: "#8b1a13" },
      flash: "#0f62fe"
    },
    dark: {
      bg: "radial-gradient(900px 500px at 60% 40%,#0a1e66 0%,#001141 70%)", off: "#08133a", quiet: "#13235a", focus: "#102061", other: "#0b1847", none: "#142668",
      cStroke: "#24366a", sStroke: "#2b3d6b", mesh: "#4a63a3", sel: "#ffffff",
      heat: ["#3a1430", "#6e1a2e", "#a3252b", "#d13a33", "#f2564b"],
      hatchBg: "#3b2a10", hatch: "#e6a23c", desig: "#78a9ff", glow: true, heatTop: 1,
      lab1: "#ffffff", lab2: "#ffb3ad", halo: "#001141", pin: "#ff6b6b",
      tone: { decl: "#78a9ff", seen: "#ffd27a", held: "#ffb3ad", story: "#ffffff", net: "#a6c8ff", mile: "#ffb3ad" },
      flash: "#78a9ff"
    }
  };

  // ---- state of the view ----
  var st = { dr: "", nets: true, level: "us", state: null, county: null, step: null, theme: loadTheme() };
  var DAY = 864e5, WEEK = 7 * DAY, TODAY = Date.parse("2026-10-03"), ALL0 = Date.parse("2025-08-18");
  var SEED_T = Date.parse("2026-09-29") + (21 * 60 + 14) * 60e3; // R-104417 registered and held

  // ---- time ----
  // all declarations: weekly from just before the first one. One declaration:
  // from its incident date, daily (or every few days, ~60 steps at most); each
  // step is the end of that day.
  function TL() {
    if (!st.dr) return { storm: false, t0: ALL0, dt: WEEK, steps: Math.ceil((TODAY - ALL0) / WEEK) };
    var i = Date.parse(F.DECLS[st.dr].incident), days = Math.round((TODAY - i) / DAY), k = Math.max(1, Math.ceil(days / 60));
    return { storm: true, t0: i, dt: k * DAY, k: k, steps: Math.ceil(days / k) };
  }
  function tOf(step) { var L = TL(); if (step == null || step >= L.steps) return null; return L.storm ? Math.min(TODAY, L.t0 + step * L.dt + DAY - 1) : L.t0 + step * L.dt; }
  function dayOf(dr, t) { return Math.floor(((t == null ? TODAY : t) - Date.parse(F.DECLS[dr].incident)) / DAY); }
  // a surge once filings start, then the long tail; reaches today's figure today
  function g(days, tau) { return days <= 0 ? 0 : 1 - Math.exp(-days / tau); }
  function ramp(t0, t, tau) { tau = tau || 21; if (t == null) return 1; if (t < t0) return 0; return Math.min(1, g((t - t0) / DAY + 0.5, tau) / g((TODAY - t0) / DAY + 0.5, tau)); }
  function cval(c, dr, t) { var f = 0, r = 0; c.parts.forEach(function (p) { if (dr && p.dr !== dr) return; var x = ramp(p.t0, t); f += p.flagged * x; r += p.regs * x; }); return { flagged: f, regs: Math.round(r) }; }
  function stormTotal(dr, t) { var s = { flagged: 0, regs: 0 }; Object.keys(G.counties).forEach(function (k) { var v = cval(G.counties[k], dr, t); s.flagged += v.flagged; s.regs += v.regs; }); return s; }
  function netLive(n, t, dr) { return G.areas(n.id).some(function (a) { return (!dr || a.dr === dr) && (t == null || t >= a.t0); }); }
  function netHere(id, key, t, dr) { var n = F.net(id); return G.areas(id).reduce(function (s, a) { return s + (a.key === key && (!dr || a.dr === dr) ? n.atRisk * a.share * ramp(a.t0, t) : 0); }, 0); }
  function countyLabel(c) { return c.name + (c.st === "LA" ? " Parish" : " County") + ", " + c.st; }
  function fmtDate(t) { return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }); }
  function fmtShort(t) { return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }); }
  function lc(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  // ---- playback events ----
  // across declarations: each declaration, and each ring that reappears in a later disaster
  var ALL_EVENTS = (function () {
    var ev = Object.keys(G.DESIGNATED).map(function (dr) { return { t: Date.parse(F.DECLS[dr].declared), kind: "decl", dr: dr }; });
    F.NETS.forEach(function (n) {
      var first = {}; G.areas(n.id).forEach(function (a) { first[a.dr] = Math.min(first[a.dr] || Infinity, a.t0); });
      var drs = Object.keys(first).sort(function (a, b) { return first[a] - first[b]; });
      for (var i = 1; i < drs.length; i++) if (first[drs[i]] - first[drs[0]] > 20 * DAY)
        ev.push({ t: first[drs[i]], kind: "repeat", net: n.id, from: drs[0], to: drs[i] });
    });
    return ev.sort(function (a, b) { return a.t - b.t; });
  })();
  // one storm: declared, each network's first filings, flagged-$ milestones, and its story
  var START_NOTE = {
    "N01|DR-9921-LA": ["Crescent Relief storefronts begin filing", "3 “application help” storefronts: Houma, Thibodaux and Morgan City"],
    "N01|DR-9922-MS": ["Pearl River Recovery Help begins filing", "Picayune · the 4th Crescent Relief storefront"],
    "N15|DR-9921-LA": ["9 households register at one 2-bedroom house", "1120 Bayou Dularge Rd, Houma"],
    "N09|DR-9921-LA": ["Awards start flowing to account ••5106", "The same account took 41 awards in DR-9877-TX in May"]
  };
  function startNote(n, dr) {
    var x = START_NOTE[n.id + "|" + dr]; if (x) return x;
    var hub = G.counties[G.netHub(n.id)], where = hub ? "based in " + countyLabel(hub) : "";
    var t = { facilitator: n.name + " begins filing", leasemill: "Leases from " + n.name + " begin appearing", account: "Awards start flowing to " + lc(n.name), identity: "First filings from " + lc(n.name), address: "First filings: " + lc(n.name) }[n.scheme];
    return [t, F.SCHEMES[n.scheme].short + " · " + where];
  }
  function at(dr, d) { return Math.min(TODAY, Date.parse(F.DECLS[dr].incident) + d * DAY + DAY / 2); }
  var STORY = {
    "DR-9921-LA": function () {
      var by = {}; F.funnel().forEach(function (s) { by[s.key] = s; });
      return [
        { t: at("DR-9921-LA", 5), tone: "story", title: "Owner-occupants register at 418 Cypress Bend Rd", body: "Harold & Denise Guidry · R-101276 · verified owners" },
        { t: at("DR-9921-LA", 13), tone: "story", title: "R-103882 paid · " + usd(16940), body: "Rental assistance on a Fontenot Rentals LLC lease, Houma" },
        { t: at("DR-9921-LA", 16), tone: "story", title: "R-104102 paid · " + usd(14880), body: "Jarrod R. Fontenot, “renter” of an apartment that doesn't exist" },
        { t: SEED_T, tone: "held", title: "R-104417 held before payment", body: usd(F.SEED_AMOUNT) + " · Kendra L. Batiste, Houma · lease from a landlord on 61 registrations" },
        { t: at("DR-9921-LA", 35), tone: "story", title: "Same facilitator on " + by.store.count + " · " + big(by.store.amount), body: "Lease comparison with R-103882 · " + by.store.detail },
        { t: at("DR-9921-LA", 36), tone: "story", title: "Crescent Relief network · " + big(by.network.amount), body: by.network.detail + " · " + by.network.count },
        { t: at("DR-9921-LA", 37), tone: "story", title: "Networks linked to it · " + big(by.linked.amount), body: by.linked.detail },
        { t: TODAY, tone: "story", title: "Same patterns, every network · " + big(by.all.amount), body: by.all.detail }
      ];
    },
    "DR-9922-MS": function () {
      return [
        { t: at("DR-9922-MS", 10), tone: "story", title: "M-201088 paid · second home claimed as primary", body: "Waveland cottage; homestead exemption is in Tennessee" },
        { t: at("DR-9922-MS", 15), tone: "story", title: "M-201203 paid into account ••5106", body: "The same account received two Louisiana awards under different names" }
      ];
    }
  };
  var stormCache = {};
  function stormEvents(dr) {
    if (stormCache[dr]) return stormCache[dr];
    var D = F.DECLS[dr], d = G.DESIGNATED[dr], unit = d.state === "LA" ? "parishes" : "counties";
    var ev = [{ t: Date.parse(D.declared), tone: "decl", kind: "decl", dr: dr, title: "Declared · " + dr, body: "Individual Assistance for " + d.counties.length + " " + unit + ": " + d.counties.join(", ") }];
    F.NETS.forEach(function (n) {
      var t0 = Infinity; G.areas(n.id).forEach(function (a) { if (a.dr === dr) t0 = Math.min(t0, a.t0); });
      if (t0 === Infinity) return;
      var note = startNote(n, dr); ev.push({ t: t0, tone: "net", net: n.id, title: note[0], body: note[1] });
    });
    // flagged-dollar milestones, found day by day
    var final = stormTotal(dr, null).flagged;
    var marks = [1e6, 5e6, 10e6, 15e6, 20e6, 30e6, 40e6].filter(function (m) { return m < final * 0.95; }).slice(-4), mi = 0;
    for (var t = Date.parse(D.incident) + DAY - 1; t <= TODAY + DAY && mi < marks.length; t += DAY) {
      var v = stormTotal(dr, Math.min(t, TODAY));
      while (mi < marks.length && v.flagged >= marks[mi]) { ev.push({ t: Math.min(t, TODAY), tone: "mile", title: big(marks[mi]) + " flagged so far", body: v.regs.toLocaleString() + " flagged registrations in " + dr }); mi++; }
    }
    ev = ev.concat(STORY[dr] ? STORY[dr]() : []);
    return (stormCache[dr] = ev.sort(function (a, b) { return a.t - b.t; }));
  }

  var CSS = '<style id="mp-css">' +
    '@keyframes mp-flow{to{stroke-dashoffset:-24}}.mp-flow{animation:mp-flow 1.1s linear infinite}' +
    '@keyframes mp-pulse{0%{r:6px;opacity:.9}100%{r:24px;opacity:0}}.mp-pulse{animation:mp-pulse 1.8s ease-out infinite}' +
    '@keyframes mp-toast{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}' +
    '.mp-light{--mp-glass:rgba(255,255,255,.95);--mp-gb:#dde1e6;--mp-tx:#343a3f;--mp-strong:#001141;--mp-mut:#878d96;--mp-link:#0043ce;--mp-sep:#c1c7cd;--mp-edge:#dde1e6}' +
    '.mp-dark{--mp-glass:rgba(0,17,65,.88);--mp-gb:rgba(166,200,255,.22);--mp-tx:#dde1e6;--mp-strong:#ffffff;--mp-mut:#8d9bb8;--mp-link:#a6c8ff;--mp-sep:#5d6f99;--mp-edge:rgba(166,200,255,.18)}' +
    '.mp-glass{background:var(--mp-glass);border:0.5px solid var(--mp-gb);border-radius:8px;color:var(--mp-tx);backdrop-filter:blur(4px);box-shadow:0 2px 10px rgba(0,17,65,.10)}' +
    '.mp-crumb button{background:none;border:none;color:var(--mp-link);font:inherit;cursor:pointer;padding:0}.mp-crumb button:hover{text-decoration:underline}' +
    '#mp-range{accent-color:#0f62fe;width:100%}' +
    '#mp-play{background:#0f62fe}#mp-play:hover{background:#0043ce}' +
    '.mp-flow.hot{stroke-width:3.4px!important;opacity:1!important}' +
    '@media (prefers-reduced-motion: reduce){.mp-flow,.mp-pulse{animation:none}}</style>';

  window.Views.map = {
    render: function (mount) {
      var P = THEMES[st.theme];
      var chip = function (v, l, sub) { return '<button class="qscope mp-dr' + (st.dr === v ? " active" : "") + '" data-dr="' + v + '" title="' + esc(sub || "") + '">' + l + '</button>'; };
      var tbtn = function (v, icon, l) { return '<button class="qscope mp-th' + (st.theme === v ? " active" : "") + '" data-th="' + v + '" style="padding:4px 10px"><i class="ti ' + icon + '"></i> ' + l + '</button>'; };
      var old = document.getElementById("mp-css"); if (old) old.remove();
      mount.innerHTML = CSS + '<div class="page">' +
        '<div class="page-head"><div><div class="page-title">Map</div><div class="page-sub">Flagged registrations and fraud networks by state, county and parish. Click a state to drill in; pick a declaration to play back that storm.</div></div>' +
        '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><label style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text2);cursor:pointer"><input type="checkbox" id="mp-nets"' + (st.nets ? " checked" : "") + '> Show networks</label>' +
        '<div style="display:flex;gap:2px;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px">' + tbtn("light", "ti-sun", "Light") + tbtn("dark", "ti-moon", "Dark") + '</div></div></div>' +
        '<div style="display:flex;gap:2px;flex-wrap:wrap;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px;margin-bottom:12px;width:fit-content">' +
        chip("", "All declarations") + Object.keys(G.DESIGNATED).map(function (dr) { var d = F.DECLS[dr]; return chip(dr, dr, d.name + " · " + d.stateName); }).join("") + '</div>' +
        '<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">' +
        '<div class="mp-' + st.theme + '" style="flex:1;min-width:420px;border-radius:var(--r);overflow:hidden;border:0.5px solid ' + (st.theme === "dark" ? "#001141" : "var(--border)") + ';background:' + (st.theme === "dark" ? "#001141" : "var(--card)") + ';box-shadow:' + (st.theme === "dark" ? "0 8px 28px rgba(0,17,65,.25)" : "0 1px 3px rgba(0,17,65,.06)") + '">' +
        '<div id="mp-map" style="position:relative;height:620px;background:' + P.bg + '"><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--mp-link);font-size:12px"><i class="ti ti-loader-2"></i>&nbsp;Loading county boundaries…</div></div>' +
        '<div id="mp-legend" style="display:flex;flex-wrap:wrap;gap:6px 16px;padding:9px 14px;border-top:0.5px solid var(--mp-edge);font-size:11px;color:var(--mp-tx)"></div></div>' +
        '<div id="mp-side" style="width:320px;flex:none;display:flex;flex-direction:column;gap:10px"></div></div></div>';
      var api = null;
      mount.querySelectorAll(".mp-dr").forEach(function (b) {
        b.onclick = function () {
          st.dr = b.getAttribute("data-dr"); st.step = null;
          mount.querySelectorAll(".mp-dr").forEach(function (x) { x.classList.toggle("active", x === b); });
          if (!api) return;
          api.newTimeline();
          if (st.dr) api.drillState(G.ST[G.DESIGNATED[st.dr].state]); else api.toNation();
        };
      });
      mount.querySelectorAll(".mp-th").forEach(function (b) {
        b.onclick = function () { var v = b.getAttribute("data-th"); if (v === st.theme) return; st.theme = v; saveTheme(v); window.Views.map.render(mount); };
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
      }).catch(function (err) { console.error(err); var m = document.getElementById("mp-map"); if (m) m.innerHTML = '<div style="padding:30px;color:var(--mp-tx);font-size:12px">The county boundaries could not be loaded.</div>'; });

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
        hatch.append("rect").attr("width", 5).attr("height", 5).attr("fill", P.hatchBg);
        hatch.append("line").attr("x1", 0).attr("y1", 0).attr("x2", 0).attr("y2", 5).attr("stroke", P.hatch).attr("stroke-width", 2);
        var glow = defs.append("filter").attr("id", "mp-glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
        glow.append("feGaussianBlur").attr("stdDeviation", 3).attr("result", "b");
        var fm = glow.append("feMerge"); fm.append("feMergeNode").attr("in", "b"); fm.append("feMergeNode").attr("in", "SourceGraphic");
        var GLOW = P.glow ? "url(#mp-glow)" : null;
        // scheme colors, lifted a little on navy so the darker blues stay visible
        var sc = function (n) { var c = F.SCHEMES[n.scheme].color; return st.theme === "dark" ? d3.color(c).brighter(0.8).formatHex() : c; };

        var root = svg.append("g");
        var stP = root.append("g").selectAll("path").data(statesF).join("path").attr("d", path).attr("stroke", P.sStroke).attr("stroke-width", 0.8).attr("vector-effect", "non-scaling-stroke");
        var ctP = root.append("g").selectAll("path").data(countiesF).join("path").attr("d", path).attr("vector-effect", "non-scaling-stroke").attr("stroke", P.cStroke).attr("stroke-width", 0.5).style("cursor", "pointer").style("display", "none");
        root.append("path").datum(topojson.mesh(topology, topology.objects.states, function (a, b) { return a !== b; })).attr("d", path).attr("fill", "none").attr("stroke", P.mesh).attr("stroke-width", 0.9).attr("vector-effect", "non-scaling-stroke").style("pointer-events", "none");
        var desig = root.append("g").style("pointer-events", "none");
        var over = svg.append("g"); // screen-space overlay: flows, line ends, hubs, pin, labels
        var lnG = over.append("g").style("pointer-events", "none"), labG = over.append("g").style("pointer-events", "none"), hitG = over.append("g"), endG = over.append("g"), hubG = over.append("g"), pinG = over.append("g"), flashG = over.append("g").style("pointer-events", "none");
        var tip = d3.select(el).append("div").attr("class", "mp-glass").style("position", "absolute").style("padding", "8px 11px").style("font-size", "11px").style("line-height", "1.45").style("max-width", "290px").style("pointer-events", "none").style("opacity", 0).style("z-index", 5);
        function showTip(e, html) { var r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; tip.html(html).style("opacity", 1).style("left", Math.max(4, Math.min(x + 14, W - 300)) + "px"); var th = tip.node().offsetHeight; tip.style("top", (y + th + 16 > H ? Math.max(4, y - th - 12) : y + 12) + "px"); }
        function hideTip() { tip.style("opacity", 0); }
        var B = function (s) { return "<b style='color:var(--mp-strong)'>" + s + "</b>"; }, LINK = function (s) { return "<span style='color:var(--mp-link)'>" + s + "</span>"; };

        // breadcrumb, toasts, timeline
        var crumb = d3.select(el).append("div").attr("class", "mp-glass mp-crumb").style("position", "absolute").style("left", "12px").style("top", "12px").style("padding", "6px 11px").style("font-size", "12px").style("z-index", 4);
        var toasts = d3.select(el).append("div").style("position", "absolute").style("right", "12px").style("top", "12px").style("display", "flex").style("flex-direction", "column").style("gap", "6px").style("align-items", "flex-end").style("z-index", 4).style("pointer-events", "none");
        var bar = d3.select(el).append("div").attr("class", "mp-glass").style("position", "absolute").style("left", "12px").style("right", "12px").style("bottom", "12px").style("padding", "8px 12px").style("display", "flex").style("align-items", "center").style("gap", "12px").style("z-index", 4);
        var playBtn, range, timer = null;
        function buildBar() {
          var L = TL(), D = st.dr ? F.DECLS[st.dr] : null;
          bar.html('<button id="mp-play" title="' + (D ? "Play " + D.id + " from its incident date to today" : "Play the last 13 months, across every declaration") + '" style="width:30px;height:30px;flex:none;border-radius:50%;border:none;color:#fff;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center"><i class="ti ti-player-play-filled"></i></button>' +
            '<div style="flex:1;min-width:0"><input type="range" id="mp-range" min="0" max="' + L.steps + '" step="1" value="' + (st.step == null ? L.steps : st.step) + '"><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--mp-mut)"><span>' + (D ? "Incident · " + fmtDate(L.t0) : fmtDate(L.t0) + " · all declarations") + '</span><span>' + (D ? (L.k > 1 ? "every " + L.k + " days · " : "daily · ") : "weekly · ") + 'Today</span></div></div>' +
            '<div style="width:190px;flex:none;text-align:right"><div id="mp-date" style="font-weight:600;font-size:13px;color:var(--mp-strong)"></div><div id="mp-when" style="font-size:10.5px;color:var(--mp-link)"></div></div>');
          playBtn = el.querySelector("#mp-play"); range = el.querySelector("#mp-range");
          playBtn.onclick = play;
          range.oninput = function () { stop(); setStep(+range.value, true); };
        }

        var tr = d3.zoomIdentity;
        var zoom = d3.zoom().scaleExtent([1, 60]).on("zoom", function (e) { tr = e.transform; root.attr("transform", tr); hatch.attr("patternTransform", "rotate(45) scale(" + (1 / tr.k) + ")"); place(); });
        svg.call(zoom).on("dblclick.zoom", null);

        function stateVal(fips, t) { var s = { flagged: 0, regs: 0 }; Object.keys(G.counties).forEach(function (k) { if (k.slice(0, 2) !== fips) return; var v = cval(G.counties[k], st.dr, t); s.flagged += v.flagged; s.regs += v.regs; }); return s; }
        var heatI = d3.interpolateRgbBasis(P.heat);
        var overlay = { lines: [], hubs: [], pins: [], labels: [] };

        function paint() {
          var t = tOf(st.step), lvl = st.level;
          // states: shaded by flagged $ at the national level, a backdrop when drilled in
          var sv = {}, smax = 1; G.states.forEach(function (f) { sv[f] = stateVal(f, t); smax = Math.max(smax, sv[f].flagged); });
          var sHeat = d3.scaleSequentialSqrt([0, smax], function (x) { return heatI(0.12 + (P.heatTop - 0.12) * x); });
          stP.attr("fill", function (f) {
            if (!want[f.id]) return P.off;
            if (lvl === "us") return sv[f.id].flagged > 0 ? sHeat(sv[f.id].flagged) : P.quiet;
            return f.id === st.state ? P.focus : P.other;
          }).attr("filter", function (f) { return lvl === "us" && want[f.id] && sv[f.id].flagged > smax * 0.45 ? GLOW : null; })
            .style("cursor", function (f) { return want[f.id] && (lvl === "us" || f.id !== st.state) ? "pointer" : "default"; });
          // counties of the state in focus
          var inState = function (f) { return lvl !== "us" && f.id.slice(0, 2) === st.state; };
          var vals = {}, cmax = 1;
          countiesF.forEach(function (f) { if (!inState(f)) return; var c = G.counties[f.key]; var v = c ? cval(c, st.dr, t) : null; vals[f.key] = v; if (v) cmax = Math.max(cmax, v.flagged); });
          var cHeat = d3.scaleSequentialSqrt([0, cmax], function (x) { return heatI(0.12 + (P.heatTop - 0.12) * x); });
          ctP.style("display", function (f) { return inState(f) ? null : "none"; })
            .attr("fill", function (f) { var v = vals[f.key], c = G.counties[f.key]; if (!v || v.flagged < 1) return P.none; return c.outside ? "url(#mp-hatch)" : cHeat(v.flagged); })
            .attr("filter", function (f) { var v = vals[f.key]; return v && v.flagged > cmax * 0.5 && !G.counties[f.key].outside ? GLOW : null; })
            .attr("stroke", function (f) { return f.key === st.county ? P.sel : P.cStroke; }).attr("stroke-width", function (f) { return f.key === st.county ? 2.4 : 0.5; });
          ctP.filter(function (f) { return f.key === st.county; }).raise();
          // designated areas of the selected declaration(s), in the state in focus
          var dfeat = [];
          if (lvl !== "us") (st.dr ? [st.dr] : Object.keys(G.DESIGNATED)).forEach(function (dr) { var d = G.DESIGNATED[dr]; if (G.ST[d.state] !== st.state || (t != null && t < Date.parse(F.DECLS[dr].declared))) return; d.counties.forEach(function (n) { var f = byKey[G.ST[d.state] + "|" + n]; if (f) dfeat.push(f); }); });
          desig.selectAll("path").data(dfeat, function (f) { return f.id; }).join("path").attr("d", path).attr("fill", "none").attr("stroke", P.desig).attr("stroke-width", 1.3).attr("stroke-dasharray", "3,2").attr("vector-effect", "non-scaling-stroke");
          // networks: a line from the base to each county it reaches, ending in a marker
          var ctr = function (k) { var f = byKey[k]; return f ? path.centroid(f) : null; };
          var maxR = d3.max(F.NETS, function (n) { return n.atRisk; });
          overlay.lines = []; overlay.hubs = []; overlay.pins = []; overlay.labels = [];
          if (st.nets) F.NETS.forEach(function (n) {
            if (!netLive(n, t, st.dr)) return;
            var hk = G.netHub(n.id), h = ctr(hk); if (!h) return;
            var seen = {};
            G.areas(n.id).forEach(function (a) {
              if (a.key === hk || seen[a.key] || (st.dr && a.dr !== st.dr) || (t != null && t < a.t0)) return;
              var c = ctr(a.key); if (!c) return; seen[a.key] = 1;
              overlay.lines.push({ id: n.id + a.key, kind: "damage", net: n, hk: hk, ck: a.key, area: a, a: h, b: c, cross: a.key.slice(0, 2) !== hk.slice(0, 2) });
            });
            G.related(n.id).forEach(function (r) {
              if (r.key === hk || seen[r.key]) return; var c = ctr(r.key); if (!c) return; seen[r.key] = 1;
              overlay.lines.push({ id: n.id + r.key + "r", kind: "related", net: n, hk: hk, ck: r.key, label: r.label, a: h, b: c, cross: r.key.slice(0, 2) !== hk.slice(0, 2) });
            });
            overlay.hubs.push({ id: n.id, n: n, hk: hk, p: h, r: 4 + 8 * Math.sqrt(n.atRisk / maxR) });
          });
          if ((!st.dr || st.dr === "DR-9921-LA") && (t == null || t >= SEED_T)) { var tp = ctr(G.key("Terrebonne", "LA")); if (tp) overlay.pins.push({ id: "seed", p: [tp[0] + 6, tp[1] - 6] }); }
          // labels: state totals nationally, county names when drilled in
          if (lvl === "us") G.states.forEach(function (f) { var s = stateByFips[f]; if (!s || sv[f].flagged < 1) return; var c = path.centroid(s); overlay.labels.push({ id: "s" + f, p: c, t1: ABBR[f], t2: big(sv[f].flagged) }); });
          else countiesF.forEach(function (f) { var v = vals[f.key]; if (!v || v.flagged < 1) return; overlay.labels.push({ id: f.key, p: path.centroid(f), t1: f.properties.name, t2: big(v.flagged) }); });
          drawOverlay(); crumbs(); legend(); clock(); side();
        }
        // what a network line represents, at the current playback time
        function lineTip(d) {
          var n = d.net, S = F.SCHEMES[n.scheme], hub = G.counties[d.hk], end = G.counties[d.ck], t = tOf(st.step);
          var h = "<div style='color:" + sc(n) + ";font-weight:600;margin-bottom:2px'>" + esc(S.label) + "</div>" + B(esc(n.name)) +
            "<div style='margin-top:3px'>From " + esc(countyLabel(hub)) + " <span style='color:var(--mp-mut)'>(" + esc(lc(S.hub)) + ")</span><br>to " + esc(countyLabel(end)) + "</div>";
          if (d.kind === "damage") {
            var a = d.area, x = ramp(a.t0, t), D = F.DECLS[a.dr];
            h += "<div style='margin-top:4px'>" + B("Registrations here claim damage") + "<br>" + big(n.atRisk * a.share * x) + " · " + Math.round(n.regs * a.share * x).toLocaleString() + " registrations<br>" + a.dr + " · " + esc(D.name) +
              (end.outside ? "<br><span style='color:" + P.hatch + "'>Outside every declared area</span>" : "") + "</div>";
          } else h += "<div style='margin-top:4px'>" + B("Related location") + " · no damage claimed here<br>" + esc(d.label) + "</div>";
          if (d.cross) h += "<div style='margin-top:4px;font-weight:600;color:var(--mp-strong)'><i class='ti ti-arrows-cross'></i> Crosses state lines</div>";
          return h;
        }
        function hot(d, on) { lnG.selectAll("path").filter(function (x) { return x.id === d.id; }).classed("hot", on); }
        function drawOverlay() {
          var lineIn = function (sel) { return sel.on("mouseover", function (e, d) { hot(d, true); showTip(e, lineTip(d)); }).on("mousemove", function (e, d) { showTip(e, lineTip(d)); }).on("mouseout", function (e, d) { hot(d, false); hideTip(); }); };
          lnG.selectAll("path").data(overlay.lines, function (d) { return d.id; }).join("path").attr("class", "mp-flow").attr("fill", "none")
            .attr("stroke", function (d) { return sc(d.net); }).attr("stroke-width", function (d) { return d.cross ? 2 : 1.6; })
            .attr("stroke-dasharray", function (d) { return d.kind === "related" ? "2 5" : "6 6"; }).attr("stroke-linecap", "round").attr("opacity", 0.9);
          lineIn(hitG.selectAll("path").data(overlay.lines, function (d) { return d.id; }).join("path").attr("fill", "none").attr("stroke", "#000").attr("stroke-opacity", 0).attr("stroke-width", 14).style("pointer-events", "stroke").style("cursor", "help"));
          var ends = endG.selectAll("g").data(overlay.lines, function (d) { return d.id; }).join(function (en) { var gg = en.append("g").style("cursor", "help"); gg.append("path"); return gg; });
          ends.select("path").attr("d", function (d) { return d.kind === "related" ? "M0,-4.6L4.6,0L0,4.6L-4.6,0Z" : d3.symbol(d3.symbolCircle, 30)(); })
            .attr("fill", function (d) { return d.kind === "related" ? P.halo : sc(d.net); }).attr("stroke", function (d) { return d.kind === "related" ? sc(d.net) : P.halo; }).attr("stroke-width", function (d) { return d.kind === "related" ? 1.8 : 1.2; });
          lineIn(ends);
          hubG.selectAll("circle").data(overlay.hubs, function (d) { return d.id; }).join("circle").attr("r", function (d) { return d.r; }).attr("fill", P.halo).attr("stroke", function (d) { return sc(d.n); }).attr("stroke-width", 2.4).attr("filter", GLOW).style("cursor", "pointer")
            .on("mouseover", function (e, d) { showTip(e, "<div style='color:" + sc(d.n) + ";font-weight:600;margin-bottom:2px'>" + esc(F.SCHEMES[d.n.scheme].label) + "</div>" + B(esc(d.n.name)) + "<div>Based in " + esc(countyLabel(G.counties[d.hk])) + " · " + esc(lc(F.SCHEMES[d.n.scheme].hub)) + "<br>" + d.n.regs.toLocaleString() + " registrations · " + big(d.n.atRisk) + " at risk<br>" + d.n.drs.join(" · ") + "<br>" + LINK("Click to open the network") + "</div>"); })
            .on("mouseout", hideTip).on("click", function (e, d) { e.stopPropagation(); window.APP.state.networkScenario = d.id; window.APP.nav("network"); });
          var pins = pinG.selectAll("g").data(overlay.pins, function (d) { return d.id; }).join(function (en) { var gg = en.append("g").style("cursor", "pointer"); gg.append("circle").attr("class", "mp-pulse").attr("r", 6).attr("fill", "none").attr("stroke", P.pin).attr("stroke-width", 2); gg.append("circle").attr("r", 5).attr("fill", P.pin).attr("stroke", "#fff").attr("stroke-width", 1.5); return gg; });
          pins.on("mouseover", function (e) { showTip(e, "<div style='color:" + P.tone.held + ";font-weight:600;margin-bottom:2px'>Held before payment</div>" + B("R-104417 · " + usd(F.SEED_AMOUNT)) + "<div>Kendra L. Batiste · Houma, Terrebonne Parish<br>" + LINK("Click to open the registration") + "</div>"); })
            .on("mouseout", hideTip).on("click", function (e) { e.stopPropagation(); window.APP.openAllegation(F.SEED); });
          var labs = labG.selectAll("g").data(overlay.labels, function (d) { return d.id; }).join(function (en) { var gg = en.append("g"); gg.append("text").attr("class", "l1"); gg.append("text").attr("class", "l2"); return gg; });
          labs.select(".l1").text(function (d) { return d.t1; }).attr("text-anchor", "middle").attr("font-size", 11).attr("font-weight", 600).attr("fill", P.lab1).attr("paint-order", "stroke").attr("stroke", P.halo).attr("stroke-width", 3);
          labs.select(".l2").text(function (d) { return d.t2; }).attr("text-anchor", "middle").attr("dy", 12).attr("font-size", 10).attr("font-family", "IBM Plex Mono,monospace").attr("font-weight", 600).attr("fill", P.lab2).attr("paint-order", "stroke").attr("stroke", P.halo).attr("stroke-width", 3);
          place();
        }
        // overlay positions follow the zoom, in screen pixels; cross-state links arc
        function place() {
          var Pt = function (p) { return tr.apply(p); };
          var dOf = function (d) {
            var a = Pt(d.a), b = Pt(d.b);
            if (!d.cross) return "M" + a[0] + "," + a[1] + "L" + b[0] + "," + b[1];
            var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
            return "M" + a[0] + "," + a[1] + "Q" + (mx - dy * 0.22) + "," + (my + dx * 0.22) + " " + b[0] + "," + b[1];
          };
          lnG.selectAll("path").attr("d", dOf); hitG.selectAll("path").attr("d", dOf);
          endG.selectAll("g").attr("transform", function (d) { var q = Pt(d.b); return "translate(" + q[0] + "," + q[1] + ")"; });
          hubG.selectAll("circle").attr("cx", function (d) { return Pt(d.p)[0]; }).attr("cy", function (d) { return Pt(d.p)[1]; });
          pinG.selectAll("g").attr("transform", function (d) { var q = Pt(d.p); return "translate(" + q[0] + "," + q[1] + ")"; });
          labG.selectAll("g").attr("transform", function (d) { var q = Pt(d.p); return "translate(" + q[0] + "," + (q[1] + 14) + ")"; })
            .attr("opacity", function () { return st.level === "us" || tr.k >= 2.5 ? 1 : 0; });
        }
        function crumbs() {
          var cur = function (s) { return '<span style="color:var(--mp-strong);font-weight:600">' + s + '</span>'; };
          var parts = ['<button data-c="us">United States</button>'];
          if (st.level !== "us" && st.state) parts.push(st.level === "county" ? '<button data-c="state">' + esc(stateByFips[st.state].properties.name) + '</button>' : cur(esc(stateByFips[st.state].properties.name)));
          if (st.level === "county" && G.counties[st.county]) parts.push(cur(esc(countyLabel(G.counties[st.county]).replace(/, [A-Z]{2}$/, ""))));
          if (st.level === "us") parts[0] = cur("United States");
          crumb.html('<i class="ti ti-map-2" style="color:var(--mp-link)"></i> ' + parts.join(' <span style="color:var(--mp-sep)">›</span> ') + ' <span style="color:var(--mp-mut);font-size:10.5px;margin-left:6px">' + (st.level !== "us" ? "Esc to go back" : "click a state") + '</span>');
          crumb.selectAll("button").on("click", function () { var c = this.getAttribute("data-c"); if (c === "us") toNation(); else drillState(st.state); });
        }
        function legend() {
          var stops = [0, 0.25, 0.5, 0.75, 1].map(function (x) { return heatI(0.12 + (P.heatTop - 0.12) * x); });
          var item = function (sw, l) { return '<span style="display:flex;align-items:center;gap:6px">' + sw + l + '</span>'; };
          var ink = st.theme === "dark" ? "#a6c8ff" : "#4d5358";
          document.getElementById("mp-legend").innerHTML =
            item('<span style="display:inline-flex;height:9px;width:70px;border-radius:2px;overflow:hidden">' + stops.map(function (c) { return '<span style="flex:1;background:' + c + '"></span>'; }).join("") + '</span>', "Flagged $") +
            item('<span style="width:14px;height:9px;border:1.3px dashed ' + P.desig + ';border-radius:2px"></span>', "Designated area") +
            item('<span style="width:14px;height:9px;border-radius:2px;background:repeating-linear-gradient(45deg,' + P.hatch + ' 0 2px,' + P.hatchBg + ' 2px 5px)"></span>', "Claimed outside a declared area") +
            item('<svg width="12" height="12"><circle cx="6" cy="6" r="4.2" fill="' + P.halo + '" stroke="' + ink + '" stroke-width="2"/></svg>', "Where a network is based") +
            item('<svg width="26" height="10"><line x1="1" y1="5" x2="20" y2="5" stroke="' + ink + '" stroke-width="1.6" stroke-dasharray="5 3"/><circle cx="21" cy="5" r="3" fill="' + ink + '"/></svg>', "Damage claimed there") +
            item('<svg width="26" height="10"><line x1="1" y1="5" x2="19" y2="5" stroke="' + ink + '" stroke-width="1.6" stroke-dasharray="2 3"/><path d="M21,1L25,5L21,9L17,5Z" fill="' + P.halo + '" stroke="' + ink + '" stroke-width="1.4"/></svg>', "Related location") +
            item('<svg width="22" height="10"><path d="M1,9Q11,-3 21,9" fill="none" stroke="' + ink + '" stroke-width="1.6" stroke-dasharray="4 3"/></svg>', "Curved: crosses state lines") +
            item('<span style="width:9px;height:9px;border-radius:50%;background:' + P.pin + '"></span>', "Held before payment") +
            '<span style="display:flex;align-items:center;gap:10px;flex-basis:100%;flex-wrap:wrap">' + F.SCHEME_ORDER.map(function (k) { return '<span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:3px;border-radius:2px;background:' + sc({ scheme: k }) + '"></span>' + esc(F.SCHEMES[k].short) + '</span>'; }).join("") +
            '<span style="color:var(--mp-mut);margin-left:auto">Hover a line for what it is · scroll to zoom · drag to pan</span></span>';
        }
        function clock() {
          var t = tOf(st.step), d = el.querySelector("#mp-date"), w = el.querySelector("#mp-when");
          if (range && +range.value !== (st.step == null ? TL().steps : st.step)) range.value = st.step == null ? TL().steps : st.step;
          if (!d || !w) return;
          if (!st.dr) {
            d.textContent = t == null ? "Today" : "Week of " + fmtDate(t);
            var last = ALL_EVENTS.filter(function (e) { return e.kind === "decl" && (t == null || e.t <= t); }).pop();
            w.textContent = last ? "Latest: " + F.DECLS[last.dr].name + " (" + F.DECLS[last.dr].state + ")" : "Before the first declaration";
            return;
          }
          d.textContent = (t == null ? "Today · " : "") + "Day " + dayOf(st.dr, t) + " · " + fmtShort(t == null ? TODAY : t);
          if (t != null && t < Date.parse(F.DECLS[st.dr].declared)) { w.textContent = "Not yet declared"; return; }
          if (st.dr === F.PRIMARY.id) {
            var D0 = Date.parse(F.PRIMARY.declared), I = F.INTAKE;
            w.textContent = Math.round(I.registrations * ramp(D0, t, 6)).toLocaleString() + " registrations · " + Math.round(I.held * ramp(D0, t, 12)).toLocaleString() + " held";
          } else { var v = stormTotal(st.dr, t); w.textContent = big(v.flagged) + " flagged · " + v.regs.toLocaleString() + " registrations"; }
        }

        // ---------- interactions ----------
        stP.on("click", function (e, f) { if (!want[f.id]) return; if (st.level === "us" || f.id !== st.state) drillState(f.id); })
          .on("mouseover", function (e, f) { if (!want[f.id] || (st.level !== "us" && f.id === st.state)) return hideTip(); var v = stateVal(f.id, tOf(st.step)); showTip(e, B(esc(f.properties.name)) + "<div>" + (v.flagged ? big(v.flagged) + " flagged · " + v.regs.toLocaleString() + " registrations" : "No flagged registrations") + "<br>" + LINK("Click to drill in") + "</div>"); })
          .on("mouseout", hideTip);
        ctP.on("click", function (e, f) { if (G.counties[f.key]) drillCounty(f.key); })
          .on("mouseover", function (e, f) {
            var c = G.counties[f.key], v = c ? cval(c, st.dr, tOf(st.step)) : null, lbl = f.properties.name + (ABBR[f.id.slice(0, 2)] === "LA" ? " Parish" : " County");
            var extra = c ? (c.hubs.length ? "<br>Base of " + c.hubs.length + " network" + (c.hubs.length > 1 ? "s" : "") : "") + c.related.map(function (r) { return "<br>Related location · " + esc(F.net(r.net).name); }).join("") : "";
            if (!c || !v || v.flagged < 1) return showTip(e, B(esc(lbl)) + "<div>" + (c && c.decls.length ? "Designated · " + c.decls.join(", ") + "<br>" : "") + "No flagged registrations" + extra + "</div>");
            var nn = Object.keys(c.nets).filter(function (id) { return netHere(id, f.key, tOf(st.step), st.dr) > 0; }).length;
            showTip(e, B(esc(lbl)) + "<div style='color:" + (c.outside ? P.hatch : "var(--mp-link)") + "'>" + (c.outside ? "Outside every declared area" : "Designated · " + c.decls.join(", ")) + "</div><div>" + big(v.flagged) + " flagged · " + v.regs.toLocaleString() + " registrations<br>" + nn + " network" + (nn === 1 ? "" : "s") + " active here" + extra + "</div>");
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
        function toast(title, body, tone) { queue.push([title, body, tone]); if (!showing) next(); }
        function next() {
          var q = queue.shift(); if (!q) { showing = false; return; }
          showing = true;
          var kids = toasts.selectAll("div.mp-toast").nodes(); if (kids.length >= 3) d3.select(kids[0]).remove();
          var c = P.tone[q[2]] || P.tone.story;
          var n = toasts.append("div").attr("class", "mp-glass mp-toast").style("padding", "7px 11px").style("font-size", "11.5px").style("max-width", "310px").style("animation", "mp-toast .3s ease-out").style("border-left", "3px solid " + c)
            .html('<b style="color:' + c + '">' + esc(q[0]) + '</b>' + (q[1] ? '<br>' + esc(q[1]) : ""));
          setTimeout(function () { n.transition().duration(500).style("opacity", 0).remove(); }, st.dr ? 4600 : 3600);
          setTimeout(next, st.dr ? 900 : 650);
        }
        function flashAt(dr) {
          var d = G.DESIGNATED[dr], feats = d.counties.map(function (n) { return byKey[G.ST[d.state] + "|" + n]; }).filter(Boolean);
          var c = path.centroid(stateByFips[G.ST[d.state]]); if (st.level !== "us" && st.state === G.ST[d.state]) { var b = boundsOf(feats); c = [(b[0][0] + b[1][0]) / 2, (b[0][1] + b[1][1]) / 2]; }
          var q = tr.apply(c);
          flashG.append("circle").attr("cx", q[0]).attr("cy", q[1]).attr("r", 8).attr("fill", "none").attr("stroke", P.flash).attr("stroke-width", 3)
            .transition().duration(1400).attr("r", 60).style("opacity", 0).remove();
        }
        // shows the callouts between two moments; returns how many
        function fire(prev, now) {
          var n = 0;
          if (st.dr) {
            stormEvents(st.dr).forEach(function (e) {
              if (!(e.t > prev && e.t <= now)) return;
              n++;
              if (e.kind === "decl") flashAt(e.dr);
              toast("Day " + dayOf(st.dr, e.t) + ": " + e.title, e.body, e.tone);
            });
            return n;
          }
          ALL_EVENTS.forEach(function (e) {
            if (!(e.t > prev && e.t <= now)) return;
            n++;
            if (e.kind === "decl") { flashAt(e.dr); toast("Declared · " + e.dr, F.DECLS[e.dr].name + " · " + F.DECLS[e.dr].stateName, "decl"); }
            else toast("Seen before", F.net(e.net).name + ": first in " + e.from + ", now in " + e.to + ".", "seen");
          });
          return n;
        }
        function setStep(s, quiet) {
          var L = TL(), prev = tOf(st.step); prev = prev == null ? TODAY : prev;
          st.step = s >= L.steps ? null : s;
          var now = tOf(st.step); now = now == null ? TODAY : now;
          var n = !quiet && now > prev ? fire(prev, now) : 0;
          paint();
          return n;
        }
        function stop() { if (timer) clearTimeout(timer); timer = null; if (playBtn) playBtn.innerHTML = '<i class="ti ti-player-play-filled"></i>'; }
        function clearToasts() { queue = []; toasts.selectAll("div").remove(); }
        function play() {
          if (timer) return stop();
          var L = TL();
          var n = 0;
          if (st.step == null) { clearToasts(); st.step = 0; n = fire(L.t0 - 1, tOf(0)); paint(); }
          playBtn.innerHTML = '<i class="ti ti-player-pause-filled"></i>';
          // the clock holds on a step while its callouts come in, so dates and callouts stay in step
          var base = st.dr ? (L.k > 1 ? 320 : 420) : 230, per = st.dr ? 900 : 650;
          var tick = function () {
            if (!document.body.contains(el)) return stop();
            var s = (st.step == null ? L.steps : st.step) + 1;
            var fired = setStep(s);
            if (s >= L.steps) return stop();
            timer = setTimeout(tick, base + fired * per);
          };
          timer = setTimeout(tick, base + n * per);
        }
        function newTimeline() { stop(); clearToasts(); buildBar(); }

        buildBar();
        paint();
        return { paint: paint, drillState: drillState, drillCounty: drillCounty, toNation: toNation, newTimeline: newTimeline };
      }
    }
  };

  // ---------- side panels ----------
  function stat(l, v, s) { return '<div><div style="font-size:10.5px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em">' + l + '</div><div style="font-weight:600;font-size:18px;font-variant-numeric:tabular-nums">' + v + '</div>' + (s ? '<div style="font-size:10.5px;color:var(--text2)">' + s + '</div>' : '') + '</div>'; }
  function asOf(t) { return t == null ? "" : st.dr ? "Day " + dayOf(st.dr, t) + " · " + fmtDate(t) : fmtDate(t); }
  function summaryPanel(fips, t) {
    var dr = st.dr, D = dr ? F.DECLS[dr] : null, T = { flagged: 0, regs: 0, counties: 0, outside: 0, outsideAmt: 0 };
    var rows = Object.keys(G.counties).filter(function (k) { return !fips || k.slice(0, 2) === fips; }).map(function (k) { return { k: k, c: G.counties[k], v: cval(G.counties[k], dr, t) }; }).filter(function (x) { return x.v.flagged >= 1; });
    rows.forEach(function (x) { T.flagged += x.v.flagged; T.regs += x.v.regs; T.counties++; if (x.c.outside) { T.outside++; T.outsideAmt += x.v.flagged; } });
    rows.sort(function (a, b) { return b.v.flagged - a.v.flagged; });
    var nets = F.NETS.filter(function (n) { return netLive(n, t, dr) && (!fips || G.areas(n.id).some(function (a) { return G.ST[a.st] === fips; })); }).sort(function (a, b) { return b.atRisk - a.atRisk; });
    var title = fips ? esc(stateNameOf(fips)) : D ? esc(D.name) + ' · ' + D.stateName : "All declarations";
    var sub = (D ? D.id + " · declared " + D.declared : Object.keys(G.DESIGNATED).length + " declarations") + (t == null ? "" : " · as of " + asOf(t));
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
    var seed = c.key === G.key("Terrebonne", "LA") && (!st.dr || st.dr === "DR-9921-LA") && (t == null || t >= SEED_T);
    var list = function (head, rows) { return '<div class="card" style="margin:0;padding:0;overflow:hidden"><div style="padding:9px 12px;font-weight:500;font-size:12.5px;border-bottom:0.5px solid var(--border2)">' + head + '</div>' + rows + '</div>'; };
    var row = function (id, l, r) { return '<div data-net="' + id + '" style="display:flex;justify-content:space-between;gap:8px;padding:7px 12px;border-top:0.5px solid var(--border2);cursor:pointer;font-size:12px"><span>' + l + '</span>' + r + '</div>'; };
    var dot = function (n) { return '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + F.SCHEMES[n.scheme].color + ';margin-right:6px"></span>'; };
    return '<div class="card" style="margin:0"><div style="font-weight:600;font-size:14px;color:var(--ink)">' + esc(countyLabel(c)) + '</div>' +
      '<div style="margin:5px 0 10px;display:flex;gap:4px;flex-wrap:wrap">' + (c.outside ? '<span class="tag" style="background:var(--med-bg);color:var(--med-tx)">Outside every declared area</span>' : c.decls.map(function (d) { return '<span class="tag mono" title="' + esc(F.DECLS[d].name) + '">' + d + '</span>'; }).join("")) + (t == null ? "" : '<span class="tag" style="font-size:10px">as of ' + esc(asOf(t)) + '</span>') + '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' + stat("Flagged", big(v.flagged)) + stat("Registrations", v.regs.toLocaleString()) + '</div>' +
      (c.outside && v.flagged >= 1 ? '<div style="font-size:11.5px;color:var(--text2);margin-top:8px;line-height:1.45">Registrations claim damaged homes here, but no declaration designates this area for Individual Assistance.</div>' : '') +
      (c.isoAmt && !c.outside && v.flagged >= 1 ? '<div style="font-size:11.5px;color:var(--text2);margin-top:8px">' + usd(Math.round(c.isoAmt * (v.flagged / c.flagged))) + ' of it is isolated flags with no network.</div>' : '') + '</div>' +
      (seed ? '<div class="card" data-open="' + F.SEED + '" style="margin:0;cursor:pointer;border-color:#f3c9c9;background:var(--high-bg)"><div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--high-tx)">Held before payment</div><div style="font-weight:600;font-size:13px;margin-top:2px">R-104417 · Kendra L. Batiste · $17,280</div><div style="font-size:11.5px;color:var(--text2)">418 Cypress Bend Rd, Houma · open the registration <i class="ti ti-arrow-right"></i></div></div>' : '') +
      list("Networks with registrations here", nets.length ? nets.map(function (x) { return row(x.n.id, dot(x.n) + esc(x.n.name), '<span class="mono" style="font-weight:600">' + big(x.amt) + '</span>'); }).join("") : '<div style="padding:9px 12px;font-size:12px;color:var(--text3)">None</div>') +
      (hubs.length ? list("Networks based here", hubs.map(function (n) { return row(n.id, esc(n.name), '<span style="font-size:11px;color:var(--text3)">' + esc(F.SCHEMES[n.scheme].hub) + '</span>'); }).join("")) : '') +
      (c.related.length ? list("Related location for", c.related.map(function (r) { var n = F.net(r.net); return row(n.id, dot(n) + esc(n.name) + '<div style="font-size:11px;color:var(--text3);margin-left:14px">' + esc(r.label) + '</div>', ''); }).join("")) : '');
  }
})();
