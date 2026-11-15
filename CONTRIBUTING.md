# Contributing to Scrapyard Derby

Several AI agents (Claude, Muse and others) and humans work on this repo in parallel. These rules keep that from turning into chaos.
Read [DESIGN-PRINCIPLES.md](DESIGN-PRINCIPLES.md) first: **simple, focused on the main play, no new modes, menus or settings.**

## The pieces
- `index.html`: the whole game, a single file with three.js + cannon-es from a CDN. The `const BUILD = 'NN'` line is the version number.
- `voices/`: recorded character voice clips plus `manifest.json`. `lines.json`, `cast.json`, `extract.mjs` and `render.mjs` regenerate them (ElevenLabs).
- `tests/`: browser tests (Playwright driving headless Chromium with a software GPU). `tests/run.sh` runs them.
- `DESIGN-PRINCIPLES.md`, `RELEASES.md` (release log), `REVIEW-*.md` (feedback on contributions).

## Branches
| branch | what it is | who writes to it |
|---|---|---|
| `main` | **what players get**: GitHub Pages serves it at https://jools314.github.io/scrapyard-derby/, so every push to `main` goes live within a minute or two | small, tested check-ins from everyone |
| `<you>/<topic>` | your own work in progress, e.g. `muse/near-miss`, `claude/target-pick` | you |
| `play-logs` | aggregate play-log reports (see LOGS.md) | the scheduled log check |

## Making a change
1. Branch from `main`: `<you>/<short-topic>`. Keep it to **one improvement or fix**; small is good.
2. Make the change in `index.html` (and `voices/` if lines change).
3. **Add or update a test** in `tests/` for what you changed. Every bug fixed gets a regression test that fails before the fix. Use `tests/harness.js` (`open()` gives you a page with `window.__derby` test hooks).
4. **Bump the build:** increase `const BUILD = 'NN'` by one, so open games and autoplay machines pick up the new version, and add a line to `RELEASES.md`.
5. Run the tests (next section). The quick suite is required for every push to `main`. Run the release suite too when the change touches multiplayer, voices, the play log, autoplay or VR.
6. Rebase on the latest `main` (`git pull --rebase origin main`). If someone else bumped `BUILD` meanwhile, take the next number. Then push to `main`, describing what and why in the commit message. If you can't run the tests, push your branch and open a pull request instead, saying so; someone else will test and merge it.
7. **Watch:** after pushing, check the next play-log reports (LOGS.md) for regressions. If something broke, fix it forward fast, or revert your commit.

Don't rewrite history on `main`.

## Tests
One-time setup, from `tests/`:
```
npm install
npm i playwright            # if it isn't installed globally
npx playwright install chromium
```

| command | when | time |
|---|---|---|
| `bash tests/run.sh quick` | before every push to `main` | ~20-30 min |
| `bash tests/run.sh release` | before big changes (multiplayer, voices, play log, autoplay, VR) | ~2-3 h |
| `bash tests/run.sh <name>` | one test, e.g. `matchups` | |

- `GAME=/path/to/index.html` tests another copy of the game.
- Each test writes its output to `tests/out/<name>.txt`.
- **quick** covers: syntax, every car driving with keys and touch (straight, both turns, reverse, handbrake, firing its weapon), tracked vehicles, the weapon × object interaction matrix, touch controls, zoom blocking, phone layout overlaps (portrait and landscape), matchup logging, and idle autoplay.
- **release** adds:
  - multiplayer: respawn, host migration, rejoin, family yard, twins;
  - the bug-report copy, and tab hidden/throttled detection plus auto-update;
  - the play log and uploads, including a live upload to the log drop;
  - autoplay;
  - voices: running out of lines, a long session, and recorded clips;
  - VR, both in-headset (emulated) and non-VR.
- `rc-vr-test` is flaky on a busy machine. Re-run it alone before treating a failure as real.

## Releases
Every push to `main` is a release: it goes straight to players, and the `BUILD` number is the version. `RELEASES.md` lists what changed in each build. Before a big change, run `bash tests/run.sh release` (about 2-3 h), not just the quick suite.

## Logs and metrics
Every game uploads a play log (fps, stuck spots, physics catches, K/D per car, who wrecks whom). [LOGS.md](LOGS.md) explains how to pull and analyse them, and how to turn them into tested fixes. Use them to decide what to fix and to check whether a change helped.

## Coordination
- **Claim before big work:** before starting something big, check open branches (`git ls-remote origin`) and `REVIEW-*.md` so you don't duplicate someone else's work.
- **Big ideas first:** propose a big idea (a new car, a new weapon, anything touching game flow) in a `PROPOSAL-<topic>.md` on your branch before building it.
- **Feedback:** feedback on contributions is written to `REVIEW-<branch>.md` on `main`. Read it, and learn what fits.
