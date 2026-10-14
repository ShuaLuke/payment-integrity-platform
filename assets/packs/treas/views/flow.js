/* Treasury pack · Insights › Payment flow — how a federal payment moves:
   certifying agency → Treasury (verification, then disbursement) → bank → payee,
   what each tier can see, the checks every payment already gets, the flagged
   payment traced to its account, the flags agencies share with Treasury, and the
   data sources that join the payments (Do Not Pay and TrackLight among them).
   Synthetic demo figures, except where noted. Replaces Views.edi. */
(function () {
  window.Views = window.Views || {};
  var T = window.TREAS;
  var esc = function (s) { return window.APP.esc(s); };

  var SEEN = {
    full: ["Every payment · one at a time", "var(--low-tx)", "var(--low-bg)", "eye"],
    partial: ["Its own payees only", "var(--med-tx)", "var(--med-bg)", "eye-exclamation"],
    none: ["Not shared", "var(--high-tx)", "var(--high-bg)", "eye-off"]
  };
  var NOTE = {
    agency: "IRS sees its refunds, SSA its beneficiaries, OPM its annuitants. None sees the others' payees.",
    treasury: "Every payment is checked before it goes out, each against the lists, on its own.",
    bank: "Who opened the account and when, which other accounts were opened alongside it.",
    payee: "The same mailbox, phone or employer used by many payees across programs."
  };
  var CHECKS = [
    ["Do Not Pay", "Death · debarment & exclusion · delinquent debt · incarceration · multi-use", "shield-check"],
    ["Account verification", "Is the account in the payee's name?", "building-bank"],
    ["TIN verification", "Is the taxpayer ID present, valid and matching?", "id"]
  ];
  var SOURCES = [
    ["Certified payment files", "IRS · SSA · OPM · VA · agency vendor files", "payee · TIN · address · amount · account", "daily", "agency"],
    ["Treasury payment history", "Fiscal Service disbursements", "every payment to every account", "continuous", "treasury"],
    ["Do Not Pay", "Death Master File · American InfoSource · SAM · OFAC · HHS OIG · CAIVRS · Treasury Offset Program · Bureau of Prisons · PACER", "list matches", "per payment", "treasury"],
    ["Agency signals", "SSA · IRS · OPM · VA, in the shared schema", "flags an agency raises on its own payees", "as raised", "agency"],
    ["TLMARK", "LexisNexis · OpenCorporates · IRS 990 · USAspending · Federal Audit Clearinghouse · Enformion · UniCourt · Perplexity · LinkedIn · PIPL · Nomino Data · obituaries and OSINT", "20 checks: deceased · social and professional links · owners, agents, officers, directors · non-profits, procurement, audits · criminal, liens, bankruptcies, assets, news · watchlists · network", "per payment · on change", "payee"],
    ["Account & TIN verification", "Account-ownership service", "who owns the account · TIN check", "per payment", "bank"],
    ["Returns & reclamations", "ACH returns · bank reclamation responses", "closed accounts · non-receipt · account details", "daily", "bank"],
    ["Direct-deposit change logs", "SSA · OPM · VA", "who changed the account, how, from which phone", "daily · data-sharing agreements", "agency"],
    ["Private mailbox list", "USPS commercial mail receiving agencies", "addresses that are mailboxes", "monthly", "payee"],
    ["Business registrations", "OpenCorporates · secretaries of state", "formation dates · registered agents · officers", "weekly", "payee"],
    ["IRS return flags", "IRS (return data stays with IRS)", "W-2 employer · preparer · duplicate filing", "daily · flags only, 26 U.S.C. § 6103", "agency"],
    ["Peer comparison", "All payments of the same type", "amount by payee profile", "continuous", "treasury"]
  ];

  window.Views.edi = {
    render: function (mount) {
      var F = T.FLOW, seed = T.lead(T.SEED), b = seed.batchRec;
      var tiers = F.tiers.map(function (t, i) {
        var s = SEEN[t.seen], dark = t.k === "treasury";
        return (i ? '<div style="align-self:center;color:var(--accent);font-size:18px;padding:0 2px"><i class="ti ti-arrow-right"></i></div>' : '') +
          '<div class="mf-tier" data-k="' + t.k + '" style="flex:1;min-width:170px;border-radius:10px;padding:12px 13px;background:' + (dark ? "#001141" : "var(--card)") + ';color:' + (dark ? "#fff" : "inherit") + ';border:0.5px solid ' + (dark ? "#001141" : "var(--border)") + '">' +
          '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:' + (dark ? "#78a9ff" : "var(--text3)") + '">Step ' + (i + 1) + '</div>' +
          '<div style="font-weight:600;font-size:14px;margin-top:2px">' + t.t + '</div>' +
          '<div style="font-size:11px;margin-top:1px;color:' + (dark ? "#c1c7cd" : "var(--text2)") + '">' + t.s + '</div>' +
          '<div class="mono" style="font-size:12px;margin-top:8px;color:' + (dark ? "#dde1e6" : "var(--ink)") + '">' + t.n + '</div>' +
          '<div style="margin-top:9px"><span class="pill" style="background:' + s[2] + ';color:' + s[1] + ';font-size:10.5px"><i class="ti ti-' + s[3] + '"></i> ' + s[0] + '</span></div>' +
          '<div style="font-size:10.5px;line-height:1.4;margin-top:5px;color:' + (dark ? "#c1c7cd" : "var(--text2)") + '">' + NOTE[t.k] + '</div></div>';
      }).join("");
      var hop = function (icon, title, sub, tone) {
        var c = tone === "hot" ? ["var(--high-bg)", "#f3c9c9", "var(--high-tx)"] : tone === "ok" ? ["var(--low-bg)", "transparent", "var(--low-tx)"] : ["var(--surface)", "var(--border)", "var(--accent-d)"];
        return '<div style="flex:1;min-width:150px;border-radius:8px;padding:8px 10px;background:' + c[0] + ';border:0.5px solid ' + c[1] + '">' +
          '<div style="font-size:11.5px;font-weight:600"><i class="ti ti-' + icon + '" style="color:' + c[2] + '"></i> ' + title + '</div><div style="font-size:10.5px;color:var(--text2);margin-top:2px;line-height:1.35">' + sub + '</div></div>';
      };
      var arrow = '<div style="align-self:center;color:var(--text3)"><i class="ti ti-chevron-right"></i></div>';
      var checks = CHECKS.map(function (c) { return '<div style="flex:1;min-width:200px;display:flex;gap:8px;align-items:flex-start;border:0.5px solid var(--border);border-radius:8px;padding:8px 10px"><i class="ti ti-' + c[2] + '" style="color:var(--low);font-size:17px"></i><div><div style="font-weight:600;font-size:12px">' + c[0] + ' <span class="pill" style="background:var(--low-bg);color:var(--low-tx);font-size:9.5px;margin-left:3px"><i class="ti ti-circle-check"></i> passed</span></div><div style="font-size:10.5px;color:var(--text2);line-height:1.35;margin-top:2px">' + c[1] + '</div></div></div>'; }).join("");
      var srcRows = SOURCES.map(function (s) {
        var t = F.tiers.filter(function (x) { return x.k === s[4]; })[0];
        return '<tr><td><div style="font-weight:500;font-size:12px">' + (s[0] === "TLMARK" ? T.tlMark("due diligence") : s[0]) + '</div><div style="font-size:10.5px;color:var(--text2)">' + s[1] + ' · <span class="mono">' + s[2] + '</span></div></td>' +
          '<td style="font-size:10.5px;color:var(--text2);white-space:nowrap">' + s[3] + '</td><td style="font-size:11px;white-space:nowrap">' + t.t + '</td></tr>';
      }).join("");
      var sig = T.SIGNALS.map(function (x) {
        return '<tr' + (T.lead(x.payment) ? ' class="mf-sig" data-id="' + x.payment + '" style="cursor:pointer"' : '') + '><td class="mono" style="font-size:11px;white-space:nowrap">' + esc(x.received) + '</td><td><span class="tag" style="font-size:10px">' + x.agency + '</span></td>' +
          '<td><div style="font-weight:500;font-size:12px">' + esc(x.kind) + '</div><div style="font-size:10.5px;color:var(--text2)">' + esc(x.subject) + ' · <span class="mono">' + x.payment + '</span></div></td>' +
          '<td style="font-size:11.5px;line-height:1.4;color:' + (x.clear ? "var(--text2)" : "var(--ink)") + '">' + (x.clear ? '' : '<i class="ti ti-link" style="color:var(--high)"></i> ') + esc(x.match) + '</td></tr>';
      }).join("");
      mount.innerHTML = '<div class="page">' +
        '<div class="page-head"><div><div class="page-title">How a federal payment moves</div><div class="page-sub">Agencies certify payments, and Treasury verifies and disburses them. Each payment is checked on its own; joining them shows the patterns no single check can see.</div></div></div>' +
        '<div class="card" id="mf-tiers"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:10px"><div style="font-weight:600;font-size:13.5px"><i class="ti ti-arrows-split-2" style="color:var(--accent-d)"></i> From certification to deposit, and what each step sees</div><div style="font-size:10.5px;color:var(--text3)">Tax refunds · benefits · annuities · vendor payments</div></div>' +
        '<div style="display:flex;align-items:stretch;gap:4px;overflow-x:auto;padding-bottom:2px">' + tiers + '</div>' +
        '<div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:260px;border:0.5px dashed var(--border);border-radius:8px;padding:9px 11px;color:var(--text2)"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--text3)"><i class="ti ti-list-check"></i> One payment at a time</div><div style="font-size:12px;line-height:1.5;margin-top:3px">A real identity and an account opened in that name pass every list check. Thirty of them sharing a mailbox, an account batch and a phone look like thirty ordinary payments from three agencies.</div></div>' +
        '<div style="flex:1;min-width:260px;background:var(--accent-l);border:0.5px solid var(--accent);border-radius:8px;padding:9px 11px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--accent-d)"><i class="ti ti-affiliate"></i> With the payments joined</div><div style="font-size:12px;line-height:1.5;margin-top:3px;color:var(--ink)">Every payment carries its account, address and history. Entity resolution matches them across agencies and payment types, so one organizer behind many payees becomes one network, before the next payment goes out.</div></div></div></div>' +
        '<div class="card" id="mf-signals" style="padding:0;overflow:hidden"><div style="padding:9px 12px;border-bottom:0.5px solid var(--border2);display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px"><div style="font-weight:600;font-size:13px"><i class="ti ti-share" style="color:var(--accent-d)"></i> Agency signals <span class="muted" style="font-weight:400;font-size:10.5px">· flags agencies raise on their own payees, shared with Treasury</span></div><span style="font-size:10.5px;color:var(--text3)">' + esc(T.SCHEMA.name) + '</span></div>' +
        '<table><thead><tr><th>Received</th><th>From</th><th>Flag</th><th>What Treasury matched it to</th></tr></thead><tbody>' + sig + '</tbody></table>' +
        '<div style="padding:8px 12px;font-size:11px;color:var(--text2);border-top:0.5px solid var(--border2)"><i class="ti ti-info-circle"></i> Each agency sees only its own payees. Shared with Treasury, one SSA flag about a changed deposit points at the same mailbox that receives IRS refunds.</div></div>' +
        '<div class="card" id="mf-trace"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:8px"><div style="font-weight:600;font-size:13px"><i class="ti ti-route" style="color:var(--accent-d)"></i> One payment, traced</div><button class="btn" id="mf-open" style="font-size:11px;padding:3px 9px">Open ' + T.SEED + ' <i class="ti ti-arrow-right"></i></button></div>' +
        '<div style="display:flex;gap:6px;align-items:stretch;flex-wrap:wrap">' +
        hop("receipt-tax", "IRS certifies a refund", esc(seed.payee) + ' · $18,940 · <span class="mono">' + esc(seed.schedule.replace("IRS refund schedule ", "schedule ")) + '</span>') + arrow +
        hop("shield-check", "Treasury verifies it", "Do Not Pay · account ownership · TIN: all passed", "ok") + arrow +
        hop("building-bank", "To " + esc(seed.bank) + " " + seed.acct, "Opened 19 days ago · one of " + b.accts + " neighboring accounts (" + b.range + ")", "hot") + arrow +
        hop("mailbox", "Mailbox PMB 212", T.MAILBOX.payments + " federal payments · " + T.MAILBOX.payees + " payees · IRS, SSA and OPM", "hot") +
        '</div>' +
        '<div style="font-size:10.5px;color:var(--text3);margin:10px 0 6px"><i class="ti ti-checklist"></i> The checks every payment already gets</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' + checks + '</div></div>' +
        '<div class="card" style="padding:0;overflow:hidden"><div style="padding:9px 12px;border-bottom:0.5px solid var(--border2);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div style="font-weight:500;font-size:12.5px"><i class="ti ti-database" style="color:var(--accent-d)"></i> Data sources <span class="muted" style="font-weight:400;font-size:10.5px">· what joins the payments · every piece of evidence is tagged with its lane</span></div>' + T.laneLegend() + '</div>' +
        '<table><thead><tr><th>Source</th><th>Cadence</th><th>Where it sits</th></tr></thead><tbody>' + srcRows + '</tbody></table></div>' +
        '<div style="font-size:10.5px;color:var(--text3);margin-top:8px"><i class="ti ti-info-circle"></i> Treasury reports that payment verification screened more than 1.1 billion payments (about $3.7 trillion) in FY2026 and returned about 13,500 payments ($175 million) that would have gone to deceased individuals (Treasury, Oct 6, 2026). Other figures in this demo are synthetic.</div>' +
        '</div>';
      mount.querySelectorAll(".mf-sig").forEach(function (r) { r.onclick = function () { var l = T.lead(r.getAttribute("data-id")); if (l && l.mode === "prepay" && !window.APP.isPrepay()) { window.APP.state.mode = "prepay"; window.APP.setModeHeader(); } else if (l && l.mode !== "prepay" && window.APP.isPrepay()) { window.APP.state.mode = "retrospective"; window.APP.setModeHeader(); } window.APP.openAllegation(l.id); }; });
      document.getElementById("mf-open").onclick = function () { if (!window.APP.isPrepay()) { window.APP.state.mode = "prepay"; window.APP.setModeHeader(); } window.APP.openAllegation(T.SEED); };
    }
  };
})();
