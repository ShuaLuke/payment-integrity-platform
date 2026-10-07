/* Preparedness Grants pack · the short guided tour — one flagged reimbursement
   followed all the way out (8 steps): 1 Ingest → 2 Detect → 3 Case management →
   4 Networks → 5 Impact. Picked up by assets/demo.js via window.UC_PACK.tour.
   `trail` is how far the $86,400 request has been followed (shown in the ribbon
   in place of the step dots). */
(function () {
  var P = window.PREP;
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
      trail: ["$86,400 invoice", "Same plan · $1.04M", "Network · $6.3M", "Linked · $14.9M", "9 networks · $38.2M"],
      steps: [
        { t: "Below the state", trail: 0, chip: "1 · Ingest", n: "FEMA awards preparedness grants to the states, and the states pass most of the money down to counties, cities and urban areas, which pay vendors. Today FEMA sees the first tier: the award to the state. The tiers below, where the money is actually spent, sit in state and county systems. This screen joins them: state subaward ledgers, county invoices, deliverables, equipment inventories, SAM.gov and state business registries. Follow one request down: Larkspur County, Virginia is asking to be reimbursed $86,400 for a communications plan from Tidewater Preparedness Partners.",
          a: function () { H.retro(); H.closeCopilot(); APP().nav("edi"); } },
        { t: "Scored before it pays", trail: 0, chip: "2 · Detect", n: "That request lands here, at the top of pre-payment review: risk 93, and the model recommends Hold. Every reimbursement request is scored before the state pays it, and 88% of them pass every check and go straight through. Hover over Hold to see why: the plan matches plans sold to 11 other jurisdictions, the price is 3.4 times what peers pay, and the vendor was formed 8 months before the award. Click Hold, and Payments held goes from $0 to $86,400 until the procurement file is checked.",
          a: function () { H.closeCopilot(); APP().setRole("analyst"); APP().setMode("prepay"); APP().nav("queue"); outlineRow(P.SEED); } },
        { t: "Pull the thread", trail: 1, chip: "2 · Detect", n: "That $86,400 request is the thread. This one is from Brandt County, Maryland, a year earlier, and it has already been paid. Put the two plans side by side: same text, same tables, same typo, and Larkspur County's copy still names Brandt County's radio channel as its own. Twelve jurisdictions in four states bought this plan, for $1.04M. Hold the next one before it pays, and recover these.",
          a: function () { H.retro(); H.closeCopilot(); APP().openAllegation(P.THREAD); H.tab("documents"); } },
        { t: "AI that does the legwork", trail: 2, chip: "3 · Case mgmt", n: "The analyst works the request, and the Investigative Assistant's three agents do the research: investigative, grant compliance and policy. Each returns findings with sources. The investigative agent has already gone past the plan: the three “competing” bidders share a registered agent, a phone, a deposit account and an officer. And a subcontractor is registered at the home of the county's grant coordinator.",
          a: function () { H.retro(); APP().openAllegation(P.THREAD); if (window.COPILOT) window.COPILOT.open("agents"); } },
        { t: "A documented decision", trail: 2, chip: "3 · Case mgmt", n: "Same network, a different scheme: Merrow County, North Carolina was reimbursed $212,600 for 48 radios. 31 of those serial numbers were already on Brandt County's inventory, sold by the same reseller a year earlier. The analyst disallows the cost and records a coded reason with an AI-drafted justification. The system suggests where it belongs: on the Tidewater case, because the reseller is paid into the same account as one of the bidders. A supervisor approves before any recovery starts, and every decision feeds back to retrain the models.",
          a: function () { H.retro(); H.closeCopilot(); var me = APP().ROLES[APP().state.role].name; APP().assignCase(P.DECISION, me); APP().startLeadReview(P.DECISION); APP().openAllegation(P.DECISION); H.tab("decision"); var seg = document.querySelector('.seg[data-d="c"]'); if (seg) seg.click(); } },
        { t: "The network, down to the invoice", trail: 2, chip: "4 · Networks", n: "Here's the whole thread on one screen. Our $86,400 invoice is in red. Five vendors that look unrelated, in four states, share one owner. Follow the lines down: each county pays more than one of them, and each purchase looks like an ordinary local contract. Hover over a county to see what it paid. 31 subrecipients, three grant programs, $6.3M.",
          a: function () { H.retro(); H.closeCopilot(); APP().state.networkScenario = "N01"; APP().nav("network"); window.scrollTo(0, 0); scrollUnderNav("#n-canvas"); } },
        { t: "Networks linked to networks", trail: 3, chip: "4 · Networks", n: "And Tidewater isn't working alone. This map shows every vendor network detected across 18 states: 9 of them. The red dashed lines are the same thing turning up in two networks. The one showing now: Coastline's radios come from the same serial-number batch as a reseller ring billing Ohio and Pennsylvania counties. Hover over Tidewater and a third lights up: its registered agent also fronts the “competing” bidders for an exercise-design ring in Michigan and Illinois. Three linked networks add up to $14.9M, and no single state could see any of it.",
          a: function () { H.retro(); H.closeCopilot(); APP().state.networkScenario = "all"; APP().nav("network"); var tok = H.tok(); setTimeout(function () { if (tok === H.tok()) H.showLink("N01", "N04"); }, 700); } },
        { t: "From $86K to $38M", trail: 4, chip: "5 · Impact", n: "Now back to the top of the page. Follow the numbers from that one $86,400 invoice: the same plan sold again comes to $1.04M, the vendor network to $6.3M, the networks linked to it to $14.9M, and the same patterns across all 9 networks to $38.2M. Nobody finds that by reviewing invoices one county at a time. One flag opens the network, analysts work 9 cases, and well-run subrecipients aren't slowed down.",
          a: function () { H.retro(); H.closeCopilot(); APP().state.networkScenario = "all"; APP().nav("network"); window.scrollTo(0, 0); setTimeout(function () { var f = document.getElementById("nv-funnel"); if (f) { f.style.outline = "2px solid #0f62fe"; f.style.outlineOffset = "2px"; } }, 400); } }
      ]
    };
  };
})();
