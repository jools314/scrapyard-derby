# Scrapyard Derby — Round-2 improvements: item → commit map

**Branch:** `bob/improvements-round2` · **Base:** `d6f71f8` on `origin/main` (Build 67)
**Shape:** one commit per improvement, subject `R2-<n>: <title>`, so any item can be
cherry-picked on its own: `git cherry-pick <hash>`. Commit bodies say what changed,
why, the player-visible effect, the verification status, and any dependency on an
earlier R2 commit. The full 100-item list ships in this branch as
`IMPROVEMENTS-ROUND2-LIST.md`.

**Result: 57 implemented · 21 partial · 22 spec-only** (of 100).

**Tests (Jonas's rule, 2026-11-14 — every CL ships with tests):**
`node tests/round2.test.mjs` — **80 cases, all passing**. One case per implemented/
partial item verifies its wiring in `index.html` (picking an item out fails exactly
its case); the tools are executed against fixtures; the module is `node --check`ed.
Behaviour that needs a browser, a headset or two devices cannot run in CI-grade
headless form here — those items are covered by `tests/smoke.mjs` (browser, CDP;
skips honestly with exit 3 when no Chrome exists — it has not yet had a live pass)
and by the manual playtest list at the bottom of this file. **No test in this round
claims a gameplay, VR or multiplayer behaviour was exercised when it wasn't.**
`TESTING.md` is the full testing map.

**Rebase note:** this branch was first built on `952e8b9`; when main advanced to
`d6f71f8` ("Design principles + review of bob/improvements-100" — two markdown
files, no `index.html` changes), the branch was rebased onto it with **zero
conflicts**, and `index.html` is byte-identical across the rebase. All hashes
below are the post-rebase ones. `main` was never written to. The fernverk mirror
was not touched. `const BUILD` is unchanged ('67'); the pass is marked in-file by
`const BOB_PASS_R2 = 'improvements-round2';` (commit `e72a3a6`).

**⚠ Withheld items — needs Jonas's word:** items **14, 84 and 89** all touch the
bug-report upload path. During this round, a safety check flagged the report-upload
code section, and work in it was withheld rather than improvised around the flag.
They are documented below as spec-only with that reason stated. Implementing them
needs Jonas's explicit confirmation first.

---

## Implemented (57)

| # | Item | Commit | Test |
|---|------|--------|------|
| 1 | The jumbotron never renders in VR | `e3e0ccb` | R2-1 |
| 2 | No minimap or opponent arrows in the cockpit | `a34b929` | R2-2 |
| 3 | No countdown in VR | `db22bdf` | R2-3 |
| 4 | Hit-direction indicator for VR | `3add4a6` | R2-4 |
| 5 | VR results parity | `ff8e7fa` | R2-5 |
| 6 | Family-yard entry inside VR | `f8a3bbe` | R2-6 |
| 7 | Dynamic resolution in the VR governor | `378e437` | R2-7 |
| 8 | VR quality never steps back up | `817854b` | R2-8 |
| 9 | 120 Hz on Quest 3 | `b7c4a4f` | R2-9 |
| 13 | VR low-health feedback | `748776a` | R2-13 |
| 17 | Controller tracking-loss and battery surfacing | `e1d3f0b` | R2-17 |
| 18 | Per-car seat height in VR | `fa3bd86` | R2-18 |
| 24 | Family-yard host beacons are unauthenticated | `29b02cd` | R2-24 |
| 25 | Snapshot trimming can drop wreck events | `f533386` | R2-25 |
| 26 | Quick-chat wheel for guests | `513b194` | R2-26 |
| 29 | Guest input throttle + dedupe | `a5b3192` | R2-29 |
| 30 | Nickname hygiene | `b7b01a8` | R2-30 |
| 34 | Family-yard welcome line | `5c88be0` | R2-34 |
| 37 | Host clock in the snapshot | `a29a91d` | R2-37 |
| 38 | Per-room car memory for guests | `3d49b72` | R2-38 |
| 43 | A lifetime career screen | `30f4687` | R2-43 |
| 44 | Persistent rivalries | `2d53df9` | R2-44 |
| 45 | A daily challenge | `fb41150` | R2-45 |
| 49 | A match-history browser | `10ee107` | R2-49 |
| 52 | Shareable stats card | `f58cc9d` | R2-52 |
| 53 | Win streaks | `4b4c878` | R2-53 |
| 55 | Garage usage balance | `f73ecf2` | R2-55 |
| 56 | First-time ceremonies | `4affcf9` | R2-56 |
| 57 | Weekly challenge trio | `3fce4f0` | R2-57 |
| 58 | Nemesis bounty | `1643894` | R2-58 |
| 60 | Announcer coverage gaps | `1c2d34d` | R2-60 |
| 61 | A persona line-depth audit tool | `756a9b5` | R2-61 (tool executed) |
| 62 | Cross-match roast memory | `23d94ac` + `0aa9653` | R2-62 |
| 65 | Mid-match dynamic events | `deed29c` | R2-65 |
| 68 | MUSIC_FOR has drifted from the roster | `dee89b4` | R2-68 |
| 69 | Two scoring scales for the same match | `59c16c5` | R2-69 |
| 70 | Persona cards in the garage | `3e5b3f5` | R2-70 |
| 71 | Session scars | `14872f6` | R2-71 |
| 72 | Crowd wave | `1d66823` | R2-72 |
| 75 | Voice-clip coverage meter | `c0aaf28` | R2-75 |
| 76 | Announcer duo | `fbfc790` | R2-76 |
| 77 | The update check only works on github.io | `a33dc3e` | R2-77 |
| 78 | A real test harness in the repo | `d5b34ca` | R2-78 (skip-path verified; live pass owed) |
| 79 | CI on every push | `df6333f` | R2-79 (workflow authored but PARKED at `ci/github-ci.yml`: the pushing token lacks GitHub's `workflow` scope — see the relocation commit after this doc; activate per TESTING.md §5) |
| 80 | Deterministic seed mode | `bbb1b5b` | R2-80 |
| 81 | Play-log diff tool | `7e94a48` | R2-81 (executed on fixtures) |
| 82 | Perf budgets as assertions | `ffd4e32` | R2-82 |
| 83 | VR telemetry is collected and thrown away | `48706cc` | R2-83 |
| 86 | TESTING.md | `dd3770e` | R2-86 |
| 88 | Autoplay scenario matrix | `2dbfd01` | R2-88 |
| 90 | Name the transport in NETLOG | `7d894a6` | R2-90 |
| 92 | Reduce-flashing setting | `35449b9` | R2-92 |
| 94 | UI scale for the HUD | `02b9749` | R2-94 |
| 97 | A first-run garage tour | `fb8ac7e` | R2-97 |
| 98 | Minimap shape-coding | `48c1f6c` | R2-98 |
| 99 | Screen-reader support for the menus | `92eb66e` | R2-99 |
| 100 | Dyslexia-friendly font toggle | `4e788ac` | R2-100 |

Plus the scaffolding commits: `6731000` (the round-2 list itself), `e72a3a6`
(R2-00 pass marker), `232e8ef` (the test suite for everything above it), and this
document.

## Partial (21) — safe part shipped, remainder named in the commit body

| # | Item | Commit | What shipped / what remains |
|---|------|--------|------------------------------|
| 12 | A personal replay screen in VR | `870f0ac` | Replay button + auto-play on the VR over page (jumbotron). Remains: a scrubbing cinema panel. |
| 16 | A VR tune page | `6c6cf47` | AI count, damage, night, song from the headset. Remains: physics tuning groups stay 2D (by design note). |
| 19 | Host moderation: kick, mute, block | `628fd45` | Kick + session blocklist. Remains: mute; cross-session bans. |
| 20 | Handover should transfer the match | `903f6e0` | Score table + round clock ride the handover (`ho` pack). Remains: full mid-match state (props/cars) transfer. |
| 23 | Exportable match replays | `629f84f` | Pose stream (last ~80 s, 2 Hz) inside every match record, exported with the play log. Remains: the in-game replay player. |
| 31 | Floating nameplates over remote cars | `1f5b3e3` | Plates for all cars (AI 40 m, humans 80 m, distance, host ★). Remains: occlusion/through-wall policy tuning live. |
| 32 | Guest-initiated host-struggle vote | `56764ac` | Guests' lag votes surface to the host at majority. Remains: no forced handover (informs only, deliberate). |
| 33 | Transport fallback when the PeerJS broker is down | `9159e5d` | Active transport + fallbacks named in logs. Remains: a third transport (none exists to fall back to). |
| 35 | AFK guests get auto-parked | `c12ec9c` | 60 s of neutral input auto-parks a guest. Remains: host-side AFK (host is never parked). |
| 39 | Expiring join codes | `8a74fb9` | Host can mint a fresh code mid-session. Remains: time-based expiry (rotation covers the leak case). |
| 41 | Best-host suggestion from connection history | `b1b7b11` | Hosting quality measured per device, published, used as election tiebreak. Remains: pre-join "best host" suggestion UI. |
| 46 | Seasons | `7e02e8c` | Monthly season cards (this vs last month) on the career screen. Remains: season challenges / bests snapshot (needs round-1 bests). |
| 47 | Scrap: a garage economy | `adb2577` | Currency accrues (wrecks + score) with a menu counter. Remains: the spend side — main has no cosmetics surface to spend on. |
| 50 | Family-yard weekly leaderboard | `79a7f1a` | Weekly best published in presence; host's screen shows the table. Remains: guests see only the host's line (star topology). |
| 59 | Ship the voice-clip pipeline | `8b5e750` | `tools/render-voices.mjs` produces the game's exact manifest (ids cross-checked by test). Remains: bulk line extraction + an actual TTS run (content job, no TTS in CI). |
| 67 | A living sky | `bf7a8f1` | Sun drifts across the yard over a long match. Remains: environment map is not re-baked as it moves. |
| 73 | Phase-aware music | `5e8c9f5` | Endgame phase raises tempo everywhere; density lines in rock. Remains: per-style density arrangements. |
| 85 | Git hash in play-log records | `72d20ae` | `BUILD_HASH` stamping point wired into records + headers. Remains: the release process must stamp it (one sed; documented in TESTING.md). |
| 87 | Capture physics blowups | `ca3ce5c` | Blowup run-up poses (from the jumbotron recorder) saved into `phys.blow`. Remains: wheel state not captured; recorder window is 4.5 s. |
| 93 | Visual sound cues | `21ccc95` | Crusher/bull/charge/horn icons on a compass strip. Remains: VR HUD twin. |
| 95 | One-thumb touch mode | `d331088` | Auto-throttle core: cruise at half throttle, any real input takes over. Remains: the one-thumb layout (pedal cluster hidden, bigger steer zone). |

## Spec-only (22) — documented, not implemented

| # | Item | Why spec-only / what's needed |
|---|------|-------------------------------|
| 10 | Passthrough mixed-reality mode | Needs a headset + XR passthrough API decisions (privacy surface, camera permissions) — a design + hardware item, not a static change. |
| 11 | VR spectate / director cam | Needs the VR session model extended to a non-driving role; pairs with #22. Design first. |
| 14 | File a bug report from inside VR | **Withheld — safety hold (see header).** The report-upload code section was flagged by a safety check during this round; implementing needs Jonas's explicit confirmation. |
| 15 | Hand-tracking driving | Needs hand-tracking hardware to develop against; no safe static part. |
| 21 | Public room discovery | A public lobby is a service + moderation commitment, not a client change; also changes the family-yard trust model (#24). Product decision for Jonas. |
| 22 | A spectator role | Needs a protocol role (no car slot, camera-only) across host/guest — a netcode change to make with two-device testing in the loop. |
| 27 | Team mode | A new game mode end-to-end (scoring, teams in snapshots, UI) — L-sized; round-1 review already steered away from new modes on spec. |
| 28 | Cross-device seat handoff | Needs session migration between two live devices; inseparable from #20's full state transfer. |
| 36 | Snapshot compression | The snapshot path works uncompressed at 20 Hz; compression is a protocol change that must be measured on real links before it earns its risk. R2-25's priority trim shipped instead. |
| 40 | Overflow sub-yards | Splits one match across hosts — a netcode architecture change, not an item. |
| 42 | In-match spectating for late joiners | Same protocol role as #22; the late-join path exists, the spectate-until-next-round state doesn't. |
| 48 | Medals on challenges | Depends on round-1's standing challenges/mastery, which are not on main. Lands naturally once those do; R2-45/57 challenges are the hook. |
| 51 | Unlockable cars | Flagged in the list itself as a design decision (gating cars changes the game's feel for kids). Needs Jonas's call; R2-47's scrap is the currency half if he says yes. |
| 54 | Best-score history | Depends on round-1's per-car bests (not on main). The career screen (R2-43) is where it will live. |
| 63 | New archetype: the motorcycle | A new vehicle is art + physics tuning + AI + cast wiring (an L content build), not a cherry-pickable patch. |
| 64 | New archetype: the tuk-tuk | Same as #63. |
| 66 | Weather: rain | Needs the full weather stack (sky, particles, grip model, audio) — an L feature; R2-67's living sky is its foundation. |
| 74 | New archetype: the snowplow | Same as #63. |
| 84 | Bug reports need a picture | **Withheld — safety hold (see header)**, same as #14. |
| 89 | The report drop is a public topic | **Withheld — safety hold (see header)**, same as #14. |
| 91 | Full per-action key remapping | The remap UI is a settings-surface build of its own (conflict detection, per-action storage); round-1's presets cover the common cases meanwhile. |
| 96 | Menu/HUD localisation | String extraction across the whole UI is a project, and a half-extracted language is worse than none. Swedish first when it happens; the cast already speaks five languages as the model. |

## Playtest list (what the suite cannot prove)

**Needs a VR headset (Quest):** jumbotron live in VR (#1) · HUD minimap/chevrons/
countdown (#2, #3) · hit-direction rim (#4) · over-page standings (#5) · family
button (#6) · governor stepping down *and up* without judder (#7, #8) · 120 Hz
actually engaged on Quest 3 (#9) · replay on the over page (#12) · low-hull
vignette (#13) · tune page (#16) · controller-lost toast (#17) · seat heights
feel right per car (#18) · a match record from a VR session carries the `vr`
block (#83).

**Needs two devices:** signed beacons reject a fake host (#24) · quick-chat
both ways (#26) · guest input gate under a flood (#29) · per-room car memory
(#38) · kick + block (#19) · handover keeps score/clock (#20) · nameplates +
distances (#31) · lag vote reaches the host (#32) · fallback naming when the
relay is down (#33) · AFK park (#35) · new room code (#39) · host-quality
tiebreak in a takeover (#41) · weekly table on the host (#50) · replay stream
present in a guest's record too (#23).

**Desktop / phone only:** career + history + season cards against a real play
log (#43, #49, #46) · rivalry/nemesis/bounty across matches (#44, #58, #62) ·
daily/weekly challenges tick over at midnight/Monday (#45, #57) · dynamic
events read clearly (#65) · sky drift over a long match (#67) · session scars
(#71) · crowd wave timing (#72) · duo lines don't talk over each other (#76) ·
seeded run reproduces a match's decisions (#80) · budget FAIL appears on a
deliberately slow device (#82) · blowup capture after a Sandflea blowup (#87) ·
autoplay presets (#88) · reduce-flashing kills the crusher strobe (#92) ·
visual cues bearings (#93) · HUD scale + readable font (#94, #100) · first-run
tour shows once (#97) · nemesis ring on the minimap (#98) · screen-reader pass
with VoiceOver/NVDA (#99) · one-thumb cruise feel (#95) · stats card image
(#52) · smoke test's first live pass (#78) · CI's first GitHub run (#79).
