# Treasury demo · pre-demo checklist

Live site: https://shualuke.github.io/payment-integrity-platform/?uc=treas
IRS window: the same link with `&sys=irs` (or "New window" on a package).

## The night before
- [ ] `node tools/click-test-treas.cjs` passes against the live site (`SITE=https://shualuke.github.io/payment-integrity-platform/`).
- [ ] Run the 12-step tour once, end to end, in the browser you will present from.
- [ ] Decide one tab or two windows (below). Rehearse that one.

## Browser setup (the presenting machine)
- [ ] One browser, one profile. The two windows only sync inside the same browser; an incognito window or a second browser will not.
- [ ] Pop-ups allowed for the site (otherwise "New window" opens IRS in the same tab and says so).
- [ ] ⌘⇧R once to load the latest version; check the footer version matches the deploy.
- [ ] Zoom at 100 %; the network graphs are laid out for 1440 px and wider.
- [ ] Close other tabs on the site: a stale tab also answers the window link.

## Two windows (preferred for a screen share from a big monitor)
- [ ] Treasury left, IRS right, each about half the screen; the IRS window shows the green "Linked to Treasury's window" dot.
- [ ] Sign in to IRS before the demo so the inbox is up and reads "Waiting for Treasury".
- [ ] Same-tab is the fallback: "Open IRS's system" on the package; the logo toggles back.

## One tab (a single laptop on a projector)
- [ ] The tour's steps 10–12 handle it: send, "Open IRS's system", sign in, decide, "See it in Treasury".
- [ ] Browser Back works between screens; it never leaves the site.

## Reset between runs
- [ ] "Reset" in the top bar reloads both windows to the starting state.
- [ ] If a window was closed, reopen it; it catches up on its own.

## Known limits (say them, don't hit them)
- The IRS system is simulated and labeled as such; no agency seal, no real sign-in.
- Purchased-data checks (income history, commercial TIN) are shown as available, not run.
- All data is synthetic; the real cases on slide 11 are the shape, not the source.
