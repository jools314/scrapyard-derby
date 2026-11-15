# Review of Muse's improvements-100: verdicts and bugs found

Reviewed from `bob/improvements-100`. The split commits (eb8cc2b) produce a tree byte-identical to the single diff d2c967b.
Item numbers below are BEST-50 numbers, with the 100-list number in brackets.

The merge was stopped when Muse began landing its own items on main. What exists:
- a partial merge in `index68.html`, with its diff in `muse68.patch`;
- `muse.js` in the scratchpad root: 38 checks, 37 passed, 1 failed (see "Test status" below);
- the release gate (`release-check-muse.sh`) was never run.

Nothing was pushed or committed.

## Verdicts

| # | Item | Verdict | Notes / bugs in Muse's code |
|---|---|---|---|
| 1 | Respawn ending | take, simplified | Muse added two tune sliders (match minutes, wrecks to win), both off by default, so nothing changed for players. **Bug:** the timer and the wreck target are not gated on `AUTO.on`. A set value would call `SCORE.finish()` mid-autoplay, with state 'over' and the autoplay round broken. Merge used a fixed 5-minute clock with no option, skipped in autoplay. After a timed end, "Drive again (12)" auto-continues, but only if someone gave input in the last 90 s. |
| 2 | Best score | take | `saveBest` also saved autoplay's bot scores. Merge gated it on `!AUTO.on`. |
| 3 | Results screen | take, simplified | Muse shows 5 extra cells. Merge cut them to biggest hit, best air and your best, and dropped the accuracy counters. |
| 4 | Guided first match | take, simplified | **Bugs:** (a) it is armed in autoplay too: `game.tut` only checks solo; (b) `TUT.done` is set only after the special fires, so the hints repeat every match for a car with no special, or for a player who never presses F; (c) the wording is keyboard-only. Merge: armed only when `!AUTO.on`; marked done when the first match starts; touch wording; skips the special step for cars without one. |
| 5 | WebGL failure panel | take | Sound. |
| 6 | Wreck replay | take, fixed | **Bug:** the replay only advances while the jumbotron is rendered and in view. On the over screen the camera isn't looking at it, so "Watch the wreck" just waits 7 s and shows nothing. Merge points the camera at the screen during the replay, and hides the button on gfx 0 (no jumbotron render). |
| 7 | Crash cam on the wrecking hit | take, fixed | Fired on any damage to an already-wrecked hulk, because it checks `this.wrecked` after the hit. Merge requires a fresh wreck and adds no extra slow-mo in autoplay. |
| 8 | Slow-mo on own death | take | OK. |
| 9 | Countdown push-in | take, fixed | Allocated a `new THREE.Vector3` every frame. It also overrode the inside view and look-back. |
| 10 | Hit-direction arc | take, fixed | **Bug:** the conic gradient peaks 25° clockwise of the hit (`from -25deg`, peak at +50deg); it should be `from -50deg`. It also queried the DOM every HUD frame. Merge: cached element, flipped while looking back, hidden in autoplay and VR. My test of it failed (see Test status). |
| 11 | Low health | take | Uniform changes only, inside the existing grade pass, which is off on low quality: no new full-screen pass. |
| 12 | Nitro from damage | defer | Balance change. |
| 13 | Prop combos | take | OK. |
| 14 | Near-miss | take, fixed | Called `velocity.vsub()` (a Vec3 allocation) per car per check. Muse's version pays +25 through `addScore`, which only toasts at ≥40, so a near miss was invisible without the floatScore text; floatScore was kept for it. |
| 15 | Shield + shuffle | take, fixed | **MP bug:** pickups aren't networked and guests build their own pickups, so a random shuffle gives host and guests different yards. Merge shuffles in solo only. Shields replace one repair spot and one nitro spot. |
| 16 | Hazard telegraphs | take | The new announcer lines have no recorded clips, so they fall back to TTS. |
| 17 | Rubber-banding | defer | Balance change. |
| 18 | Field-size chips | drop | Owner. Also **bug:** the chips sat inside `.modes` without the `.mode` class, so they were unstyled. |
| 19 | Free drive | drop | Owner. Also **bug:** `FREE_DRIVE` survives into an idle-autoplay takeover, and its `onWreck` branch returns before PLAYLOG and the drag credit. |
| 20, 21, 23, 24, 26 | AI repair, finish the wounded, per-car AI, aim-leading, beached recovery | defer | Not merged. Notes for the AI agent are in `ai-ideas.md`. |
| 22 | AI honk before charge | take, fixed | Loudness was taken from the AI's distance to its target, not to the listener, so far-off charges honked at 0.2–0.8 anywhere in the yard. It also honked in the menu attract brawl. |
| 25 | Track damage warning | take | OK. |
| 27 | Extra gun car | defer | Balance change. |
| 28 | Assists | take, fixed | Muse paid an "assist" even when there was no killer. Merge requires a killer other than the player. |
| 29 | Scrape tier | take, fixed | Each scuff is a separate mesh (draw call, up to 30 per car), and grazes happen several times a second. Merge throttles them per car and skips them at quality level ≥ 4. |
| 30 | Gamepad | take, fixed | **Bugs:** (a) `gp._flip` is stored on the Gamepad snapshot, which Chrome recreates on every call, so holding X calls `flipUpright()` every frame; (b) `[...getGamepads()]` allocated an array every frame for everyone; (c) a gamepad player fires no input events, so IDLE starts autoplay after 3 minutes of play. Merge polls only after `gamepadconnected`, keeps edge state in `GP`, and calls `IDLE.poke()` on pad input. |
| 31 | Haptics | take, fixed | Not gated on autoplay: a phone running idle autoplay would buzz on the table. Merge uses one `buzz()` helper. |
| 32 | Look-back | take | OK; the keydown handler already ignores key repeat. |
| 33 | Tilt sliders | drop | Owner. |
| 34 | Battery cool mode | drop | Fights the governor: `governQuality` clears `PACE.autoCool` after about 30 s of easy frames, and the battery check only re-asserts it on battery events. `getBattery` also doesn't exist on iOS. |
| 35 | Auto-pause on hide | take, fixed | **Bug:** it paused autoplay and idle autoplay, because both run as `MP.role === 'solo'` in a playing state. Merge skips it when `AUTO.on` or in VR, and lets IDLE take over an auto-paused game. TABENV is untouched. |
| 36 | Bigger FIRE button | no change | Muse didn't resize it; it is already the largest control at 92 px. |
| 37 | Cooldown on FIRE | take, fixed | Did `querySelector` and style writes every HUD frame. Merge caches the element and writes only when the 5% step changes. |
| 38 | Button-pair steering | drop | Owner. Also **bug:** `body.touch #touch .tb` (44 px) outranks `#steerBtns .tb`, so the steering buttons render tiny on phones. |
| 39 | Shake slider | drop | Owner. |
| 40 | Camera per car | take | `localStorage` read wasn't in try/catch; merge wraps it. |
| 41 | Portrait menu | take | CSS only. Not yet checked against the phone2 overlap tests. |
| 42 | Impact-voice budget | take, fixed | Allocated with `filter` plus objects on every impact. Merge uses a fixed 10-slot ring. |
| 43 | Diesel | take, fixed | Set a second automation on bp/lp every frame on top of `setEngine`'s. Merge adds a `diesel` parameter to `setEngine`. |
| 44 | iOS subtitles-first | drop | We ship recorded clips. |
| 45 | Honk ping | take | Host relays it; a guest's double-honk only pings its own map. |
| 46 | Crowd noise | take, fixed | Its per-frame `setTargetAtTime` overrode `cheer()`'s ramps. Merge updates 4 times a second and never during a cheer. |
| 47 | Horn sting | take | OK. |
| 48 | Family PIN | drop | Owner. |
| 49 | Host-meltdown prompt | drop | Owner. |
| 50 | Late-join spectate | drop | Muse's version is only a "Watch a brawl" menu button, which is a new menu choice. The late-join flow wasn't built. |

**Already present (17, 43, 46, 52, 58, 71, 73, 74 in the 100-list):** no commits; confirmed no change.

**Partials (25, 42, 45, 53, 55, 80, 89, 90, 98):**
- covered above: 25 (aim-leading, deferred), 42 (portrait), 45 (diesel), 53 (meltdown, dropped), 55 (spectate, dropped);
- floatScore from 89 was kept for near-miss only. **Bug:** Muse's wreck float says "WRECK +100" when a wreck pays +1000.
- not taken (settings/menus): 80, 90, 98.

**Other items in Muse's 100-list** (57–100: rematch, paint, dusk, challenges, mastery, rival, themes, IJKL, colour-blind palette, reset-all and so on) are not in the best-50 and were not taken.
- **Bug, 95:** gating `window.__derby` behind `?debug` would break every test harness.
- 72 (JUMBO recorder preallocation) looks like a good performance idea to take separately.

## Test status
`muse.js` (scratchpad root, run on `agents/muse/index68.html` via `harness_muse.js`; output in `muse.out`): 37 of 38 checks passed.

Passed:
- first-match hint, shown once;
- gamepad drives, and holding X flips only once;
- look-back hold, tap cycles the camera, camera remembered per car;
- arc fades out;
- shield: 2 spots, 5 s, half damage;
- crusher warns before the slam and the announcer calls it;
- respawn clock ends the match, results screen shows, best score saved and shown after a reload, auto-continue;
- auto-pause in solo;
- autoplay: no hints, clock ignored, never paused, 2 matches logged, best scores untouched;
- no page errors.

Failed:
- "hit-direction arc shows, pointing right". The style was empty within 150 ms. I didn't investigate; it is probably HUD cadence under `__noRender` (a test-timing issue), but that is unconfirmed.

The release gate copy (`release-check-muse.sh`, plus `tools/mkgate.sh` for private test copies in `gate/`) was written but not run because the merge was stopped.
