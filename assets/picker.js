/* Program picker — the sign-in screen where you choose a use case. Tiles come
   from assets/programs.js: a live program opens with ?uc=<id>; the rest show
   "Coming soon". Opens on load when the URL names no program, and again from
   the program switch in the header. */
(function () {
  function show() {
    if (document.getElementById("pk-ov")) return;
    var P = window.PROGRAMS, cur = P.active ? P.active.id : null;
    var o = document.createElement("div");
    o.id = "pk-ov";
    o.style.cssText = "position:fixed;inset:0;z-index:400;overflow:auto;background:radial-gradient(1100px 700px at 85% 100%,rgba(15,98,254,.22),rgba(15,98,254,0) 70%),radial-gradient(800px 500px at 0% 0%,rgba(15,98,254,.10),rgba(15,98,254,0) 70%),#fff;display:flex;align-items:flex-start;justify-content:center;font-family:'IBM Plex Sans',sans-serif;transition:opacity .35s ease";
    var live = P.list.filter(function (p) { return p.live; }), soon = P.list.filter(function (p) { return !p.live; });
    var tiles = live.map(function (p) {
      var here = p.id === cur;
      return '<button class="pk-tile" data-id="' + p.id + '" style="text-align:left;font-family:inherit;cursor:pointer;background:#fff;border:' + (here ? "1.5px solid #0f62fe" : "0.5px solid #c1c7cd") + ';border-radius:12px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:6px;box-shadow:0 8px 28px rgba(15,98,254,.14);transition:transform .15s ease, box-shadow .15s ease">' +
        '<div style="display:flex;justify-content:space-between;align-items:center"><span style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:#0f62fe;color:#fff;font-size:21px"><i class="ti ti-' + p.icon + '"></i></span>' +
        '<span style="font-size:10.5px;font-weight:600;color:#0f62fe;background:#edf5ff;border-radius:10px;padding:2px 8px">' + (here ? "Current" : "Live demo") + '</span></div>' +
        '<div style="font-weight:600;font-size:16px;color:#001141;margin-top:6px">' + p.title + '</div>' +
        '<div style="font-size:11.5px;color:#0043ce;font-weight:500">' + p.sub + '</div>' +
        '<div style="font-size:12px;color:#525252;line-height:1.45">' + p.body + '</div>' +
        '<div style="margin-top:4px;font-size:12px;font-weight:500;color:#0f62fe">' + (here ? "Return to the demo" : "Open the demo") + ' <i class="ti ti-arrow-right"></i></div></button>';
    }).join("");
    var next = soon.map(function (p) {
      return '<div style="background:rgba(255,255,255,.75);border:0.5px solid #dde1e6;border-radius:10px;padding:11px 12px;display:flex;gap:10px;align-items:flex-start;min-width:0">' +
        '<span style="width:30px;height:30px;flex:none;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#edf5ff;color:#0043ce;font-size:16px"><i class="ti ti-' + p.icon + '"></i></span>' +
        '<div style="min-width:0"><div style="font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:#6f6f6f">' + (p.agency || "") + '</div>' +
        '<div style="font-weight:600;font-size:13px;color:#001141;margin-top:1px">' + p.title + ' <span style="font-weight:400;color:#0043ce;font-size:11.5px">· ' + p.sub + '</span></div>' +
        '<div style="font-size:11.5px;color:#525252;line-height:1.4;margin-top:2px">' + p.body + '</div></div></div>';
    }).join("");
    o.innerHTML = '<div style="width:1040px;max-width:94vw;padding:28px 0">' +
      '<div style="text-align:center;margin-bottom:24px"><div style="font-size:26px;color:#001141;font-weight:300">IBM <b style="font-weight:600">Payment Integrity</b></div>' +
      '<div style="font-size:13px;color:#525252;margin-top:4px">Detect · Investigate · Recover — one platform, configured for each program</div></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:10px"><div style="font-size:12px;color:#525252;font-weight:500">Choose a demo</div>' +
      '<div style="display:flex;gap:16px;align-items:baseline">' + (P.summary ? '<a href="' + P.summary + '" target="_blank" rel="noopener" style="color:#0f62fe;font-size:12px;font-weight:500;text-decoration:none"><i class="ti ti-map-2"></i> Opportunity map: where this applies across government <i class="ti ti-external-link"></i></a>' : '') +
      (cur ? '<button id="pk-close" style="background:none;border:none;color:#525252;font-family:inherit;font-size:12px;cursor:pointer"><i class="ti ti-x"></i> Stay in ' + P.active.title + '</button>' : '') + '</div></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px">' + tiles + '</div>' +
      (next ? '<div style="font-size:12px;color:#525252;font-weight:500;margin:22px 0 10px">Coming next <span style="font-weight:400;color:#6f6f6f">· the same platform for other programs</span></div>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px">' + next + '</div>' : '') +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:22px;font-size:11.5px;color:#6f6f6f">' +
      '<span><i class="ti ti-stack-2"></i> Shared across programs: rules + ML/AI scoring · network analytics · case management · Investigative Assistant · audit trail</span>' +
      '<span><i class="ti ti-user-circle"></i> Signed in as Dana Whitmore · Analyst</span></div>' +
      '<div style="text-align:center;font-size:10.5px;color:#8d8d8d;margin-top:14px"><i class="ti ti-shield-lock"></i> Synthetic data · demonstration only</div></div>';
    document.body.appendChild(o);
    var close = function () { o.style.opacity = "0"; setTimeout(function () { o.remove(); }, 350); };
    var x = o.querySelector("#pk-close"); if (x) x.onclick = close;
    o.querySelectorAll(".pk-tile").forEach(function (b) {
      b.onmouseenter = function () { b.style.transform = "translateY(-2px)"; };
      b.onmouseleave = function () { b.style.transform = "none"; };
      b.onclick = function () {
        var id = b.getAttribute("data-id");
        if (id === cur) return close();
        P.go(id);
      };
    });
  }
  window.UC_PICKER = { show: show };
  function boot() { if (!window.PROGRAMS.active) show(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
