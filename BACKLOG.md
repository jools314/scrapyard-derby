# BACKLOG.md: work that nobody has started yet

Any agent may pick an item. **Claim it in WORKBOARD.md first** (AGENTS.md explains how), then remove it from here when you push the claim. Items marked **(owner OK needed)** need a short `PROPOSAL-<topic>.md` and the owner's go-ahead before building. Add new findings, from play logs, bug reports or your own testing, at the bottom of the right section. Keep each item to one line, plus what "done" means.

Current state of the game: [RELEASES.md](RELEASES.md). Data to work from: the `play-logs` branch (LOGS.md).

## Bugs and stability (do these first)
- **Physics hotspot in the NE corner (x≈100–109, z≈87–90)**, plus a second spot at (122–130, 100). In one session it caused repeated "solver kick undone" catches: the Camper (×12 in 4 s), Big Bertha, Forklift, Outrider and Viper. A Sandflea hit 226 m/s and a bull 186 m/s. **Done:** a test that drives cars into that spot shows no catches, and physics catches per hour fall in the report.
- **Speed bumps at the yard centre never collide** (stale collision boxes, so wheels pass through). Fixing it naively gets tanks stuck. **Done:** tanks and light cars both feel the bumps, with a tracks test.
- **Multiplayer: a backgrounded or crawling host leaves guests stuck and "self-driving".** **Done:** the host hands over or pauses cleanly, tested with the mp1 suite.
- **The VR test is flaky under load** (fixed frame waits). **Done:** `tests/rc-vr-test.js` waits on conditions instead of frame counts, and passes 5 runs in a row.
- **Outrider trips the physics safety net more than any other car.** (Claimed by claude/ai-stuck; listed here in case that claim goes stale.)

## Performance
- **The lowest quality setting draws almost as much as the highest** (446 vs 524 draw calls in `tests/perfbudget.js`). Make low quality really cheap for old phones: fewer props drawn, no shadows, merged debris. **Done:** low quality is at least 30% fewer draw calls, and the perf baseline is updated with the reason.
- **Performance on real phones:** use the play-log "Release to release" table per device. Any device below 50 fps for its 1% low is a target.

## Breathing room and clarity (see TASTE.md)
- **Arena and screen clarity pass:** check screenshots at phone and laptop sizes, and cut visual clutter. Small junk, particle overload, popups and HUD noise are candidates. **Done:** before/after screenshots in the commit, open-space ≥ 75% (QUALITY-GATES 3b), perf the same or better.

## Voices and commentary
- **Voice variety:** use the "Voice variety" section of the play-log report (lines heard, repeats, most-repeated lines) to add lines where repeats are worst. Consider session-wide no-repeat memory (`barks.sessHeard`). (Claude's voice round 5 covers the first pass: [docs/voices/round5-brief.md](docs/voices/round5-brief.md).)

## Gameplay (after the per-car AI lands)
- **Balance pass:** use K/D per car and the who-wrecks-whom matchups (QUALITY-GATES §4). Every car should have prey and a counter, with K/D roughly 0.5–2.5. Changes need before and after numbers.
- **Balance ideas held back from Muse's list** (REVIEW-improvements-100.md): nitro earned from damage, rubber-banding, an extra gun car at top difficulty. Try them only with numbers.

## New content (owner OK needed)
- **New vehicles that bring a new verb** (walk, stomp, grab, web, lift, freeze). The ranked ideas are in [docs/ideas/new-vehicles-100.md](docs/ideas/new-vehicles-100.md); the owner will pick from the top 10. One at a time, each with its model, physics, weapon, AI, visible weak spot, ~95 recorded lines and tests.
