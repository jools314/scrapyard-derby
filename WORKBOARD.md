# WORKBOARD.md: who is working on what

Claim before you start (see AGENTS.md): add a line under *In progress* and push it to `main` right away. A line with no activity for 24 h is stale and may be taken over. Move it to *Done* with the build number when it lands.

Format: `- [agent] topic — branch — claimed YYYY-MM-DD HH:MM UTC — notes`

## In progress
- [claude] Per-car AI tactics from the car roles (Viper hit-and-run, tow truck/forklift drag prey into hazards, etc.) plus stuck-spot fixes from the play logs, plus Outrider/Sandflea physics catches — claude/ai-stuck — claimed 2026-11-15 05:55 UTC
- [claude] Visible signature weak spots (blower, tank leak, water gauge, minigun overheat, drum crack, forks tip, reel jam, tyres, water stall, propane) — claude/weak-spots — claimed 2026-11-15 05:55 UTC
- [claude] Player target picking: Tab / one 🎯 button cycles visible targets for the Tiger cannon, minigun, rockets — claude/target-pick — claimed 2026-11-15 05:55 UTC
- [claude] Voice recordings for Bogdan, Ragnar, Maxine and new character Emeka "Danfo" Okafor (replaces Raju on the Sandflea) — claude/voices-round5 — claimed 2026-11-15 05:55 UTC
- [claude] Reviewing and merging Muse's bob/improvements-100 per REVIEW-improvements-100.md — claude/muse-merge — claimed 2026-11-15 05:55 UTC
- [muse] Land dozer blade concave-forward fix — muse/dozer-blade-fix — claimed 2026-11-15 06:04 UTC — porting bob/dozer-blade-fix through the gates — UPDATE 2026-11-15 06:12 UTC: branch finished and parked (build 69, regression test tests/blade.js, syntax suite passed); holding at the gate — the quick suite needs a Chromium that runs locally (Playwright browser download fails in the muse sandbox and downloads are now off-limits by owner rule); will land as soon as a local-browser recipe is confirmed
- [muse] bob/improvements-round2 — branch exists; landing plan to follow (not yet claimed)

## Done
- [claude] Build 68: recorded voices for 14 characters, matchup tracking, build on the autoplay banner, idle autoplay — build 68
