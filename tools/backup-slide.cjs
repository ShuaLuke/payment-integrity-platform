// Tech-stack backup slide, styled to match the IBM short-tour deck.
const pptxgen = require("pptxgenjs");
const W = process.env.DECK_DIR || __dirname; // folder holding the unzipped deck (ppt/ppt/media/...) and where the .pptx is written

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "IBM Payment Integrity: technology stack"; pres.subject = "IBM Payment Integrity"; pres.author = "IBM"; pres.company = "IBM"; // 13.333 x 7.5, same as the deck
const F = "IBM Plex Sans";
const BLUE = "0F62FE", INK = "161616", GRAY = "525252", MUTED = "8D8D8D", RULE = "E0E0E0";

const s = pres.addSlide();
s.background = { color: "FFFFFF" };
s.addImage({ path: W + "/ppt/ppt/media/image1.png", x: 0, y: 0, w: 13.333, h: 7.5, altText: "Background" });

// eyebrow: blue square + spaced caps (deck motif)
s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 0.72, w: 0.17, h: 0.17, fill: { color: BLUE }, line: { color: BLUE } });
s.addText("BACKUP  ·  TECHNOLOGY STACK", { x: 0.88, y: 0.6, w: 8, h: 0.4, fontFace: F, fontSize: 13, bold: true, color: BLUE, charSpacing: 4, margin: 0, isTextBox: true });

// title: black line + blue line (deck motif)
s.addText([
  { text: "The platforms behind the demo.", options: { color: INK, breakLine: true } },
  { text: "IBM Federal ATOM is FedRAMP High.", options: { color: BLUE } }
], { x: 0.6, y: 1.2, w: 12, h: 1.35, fontFace: F, fontSize: 36, margin: 0, valign: "top", isTextBox: true });

s.addText("Each capability in the demo maps to one of these platforms.", {
  x: 0.6, y: 2.62, w: 11, h: 0.4, fontFace: F, fontSize: 15, color: GRAY, margin: 0, isTextBox: true
});

// three columns, separated by thin rules (deck motif)
const cols = [
  { name: "IBM Federal ATOM", role: "Data and AI foundation",
    pts: ["Integrates and governs claims, payment and eligibility data",
          "Intelligent automation and agentic AI for mission workflows",
          "Managed service in an AWS government-only cloud"],
    demo: "01  Ingest data", chip: "FedRAMP High · Nov 2025", strong: true },
  { name: "IBM FAMS", role: "Fraud and Abuse Management System",
    pts: ["Ranks every provider against specialty peers",
          "Thousands of healthcare risk indicators, tuned by specialty",
          "Used by health plans and state Medicaid programs"],
    demo: "02  Detect in real time", chip: "IBM software" },
  { name: "TrackLight", role: "Entity and network intelligence",
    pts: ["Links providers through shared ownership, tax IDs, addresses and billing agents",
          "Open-source records: exclusion lists, court filings, corporate registrations",
          "Pre-payment fraud detection for government and healthcare programs"],
    demo: "04  Uncover networks", chip: "Partner platform" }
];
const x0 = 0.6, colW = 3.85, gap = 0.3, top = 3.35;
cols.forEach((c, i) => {
  const x = x0 + i * (colW + gap);
  if (i) s.addShape(pres.shapes.LINE, { x: x - gap / 2, y: top, w: 0, h: 3.3, line: { color: RULE, width: 1 } });
  s.addText(c.name, { x, y: top, w: colW, h: 0.55, fontFace: F, fontSize: 26, color: BLUE, margin: 0, isTextBox: true });
  s.addText(c.role, { x, y: top + 0.58, w: colW, h: 0.32, fontFace: F, fontSize: 13, bold: true, color: INK, margin: 0, isTextBox: true });
  s.addText(c.pts.map((t, k) => ({ text: t, options: { bullet: { indent: 12 }, breakLine: k < c.pts.length - 1 } })), {
    x: x + 0.2, y: top + 0.98, w: colW - 0.35, h: 1.5, fontFace: F, fontSize: 11.5, color: GRAY, margin: 0, valign: "top", paraSpaceAfter: 4, isTextBox: true
  });
  s.addText([{ text: "IN THE DEMO   ", options: { bold: true, color: MUTED, charSpacing: 1 } }, { text: c.demo, options: { color: GRAY } }],
    { x, y: top + 2.55, w: colW, h: 0.28, fontFace: F, fontSize: 10.5, margin: 0, valign: "middle", isTextBox: true });
  const cw = c.strong ? 2.15 : 1.5, col = c.strong ? BLUE : GRAY;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: top + 2.95, w: cw, h: 0.32, rectRadius: 0.16, fill: { color: "FFFFFF" }, line: { color: col, width: 1 } });
  s.addText(c.chip, { x, y: top + 2.95, w: cw, h: 0.32, fontFace: F, fontSize: 10, bold: true, color: col, align: "center", valign: "middle", margin: 0, isTextBox: true });
});

s.addText("IBM Payment Integrity  ·  synthetic data, demonstration only", {
  x: 0.6, y: 6.95, w: 8, h: 0.3, fontFace: F, fontSize: 10, color: MUTED, margin: 0, isTextBox: true
});

s.addNotes(
  "Backup: technology stack. The capabilities in the demo map to three platforms. IBM Federal ATOM is the data and AI foundation: it integrates and governs claims, payment and eligibility data, adds intelligent automation and agentic AI, and runs as a managed service in a government-only cloud at FedRAMP High. " +
  "IBM FAMS, the Fraud and Abuse Management System, is the detection engine: it scores claims and ranks every provider against its specialty peers, and health plans and state Medicaid programs use it today. " +
  "TrackLight, a partner platform, adds entity and network intelligence: the ownership, addresses, billing agents and open-source records that tie providers together."
);

pres.writeFile({ fileName: W + "/IBM-Payment-Integrity-tech-stack-backup.pptx" }).then(f => console.log("wrote", f));
