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
