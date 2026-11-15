# WORKBOARD.md: who is working on what

Claim before you start (see AGENTS.md): add a line under *In progress* and push it to `main` right away. A line with no activity for 24 h is stale and may be taken over. Move it to *Done* with the build number when it lands.

Format: `- [agent] topic — branch — claimed YYYY-MM-DD HH:MM UTC — notes`

**Can't run the tests on your machine** (no local Chromium)? Finish the work on your branch, add its own regression test, and list it under *Ready to land* below. Claude runs the gate (quick suite, plus the release suite where needed) on a machine that can, rebases it onto the latest `main`, takes the next build number and lands it. Failures are reported back to you here. Don't push untested game changes to `main`.

## In progress
- [claude] New vehicle: Anansi the Spider-Walker (eight legs, climbs, webs cars; Ghanaian trickster storyteller) per docs/PROPOSAL-walkers.md — claude/spider — claimed 2026-11-15 07:45 UTC
- [claude] New vehicle: the Brass Steam Elephant (Verne-style walker, trunk grab and fling plus steam, boiler weak spot; Mama Wanjiru) per docs/PROPOSAL-walkers.md — claude/elephant — claimed 2026-11-15 07:45 UTC
- [claude] Test gate for agents without a browser: runs the gates for branches listed under *Ready to land* — ongoing
- [claude] Per-car AI tactics from the car roles (Viper hit-and-run, tow truck/forklift drag prey into hazards, etc.) plus stuck-spot fixes from the play logs, plus Outrider/Sandflea physics catches, and the Build 67 stuck/physics regression — claude/ai-stuck — claimed 2026-11-15 05:55 UTC — paused by usage limit until ~10:00 UTC
  - Note [muse] 2026-11-15 07:12 UTC: muse is adding ONLY the stuck `why` capture field (what a stuck car is touching) to the play log, so the hotspot fixes above get the data they need. The fixes themselves stay entirely with claude/ai-stuck; no AI, physics or arena changes from muse.
- [claude] Visible signature weak spots (blower, tank leak, water gauge, minigun overheat, drum crack, forks tip, reel jam, tyres, water stall, propane) — claude/weak-spots — claimed 2026-11-15 05:55 UTC
- [claude] Player target picking: Tab / one 🎯 button cycles visible targets for the Tiger cannon, minigun, rockets — claude/target-pick — claimed 2026-11-15 05:55 UTC
- [claude] Voice round 5: Emeka "Danfo" Okafor replaces Raju (Sandflea), recordings for Bogdan/Ragnar/Maxine/Emeka, 60+ new rude/quirky/old-school commentary lines each for Kev and Shazza, 15 more per driver, and repeats fixed using the heard-log (brief: docs/voices/round5-brief.md) — claude/voices-round5 — claimed 2026-11-15 05:55 UTC — paused by usage limit until ~10:00 UTC
- [muse] bob/improvements-round2 — branch exists; landing plan to follow (not yet claimed)

## Ready to land (needs the test gate)

## Done
- [muse] Build 75: HUD dedup — score on each driver's opponents-list name/health row, separate small leaderboard removed (full table still on L); hudscore test in the quick suite — build 75
- [muse] Build 74: play log stuck entries record what the car is touching (`why`) — build 74
- [muse] Build 73: play log per-match snapshot records draw calls + triangles — build 73
- [muse] Build 72: play log slow incidents keep draw calls, triangles and the sim/draw/wait split — build 72
- [muse] Play-log analyser bundle (first improvement cycle): physics census totals + fixes/clamps per hour; slow-incident breakdown by cause × quality × phase; balance table v2 (taken/life, avg life, fires); physics-catch heatmap on the stuck grid; voice counters (sent vs started vs errors) — tools/logs only, no build; fixture test tools/logs/test_analyze.py
- [claude] Code review of bob/improvements-100: verdicts + bugs to fix as items land, in REVIEW-improvements-100.md and docs/review-improvements-100-code.md. **Muse lands those items itself.**
- [muse] Dozer blade concave-forward fix: the mouldboard was bent convex toward travel (a plough); reversed to a concave scoop (edges +0.12, face −0.10, scoop 0.22) — visual geometry only, the CANNON.Box physics blade is untouched; regression test tests/blade.js reads the built geometry off the live dozer — build 71
- [claude] Build 70: bug-report fixes (wheel-less car → wreck, broken speech engine left alone, upload batching + 429 back-off), voice-line repeat logging, steadier perf test — build 70
- [claude] Build 69: voices take turns (talk governor), talk + zoom tests in the quick suite, breathing-room rules — build 69
- [claude] Repo setup for parallel agents: AGENTS, TASTE, QUALITY-GATES, BACKLOG, LOGS, tests/ in the repo, perf budget test, play-logs branch — docs only
- [claude] Build 68: recorded voices for 14 characters, matchup tracking, build on the autoplay banner, idle autoplay — build 68
