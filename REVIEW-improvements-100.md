# Review of `bob/improvements-100`: what we're taking and why

Thanks for the pass. Numbers refer to `IMPROVEMENTS-BEST-50.md`. These verdicts are at the idea level. Each "take" still goes through code review and our full release test suite before it ships, so the final list may shrink a little.

The rule behind the verdicts is in [DESIGN-PRINCIPLES.md](DESIGN-PRINCIPLES.md): **keep the game simple and focused on the main play.** No new modes, menus, settings or choices.

## Taking: these make the core play better without asking the player anything
- **Feel:**
  - 7 crash cam on wrecking hits
  - 8 slow-mo on your own wreck
  - 6 wreck replay
  - 9 countdown push-in
  - 10 hit-direction indicator
  - 11 low-health state (no extra full-screen pass on low quality)
- **Scoring in the fight:**
  - 13 prop combos
  - 14 near-miss
  - 28 assists
  - 29 scrape tier
  - 2 best score, saved quietly
- **Fight content:** 15 shield pickup
- **Fair warnings:**
  - 16 crusher and crane telegraphs
  - 25 track-damage warning stage
  - 22 AI honks before a charge
- **Controls that just work:**
  - 30 gamepad
  - 31 haptics
  - 32 hold C to look back
  - 36 bigger FIRE button and 37 cooldown on its button
  - 40 camera mode remembered per car, silently
  - 41 portrait menu fix
- **Sound:**
  - 42 impact-voice budget
  - 43 diesel
  - 46 crowd tracks the fight
  - 47 horn sting
- **Multiplayer, invisible:**
  - 45 double-honk ping
  - 50 late-join spectate
- **Robustness:** 5 WebGL failure panel

## Taking, simplified
- **1 Respawn ending:** a sensible default end, with no new option to pick.
- **3 Results screen:** short, one tap and you're back in, no extra menus.
- **4 Guided first match:** a few self-dismissing hints on the very first match only, never in autoplay.

## Not taking: these add modes, menus or choices
- 18 field-size menu chips
- 19 free-drive mode
- 33 tilt-sensitivity sliders
- 38 alternative button-pair steering layout
- 39 camera-shake slider
- 48 family PIN
- 49 "hand over hosting?" prompt

## Not taking: we already cover these differently
- **44 iOS subtitles-first:** the game now ships recorded voice clips (ElevenLabs) that play on iOS.
- **34 battery 30 fps mode:** we have a thermal quality governor and a frame-pacing cap. We'll only take it if it works through that governor.
- **35 auto-pause on hide:** autoplay (the game playing itself to learn) runs and tracks hidden or throttled tabs. We'll only take it if it never pauses autoplay.

## Later: balance and AI, decided by data
- **12, 17, 27** (nitro from damage, rubber-banding, extra gun car) change balance. Balance changes wait for the play-log metrics (K/D per car and who-wrecks-whom per build).
- **20, 21, 23, 24, 26** (AI repair, finish the wounded, per-car AI, aim-leading, beached recovery) overlap a per-car AI rewrite that's in progress. We're using your approaches as input to it, not merging the code.

## What's most useful from you next
- Bugs, performance problems and core-fight polish.
- Ideas that make the existing cars, weapons, weak spots and arena more fun.
- Please skip new modes, menus and settings.

## Code review results (Claude, 2026-11-15), please read before landing any of these items
Every item was reviewed against the code; the full per-item table is in [docs/review-improvements-100-code.md](docs/review-improvements-100-code.md). Bugs found, which need fixing as each item lands on `main`:
- **Autoplay:** the respawn timer and wreck target could end an autoplay round mid-match. First-match hints, auto-pause on hide and haptics ran during autoplay, and best scores saved the bots' results. All of these must skip autoplay and idle autoplay.
- **Gamepad:**
  - Holding X flipped the car every frame (the "held" flag sits on a snapshot the browser rebuilds each call).
  - It allocated a new array every frame even with no gamepad.
  - Gamepad input didn't count as activity, so idle autoplay took over a gamepad player after 3 min.
- **Multiplayer:** pickups aren't networked, so the random shield/pickup shuffle gave host and guests different yards. Shuffle on the host and send it to guests.
- **Replay:** "Watch the wreck" showed nothing, because the replay only advances while the camera can see the big screen.
- **Hints:** they repeated every match for cars with no special, or for a player who never fires it.
- **Hit-direction arc:** it pointed about 25° off the actual hit.
- **Smaller:**
  - The crash cam re-fired on hits to already-wrecked cars.
  - The AI honk volume used the AI's distance to its target instead of to the listener.
  - Per-frame allocations in the countdown camera, the near-miss check and the impact-voice budget.
  - The crowd-noise and diesel changes overrode existing sound ramps every frame.
  - The wreck float text shows +100 when a wreck pays +1000.
  - Gating `window.__derby` behind `?debug` would break every test harness: don't.

Updated verdicts:
- **1 (respawn ending):** a fixed 5-minute clock with no option, skipped in autoplay.
- **3 (results screen):** biggest hit, best air and your best only.
- **4 (first-match hints):** only on the very first match.
- **Not taking 34:** it fights the quality governor, which turns cool mode off again after ~30 s.
- **Not taking 50:** only a menu button was built, not the late-join flow.
- **36 (bigger FIRE button):** no change needed; it's already the largest control.
- **Taking 35 (auto-pause on hide)** only with the fix: never pause autoplay.

The AI ideas (repair when hurt, finish the wounded, per-car AI, aim-leading, beached recovery) are summarised in [docs/ai-ideas-from-muse.md](docs/ai-ideas-from-muse.md) for the per-car AI work (claude/ai-stuck).
