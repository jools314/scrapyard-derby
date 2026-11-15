#!/usr/bin/env node
// Scrapyard Derby — line-depth audit (round-2 item 61).
//
// Counts voice lines per announcer-event and per persona-event and flags the
// thin cells, so content writing is a checklist instead of guesswork:
//   - announcer events where Kev or Shazza effectively has fewer than 2 lines
//     (annPool splits ANN_LINES by index parity: Kev takes the even lines,
//     Shazza the odd ones plus her own SHAZZA_LINES pool)
//   - persona events with fewer than 3 lines (they repeat audibly in a
//     long match)
//
// Usage: node tools/lines-audit.mjs [path-to-index.html]
// The game's line tables are pure data literals; this tool extracts and
// evaluates just those literals (ANN_LINES, SHAZZA_LINES, CAR_CAST,
// CAST_MORE, COP) — it never runs the game itself.

import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const path = process.argv[2] || new URL('../index.html', import.meta.url).pathname;
const src = readFileSync(path, 'utf8');

function literal(name) {
  const at = src.indexOf(`const ${name} =`);
  if (at < 0) return null;
  const start = src.indexOf('{', at);
  let depth = 0, j = start, str = null;
  for (; j < src.length; j++) {
    const ch = src[j];
    if (str) { if (ch === '\\') j++; else if (ch === str) str = null; continue; }
    if (ch === "'" || ch === '"' || ch === '`') { str = ch; continue; }
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) break;
  }
  return vm.runInNewContext('(' + src.slice(start, j + 1) + ')', Object.create(null));
}

const ANN = literal('ANN_LINES') || {};
const SHAZZA = literal('SHAZZA_LINES') || {};
const CAST = literal('CAR_CAST') || {};
const MORE = literal('CAST_MORE') || {};
const COP = literal('COP');

// merge CAST_MORE into the cast exactly like the game does
for (const [type, more] of Object.entries(MORE)) {
  const P = type === 'cruiser' ? COP : CAST[type];
  if (!P) continue;
  P.lines = P.lines || {};
  for (const [ev, list] of Object.entries(more)) {
    if (ev === 'insult') continue;
    P.lines[ev] = (P.lines[ev] || []).concat(list);
  }
}
if (COP && !CAST.cruiser) CAST.cruiser = COP;

let flags = 0;
console.log('== Announcer pools (Kev = even lines, Shazza = odd lines + her own pool) ==');
console.log('event        total  Kev  Shazza');
for (const ev of Object.keys(ANN).sort()) {
  const all = ANN[ev];
  const kev = all.filter((_, i) => i % 2 === 0).length;
  const shz = all.filter((_, i) => i % 2).length + ((SHAZZA[ev] || []).length);
  const thin = kev < 2 || shz < 2;
  if (thin) flags++;
  console.log(`${ev.padEnd(13)}${String(all.length).padStart(5)}${String(kev).padStart(5)}${String(shz).padStart(7)}${thin ? '   <-- THIN' : ''}`);
}
const calledButMissing = Object.keys(SHAZZA).filter((ev) => !(ev in ANN));
if (calledButMissing.length) console.log('SHAZZA_LINES events with no ANN_LINES pool:', calledButMissing.join(', '));

console.log('\n== Persona lines per event (cells under 3 flagged) ==');
const events = new Set();
for (const P of Object.values(CAST)) for (const ev of Object.keys(P.lines || {})) events.add(ev);
const evList = [...events].sort();
console.log('persona'.padEnd(16) + evList.map((e) => e.slice(0, 7).padStart(8)).join(''));
for (const [type, P] of Object.entries(CAST)) {
  const cells = evList.map((ev) => {
    const n = (P.lines && P.lines[ev] || []).length;
    if (n > 0 && n < 3) flags++;
    return (n === 0 ? '·' : String(n)).padStart(8);
  });
  console.log((P.nick || type).slice(0, 15).padEnd(16) + cells.join(''));
}
console.log(`\n${flags} thin cell(s). A cell at 1-2 lines will repeat audibly in a long match; write to the flagged cells first.`);
