# Builds the Treasury deck from the Preparedness Grants deck
# (~/Desktop/IBM-Payment-Integrity-Preparedness-Grants.pptx, 12 slides, slide 12 a
# hidden appendix): same layout, new clips (~/dev/treas-clips), new text and
# speaker notes. Text is replaced by run index, so the base must be that deck's
# current layout. Usage: python3 tools/build-treas-deck.py <base.pptx> <out.pptx>
# Clips come from $CLIPS_DIR or ~/dev/treas-clips (tools/record-clips-treas.cjs).
# v2 (Oct 14): three slides are added by copying the base's clip slide 3 —
# TrackLight checks (after Detect), and the hand-off and the IRS decision (after
# Impact) — for 15 slides, the appendix still last and hidden.
import os, re, sys, shutil, zipfile, html, tempfile
base, out = sys.argv[1], sys.argv[2]
work = tempfile.mkdtemp(prefix="treas-deck-")
with zipfile.ZipFile(base) as z: z.extractall(work)
CL = os.environ.get("CLIPS_DIR") or os.path.expanduser("~/dev/treas-clips")
ORDER = ["ingest", "detect", "explain", "agents", "decision", "chain", "allnets", "funnel"]
POSTERS = ["image3", "image5", "image6", "image7", "image8", "image9", "image10", "image11"]
for i, c in enumerate(ORDER):
    shutil.copy(f"{CL}/{c}.mp4", f"{work}/ppt/media/media{i + 1}.mp4")
    shutil.copy(f"{CL}/{c}-poster.png", f"{work}/ppt/media/{POSTERS[i]}.png")

# ---- added slides: copies of clip slide 3 (its media2.mp4 / image5.png poster) ----
# (new slide number, clip, insert after this existing slide)
ADDED = [(13, "tracklight", 3), (16, "discovery", 7), (14, "handoff", 9), (15, "irs", 14), (17, "ring", 15)]
def rd(p): return open(f"{work}/{p}").read()
def wr(p, s): open(f"{work}/{p}", "w").write(s)
ct, prels, pres = rd("[Content_Types].xml"), rd("ppt/_rels/presentation.xml.rels"), rd("ppt/presentation.xml")
next_rid = max(int(x) for x in re.findall(r'Id="rId(\d+)"', prels)) + 1
next_sid = max(int(x) for x in re.findall(r'<p:sldId id="(\d+)"', pres)) + 1
for k, (n, clip, after) in enumerate(ADDED):
    m, img = 9 + k, 13 + k
    shutil.copy(f"{CL}/{clip}.mp4", f"{work}/ppt/media/media{m}.mp4")
    shutil.copy(f"{CL}/{clip}-poster.png", f"{work}/ppt/media/image{img}.png")
    shutil.copy(f"{work}/ppt/slides/slide3.xml", f"{work}/ppt/slides/slide{n}.xml")
    wr(f"ppt/slides/_rels/slide{n}.xml.rels", rd("ppt/slides/_rels/slide3.xml.rels").replace("media2.mp4", f"media{m}.mp4").replace("image5.png", f"image{img}.png").replace("notesSlide3.xml", f"notesSlide{n}.xml"))
    shutil.copy(f"{work}/ppt/notesSlides/notesSlide3.xml", f"{work}/ppt/notesSlides/notesSlide{n}.xml")
    wr(f"ppt/notesSlides/_rels/notesSlide{n}.xml.rels", rd("ppt/notesSlides/_rels/notesSlide3.xml.rels").replace("slide3.xml", f"slide{n}.xml"))
    ct = ct.replace("</Types>", f'<Override PartName="/ppt/slides/slide{n}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        f'<Override PartName="/ppt/notesSlides/notesSlide{n}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/></Types>')
    rid = f"rId{next_rid + k}"
    prels = prels.replace("</Relationships>", f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{n}.xml"/></Relationships>')
    after_rid = re.search(r'Id="(rId\d+)"[^>]*Target="slides/slide%d\.xml"' % after, prels).group(1)
    pres = re.sub(r'(<p:sldId id="\d+" r:id="%s"/>)' % after_rid, r'\1<p:sldId id="%d" r:id="%s"/>' % (next_sid + k, rid), pres)
# the deck in the tour's order: refund → how it was found → the ring → Gloria → every network → hand-off → the whole ring
FINAL = [1, 2, 3, 13, 4, 5, 16, 7, 6, 8, 9, 14, 15, 17, 10, 11, 12]
ridOf = dict((int(n), r) for r, n in re.findall(r'Id="(rId\d+)"[^>]*Target="slides/slide(\d+)\.xml"', prels))
ids = re.findall(r'<p:sldId id="(\d+)" r:id="(rId\d+)"/>', pres)
pres = re.sub(r'<p:sldIdLst>.*?</p:sldIdLst>', '<p:sldIdLst>' + ''.join('<p:sldId id="%d" r:id="%s"/>' % (256 + k, ridOf[n]) for k, n in enumerate(FINAL)) + '</p:sldIdLst>', pres, flags=re.S)
wr("[Content_Types].xml", ct); wr("ppt/_rels/presentation.xml.rels", prels); wr("ppt/presentation.xml", pres)
app = rd("docProps/app.xml"); n_all = 12 + len(ADDED)
wr("docProps/app.xml", re.sub(r"<Slides>\d+</Slides>", f"<Slides>{n_all}</Slides>", re.sub(r"<Notes>\d+</Notes>", f"<Notes>{n_all}</Notes>", app)))

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

FOOT = "IBM Payment Integrity  ·  Treasury payments  ·  synthetic data, demonstration only"
runs("slide1", {0: "IBM  ·  PAYMENT INTEGRITY  ·  TREASURY", 1: "One held payment.", 2: "$100.4M behind it.",
  3: "From one refund that passed every check to its network, and back to IRS.", 4: "FROM ONE PAYMENT TO THE NETWORK",
  5: "$18,940", 6: "Held before payment", 7: "PV-73194, passed every check",
  8: "$505K", 9: "Same mailbox", 10: "46 payments, 3 agencies",
  11: "$7.4M", 12: "Its network", 13: "9 account batches, 386 payees",
  14: "$22.7M", 15: "Linked networks", 16: "Shared account batch and phone",
  17: "$100.4M", 18: "Every network", 19: "14 networks, 23 states",
  30: FOOT, 31: "Prepared for the Department of the Treasury  ·  October 2026"})
runs("slide2", {2: "Every payment, ", 3: "checked together", 4: ", not one at a time", 5: "12", 6: "data sources join agency, Treasury, bank and payee records",
  7: "4 steps", 8: ": agencies certify, Treasury verifies and disburses, banks receive, payees collect",
  9: "Today each check sees ", 10: "one payment at a time", 11: "PV-73194: $18,940 refund to Anna Reed, ", 12: "traced to its mailbox"})
runs("slide3", {2: "It passed ", 3: "every check", 4: "$18,940", 5: "flagged before disbursement, risk 92", 6: "Passed Do Not Pay, account ownership and TIN; ", 7: "flagged by the pattern around it",
  10: ": account 19 days old in a batch of 34, a mailbox shared with 29 payees", 11: "Refer to IRS: ", 12: "only IRS can stop it"})
runs("slide13", {0: "02  ", 1: "BEYOND THE LISTS", 2: "Every check passed. ", 3: "TrackLight's didn't", 4: "13", 5: "TrackLight findings; Do Not Pay found none",
  6: "Do Not Pay asks if a payee is on a list; ", 7: "TrackLight asks who they really are", 8: "The identity lives in ", 9: "Ohio, not Georgia",
  10: ": the W-2 employer shares an agent and an officer with 7 shells", 11: "Also: a death found ", 12: "before the Death Master File"})
runs("slide16", {0: "04  ", 1: "HOW IT WAS FOUND", 2: "Nine events, ", 3: "six weeks", 4: "9", 5: "signals, each from one source lane, assembled the ring",
  6: "A mailbox, a batch, an obituary, eight shells, ", 7: "one preparer, an SSA flag", 8: "312 of 386 identities ", 9: "from one clinic",
  10: ": where investigators would look for the insider", 11: "The real rings took ", 12: "two years by hand"})
runs("slide17", {0: "07  ", 1: "THE WHOLE RING", 2: "Refer the ring, ", 3: "not one refund", 4: "612", 5: "IRS refunds in one referral; 41 not yet paid, held in one move",
  6: "One referral per agency: ", 7: "IRS, SSA, OPM", 8: "The ring travels with it: ", 9: "organizer, batches, mailbox, employers",
  10: ", and every payment ID as structured data", 11: "IRS opens a case; ", 12: "every payment shows its status"})
runs("slide14", {0: "06  ", 1: "HAND OFF", 2: "Treasury recommends, ", 3: "the agency decides", 4: "10", 5: "fields shared, scoped to this request",
  6: "One package, two forms: ", 7: "readable (with a PDF) and structured", 8: "A shared schema ", 9: "the government owns",
  10: ": any agency's system can read it, whoever built it", 11: "Only the certifying agency ", 12: "can stop a payment"})
runs("slide15", {0: "06  ", 1: "AGENCY DECIDES", 2: "IRS stops it, ", 3: "in its own system", 4: "$18,940", 5: "stopped by IRS on Treasury's recommendation",
  6: "Two systems, side by side: ", 7: "Treasury's and IRS's", 8: "The decision ", 9: "comes back", 10: ": Treasury's record, queue and audit trail update",
  11: "Agency flags in, ", 12: "recommendations out"})
runs("slide4", {2: "Pull the thread: ", 3: "one mailbox, 3 agencies", 4: "46", 5: "federal payments to 30 different payees in 13 months",
  6: "Same mailbox, same account batch: a refund we ", 7: "already paid", 8: "Everyone paid at the address, ", 9: "across agencies",
  10: ": tax refunds, Social Security benefits, federal annuities", 11: "The real taxpayer filed separately; ", 12: "$505K through one box"})
runs("slide5", {7: " read the case: investigative, payment verification, and policy", 11: "Found: eight W-2 employers ",
  12: "formed at the mailbox, no real payroll", 13: ", one registered agent"})
runs("slide6", {4: "$7,640", 5: "submitted for reclamation after supervisor approval", 6: "SSA flagged a benefit redirected by phone; ", 7: "Treasury tied it to the network",
  8: "Reclaim with a coded reason and an ", 11: "suggests the Delmont case", 12: ": same account batches, mailbox and phone",
  14: " opens the case, releases a reclamation or refers to TIGTA / IRS-CI"})
runs("slide7", {2: "One organizer", 3: ", 386 payees, three agencies", 4: "12", 5: "related payments around the one we held, in 7 account batches",
  6: "Delmont network: ", 7: "one mailbox, one phone, nine account batches", 8: "Each account is ", 9: "in its payee's own name", 10: ", so each one passes the ownership check",
  11: "TrackLight: ", 12: "1 deceased, 1 in custody, 2 stolen IDs", 13: ", ", 14: "2 on two accounts"})
runs("slide8", {2: "14 networks, ", 3: "several linked", 4: " by shared accounts and phones", 5: "43%", 6: "of detected networks span more than one agency",
  7: "4,062 payees, ", 8: "23 states", 10: "same account batch, phone, recruiter or domain",
  12: "Delmont's account batch runs straight into ", 13: "a Florida mailbox ring's accounts", 14: "3 networks linked", 15: ": $22.7M across the three"})
runs("slide9", {3: "14 networks uncovered", 5: "$100.4M", 6: "at risk across 14 networks, traced from one $18,940 refund",
  7: "$18,940 refund → $505K mailbox → ", 8: "$7.4M network → $22.7M linked", 10: "12,131 payments", 11: ", hidden among more than a billion a year",
  13: "14 cases, evidence assembled", 14: "Sep 2025 – Oct 2026", 15: " across 23 states; synthetic figures"})
runs("slide10", {0: "One $18,940 refund that passed every check led to $100.4M across 14 networks, ", 1: "and IRS stopped it.",
  4: "Agency payment files, Treasury history, bank returns and registrations, ", 5: "joined across agencies",
  8: "Verified ", 9: "before payment", 10: ", explained beyond the list checks",
  18: "From one payment to the ", 19: "network behind it", 21: "Size it, hand it back", 22: "$100.4M across 14 networks; ", 23: "the agency decides", 24: FOOT})
runs("slide11", {1: "Two real rings, ", 2: "the same shape", 3: " as our composite",
  4: "Alabama–Georgia, 2011–13: 9,000 returns, $24M claimed, $10M paid; identities from a Fort Benning hospital, state agencies, a prison, a call center",
  7: "Refunds to prepaid cards, checks printed at home, postal-route addresses; sham tax businesses with e-file numbers",
  8: "TrackLight: deployed, imprisoned and hospital-patient payees; shell preparers; address clusters",
  9: "San Diego, 2013: 55 indicted, 2,000 identities, $20M claimed, $7M paid, \"even in the names of dead people\"",
  10: "TrackLight: deaths before the DMF; visa students with no earnings; apartments and P.O. boxes; accounts opened by a bank insider",
  11: "Both: a few hubs (e-file numbers, addresses, accounts, insiders) tied thousands of returns together",
  12: "Link analysis assembles in one pass what took two years by hand",
  13: "Treasury, FY2026: about 13,500 payments ($175M) to deceased people returned before they went out",
  14: "Today's list checks, which we build on",
  15: "$44M", 16: "claimed across the two rings; $17M paid out before they were stopped",
  17: "Our composite: ", 18: "$7.4M in one ring, $100.4M across 14", 19: ", caught before payment",
  20: "The demo story is a ", 21: "composite of these patterns, not a real case",
  22: "Each agency sees its own payee; ", 23: "a cross-agency view sees the network",
  24: "Sources: DOJ Tax Division, Sept 25, 2015 (U.S. v. Lanier et al., M.D. Ala.); U.S. Attorney S.D. Cal. and FBI, Sept 26, 2013 (indictments; defendants presumed innocent); Treasury press release, Oct 6, 2026"})
runs("slide12", {0: "APPENDIX  ·  FOR OUR TEAM", 1: "How Treasury ", 2: "pays and checks", 3: ", and where the demo fits",
  4: "Treasury already checks every payment against the lists.",
  5: "CONTROL  ·  WHO RUNS IT", 6: "WHAT IT CHECKS",
  7: "Do Not Pay: Bureau of the Fiscal Service; about 99% of federal programs onboarded in FY2026",
  8: "Payee against death records, SSA Numident, SAM.gov exclusions, company registrations, audit findings",
  9: "Payment verification: Fiscal Service, government-wide in FY2026 under Executive Order 14249",
  10: "Payment files before certification: 1.1B+ payments, about $3.7T",
  11: "Account and TIN verification: Fiscal Service, fully operational Sept 30, 2026",
  12: "Account in the payee's name; TIN present, valid and matching",
  13: "Check fraud machine learning and the paper-check phase-out: Fiscal Service; most paper checks ended Sept 30, 2025",
  14: "$1B in check fraud recovered in FY2024; fraud moves to electronic payments",
  15: "1 at a time", 16: "is how each check works: one payee against a list, so a real identity in its own account passes",
  17: "So the gap is ", 18: "patterns across payments and agencies", 19: ", not missing lists",
  20: "IRS return data is protected by ", 21: "26 U.S.C. § 6103: the demo shows IRS flags, not returns",
  22: "The demo shows a Fiscal Service analyst; ", 23: "IRS gets a recommendation, in its own system, and decides",
  24: "Sources: Treasury press release, Oct 6, 2026; EO 14249; Treasury FY2024 fraud-prevention release; Fiscal Service paper-check notice. Internal reference, hidden in the slideshow."})

notes(1, "Opening. This is the same IBM Payment Integrity platform, configured for federal payments that Treasury disburses for the agencies: tax refunds, Social Security benefits, federal annuities, VA benefits and vendor payments. Treasury now checks every payment before it goes out, against Do Not Pay, account ownership and the taxpayer ID. This demo follows one payment that passed all of those checks: from one $18,940 tax refund to $100.4M across 14 networks. Payments that check out go straight through, so payees aren't slowed down. All data is synthetic, including the payees, banks and accounts; the patterns come from documented cases.")
notes(2, "Step 1 · Ingest. Agencies certify payments, Treasury verifies and disburses them, banks receive the deposits and payees collect. Each agency sees only its own payees, and each of Treasury's checks looks at one payment at a time. This view joins what sits around the payment: every agency's payment files, Treasury's payment history, bank returns and reclamations, direct-deposit change logs, private-mailbox lists, company registrations and flags from IRS return data. IRS shares flags, not the returns themselves. We follow one payment: an $18,940 tax refund to Anna Reed.")
notes(3, "Step 2 · Detect. The refund lands in pre-payment review with a risk score of 92 and a recommendation to hold. The payments above it failed a check: a payee who died in August, caught by Do Not Pay, and a vendor payment going to an account that isn't the vendor's. Those are today's controls working. This one is different: it passed Do Not Pay, account ownership and the TIN check. What flags it is the pattern around it: the account was opened 19 days earlier, one of 34 with neighboring numbers, the mailing address is a private mailbox shared with 29 other federal payees, and the W-2 comes from an employer formed last year. Every payment gets a risk score; at or above the alert threshold of 75 it reaches an analyst. The analyst has two choices: release it, or refer it to the agency that certified it. Treasury can't stop the payment; only IRS can, which matters legally. 99.96% of payments go straight through.")
notes(13, "Beyond the lists. The payment's checks, side by side. Do Not Pay: death records, debarment and exclusion, delinquent debt, incarceration, multi-use. All passed. TrackLight's due diligence: Anna Reed has lived in Dayton, Ohio for 11 years, with no tie to Georgia, so someone is using her identity. The W-2 employer was formed last year at a mailbox, shares a registered agent with seven others, has no staff or filings, and its officer runs a tax-preparation business with a state judgment and two tax liens. Elsewhere in the network, TrackLight found an obituary for a payee three weeks before the Death Master File had it, and a payee in state custody, which the federal prison check can't see. Do Not Pay asks whether a payee is on a list; TrackLight asks who the payee really is.")
notes(16, "How it was found. Nine dated events over six weeks, each tagged with its source: Treasury's own history matched three refunds to one mailbox; TrackLight's identity profiles put two of the payees in Ohio; the accounts sat in a batch of 34; an obituary turned up for a payee whose refund was pending, before the Death Master File had it; IRS return flags named eight employers and OpenCorporates showed them to be shells with one agent; TrackLight put a tax preparer with a judgment, liens and a bankruptcy behind them; SSA's flag landed on the same mailbox and phone; 312 of the 386 identities were patients of one clinic, which is where an investigator would look for the insider; and link analysis closed the loop. The Alabama and San Diego rings took about two years to assemble by hand.")
notes(17, "The whole ring. One stopped refund isn't the job; the ring is. From the network view Treasury refers the whole Delmont network: one referral per certifying agency, each with the ring (organizer, batches, mailbox, phone, employers, where the identities came from) and that agency's own payments as structured data, the single refund as the worked example. IRS receives 612 refunds and $5.6M with 41 not yet paid; SSA 220 benefits; OPM 104 annuities. In IRS's system the reviewer opens a case, which holds the 41 pending refunds in one move; every payment inside shows its status, and every open and decision goes on the referral's trail on both sides. From the map, the same referral goes out for all 14 networks, so every agency hears about every network it is in.")
notes(14, "Hand-off. Only IRS can stop this refund, and that matters legally, so Treasury sends IRS a recommendation it can act on, shown two ways. For people: the recommendation (hold and verify the taxpayer), the reason code, an editable rationale, the evidence, Do Not Pay passed, TrackLight's findings, and a PDF. For systems: the same package as structured data in a shared schema the government would own: ten fields, scoped to this request; nothing else leaves Treasury, and IRS return data never leaves IRS. Agencies don't need one platform, just a common language. The schema is shown as a concept.")
notes(15, "Agency decides. Now we're IRS, in its own system: a separate instance anyone could have built, clearly simulated in the demo. A refund integrity reviewer signs in, sees the package marked New from Treasury, reads the recommendation and the evidence, and stops the payment because the taxpayer didn't file the return, with a note back to Treasury. Treasury's record updates: who decided, when and why, along with the tracker, the queue and the audit trail. Live, the two systems run in side-by-side windows and the decision appears in Treasury's as it's made. Treasury found and connected it; IRS decided; everyone can see what happened.")
notes(4, "Step 3 · Pull the thread. This related refund, to Lena M. Whitcomb, was paid two weeks earlier into an account from the same batch, and the real Lena Whitcomb had already filed her own return from Ohio. Looking at everyone paid at the mailbox: 46 federal payments in 13 months, to 30 different people, from three agencies. Tax refunds from IRS, Social Security benefits and federal retirement annuities. Each agency saw an ordinary payee; together, $505K went through one box in a shipping store.")
notes(5, "Step 4 · AI assist. Every flag becomes a tracked case with a full audit trail. Three AI agents review the case: investigative (who is behind the payees and what they share), payment verification (the list checks and the patterns around them) and policy (the Payment Integrity Information Act, Executive Order 14249, ACH reclamation rules and taxpayer privacy). Each finding cites its sources. Here, the investigative agent finds that the W-2s come from eight employers formed in the last year at the same mailbox, with one registered agent and no real payroll, and that the accounts were opened in batches at three online banks, each in a payee's own name, which is why the ownership check passes.")
notes(6, "Step 5 · Decision. The same network, a different agency. Gloria A. Pruitt's Social Security benefit went to her credit union for 19 years. In May, a phone call changed her direct deposit to an account opened days earlier in one of the network's batches, and moved her mailing address to the same mailbox. Four payments, $7,640, went there before she reported them missing. SSA flagged it; Treasury matched the flag to the same mailbox and phone behind the IRS refunds. The analyst records a reclamation with a coded reason and an AI-drafted justification, and because recovery is SSA's call, Treasury also sends SSA a recommendation package, and the system suggests the Delmont case because of the shared account batches, mailbox and phone. Only a supervisor can approve the reclamation, open the case or refer it to TIGTA and IRS-CI.")
notes(7, "Step 6 · Network. At the top is the organizer, an unregistered preparer. Below it are six of the network's nine account batches at three online banks, each account in a different payee's name. Then the payments, with the $18,940 refund in red, and at the bottom the agencies that certified them. Each agency sent ordinary payments to payees who passed every check. TrackLight's badges show who the payees really are: one died before the Death Master File caught up, one is in state custody, two are stolen identities, and two people appear on two accounts each. Joined across agencies, they form one network: 386 payees, three agencies, $7.4M.")
notes(8, "Step 7 · Linked networks. This view shows all 14 payment networks detected over 13 months. Dashed red lines mark the same account batch, phone, recruiter or domain appearing in two networks. Delmont's account batch at one online bank runs straight into accounts collecting refunds for a Florida mailbox ring, opened the same week, and the phone that changed Ms. Pruitt's deposit also redirected annuity and benefit payments for a Gulf Coast ring. Three linked networks total $22.7M, and no single agency would see the connection.")
notes(9, "Step 8 · Impact. From one $18,940 refund: the mailbox, $505K; its network, $7.4M; linked networks, $22.7M; the same patterns across all 14 networks, $100.4M over 13 months. Finding this one payment at a time would mean picking 12,131 payments out of more than a billion a year. Instead, one flag opens the network and analysts work 14 cases, while the other 99.96% of payments go out on schedule. Figures are synthetic.")
notes(10, "Close. The platform joins payments across agencies, flags problems before Treasury pays and explains why, beyond the list checks, gives analysts AI that does the research while people make the decisions, uncovers networks across agencies, and sizes the impact. One $18,940 refund that passed every check led to $100.4M across 14 networks, and the agency that certified it stopped it on Treasury's recommendation, in its own system. It builds on the controls Treasury already runs, and it is the same platform shown for healthcare claims, disaster relief and preparedness grants, configured for federal payments.")
notes(11, "Why this example. Two documented rings have the shape of our composite. In Alabama and Georgia, from 2011 to 2013, a ring led by Keisha Lanier and Tracy Mitchell filed more than 9,000 false returns claiming $24 million; the IRS paid about $10 million. The identities came from a hospital clerk at Fort Benning (deployed soldiers), two Alabama state agencies, the state prison system, a call center and a company's employee files. Refunds went to prepaid cards, to checks the defendants printed at home on bank-issued check stock, and later to addresses on bribed postal carriers' routes; sham tax businesses held the e-file numbers. In San Diego in 2013, 55 people were indicted: more than 2,000 stolen identities, $20 million claimed, $7 million paid, some in the names of dead people; visa students as foot soldiers, apartments and P.O. boxes collecting the checks, accounts opened at two banks, one by an insider. Both rings were a few hubs tying thousands of returns together, and both took about two years to assemble by investigation. TrackLight's checks go to those hubs directly: who the payee really is (deployed, imprisoned, a patient, dead), the businesses and the people behind them, where the money lands, and the links between them. Our demo is a composite of these patterns, not a model of either case, and all of its data is synthetic.")
notes(12, "Background. Treasury already runs strong per-payment controls: Do Not Pay, now covering about 99% of federal programs; government-wide payment verification under Executive Order 14249; and account and TIN verification, fully operational on September 30, 2026. Each one checks one payee against a list, so a real or stolen identity paid into an account in its own name passes. The demo's point is the layer on top: patterns across payments and agencies. IRS return information is protected by 26 U.S.C. 6103, so the demo shows IRS flags rather than returns. The same view could serve IRS and the benefit agencies.")

p = f"{work}/docProps/core.xml"
if os.path.exists(p):
    s = open(p).read(); s = re.sub(r"<dc:title>[^<]*</dc:title>", "<dc:title>IBM Payment Integrity · Treasury payments</dc:title>", s); open(p, "w").write(s)

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
