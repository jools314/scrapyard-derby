# Releases

Newest first. Every push to `main` goes live; each one bumps `BUILD` and adds a line here. See [CONTRIBUTING.md](CONTRIBUTING.md).

| build | date | highlights |
|---|---|---|
| 81 | 2026-11-15 | Honk Back: honk at a bull (within earshot, ~26 m) and it answers with a moo pitched like your horn; honk again within a few seconds and it harmonises a fifth up. Sound only — the bull's own moo at a set pitch — no new lines. Test: tests/honkback.js |
| 80 | 2026-11-15 | Sad Trombone: the first wreck of a match earns one sad trombone if it happens within ten seconds of the start — and if it happens within five, the trombone gives up halfway through the note. Sound only (a new sfx sting), no new lines. Test: tests/trombone.js |
| 79 | 2026-11-15 | The Golden Cone: exactly one cone per match is secretly gold underneath the orange. Knock it over and it reveals itself — confetti, a little fanfare and a toast — and stays gold (drawn on its own, out of the prop batch) for the rest of the match. Test: tests/goldcone.js |
| 78 | 2026-11-15 | Instant Ground Beef: a bull that wanders into the Combine's spinning reel no longer just gets tossed — it comes out the back as a burger, no fire required, and the Combine's harvest counter counts it like anything else the reel takes in. Test: tests/groundbeef.js |
| 77 | 2026-11-15 | Soggy Burger: hose a bull-burger and it goes limp and friction-free — one shove and it slides across the yard like a curling stone, sagging wide and flat, until it dries out after 8 s and sits proud again. It still counts as a burger everywhere burgers count. Test: tests/soggy.js |
| 76 | 2026-11-15 | Rubber Duck: the first time the fire truck's hose hits a bull, the bull gives up — it sits down in the puddle, defeated, and stays sat for 5 s while a little rubber duck floats past. Once per bull per match; sound is the bull's own moo, no new lines. Test: tests/duck.js |
| 75 | 2026-11-15 | HUD dedup: each driver's score now sits on their name/health row in the opponents list, and the separate small leaderboard panel is removed — same information, shown once, less screen used (the full table still opens with L) |
| 74 | 2026-11-15 | play log: stuck entries now record what the car is touching (another car, a prop, a wall, the ground) — the `why` the analyser and LOGS.md already expected, so stuck hotspots point at the thing to fix (logging only, no behaviour change) |
| 73 | 2026-11-15 | play log: the per-match snapshot now records draw calls and triangles, so the draw-call budget can be checked from real play logs (logging only, no behaviour change) |
| 72 | 2026-11-15 | play log: slow-incident records now keep draw calls, triangles and the sim/draw/wait split, so slow moments can be attributed from the logs (logging only, no behaviour change) |
| 71 | 2026-11-15 | dozer blade fixed: the mouldboard was bent convex toward travel (a plough); it now curves concave toward the front like a real blade, edges leading, face scooped 0.22 — visual geometry only, the physics blade is unchanged, no voice lines involved; regression test tests/blade.js asserts the scoop numbers |
| 70 | 2026-11-15 | from a real bug report: a car that loses all its wheels is wrecked instead of stranded forever; a broken browser speech engine (Mac Chrome) is left alone after 6 failed resets (recorded voices + subtitles); play-log uploads batched every 10 min, back off 1 h on HTTP 429, upload health shown in bug reports; every match logs how often each voice line is heard (repeat finder); perf test now median of 3 fresh runs |
| 69 | 2026-11-15 | voices take turns: one at a time, a real silence between lines, at most ~40% of a minute is talk, your own moments come first (busy 8-car match: 45 → ~7-9 lines/min, no overlaps, ~36% talk) |
| 68 | 2026-11-15 | recorded voices for 14 characters (ElevenLabs clips; 4 recast characters still on the browser voice); who-wrecks-whom matchup tracking (tow-truck/forklift drag kills credited); autoplay banner shows the build and a pending update; silent autoplay after 3 min with nobody playing (not when paused, not in multiplayer or VR); new accents and spicier roasts |
| 67 | 2026-11-14 | autoplay updates itself to new builds; play log ignores time the browser throttled the tab; test runs tagged |
| 66 | 2026-11-14 | performance overhaul (60 fps cap, 100% render scale, thermal step-down, 4× fewer car draw calls); women in the cast; menacing Mr. White + Jesse; 210 rival roasts; VR LOD fix |
| 65 | 2026-11-14 | rejoin reclaims your own car; one-tap Play together; VR mode for Quest; voice-clip player; small bug icon |
| 64 | 2026-11-14 | Tiger/dozer turn both ways again; iPhone layout; no zoom; full screen; scoreboard; play log with auto-upload; autoplay |

