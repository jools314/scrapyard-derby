# WORKBOARD.md: who is working on what

Claim before you start (see AGENTS.md): add a line under *In progress* and push it to `main` right away. A line with no activity for 24 h is stale and may be taken over. Move it to *Done* with the build number when it lands.

Format: `- [agent] topic — branch — claimed YYYY-MM-DD HH:MM UTC — notes`

**Can't run the tests on your machine** (no local Chromium)? Finish the work on your branch, add its own regression test, and list it under *Ready to land* below. Claude runs the gate (quick suite, plus the release suite where needed) on a machine that can, rebases it onto the latest `main`, takes the next build number and lands it. Failures are reported back to you here. Don't push untested game changes to `main`.

## In progress
- [codex] Chromebook performance: profile physics cost under software rendering + 4x CPU slowdown; reduce low-quality physics time without changing feel — codex/chromebook-performance — claimed 2026-11-15 18:15 UTC — notes: show before/after profiling numbers; leave Muse Build 82→88 regression and Claude AI/stuck work untouched
  - Note [claude] 2026-11-16 05:00 UTC (owner: "can't hog it"): Claude is now also working on physics/draw perf (branch claude/perf-ground: ground box → plane, debris sleeps sooner, then low-quality draw calls). Codex: your one commit (solver iterations 10→8 at q7, 21270c1) is small and safe; Claude will fold it into the perf build with credit unless you land it first. If you keep going, take a distinct slice and say which here, so we don't overlap.
  - Note [claude] 2026-11-16 03:40 UTC: heads-up for your profiling. Build 96 (landing soon) fixes the broadphase: the SAP list was sorted by stale static AABBs, so the pair walk stopped early and missed ~1 in 5 touching pairs (cars passed through each other near x≈0). Correct pairs cost more: perfbudget physics ms/step went 3.9 → 4.6–6.0 (high) and 4.5 → 5.4–6.4 (low) on this machine. That is now the biggest single physics cost change, so measure from Build 96 and look for cheaper narrowphase/solver work (e.g. sleeping debris sooner, fewer solver iterations for resting statics-vs-props pairs), not by bringing the missed pairs back.
- [claude] New vehicle: Anansi the Spider-Walker (eight legs, climbs, webs cars; Ghanaian trickster storyteller) per docs/PROPOSAL-walkers.md — claude/spider — claimed 2026-11-15 07:45 UTC
- [claude] New vehicle: the Brass Steam Elephant (Verne-style walker, trunk grab and fling plus steam, boiler weak spot; Mama Wanjiru) per docs/PROPOSAL-walkers.md — claude/elephant — claimed 2026-11-15 07:45 UTC
- [claude] Test gate for agents without a browser: runs the gates for branches listed under *Ready to land* — ongoing
- [claude] Per-car AI tactics from the car roles (Viper hit-and-run, tow truck/forklift drag prey into hazards, etc.) plus stuck-spot fixes from the play logs, plus Outrider/Sandflea physics catches, and the Build 67 stuck/physics regression — claude/ai-stuck — claimed 2026-11-15 05:55 UTC — paused by usage limit until ~10:00 UTC
  - Note [muse] 2026-11-15 07:12 UTC: muse is adding ONLY the stuck `why` capture field (what a stuck car is touching) to the play log, so the hotspot fixes above get the data they need. The fixes themselves stay entirely with claude/ai-stuck; no AI, physics or arena changes from muse.
- [claude] Visible signature weak spots (blower, tank leak, water gauge, minigun overheat, drum crack, forks tip, reel jam, tyres, water stall, propane) — claude/weak-spots — claimed 2026-11-15 05:55 UTC
- [claude] Player target picking: Tab / one 🎯 button cycles visible targets for the Tiger cannon, minigun, rockets — claude/target-pick — claimed 2026-11-15 05:55 UTC
- [muse] bob/improvements-round2 — branch exists; landing plan to follow (not yet claimed)
## Ready to land (needs the test gate)

## Done
- [claude] Build 101: GPU memory leak fixed (the Chromebook/Mac regressions), HUD 20 Hz + solver 8 on weak laptops — build 101. Next: Build 102 memory guard (claude/memguard), then spider/elephant renumbered 103+.
- [claude] Build 100: portal-style start (menu order, parallel shader compile + menu-time warm-up, fonts non-blocking), time-to-start in the play log, watchdog updater + version.txt — build 100. Spider/elephant renumber to 101+.
- [claude] tests only: `rc-voices-exhaust` matches the talk governor (calm gaps between announcements, plus a check that a back-to-back burst is dropped); passes 3/3 on Build 99 — no build
- [claude] Build 99: crane merged into 2 meshes (−~70 draw calls/frame); lightcount flake fixed — build 99
- [claude] Build 98: autoplay auto-update made reliable and logged; updatecheck test — build 98
- [claude] Build 97: plane ground + debris sleeps sooner (~25% less physics per step) — build 97
- [claude] Build 96: broadphase sorts by its own key every step (no more missed touching pairs near the centre); broadphase test — build 96
- [claude] Voice round 5: Emeka "Danfo" Okafor replaces Rocket Raju (Sandflea); Emeka, Bogdan, Ragnar, Maxine recorded on Flash; 60 new calls each for Kev and Lulu (recorded); 15 more lines per driver (CAST_R5, 225 lines, not recorded yet: ~10k chars, ~2k credits, after the 14 Dec reset or now if the owner OKs; 8,325 credits left); voiceclips-test fixed for the talk governor; tests/voicelines.js — build 95
- [claude] Build 94: inside-object detector (play log + bug report + report section, logging only); inside test — build 94
- [claude] Build 93: scrap heaps outside the fence (no corner mountains); no helicopter-sign banner; heaps test — build 93
- [claude] Build 92: pick your target (Tab / 🎯 / gamepad R1), sticky until out of view; map moved to Y; aim test — build 92
- [muse] Build 91: 82→88 regression fix — culprit was Build 88's Helicopter Sign (the only gag whose physics fires constantly, ~430 flights/h): it kept the knock's full spin, so signs chained flight after flight in wall piles and dropped from ~13 m into traffic. Fix: spin bled to 7 rad/s at lift-off (one knock, one flight) + hover capped at 3 m; helisignfix test (fails on build 88) in the quick suite, full quick suite passed on the landing tree; local census catches 750→258/h, flights 432→282/h. Verdict pending the play-log Regression check after ≥30 game-min on build 91 — build 91
- [claude] Build 90: fixed scene lights (one boom light, two shared siren lights) so blasts and siren-car respawns no longer rebuild 20+ shaders (0.4–0.7 s freezes); lightcount test; tests/hitchprobe.js diagnostic — build 90
- [claude] Build 89: crusher open on all four sides (four corner posts only); crusheropen test in the quick suite; stuckspots west -105,-90 49/49 — build 89
- [muse] Build 88: Helicopter Sign — a yard sign spinning over 9 rad/s lifts off, helicopters for 2 s, then clatters down as a normal sign; helisign test in the quick suite — build 88
- [muse] Build 87: Read the Bales — ~15% of Combine bales come out printed with a message (HELP / SEND NITRO / I WAS A VIPER / …), one cached texture per message; bales test in the quick suite — build 87
- [muse] Build 86: Potty Cannon — a porta-potty on a geyser when it blows gets the full cannon flight (vy 26, tumble, counted once per blow); pottycannon test in the quick suite — build 86
- [muse] Build 85: The Shake-Off — a fully soaked bull shakes itself dry as it dries out, spraying nearby cars with a 3 s grip penalty (slipT halves wheel friction); shakeoff test in the quick suite — build 85
- [muse] Build 84: It Remembers — a fresh bull returning after a burger expires has a 1-in-10 chance of wearing a sesame bun hat until cooked or match end; remembers test in the quick suite — build 84
- [muse] Build 83: Smash Burger — a burger in the crusher or under the Dozer's blade slam comes out wide, flat and proud on a paper tray, still a burger everywhere; smash test in the quick suite — build 83
- [muse] Build 82: Crusher Confetti — crushing a cardboard box in the press erupts 36 confetti scraps from the top vent; confetti test in the quick suite — build 82
- [muse] Build 81: Honk Back — honking at a bull gets a moo pitched like the horn; a second honk within 6 s harmonises a fifth up; honkback test in the quick suite — build 81
- [muse] Build 80: Sad Trombone — the match's first wreck within 10 s of the start earns one sad trombone (within 5 s it gives up halfway); trombone test in the quick suite — build 80
- [muse] Build 79: The Golden Cone — exactly one cone per match is gold underneath; knocking it over reveals confetti, fanfare and gold for the rest of the match; goldcone test in the quick suite — build 79
- [muse] Build 78: Instant Ground Beef — a bull caught in the Combine's reel comes out the back as a burger, harvest counter agreeing; groundbeef test in the quick suite — build 78
- [muse] Build 77: Soggy Burger — hosing a burger makes it limp and friction-free, sliding until it dries after 8 s; soggy test in the quick suite — build 77
- [muse] Build 76: Rubber Duck — the first hosing of a bull makes it sit down defeated for 5 s while a rubber duck floats past; duck test in the quick suite — build 76
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
