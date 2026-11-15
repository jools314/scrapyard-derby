# Scrapyard Derby play-log report · 2026-11-15 20:39 UTC

518 matches (507 from real devices, 1550.9 game-minutes), 40 page loads, 8 bug reports.

## Who and what

- other · build 90 · autoplay: 17 matches
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
- **Mac**: fps median 60, typical 1% low 53, worst frame 983 ms · quality 0, res 100% · 271 matches · 986 s throttled/hidden (excluded)
- **other**: fps median 60, typical 1% low 20, worst frame 984 ms · quality 7, res 50% · 231 matches · 2453 s throttled/hidden (excluded)
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
| Mac | 88 | 14 | 44 | 60 | 56 | 53 | 815 | 100% | 43.5 | 78 | 420 | 205 |
| other | 70 | 41 | 123 | 60 | 30 | 20 | 517 | 50% | 185.3 | 54 | 700 | 302 |
| other | 71 | 34 | 102 | 60 | 30 | 20 | 884 | 50% | 240.3 | 68 | 658 | 419 |
| other | 75 | 64 | 192 | 60 | 30 | 20 | 984 | 50% | 402.8 | 66 | 548 | 1011 |
| other | 82 | 36 | 108 | 60 | 30 | 20 | 751 | 50% | 212.6 | 67 | 366 | 238 |
| other | 88 | 24 | 75 | 60 | 30 | 20 | 867 | 50% | 572.6 | 65 | 626 | 150 |
| other | 89 | 15 | 45 | 60 | 30 | 20 | 834 | 50% | 113.5 | 51 | 496 | 163 |
| other | 90 | 17 | 48 | 60 | 30 | 20 | 417 | 50% | 248.5 | 89 | 376 | 170 |

### Regression check (newest build vs previous, per device)

- **REGRESSION** Mac: build 82 -> 88: slow s/h 13.8 -> 43.5; stuck/h 39.0 -> 78.3; physics catches/h 325.2 -> 420.0
- **REGRESSION** other: build 89 -> 90: slow s/h 113.5 -> 248.5; stuck/h 50.7 -> 89.1

- slow moments by cause (seconds): the game step (physics/AI) is the slow part: 1988.9; preparing the drawing (draw calls) is the slow part: 1542.6; waiting on the graphics chip (fewer pixels/effects would help): 127.0
- slow incidents by cause × quality × match phase (seconds): the game step (physics/AI) is the slow part · q7 · 0-5 min: 1929.4; preparing the drawing (draw calls) is the slow part · q7 · 0-5 min: 1420.3; waiting on the graphics chip (fewer pixels/effects would help) · q0 · 0-5 min: 63.7; preparing the drawing (draw calls) is the slow part · q4 · 0-5 min: 41.1; waiting on the graphics chip (fewer pixels/effects would help) · q7 · 0-5 min: 32.6; preparing the drawing (draw calls) is the slow part · q5 · 0-5 min: 29.9; the game step (physics/AI) is the slow part · q0 · 0-5 min: 27.8; preparing the drawing (draw calls) is the slow part · q6 · 0-5 min: 17.4; preparing the drawing (draw calls) is the slow part · q0 · 0-5 min: 12.5; waiting on the graphics chip (fewer pixels/effects would help) · q6 · 0-5 min: 12.3; preparing the drawing (draw calls) is the slow part · q3 · 0-5 min: 9.8; waiting on the graphics chip (fewer pixels/effects would help) · q4 · 0-5 min: 8.6; preparing the drawing (draw calls) is the slow part · q1 · 0-5 min: 8.3; the game step (physics/AI) is the slow part · q2 · 0-5 min: 6.6; the game step (physics/AI) is the slow part · q7 · 5-15 min: 6.1; the game step (physics/AI) is the slow part · q6 · 0-5 min: 5.1; the game step (physics/AI) is the slow part · q3 · 0-5 min: 5.0; the game step (physics/AI) is the slow part · q5 · 0-5 min: 4.7; waiting on the graphics chip (fewer pixels/effects would help) · q0 · 15+ min: 4.1; preparing the drawing (draw calls) is the slow part · q2 · 0-5 min: 3.3; the game step (physics/AI) is the slow part · q1 · 0-5 min: 3.2; waiting on the graphics chip (fewer pixels/effects would help) · q2 · 0-5 min: 2.3; waiting on the graphics chip (fewer pixels/effects would help) · q1 · 0-5 min: 1.5; the game step (physics/AI) is the slow part · q4 · 0-5 min: 1; waiting on the graphics chip (fewer pixels/effects would help) · q3 · 0-5 min: 1; waiting on the graphics chip (fewer pixels/effects would help) · q5 · 0-5 min: 0.9
- worst slow incidents: t106s: 12.3s at 15 fps (worst 350 ms) q6 · 206 particles, 0 fires, 0 blasts · worst frame 350 ms: physics 9, render 6, hud 1, effects 1 · 334 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t123s: 11.9s at 23 fps (worst 83 ms) q7 · 534 particles, 9 fires, 1 blasts · worst frame 83 ms: physics 18, render 15, ai 1, hud 1, lod 1, cars 1 · 46 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t18s: 11.7s at 13 fps (worst 117 ms) q0 · 121 particles, 0 fires, 0 blasts · worst frame 117 ms: render 81, physics 20, cars 10; t111s: 10.7s at 21 fps (worst 83 ms) q5 · 80 particles, 0 fires, 0 blasts · worst frame 83 ms: render 9536, physics 11, hud 3, cars 2, effects 1; t5s: 10.1s at 16 fps (worst 334 ms) q4 · 70 particles, 0 fires, 0 blasts · worst frame 334 ms: render 11, physics 6, cars 1, ai 1 · 316 ms outside the game code (graphics chip, garbage collection, shader compile or the browser)

## Stuck hotspots

- (38, -96): 81× · 452.5 s · combine 20, bertha 15, firetruck 14, tanker 11, tiger 8 · touching: wall, debris, ground
- (-107, -95): 52× · 353.5 s · mixer 12, bertha 10, tanker 8, forklift 8, firetruck 3 · touching: wall, debris, ground
- (37, -107): 55× · 300.5 s · combine 24, firetruck 6, forklift 5, mixer 5, bertha 4 · touching: wall, combine, bertha
- (1, 37): 37× · 195.5 s · firetruck 7, combine 7, tanker 7, bertha 6, dozer 3 · touching: mixer, ground, tanker
- (-118, -94): 26× · 165.0 s · combine 7, mixer 6, tanker 4, viper 2, forklift 2 · touching: wall, debris, combine
- (-94, -144): 14× · 152.5 s · firetruck 4, tanker 2, hellbender 2, mixer 2, cruiser 2 · touching: wall, debris, ground
- (99, -144): 15× · 141.0 s · mixer 5, bertha 3, firetruck 3, cruiser 1, tanker 1 · touching: bertha, wall, forklift
- (-109, -87): 20× · 137.5 s · combine 8, forklift 5, bertha 3, outrider 1, mixer 1 · touching: wall, combine, debris
- (-10, 33): 24× · 135.0 s · mixer 8, firetruck 5, tanker 4, combine 3, outrider 1 · touching: wall, ground, bertha
- (-11, 27): 22× · 133.5 s · mixer 8, firetruck 4, combine 4, tanker 2, viper 1 · touching: wall, debris, ground
- (96, -71): 25× · 129.5 s · firetruck 5, bertha 4, dozer 3, forklift 3, cruiser 2 · touching: wall, ground
- (99, -61): 23× · 128.0 s · bertha 9, camper 3, firetruck 3, mixer 2, tiger 2 · touching: wall, ground, debris
- total 1540 stuck events, 8724.0 s, over 1550.9 game-minutes (59.6 per hour)

## Physics safety-net catches

- totals (full census): blowups 10579, fixes 2299563, clamps 90211, undos 9484, escapes 13, launches 50, rescues 10, below 27, nan 0 · safety-net work: fixes 2299563 (88964/h), clamps 90211 (3490/h) · kinds (census): solver kick undone 9484, blow-up clamped 1095, escaped the arena, put back 13, fell through floor, lifted back 10
- by vehicle (listed catches only — the game lists at most 40 per match, so this is a capped sample): Outrider 1607, Sandflea 992, Viper 818, Tow Truck 743, bull 678, Cruiser 569, Forklift 568, Hellbender 538 · listed kinds: solver kick undone 6814, blow-up clamped 981, escaped the arena, put back 13, fell through floor, lifted back 9

- catch locations (listed catches with a position, same 12 m grid as stuck — do the two maps agree?): (97, 87): 284× · solver kick undone 284; (97, 92): 275× · solver kick undone 274, fell through floor, lifted back 1; (108, -60): 230× · solver kick undone 230; (116, -71): 162× · solver kick undone 162; (84, -60): 142× · solver kick undone 141, fell through floor, lifted back 1; (95, -52): 137× · solver kick undone 137; (109, -84): 134× · solver kick undone 134; (95, -58): 128× · solver kick undone 128
## Balance (all real matches)

| vehicle | lives | kills | deaths | K/D | dmg/life | taken/life | avg life s | fires |
|---|---|---|---|---|---|---|---|---|
| dozer | 1027 | 1894 | 743 | 2.55 | 140 | 90 | 49 | 5577 |
| bertha | 940 | 1593 | 626 | 2.54 | 294 | 86 | 55 | 3791 |
| combine | 1046 | 1106 | 726 | 1.52 | 87 | 83 | 48 | 2038 |
| mixer | 1120 | 767 | 816 | 0.94 | 48 | 87 | 43 | 1808 |
| tanker | 1128 | 807 | 883 | 0.91 | 42 | 91 | 36 | 1226 |
| hellbender | 1199 | 737 | 1009 | 0.73 | 112 | 97 | 35 | 57917 |
| forklift | 1167 | 650 | 931 | 0.7 | 31 | 92 | 36 | 1474 |
| towtruck | 1210 | 661 | 969 | 0.68 | 32 | 94 | 35 | 2398 |
| firetruck | 1140 | 566 | 843 | 0.67 | 40 | 89 | 45 | 3817 |
| cruiser | 1223 | 609 | 1060 | 0.57 | 58 | 96 | 28 | 7269 |
| outrider | 1354 | 423 | 1198 | 0.35 | 39 | 97 | 23 | 5384 |
| camper | 1288 | 340 | 1147 | 0.3 | 23 | 97 | 22 | 2096 |
| sandflea | 1403 | 298 | 1293 | 0.23 | 38 | 98 | 16 | 1534 |
| viper | 1412 | 284 | 1257 | 0.23 | 38 | 97 | 25 | 3879 |
| tiger | 619 | 106 | 561 | 0.19 | 205 | 93 | 31 | 4276 |

## Matchups (build 90): who wrecks whom

- dozer wrecked forklift: 9× · 523 damage
- bertha wrecked hellbender: 8× · 1063 damage
- bertha wrecked forklift: 7× · 773 damage
- dozer wrecked combine: 6× · 346 damage
- dozer wrecked cruiser: 6× · 239 damage
- bertha wrecked firetruck: 6× · 824 damage
- bertha wrecked outrider: 6× · 856 damage
- forklift wrecked viper: 5× (4 dragged into a hazard) · 301 damage
- tanker wrecked viper: 5× · 301 damage
- combine wrecked cruiser: 5× · 203 damage
- dozer wrecked bertha: 5× · 420 damage
- bertha wrecked towtruck: 5× · 797 damage
- combine wrecked outrider: 5× · 380 damage
- bertha wrecked mixer: 5× · 770 damage
- hellbender wrecked tiger: 4× · 303 damage

## Voice variety (build 90, 17 matches)

- 288 lines heard; 0% were repeats within the same match, 30% repeats of a line already heard this session
- per character (lines heard / distinct): Big Bertha 33/32, Papa Jacques 31/31, Ragnar Rustbeard 28/28, Tony Cement 28/28, Rocket Raju 22/22, Sheriff Buck 20/20, Uncle Bogdan 20/20, Captain McCaffrey 20/20, King Arthur 19/19, Maxine MacTavish 17/17, Bulldozer Bob 12/12, Cletus 11/11, Dom 10/10, Oberst Klaus 7/7, Jesse 5/5, Mr. White 3/3
- most repeated lines: Big Bertha: Oh my stars, I'm hotter than a church picnic in July! ×2

## Voices, errors, network

- Android: voice failures 0 over 1 matches · lines sent 26, started 19, errors 7
- Mac: voice failures 359 over 273 matches · lines sent 16, started 0, errors 7 (engine never started)
- other: voice failures 17 over 233 matches · lines sent 1, started 0, errors 1 (engine never started)
- errors & incidents (in and out of matches): 6× voice: voices: stuck - # lines asked for, engine busy # s and none started (last voice default, # voices, spea; 2× voice: voices: stuck - still busy # s after the tab came back from # s in the background (last voice default, ; 2× voice: voices: # recorded clips loaded (# voices)
- network incidents: 10

## Autoplay

- 497 matches, 1435.6 game-minutes · endings: autoplay round done 460, autoplay stopped 24, checkpoint: every # min 8, page closed mid-match 3, checkpoint: voice failure 1, checkpoint: stuck car 1
- 4 autoplay matches spent time hidden (stats from those stretches are excluded from build 67)

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

- physics catches up for Camper: 393 → 407
- physics catches up for bull: 667 → 678
- physics catches up for Tow Truck: 686 → 743
- physics catches up for Outrider: 1579 → 1607
- physics catches up for Cruiser: 533 → 569
- physics catches up for Hellbender: 521 → 538
- physics catches up for Forklift: 552 → 568
- physics catches up for Viper: 799 → 818
- physics catches up for Sandflea: 968 → 992
- physics catches up for Mixer: 129 → 136
- physics catches up for Tanker: 281 → 287
- physics catches up for Fire Truck: 297 → 303
- first data from build 90
