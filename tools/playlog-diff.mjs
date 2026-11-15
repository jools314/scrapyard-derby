#!/usr/bin/env node
// R2-81: play-log diff — compare two #derby-playlog v2 exports and print the deltas.
// Usage: node tools/playlog-diff.mjs before.txt after.txt
// An export is a header line (#derby-playlog v2 ...) followed by one JSON record per
// line (the game's own upload format). Files may be concatenated; session records are
// counted but only kind:"match" records feed the numbers. "Did the new build get
// faster?" becomes a table instead of an eyeball.
import { readFileSync } from 'node:fs';

function load(path) {
  const recs = [];
  let build = '?', sessions = 0;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('#')) { const m = /build=(\S+)/.exec(t); if (m) build = m[1]; continue; }
    if (!t.startsWith('{')) continue;
    try { const r = JSON.parse(t); if (r.kind === 'match') recs.push(r); else if (r.kind === 'session') sessions++; } catch { /* a torn last line is normal */ }
  }
  return { recs, build, sessions };
}
const med = (xs) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
function agg({ recs }) {
  const fps = (k) => recs.map((r) => r.fps && r.fps[k]).filter((v) => typeof v === 'number');
  return {
    matches: recs.length,
    'fps med (median)': med(fps('med')),
    'fps p5 (median)': med(fps('p5')),
    'fps low1 (median)': med(fps('low1')),
    'errors / match': recs.length ? sum(recs.map((r) => (r.errs && r.errs.n) || 0)) / recs.length : null,
    'phys fixes / match': recs.length ? sum(recs.map((r) => (r.phys && r.phys.fixes) || 0)) / recs.length : null,
    'phys clamps / match': recs.length ? sum(recs.map((r) => (r.phys && r.phys.clamps) || 0)) / recs.length : null,
    'phys blowups / match': recs.length ? sum(recs.map((r) => (r.phys && r.phys.blowups) || 0)) / recs.length : null,
    'slow secs / match': recs.length ? sum(recs.map((r) => (r.slow && r.slow.secs) || 0)) / recs.length : null,
    'score (median)': med(recs.map((r) => r.score).filter((v) => typeof v === 'number')),
    'match secs (median)': med(recs.map((r) => r.game).filter((v) => typeof v === 'number')),
  };
}
const [aPath, bPath] = process.argv.slice(2);
if (!aPath || !bPath) { console.error('usage: node tools/playlog-diff.mjs <before.txt> <after.txt>'); process.exit(2); }
const A = load(aPath), B = load(bPath), aa = agg(A), bb = agg(B);
const fmt = (v) => (v === null || v === undefined ? '—' : Math.round(v * 10) / 10);
console.log(`playlog diff · A: ${aPath} (build ${A.build}, ${A.recs.length} matches, ${A.sessions} sessions) · B: ${bPath} (build ${B.build}, ${B.recs.length} matches, ${B.sessions} sessions)`);
console.log(`${'metric'.padEnd(24)} ${'A'.padStart(10)} ${'B'.padStart(10)} ${'delta'.padStart(10)}`);
for (const k of Object.keys(aa)) {
  const d = typeof aa[k] === 'number' && typeof bb[k] === 'number' ? bb[k] - aa[k] : null;
  console.log(`${k.padEnd(24)} ${String(fmt(aa[k])).padStart(10)} ${String(fmt(bb[k])).padStart(10)} ${String(d === null ? '—' : (d > 0 ? '+' : '') + fmt(d)).padStart(10)}`);
}
