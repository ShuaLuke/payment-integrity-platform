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
    o.style.cssText = "position:fixed;inset:0;z-index:400;overflow:auto;background:radial-gradient(1100px 700px at 85% 100%,rgba(15,98,254,.22),rgba(15,98,254,0) 70%),radial-gradient(800px 500px at 0% 0%,rgba(15,98,254,.10),rgba(15,98,254,0) 70%),#fff;display:flex;align-items:center;justify-content:center;font-family:'IBM Plex Sans',sans-serif;transition:opacity .35s ease";
    var tiles = P.list.map(function (p) {
      var soon = !p.live, here = p.id === cur;
      return '<button class="pk-tile" data-id="' + p.id + '"' + (soon ? " disabled" : "") + ' style="text-align:left;font-family:inherit;cursor:' + (soon ? "default" : "pointer") + ';background:#fff;border:' + (here ? "1.5px solid #0f62fe" : "0.5px solid #c1c7cd") + ';border-radius:12px;padding:18px 18px 16px;display:flex;flex-direction:column;gap:6px;min-height:186px;box-shadow:' + (soon ? "0 2px 10px rgba(0,17,65,.06)" : "0 8px 28px rgba(15,98,254,.14)") + ';opacity:' + (soon ? .62 : 1) + ';transition:transform .15s ease, box-shadow .15s ease">' +
        '<div style="display:flex;justify-content:space-between;align-items:center"><span style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:' + (soon ? "#edf5ff" : "#0f62fe") + ';color:' + (soon ? "#0043ce" : "#fff") + ';font-size:21px"><i class="ti ti-' + p.icon + '"></i></span>' +
        (here ? '<span style="font-size:10.5px;font-weight:600;color:#0f62fe;background:#edf5ff;border-radius:10px;padding:2px 8px">Current</span>' : soon ? '<span style="font-size:10.5px;color:#6f6f6f;background:#f2f4f8;border-radius:10px;padding:2px 8px">Coming soon</span>' : '<span style="font-size:10.5px;font-weight:600;color:#0f62fe;background:#edf5ff;border-radius:10px;padding:2px 8px">Live demo</span>') + '</div>' +
        '<div style="font-weight:600;font-size:16px;color:#001141;margin-top:6px">' + p.title + '</div>' +
        '<div style="font-size:11.5px;color:#0043ce;font-weight:500">' + p.sub + '</div>' +
        '<div style="font-size:12px;color:#525252;line-height:1.45">' + p.body + '</div></button>';
    }).join("");
    o.innerHTML = '<div style="width:960px;max-width:94vw;padding:28px 0">' +
      '<div style="text-align:center;margin-bottom:26px"><div style="font-size:26px;color:#001141;font-weight:300">IBM <b style="font-weight:600">Payment Integrity</b></div>' +
      '<div style="font-size:13px;color:#525252;margin-top:4px">Detect · Investigate · Recover — one platform, configured for each program</div></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px"><div style="font-size:12px;color:#525252;font-weight:500">Choose a program</div>' +
      (cur ? '<button id="pk-close" style="background:none;border:none;color:#0f62fe;font-family:inherit;font-size:12px;cursor:pointer"><i class="ti ti-x"></i> Stay in ' + P.active.title + '</button>' : '') + '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px">' + tiles + '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-top:22px;font-size:11.5px;color:#6f6f6f">' +
      '<span><i class="ti ti-stack-2"></i> Shared across programs: rules + ML/AI scoring · network analytics · case management · Investigative Assistant · audit trail</span>' +
      '<span><i class="ti ti-user-circle"></i> Signed in as Dana Whitmore · Analyst</span></div>' +
      '<div style="text-align:center;font-size:10.5px;color:#8d8d8d;margin-top:14px"><i class="ti ti-shield-lock"></i> Synthetic data · demonstration only</div></div>';
    document.body.appendChild(o);
    var close = function () { o.style.opacity = "0"; setTimeout(function () { o.remove(); }, 350); };
    var x = o.querySelector("#pk-close"); if (x) x.onclick = close;
    o.querySelectorAll(".pk-tile").forEach(function (b) {
      if (b.disabled) return;
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
