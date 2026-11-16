# claude/ai-stuck: per-car AI, stuck spots, harpoon / wrecking-ball physics — measurements

Branch `claude/ai-stuck` (rebased on Build 91). Not landed: per AGENTS.md hard rules it waits for a clean Regression check.

## What changed (index.html)
- **Per-car AI** (`AI_ROLE`, `AI_PREY`, `AI_COUNTER` next to `PLAN_WEIGHTS`; tactics block in `Car.think`), from docs/car-roles.md:
  - target choice weighs prey (×0.55, incl. burning cars for the fire truck, a tow truck/forklift mid-tow for Viper/Outrider) and counters (×1.7);
  - light cars (Viper, Sandflea, Outrider, Cruiser) hit and run: approach heavies on the rear quarter (Viper lines up further back for rockets), break off after hitting a heavy or when hurt, break off after a rocket salvo, dart at a Tiger's barrel when close;
  - the Tiger stands off at 25–45 m, drives out of range when a fast car closes, never fires a bent barrel (it crushes instead);
  - the Cruiser kites a heavy (or anything when hurt) over its stop-sticks;
  - any non-heavy sidesteps a counter or a heavy coming straight at it; weakness flags (`water`, `mgHeat`/`mgJam`, `leaking`) are read when present;
  - tow truck / forklift: deliver to the nearest of crusher, wrecking ball or **fire pit**; drop the load (with a whip) and run when a Viper/Outrider closes in mid-tow; the `__relBy` drag credit is untouched;
  - repair when hurt earlier for light cars and cowards, longer detour when below 20 (Muse's idea, docs/ai-ideas-from-muse.md).
- **Weapon kills are credited** (`applyDamage` sets `lastAttacker`): rockets, shells, flamer, shotgun, minigun used to give the wreck to whoever bumped last.
- **Stuck recovery (AI):** "trapped" = wants to move, < 1.5 m/s, never 2.2 m from where it was: three-point turn at 1.7 s (overrides `charge`), hop toward the most open side at 2.9 s; a car propped on its side (up 0.3–0.6) is righted after 2.5 s.
- **Arena:** fire pit backs 62° → 20° onto a 4 m coal bed 2.2 m up (no more pit trap); tapering lead-ins at both ends of every corner bank and both ends of the quarter pipe (they were cliffs with a hollow under the slab cars drove into); the 10 burning drums are 260 kg props moved off the walls/pillars/ramps.
- **Physics:** harpoon reels to bumper-to-bumper, force capped by the lighter body, reels from the real distance, lets go when reeled in, snaps on a runaway heavy; wrecking-ball velocity was read 2× every other frame (now analytic) and its hits are clamped instead of undone; Sandflea roll/pitch inertia ×1.8.
- **Stats (small, after the AI):** Viper armour 1.2→0.85 + hits at speed ×0.7 + nitro regen ×2 + rockets cd 6→4.5, scale 0.42→0.5; Sandflea armour 1.3→1.0, flamer 16→19/s; Forklift armour 0.75→0.62, power 0.6→0.68; Outrider, Camper armour 1.0→0.9; minigun rounds ×0.85.
- **Play log:** stuck hop events say what the car was touching (`touchingWhat`, also `__derby.touching`).

## Tests
- `tests/stuckspots.js` (QUICK=1 in the quick suite, full in release): the real AI chases a parked target through every play-log hotspot from several angles; fails if any car spends > 4 s wanting to move without getting 2 m.
  - full set, 329 runs: **Build 90: 306/329; branch: 327/329** (the 2 left: a combine at the SW container, a mixer held in the crusher).
- `tests/harpoon.js`: Outrider harpoons Bertha / mixer, parked and driving off. Fails on Build 90 (reels itself under Bertha: centres 2.8 m), passes on the branch, 0 safety-net catches.
- `tests/ball.js`: wrecking ball vs camper / fire truck / Hellbender / Cruiser. Build 90: 6–9 hits undone per car; branch: 0, cars knocked 7–20 m at ≤ 30 m/s.
- quick suite on the branch: all PASS except `perfbudget`, which printed PERF PASS (draw calls/tris/geometries flat) but hit the runner's 900 s timeout; a re-run crashed the browser at load 24 (other agents). Physics step 3.7→6.4 ms was flagged as noisy at that load; needs a clean A/B.

## 15-car self-play (tests/selfplay15.js, every car on the AI; ~13.5 game-min per side, base = Build 67 + Build 90)
game-s base 800 new 828; physics catches/game-h base 1642 new 530; play-log stuck>=4s s/game-h base 770 new 98
| car | K/D base → new | kills/alive-min | avg life s | % time wrecked | stuck s/alive-min | phys catches/alive-h |
|---|---|---|---|---|---|---|
| outrider | 0.41 → **0.65** | 2.01 → 2.37 | 12 → 16 | 33 → 27 | 7.2 → 5.2 | 68 → 38 |
| viper | 0.20 → **0.79** | 0.67 → 0.87 | 18 → 54 | 21 → 8 | 7.1 → 6.4 | 20 → 4 |
| towtruck | 0.67 → **0.94** | 1.62 → 1.20 | 25 → 47 | 17 → 10 | 6.2 → 6.5 | 11 → 7 |
| forklift | 0.58 → **0.71** | 1.23 → 0.97 | 28 → 44 | 15 → 10 | 10.5 → 9.1 | 22 → 4 |
| sandflea | 0.40 → **0.40** | 1.73 → 1.29 | 14 → 19 | 27 → 21 | 7.2 → 5.1 | 46 → 30 |
| camper | 0.31 → **0.20** | 0.82 → 0.43 | 23 → 28 | 18 → 15 | 7.3 → 6.3 | 7 → 9 |
| mixer | 1.43 → **0.86** | 2.59 → 0.95 | 33 → 54 | 13 → 9 | 7.9 → 7.4 | 3 → 1 |
| firetruck | 0.89 → **0.33** | 1.35 → 0.49 | 40 → 41 | 11 → 11 | 12.4 → 8.1 | 0 → 0 |
| hellbender | 1.14 → **1.30** | 2.06 → 2.14 | 33 → 36 | 13 → 12 | 10.6 → 8.7 | 171 → 8 |
| cruiser | 0.52 → **0.81** | 1.26 → 1.81 | 25 → 27 | 17 → 16 | 10.7 → 10.4 | 12 → 11 |
| tiger | 0.36 → **3.33** | 0.91 → 1.50 | 24 → 133 | 17 → 4 | 6.0 → 7.7 | 0 → 0 |
| dozer | 1.89 → **1.58** | 3.06 → 1.48 | 37 → 64 | 12 → 7 | 7.6 → 8.0 | 0 → 0 |
| combine | 1.17 → **0.90** | 2.36 → 0.69 | 30 → 78 | 15 → 6 | 13.1 → 12.2 | 0 → 0 |
| bertha | 2.54 → **5.50** | 2.69 → 5.16 | 57 → 64 | 8 → 7 | 7.0 → 6.6 | 2 → 0 |
| tanker | 1.13 → **0.29** | 2.26 → 0.40 | 30 → 44 | 14 → 10 | 10.4 → 8.3 | 2 → 0 |

Read with care: two short runs per side. Clear wins: physics catches ÷3, stuck seconds ÷8, Viper/Outrider/Cruiser/tow truck/forklift up, Tiger up (its shells now earn kills). Still off: Bertha too high (5.5), Tanker, Camper, Fire truck low (0.2–0.33), Sandflea flat at 0.4; fewer wrecks per minute overall (the light cars break off instead of trading).

## Balance pass (after review), Build 91 vs branch, 40 real minutes each (33 vs 35 game-min)
Changes: camper lobs propane from 20-32 m instead of ramming; tanker kites chasers over its fuel slick and sidesteps fire users; sandflea orbits its target at 14 m laying a fire ring and hops clear of heavies; light cars hit Bertha on the beam (not her boulder-dropping tail) and Bertha can't target a small car right under her nose; the fast cars hunt the Tiger (its counters no longer fear it, it no longer flees them; it opens fire inside 65 m); the fire-truck hose earns the wreck of a car it rolls; the Cruiser kite line had been commented out by a stray `//` (fixed). Stats: tank shells x0.72, armour Tiger 0.3->0.4, Bertha 0.35->0.5, Sandflea 1.0->0.85, Outrider 0.9->0.8, Camper 0.9->0.8.
Kill credit check: one wreck credits exactly one killer (game.onWreck); applyDamage only sets lastAttacker, the drag credit still wins after 1 s, so nothing is counted twice.

game-s base 1972 new 2101; physics catches/game-h base 1254 new 399; play-log stuck>=4s s/game-h base 603 new 40
| car | K/D base → new | kills/alive-min | avg life s | % time wrecked | stuck s/alive-min | phys catches/alive-h |
|---|---|---|---|---|---|---|
| outrider | 0.34 → **0.48** | 1.82 → 1.46 | 11 → 20 | 35 → 23 | 5.6 → 4.4 | 196 → 65 |
| viper | 0.28 → **1.07** | 0.84 → 1.43 | 20 → 45 | 20 → 10 | 8.8 → 6.7 | 100 → 45 |
| towtruck | 1.03 → **0.78** | 2.22 → 1.12 | 28 → 42 | 15 → 11 | 7.3 → 6.0 | 19 → 11 |
| forklift | 0.67 → **0.75** | 1.35 → 0.84 | 30 → 53 | 14 → 9 | 10.0 → 9.2 | 14 → 15 |
| sandflea | 0.30 → **0.24** | 1.23 → 0.46 | 15 → 31 | 25 → 14 | 8.6 → 4.9 | 78 → 19 |
| camper | 0.37 → **0.18** | 1.00 → 0.29 | 22 → 38 | 18 → 12 | 7.9 → 4.6 | 196 → 10 |
| mixer | 0.81 → **0.53** | 1.35 → 0.63 | 36 → 50 | 12 → 9 | 9.7 → 7.2 | 2 → 0 |
| firetruck | 1.00 → **0.28** | 1.43 → 0.35 | 42 → 48 | 11 → 10 | 12.1 → 8.5 | 3 → 1 |
| hellbender | 0.85 → **1.14** | 1.66 → 1.89 | 31 → 36 | 14 → 12 | 7.8 → 6.9 | 18 → 19 |
| cruiser | 0.55 → **0.34** | 1.31 → 0.66 | 25 → 31 | 17 → 14 | 9.2 → 10.0 | 32 → 25 |
| tiger | 0.29 → **4.50** | 0.74 → 1.86 | 23 → 145 | 18 → 3 | 7.7 → 6.1 | 7 → 0 |
| dozer | 1.68 → **2.27** | 2.73 → 2.09 | 37 → 65 | 12 → 7 | 6.6 → 7.9 | 0 → 0 |
| combine | 1.81 → **1.16** | 2.66 → 1.35 | 41 → 52 | 11 → 9 | 12.3 → 8.5 | 0 → 0 |
| bertha | 2.42 → **4.39** | 2.65 → 3.76 | 55 → 70 | 8 → 7 | 7.0 → 6.4 | 2 → 0 |
| tanker | 1.42 → **0.78** | 2.35 → 0.91 | 36 → 52 | 12 → 9 | 11.9 → 5.3 | 4 → 0 |

Still outside 0.5-2.0: Tiger 4.5 and Bertha 4.4 (high), Camper 0.18, Sandflea 0.24, Fire truck 0.28, Cruiser 0.34 (low). Run-to-run noise is large (the fire truck read 0.88 in the previous 24-min run), so a car needs about 30+ game-minutes before a reading means much.
