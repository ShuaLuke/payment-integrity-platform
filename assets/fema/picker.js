/* Program picker — the sign-in screen where you choose a use case. One platform,
   configured per program: Disaster Relief is this build; Healthcare opens the
   healthcare build; the others are on the roadmap. Shown on load unless the URL
   names the program (?uc=fema), and again from the brand mark in the header. */
(function () {
  var HEALTHCARE_URL = "https://shualuke.github.io/ibm-payment-integrity-demo/?tour=short";
  var PROGRAMS = [
    { id: "fema", live: true, icon: "tornado", title: "Disaster Relief", sub: "FEMA Individual Assistance", body: "Registrations and IHP awards, scored before they pay. Facilitator rings, fake landlords, shared accounts, stolen identities." },
    { id: "health", link: HEALTHCARE_URL, icon: "heart-rate-monitor", title: "Healthcare claims", sub: "Medicaid · TRICARE · commercial", body: "Professional, institutional, dental and pharmacy claims. Upcoding, unbundling, provider networks." },
    { id: "vha", icon: "stethoscope", title: "Veterans Health", sub: "VHA community care", body: "Community-care claims and provider networks for veterans' health care." },
    { id: "vba", icon: "building-bank", title: "Veterans Benefits", sub: "VBA compensation & education", body: "Disability compensation, pension, GI Bill schools and fiduciaries." }
  ];
  function show() {
    if (document.getElementById("pk-ov")) return;
    var o = document.createElement("div");
    o.id = "pk-ov";
    o.style.cssText = "position:fixed;inset:0;z-index:400;overflow:auto;background:radial-gradient(1100px 700px at 85% 100%,rgba(15,98,254,.22),rgba(15,98,254,0) 70%),radial-gradient(800px 500px at 0% 0%,rgba(15,98,254,.10),rgba(15,98,254,0) 70%),#fff;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',sans-serif;transition:opacity .35s ease";
    var tiles = PROGRAMS.map(function (p) {
      var soon = !p.live && !p.link;
      return '<button class="pk-tile" data-id="' + p.id + '"' + (soon ? " disabled" : "") + ' style="text-align:left;font-family:inherit;cursor:' + (soon ? "default" : "pointer") + ';background:#fff;border:' + (p.live ? "1.5px solid #0f62fe" : "0.5px solid #c1c7cd") + ';border-radius:12px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:6px;min-height:186px;box-shadow:' + (p.live ? "0 8px 28px rgba(15,98,254,.18)" : "0 2px 10px rgba(0,17,65,.06)") + ';opacity:' + (soon ? .62 : 1) + ';transition:transform .15s ease, box-shadow .15s ease">' +
        '<div style="display:flex;justify-content:space-between;align-items:center"><span style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:' + (p.live ? "#0f62fe" : "#edf5ff") + ';color:' + (p.live ? "#fff" : "#0043ce") + ';font-size:21px"><i class="ti ti-' + p.icon + '"></i></span>' +
        (p.live ? '<span style="font-size:10.5px;font-weight:600;color:#0f62fe;background:#edf5ff;border-radius:10px;padding:2px 8px">This demo</span>' : p.link ? '<span style="font-size:10.5px;color:#525252;border:0.5px solid #c1c7cd;border-radius:10px;padding:2px 8px">Opens demo <i class="ti ti-external-link"></i></span>' : '<span style="font-size:10.5px;color:#6f6f6f;background:#f2f4f8;border-radius:10px;padding:2px 8px">Coming soon</span>') + '</div>' +
        '<div style="font-weight:600;font-size:16px;color:#001141;margin-top:6px">' + p.title + '</div>' +
        '<div style="font-size:11.5px;color:#0043ce;font-weight:500">' + p.sub + '</div>' +
        '<div style="font-size:12px;color:#525252;line-height:1.45">' + p.body + '</div></button>';
    }).join("");
    o.innerHTML = '<div style="width:960px;max-width:94vw;padding:28px 0">' +
      '<div style="text-align:center;margin-bottom:26px"><div style="font-size:26px;color:#001141;font-weight:300">IBM <b style="font-weight:600">Payment Integrity</b></div>' +
      '<div style="font-size:13px;color:#525252;margin-top:4px">Detect · Investigate · Recover — one platform, configured for each program</div></div>' +
      '<div style="font-size:12px;color:#525252;margin-bottom:10px;font-weight:500">Choose a program</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px">' + tiles + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:22px;font-size:11.5px;color:#6f6f6f">' +
      '<span><i class="ti ti-stack-2"></i> Shared across programs: rules + ML/AI scoring · network analytics · case management · Investigative Assistant · audit trail</span>' +
      '<span><i class="ti ti-user-circle"></i> Signed in as Dana Whitmore · Analyst</span></div>' +
      '<div style="text-align:center;font-size:10.5px;color:#8d8d8d;margin-top:14px"><i class="ti ti-shield-lock"></i> Synthetic data · demonstration only</div></div>';
    document.body.appendChild(o);
    o.querySelectorAll(".pk-tile").forEach(function (b) {
      if (b.disabled) return;
      b.onmouseenter = function () { b.style.transform = "translateY(-2px)"; };
      b.onmouseleave = function () { b.style.transform = "none"; };
      b.onclick = function () {
        var p = PROGRAMS.filter(function (x) { return x.id === b.getAttribute("data-id"); })[0];
        if (p.link) { location.href = p.link; return; }
        if (window.APP && window.APP.auditLog) window.APP.auditLog("PROGRAM_SELECTED", "Disaster Relief · FEMA Individual Assistance");
        o.style.opacity = "0"; setTimeout(function () { o.remove(); }, 350);
      };
    });
  }
  window.UC_PICKER = { show: show };
  var skip = /[?&]uc=fema\b/.test(location.search);
  function boot() {
    var brand = document.querySelector(".brand");
    if (brand) { brand.style.cursor = "pointer"; brand.addEventListener("click", show); setTimeout(function () { brand.title = "Choose a program"; }, 0); }
    if (!skip) show();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
