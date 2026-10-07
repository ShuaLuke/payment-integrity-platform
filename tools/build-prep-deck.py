# Builds the Preparedness Grants deck from the presented Disaster Relief deck
# (~/Desktop/IBM-Payment-Integrity-Disaster-Relief.pptx, 11 slides, with the user's
# own edits): same layout, new clips (~/dev/prep-clips), new text and speaker notes,
# plus a hidden appendix slide 12 for our team (what preparedness grants fund).
# Text is replaced by run index, so the base must be that deck's current layout.
# Usage: python3 tools/build-prep-deck.py <base.pptx> <out.pptx>
# Clips come from $CLIPS_DIR or ~/dev/prep-clips (tools/record-clips-prep.cjs).
import os, re, sys, shutil, zipfile, html, tempfile
base, out = sys.argv[1], sys.argv[2]
work = tempfile.mkdtemp(prefix="prep-deck-")
with zipfile.ZipFile(base) as z: z.extractall(work)
CL = os.environ.get("CLIPS_DIR") or os.path.expanduser("~/dev/prep-clips")
ORDER = ["ingest", "detect", "explain", "agents", "decision", "chain", "allnets", "funnel"]
POSTERS = ["image3", "image5", "image6", "image7", "image8", "image9", "image10", "image11"]
for i, c in enumerate(ORDER):
    shutil.copy(f"{CL}/{c}.mp4", f"{work}/ppt/media/media{i + 1}.mp4")
    shutil.copy(f"{CL}/{c}-poster.png", f"{work}/ppt/media/{POSTERS[i]}.png")

E = lambda t: html.escape(t, quote=False)
def runs(slide, mapping):
    p = f"{work}/ppt/slides/{slide}.xml"; s = open(p).read(); k = [-1]
    def rep(m):
        k[0] += 1
        return "<a:t>" + E(mapping[k[0]]) + "</a:t>" if k[0] in mapping else m.group(0)
    s = re.sub(r"<a:t>[^<]*</a:t>", rep, s)
    open(p, "w").write(s)
def notes(n, text):
    p = f"{work}/ppt/notesSlides/notesSlide{n}.xml"; s = open(p).read()
    s = re.sub(r"<a:t>[^<]*</a:t>", lambda m: "<a:t>" + E(text) + "</a:t>", s, count=1)
    open(p, "w").write(s)

# ---- appendix: copy slide 11's layout as slide 12, hidden in the slideshow ----
S = f"{work}/ppt"
shutil.copy(f"{S}/slides/slide11.xml", f"{S}/slides/slide12.xml")
s = open(f"{S}/slides/slide12.xml").read().replace("<p:sld ", '<p:sld show="0" ', 1); open(f"{S}/slides/slide12.xml", "w").write(s)
shutil.copy(f"{S}/notesSlides/notesSlide11.xml", f"{S}/notesSlides/notesSlide12.xml")
shutil.copy(f"{S}/notesSlides/_rels/notesSlide11.xml.rels", f"{S}/notesSlides/_rels/notesSlide12.xml.rels")
r = open(f"{S}/notesSlides/_rels/notesSlide12.xml.rels").read().replace("slides/slide11.xml", "slides/slide12.xml"); open(f"{S}/notesSlides/_rels/notesSlide12.xml.rels", "w").write(r)
r = open(f"{S}/slides/_rels/slide11.xml.rels").read().replace("notesSlide11.xml", "notesSlide12.xml"); open(f"{S}/slides/_rels/slide12.xml.rels", "w").write(r)
ct = open(f"{work}/[Content_Types].xml").read()
ct = ct.replace("</Types>", '<Override PartName="/ppt/slides/slide12.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
                '<Override PartName="/ppt/notesSlides/notesSlide12.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/></Types>')
open(f"{work}/[Content_Types].xml", "w").write(ct)
pr = open(f"{S}/_rels/presentation.xml.rels").read()
rid = "rId" + str(max(int(x) for x in re.findall(r'Id="rId(\d+)"', pr)) + 1)
pr = pr.replace("</Relationships>", f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide12.xml"/></Relationships>')
open(f"{S}/_rels/presentation.xml.rels", "w").write(pr)
p = open(f"{S}/presentation.xml").read()
sid = max(int(x) for x in re.findall(r'<p:sldId id="(\d+)"', p)) + 1
p = p.replace("</p:sldIdLst>", f'<p:sldId id="{sid}" r:id="{rid}"/></p:sldIdLst>'); open(f"{S}/presentation.xml", "w").write(p)
a = f"{work}/docProps/app.xml"
if os.path.exists(a): s = open(a).read(); s = re.sub(r"<Slides>\d+</Slides>", "<Slides>12</Slides>", s); open(a, "w").write(s)

FOOT = "IBM Payment Integrity  ·  Preparedness Grants  ·  synthetic data, demonstration only"
runs("slide1", {0: "IBM  ·  PAYMENT INTEGRITY  ·  PREPAREDNESS", 1: "One flagged invoice.", 2: "$38.2M behind it.",
  3: "Following one county reimbursement below the state, to the vendors behind it.", 4: "FROM ONE INVOICE TO THE NETWORK",
  5: "$86,400", 6: "Held before payment", 7: "RR-58214, one county's plan",
  8: "$1.04M", 9: "Same plan, sold again", 10: "12 jurisdictions, 4 states",
  11: "$6.3M", 12: "Its vendor network", 13: "5 vendors, 31 subrecipients",
  14: "$14.9M", 15: "Linked networks", 16: "Shared radio stock and agent",
  17: "$38.2M", 18: "Every network", 19: "9 networks, 18 states",
  30: FOOT, 31: "Prepared for FEMA  ·  October 2026"})
runs("slide2", {2: "Every dollar, ", 3: "followed", 4: " below the state", 5: "11", 6: "data sources join FEMA, state, county and vendor records",
  7: "4 tiers", 8: ": FEMA awards, state subaward ledgers, county invoices and payments, and the vendors behind them",
  9: "Today FEMA sees ", 10: "only the first tier", 11: "RR-58214: $86,400 plan for Larkspur County, VA, ", 12: "traced to its vendor"})
runs("slide3", {4: "$86,400", 5: "held before reimbursement", 6: "Every request scored by rules and models ", 7: "before the state reimburses it",
  10: ": the plan matches 11 other jurisdictions and costs 3.4× the peer median", 11: "Hold: payments held goes from ", 12: "$0 to $86,400"})
runs("slide4", {2: "Pull the thread: ", 3: "$1.04M for one plan", 4: "12", 5: "jurisdictions in 4 states bought the same plan",
  6: "Same vendor, same plan: a county we ", 7: "already reimbursed", 8: "Two plans compared ", 9: "side by side",
  10: ": same text, same typo, another county’s radio channel", 11: "Federal templates excluded; ", 12: "94% identical text"})
runs("slide5", {7: " read the case: investigative, grant compliance, and policy", 11: "Found: the three “competing” bidders ",
  12: "share an agent, phone and account", 13: " across four states"})
runs("slide6", {4: "$212,600", 6: "31 of the 48 radios on the invoice were ", 7: "already billed to another county",
  8: "Disallow with a coded reason and an ", 11: "suggests the Tidewater case", 12: ": the reseller is paid into the network’s account"})
runs("slide7", {2: "One owner", 3: ", five vendors, four states", 4: "17", 5: "related invoices around the one we held, in 8 counties",
  6: "Tidewater network: ", 7: "one agent, one phone, one account", 8: "Each vendor has ", 9: "its own name and state", 10: ", hiding the common owner",
  11: "Each ", 12: "county pays several", 13: " of the vendors, ", 14: "each a routine local purchase"})
runs("slide8", {2: "9 networks, ", 3: "several linked", 4: " by shared agents and stock", 5: "89%", 6: "of detected networks span more than one state",
  7: "160 subrecipients, ", 8: "18 states", 10: "same agent, officer, deliverable or equipment",
  12: "Coastline’s radios share a serial-number batch with ", 13: "a reseller ring in Ohio and Pennsylvania", 14: "3 networks linked", 15: ": $14.9M across the three"})
runs("slide9", {3: "9 networks uncovered", 5: "$38.2M", 6: "at risk across 9 networks, traced from one $86,400 invoice",
  7: "$86,400 invoice → $1.04M same plan → ", 8: "$6.3M network → $14.9M linked", 10: "512 invoices", 11: ", in 160 local finance systems",
  13: "9 cases, evidence assembled", 14: "FY2023–25 awards", 15: " across 18 states; synthetic figures"})
runs("slide10", {0: "One $86,400 invoice held before payment led us to a four-state vendor network, ", 1: "and $38.2M across 9 networks.",
  4: "Awards, subawards, county invoices and vendor records, ", 5: "joined below the state", 18: "From one invoice to the ", 19: "vendors behind it",
  22: "From one $86,400 invoice to ", 23: "$38.2M across 9 networks", 24: FOOT})
runs("slide11", {1: "Below the state: ", 2: "14 of 22", 3: " subgrantees broke equipment rules",
  4: "DHS OIG, Montana, 2011: no inventories, unlabeled property, equipment not tied to a grant year",
  7: "Cook County, IL: a county grant manager allegedly had vendors inflate invoices, then took $108K+ in kickbacks",
  8: "Peer pricing, unit counts and pass-through payees",
  9: "California: one administrator ran firefighter grants for two county associations and billed FEMA for goods never bought",
  10: "One vendor across several recipients",
  11: "Texas: $1.03M in questioned homeland security grant costs; weak property, salary and procurement records",
  12: "Equipment, payroll and procurement checks",
  13: "Virgin Islands: kickbacks hidden in a chain of contractors on a homeland security vehicle contract",
  14: "Shared officers, agents and accounts",
  15: "$1.2M", 16: "misappropriated from FEMA firefighter grants by one grant administrator; sentenced in 2022",
  17: "GAO: ", 18: "36% of 3,680 single-audit findings", 19: " involved subaward oversight",
  20: "The demo story is a ", 21: "composite of these patterns",
  22: "One state sees one county's purchase; ", 23: "a cross-state view sees the vendor",
  24: "Sources: DHS OIG-12-16, OIG-17-15; DOJ, N.D. Ill. (Aug 2014; charges, not a conviction); DOJ, E.D. Cal. (Oct 2022); DOJ (Oct 2007); GAO-25-107315"})
runs("slide12", {0: "APPENDIX  ·  FOR OUR TEAM", 1: "What preparedness grants ", 2: "actually fund", 3: ", and why it matters for the story",
  4: "Preparedness buys plans, equipment, training and staff.",
  5: "PROGRAM  ·  WHO GETS IT", 6: "WHAT IT BUYS",
  7: "State Homeland Security Program and Urban Area Security Initiative: states, which pass most of it to locals, and high-risk metro areas",
  8: "Plans, equipment, training, exercises; fusion centers",
  9: "Emergency Management Performance Grants: state and local emergency management offices",
  10: "Mostly salaries (50% cost share)",
  11: "Operation Stonegarden and Nonprofit Security Grants: border-area police; nonprofits, through the state",
  12: "Overtime, vehicles, equipment; cameras, doors, barriers, guards",
  13: "Fire grants (equipment, SAFER staffing) and Port and Transit Security: fire departments; port and transit authorities",
  14: "Gear, apparatus, firefighter salaries; security equipment and training",
  15: "1st tier", 16: "is as far as federal subaward reporting goes, larger subawards only, and often incomplete",
  17: "So the fraud is ", 18: "vendors, consultants, equipment and payroll", 19: ", not bad construction",
  20: "County-to-vendor payments sit in ", 21: "state and local systems FEMA never sees",
  22: "The demo shows FEMA's analyst; ", 23: "states and counties could use the same view",
  24: "Sources: FEMA Preparedness Grants Manual; 2 CFR 200; GAO-25-107315. Internal reference, hidden in the slideshow."})

notes(1, "Opening. This is the same IBM Payment Integrity platform, configured for FEMA preparedness grants: the State Homeland Security Program, the Urban Area Security Initiative and Emergency Management Performance Grants. Once these grants are awarded to a state, it is hard to see where the money goes. This demo follows one county's reimbursement request below the state, to the vendor and the network behind it: from one $86,400 invoice to $38.2M across 9 networks. Requests that check out go straight through, so well-run subrecipients aren't slowed down. All data is synthetic, including the counties and vendors; the patterns come from documented cases and audits.")
notes(2, "Step 1 · Ingest. FEMA awards the grant to the state; the state passes most of it to counties, cities and urban areas; they pay vendors. Federal systems capture the award to the state, and federal subaward reports cover only part of the next tier. County invoices and the vendors behind them are not visible at the federal level. This view joins all four tiers: state subaward ledgers, county invoices and payments, the deliverables themselves, equipment inventories, SAM.gov and state business registries. We follow one request down: Larkspur County, Virginia, asking to be reimbursed $86,400 for a communications plan from Tidewater Preparedness Partners.")
notes(3, "Step 2 · Detect. The request lands at the top of pre-payment review with a risk score of 93 and a recommendation to hold. Every reimbursement request is scored before it is paid, and 88% pass every check and go straight through. Each recommendation explains itself: the plan matches plans sold to 11 other jurisdictions, the price is 3.4 times the peer median, and the vendor was formed eight months before the award. Holding the request keeps the $86,400 in place until the procurement file is checked; if it checks out, the payment is released.")
notes(4, "Step 3 · Pull the thread. This is a related request from Brandt County, Maryland, a year earlier, already reimbursed. Side by side, the two plans have the same text, the same tables and the same misspelling of 'interoperability', and Larkspur County's plan names a Maryland county's radio channel as its own primary mutual-aid channel. Federal templates are excluded from the comparison, so this is not shared boilerplate. Twelve jurisdictions in four states bought the same plan, for $1.04M in total.")
notes(5, "Step 4 · AI assist. Every flag becomes a tracked case with a full audit trail. Three AI agents review the case: investigative (the vendors, who owns them and what they share), grant compliance (the deliverable, price, procurement and equipment) and policy (2 CFR 200 and the grant terms). Each finding cites its sources. Here, the investigative agent finds that the three 'competing' bidders share a registered agent, a phone, a bank account and an officer, and that a subcontractor is registered at the home of the county grant coordinator who approved the invoices.")
notes(6, "Step 5 · Decision. The same network, a different scheme: Merrow County, North Carolina was reimbursed $212,600 for 48 radios, and 31 of those serial numbers already appear on Brandt County, Maryland's inventory, sold by the same reseller a year earlier. Grant-funded equipment must be recorded by serial number, so matching inventories across states catches it. The analyst disallows the cost with a coded reason and an AI-drafted justification, and the system suggests adding it to the Tidewater case because the reseller is paid into the same account as one of the bidders. Only a supervisor can approve the recovery, open the case or refer it to DHS OIG.")
notes(7, "Step 6 · Network. Five vendors in four states, each with its own name, phone and state registration, look unrelated on paper. They share one registered agent, one phone, one deposit account and one officer. The $86,400 invoice is shown in red. Each county pays several of these vendors, and in its own books every payment looks like a routine local purchase. Joined across states, they form one network: 31 subrecipients, three grant programs, $6.3M.")
notes(8, "Step 7 · Linked networks. This view shows all 9 vendor networks detected across 18 states. Dashed red lines mark the same registered agent, officer, deliverable or equipment appearing in two networks. The reseller's radios share a serial-number batch with a reseller ring billing Ohio and Pennsylvania counties, and Tidewater's registered agent also represents the 'competing' bidders in an exercise-design ring in Michigan and Illinois. Three linked networks total $14.9M, and no single state would see the connection. Entity validation across jurisdictions is what surfaces it.")
notes(9, "Step 8 · Impact. From one $86,400 invoice: the same plan sold again, $1.04M; the vendor network, $6.3M; linked networks, $14.9M; the same patterns across all 9 networks, $38.2M in FY2023–2025 awards. Finding this one invoice at a time would mean reviewing 512 invoices across 160 local finance systems. Instead, one flag opens the network and analysts work 9 cases. Figures are synthetic.")
notes(10, "Close. The platform joins the money below the state, flags problems before the reimbursement is paid and explains why, gives analysts AI that does the research while people make the decisions, uncovers vendor networks across jurisdictions, and sizes the impact. One $86,400 invoice led to $38.2M across 9 networks. It is the same platform shown for disaster relief and healthcare claims, configured for preparedness grants. A further idea for reducing administrative burden after a disaster: let people pre-register for disaster assistance ahead of time, so afterward they only report damage, and in areas that are fully flooded, initial assistance could be issued automatically.")
notes(11, "Why this example. These patterns are documented. DHS Inspector General audits of state homeland security grants found that 14 of 22 Montana subgrantees were not following equipment rules, and questioned $1.03 million in Texas costs over weak property, salary and procurement records. In Cook County, Illinois, a county homeland security office manager was charged in 2014 with having vendors inflate invoices on a $10.3 million federal flood-relief grant and taking more than $108,000 in kickbacks; these were charges, not a conviction. In California, a grant administrator for two county fire chiefs associations misappropriated more than $1.2 million in FEMA firefighter grants and was sentenced in 2022. GAO found that about 36% of 3,680 single-audit findings involved subaward oversight. The demo story is a composite of these patterns, not a single real case.")
notes(12, "Background. Preparedness grants go mainly to state and local governments rather than individuals, and they fund plans, equipment, training, exercises and staff. Fraud risk therefore centers on vendors, consultants, equipment and payroll. Federal subaward reporting covers only the first tier and larger subawards, and reports are often incomplete (GAO-25-107315); payments from counties to vendors sit in state and local finance systems. The same view could serve FEMA grant program staff or a state administrative agency.")

p = f"{work}/docProps/core.xml"
if os.path.exists(p):
    s = open(p).read(); s = re.sub(r"<dc:title>[^<]*</dc:title>", "<dc:title>IBM Payment Integrity · Preparedness Grants</dc:title>", s); open(p, "w").write(s)

# zip, [Content_Types].xml first
if os.path.exists(out): os.remove(out)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(f"{work}/[Content_Types].xml", "[Content_Types].xml")
    for root, _, files in os.walk(work):
        for f in files:
            full = os.path.join(root, f); rel = os.path.relpath(full, work)
            if rel == "[Content_Types].xml": continue
            z.write(full, rel, compress_type=zipfile.ZIP_STORED if f.endswith((".mp4", ".png")) else zipfile.ZIP_DEFLATED)
shutil.rmtree(work)
print("wrote", out, os.path.getsize(out))
