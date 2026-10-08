/* Treasury pack — switches the shared shell into federal payments verified by
   Treasury's Bureau of the Fiscal Service before it disburses them for the
   agencies that certify them. It:
     · registers the payments as leads (so the shared decision, supervisor-
       approval and audit flow work unchanged),
     · swaps the navigation down to the screens this pack provides,
     · swaps the decision reason codes, the assistant's content and the wording.
   The pack's views (assets/packs/treas/views/*) replace the shared ones by name.
   Requires window.TREAS (treas-data.js). */
(function () {
  var T = window.TREAS, APP = window.APP, DP = window.DP, AI = window.AI;
  window.UC = "treas";
  window.UC_PACK = window.UC_PACK || {};
  window.UC_PACK.id = "treas";
  window.UC_PACK.label = "Treasury payments";
  window.UC_PACK.shortOnly = true;
  window.UC_PACK.vocab = { lead: "payment", claim: "payment", greet: function (a) { return "I'm focused on payment #" + a.id + " — " + a.payee + ", " + a.fwaType.toLowerCase() + "."; } };
  var isT = function (id) { return /^PV-\d+$/.test(String(id || "")); };
  var usd = function (n) { return DP.usd(n); };

  document.title = "IBM Payment Integrity · Treasury payments";
  DP.disclaimer = "Synthetic data — for demonstration only. Fictional payees, people, companies, banks, accounts and addresses.";

  // ---- leads ----
  T.LEADS.forEach(function (l) { DP.raw.allegations.push(l); });
  var baseGet = DP.getAllegation.bind(DP);
  function enrich(l) {
    if (!l) return null;
    return Object.assign(l, {
      provider: { id: l.id, name: l.payee, state: l.state, npi: "", tin: "" },
      claim: null, veteran: null, subjectType: "Provider", model: null, rules: [],
      registrant: l.payee
    });
  }
  DP.getAllegation = function (id) {
    if (isT(id)) return enrich(T.lead(id));
    if (id === "20481" || id == null) return enrich(T.lead(T.SEED)); // the assistant's default subject
    return baseGet(id);
  };
  T.get = function (id) { return enrich(T.lead(id)); };

  // ---- navigation: only the screens this pack provides ----
  APP.SUBS = {
    home: [],
    casework: [{ v: "queue", l: "Payments", role: "analyst" }, { v: "approvals", l: "Approvals", role: "supervisor" }],
    insights: [{ v: "edi", l: "Payment flow" }, { v: "network", l: "Networks" }],
    library: []
  };
  APP.VIEW_AREA = { home: "home", queue: "casework", claim: "casework", approvals: "casework", edi: "insights", network: "insights" };
  var baseLabel = APP.labelForSnap;
  APP.labelForSnap = function (s) {
    if (!s) return "Payments";
    if (s.view === "claim") return "Payment " + s.allegationId;
    var map = { queue: "Payments", home: "Home", approvals: "Approvals", edi: "Payment flow", network: "Networks" };
    return map[s.view] || baseLabel(s);
  };
  APP.backLabel = function () { return APP.state.hist && APP.state.hist.length ? APP.labelForSnap(APP.state.hist[APP.state.hist.length - 1]) : "Payments"; };
  APP.togglePortal = function () {};
  APP.pendingCaseReviews = function () { return []; };

  // ---- decisions: payment reason codes ----
  APP.REASONS = {
    confirm: [
      { c: "IDT-01", t: "Refund claimed with a stolen identity" },
      { c: "W2F-01", t: "Refund based on a W-2 from an employer with no real payroll" },
      { c: "RED-01", t: "Payment redirected by an unauthorized direct-deposit change" },
      { c: "BEC-01", t: "Vendor payment redirected by a fraudulent bank change" },
      { c: "ACT-01", t: "Account opened in bulk and not controlled by the payee" },
      { c: "DEC-01", t: "Payee deceased" }
    ],
    dismiss: [
      { c: "VER-01", t: "Payee, account and payment verified" },
      { c: "VER-02", t: "Shared address is a facility (care home, shelter, base, clinic)" },
      { c: "VER-03", t: "Change made by the payee through a verified channel" },
      { c: "VER-04", t: "Data error in the flag itself" }
    ],
    escalate: [
      { c: "REF-01", t: "Organized scheme — refer to TIGTA / IRS-CI" },
      { c: "REF-02", t: "Benefit redirection — refer to the agency's OIG" },
      { c: "REF-03", t: "Pattern spans several agencies — coordinate referrals" }
    ],
    pay: [
      { c: "PAY-01", t: "Verified — payee, account and amount check out" },
      { c: "PAY-03", t: "Flag reviewed and cleared" }
    ],
    hold: [
      { c: "HLD-01", t: "Hold and ask the certifying agency to verify the payee's identity" },
      { c: "HLD-02", t: "Hold and ask the bank to confirm who controls the account" },
      { c: "HLD-03", t: "Hold pending the agency's review of the change request" }
    ],
    deny: [
      { c: "RTN-01", t: "Return — payee deceased (Numident · Death Master File)" },
      { c: "RTN-02", t: "Return — account ownership not verified" },
      { c: "RTN-03", t: "Return to the certifying agency for review" }
    ]
  };
  var DEFAULT_REASON = { "Stolen-identity refund": "IDT-01", "Benefit redirection": "RED-01", "Annuity redirection": "RED-01", "Vendor bank change": "BEC-01", "Deceased payee": "DEC-01" };
  T.defaultReason = function (l, outcome) {
    if (outcome === "dismiss") return l.fwaType === "Shared address" ? "VER-02" : "VER-01";
    if (outcome === "escalate") return /redirection/i.test(l.fwaType) ? "REF-02" : "REF-01";
    if (outcome === "hold") return /refund/i.test(l.fwaType) ? "HLD-01" : "HLD-03";
    if (outcome === "deny") return l.fwaType === "Deceased payee" ? "RTN-01" : l.fwaType === "Vendor bank change" ? "RTN-02" : "RTN-03";
    return DEFAULT_REASON[l.fwaType] || "IDT-01";
  };

  // pre-payment Pay / Hold / Return on a payment
  var basePrepay = APP.prepayDecide;
  APP.prepayDecide = function (id, action, reason, justification) {
    if (!isT(id)) return basePrepay(id, action, reason, justification);
    var l = T.lead(id); if (!l) return;
    l.status = { pay: "Released to pay", hold: "Held — verification", deny: "Returned to agency" }[action];
    APP.state.prepayDecisions[id] = { action: action, reason: reason || T.defaultReason(l, action), justification: justification || "", ts: new Date(), atRisk: l.amount };
    APP.auditLog("PREPAY_" + action.toUpperCase(), "Payment " + id + " · " + { pay: "released for disbursement", hold: "held pending verification — not disbursed", deny: "returned to the certifying agency — payment prevented" }[action] + " · " + usd(l.amount));
  };

  // ---- the Investigative Assistant's Treasury content ----
  var N01 = function () { return T.net("N01"); };
  function inRing(a) { return a.network === "N01"; }
  var baseSummary = AI.adjudicationSummary, baseAgents = AI.agentReports, baseCopilot = AI.copilot, baseLetter = AI.correspondence, baseKb = AI.knowledgeBase;
  var REC_LABEL = { hold: "Hold — verify the payee", deny: "Return to agency", pay: "Pay", confirm: "Reclaim · recover", dismiss: "Clear — payment stands", escalate: "Refer" };
  function recRationale(a) {
    if (a.id === T.SEED) return "Every list check passed, and that's the point: the identity is real and the account is in that name. What doesn't fit is everything around the payment. The account is 19 days old and one of 34 opened in a batch, the mailbox is shared with 29 other federal payees, and the W-2 comes from an employer with no real payroll. Holding costs a legitimate taxpayer a few days; paying sends $18,940 to an account that will be empty within hours. If IRS verifies the taxpayer, the refund releases.";
    if (a.id === T.THREAD) return "Already paid, to an account in the same batch and the same mailbox as PV-73194, and the real taxpayer has filed her own return. Ask the bank to return what's left (reclamation), tell IRS so the real taxpayer's refund isn't delayed, and attach it to the Delmont case.";
    if (a.id === T.DECISION) return "Ms. Pruitt's benefit went to an account she didn't open, after a phone call she didn't make, from a number that made 36 other changes. Reclaim the four payments from Lumen Direct, ask SSA to restore her deposit and reissue the missed payments, and place it on the Delmont case.";
    if (a.recommendedAction === "pay") return "The payee, account and amount check out against independent sources. Pay now: the fast lane keeps 99.96% of payments on schedule.";
    if (a.recommendedAction === "dismiss") return "The shared address is a licensed care facility, and the payees are long-time beneficiaries with their own accounts. Clear it; the decision feeds back so the model learns care facilities.";
    if (a.fwaType === "Deceased payee") return "Do Not Pay matched the payee to SSA's death records. Return the payment to the agency; this is the existing control doing its job.";
    if (a.fwaType === "Vendor bank change") return a.mode === "prepay" ? "The account ownership check failed on an account changed two days ago. Return the payment and confirm the change with the vendor by phone, using the number on file." : "Paid to an account the vendor never asked for. Reclaim it from the receiving bank and refer it with the other look-alike-domain changes.";
    if (/redirection/i.test(a.fwaType)) return "Redirected by the same phone number that changed other payees' deposits to network accounts. Reclaim it, restore the payee's account and place it on the Delmont case.";
    if (a.fwaType === "Stolen-identity refund") return "Same mailbox, same account batches and the same fake W-2 employers as the Delmont network. " + (a.mode === "prepay" ? "Hold and ask IRS to verify the taxpayer." : "Reclaim what's left from the bank and place it on the Delmont case.");
    return "The evidence points to an improper payment but should be verified before a final decision.";
  }
  AI.adjudicationSummary = function (a) {
    if (!a || a.uc !== "treas") return baseSummary(a);
    var ring = inRing(a);
    return {
      headline: "Payment #" + a.id,
      recommendation: { action: a.recommendedAction, label: REC_LABEL[a.recommendedAction] || a.recommendedAction, rationale: recRationale(a) },
      anomaly: a.id === T.SEED ? "An $18,940 tax refund that passed Do Not Pay, account ownership and TIN checks, going to an account opened 19 days ago in a batch of 34." : a.reason + ".",
      evidence: (a.signals || []).map(function (s) { return { label: s.label, detail: s.detail, outlier: s.sev === "high" }; }),
      network: ring ? "Part of the Delmont network: " + T.OPERATOR.batches + " account batches at 3 online banks, one private mailbox, 8 fake W-2 employers and one phone, " + N01().payees + " payees across IRS, SSA and OPM, " + bigUsd(N01().atRisk) + "." : (a.network ? "Part of " + T.net(a.network).name + " (" + T.SCHEMES[T.net(a.network).scheme].label.toLowerCase() + ")." : "No network — an isolated payment."),
      isRing: !!a.network,
      precedents: ring ? { text: "Two refunds from the same account batch were reclaimed last month after IRS confirmed the identities were stolen.", cases: [{ id: "PV-70912", outcome: "Reclaimed" }, { id: "PV-70948", outcome: "Reclaimed" }] }
        : { text: "Similar payments were resolved on the evidence shown.", cases: [] }
    };
  };
  AI.agentReports = function (a) {
    if (!a || a.uc !== "treas") return baseAgents(a);
    if (inRing(a)) return [
      { role: "Investigative", focus: "entity · network · open source", icon: "user-search", findings: [
        { sev: "high", text: "Eight employers on the W-2s were formed between November 2025 and March 2026, all at PMB 212 in Carver Mill, GA, with the same registered agent (Sentinel Registered Agents). None has filed a real payroll." },
        { sev: "high", text: "The refunds go to accounts opened in batches at three online banks: runs of neighboring account numbers, opened within days, each in a different payee's name. That's why each one passes the ownership check." },
        { sev: "high", text: "Phone (470) 555-0148 made 37 direct-deposit changes for SSA and OPM payees since April, moving them to accounts in the same batches. The same phone is listed for Delmont Tax & Business Services, which has no preparer ID (PTIN)." },
        { sev: "medium", text: "The account batches continue into a Florida mailbox ring's accounts, and the phone also redirected annuities for a Gulf Coast ring." }
      ], sources: ["Treasury payment history", "Agency payment files", "OpenCorporates", "SSA and OPM change logs", "USPS mailbox list"] },
      { role: "Payment verification", focus: "Do Not Pay · account · TIN · patterns", icon: "shield-check", findings: [
        { sev: "low", text: "Do Not Pay: no match in the Death Master File, SSA's Numident, SAM.gov exclusions or the other sources. Account ownership and TIN checks passed." },
        { sev: "high", text: "Account age: " + (a.acctOpened ? "opened " + a.acctOpened : "new") + ", in batch " + (a.batchRec ? a.batchRec.bank + " " + a.batchRec.range + " (" + a.batchRec.accts + " accounts)" : "—") + "." },
        { sev: "high", text: "Address: a private mailbox used by " + T.MAILBOX.payees + " federal payees in " + T.MAILBOX.months + " months, across three agencies." },
        { sev: "medium", text: a.program === "REF" ? "Amount: " + usd(a.amount) + " against a " + usd(T.PEER_MEDIAN) + " peer median for the reported wages; almost all of it is reported withholding that was never deposited." : "Payment destination changed by phone to a network account weeks after it was opened." }
      ], sources: ["Do Not Pay", "Account & TIN verification", "Treasury payment history", "Peer comparison"] },
      { role: "Policy", focus: "PIIA · EO 14249 · reclamation · privacy", icon: "scale", findings: [
        { sev: "high", text: "Agencies and Treasury must verify payments before they go out (Payment Integrity Information Act, 31 U.S.C. 3351–3358; Executive Order 14249). A hold for verification fits that duty." },
        { sev: "medium", text: "Paid ACH deposits can be reclaimed from the receiving bank (31 CFR Part 210, subpart B); the agency reissues the payment to the right payee." },
        { sev: "medium", text: "Tax return information is confidential (26 U.S.C. § 6103). Here IRS shares a flag on the return, not the return itself, under an agreement with Treasury." },
        { sev: "low", text: "Stolen identities and false claims are federal crimes (18 U.S.C. §§ 287, 641, 1028A); refer the network to TIGTA and IRS-CI, and the redirects to SSA and OPM OIG." }
      ], sources: ["31 U.S.C. 3351–3358", "EO 14249", "31 CFR Part 210", "26 U.S.C. § 6103", "18 U.S.C. §§ 287, 641, 1028A"] }
    ];
    var sig = a.signals || [];
    return [
      { role: "Investigative", focus: "entity · network · open source", icon: "user-search", findings: [{ sev: a.network ? "high" : "low", text: a.network ? "Linked to " + T.net(a.network).name + " (" + T.SCHEMES[T.net(a.network).scheme].label.toLowerCase() + ")." : "No shared accounts, addresses, phones or employers with other payees." }], sources: ["Treasury payment history", "Agency payment files"] },
      { role: "Payment verification", focus: "Do Not Pay · account · TIN · patterns", icon: "shield-check", findings: sig.map(function (s) { return { sev: s.sev === "med" ? "medium" : s.sev, text: s.label + ". " + s.detail }; }), sources: sig.map(function (s) { return s.src; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; }) },
      { role: "Policy", focus: "PIIA · EO 14249 · reclamation · privacy", icon: "scale", findings: [{ sev: "low", text: recRationale(a) }], sources: ["31 U.S.C. 3351–3358", "31 CFR Part 210"] }
    ];
  };
  function peerText(a) {
    if (a.program === "REF") return "Compared with refunds to single filers reporting similar wages: the median is " + usd(T.PEER_MEDIAN) + " and 90% are under $9,800. " + a.id + " is " + usd(a.amount) + ". Nearly every refund above $15,000 at this wage level in Georgia this year traces to one of eight employers formed at the same mailbox.";
    if (/redirection/i.test(a.fwaType)) return "Most direct-deposit changes move a payee to an account they've held for years, made online with a verified sign-in. This one moved a long-time payee to an account opened days earlier, by phone, from a number used for 36 other changes.";
    if (a.program === "VEN") return "Vendors change remit-to accounts rarely: this vendor's was unchanged for years. Three other vendors changed to the same bank this month.";
    if (a.recommendedAction === "pay" || a.recommendedAction === "dismiss") return a.id + " is in line with peers: " + a.reason.toLowerCase() + ".";
    return a.id + " is " + usd(a.amount) + ". " + a.reason + ".";
  }
  AI.copilot = function (a, q) {
    if (!a || a.uc !== "treas") return baseCopilot(a, q);
    q = (q || "").toLowerCase();
    var n = a.network ? T.net(a.network) : null;
    if (/peer|compare|typical|normal|median|amount/.test(q)) return peerText(a);
    if (/rationale|justif|draft/.test(q)) return "Draft rationale: Payment " + a.id + " (" + a.prog.name + ", " + a.payee + ") for " + usd(a.amount) + ". " + (a.signals || []).filter(function (s) { return s.sev === "high"; }).map(function (s) { return s.detail; }).join(" ") + " On this evidence the payment is " + (a.recommendedAction === "pay" || a.recommendedAction === "dismiss" ? "proper." : "not proper as certified.");
    if (/recommend|action|should|decide|next/.test(q)) return "Recommended: " + (REC_LABEL[a.recommendedAction] || a.recommendedAction) + ". " + recRationale(a);
    if (/account|bank|batch/.test(q)) return a.batchRec ? a.bank + " account " + a.acct + ", opened " + a.acctOpened + ", one of " + a.batchRec.accts + " accounts with neighboring numbers (" + a.batchRec.range + ") opened " + a.batchRec.opened + ", each in a different name." : a.bank + " account " + a.acct + (a.acctOpened && a.acctOpened !== "—" ? ", held since " + a.acctOpened : "") + ".";
    if (/who|employer|w-2|w2|preparer|owner/.test(q)) return a.network === "N01" ? "The W-2s come from eight employers formed in the last year at PMB 212, Carver Mill, GA, with registered agent " + T.OPERATOR.agent + ". The returns were prepared by " + T.OPERATOR.preparer + ", which has no PTIN; its phone " + T.OPERATOR.phone + " also made 37 direct-deposit changes." : "No employer or preparer ties found.";
    if (/network|link|related|connect|other/.test(q)) return n ? n.name + ": " + T.SCHEMES[n.scheme].label.toLowerCase() + ", " + n.payees + " payees in " + n.states.join(", ") + ", " + bigUsd(n.atRisk) + " across " + n.agencies.join(", ") + ". Open Insights › Networks to see it down to the payment." : "No links found: this payment shares no account batch, address, phone or employer with other payees.";
    if (/reclaim|recover|refer|letter|notice|oig|tigta/.test(q)) return a.mode === "prepay" ? "Nothing to recover yet: the payment hasn't gone out. Hold it and send the certifying agency a verification request (Correspondence tab)." : "Recovery runs through reclamation: ask the receiving bank to return the funds (31 CFR Part 210), and the agency reissues to the right payee. The Correspondence tab drafts the reclamation request" + (a.network ? " and a referral memo for TIGTA and IRS-CI." : ".");
    if (/rule|policy|law|regulation|privacy|6103/.test(q)) return "The rules that apply here: verify before paying (PIIA, 31 U.S.C. 3351–3358; EO 14249), reclamation of ACH payments (31 CFR Part 210), confidentiality of return information (26 U.S.C. § 6103), and the identity-theft and false-claims statutes. The Policy agent lists which ones this payment touches.";
    return a.id + " · " + a.payee + " · " + usd(a.amount) + " · risk " + a.riskScore + ". " + a.reason + ". " + recRationale(a);
  };
  AI.CORRESPONDENCE_TYPES = [
    { id: "verify", label: "Verification request to the agency", icon: "file-text", blurb: "Ask the certifying agency to verify the payee before the payment goes out." },
    { id: "ineligible", label: "Payment return notice", icon: "arrow-back-up", blurb: "Return the payment to the certifying agency, with the reason." },
    { id: "debt", label: "Reclamation request to the bank", icon: "receipt-refund", blurb: "Ask the receiving bank to return the funds." },
    { id: "referral", label: "Referral memo — TIGTA / IRS-CI", icon: "shield-search", blurb: "Refer the network for investigation." }
  ];
  AI.correspondence = function (a, type) {
    if (!a || a.uc !== "treas") return baseLetter(a, type);
    var meta = AI.CORRESPONDENCE_TYPES.filter(function (t) { return t.id === type; })[0] || AI.CORRESPONDENCE_TYPES[0];
    var ag = T.AGENCIES[a.agency];
    var ref = "Payment " + a.id + " · " + a.prog.name + " · " + a.schedule;
    var to = type === "debt" ? ["To:   " + a.bank, "      Reclamation department"] : type === "referral" ? ["To:   Treasury Inspector General for Tax Administration", "      IRS Criminal Investigation"] : ["To:   Certifying officer", "      " + ag.name];
    var L = ["Bureau of the Fiscal Service · Payment Integrity", "Date: " + APP.fmtTs(new Date()), ""].concat(to, ["", "Re:   " + meta.label + " — " + ref, ""]);
    var b = [];
    if (type === "verify") b.push("We are holding a payment of " + usd(a.amount) + " to " + a.payee + " (" + a.prog.name + ") certified on " + a.schedule + ".", "", "It passed Do Not Pay, account ownership and TIN checks, but the deposit account was opened recently in a batch of neighboring accounts, and the mailing address is a private mailbox used by other federal payees. Please verify the payee's identity and confirm whether to release the payment.", "", "The payment stays on hold until we hear back (Executive Order 14249, pre-certification verification).");
    else if (type === "ineligible") b.push("We are returning payment " + a.id + " (" + usd(a.amount) + ") to your agency. Reason: " + APP.reasonLabel("deny", T.defaultReason(a, "deny")) + ".", "", "Please review the payee record before recertifying.");
    else if (type === "debt") b.push("We request the return of " + usd(a.amount) + " credited to account " + a.acct + " (" + a.prog.name + ", " + (a.paidDate || "") + ").", "", "The payment was not due to the account holder (31 CFR Part 210, subpart B). Please return any remaining funds and tell us the account's current balance and status.");
    else b.push("Referral: a network collecting federal tax refunds, Social Security benefits and federal annuities through accounts opened in bulk at three online banks.", "", T.OPERATOR.batches + " account batches, one private mailbox (PMB 212, Carver Mill, GA), eight employers formed in the last year that issue W-2s with no real payroll, an unregistered preparer, and one phone that made 37 direct-deposit changes. " + N01().payees + " payees, three agencies, " + bigUsd(N01().atRisk) + " over 13 months. Payment " + a.id + " is one of them.", "", "Requested: the banks' account-opening records for the batches, and the preparer's e-file records.");
    b.forEach(function (x) { L.push(x); });
    L.push("", "Sincerely,", ((APP.ROLES[APP.state.role] || {}).name || "Dana Whitmore") + ", Payment Integrity Analyst", "IBM Payment Integrity", "", "Drafted by the agentic assist and subject to reviewer adoption.", "Synthetic data — for demonstration only. Not a real payee, bank or account.");
    return { type: type, label: meta.label, ref: ref, body: L.join("\n") };
  };
  AI.knowledgeBase = function () {
    if (window.UC !== "treas") return baseKb();
    return [
      { title: "Payment Integrity Information Act — Do Not Pay", cite: "31 U.S.C. 3351–3358", summary: "Agencies check payees against Do Not Pay before paying, and report and recover improper payments." },
      { title: "Protecting America's Bank Account Against Fraud, Waste, and Abuse", cite: "EO 14249", summary: "Treasury verifies payments before agencies certify them, using Do Not Pay and other validation services." },
      { title: "Federal ACH payments and reclamation", cite: "31 CFR Part 210", summary: "How paid ACH deposits are reclaimed from receiving banks." },
      { title: "Confidentiality of return information", cite: "26 U.S.C. § 6103", summary: "Tax return information may be shared only as the law allows." },
      { title: "Aggravated identity theft", cite: "18 U.S.C. § 1028A", summary: "Using another person's identity in a felony such as a false claim." },
      { title: "False claims · public money", cite: "18 U.S.C. §§ 287, 641", summary: "Making a false claim against, or stealing money of, the United States." },
      { title: "Injunctions against return preparers", cite: "26 U.S.C. § 7407", summary: "Courts can bar preparers who engage in fraudulent conduct." }
    ];
  };

  function bigUsd(n) { var t = function (x) { return String(x < 10 ? Math.round(x * 100) / 100 : Math.round(x * 10) / 10); }; return n >= 1e6 ? "$" + t(n / 1e6) + "M" : n >= 1e5 ? "$" + Math.round(n / 1e3) + "K" : usd(n); }
  T.bigUsd = bigUsd;

  // ---- chrome: wording and controls ----
  function chrome() {
    document.querySelectorAll('.navitem[data-area="library"]').forEach(function (n) { n.style.display = "none"; });
    var gs = document.getElementById("gsearch"); if (gs) gs.style.display = "none";
    var lbl = { prepay: '<i class="ti ti-clock-play"></i> Pre-payment', retrospective: '<i class="ti ti-history"></i> Post-payment' };
    document.querySelectorAll(".modebtn").forEach(function (b) { var m = b.getAttribute("data-mode"); if (lbl[m]) b.innerHTML = lbl[m]; });
    var mt = document.getElementById("mode-toggle"); if (mt) mt.title = "Pre-payment = verify payments before Treasury disburses them · Post-payment = review what's been paid";
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", chrome); else chrome();
})();
