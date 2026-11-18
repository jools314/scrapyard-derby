# Play logs: how to get them and learn from them

Every copy of the game (phones, iPads, laptops, autoplay machines) records what happens in each match and uploads it automatically. That's how we find stuck spots, physics bugs, slow frames, voice failures and balance problems, and how we check whether a release made things better. Any contributor, human or AI, can pull them and propose fixes.

## Where they go
- **The drop:** uploads go to a public [ntfy.sh](https://ntfy.sh) topic, `scrapyard-derby-f74277e052a2` (it's in `index.html`). No account is needed to read it.
- **Keep-alive:** ntfy keeps **messages for 12 hours and attachments for only 3 hours**. Most play logs are attachments, so whoever wants history must pull **every 2-3 hours** into their own archive.
- **When uploads happen:** at page load, at the end of each match, every few minutes during a match (checkpoints), and on page close. Bug reports from the 🐞 icon go there too.
- **No personal data:** uploads carry random device and session ids, the build number, browser and device type (e.g. "Mac · Chrome 142"), and screen size. No names, accounts, room codes or IP addresses are recorded in the logs.
- **Test runs:** automated runs mark their records `"test": true` (via `navigator.webdriver`), and the analyser leaves them out. Headless tests also show as device `other` with a SwiftShader GPU.

## Pull and analyse
```bash
bash tools/logs/report.sh          # pull new uploads into logs-archive/, then write logs-report/report-latest.md
bash tools/logs/pull.sh            # just pull
python3 tools/logs/analyze.py <archive-dir> <report-dir>
```
Both folders are git-ignored; keep raw logs out of the repo.

`report-latest.md` covers:
- who played (device, build, role);
- performance per device, with a **release-to-release table** per device and build (fps median, p5 and 1% low, worst frame, render scale, slow seconds per hour, stuck events per hour, physics catches per hour, throttled seconds) and the causes of slow moments;
- **stuck hotspots**, clustered on a 12 m grid, with the vehicles involved;
- physics safety-net catches per vehicle;
- **balance**: lives, kills, deaths, K/D and damage per life per vehicle;
- **matchups**: who wrecks whom, including tow-truck and forklift "dragged into a hazard" wrecks;
- voice failures, errors and network incidents;
- autoplay health, recent bug reports, and what changed since the previous report.

`report-latest.json` and `trend.json` (per-build rows for perf, balance and matchups) are for scripts and charts.

The longer history lives on the **`play-logs` branch** (`git fetch origin play-logs`). It holds aggregate reports only, refreshed every few hours from a continuous archive. Start there if you don't want to collect logs yourself.

## What's in a log
A play-log file is a header line (`#derby-playlog v2 dev=… sid=… build=NN sent=… why=…`) followed by one JSON record per line:

- **`kind: "session"`:** one per page load: device, browser, cores, screen, settings, build.
- **`kind: "ck"` / `"match"`:** one match. A checkpoint (`ck`) is written every few minutes and the final `match` record replaces it (same `id`; the one with the largest `game` wins). Fields:
  - `build`, `role` (`solo`, `host`, `guest` or `autoplay`), `mode` (`respawn` or `elimination`), `game` (seconds played), `hidden` (seconds the tab was hidden), `env` (seconds hidden, unfocused or throttled; those frames are excluded from fps), `test`;
  - `fps`: `{med, p5, low1, worstMs, frames}`; `q`: quality level and render scale; `slow`: slow moments, `{secs, causes}`;
  - `stuck`: `{n, list: [{car, secs, x, z, why?}]}`, cars that floored it but couldn't move for 4 s or more;
  - `phys`: physics safety-net catches, `{blowups, launches, rescues, below, nan, list: [{who, kind}]}`;
  - `veh`: per vehicle type `{lives, k, d, dmg, taken, life, fires}`;
  - `vs` (from build 68): `{"killer>victim": {k, dragged?}}`; `vsD`: damage dealt per pair;
  - `voice`: speech failures; `errs`: JS errors; `net`: network incidents; `ev`: a short timeline of events;
  - `vox` (voice-path build): recorded clips vs computer voice, `{clips, waited, busy, speech: {noCtx, suspended, muted, vol0, noClip, failed}, ctx: {running, suspended, interrupted, none}, ctxCh, music: {on, playing, ok, blocked, now}, session, wakes, loaded}`. `speech` says why a line was not a recorded clip: `noClip` nothing recorded for it, `suspended`/`noCtx` no running audio context (no tap yet, a tab or app switch, an iPhone interruption), `failed` fetch/decode; `muted`/`vol0` lines with no sound at all. `ctx` and `music` are samples every 2 s of the visible match. The report's *Recorded voices vs computer voice* table sums them per device and build.
- **`kind: "errors"`:** errors that happened outside a match.
- **How a page stopped** (the stop log): every page keeps a small note in localStorage (`derby-pl-life-<sid>`): its last ~16 lifecycle events (tab hidden/visible, `freeze`/`resume`, `pagehide`, offline/online, autoplay on/off, screen wake lock acquired / denied with the error name / released by us, by the tab hiding or by the system, and `woke after N s` when the wall clock jumped more than 60 s between 1 s heartbeats: a suspend), refreshed every 20 s. The same events go into the match timeline (`ev`), and match records carry the counters as `life`: `{wlGot, wlDenied, wlUs, wlHidden, wlSystem, wlRe, sus, susS, frz, hid, off}`.
  - **`kind: "gasp"`:** an autoplay page that hides, freezes or closes sends one tiny record with `navigator.sendBeacon` (a plain POST to the drop, so it arrives as a message, not an attachment); hidden/freeze at most every 10 min.
  - **`kind: "lifeEnd"`:** the next page load turns each note left behind into a record with `how`: `clean` (pagehide, or autoplay stopped), `suspended` (hidden or frozen, then nothing) or `vanished` (no lifecycle event at all: power loss, crash, killed), `reason`, `lastSeen`, `agoS` and a `line` ("previous session ended: …, last seen …"). That load's upload header says `why=page_load_(previous_session_<how>)`, and its `session` record has `prevEnd`. The report's *Autoplay health* line sums these per device.

Bug reports (`*bug-*.txt`) are the full text the 🐞 icon copies: state, recent events, network log and errors.

## Turning logs into improvements
1. Run the report and look at the hotspots, the top physics-catch vehicles, the fps lows and the balance outliers. Compare builds in the release-to-release table.
2. **Reproduce in a test before fixing.** For example, spawn the vehicle at the stuck coordinates (`tests/harness.js` gives you `window.__derby` with `cars`, `player`, `respawnCar`, `game` and more), assert the bug, fix it, and keep the test (see `CONTRIBUTING.md`).
3. Say in your commit which report numbers you expect to move. After the release, check the next reports to see that they did.
4. **Balance changes need numbers.** Target K/D between about 0.5 and 2.5 per car, and every car should have prey it beats and a counter that beats it (see `DESIGN-PRINCIPLES.md`).
