# Scrapyard Derby play-log report · 2026-11-16 02:39 UTC

610 matches (598 from real devices, 1819.1 game-minutes), 47 page loads, 8 bug reports.

## Who and what

- Mac · build 93 · autoplay: 18 matches
- Mac · build 92 · autoplay: 19 matches
- Mac · build 91 · autoplay: 7 matches
- other · build 91 · autoplay: 16 matches
- other · build 90 · autoplay: 48 matches
- other · build 89 · autoplay: 15 matches
- Mac · build 88 · autoplay: 13 matches
- Mac · build 88 · solo: 1 matches
- other · build 88 · autoplay: 23 matches
- other · build 88 · solo: 3 matches
- Mac · build 82 · autoplay: 34 matches
- other · build 82 · autoplay: 36 matches
- Mac · build 75 · autoplay: 68 matches
- other · build 75 · autoplay: 64 matches
- Mac · build 71 · autoplay: 34 matches
- other · build 71 · autoplay: 34 matches
- Mac · build 70 · autoplay: 43 matches
- other · build 70 · autoplay: 41 matches
- Mac · build 69 · autoplay: 12 matches
- Mac · build 68 · autoplay: 6 matches
- Mac · build 68 · solo: 1 matches
- Android · build 67 · solo: 1 matches
- Mac · build 67 · autoplay: 26 matches
- Mac · build 67 · solo: 3 matches
- Mac · build 66 · autoplay: 22 matches
- Mac · build 65 · solo: 1 matches
- Mac · build 65 · autoplay: 9 matches

## Performance (foreground)

- **Android**: fps median 60, typical 1% low 40, worst frame 92 ms · quality 0, res 100% · 1 matches · 2 s throttled/hidden (excluded)
- **Mac**: fps median 60, typical 1% low 53, worst frame 983 ms · quality 0, res 100% · 315 matches · 1008 s throttled/hidden (excluded)
- **other**: fps median 60, typical 1% low 20, worst frame 984 ms · quality 7, res 50% · 278 matches · 2905 s throttled/hidden (excluded)
### Release to release

| device | build | matches | game-min | fps med | p5 | 1% low | worst ms | res | slow s/h | stuck/h | phys catches/h | throttled s | inside/h |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Android | 67 | 1 | 1 | 60 | 60 | 40 | 92 | 100% | 1356.3 | 0 | 419 | 2 | – |
| Mac | 65 | 9 | 34 | 60 | 56 | 30 | 667 | 130% | 11.3 | 70 | 263 | – | – |
| Mac | 66 | 22 | 59 | 60 | 55 | 53 | 983 | 100% | 5.2 | 55 | 234 | – | – |
| Mac | 67 | 28 | 96 | 60 | 56 | 53 | 750 | 100% | 6.0 | 73 | 278 | 88 | – |
| Mac | 68 | 7 | 51 | 60 | 53 | 53 | 350 | 100% | 4.9 | 51 | 292 | 4 | – |
| Mac | 69 | 12 | 35 | 60 | 56 | 53 | 850 | 100% | 2.4 | 81 | 271 | 92 | – |
| Mac | 70 | 43 | 129 | 60 | 55 | 53 | 583 | 100% | 4.0 | 66 | 275 | 0 | – |
| Mac | 71 | 34 | 102 | 60 | 53 | 53 | 500 | 100% | 9.3 | 60 | 276 | 34 | – |
| Mac | 75 | 68 | 204 | 60 | 53 | 53 | 748 | 100% | 22.2 | 59 | 293 | 50 | – |
| Mac | 82 | 34 | 102 | 60 | 53 | 31 | 882 | 100% | 13.8 | 39 | 325 | 513 | – |
| Mac | 88 | 14 | 44 | 60 | 56 | 53 | 815 | 100% | 43.5 | 78 | 420 | 207 | – |
| Mac | 91 | 7 | 16 | 60 | 53 | 53 | 933 | 100% | 8.2 | 37 | 276 | 20 | – |
| Mac | 92 | 19 | 57 | 60 | 55 | 53 | 566 | 100% | 4.8 | 55 | 193 | 0 | – |
| Mac | 93 | 18 | 54 | 60 | 56 | 53 | 733 | 100% | 11.3 | 51 | 312 | 0 | – |
| other | 70 | 41 | 123 | 60 | 30 | 20 | 517 | 50% | 185.3 | 54 | 700 | 302 | – |
| other | 71 | 34 | 102 | 60 | 30 | 20 | 884 | 50% | 240.3 | 68 | 658 | 419 | – |
| other | 75 | 64 | 192 | 60 | 30 | 20 | 984 | 50% | 402.8 | 66 | 548 | 1011 | – |
| other | 82 | 36 | 108 | 60 | 30 | 20 | 751 | 50% | 212.6 | 67 | 366 | 238 | – |
| other | 88 | 24 | 75 | 60 | 30 | 20 | 867 | 50% | 572.6 | 65 | 626 | 150 | – |
| other | 89 | 15 | 45 | 60 | 30 | 20 | 834 | 50% | 113.5 | 51 | 496 | 163 | – |
| other | 90 | 48 | 144 | 60 | 30 | 15 | 717 | 50% | 349.9 | 75 | 476 | 486 | – |
| other | 91 | 16 | 46 | 60 | 30 | 20 | 984 | 50% | 221.0 | 55 | 398 | 136 | – |

### Regression check (newest build vs previous, per device)

- **REGRESSION** Mac: build 92 -> 93: slow s/h 4.8 -> 11.3; physics catches/h 192.6 -> 312.2
- OK other: build 90 -> 91 (fps low 15->20, stuck/h 75.4->55.3, phys/h 476.2->397.8)

- slow moments by cause (seconds): the game step (physics/AI) is the slow part: 2610.5; preparing the drawing (draw calls) is the slow part: 1731.7; waiting on the graphics chip (fewer pixels/effects would help): 140.0
- slow incidents by cause × quality × match phase (seconds): the game step (physics/AI) is the slow part · q7 · 0-5 min: 2549.4; preparing the drawing (draw calls) is the slow part · q7 · 0-5 min: 1589.5; waiting on the graphics chip (fewer pixels/effects would help) · q0 · 0-5 min: 66.8; preparing the drawing (draw calls) is the slow part · q4 · 0-5 min: 43.9; preparing the drawing (draw calls) is the slow part · q5 · 0-5 min: 43.6; waiting on the graphics chip (fewer pixels/effects would help) · q7 · 0-5 min: 34.7; the game step (physics/AI) is the slow part · q0 · 0-5 min: 29.4; preparing the drawing (draw calls) is the slow part · q6 · 0-5 min: 19.1; preparing the drawing (draw calls) is the slow part · q0 · 0-5 min: 12.5; waiting on the graphics chip (fewer pixels/effects would help) · q6 · 0-5 min: 12.3; waiting on the graphics chip (fewer pixels/effects would help) · q2 · 0-5 min: 10.1; preparing the drawing (draw calls) is the slow part · q3 · 0-5 min: 9.8; preparing the drawing (draw calls) is the slow part · q1 · 0-5 min: 9.3; waiting on the graphics chip (fewer pixels/effects would help) · q4 · 0-5 min: 8.6; the game step (physics/AI) is the slow part · q2 · 0-5 min: 6.6; the game step (physics/AI) is the slow part · q7 · 5-15 min: 6.1; the game step (physics/AI) is the slow part · q6 · 0-5 min: 5.1; the game step (physics/AI) is the slow part · q3 · 0-5 min: 5.0; the game step (physics/AI) is the slow part · q5 · 0-5 min: 4.7; waiting on the graphics chip (fewer pixels/effects would help) · q0 · 15+ min: 4.1; preparing the drawing (draw calls) is the slow part · q2 · 0-5 min: 4.0; the game step (physics/AI) is the slow part · q1 · 0-5 min: 3.2; waiting on the graphics chip (fewer pixels/effects would help) · q1 · 0-5 min: 1.5; the game step (physics/AI) is the slow part · q4 · 0-5 min: 1; waiting on the graphics chip (fewer pixels/effects would help) · q3 · 0-5 min: 1; waiting on the graphics chip (fewer pixels/effects would help) · q5 · 0-5 min: 0.9
- worst slow incidents: t106s: 12.3s at 15 fps (worst 350 ms) q6 · 206 particles, 0 fires, 0 blasts · worst frame 350 ms: physics 9, render 6, hud 1, effects 1 · 334 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t123s: 11.9s at 23 fps (worst 83 ms) q7 · 534 particles, 9 fires, 1 blasts · worst frame 83 ms: physics 18, render 15, ai 1, hud 1, lod 1, cars 1 · 46 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t18s: 11.7s at 13 fps (worst 117 ms) q0 · 121 particles, 0 fires, 0 blasts · worst frame 117 ms: render 81, physics 20, cars 10; t6s: 11.2s at 18 fps (worst 367 ms) q5 · 183 particles, 0 fires, 0 blasts · worst frame 367 ms: render 9, physics 8, hud 1, cars 1 · 348 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t111s: 10.7s at 21 fps (worst 83 ms) q5 · 80 particles, 0 fires, 0 blasts · worst frame 83 ms: render 9536, physics 11, hud 3, cars 2, effects 1

## Stuck hotspots

- (38, -96): 97× · 542.0 s · combine 24, bertha 19, firetruck 16, tanker 14, tiger 8 · touching: wall, debris, ground
- (-107, -95): 55× · 368.0 s · mixer 13, bertha 11, tanker 8, forklift 8, firetruck 3 · touching: wall, debris, ground
- (37, -107): 63× · 345.0 s · combine 28, firetruck 8, forklift 5, mixer 5, bertha 4 · touching: wall, combine, bertha
- (1, 37): 46× · 240.5 s · bertha 10, tanker 9, firetruck 8, combine 7, dozer 4 · touching: mixer, debris, wall
- (-118, -94): 27× · 172.5 s · combine 7, mixer 6, tanker 4, bertha 3, viper 2 · touching: wall, debris, combine
- (-94, -144): 15× · 157.0 s · firetruck 4, tanker 2, hellbender 2, mixer 2, cruiser 2 · touching: wall, ground, debris
- (96, -70): 30× · 157.0 s · firetruck 8, bertha 4, dozer 3, forklift 3, hellbender 3 · touching: wall, ground
- (-10, 33): 27× · 148.0 s · mixer 9, firetruck 5, tanker 4, combine 4, towtruck 2 · touching: wall, ground, bertha
- (99, -144): 16× · 145.5 s · mixer 5, bertha 4, firetruck 3, cruiser 1, tanker 1 · touching: bertha, mixer, wall
- (24, -14): 28× · 144.0 s · combine 7, tanker 6, firetruck 5, mixer 3, towtruck 2 · touching: wall, ground, mixer
- (-11, 28): 24× · 141.5 s · mixer 8, firetruck 5, combine 4, viper 2, tanker 2 · touching: wall, debris, ground
- (-109, -87): 21× · 141.5 s · combine 8, forklift 6, bertha 3, outrider 1, mixer 1 · touching: wall, combine, debris
- total 1799 stuck events, 10100.5 s, over 1819.1 game-minutes (59.3 per hour)

## Cars inside objects

- not recorded yet (no records from a build with the inside-an-object detector)

## Physics safety-net catches

- totals (full census): blowups 12258, fixes 2701721, clamps 105315, undos 10993, escapes 14, launches 61, rescues 11, below 27, nan 0 · safety-net work: fixes 2701721 (89112/h), clamps 105315 (3474/h) · kinds (census): solver kick undone 10993, blow-up clamped 1265, escaped the arena, put back 14, fell through floor, lifted back 11
- by vehicle (listed catches only — the game lists at most 40 per match, so this is a capped sample): Outrider 1867, Sandflea 1114, Viper 917, Tow Truck 836, bull 752, Cruiser 722, Forklift 671, Hellbender 642 · listed kinds: solver kick undone 7943, blow-up clamped 1131, escaped the arena, put back 14, fell through floor, lifted back 10

- catch locations (listed catches with a position, same 12 m grid as stuck — do the two maps agree?): (97, 92): 328× · solver kick undone 327, fell through floor, lifted back 1; (97, 87): 309× · solver kick undone 309; (108, -60): 248× · solver kick undone 248; (116, -71): 176× · solver kick undone 176; (95, -58): 157× · solver kick undone 157; (96, -52): 155× · solver kick undone 155; (109, -84): 150× · solver kick undone 150; (84, -60): 147× · solver kick undone 146, fell through floor, lifted back 1
## Balance (all real matches)

| vehicle | lives | kills | deaths | K/D | dmg/life | taken/life | avg life s | fires |
|---|---|---|---|---|---|---|---|---|
| bertha | 1099 | 1836 | 724 | 2.54 | 294 | 86 | 55 | 4410 |
| dozer | 1211 | 2217 | 878 | 2.53 | 139 | 90 | 48 | 6550 |
| combine | 1229 | 1343 | 864 | 1.55 | 88 | 84 | 48 | 2424 |
| mixer | 1330 | 907 | 982 | 0.92 | 48 | 88 | 43 | 2157 |
| tanker | 1330 | 949 | 1042 | 0.91 | 41 | 91 | 36 | 1410 |
| hellbender | 1404 | 871 | 1180 | 0.74 | 113 | 97 | 34 | 67798 |
| towtruck | 1416 | 798 | 1128 | 0.71 | 32 | 93 | 35 | 2865 |
| forklift | 1365 | 755 | 1092 | 0.69 | 30 | 92 | 36 | 1693 |
| firetruck | 1345 | 668 | 1001 | 0.67 | 40 | 89 | 45 | 4502 |
| cruiser | 1447 | 700 | 1244 | 0.56 | 57 | 95 | 27 | 8513 |
| outrider | 1604 | 497 | 1422 | 0.35 | 39 | 97 | 23 | 6365 |
| camper | 1520 | 404 | 1352 | 0.3 | 24 | 97 | 22 | 2482 |
| viper | 1644 | 336 | 1464 | 0.23 | 37 | 97 | 24 | 4403 |
| sandflea | 1649 | 343 | 1516 | 0.23 | 39 | 98 | 16 | 1786 |
| tiger | 741 | 137 | 673 | 0.2 | 211 | 93 | 31 | 5078 |

## Matchups (build 93): who wrecks whom

- dozer wrecked outrider: 9× · 516 damage
- dozer wrecked tanker: 9× · 426 damage
- dozer wrecked towtruck: 8× · 542 damage
- dozer wrecked cruiser: 8× · 437 damage
- bertha wrecked firetruck: 8× · 726 damage
- hellbender wrecked mixer: 7× · 468 damage
- dozer wrecked viper: 6× · 465 damage
- bertha wrecked tanker: 6× · 934 damage
- combine wrecked hellbender: 5× · 326 damage
- combine wrecked viper: 5× · 244 damage
- combine wrecked sandflea: 5× · 228 damage
- forklift wrecked hellbender: 5× (5 dragged into a hazard) · 217 damage
- dozer wrecked camper: 5× · 287 damage
- bertha wrecked sandflea: 5× · 526 damage
- forklift wrecked viper: 5× (3 dragged into a hazard) · 335 damage

## Voice variety (build 93, 18 matches)

- 338 lines heard; 1% were repeats within the same match, 30% repeats of a line already heard this session
- per character (lines heard / distinct): Ragnar Rustbeard 29/29, Tony Cement 28/28, Sheriff Buck 27/27, Uncle Bogdan 25/24, Papa Jacques 25/25, Big Bertha 25/25, Captain McCaffrey 24/24, Cletus 22/22, Maxine MacTavish 22/22, Bulldozer Bob 21/21, Dom 19/19, Rocket Raju 18/18, King Arthur 16/16, Mr. White 14/14, Jesse 12/11, Oberst Klaus 9/9
- most repeated lines: Uncle Bogdan: Hot! Hot! Like my grandmother's soup! ×2; Jesse: We're on fire! Mr. White, we are literally on fire! ×2

## Voices, errors, network

- Android: voice failures 0 over 1 matches · lines sent 26, started 19, errors 7
- Mac: voice failures 364 over 317 matches · lines sent 16, started 0, errors 7 (engine never started)
- other: voice failures 18 over 280 matches · lines sent 1, started 0, errors 1 (engine never started)
- errors & incidents (in and out of matches): 6× voice: voices: stuck - # lines asked for, engine busy # s and none started (last voice default, # voices, spea; 2× voice: voices: stuck - still busy # s after the tab came back from # s in the background (last voice default, ; 2× voice: voices: # recorded clips loaded (# voices)
- network incidents: 10

## Autoplay

- 588 matches, 1703.8 game-minutes · endings: autoplay round done 547, autoplay stopped 27, checkpoint: every # min 8, page closed mid-match 4, checkpoint: voice failure 1, checkpoint: slow moment 1
- 5 autoplay matches spent time hidden (stats from those stretches are excluded from build 67)

## Bug reports

- 1794706963-lliE33pDU7vD-bug-b68-web-2026-11-15T01-42-43-652Z · {"code":40401,"http":404,"error":"page not found"}
- 1794725414-tgRRYQWpPVYF-bug-b69-web-2026-11-15T06-50-14-834Z · {"code":40401,"http":404,"error":"page not found"}
- 1794725451-7bKoH5NiFJwx-bug-b69-web-2026-11-15T06-50-50-843Z · {"code":40401,"http":404,"error":"page not found"}
- 1794725479-21679ipLjuMa-bug-b69-web-2026-11-15T06-51-18-901Z · {"code":40401,"http":404,"error":"page not found"}
- 1794727632-OgV59iRq3qG4-bug-b70-web-2026-11-15T07-27-12-098Z · {"code":40401,"http":404,"error":"page not found"}
- 1794762450-qP4SGsaf1ReF-bug-b88-web-2026-11-15T17-07-29-004Z · SCRAPYARD DERBY BUG REPORT · build 88 · 2026-11-15T17:07:28.909Z · jools314.github.io
- 1794762454-YXtovFkBoLSJ-bug-b88-web-2026-11-15T17-07-33-490Z · SCRAPYARD DERBY BUG REPORT · build 88 · 2026-11-15T17:07:33.426Z · jools314.github.io
- 1794765234-1sVPyW2OhGl0-bug-b88-Mac-2026-11-15T17-53-54-310Z · SCRAPYARD DERBY BUG REPORT · build 88 · 2026-11-15T17:53:54.020Z · jools314.github.io

## Changes since the previous report

- new stuck hotspot at (96,-70) ×30
- new stuck hotspot at (-11,28) ×24
- physics catches up for Camper: 461 → 489
- physics catches up for bull: 713 → 752
- physics catches up for Tow Truck: 798 → 836
- physics catches up for Outrider: 1757 → 1867
- physics catches up for Cruiser: 658 → 722
- physics catches up for Hellbender: 608 → 642
- physics catches up for Forklift: 637 → 671
- physics catches up for Viper: 894 → 917
- physics catches up for Sandflea: 1041 → 1114
- physics catches up for Big Bertha: 79 → 91
- physics catches up for Mixer: 144 → 155
- physics catches up for Tanker: 369 → 390
- physics catches up for Fire Truck: 335 → 344
- first data from build 93
