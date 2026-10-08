# Builds the Treasury deck from the Preparedness Grants deck
# (~/Desktop/IBM-Payment-Integrity-Preparedness-Grants.pptx, 12 slides, slide 12 a
# hidden appendix): same layout, new clips (~/dev/treas-clips), new text and
# speaker notes. Text is replaced by run index, so the base must be that deck's
# current layout. Usage: python3 tools/build-treas-deck.py <base.pptx> <out.pptx>
# Clips come from $CLIPS_DIR or ~/dev/treas-clips (tools/record-clips-treas.cjs).
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
  3: "Following one tax refund that passed every check, to the network behind it.", 4: "FROM ONE PAYMENT TO THE NETWORK",
  5: "$18,940", 6: "Held before payment", 7: "PV-73194, passed every check",
  8: "$505K", 9: "Same mailbox", 10: "46 payments, 3 agencies",
  11: "$7.4M", 12: "Its network", 13: "9 account batches, 386 payees",
  14: "$22.7M", 15: "Linked networks", 16: "Shared account batch and phone",
  17: "$100.4M", 18: "Every network", 19: "14 networks, 23 states",
  30: FOOT, 31: "Prepared for the Department of the Treasury  ·  October 2026"})
runs("slide2", {2: "Every payment, ", 3: "checked together", 4: ", not one at a time", 5: "10", 6: "data sources join agency, Treasury, bank and payee records",
  7: "4 steps", 8: ": agencies certify, Treasury verifies and disburses, banks receive, payees collect",
  9: "Today each check sees ", 10: "one payment at a time", 11: "PV-73194: $18,940 refund to Marisol T. Avery, ", 12: "traced to its mailbox"})
runs("slide3", {2: "It passed ", 3: "every check", 4: "$18,940", 5: "held before disbursement", 6: "Passed Do Not Pay, account ownership and TIN; ", 7: "flagged by the pattern around it",
  10: ": account 19 days old in a batch of 34, a mailbox shared with 29 payees", 11: "Hold: payments held goes from ", 12: "$0 to $18,940"})
runs("slide4", {2: "Pull the thread: ", 3: "one mailbox, 3 agencies", 4: "46", 5: "federal payments to 30 different payees in 13 months",
  6: "Same mailbox, same account batch: a refund we ", 7: "already paid", 8: "Everyone paid at the address, ", 9: "across agencies",
  10: ": tax refunds, Social Security benefits, federal annuities", 11: "The real taxpayer filed separately; ", 12: "$505K through one box"})
runs("slide5", {7: " read the case: investigative, payment verification, and policy", 11: "Found: eight W-2 employers ",
  12: "formed at the mailbox, no real payroll", 13: ", one registered agent"})
runs("slide6", {4: "$7,640", 5: "submitted for reclamation after supervisor approval", 6: "A phone call redirected a Social Security benefit ", 7: "to a network account",
  8: "Reclaim with a coded reason and an ", 11: "suggests the Delmont case", 12: ": same account batches, mailbox and phone",
  14: " opens the case, releases a reclamation or refers to TIGTA / IRS-CI"})
runs("slide7", {2: "One organizer", 3: ", 386 payees, three agencies", 4: "17", 5: "related payments around the one we held, in 6 account batches",
  6: "Delmont network: ", 7: "one mailbox, one phone, nine account batches", 8: "Each account is ", 9: "in its payee's own name", 10: ", so each one passes the ownership check",
  11: "Each ", 12: "agency sees ordinary payees", 13: ", each payment ", 14: "clean on its own"})
runs("slide8", {2: "14 networks, ", 3: "several linked", 4: " by shared accounts and phones", 5: "43%", 6: "of detected networks span more than one agency",
  7: "4,062 payees, ", 8: "23 states", 10: "same account batch, phone, recruiter or domain",
  12: "Delmont's account batch runs straight into ", 13: "a Florida mailbox ring's accounts", 14: "3 networks linked", 15: ": $22.7M across the three"})
runs("slide9", {3: "14 networks uncovered", 5: "$100.4M", 6: "at risk across 14 networks, traced from one $18,940 refund",
  7: "$18,940 refund → $505K mailbox → ", 8: "$7.4M network → $22.7M linked", 10: "12,131 payments", 11: ", hidden among more than a billion a year",
  13: "14 cases, evidence assembled", 14: "Sep 2025 – Oct 2026", 15: " across 23 states; synthetic figures"})
runs("slide10", {0: "One $18,940 refund that passed every check led us to a three-agency network, ", 1: "and $100.4M across 14 networks.",
  4: "Agency payment files, Treasury history, bank returns and registrations, ", 5: "joined across agencies",
  8: "Verified ", 9: "before payment", 10: ", explained beyond the list checks",
  18: "From one payment to the ", 19: "network behind it", 22: "From one $18,940 refund to ", 23: "$100.4M across 14 networks", 24: FOOT})
runs("slide11", {1: "Real cases: ", 2: "$100M+", 3: " sought with stolen identities",
  4: "DOJ, April 2026: 300+ false returns filed with stolen identities sought over $100M in refunds",
  7: "Buffalo, NY: stolen Treasury refund checks deposited into accounts opened in the payees' names with fake IDs, $1.3M+",
  8: "Accounts opened in payees' names, in batches",
  9: "Georgia: a ghost preparer left his name off clients' returns and claimed $4.1M in false employment tax credits",
  10: "Preparer and employer checks",
  11: "Treasury, FY2026: about 13,500 payments ($175M) to deceased people returned before they went out",
  12: "Today's list checks, which we build on",
  13: "IRS-CI, FY2025: 588 investigations into about $5.6B in potentially false employment tax credits",
  14: "Shell employers and shared agents",
  15: "$3.7T", 16: "in federal payments screened by Treasury's payment verification in FY2026",
  17: "Treasury, FY2025: ", 18: "$11.7B in improper payments", 19: " prevented, detected or recovered",
  20: "The demo story is a ", 21: "composite of these patterns",
  22: "Each agency sees its own payee; ", 23: "a cross-agency view sees the network",
  24: "Sources: DOJ (Apr 2026; charges, not a conviction); W.D.N.Y. indictment (2026; not-guilty pleas); IRS-CI and DOJ S.D. Ga. (2025); Treasury press release, Oct 6, 2026; IRS-CI FY2025; Bureau of the Fiscal Service"})
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
  22: "The demo shows a Fiscal Service analyst; ", 23: "IRS and benefit agencies could use the same view",
  24: "Sources: Treasury press release, Oct 6, 2026; EO 14249; Treasury FY2024 fraud-prevention release; Fiscal Service paper-check notice. Internal reference, hidden in the slideshow."})

notes(1, "Opening. This is the same IBM Payment Integrity platform, configured for federal payments that Treasury disburses for the agencies: tax refunds, Social Security benefits, federal annuities, VA benefits and vendor payments. Treasury now checks every payment before it goes out, against Do Not Pay, account ownership and the taxpayer ID. This demo follows one payment that passed all of those checks: from one $18,940 tax refund to $100.4M across 14 networks. Payments that check out go straight through, so payees aren't slowed down. All data is synthetic, including the payees, banks and accounts; the patterns come from documented cases.")
notes(2, "Step 1 · Ingest. Agencies certify payments, Treasury verifies and disburses them, banks receive the deposits and payees collect. Each agency sees only its own payees, and each of Treasury's checks looks at one payment at a time. This view joins what sits around the payment: every agency's payment files, Treasury's payment history, bank returns and reclamations, direct-deposit change logs, private-mailbox lists, company registrations and flags from IRS return data. IRS shares flags, not the returns themselves. We follow one payment: an $18,940 tax refund to Marisol T. Avery.")
notes(3, "Step 2 · Detect. The refund lands in pre-payment review with a risk score of 92 and a recommendation to hold. The payments above it failed a check: a payee who died in August, caught by Do Not Pay, and a vendor payment going to an account that isn't the vendor's. Those are today's controls working. This one is different: it passed Do Not Pay, account ownership and the TIN check. What flags it is the pattern around it: the account was opened 19 days earlier, one of 34 with neighboring numbers, the mailing address is a private mailbox shared with 29 other federal payees, and the W-2 comes from an employer formed last year. Holding keeps the $18,940 in place until IRS verifies the taxpayer; 99.96% of payments go straight through.")
notes(4, "Step 3 · Pull the thread. This related refund, to Lena M. Whitcomb, was paid two weeks earlier into an account from the same batch, and the real Lena Whitcomb had already filed her own return from Ohio. Looking at everyone paid at the mailbox: 46 federal payments in 13 months, to 30 different people, from three agencies. Tax refunds from IRS, Social Security benefits and federal retirement annuities. Each agency saw an ordinary payee; together, $505K went through one box in a shipping store.")
notes(5, "Step 4 · AI assist. Every flag becomes a tracked case with a full audit trail. Three AI agents review the case: investigative (who is behind the payees and what they share), payment verification (the list checks and the patterns around them) and policy (the Payment Integrity Information Act, Executive Order 14249, ACH reclamation rules and taxpayer privacy). Each finding cites its sources. Here, the investigative agent finds that the W-2s come from eight employers formed in the last year at the same mailbox, with one registered agent and no real payroll, and that the accounts were opened in batches at three online banks, each in a payee's own name, which is why the ownership check passes.")
notes(6, "Step 5 · Decision. The same network, a different agency. Gloria A. Pruitt's Social Security benefit went to her credit union for 19 years. In May, a phone call changed her direct deposit to an account opened days earlier in one of the network's batches, and moved her mailing address to the same mailbox. Four payments, $7,640, went there before she reported them missing. The analyst records a reclamation with a coded reason and an AI-drafted justification, and the system suggests the Delmont case because of the shared account batches, mailbox and phone. Only a supervisor can approve the reclamation, open the case or refer it to TIGTA and IRS-CI.")
notes(7, "Step 6 · Network. At the top is the organizer, an unregistered preparer. Below it are six of the network's nine account batches at three online banks, each account in a different payee's name. Then the payments, with the $18,940 refund in red, and at the bottom the agencies that certified them. Each agency sent ordinary payments to payees who passed every check. Joined across agencies, they form one network: 386 payees, three agencies, $7.4M.")
notes(8, "Step 7 · Linked networks. This view shows all 14 payment networks detected over 13 months. Dashed red lines mark the same account batch, phone, recruiter or domain appearing in two networks. Delmont's account batch at one online bank runs straight into accounts collecting refunds for a Florida mailbox ring, opened the same week, and the phone that changed Ms. Pruitt's deposit also redirected annuity and benefit payments for a Gulf Coast ring. Three linked networks total $22.7M, and no single agency would see the connection.")
notes(9, "Step 8 · Impact. From one $18,940 refund: the mailbox, $505K; its network, $7.4M; linked networks, $22.7M; the same patterns across all 14 networks, $100.4M over 13 months. Finding this one payment at a time would mean picking 12,131 payments out of more than a billion a year. Instead, one flag opens the network and analysts work 14 cases, while the other 99.96% of payments go out on schedule. Figures are synthetic.")
notes(10, "Close. The platform joins payments across agencies, flags problems before Treasury pays and explains why, beyond the list checks, gives analysts AI that does the research while people make the decisions, uncovers networks across agencies, and sizes the impact. One $18,940 refund that passed every check led to $100.4M across 14 networks. It builds on the controls Treasury already runs, and it is the same platform shown for healthcare claims, disaster relief and preparedness grants, configured for federal payments.")
notes(11, "Why this example. These patterns are documented. In April 2026, the Justice Department charged two men over a scheme that filed more than 300 false returns using stolen identities, seeking more than $100 million in refunds; these are charges, not a conviction. In Buffalo, defendants were indicted for depositing stolen Treasury refund checks into accounts opened in the payees' names with fake IDs, at eight credit unions and two banks, more than $1.3 million; they pleaded not guilty. In Georgia, a ghost preparer who left his name off clients' returns claimed $4.1 million in false employment tax credits and was sentenced in 2025. IRS-CI opened 588 investigations in FY2025 into about $5.6 billion in potentially false employment tax credits. Treasury reports that payment verification screened about $3.7 trillion in FY2026 and returned about 13,500 payments to deceased people, and that its payment integrity work prevented, detected or recovered $11.7 billion in FY2025. The demo story is a composite of these patterns, not a single real case.")
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
