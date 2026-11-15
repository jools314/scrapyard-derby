# Scrapyard Derby play-log report · 2026-11-15 18:39 UTC

477 matches (466 from real devices, 1430.4 game-minutes), 38 page loads, 8 bug reports.

## Who and what

- Mac · build 88 · autoplay: 13 matches
- Mac · build 88 · solo: 1 matches
- other · build 88 · autoplay: 14 matches
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
- **other**: fps median 60, typical 1% low 20, worst frame 984 ms · quality 7, res 50% · 190 matches · 2023 s throttled/hidden (excluded)
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
| other | 88 | 15 | 48 | 60 | 30 | 20 | 867 | 50% | 168.0 | 73 | 855 | 53 |

### Regression check (newest build vs previous, per device)

- **REGRESSION** Mac: build 82 -> 88: slow s/h 13.8 -> 43.5; stuck/h 39.0 -> 78.3; physics catches/h 325.2 -> 420.0
- **REGRESSION** other: build 82 -> 88: physics catches/h 366.1 -> 854.6

- slow moments by cause (seconds): the game step (physics/AI) is the slow part: 1767.7; preparing the drawing (draw calls) is the slow part: 898.5; waiting on the graphics chip (fewer pixels/effects would help): 125.9
- slow incidents by cause × quality × match phase (seconds): the game step (physics/AI) is the slow part · q7 · 0-5 min: 1708.2; preparing the drawing (draw calls) is the slow part · q7 · 0-5 min: 789.8; waiting on the graphics chip (fewer pixels/effects would help) · q0 · 0-5 min: 63.7; preparing the drawing (draw calls) is the slow part · q4 · 0-5 min: 31.7; waiting on the graphics chip (fewer pixels/effects would help) · q7 · 0-5 min: 31.5; preparing the drawing (draw calls) is the slow part · q5 · 0-5 min: 28.8; the game step (physics/AI) is the slow part · q0 · 0-5 min: 27.8; preparing the drawing (draw calls) is the slow part · q6 · 0-5 min: 14.3; preparing the drawing (draw calls) is the slow part · q0 · 0-5 min: 12.5; waiting on the graphics chip (fewer pixels/effects would help) · q6 · 0-5 min: 12.3; preparing the drawing (draw calls) is the slow part · q3 · 0-5 min: 9.8; waiting on the graphics chip (fewer pixels/effects would help) · q4 · 0-5 min: 8.6; preparing the drawing (draw calls) is the slow part · q1 · 0-5 min: 8.3; the game step (physics/AI) is the slow part · q2 · 0-5 min: 6.6; the game step (physics/AI) is the slow part · q7 · 5-15 min: 6.1; the game step (physics/AI) is the slow part · q6 · 0-5 min: 5.1; the game step (physics/AI) is the slow part · q3 · 0-5 min: 5.0; the game step (physics/AI) is the slow part · q5 · 0-5 min: 4.7; waiting on the graphics chip (fewer pixels/effects would help) · q0 · 15+ min: 4.1; preparing the drawing (draw calls) is the slow part · q2 · 0-5 min: 3.3; the game step (physics/AI) is the slow part · q1 · 0-5 min: 3.2; waiting on the graphics chip (fewer pixels/effects would help) · q2 · 0-5 min: 2.3; waiting on the graphics chip (fewer pixels/effects would help) · q1 · 0-5 min: 1.5; the game step (physics/AI) is the slow part · q4 · 0-5 min: 1; waiting on the graphics chip (fewer pixels/effects would help) · q3 · 0-5 min: 1; waiting on the graphics chip (fewer pixels/effects would help) · q5 · 0-5 min: 0.9
- worst slow incidents: t106s: 12.3s at 15 fps (worst 350 ms) q6 · 206 particles, 0 fires, 0 blasts · worst frame 350 ms: physics 9, render 6, hud 1, effects 1 · 334 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t123s: 11.9s at 23 fps (worst 83 ms) q7 · 534 particles, 9 fires, 1 blasts · worst frame 83 ms: physics 18, render 15, ai 1, hud 1, lod 1, cars 1 · 46 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t18s: 11.7s at 13 fps (worst 117 ms) q0 · 121 particles, 0 fires, 0 blasts · worst frame 117 ms: render 81, physics 20, cars 10; t111s: 10.7s at 21 fps (worst 83 ms) q5 · 80 particles, 0 fires, 0 blasts · worst frame 83 ms: render 9536, physics 11, hud 3, cars 2, effects 1; t5s: 10.1s at 16 fps (worst 334 ms) q4 · 70 particles, 0 fires, 0 blasts · worst frame 334 ms: render 11, physics 6, cars 1, ai 1 · 316 ms outside the game code (graphics chip, garbage collection, shader compile or the browser)

## Stuck hotspots

- (38, -96): 76× · 425.5 s · combine 19, bertha 14, firetruck 14, tanker 11, tiger 8 · touching: debris, wall, ground
- (-107, -94): 48× · 335.0 s · mixer 11, bertha 10, tanker 8, forklift 6, firetruck 3 · touching: wall, debris, ground
- (37, -107): 53× · 290.0 s · combine 23, forklift 5, mixer 5, firetruck 5, bertha 4 · touching: wall, combine, bertha
- (0, 37): 34× · 180.5 s · firetruck 7, combine 7, tanker 7, bertha 4, dozer 3 · touching: mixer, ground, tanker
- (-94, -144): 13× · 148.5 s · firetruck 4, tanker 2, hellbender 2, cruiser 2, mixer 1 · touching: wall, debris, ground
- (99, -144): 15× · 141.0 s · mixer 5, bertha 3, firetruck 3, cruiser 1, tanker 1 · touching: bertha, wall, forklift
- (-10, 33): 24× · 135.0 s · mixer 8, firetruck 5, tanker 4, combine 3, outrider 1 · touching: wall, ground, bertha
- (-11, 27): 21× · 129.5 s · mixer 8, firetruck 4, combine 3, tanker 2, viper 1 · touching: wall, debris, ground
- (99, -61): 23× · 128.0 s · bertha 9, camper 3, firetruck 3, mixer 2, tiger 2 · touching: wall, ground, debris
- (-109, -86): 18× · 128.0 s · combine 8, forklift 5, bertha 3, outrider 1, mixer 1 · touching: wall, combine, debris
- (-118, -94): 18× · 119.0 s · combine 5, mixer 4, tanker 3, viper 2, firetruck 2 · touching: wall, debris, combine
- (96, -70): 23× · 116.5 s · firetruck 5, bertha 4, dozer 3, cruiser 2, sandflea 2 · touching: wall, ground
- total 1412 stuck events, 8021.0 s, over 1430.4 game-minutes (59.2 per hour)

## Physics safety-net catches

- totals (full census): blowups 9804, fixes 2120534, clamps 84003, undos 8755, escapes 11, launches 48, rescues 10, below 27, nan 0 · safety-net work: fixes 2120534 (88949/h), clamps 84003 (3524/h) · kinds (census): solver kick undone 8755, blow-up clamped 1049, escaped the arena, put back 11, fell through floor, lifted back 10
- by vehicle (listed catches only — the game lists at most 40 per match, so this is a capped sample): Outrider 1518, Sandflea 948, Viper 748, Tow Truck 659, bull 637, Forklift 537, Cruiser 521, Hellbender 494 · listed kinds: solver kick undone 6289, blow-up clamped 936, escaped the arena, put back 11, fell through floor, lifted back 9

- catch locations (listed catches with a position, same 12 m grid as stuck — do the two maps agree?): (97, 87): 263× · solver kick undone 263; (97, 92): 250× · solver kick undone 249, fell through floor, lifted back 1; (84, -60): 142× · solver kick undone 141, fell through floor, lifted back 1; (95, -52): 137× · solver kick undone 137; (110, -83): 127× · solver kick undone 127; (108, -60): 126× · solver kick undone 126; (95, -58): 120× · solver kick undone 120; (116, -71): 116× · solver kick undone 116
## Balance (all real matches)

| vehicle | lives | kills | deaths | K/D | dmg/life | taken/life | avg life s | fires |
|---|---|---|---|---|---|---|---|---|
| dozer | 949 | 1771 | 686 | 2.58 | 142 | 91 | 49 | 5163 |
| bertha | 868 | 1466 | 577 | 2.54 | 296 | 85 | 55 | 3494 |
| combine | 953 | 1013 | 662 | 1.53 | 87 | 83 | 48 | 1839 |
| mixer | 1032 | 704 | 758 | 0.93 | 48 | 88 | 44 | 1677 |
| tanker | 1037 | 726 | 807 | 0.9 | 41 | 91 | 37 | 1140 |
| hellbender | 1100 | 677 | 924 | 0.73 | 111 | 97 | 35 | 53323 |
| forklift | 1069 | 599 | 853 | 0.7 | 31 | 92 | 37 | 1367 |
| firetruck | 1050 | 519 | 775 | 0.67 | 40 | 89 | 46 | 3539 |
| towtruck | 1107 | 591 | 885 | 0.67 | 31 | 94 | 35 | 2163 |
| cruiser | 1125 | 561 | 976 | 0.57 | 58 | 96 | 29 | 6727 |
| outrider | 1247 | 390 | 1104 | 0.35 | 39 | 97 | 24 | 5022 |
| camper | 1196 | 319 | 1063 | 0.3 | 24 | 97 | 22 | 1963 |
| sandflea | 1292 | 284 | 1192 | 0.24 | 38 | 98 | 16 | 1412 |
| viper | 1306 | 267 | 1162 | 0.23 | 37 | 97 | 25 | 3624 |
| tiger | 565 | 96 | 515 | 0.19 | 202 | 93 | 31 | 3930 |

## Matchups (build 88): who wrecks whom

- dozer wrecked outrider: 13× · 879 damage
- dozer wrecked tanker: 12× · 610 damage
- dozer wrecked viper: 11× · 773 damage
- dozer wrecked cruiser: 10× · 628 damage
- combine wrecked hellbender: 10× · 786 damage
- dozer wrecked towtruck: 10× · 689 damage
- forklift wrecked outrider: 9× (8 dragged into a hazard) · 469 damage
- combine wrecked outrider: 9× · 488 damage
- dozer wrecked combine: 8× · 584 damage
- dozer wrecked camper: 8× · 628 damage
- dozer wrecked mixer: 8× · 512 damage
- dozer wrecked forklift: 8× · 650 damage
- dozer wrecked sandflea: 8× · 555 damage
- combine wrecked camper: 7× · 390 damage
- bertha wrecked outrider: 7× · 1318 damage

## Voice variety (build 88, 31 matches)

- 598 lines heard; 1% were repeats within the same match, 22% repeats of a line already heard this session
- per character (lines heard / distinct): Maxine MacTavish 56/55, Dom 53/52, Rocket Raju 47/46, Big Bertha 47/47, Bulldozer Bob 45/44, Tony Cement 42/42, Papa Jacques 41/40, Sheriff Buck 40/40, Cletus 38/38, Ragnar Rustbeard 35/34, King Arthur 34/34, Captain McCaffrey 32/32, Uncle Bogdan 32/32, Jesse 21/21, Mr. White 15/15, Oberst Klaus 10/10
- most repeated lines: Maxine MacTavish: Ma motor's on fire! Somebody fetch a bucket! An' a s ×2; Ragnar Rustbeard: Spin the war-drums! FIRE! ×2; Dom: Ten-second car, nine wheels... I mean, three. ×2; Rocket Raju: Arre, wheel gone! No problem! Hero drives on three! ×2; Papa Jacques: Fire in the wheat! Au feu! AU FEU! ×2; Bulldozer Bob: Fire on the job site! Somebody grab the extinguisher! ×2

## Voices, errors, network

- Android: voice failures 0 over 1 matches · lines sent 26, started 19, errors 7
- Mac: voice failures 359 over 273 matches · lines sent 16, started 0, errors 7 (engine never started)
- other: voice failures 14 over 192 matches · lines sent 1, started 0, errors 1 (engine never started)
- errors & incidents (in and out of matches): 6× voice: voices: stuck - # lines asked for, engine busy # s and none started (last voice default, # voices, spea; 2× voice: voices: stuck - still busy # s after the tab came back from # s in the background (last voice default, ; 2× voice: voices: # recorded clips loaded (# voices)
- network incidents: 10

## Autoplay

- 456 matches, 1315.2 game-minutes · endings: autoplay round done 420, autoplay stopped 24, checkpoint: every # min 8, page closed mid-match 3, checkpoint: voice failure 1
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

- new stuck hotspot at (-107,-94) ×48
- new stuck hotspot at (-94,-144) ×13
- physics catches up for bull: 625 → 637
- physics catches up for Outrider: 1506 → 1518
- physics catches up for Forklift: 527 → 537
- physics catches up for Sandflea: 907 → 948
