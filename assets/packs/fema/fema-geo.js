/* Disaster-relief pack · geography for the map view. Real county/parish names
   (US Census boundaries in geo/counties-10m.json, public domain via us-atlas);
   the declarations, dollars and networks on them are synthetic.
   DESIGNATED: the counties/parishes each fictional declaration covers.
   NET_GEO: where each network's hub (operator, landlord, account, device or
   address) is based, and the counties where its registrations claim damage,
   as [county, state, share of the network's at-risk dollars, declaration].
   A county outside every designated list is "outside the declared area".
   Attaches FEMA.GEO (needs fema-data.js). */
(function () {
  var F = window.FEMA;
  var ST = { "LA": "22", "MS": "28", "TX": "48", "FL": "12", "NC": "37", "CA": "06", "GA": "13", "NV": "32", "OK": "40", "AZ": "04", "TN": "47", "AL": "01" };
  var DESIGNATED = {
    "DR-9921-LA": { state: "LA", counties: ["Terrebonne", "Lafourche", "St. Mary", "Iberia", "Vermilion", "Assumption"] },
    "DR-9922-MS": { state: "MS", counties: ["Pearl River", "Hancock", "Harrison", "Jackson"] },
    "DR-9877-TX": { state: "TX", counties: ["Harris", "Fort Bend", "Brazoria", "Galveston", "Montgomery"] },
    "DR-9864-FL": { state: "FL", counties: ["Escambia", "Santa Rosa", "Okaloosa", "Walton", "Leon"] },
    "DR-9851-NC": { state: "NC", counties: ["Buncombe", "Henderson", "Haywood", "McDowell"] },
    "DR-9806-CA": { state: "CA", counties: ["Butte", "Shasta", "Tehama"] }
  };
  var NET_GEO = {
    N01: { hub: ["Terrebonne", "LA"], areas: [["Terrebonne", "LA", .34, "DR-9921-LA"], ["Lafourche", "LA", .26, "DR-9921-LA"], ["St. Mary", "LA", .2, "DR-9921-LA"], ["Pearl River", "MS", .2, "DR-9922-MS"]] },
    N02: { hub: ["East Baton Rouge", "LA"], areas: [["Terrebonne", "LA", .45, "DR-9921-LA"], ["Iberia", "LA", .35, "DR-9921-LA"], ["Vermilion", "LA", .2, "DR-9921-LA"]] },
    N03: { hub: ["Harris", "TX"], areas: [["Harris", "TX", .5, "DR-9877-TX"], ["Fort Bend", "TX", .3, "DR-9877-TX"], ["Brazoria", "TX", .2, "DR-9877-TX"]] },
    N04: { hub: ["Leon", "FL"], areas: [["Leon", "FL", .45, "DR-9864-FL"], ["Escambia", "FL", .35, "DR-9864-FL"], ["Okaloosa", "FL", .2, "DR-9864-FL"]], also: [["Lowndes", "GA"]] },
    N05: { hub: ["Harrison", "MS"], areas: [["Harrison", "MS", .5, "DR-9922-MS"], ["Jackson", "MS", .3, "DR-9922-MS"], ["Hancock", "MS", .2, "DR-9922-MS"]] },
    N06: { hub: ["Santa Rosa", "FL"], areas: [["Santa Rosa", "FL", .45, "DR-9864-FL"], ["Escambia", "FL", .35, "DR-9864-FL"], ["Okaloosa", "FL", .2, "DR-9864-FL"]] },
    N07: { hub: ["Butte", "CA"], areas: [["Butte", "CA", .6, "DR-9806-CA"], ["Shasta", "CA", .4, "DR-9806-CA"]], also: [["Washoe", "NV"]] },
    N08: { hub: ["Galveston", "TX"], areas: [["Galveston", "TX", .5, "DR-9877-TX"], ["Harris", "TX", .3, "DR-9877-TX"], ["Brazoria", "TX", .2, "DR-9877-TX"]] },
    N09: { hub: ["Montgomery", "TX"], areas: [["Montgomery", "TX", .4, "DR-9877-TX"], ["Harris", "TX", .3, "DR-9877-TX"], ["Terrebonne", "LA", .3, "DR-9921-LA"]] },
    N10: { hub: ["Shasta", "CA"], areas: [["Shasta", "CA", .5, "DR-9806-CA"], ["Butte", "CA", .3, "DR-9806-CA"], ["Tehama", "CA", .2, "DR-9806-CA"]] },
    N11: { hub: ["Harris", "TX"], areas: [["Harris", "TX", .55, "DR-9877-TX"], ["Fort Bend", "TX", .45, "DR-9877-TX"]], also: [["Oklahoma", "OK"]] },
    N12: { hub: ["Okaloosa", "FL"], areas: [["Okaloosa", "FL", .55, "DR-9864-FL"], ["Walton", "FL", .45, "DR-9864-FL"]], also: [["Lowndes", "GA"]] },
    N13: { hub: ["Lafourche", "LA"], areas: [["Lafourche", "LA", .5, "DR-9921-LA"], ["Terrebonne", "LA", .3, "DR-9921-LA"], ["Assumption", "LA", .2, "DR-9921-LA"]] },
    N14: { hub: ["Tehama", "CA"], areas: [["Tehama", "CA", .4, "DR-9806-CA"], ["Butte", "CA", .6, "DR-9806-CA"]], also: [["Maricopa", "AZ"]] },
    N15: { hub: ["Terrebonne", "LA"], areas: [["Terrebonne", "LA", 1, "DR-9921-LA"]] },
    N16: { hub: ["Hancock", "MS"], areas: [["Hancock", "MS", .6, "DR-9922-MS"], ["Harrison", "MS", .4, "DR-9922-MS"]] },
    N17: { hub: ["Butte", "CA"], areas: [["Butte", "CA", 1, "DR-9806-CA"]] },
    N18: { hub: ["Davidson", "TN"], areas: [["Walton", "FL", .6, "DR-9864-FL"], ["Hancock", "MS", .4, "DR-9922-MS"]] },
    N19: { hub: ["Buncombe", "NC"], areas: [["Buncombe", "NC", .35, "DR-9851-NC"], ["Henderson", "NC", .25, "DR-9851-NC"], ["East Baton Rouge", "LA", .4, "DR-9921-LA"]] },
    N20: { hub: ["Henderson", "NC"], areas: [["Henderson", "NC", .4, "DR-9851-NC"], ["Buncombe", "NC", .35, "DR-9851-NC"], ["Haywood", "NC", .15, "DR-9851-NC"], ["McDowell", "NC", .1, "DR-9851-NC"]], also: [["Davidson", "TN"]] }
  };
  // isolated flags (no network) per designated county: registrations, flagged $
  var ISOLATED = { "DR-9921-LA": [42, 510000], "DR-9922-MS": [27, 330000], "DR-9877-TX": [61, 690000], "DR-9864-FL": [38, 420000], "DR-9851-NC": [24, 260000], "DR-9806-CA": [33, 390000] };

  function key(name, st) { return ST[st] + "|" + name; }
  var counties = {}; // key -> { name, st, decls:[], flagged, regs, nets:{id:$}, isolated:{dr:[n,$]} }
  function county(name, st) { var k = key(name, st); return counties[k] || (counties[k] = { key: k, name: name, st: st, decls: [], flagged: 0, regs: 0, nets: {}, byDecl: {}, hubs: [], outside: false }); }
  Object.keys(DESIGNATED).forEach(function (dr) {
    var d = DESIGNATED[dr], iso = ISOLATED[dr], n = d.counties.length;
    d.counties.forEach(function (c, i) {
      var x = county(c, d.state); x.decls.push(dr);
      // spread isolated flags unevenly so the counties don't all look alike
      var w = (n - i) / (n * (n + 1) / 2);
      var regs = Math.round(iso[0] * w), amt = Math.round(iso[1] * w / 10) * 10;
      x.isoRegs = (x.isoRegs || 0) + regs; x.isoAmt = (x.isoAmt || 0) + amt;
      x.byDecl[dr] = x.byDecl[dr] || { flagged: 0, regs: 0 }; x.byDecl[dr].flagged += amt; x.byDecl[dr].regs += regs;
      x.flagged += amt; x.regs += regs;
    });
  });
  F.NETS.forEach(function (n) {
    var g = NET_GEO[n.id]; if (!g) return;
    county(g.hub[0], g.hub[1]).hubs.push(n.id);
    g.areas.forEach(function (a) {
      var x = county(a[0], a[1]), amt = Math.round(n.atRisk * a[2]), regs = Math.round(n.regs * a[2]);
      x.flagged += amt; x.regs += regs; x.nets[n.id] = (x.nets[n.id] || 0) + amt;
      x.byDecl[a[3]] = x.byDecl[a[3]] || { flagged: 0, regs: 0 }; x.byDecl[a[3]].flagged += amt; x.byDecl[a[3]].regs += regs;
    });
    (g.also || []).forEach(function (a) { county(a[0], a[1]).hubs.push(n.id); });
  });
  Object.keys(counties).forEach(function (k) { counties[k].outside = !counties[k].decls.length; });

  F.GEO = {
    ST: ST, DESIGNATED: DESIGNATED, NET_GEO: NET_GEO, counties: counties, key: key,
    states: Object.keys(ST).map(function (s) { return ST[s]; }),
    // the county a network is drawn from, and every county it touches
    netHub: function (id) { var g = NET_GEO[id]; return g ? key(g.hub[0], g.hub[1]) : null; },
    netCounties: function (id) { var g = NET_GEO[id]; if (!g) return []; return g.areas.map(function (a) { return key(a[0], a[1]); }).concat((g.also || []).map(function (a) { return key(a[0], a[1]); })); },
    // flagged dollars and registrations in a county, optionally for one declaration
    value: function (c, dr) { if (!dr) return { flagged: c.flagged, regs: c.regs }; return c.byDecl[dr] || { flagged: 0, regs: 0 }; }
  };
})();
