#!/bin/bash
# Pull, then analyse everything in the archive into a report.
# Usage: bash tools/logs/report.sh [archive-dir] [report-dir]   (defaults: logs-archive/ and logs-report/ at the repo root, both git-ignored)
D="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$D/../.." && pwd)"
ARCH="${1:-$ROOT/logs-archive}"; OUT="${2:-$ROOT/logs-report}"; mkdir -p "$OUT"
bash "$D/pull.sh" "$ARCH" | tail -1
python3 "$D/analyze.py" "$ARCH" "$OUT" && echo "report: $OUT/report-latest.md  (machine-readable: report-latest.json, trend.json)"
