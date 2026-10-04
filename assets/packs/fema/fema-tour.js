/* Disaster-relief pack · the short guided tour — one flagged registration
   followed all the way out (8 steps): 1 Ingest → 2 Detect → 3 Case management →
   4 Networks → 5 Impact. Picked up by assets/demo.js via window.UC_PACK.tour.
   `trail` is how far the $17,280 registration has been followed (shown in the
   ribbon in place of the step dots). */
(function () {
  var F = window.FEMA;
  window.UC_PACK = window.UC_PACK || {};
  window.UC_PACK.tour = function (H) {
    var APP = function () { return window.APP; };
    function outlineRow(id) {
      setTimeout(function () { var row = document.querySelector('tr.pprow[data-id="' + id + '"]'); if (row) { row.style.outline = "2px solid #0f62fe"; row.style.outlineOffset = "-2px"; } }, 80);
    }
    function scrollUnderNav(sel, delay) {
      setTimeout(function () { var el = document.querySelector(sel), nav = document.querySelector(".topnav"); if (el && nav) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - nav.getBoundingClientRect().bottom - 8); }, delay || 120);
    }
    return {
      trail: ["$17,280 registration", "Storefront · $2.7M", "Network · $8.6M", "Linked · $21.4M", "20 networks · $103.4M"],
      steps: [
        { t: "Registrations coming in", trail: 0, chip: "1 · Ingest", n: "This is live intake for Hurricane Delphine in Louisiana: 61,480 registrations so far. Data sources lists every check a registration runs through before it pays: identity, death and prisoner records through Do Not Pay, parish property records, USPS, the damage footprint, insurance, SBA loans, bank-account ownership and device telemetry. In the incoming feed, most registrations verify and go straight to payment. Watch for R-104417, a $17,280 renter registration from Houma: it scores 94 and is held. Scroll down to see the last 24 hours, from registration to payment.",
          a: function () { H.retro(); H.closeCopilot(); APP().nav("edi"); } },
        { t: "Scored before it pays", trail: 0, chip: "2 · Detect", n: "That registration lands here, at the top of pre-payment review: risk 94, and the model recommends Hold. Every award is scored before money goes out, while verified survivors keep moving through the fast lane: 91% pass every check and go straight to payment. Hover over the model's Hold to see why; click it and the Investigative Assistant explains it in full. Then click Hold and watch Payments held go from $0 to $17,280. Nothing is taken from a genuine renter; the money just stays put until occupancy is verified.",
          a: function () { H.closeCopilot(); APP().setRole("analyst"); APP().setMode("prepay"); APP().nav("queue"); outlineRow(F.SEED); } },
        { t: "Pull the thread", trail: 1, chip: "2 · Detect", n: "That $17,280 registration is the thread. This one came through the same storefront three weeks earlier and has already been paid. Put the two leases side by side: same template, same “premisis” misspelling, same landlord signature, different tenants. The landlord owns none of the 61 addresses on its leases, and this award's deposit account took awards in two other names. The same facilitator, Crescent Relief Navigators, filed 184 registrations worth $2.7M. We stop the next one before it pays and recover these.",
          a: function () { H.retro(); H.closeCopilot(); APP().openAllegation(F.THREAD); H.tab("documents"); } },
        { t: "AI that does the legwork", trail: 2, chip: "3 · Case mgmt", n: "The analyst works the registration, and the Investigative Assistant's three agents do the research: investigative, eligibility, and policy. Each returns findings with sources. The investigative agent has already followed the thread past this storefront: it's one of four “FEMA application help” pages in Louisiana and Mississippi, run by one operator and paying into the same collection accounts.",
          a: function () { H.retro(); APP().openAllegation(F.THREAD); if (window.COPILOT) window.COPILOT.open("agents"); } },
        { t: "A documented decision", trail: 2, chip: "3 · Case mgmt", n: "Here's the “landlord” himself. Jarrod Fontenot signs the leases for Fontenot Rentals, and he registered as a displaced renter in an apartment that doesn't exist. The analyst confirms the registration is ineligible and records a coded reason with an AI-drafted justification. The system suggests where it belongs: on the Crescent Relief case, because it shares the lease template, the device and the collection accounts. A supervisor approves before any recovery starts, and every decision feeds back to retrain the models.",
          a: function () { H.retro(); H.closeCopilot(); var me = APP().ROLES[APP().state.role].name; APP().assignCase(F.DECISION, me); APP().startLeadReview(F.DECISION); APP().openAllegation(F.DECISION); H.tab("decision"); var seg = document.querySelector('.seg[data-d="c"]'); if (seg) seg.click(); } },
        { t: "The network, down to the registration", trail: 2, chip: "4 · Networks", n: "Here's the whole thread on one screen. Our $17,280 registration is in red. Around it are 17 more like it, filed for 17 different people through four storefronts that look unrelated on paper. Follow the lines down: each collection account receives awards filed through different storefronts in different names. Hover over an account to see whose money it collects. One operator, two states, 597 registrations, $8.6M.",
          a: function () { H.retro(); H.closeCopilot(); APP().state.networkScenario = "N01"; APP().nav("network"); window.scrollTo(0, 0); scrollUnderNav("#n-canvas"); } },
        { t: "Networks linked to networks", trail: 3, chip: "4 · Networks", n: "And Crescent Relief isn't working alone. This map shows every network detected across six declarations: 20 of them. The red dashed lines are the same collection account, lease template, device or phone turning up in two networks. The one showing now: Crescent Relief's lease template, misspelling and all, on 88 registrations after the Ridgeline Wildfire in California. Hover over Crescent Relief and a third network lights up: collection account ••5106 also took awards after the Texas floods. Three linked networks across three disasters add up to $21.4M. Half of all these networks span more than one disaster or state, which a review of one declaration would never see.",
          a: function () { H.retro(); H.closeCopilot(); APP().state.networkScenario = "all"; APP().nav("network"); var tok = H.tok(); setTimeout(function () { if (tok === H.tok()) H.showLink("N01", "N07"); }, 700); } },
        { t: "From $17K to $100M", trail: 4, chip: "5 · Impact", n: "Now back to the top of the page. Follow the numbers from that one $17,280 registration: the storefront's own registrations come to $2.7M, the operator's network to $8.6M, the networks linked to it to $21.4M, and the same patterns across all 20 networks to $103.4M. Nobody finds that by verifying 8,563 registrations one at a time. One flag opens the network, analysts work 20 cases, and verified survivors aren't slowed down.",
          a: function () { H.retro(); H.closeCopilot(); APP().state.networkScenario = "all"; APP().nav("network"); window.scrollTo(0, 0); setTimeout(function () { var f = document.getElementById("nv-funnel"); if (f) { f.style.outline = "2px solid #0f62fe"; f.style.outlineOffset = "2px"; } }, 400); } }
      ]
    };
  };
})();
