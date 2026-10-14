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
  APP.VIEW_AREA = { home: "home", queue: "casework", claim: "casework", approvals: "casework", handoff: "casework", edi: "insights", network: "insights", agencyportal: "portal" };
  var baseLabel = APP.labelForSnap;
  APP.labelForSnap = function (s) {
    if (!s) return "Payments";
    if (s.view === "claim") return "Payment " + s.allegationId;
    if (s.view === "handoff") return "Package · " + s.allegationId;
    var map = { queue: "Payments", home: "Home", approvals: "Approvals", edi: "Payment flow", network: "Networks", agencyportal: "Agency system" };
    return map[s.view] || baseLabel(s);
  };
  APP.backLabel = function () { return APP.state.hist && APP.state.hist.length ? APP.labelForSnap(APP.state.hist[APP.state.hist.length - 1]) : "Payments"; };
  APP.pendingCaseReviews = function () { return []; };

  // ---- hand-off: Treasury recommends, the certifying agency decides ----
  // Treasury can't stop a payment: only the agency that certified it can. So a
  // flagged payment goes to that agency as a recommendation package (readable +
  // structured, in the shared schema), the agency decides in its own system (the
  // simulated agency portal), and the decision comes back to Treasury.
  APP.state.handoffs = {};
  APP.state.agencyAuth = {};
  T.REC_ACTIONS = {
    prepay: [
      { c: "hold", t: "Hold and verify the payee", icon: "clock-hour-4", tone: "med" },
      { c: "stop", t: "Stop the payment", icon: "hand-stop", tone: "high" },
      { c: "release", t: "Release: no concerns", icon: "check", tone: "low" }
    ],
    post: [
      { c: "reclaim", t: "Reclaim from the bank and restore the payee", icon: "receipt-refund", tone: "high" },
      { c: "refer", t: "Refer to the agency's OIG", icon: "shield-search", tone: "med" },
      { c: "none", t: "No action: payment proper", icon: "check", tone: "low" }
    ]
  };
  T.AGENCY_DECISIONS = {
    prepay: [
      { c: "stop", t: "Stop the payment", icon: "hand-stop", tone: "high", status: "Stopped by " },
      { c: "release", t: "Release the payment", icon: "check", tone: "low", status: "Released by " },
      { c: "info", t: "Ask Treasury for more", icon: "message-question", tone: "med", status: "More info requested by " }
    ],
    post: [
      { c: "reclaim", t: "Request reclamation", icon: "receipt-refund", tone: "high", status: "Reclamation requested by " },
      { c: "none", t: "No action", icon: "check", tone: "low", status: "Closed by " },
      { c: "info", t: "Ask Treasury for more", icon: "message-question", tone: "med", status: "More info requested by " }
    ]
  };
  T.AGENCY_REASONS = {
    stop: [{ c: "AG-S1", t: "Payee identity not verified: the taxpayer didn't file this" }, { c: "AG-S2", t: "Payee deceased" }, { c: "AG-S3", t: "Account not controlled by the payee" }],
    release: [{ c: "AG-R1", t: "Payee verified by the agency" }, { c: "AG-R2", t: "Flag explained: payment proper" }],
    reclaim: [{ c: "AG-C1", t: "Payment redirected without the payee's consent" }, { c: "AG-C2", t: "Payee's identity was stolen" }],
    none: [{ c: "AG-N1", t: "Payment proper as certified" }],
    info: [{ c: "AG-I1", t: "Send the bank's account-opening records" }, { c: "AG-I2", t: "Send the linked payments" }]
  };
  var stage = function (l) { return l.mode === "prepay" ? "prepay" : "post"; };
  T.defaultRec = function (l) {
    var d = l.mode !== "prepay" && APP.state.decisions[l.id];
    return { hold: "hold", deny: "stop", pay: "release", confirm: "reclaim", escalate: "refer", dismiss: "none" }[d ? d.outcome : l.recommendedAction] || "hold";
  };
  // post-payment: the package to the agency needs an approved finding behind it
  T.findingFor = function (id) { return APP.state.decisions[id] || null; };
  T.packageReady = function (l) { if (l.mode === "prepay") return true; var d = T.findingFor(l.id); return !!(d && d.reviewState === "approved"); };
  T.FINDING = { confirm: "Improper", dismiss: "Proper", escalate: "Needs investigation" };
  var baseSup = APP.supervisorAction;
  APP.supervisorAction = function (id, action, note) {
    baseSup(id, action, note);
    var l = isT(id) && T.lead(id), d = T.findingFor(id);
    if (l && action === "approve" && d && d.outcome !== "dismiss") APP.auditLog("RECOMMENDATION_READY", "Payment " + id + " · finding approved · recommendation to " + T.AGENCIES[l.agency].name + " can be sent: " + T.recLabel(l, T.defaultRec(l)));
  };
  T.recLabel = function (l, c) { var r = T.REC_ACTIONS[stage(l)].filter(function (x) { return x.c === c; })[0]; return r ? r.t : c; };
  T.agencyDecision = function (l, c) { return T.AGENCY_DECISIONS[stage(l)].filter(function (x) { return x.c === c; })[0] || null; };
  T.agencyReasonLabel = function (c) { var all = []; Object.keys(T.AGENCY_REASONS).forEach(function (k) { all = all.concat(T.AGENCY_REASONS[k]); }); var r = all.filter(function (x) { return x.c === c; })[0]; return r ? r.c + " · " + r.t : c; };
  T.handoff = function (id) { return APP.state.handoffs[id] || null; };
  T.handoffsFor = function (agency) { return Object.keys(APP.state.handoffs).map(function (k) { return APP.state.handoffs[k]; }).filter(function (h) { return h.agency === agency; }).sort(function (a, b) { return b.sentAt - a.sentAt; }); };
  // the structured package — what actually travels between the two systems
  T.payload = function (l, rec, reason) {
    var h = T.handoff(l.id), n = l.network ? T.net(l.network) : null, due = new Date(Date.now() + 5 * 864e5);
    return {
      schema: T.SCHEMA.id,
      packageId: h ? h.pkg : "PKG-" + l.id.replace("PV-", "") + "-01",
      from: "treasury.fiscal-service",
      to: l.agency.toLowerCase(),
      payment: { id: l.id, type: l.prog.name, amount: l.amount, status: l.mode === "prepay" ? "not yet disbursed" : "paid " + (l.paidDate || "") },
      payee: { name: l.payee, account: l.bank + " " + l.acct },
      recommendation: { action: rec, reasonCode: reason },
      riskScore: l.riskScore,
      evidence: (l.signals || []).filter(function (s) { return s.sev !== "low"; }).map(function (s) { return { finding: s.label, lane: T.LANES[s.lane] ? T.LANES[s.lane].t : s.lane, source: s.src }; }),
      network: n ? { id: n.id, payees: n.payees, agencies: n.agencies } : null,
      respondBy: APP.fmtDate(due)
    };
  };
  APP.openHandoff = function (id, rec) {
    (APP.state.hist = APP.state.hist || []).push(APP.snapshot());
    APP.state.allegationId = id;
    APP.nav("handoff", { id: id, rec: rec });
  };
  APP.sendHandoff = function (id, rec, reason, note) {
    var l = T.lead(id); if (!l) return null;
    var h = { pkg: "PKG-" + id.replace("PV-", "") + "-01", id: id, agency: l.agency, rec: rec, reason: reason, note: note || "", sentAt: new Date(), sentBy: (APP.ROLES[APP.state.role] || {}).name, status: "sent", decision: null };
    h.payload = T.payload(l, rec, reason);
    APP.state.handoffs[id] = h;
    if (l.mode === "prepay") {
      APP.state.prepayDecisions[id] = { action: "refer", rec: rec, reason: reason, justification: note || "", ts: h.sentAt, atRisk: l.amount };
      l.status = "Sent to " + l.agency;
    }
    APP.auditLog("PACKAGE_SENT", "Payment " + id + " · recommendation sent to " + T.AGENCIES[l.agency].name + ": " + T.recLabel(l, rec) + " · " + h.pkg + " (" + T.SCHEMA.name + ")");
    return h;
  };
  APP.agencyDecide = function (id, decision, reason, note) {
    var h = T.handoff(id), l = T.lead(id); if (!h || !l) return;
    var u = T.AGENCY_USERS[h.agency], d = T.agencyDecision(l, decision);
    h.decision = { c: decision, reason: reason, note: note || "", ts: new Date(), by: u.name, title: u.title };
    h.status = "decided";
    l.status = d.status + h.agency;
    if (l.mode === "prepay" && APP.state.prepayDecisions[id]) APP.state.prepayDecisions[id].agency = h.decision;
    APP.auditLog("AGENCY_DECISION", "Payment " + id + " · " + T.AGENCIES[h.agency].name + " (" + u.name + "): " + d.t + " · " + T.agencyReasonLabel(reason));
  };
  // the agency's own (simulated) system — a separate instance that receives packages
  APP.openAgencyPortal = function (agency, id) {
    if (APP.state.view !== "agencyportal") APP.state._preAgencySnap = APP.snapshot();
    APP.nav("agencyportal", { agency: agency, id: id });
  };
  APP.leaveAgencyPortal = function () {
    if (APP.state.sysWindow) return; // the agency's own window stays the agency's
    var s = APP.state._preAgencySnap; APP.state._preAgencySnap = null;
    if (s && s.view && s.view !== "agencyportal") { APP.state.allegationId = s.allegationId; APP.nav(s.view, { id: s.allegationId }); }
    else APP.nav("home");
  };
  // the logo switches between Treasury and the IRS system (or the agency of the payment in view)
  APP.togglePortal = function () {
    if (APP.state.view === "agencyportal") return APP.leaveAgencyPortal();
    var l = APP.state.allegationId ? T.lead(APP.state.allegationId) : null;
    APP.openAgencyPortal(l && T.handoff(l.id) ? l.agency : "IRS", l && T.handoff(l.id) ? l.id : null);
  };

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

  // pre-payment: Treasury releases a clean payment, or refers a flagged one to the
  // certifying agency with a recommendation (Hold / Return become the package's
  // recommended action — the agency makes the call)
  var basePrepay = APP.prepayDecide;
  APP.prepayDecide = function (id, action, reason, justification) {
    if (!isT(id)) return basePrepay(id, action, reason, justification);
    var l = T.lead(id); if (!l) return;
    // deferred: callers re-render the queue right after deciding, and the package screen must win
    if (action !== "pay") { var rec = action === "deny" ? "stop" : action === "hold" ? "hold" : T.defaultRec(l); setTimeout(function () { APP.openHandoff(id, rec); }, 0); return; }
    l.status = "Released to pay";
    APP.state.prepayDecisions[id] = { action: "pay", reason: reason || T.defaultReason(l, "pay"), justification: justification || "", ts: new Date(), atRisk: l.amount };
    APP.auditLog("PREPAY_PAY", "Payment " + id + " · released for disbursement · " + usd(l.amount));
  };

  // ---- the Investigative Assistant's Treasury content ----
  var N01 = function () { return T.net("N01"); };
  function inRing(a) { return a.network === "N01"; }
  var baseSummary = AI.adjudicationSummary, baseAgents = AI.agentReports, baseCopilot = AI.copilot, baseLetter = AI.correspondence, baseKb = AI.knowledgeBase;
  var REC_LABEL = { hold: "Refer to the agency · recommend hold", deny: "Refer to the agency · recommend stop", pay: "Pay", confirm: "Improper · recommend reclaim", dismiss: "Proper · payment stands", escalate: "Needs investigation · recommend referral" };
  function recRationale(a) {
    if (a.id === T.SEED) return "Every list check passed, and that's the point: the identity is real and the account is in that name. What doesn't fit is everything around the payment. The account is 19 days old and one of 34 opened in a batch, the mailbox is shared with 29 other federal payees, and the W-2 comes from an employer with no real payroll. Recommend that IRS hold it and verify the taxpayer: a hold costs a legitimate taxpayer a few days, while paying sends $18,940 to an account that will be empty within hours. If IRS verifies the taxpayer, the refund releases.";
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
      ], sources: ["Treasury payment history", "Agency payment files", "TrackLight", "SSA and OPM change logs", "USPS mailbox list"] },
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
    if (/reclaim|recover|refer|letter|notice|oig|tigta/.test(q)) return a.mode === "prepay" ? "Nothing to recover yet: the payment hasn't gone out. Only " + a.agency + " can stop it, so send " + a.agency + " a recommendation package (Send to " + a.agency + " on the payment) and it decides in its own system." : "Recovery runs through reclamation: ask the receiving bank to return the funds (31 CFR Part 210), and the agency reissues to the right payee. The Correspondence tab drafts the reclamation request" + (a.network ? " and a referral memo for TIGTA and IRS-CI." : ".");
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
  // inside the agency's system, Treasury's controls step out of the way (the logo returns)
  var st = document.createElement("style");
  // where a piece of evidence came from: one of six lanes, same look everywhere
  T.laneTag = function (lane, src, small) {
    var L = T.LANES[lane] || T.LANES.treas;
    return '<span class="lane lane-' + L.k + '" title="' + APP.esc(L.d) + '" style="--lc:' + L.c + ';--lb:' + L.bg + (small ? ';font-size:9.5px' : '') + '"><i class="ti ti-' + L.icon + '"></i>' + L.t + (src ? '<span class="lane-src">' + APP.esc(src) + '</span>' : '') + '</span>';
  };
  T.laneLegend = function () {
    return '<div style="display:flex;gap:5px;flex-wrap:wrap;align-items:center">' + T.LANE_ORDER.map(function (k) { return T.laneTag(k, null, true); }).join("") + '</div>';
  };
  // TrackLight's mark wherever its data shows (a styled wordmark until the team has logo assets)
  T.tlMark = function (txt) { return '<span class="tl-mark"><i class="ti ti-radar-2"></i>TrackLight' + (txt ? '<span class="tl-sub">' + txt + '</span>' : '') + '</span>'; };
  // room under every screen so the floating Investigative Assistant button never covers its last row
  st.textContent = ".lane{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;color:var(--lc);background:var(--lb);border:0.5px solid var(--lc);border-radius:5px;padding:1px 6px 1px 5px;white-space:nowrap;line-height:1.5}.lane .ti{font-size:11px}.lane-src{font-weight:400;color:var(--lc);opacity:.85;margin-left:2px;padding-left:5px;border-left:0.5px solid var(--lc)}" +
    "#view{padding-bottom:84px}.tl-mark{display:inline-flex;align-items:center;gap:4px;font-weight:700;letter-spacing:-.01em;color:#0e5a63;background:#e3f6f4;border:0.5px solid #9fd9d2;border-radius:5px;padding:1px 7px 1px 6px;font-size:11px;white-space:nowrap}.tl-mark .tl-sub{font-weight:500;color:#2f6d73;margin-left:3px}" +
    "body[data-sys=agency] .navitems,body[data-sys=agency] #mode-toggle,body[data-sys=agency] #reset-demo,body[data-sys=agency] .conn,body[data-sys=agency] #role-switch,body[data-sys=agency] #prog-switch,body[data-sys=agency] .brand-name,body[data-sys=agency] #cp-fab,body[data-sys=agency] #cp-panel{visibility:hidden}";
  document.head.appendChild(st);
  var baseNav = APP.nav;
  APP.nav = function (view, params) { document.body.setAttribute("data-sys", view === "agencyportal" ? "agency" : "treasury"); return baseNav(view, params); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", chrome); else chrome();
})();
