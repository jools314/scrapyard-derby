# Scrapyard Derby — car roles: strengths, signature weaknesses, counters, prey

Principle (from the user): every car is strong at something and has ONE visible signature weakness that at least one specific rival knows how to exploit (not necessarily everyone). The player can SEE the weakness on the car (like the Tiger's bent barrel) and plays around it. AI first drives each car to its strengths, avoids its counters, and hunts the cars it counters; balance tweaks come after.

| Car | Strength | Signature weakness (visible) | Counters (who beats it, how) | Prey (who it hunts, how) |
|---|---|---|---|---|
| Tiger | cannon, armour | BENT BARREL (exists): firing a bent gun blows it up → Tiger must stay far away; once bent, only crushing | fast cars dart in to bend the barrel (Viper, Sandflea, Outrider); Dozer from the side | heavies from range (stand-off 20–50 m) |
| Viper | speed, agility, rocket lock-on | paper-thin, flips on side hits | Cruiser spike strip (tyres shredded → slow); Fire truck water spins it | slow heavies: rockets into the rear, swoop past, escape |
| Outrider | acceleration, harpoon yank | EXPOSED BLOWER on the hood: frontal hits wreck it (smoke) → no boost | heavies head-on, Dozer blade | light cars: harpoon them into walls/hazards |
| Sandflea | jumps, fire trail | open buggy: WATER puts out its fire and STALLS it briefly | Fire truck, Combine reel | Tanker (ignite its fuel), Camper (propane) |
| Tanker | fuel slick + ignition | RUPTURED TANK: once damaged it leaks fuel (trail); fire near it → huge boom | Sandflea & Hellbender fire, Tiger shells | chasers on its fuel trail |
| Fire truck | water cannon, rolls light cars | WATER RUNS OUT (visible gauge), harmless until it refills (slowly / at a hydrant) | flankers once it's dry; Tow truck | fire users (Sandflea, Tanker, Hellbender), light cars |
| Hellbender | minigun | BARRELS OVERHEAT: glow red, then jam for a few seconds | Tiger outranges it; Fire truck water cools & jams it | light cars |
| Cruiser | shotgun, spike strip vs chasers | light body; siren gives it away | Dozer, Bertha | fast chasers (Viper, Outrider) |
| Dozer | unstoppable blade | weak sides/rear (exists), slow turning | flankers (Viper, Tiger from the side) | anything in front of the blade |
| Big Bertha | mass, boulders behind | FRONT BLIND SPOT + big tyres: shot-out tyres → she crawls | small cars under her nose; Hellbender shredding tyres | tailgaters (boulders), heavies |
| Combine | reel shreds what's in front | REEL JAMS on heavy steel (Tiger, boulders); straw burns | Sandflea fire, Tiger | light cars, props |
| Mixer | concrete traps & bombs | CRACKED DRUM leaks: rear hits split it → slower, concrete dribbles | rear attackers (Viper rockets, Tiger) | fast cars (trap them in concrete) |
| Camper | propane bombs | PROPANE TANKS: fire → it explodes | Sandflea, Hellbender | heavies with propane |
| Forklift | lift & toss | FORKS UP = TOP-HEAVY: tips over from side hits | any side ram, Dozer | light cars, wrecks |
| Tow truck | drags victims to the crusher | slow & exposed while towing | Viper, Outrider hit it mid-tow | damaged/light cars |

## How each car's AI drives (CAR_AI and the driver styles in index.html)
Each car's own driver has a personality that comes from the car (its `style`), and the car has a profile (`CAR_AI`): its own tactic, a range band, the prey above (hunted first) and the counters above (kept clear of). The five older styles (brawler, runup, vulture, chaos, coward) stay for the extra drivers and flavour any car they drive: a coward Viper still evades earlier and more often than a brawler Viper (`STYLE_FLAVOUR.caution`).

| style | cars | in play |
|---|---|---|
| striker | Viper | hit and run: darts at a heavy's back corner, hits, peels away (over a kicker when one is ahead); rockets from range; sidesteps heavies coming at it nose-first |
| hunter | Outrider | flanks light cars, harpoons them at 8-40 m and yanks them toward the wrecking ball, fire pit or a wall |
| chaos | Sandflea | tight drifting orbits round its prey (a ring of fire), flames only when the car is in the jet, takes the kickers |
| vulture | Spider | its own perch-and-pounce tactics (spiderTactics) |
| trapper | Mixer, Tanker | gets ahead of a car on its line (never toward a wall) and leads it on: concrete lobbed where a moving car is going and a trail for tailgaters (Mixer); fuel for tailgaters, lit once they're in it and the tanker is clear (Tanker) |
| brawler | Cruiser | (an older style that fits it: Sheriff Buck) goes straight at fast cars; the stop-stick drops itself for tailgaters, the shotgun fires only under 22 m; now and then gets out ahead of a chaser to lead it over the stick |
| dragger | Tow truck, Forklift | picks off hurt and light cars and delivers them to the crusher or the ball |
| gunner | Hellbender | holds 10-34 m facing its target (or just rams: it hunts as often), minigun at range on cars (not bulls), backs off when crowded |
| sniper | Tiger | orbits at 24-50 m and shells (the turret leads); once the barrel is bent it stops firing and crushes |
| runup | Camper | (an older style that fits it) backs up and charges: a rolling wrecking ball that hunts heavies; lobs propane only at 12-50 m, never on its own nose |
| rescuer | Fire truck | goes for burning cars, leaking tankers and fire users, hoses them from 9-22 m; anything not burning it just rams; rolls light cars that come close |
| bully | Dozer, Big Bertha, Combine | shoves its prey into the nearest hazard (wrecking ball, crusher mouth, fire pit): gets on the far side, then drives straight through it, backs off and rams again if it jams; with no hazard near, the Dozer comes round to blade a car in the side; Bertha drops boulders on tailgaters; the Combine mostly hunts head-on with its reel and never reels heavy steel |
