/* Disaster-relief pack — synthetic data for the FEMA Individuals and Households
   Program (IHP) story. Everything here is fictional: the storm, the people, the
   addresses, the accounts and the declaration numbers (real FEMA major-disaster
   numbers are DR-4xxx; these use DR-98xx/99xx so they can never match one).
   Phone numbers use the reserved 555-01xx range; SSNs are 000-00-xxxx.
   The story follows the pattern of a real prosecuted case type (an "application
   help" facilitator filing for many registrants with forged leases and taking a
   cut of each award) without modelling any real person or event.
   Attaches window.FEMA. */
(function () {
  var DECLS = {
    "DR-9921-LA": { id: "DR-9921-LA", name: "Hurricane Delphine", state: "LA", stateName: "Louisiana", incident: "2026-08-26", declared: "2026-08-28", deadline: "2026-10-27" },
    "DR-9922-MS": { id: "DR-9922-MS", name: "Hurricane Delphine", state: "MS", stateName: "Mississippi", incident: "2026-08-26", declared: "2026-08-29", deadline: "2026-10-28" },
    "DR-9877-TX": { id: "DR-9877-TX", name: "Severe Storms and Flooding", state: "TX", stateName: "Texas", incident: "2026-05-09", declared: "2026-05-14" },
    "DR-9864-FL": { id: "DR-9864-FL", name: "Severe Storms, Tornadoes and Flooding", state: "FL", stateName: "Florida", incident: "2026-03-15", declared: "2026-03-19" },
    "DR-9851-NC": { id: "DR-9851-NC", name: "Blue Ridge Flooding", state: "NC", stateName: "North Carolina", incident: "2025-11-02", declared: "2025-11-07" },
    "DR-9806-CA": { id: "DR-9806-CA", name: "Ridgeline Wildfire", state: "CA", stateName: "California", incident: "2025-09-14", declared: "2025-09-18" }
  };
  var PRIMARY = DECLS["DR-9921-LA"];

  // FY2026 IHP figures (Federal Register notices, 29 Sep 2026) — applied to
  // disasters declared on or after 1 Oct 2025.
  var PROGRAM = { haMax: 44800, onaMax: 44800, sna: 790, fy: "FY2026" };

  // ---- the facilitator network the story follows (Crescent Relief) ----
  // One operator runs four "FEMA application help" storefronts (social-media pages,
  // each with its own phone). On paper they're unrelated; in the data they share
  // collection accounts, one lease template and a fee account.
  var OPERATOR = { name: "Crescent Relief network", operator: "M. T. Larrabee", feeAcct: "••0429" };
  var STOREFRONTS = [
    { id: "S1", name: "Crescent Relief Navigators", city: "Houma", state: "LA", dr: "DR-9921-LA", phone: "(985) 555-0147", regs: 184, risk: 94 },
    { id: "S2", name: "Bayou Claim Helpers", city: "Thibodaux", state: "LA", dr: "DR-9921-LA", phone: "(985) 555-0162", regs: 151, risk: 89 },
    { id: "S3", name: "Gulf Coast Aid Assist", city: "Morgan City", state: "LA", dr: "DR-9921-LA", phone: "(985) 555-0118", regs: 139, risk: 86 },
    { id: "S4", name: "Pearl River Recovery Help", city: "Picayune", state: "MS", dr: "DR-9922-MS", phone: "(601) 555-0175", regs: 123, risk: 83 }
  ];
  var ACCOUNTS = {
    A1: { id: "A1", mask: "••8832", bank: "Bayou Community Credit Union" },
    A2: { id: "A2", mask: "••5106", bank: "Gulf Federal Savings" },
    A3: { id: "A3", mask: "••2741", bank: "Bayou Community Credit Union" },
    A4: { id: "A4", mask: "••9067", bank: "Delta Prepaid (reloadable card)" },
    A5: { id: "A5", mask: "••3318", bank: "Coastal Neighbors Bank" },
    A6: { id: "A6", mask: "••6650", bank: "Delta Prepaid (reloadable card)" }
  };
  var LANDLORDS = {
    L1: { id: "L1", name: "Fontenot Rentals LLC", signer: "J. R. Fontenot", regs: 61, owns: 0 },
    L2: { id: "L2", name: "Bayou Terrace Properties", signer: "D. Landry", regs: 52, owns: 1 },
    L3: { id: "L3", name: "Pearl River Leasing", signer: "S. Ladner", regs: 27, owns: 0 }
  };

  // The 18 registrations drawn on the network graph: the flagged one plus 17 like it.
  // [id, storefront, account, landlord, registrant, damaged address, amount, state]
  var G = [
    ["R-104417", "S1", "A1", "L1", "Kendra L. Batiste", "418 Cypress Bend Rd, Houma", 17280, "held"],
    ["R-103882", "S1", "A2", "L1", "Marcus D. Thibodeaux", "77 Magnolia Ridge Ln, Houma", 16940, "paid"],
    ["R-103951", "S1", "A3", "L1", "Tasha M. Robichaux", "1306 Canal Bend Dr, Houma", 15320, "paid"],
    ["R-104102", "S1", "A4", "L1", "Jarrod R. Fontenot", "2210 Grand Caillou Rd, Apt B, Houma", 14880, "paid"],
    ["R-104236", "S1", "A5", "L1", "Brandon K. Guillory", "59 Live Oak Ct, Gray", 15960, "paid"],
    ["R-103774", "S2", "A1", "L2", "Alicia N. Breaux", "812 Laurel Valley Rd, Thibodaux", 16110, "paid"],
    ["R-103809", "S2", "A6", "L2", "Derrick J. Hebert", "34 Bayou Lafourche Dr, Thibodaux", 14450, "paid"],
    ["R-104015", "S2", "A2", "L2", "Monica S. Bourgeois", "1919 Rienzi Ave, Thibodaux", 17020, "paid"],
    ["R-104188", "S2", "A4", "L2", "Tyrell A. Comeaux", "606 Choctaw Ridge Rd, Raceland", 15640, "pending"],
    ["R-103690", "S3", "A1", "L1", "Shanice L. Dugas", "245 Brashear Ave, Morgan City", 13980, "paid"],
    ["R-103843", "S3", "A3", "L1", "Corey M. Pitre", "1018 Federal Ave, Morgan City", 16720, "paid"],
    ["R-104077", "S3", "A4", "L1", "Latoya R. Naquin", "77 Lake Palourde Rd, Amelia", 15210, "paid"],
    ["R-104293", "S3", "A5", "L1", "Kevin P. Ladner", "330 Pharr Dr, Berwick", 14060, "pending"],
    ["M-201146", "S4", "A5", "L3", "Ashley D. Necaise", "1407 Goodyear Blvd, Picayune", 15880, "paid"],
    ["M-201203", "S4", "A2", "L3", "Travis W. Cuevas", "88 Palestine Rd, Picayune", 13740, "paid"],
    ["M-201287", "S4", "A3", "L3", "Brittany L. Saucier", "512 Hwy 43 N, Picayune", 16350, "paid"],
    ["M-201315", "S4", "A6", "L3", "Jamal T. Favre", "22 Old Kiln Rd, Poplarville", 14920, "paid"],
    ["M-201362", "S4", "A6", "L3", "Erica M. Lizana", "903 Memorial Blvd, Picayune", 15470, "pending"]
  ];
  var GRAPH = G.map(function (r, i) {
    return { id: r[0], store: r[1], acct: r[2], landlord: r[3], name: r[4], addr: r[5], amount: r[6], state: r[7], seed: i === 0, paidDate: r[7] === "paid" ? "2026-09-" + String(4 + (i * 3) % 20).padStart(2, "0") : null };
  });

  // ---- leads: flagged registrations the analyst works ----
  // Each award line is an IHP assistance category. Signals are what tripped the
  // model/rules, each with the source it came from.
  function awardLines(spec) { return spec.map(function (s) { return { code: s[0], label: s[1], amount: s[2] }; }); }
  var A = {
    sna: ["SNA", "Serious Needs Assistance", 790],
    rent: function (n) { return ["RA", "Rental Assistance · " + (n / 1650) + " months", n]; },
    pp: function (n) { return ["PPA", "Personal Property Assistance", n]; },
    tr: function (n) { return ["TRA", "Transportation Assistance", n]; },
    hr: function (n) { return ["HRA", "Home Repair Assistance", n]; },
    dmed: function (n) { return ["MED", "Medical & Dental", n]; }
  };

  var LEADS = [
    // ---------------- pre-payment: awards scored before they pay ----------------
    { id: "R-104417", mode: "prepay", dr: "DR-9921-LA", registrant: "Kendra L. Batiste", addr: "418 Cypress Bend Rd, Houma, LA 70360", parish: "Terrebonne", occupancy: "Renter",
      registered: "2026-09-29 21:14", store: "S1", acct: "A1", landlord: "L1", device: "D-7F3A", ip: "IP block · 3 subscribers", riskScore: 94, confidence: 0.93, recommendedAction: "hold",
      fwaType: "Facilitator ring", network: "N01", award: awardLines([A.sna, A.rent(3300), A.pp(11640), A.tr(1550)]),
      reason: "Lease from a landlord of record on 61 registrations · owner of record filed separately · deposit account shared",
      signals: [
        { sev: "high", label: "Landlord of record on 61 registrations", detail: "Fontenot Rentals LLC signs the lease. Parish assessor: it owns none of the 61 addresses on its leases.", src: "Document match · Parish assessor" },
        { sev: "high", label: "Owner of record filed separately", detail: "418 Cypress Bend Rd is owned by Harold & Denise Guidry, who registered as owner-occupants on 2026-08-31 (R-101276). A single-family home, not a rental.", src: "Parish assessor · Registration match" },
        { sev: "high", label: "Lease template matches 214 registrations", detail: "Same layout, fonts and clause wording, same misspelling (“premisis”), across 4 'application help' storefronts.", src: "Document fingerprint" },
        { sev: "med", label: "Deposit account shared", detail: "Account ••8832 is also on R-103774 and R-103690 — different names, different storefronts.", src: "Bank account verification" },
        { sev: "med", label: "Filed from a busy device", detail: "Device D-7F3A filed 31 registrations in 48 hours; callback phone (985) 555-0147 is on 12.", src: "Session & device telemetry" },
        { sev: "low", label: "Identity verified", detail: "Name, SSN and date of birth match. The registrant is a real person, which fits a recruited applicant rather than a stolen identity.", src: "Identity verification" }
      ] },
    { id: "R-104389", mode: "prepay", dr: "DR-9921-LA", registrant: "Gerald P. Arceneaux", addr: "66 Shrimpers Row, Dulac, LA 70353", parish: "Terrebonne", occupancy: "Owner",
      registered: "2026-09-29 19:02", riskScore: 91, confidence: 0.95, recommendedAction: "deny", fwaType: "Identity", network: "N13",
      award: awardLines([A.sna, A.hr(9870), A.pp(1940)]), reason: "SSN matches a death record (2019)",
      signals: [{ sev: "high", label: "SSN matches a death record", detail: "Death Master File: the holder of this SSN died in 2019.", src: "SSA Death Master File · Do Not Pay" }, { sev: "med", label: "New bank account", detail: "Deposit account opened 3 days before registration.", src: "Bank account verification" }] },
    { id: "R-104455", mode: "prepay", dr: "DR-9921-LA", registrant: "Dwayne C. Hebert", addr: "1120 Bayou Dularge Rd, Houma, LA 70363", parish: "Terrebonne", occupancy: "Renter",
      registered: "2026-09-29 17:40", riskScore: 88, confidence: 0.86, recommendedAction: "hold", fwaType: "Address farm", network: "N15",
      award: awardLines([A.sna, A.rent(4950), A.pp(2680)]), reason: "9 households registered at one 2-bedroom house",
      signals: [{ sev: "high", label: "9 registrations at one address", detail: "A 2-bedroom single-family home; 9 separate households claim it as their primary residence.", src: "Address match · Parish assessor" }] },
    { id: "R-104431", mode: "prepay", dr: "DR-9921-LA", registrant: "Renee M. Babin", addr: "4410 Jones Creek Rd, Baton Rouge, LA 70817", parish: "East Baton Rouge", occupancy: "Owner",
      registered: "2026-09-28 22:31", riskScore: 82, confidence: 0.84, recommendedAction: "deny", fwaType: "Out-of-area address", network: "N19",
      award: awardLines([A.sna, A.hr(7420), A.pp(940)]), reason: "Damaged address outside the declared parishes",
      signals: [{ sev: "high", label: "Outside the declared area", detail: "East Baton Rouge Parish is not designated for Individual Assistance; the address is 71 miles from the damage footprint.", src: "Geospatial · declaration designations" }] },
    { id: "R-104470", mode: "prepay", dr: "DR-9921-LA", registrant: "Paul J. Theriot", addr: "17 Old Bayou Rd, Lockport, LA 70374", parish: "Lafourche", occupancy: "Owner",
      registered: "2026-09-28 15:12", riskScore: 71, confidence: 0.78, recommendedAction: "hold", fwaType: "Duplication of benefits", network: null,
      award: awardLines([A.hr(24800)]), reason: "Flood policy on the dwelling — settlement not yet reported",
      signals: [{ sev: "med", label: "Flood insurance on the dwelling", detail: "An active flood policy covers the structure. Home repair can't duplicate an insurance settlement (Stafford Act §312).", src: "Insurance match" }] },
    { id: "R-104461", mode: "prepay", dr: "DR-9921-LA", registrant: "Crystal A. Dupre", addr: "203 Main Project Rd, Houma, LA 70364", parish: "Terrebonne", occupancy: "Renter",
      registered: "2026-09-28 11:05", riskScore: 63, confidence: 0.71, recommendedAction: "hold", fwaType: "Duplicate household", network: null,
      award: awardLines([A.rent(3300)]), reason: "A second registration from the same household",
      signals: [{ sev: "med", label: "Same household registered twice", detail: "A spouse at the same address already received Rental Assistance (R-102917).", src: "Registration match" }] },
    { id: "R-104402", mode: "prepay", dr: "DR-9921-LA", registrant: "Annette L. Chauvin", addr: "905 Bayou Gardens Blvd, Houma, LA 70364", parish: "Terrebonne", occupancy: "Owner",
      registered: "2026-09-27 09:48", riskScore: 14, confidence: 0.9, recommendedAction: "pay", fwaType: "Routine", network: null,
      award: awardLines([A.sna, A.hr(28620), A.pp(1850)]), reason: "Inspection verified · ownership and occupancy confirmed",
      signals: [{ sev: "low", label: "Inspection verified", detail: "Remote inspection matched the reported roof and water damage; ownership and occupancy confirmed.", src: "Housing inspection · Parish assessor" }] },
    { id: "R-104446", mode: "prepay", dr: "DR-9921-LA", registrant: "Luis F. Ortega", addr: "1510 Barrow St, Apt 4, Houma, LA 70360", parish: "Terrebonne", occupancy: "Renter",
      registered: "2026-09-29 08:20", riskScore: 18, confidence: 0.88, recommendedAction: "pay", fwaType: "Routine", network: null,
      award: awardLines([A.sna, A.rent(3300), A.pp(860)]), reason: "Lease and utility history match · landlord is the owner of record",
      signals: [{ sev: "low", label: "Occupancy verified", detail: "Utility history and lease match; the landlord is the owner of record.", src: "Utility match · Parish assessor" }] },
    { id: "R-104418", mode: "prepay", dr: "DR-9921-LA", registrant: "Mae B. Verdin", addr: "48 Point Barre Rd, Montegut, LA 70377", parish: "Terrebonne", occupancy: "Owner",
      registered: "2026-09-29 20:55", riskScore: 6, confidence: 0.94, recommendedAction: "pay", fwaType: "Routine", network: null,
      award: awardLines([A.sna]), reason: "Serious Needs Assistance · evacuated from a verified address",
      signals: [{ sev: "low", label: "Identity and address verified", detail: "Evacuated from a verified primary residence in the impact area.", src: "Identity verification · Geospatial" }] },

    // ---------------- post-payment: already paid, flagged for review ----------------
    { id: "R-103882", mode: "retrospective", dr: "DR-9921-LA", registrant: "Marcus D. Thibodeaux", addr: "77 Magnolia Ridge Ln, Houma, LA 70360", parish: "Terrebonne", occupancy: "Renter",
      registered: "2026-09-02 14:37", paidDate: "2026-09-08", store: "S1", acct: "A2", landlord: "L1", device: "D-7F3A", riskScore: 92, confidence: 0.91, recommendedAction: "confirm",
      fwaType: "Facilitator ring", network: "N01", status: "Under review", assignee: "Dana Whitmore", award: awardLines([A.sna, A.rent(3300), A.pp(11300), A.tr(1550)]),
      reason: "Same lease template and landlord as R-104417 · already paid",
      signals: [
        { sev: "high", label: "Same lease template as 214 registrations", detail: "Identical layout and clauses to R-104417's lease, including the “premisis” misspelling. Same landlord signature.", src: "Document fingerprint" },
        { sev: "high", label: "Landlord doesn't own the property", detail: "77 Magnolia Ridge Ln belongs to an out-of-state owner who reports the home vacant and unrented since 2024.", src: "Parish assessor · Owner contact" },
        { sev: "high", label: "Deposit account shared across names", detail: "Account ••5106 also received R-104015 (Monica S. Bourgeois) and M-201203 in Mississippi (Travis W. Cuevas): three registrants, one account.", src: "Bank account verification" },
        { sev: "med", label: "Same device as R-104417", detail: "Filed from device D-7F3A with callback phone (985) 555-0147.", src: "Session & device telemetry" }
      ] },
    { id: "R-104102", mode: "retrospective", dr: "DR-9921-LA", registrant: "Jarrod R. Fontenot", addr: "2210 Grand Caillou Rd, Apt B, Houma, LA 70363", parish: "Terrebonne", occupancy: "Renter",
      registered: "2026-09-05 10:12", paidDate: "2026-09-11", store: "S1", acct: "A4", landlord: "L1", device: "D-7F3A", riskScore: 95, confidence: 0.94, recommendedAction: "confirm",
      fwaType: "Facilitator ring", network: "N01", status: "Assigned", assignee: "Dana Whitmore", award: awardLines([A.sna, A.rent(3300), A.pp(9240), A.tr(1550)]),
      reason: "The registrant is the 'landlord' on 61 other registrations",
      signals: [
        { sev: "high", label: "Registrant signs 61 other leases", detail: "Jarrod R. Fontenot is the signer for Fontenot Rentals LLC, the landlord of record on 61 registrations. He registered as a displaced renter himself.", src: "Entity resolution" },
        { sev: "high", label: "No such unit", detail: "2210 Grand Caillou Rd is a single-unit home; there is no Apt B. Its owner of record registered separately.", src: "Parish assessor · USPS" },
        { sev: "med", label: "Prepaid-card deposit account", detail: "Award paid to a reloadable prepaid card (••9067) that also received R-104188 and R-104077.", src: "Bank account verification" }
      ] },
    { id: "R-103951", mode: "retrospective", dr: "DR-9921-LA", registrant: "Tasha M. Robichaux", addr: "1306 Canal Bend Dr, Houma, LA 70360", parish: "Terrebonne", occupancy: "Renter",
      registered: "2026-09-03 18:20", paidDate: "2026-09-09", store: "S1", acct: "A3", landlord: "L1", riskScore: 90, confidence: 0.89, recommendedAction: "confirm",
      fwaType: "Facilitator ring", network: "N01", status: "New", assignee: null, award: awardLines([A.sna, A.rent(3300), A.pp(9680), A.tr(1550)]),
      reason: "Same lease template · deposit account shared across storefronts",
      signals: [{ sev: "high", label: "Same lease template as 214 registrations", detail: "Fontenot Rentals LLC lease, same fingerprint.", src: "Document fingerprint" }] },
    { id: "M-201203", mode: "retrospective", dr: "DR-9922-MS", registrant: "Travis W. Cuevas", addr: "88 Palestine Rd, Picayune, MS 39466", parish: "Pearl River County", occupancy: "Renter",
      registered: "2026-09-04 12:51", paidDate: "2026-09-10", store: "S4", acct: "A2", landlord: "L3", riskScore: 87, confidence: 0.86, recommendedAction: "confirm",
      fwaType: "Facilitator ring", network: "N01", status: "New", assignee: null, award: awardLines([A.sna, A.rent(3300), A.pp(8100), A.tr(1550)]),
      reason: "Paid into the same account as a Louisiana registration",
      signals: [{ sev: "high", label: "Account shared across states", detail: "Account ••5106 received this Mississippi award and two Louisiana awards with different names.", src: "Bank account verification" }] },
    { id: "R-103617", mode: "retrospective", dr: "DR-9921-LA", registrant: "Kyle J. Domangue", addr: "1120 Bayou Dularge Rd, Houma, LA 70363", parish: "Terrebonne", occupancy: "Renter",
      registered: "2026-09-01 09:33", paidDate: "2026-09-06", riskScore: 84, confidence: 0.82, recommendedAction: "confirm",
      fwaType: "Address farm", network: "N15", status: "New", assignee: null, award: awardLines([A.sna, A.rent(4950), A.pp(2160)]),
      reason: "One of 9 households at a 2-bedroom house",
      signals: [{ sev: "high", label: "9 registrations at one address", detail: "Same address as R-104455.", src: "Address match" }] },
    { id: "M-201088", mode: "retrospective", dr: "DR-9922-MS", registrant: "Harold W. Seymour", addr: "15 Bayside Dr, Waveland, MS 39576", parish: "Hancock County", occupancy: "Owner",
      registered: "2026-08-31 16:40", paidDate: "2026-09-05", riskScore: 81, confidence: 0.83, recommendedAction: "confirm",
      fwaType: "Not primary residence", network: "N18", status: "Assigned", assignee: "Maria Delgado", award: awardLines([A.sna, A.hr(16240)]),
      reason: "Second home — primary residence and homestead exemption are in Tennessee",
      signals: [{ sev: "high", label: "Not the primary residence", detail: "Homestead exemption, voter registration and driver's license are all at a Tennessee address.", src: "Property tax records · DMV" }] },
    { id: "R-102988", mode: "retrospective", dr: "DR-9921-LA", registrant: "Dale M. Guidry", addr: "71 Westside Blvd, Houma, LA 70364", parish: "Terrebonne", occupancy: "Owner",
      registered: "2026-08-30 13:05", paidDate: "2026-09-04", riskScore: 74, confidence: 0.8, recommendedAction: "confirm",
      fwaType: "Duplication of benefits", network: null, status: "Under review", assignee: "Devon Carter", award: awardLines([A.hr(19700)]),
      reason: "Insurance settlement paid for the same roof repair",
      signals: [{ sev: "med", label: "Insurance paid the same loss", detail: "Homeowner's insurer settled $21,300 for the roof on 2026-09-12, after FEMA's home repair award.", src: "Insurance match" }] },
    { id: "R-103705", mode: "retrospective", dr: "DR-9921-LA", registrant: "Rosa I. Mendez", addr: "1415 Coteau Rd, Unit 2, Houma, LA 70364", parish: "Terrebonne", occupancy: "Renter",
      registered: "2026-09-01 11:48", paidDate: "2026-09-07", riskScore: 58, confidence: 0.62, recommendedAction: "dismiss",
      fwaType: "Duplicate household", network: null, status: "New", assignee: null, award: awardLines([A.sna, A.rent(3300), A.pp(1420)]),
      reason: "Two registrations at one address — looks like a duplicate",
      signals: [
        { sev: "med", label: "Two registrations at one address", detail: "R-103706 lists the same street address.", src: "Address match" },
        { sev: "low", label: "Separate units, separate households", detail: "Parish records show a duplex: Unit 1 and Unit 2 have separate leases and utility accounts. Both households are verified.", src: "Parish assessor · Utility match" }
      ] }
  ];
  LEADS.forEach(function (l) {
    l.uc = "fema";
    l.amount = l.award.reduce(function (t, a) { return t + a.amount; }, 0);
    l.exposurePre = l.mode === "prepay" ? l.amount : 0;
    l.exposurePost = l.mode === "prepay" ? 0 : l.amount;
    l.status = l.status || (l.mode === "prepay" ? "Pending" : "New");
    l.source = "Both"; l.providerId = l.network === "N01" ? "CASE-F-0031" : l.id; l.claimId = null;
    l.createdDate = (l.registered || "").slice(0, 10);
    l.state = DECLS[l.dr].state;
  });

  // ---- the network portfolio across declarations (Insights › Networks) ----
  var SCHEMES = {
    facilitator: { label: "Application facilitator ring", short: "Facilitator", hub: "Facilitator / operator", spoke: "Storefronts", color: "#c6362f" },
    leasemill: { label: "Lease mill · fake landlord", short: "Lease mill", hub: "Landlord of record", spoke: "Leases", color: "#b5730e" },
    account: { label: "Shared collection accounts", short: "Shared account", hub: "Collection account", spoke: "Accounts", color: "#8a3ffc" },
    identity: { label: "Stolen & synthetic identities", short: "Identities", hub: "Device cluster", spoke: "Devices", color: "#0043ce" },
    address: { label: "Address farm / not primary residence", short: "Address", hub: "Shared address", spoke: "Addresses", color: "#0072c3" }
  };
  var SCHEME_ORDER = ["facilitator", "leasemill", "account", "identity", "address"];
  // atRisk: paid + pending awards matching the network's pattern across the
  // 13-month lookback (every declaration so far). spokes: the second ring of the graph.
  var NETS = [
    { id: "N01", core: true, scheme: "facilitator", name: "Crescent Relief network", drs: ["DR-9921-LA", "DR-9922-MS"], states: ["LA", "MS"], atRisk: 8640000, regs: 597, status: "Under review", risk: 94,
      spokes: STOREFRONTS.map(function (s) { return s.name; }) },
    { id: "N02", scheme: "facilitator", name: "Red Stick Recovery Helpers", drs: ["DR-9921-LA"], states: ["LA"], atRisk: 3950000, status: "New", risk: 81, spokes: ["Red Stick Recovery Helpers", "Capital Area Aid Help"] },
    { id: "N03", scheme: "facilitator", name: "Lone Star Aid Navigators", drs: ["DR-9877-TX"], states: ["TX"], atRisk: 7320000, status: "Case open", risk: 90, spokes: ["Lone Star Aid Navigators", "Brazos Relief Filing", "Gulf Prairie Assist"] },
    { id: "N04", scheme: "facilitator", name: "Sunshine Claims Assist", drs: ["DR-9864-FL"], states: ["FL", "GA"], atRisk: 5880000, status: "Under review", risk: 86, spokes: ["Sunshine Claims Assist", "Panhandle Aid Help", "Suwannee Filing Service"] },
    { id: "N05", scheme: "leasemill", name: "Magnolia Leasing Group", drs: ["DR-9922-MS"], states: ["MS"], atRisk: 2310000, status: "New", risk: 74, spokes: ["Magnolia Leasing Group", "M. Ladner letters"] },
    { id: "N06", scheme: "leasemill", name: "Gulf Breeze Rentals", drs: ["DR-9864-FL"], states: ["FL"], atRisk: 3470000, status: "New", risk: 77, spokes: ["Gulf Breeze Rentals", "Pensacola Bay Homes"] },
    { id: "N07", scheme: "leasemill", name: "Sierra Vista Property Mgmt", drs: ["DR-9806-CA"], states: ["CA", "NV"], atRisk: 5780000, status: "Referred to OIG", risk: 92, spokes: ["Sierra Vista Property Mgmt", "Foothill Rentals", "Reno letters"] },
    { id: "N08", scheme: "account", name: "Collection account ••7214", drs: ["DR-9877-TX"], states: ["TX"], atRisk: 4190000, status: "Under review", risk: 83, spokes: ["••7214", "••7215", "••1180"] },
    { id: "N09", scheme: "account", name: "Collection accounts ••3075 / ••5106", drs: ["DR-9877-TX", "DR-9921-LA"], states: ["TX", "LA"], atRisk: 6980000, status: "New", risk: 88, spokes: ["••3075", "••5106", "••4412", "••9930"] },
    { id: "N10", scheme: "account", name: "Prepaid-card cluster (12 cards)", drs: ["DR-9806-CA"], states: ["CA"], atRisk: 3880000, status: "New", risk: 79, spokes: ["Card batch A", "Card batch B"] },
    { id: "N11", scheme: "identity", name: "Device cluster D-41C9", drs: ["DR-9877-TX"], states: ["TX", "OK"], atRisk: 9120000, status: "Case open", risk: 93, spokes: ["D-41C9", "D-41CA", "D-5E02"] },
    { id: "N12", scheme: "identity", name: "Deceased-identity filings", drs: ["DR-9864-FL"], states: ["FL", "GA"], atRisk: 5060000, status: "Referred to OIG", risk: 91, spokes: ["DMF matches", "PO Box 3318"] },
    { id: "N13", scheme: "identity", name: "Prison-roster identities", drs: ["DR-9921-LA"], states: ["LA"], atRisk: 2740000, status: "New", risk: 89, spokes: ["Roster match", "D-22B0"] },
    { id: "N14", scheme: "identity", name: "Device cluster D-0B77", drs: ["DR-9806-CA"], states: ["CA", "AZ"], atRisk: 8050000, status: "Under review", risk: 90, spokes: ["D-0B77", "D-0B78", "D-1A04", "D-1A05"] },
    { id: "N15", scheme: "address", name: "1120 Bayou Dularge Rd", drs: ["DR-9921-LA"], states: ["LA"], atRisk: 1980000, status: "New", risk: 84, spokes: ["1120 Bayou Dularge Rd", "1124 Bayou Dularge Rd"] },
    { id: "N16", scheme: "address", name: "Non-existent addresses · Hwy 90", drs: ["DR-9922-MS"], states: ["MS"], atRisk: 2450000, status: "New", risk: 76, spokes: ["Hwy 90 W block", "Hwy 90 E block"] },
    { id: "N17", scheme: "address", name: "Two apartment complexes", drs: ["DR-9806-CA"], states: ["CA"], atRisk: 6800000, status: "Under review", risk: 82, spokes: ["Oak Hollow Apts", "Pine Crest Apts"] },
    { id: "N18", scheme: "address", name: "Second homes claimed as primary", drs: ["DR-9864-FL", "DR-9922-MS"], states: ["FL", "MS", "TN"], atRisk: 7410000, status: "Under review", risk: 80, spokes: ["Gulf Shores units", "Waveland cottages", "Destin condos"] },
    { id: "N19", scheme: "address", name: "Out-of-area addresses", drs: ["DR-9851-NC", "DR-9921-LA"], states: ["NC", "LA"], atRisk: 3140000, status: "New", risk: 72, spokes: ["Outside footprint (NC)", "Outside footprint (LA)"] },
    { id: "N20", scheme: "facilitator", name: "Blue Ridge Filing Help", drs: ["DR-9851-NC"], states: ["NC", "TN"], atRisk: 4210000, status: "New", risk: 78, spokes: ["Blue Ridge Filing Help", "Mountain Aid Assist"] }
  ];
  // Cross-network links: the same account, lease template, landlord letters,
  // device or phone turning up in two networks — often in different disasters.
  var BRIDGES = [
    { a: "N01", b: "N09", type: "Same collection account", detail: "Account ••5106 received Crescent Relief awards in Louisiana and Mississippi, and 41 awards in DR-9877-TX (Severe Storms and Flooding) four months earlier." },
    { a: "N01", b: "N07", type: "Same lease template", detail: "The Crescent Relief lease template, “premisis” misspelling and all, appears on 88 registrations in DR-9806-CA (Ridgeline Wildfire)." },
    { a: "N11", b: "N14", type: "Same device fingerprint", detail: "Device cluster D-41C9 (Texas) and D-0B77 (California) share a browser and device fingerprint." },
    { a: "N03", b: "N08", type: "Same collection account", detail: "Lone Star Aid Navigators' registrants were paid into account ••7214." },
    { a: "N12", b: "N18", type: "Same mailing address", detail: "PO Box 3318 receives correspondence for registrations in both networks." },
    { a: "N04", b: "N06", type: "Same lease template", detail: "Sunshine Claims Assist registrations carry Gulf Breeze Rentals leases." },
    { a: "N20", b: "N19", type: "Same callback phone", detail: "(828) 555-0193 is the callback number on registrations in both networks." },
    { a: "N02", b: "N13", type: "Same device", detail: "Device D-22B0 filed for Red Stick Recovery Helpers and for the prison-roster identities." }
  ];
  var AVG = { facilitator: 14700, leasemill: 12900, account: 13400, identity: 9800, address: 11200 };
  var PLAN = { lookbackMonths: 13, declarations: Object.keys(DECLS).length, minutesPerReg: 60 };
  NETS.forEach(function (n) {
    n.regs = n.regs || Math.round(n.atRisk / AVG[n.scheme]);
    n.crossState = n.states.length > 1;
    n.crossDecl = n.drs.length > 1;
  });
  // the flagged registration's own storefront over the same lookback
  var SEED_STORE = { name: "Crescent Relief Navigators", regs: 184, atRisk: 2710000 };

  function rng(seed) { var x = seed; return function () { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; }
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483647; return h; }

  var FEMA = {
    DECLS: DECLS, PRIMARY: PRIMARY, PROGRAM: PROGRAM,
    OPERATOR: OPERATOR, STOREFRONTS: STOREFRONTS, ACCOUNTS: ACCOUNTS, LANDLORDS: LANDLORDS, GRAPH: GRAPH,
    LEADS: LEADS, SCHEMES: SCHEMES, SCHEME_ORDER: SCHEME_ORDER, NETS: NETS, BRIDGES: BRIDGES, PLAN: PLAN,
    SEED: "R-104417", THREAD: "R-103882", DECISION: "R-104102", SEED_AMOUNT: 17280,
    // Delphine (LA) intake to date
    INTAKE: { // sameDay: share that pass every check and go straight to payment
      registrations: 61480, approved: 412600000, sameDay: 0.91, inspections: 18240, held: 2318 },
    lead: function (id) { return LEADS.filter(function (l) { return l.id === id; })[0] || null; },
    store: function (id) { return STOREFRONTS.filter(function (s) { return s.id === id; })[0] || null; },
    net: function (id) { return NETS.filter(function (n) { return n.id === id; })[0] || null; },
    stats: function () {
      var sum = function (k) { return NETS.reduce(function (t, n) { return t + n[k]; }, 0); };
      var cross = NETS.filter(function (n) { return n.crossDecl || n.crossState; }).length;
      var spokes = NETS.reduce(function (t, n) { return t + n.spokes.length; }, 0);
      return { networks: NETS.length, atRisk: sum("atRisk"), regs: sum("regs"), cross: cross, spokes: spokes, crossPct: Math.round(cross / NETS.length * 100) };
    },
    linked: function (id) {
      var seen = {}; seen[id] = 1; var q = [id];
      while (q.length) { var c = q.shift(); BRIDGES.forEach(function (b) { var o = b.a === c ? b.b : b.b === c ? b.a : null; if (o && !seen[o]) { seen[o] = 1; q.push(o); } }); }
      return NETS.filter(function (n) { return seen[n.id]; });
    },
    // one flagged registration → its storefront → the operator's network →
    // networks linked to it → every network. Each stage contains the one before.
    funnel: function () {
      var home = FEMA.net("N01"), linked = FEMA.linked("N01"), S = FEMA.stats();
      var lsum = function (k) { return linked.reduce(function (t, n) { return t + n[k]; }, 0); };
      return [
        { key: "reg", label: "One flagged registration", amount: FEMA.SEED_AMOUNT, detail: "R-104417 · held before payment", count: "1 registration" },
        { key: "store", label: "Same facilitator", amount: SEED_STORE.atRisk, detail: SEED_STORE.name + " · Houma, LA", count: SEED_STORE.regs + " registrations" },
        { key: "network", label: "Its network", amount: home.atRisk, detail: "One operator · 4 storefronts · LA and MS", count: home.regs.toLocaleString() + " registrations" },
        { key: "linked", label: "Networks linked to it", amount: lsum("atRisk"), detail: linked.length + " networks · a shared account and lease template across 3 disasters", count: lsum("regs").toLocaleString() + " registrations" },
        { key: "all", label: "Same patterns, every network", amount: S.atRisk, detail: S.networks + " networks · " + PLAN.declarations + " declarations · 5 scheme types", count: S.regs.toLocaleString() + " registrations" }
      ];
    },
    // the map: hubs, their spokes, and a few registrant dots per network
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
  window.FEMA = FEMA;
})();
