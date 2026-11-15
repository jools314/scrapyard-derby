# Scrapyard Derby play-log report · 2026-11-15 05:03 UTC

60 matches (49 from real devices, 137.1 game-minutes), 20 page loads, 1 bug reports.

## Who and what

- Mac · build 67 · autoplay: 15 matches
- Mac · build 67 · solo: 2 matches
- Mac · build 66 · autoplay: 22 matches
- Mac · build 65 · solo: 1 matches
- Mac · build 65 · autoplay: 9 matches

## Performance (foreground)

- **Mac**: fps median 60, typical 1% low 53, worst frame 983 ms · quality 0, res 100% · 47 matches · 39 s throttled/hidden (excluded)
### Release to release

| device | build | matches | game-min | fps med | p5 | 1% low | worst ms | res | slow s/h | stuck/h | phys catches/h | throttled s |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Mac | 65 | 9 | 34 | 60 | 56 | 30 | 667 | 130% | 11.3 | 70 | 263 | – |
| Mac | 66 | 22 | 59 | 60 | 55 | 53 | 983 | 100% | 5.2 | 55 | 234 | – |
| Mac | 67 | 16 | 44 | 60 | 56 | 56 | 750 | 100% | 5.6 | 75 | 307 | 39 |

- slow moments by cause (seconds): waiting on the graphics chip (fewer pixels/effects would help): 9.7; preparing the drawing (draw calls) is the slow part: 4.9; the game step (physics/AI) is the slow part: 1

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
- total 123 stuck events, 749.5 s, over 137.1 game-minutes (53.8 per hour)

## Physics safety-net catches

- totals: blowups 604, launches 0, rescues 0, below 0, nan 0 · kinds: solver kick undone 452, blow-up clamped 43, escaped the arena, put back 2
- by vehicle (listed catches): Outrider 78, Sandflea 71, Hellbender 59, Forklift 59, bull 52, Viper 42, Cruiser 33, Tow Truck 31

## Balance (all real matches)

| vehicle | lives | kills | deaths | K/D | dmg/life |
|---|---|---|---|---|---|
| dozer | 97 | 178 | 67 | 2.66 | 154 |
| bertha | 88 | 130 | 59 | 2.2 | 246 |
| combine | 97 | 81 | 64 | 1.27 | 67 |
| tanker | 89 | 74 | 71 | 1.04 | 47 |
| mixer | 110 | 83 | 80 | 1.04 | 51 |
| hellbender | 115 | 79 | 92 | 0.86 | 107 |
| firetruck | 98 | 46 | 65 | 0.71 | 35 |
| towtruck | 114 | 49 | 89 | 0.55 | 29 |
| cruiser | 109 | 40 | 90 | 0.44 | 52 |
| camper | 110 | 40 | 93 | 0.43 | 25 |
| outrider | 109 | 33 | 97 | 0.34 | 43 |
| forklift | 102 | 22 | 78 | 0.28 | 26 |
| sandflea | 118 | 29 | 110 | 0.26 | 41 |
| tiger | 55 | 11 | 46 | 0.24 | 215 |
| viper | 131 | 21 | 113 | 0.19 | 33 |

## Voices, errors, network

- Mac: voice failures 135 over 49 matches (engine never started)
- errors & incidents (in and out of matches): 4× voice: voices: stuck - # lines asked for, engine busy # s and none started (last voice default, # voices, spea; 2× voice: voices: stuck - still busy # s after the tab came back from # s in the background (last voice default, 
- network incidents: 2

## Autoplay

- 46 matches, 102.5 game-minutes · endings: autoplay round done 19, autoplay stopped 14, checkpoint: every # min 9, page closed mid-match 3, checkpoint: voice failure 1
- 2 autoplay matches spent time hidden (stats from those stretches are excluded from build 67)

## Bug reports

- 1794706963-lliE33pDU7vD-bug-b68-web-2026-11-15T01-42-43-652Z · {"code":40401,"http":404,"error":"page not found"}

## Changes since the previous report

- new stuck hotspot at (142,96) ×6
- new stuck hotspot at (-10,28) ×4
- new stuck hotspot at (39,-95) ×7
- new stuck hotspot at (1,36) ×5
- new stuck hotspot at (-1,-106) ×2
- new stuck hotspot at (-18,-146) ×2
- physics catches up for Camper: 16 → 27
- physics catches up for bull: 41 → 52
- physics catches up for Tow Truck: 22 → 31
- physics catches up for Outrider: 70 → 78
- physics catches up for Cruiser: 27 → 33
- physics catches up for Hellbender: 37 → 59
- physics catches up for Forklift: 50 → 59
- physics catches up for Viper: 27 → 42
- physics catches up for Sandflea: 30 → 71
- physics catches up for Tanker: 17 → 30
