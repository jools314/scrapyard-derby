# Testing Scrapyard Derby

There is no build step — `index.html` is the product — so testing is: a headless
suite that runs anywhere, a browser smoke test that runs where Chrome exists, and
the game's own built-in instruments (autoplay + the play log). Jonas's standing
rule (2026-11-14): every change ships with tests. This file is the map.

## 1. The round-2 suite (runs anywhere, no browser)

```
node tests/round2.test.mjs
```

Zero dependencies. It checks: the module script parses (`node --check` on the
extracted `<script type="module">`); every R2 item's implementation is present
and wired in `index.html` (one case per item, keyed `R2-<n>` — cherry-picking an
item out fails exactly its case); `tools/lines-audit.mjs` executes;
`tools/playlog-diff.mjs` produces correct deltas on `tests/fixtures/`;
`tools/render-voices.mjs` computes clip ids identical to the game's own
`VCLIP.hash`/`VCLIP.slug` (extracted from the source and evaluated — a drift
fails loudly instead of orphaning every clip).

What it does **not** do: render a frame, drive a car, or pair two devices. VR
behaviour needs a headset; multiplayer behaviour needs two devices; those are
the manual playtest list in `IMPROVEMENTS-ROUND2.md`.

## 2. Browser smoke test (needs Chrome)

```
node tests/smoke.mjs [--secs=25] [--url=http://localhost:8000/]
```

Serves the repo, loads the game headless over CDP, waits for `window.__derby`,
starts autoplay, and fails on any page exception or an empty yard. Exit codes:
0 pass · 1 fail · 3 skipped (no Chrome found; set `CHROME=/path/to/chrome`).
CI runs it as an advisory step only — headless WebGL varies by environment —
so run it locally before a release. First live pass is still owed (see
IMPROVEMENTS-ROUND2.md playtest notes).

## 3. In-game instruments

- **Autoplay bookmarks**: `?autoplay=1` (standard), `?autoplay=elim`
  (elimination stress), `?autoplay=lite` (4 cars, lightest quality),
  `?autoplay=full`; `&aplen=120` sets match length in seconds.
- **Seeded runs**: `?seed=42` routes all game randomness through a seeded PRNG
  (decisions reproducible; physics timing still varies with frame rate).
  Combine: `?seed=42&autoplay=elim` reproduces an elimination bug hunt.
- **Console hooks**: `window.__derby` exposes AUTO, PLAYLOG, PERFREP, MP, game,
  cars, VCLIP and most subsystems for poking a live page.
- **The play log**: every match writes a PLAYLOG record (fps percentiles,
  physics events, errors, voice stats; VR block when a headset session is live;
  `phys.blow` pose captures for blowups; `budget` when a perf budget fails —
  p5 fps floor 45 desktop / 25 phone, zero blowups). Export from the menu, or
  `window.playLogExport()` in the console.
- **Compare two builds**: `node tools/playlog-diff.mjs before.txt after.txt`
  prints the delta table (fps med/p5/low1, errors, physics, slow seconds).
- **Announcer coverage**: `node tools/lines-audit.mjs` reports pool depth per
  event/persona — the content checklist for thin pools.

## 4. Release checklist additions

- Stamp the build hash (R2-85): before pushing a release, set
  `const BUILD_HASH = '<short git hash>';` in `index.html` so play-log records
  can tell two pushes of one build number apart.
- Run the suite (§1) and a local smoke pass (§2).
- If announcer lines changed, run the audit (§3) — a pool at depth 1 repeats
  audibly within one match.

## 5. CI

`.github/workflows/ci.yml` runs §1 + the lines audit on every push to `main`
and `bob/**` and on PRs; the smoke test is advisory there (§2).
