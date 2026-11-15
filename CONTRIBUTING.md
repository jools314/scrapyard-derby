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
| `main` | the next release, work in progress (the trunk) | small, tested check-ins from everyone |
| `release/NN` | release NN being stabilised | bug fixes only |
| `live` | what players get at https://jools314.github.io/scrapyard-derby/ (GitHub Pages serves this branch) | only the release step below |
| `<you>/<topic>` | your own work in progress, e.g. `muse/near-miss`, `claude/target-pick` | you |

## Making a change
1. Branch from `main`: `<you>/<short-topic>`. Keep it to **one improvement or fix**; small is good.
2. Make the change in `index.html` (and `voices/` if lines change).
3. **Add or update a test** in `tests/` for what you changed. Every bug fixed gets a regression test that fails before the fix. Use `tests/harness.js` (`open()` gives you a page with `window.__derby` test hooks).
4. Run the quick suite: `bash tests/run.sh quick`. It must end with `ALL PASSED (quick)`.
5. Merge into `main` (fast-forward or a small merge commit) and push. Describe what and why in the commit message. If you can't run the tests, push your branch and open a pull request instead, saying so. Someone else will test and merge it.
6. Don't change `BUILD` on main; the release step does that.

Don't push straight to `live`. Don't rewrite history on `main`, `release/*` or `live`.

## Tests
One-time setup, from `tests/`:
```
npm install
npm i playwright            # if it isn't installed globally
npx playwright install chromium
```

| command | when | time |
|---|---|---|
| `bash tests/run.sh quick` | before every check-in to `main` or `release/*` | ~20-30 min |
| `bash tests/run.sh release` | before publishing a release | ~2-3 h |
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
1. **Cut:** when `main` has a good set of improvements, branch `release/NN` from it and set `const BUILD = 'NN'` there. `main` moves on to NN+1, and new check-ins keep going to `main`.
2. **Stabilise:** only fixes go to `release/NN`, each with a test. Cherry-pick every fix back to `main`.
3. **Gate:** `bash tests/run.sh release` must pass on `release/NN`.
4. **Publish:** fast-forward `live` to `release/NN`, tag it `vNN`, and add an entry to `RELEASES.md`. Open games see the new build within minutes. Autoplay machines switch over at the end of their current match.
5. **Watch:** check the play logs and the Derby Health dashboard for regressions (fps, stuck cars, physics glitches, balance). Fix on `release/NN` if needed and release again as NN, or as NN+1 if it's big.

## Logs and metrics
Every game uploads a play log (fps, stuck spots, physics catches, K/D per car, who wrecks whom). [LOGS.md](LOGS.md) explains how to pull and analyse them, and how to turn them into tested fixes. Use them to decide what to fix and to check whether a change helped.

## Coordination
- **Claim before big work:** before starting something big, check open branches (`git ls-remote origin`) and `REVIEW-*.md` so you don't duplicate someone else's work.
- **Big ideas first:** propose a big idea (a new car, a new weapon, anything touching game flow) in a `PROPOSAL-<topic>.md` on your branch before building it.
- **Feedback:** feedback on contributions is written to `REVIEW-<branch>.md` on `main`. Read it, and learn what fits.
