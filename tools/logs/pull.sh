#!/bin/bash
# Pull new play logs and bug reports from the public ntfy drop into a local archive. Safe to re-run (skips what it has).
# The drop keeps messages 12 h and ATTACHMENTS ONLY 3 h (most play logs are attachments): pull at least every 2-3 hours or they're lost.
# Usage: bash tools/logs/pull.sh [archive-dir]      (default: logs-archive/ at the repo root, git-ignored)
TOPIC="${DERBY_TOPIC:-scrapyard-derby-f74277e052a2}"
ARCH="${1:-$(cd "$(dirname "$0")/../.." && pwd)/logs-archive}"
mkdir -p "$ARCH" && cd "$ARCH" || exit 1
curl -sS -m 30 "https://ntfy.sh/$TOPIC/json?poll=1&since=12h" > latest.jsonl || exit 1
python3 - <<'PY'
import json, os, subprocess
new = 0
for line in open('latest.jsonl'):
    if not line.strip(): continue
    m = json.loads(line)
    if m.get('event') not in (None, 'message'): continue
    mid = m['id']; base = f"{m['time']}-{mid}"
    if any(f.startswith(base) for f in os.listdir('.')): continue
    att = m.get('attachment')
    if att:
        out = f"{base}-{att.get('name', 'file.txt')}"
        r = subprocess.run(['curl', '-sS', '-m', '60', '-o', out, att['url']])
        if r.returncode != 0 or not os.path.exists(out) or os.path.getsize(out) == 0: print('missing (attachment expired?)', mid); continue
    else:
        out = f"{base}-msg.txt"; open(out, 'w').write(m.get('message', ''))
    json.dump(m, open(f"{base}.meta.json", 'w')); new += 1
print(new, 'new items archived in', os.getcwd())
PY
