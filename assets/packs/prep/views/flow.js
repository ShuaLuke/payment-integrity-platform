/* Preparedness Grants pack · Insights › Money flow — where preparedness money
   goes after FEMA awards it: FEMA → state agencies → subrecipients → vendors,
   what FEMA can see at each tier today, the flagged request traced down to its
   vendor, and the data sources that join the tiers. Illustrative, synthetic
   figures. Replaces Views.edi. */
(function () {
  window.Views = window.Views || {};
  var P = window.PREP;
  var esc = function (s) { return window.APP.esc(s); };
  function big(n) { return n >= 1e9 ? "$" + (Math.round(n / 1e8) / 10) + "B" : "$" + (Math.round(n / 1e5) / 10) + "M"; }

  var SEEN = {
    full: ["Seen today", "var(--low-tx)", "var(--low-bg)", "eye"],
    partial: ["Partly seen", "var(--med-tx)", "var(--med-bg)", "eye-exclamation"],
    none: ["Not seen today", "var(--high-tx)", "var(--high-bg)", "eye-off"]
  };
  var NOTE = {
    fema: "Award, budget and drawdowns in FEMA's grants system.",
    state: "First-tier subaward reports, larger subawards only, and often incomplete.",
    sub: "Invoices and payments sit in county and city finance systems.",
    vendor: "Who the vendors are, who owns them and what they share: no federal view."
  };
  var SOURCES = [
    ["FEMA awards & drawdowns", "FEMA grants system", "awards · budgets · drawdowns", "daily", "fema"],
    ["Federal subaward reports", "SAM.gov (FFATA)", "first-tier subawards", "monthly", "state"],
    ["State subaward ledgers", "56 state administrative agencies", "subawards · reimbursements", "weekly", "state"],
    ["Subrecipient payments & invoices", "County and city finance systems", "vendor · invoice · amount", "weekly · data-sharing agreements", "sub"],
    ["Deliverables", "Uploaded with each request", "plans · reports · exercise records", "per request", "sub"],
    ["Equipment inventories", "Subrecipient property records", "serial numbers · location", "quarterly", "sub"],
    ["Vendor registrations & exclusions", "SAM.gov · Do Not Pay", "UEI · exclusions", "daily", "vendor"],
    ["State business registries", "Secretaries of state", "officers · registered agents · formation dates", "weekly", "vendor"],
    ["Bank account verification", "Account-ownership service", "who owns the deposit account", "per payment", "vendor"],
    ["Single Audit findings", "Federal Audit Clearinghouse", "findings by subrecipient", "annual", "state"],
    ["Peer pricing", "All subaward invoices", "price by deliverable type", "continuous", "sub"]
  ];

  window.Views.edi = {
    render: function (mount) {
      var F = P.FLOW, seed = P.lead(P.SEED), v = P.vendor("V1");
      var tiers = F.tiers.map(function (t, i) {
        var s = SEEN[t.seen];
        return (i ? '<div style="align-self:center;color:var(--accent);font-size:18px;padding:0 2px"><i class="ti ti-arrow-right"></i></div>' : '') +
          '<div class="mf-tier" data-k="' + t.k + '" style="flex:1;min-width:170px;border-radius:10px;padding:12px 13px;background:' + (i === 0 ? "#001141" : "var(--card)") + ';color:' + (i === 0 ? "#fff" : "inherit") + ';border:0.5px solid ' + (i === 0 ? "#001141" : "var(--border)") + '">' +
          '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:' + (i === 0 ? "#78a9ff" : "var(--text3)") + '">Tier ' + (i + 1) + '</div>' +
          '<div style="font-weight:600;font-size:14px;margin-top:2px">' + t.t + '</div>' +
          '<div style="font-size:11px;margin-top:1px;color:' + (i === 0 ? "#c1c7cd" : "var(--text2)") + '">' + t.s + '</div>' +
          '<div class="mono" style="font-size:12px;margin-top:8px;color:' + (i === 0 ? "#dde1e6" : "var(--ink)") + '">' + t.n + '</div>' +
          '<div style="margin-top:9px"><span class="pill" style="background:' + s[2] + ';color:' + s[1] + ';font-size:10.5px"><i class="ti ti-' + s[3] + '"></i> ' + s[0] + '</span></div>' +
          '<div style="font-size:10.5px;line-height:1.4;margin-top:5px;color:' + (i === 0 ? "#c1c7cd" : "var(--text2)") + '">' + NOTE[t.k] + '</div></div>';
      }).join("");
      var hop = function (icon, title, sub, tone) {
        return '<div style="flex:1;min-width:150px;border-radius:8px;padding:8px 10px;background:' + (tone === "hot" ? "var(--high-bg)" : "var(--surface)") + ';border:0.5px solid ' + (tone === "hot" ? "#f3c9c9" : "var(--border)") + '">' +
          '<div style="font-size:11.5px;font-weight:600"><i class="ti ti-' + icon + '" style="color:' + (tone === "hot" ? "var(--high-tx)" : "var(--accent-d)") + '"></i> ' + title + '</div><div style="font-size:10.5px;color:var(--text2);margin-top:2px;line-height:1.35">' + sub + '</div></div>';
      };
      var arrow = '<div style="align-self:center;color:var(--text3)"><i class="ti ti-chevron-right"></i></div>';
      var srcRows = SOURCES.map(function (s) {
        var t = F.tiers.filter(function (x) { return x.k === s[4]; })[0];
        return '<tr><td><div style="font-weight:500;font-size:12px">' + s[0] + '</div><div style="font-size:10.5px;color:var(--text2)">' + s[1] + ' · <span class="mono">' + s[2] + '</span></div></td>' +
          '<td style="font-size:10.5px;color:var(--text2);white-space:nowrap">' + s[3] + '</td><td style="font-size:11px;white-space:nowrap">Tier ' + (F.tiers.indexOf(t) + 1) + ' · ' + t.t + '</td></tr>';
      }).join("");
      mount.innerHTML = '<div class="page">' +
        '<div class="page-head"><div><div class="page-title">Money flow below the state</div><div class="page-sub">FEMA awards preparedness grants to the states, and the states pass most of the money to counties, cities and urban areas, which pay vendors. Joining those tiers shows where the money went.</div></div></div>' +
        '<div class="card" id="mf-tiers"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:10px"><div style="font-weight:600;font-size:13.5px"><i class="ti ti-arrows-split-2" style="color:var(--accent-d)"></i> Where a preparedness dollar goes, and what FEMA sees of it</div><div style="font-size:10.5px;color:var(--text3)">State homeland security · urban area security · emergency management grants · illustrative figures</div></div>' +
        '<div style="display:flex;align-items:stretch;gap:4px;overflow-x:auto;padding-bottom:2px">' + tiers + '</div>' +
        '<div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap">' +
        '<div style="flex:1;min-width:260px;border:0.5px dashed var(--border);border-radius:8px;padding:9px 11px;color:var(--text2)"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--text3)"><i class="ti ti-eye-off"></i> Today</div><div style="font-size:12px;line-height:1.5;margin-top:3px">FEMA sees the award to the state. A vendor selling the same plan to twelve counties in four states shows up as twelve ordinary local purchases in twelve separate systems.</div></div>' +
        '<div style="flex:1;min-width:260px;background:var(--accent-l);border:0.5px solid var(--accent);border-radius:8px;padding:9px 11px"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--accent-d)"><i class="ti ti-affiliate"></i> With the tiers joined</div><div style="font-size:12px;line-height:1.5;margin-top:3px;color:var(--ink)">Every reimbursement request carries its vendor, deliverable and price. Entity resolution matches vendors across states, so one business behind many local purchases becomes one network.</div></div></div></div>' +
        '<div class="card" id="mf-trace"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px;margin-bottom:8px"><div style="font-weight:600;font-size:13px"><i class="ti ti-route" style="color:var(--accent-d)"></i> One request, traced to the vendor</div><button class="btn" id="mf-open" style="font-size:11px;padding:3px 9px">Open ' + P.SEED + ' <i class="ti ti-arrow-right"></i></button></div>' +
        '<div style="display:flex;gap:6px;align-items:stretch;flex-wrap:wrap">' +
        hop("building-bank", "FEMA → Virginia", seed.award.program + " " + seed.award.fy + ' · <span class="mono">' + seed.award.no + '</span>') + arrow +
        hop("building-community", "Virginia → " + seed.subrecipient.name, "Subaward · reimbursement request " + P.SEED) + arrow +
        hop("building-store", seed.subrecipient.name + " → " + v.name, esc(seed.deliverable) + " · $86,400", "hot") + arrow +
        hop("affiliate", "Same vendor network", "12 jurisdictions bought the same plan · 31 subrecipients in 4 states pay the network", "hot") +
        '</div></div>' +
        '<div class="card" style="padding:0;overflow:hidden"><div style="padding:9px 12px;border-bottom:0.5px solid var(--border2);font-weight:500;font-size:12.5px"><i class="ti ti-database" style="color:var(--accent-d)"></i> Data sources <span class="muted" style="font-weight:400;font-size:10.5px">· what joins the tiers</span></div>' +
        '<table><thead><tr><th>Source</th><th>Cadence</th><th>Fills in</th></tr></thead><tbody>' + srcRows + '</tbody></table></div>' +
        '<div style="font-size:10.5px;color:var(--text3);margin-top:8px"><i class="ti ti-info-circle"></i> GAO found that about 36% of 3,680 single-audit findings (2022–24) involved subaward oversight, such as unreported subawards and unmonitored subrecipients (GAO-25-107315). Demo figures are synthetic.</div>' +
        '</div>';
      document.getElementById("mf-open").onclick = function () { if (!window.APP.isPrepay()) { window.APP.state.mode = "prepay"; window.APP.setModeHeader(); } window.APP.openAllegation(P.SEED); };
    }
  };
})();
