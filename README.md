# play-logs: aggregate reports from real play

Refreshed every ~2 hours from a continuous archive of the uploads (see LOGS.md on `main`). Raw logs are not stored here, only the analysis:
- `report-latest.md`: the human-readable report (performance per device and build, stuck hotspots, physics catches, balance, matchups, errors, autoplay, bug reports, changes since the last report)
- `report-latest.json`, `trend.json`: the same as data (trend.json has per-build rows for perf, balance and matchups)

Test runs are excluded. The git history of this branch is the history of the reports.
