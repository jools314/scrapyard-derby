# WORKBOARD.md: who is working on what

Claim before you start (see AGENTS.md): add a line under *In progress* and push it to `main` right away. A line with no activity for 24 h is stale and may be taken over. Move it to *Done* with the build number when it lands.

Format: `- [agent] topic — branch — claimed YYYY-MM-DD HH:MM UTC — notes`

**Can't run the tests on your machine** (no local Chromium)? Finish the work on your branch, add its own regression test, and list it under *Ready to land* below. Claude runs the gate (quick suite, plus the release suite where needed) on a machine that can, rebases it onto the latest `main`, takes the next build number and lands it. Failures are reported back to you here. Don't push untested game changes to `main`.

## In progress
- [claude] Build 70: bug-report fixes (a car with no wheels left is wrecked instead of stranded; a broken browser speech engine is left alone; uploads batched every 10 min, back off on HTTP 429, and show their status in bug reports) plus logging how often each voice line is heard — local test run in progress — claimed 2026-11-15 06:50 UTC
- [claude] Test gate for agents without a browser: runs the gates for branches listed under *Ready to land* — ongoing
- [claude] Per-car AI tactics from the car roles (Viper hit-and-run, tow truck/forklift drag prey into hazards, etc.) plus stuck-spot fixes from the play logs, plus Outrider/Sandflea physics catches, and the Build 67 stuck/physics regression — claude/ai-stuck — claimed 2026-11-15 05:55 UTC — paused by usage limit until ~10:00 UTC
  - Note [muse] 2026-11-15 07:12 UTC: muse is adding ONLY the stuck `why` capture field (what a stuck car is touching) to the play log, so the hotspot fixes above get the data they need. The fixes themselves stay entirely with claude/ai-stuck; no AI, physics or arena changes from muse.
- [claude] Visible signature weak spots (blower, tank leak, water gauge, minigun overheat, drum crack, forks tip, reel jam, tyres, water stall, propane) — claude/weak-spots — claimed 2026-11-15 05:55 UTC
- [claude] Player target picking: Tab / one 🎯 button cycles visible targets for the Tiger cannon, minigun, rockets — claude/target-pick — claimed 2026-11-15 05:55 UTC
- [claude] Voice round 5: Emeka "Danfo" Okafor replaces Raju (Sandflea), recordings for Bogdan/Ragnar/Maxine/Emeka, 60+ new rude/quirky/old-school commentary lines each for Kev and Shazza, 15 more per driver, and repeats fixed using the heard-log (brief: docs/voices/round5-brief.md) — claude/voices-round5 — claimed 2026-11-15 05:55 UTC — paused by usage limit until ~10:00 UTC
- [claude] Reviewing and merging Muse's bob/improvements-100 per REVIEW-improvements-100.md — claude/muse-merge — claimed 2026-11-15 05:55 UTC
- [muse] Land dozer blade concave-forward fix — muse/dozer-blade-fix — claimed 2026-11-15 06:04 UTC — porting bob/dozer-blade-fix through the gates — UPDATE 2026-11-15 06:12 UTC: branch finished and parked (build 69, regression test tests/blade.js, syntax suite passed); holding at the gate — the quick suite needs a Chromium that runs locally (Playwright browser download fails in the muse sandbox and downloads are now off-limits by owner rule); will land as soon as a local-browser recipe is confirmed
- [muse] bob/improvements-round2 — branch exists; landing plan to follow (not yet claimed)
- [muse] Play-log analyser: use the physics census (phys.kinds/undos/escapes/rescues/fixes/clamps) for totals, add fixes/clamps per hour, label the per-vehicle catch list as a capped sample — muse/log-analyser-census — claimed 2026-11-15 07:12 UTC — tools/logs only, no game code
- [muse] Play-log analyser: slow-incident breakdown (cause × quality level × game-time phase, top incidents with parts/worstF) — muse/log-analyser-slow — claimed 2026-11-15 07:12 UTC — tools/logs only
- [muse] Play-log analyser: balance table v2 (damage taken/life, avg life seconds, weapon fires from veh[]) — muse/log-analyser-balance — claimed 2026-11-15 07:12 UTC — tools/logs only
- [muse] Play-log analyser: physics-catch heatmap (listed catches clustered on the same 12 m grid as stuck spots) — muse/log-analyser-heatmap — claimed 2026-11-15 07:12 UTC — tools/logs only
- [muse] Play-log analyser: voice counters in the report (sent vs started vs errors from the voice record) — muse/log-analyser-voice — claimed 2026-11-15 07:12 UTC — tools/logs only
- [muse] Play log capture: keep draw calls, triangles and the sim/draw/wait split in slow-incident records (PLAYLOG.slow) — muse/playlog-slow-fields — claimed 2026-11-15 07:12 UTC — logging only, no behaviour change; release suite before landing
- [muse] Play log capture: record draw calls + triangles in the per-match memory snapshot so the draw-call budget is checkable from logs — muse/playlog-mem-render — claimed 2026-11-15 07:12 UTC — logging only; release suite before landing
- [muse] Play log capture: stuck entries record what the car is touching (the `why` field the analyser and LOGS.md already expect) — muse/playlog-stuck-why — claimed 2026-11-15 07:12 UTC — capture only, hotspot fixes stay with claude/ai-stuck (note under that line); release suite before landing
- [muse] HUD dedup (owner's direct instruction): each driver's score moves onto their existing name/health row in the opponents list, and the separate small leaderboard panel is removed — same information, shown once, less screen used — muse/hud-score-on-opponents — claimed 2026-11-15 07:20 UTC — HUD/touch hot spot; phone overlap tests must stay green; the on-demand full table (L key) stays

## Ready to land (needs the test gate)
- [muse] muse/dozer-blade-fix: dozer blade concave-forward fix plus tests/blade.js. **Muse can now run the tests itself (2026-11-15), so Muse lands it**: rebase on main, take the next free build number (Claude's Build 70 is landing first, so 71 or later), run the quick suite, then push. Claude will only gate it if Muse asks here.

## Done
- [claude] Build 69: voices take turns (talk governor), talk + zoom tests in the quick suite, breathing-room rules — build 69
- [claude] Repo setup for parallel agents: AGENTS, TASTE, QUALITY-GATES, BACKLOG, LOGS, tests/ in the repo, perf budget test, play-logs branch — docs only
- [claude] Build 68: recorded voices for 14 characters, matchup tracking, build on the autoplay banner, idle autoplay — build 68
