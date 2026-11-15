# Scrapyard Derby — improvement pass changelog

Working copy of **Build 67** (`const BUILD = '67'` unchanged; the pass is marked in-file by
`const BOB_PASS = 'improvements-100';` right after the BUILD line). Pristine original untouched at
`~/workspace/derby-build67/index.html`. Nothing deployed. Changes are small, local and reversible;
search the file for the item's distinctive comment to find each one.

Status key: **done** = implemented · **partial** = implemented with the stated limit · **already** =
verified already present in Build 67, no change made · **skipped** = not implemented, reason given.

## Batch 1 — items 1–24 (+ 29, 30, 38, 40, 45, 49, 50, 66p, 69, 92, 93)

1. **Respawn gets an ending — done.** New Match settings `matchMinutes` (0–30, 0 = endless) and
   `wreckTarget` (0–25). In `simBody`, a live `game.matchT` counts down with 60/30/10-second toasts
   and calls the existing `SCORE.finish()` at zero; in `game.onWreck`, reaching the wreck target
   calls `SCORE.finish()` too. `startMatch` announces the goal. Solo/host only, off in Free drive.
2. **Persistent best score — done.** `loadBest/saveBest/bestFor/refreshBestLine` beside `spawnCars`,
   stored under `derby-best-v1` per mode+car. `game.endMatch` saves; menu shows `#menuBest`;
   game-over shows "Your best". Not saved for guests or Free drive.
3. **Real results screen — partial (accuracy added in batch 2).** New `#overStats` row: biggest hit
   (tracked in `Car.applyDamage` from impact Δv), props flattened (`game.propHits`), best air
   (tracked in `simBody`), your best. Wheelie best is tracked too (`game.bestWheelie`).
4. **Guided first match — done.** `game.tut` state machine armed in `startMatch` for solo,
   non-free-drive, first-time players (`derby-taught` flag): GO → "hit them nose-first" →
   damage dealt → "hold Shift for nitro" → nitro used → "press F" → special fired → done.
   Hooks in `simBody` countdown, `applyDamage`, `readPlayerInput`, `Car.updateSpecial`.
5. **WebGL failure panel — done, verified.** Renderer creation wrapped in try/catch; on failure the
   new `#glfail` overlay explains the problem and what to try, then rethrows. Verified by CDP load
   test in this sandbox (which cannot create a WebGL context): `#glfail` shows, menu renders, the
   only exception is the WebGL error itself.
6. **Wreck replay on demand — done.** `#btnReplay` on the game-over screen plays `startReplay()` at
   `ARENA.lastWreck` (now recorded in `onWreck`); your own wreck (respawn and elimination) starts a
   replay immediately; `game.replayBack` restores the over screen when the replay ends (7 s clock
   fallback, since replay time only advances while the jumbotron renders).
7. **Crash cam guaranteed on wreck hits — done.** End of `Car.applyDamage`: if the hit wrecked the
   car and either car is the player, the crash cam fires (7 s cooldown respected) with slow-mo.
8. **Slow-mo on your Elimination death — done.** `onWreck` elimination branch: replay +
   `game.slowmo = 1.5` and `overTimer = 1.7` so the moment lands before the over screen.
9. **Countdown camera push-in — done.** `updateCamera`: during `game.countdown`, a lerped push-in
   on the player's car (distance shrinks 30%, height drops), then the normal chase takes over.
10. **Hit-direction indicator — done.** `#hitDir` conic-gradient arc (masked to a ring) centred on
    screen; `Car.onCollide` records direction/strength for player hits (Δv > 4); `updateHUD` rotates
    and fades it over 0.6 s.
11. **Low-health state — done.** In the grade pass (`drawBody` tail): below 30% hull the grade
    pass desaturates toward 0.51 and the vignette pulses; in `sfx.update`, the player engine is
    detuned ×0.88 with a rough wobble under 30% hull. Both gated by the reduce-motion setting.
12. **Nitro for aggression — done.** `applyDamage`: the player gains `dmg × 0.002` nitro (capped
    at full) for damage dealt — +1% per 5 damage, as specified.
13. **Prop-smash combos — done.** New `propScore()` helper: points = (5 + mass × 0.5, capped)
    × combo multiplier (×2 at 3 chained within 2 s, ×3 at 5), toast shows the multiplier. Wired into
    `flattenProp`, `propCollide` and the shell-prop path in `explodeShell` (all previously flat +10).
14. **Near-miss bonus — done.** Throttled check in `simBody` (solo/host, not free drive): passing
    within ~2 m of a live car at > 15 m/s relative speed pays +25 "NEAR MISS" with a per-car 3 s
    cooldown and an occasional taunt bark.
15. **Shield pickup + shuffled spots — done.** Third kind `shield` (violet octahedron, own material):
    two of the ten spots per match, kinds Fisher-Yates shuffled in `buildPickups` so routes aren't
    memorised. Effect: `car.shieldT = 5` s of half damage (applied in `applyDamage`), shimmer
    sparks ticked in `simBody`, minimap dot, toast. (Interpretation: kinds rotate across the fixed
    spots rather than spots moving — same anti-memorisation goal, no new geometry.)
16. **Hazard telegraphs — done.** Crusher warn state lengthened 1.3 s → 2.0 s and the announcer
    calls `crusherWarn` naming the car underneath; crane entering 'lower' now also honks and the
    announcer calls `craneWarn` (toast already existed). New `ANN_LINES.crusherWarn/craneWarn`
    pools. Bulls already had a 'paw' telegraph state and the wrecking ball already whooshes —
    no change needed there.
17. **Hazard-kill credit — already.** `game.onWreck` already credits `car.lastAttacker` within
    6 s for any wreck, and `crushNow()` passes the attacker explicitly; hazard kills flow through
    the same path. No change.
18. **Rubber-banding — done.** In `Car.think`, respawn matches scale AI throttle by the wreck
    deficit/surplus vs the player, clamped 0.93–1.07 — gentle, as specified.
19. **Field-size chips on the menu — done.** `#fieldChips` (4/6/9/12) beside the mode toggle,
    wired through the existing `setValue('aiCount', …)` so the tune panel stays in sync.
20. **Free drive — done.** `#btnFree` menu button: forces Respawn, sets `FREE_DRIVE` — no
    countdown, no score (prop/near-miss/tutorial all check it), wrecks respawn in 2 s with a
    replay, no best-score saving. Cleared by `showMenu`.
21. **AI mend plan — done.** `think()`: repair detour thresholds are persona-weighted (coward 45 /
    default 35 / brawler 25); below 20% health the AI commits (`mode = 'mend'`, 400 m search
    radius) and exits at threshold + 10.
22. **Finisher bias — done.** `think()` target scoring: cars under 25% health get a 0.55 score
    multiplier (preferred target) for all styles except coward.
23. **Charge honks — done.** All three AI charge transitions in `think()` now honk via
    `sfx.at(...).honk(...)` with distance-scaled volume as the charge commits.
24. **Per-car plan layer — done.** `think()` clones the persona `PLAN_WEIGHTS` and scales them by
    the car's own mass: heavies (> 6000 kg) hunt/runup ×1.5/×1.4, flank/circle ×0.6; light cars
    (< 1400 kg) flank/circle/ambush up, runup down.
29. **Assists — done.** `applyDamage` keeps a per-car `dmgLog` (damager, amount, time). In
    `onWreck`, if the player was the second-biggest damager in the last 10 s (not the killer),
    +250 "ASSIST". (Only the player's score exists in solo/host scoring, so the assist pays when
    the player earned it.)
30. **Scrape tier — done.** `onCollide`: car-on-car contact with Δv 2.2–6 that deals no real
    damage now scuffs paint (`scuff()` already existed) and pays the player +1 (1 s throttle),
    plus feeds `game.impactRate` used by item 49.
34. **Tilt settings — partial (sliders added; `tiltRead` wiring in batch 2).** New Controls-group
    settings `tiltDead` (0–8°, def 2.5) and `tiltFull` (12–45°, def 25).
38. **Cooldown on the button — done.** The HUD `#gunFill`/`#gunState` bar already existed;
    `updateHUD` now also greys the touch FIRE button (`.cooling`, 55% opacity) while
    `specialCd`/`reload` runs down.
40. **Camera shake slider — done.** New `shakeAmt` setting (0–1, def 1) multiplies the shake in
    `updateCamera`; 0 = no shake. (Reduce-motion, item 92, also zeroes it.)
45. **Diesel knock for heavy metal — partial.** In `sfx.update`, heavy/skid cars retune the
    player engine's bandpass/lowpass (75 Hz / 320 Hz) toward a low diesel knock. It's a filter
    retune of the existing synth, not a new knock oscillator — distinguishable, cheap, reversible.
49. **Crowd bed tracks the fight — done.** `game.impactRate` accumulates from solid hits
    (`onCollide`, Δv > 8) and decays in `simBody`; `sfx.update` drives the existing crowd loop's
    gain from it (0.02 floor → +0.09 at a pileup).
50. **Countdown sting — done.** Countdown beats are now the player's own horn, rising in
    duration per beat; GO adds a longer honk after the existing cheer. (`sfx.clank` no longer
    used for the countdown.)
66. **Themed derbies — partial (UI done; roster filter in batch 3).** `#themeSel` menu select
    (Any cars / Heavy metal / Buggies only) persisted as `derby-theme` in `DERBY_THEME`.
69. **Pickup theatre — done.** The repair pickup gains a rotating pedestal disc (it already
    spins with the pickup group) so the repair spot reads across the yard.
92. **Reduce motion — done.** New `reduceMotion` setting: zeroes camera shake, disables
    hit-stop/slow-mo in the `simBody` time-scale, and disables the low-health grade pulse.
93. **Subtitle size — done.** New `subSize` setting toggles `body.subs-lg` (`.sub` at 1.4 em),
    applied at boot and from `applySetting`.

Already present in Build 67 (verified during mapping, no change): **17** (above), **43** music
ducking under barks, **46** announcer lines already route through the subtitle `show()`,
**52** host QR code (`#mpQR` + `drawQR`), **58** rejoin slot (`MP.dropStale`/`MP.lateJoin`),
**71** SAP broadphase + static grid, **73** minimap base canvas blit throttled to 30 ms.

Verification after batch 1: module extracted and `node --check` clean; CDP load test (local CDN
mirror, sandbox has no WebGL): menu renders, `#glfail` fallback shows, zero unexpected errors.

## Batch 2 — items 25–42 (+ rest of 3, 34, 66; 28)

3. **Accuracy — done (completes item 3).** `game.shots`/`game.hits` counted for the player in
   `fireBullet`, `shotgunBlast`, `fireRocket` (shots) and `roundHit`/`explodeShell` direct hits
   (hits); shown as a fifth results cell, `#rAcc`. Reset per match in `resetMatch`.
25. **Aim-leading — partial.** `lobConcrete` already led its target and rockets already home on
    `rkTarget`; added: the minigun gunner in `fireBullet` now leads the target by its velocity
    (flight-time estimate, capped) instead of aiming at its current position. The harpoon is a
    grapple, not a projectile — left as is.
26. **Track tell — done.** `hurtTrack`: at 55% track health a one-time spark burst + smoke puff
    at the track (both player and AI), ahead of the existing <45 warning toast and the snap.
27. **Beached-AI recovery — done.** New `aiBeachCheck(dt)` beside `unwedge` in `simBody`: an AI
    car with ~no speed and ~no velocity for 4 s (not wrecked, not remote) is flipped upright.
28. **Difficulty seeds gun cars — done.** `aiRespawnType`: at `aiSkill` ≥ 0.9, if no gun car
    (tiger/hellbender/cruiser) is in the field, those types are weighted ×6 on respawn picks.
31. **Gamepad — done.** Polled in `readPlayerInput` (standard mapping, first connected pad):
    left stick steers (0.12 dead zone), triggers throttle/brake, A nitro, B handbrake, X flip,
    Y fires the special. Wrapped in try/catch so a pad quirk can never break keyboard input.
32. **Haptics — done.** Player car impacts buzz `navigator.vibrate` scaled by Δv (capped
    120 ms, only while the tab is visible); your own wreck buzzes the full 120 ms.
33. **Look-back — done.** Holding C flips the chase camera 180° (position and look target);
    a tap of C (< 250 ms) still cycles camera modes, preserving the old behaviour.
34. **Tilt settings wired — done (completes item 34).** `tiltRead` now reads `S.tiltDead` /
    `S.tiltFull` instead of the hard-coded 2.5° / ~25°.
35. **Battery-aware cool mode — done.** After the `PACE` definition: `navigator.getBattery()`
    engages `PACE.autoCool` below 20% battery, or below 35% while not charging.
36. **Auto-pause on tab hide — done.** The `visibilitychange` handler now also pauses solo
    matches (`game.autoPaused`), with a "P to resume" toast on return; multiplayer untouched.
37. **FIRE button cooldown sweep — done (completes item 37).** The touch FIRE button was
    already the largest control (92 px); `updateHUD` now drives a conic-gradient sweep
    (`--cd`) showing the fraction of cooldown remaining, on top of batch 1's grey-out.
39. **Button steering option — done.** `S.touchLayout` (Controls group): 1 swaps the stick
    for a left/right button pair (`#steerBtns`, wired into the same `touch.steer` funnel);
    `applyTouchLayout()` applies it from the settings panel and at boot.
41. **Camera per car — done.** `nextCam` persists the mode per car type (`derby-cam-<type>`);
    `selectCar` restores it.
42. **Portrait menu — partial.** Portrait phones (≤ 700 px): the menu card scrolls within
    92 dvh and the actions row (Start) sticks to the bottom of the card. The full reflow
    (car strip along the bottom) needs the menu's flex layout reworked — left for Jonas.
66. **Themed derbies — done (completes item 66).** `spawnCars` filters the opening field
    (heavy: the seven heavy types; buggies: a field of Sandfleas with rotated personas) and
    `aiRespawnType` weights respawn picks the same way. If you pick the Sandflea yourself,
    "Buggies only" falls back to a normal field (the roster has one buggy).
94. **IJKL key preset — done.** `S.keyMap` (Controls group): IJKL drives, E fires the
    special, O/U pitch; the I/J/K/L/U single-key actions (perf dialog, jump, respawn sheet,
    scoreboard, voices) are suppressed in that mode so driving doesn't trigger them.

Verification after batch 2: `node --check` clean; CDP load test unchanged (menu renders,
`#glfail` shows, only the expected WebGL exception).

## Batch 3 — items 44–60 (multiplayer & audio/voices)

44. **Impact-voice budget — done.** `sfx.noiseHit`: a 60 ms window keeps at most 10 impact
    voices; when full, a new hit must be louder than the quietest kept or it is dropped.
47. **iOS subtitles-first default — done.** If no `derby-voices` choice is stored and the UA
    is iPhone/iPad/iPod, `VOICES_OFF` starts true (subtitles still show); any explicit
    player choice wins thereafter.
48. **Horn as a signal — done.** A double-honk (two presses < 0.6 s apart) sets a minimap
    ping: an expanding gold ring on the map for 2 s. Hosts broadcast it (`MP.event {k:'ping'}`);
    guests render pings from the host. Every player honk also records `game.lastHonk`
    (used by item 70). Limit: a guest's own double-honk pings their own map but is not
    relayed (guests don't originate room events in this netcode).
51. **Family PIN — done.** Optional 4-digit PIN (`derby-fampin`) folded into the room code
    via `famKey()`; all `famCode(famName())` call sites now use it, so same name + different
    PIN = a different yard. PIN row added to the family-name panel; changing it rejoins the
    yard like a name change does.
53. **Host-meltdown handover prompt — partial.** `simBody`: a host under 25 fps for 30 s
    straight gets a toast pointing at the Net log's existing handover plus a NETLOG incident.
    It prompts; it does not auto-offer to guests (changing host mid-match from a client-side
    timer is the risky half — left to the humans, as the item's "prompt" option allows).
54. **Guest-side prediction — skipped.** Reconciling locally-simulated guest physics against
    host snapshots is a netcode rewrite (the guest currently never steps its own car);
    unverifiable without a live two-client session, and a bad version feels worse than the
    smoothing it replaces.
55. **Spectate cam — partial.** New `SPECTATE` + a "👁 Watch a brawl" menu button: the
    camera follows a random AI car through the menu attract brawl (the `camTarget()` hook
    the autoplay cam already used). `startMatch` clears it. The full late-join variant
    (a waiting guest auto-spectating until their car arrives) needs the guest join flow
    exercised live — not verifiable headless.
56. **Lobby connection marks — done.** `renderFam` appends ⚠ to family-yard names whose
    published perf score `ps` is under 200 — the same data NETLOG flags in-match, now in
    the lobby list.
57. **Rematch — done (completes batch 1's button).** Guests now handle the host's
    `{k:'rm'}` event: `resetMatch()` + back into the playing state with a "REMATCH!" toast;
    roster/snapshots re-sync the field from the host.
59. **Family field cap + backfill — done.** The family panel text now states the cap
    (11 guests, 12 cars max — it was already the physics cap); in family rooms `spawnCars`
    backfills AI to a fixed total field (you + `aiCount`) instead of adding `aiCount` AI
    on top of however many humans showed up.
60. **Per-player paint — done.** A "Your paint" colour picker in the garage
    (`derby-mycolor`): recolours your car in the showroom immediately, is used at spawn and
    on respawn, and is published in presence (`col`) so the host spawns remote cars in
    their chosen colour and keeps it across their respawns. "Car's own colour" resets it.

Verification after batch 3: `node --check` clean; CDP load test unchanged.

## Batch 4 — items 61–84 (content & engineering)

61. **Second arena — skipped.** `buildArena`'s statics are world-space absolute and the
    merged geometry, feature constants (crusher/crane/bull pens) and spawn logic all assume
    this yard; an alternate layout cannot be validated without playing it, and a broken
    arena is worse than a familiar one.
62. **Layout rotation — skipped.** Rotating spawn points 180° is only safe if the yard is
    symmetric; it isn't (mesa, crusher and crane sit asymmetrically), so rotated spawns
    could land inside statics. The item-15 pickup shuffle already rotates the fight's
    geography safely. (Jonas could still do this properly with a symmetric variant of the
    yard — that's design work, not a blind edit.)
63. **Dusk — done.** `S.night` now runs 0 day / 1 floodlit night / 2 dusk in `applyNight`:
    third constant set (sun 0xff9a4a at 1.6, sky 0x3a4a7a → 0xd88a4a → 0xf2b27a, fog
    0xc98a5e, hemi 0.5, exposure 1.1, no floodlight spots). Setting note updated.
64. **Standing challenges — done.** Seven challenges (`CHAL_DEFS`) persisted in
    `derby-challenges`, shown as a ☆/★ card under the menu's best-score line, completed
    via `chalDone()` with a toast: first wreck, forklift-toss wreck (toss marked in
    `liftRelease`, wreck checked in `onWreck`), 2 s Sandflea air (simBody), 25 props and
    10 wrecks in a match and an Elimination win (all in `endMatch`), wreck your rival.
65. **Mastery stars — done.** Lifetime matches/wrecks per car in `derby-mastery` (updated
    in `endMatch`); the garage shows ★☆☆–★★★ per car (1/5/15 lifetime wrecks).
66. — completed in batch 3 (see above).
67. **A named rival — done.** Picked per match in `spawnCars`: marked ⚔ RIVAL in the
    opponent list and with a gold ring on the minimap, announced by toast at match start;
    the rival's target scoring prefers the player (×0.5); wrecking them pays +250
    ("RIVAL DOWN") with an announcer line (`ANN_LINES.rivalDown`) and completes the rival
    challenge.
68. **Seasonal dressing — skipped.** A palette-only reskin would read as a fog change, not
    a season; doing it properly means reworking the procedural textures and prop materials
    across `buildArena`, which can't be judged without seeing it rendered. Item 63's dusk
    covers the "another mood" value safely.
69. — done in batch 1.
70. **Baitable bulls — done.** In `updateBulls`' victim choice, a honk within 40 m in the
    last 3 s (`game.lastHonk`, recorded by item 48) makes the bull charge the honker —
    honk near an opponent, dodge, collect the toss.
71. — already present (batch 1 notes).
72. **JUMBO recorder preallocation — done.** `snapCar` now writes into a preallocated
    per-frame `Float32Array` pool (fixed stride: body + up to 8 wheels; `poseCar`'s own
    length guard skips the rest). Frames, car lists and pose views are recycled through
    `JUMBO.pool`; the record tick allocates nothing.
73. — already present (batch 1 notes).
74. **HUD write caching — already.** Audit found the caching pattern already applied where
    it matters: `hudTxt`/`hudWidth` cache HUD fields, `drawGauge` skips unchanged needles
    via `GAUGE.key`, the scoreboard uses `BOARD.last`, and the perf text renders on a
    500 ms cadence. No change.
75. **Intervals folded into the frame loop — done.** The barks doctor (1 s), `roastTick`
    (500 ms) and `VCLIP.tick` (2 s) `setInterval`s are removed; `frameBody` drives all
    three on frame-time checks, so hidden tabs (no rAF) do literally nothing.
76. **Lazy SELF_HTML — done.** The >1 MB DOM serialisation now happens on first use
    (`selfHtml()`, called only by `openOwnTab` for the iPhone-tilt path).
77. **Adaptive physics substeps — done.** The `world.step` catch-up cap now follows the
    measured physics cost (`SEC.t.physics / SEC.n`): averaging over 9 ms sheds 3 catch-up
    steps (floor 2) before graphics quality drops.
78. **Blowups in PERFREP — done.** `PERFREP.summary()` gains `blowups: PHYS.blowups` and
    the live perf text prints the session count. (The full text report already listed them.)
79. **COMBAT table — done.** `COMBAT` sits next to `TUNE`; `SHELL_SPEED`, `BURST`,
    `BURST_GAP`, `RELOAD`, `RESPAWN_AI`, `RESPAWN_HUMAN` and the stop-stick's
    `car.stripCd = 8` now read from it.
80. **Smoke-test hook — partial (in batch 5).** A `?smoke` self-check on the existing
    `__derby` debug surface; no CI exists in this repo to wire it into.
81. **Deferred voice list — done.** `barks.init` no longer calls `getVoices()` at boot;
    the list loads on first `unlock()`/`speak()` (both already fetched it on demand) and
    `onvoiceschanged` still refreshes it.
82. **Module preload — done.** `<link rel="modulepreload">` for the two pinned CDN modules
    (three, cannon-es) ahead of the import map.
83. **Garage rebuild debounce — done.** The one per-tick rebuild path (`enginePower` in
    `applySetting`) now goes through `buildGarageSoon()` (one rebuild per animation frame).
84. **Ambient caps at lite tiers — done.** At `QUALITY.level` ≥ 5 (the lite steps),
    celebration fireworks halve and the yard spawns 3 tumbleweeds instead of 6.

Verification after batch 4: `node --check` clean; CDP load test unchanged.

## Batch 5 — items 85–100 (UI, accessibility, robustness)

85. **Garage stat bars — done.** The picker's bars are now Speed / Armour / Grip (the
    Weight bar became Armour, from `CAR_TYPES.armor`) plus the mastery stars from item 65 —
    the pick is informed by the same numbers the physics uses.
86. **Physics presets — done.** `PHYSICS_PRESETS` beside `GRAVITY_PRESETS`, rendered as a
    second preset row in the World group: Ice rink (tireGrip 0.55, restitution 0.5),
    Moon derby (gravity 1.62, damage 0.8, jumpStrength 1.4), Tank world (damage 0.5,
    mass scales 1.6).
87. **Restart-required, said out loud — done.** The panel rows were already badged
    ("Applies when you restart the match"); `setValue` now also toasts (throttled) when a
    restart-required setting changes mid-match, pointing at the panel's Restart button.
88. **Toast queue polish — done.** Toasts already appended (cap 4) rather than overwriting;
    now score toasts (`+…`) render as smaller chips (`.toast.chip`) and `bad`/`cool`
    toasts live 2.6 s instead of 1.7 s, so a score can't erase a warning.
89. **Floating score text — partial.** New `floatScore()` projects a world position to the
    screen and floats the text off the hit. Wired for the moments that matter: your wrecks
    ("WRECK +100"), rival downs (+250) and near misses (+25). Per-hit damage numbers are
    deliberately not floated — at derby hit rates they'd be confetti, not information.
90. **Stats collapse on small screens — partial.** Landscape ≤ 900 px: `.stats` collapses
    to a 58 px slim bar (hull + score stay visible) and expands on hover/press. It's
    CSS-only (no tap-state), so it re-collapses when the press ends.
91. **Colour-blind damage language — done.** New `cbPalette` setting (Controls group):
    `dmgColor` switches to blue/amber/white, and the damage diagram's zones gain F/L/R/T/B
    letters (`body.cbp` reveals the SVG text). Applied at boot and from the panel.
95. **`__derby` gated — done.** The internals object is only exposed with `?debug` in the
    URL or `localStorage derby-debug = 1` (`DERBY_DEBUG`); all four assignment sites are
    guarded, and nothing inside the game reads `window.__derby`.
96. **Frame-error dead stop — done.** `frame()` counts consecutive errors; a successful
    frame resets the streak. At 30 in a row the loop stops (`frameDead`) and the existing
    bug-report dialog opens with FLIGHT/ERRS attached.
97. **Update banner deferred — done.** `UPDATE.show()` defers while a non-solo room is
    mid-match; `showOver()` and `showMenu()` re-call it, so the banner lands when the
    match ends instead of waving a reload at a busy host.
98. **Storage reset — partial.** All game keys already live under `derby-*` /
    `scrapyard-derby*` names; a "Reset all saved data" button in the tune panel (with a
    confirm) wipes exactly those keys and reloads. The full fold into one versioned store
    with migrations was not done blind — every existing key is load-bearing for someone's
    saved state, and a botched migration loses all of it at once.
99. **Per-group defaults — done.** Every settings group header gains a "Defaults" button
    resetting just that group's keys (the all-groups `btnDefaults` already existed).
100. **Netcode contract documented — done.** A 15-line architecture note at the top of the
     module: host ticks, guests smooth, snapshot size cap and event semantics, presence
     fields (nick/want/did/jt/col/ps), handover ranking, and the host-clock rule.

Verification after batch 5 (final): module extracted, `node --check` clean; CDP load test
(local CDN mirror) — menu renders, `#glfail` fallback shows in this WebGL-less sandbox,
the only exception is the expected WebGL context error at renderer creation. Pristine
Build 67 untouched (MD5 d0e734e70735340a5a8a8afd91f9b115). File size 1,059,621 →
1,105,767 bytes (+4.4%).

## Tally

- **Implemented: 79** — 1–16, 18–24, 26–41, 44, 47–51, 56, 57, 59, 60, 63–67, 69, 70,
  72, 75–79, 81–88, 91–94, 96, 97, 99, 100.
- **Partial: 9** — 25 (minigun lead added; lob/rockets already led/homed), 42 (portrait
  menu: scroll + sticky Start, no full reflow), 45 (diesel knock as filter retune),
  53 (handover prompt, no auto-offer), 55 (menu spectate cam, not the late-join flow),
  80 (`?smoke` hook, no CI to wire into), 89 (floats on wrecks/rival/near-miss only),
  90 (CSS-only collapse), 98 (reset-all button, no storage migration).
- **Already present in Build 67: 8** — 17, 43, 46, 52, 58, 71, 73, 74.
- **Skipped: 4** — 54 (guest prediction: netcode rewrite, unverifiable headless),
  61 (second arena: unvalidatable blind), 62 (layout rotation unsafe against the
  asymmetric yard), 68 (seasonal reskin needs visual judgement).

## Playtest first (gameplay could not be exercised headlessly)

1. A first-ever solo match: the tutorial prompts (item 4) should walk GO → nose-first →
   nitro → special, once only.
2. A Respawn match with Match length 1 min and Wrecks-to-win 2: both endings (1) and the
   results breakdown incl. accuracy (3).
3. Your own Elimination death: slow-mo + replay before the over screen (6, 8).
4. The shield pickup: violet gem, half damage, shimmer (15); the crusher's longer warn
   and the announcer's hazard calls (16).
5. Gamepad (31) and hold-C look-back (33) — neither can be felt from a keyboard-only
   test; check the IJKL preset (94) too if you use it.
6. Family yard: PIN set on two devices (51), paint choice showing on the other screen
   (60), rematch from the over screen (57).
7. Dusk (63) — it's a constants-only mood; if the sun angle looks wrong, that's the
   one-line follow-up (sun position) I deliberately didn't guess at.
