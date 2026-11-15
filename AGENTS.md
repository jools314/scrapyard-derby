# AGENTS.md: how AI agents (and humans) work on Scrapyard Derby together

Several agents work on this repo at the same time (Claude, Muse/Bob and others). **The goal: make `main` better with every push.**
- `main` is served at https://jools314.github.io/scrapyard-derby/.
- Open games, and the owner's laptop running autoplay around the clock, update to each new build within minutes and upload play logs from it.
- The owner copies `main` elsewhere for outside players by hand when they're ready. You only ever deliver to `main`.

Read these first, in this order:
1. [TASTE.md](TASTE.md): what the game should feel like, and what counts as a good improvement versus one we don't want. **Read this before choosing what to work on.**
2. [DESIGN-PRINCIPLES.md](DESIGN-PRINCIPLES.md): what fits the game. **Simple and focused on the main play. No new modes, menus or settings.**
3. **This file:** the workflow and the rules.
4. [QUALITY-GATES.md](QUALITY-GATES.md): the tests and standards every push must meet, including the metrics we must not regress.
5. [LOGS.md](LOGS.md): getting the play logs and turning them into fixes.
6. [CONTRIBUTING.md](CONTRIBUTING.md): the pieces of the repo and how to run the tests. `REVIEW-*.md` holds the owner's feedback on earlier contributions; learn from it.

## The loop
1. **Pick something.** Start with [BACKLOG.md](BACKLOG.md) (work nobody has started yet). Other good sources: the latest report on the `play-logs` branch (stuck spots, physics glitches, slow frames, errors, balance outliers), bugs, and polish to the core fight. Big new things, like a new vehicle, a new weapon or anything that changes game flow, need a short `PROPOSAL-<topic>.md` and the owner's OK first.
2. **Claim it** in [WORKBOARD.md](WORKBOARD.md), so two agents don't build the same thing. Add a line under *In progress* and push that one-line change to `main` straight away (docs-only commits need no tests).
3. **Work on a branch:** `<agent>/<topic>`, e.g. `muse/dozer-blade-fix` or `claude/target-pick`. Experiments are welcome on branches; only finished, tested, in-principle work goes to `main`.
4. **One improvement per push.** Small pushes are easier to test, review and revert.
5. **Add a test** that proves the change, and for a bug fix, that fails without it.
6. **Bump `const BUILD = 'NN'`** by one in `index.html` and add a line to [RELEASES.md](RELEASES.md).
7. **Meet the gates** in QUALITY-GATES.md, running the tests **yourself, locally**. There is no CI: GitHub Actions isn't available on this repo, so nobody else will catch a failure before players do.
8. **Land it:**
   - `git pull --rebase origin main`.
   - If anyone else's `index.html` change landed meanwhile, take the next build number and **re-run the quick suite on the rebased result** (two passing changes can still break each other).
   - Then `git push origin main`.
   - Never force-push `main`.
   - Start your commit message with what and why, and put your agent name in it (e.g. `[muse] Dozer blade no longer clips through walls`).
9. **Update WORKBOARD.md:** move your line to *Done* with the build number.
10. **Watch the next play-log reports** for your build (they update every ~2 hours, and the autoplay laptop generates data quickly). If a metric regressed or new errors appeared, fix forward right away or `git revert` your commit, as a new build.

## Performance is everyone's job
The game must stay smooth on phones as it grows: every agent measures and protects performance.
- `tests/perfbudget.js` gates draw calls, triangles, textures and physics cost before every push.
- The play-log report's **Regression check** flags fps, stuck and physics regressions per device after each build. If your build shows up there, fixing it comes before any new work.
- Prefer improvements that make the game *cheaper* at the same quality. Performance wins are always welcome contributions.

## Getting the play logs (any agent, any machine)
Every game uploads its play log automatically, and anyone can read them. In short:
- **History:** `git fetch origin play-logs && git show origin/play-logs:report-latest.md` gives the latest analysed report: performance per build, stuck spots, physics, balance, matchups, voice variety, errors and the regression check. It's refreshed about every 2 hours.
- **Fresh raw logs:** `bash tools/logs/report.sh` pulls the last 12 hours of uploads from the public ntfy.sh drop into `logs-archive/` (git-ignored) and writes `logs-report/report-latest.md`.
- The record format and how to turn findings into tested fixes are in [LOGS.md](LOGS.md).

## The repo is the single source of truth
Everything about this project lives in this repo: code, tests, tools, design notes ([docs/](docs/)), the backlog, claims and reviews. Don't keep plans, test scripts or notes only on your own machine or in your own chat. If it matters, commit it.

## Claiming and coordination
- **Nobody owns "the next release":** every push to `main` is a release. Pushes are serialised by git: rebase, re-test, push.
- **Claims are short-lived.**
  - A claim with no push or branch activity for **24 hours** is stale; anyone may take it over (note it on the board).
  - Release your claim if you stop.
- **Shared areas:** if your work touches an area someone else has claimed, coordinate in WORKBOARD.md (add a note under their line) or pick something else. These are the hot spots:
  - AI (`updateAI`, per-car tactics);
  - physics and the car factory;
  - the multiplayer netcode;
  - the voice cast and lines (`voices/`, the `PERSONAS` and line tables);
  - the HUD and touch layout (phone overlap tests).
- **Don't reformat or reorganise `index.html`.** It's one big file that everyone edits; mass reformatting causes merge conflicts for everyone.

## What not to do
- No new modes, menus, settings or sliders, and no new choices for the player. When in doubt, leave it out or propose it.
- No pushes to `main` without the gates, and no disabling, skipping or loosening of tests to get green. If a test is truly wrong or flaky, fix the test in its own commit and explain why.
- No secrets in the repo: API keys for voice rendering come from the environment only. Never commit raw play logs; they stay in `logs-archive/`, which is git-ignored.
- No balance changes without play-log numbers before and after (see QUALITY-GATES.md).
- No imitation of real people's voices or identities, no copies of existing games or films, no F-bombs or slurs.

## Voices
Character lines live in `index.html` (`PERSONAS` and the line tables). Recorded clips are in `voices/`, matched to lines by a hash of their text.
- If you change or add lines without the ElevenLabs key, the game speaks those lines with the browser's voice. That's fine; say so in RELEASES.md and someone with the key will render them (`voices/render.mjs`, see `voices/README.md`).
- Never delete clips for lines that still exist.
