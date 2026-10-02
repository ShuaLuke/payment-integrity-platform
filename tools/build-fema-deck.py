# Builds the Disaster Relief (FEMA) deck from the presented healthcare deck:
# same layout, new clips (~/dev/fema-clips), FEMA text and speaker notes.
# Usage: python3 tools/build-fema-deck.py <unzipped-base-dir> <out.pptx>
# <unzipped-base-dir>: the presented healthcare deck (~/Desktop/IBM-Payment-Integrity-short-tour.pptx) unzipped.
# Clips come from $CLIPS_DIR or ~/dev/fema-clips (tools/record-clips-fema.cjs).
import os, re, sys, shutil, zipfile, html
base, out = sys.argv[1], sys.argv[2]
work = base.rstrip("/") + "-fema"
shutil.rmtree(work, ignore_errors=True); shutil.copytree(base, work)
CL = os.environ.get("CLIPS_DIR") or os.path.expanduser("~/dev/fema-clips")
MEDIA = {"media1": "picker", "media2": "ingest", "media3": "detect", "media4": "explain", "media5": "agents", "media6": "decision", "media7": "chain", "media9": "allnets", "media8": "funnel"}
POSTER = {"image3": "picker", "image4": "ingest", "image6": "detect", "image7": "explain", "image8": "agents", "image9": "decision", "image10": "chain", "image13": "allnets", "image11": "funnel"}
for m, c in MEDIA.items(): shutil.copy(f"{CL}/{c}.mp4", f"{work}/ppt/media/{m}.mp4")
for m, c in POSTER.items(): shutil.copy(f"{CL}/{c}-poster.png", f"{work}/ppt/media/{m}.png")

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

runs("slide1", {0: "IBM  ·  PAYMENT INTEGRITY  ·  DISASTER RELIEF", 1: "One fraudulent registration held.", 2: "$103.4M behind it.",
  3: "Following one bad actor from the moment a registration arrives to the network behind it.", 14: "20 detected networks · $103.4M at risk",
  15: "IBM Payment Integrity  ·  Disaster Relief  ·  synthetic data, demonstration only"})
runs("slide2", {2: "Every registration, ", 3: "verified", 4: " before it pays", 5: "13", 6: "live data feeds, checked against every registration",
  7: "13 feeds", 8: ": registrations, inspections, identity, death and prisoner records, property records, USPS, damage footprint, insurance, SBA loans, bank accounts, devices",
  9: "Verified survivors ", 10: "paid the same day", 11: "R-104417: $17,280 renter registration, scored 94, ", 12: "held before payment"})
runs("slide3", {5: "held before payment", 6: "Every award scored by rules and models ", 7: "at registration, before payment",
  10: ": the landlord on the lease owns none of the 61 addresses it leases", 11: "Hold: payments held goes from "})
runs("slide4", {3: "$2.7M at one storefront", 4: "214", 5: "registrations on the same lease template", 6: "Same storefront, same lease: a registration we ",
  8: "Two leases compared ", 9: "side by side", 10: ": same template, misspelling and signature", 11: "Half of each award moved out within 48 hours; ", 12: "184 registrations from one facilitator"})
runs("slide5", {7: " read the case: investigative, eligibility, and policy and authorities", 11: "Found: the storefront is ", 12: "1 of 4 run by one operator", 13: " across LA and MS"})
runs("slide6", {4: "$14,880", 6: "The “landlord” on 61 leases registered as a renter in an ", 7: "apartment that doesn’t exist",
  11: "suggests the Crescent Relief case", 12: ": same template, device and accounts", 14: " opens the case, releases a recovery or refers to DHS OIG"})
runs("slide7", {2: "One operator", 3: ", four storefronts, two states", 4: "17", 5: "similar registrations for 17 people, around the one we held",
  6: "Crescent Relief network: ", 7: "one operator, one fee account", 8: "Each storefront has ", 9: "its own phone and page", 10: ", hiding the common operator",
  11: "Six ", 12: "collection accounts", 13: " take awards from several storefronts; half goes to ", 14: "one fee account"})
runs("slide8", {4: " by shared accounts and templates", 5: "50%", 6: "of detected networks span disasters or states", 7: "8,563 registrations, ", 8: "6 declarations",
  10: "same account, lease template, device or phone", 12: "Crescent Relief’s lease template turns up after a ", 13: "California wildfire",
  14: "3 disasters linked", 15: ": $21.4M across the three networks"})
runs("slide11", {5: "$103.4M", 6: "at risk across 20 networks, traced from one $17,280 registration", 7: "$17,280 registration → $2.7M storefront → ",
  8: "$8.6M network → $21.4M linked", 9: "One at a time: ", 10: "8,563 registrations", 11: ", about 8,563 analyst hours",
  14: "6 declarations", 15: "; 36-month lookback, synthetic figures"})
runs("slide9", {0: "One $17,280 registration held at the door led us to a two-state ring, ", 1: "and $103.4M across 20 networks.",
  4: "Registrations, inspections, identity and property records, ", 5: "verified on arrival", 10: ", explained down to the document",
  18: "From one registration to the ", 19: "operation behind it", 22: "From one $17,280 registration to ", 23: "$103.4M across 20 networks",
  24: "IBM Payment Integrity  ·  Disaster Relief  ·  synthetic data, demonstration only"})
runs("slide12", {1: "Katrina and Rita: ", 2: "$600M–$1.4B", 3: " in improper or potentially fraudulent aid",
  4: "GAO, 2006: identity, the damaged address and occupancy weren't verified at registration",
  5: "IN REAL CASES",
  7: "Hurricane Ida: one facilitator recruited nearly 200 people online and kept half of each award", 8: "Shared devices, phones and fee accounts",
  9: "Forged leases, landlord letters and utility bills behind the registrations", 10: "Document fingerprints and owner-of-record checks",
  11: "Lahaina: a co-conspirator posed as the landlord; the pair filed again after the LA fires", 12: "Links across declarations",
  13: "Katrina: 1,000+ registrants used prisoners' names and Social Security numbers", 14: "Identity, death and prisoner checks before payment",
  15: "$1.5M+", 16: "paid on the Hurricane Ida facilitator's registrations; she was sentenced to five years in 2026",
  17: "Schemes like this ", 18: "span disasters", 19: ": half of the networks in the demo do",
  20: "Checking before payment ", 21: "beats chasing it afterward",
  22: "One declaration sees one storefront; ", 23: "a cross-disaster view sees the operation",
  24: "Sources: GAO-06-655 and GAO-06-844T; DOJ, E.D. Pa. (Jan 2026); DOJ, D. Haw. (Jun 2026)"})

notes(1, "Opening (~30 sec): Same platform, new program. On the sign-in screen you pick the program: disaster relief, healthcare claims, and next, veterans' health and benefits. Today it's disaster relief, FEMA Individual Assistance. Payment integrity here comes down to the same four things: ingesting the data, catching the problem before the award pays, helping people manage the work, and uncovering the networks behind the fraud. We'll follow one bad actor, from a single $17,280 registration to the networks behind it: $103.4M across 20 networks. And we do it without slowing down genuine survivors: verified registrations still pay the same day. Everything you'll see is synthetic, including the storm, but the fraud patterns come from real prosecuted cases.")
notes(2, "Step 1 · Ingest (~90 sec). This is live intake for a fictional storm, Hurricane Delphine, in Louisiana: 61,480 registrations so far. On the left is every check a registration runs through before it pays: identity, death and prisoner records through Do Not Pay, parish property records, USPS, the damage footprint, insurance, SBA loans, bank-account ownership and device telemetry. On the right, registrations arrive as we watch. Most verify and pay the same day. But here's one: R-104417, a $17,280 renter registration from Houma, scores 94 and is held. Remember it. A few seconds later the parish assessor comes back: the home's owners registered as living there. Below is the last 24 hours, from registration to payment or hold.")
notes(3, "Step 2 · Real time (~2 min). That registration lands here, at the top of pre-payment review. Every award is scored by rules and models before money goes out, while verified survivors keep moving through the fast lane: 91% are paid the same day. The model says hold. You shouldn't have to take a model's word for it, so hover and it tells you why: the landlord on the lease owns none of the 61 addresses it leases, the owners of record registered separately, and the deposit account is shared. Click Hold, and $17,280 stays put until occupancy is verified. A genuine renter loses a few days; the taxpayer doesn't lose $17,280.")
notes(4, "Step 3 · Pull the thread (~1 min). That $17,280 registration is the thread. This one came through the same storefront three weeks earlier and has already been paid. Put the two leases side by side: same template, same misspelling of 'premises', same landlord signature, different tenants. 'Utilities included in rent' is on every lease from this template, which is why none of these registrants has a utility account. Half of this award moved to one fee account within 48 hours. The same facilitator, Crescent Relief Navigators, filed 184 registrations worth $2.7M. We stop the next one before it pays and recover these.")
notes(5, "Step 4 · AI assist (~90 sec). Every flag becomes a tracked registration with a full audit trail, and the analyst doesn't start from scratch. Three AI agents read the case, each through its own lens: investigative (the entity, its network and open sources), eligibility (identity, occupancy, ownership, duplication of benefits), and policy (the Stafford Act, 44 CFR 206 and recovery). Each shows the sources it used. And the investigative agent has already followed the thread: the storefront advertises 'we file everything, you pay when FEMA pays', and it's one of four such pages in Louisiana and Mississippi run by one operator. That's hours of research, done in the time it took to open the case. The assistant also drafts the letters.")
notes(6, "Step 5 · Decision (~90 sec). Here's the 'landlord' himself. Jarrod Fontenot signs the leases for Fontenot Rentals, the landlord on 61 registrations, and he registered as a displaced renter in an apartment that doesn't exist. The analyst confirms the registration is ineligible with a coded reason and an AI-drafted justification. The system suggests where it belongs: on the Crescent Relief case, because it shares the lease template, the device and the collection accounts. But the analyst can't move money: only a supervisor approves the recovery, opens the case or refers it to DHS OIG. Every decision feeds back to retrain the models.")
notes(7, "Step 6 · Network (~2 min). Now the whole picture, down to the registration. At the top is one operator. Below it are four 'FEMA application help' storefronts, each with its own phone and page, so on paper they look unrelated. Our $17,280 registration is in red, with 17 more like it, filed for 17 different people. Now follow the lines down to the six collection accounts. Every one of them receives awards filed through different storefronts, in different names, and about half of each award moves on to one fee account. That's what ties the four storefronts together. One operator, two states, 597 registrations, $8.6M.")
notes(8, "Step 7 · Linked networks (~1 min). And Crescent Relief isn't working alone. This map shows every network detected across six declarations: 20 of them. The red dashed lines are the same collection account, lease template, device or phone turning up in two networks. Crescent Relief's lease template, misspelling and all, appears on 88 registrations after a California wildfire, and one of its collection accounts took awards after the Texas floods. Three linked networks across three disasters add up to $21.4M. Half of all these networks span more than one disaster or state, which a review of one declaration would never see.")
notes(11, "Step 8 · Impact (~1 min). Now follow the numbers from that one $17,280 registration: the storefront's own registrations come to $2.7M; the operator's network, $8.6M; the networks linked to it by a shared account and lease template, $21.4M; and the same patterns across all 20 detected networks, $103.4M, over six declarations and 36 months. Nobody finds that by verifying 8,563 registrations one at a time, about an hour each. One flag opens the network, analysts work 20 cases instead, and survivors keep getting paid the same day. Figures are synthetic; for scale, GAO estimated $600 million to $1.4 billion after Katrina and Rita alone.")
notes(9, "Close (~45 sec): That's the loop: we bring in registrations and every source needed to verify them, catch the problem before the award pays and explain why, give your analysts AI that does the legwork with a human in control, expose the operation behind the fraud, and size what it's worth. One $17,280 registration led to $103.4M across 20 networks, and nobody had to verify 8,500 registrations by hand to find it. It's the same platform as the healthcare demo, configured for disaster relief. The backup slide shows the platforms it runs on. Happy to go deeper on any piece, or show how this runs on your own data.")
notes(12, "Why this example (~45 sec). The scenario isn't hypothetical. After Hurricanes Katrina and Rita, GAO estimated $600 million to $1.4 billion in improper and potentially fraudulent individual-assistance payments, mainly because identity, the damaged address and occupancy weren't verified at registration. More than 1,000 registrants used the names and Social Security numbers of prisoners. The pattern we followed today is real too. After Hurricane Ida, a Pennsylvania woman recruited people on social media, filed for nearly 200 of them with forged leases, landlord letters and utility bills, and took half of each payout. FEMA paid out more than $1.5 million, and she was sentenced to five years in January 2026. After the Lahaina fire, one defendant claimed to live in a home while a co-conspirator posed as his landlord, and the pair filed again after the Los Angeles fires: the cross-disaster link the demo shows. One declaration sees one storefront; a view across declarations sees the operation. And checking before payment means the money doesn't have to be chased afterward, while verified survivors still get paid fast.")

# backup slide: FAMS card worded for a non-healthcare program (no new product claims)
runs("slide10", {6: "Integrates and governs payment and eligibility data",
  22: "Links people and businesses through shared ownership, addresses, accounts and agents",
  14: "Scores each subject against its peer group to surface outliers",
  15: "Built for healthcare; this demo applies the same peer and outlier scoring to registrations"})
notes(10, "Backup: technology stack. The capabilities in the demo map to three platforms. IBM Federal ATOM is the data and AI foundation: it integrates and governs payment and eligibility data, adds intelligent automation and agentic AI, and runs as a managed service in a government-only cloud at FedRAMP High. IBM FAMS, the Fraud and Abuse Management System, is the detection engine: it scores each subject against its peer group and surfaces the outliers. Health plans and state Medicaid programs use it today; in this demo the same peer and outlier scoring is applied to disaster-assistance registrations. TrackLight, a partner platform, adds entity and network intelligence: the ownership, addresses, agents and open-source records that tie entities together.")

# document title
p = f"{work}/docProps/core.xml"
if os.path.exists(p):
    s = open(p).read(); s = re.sub(r"<dc:title>[^<]*</dc:title>", "<dc:title>IBM Payment Integrity · Disaster Relief</dc:title>", s); open(p, "w").write(s)

# zip, [Content_Types].xml first
if os.path.exists(out): os.remove(out)
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    z.write(f"{work}/[Content_Types].xml", "[Content_Types].xml")
    for root, _, files in os.walk(work):
        for f in files:
            full = os.path.join(root, f); rel = os.path.relpath(full, work)
            if rel == "[Content_Types].xml": continue
            z.write(full, rel, compress_type=zipfile.ZIP_STORED if f.endswith((".mp4", ".png")) else zipfile.ZIP_DEFLATED)
print("wrote", out, os.path.getsize(out))
