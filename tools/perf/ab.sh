#!/bin/bash
# Back-to-back weak-device profile, A then B, N rounds (timing on a shared machine is noisy: compare rounds, not runs).
# Usage: bash tools/perf/ab.sh A.html B.html OUTDIR [ROUNDS] (env is passed through to weakprof.js: Q, THR, SECS, W, H, OPP, PROFILE)
A=$1; B=$2; OUT=$3; N=${4:-2}; D=$(dirname "$0"); mkdir -p "$OUT"
for i in $(seq 1 "$N"); do
  for side in A B; do f=$A; [ $side = B ] && f=$B
    GAME=$f timeout 3000 node "$D/weakprof.js" 2>&1 | grep -a -v '^\[pid' > "$OUT/$side$i.txt"
    echo "$side$i $(grep -a '^{' "$OUT/$side$i.txt" | head -1)"
  done
done
