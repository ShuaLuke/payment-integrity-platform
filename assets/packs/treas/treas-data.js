/* Treasury pack — synthetic data for federal payments that Treasury's Bureau of
   the Fiscal Service disburses on behalf of the agencies that certify them (tax
   refunds, Social Security benefits, federal retirement annuities, VA benefits,
   vendor payments), screened before they go out. Everything here is fictional:
   the payees, people, companies, banks, account numbers, addresses and payment
   IDs. Banks are invented names; account numbers show the last four digits only;
   payment IDs use a PV-7xxxx series; the mailbox address and town are made up.
   The story is a composite of documented patterns (stolen-identity refunds backed
   by fake W-2s, accounts opened in bulk at online banks, private mailboxes shared
   by many payees, benefits redirected by direct-deposit changes, vendor bank-
   change fraud), not a model of any real case. Attaches window.TREAS. */
(function () {
  // payment types, each certified by an agency
  var PROGRAMS = {
    REF: { code: "REF", agency: "IRS", name: "Individual income tax refund", short: "Tax refund" },
    SSA: { code: "SSA", agency: "SSA", name: "Social Security benefit", short: "Benefit" },
    OPM: { code: "OPM", agency: "OPM", name: "Federal retirement annuity", short: "Annuity" },
    VAB: { code: "VAB", agency: "VA", name: "VA compensation", short: "Benefit" },
    VEN: { code: "VEN", agency: "GSA", name: "Federal vendor payment", short: "Vendor" }
  };
  var AGENCIES = {
    IRS: { code: "IRS", name: "Internal Revenue Service" },
    SSA: { code: "SSA", name: "Social Security Administration" },
    OPM: { code: "OPM", name: "Office of Personnel Management" },
    VA: { code: "VA", name: "Department of Veterans Affairs" },
    GSA: { code: "GSA", name: "General Services Administration" }
  };

  // ---- the network the story follows (Delmont) ----
  // An unregistered preparer behind fake W-2 employers, accounts opened in bulk at
  // three online banks, one private mailbox, and redirected benefits and annuities.
  var MAILBOX = { line: "2210 Mill Pointe Pkwy, Ste 114 · PMB 212", city: "Carver Mill, GA 30097", kind: "Private mailbox at a shipping store", payments: 46, payees: 30, amount: 505000, months: 13 };
  var OPERATOR = { name: "Delmont network", preparer: "Delmont Tax & Business Services", officer: "R. T. Delmont", agent: "Sentinel Registered Agents LLC", phone: "(470) 555-0148", accounts: 386, batches: 9, banks: 3 };
  // account batches: runs of neighboring account numbers opened within days, one per stolen or borrowed identity
  var BATCHES = [
    { id: "A1", bank: "Brightpath Bank", range: "••6201–6248", accts: 34, opened: "Sep 8–19, 2026", role: "Refund accounts", risk: 92, payments: 41 },
    { id: "A2", bank: "Brightpath Bank", range: "••8830–8859", accts: 22, opened: "Feb 2–11, 2026", role: "Refund accounts", risk: 89, payments: 27 },
    { id: "A3", bank: "Lumen Direct", range: "••3301–3349", accts: 38, opened: "May 4–15, 2026", role: "Benefit redirects", risk: 91, payments: 166 },
    { id: "A4", bank: "Lumen Direct", range: "••5502–5538", accts: 27, opened: "Jan 20–30, 2026", role: "Refund accounts", risk: 87, payments: 31 },
    { id: "A5", bank: "Corridor Financial", range: "••0861–0899", accts: 31, opened: "Mar 9–18, 2026", role: "Refund accounts", risk: 86, payments: 35 },
    { id: "A6", bank: "Corridor Financial", range: "••2240–2272", accts: 24, opened: "Apr 13–22, 2026", role: "Annuity redirects", risk: 88, payments: 112 }
  ];
  var BATCH = function (id) { return BATCHES.filter(function (b) { return b.id === id; })[0] || null; };
  // the employers on the W-2s: formed in the last year, same agent, same mailbox, no real payroll
  var EMPLOYERS = [
    { name: "Harlan Ridge Logistics LLC", formed: "2025-11-04", w2s: 38, wages: 1710000, withheld: 742000 },
    { name: "Brookfane Staffing LLC", formed: "2025-11-19", w2s: 41, wages: 1820000, withheld: 801000 },
    { name: "Tallow Creek Services LLC", formed: "2025-12-02", w2s: 29, wages: 1290000, withheld: 566000 },
    { name: "Merriweather Home Care LLC", formed: "2026-01-13", w2s: 44, wages: 1960000, withheld: 858000 },
    { name: "Graystone Freight Partners LLC", formed: "2026-01-28", w2s: 36, wages: 1600000, withheld: 702000 },
    { name: "Pinecrest Janitorial Group LLC", formed: "2026-02-10", w2s: 33, wages: 1460000, withheld: 640000 },
    { name: "Southvale Event Staffing LLC", formed: "2026-03-03", w2s: 39, wages: 1730000, withheld: 760000 },
    { name: "Oakhurst Moving & Storage LLC", formed: "2026-03-24", w2s: 40, wages: 1780000, withheld: 781000 }
  ];

  // The 18 payments drawn on the network graph: the flagged one plus 17 like it.
  // [id, batch, program, payee, amount, status, account]
  var G = [
    ["PV-73194", "A1", "REF", "Marisol T. Avery", 18940, "held", "••6208"],
    ["PV-71588", "A1", "REF", "Lena M. Whitcomb", 17480, "paid", "••6219"],
    ["PV-71522", "A1", "REF", "Terrence D. Okafor", 16210, "paid", "••6203"],
    ["PV-71655", "A1", "REF", "Jasmine R. Toller", 16980, "paid", "••6231"],
    ["PV-71409", "A2", "REF", "Curtis L. Banning", 19620, "paid", "••8834"],
    ["PV-71433", "A2", "REF", "Monique A. Feld", 18170, "paid", "••8841"],
    ["PV-71640", "A4", "REF", "Rafael J. Quintero", 15920, "paid", "••5507"],
    ["PV-71702", "A4", "REF", "Kiara S. Bell", 18330, "paid", "••5519"],
    ["PV-73215", "A5", "REF", "Owen P. Strickland", 17760, "pending", "••0874"],
    ["PV-71760", "A5", "REF", "Danielle K. Marsh", 19050, "paid", "••0866"],
    ["PV-72455", "A3", "SSA", "Gloria A. Pruitt", 7640, "paid", "••3317"],
    ["PV-72460", "A3", "SSA", "Walter E. Hines", 8120, "paid", "••3322"],
    ["PV-72471", "A3", "SSA", "Doris J. Lyle", 6980, "paid", "••3309"],
    ["PV-72502", "A3", "SSA", "Eugene F. Barlow", 7310, "paid", "••3340"],
    ["PV-72488", "A6", "OPM", "Harold B. Severs", 9860, "paid", "••2246"],
    ["PV-72493", "A6", "OPM", "Ruth C. Danner", 10240, "paid", "••2251"],
    ["PV-72497", "A6", "OPM", "Leonard M. Askew", 12480, "paid", "••2263"],
    ["PV-71781", "A5", "REF", "Shayla N. Pierce", 17890, "paid", "••0881"]
  ];
  var GRAPH = G.map(function (r, i) {
    return { id: r[0], batch: r[1], program: r[2], payee: r[3], amount: r[4], state: r[5], acct: r[6], seed: i === 0 };
  });

  // ---- leads: payments the analyst works ----
  // Agencies certify payment files; Treasury verifies each payment and disburses it.
  // Pre-payment = verified before Treasury pays; post-payment = paid, flagged later.
  var LEADS = [
    // ---------------- pre-payment: verified before Treasury disburses ----------------
    { id: "PV-73194", mode: "prepay", program: "REF", payeeName: "Marisol T. Avery", city: "Carver Mill, GA", address: MAILBOX.line, bank: "Brightpath Bank", acct: "••6208", acctOpened: "2026-09-17", batch: "A1", schedule: "IRS refund schedule 26-1006-0447",
      submitted: "2026-10-06 05:40", riskScore: 92, confidence: 0.91, recommendedAction: "hold", fwaType: "Stolen-identity refund", network: "N01", amount: 18940,
      reason: "Passed Do Not Pay, account and TIN checks · account opened 19 days ago in a batch of 34 · mailbox shared with 29 other payees · W-2 from an employer formed last year",
      signals: [
        { sev: "high", label: "Account opened 19 days ago, in a batch", detail: "Brightpath Bank account ••6208 was opened 2026-09-17. 34 accounts with neighboring numbers (••6201–6248) were opened Sep 8–19, each in a different name, and 29 of them have already received federal payments.", src: "Treasury payment history" },
        { sev: "high", label: "Mailbox shared with 29 other payees", detail: "2210 Mill Pointe Pkwy, Ste 114 · PMB 212, Carver Mill, GA is a private mailbox at a shipping store. In 13 months, 46 federal payments to 30 different payees used it: tax refunds, Social Security benefits and federal annuities.", src: "Agency payment files · USPS mailbox list" },
        { sev: "high", label: "W-2 from an employer with no real payroll", detail: "The return's only W-2 is from Harlan Ridge Logistics LLC, formed 2025-11-04 at the same mailbox. Harlan Ridge issued 38 W-2s; the tax it reports withholding was never deposited.", src: "OpenCorporates · IRS return flag" },
        { sev: "med", label: "Refund 3.1× the peer median", detail: "Peer median refund for a single filer reporting $44,800 in wages: $6,100. This one is $18,940, almost all of it reported withholding.", src: "Peer comparison" },
        { sev: "low", label: "Passed Do Not Pay", detail: "No match in the Death Master File, SSA's Numident, SAM.gov exclusions or the other Do Not Pay sources.", src: "Do Not Pay" },
        { sev: "low", label: "Account ownership and TIN verified", detail: "The account is in Marisol T. Avery's name, and the TIN is valid and matches.", src: "Account & TIN verification" }
      ] },
    { id: "PV-73215", mode: "prepay", program: "REF", payeeName: "Owen P. Strickland", city: "Carver Mill, GA", address: MAILBOX.line, bank: "Corridor Financial", acct: "••0874", acctOpened: "2026-03-14", batch: "A5", schedule: "IRS refund schedule 26-1006-0447",
      submitted: "2026-10-06 05:40", riskScore: 88, confidence: 0.87, recommendedAction: "hold", fwaType: "Stolen-identity refund", network: "N01", amount: 17760,
      reason: "Same mailbox as PV-73194 · account in a batch of 31 · W-2 from Brookfane Staffing, formed last year",
      signals: [
        { sev: "high", label: "Same mailbox as PV-73194", detail: "Uses PMB 212 in Carver Mill, GA, shared by 30 federal payees.", src: "Agency payment files" },
        { sev: "high", label: "W-2 from an employer with no real payroll", detail: "Brookfane Staffing LLC, formed 2025-11-19, same registered agent and mailbox as Harlan Ridge Logistics.", src: "OpenCorporates · IRS return flag" },
        { sev: "low", label: "Passed Do Not Pay, account and TIN checks", detail: "No list matches; account in the payee's name.", src: "Do Not Pay · Account & TIN verification" }
      ] },
    { id: "PV-73177", mode: "prepay", program: "VEN", payeeName: "Coastal Federal Supply Co.", city: "Norfolk, VA", address: "Remit-to on file since 2019", bank: "Harbor Pointe Bank", acct: "••4410", acctOpened: "2026-10-01", batch: null, schedule: "GSA vendor schedule 26-1006-0112",
      submitted: "2026-10-06 07:15", riskScore: 94, confidence: 0.93, recommendedAction: "deny", fwaType: "Vendor bank change", network: "N03", amount: 412800,
      reason: "Remit-to account changed 2 days before payment · account ownership doesn't match the vendor",
      signals: [
        { sev: "high", label: "Account ownership doesn't match", detail: "The new account at Harbor Pointe Bank belongs to “CFS Holdings Group”, not Coastal Federal Supply Co.", src: "Account & TIN verification" },
        { sev: "high", label: "Bank account changed 2 days ago", detail: "The vendor's remit-to account, unchanged since 2019, was changed on 2026-10-04 after an emailed request.", src: "Vendor master file" },
        { sev: "med", label: "Same new bank as 3 other vendor changes", detail: "Three other vendors changed their accounts to Harbor Pointe Bank this month.", src: "Treasury payment history" }
      ] },
    { id: "PV-73151", mode: "prepay", program: "SSA", payeeName: "Ernest W. Dobbins", city: "Macon, GA", address: "On file", bank: "First Piedmont Bank", acct: "••1182", acctOpened: "2009-04-02", batch: null, schedule: "SSA benefit schedule 26-1006-2210",
      submitted: "2026-10-06 04:10", riskScore: 97, confidence: 0.98, recommendedAction: "deny", fwaType: "Deceased payee", network: null, amount: 2140,
      reason: "Payee died 2026-08-30 per SSA's Numident · caught by Do Not Pay",
      signals: [{ sev: "high", label: "Payee deceased", detail: "SSA's Numident lists a date of death of 2026-08-30. The payment goes back to the agency.", src: "Do Not Pay · Numident" }] },
    { id: "PV-73233", mode: "prepay", program: "VAB", payeeName: "Marcus D. Ellery", city: "Fayetteville, NC", address: "Address changed 2026-09-22", bank: "Navy Federal Credit Union", acct: "••7763", acctOpened: "2026-09-20", batch: null, schedule: "VA benefit schedule 26-1006-0381",
      submitted: "2026-10-06 04:55", riskScore: 41, confidence: 0.84, recommendedAction: "pay", fwaType: "New account · verified", network: null, amount: 1906,
      reason: "New account and address, changed through VA.gov with a verified sign-in · nothing shared with other payees",
      signals: [
        { sev: "med", label: "New account and address", detail: "Account and address changed in September.", src: "Agency payment files" },
        { sev: "low", label: "Change made by the veteran", detail: "Changed through VA.gov with a verified sign-in; the account is in the veteran's name and shared with no other payee.", src: "VA change log · Account verification" }
      ] },
    { id: "PV-73226", mode: "prepay", program: "OPM", payeeName: "Patricia L. Gaines", city: "Columbia, SC", address: "On file", bank: "Palmetto State Credit Union", acct: "••5021", acctOpened: "2004-06-14", batch: null, schedule: "OPM annuity schedule 26-1006-0090",
      submitted: "2026-10-06 04:30", riskScore: 12, confidence: 0.95, recommendedAction: "pay", fwaType: "Routine", network: null, amount: 3120,
      reason: "Same account for 22 years · no changes · passed every check",
      signals: [{ sev: "low", label: "Verified", detail: "Same account and address for years; passed Do Not Pay, account and TIN checks.", src: "Do Not Pay · Account verification" }] },
    { id: "PV-73240", mode: "prepay", program: "REF", payeeName: "Daniel R. Okoye", city: "Atlanta, GA", address: "On file", bank: "Regional Bank of Georgia", acct: "••9034", acctOpened: "2015-03-02", batch: null, schedule: "IRS refund schedule 26-1006-0451",
      submitted: "2026-10-06 05:45", riskScore: 8, confidence: 0.96, recommendedAction: "pay", fwaType: "Routine", network: null, amount: 2480,
      reason: "Long-held account · refund in line with peers · passed every check",
      signals: [{ sev: "low", label: "Verified", detail: "Refund in line with reported wages; account held since 2015; passed every check.", src: "Do Not Pay · Account verification · Peer comparison" }] },

    // ---------------- post-payment: paid, flagged for review ----------------
    { id: "PV-71588", mode: "retrospective", program: "REF", payeeName: "Lena M. Whitcomb", city: "Carver Mill, GA", address: MAILBOX.line, bank: "Brightpath Bank", acct: "••6219", acctOpened: "2026-09-11", batch: "A1", schedule: "IRS refund schedule 26-0922-0318",
      submitted: "2026-09-22 05:40", paidDate: "2026-09-23", riskScore: 90, confidence: 0.9, recommendedAction: "confirm", fwaType: "Stolen-identity refund", network: "N01", amount: 17480, status: "Under review", assignee: "Dana Whitmore",
      reason: "Same mailbox and account batch as PV-73194 · already paid · the real Lena Whitcomb filed her own return in August",
      signals: [
        { sev: "high", label: "Same mailbox and account batch as PV-73194", detail: "PMB 212 in Carver Mill, GA, and Brightpath Bank account ••6219, in the same batch of 34 as ••6208.", src: "Agency payment files · Treasury payment history" },
        { sev: "high", label: "The real taxpayer filed separately", detail: "A second return under the same SSN, from the taxpayer's long-time Ohio address, was filed in August and is waiting on the duplicate.", src: "IRS return flag" },
        { sev: "high", label: "W-2 from Harlan Ridge Logistics", detail: "Same employer as PV-73194: formed 2025-11-04 at the mailbox, no tax deposits behind its W-2s.", src: "OpenCorporates · IRS return flag" },
        { sev: "low", label: "Passed Do Not Pay, account and TIN checks", detail: "Every list check passed when it was paid.", src: "Do Not Pay · Account & TIN verification" }
      ] },
    { id: "PV-72455", mode: "retrospective", program: "SSA", payeeName: "Gloria A. Pruitt", city: "Augusta, GA", address: MAILBOX.line, bank: "Lumen Direct", acct: "••3317", acctOpened: "2026-05-12", batch: "A3", schedule: "SSA benefit schedules · Jun–Sep 2026",
      submitted: "2026-06-03 04:10", paidDate: "2026-06-03 → 09-03", riskScore: 93, confidence: 0.92, recommendedAction: "confirm", fwaType: "Benefit redirection", network: "N01", amount: 7640, status: "Assigned", assignee: "Dana Whitmore",
      reason: "Direct deposit changed by phone to a network account · 4 payments redirected · beneficiary reported non-receipt",
      signals: [
        { sev: "high", label: "Deposit redirected to a network account", detail: "On 2026-05-28 a phone call changed Ms. Pruitt's direct deposit from her credit union of 19 years to Lumen Direct ••3317, opened 16 days earlier in a batch of 38 (••3301–3349).", src: "SSA change log · Treasury payment history" },
        { sev: "high", label: "Mailing address moved to the mailbox", detail: "The same call changed her mailing address to PMB 212, Carver Mill, GA, the mailbox behind the flagged refunds.", src: "Agency payment files" },
        { sev: "high", label: "Beneficiary reported non-receipt", detail: "Ms. Pruitt reported the June–September payments missing on 2026-09-30.", src: "SSA non-receipt claim" },
        { sev: "med", label: "Same phone on other changes", detail: "The calling number, (470) 555-0148, made 37 direct-deposit changes across SSA and OPM payees since April.", src: "SSA and OPM change logs" }
      ] },
    { id: "PV-71522", mode: "retrospective", program: "REF", payeeName: "Terrence D. Okafor", city: "Carver Mill, GA", address: MAILBOX.line, bank: "Brightpath Bank", acct: "••6203", acctOpened: "2026-09-08", batch: "A1", schedule: "IRS refund schedule 26-0915-0207",
      submitted: "2026-09-15 05:40", paidDate: "2026-09-16", riskScore: 89, confidence: 0.88, recommendedAction: "confirm", fwaType: "Stolen-identity refund", network: "N01", amount: 16210, status: "New", assignee: null,
      reason: "Same mailbox and account batch · W-2 from Tallow Creek Services, formed last year",
      signals: [{ sev: "high", label: "Same mailbox and account batch", detail: "PMB 212 and Brightpath Bank ••6203, first account in the batch.", src: "Agency payment files · Treasury payment history" }] },
    { id: "PV-72488", mode: "retrospective", program: "OPM", payeeName: "Harold B. Severs", city: "Savannah, GA", address: MAILBOX.line, bank: "Corridor Financial", acct: "••2246", acctOpened: "2026-04-16", batch: "A6", schedule: "OPM annuity schedules · May–Aug 2026",
      submitted: "2026-05-01 04:30", paidDate: "2026-05-01 → 08-01", riskScore: 87, confidence: 0.86, recommendedAction: "confirm", fwaType: "Annuity redirection", network: "N01", amount: 9860, status: "New", assignee: null,
      reason: "Annuity redirected to a network account by a call from the same phone",
      signals: [{ sev: "high", label: "Redirected by the network's phone", detail: "Direct deposit changed on 2026-04-24 from (470) 555-0148 to Corridor Financial ••2246.", src: "OPM change log" }] },
    { id: "PV-71390", mode: "retrospective", program: "VEN", payeeName: "Ridgeline Medical Products Inc.", city: "Columbus, OH", address: "Remit-to on file since 2017", bank: "Harbor Pointe Bank", acct: "••4398", acctOpened: "2026-08-19", batch: null, schedule: "VA vendor schedule 26-0826-0044",
      submitted: "2026-08-26 07:15", paidDate: "2026-08-27", riskScore: 85, confidence: 0.84, recommendedAction: "confirm", fwaType: "Vendor bank change", network: "N03", amount: 268000, status: "Assigned", assignee: "Maria Delgado",
      reason: "Paid to a new account set up after an emailed change request · the vendor says it never asked",
      signals: [{ sev: "high", label: "Vendor didn't request the change", detail: "Ridgeline Medical Products reported non-payment; the emailed change came from a look-alike domain.", src: "Vendor master file · vendor report" }] },
    { id: "PV-71733", mode: "retrospective", program: "SSA", payeeName: "38 beneficiaries · Harbor View Assisted Living", city: "Brunswick, GA", address: "1400 Harbor View Rd, Brunswick, GA", bank: "Various", acct: "—", acctOpened: "—", batch: null, schedule: "SSA benefit schedules",
      submitted: "2026-09-03 04:10", paidDate: "2026-09-03", riskScore: 56, confidence: 0.6, recommendedAction: "dismiss", fwaType: "Shared address", network: null, amount: 61900, status: "New", assignee: null,
      reason: "38 payees share one address — looks like a mailbox ring",
      signals: [
        { sev: "med", label: "38 payees, one address", detail: "38 Social Security beneficiaries list the same street address.", src: "Agency payment files" },
        { sev: "low", label: "The address is a licensed care facility", detail: "Harbor View Assisted Living is a licensed facility; the payees are long-time beneficiaries with their own accounts, and many use a representative payee on file with SSA.", src: "State facility license · SSA representative payee file" }
      ] }
  ];
  LEADS.forEach(function (l) {
    l.uc = "treas";
    l.exposurePre = l.mode === "prepay" ? l.amount : 0;
    l.exposurePost = l.mode === "prepay" ? 0 : l.amount;
    l.status = l.status || (l.mode === "prepay" ? "Pending" : "New");
    l.source = "Both"; l.providerId = l.network === "N01" ? "CASE-T-0007" : l.id; l.claimId = null;
    l.createdDate = (l.submitted || "").slice(0, 10);
    l.prog = PROGRAMS[l.program];
    l.agency = l.prog.agency;
    l.state = (/, ([A-Z]{2})/.exec(l.city) || [0, ""])[1];
    l.batchRec = l.batch ? BATCH(l.batch) : null;
    l.payee = l.payeeName;
  });

  // ---- the network portfolio (Insights › Networks) ----
  var SCHEMES = {
    refund: { label: "Stolen-identity refunds", short: "Refunds", hub: "Organizer / preparer", spoke: "Account batches", color: "#c6362f" },
    redirect: { label: "Benefit & annuity redirection", short: "Redirection", hub: "Organizer", spoke: "Account batches", color: "#8a3ffc" },
    vendor: { label: "Vendor bank-change fraud", short: "Vendor change", hub: "Impersonator", spoke: "Receiving accounts", color: "#b5730e" },
    mule: { label: "Mule account clusters", short: "Mule accounts", hub: "Recruiter", spoke: "Account clusters", color: "#0043ce" }
  };
  var SCHEME_ORDER = ["refund", "redirect", "vendor", "mule"];
  // atRisk: paid + pending payments matching the network's pattern over 13 months.
  // payees: distinct payees on those payments.
  var NETS = [
    { id: "N01", core: true, scheme: "refund", name: "Delmont network", states: ["GA", "SC", "AL", "TN"], programs: ["REF", "SSA", "OPM"], atRisk: 7400000, payees: 386, payments: 936, status: "Under review", risk: 92,
      spokes: BATCHES.map(function (b) { return b.bank + " " + b.range; }) },
    { id: "N02", scheme: "redirect", name: "Plains direct-deposit ring", states: ["TX", "OK"], programs: ["SSA", "OPM"], atRisk: 4800000, payees: 212, status: "New", risk: 84, spokes: ["Lumen Direct ••7710–7744", "Statewide Prepaid ••0420–0461"] },
    { id: "N03", scheme: "vendor", name: "Look-alike domain vendor changes", states: ["OH", "VA", "PA", "FL"], programs: ["VEN"], atRisk: 14200000, payees: 41, status: "Case open", risk: 90, spokes: ["Harbor Pointe Bank ••4390–4415", "Gulfline Bank ••7702", "Keystate Savings ••3318"] },
    { id: "N04", scheme: "refund", name: "Ridgeway mailbox ring", states: ["FL", "GA"], programs: ["REF"], atRisk: 9100000, payees: 472, status: "Under review", risk: 89, spokes: ["Brightpath Bank ••6249–6290", "Corridor Financial ••0900–0937", "Bayside Online ••1150–1188"] },
    { id: "N05", scheme: "mule", name: "Fintech mule cluster", states: ["NV", "AZ", "CA"], programs: ["REF", "VAB"], atRisk: 5300000, payees: 248, status: "New", risk: 81, spokes: ["Lumen Direct ••9001–9060", "Brightpath Bank ••4410–4442"] },
    { id: "N06", scheme: "refund", name: "Tristate preparer ring", states: ["NJ", "NY", "PA"], programs: ["REF"], atRisk: 9400000, payees: 503, status: "Case open", risk: 88, spokes: ["Garden State Online ••2201–2266", "Hudson Direct ••5530–5571", "Keystate Savings ••8810–8838"] },
    { id: "N07", scheme: "redirect", name: "Gulf Coast annuity redirects", states: ["TX", "LA", "MS"], programs: ["OPM", "SSA", "VAB"], atRisk: 6200000, payees: 241, status: "Under review", risk: 87, spokes: ["Corridor Financial ••2273–2310", "Gulfline Bank ••6650–6690"] },
    { id: "N08", scheme: "refund", name: "Valley refund ring", states: ["CA", "AZ"], programs: ["REF"], atRisk: 7700000, payees: 398, status: "New", risk: 85, spokes: ["Bayside Online ••3302–3349", "Mesa Direct ••7120–7151"] },
    { id: "N09", scheme: "vendor", name: "Grant vendor impersonation", states: ["MD", "DC"], programs: ["VEN"], atRisk: 4400000, payees: 17, status: "Referred to OIG", risk: 86, spokes: ["Capital Pointe Bank ••0912", "Harbor Pointe Bank ••4420"] },
    { id: "N10", scheme: "mule", name: "Prepaid card cluster", states: ["IL", "MO", "IN"], programs: ["REF", "SSA"], atRisk: 8100000, payees: 377, status: "New", risk: 83, spokes: ["Statewide Prepaid ••5100–5179", "Lakeshore Direct ••2210–2244"] },
    { id: "N11", scheme: "refund", name: "Lakeshore refund ring", states: ["IL", "IN"], programs: ["REF"], atRisk: 5600000, payees: 289, status: "Under review", risk: 84, spokes: ["Lakeshore Direct ••6601–6640", "Corridor Financial ••0410–0446"] },
    { id: "N12", scheme: "redirect", name: "Veterans benefit redirects", states: ["NC", "VA"], programs: ["VAB"], atRisk: 3900000, payees: 164, status: "New", risk: 82, spokes: ["Lumen Direct ••8840–8871", "Bayside Online ••9930–9952"] },
    { id: "N13", scheme: "refund", name: "Piedmont W-2 mill", states: ["NC", "SC"], programs: ["REF"], atRisk: 8900000, payees: 451, status: "New", risk: 86, spokes: ["Brightpath Bank ••1301–1350", "Mesa Direct ••4402–4436"] },
    { id: "N14", scheme: "mule", name: "Rideshare driver mule recruiting", states: ["GA", "FL", "TX"], programs: ["REF", "SSA"], atRisk: 5400000, payees: 263, status: "New", risk: 80, spokes: ["Brightpath Bank ••9701–9748", "Lumen Direct ••0101–0133"] }
  ];
  // Cross-network links: the same account batch, phone, mailbox, domain or recruiter
  // turning up in two networks — usually paid by different agencies.
  var BRIDGES = [
    { a: "N01", b: "N04", type: "Same account batch", detail: "Brightpath Bank accounts ••6249–6290 run straight on from Delmont's batch ••6201–6248, opened the same week, and receive refunds for the Ridgeway mailbox ring in Florida." },
    { a: "N01", b: "N07", type: "Same phone", detail: "(470) 555-0148, the number that changed Gloria Pruitt's direct deposit, also changed 120 annuity and benefit deposits for the Gulf Coast ring." },
    { a: "N04", b: "N14", type: "Same recruiter", detail: "Account holders in both networks answered the same “earn $500 a deposit” posting." },
    { a: "N03", b: "N09", type: "Same look-alike domain", detail: "Both networks' change requests came from look-alike domains registered on the same day by the same registrant." },
    { a: "N06", b: "N13", type: "Same W-2 employers", detail: "Four employers on the Tristate ring's returns also appear on the Piedmont W-2 mill's." },
    { a: "N05", b: "N10", type: "Same devices", detail: "The same three devices enrolled accounts in both clusters, per the banks' responses to reclamation requests." }
  ];
  var AVG = { refund: 18000, redirect: 2200, vendor: 260000, mule: 9000 };
  var PLAN = { fys: "Sep 2025 – Oct 2026", states: 23, minutesPerPayment: 15 };
  NETS.forEach(function (n) {
    n.payments = n.payments || Math.round(n.atRisk / AVG[n.scheme]);
    n.agencies = n.programs.map(function (p) { return PROGRAMS[p].agency; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; });
    n.crossAgency = n.agencies.length > 1;
    n.crossState = n.states.length > 1;
  });

  function rng(seed) { var x = seed; return function () { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; }
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483647; return h; }

  // ---- payment flow (Insights › Payment flow) ----
  var FLOW = {
    tiers: [
      { k: "agency", t: "Certifying agencies", s: "IRS · SSA · OPM · VA · vendor payments", n: "certify payment files", seen: "partial" },
      { k: "treasury", t: "Treasury · Fiscal Service", s: "verifies and disburses for the agencies", n: "1.1B+ payments · ~$3.7T in FY2026", seen: "full" },
      { k: "bank", t: "Banks & credit unions", s: "receive the deposits", n: "deposit accounts", seen: "none" },
      { k: "payee", t: "Payees", s: "people · businesses", n: "names · TINs · addresses", seen: "partial" }
    ]
  };

  var TREAS = {
    PROGRAMS: PROGRAMS, AGENCIES: AGENCIES, MAILBOX: MAILBOX, OPERATOR: OPERATOR, BATCHES: BATCHES, EMPLOYERS: EMPLOYERS, GRAPH: GRAPH, LEADS: LEADS,
    SCHEMES: SCHEMES, SCHEME_ORDER: SCHEME_ORDER, NETS: NETS, BRIDGES: BRIDGES, PLAN: PLAN, FLOW: FLOW,
    SEED: "PV-73194", THREAD: "PV-71588", DECISION: "PV-72455", SEED_AMOUNT: 18940, PEER_MEDIAN: 6100,
    // one morning's verification run (illustrative)
    INTAKE: { payments: 4380000, amount: 14600000000, fastLane: 0.9996, held: 1240 },
    batch: BATCH,
    lead: function (id) { return LEADS.filter(function (l) { return l.id === id; })[0] || null; },
    net: function (id) { return NETS.filter(function (n) { return n.id === id; })[0] || null; },
    stats: function () {
      var sum = function (k) { return NETS.reduce(function (t, n) { return t + n[k]; }, 0); };
      var cross = NETS.filter(function (n) { return n.crossAgency; }).length;
      return { networks: NETS.length, atRisk: sum("atRisk"), payments: sum("payments"), payees: sum("payees"), cross: cross, crossPct: Math.round(cross / NETS.length * 100) };
    },
    linked: function (id) {
      var ids = {}; ids[id] = 1;
      BRIDGES.forEach(function (b) { if (b.a === id) ids[b.b] = 1; if (b.b === id) ids[b.a] = 1; });
      return NETS.filter(function (n) { return ids[n.id]; });
    },
    // one held payment → the mailbox → the network → networks linked to it → every network
    funnel: function () {
      var home = TREAS.net("N01"), linked = TREAS.linked("N01"), S = TREAS.stats();
      var lsum = function (k) { return linked.reduce(function (t, n) { return t + n[k]; }, 0); };
      return [
        { key: "reg", label: "One held payment", amount: TREAS.SEED_AMOUNT, detail: "PV-73194 · passed every list check", count: "1 payment" },
        { key: "store", label: "Same mailbox", amount: MAILBOX.amount, detail: MAILBOX.payments + " payments · " + MAILBOX.payees + " payees · 3 agencies", count: MAILBOX.payees + " payees" },
        { key: "network", label: "Its network", amount: home.atRisk, detail: OPERATOR.batches + " account batches · 3 banks · 3 agencies", count: home.payees + " payees" },
        { key: "linked", label: "Networks linked to it", amount: lsum("atRisk"), detail: linked.length + " networks · an account batch and a phone", count: lsum("payees").toLocaleString() + " payees" },
        { key: "all", label: "Same patterns, every network", amount: S.atRisk, detail: S.networks + " networks · " + PLAN.states + " states · 4 scheme types", count: S.payees.toLocaleString() + " payees" }
      ];
    },
    fullGraph: function () {
      var nodes = [], links = [];
      NETS.forEach(function (n) {
        var r = rng(hash(n.id)), hub = "H-" + n.id;
        nodes.push({ id: hub, kind: "hub", net: n.id, name: n.name, scheme: n.scheme, atRisk: n.atRisk, core: !!n.core });
        n.spokes.forEach(function (s, i) {
          var sid = n.id + "-S" + i;
          nodes.push({ id: sid, kind: "spoke", net: n.id, name: s, risk: Math.max(55, n.risk - Math.floor(r() * 18)) });
          links.push({ source: hub, target: sid, kind: "hub" });
        });
        var dots = 5 + Math.floor(r() * 5);
        for (var d = 0; d < dots; d++) {
          var did = n.id + "-R" + d, k = 1 + (r() < 0.45 ? 1 : 0), start = Math.floor(r() * n.spokes.length);
          nodes.push({ id: did, kind: "reg", net: n.id });
          for (var j = 0; j < Math.min(k, n.spokes.length); j++) links.push({ source: did, target: n.id + "-S" + ((start + j) % n.spokes.length), kind: "reg", net: n.id });
        }
      });
      BRIDGES.forEach(function (b) { links.push({ source: "H-" + b.a, target: "H-" + b.b, kind: "bridge", type: b.type, detail: b.detail }); });
      return { nodes: nodes, links: links };
    }
  };
  window.TREAS = TREAS;
})();
