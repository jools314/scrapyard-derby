# Scrapyard Derby play-log report · 2026-11-16 00:40 UTC

571 matches (559 from real devices, 1702.1 game-minutes), 44 page loads, 8 bug reports.

## Who and what

- Mac · build 91 · autoplay: 5 matches
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
- **Mac**: fps median 60, typical 1% low 53, worst frame 983 ms · quality 0, res 100% · 276 matches · 1006 s throttled/hidden (excluded)
- **other**: fps median 60, typical 1% low 20, worst frame 984 ms · quality 7, res 50% · 278 matches · 2905 s throttled/hidden (excluded)
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
| Mac | 88 | 14 | 44 | 60 | 56 | 53 | 815 | 100% | 43.5 | 78 | 420 | 207 |
| Mac | 91 | 5 | 10 | 60 | 55 | 53 | 933 | 100% | 5.9 | 24 | 160 | 18 |
| other | 70 | 41 | 123 | 60 | 30 | 20 | 517 | 50% | 185.3 | 54 | 700 | 302 |
| other | 71 | 34 | 102 | 60 | 30 | 20 | 884 | 50% | 240.3 | 68 | 658 | 419 |
| other | 75 | 64 | 192 | 60 | 30 | 20 | 984 | 50% | 402.8 | 66 | 548 | 1011 |
| other | 82 | 36 | 108 | 60 | 30 | 20 | 751 | 50% | 212.6 | 67 | 366 | 238 |
| other | 88 | 24 | 75 | 60 | 30 | 20 | 867 | 50% | 572.6 | 65 | 626 | 150 |
| other | 89 | 15 | 45 | 60 | 30 | 20 | 834 | 50% | 113.5 | 51 | 496 | 163 |
| other | 90 | 48 | 144 | 60 | 30 | 15 | 717 | 50% | 349.9 | 75 | 476 | 486 |
| other | 91 | 16 | 46 | 60 | 30 | 20 | 984 | 50% | 221.0 | 55 | 398 | 136 |

### Regression check (newest build vs previous, per device)

- Mac: build 91 has only 10.1 game-min (need 30) — not judged yet
- OK other: build 90 -> 91 (fps low 15->20, stuck/h 75.4->55.3, phys/h 476.2->397.8)

- slow moments by cause (seconds): the game step (physics/AI) is the slow part: 2609.9; preparing the drawing (draw calls) is the slow part: 1727.2; waiting on the graphics chip (fewer pixels/effects would help): 129.1
- slow incidents by cause × quality × match phase (seconds): the game step (physics/AI) is the slow part · q7 · 0-5 min: 2549.4; preparing the drawing (draw calls) is the slow part · q7 · 0-5 min: 1589.5; waiting on the graphics chip (fewer pixels/effects would help) · q0 · 0-5 min: 63.7; preparing the drawing (draw calls) is the slow part · q5 · 0-5 min: 43.6; preparing the drawing (draw calls) is the slow part · q4 · 0-5 min: 41.1; waiting on the graphics chip (fewer pixels/effects would help) · q7 · 0-5 min: 34.7; the game step (physics/AI) is the slow part · q0 · 0-5 min: 28.8; preparing the drawing (draw calls) is the slow part · q6 · 0-5 min: 19.1; preparing the drawing (draw calls) is the slow part · q0 · 0-5 min: 12.5; waiting on the graphics chip (fewer pixels/effects would help) · q6 · 0-5 min: 12.3; preparing the drawing (draw calls) is the slow part · q3 · 0-5 min: 9.8; waiting on the graphics chip (fewer pixels/effects would help) · q4 · 0-5 min: 8.6; preparing the drawing (draw calls) is the slow part · q1 · 0-5 min: 8.3; the game step (physics/AI) is the slow part · q2 · 0-5 min: 6.6; the game step (physics/AI) is the slow part · q7 · 5-15 min: 6.1; the game step (physics/AI) is the slow part · q6 · 0-5 min: 5.1; the game step (physics/AI) is the slow part · q3 · 0-5 min: 5.0; the game step (physics/AI) is the slow part · q5 · 0-5 min: 4.7; waiting on the graphics chip (fewer pixels/effects would help) · q0 · 15+ min: 4.1; preparing the drawing (draw calls) is the slow part · q2 · 0-5 min: 3.3; the game step (physics/AI) is the slow part · q1 · 0-5 min: 3.2; waiting on the graphics chip (fewer pixels/effects would help) · q2 · 0-5 min: 2.3; waiting on the graphics chip (fewer pixels/effects would help) · q1 · 0-5 min: 1.5; the game step (physics/AI) is the slow part · q4 · 0-5 min: 1; waiting on the graphics chip (fewer pixels/effects would help) · q3 · 0-5 min: 1; waiting on the graphics chip (fewer pixels/effects would help) · q5 · 0-5 min: 0.9
- worst slow incidents: t106s: 12.3s at 15 fps (worst 350 ms) q6 · 206 particles, 0 fires, 0 blasts · worst frame 350 ms: physics 9, render 6, hud 1, effects 1 · 334 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t123s: 11.9s at 23 fps (worst 83 ms) q7 · 534 particles, 9 fires, 1 blasts · worst frame 83 ms: physics 18, render 15, ai 1, hud 1, lod 1, cars 1 · 46 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t18s: 11.7s at 13 fps (worst 117 ms) q0 · 121 particles, 0 fires, 0 blasts · worst frame 117 ms: render 81, physics 20, cars 10; t6s: 11.2s at 18 fps (worst 367 ms) q5 · 183 particles, 0 fires, 0 blasts · worst frame 367 ms: render 9, physics 8, hud 1, cars 1 · 348 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t111s: 10.7s at 21 fps (worst 83 ms) q5 · 80 particles, 0 fires, 0 blasts · worst frame 83 ms: render 9536, physics 11, hud 3, cars 2, effects 1

## Stuck hotspots

- (38, -96): 88× · 493.5 s · combine 22, bertha 18, firetruck 14, tanker 11, tiger 8 · touching: wall, debris, ground
- (-107, -95): 53× · 358.0 s · mixer 12, bertha 11, tanker 8, forklift 8, firetruck 3 · touching: wall, debris, ground
- (37, -107): 59× · 322.0 s · combine 26, firetruck 6, forklift 5, mixer 5, bertha 4 · touching: wall, combine, bertha
- (1, 37): 41× · 213.5 s · bertha 8, firetruck 7, combine 7, tanker 7, dozer 4 · touching: mixer, ground, tanker
- (-118, -94): 26× · 165.0 s · combine 7, mixer 6, tanker 4, viper 2, forklift 2 · touching: wall, debris, combine
- (-94, -144): 15× · 157.0 s · firetruck 4, tanker 2, hellbender 2, mixer 2, cruiser 2 · touching: wall, ground, debris
- (99, -144): 16× · 145.5 s · mixer 5, bertha 4, firetruck 3, cruiser 1, tanker 1 · touching: bertha, mixer, wall
- (96, -71): 28× · 143.0 s · firetruck 8, bertha 4, dozer 3, forklift 3, cruiser 2 · touching: wall, ground
- (-10, 33): 25× · 139.0 s · mixer 9, firetruck 5, tanker 4, combine 3, outrider 1 · touching: wall, ground, bertha
- (-109, -87): 20× · 137.5 s · combine 8, forklift 5, bertha 3, outrider 1, mixer 1 · touching: wall, combine, debris
- (-11, 27): 22× · 133.5 s · mixer 8, firetruck 4, combine 4, tanker 2, viper 1 · touching: wall, debris, ground
- (24, -14): 26× · 133.0 s · combine 7, tanker 6, mixer 3, firetruck 3, towtruck 2 · touching: wall, ground, mixer
- total 1695 stuck events, 9562.0 s, over 1702.1 game-minutes (59.7 per hour)

## Physics safety-net catches

- totals (full census): blowups 11747, fixes 2533151, clamps 99082, undos 10559, escapes 14, launches 61, rescues 10, below 27, nan 0 · safety-net work: fixes 2533151 (89295/h), clamps 99082 (3493/h) · kinds (census): solver kick undone 10559, blow-up clamped 1188, escaped the arena, put back 14, fell through floor, lifted back 10
- by vehicle (listed catches only — the game lists at most 40 per match, so this is a capped sample): Outrider 1757, Sandflea 1041, Viper 894, Tow Truck 798, bull 713, Cruiser 658, Forklift 637, Hellbender 608 · listed kinds: solver kick undone 7517, blow-up clamped 1054, escaped the arena, put back 14, fell through floor, lifted back 9

- catch locations (listed catches with a position, same 12 m grid as stuck — do the two maps agree?): (97, 92): 299× · solver kick undone 298, fell through floor, lifted back 1; (97, 87): 296× · solver kick undone 296; (108, -60): 248× · solver kick undone 248; (116, -71): 175× · solver kick undone 175; (95, -58): 157× · solver kick undone 157; (96, -52): 155× · solver kick undone 155; (109, -84): 150× · solver kick undone 150; (84, -60): 147× · solver kick undone 146, fell through floor, lifted back 1
## Balance (all real matches)

| vehicle | lives | kills | deaths | K/D | dmg/life | taken/life | avg life s | fires |
|---|---|---|---|---|---|---|---|---|
| bertha | 1031 | 1733 | 682 | 2.54 | 294 | 86 | 55 | 4146 |
| dozer | 1128 | 2065 | 816 | 2.53 | 140 | 90 | 49 | 6157 |
| combine | 1156 | 1264 | 812 | 1.56 | 88 | 84 | 48 | 2280 |
| mixer | 1234 | 838 | 900 | 0.93 | 48 | 87 | 43 | 2002 |
| tanker | 1248 | 891 | 974 | 0.91 | 41 | 91 | 36 | 1332 |
| hellbender | 1313 | 811 | 1104 | 0.73 | 112 | 97 | 34 | 62767 |
| towtruck | 1324 | 738 | 1056 | 0.7 | 32 | 94 | 36 | 2627 |
| forklift | 1275 | 705 | 1021 | 0.69 | 30 | 92 | 36 | 1582 |
| firetruck | 1255 | 623 | 934 | 0.67 | 40 | 89 | 45 | 4182 |
| cruiser | 1341 | 650 | 1155 | 0.56 | 57 | 96 | 28 | 7905 |
| outrider | 1490 | 457 | 1319 | 0.35 | 39 | 97 | 23 | 5935 |
| camper | 1418 | 378 | 1263 | 0.3 | 24 | 97 | 22 | 2312 |
| sandflea | 1545 | 324 | 1421 | 0.23 | 39 | 98 | 16 | 1669 |
| viper | 1541 | 312 | 1372 | 0.23 | 37 | 97 | 25 | 4168 |
| tiger | 688 | 123 | 621 | 0.2 | 208 | 93 | 31 | 4727 |

## Matchups (build 91): who wrecks whom

- bertha wrecked outrider: 8× · 1442 damage
- combine wrecked camper: 7× · 121 damage
- combine wrecked towtruck: 7× · 468 damage
- dozer wrecked towtruck: 7× · 394 damage
- combine wrecked forklift: 7× · 370 damage
- bertha wrecked firetruck: 6× · 1335 damage
- towtruck wrecked sandflea: 6× (2 dragged into a hazard) · 79 damage
- combine wrecked sandflea: 6× · 374 damage
- dozer wrecked camper: 6× · 543 damage
- tanker wrecked hellbender: 6× · 124 damage
- dozer wrecked forklift: 6× · 526 damage
- dozer wrecked firetruck: 6× · 292 damage
- bertha wrecked camper: 5× · 903 damage
- forklift wrecked towtruck: 5× (5 dragged into a hazard) · 241 damage
- dozer wrecked mixer: 5× · 406 damage

## Voice variety (build 91, 21 matches)

- 348 lines heard; 0% were repeats within the same match, 23% repeats of a line already heard this session
- per character (lines heard / distinct): Big Bertha 41/41, Papa Jacques 40/40, Sheriff Buck 26/26, Uncle Bogdan 26/26, Ragnar Rustbeard 26/26, Rocket Raju 24/23, Bulldozer Bob 22/22, Dom 21/21, Cletus 20/20, Captain McCaffrey 18/18, Maxine MacTavish 17/17, Oberst Klaus 14/14, King Arthur 13/13, Tony Cement 13/13, Mr. White 11/11, Jesse 10/10
- most repeated lines: Rocket Raju: Arre baap re! I am on fire! Like my box office! ×2

## Voices, errors, network

- Android: voice failures 0 over 1 matches · lines sent 26, started 19, errors 7
- Mac: voice failures 362 over 278 matches · lines sent 16, started 0, errors 7 (engine never started)
- other: voice failures 18 over 280 matches · lines sent 1, started 0, errors 1 (engine never started)
- errors & incidents (in and out of matches): 6× voice: voices: stuck - # lines asked for, engine busy # s and none started (last voice default, # voices, spea; 2× voice: voices: stuck - still busy # s after the tab came back from # s in the background (last voice default, ; 2× voice: voices: # recorded clips loaded (# voices)
- network incidents: 10

## Autoplay

- 549 matches, 1586.8 game-minutes · endings: autoplay round done 508, autoplay stopped 27, checkpoint: every # min 8, page closed mid-match 4, checkpoint: voice failure 1, checkpoint: slow moment 1
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

- new stuck hotspot at (24,-14) ×26
- physics catches up for Camper: 430 → 461
- physics catches up for bull: 701 → 713
- physics catches up for Tow Truck: 788 → 798
- physics catches up for Outrider: 1721 → 1757
- physics catches up for Cruiser: 622 → 658
- physics catches up for Hellbender: 580 → 608
- physics catches up for Forklift: 630 → 637
- physics catches up for Sandflea: 1032 → 1041
- physics catches up for Mixer: 137 → 144
- physics catches up for Tanker: 362 → 369
- physics catches up for Fire Truck: 318 → 335
