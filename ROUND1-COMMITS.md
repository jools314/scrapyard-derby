# Round 1 — item → commit map

This branch was rebuilt on 2026-11-14 (Jonas's approval) from the original single
squashed round-1 commit `d2c967b` into **one commit per improvement**, so each item can
be reviewed, reverted or cherry-picked on its own — the same convention as the
round-2 branch (`bob/improvements-round2`). The rebuild is history-only:

- Final `index.html` is byte-identical to the old tip (md5 `a67b47e7f12bb02046d5b613789fbe90`).
- `IMPROVEMENTS-100.md` and `IMPROVEMENTS-BEST-50.md` are byte-identical to the old tip.
- `git diff d2c967b <this tip> -- index.html IMPROVEMENTS-100.md IMPROVEMENTS-BEST-50.md` is empty;
  the only tree difference is this file.
- The module JS in the final `index.html` passes `node --check`.

Base: `952e8b9` (Build 67). Status counts: **79 implemented, 9 partial, 8 already-present,
4 skipped** (plus the R1-0 in-file pass marker and the docs commit below).

| Item | Title | Status | Commit |
|---|---|---|---|
| 0 | Mark the pass in-file (BOB_PASS, BUILD stays 67) | implemented (branch marker) | `a808129` |
| 1 | Respawn gets an ending (match timer / wrecks-to-win) | implemented | `2381a6d` |
| 2 | Persistent best score per mode and car | implemented | `06a382a` |
| 3 | A real results screen (biggest hit, props, best air, accuracy) | implemented | `84e5d8a` |
| 4 | Guided first match (tutorial prompts) | implemented | `1b8cdcb` |
| 5 | WebGL failure panel instead of a dead menu | implemented | `9e8828e` |
| 6 | Wreck replay on demand (and on your own wreck) | implemented | `699184a` |
| 7 | Crash cam guaranteed on wreck-causing hits | implemented | `1515470` |
| 8 | Slow-mo on your Elimination death | implemented | `44ce99b` |
| 9 | Countdown camera push-in | implemented | `396d16c` |
| 10 | Hit-direction indicator | implemented | `c303c78` |
| 11 | Low-health state (grade + engine detune) | implemented | `5aad1bd` |
| 12 | Nitro for aggression | implemented | `95abecf` |
| 13 | Prop-smash combos | implemented | `f96057f` |
| 14 | Near-miss bonus | implemented | `c041c54` |
| 15 | Shield pickup + shuffled pickup kinds | implemented | `599ebe9` |
| 16 | Hazard telegraphs (crusher + crane warnings) | implemented | `5dd6c06` |
| 17 | Hazard-kill credit | already-present in Build 67 | — (no change, no commit) |
| 18 | Rubber-banding in Respawn matches | implemented | `c83ca3c` |
| 19 | Field-size chips on the menu | implemented | `a81e151` |
| 20 | Free drive | implemented | `213e204` |
| 21 | AI mend plan (persona-weighted repair detours) | implemented | `4ed4bb5` |
| 22 | Finisher bias in AI target scoring | implemented | `20be58d` |
| 23 | Charge honks | implemented | `31449af` |
| 24 | Per-car plan layer on persona weights | implemented | `b04dbc0` |
| 25 | Aim-leading for the minigun (partial) | partial | `5492315` |
| 26 | Track tell at half health | implemented | `cb2d45f` |
| 27 | Beached-AI recovery | implemented | `76ada89` |
| 28 | Top difficulty seeds a gun car | implemented | `fd59487` |
| 29 | Assists | implemented | `c9933c7` |
| 30 | Scrape tier (grazes scuff and pay) | implemented | `375785a` |
| 31 | Gamepad support | implemented | `873222c` |
| 32 | Haptics (impact and wreck vibration) | implemented | `d2e3a8f` |
| 33 | Hold-C look-back | implemented | `d3482d1` |
| 34 | Tilt settings, wired (dead zone + full-lock angle) | implemented | `700b664` |
| 35 | Battery-aware cool mode | implemented | `51bd9f3` |
| 36 | Auto-pause on tab hide (solo) | implemented | `da5cb97` |
| 37 | FIRE button cooldown sweep | implemented | `732f195` |
| 38 | FIRE button greys out on cooldown | implemented | `bada15f` |
| 39 | Button steering option for touch | implemented | `fb9701a` |
| 40 | Camera shake slider | implemented | `f09fc6a` |
| 41 | Camera mode remembered per car | implemented | `cb68c87` |
| 42 | Portrait menu containment (partial) | partial | `212e9bf` |
| 43 | Music ducking under barks | already-present in Build 67 | — (no change, no commit) |
| 44 | Impact-voice budget in sfx.noiseHit | implemented | `6a18c13` |
| 45 | Diesel knock for heavy metal (partial) | partial | `c520473` |
| 46 | Announcer lines route through the subtitle show() | already-present in Build 67 | — (no change, no commit) |
| 47 | iOS subtitles-first default | implemented | `306ee50` |
| 48 | Horn as a signal (double-honk minimap ping) | implemented | `aa4ed85` |
| 49 | Crowd bed tracks the fight | implemented | `e9973f3` |
| 50 | Countdown sting is your own horn | implemented | `2e2642a` |
| 51 | Family yard PIN | implemented | `df044aa` |
| 52 | Host QR code | already-present in Build 67 | — (no change, no commit) |
| 53 | Host-meltdown handover prompt (partial) | partial | `1ec1a92` |
| 54 | Guest-side prediction | skipped | — (no change, no commit) |
| 55 | Spectate cam on the menu brawl (partial) | partial | `e740a12` |
| 56 | Lobby connection marks | implemented | `cf5e62c` |
| 57 | Rematch (host button + guest handling) | implemented | `77d169e` |
| 58 | Rejoin slot (dropStale / lateJoin) | already-present in Build 67 | — (no change, no commit) |
| 59 | Family field cap stated + AI backfill to a fixed field | implemented | `1a413a0` |
| 60 | Per-player paint | implemented | `6278e6f` |
| 61 | Second arena | skipped | — (no change, no commit) |
| 62 | Layout rotation | skipped | — (no change, no commit) |
| 63 | Dusk (third lighting mood) | implemented | `d6d0370` |
| 64 | Standing challenges | implemented | `d936272` |
| 65 | Mastery stars per car | implemented | `3dcead2` |
| 66 | Themed derbies (Heavy metal / Buggies only) | implemented | `4fb3db5` |
| 67 | A named rival | implemented | `85ccee2` |
| 68 | Seasonal dressing | skipped | — (no change, no commit) |
| 69 | Pickup theatre (repair pedestal) | implemented | `becf60b` |
| 70 | Baitable bulls (honk = red rag) | implemented | `386fc72` |
| 71 | SAP broadphase + static grid | already-present in Build 67 | — (no change, no commit) |
| 72 | JUMBO recorder writes into a preallocated pool | implemented | `2530781` |
| 73 | Minimap base-canvas blit throttled to 30 ms | already-present in Build 67 | — (no change, no commit) |
| 74 | HUD write caching | already-present in Build 67 | — (no change, no commit) |
| 75 | Intervals folded into the frame loop | implemented | `736d4ea` |
| 76 | SELF_HTML captured lazily | implemented | `49093f4` |
| 77 | Adaptive physics substeps follow measured physics time | implemented | `7747f05` |
| 78 | Physics blow-ups counted in PERFREP | implemented | `4a76d3d` |
| 79 | COMBAT constants table | implemented | `1cc7371` |
| 80 | ?smoke headless smoke hook (partial) | partial | `785a861` |
| 81 | Voice list loads lazily | implemented | `2c9d5f8` |
| 82 | Module preloads for three.js and cannon-es | implemented | `4c4d258` |
| 83 | Garage rebuild debounced to one per frame | implemented | `67e83f2` |
| 84 | Ambient counts follow the quality tier | implemented | `b4d3c7f` |
| 85 | Garage stat bars normalised (Armour replaces Weight) | implemented | `edeff48` |
| 86 | Physics presets (Ice rink / Moon derby / Tank world) | implemented | `f251df3` |
| 87 | Restart-required settings say so mid-match | implemented | `294dd5c` |
| 88 | Toast queue polish (score chips, warning lifetime) | implemented | `5a82296` |
| 89 | Floating score text at the point of the hit (partial) | partial | `9a47bff` |
| 90 | Stats panel collapses on small landscape screens (partial) | partial | `c2c4a50` |
| 91 | Colour-blind damage palette + labelled diagram | implemented | `dd946b3` |
| 92 | Reduce motion | implemented | `af7ab55` |
| 93 | Big subtitles setting | implemented | `e9758ef` |
| 94 | IJKL key preset | implemented | `2be6b35` |
| 95 | __derby internals gated behind ?debug | implemented | `b50877e` |
| 96 | Frame-error dead stop opens the bug report | implemented | `e0a5008` |
| 97 | Update banner deferred out of live multiplayer | implemented | `f124992` |
| 98 | Reset all saved data (partial) | partial | `3cb0822` |
| 99 | Per-group Defaults buttons in the tune panel | implemented | `7a7ea6f` |
| 100 | Netcode contract comment | implemented | `31e2865` |

Branch commits that are not items:

| Commit | What |
|---|---|
| `R1-docs` | IMPROVEMENTS-100.md + IMPROVEMENTS-BEST-50.md, verbatim from the old tip (first commit on the branch, so every item commit can be read against them) |
| this file | ROUND1-COMMITS.md — the map itself (tip commit) |

Commit message convention: subject `R1-<item#>: <title>`; body gives what changed and
where, why, the player-visible effect, risk/verification status, and cherry-pick notes
(clean, or which earlier R1 commits it textually depends on). A few items share lines
inseparably (e.g. the game-state field list, the countdown line, the onWreck killer
block); those dependencies are named in the affected commit bodies.
