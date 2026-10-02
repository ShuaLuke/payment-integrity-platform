/* Disaster-relief pack — switches the shared shell into the FEMA IHP use case.
   Loaded after the core scripts and before boot. It:
     · registers the FEMA registrations as leads (so the shared decision,
       supervisor-approval and audit flow work unchanged),
     · swaps the navigation down to the screens this pack provides,
     · swaps the decision reason codes, the assistant's content and the wording.
   The pack's views (assets/fema/views/*) replace the healthcare ones by name.
   To merge into a multi-program build later, load this folder only when the
   Disaster Relief program is chosen. Requires window.FEMA (fema-data.js). */
(function () {
  var F = window.FEMA, APP = window.APP, DP = window.DP, AI = window.AI;
  window.UC = "fema";
  window.UC_PACK = window.UC_PACK || {};
  window.UC_PACK.id = "fema";
  window.UC_PACK.label = "Disaster Relief";
  window.UC_PACK.shortOnly = true;
  window.UC_PACK.vocab = { lead: "registration", claim: "registration", greet: function (a) { return "I'm focused on registration #" + a.id + " — " + a.registrant + ", " + a.fwaType.toLowerCase() + "."; } };
  var isFema = function (id) { return /^[RM]-\d+$/.test(String(id || "")); };
  var esc = function (s) { return APP.esc(s); };
  var usd = function (n) { return DP.usd(n); };

  document.title = "IBM Payment Integrity · Disaster Relief";
  DP.disclaimer = "Synthetic data — for demonstration only. Fictional disaster, declaration numbers, people, addresses and accounts.";

  // ---- leads ----
  F.LEADS.forEach(function (l) { DP.raw.allegations.push(l); });
  var baseGet = DP.getAllegation.bind(DP);
  function enrich(l) {
    if (!l) return null;
    var st = l.store ? F.store(l.store) : null;
    return Object.assign(l, {
      provider: { id: l.id, name: l.registrant, state: l.state, npi: "", tin: "" },
      claim: null, veteran: null, subjectType: "Beneficiary", model: null, rules: [],
      storefront: st, decl: F.DECLS[l.dr]
    });
  }
  DP.getAllegation = function (id) {
    if (isFema(id)) return enrich(F.lead(id));
    if (id === "20481" || id == null) return enrich(F.lead(F.SEED)); // the assistant's default subject
    return baseGet(id);
  };
  F.get = function (id) { return enrich(F.lead(id)); };

  // ---- navigation: only the screens this pack provides ----
  APP.SUBS = {
    home: [],
    casework: [{ v: "queue", l: "Registrations", role: "analyst" }, { v: "approvals", l: "Approvals", role: "supervisor" }],
    insights: [{ v: "edi", l: "Intake" }, { v: "network", l: "Networks" }],
    library: []
  };
  APP.VIEW_AREA = { home: "home", queue: "casework", claim: "casework", approvals: "casework", edi: "insights", network: "insights" };
  var baseLabel = APP.labelForSnap;
  APP.labelForSnap = function (s) {
    if (!s) return "Registrations";
    if (s.view === "claim") return "Registration " + s.allegationId;
    var map = { queue: "Registrations", home: "Home", approvals: "Approvals", edi: "Intake", network: "Networks" };
    return map[s.view] || baseLabel(s);
  };
  APP.backLabel = function () { return APP.state.hist && APP.state.hist.length ? APP.labelForSnap(APP.state.hist[APP.state.hist.length - 1]) : "Registrations"; };
  APP.togglePortal = function () {}; // the provider portal belongs to the healthcare pack
  APP.pendingCaseReviews = function () { return []; }; // healthcare case reviews aren't part of this pack

  // ---- decisions: FEMA reason codes ----
  APP.REASONS = {
    confirm: [
      { c: "OCC-01", t: "Occupancy not verified — the registrant did not live at the damaged dwelling" },
      { c: "OWN-01", t: "Ownership not verified" },
      { c: "DOC-01", t: "False or altered documentation (lease, landlord letter, utility bill)" },
      { c: "IDV-01", t: "Identity not verified or belongs to another person" },
      { c: "DOB-01", t: "Duplication of benefits — insurance, SBA or other assistance" },
      { c: "DUP-01", t: "Duplicate registration from the same household" },
      { c: "GEO-01", t: "Damaged dwelling outside the declared area or does not exist" },
      { c: "PRI-01", t: "Not the primary residence" }
    ],
    dismiss: [
      { c: "VER-01", t: "Identity and occupancy verified" },
      { c: "VER-02", t: "Separate households at a shared address (multi-unit)" },
      { c: "VER-03", t: "Insurance settlement does not cover the awarded category" },
      { c: "VER-04", t: "Data error in the flag itself" }
    ],
    escalate: [
      { c: "REF-01", t: "Organized scheme — refer to DHS OIG" },
      { c: "REF-02", t: "Pattern spans several registrations or declarations" },
      { c: "REF-03", t: "Registrant may be a victim of identity theft" }
    ],
    pay: [
      { c: "PAY-01", t: "Verified — identity, occupancy and damage support the award" },
      { c: "PAY-02", t: "Flag reviewed and cleared" }
    ],
    hold: [
      { c: "HLD-01", t: "Verify occupancy — request utility bill or landlord contact" },
      { c: "HLD-02", t: "Verify ownership" },
      { c: "HLD-03", t: "Awaiting insurance settlement (duplication of benefits)" },
      { c: "HLD-04", t: "Verify identity" }
    ],
    deny: [
      { c: "IDV-01", t: "Identity not verified or belongs to another person" },
      { c: "GEO-01", t: "Damaged dwelling outside the declared area or does not exist" },
      { c: "DUP-01", t: "Duplicate registration from the same household" },
      { c: "DOC-01", t: "False or altered documentation" }
    ]
  };
  var DEFAULT_REASON = { "Facilitator ring": "OCC-01", "Identity": "IDV-01", "Address farm": "OCC-01", "Out-of-area address": "GEO-01", "Duplication of benefits": "DOB-01", "Duplicate household": "DUP-01", "Not primary residence": "PRI-01" };
  F.defaultReason = function (l, outcome) {
    if (outcome === "dismiss") return l.fwaType === "Duplicate household" ? "VER-02" : "VER-01";
    if (outcome === "escalate") return "REF-01";
    if (outcome === "hold") return l.fwaType === "Duplication of benefits" ? "HLD-03" : l.fwaType === "Identity" ? "HLD-04" : "HLD-01";
    if (outcome === "deny") return l.fwaType === "Identity" ? "IDV-01" : l.fwaType === "Out-of-area address" ? "GEO-01" : "DUP-01";
    return l.id === F.DECISION ? "DOC-01" : DEFAULT_REASON[l.fwaType] || "OCC-01";
  };

  // pre-payment Pay / Hold / Deny on a registration
  var basePrepay = APP.prepayDecide;
  APP.prepayDecide = function (id, action, reason, justification) {
    if (!isFema(id)) return basePrepay(id, action, reason, justification);
    var l = F.lead(id); if (!l) return;
    l.status = { pay: "Approved to pay", hold: "Held — verify", deny: "Denied" }[action];
    APP.state.prepayDecisions[id] = { action: action, reason: reason || F.defaultReason(l, action), justification: justification || "", ts: new Date(), atRisk: l.amount };
    APP.auditLog("PREPAY_" + action.toUpperCase(), "Registration " + id + " · " + { pay: "approved to pay", hold: "held pending verification — payment not released", deny: "denied — payment prevented" }[action] + " · " + usd(l.amount));
  };

  // ---- the Investigative Assistant's FEMA content ----
  var N01 = function () { return F.net("N01"); };
  function inRing(a) { return a.network === "N01"; }
  var baseSummary = AI.adjudicationSummary, baseAgents = AI.agentReports, baseCopilot = AI.copilot, baseLetter = AI.correspondence, baseKb = AI.knowledgeBase, baseTypes = AI.CORRESPONDENCE_TYPES;
  var REC_LABEL = { hold: "Hold — verify before paying", deny: "Deny", pay: "Pay", confirm: "Confirm ineligible", dismiss: "Clear — survivor verified", escalate: "Escalate" };
  function recRationale(a) {
    if (a.id === F.SEED) return "Three independent sources say the registrant didn't live at 418 Cypress Bend Rd: its owners registered as living there, the landlord on the lease owns none of the 61 addresses it leases, and the lease is a template shared by 214 registrations. A hold costs a genuine renter a few days; paying a fraudulent registration costs $17,280 that is slow to recover. If occupancy is verified, the payment releases automatically.";
    if (a.id === F.THREAD) return "Already paid, and the same lease, landlord and device as R-104417. Half the award moved to the facilitator's fee account within 48 hours. Confirm it ineligible, recover the payment, and attach it to the Crescent Relief case.";
    if (a.id === F.DECISION) return "The registrant is the landlord of record on 61 other leases and claims to rent a unit that doesn't exist. Confirm ineligible for false documentation and place it on the Crescent Relief case.";
    if (a.recommendedAction === "pay") return "Identity, occupancy and damage are verified from independent sources. Pay today: the fast lane exists so verified survivors aren't slowed by the controls aimed at fraud.";
    if (a.recommendedAction === "dismiss") return "The flag fired on a shared street address, but parish and utility records show a duplex with two separate, verified households. Clear it; the decision feeds back so the model learns multi-unit addresses.";
    if (a.recommendedAction === "deny") return "The registration fails a hard eligibility check. Deny with the coded reason; the registrant can appeal with documentation.";
    return "The evidence points to an ineligible registration but should be verified before a final decision.";
  }
  AI.adjudicationSummary = function (a) {
    if (!a || a.uc !== "fema") return baseSummary(a);
    var ring = inRing(a);
    return {
      headline: "Registration #" + a.id,
      recommendation: { action: a.recommendedAction, label: REC_LABEL[a.recommendedAction] || a.recommendedAction, rationale: recRationale(a) },
      anomaly: a.id === F.SEED ? "A $17,280 renter award (rental, personal property, transportation) for a home whose owners say they live in it." : a.reason + ".",
      evidence: (a.signals || []).map(function (s) { return { label: s.label, detail: s.detail, outlier: s.sev === "high" }; }),
      network: ring ? "Part of the Crescent Relief network: 4 “application help” storefronts in LA and MS, " + N01().regs + " registrations, " + bigUsd(N01().atRisk) + ", tied together by shared collection accounts and one lease template." : (a.network ? "Part of " + F.net(a.network).name + " (" + F.SCHEMES[F.net(a.network).scheme].label.toLowerCase() + ")." : "No network — an isolated registration."),
      isRing: !!a.network,
      precedents: ring ? { text: "4 registrations from the same storefront were confirmed ineligible this month after occupancy checks; none were cleared.", cases: [{ id: "R-103412", outcome: "Confirmed" }, { id: "R-103455", outcome: "Confirmed" }, { id: "R-103490", outcome: "Confirmed" }] }
        : { text: "Similar registrations in this declaration were resolved on the evidence shown.", cases: [] }
    };
  };
  AI.agentReports = function (a) {
    if (!a || a.uc !== "fema") return baseAgents(a);
    if (inRing(a)) return [
      { role: "Investigative", focus: "entity · network · open source", icon: "user-search", findings: [
        { sev: "high", text: "Crescent Relief Navigators advertises “FEMA help — we file everything, you pay when FEMA pays” on two social-media pages. The posts began the day after landfall." },
        { sev: "high", text: "Its callback phone (985) 555-0147 is on 12 registrations, and device D-7F3A filed 31 registrations in 48 hours." },
        { sev: "high", text: "Shared collection accounts tie it to three more storefronts in Louisiana and Mississippi. About half of each award moves to one account, ••0429, within 48 hours: the facilitator's fee." },
        { sev: "medium", text: "Fontenot Rentals LLC, the landlord of record on 61 leases, owns no property in the parish. Its signer, Jarrod R. Fontenot, also registered as a displaced renter (R-104102)." }
      ], sources: ["Registrations", "Device telemetry", "Bank transactions", "Social media (open source)", "Secretary of State"] },
      { role: "Eligibility", focus: "identity · occupancy · ownership · benefits", icon: "home-search", findings: [
        { sev: "high", text: "Occupancy isn't supported. The owners of record registered as living at the same address three days after landfall." },
        { sev: "high", text: "The lease is the shared template (214 registrations), and no utility account at the address is in the registrant's name." },
        { sev: "low", text: "Identity verified: a real person, most likely recruited. Treat the registrant as a possible victim as well as a subject." },
        { sev: "low", text: "No insurance claim or SBA loan found, so no duplication of benefits." }
      ], sources: ["Parish assessor", "Utility records", "Identity verification", "Insurance match", "SBA disaster loans"] },
      { role: "Policy", focus: "Stafford Act · 44 CFR 206 · recovery", icon: "scale", findings: [
        { sev: "high", text: "IHP housing assistance requires the damaged dwelling to be the applicant's primary residence (44 CFR 206.113)." },
        { sev: "medium", text: "Assistance paid on false statements must be repaid. FEMA recovers it under 44 CFR 206.116 and refers suspected fraud to DHS OIG." },
        { sev: "medium", text: "A knowingly false claim for disaster benefits is a federal crime (18 U.S.C. § 1040)." },
        { sev: "low", text: "A hold pending verification fits program policy: a genuine renter can verify occupancy with a utility bill or a landlord contact." }
      ], sources: ["Stafford Act", "44 CFR Part 206", "18 U.S.C. § 1040", "IA Program and Policy Guide"] }
    ];
    var sig = a.signals || [];
    return [
      { role: "Investigative", focus: "entity · network · open source", icon: "user-search", findings: [{ sev: a.network ? "high" : "low", text: a.network ? "Linked to " + F.net(a.network).name + " (" + F.SCHEMES[F.net(a.network).scheme].label.toLowerCase() + ")." : "No shared accounts, devices, phones or documents with other registrations." }], sources: ["Registrations", "Device telemetry", "Bank account verification"] },
      { role: "Eligibility", focus: "identity · occupancy · ownership · benefits", icon: "home-search", findings: sig.map(function (s) { return { sev: s.sev === "med" ? "medium" : s.sev, text: s.label + ". " + s.detail }; }), sources: sig.map(function (s) { return s.src; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; }) },
      { role: "Policy", focus: "Stafford Act · 44 CFR 206 · recovery", icon: "scale", findings: [{ sev: "low", text: recRationale(a) }], sources: ["Stafford Act", "44 CFR Part 206", "IA Program and Policy Guide"] }
    ];
  };
  AI.copilot = function (a, q) {
    if (!a || a.uc !== "fema") return baseCopilot(a, q);
    q = (q || "").toLowerCase();
    if (/peer|compare|typical|normal/.test(q)) return "Compared with renter registrations in Terrebonne Parish: the median renter award is $4,950 and 88% carry a lease whose landlord owns the property. " + a.id + " is " + usd(a.amount) + ", its landlord owns none of the 61 addresses it leases, and the lease matches 214 others. In this parish, that combination only shows up in the Crescent Relief storefronts.";
    if (/rationale|justif|draft/.test(q)) return "Draft rationale: Registration " + a.id + " (" + a.registrant + ") claims occupancy of " + a.addr + ". " + (a.signals || []).filter(function (s) { return s.sev === "high"; }).map(function (s) { return s.detail; }).join(" ") + " On this evidence the registration is " + (a.recommendedAction === "pay" || a.recommendedAction === "dismiss" ? "eligible." : "not supported as submitted.");
    if (/recommend|action|should/.test(q)) return "Recommended: " + (REC_LABEL[a.recommendedAction] || a.recommendedAction) + ". " + recRationale(a);
    return a.id + " · " + a.registrant + " · " + usd(a.amount) + " · risk " + a.riskScore + ". " + a.reason + ". " + recRationale(a);
  };
  AI.CORRESPONDENCE_TYPES = [
    { id: "verify", label: "Request to verify occupancy", icon: "file-text", blurb: "Ask the registrant for a utility bill, lease and landlord contact." },
    { id: "ineligible", label: "Eligibility determination", icon: "gavel", blurb: "Ineligible determination with appeal rights." },
    { id: "debt", label: "Notice of potential debt", icon: "receipt-refund", blurb: "Recover an improper payment (recoupment)." },
    { id: "referral", label: "OIG referral memo", icon: "shield-search", blurb: "Refer the organized scheme to DHS OIG." }
  ];
  AI.correspondence = function (a, type) {
    if (!a || a.uc !== "fema") return baseLetter(a, type);
    var meta = AI.CORRESPONDENCE_TYPES.filter(function (t) { return t.id === type; })[0] || AI.CORRESPONDENCE_TYPES[0];
    var ref = "Registration " + a.id + " · " + a.dr + " (" + F.DECLS[a.dr].name + ")";
    var L = ["Individual Assistance · Program Integrity", "Date: " + APP.fmtTs(new Date()), "", "To:   " + a.registrant, "      " + a.addr, "", "Re:   " + meta.label + " — " + ref, ""];
    var b = [];
    if (type === "verify") b.push("We are reviewing your registration for disaster assistance. Before we can pay housing assistance, we need to confirm that the damaged home was your primary residence when the disaster happened.", "", "Please send, within 30 days, one of: a utility bill in your name for the address, a signed lease with your landlord's phone number, or a pay stub showing the address. You can upload documents in your online account or mail them.", "", "If you were helped to file this registration by a person or business that charged you a fee, please tell us. You will not be penalized for reporting it.");
    else if (type === "ineligible") b.push("After review, your registration is not eligible for the housing assistance requested. Reason: " + APP.reasonLabel("confirm", F.defaultReason(a, "confirm")) + ".", "", "You have the right to appeal within 60 days of the date of this letter. Include any documents that show the damaged home was your primary residence.");
    else if (type === "debt") b.push("Our records show you received " + usd(a.amount) + " in assistance that you were not eligible for. This notice tells you about a potential debt and your options: repay, request a payment plan, or dispute the debt with supporting documents within 30 days.");
    else b.push("Referral to DHS OIG: an organized application-facilitator scheme in " + a.dr + " and DR-9922-MS.", "", "Four “application help” storefronts filed " + N01().regs + " registrations (" + bigUsd(N01().atRisk) + ") using one lease template and shared collection accounts, with about half of each award forwarded to account ••0429. Evidence: document fingerprints, parish assessor records, device telemetry, bank transactions. Registration " + a.id + " is one of them.");
    b.forEach(function (x) { L.push(x); });
    L.push("", "Sincerely,", ((APP.ROLES[APP.state.role] || {}).name || "Dana Whitmore") + ", Program Integrity Analyst", "IBM Payment Integrity", "", "Drafted by the agentic assist and subject to reviewer adoption.", "Synthetic data — for demonstration only. Not a real registrant or disaster.");
    return { type: type, label: meta.label, ref: ref, body: L.join("\n") };
  };
  AI.knowledgeBase = function () {
    if (window.UC !== "fema") return baseKb();
    return [
      { title: "Individuals and Households Program — eligibility", cite: "44 CFR 206.113", summary: "Damaged dwelling must be the primary residence; identity, occupancy and ownership verified." },
      { title: "Recovery of funds", cite: "44 CFR 206.116", summary: "Assistance paid in error or on false statements is recovered." },
      { title: "Duplication of benefits", cite: "Stafford Act § 312", summary: "No assistance for losses covered by insurance or another program." },
      { title: "Fraud in connection with disaster benefits", cite: "18 U.S.C. § 1040", summary: "Knowingly false claims for disaster benefits are a federal crime." },
      { title: "Individual Assistance Program and Policy Guide", cite: "FEMA IAPPG", summary: "Program policy for IHP eligibility, verification and appeals." }
    ];
  };

  function bigUsd(n) { var t = function (x) { return String(Math.round(x * 10) / 10); }; return n >= 1e6 ? "$" + t(n / 1e6) + "M" : usd(n); }
  F.bigUsd = bigUsd;

  // ---- chrome: wording and controls ----
  function chrome() {
    document.querySelectorAll('.navitem[data-area="library"]').forEach(function (n) { n.style.display = "none"; });
    var gs = document.getElementById("gsearch"); if (gs) gs.style.display = "none";
    var lbl = { prepay: '<i class="ti ti-clock-play"></i> Pre-payment', retrospective: '<i class="ti ti-history"></i> Post-payment' };
    document.querySelectorAll(".modebtn").forEach(function (b) { var m = b.getAttribute("data-mode"); if (lbl[m]) b.innerHTML = lbl[m]; });
    var mt = document.getElementById("mode-toggle"); if (mt) mt.title = "Pre-payment = score awards before they pay · Post-payment = review what's been paid";
    var brand = document.querySelector(".brand-name"); if (brand) brand.innerHTML = 'IBM <b>Payment Integrity</b> <span style="font-weight:400;color:#a6c8ff;font-size:12px;margin-left:6px;padding-left:8px;border-left:1px solid rgba(255,255,255,0.25)">Disaster Relief</span>';
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", chrome); else chrome();
})();
