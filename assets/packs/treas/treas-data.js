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
  var OPERATOR = { name: "Delmont network", preparer: "Delmont Tax & Business Services", officer: "R. T. Delmont", agent: "Sentinel Registered Agents LLC", phone: "(470) 555-0148", accounts: 386, batches: 9, banks: 3, banksText: "3 online banks + 1 prepaid-card issuer" };
  // account batches: runs of neighboring account numbers opened within days, one per stolen or borrowed identity
  var BATCHES = [
    { id: "A1", bank: "Brightpath Bank", range: "••6201–6248", accts: 34, opened: "Sep 8–19, 2026", role: "Refund accounts", risk: 92, payments: 41 },
    { id: "A2", bank: "Brightpath Bank", range: "••8830–8859", accts: 22, opened: "Feb 2–11, 2026", role: "Refund accounts", risk: 89, payments: 27 },
    { id: "A3", bank: "Lumen Direct", range: "••3301–3349", accts: 38, opened: "May 4–15, 2026", role: "Benefit redirects", risk: 91, payments: 166 },
    { id: "A4", bank: "Lumen Direct", range: "••5502–5538", accts: 27, opened: "Jan 20–30, 2026", role: "Refund accounts", risk: 87, payments: 31 },
    { id: "A5", bank: "Corridor Financial", range: "••0861–0899", accts: 31, opened: "Mar 9–18, 2026", role: "Refund accounts", risk: 86, payments: 35 },
    { id: "A6", bank: "Corridor Financial", range: "••2240–2272", accts: 24, opened: "Apr 13–22, 2026", role: "Annuity redirects", risk: 88, payments: 112 },
    { id: "A7", bank: "Statewide Prepaid", range: "••4410–4448", accts: 39, opened: "Jun 1–12, 2026", role: "Refund cards", risk: 85, payments: 44 }
  ];
  // where the stolen identities came from: they cluster on one source, which points at an insider
  var VICTIMS = { source: "Carver Mill Family Clinic", count: 312, of: 386, years: "2022–24", text: "312 of the 386 payees were patients of Carver Mill Family Clinic between 2022 and 2024. Identities that cluster on one source usually mean one insider." };
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

  // The 20 payments drawn on the network graph: the flagged one plus 19 like it.
  // Two identities appear twice, on different accounts (see IDENTITY).
  // [id, batch, program, payee, amount, status, account]
  var G = [
    ["PV-73194", "A1", "REF", "Anna Reed", 18940, "held", "••6208"],
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
    ["PV-71781", "A5", "REF", "Shayla N. Pierce", 17890, "paid", "••0881"],
    ["PV-71824", "A2", "REF", "Owen P. Strickland", 16840, "paid", "••8852"],
    ["PV-71915", "A7", "REF", "Felix A. Moreno", 15480, "paid", "••4421"],
    ["PV-72466", "A3", "SSA", "Terrence D. Okafor", 9140, "paid", "••3328"]
  ];
  // People on the graph who aren't who the payment says: found by TrackLight, not
  // by Do Not Pay. Same name on two payments = the same identity on two accounts.
  var IDENTITY = {
    "Owen P. Strickland": { status: "deceased", label: "Deceased", note: "Died 2026-09-14 · obituary found by TrackLight · not yet in the Death Master File" },
    "Terrence D. Okafor": { status: "custody", label: "In custody", note: "In Georgia state custody since Jan 2026 (court record) · Do Not Pay checks federal prisons only · SSA benefits should be suspended" },
    "Anna Reed": { status: "stolen", label: "ID stolen", note: "Lives in Dayton, OH · her identity is being used without her" },
    "Lena M. Whitcomb": { status: "stolen", label: "ID stolen", note: "Lives in Toledo, OH · filed her own return separately" }
  };
  var GRAPH = G.map(function (r, i) {
    return { id: r[0], batch: r[1], program: r[2], payee: r[3], amount: r[4], state: r[5], acct: r[6], seed: i === 0 };
  });

  // ---- leads: payments the analyst works ----
  // Agencies certify payment files; Treasury verifies each payment and disburses it.
  // Pre-payment = verified before Treasury pays; post-payment = paid, flagged later.
  var LEADS = [
    // ---------------- pre-payment: verified before Treasury disburses ----------------
    { id: "PV-73194", mode: "prepay", program: "REF", payeeName: "Anna Reed", city: "Carver Mill, GA", address: MAILBOX.line, bank: "Brightpath Bank", acct: "••6208", acctOpened: "2026-09-17", batch: "A1", schedule: "IRS refund schedule 26-1006-0447",
      submitted: "2026-10-06 05:40", riskScore: 92, confidence: 0.91, recommendedAction: "hold", fwaType: "Stolen-identity refund", network: "N01", amount: 18940,
      reason: "Passed Do Not Pay, account and TIN checks · account opened 19 days ago in a batch of 34 · mailbox shared with 29 other payees · W-2 from an employer formed last year",
      signals: [
        { sev: "high", label: "Account opened 19 days ago, in a batch", detail: "Brightpath Bank account ••6208 was opened 2026-09-17. 34 accounts with neighboring numbers (••6201–6248) were opened Sep 8–19, each in a different name, and 29 of them have already received federal payments.", src: "Treasury payment history", lane: "treas" },
        { sev: "high", label: "Mailbox shared with 29 other payees", detail: "2210 Mill Pointe Pkwy, Ste 114 · PMB 212, Carver Mill, GA is a private mailbox at a shipping store. In 13 months, 46 federal payments to 30 different payees used it: tax refunds, Social Security benefits and federal annuities.", src: "Agency payment files · USPS mailbox list", lane: "treas" },
        { sev: "high", label: "W-2 from an employer with no real payroll", detail: "The return's only W-2 is from Harlan Ridge Logistics LLC, formed 2025-11-04 at the same mailbox. Harlan Ridge issued 38 W-2s; the tax it reports withholding was never deposited.", src: "OpenCorporates · IRS return flag", lane: "irs" },
        { sev: "high", label: "Mailbox flagged by SSA", detail: "On Oct 1, SSA flagged Gloria A. Pruitt: a phone call had moved her benefit to a new account and her mail to PMB 212. Treasury matched the flag to this mailbox, where the refund is going.", src: "SSA · SIG-SSA-0412", lane: "flag" },
        { sev: "high", label: "The identity lives in Ohio, not Georgia", detail: "Anna Reed has lived in Dayton, OH for 11 years, with no tie to Carver Mill, GA or to the employer on the W-2. Someone else is using her identity.", src: "PIPL", lane: "tl" },
        { sev: "med", label: "Refund 3.1× the peer median", detail: "Peer median refund for a single filer reporting $44,800 in wages: $6,100. This one is $18,940, almost all of it reported withholding.", src: "Peer comparison", lane: "treas" },
        { sev: "low", label: "Passed Do Not Pay", detail: "No match in any Do Not Pay source: death, debarment, debt, incarceration.", src: "Do Not Pay", lane: "dnp" },
        { sev: "low", label: "Account ownership and TIN verified", detail: "The account is in Anna Reed's name, and the TIN is valid and matches.", src: "Account & TIN verification", lane: "dnp" }
      ] },
    { id: "PV-73215", mode: "prepay", program: "REF", payeeName: "Owen P. Strickland", city: "Carver Mill, GA", address: MAILBOX.line, bank: "Corridor Financial", acct: "••0874", acctOpened: "2026-03-14", batch: "A5", schedule: "IRS refund schedule 26-1006-0447",
      submitted: "2026-10-06 05:40", riskScore: 88, confidence: 0.87, recommendedAction: "hold", fwaType: "Stolen-identity refund", network: "N01", amount: 17760,
      reason: "Same mailbox as PV-73194 · account in a batch of 31 · W-2 from Brookfane Staffing, formed last year",
      signals: [
        { sev: "high", label: "Payee died on Sep 14", detail: "An obituary for Owen P. Strickland ran in Macon, GA on 2026-09-16. The death isn't in the Death Master File yet, so Do Not Pay passed.", src: "obituaries · OSINT", lane: "tl" },
        { sev: "high", label: "Same mailbox as PV-73194", detail: "Uses PMB 212 in Carver Mill, GA, shared by 30 federal payees.", src: "Agency payment files", lane: "treas" },
        { sev: "high", label: "W-2 from an employer with no real payroll", detail: "Brookfane Staffing LLC, formed 2025-11-19, same registered agent and mailbox as Harlan Ridge Logistics.", src: "OpenCorporates · IRS return flag", lane: "irs" },
        { sev: "low", label: "Passed Do Not Pay, account and TIN checks", detail: "No list matches; account in the payee's name.", src: "Do Not Pay · Account & TIN verification", lane: "dnp" }
      ] },
    { id: "PV-73177", mode: "prepay", program: "VEN", payeeName: "Coastal Federal Supply Co.", city: "Norfolk, VA", address: "Remit-to on file since 2019", bank: "Harbor Pointe Bank", acct: "••4410", acctOpened: "2026-10-01", batch: null, schedule: "GSA vendor schedule 26-1006-0112",
      submitted: "2026-10-06 07:15", riskScore: 94, confidence: 0.93, recommendedAction: "deny", fwaType: "Vendor bank change", network: "N03", amount: 412800,
      reason: "Remit-to account changed 2 days before payment · account ownership doesn't match the vendor",
      signals: [
        { sev: "high", label: "Account ownership doesn't match", detail: "The new account at Harbor Pointe Bank belongs to “CFS Holdings Group”, not Coastal Federal Supply Co.", src: "Account & TIN verification", lane: "dnp" },
        { sev: "high", label: "Bank account changed 2 days ago", detail: "The vendor's remit-to account, unchanged since 2019, was changed on 2026-10-04 after an emailed request.", src: "Vendor master file", lane: "file" },
        { sev: "med", label: "Same new bank as 3 other vendor changes", detail: "Three other vendors changed their accounts to Harbor Pointe Bank this month.", src: "Treasury payment history", lane: "treas" }
      ] },
    { id: "PV-73151", mode: "prepay", program: "SSA", payeeName: "Ernest W. Dobbins", city: "Macon, GA", address: "On file", bank: "First Piedmont Bank", acct: "••1182", acctOpened: "2009-04-02", batch: null, schedule: "SSA benefit schedule 26-1006-2210",
      submitted: "2026-10-06 04:10", riskScore: 97, confidence: 0.98, recommendedAction: "deny", fwaType: "Deceased payee", network: null, amount: 2140,
      reason: "Payee died 2026-08-30 per SSA's Numident · caught by Do Not Pay",
      signals: [{ sev: "high", label: "Payee deceased", detail: "SSA's Numident lists a date of death of 2026-08-30. The payment goes back to the agency.", src: "Do Not Pay · Numident", lane: "dnp" }] },
    { id: "PV-73233", mode: "prepay", program: "VAB", payeeName: "Marcus D. Ellery", city: "Fayetteville, NC", address: "Address changed 2026-09-22", bank: "Navy Federal Credit Union", acct: "••7763", acctOpened: "2026-09-20", batch: null, schedule: "VA benefit schedule 26-1006-0381",
      submitted: "2026-10-06 04:55", riskScore: 41, confidence: 0.84, recommendedAction: "pay", fwaType: "New account · verified", network: null, amount: 1906,
      reason: "New account and address, changed through VA.gov with a verified sign-in · nothing shared with other payees",
      signals: [
        { sev: "med", label: "New account and address", detail: "Account and address changed in September.", src: "Agency payment files", lane: "file" },
        { sev: "low", label: "VA says the veteran made the change", detail: "VA flagged the change itself: made through VA.gov with a verified sign-in. The account is in the veteran's name and shared with no other payee.", src: "VA · SIG-VA-0931", lane: "flag" }
      ] },
    { id: "PV-73226", mode: "prepay", program: "OPM", payeeName: "Patricia L. Gaines", city: "Columbia, SC", address: "On file", bank: "Palmetto State Credit Union", acct: "••5021", acctOpened: "2004-06-14", batch: null, schedule: "OPM annuity schedule 26-1006-0090",
      submitted: "2026-10-06 04:30", riskScore: 12, confidence: 0.95, recommendedAction: "pay", fwaType: "Routine", network: null, amount: 3120,
      reason: "Same account for 22 years · no changes · passed every check",
      signals: [{ sev: "low", label: "Verified", detail: "Same account and address for years; passed Do Not Pay, account and TIN checks.", src: "Do Not Pay · Account verification", lane: "dnp" }] },
    { id: "PV-73240", mode: "prepay", program: "REF", payeeName: "Daniel R. Okoye", city: "Atlanta, GA", address: "On file", bank: "Regional Bank of Georgia", acct: "••9034", acctOpened: "2015-03-02", batch: null, schedule: "IRS refund schedule 26-1006-0451",
      submitted: "2026-10-06 05:45", riskScore: 8, confidence: 0.96, recommendedAction: "pay", fwaType: "Routine", network: null, amount: 2480,
      reason: "Long-held account · refund in line with peers · passed every check",
      signals: [{ sev: "low", label: "Verified", detail: "Refund in line with reported wages; account held since 2015; passed every check.", src: "Do Not Pay · Account verification · Peer comparison", lane: "dnp" }] },

    // ---------------- post-payment: paid, flagged for review ----------------
    { id: "PV-71588", mode: "retrospective", program: "REF", payeeName: "Lena M. Whitcomb", city: "Carver Mill, GA", address: MAILBOX.line, bank: "Brightpath Bank", acct: "••6219", acctOpened: "2026-09-11", batch: "A1", schedule: "IRS refund schedule 26-0922-0318",
      submitted: "2026-09-22 05:40", paidDate: "2026-09-23", riskScore: 90, confidence: 0.9, recommendedAction: "confirm", fwaType: "Stolen-identity refund", network: "N01", amount: 17480, status: "Under review", assignee: "Dana Whitmore",
      reason: "Same mailbox and account batch as PV-73194 · already paid · the real Lena Whitcomb filed her own return in August",
      signals: [
        { sev: "high", label: "Same mailbox and account batch as PV-73194", detail: "PMB 212 in Carver Mill, GA, and Brightpath Bank account ••6219, in the same batch of 34 as ••6208.", src: "Agency payment files · Treasury payment history", lane: "treas" },
        { sev: "high", label: "IRS flagged a duplicate return", detail: "On Oct 2, IRS flagged a second return under the same SSN, filed in August from the taxpayer's long-time Ohio address and waiting on this one.", src: "IRS · SIG-IRS-2207", lane: "flag" },
        { sev: "high", label: "W-2 from Harlan Ridge Logistics", detail: "Same employer as PV-73194: formed 2025-11-04 at the mailbox, no tax deposits behind its W-2s.", src: "OpenCorporates · IRS return flag", lane: "irs" },
        { sev: "low", label: "Passed Do Not Pay, account and TIN checks", detail: "Every list check passed when it was paid.", src: "Do Not Pay · Account & TIN verification", lane: "dnp" }
      ] },
    { id: "PV-72455", mode: "retrospective", program: "SSA", payeeName: "Gloria A. Pruitt", city: "Augusta, GA", address: MAILBOX.line, bank: "Lumen Direct", acct: "••3317", acctOpened: "2026-05-12", batch: "A3", schedule: "SSA benefit schedules · Jun–Sep 2026",
      submitted: "2026-06-03 04:10", paidDate: "2026-06-03 → 09-03", riskScore: 93, confidence: 0.92, recommendedAction: "confirm", fwaType: "Benefit redirection", network: "N01", amount: 7640, status: "Assigned", assignee: "Dana Whitmore",
      reason: "Direct deposit changed by phone to a network account · 4 payments redirected · beneficiary reported non-receipt",
      signals: [
        { sev: "high", label: "SSA flagged a deposit changed by phone", detail: "SSA raised it on Oct 1. On 2026-05-28 a phone call changed Ms. Pruitt's direct deposit from her credit union of 19 years to Lumen Direct ••3317, opened 16 days earlier in a batch of 38 (••3301–3349).", src: "SSA · SIG-SSA-0412", lane: "flag" },
        { sev: "high", label: "Mailing address moved to the mailbox", detail: "The same call changed her mailing address to PMB 212, Carver Mill, GA, the mailbox behind the flagged refunds.", src: "Agency payment files", lane: "treas" },
        { sev: "high", label: "Beneficiary reported non-receipt", detail: "Ms. Pruitt reported the June–September payments missing on 2026-09-30.", src: "SSA · SIG-SSA-0412", lane: "flag" },
        { sev: "med", label: "Same phone on other changes", detail: "The calling number, (470) 555-0148, made 37 direct-deposit changes across SSA and OPM payees since April: 37 payees, 278 payments, $1.8M paid into network accounts.", src: "SSA and OPM change logs", lane: "treas" }
      ] },
    { id: "PV-71522", mode: "retrospective", program: "REF", payeeName: "Terrence D. Okafor", city: "Carver Mill, GA", address: MAILBOX.line, bank: "Brightpath Bank", acct: "••6203", acctOpened: "2026-09-08", batch: "A1", schedule: "IRS refund schedule 26-0915-0207",
      submitted: "2026-09-15 05:40", paidDate: "2026-09-16", riskScore: 89, confidence: 0.88, recommendedAction: "confirm", fwaType: "Stolen-identity refund", network: "N01", amount: 16210, status: "New", assignee: null,
      reason: "Same mailbox and account batch · W-2 from Tallow Creek Services, formed last year",
      signals: [
        { sev: "high", label: "Same mailbox and account batch", detail: "PMB 212 and Brightpath Bank ••6203, first account in the batch.", src: "Agency payment files · Treasury payment history", lane: "treas" },
        { sev: "high", label: "Payee in state custody", detail: "Georgia court records: Terrence D. Okafor was sentenced in January 2026 to four years and is in state custody. Do Not Pay checks federal prisons only.", src: "Enformion · UniCourt", lane: "tl" }
      ] },
    { id: "PV-72488", mode: "retrospective", program: "OPM", payeeName: "Harold B. Severs", city: "Savannah, GA", address: MAILBOX.line, bank: "Corridor Financial", acct: "••2246", acctOpened: "2026-04-16", batch: "A6", schedule: "OPM annuity schedules · May–Aug 2026",
      submitted: "2026-05-01 04:30", paidDate: "2026-05-01 → 08-01", riskScore: 87, confidence: 0.86, recommendedAction: "confirm", fwaType: "Annuity redirection", network: "N01", amount: 9860, status: "New", assignee: null,
      reason: "Annuity redirected to a network account by a call from the same phone",
      signals: [
        { sev: "high", label: "OPM flagged a disputed change", detail: "OPM raised it on Sep 29: Mr. Severs says he never asked for the April change to his deposit account.", src: "OPM · SIG-OPM-0188", lane: "flag" },
        { sev: "high", label: "Redirected by the network's phone", detail: "Direct deposit changed on 2026-04-24 from (470) 555-0148 to Corridor Financial ••2246, the number behind Gloria Pruitt's SSA change.", src: "OPM change log · SSA change log", lane: "treas" }
      ] },
    { id: "PV-71390", mode: "retrospective", program: "VEN", payeeName: "Ridgeline Medical Products Inc.", city: "Columbus, OH", address: "Remit-to on file since 2017", bank: "Harbor Pointe Bank", acct: "••4398", acctOpened: "2026-08-19", batch: null, schedule: "VA vendor schedule 26-0826-0044",
      submitted: "2026-08-26 07:15", paidDate: "2026-08-27", riskScore: 85, confidence: 0.84, recommendedAction: "confirm", fwaType: "Vendor bank change", network: "N03", amount: 268000, status: "Assigned", assignee: "Maria Delgado",
      reason: "Paid to a new account set up after an emailed change request · the vendor says it never asked",
      signals: [{ sev: "high", label: "Vendor didn't request the change", detail: "Ridgeline Medical Products reported non-payment; the emailed change came from a look-alike domain.", src: "Vendor master file · vendor report", lane: "file" }] },
    { id: "PV-71733", mode: "retrospective", program: "SSA", payeeName: "38 beneficiaries · Harbor View Assisted Living", city: "Brunswick, GA", address: "1400 Harbor View Rd, Brunswick, GA", bank: "Various", acct: "—", acctOpened: "—", batch: null, schedule: "SSA benefit schedules",
      submitted: "2026-09-03 04:10", paidDate: "2026-09-03", riskScore: 56, confidence: 0.6, recommendedAction: "dismiss", fwaType: "Shared address", network: null, amount: 61900, status: "New", assignee: null,
      reason: "38 payees share one address — looks like a mailbox ring",
      signals: [
        { sev: "med", label: "38 payees, one address", detail: "38 Social Security beneficiaries list the same street address.", src: "Agency payment files", lane: "treas" },
        { sev: "low", label: "The address is a licensed care facility", detail: "Harbor View Assisted Living is a licensed facility; the payees are long-time beneficiaries with their own accounts, and many use a representative payee on file with SSA.", src: "State facility license · SSA representative payee file", lane: "file" }
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
  // how each network's payments split across the agencies that certified them
  // (Delmont explicit; the rest proportional). pending = certified, not yet disbursed.
  var SPLIT = { N01: { IRS: { payments: 612, atRisk: 5600000, pending: 41 }, SSA: { payments: 220, atRisk: 1100000, pending: 0 }, OPM: { payments: 104, atRisk: 700000, pending: 0 } } };
  var AVG = { refund: 18000, redirect: 2200, vendor: 260000, mule: 9000 };
  var PLAN = { fys: "Sep 2025 – Oct 2026", states: 23, minutesPerPayment: 15 };
  NETS.forEach(function (n) {
    n.payments = n.payments || Math.round(n.atRisk / AVG[n.scheme]);
    if (!SPLIT[n.id]) {
      var ags = n.programs.map(function (p) { return PROGRAMS[p].agency; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; }), w = ags.map(function (a, i) { return i === 0 ? 1 : 0.45; }), tw = w.reduce(function (t, x) { return t + x; }, 0), sp = {};
      ags.forEach(function (a, i) { var pay = Math.round(n.payments * w[i] / tw); sp[a] = { payments: pay, atRisk: Math.round(n.atRisk * w[i] / tw / 1000) * 1000, pending: n.scheme === "refund" || n.scheme === "vendor" ? Math.max(1, Math.round(pay * 0.04)) : 0 }; });
      SPLIT[n.id] = sp;
    }
    n.split = SPLIT[n.id];
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

  // ---- where evidence comes from: six lanes, used everywhere evidence is shown ----
  var LANES = {
    file: { k: "file", t: "Agency file", icon: "file-certificate", c: "#4d5358", bg: "#f2f4f8", d: "What the certifying agency sent with the payment" },
    flag: { k: "flag", t: "Agency flag", icon: "inbox", c: "#0e6027", bg: "#defbe6", d: "A flag an agency raised on its own payee and shared in the common schema" },
    treas: { k: "treas", t: "Treasury history", icon: "building-bank", c: "#0043ce", bg: "#edf5ff", d: "Patterns across every payment Treasury disburses, for every agency" },
    dnp: { k: "dnp", t: "Today's checks", icon: "shield-check", c: "#525252", bg: "#f4f4f4", d: "Do Not Pay, account ownership and TIN: run on every payment today" },
    tl: { k: "tl", t: "TrackLight", icon: "radar-2", c: "#0e5a63", bg: "#e3f6f4", d: "Due diligence on who the payee and the businesses behind the payment really are" },
    irs: { k: "irs", t: "IRS return flag", icon: "receipt-tax", c: "#6929c4", bg: "#f6f2ff", d: "Flags IRS attaches to a refund: the return itself stays with IRS (26 U.S.C. § 6103)" },
    buy: { k: "buy", t: "Purchased data", icon: "shopping-cart", c: "#8a3800", bg: "#fff3e8", d: "Available to Treasury if it buys the data; not live in this demo" }
  };
  var LANE_ORDER = ["file", "flag", "treas", "dnp", "tl", "irs", "buy"];
  // checks Treasury could add by buying data (from the prep meeting): shown, not run
  var BUYABLE = [
    { t: "Income history", src: "Credit-bureau income data", text: "Would show whether the payee has any earnings record matching the W-2. Not run: data not purchased." },
    { t: "Commercial TIN check", src: "Commercial TIN-match service", text: "Would match the TIN to the name across commercial records. Not run: policy question open." }
  ];

  // ---- how the Delmont network was found: nine events over six weeks, each from one lane ----
  var DISCOVERY = [
    { d: "2026-08-27", lane: "treas", t: "Three refunds, one mailbox", x: "Treasury's payment history matched three IRS refunds paid in August to PMB 212, a private mailbox at a shipping store. Not a flag yet; a thread." },
    { d: "2026-09-02", lane: "tl", t: "Who the payees really are", x: "TrackLight identity profiles: two of the three have lived in Ohio for a decade. Neither has any tie to Georgia." },
    { d: "2026-09-11", lane: "treas", t: "Accounts opened in batches", x: "The three deposit accounts sit in a run of 34 neighboring account numbers opened within days at Brightpath Bank; 29 of them had already received federal payments." },
    { d: "2026-09-16", lane: "tl", t: "A death before the Death Master File", x: "An obituary for Owen P. Strickland, whose refund was pending. The Death Master File hadn't caught up, so Do Not Pay passed." },
    { d: "2026-09-24", lane: "irs", t: "The employers behind the W-2s", x: "IRS return flags on the batch's returns name eight employers. OpenCorporates: all formed in the last year at PMB 212, one registered agent, no contracts or payroll." },
    { d: "2026-09-29", lane: "tl", t: "The man behind the employers", x: "R. T. Delmont is the officer on six of them and runs Delmont Tax & Business Services, which has no preparer ID: a LinkedIn page, a state judgment, two tax liens and a bankruptcy." },
    { d: "2026-10-01", lane: "flag", t: "SSA's flag lands on the same mailbox and phone", x: "SSA flags Gloria Pruitt's deposit, changed by phone. The call moved her mail to PMB 212, and the number, (470) 555-0148, made 36 other SSA and OPM changes." },
    { d: "2026-10-02", lane: "tl", t: "Where the identities came from", x: VICTIMS.text },
    { d: "2026-10-06", lane: "tl", t: "Link analysis closes the loop", x: "386 payees, 936 payments, $7.4M across IRS, SSA and OPM, and the $18,940 refund is flagged before it pays. The real rings this is modeled on took investigators two years." }
  ];

  // ---- agency signals: flags agencies send Treasury in the shared format ----
  // Each agency sees only its own payees; Treasury matches the flag against every
  // agency's payments. `matched` = the payments Treasury tied it to.
  var SIGNALS = [
    { id: "SIG-SSA-0412", agency: "SSA", received: "2026-10-01 06:12", subject: "Gloria A. Pruitt", payment: "PV-72455", kind: "Direct deposit changed by phone",
      detail: "The beneficiary reports four payments missing. A phone call on 2026-05-28 changed her direct deposit to Lumen Direct ••3317 and her mailing address to PMB 212, Carver Mill, GA.",
      match: "The same mailbox receives IRS refunds, including PV-73194, and the calling number made 36 other changes.", matched: ["PV-73194", "PV-71588", "PV-72488"] },
    { id: "SIG-IRS-2207", agency: "IRS", received: "2026-10-02 05:05", subject: "Lena M. Whitcomb", payment: "PV-71588", kind: "Duplicate return filed",
      detail: "A second return under the same SSN came in from the taxpayer's long-time Ohio address. The first was already refunded.",
      match: "The refunded return used PMB 212 and Brightpath Bank ••6219, in the same account batch as PV-73194.", matched: ["PV-73194", "PV-71522"] },
    { id: "SIG-OPM-0188", agency: "OPM", received: "2026-09-29 07:40", subject: "Harold B. Severs", payment: "PV-72488", kind: "Direct deposit changed by phone",
      detail: "The annuitant disputes an April change to his deposit account.",
      match: "Changed from (470) 555-0148, the same number as Gloria Pruitt's SSA change.", matched: ["PV-72455"] },
    { id: "SIG-VA-0931", agency: "VA", received: "2026-10-03 09:18", subject: "Marcus D. Ellery", payment: "PV-73233", kind: "New account and address",
      detail: "Changed through VA.gov with a verified sign-in.", match: "No match: the account and address are shared with no other payee.", matched: [], clear: true }
  ];

  // ---- Do Not Pay sources (what Treasury runs today), grouped as DNP groups them ----
  var DNP = [
    { k: "death", t: "Death", icon: "skull", src: "American InfoSource · Death Master File · military deaths · State Dept. deaths abroad · electronic vital records" },
    { k: "debar", t: "Debarment & exclusion", icon: "ban", src: "IRS auto-revocation · Pub 78 · Form 990-N · HHS OIG exclusions · OFAC · SAM · USDA disqualified list · NPPES" },
    { k: "debt", t: "Delinquent federal debt", icon: "receipt-2", src: "CAIVRS · Treasury Offset Program" },
    { k: "prison", t: "Incarceration", icon: "lock", src: "Bureau of Prisons (federal prisons only)" },
    { k: "multi", t: "Multi-use", icon: "stack-2", src: "DNP adjudication data · PACER" }
  ];

  // ---- TrackLight due diligence: what it adds beyond Do Not Pay ----
  // Categories in display order, each with its data providers. Findings per payment
  // below; a category with no finding shows as a quiet "no adverse findings".
  var TL_GROUPS = [["Identity", "Who the payee really is"], ["Business", "The businesses behind the payment"], ["Records", "Court, debt, property and media records"], ["Risk", "Watchlists"], ["Network", "Who they're connected to"]];
  var TL_CATS = [
    { k: "deceased", g: "Identity", t: "Deceased (verified + OSINT)", src: "LexisNexis · obituaries · OSINT · public records" },
    { k: "social", g: "Identity", t: "Social media links", src: "PIPL" },
    { k: "linkedin", g: "Identity", t: "Professional network", src: "LinkedIn" },
    { k: "owners", g: "Business", t: "Beneficial ownership", src: "OpenCorporates · LexisNexis" },
    { k: "agents", g: "Business", t: "Corporate agents", src: "OpenCorporates · LexisNexis" },
    { k: "execs", g: "Business", t: "Company executives", src: "OpenCorporates · LexisNexis" },
    { k: "directors", g: "Business", t: "Directors", src: "OpenCorporates · LexisNexis" },
    { k: "nonprofit", g: "Business", t: "Non-profits", src: "IRS 990" },
    { k: "procurement", g: "Business", t: "Procurement", src: "USAspending" },
    { k: "audit", g: "Business", t: "Single audit filings", src: "Federal Audit Clearinghouse" },
    { k: "criminal", g: "Records", t: "Criminal & legal", src: "Enformion · UniCourt" },
    { k: "liens", g: "Records", t: "Debts, liens, judgements, evictions", src: "Enformion · LexisNexis" },
    { k: "bankruptcy", g: "Records", t: "Bankruptcies", src: "Enformion · LexisNexis" },
    { k: "assets", g: "Records", t: "Assets", src: "Enformion · LexisNexis" },
    { k: "news", g: "Records", t: "Negative news", src: "Perplexity" },
    { k: "russia", g: "Risk", t: "Russia or China risk", src: "Nomino Data" },
    { k: "soe", g: "Risk", t: "State-owned entities", src: "Nomino Data" },
    { k: "pep", g: "Risk", t: "Politically exposed persons", src: "Nomino Data" },
    { k: "narcotics", g: "Risk", t: "Narcotics trafficking", src: "Nomino Data" },
    { k: "network", g: "Network", t: "Network analysis", src: "TrackLight link analysis" }
  ];
  var DELMONT_TL = {
    linkedin: ["fail", "LinkedIn lists R. T. Delmont as owner of Delmont Tax & Business Services, “maximum refunds, fast”: the preparer behind the returns."],
    agents: ["fail", "Sentinel Registered Agents LLC is the agent for all 8 W-2 employers, all registered at PMB 212."],
    execs: ["fail", "R. T. Delmont is the listed officer on 6 of the 8 employers, and runs Delmont Tax & Business Services."],
    directors: ["warn", "No directors on file for any of the 8 employers."],
    nonprofit: ["pass", "Not non-profits: no Form 990 expected"],
    procurement: ["fail", "None of the 8 employers has a federal contract or award, yet they issued 300 W-2s."],
    criminal: ["warn", "Delmont Tax & Business Services: 2022 state consumer-protection judgment over client refunds it kept."],
    liens: ["warn", "Two state tax liens on Delmont Tax & Business Services (2023, 2024)."],
    bankruptcy: ["warn", "R. T. Delmont: Chapter 7 bankruptcy, 2021 (discharged)."],
    assets: ["warn", "PMB 212 is a mailbox at a shipping store, not a residence; no property in any payee's name there."],
    news: ["warn", "Local news, Mar 2025: clients say a Carver Mill tax preparer kept their refunds."],
    network: ["fail", "Tied to 385 other payees through account batches, the mailbox, the W-2 employers and one phone (Delmont network)."]
  };
  var TL = {
    "PV-73194": Object.assign({}, DELMONT_TL, {
      social: ["fail", "Anna Reed has lived in Dayton, OH for 11 years, with no tie to Carver Mill, GA or to Harlan Ridge Logistics."],
      owners: ["fail", "W-2 employer Harlan Ridge Logistics LLC, formed 2025-11-04 at PMB 212: no owner of record above 10%."] }),
    "PV-73215": Object.assign({}, DELMONT_TL, {
      deceased: ["fail", "Obituary published 2026-09-16 in Macon, GA: died 2026-09-14. Not yet in the Death Master File."],
      owners: ["fail", "W-2 employer Brookfane Staffing LLC, formed 2025-11-19 at PMB 212: no owner of record above 10%."] }),
    "PV-71588": Object.assign({}, DELMONT_TL, {
      social: ["fail", "Lena M. Whitcomb has lived in Toledo, OH for 14 years, with no tie to Carver Mill, GA."] }),
    "PV-71522": Object.assign({}, DELMONT_TL, {
      criminal: ["fail", "Georgia court record: Terrence D. Okafor was sentenced in Jan 2026 to 4 years and is in state custody. Do Not Pay's incarceration check covers federal prisons only."] }),
    "PV-72455": {
      social: ["pass", "Gloria A. Pruitt has lived in Augusta, GA for 31 years; the mailbox isn't hers"],
      network: ["fail", "The number that changed her deposit, (470) 555-0148, is listed for Delmont Tax & Business Services."] },
    "PV-72488": { network: ["fail", "Changed by (470) 555-0148, the Delmont network's phone."] },
    "PV-73177": {
      owners: ["fail", "The new account holder, CFS Holdings Group LLC, was formed in Delaware on 2026-09-22 and has no ownership tie to Coastal Federal Supply Co."],
      procurement: ["pass", "Coastal Federal Supply Co.: GSA contracts since 2019, consistent with this payment"],
      network: ["warn", "Same receiving bank as three other vendor bank changes this month."] },
    "PV-71390": {
      owners: ["fail", "The receiving account belongs to a business with no ownership tie to Ridgeline Medical Products."],
      network: ["warn", "Change request sent from a look-alike domain also used against other vendors."] }
  };

  // what agencies did with Treasury's recommendations over the last 30 days (synthetic),
  // before today's; today's hand-offs are added live
  var AGENCY_STATS = {
    IRS: { sent: 9, acted: 6, released: 2, pending: 1, usd: 148200, days: 1.8 },
    SSA: { sent: 3, acted: 2, released: 0, pending: 1, usd: 21400, days: 2.6 },
    OPM: { sent: 1, acted: 1, released: 0, pending: 0, usd: 9860, days: 3.1 },
    VA: { sent: 1, acted: 0, released: 1, pending: 0, usd: 0, days: 1.2 },
    GSA: { sent: 2, acted: 2, released: 0, pending: 0, usd: 680800, days: 0.9 }
  };

  // the shared schema packages and signals travel in (a concept, owned by the government)
  var SCHEMA = { id: "pix.recommendation/0.3", name: "Payment Integrity Exchange (PIX) v0.3", note: "Shared schema, owned by the government (concept)" };
  // who signs in to each agency's (simulated) system
  var AGENCY_USERS = {
    IRS: { name: "Renee Castillo", title: "Refund integrity reviewer", login: "rcastillo", initials: "RC" },
    SSA: { name: "Marcus Hale", title: "Payment integrity specialist", login: "mhale", initials: "MH" },
    OPM: { name: "Janet Ocampo", title: "Retirement services reviewer", login: "jocampo", initials: "JO" },
    VA: { name: "Derrick Lowe", title: "Benefits integrity reviewer", login: "dlowe", initials: "DL" },
    GSA: { name: "Alicia Brandt", title: "Vendor payments reviewer", login: "abrandt", initials: "AB" }
  };

  var TREAS = {
    PROGRAMS: PROGRAMS, AGENCIES: AGENCIES, MAILBOX: MAILBOX, OPERATOR: OPERATOR, BATCHES: BATCHES, EMPLOYERS: EMPLOYERS, GRAPH: GRAPH, LEADS: LEADS,
    SCHEMES: SCHEMES, SCHEME_ORDER: SCHEME_ORDER, NETS: NETS, BRIDGES: BRIDGES, PLAN: PLAN, FLOW: FLOW, SPLIT: SPLIT,
    IDENTITY: IDENTITY, AGENCY_STATS: AGENCY_STATS, SIGNALS: SIGNALS, DNP: DNP, VICTIMS: VICTIMS, DISCOVERY: DISCOVERY, BUYABLE: BUYABLE, TL_GROUPS: TL_GROUPS, TL_CATS: TL_CATS, TL: TL, LANES: LANES, LANE_ORDER: LANE_ORDER, SCHEMA: SCHEMA, AGENCY_USERS: AGENCY_USERS, ALERT: 75,
    signalsFor: function (id) { return SIGNALS.filter(function (s) { return s.payment === id || s.matched.indexOf(id) >= 0; }); },
    tlFor: function (id) { var f = TL[id] || {}; return TL_CATS.map(function (c) { var r = f[c.k]; return { k: c.k, g: c.g, t: c.t, src: c.src, st: r ? r[0] : "pass", text: r ? r[1] : "No adverse findings" }; }); },
    // the signal an agency sent about this very payment (not one matched to it)
    signalOn: function (id) { return SIGNALS.filter(function (x) { return x.payment === id; })[0] || null; },
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
