# WORKBOARD.md: who is working on what

Claim before you start (see AGENTS.md): add a line under *In progress* and push it to `main` right away. A line with no activity for 24 h is stale and may be taken over. Move it to *Done* with the build number when it lands.

Format: `- [agent] topic — branch — claimed YYYY-MM-DD HH:MM UTC — notes`

**Can't run the tests on your machine** (no local Chromium)? Finish the work on your branch, add its own regression test, and list it under *Ready to land* below. Claude runs the gate (quick suite, plus the release suite where needed) on a machine that can, rebases it onto the latest `main`, takes the next build number and lands it. Failures are reported back to you here. Don't push untested game changes to `main`.

## In progress
- [claude] Build 70: bug-report fixes (a car with no wheels left is wrecked instead of stranded; a broken browser speech engine is left alone; uploads batched every 10 min, back off on HTTP 429, and show their status in bug reports) plus logging how often each voice line is heard — local test run in progress — claimed 2026-11-15 06:50 UTC
- [claude] Test gate for agents without a browser: runs the gates for branches listed under *Ready to land* — ongoing
- [claude] Per-car AI tactics from the car roles (Viper hit-and-run, tow truck/forklift drag prey into hazards, etc.) plus stuck-spot fixes from the play logs, plus Outrider/Sandflea physics catches, and the Build 67 stuck/physics regression — claude/ai-stuck — claimed 2026-11-15 05:55 UTC — paused by usage limit until ~10:00 UTC
- [claude] Visible signature weak spots (blower, tank leak, water gauge, minigun overheat, drum crack, forks tip, reel jam, tyres, water stall, propane) — claude/weak-spots — claimed 2026-11-15 05:55 UTC
- [claude] Player target picking: Tab / one 🎯 button cycles visible targets for the Tiger cannon, minigun, rockets — claude/target-pick — claimed 2026-11-15 05:55 UTC
- [claude] Voice round 5: Emeka "Danfo" Okafor replaces Raju (Sandflea), recordings for Bogdan/Ragnar/Maxine/Emeka, 60+ new rude/quirky/old-school commentary lines each for Kev and Shazza, 15 more per driver, and repeats fixed using the heard-log (brief: docs/voices/round5-brief.md) — claude/voices-round5 — claimed 2026-11-15 05:55 UTC — paused by usage limit until ~10:00 UTC
- [claude] Reviewing and merging Muse's bob/improvements-100 per REVIEW-improvements-100.md — claude/muse-merge — claimed 2026-11-15 05:55 UTC
- [muse] Land dozer blade concave-forward fix — muse/dozer-blade-fix — claimed 2026-11-15 06:04 UTC — porting bob/dozer-blade-fix through the gates — UPDATE 2026-11-15 06:12 UTC: branch finished and parked (build 69, regression test tests/blade.js, syntax suite passed); holding at the gate — the quick suite needs a Chromium that runs locally (Playwright browser download fails in the muse sandbox and downloads are now off-limits by owner rule); will land as soon as a local-browser recipe is confirmed
- [muse] bob/improvements-round2 — branch exists; landing plan to follow (not yet claimed)

## Ready to land (needs the test gate)
- [muse] muse/dozer-blade-fix (or bob/dozer-blade-fix): dozer blade concave-forward fix plus tests/blade.js. Claude will gate it after Build 70 (it was numbered 69, which is taken, so it gets the next free number).

## Done
- [claude] Build 69: voices take turns (talk governor), talk + zoom tests in the quick suite, breathing-room rules — build 69
- [claude] Repo setup for parallel agents: AGENTS, TASTE, QUALITY-GATES, BACKLOG, LOGS, tests/ in the repo, perf budget test, play-logs branch — docs only
- [claude] Build 68: recorded voices for 14 characters, matchup tracking, build on the autoplay banner, idle autoplay — build 68
