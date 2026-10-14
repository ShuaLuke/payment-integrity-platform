/* Treasury pack · two windows, two systems. Treasury and an agency's system can run
   side by side in separate browser windows (the agency's opens with ?sys=irs, ssa,
   …): a package Treasury sends shows up in the agency's inbox, and the agency's
   decision shows up on Treasury's record, live. No server: same-origin windows talk
   over a BroadcastChannel. A window that opens late asks the others for what's
   happened so far; Reset in either window resets both. Requires treas-pack.js. */
(function () {
  var T = window.TREAS, APP = window.APP;
  var sys = (/[?&]sys=([a-z]+)/i.exec(location.search) || [])[1];
  APP.state.sysWindow = sys && T.AGENCIES[sys.toUpperCase()] ? sys.toUpperCase() : null;
  var ch = typeof BroadcastChannel === "function" ? new BroadcastChannel("pi-treas" + location.pathname) : null;

  // ---- what crosses between windows: packages, the agency's decisions, and their trail ----
  function pack(id) {
    var h = T.handoff(id), l = T.lead(id);
    return { id: id, h: h, status: l ? l.status : null, pd: APP.state.prepayDecisions[id] || null };
  }
  function packRef(key) {
    var r = T.netRef(key);
    return { key: key, r: r, leads: (r ? r.ids : []).map(function (id) { var l = T.lead(id); return l ? { id: id, status: l.status, pd: APP.state.prepayDecisions[id] || null } : null; }).filter(Boolean) };
  }
  function reviveTrail(o) { if (o && o.trail) o.trail.forEach(function (t) { t.ts = new Date(t.ts); }); if (o && o.opened) o.opened = new Date(o.opened); return o; }
  function applyRef(item) {
    if (!item || !item.r) return;
    var r = reviveTrail(revive(item.r)); APP.state.netRefs[item.key] = r;
    item.leads.forEach(function (x) { var l = T.lead(x.id); if (l) l.status = x.status; if (x.pd) APP.state.prepayDecisions[x.id] = revive(x.pd); });
  }
  function revive(o) {
    if (!o) return o;
    ["sentAt", "ts"].forEach(function (k) { if (o[k]) o[k] = new Date(o[k]); });
    if (o.decision && o.decision.ts) o.decision.ts = new Date(o.decision.ts);
    if (o.agency && o.agency.ts) o.agency.ts = new Date(o.agency.ts);
    return o;
  }
  function apply(item) {
    if (!item || !item.h) return;
    APP.state.handoffs[item.id] = reviveTrail(revive(item.h));
    var l = T.lead(item.id); if (l && item.status) l.status = item.status;
    if (item.pd) APP.state.prepayDecisions[item.id] = revive(item.pd);
  }
  function send(msg) { if (ch) try { ch.postMessage(JSON.parse(JSON.stringify(msg))); } catch (e) {} }
  function lastAudit() { var a = APP.state.audit[0]; return a ? { ts: a.ts, action: a.action, detail: a.detail, user: a.user } : null; }
  // re-render what's on screen, unless the person is typing in it
  function refresh() {
    var f = document.activeElement;
    if (f && /^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName) && f.type !== "radio") return;
    var v = APP.state.view;
    if (["home", "queue", "claim", "handoff", "netreferral", "network", "audit", "agencyportal"].indexOf(v) < 0) return;
    var y = window.scrollY;
    APP.nav(v, APP.state._navParams || { id: APP.state.allegationId });
    window.scrollTo(0, y);
  }

  function linked() { if (!APP.state.syncLinked) { APP.state.syncLinked = true; if (APP.state.sysWindow) refresh(); } }
  if (ch) ch.onmessage = function (e) {
    var m = e.data || {};
    linked();
    if (m.type === "update") {
      if (m.ref) applyRef(m.ref); else apply(m.item);
      if (m.audit) { m.audit.ts = new Date(m.audit.ts); APP.state.audit.unshift(m.audit); }
      refresh();
      toast(m.note);
    } else if (m.type === "hello") {
      var ids = Object.keys(APP.state.handoffs), keys = Object.keys(APP.state.netRefs);
      send({ type: "state", items: ids.map(pack), refs: keys.map(packRef) }); // answer even when empty, so the other window knows it's linked
    } else if (m.type === "state") {
      var fresh = (m.items || []).filter(function (it) { return !T.handoff(it.id) || (it.h.decision && !T.handoff(it.id).decision); });
      fresh.forEach(apply);
      var freshR = (m.refs || []).filter(function (it) { return !T.netRef(it.key) || (it.r.decision && !T.netRef(it.key).decision); });
      freshR.forEach(applyRef);
      if (fresh.length || freshR.length) refresh();
    } else if (m.type === "reset") location.reload();
  };

  // publish every send and every agency decision
  var baseSend = APP.sendHandoff, baseDecide = APP.agencyDecide;
  APP.sendHandoff = function (id, rec, reason, note) {
    var h = baseSend(id, rec, reason, note);
    if (h) send({ type: "update", item: pack(id), audit: lastAudit(), note: "Treasury sent " + h.pkg + " to " + h.agency });
    return h;
  };
  APP.agencyDecide = function (id, decision, reason, note) {
    baseDecide(id, decision, reason, note);
    var h = T.handoff(id), l = T.lead(id);
    if (h && h.decision) send({ type: "update", item: pack(id), audit: lastAudit(), note: h.agency + ": " + T.agencyDecision(l, decision).t + " · " + id });
  };
  var baseSendRef = APP.sendNetReferral, baseDecideRef = APP.agencyDecideRef, baseOpened = APP.agencyOpened;
  APP.sendNetReferral = function (scope, net, ids, recs, note) {
    var out = baseSendRef(scope, net, ids, recs, note);
    out.forEach(function (r) { send({ type: "update", ref: packRef(r.key), audit: lastAudit(), note: "Treasury sent " + r.id + " to " + r.agency }); });
    return out;
  };
  APP.agencyDecideRef = function (key, decision, reason, note) {
    baseDecideRef(key, decision, reason, note);
    var r = T.netRef(key); if (r && r.decision) send({ type: "update", ref: packRef(key), audit: lastAudit(), note: r.agency + ": " + T.netDecision(decision).t + " · " + r.id });
  };
  APP.agencyOpened = function (obj, agency) {
    var was = obj && obj.opened; baseOpened(obj, agency);
    if (obj && !was && obj.opened) send({ type: "update", ref: obj.key ? packRef(obj.key) : undefined, item: obj.key ? undefined : pack(obj.id), audit: lastAudit(), note: null });
  };
  // remember the params of the screen in view, so a refresh lands on the same thing
  var baseNav = APP.nav;
  APP.nav = function (view, params) { APP.state._navParams = params || {}; return baseNav(view, params); };

  // the agency's system in its own window
  APP.agencyWindowUrl = function (agency) { return location.pathname + "?uc=treas&sys=" + agency.toLowerCase(); };
  APP.openAgencyWindow = function (agency) {
    var w = null;
    try { w = window.open(APP.agencyWindowUrl(agency), "pi-agency-" + agency, "width=1280,height=860"); } catch (e) {}
    if (!w) { toast("Pop-ups are blocked here, so " + agency + "'s system opens in this tab instead. Allow pop-ups for the two-window demo."); APP.openAgencyPortal(agency); }
  };
  // what the agency window shows about its link to Treasury's window
  APP.syncStatus = function () { return !ch ? { ok: false, t: "No window link in this browser" } : APP.state.syncLinked ? { ok: true, t: "Linked to Treasury's window" } : { ok: false, t: "Not linked: open Treasury in this browser" }; };

  function toast(text) {
    if (!text) return;
    var n = document.createElement("div");
    n.innerHTML = '<i class="ti ti-arrows-exchange"></i> ' + APP.esc(text);
    n.style.cssText = "position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#001141;color:#fff;padding:9px 16px;border-radius:8px;font-size:12.5px;z-index:300;display:flex;gap:7px;align-items:center;box-shadow:0 6px 18px rgba(0,0,0,.2)";
    document.body.appendChild(n); setTimeout(function () { n.remove(); }, 3200);
  }

  // once the app is up: catch up with the other windows, wrap Reset, and in an
  // agency window put the agency's system on screen instead of the tour
  (function ready() {
    if (!APP.ready || !window.DEMO) return setTimeout(ready, 80);
    send({ type: "hello" });
    var baseReset = APP.resetDemo;
    APP.resetDemo = function () { send({ type: "reset" }); baseReset(); };
    if (!APP.state.sysWindow) return;
    document.title = T.AGENCIES[APP.state.sysWindow].name + " · Payment integrity workspace (simulated)";
    setTimeout(function () {
      window.DEMO.hide();
      var p = document.getElementById("demo-pill"); if (p) p.remove();
      APP.state.audit = APP.state.audit.filter(function (x) { return x.action !== "DEMO_HIDDEN"; });
      APP.openAgencyPortal(APP.state.sysWindow);
    }, 150);
  })();
})();
