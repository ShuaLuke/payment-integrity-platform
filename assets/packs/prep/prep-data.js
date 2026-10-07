/* Preparedness Grants pack — synthetic data for FEMA preparedness grants
   (Homeland Security Grant Program: State Homeland Security Program and Urban
   Area Security Initiative; Emergency Management Performance Grants), followed
   below the state: subrecipients (counties, cities, urban areas) and the vendors
   they pay. Everything here is fictional: the counties, urban areas, vendors,
   people, award numbers and accounts. Counties and urban areas are invented
   names placed in real states; award numbers use a 99xxx series; phone numbers
   use the reserved 555-01xx range; vendor UEIs start with ZZ.
   The story is a composite of documented patterns (inflated vendor invoices,
   pass-through entities, a third-party administrator serving several recipients,
   undisclosed conflicts of interest, equipment nobody can account for), not a
   model of any real case. Attaches window.PREP. */
(function () {
  var PROGRAMS = {
    SHSP: { code: "SHSP", name: "State Homeland Security Program", short: "State homeland security" },
    UASI: { code: "UASI", name: "Urban Area Security Initiative", short: "Urban area security" },
    EMPG: { code: "EMPG", name: "Emergency Management Performance Grants", short: "Emergency management" }
  };
  var STATES = {
    VA: { code: "VA", name: "Virginia", saa: "Virginia Dept. of Emergency Management" },
    MD: { code: "MD", name: "Maryland", saa: "Maryland Dept. of Emergency Management" },
    NC: { code: "NC", name: "North Carolina", saa: "North Carolina Emergency Management" },
    DE: { code: "DE", name: "Delaware", saa: "Delaware Emergency Management Agency" },
    OH: { code: "OH", name: "Ohio", saa: "Ohio Emergency Management Agency" }
  };

  // ---- subrecipients (fictional counties, a city and an urban area) ----
  var SUBS = {
    C1: { id: "C1", name: "Larkspur County", state: "VA", kind: "County", coordinator: "Dale R. Hutchins" },
    C2: { id: "C2", name: "Brandt County", state: "MD", kind: "County" },
    C3: { id: "C3", name: "Merrow County", state: "NC", kind: "County" },
    C4: { id: "C4", name: "City of Port Haden", state: "DE", kind: "City" },
    C5: { id: "C5", name: "Wexley County", state: "VA", kind: "County" },
    C6: { id: "C6", name: "Talbridge County", state: "MD", kind: "County" },
    C7: { id: "C7", name: "Ansel County", state: "NC", kind: "County" },
    C8: { id: "C8", name: "Hampton Shores Urban Area", state: "VA", kind: "Urban area" },
    C9: { id: "C9", name: "Garrick County", state: "OH", kind: "County" }
  };

  // ---- the vendor network the story follows (Tidewater) ----
  // On paper, five unrelated businesses in four states. In the data they share a
  // registered agent, a phone, a deposit account and one officer.
  var OPERATOR = { name: "Tidewater network", officer: "R. A. Kessling", agent: "Atlantic Registered Agents · 4410 Shore Dr, Ste 200, Virginia Beach, VA", phone: "(757) 555-0139", acct: "••4471" };
  var VENDORS = [
    { id: "V1", name: "Tidewater Preparedness Partners LLC", city: "Norfolk", state: "VA", role: "Plans & exercises", formed: "2023-02-14", uei: "ZZ9TPP7Q4K21", phone: "(757) 555-0139", risk: 93, invoices: 14 },
    { id: "V2", name: "Chesapeake Readiness Group", city: "Annapolis", state: "MD", role: "“Competing” bidder", formed: "2023-03-02", uei: "ZZ4CRG8M1T60", phone: "(757) 555-0139", risk: 88, invoices: 9 },
    { id: "V3", name: "Seaboard Continuity Advisors", city: "Wilmington", state: "NC", role: "“Competing” bidder", formed: "2023-05-19", uei: "ZZ2SCA5R9P37", phone: "(910) 555-0164", risk: 86, invoices: 8 },
    { id: "V4", name: "Coastline Comm Supply", city: "Dover", state: "DE", role: "Radio reseller", formed: "2022-11-08", uei: "ZZ7CCS3D2W85", phone: "(302) 555-0121", risk: 90, invoices: 11 },
    { id: "V5", name: "DH Readiness Solutions LLC", city: "Larkspur", state: "VA", role: "Subcontractor", formed: "2024-01-22", uei: "ZZ1DHR6B0N44", phone: "(540) 555-0187", risk: 84, invoices: 4 }
  ];
  var VENDOR = function (id) { return VENDORS.filter(function (v) { return v.id === id; })[0] || null; };

  // The 18 invoices drawn on the network graph: the flagged one plus 17 like it.
  // [id, vendor, subrecipient, program, deliverable, amount, status]
  var G = [
    ["RR-58214", "V1", "C1", "SHSP", "Regional Interoperable Communications Plan", 86400, "held"],
    ["RR-57390", "V1", "C2", "SHSP", "Regional Interoperable Communications Plan", 84900, "paid"],
    ["RR-56988", "V1", "C3", "SHSP", "Regional Interoperable Communications Plan", 87200, "paid"],
    ["RR-57114", "V1", "C5", "SHSP", "Regional Interoperable Communications Plan", 85600, "paid"],
    ["RR-57263", "V1", "C8", "UASI", "Regional Interoperable Communications Plan", 88100, "paid"],
    ["RR-57340", "V1", "C6", "SHSP", "Threat & hazard assessment (THIRA) update", 61200, "paid"],
    ["RR-58230", "V2", "C5", "SHSP", "Tabletop exercise design", 64800, "pending"],
    ["RR-57021", "V2", "C2", "EMPG", "Continuity of operations plan", 79800, "paid"],
    ["RR-57198", "V2", "C6", "SHSP", "Regional Interoperable Communications Plan", 86900, "paid"],
    ["RR-57188", "V3", "C7", "EMPG", "Continuity of operations plan", 79300, "paid"],
    ["RR-57305", "V3", "C3", "SHSP", "Tabletop exercise design", 62700, "paid"],
    ["RR-57409", "V3", "C4", "SHSP", "Regional Interoperable Communications Plan", 84300, "paid"],
    ["RR-57702", "V4", "C3", "SHSP", "48 portable radios", 212600, "paid"],
    ["RR-57288", "V4", "C2", "SHSP", "36 portable radios", 159400, "paid"],
    ["RR-57511", "V4", "C8", "UASI", "Radio console upgrade", 188700, "paid"],
    ["RR-57620", "V4", "C4", "SHSP", "24 portable radios", 106300, "pending"],
    ["RR-57455", "V5", "C1", "SHSP", "Plan maintenance (subcontract)", 41500, "paid"],
    ["RR-57583", "V5", "C1", "EMPG", "Exercise support (subcontract)", 38200, "paid"]
  ];
  var GRAPH = G.map(function (r, i) {
    return { id: r[0], vendor: r[1], sub: r[2], program: r[3], deliverable: r[4], amount: r[5], state: r[6], seed: i === 0 };
  });

  // ---- leads: reimbursement requests the analyst works ----
  // Preparedness grants pay on reimbursement: the subrecipient pays the vendor,
  // asks the state to reimburse it, and the state draws the money from FEMA.
  // Pre-payment = scored before the state reimburses; post-payment = reimbursed.
  function award(no, prog, fy, st) { return { no: no, program: prog, fy: fy, state: st }; }
  var LEADS = [
    // ---------------- pre-payment: reimbursement requests scored before they pay ----------------
    { id: "RR-58214", mode: "prepay", sub: "C1", vendor: "V1", award: award("EMW-2024-SS-99417", "SHSP", "FY2024", "VA"), deliverable: "Regional Interoperable Communications Plan", budgetLine: "Planning",
      submitted: "2026-10-05 16:22", riskScore: 93, confidence: 0.92, recommendedAction: "hold", fwaType: "Copy-paste deliverable", network: "N01", amount: 86400,
      reason: "Plan is 94% identical to plans paid for by 11 other jurisdictions · price 3.4× the peer median · vendor formed 8 months before the award",
      signals: [
        { sev: "high", label: "Deliverable matches 11 other jurisdictions", detail: "The uploaded plan is 94% identical to communications plans paid for by 11 other subrecipients in VA, MD, NC and DE. Only the county name, contact list and maps were changed.", src: "Document fingerprint" },
        { sev: "high", label: "Price 3.4× the peer median", detail: "Peer median for a county communications plan is $25,400 (212 plans, FY2022–25). This one is $86,400.", src: "Peer pricing · subaward ledgers" },
        { sev: "high", label: "Bidders share an agent, a phone and an account", detail: "The two other quotes came from Chesapeake Readiness Group and Seaboard Continuity Advisors. All three vendors use the same registered agent; two share phone (757) 555-0139, and two are paid into account ••4471.", src: "State business registries · SAM.gov · Bank account verification" },
        { sev: "med", label: "New vendor", detail: "Tidewater Preparedness Partners LLC was formed 2023-02-14, 8 months before the FY2024 award, and registered in SAM.gov a month later.", src: "Virginia SCC · SAM.gov" },
        { sev: "med", label: "Subcontractor tied to the county", detail: "Subcontractor DH Readiness Solutions LLC is registered at the home address of the county's grant coordinator. No conflict-of-interest disclosure is on file.", src: "Entity resolution · procurement file" },
        { sev: "low", label: "Vendor registration active", detail: "Active SAM.gov registration; no exclusions.", src: "SAM.gov" }
      ] },
    { id: "RR-58230", mode: "prepay", sub: "C5", vendor: "V2", award: award("EMW-2024-SS-99417", "SHSP", "FY2024", "VA"), deliverable: "Tabletop exercise design", budgetLine: "Exercises",
      submitted: "2026-10-05 11:08", riskScore: 88, confidence: 0.87, recommendedAction: "hold", fwaType: "Shell bidders", network: "N01", amount: 64800,
      reason: "Winning bidder shares a registered agent and phone with the two vendors it beat",
      signals: [{ sev: "high", label: "Bidders are related", detail: "Chesapeake Readiness Group won against Tidewater Preparedness Partners and Seaboard Continuity Advisors. All three share a registered agent, and two share a phone.", src: "State business registries" }, { sev: "med", label: "Price above peers", detail: "2.1× the peer median for a county tabletop exercise.", src: "Peer pricing" }] },
    { id: "RR-58176", mode: "prepay", sub: "C6", vendor: null, vendorName: "Brightline Surveillance Inc.", award: award("EMW-2024-SS-99388", "SHSP", "FY2024", "MD"), deliverable: "6 license plate readers", budgetLine: "Equipment",
      submitted: "2026-10-04 15:40", riskScore: 90, confidence: 0.95, recommendedAction: "deny", fwaType: "Excluded vendor", network: null, amount: 148200,
      reason: "Vendor has an active SAM.gov exclusion",
      signals: [{ sev: "high", label: "Excluded vendor", detail: "Brightline Surveillance Inc. has an active exclusion in SAM.gov (debarred 2025-06). Federal funds can't pay an excluded party (2 CFR 180).", src: "SAM.gov exclusions · Do Not Pay" }] },
    { id: "RR-58197", mode: "prepay", sub: "C7", vendor: null, vendorName: "Ansel County payroll", award: award("EMW-2025-EP-99206", "EMPG", "FY2025", "NC"), deliverable: "Deputy emergency management coordinator · Q3 salary", budgetLine: "Personnel",
      submitted: "2026-10-03 09:15", riskScore: 79, confidence: 0.81, recommendedAction: "hold", fwaType: "Payroll overcharge", network: null, amount: 38250,
      reason: "The same employee is charged 100% to this grant and 60% to another",
      signals: [{ sev: "high", label: "160% of one person's time", detail: "The deputy coordinator is charged 100% to EMPG and 60% to the county's SHSP planner position for the same quarter.", src: "Subaward ledgers · timesheets" }] },
    { id: "RR-58250", mode: "prepay", sub: "C8", vendor: null, vendorName: "Harborview Analytics", award: award("EMW-2024-SS-99502", "UASI", "FY2024", "VA"), deliverable: "Fusion center analysis software · annual license", budgetLine: "Equipment",
      submitted: "2026-10-05 13:30", riskScore: 22, confidence: 0.86, recommendedAction: "pay", fwaType: "Routine", network: null, amount: 72000,
      reason: "Competitive procurement · price in line with peers · established vendor",
      signals: [{ sev: "low", label: "Verified", detail: "Three independent bids, price within 8% of the peer median, vendor in SAM.gov since 2014.", src: "Procurement file · Peer pricing · SAM.gov" }] },
    { id: "RR-58262", mode: "prepay", sub: "C3", vendor: null, vendorName: "Piedmont Power Systems", award: award("EMW-2024-SS-99351", "SHSP", "FY2024", "NC"), deliverable: "Backup generator · emergency operations center", budgetLine: "Equipment",
      submitted: "2026-10-04 10:02", riskScore: 15, confidence: 0.9, recommendedAction: "pay", fwaType: "Routine", network: null, amount: 46900,
      reason: "Installed and inventoried · price in line with peers",
      signals: [{ sev: "low", label: "Equipment verified", detail: "Serial number recorded in the county inventory with a photo and install date; price within 5% of peers.", src: "Equipment inventory · Peer pricing" }] },
    { id: "RR-58259", mode: "prepay", sub: "C4", vendor: null, vendorName: "First Response Outfitters", award: award("EMW-2024-SS-99460", "SHSP", "FY2024", "DE"), deliverable: "Community emergency response team (CERT) kits", budgetLine: "Equipment",
      submitted: "2026-10-05 08:44", riskScore: 9, confidence: 0.94, recommendedAction: "pay", fwaType: "Routine", network: null, amount: 12400,
      reason: "Small purchase · established vendor · price in line with peers",
      signals: [{ sev: "low", label: "Verified", detail: "Catalog price, established vendor, delivered and signed for.", src: "Procurement file" }] },

    // ---------------- post-payment: reimbursed, flagged for review ----------------
    { id: "RR-57390", mode: "retrospective", sub: "C2", vendor: "V1", award: award("EMW-2023-SS-99288", "SHSP", "FY2023", "MD"), deliverable: "Regional Interoperable Communications Plan", budgetLine: "Planning",
      submitted: "2025-10-14 10:31", paidDate: "2025-11-20", riskScore: 91, confidence: 0.9, recommendedAction: "confirm", fwaType: "Copy-paste deliverable", network: "N01", amount: 84900, status: "Under review", assignee: "Dana Whitmore",
      reason: "Same plan as RR-58214, a year earlier, in another state · already reimbursed",
      signals: [
        { sev: "high", label: "Same plan as RR-58214", detail: "94% identical text, the same section order and tables, and the same typo (“interoperabilty”) on page 3. Larkspur County's copy still lists a Brandt County radio channel.", src: "Document fingerprint" },
        { sev: "high", label: "Price 3.3× the peer median", detail: "$84,900 against a $25,400 peer median for a county communications plan.", src: "Peer pricing" },
        { sev: "med", label: "Bid competition from related vendors", detail: "The other two quotes came from vendors that share Tidewater's registered agent.", src: "State business registries" }
      ] },
    { id: "RR-57702", mode: "retrospective", sub: "C3", vendor: "V4", award: award("EMW-2023-SS-99271", "SHSP", "FY2023", "NC"), deliverable: "48 portable radios", budgetLine: "Equipment",
      submitted: "2025-12-02 14:05", paidDate: "2026-01-09", riskScore: 94, confidence: 0.93, recommendedAction: "confirm", fwaType: "Double-billed equipment", network: "N01", amount: 212600, status: "Assigned", assignee: "Dana Whitmore",
      reason: "31 of the 48 radio serial numbers are also on Brandt County's inventory, bought a year earlier",
      signals: [
        { sev: "high", label: "Serial numbers billed twice", detail: "31 of the 48 serial numbers on this invoice already appear in Brandt County, MD's equipment inventory, bought from the same reseller in FY2023 (RR-57288).", src: "Equipment inventories · invoice match" },
        { sev: "high", label: "Paid into the network's account", detail: "Coastline Comm Supply is paid into account ••4471, the same account as Seaboard Continuity Advisors.", src: "Bank account verification" },
        { sev: "med", label: "No delivery record", detail: "No signed receiving report for 31 of the radios; the county's inventory lists them as “in transit” since January.", src: "County inventory" }
      ] },
    { id: "RR-57455", mode: "retrospective", sub: "C1", vendor: "V5", award: award("EMW-2023-SS-99305", "SHSP", "FY2023", "VA"), deliverable: "Plan maintenance (subcontract)", budgetLine: "Planning",
      submitted: "2025-08-19 09:40", paidDate: "2025-09-30", riskScore: 89, confidence: 0.88, recommendedAction: "confirm", fwaType: "Undisclosed conflict", network: "N01", amount: 41500, status: "New", assignee: null,
      reason: "Subcontractor registered at the county grant coordinator's home address",
      signals: [{ sev: "high", label: "Subcontractor tied to the coordinator", detail: "DH Readiness Solutions LLC's registered address is the home of Dale R. Hutchins, Larkspur County's grant coordinator, who approved the invoice. No disclosure on file.", src: "Entity resolution · county property records" }] },
    { id: "RR-57188", mode: "retrospective", sub: "C7", vendor: "V3", award: award("EMW-2023-EP-99144", "EMPG", "FY2023", "NC"), deliverable: "Continuity of operations plan", budgetLine: "Planning",
      submitted: "2025-07-08 15:12", paidDate: "2025-08-15", riskScore: 86, confidence: 0.85, recommendedAction: "confirm", fwaType: "Copy-paste deliverable", network: "N01", amount: 79300, status: "New", assignee: null,
      reason: "Continuity plan matches one sold to Brandt County by a “competing” vendor",
      signals: [{ sev: "high", label: "Same plan, different vendor", detail: "91% identical to the continuity plan Chesapeake Readiness Group delivered to Brandt County, MD (RR-57021).", src: "Document fingerprint" }] },
    { id: "RR-56904", mode: "retrospective", sub: "C9", vendor: null, vendorName: "Garrick County payroll", award: award("EMW-2023-EP-99087", "EMPG", "FY2023", "OH"), deliverable: "Emergency management staff · FY2023 salaries", budgetLine: "Personnel",
      submitted: "2025-04-10 11:20", paidDate: "2025-05-16", riskScore: 81, confidence: 0.83, recommendedAction: "confirm", fwaType: "Payroll overcharge", network: "N07", amount: 52100, status: "Assigned", assignee: "Maria Delgado",
      reason: "Two positions also charged in full to a state grant",
      signals: [{ sev: "high", label: "Salaries charged twice", detail: "Two staff salaries charged 100% to EMPG and also in full to a state emergency management grant for the same period.", src: "Subaward ledgers · state grant ledger" }] },
    { id: "RR-57012", mode: "retrospective", sub: "C5", vendor: null, vendorName: "Wexley County (in-house)", award: award("EMW-2023-SS-99305", "SHSP", "FY2023", "VA"), deliverable: "Exercise after-action report", budgetLine: "Exercises",
      submitted: "2025-06-02 10:00", paidDate: "2025-07-01", riskScore: 58, confidence: 0.6, recommendedAction: "dismiss", fwaType: "Shared template", network: null, amount: 18600, status: "New", assignee: null,
      reason: "Report text matches other jurisdictions — looks like a copy",
      signals: [
        { sev: "med", label: "Text matches 40+ reports", detail: "Large blocks of text match after-action reports from other jurisdictions.", src: "Document fingerprint" },
        { sev: "low", label: "Matching text is the federal template", detail: "The shared text is the standard federal exercise (HSEEP) after-action template. The findings, participants and improvement plan are specific to Wexley County.", src: "HSEEP template library" }
      ] }
  ];
  LEADS.forEach(function (l) {
    l.uc = "prep";
    l.exposurePre = l.mode === "prepay" ? l.amount : 0;
    l.exposurePost = l.mode === "prepay" ? 0 : l.amount;
    l.status = l.status || (l.mode === "prepay" ? "Pending" : "New");
    l.source = "Both"; l.providerId = l.network === "N01" ? "CASE-P-0012" : l.id; l.claimId = null;
    l.createdDate = (l.submitted || "").slice(0, 10);
    l.subrecipient = SUBS[l.sub];
    l.state = l.subrecipient.state;
    l.vendorRec = l.vendor ? VENDOR(l.vendor) : null;
    l.payee = l.vendorRec ? l.vendorRec.name : l.vendorName;
  });

  // ---- the network portfolio (Insights › Networks) ----
  var SCHEMES = {
    copyplan: { label: "Copy-paste deliverables", short: "Copy-paste", hub: "Vendor / operator", spoke: "Vendors", color: "#c6362f" },
    bidrig: { label: "Shell bidders · rigged quotes", short: "Shell bidders", hub: "Registered agent", spoke: "Vendors", color: "#b5730e" },
    equipment: { label: "Phantom or double-billed equipment", short: "Equipment", hub: "Reseller", spoke: "Resellers", color: "#8a3ffc" },
    conflict: { label: "Undisclosed conflict · kickback", short: "Conflict", hub: "Official", spoke: "Related companies", color: "#0043ce" },
    payroll: { label: "Payroll charged twice", short: "Payroll", hub: "County EM office", spoke: "Positions", color: "#0072c3" }
  };
  var SCHEME_ORDER = ["copyplan", "bidrig", "equipment", "conflict", "payroll"];
  // atRisk: reimbursed + pending subaward spending matching the network's pattern,
  // FY2023–25 awards. subs: subrecipients paying the network.
  var NETS = [
    { id: "N01", core: true, scheme: "copyplan", name: "Tidewater network", states: ["VA", "MD", "NC", "DE"], programs: ["SHSP", "UASI", "EMPG"], atRisk: 6300000, subs: 31, invoices: 74, status: "Under review", risk: 93,
      spokes: VENDORS.map(function (v) { return v.name; }) },
    { id: "N02", scheme: "conflict", name: "Piedmont Training Collaborative", states: ["NC", "SC"], programs: ["SHSP", "EMPG"], atRisk: 3100000, subs: 14, status: "New", risk: 80, spokes: ["Piedmont Training Collaborative", "Carolina Exercise Group"] },
    { id: "N03", scheme: "copyplan", name: "Gulf States Planning Associates", states: ["AL", "MS", "LA"], programs: ["SHSP", "EMPG"], atRisk: 4200000, subs: 22, status: "Case open", risk: 87, spokes: ["Gulf States Planning Associates", "Delta Continuity LLC", "Mobile Bay Readiness"] },
    { id: "N04", scheme: "equipment", name: "Keystone Public Safety Supply", states: ["PA", "OH"], programs: ["SHSP", "UASI"], atRisk: 4900000, subs: 17, status: "Under review", risk: 89, spokes: ["Keystone Public Safety Supply", "Allegheny Radio Wholesale", "Erie Comms"] },
    { id: "N05", scheme: "conflict", name: "Coordinator-owned LLCs", states: ["GA"], programs: ["SHSP"], atRisk: 1600000, subs: 6, status: "Referred to OIG", risk: 91, spokes: ["Peachtree Readiness LLC", "Ocmulgee Planning LLC"] },
    { id: "N06", scheme: "bidrig", name: "Great Lakes Exercise Design", states: ["MI", "IL"], programs: ["UASI", "SHSP"], atRisk: 3700000, subs: 12, status: "New", risk: 84, spokes: ["Great Lakes Exercise Design", "Lakeshore Preparedness", "Midway Continuity"] },
    { id: "N07", scheme: "payroll", name: "Salaries charged twice · EMPG", states: ["OH", "IN"], programs: ["EMPG"], atRisk: 2400000, subs: 19, status: "Under review", risk: 78, spokes: ["County EM offices (OH)", "County EM offices (IN)"] },
    { id: "N08", scheme: "equipment", name: "Mountain West Comms", states: ["CO", "UT"], programs: ["SHSP", "UASI"], atRisk: 5800000, subs: 15, status: "New", risk: 85, spokes: ["Mountain West Comms", "Wasatch Radio Supply"] },
    { id: "N09", scheme: "bidrig", name: "Twin Rivers Consultants", states: ["MN", "WI"], programs: ["SHSP", "EMPG"], atRisk: 6200000, subs: 24, status: "Case open", risk: 88, spokes: ["Twin Rivers Consultants", "North Star Readiness", "Badger Continuity Group"] }
  ];
  // Cross-network links: the same reseller stock, registered agent, deliverable
  // or account turning up in two networks — usually in different states.
  var BRIDGES = [
    { a: "N01", b: "N04", type: "Same radio serial numbers", detail: "Coastline Comm Supply's radios share a serial-number batch with radios Keystone Public Safety Supply billed to 4 Ohio and Pennsylvania counties." },
    { a: "N01", b: "N06", type: "Same registered agent", detail: "Atlantic Registered Agents is also the agent for Lakeshore Preparedness and Midway Continuity, the “competing” bidders in Great Lakes Exercise Design's wins." },
    { a: "N03", b: "N09", type: "Same deliverable", detail: "Gulf States Planning Associates' continuity plan turns up, renamed, in 9 Minnesota and Wisconsin counties." },
    { a: "N04", b: "N08", type: "Same distributor invoice", detail: "Both resellers bill against the same distributor invoice number." },
    { a: "N02", b: "N05", type: "Same officer", detail: "One officer is listed on Carolina Exercise Group and Peachtree Readiness LLC." },
    { a: "N07", b: "N04", type: "Same county", detail: "Garrick County, OH pays Keystone Public Safety Supply and is in the EMPG payroll pattern." }
  ];
  var AVG = { copyplan: 84000, bidrig: 66000, equipment: 140000, conflict: 42000, payroll: 48000 };
  var PLAN = { fys: "FY2023–25", states: 18, minutesPerInvoice: 90 };
  NETS.forEach(function (n) {
    n.invoices = n.invoices || Math.round(n.atRisk / AVG[n.scheme]);
    n.crossState = n.states.length > 1;
    n.crossProgram = n.programs.length > 1;
  });
  // the flagged plan, sold over and over
  var SAME_PLAN = { name: "Regional Interoperable Communications Plan", jurisdictions: 12, atRisk: 1040000 };

  function rng(seed) { var x = seed; return function () { x = (x * 1103515245 + 12345) % 2147483648; return x / 2147483648; }; }
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 2147483647; return h; }

  // ---- money flow below the state (Insights › Money flow) ----
  // FEMA's systems record the award to the state. Federal subaward reports cover
  // the first tier only. Below that, payments live in state and county systems.
  var FLOW = {
    fy: "FY2024", // illustrative figures, like the rest of the demo
    tiers: [
      { k: "fema", t: "FEMA", s: "awards to states, territories, urban areas", n: "56 recipients", amt: 1364000000, seen: "full" },
      { k: "state", t: "State administrative agencies", s: "pass most of it to local governments", n: "1,870 subawards", amt: 1092000000, seen: "partial" },
      { k: "sub", t: "Subrecipients", s: "counties · cities · urban areas · tribes", n: "~11,400 vendor payments", amt: 1092000000, seen: "none" },
      { k: "vendor", t: "Vendors & payees", s: "consultants · resellers · payroll", n: "~4,900 vendors", amt: 1092000000, seen: "none" }
    ]
  };

  var PREP = {
    PROGRAMS: PROGRAMS, STATES: STATES, SUBS: SUBS, OPERATOR: OPERATOR, VENDORS: VENDORS, GRAPH: GRAPH, LEADS: LEADS,
    SCHEMES: SCHEMES, SCHEME_ORDER: SCHEME_ORDER, NETS: NETS, BRIDGES: BRIDGES, PLAN: PLAN, FLOW: FLOW, SAME_PLAN: SAME_PLAN,
    SEED: "RR-58214", THREAD: "RR-57390", DECISION: "RR-57702", SEED_AMOUNT: 86400, PEER_MEDIAN: 25400,
    INTAKE: { requests: 1284, amount: 61800000, fastLane: 0.88, held: 41 },
    vendor: VENDOR,
    lead: function (id) { return LEADS.filter(function (l) { return l.id === id; })[0] || null; },
    net: function (id) { return NETS.filter(function (n) { return n.id === id; })[0] || null; },
    stats: function () {
      var sum = function (k) { return NETS.reduce(function (t, n) { return t + n[k]; }, 0); };
      var cross = NETS.filter(function (n) { return n.crossState; }).length;
      return { networks: NETS.length, atRisk: sum("atRisk"), invoices: sum("invoices"), subs: sum("subs"), cross: cross, crossPct: Math.round(cross / NETS.length * 100) };
    },
    linked: function (id) {
      // direct links only: the networks that share something with this one
      var ids = {}; ids[id] = 1;
      BRIDGES.forEach(function (b) { if (b.a === id) ids[b.b] = 1; if (b.b === id) ids[b.a] = 1; });
      return NETS.filter(function (n) { return ids[n.id]; });
    },
    // one flagged invoice → the same plan sold again → the vendor network →
    // networks linked to it → every network. Each stage contains the one before.
    funnel: function () {
      var home = PREP.net("N01"), linked = PREP.linked("N01"), S = PREP.stats();
      var lsum = function (k) { return linked.reduce(function (t, n) { return t + n[k]; }, 0); };
      return [
        { key: "reg", label: "One flagged reimbursement", amount: PREP.SEED_AMOUNT, detail: "RR-58214 · held before payment", count: "1 invoice" },
        { key: "store", label: "Same plan, sold again", amount: SAME_PLAN.atRisk, detail: "One communications plan · " + SAME_PLAN.jurisdictions + " jurisdictions", count: SAME_PLAN.jurisdictions + " invoices" },
        { key: "network", label: "Its vendor network", amount: home.atRisk, detail: "5 vendors · 4 states · 3 grant programs", count: home.subs + " subrecipients" },
        { key: "linked", label: "Networks linked to it", amount: lsum("atRisk"), detail: linked.length + " networks · shared radio stock and a registered agent", count: lsum("subs") + " subrecipients" },
        { key: "all", label: "Same patterns, every network", amount: S.atRisk, detail: S.networks + " networks · " + PLAN.states + " states · 5 scheme types", count: S.subs + " subrecipients" }
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
  window.PREP = PREP;
})();
