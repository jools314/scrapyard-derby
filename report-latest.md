# Scrapyard Derby play-log report · 2026-11-15 15:41 UTC

61 matches (50 from real devices, 137.8 game-minutes), 21 page loads, 5 bug reports.

## Who and what

- Android · build 67 · solo: 1 matches
- Mac · build 67 · autoplay: 15 matches
- Mac · build 67 · solo: 2 matches
- Mac · build 66 · autoplay: 22 matches
- Mac · build 65 · solo: 1 matches
- Mac · build 65 · autoplay: 9 matches

## Performance (foreground)

- **Android**: fps median 60, typical 1% low 40, worst frame 92 ms · quality 0, res 100% · 1 matches · 2 s throttled/hidden (excluded)
- **Mac**: fps median 60, typical 1% low 53, worst frame 983 ms · quality 0, res 100% · 47 matches · 39 s throttled/hidden (excluded)
### Release to release

| device | build | matches | game-min | fps med | p5 | 1% low | worst ms | res | slow s/h | stuck/h | phys catches/h | throttled s |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Android | 67 | 1 | 1 | 60 | 60 | 40 | 92 | 100% | 1356.3 | 0 | 419 | 2 |
| Mac | 65 | 9 | 34 | 60 | 56 | 30 | 667 | 130% | 11.3 | 70 | 263 | – |
| Mac | 66 | 22 | 59 | 60 | 55 | 53 | 983 | 100% | 5.2 | 55 | 234 | – |
| Mac | 67 | 16 | 44 | 60 | 56 | 56 | 750 | 100% | 5.6 | 75 | 307 | 39 |

### Regression check (newest build vs previous, per device)

- **REGRESSION** Mac: build 66 -> 67: stuck/h 54.9 -> 75.1; physics catches/h 234.0 -> 307.3

- slow moments by cause (seconds): waiting on the graphics chip (fewer pixels/effects would help): 25.9; preparing the drawing (draw calls) is the slow part: 4.9; the game step (physics/AI) is the slow part: 1
- slow incidents by cause × quality × match phase (seconds): waiting on the graphics chip (fewer pixels/effects would help) · q0 · 0-5 min: 20.8; waiting on the graphics chip (fewer pixels/effects would help) · q4 · 0-5 min: 4.2; preparing the drawing (draw calls) is the slow part · q4 · 0-5 min: 2.8; preparing the drawing (draw calls) is the slow part · q0 · 0-5 min: 2.1; the game step (physics/AI) is the slow part · q4 · 0-5 min: 1; waiting on the graphics chip (fewer pixels/effects would help) · q2 · 0-5 min: 0.9
- worst slow incidents: t43s: 8.1s at 10 fps (worst 108 ms) q0 · 115 particles, 0 fires, 0 blasts · worst frame 108 ms: render 5 · 103 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t43s: 8.1s at 10 fps (worst 108 ms) q0 · 115 particles, 0 fires, 0 blasts · worst frame 108 ms: render 5, hud 1 · 103 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t106s: 4.2s at 23 fps (worst 451 ms) q4 · 412 particles, 0 fires, 0 blasts · worst frame 451 ms: physics 4, render 4, cars 1 · 442 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t30s: 2.8s at 23 fps (worst 183 ms) q4 · 170 particles, 3 fires, 0 blasts · worst frame 183 ms: physics 20, render 15, hud 2, effects 2, cars 1 · 143 ms outside the game code (graphics chip, garbage collection, shader compile or the browser); t24s: 1.2s at 34 fps (worst 132 ms) q0 · 175 particles, 4 fires, 0 blasts · worst frame 132 ms: physics 13, render 7, hud 1 · 112 ms outside the game code (graphics chip, garbage collection, shader compile or the browser)

## Stuck hotspots

- (36, -107): 12× · 62.5 s · forklift 3, combine 3, dozer 2, mixer 2, bertha 1
- (142, 96): 6× · 59.0 s · mixer 4, firetruck 1, tanker 1
- (-10, 28): 4× · 36.5 s · firetruck 2, mixer 1, viper 1
- (39, -95): 7× · 34.5 s · tiger 2, camper 1, bertha 1, combine 1, firetruck 1
- (1, 36): 5× · 31.0 s · towtruck 1, firetruck 1, combine 1, forklift 1, tanker 1
- (29, -144): 2× · 21 s · firetruck 2
- (-1, -106): 2× · 21 s · bertha 1, forklift 1
- (-145, -83): 3× · 20.0 s · combine 2, bertha 1
- (37, -146): 3× · 19.5 s · viper 1, tiger 1, combine 1
- (14, -145): 1× · 17 s · bertha 1
- (-18, -146): 2× · 17 s · camper 1, firetruck 1
- (-47, -85): 3× · 16 s · forklift 1, combine 1, firetruck 1
- total 123 stuck events, 749.5 s, over 137.8 game-minutes (53.6 per hour)

## Physics safety-net catches

- totals (full census): blowups 609, fixes 207965, clamps 8396, undos 551, escapes 2, launches 0, rescues 0, below 0, nan 0 · safety-net work: fixes 207965 (90551/h), clamps 8396 (3656/h) · kinds (census): solver kick undone 551, blow-up clamped 58, escaped the arena, put back 2
- by vehicle (listed catches only — the game lists at most 40 per match, so this is a capped sample): Outrider 80, Sandflea 71, Hellbender 59, Forklift 59, bull 52, Viper 45, Cruiser 33, Tow Truck 31 · listed kinds: solver kick undone 454, blow-up clamped 46, escaped the arena, put back 2

- catch locations (listed catches with a position, same 12 m grid as stuck — do the two maps agree?): (117, -82): 31× · solver kick undone 31; (36, 16): 26× · solver kick undone 26; (97, 87): 20× · solver kick undone 20; (96, 92): 16× · solver kick undone 16; (2, -130): 13× · solver kick undone 13; (36, -97): 10× · solver kick undone 10; (37, 18): 9× · solver kick undone 9; (123, -3): 8× · solver kick undone 8
## Balance (all real matches)

| vehicle | lives | kills | deaths | K/D | dmg/life | taken/life | avg life s | fires |
|---|---|---|---|---|---|---|---|---|
| dozer | 97 | 178 | 67 | 2.66 | 154 | 91 | 48 | 583 |
| bertha | 88 | 130 | 59 | 2.2 | 246 | 82 | 57 | 309 |
| combine | 98 | 83 | 64 | 1.3 | 67 | 80 | 41 | 164 |
| tanker | 89 | 74 | 71 | 1.04 | 47 | 94 | 44 | 79 |
| mixer | 113 | 83 | 82 | 1.01 | 49 | 87 | 48 | 193 |
| hellbender | 115 | 79 | 92 | 0.86 | 107 | 95 | 44 | 5220 |
| firetruck | 99 | 47 | 65 | 0.72 | 35 | 82 | 47 | 340 |
| towtruck | 114 | 49 | 89 | 0.55 | 29 | 93 | 32 | 181 |
| cruiser | 110 | 42 | 90 | 0.47 | 52 | 93 | 23 | 641 |
| camper | 110 | 40 | 93 | 0.43 | 25 | 94 | 31 | 181 |
| outrider | 111 | 33 | 98 | 0.34 | 42 | 96 | 21 | 453 |
| forklift | 102 | 22 | 78 | 0.28 | 26 | 87 | 33 | 96 |
| sandflea | 120 | 29 | 111 | 0.26 | 41 | 100 | 16 | 133 |
| tiger | 56 | 11 | 47 | 0.23 | 214 | 87 | 42 | 376 |
| viper | 133 | 21 | 115 | 0.18 | 33 | 94 | 29 | 477 |

## Voices, errors, network

- Android: voice failures 0 over 1 matches · lines sent 26, started 19, errors 7
- Mac: voice failures 135 over 49 matches · lines sent 8, started 0, errors 3 (engine never started)
- errors & incidents (in and out of matches): 4× voice: voices: stuck - # lines asked for, engine busy # s and none started (last voice default, # voices, spea; 2× voice: voices: stuck - still busy # s after the tab came back from # s in the background (last voice default, 
- network incidents: 2

## Autoplay

- 46 matches, 102.5 game-minutes · endings: autoplay round done 19, autoplay stopped 14, checkpoint: every # min 9, page closed mid-match 3, checkpoint: voice failure 1
- 2 autoplay matches spent time hidden (stats from those stretches are excluded from build 67)

## Bug reports

- 1794706963-lliE33pDU7vD-bug-b68-web-2026-11-15T01-42-43-652Z · {"code":40401,"http":404,"error":"page not found"}
- 1794725414-tgRRYQWpPVYF-bug-b69-web-2026-11-15T06-50-14-834Z · {"code":40401,"http":404,"error":"page not found"}
- 1794725451-7bKoH5NiFJwx-bug-b69-web-2026-11-15T06-50-50-843Z · {"code":40401,"http":404,"error":"page not found"}
- 1794725479-21679ipLjuMa-bug-b69-web-2026-11-15T06-51-18-901Z · {"code":40401,"http":404,"error":"page not found"}
- 1794727632-OgV59iRq3qG4-bug-b70-web-2026-11-15T07-27-12-098Z · {"code":40401,"http":404,"error":"page not found"}

## Changes since the previous report

- nothing new
