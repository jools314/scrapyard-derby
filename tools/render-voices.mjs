#!/usr/bin/env node
// R2-59 (partial): the voice-clip render pipeline — the missing half of the VCLIP system.
//
// The game already plays pre-rendered clips (VCLIP in index.html): it fetches
// voices/manifest.json, and for each spoken line looks up the clip id
//   id = VCLIP.hash(VCLIP.slug(nick) + '|' + line)   ->   clips[id] = ["<slug>/<id>.mp3"]
// falling back to Web Speech when there is no clip. Until now nothing in the repo
// could PRODUCE that manifest or the clips, so the whole system was dead in production.
//
// Usage:
//   node tools/render-voices.mjs --lines lines.json --out voices/            (dry run)
//   DERBY_TTS_CMD='piper -m en_GB.onnx -f {out} -- {text}' \
//     node tools/render-voices.mjs --lines lines.json --out voices/ --render
//
// --lines takes [{ "nick": "Kev", "line": "What a hit!" }, ...] or { "Kev": ["...", ...] }.
// Dry run (the default, and the only mode without a TTS command) writes manifest.json
// with the exact ids/paths the game will ask for, plus render-jobs.json listing every
// line still needing synthesis. With --render and DERBY_TTS_CMD set ({text} and {out}
// are substituted, shell-quoted), each line is synthesised to its clip path.
//
// The hash/slug functions below are COPIES of VCLIP's in index.html — they must stay
// byte-equivalent. tests/round2.test.mjs cross-checks them against the game's own
// source, so a drift fails the suite instead of silently orphaning every clip.
// NOTE: no voices/manifest.json is committed to the repo on purpose — the game fetches
// it live, and an empty manifest would change line-picking for zero benefit. Run this
// tool (with a real TTS) and commit its output together with the .mp3 files.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';

export function hash(str) { let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36); }
export function slug(nick) { return String(nick).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32); }
export const clipId = (nick, line) => hash(slug(nick) + '|' + line);

const FX = { 'crash-cam-kev': 'pa', shazza: 'pa', 'big-hank': 'radio', 'german-tourist-in-the-back': 'muffled' }; // VCLIP.fx defaults
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
if (process.argv[1] && process.argv[1].endsWith('render-voices.mjs') && !args.includes('--lib')) {
  const linesPath = opt('--lines', null), outDir = opt('--out', 'voices');
  if (!linesPath) { console.error('usage: node tools/render-voices.mjs --lines lines.json --out voices/ [--render]'); process.exit(2); }
  const raw = JSON.parse(readFileSync(linesPath, 'utf8'));
  const lines = Array.isArray(raw) ? raw : Object.entries(raw).flatMap(([nick, ls]) => ls.map((line) => ({ nick, line })));
  const clips = {}, jobs = [];
  for (const { nick, line } of lines) {
    const id = clipId(nick, line), rel = `${slug(nick)}/${id}.mp3`;
    clips[id] = [rel]; jobs.push({ nick, line, id, file: rel });
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({ clips, fx: FX }, null, 1));
  const render = args.includes('--render'), cmd = process.env.DERBY_TTS_CMD;
  let done = 0;
  if (render && cmd) {
    for (const j of jobs) {
      const out = join(outDir, j.file); mkdirSync(dirname(out), { recursive: true });
      const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
      execFileSync('sh', ['-c', cmd.replace('{text}', q(j.line)).replace('{out}', q(out))], { stdio: 'inherit' });
      if (existsSync(out)) done++;
    }
  }
  const pending = jobs.filter((j) => !(render && cmd && existsSync(join(outDir, j.file))));
  writeFileSync(join(outDir, 'render-jobs.json'), JSON.stringify(pending, null, 1));
  console.log(`voices: ${jobs.length} lines, ${Object.keys(clips).length} clips in manifest -> ${join(outDir, 'manifest.json')}`);
  console.log(render && cmd ? `rendered ${done}/${jobs.length} with DERBY_TTS_CMD` : `dry run: ${pending.length} lines await synthesis (set DERBY_TTS_CMD and pass --render)`);
}
