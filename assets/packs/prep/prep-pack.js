/* Preparedness Grants pack — switches the shared shell into FEMA preparedness
   grants followed below the state: reimbursement requests from subrecipients
   (counties, cities, urban areas) and the vendors they pay. It:
     · registers the reimbursement requests as leads (so the shared decision,
       supervisor-approval and audit flow work unchanged),
     · swaps the navigation down to the screens this pack provides,
     · swaps the decision reason codes, the assistant's content and the wording.
   The pack's views (assets/packs/prep/views/*) replace the shared ones by name.
   Requires window.PREP (prep-data.js). */
(function () {
  var P = window.PREP, APP = window.APP, DP = window.DP, AI = window.AI;
  window.UC = "prep";
  window.UC_PACK = window.UC_PACK || {};
  window.UC_PACK.id = "prep";
  window.UC_PACK.label = "Preparedness Grants";
  window.UC_PACK.shortOnly = true;
  window.UC_PACK.vocab = { lead: "reimbursement request", claim: "request", greet: function (a) { return "I'm focused on reimbursement request #" + a.id + " — " + a.subrecipient.name + ", " + a.fwaType.toLowerCase() + "."; } };
  var isPrep = function (id) { return /^RR-\d+$/.test(String(id || "")); };
  var usd = function (n) { return DP.usd(n); };

  document.title = "IBM Payment Integrity · Preparedness Grants";
  DP.disclaimer = "Synthetic data — for demonstration only. Fictional counties, urban areas, vendors, people, award numbers and accounts.";

  // ---- leads ----
  P.LEADS.forEach(function (l) { DP.raw.allegations.push(l); });
  var baseGet = DP.getAllegation.bind(DP);
  function enrich(l) {
    if (!l) return null;
    return Object.assign(l, {
      provider: { id: l.id, name: l.subrecipient.name, state: l.state, npi: "", tin: "" },
      claim: null, veteran: null, subjectType: "Provider", model: null, rules: [],
      registrant: l.subrecipient.name
    });
  }
  DP.getAllegation = function (id) {
    if (isPrep(id)) return enrich(P.lead(id));
    if (id === "20481" || id == null) return enrich(P.lead(P.SEED)); // the assistant's default subject
    return baseGet(id);
  };
  P.get = function (id) { return enrich(P.lead(id)); };

  // ---- navigation: only the screens this pack provides ----
  APP.SUBS = {
    home: [],
    casework: [{ v: "queue", l: "Reimbursements", role: "analyst" }, { v: "approvals", l: "Approvals", role: "supervisor" }],
    insights: [{ v: "edi", l: "Money flow" }, { v: "network", l: "Networks" }],
    library: []
  };
  APP.VIEW_AREA = { home: "home", queue: "casework", claim: "casework", approvals: "casework", edi: "insights", network: "insights" };
  var baseLabel = APP.labelForSnap;
  APP.labelForSnap = function (s) {
    if (!s) return "Reimbursements";
    if (s.view === "claim") return "Request " + s.allegationId;
    var map = { queue: "Reimbursements", home: "Home", approvals: "Approvals", edi: "Money flow", network: "Networks" };
    return map[s.view] || baseLabel(s);
  };
  APP.backLabel = function () { return APP.state.hist && APP.state.hist.length ? APP.labelForSnap(APP.state.hist[APP.state.hist.length - 1]) : "Reimbursements"; };
  APP.togglePortal = function () {};
  APP.pendingCaseReviews = function () { return []; };

  // ---- decisions: grant reason codes (2 CFR 200 cost principles) ----
  APP.REASONS = {
    confirm: [
      { c: "DEL-01", t: "Deliverable not original — duplicates work sold to other jurisdictions" },
      { c: "PRC-01", t: "Procurement not competitive — related or shell bidders (2 CFR 200.319)" },
      { c: "COI-01", t: "Undisclosed conflict of interest (2 CFR 200.318(c))" },
      { c: "EQP-01", t: "Equipment not received or already billed (2 CFR 200.313)" },
      { c: "PAY-02", t: "Personnel cost not supported — time charged to more than 100% (2 CFR 200.430)" },
      { c: "RSN-01", t: "Cost not reasonable — price far above the market (2 CFR 200.404)" },
      { c: "EXC-01", t: "Paid an excluded party (2 CFR 180)" }
    ],
    dismiss: [
      { c: "VER-01", t: "Deliverable, price and procurement verified" },
      { c: "VER-02", t: "Shared text is a federal template (HSEEP, CPG 101)" },
      { c: "VER-03", t: "Related bidders disclosed and approved by the state" },
      { c: "VER-04", t: "Data error in the flag itself" }
    ],
    escalate: [
      { c: "REF-01", t: "Organized scheme — refer to DHS OIG" },
      { c: "REF-02", t: "Pattern spans several states or grant programs" },
      { c: "REF-03", t: "Possible kickback to a local official — refer to DHS OIG" }
    ],
    pay: [
      { c: "PAY-01", t: "Verified — deliverable, price and procurement support the request" },
      { c: "PAY-03", t: "Flag reviewed and cleared" }
    ],
    hold: [
      { c: "HLD-01", t: "Request the procurement file and all bids from the state" },
      { c: "HLD-02", t: "Request proof of delivery and equipment inventory" },
      { c: "HLD-03", t: "Request timesheets for the charged positions" },
      { c: "HLD-04", t: "Request conflict-of-interest disclosures" }
    ],
    deny: [
      { c: "EXC-01", t: "Paid an excluded party (2 CFR 180)" },
      { c: "ALW-01", t: "Cost not allowable under the grant" },
      { c: "PAY-02", t: "Personnel cost not supported" }
    ]
  };
  var DEFAULT_REASON = { "Copy-paste deliverable": "DEL-01", "Shell bidders": "PRC-01", "Undisclosed conflict": "COI-01", "Double-billed equipment": "EQP-01", "Payroll overcharge": "PAY-02", "Excluded vendor": "EXC-01" };
  P.defaultReason = function (l, outcome) {
    if (outcome === "dismiss") return l.fwaType === "Shared template" ? "VER-02" : "VER-01";
    if (outcome === "escalate") return "REF-01";
    if (outcome === "hold") return l.fwaType === "Payroll overcharge" ? "HLD-03" : l.fwaType === "Double-billed equipment" ? "HLD-02" : "HLD-01";
    if (outcome === "deny") return l.fwaType === "Excluded vendor" ? "EXC-01" : "ALW-01";
    return DEFAULT_REASON[l.fwaType] || "RSN-01";
  };

  // pre-payment Pay / Hold / Deny on a reimbursement request
  var basePrepay = APP.prepayDecide;
  APP.prepayDecide = function (id, action, reason, justification) {
    if (!isPrep(id)) return basePrepay(id, action, reason, justification);
    var l = P.lead(id); if (!l) return;
    l.status = { pay: "Approved to pay", hold: "Held — documentation", deny: "Denied" }[action];
    APP.state.prepayDecisions[id] = { action: action, reason: reason || P.defaultReason(l, action), justification: justification || "", ts: new Date(), atRisk: l.amount };
    APP.auditLog("PREPAY_" + action.toUpperCase(), "Request " + id + " · " + { pay: "approved for reimbursement", hold: "held pending documentation — not reimbursed", deny: "denied — payment prevented" }[action] + " · " + usd(l.amount));
  };

  // ---- the Investigative Assistant's grant content ----
  var N01 = function () { return P.net("N01"); };
  function inRing(a) { return a.network === "N01"; }
  var baseSummary = AI.adjudicationSummary, baseAgents = AI.agentReports, baseCopilot = AI.copilot, baseLetter = AI.correspondence, baseKb = AI.knowledgeBase;
  var REC_LABEL = { hold: "Hold — request documentation", deny: "Deny", pay: "Pay", confirm: "Disallow · recover", dismiss: "Clear — cost supported", escalate: "Escalate" };
  function recRationale(a) {
    if (a.id === P.SEED) return "Three independent sources say this plan isn't what Larkspur County paid for: the same text was sold to 11 other jurisdictions, the price is 3.4× what peers pay, and the three “competing” bids came from vendors that share a registered agent, a phone and a bank account. Holding the reimbursement costs a legitimate vendor a few weeks; paying it costs $86,400 that is slow to recover. If the procurement file checks out, the payment releases.";
    if (a.id === P.THREAD) return "Already reimbursed, and the same plan as RR-58214 a year earlier in another state. Disallow the cost, recover it through the Maryland state agency, and attach it to the Tidewater case.";
    if (a.id === P.DECISION) return "31 of the 48 radios on this invoice were already billed to Brandt County a year earlier, and the reseller is paid into the network's account. Disallow the cost as unsupported equipment and place it on the Tidewater case.";
    if (a.recommendedAction === "pay") return "Deliverable, price and procurement check out against independent sources. Reimburse now: the fast lane keeps well-run subrecipients from waiting on controls aimed at fraud.";
    if (a.recommendedAction === "dismiss") return "The match is the standard federal after-action template, which jurisdictions are supposed to use. The findings and improvement plan are Wexley County's own. Clear it; the decision feeds back so the model learns federal templates.";
    if (a.recommendedAction === "deny") return "The request fails a hard eligibility check. Deny with the coded reason; the subrecipient can appeal through the state.";
    if (a.fwaType === "Payroll overcharge") return a.mode === "prepay" ? "One person's time is charged to more than 100% across two grants. Hold and ask for timesheets; if they don't support the split, disallow the excess." : "Two salaries were charged in full to two grants for the same period. Disallow the duplicate share and recover it through the state.";
    if (a.fwaType === "Shell bidders") return "The winning bidder beat two vendors it shares a registered agent and phone with, so the competition wasn't real. Hold and ask the state for the procurement file and price analysis.";
    if (a.fwaType === "Undisclosed conflict") return "The official who approved these invoices has an undisclosed tie to the subcontractor. Disallow the cost and refer the conflict to DHS OIG; place it on the Tidewater case.";
    if (a.fwaType === "Copy-paste deliverable") return "The deliverable duplicates work another county already paid for, from a related vendor. Disallow the cost and place it on the Tidewater case.";
    return "The evidence points to an unsupported cost but should be verified before a final decision.";
  }
  AI.adjudicationSummary = function (a) {
    if (!a || a.uc !== "prep") return baseSummary(a);
    var ring = inRing(a);
    return {
      headline: "Reimbursement request #" + a.id,
      recommendation: { action: a.recommendedAction, label: REC_LABEL[a.recommendedAction] || a.recommendedAction, rationale: recRationale(a) },
      anomaly: a.id === P.SEED ? "An $86,400 communications plan, priced at 3.4× the peer median, from a vendor formed 8 months before the award." : a.reason + ".",
      evidence: (a.signals || []).map(function (s) { return { label: s.label, detail: s.detail, outlier: s.sev === "high" }; }),
      network: ring ? "Part of the Tidewater network: 5 vendors in VA, MD, NC and DE, " + N01().subs + " subrecipients, " + bigUsd(N01().atRisk) + ", tied together by a registered agent, a phone, a deposit account and one officer." : (a.network ? "Part of " + P.net(a.network).name + " (" + P.SCHEMES[P.net(a.network).scheme].label.toLowerCase() + ")." : "No network — an isolated request."),
      isRing: !!a.network,
      precedents: ring ? { text: "Maryland's state agency disallowed two Tidewater invoices last quarter after reviewing the procurement files; neither was reinstated.", cases: [{ id: "RR-56711", outcome: "Disallowed" }, { id: "RR-56745", outcome: "Disallowed" }] }
        : { text: "Similar requests were resolved on the evidence shown.", cases: [] }
    };
  };
  AI.agentReports = function (a) {
    if (!a || a.uc !== "prep") return baseAgents(a);
    if (inRing(a)) return [
      { role: "Investigative", focus: "entity · network · open source", icon: "user-search", findings: [
        { sev: "high", text: "Tidewater Preparedness Partners, Chesapeake Readiness Group and Seaboard Continuity Advisors use the same registered agent (Atlantic Registered Agents, Virginia Beach). R. A. Kessling is an officer of two of them." },
        { sev: "high", text: "Phone (757) 555-0139 is listed by Tidewater and Chesapeake, and deposit account ••4471 receives payments for Seaboard and Coastline Comm Supply. On paper they are competitors; in the data they are one business." },
        { sev: "high", text: "The same communications plan was paid for by 12 jurisdictions in four states. Coastline's radio serial numbers also turn up in a Pennsylvania and Ohio reseller ring." },
        { sev: "medium", text: "DH Readiness Solutions LLC, a Tidewater subcontractor, is registered at the home of Larkspur County's grant coordinator, who approved the invoices." }
      ], sources: ["State business registries", "SAM.gov", "Bank account verification", "Subaward ledgers", "County property records"] },
      a.deliverable === P.SAME_PLAN.name ? { role: "Grant compliance", focus: "deliverable · price · procurement · equipment", icon: "file-certificate", findings: [
        { sev: "high", text: "The deliverable isn't original: 94% of the text matches plans sold to 11 other subrecipients, including another county's radio channel." },
        { sev: "high", text: "The price isn't reasonable: " + usd(a.amount) + " against a " + usd(P.PEER_MEDIAN) + " median across 212 county communications plans." },
        { sev: "high", text: "The competition wasn't real: all three quotes came from related vendors. The procurement file has no cost or price analysis." },
        { sev: "low", text: "The vendor's SAM.gov registration is active and the cost category (planning) is allowable under the grant." }
      ], sources: ["Document fingerprint", "Peer pricing", "Procurement file", "Grant budget"] }
      : { role: "Grant compliance", focus: "deliverable · price · procurement · equipment", icon: "file-certificate", findings: (a.signals || []).map(function (s) { return { sev: s.sev === "med" ? "medium" : s.sev, text: s.label + ". " + s.detail }; }), sources: (a.signals || []).map(function (s) { return s.src; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; }) },
      { role: "Policy", focus: "2 CFR 200 · grant terms · recovery", icon: "scale", findings: [
        { sev: "high", text: "Procurements must be competitive, and related bidders defeat that (2 CFR 200.319). Employees with a financial interest in a vendor can't take part in selecting it (2 CFR 200.318(c))." },
        { sev: "medium", text: "Costs must be reasonable and allowable (2 CFR 200.403–404). Unsupported costs are disallowed and recovered through the state as pass-through entity (2 CFR 200.339, 200.346)." },
        { sev: "medium", text: "Theft from a program receiving federal funds is a federal crime (18 U.S.C. § 666); false invoices can also bring False Claims Act liability." },
        { sev: "low", text: "Holding the reimbursement and requesting the procurement file fits the state's monitoring duty (2 CFR 200.332)." }
      ], sources: ["2 CFR Part 200", "2 CFR Part 180", "18 U.S.C. § 666", "Preparedness Grants Manual"] }
    ];
    var sig = a.signals || [];
    return [
      { role: "Investigative", focus: "entity · network · open source", icon: "user-search", findings: [{ sev: a.network ? "high" : "low", text: a.network ? "Linked to " + P.net(a.network).name + " (" + P.SCHEMES[P.net(a.network).scheme].label.toLowerCase() + ")." : "No shared agents, officers, phones, accounts or deliverables with other vendors." }], sources: ["State business registries", "SAM.gov", "Bank account verification"] },
      { role: "Grant compliance", focus: "deliverable · price · procurement · equipment", icon: "file-certificate", findings: sig.map(function (s) { return { sev: s.sev === "med" ? "medium" : s.sev, text: s.label + ". " + s.detail }; }), sources: sig.map(function (s) { return s.src; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; }) },
      { role: "Policy", focus: "2 CFR 200 · grant terms · recovery", icon: "scale", findings: [{ sev: "low", text: recRationale(a) }], sources: ["2 CFR Part 200", "Preparedness Grants Manual"] }
    ];
  };
  // peer comparison by what was bought
  function peerText(a) {
    if (a.deliverable === P.SAME_PLAN.name) return "Compared with 212 county communications plans paid for in FY2022–25: the median is " + usd(P.PEER_MEDIAN) + " and 90% cost under $48,000. " + a.id + " is " + usd(a.amount) + ". Every plan above $80,000 came from one of the three related vendors in the Tidewater network.";
    if (/radio/i.test(a.deliverable)) return "Compared with 640 portable-radio purchases: the median price is $4,180 a radio. " + a.id + " works out to $4,430 a radio, close to the market. The problem isn't the price: 31 of the serial numbers were already billed to another county.";
    if (a.budgetLine === "Personnel") return "Compared with peer emergency management offices: staff are charged 100% or less across all grants in 97% of quarters. Here one person is charged " + (a.sub === "C7" ? "160%" : "200%") + " of their time across two grants for the same period.";
    if (/exercise/i.test(a.deliverable)) return "Compared with 188 county tabletop exercises: the median is $30,900. " + a.id + " is " + usd(a.amount) + ", 2.1× the median, and the two losing bids came from vendors related to the winner.";
    if (/continuity/i.test(a.deliverable)) return "Compared with 164 county continuity plans: the median is $31,200. " + a.id + " is " + usd(a.amount) + ", and its text matches a plan sold to another county by a related vendor.";
    if (/plan maintenance|exercise support/i.test(a.deliverable)) return "Plan maintenance and exercise support subcontracts in peer counties run a median of $14,500 a year. This one is " + usd(a.amount) + ", paid to a company registered at the home of the official who approved it.";
    if (a.recommendedAction === "pay" || a.recommendedAction === "dismiss") return a.id + " is in line with peers: " + a.reason.toLowerCase() + ".";
    return a.id + " is " + usd(a.amount) + ". " + a.reason + ".";
  }
  AI.copilot = function (a, q) {
    if (!a || a.uc !== "prep") return baseCopilot(a, q);
    q = (q || "").toLowerCase();
    var v = a.vendorRec, n = a.network ? P.net(a.network) : null;
    if (/peer|compare|typical|normal|price|median|cost/.test(q)) return peerText(a);
    if (/rationale|justif|draft/.test(q)) return "Draft rationale: Request " + a.id + " (" + a.subrecipient.name + ", " + a.state + ") seeks reimbursement of " + usd(a.amount) + " for " + a.deliverable + ". " + (a.signals || []).filter(function (s) { return s.sev === "high"; }).map(function (s) { return s.detail; }).join(" ") + " On this evidence the cost is " + (a.recommendedAction === "pay" || a.recommendedAction === "dismiss" ? "supported." : "not supported as submitted.");
    if (/recommend|action|should|decide|next/.test(q)) return "Recommended: " + (REC_LABEL[a.recommendedAction] || a.recommendedAction) + ". " + recRationale(a);
    if (/own|who|vendor|bidder|agent|officer|compan/.test(q)) return v ? v.name + " (" + v.city + ", " + v.state + ", formed " + v.formed + ", UEI " + v.uei + "). " + (a.network === "N01" ? "It is one of five vendors that share registered agent Atlantic Registered Agents; R. A. Kessling is an officer of two of them, phone " + P.OPERATOR.phone + " is listed by two, and deposit account " + P.OPERATOR.acct + " receives payments for two." : "") : "This cost is paid to " + a.payee + ", not an outside vendor.";
    if (/network|link|related|connect|other/.test(q)) return n ? n.name + ": " + P.SCHEMES[n.scheme].label.toLowerCase() + ", " + n.subs + " subrecipients in " + n.states.join(", ") + ", " + P.bigUsd(n.atRisk) + " at risk across " + n.programs.join(", ") + ". Open Insights › Networks to see it down to the invoice." : "No links found: this request shares no agent, officer, phone, account or deliverable with other vendors.";
    if (/recover|refer|oig|letter|notice/.test(q)) return a.mode === "prepay" ? "Nothing to recover yet: the request hasn't been paid. Hold it and send the state agency a request for procurement documentation (Correspondence tab)." : "Recovery runs through the state agency as pass-through entity (2 CFR 200.346): disallow the cost, then send the Notice of recovery from the Correspondence tab." + (a.network ? " Because it's part of a network, an OIG referral memo is drafted there too." : "");
    if (/rule|policy|cfr|law|regulation|allow/.test(q)) return "The rules that apply here: competition (2 CFR 200.319), conflicts of interest (200.318(c)), equipment records (200.313), reasonable and allowable costs (200.403–404), personnel time (200.430) and excluded parties (2 CFR 180). The Policy agent lists which ones this request touches.";
    return a.id + " · " + a.subrecipient.name + " · " + usd(a.amount) + " · risk " + a.riskScore + ". " + a.reason + ". " + recRationale(a);
  };
  AI.CORRESPONDENCE_TYPES = [
    { id: "verify", label: "Request for procurement documentation", icon: "file-text", blurb: "Ask the state agency for the bids, the price analysis and the conflict disclosures." },
    { id: "ineligible", label: "Cost disallowance", icon: "gavel", blurb: "Disallow the cost, with the state's appeal rights." },
    { id: "debt", label: "Notice of recovery", icon: "receipt-refund", blurb: "Recover the reimbursed amount through the state." },
    { id: "referral", label: "OIG referral memo", icon: "shield-search", blurb: "Refer the vendor network to DHS OIG." }
  ];
  AI.correspondence = function (a, type) {
    if (!a || a.uc !== "prep") return baseLetter(a, type);
    var meta = AI.CORRESPONDENCE_TYPES.filter(function (t) { return t.id === type; })[0] || AI.CORRESPONDENCE_TYPES[0];
    var st = P.STATES[a.state];
    var ref = "Request " + a.id + " · " + a.award.program + " " + a.award.fy + " · award " + a.award.no;
    var L = ["Grant Programs Directorate · Program Integrity", "Date: " + APP.fmtTs(new Date()), "", "To:   State Administrative Agency", "      " + st.saa, "", "Re:   " + meta.label + " — " + ref, ""];
    var b = [];
    if (type === "verify") b.push("We are reviewing a reimbursement request from your subrecipient, " + a.subrecipient.name + ", for " + a.deliverable + " (" + usd(a.amount) + ") paid to " + a.payee + ".", "", "Before the cost is reimbursed, please send within 30 days: every bid or quote received, the cost or price analysis, the selection record, the deliverable as accepted, and the conflict-of-interest disclosures of the staff who selected the vendor.", "", "As pass-through entity, your agency is responsible for monitoring this subaward (2 CFR 200.332).");
    else if (type === "ineligible") b.push("After review, the cost of " + usd(a.amount) + " for " + a.deliverable + " is disallowed. Reason: " + APP.reasonLabel("confirm", P.defaultReason(a, "confirm")) + ".", "", "Your agency may appeal within 60 days with documentation that the cost is allowable, reasonable and properly procured.");
    else if (type === "debt") b.push("The reimbursed amount of " + usd(a.amount) + " under award " + a.award.no + " is a debt owed to the federal government (2 CFR 200.346). Please recover it from the subrecipient or repay it from non-federal funds, or dispute it with supporting documents within 30 days.");
    else b.push("Referral to DHS OIG: a vendor network billing preparedness subawards in Virginia, Maryland, North Carolina and Delaware.", "", "Five vendors that bid against each other share a registered agent, a phone, a deposit account (••4471) and an officer. One communications plan was sold to 12 jurisdictions; radios were billed twice; a subcontractor is registered at a county grant coordinator's home. " + N01().subs + " subrecipients, three grant programs, " + bigUsd(N01().atRisk) + ". Requested: bank records for account ••4471 and the vendors' payments to the subcontractor. Request " + a.id + " is one of them.");
    b.forEach(function (x) { L.push(x); });
    L.push("", "Sincerely,", ((APP.ROLES[APP.state.role] || {}).name || "Dana Whitmore") + ", Program Integrity Analyst", "IBM Payment Integrity", "", "Drafted by the agentic assist and subject to reviewer adoption.", "Synthetic data — for demonstration only. Not a real jurisdiction, vendor or award.");
    return { type: type, label: meta.label, ref: ref, body: L.join("\n") };
  };
  AI.knowledgeBase = function () {
    if (window.UC !== "prep") return baseKb();
    return [
      { title: "Procurement standards — competition", cite: "2 CFR 200.319", summary: "Procurements must give full and open competition; related or arranged bids defeat it." },
      { title: "Conflicts of interest", cite: "2 CFR 200.318(c)", summary: "No employee with a financial interest in a vendor may take part in selecting it." },
      { title: "Equipment", cite: "2 CFR 200.313", summary: "Records with serial numbers, and a physical inventory at least every two years." },
      { title: "Reasonable and allowable costs", cite: "2 CFR 200.403–404", summary: "Costs must be necessary, reasonable and allocable to the award." },
      { title: "Compensation — personal services", cite: "2 CFR 200.430", summary: "Salaries must be supported by records of the time actually worked on the award." },
      { title: "Subrecipient monitoring", cite: "2 CFR 200.332", summary: "The pass-through entity (the state) monitors each subrecipient and follows up on findings." },
      { title: "Suspension and debarment", cite: "2 CFR Part 180", summary: "Federal funds can't pay an excluded party." },
      { title: "Theft concerning programs receiving federal funds", cite: "18 U.S.C. § 666", summary: "Embezzling or obtaining by fraud $5,000 or more from a federally funded program is a federal crime." },
      { title: "Preparedness Grants Manual", cite: "FEMA", summary: "Program rules for HSGP and EMPG, including allowable costs and monitoring." }
    ];
  };

  function bigUsd(n) { var t = function (x) { return String(x < 10 ? Math.round(x * 100) / 100 : Math.round(x * 10) / 10); }; return n >= 1e6 ? "$" + t(n / 1e6) + "M" : usd(n); }
  P.bigUsd = bigUsd;

  // ---- chrome: wording and controls ----
  function chrome() {
    document.querySelectorAll('.navitem[data-area="library"]').forEach(function (n) { n.style.display = "none"; });
    var gs = document.getElementById("gsearch"); if (gs) gs.style.display = "none";
    var lbl = { prepay: '<i class="ti ti-clock-play"></i> Pre-payment', retrospective: '<i class="ti ti-history"></i> Post-payment' };
    document.querySelectorAll(".modebtn").forEach(function (b) { var m = b.getAttribute("data-mode"); if (lbl[m]) b.innerHTML = lbl[m]; });
    var mt = document.getElementById("mode-toggle"); if (mt) mt.title = "Pre-payment = score reimbursement requests before they pay · Post-payment = review what's been reimbursed";
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", chrome); else chrome();
})();
