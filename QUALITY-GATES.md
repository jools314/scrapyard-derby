# QUALITY-GATES.md: what every push to `main` must meet

This file is the standard. Update it when we learn something, for example a new metric to protect or a new test, in its own commit with the reason.

## 1. Tests (before you push)
| your change touches | run | must end with |
|---|---|---|
| docs only (`*.md`) | nothing | |
| anything in `index.html` | `bash tests/run.sh quick` | `ALL PASSED (quick)` |
| multiplayer, voices, play log or uploads, autoplay, VR, bug report, update check | `bash tests/run.sh release` | `ALL PASSED (release)`, except `rc-vr-test`: it's flaky on a busy machine, so re-run it alone, and it must pass on its own |
| `tests/` | the tests you changed, plus the quick suite | |

Also:
- **A new or changed test for every change.** Bug fixes get a regression test that fails without the fix. New behaviour gets a test that asserts it with real numbers, not just "no errors".
- **No new page errors** (console errors or exceptions) in any test.
- **Rebase and re-test:** if `main` moved under you and touched `index.html`, re-run the quick suite after rebasing.

The quick suite covers:
- syntax;
- every car driving with keys and touch (straight, both turns, reverse, handbrake, firing its weapon);
- tracked vehicles on slopes;
- the 16 weapon × object interactions;
- two-thumb touch controls, and zoom blocked;
- phone layout with no overlapping buttons, portrait and landscape;
- matchup logging, and idle autoplay.

The release suite adds:
- multiplayer: respawn, host migration, rejoin, family yard, twins;
- the bug-report copy, and tab hidden/throttled detection plus auto-update;
- the play log, uploads and a live upload;
- autoplay running and logging matches;
- voices: running out of lines, a long session, and recorded clips;
- VR, emulated headset and non-VR.

## 2. Performance budgets (don't make it slower)
- **Frame rate:** keep a steady 60 fps on a MacBook (foreground) and a recent iPhone. On the Mac, the 1% low must not drop below **50 fps**.
- **No per-frame allocations** in hot paths: no new objects or arrays per car per frame.
- **No new full-screen render passes on low quality.**
- **Draw calls:** new visual detail must be LOD-gated or batched (`InstancedMesh`, merged geometry). Check `renderer.info.render.calls` before and after: a typical match on high quality shouldn't grow by more than ~10%.
- **Size:** `index.html` should grow only as much as the feature needs (no bundled libraries; three.js and cannon-es come from the CDN).

## 3. Metrics we must not regress (checked after every push, from the play logs)
After your build has been played (autoplay produces ~20 matches an hour), compare it with the previous build in the release-to-release table of `play-logs/report-latest.md` (same device). For each metric below, a regression means **fix forward or revert**.

Here "1% low fps" is the frame rate of the slowest 1% of frames, which is what stutter feels like.

| metric | regression if |
|---|---|
| 1% low fps (per device) | drops more than 5 fps |
| median fps | drops more than 3 fps |
| slow seconds per hour | rises more than 50% |
| stuck events per hour | rises more than 25% (new hotspots appear in "Changes since the previous report") |
| physics safety-net catches per hour | rises more than 25%, or any single vehicle doubles |
| errors and incidents | any new error message |
| voice failures | any rise on a device that had none |
| autoplay | matches stop ending with "autoplay round done", or uploads stop |

Small samples are noisy. Wait for at least ~30 game-minutes of the new build before calling a regression, unless it's an error or crash.

## 4. Balance targets (for balance changes)
- Each car's **K/D** (wrecks dealt ÷ times wrecked, over all real matches) should sit roughly between **0.5 and 2.5**. Heavies may sit high, but nobody should be helpless.
- Every car has **one strength, one visible weak spot, at least one counter car that beats it and prey that it beats**: see the matchup table ("who wrecks whom") and the car roles below.
- A balance change states the numbers it expects to move, and is checked against the next reports.

## 5. Content and feel
- **Kid-friendly:** old-fashioned cussing and foreign cusses (damn, blast, Scheiße, merde) are OK. No F-bombs, slurs or sexual content, and nothing mean about real groups of people.
- **Original characters only:** no imitation of real people's voices or identities.
- **Simple:** no new modes, menus, settings or choices (DESIGN-PRINCIPLES.md).
- **Phones first:** every touch control must be reachable and must not overlap anything (the phone2 test enforces this).

## Car roles (strength, visible weak spot, counters, prey)
| car | strength | signature weak spot (visible) | beaten by | hunts |
|---|---|---|---|---|
| Tiger | cannon, armour | bent barrel: firing a bent gun blows it up | fast cars that dart in (Viper, Sandflea, Outrider); Dozer from the side | heavies, from range |
| Viper | speed, rocket lock-on | paper-thin, flips on side hits | Cruiser spike strip; Fire-truck water | slow heavies: rockets, then swoop away |
| Outrider | acceleration, harpoon | exposed blower: frontal hits kill the boost | heavies head-on, Dozer | light cars, harpooned into walls and hazards |
| Sandflea | jumps, fire trail | water stalls it | Fire truck, Combine | Tanker, Camper |
| Tanker | fuel slick plus ignition | ruptured tank leaks fuel: fire nearby means a big boom | Sandflea, Hellbender, Tiger | chasers on its fuel trail |
| Fire truck | water cannon | water runs out (gauge) | flankers once it's dry, Tow truck | fire users, light cars |
| Hellbender | minigun | barrels overheat and jam | Tiger (range), Fire truck (water) | light cars |
| Cruiser | shotgun, spike strip | light body, siren gives it away | Dozer, Bertha | fast chasers |
| Dozer | blade | weak sides and rear, slow turning | flankers | anything in front of the blade |
| Big Bertha | mass, boulders | front blind spot, big tyres | small cars under her nose, Hellbender | tailgaters, heavies |
| Combine | reel shreds | reel jams on heavy steel; straw burns | Sandflea, Tiger | light cars |
| Mixer | concrete traps | cracked drum leaks | rear attackers | fast cars |
| Camper | propane bombs | propane tanks explode in fire | Sandflea, Hellbender | heavies |
| Forklift | lift and toss | forks up = top-heavy, tips over | side rams, Dozer | light cars, wrecks into hazards |
| Tow truck | drags victims into the crusher, wrecking ball and fire pit | slow and exposed while towing | Viper, Outrider mid-tow | damaged and light cars |
