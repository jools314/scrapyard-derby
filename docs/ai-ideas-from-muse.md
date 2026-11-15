# AI ideas from Muse's improvements-100 pass (not merged)

For the agent rewriting the per-car AI and stuck recovery. These are Muse's approaches, read from its code in
`bob/improvements-100` (split commits listed per item; numbers are the BEST-50 numbers, with Muse's 100-list number in brackets).
None of this code is in `agents/muse/index68.html`. All of it lived in `Car.think()` unless noted.

## 20 AI routes to repair when hurt [100-list 21, commit 4ed4bb5]
- The existing "hurt: detour to the nearest live repair" check used a fixed `health < 45` with a 70 m search radius.
- Muse makes the threshold persona-weighted: `mendAt = coward 45 / brawler 25 / everyone else 35`.
- Below 20 % health the search radius jumps to 400 m (worth crossing the yard) and the car commits: `this.mode = 'mend'`.
- It leaves `mend` once `health >= mendAt + 10`, going back to `hunt` with `modeT = 2`.
- Still skipped while `mode === 'charge'`; only considers repair pickups with `respawn <= 0` and `y < 3` (ground level).
- Caveats: `mend` was a new mode string that nothing else handled, so the other mode logic just fell through. The 400 m
  radius ignores pathing, and the approach does nothing while the repair pickup is respawning. Shields now take two of
  the ten pickup spots in the merge, so there are fewer repair spots (and in solo games which spot holds what is shuffled).

## 21 Finish the wounded [100-list 22, commit 20be58d]
- In the target-scoring loop (lower score = better target), Muse adds: `if (c.health < 25 && style !== 'coward') s *= 0.55;`.
- One line, persona-gated. The net effect is that the field dog-piles a limping car, which is usually the player.
  Check it against the K/D and who-wrecks-whom metrics before keeping anything like it.

## 23 AI varies by car, not just persona [100-list 24, commit b04dbc0]
- Muse clones the persona's `PLAN_WEIGHTS` (the plan-choice weights) and scales them by the car's own mass:
  - heavies (`body.mass > 6000`): hunt ×1.5, runup ×1.4, flank ×0.6, circle ×0.6 (they want head-ons);
  - light cars (`< 1400`): flank ×1.5, circle ×1.4, ambush ×1.2, runup ×0.6 (hit and run).
- Note that `{ ...PLAN_WEIGHTS[style] }` allocated an object on every plan decision. Fine at plan rate, but don't do it per frame.
- A per-car table keyed by type (weapon, armour, the car's weak spot) would fit the "one strength, one weakness, counter
  and prey" design principle better than mass alone.

## 24 Aim-leading for AI gunners [100-list 25, commit 5492315, partial]
- Only the minigun (`fireBullet`) changed. The aim point became the target position plus `target.velocity × lead`, with
  `lead = clamp(distance / 300, 0, 0.35)` s (300 m/s rounds, capped at 0.35 s).
- Muse notes that `lobConcrete` already leads its target and rockets home on `rkTarget`. The harpoon is a grapple, so it
  doesn't need leading.
- This makes AI gunners noticeably more accurate against a player driving in a straight line, which is a balance change.

## 26 Beached AI recovers itself [100-list 27, commit 76ada89]
- New `aiBeachCheck(dt)`, called beside `unwedge(dt)` in `simBody` (host/solo only).
- For each AI car that isn't the player, isn't remote and isn't wrecked: it counts "stuck" time while `|speed| < 0.6` and
  `|velocity| < 0.8` after the countdown. After 4 s it calls `flipUpright()` and resets the timer.
- Caveats:
  - It doesn't check whether the car is actually beached (on a roof or a mesa edge) or is just sitting still on purpose
    (ambush or backup modes, or the forklift and tow truck waiting to load), so it can flip a car that meant to wait.
  - It duplicates part of what `unwedge` and the PLAYLOG stuck tracker (`__apS`) already measure.
  - A better trigger is "drive commanded but no progress", which the player's own `game.stuckT` uses.
