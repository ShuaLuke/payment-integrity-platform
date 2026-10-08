/* Treasury pack · the short guided tour — one held payment followed all the way
   out (8 steps): 1 Ingest → 2 Detect → 3 Case management → 4 Networks → 5 Impact.
   Picked up by assets/demo.js via window.UC_PACK.tour. `trail` is how far the
   $18,940 refund has been followed (shown in the ribbon in place of the step dots). */
(function () {
  var T = window.TREAS;
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
      trail: ["$18,940 refund", "Same mailbox · $505K", "Network · $7.4M", "Linked · $22.7M", "14 networks · $100.4M"],
      steps: [
        { t: "Every payment, checked one at a time", trail: 0, chip: "1 · Ingest", n: "Agencies certify payments and Treasury disburses them: more than a billion a year. Every one is now checked before it goes out, against Do Not Pay, account ownership and the taxpayer ID. Those checks look at one payment at a time. This screen joins what sits around them: every agency's payment files, Treasury's payment history, returns and reclamations, direct-deposit change logs, company registrations and flags from IRS. Follow one payment: an $18,940 tax refund to Marisol T. Avery.",
          a: function () { H.retro(); H.closeCopilot(); APP().nav("edi"); } },
        { t: "It passed every check", trail: 0, chip: "2 · Detect", n: "That refund lands here, in pre-payment review. The two payments above it failed a check: a payee who died in August, caught by Do Not Pay, and a vendor payment going to an account that isn't the vendor's. That's today's controls working. Ours is different: risk 92, the model recommends Hold, and it passed Do Not Pay, account ownership and the TIN check. What flags it is everything around it. Hover over Hold: the account was opened 19 days ago, one of 34 with neighboring numbers; the mailing address is a private mailbox shared with 29 other federal payees; and the W-2 comes from an employer formed last year. Click Hold, and Payments held goes from $0 to $18,940. 99.96% of payments never reach this screen.",
          a: function () { H.closeCopilot(); APP().setRole("analyst"); APP().setMode("prepay"); APP().nav("queue"); outlineRow(T.SEED); } },
        { t: "Pull the thread", trail: 1, chip: "2 · Detect", n: "That mailbox is the thread. This refund went to Lena M. Whitcomb two weeks ago, into an account from the same batch, and it has already been paid. Meanwhile the real Lena Whitcomb filed her own return from Ohio. Open the address: 46 federal payments in 13 months, to 30 different people, from three agencies: tax refunds from IRS, Social Security benefits and federal retirement annuities. Each agency saw an ordinary payee. Together, $505K through one box in a shipping store.",
          a: function () { H.retro(); H.closeCopilot(); APP().openAllegation(T.THREAD); H.tab("documents"); } },
        { t: "AI that does the legwork", trail: 2, chip: "3 · Case mgmt", n: "The analyst works the payment, and the Investigative Assistant's three agents do the research: investigative, payment verification and policy. Each returns findings with sources. The investigative agent has gone past the mailbox: the W-2s come from eight employers formed in the last year at that address, with one registered agent and no real payroll. The accounts sit in batches at three online banks, each opened in a payee's name, which is why the ownership check passes. And the policy agent notes that IRS shares a flag on the return, not the return itself.",
          a: function () { H.retro(); APP().openAllegation(T.THREAD); if (window.COPILOT) window.COPILOT.open("agents"); } },
        { t: "A documented decision", trail: 2, chip: "3 · Case mgmt", n: "Same network, a different agency. Gloria A. Pruitt's Social Security benefit went to her credit union for 19 years. In May, a phone call changed her direct deposit to a Lumen Direct account opened days earlier, and her mailing address to the same mailbox. Four payments went there before she reported them missing. The analyst records Reclaim, with a coded reason and an AI-drafted justification, and the system suggests the Delmont case: same account batches, same mailbox, and a phone that made 36 other changes. A supervisor approves before the reclamation goes to the bank, and every decision feeds back to retrain the models.",
          a: function () { H.retro(); H.closeCopilot(); var me = APP().ROLES[APP().state.role].name; APP().assignCase(T.DECISION, me); APP().startLeadReview(T.DECISION); APP().openAllegation(T.DECISION); H.tab("decision"); var seg = document.querySelector('.seg[data-d="c"]'); if (seg) seg.click(); } },
        { t: "The network, down to the payment", trail: 2, chip: "4 · Networks", n: "Here's the whole thread on one screen. Our $18,940 refund is in red. At the top is the organizer, an unregistered preparer. Below it are six of the nine account batches at three online banks, then the payments, and at the bottom the agencies that certified them. Hover over an agency: each one sent ordinary payments to payees who passed every check. 386 payees, three agencies, $7.4M.",
          a: function () { H.retro(); H.closeCopilot(); APP().state.networkScenario = "N01"; APP().nav("network"); window.scrollTo(0, 0); scrollUnderNav("#n-canvas"); } },
        { t: "Networks linked to networks", trail: 3, chip: "4 · Networks", n: "And Delmont isn't working alone. This map shows every payment network found over 13 months: 14 of them. The red dashed lines are the same thing turning up in two networks. The one showing: Delmont's Brightpath account batch runs straight on into accounts collecting refunds for a Florida mailbox ring, opened the same week. Hover over Delmont and a third lights up: the phone that changed Gloria Pruitt's deposit also redirected 120 annuity and benefit payments for a Gulf Coast ring. Three linked networks, $22.7M, and no single agency could see any of it.",
          a: function () { H.retro(); H.closeCopilot(); APP().state.networkScenario = "all"; APP().nav("network"); var tok = H.tok(); setTimeout(function () { if (tok === H.tok()) H.showLink("N01", "N04"); }, 700); } },
        { t: "From $18,940 to $100M", trail: 4, chip: "5 · Impact", n: "Now back to the top of the page. Follow the numbers from that one $18,940 refund: the mailbox comes to $505K, its network to $7.4M, the networks linked to it to $22.7M, and the same patterns across all 14 networks to $100.4M. Nobody finds that by checking payments one at a time, even when every payment is checked. One flag opens the network, analysts work 14 cases, and the other 99.96% of payments go out on schedule.",
          a: function () { H.retro(); H.closeCopilot(); APP().state.networkScenario = "all"; APP().nav("network"); window.scrollTo(0, 0); setTimeout(function () { var f = document.getElementById("nv-funnel"); if (f) { f.style.outline = "2px solid #0f62fe"; f.style.outlineOffset = "2px"; } }, 400); } }
      ]
    };
  };
})();
