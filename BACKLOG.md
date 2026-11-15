# BACKLOG.md: work that nobody has started yet

Any agent may pick an item. **Claim it in WORKBOARD.md first** (AGENTS.md explains how), then remove it from here when you push the claim. Items marked **(owner OK needed)** need a short `PROPOSAL-<topic>.md` and the owner's go-ahead before building. Add new findings, from play logs, bug reports or your own testing, at the bottom of the right section. Keep each item to one line, plus what "done" means.

Current state of the game: [RELEASES.md](RELEASES.md). Data to work from: the `play-logs` branch (LOGS.md).

## Bugs and stability (do these first)
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
- **Rubber Duck:** hose a bull once and it gives up: it sits down in the puddle, defeated, while a rubber duck floats past. **Done:** a single hosing triggers it, the bull stays sat until play moves on, and a test covers the trigger.
- **Smash Burger:** a burger that goes under the Bulldozer's blade or into the crusher comes out wide, flat and proud on a little paper tray. **Done:** both machines produce it, and it still counts as a burger everywhere burgers count.
- **Soggy Burger:** hose a burger and it goes limp and friction-free, sliding across the yard like a curling stone until it dries out. **Done:** one hosing starts the slide; it dries back to a normal burger on a timer.
- **Instant Ground Beef:** a bull that wanders into the Combine's spinning reel comes out the back as a burger — no fire required. **Done:** reel contact converts bull to burger, with the harvest counters agreeing.
- **The Cannibal:** a live bull that finds a burger sniffs it, eats it, and becomes MEGA BULL: ~20% bigger, faster, angrier, deeper moo. **Done:** eating triggers the transformation at most once per bull; the size and speed change is visible and tested.
- **Fernando:** one bull per match is Fernando (he's already family in Paco's lines): a little red cape and a name tag. Keep him alive all match and there's confetti; burger him and the crowd goes quiet for a beat. **Done:** Fernando is identifiable all match and both endings trigger. (His one heartbroken Paco line, if added, goes through the voices work on WORKBOARD, not this item.)
- **Honk Back:** honk at a bull and it answers with a moo pitched like a horn; honk again and it harmonises with you. **Done:** a honk within earshot gets the pitched-moo answer; sound only, no new lines.
- **Ring Toss:** a loose tyre that lands around a bull's horns stays there as a necklace for the rest of the match, and its charge gains a visible strut. **Done:** tyre-on-horns is detected and persists; the strut is animation only.
- **Bull in the Stands:** a bull launched by geyser, ball or crane that lands in the grandstand takes a seat; the crowd politely shuffles aside and it watches the rest of the match. **Done:** a bull landing in the stands stays seated and harmless until the match ends.
- **The Shake-Off:** a fully soaked bull shakes itself dry like a huge dog, spraying every car nearby with a 3-second grip penalty. **Done:** the shake triggers as a soaked bull dries; the spray and the grip dip are both visible and timed.
- **It Remembers:** when a burger's time expires and the fresh bull wanders back in, one time in ten it returns wearing a sesame-seed bun as a hat. It says nothing. It doesn't have to. **Done:** the hat appears at the stated rate and stays until that bull is cooked or the match ends.
- **The Magnet Gets Bored:** a crane left idle too long picks up the lightest thing it can find — a potty, a bin, occasionally the Sandflea — purely to hold it up and look at it, and drops the treasure when a real car wanders close. **Done:** an idle timer triggers the lift, a car approaching ends it, and the crane's real jobs always win.
- **Even the Magnet Has Limits:** once in a while the bored crane tries Bertha: sparks, a groaning cable, four centimetres of lift — and she is set back down like a sleeping baby. **Done:** the attempt, the 4 cm and the gentle set-down all read clearly; Bertha takes no damage.
- **Potty Cannon:** a porta-potty sitting on a geyser when it blows becomes the yard's least aerodynamic aircraft. **Done:** potty plus eruption equals one glorious flight and a normal landing, with no new props.
- **Crusher Confetti:** crush a cardboard pyramid inside the press and the crusher erupts confetti out of its top vent like a party popper. **Done:** a pyramid in the press is the trigger; the confetti is particles only, inside the perf budget.
- **The Golden Cone:** one cone per match is secretly gold underneath the orange. Knock it over: confetti and a fanfare. **Done:** exactly one gold cone per match, chosen at random; knocking it over is the only reveal.
- **Sad Trombone:** wrecked within ten seconds of the start earns one sad trombone; wrecked within five and the trombone gives up halfway through the note. **Done:** both timings trigger the right sting; sound only, no new lines.
- **Read the Bales:** occasionally a Combine bale comes out with a message printed on it: "HELP", "SEND NITRO", "I WAS A VIPER". **Done:** a small set of bale textures rotates in at a low rate; zero new systems.
- **Helicopter Sign:** knock a yard sign spinning fast enough and it lifts, helicoptering wildly for two seconds before clattering down somewhere stupid. **Done:** spin above a threshold gives brief lift; the sign always lands as a normal sign.
- **The Brief Crown:** the match winner starts the next match with a tiny gold crown on the roof; it falls off at the first hit and everyone immediately drives over it. **Done:** the crown transfers on a win, drops on first contact, and never affects physics.

## New content (owner OK needed)
- (Approved and claimed: the Spider-Walker and the Steam Elephant, see docs/PROPOSAL-walkers.md and WORKBOARD.md.)
- **New vehicles that bring a new verb** (walk, stomp, grab, web, lift, freeze). The ranked ideas are in [docs/ideas/new-vehicles-100.md](docs/ideas/new-vehicles-100.md); the owner will pick from the top 10. One at a time, each with its model, physics, weapon, AI, visible weak spot, ~95 recorded lines and tests.
