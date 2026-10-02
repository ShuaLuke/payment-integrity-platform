/* Programs — the list of use cases this platform runs, and the loader that
   switches between them. ONE place to add a program:
     1. put its files in assets/packs/<id>/ (data, wiring, views, tour), and
     2. add an entry below with live: true and its scripts in load order.
   The active program comes from the URL (?uc=<id>). With no program in the
   URL the picker opens (assets/picker.js). Choosing a program reloads the page
   with ?uc=<id>, so each program starts clean and links are shareable.
   The shared engine (app shell, healthcare data, scoring, network, case flow,
   assistant) loads for every program; a pack overrides what it needs. */
(function () {
  var PROGRAMS = [
    { id: "health", live: true, icon: "heart-rate-monitor", title: "Healthcare claims", sub: "Medicaid · TRICARE · commercial",
      body: "Professional, institutional, dental and pharmacy claims. Upcoding, unbundling, provider networks.",
      scripts: ["assets/packs/health/pack.js"] },
    { id: "fema", live: true, icon: "tornado", title: "Disaster Relief", sub: "FEMA Individual Assistance",
      body: "Registrations and IHP awards, scored before they pay. Facilitator rings, fake landlords, shared accounts, stolen identities.",
      scripts: ["assets/packs/fema/fema-data.js", "assets/packs/fema/fema-pack.js", "assets/packs/fema/views/home.js", "assets/packs/fema/views/queue.js",
        "assets/packs/fema/views/registration.js", "assets/packs/fema/views/intake.js", "assets/packs/fema/views/network.js", "assets/packs/fema/fema-tour.js"] },
    { id: "vha", icon: "stethoscope", title: "Veterans Health", sub: "VHA community care", body: "Community-care claims and provider networks for veterans' health care." },
    { id: "vba", icon: "building-bank", title: "Veterans Benefits", sub: "VBA compensation & education", body: "Disability compensation, pension, GI Bill schools and fiduciaries." }
  ];

  var m = /[?&]uc=([a-z0-9-]+)/i.exec(location.search);
  var active = m ? PROGRAMS.filter(function (p) { return p.id === m[1].toLowerCase() && p.live; })[0] : null;

  window.PROGRAMS = {
    list: PROGRAMS,
    active: active,
    // the URL for a program, keeping this page's path (works on any host or subfolder)
    href: function (id) { return location.pathname + "?uc=" + encodeURIComponent(id); },
    go: function (id) { location.href = window.PROGRAMS.href(id); }
  };

  // load the active program's files right here, in order, before the shell boots
  if (active) (active.scripts || []).forEach(function (src) { document.write('<script src="' + src + '"><\/script>'); });

  // header: the active program's name, which also switches programs
  function chrome() {
    if (!active) return;
    document.title = "IBM Payment Integrity · " + active.title;
    var brand = document.querySelector(".brand"); if (!brand || document.getElementById("prog-switch")) return;
    var b = document.createElement("button");
    b.id = "prog-switch"; b.type = "button"; b.title = "Switch program";
    b.style.cssText = "margin-left:10px;padding:3px 9px 3px 10px;border-radius:14px;border:0.5px solid rgba(255,255,255,0.25);background:rgba(255,255,255,0.06);color:#a6c8ff;font-family:inherit;font-size:12px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap";
    b.innerHTML = '<i class="ti ti-' + active.icon + '"></i>' + active.title + ' <i class="ti ti-switch-horizontal" style="color:#c1c7cd"></i>';
    b.onclick = function () { if (window.UC_PICKER) window.UC_PICKER.show(); };
    brand.parentNode.insertBefore(b, brand.nextSibling);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", chrome); else chrome();
})();
