# BACKLOG.md: work that nobody has started yet

Any agent may pick an item. **Claim it in WORKBOARD.md first** (AGENTS.md explains how), then remove it from here when you push the claim. Items marked **(owner OK needed)** need a short `PROPOSAL-<topic>.md` and the owner's go-ahead before building. Add new findings, from play logs, bug reports or your own testing, at the bottom of the right section. Keep each item to one line, plus what "done" means.

Current state of the game: [RELEASES.md](RELEASES.md). Data to work from: the `play-logs` branch (LOGS.md).

## Bugs and stability (do these first)
- **Flaky test: `drive-a` Sandflea "touch-right" sometimes bumps the parked Viper** (seen on Build 88 main and once on the ai-stuck branch; passes on rerun): the Viper sits at x≈-46 in the Sandflea's reverse/turn path, so the Sandflea stops at back -4 to -8 m. **Done:** drive.js parks the other cars of a group well clear of each car under test, and drive-a passes 5 runs in a row.
- **[claude owns] Chromebook flagged Build 89 → 90 (20:39 report):** slow s/h 113.5 → 248.5 and stuck/h 51 → 89, while the worst frame halved (834 → 417 ms, the fix working). Per match the extra slow time is "game step (physics/AI)" (median ~8 s/match vs ~3 on 89), and stuck/h is driven by two matches (10 and 17 stuck). Build 90 only changed lights (fixed pool), so no physics mechanism is known; the same device swung from 168 to 572 slow s/h on Build 88 between two reports, so this may be noise. **Done:** a local A/B (perfbudget physics ms, Build 89 vs 90) shows no difference AND the next report with 30+ more Chromebook minutes on 90 is back in line with 89, or the cause is found and fixed.
- **New stuck hotspot at (-94, -144)** (south-west wall): 13× / 148 s in the 18:39 report, fire truck, tanker, Hellbender, Cruiser, mixer, touching wall + debris. **Done:** a lane for it in `tests/stuckspots.js` passes, and the next report shows it gone or below 5×.
- **Chromebook (Intel HD 620, 4 cores, 2560×1440) is barely playable:** the 1% low is 20 fps at the lowest quality and 50% render scale, with 177–400 slow seconds per hour. The physics/AI step is the slow part (1,685 s at quality 7), then draw calls (783 s). Done when this device's 1% low is ≥ 30 fps, e.g. cheaper physics at low quality (fewer substeps, sleeping props, fewer active bodies) and a lower internal resolution on very large screens.
- **Physics hotspot in the NE corner (x≈100–109, z≈87–90)**, plus a second spot at (122–130, 100). In one session it caused repeated "solver kick undone" catches: the Camper (×12 in 4 s), Big Bertha, Forklift, Outrider and Viper. A Sandflea hit 226 m/s and a bull 186 m/s. **Done:** a test that drives cars into that spot shows no catches, and physics catches per hour fall in the report.
- **Speed bumps at the yard centre never collide** (stale collision boxes, so wheels pass through). Fixing it naively gets tanks stuck. **Done:** tanks and light cars both feel the bumps, with a tracks test.
- **Multiplayer: a backgrounded or crawling host leaves guests stuck and "self-driving".** **Done:** the host hands over or pauses cleanly, tested with the mp1 suite.
- **The VR test is flaky under load** (fixed frame waits). **Done:** `tests/rc-vr-test.js` waits on conditions instead of frame counts, and passes 5 runs in a row.
- **Outrider trips the physics safety net more than any other car.** (Claimed by claude/ai-stuck; listed here in case that claim goes stale.)
- **Check the Tiger's wreck credit.** In the play logs the Tiger's damage per life is the second-highest of any car (215) but its K/D is 0.24: it hurts things without getting credited for the wreck. First re-check on build 68+ data (matchup tracking landed there); if the pattern persists, find where the credit goes. **Done:** a numbers-backed answer in the commit, and if credit is misassigned, a fix with a regression test.

## Performance
- **The lowest quality setting draws almost as much as the highest** (446 vs 524 draw calls in `tests/perfbudget.js`). Make low quality really cheap for old phones: fewer props drawn, no shadows, merged debris. **Done:** low quality is at least 30% fewer draw calls, and the perf baseline is updated with the reason.
- **Performance on real phones:** use the play-log "Release to release" table per device. Any device below 50 fps for its 1% low is a target.
- **The near-second hitches.** Slow time on the Mac is 62% "waiting on the graphics chip", and the worst single frames run 750–983 ms. Using the slow-incident breakdown (cause × quality level × match phase), find what those frames are — fire and particle load is the first suspect — and cut the worst offender. **Done:** the worst-frame cause named with log data, and slow seconds per hour down in the report after the fix.

## Breathing room and clarity (see TASTE.md)
- **Arena and screen clarity pass:** check screenshots at phone and laptop sizes, and cut visual clutter. Small junk, particle overload, popups and HUD noise are candidates. **Done:** before/after screenshots in the commit, open-space ≥ 75% (QUALITY-GATES 3b), perf the same or better.

## Voices and commentary
- **Voice variety:** use the "Voice variety" section of the play-log report (lines heard, repeats, most-repeated lines) to add lines where repeats are worst. Consider session-wide no-repeat memory (`barks.sessHeard`). (Claude's voice round 5 covers the first pass: [docs/voices/round5-brief.md](docs/voices/round5-brief.md).)

## Gameplay (after the per-car AI lands)
- **Balance pass:** use K/D per car and the who-wrecks-whom matchups (QUALITY-GATES §4). Every car should have prey and a counter, with K/D roughly 0.5–2.5. Changes need before and after numbers.
- **Balance ideas held back from Muse's list** (REVIEW-improvements-100.md): nitro earned from damage, rubber-banding, an extra gun car at top difficulty. Try them only with numbers.

## Fun: gags on systems that already exist
One common trigger each, no new props, no new choices — each should pass TASTE.md's quick test.
- **The Magnet Gets Bored:** a crane left idle too long picks up the lightest thing it can find — a potty, a bin, occasionally the Sandflea — purely to hold it up and look at it, and drops the treasure when a real car wanders close. **Done:** an idle timer triggers the lift, a car approaching ends it, and the crane's real jobs always win.
- **Even the Magnet Has Limits:** once in a while the bored crane tries Bertha: sparks, a groaning cable, four centimetres of lift — and she is set back down like a sleeping baby. **Done:** the attempt, the 4 cm and the gentle set-down all read clearly; Bertha takes no damage.
- **The Brief Crown:** the match winner starts the next match with a tiny gold crown on the roof; it falls off at the first hit and everyone immediately drives over it. **Done:** the crown transfers on a win, drops on first contact, and never affects physics.

## New content (owner OK needed)
- (Approved and claimed: the Spider-Walker and the Steam Elephant, see docs/PROPOSAL-walkers.md and WORKBOARD.md.)
- **New vehicles that bring a new verb** (walk, stomp, grab, web, lift, freeze). The ranked ideas are in [docs/ideas/new-vehicles-100.md](docs/ideas/new-vehicles-100.md); the owner will pick from the top 10. One at a time, each with its model, physics, weapon, AI, visible weak spot, ~95 recorded lines and tests.
