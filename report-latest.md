# Scrapyard Derby play-log report · 2026-11-15 17:35 UTC

472 matches (461 from real devices, 1409.6 game-minutes), 37 page loads, 7 bug reports.

## Who and what

- Mac · build 88 · autoplay: 13 matches
- other · build 88 · autoplay: 11 matches
- other · build 88 · solo: 2 matches
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
- **Mac**: fps median 60, typical 1% low 53, worst frame 983 ms · quality 0, res 100% · 270 matches · 963 s throttled/hidden (excluded)
- **other**: fps median 60, typical 1% low 20, worst frame 984 ms · quality 7, res 50% · 186 matches · 2003 s throttled/hidden (excluded)
### Release to release

| device | build | matches | game-min | fps med | p5 | 1% low | worst ms | res | slow s/h | stuck/h | phys catches/h | throttled s |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Android | 67 | 1 | 1 | 60 | 60 | 40 | 92 | 100% | 1356.3 | 0 | 419 | 2 |
| Mac | 65 | 9 | 34 | 60 | 56 | 30 | 667 | 130% | 11.3 | 70 | 263 | – |
| Mac | 66 | 22 | 59 | 60 | 55 | 53 | 983 | 100% | 5.2 | 55 | 234 | – |
| Mac | 67 | 28 | 96 | 60 | 56 | 53 | 750 | 100% | 6.0 | 73 | 278 | 88 |
| Mac | 68 | 7 | 51 | 60 | 53 | 53 | 350 | 100% | 4.9 | 51 | 292 | 4 |
| Mac | 69 | 12 | 35 | 60 | 56 | 53 | 850 | 100% | 2.4 | 81 | 271 | 92 |
| Mac | 70 | 43 | 129 | 60 | 55 | 53 | 583 | 100% | 4.0 | 66 | 275 | 0 |
| Mac | 71 | 34 | 102 | 60 | 53 | 53 | 500 | 100% | 9.3 | 60 | 276 | 34 |
| Mac | 75 | 68 | 204 | 60 | 53 | 53 | 748 | 100% | 22.2 | 59 | 293 | 50 |
| Mac | 82 | 34 | 102 | 60 | 53 | 31 | 882 | 100% | 13.8 | 39 | 325 | 513 |
| Mac | 88 | 13 | 36 | 60 | 56 | 53 | 815 | 100% | 33.9 | 66 | 484 | 182 |
| other | 70 | 41 | 123 | 60 | 30 | 20 | 517 | 50% | 185.3 | 54 | 700 | 302 |
| other | 71 | 34 | 102 | 60 | 30 | 20 | 884 | 50% | 240.3 | 68 | 658 | 419 |
| other | 75 | 64 | 192 | 60 | 30 | 20 | 984 | 50% | 402.8 | 66 | 548 | 1011 |
| other | 82 | 36 | 108 | 60 | 30 | 20 | 751 | 50% | 212.6 | 67 | 366 | 238 |
| other | 88 | 11 | 35 | 60 | 30 | 20 | 801 | 50% | 177.4 | 78 | 836 | 33 |

### Regression check (newest build vs previous, per device)

- **REGRESSION** Mac: build 82 -> 88: slow s/h 13.8 -> 33.9; stuck/h 39.0 -> 66.2; physics catches/h 325.2 -> 483.5
- **REGRESSION** other: build 82 -> 88: physics catches/h 366.1 -> 835.7

- slow moments by cause (seconds): the game step (physics/AI) is the slow part: 1732.9; preparing the drawing (draw calls) is the slow part: 891.7; waiting on the graphics chip (fewer pixels/effects would help): 125.9
- slow incidents by cause × quality × match phase (seconds): the game step (physics/AI) is the slow part · q7 · 0-5 min: 1685.1; preparing the drawing (draw calls) is the slow part · q7 · 0-5 min: 783.0; waiting on the graphics chip (fewer pixels/effects would help) · q0 · 0-5 min: 63.7; preparing the drawing (draw calls) is the slow part · q4 · 0-5 min: 31.7; waiting on the graphics chip (fewer pixels/effects would help) · q7 · 0-5 min: 31.5; preparing the drawing (draw calls) is the slow part · q5 · 0-5 min: 28.8; the game step (physics/AI) is the slow part · q0 · 0-5 min: 16.1; preparing the drawing (draw calls) is the slow part · q6 · 0-5 min: 14.3; preparing the drawing (draw calls) is the slow part · q0 · 0-5 min: 12.5; waiting on the graphics chip (fewer pixels/effects would help) · q6 · 0-5 min: 12.3; preparing the drawing (draw calls) is the slow part · q3 · 0-5 min: 9.8; waiting on the graphics chip (fewer pixels/effects would help) · q4 · 0-5 min: 8.6; preparing the drawing (draw calls) is the slow part · q1 · 0-5 min: 8.3; the game step (physics/AI) is the slow part · q2 · 0-5 min: 6.6; the game step (physics/AI) is the slow part · q7 · 5-15 min: 6.1; the game step (physics/AI) is the slow part · q6 · 0-5 min: 5.1; the game step (physics/AI) is the slow part · q3 · 0-5 min: 5.0; the game step (physics/AI) is the slow part · q5 · 0-5 min: 4.7; waiting on the graphics chip (fewer pixels/effects would help) · q0 · 15+ min: 4.1; preparing the drawing (draw calls) is the slow part · q2 · 0-5 min: 3.3; the game step (physics/AI) is the slow part · q1 · 0-5 min: 3.2; waiting on the graphics chip (fewer pixels/effects would help) · q2 · 0-5 min: 2.3; waiting on the graphics chip (fewer pixels/effects would help) · q1 · 0-5 min: 1.5; the game step (physics/AI) is the slow part · q4 · 0-5 min: 1; waiting on the graphics chip (fewer pixels/effects would help) · q3 · 0-5 min: 1; waiting on the graphics chip (fewer pixels/effects would help) · q5 · 0-5 min: 0.9
- worst slow incidents: t106s: 12.3s at 15 fps (worst 350 ms) q6 · 206 particles, 0 fires, 0 blasts · worst frame 350 ms: physics 9, render 6, hud 1, effects 1 · 334 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t123s: 11.9s at 23 fps (worst 83 ms) q7 · 534 particles, 9 fires, 1 blasts · worst frame 83 ms: physics 18, render 15, ai 1, hud 1, lod 1, cars 1 · 46 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t111s: 10.7s at 21 fps (worst 83 ms) q5 · 80 particles, 0 fires, 0 blasts · worst frame 83 ms: render 9536, physics 11, hud 3, cars 2, effects 1; t5s: 10.1s at 16 fps (worst 334 ms) q4 · 70 particles, 0 fires, 0 blasts · worst frame 334 ms: render 11, physics 6, cars 1, ai 1 · 316 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t5s: 9.3s at 15 fps (worst 200 ms) q4 · 299 particles, 0 fires, 0 blasts · worst frame 200 ms: physics 11, render 10, cars 1, effects 1 · 178 ms outside the game code (graphics chip, garbage collection, shader compile or the browser)

## Stuck hotspots

- (38, -96): 76× · 425.5 s · combine 19, bertha 14, firetruck 14, tanker 11, tiger 8 · touching: debris, wall, ground
- (-107, -95): 44× · 303.5 s · bertha 10, mixer 9, tanker 6, forklift 6, firetruck 3 · touching: wall, debris, ground
- (37, -107): 51× · 271.0 s · combine 22, forklift 5, firetruck 5, bertha 4, dozer 4 · touching: wall, combine, debris
- (0, 37): 34× · 180.5 s · firetruck 7, combine 7, tanker 7, bertha 4, dozer 3 · touching: mixer, ground, tanker
- (99, -144): 15× · 141.0 s · mixer 5, bertha 3, firetruck 3, cruiser 1, tanker 1 · touching: bertha, wall, forklift
- (-10, 33): 24× · 135.0 s · mixer 8, firetruck 5, tanker 4, combine 3, outrider 1 · touching: wall, ground, bertha
- (-11, 27): 21× · 129.5 s · mixer 8, firetruck 4, combine 3, tanker 2, viper 1 · touching: wall, debris, ground
- (99, -61): 23× · 128.0 s · bertha 9, camper 3, firetruck 3, mixer 2, tiger 2 · touching: wall, ground, debris
- (96, -70): 23× · 116.5 s · firetruck 5, bertha 4, dozer 3, cruiser 2, sandflea 2 · touching: wall, ground
- (-109, -86): 15× · 114.0 s · combine 6, forklift 4, bertha 3, outrider 1, mixer 1 · touching: combine, wall, debris
- (-118, -94): 17× · 112.5 s · combine 5, tanker 3, mixer 3, viper 2, firetruck 2 · touching: wall, debris, combine
- (106, -145): 11× · 104.0 s · outrider 5, hellbender 3, viper 2, forklift 1 · touching: ground, wall
- total 1388 stuck events, 7802.5 s, over 1409.6 game-minutes (59.1 per hour)

## Physics safety-net catches

- totals (full census): blowups 9594, fixes 2090040, clamps 82623, undos 8567, escapes 10, launches 43, rescues 10, below 27, nan 0 · safety-net work: fixes 2090040 (88963/h), clamps 82623 (3517/h) · kinds (census): solver kick undone 8567, blow-up clamped 1027, escaped the arena, put back 10, fell through floor, lifted back 10
- by vehicle (listed catches only — the game lists at most 40 per match, so this is a capped sample): Outrider 1506, Sandflea 907, Viper 744, Tow Truck 654, bull 625, Forklift 527, Cruiser 520, Hellbender 492 · listed kinds: solver kick undone 6206, blow-up clamped 922, escaped the arena, put back 10, fell through floor, lifted back 9

- catch locations (listed catches with a position, same 12 m grid as stuck — do the two maps agree?): (97, 87): 263× · solver kick undone 263; (97, 92): 248× · solver kick undone 247, fell through floor, lifted back 1; (84, -60): 142× · solver kick undone 141, fell through floor, lifted back 1; (95, -52): 137× · solver kick undone 137; (110, -83): 127× · solver kick undone 127; (108, -60): 126× · solver kick undone 126; (95, -58): 120× · solver kick undone 120; (116, -71): 116× · solver kick undone 116
## Balance (all real matches)

| vehicle | lives | kills | deaths | K/D | dmg/life | taken/life | avg life s | fires |
|---|---|---|---|---|---|---|---|---|
| dozer | 938 | 1744 | 681 | 2.56 | 141 | 91 | 49 | 5099 |
| bertha | 860 | 1452 | 570 | 2.55 | 295 | 85 | 55 | 3443 |
| combine | 941 | 996 | 653 | 1.53 | 87 | 83 | 48 | 1799 |
| mixer | 1024 | 700 | 752 | 0.93 | 48 | 88 | 43 | 1657 |
| tanker | 1026 | 719 | 798 | 0.9 | 41 | 91 | 36 | 1130 |
| hellbender | 1084 | 666 | 910 | 0.73 | 112 | 97 | 35 | 52937 |
| forklift | 1054 | 591 | 841 | 0.7 | 31 | 92 | 36 | 1349 |
| firetruck | 1042 | 516 | 770 | 0.67 | 40 | 89 | 46 | 3489 |
| towtruck | 1096 | 582 | 876 | 0.66 | 31 | 94 | 35 | 2134 |
| cruiser | 1108 | 551 | 961 | 0.57 | 58 | 96 | 29 | 6624 |
| outrider | 1230 | 387 | 1088 | 0.36 | 39 | 97 | 24 | 4952 |
| camper | 1183 | 318 | 1052 | 0.3 | 24 | 97 | 22 | 1938 |
| sandflea | 1273 | 279 | 1175 | 0.24 | 38 | 98 | 17 | 1386 |
| viper | 1287 | 265 | 1144 | 0.23 | 37 | 97 | 25 | 3569 |
| tiger | 560 | 94 | 510 | 0.18 | 202 | 93 | 31 | 3885 |

## Matchups (build 88): who wrecks whom

- dozer wrecked outrider: 12× · 788 damage
- dozer wrecked tanker: 11× · 554 damage
- combine wrecked hellbender: 10× · 687 damage
- dozer wrecked combine: 8× · 584 damage
- dozer wrecked mixer: 8× · 473 damage
- forklift wrecked outrider: 8× (7 dragged into a hazard) · 458 damage
- dozer wrecked towtruck: 8× · 499 damage
- dozer wrecked cruiser: 7× · 389 damage
- bertha wrecked outrider: 7× · 882 damage
- bertha wrecked tanker: 7× · 766 damage
- tanker wrecked sandflea: 7× · 315 damage
- hellbender wrecked viper: 6× · 661 damage
- bertha wrecked mixer: 6× · 740 damage
- dozer wrecked viper: 6× · 439 damage
- dozer wrecked firetruck: 6× · 403 damage

## Voice variety (build 88, 26 matches)

- 473 lines heard; 0% were repeats within the same match, 21% repeats of a line already heard this session
- per character (lines heard / distinct): Maxine MacTavish 46/45, Big Bertha 45/45, Dom 42/42, Rocket Raju 36/36, Sheriff Buck 35/35, Tony Cement 32/32, Cletus 32/32, Bulldozer Bob 31/31, Ragnar Rustbeard 29/28, Papa Jacques 27/27, Captain McCaffrey 26/26, Uncle Bogdan 24/24, King Arthur 22/22, Jesse 17/17, Mr. White 12/12, Oberst Klaus 10/10
- most repeated lines: Maxine MacTavish: Ma motor's on fire! Somebody fetch a bucket! An' a s ×2; Ragnar Rustbeard: Spin the war-drums! FIRE! ×2

## Voices, errors, network

- Android: voice failures 0 over 1 matches · lines sent 26, started 19, errors 7
- Mac: voice failures 355 over 272 matches · lines sent 16, started 0, errors 7 (engine never started)
- other: voice failures 14 over 188 matches · lines sent 1, started 0, errors 1 (engine never started)
- errors & incidents (in and out of matches): 5× voice: voices: stuck - # lines asked for, engine busy # s and none started (last voice default, # voices, spea; 2× voice: voices: stuck - still busy # s after the tab came back from # s in the background (last voice default, ; 2× voice: voices: # recorded clips loaded (# voices)
- network incidents: 10

## Autoplay

- 453 matches, 1306.9 game-minutes · endings: autoplay round done 418, autoplay stopped 23, checkpoint: every # min 8, page closed mid-match 3, checkpoint: voice failure 1
- 4 autoplay matches spent time hidden (stats from those stretches are excluded from build 67)

## Bug reports

- 1794706963-lliE33pDU7vD-bug-b68-web-2026-11-15T01-42-43-652Z · {"code":40401,"http":404,"error":"page not found"}
- 1794725414-tgRRYQWpPVYF-bug-b69-web-2026-11-15T06-50-14-834Z · {"code":40401,"http":404,"error":"page not found"}
- 1794725451-7bKoH5NiFJwx-bug-b69-web-2026-11-15T06-50-50-843Z · {"code":40401,"http":404,"error":"page not found"}
- 1794725479-21679ipLjuMa-bug-b69-web-2026-11-15T06-51-18-901Z · {"code":40401,"http":404,"error":"page not found"}
- 1794727632-OgV59iRq3qG4-bug-b70-web-2026-11-15T07-27-12-098Z · {"code":40401,"http":404,"error":"page not found"}
- 1794762450-qP4SGsaf1ReF-bug-b88-web-2026-11-15T17-07-29-004Z · SCRAPYARD DERBY BUG REPORT · build 88 · 2026-11-15T17:07:28.909Z · jools314.github.io
- 1794762454-YXtovFkBoLSJ-bug-b88-web-2026-11-15T17-07-33-490Z · SCRAPYARD DERBY BUG REPORT · build 88 · 2026-11-15T17:07:33.426Z · jools314.github.io

## Changes since the previous report

- new stuck hotspot at (38,-96) ×76
- new stuck hotspot at (-107,-95) ×44
- new stuck hotspot at (37,-107) ×51
- new stuck hotspot at (0,37) ×34
- new stuck hotspot at (99,-144) ×15
- new stuck hotspot at (-10,33) ×24
- new stuck hotspot at (-11,27) ×21
- new stuck hotspot at (99,-61) ×23
- new stuck hotspot at (96,-70) ×23
- new stuck hotspot at (-109,-86) ×15
- new stuck hotspot at (-118,-94) ×17
- new stuck hotspot at (106,-145) ×11
- physics catches up for Camper: 27 → 379
- physics catches up for bull: 52 → 625
- physics catches up for Tow Truck: 31 → 654
- physics catches up for Outrider: 80 → 1506
- physics catches up for Cruiser: 33 → 520
- physics catches up for Hellbender: 59 → 492
- physics catches up for Forklift: 59 → 527
- physics catches up for Viper: 45 → 744
- physics catches up for Sandflea: 71 → 907
- physics catches up for Big Bertha: 6 → 75
- physics catches up for Mixer: 4 → 119
- physics catches up for Tanker: 30 → 273
- physics catches up for Fire Truck: 3 → 249
- physics catches up for Combine: 2 → 52
- physics catches up for Bulldozer: 0 → 20
- first data from build 88
