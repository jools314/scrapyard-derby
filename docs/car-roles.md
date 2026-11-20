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
| Buzzsaw Hover | speed, big drifts, spinning saws down both sides, cartoon bombs (lobbed at the car ahead, dropped on a chaser, or dropped from a ~5 m boost onto the car below); hovers low over concrete, oil and mud | EXPOSED FAN at the back (no saws there): rear hits bend it → it pushes less, smokes and wobbles; so light that every hit and hose shoves it | Fire truck water blasts it across the yard; fast cars hit the fan from behind (Viper, Outrider) | slow heavies (bombed from above, they can't catch it), anyone who rams or rubs the side saws |
| Jet (Captain Goldtooth) | laser minigun on the roof; in a tsunami Ann the speedboat launches off the bed | BATTERY RING on the turret dims as it drains, flashes red while it recharges (2.5 s locked out); water from the Fire truck shorts the laser | Fire truck (water shorts it), fast flankers once the battery is flat (Viper, Outrider) | the Cruiser (plunder: its cash), light cars from range |
| Ann (tsunami only) | very fast and drifty on water, bow laser, auto broadside cannons, J dives under and comes up zapping whoever is above | out of the water she can only scoot; light hull | heavies she can't get under, anything on high ground | slow cars wading in the flood |

## How each car's AI drives (CAR_AI and the driver styles in index.html)
Each car's own driver has a personality that comes from the car (its `style`), and the car has a profile (`CAR_AI`): its own tactic, a range band, the prey above (hunted first) and the counters above (kept clear of). The five older styles (brawler, runup, vulture, chaos, coward) stay for the extra drivers and flavour any car they drive: a coward Viper still evades earlier and more often than a brawler Viper (`STYLE_FLAVOUR.caution`).

| style | cars | in play |
|---|---|---|
| striker | Viper | hit and run: darts at a heavy's back corner, hits, peels away (over a kicker when one is ahead); rockets from range; sidesteps heavies coming at it nose-first |
| hunter | Outrider | flanks light cars, harpoons them at 8-40 m and yanks them toward the wrecking ball, fire pit or a wall |
| chaos | Sandflea | tight drifting orbits round its prey (a ring of fire), flames only when the car is in the jet, takes the kickers |
| weaver | Spider | (Kwaku Anansi) the combo, no more perching and waiting: hunts light cars (keeps clear of the Dozer's blade), webs its own target from 8-30 m and nearly always (90%) reels itself in on the thread onto its roof for the big beam; a pounce that lands it on a roof webs that car down from up there, then the laser |
| trapper | Mixer, Tanker | gets ahead of a car on its line (never toward a wall) and leads it on: concrete lobbed where a moving car is going and a trail for tailgaters (Mixer); fuel for tailgaters, lit once they're in it and the tanker is clear (Tanker) |
| brawler | Cruiser | (an older style that fits it: Sheriff Buck) goes straight at fast cars, as before; the stop-stick drops itself for tailgaters, the shotgun fires only under 26 m |
| dragger | Tow truck, Forklift | picks off hurt and light cars and delivers them to the crusher or the ball |
| gunner | Hellbender | holds 10-34 m facing its target (or just rams: it hunts as often), minigun at range on cars (not bulls), backs off when crowded |
| sniper | Tiger | circles at 14-34 m and shells (the turret leads), and as often goes in to crush; it doesn't run from a fast car that closes in (that's how its barrel gets bent); once the barrel is bent it stops firing and crushes |
| runup | Camper | (an older style that fits it) backs up and charges: a rolling wrecking ball that picks on the middling trucks (not the giants); lobs propane at whoever is ahead at 10-55 m, never on its own nose |
| rescuer | Fire truck | goes for burning cars, leaking tankers and fire users, hoses them from 9-22 m; anything not burning it just rams; rolls light cars that come close |
| bully | Dozer, Big Bertha, Combine | shoves its prey into the nearest hazard (wrecking ball, crusher mouth, fire pit): gets on the far side, then drives straight through it, backs off and rams again if it jams; with no hazard near, the Dozer comes round to blade a car in the side; Bertha drops boulders on tailgaters; the Combine mostly hunts head-on with its reel and never reels heavy steel |
| drifter | Buzzsaw Hover | (Typhoon Tomoko) drifting rings round the slow heavies; boost-hops over a car it is closing on (twice as keen as before, from up to 19 m) and bombs it from the air; sliding in on a car (about a second out) it swings its nose across and coasts in saw-flank first, and if it stops against it, it swings out and slides in again (no shoving match); keeps its fan away from the Viper, the Outrider and the hose |
| pirate | Jet, Ann | (Captain Goldtooth) Jet: orbits at 14-40 m and holds the laser until the battery is flat, then rams while it recharges; goes for the cop car first and rams it for its cash, and for loose cash within 30 m; when the siren goes it drives at the wave so Ann launches. Ann: rings slow cars wading in the flood (12 m: the broadside fires at whoever is alongside), dives under the close ones, never goes after a car up on a platform |
