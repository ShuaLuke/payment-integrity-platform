/* Treasury pack · Insights › Audit trail — every action on both sides: Treasury's
   analysts and supervisors, the packages and referrals sent, and what each agency's
   reviewer did with them (mirrored back). Filter by payment, network, agency or
   words. Replaces the shared Views.audit for this pack. */
(function () {
  window.Views = window.Views || {};
  var T = window.TREAS, esc = function (s) { return window.APP.esc(s); };
  var ICON = { SESSION_START: "login", PACKAGE_SENT: "send", NETWORK_REFERRAL_SENT: "send", AGENCY_SIGN_IN: "login", AGENCY_OPENED: "eye", AGENCY_DECISION: "gavel", AGENCY_NETWORK_DECISION: "gavel", RECOMMENDATION_READY: "check", PREPAY_PAY: "check", SUPERVISOR_APPROVED: "user-check", SUPERVISOR_RETURNED: "arrow-back", DECISION_CONFIRM: "circle-check", DECISION_DISMISS: "circle-x", DECISION_ESCALATE: "arrow-up-right", CASE_OPENED: "folder-plus", CASE_UPDATED: "folder", AI_AGENTS_RUN: "sparkles", AI_JUSTIFICATION_DRAFTED: "sparkles", EXPORT: "download", ROLE_SWITCH: "switch-horizontal", MODE_SWITCH: "switch-horizontal" };
  var AGENCY_ACTS = /^AGENCY_/;
  var f = { q: "", side: "" };

  window.Views.audit = {
    render: function (mount) {
      var log = window.APP.state.audit;
      var chip = function (v, l) { return '<button class="qscope au-side' + (f.side === v ? " active" : "") + '" data-v="' + v + '">' + l + '</button>'; };
      mount.innerHTML = '<div class="page">' +
        '<div class="page-head"><div><div class="page-title">Audit trail</div><div class="page-sub">Every action, on both sides: what Treasury sent, and what each agency did with it. Immutable.</div></div>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input id="au-q" class="input" placeholder="Payment, network, agency, person…" value="' + esc(f.q) + '" style="width:260px;font-size:12px">' +
        '<div style="display:flex;gap:2px;background:var(--surface);border:0.5px solid var(--border);border-radius:8px;padding:2px">' + chip("", "All") + chip("treasury", "Treasury") + chip("agency", "Agencies") + chip("handoff", "Packages & referrals") + '</div></div></div>' +
        '<div class="card" style="padding:0;overflow:hidden"><div id="au-list"></div></div></div>';
      var draw = function () {
        var q = f.q.toLowerCase();
        var rows = log.filter(function (e) {
          if (f.side === "agency" && !AGENCY_ACTS.test(e.action)) return false;
          if (f.side === "treasury" && AGENCY_ACTS.test(e.action)) return false;
          if (f.side === "handoff" && !/PACKAGE|REFERRAL|AGENCY_DECISION|AGENCY_NETWORK|AGENCY_OPENED|RECOMMENDATION/.test(e.action)) return false;
          return !q || (e.action + " " + e.detail + " " + e.user).toLowerCase().indexOf(q) >= 0;
        });
        document.getElementById("au-list").innerHTML = '<div style="padding:8px 12px;border-bottom:0.5px solid var(--border2);font-size:11px;color:var(--text2)"><i class="ti ti-shield-lock"></i> ' + rows.length + ' of ' + log.length + ' events</div>' +
          (rows.length ? rows.map(function (e) {
            var ag = AGENCY_ACTS.test(e.action), m = /\((IRS|SSA|OPM|VA|GSA)\)|→ (Internal Revenue Service|Social Security Administration|Office of Personnel Management|Department of Veterans Affairs|General Services Administration)/.exec(e.detail);
            return '<div style="display:flex;gap:10px;padding:8px 12px;border-top:0.5px solid var(--border2);align-items:flex-start"><i class="ti ti-' + (ICON[e.action] || "point") + '" style="color:' + (ag ? "#1a6b5f" : "var(--accent-d)") + ';font-size:16px;margin-top:1px"></i>' +
              '<div style="flex:1;min-width:0"><div style="font-size:12.5px"><span class="tag" style="font-size:9.5px;background:' + (ag ? "#e3f6f4;color:#0e5a63" : "var(--accent-l);color:var(--accent-d)") + '">' + (ag ? "Agency" : "Treasury") + '</span> <span style="font-weight:500">' + esc(label(e.action)) + '</span> — ' + esc(e.detail) + '</div>' +
              '<div style="font-size:11px;color:var(--text3)">' + esc(e.user) + '</div></div><div class="mono" style="font-size:11px;color:var(--text3);white-space:nowrap">' + window.APP.fmtTs(e.ts) + '</div></div>';
          }).join("") : '<div class="muted" style="padding:14px;font-size:12.5px">Nothing matches.</div>');
      };
      draw();
      document.getElementById("au-q").oninput = function () { f.q = this.value; draw(); };
      mount.querySelectorAll(".au-side").forEach(function (b) { b.onclick = function () { f.side = b.getAttribute("data-v"); mount.querySelectorAll(".au-side").forEach(function (x) { x.classList.toggle("active", x === b); }); draw(); }; });
    }
  };
  function label(a) { return a.replace(/_/g, " ").toLowerCase().replace(/^./, function (c) { return c.toUpperCase(); }); }
})();
