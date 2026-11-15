#!/usr/bin/env node
// Scrapyard Derby voice-line inventory: each character's own lines, once.
//   node voices/extract.mjs [path/to/index.html]      (default: the index.html next to this folder)  [--table]
// Reads the line tables out of index.html: each car character's handwritten lines (incl. rivalry/comeback/kill/burger lines),
// their horn shouts, the deputy's megaphone, and Crash Cam Kev's calls. A line with blanks ({v}, {vcar}, {kmh}, {insult}...) is
// written once in a name-free form by VCLIP.generic (taken from index.html itself, so ids and texts always match the game):
// "Pull over, {v}!" -> "Pull over, pal!". The shared filler templates (TEMPLATES/GENERIC) are not recorded: they stay Web Speech,
// and with clips the game prefers each character's recorded lines anyway.
// tier 1 = the 15 car characters + Kev (rendered by default); tier 2 = cab cameos (Jesse, Black Knight, French Taunter, the German
// tourist) and the 18 extra drivers of custom matches (render.mjs --tier 2).
// id = hash(character + text): re-runs keep ids, so render.mjs only renders new lines.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(HERE, '..', 'index.html');
const src = fs.readFileSync(FILE, 'utf8');
function block(start, end) { const a = src.indexOf(start); if (a < 0) throw new Error('marker not found: ' + start); const b = src.indexOf(end, a + start.length); if (b < 0) throw new Error('end marker not found: ' + end); return src.slice(a, b); }
const code = [
  block('const TOURIST = {', 'function megaphone('),
  block('const PERSONAS = [', 'const barks = {'),
  block('const VCLIP = {', '\nVCLIP.load();'),
  ';({ TOURIST, HORN_LINES, MEGA, PERSONAS, CAR_CAST, COP, ANNOUNCER, ANN_LINES, VCLIP, SHAZZA: typeof SHAZZA === "undefined" ? null : SHAZZA, annPool: typeof annPool === "undefined" ? null : annPool, ROAST_BY: typeof ROAST_BY === "undefined" ? null : ROAST_BY })',
].join('\n');
const stub = new Proxy(function () {}, { get: (t, k) => (k === Symbol.toPrimitive ? () => 0 : stub), apply: () => stub, construct: () => stub });
const { TOURIST, HORN_LINES, MEGA, PERSONAS, CAR_CAST, COP, ANNOUNCER, ANN_LINES, VCLIP, SHAZZA, annPool, ROAST_BY } = vm.runInNewContext(code, { THREE: stub, CANNON: stub, Math, console, Map, WeakSet, URLSearchParams });

const MAIN = new Set([...Object.values(CAR_CAST).map((P) => P.nick), COP.nick, ANNOUNCER.nick, 'Jesse', SHAZZA ? SHAZZA.nick : 'Shazza']); // (Jesse: Mr. White's partner in the camper)
const STYLE = { roast: 'cheeky roast of a named rival', gotHit: 'angry, just got rammed', hitYou: 'gleeful, triumphant', wrecked: 'dramatic despair', low: 'worried, car falling apart', wheel: 'alarmed', air: 'thrilled, airborne yell', taunt: 'mocking, trash talk', gloat: 'smug', flee: 'panicked', fire: 'battle cry', charge: 'aggressive, charging', start: 'confident, pre-match swagger', crash: 'startled then embarrassed', rival: 'trash talk at a rival', respawn: 'cocky comeback', kill: 'triumphant, finishing blow', burger: 'delighted', onFire: 'panicked, on fire', rodeo: 'whooping', boiler: 'alarmed then laughing, her steam boiler just blew', horn: 'shouting at traffic out the window', mega: 'barking orders through a police megaphone' };
const who = (P, line) => { const m = String(line).match(/^([BC])\|/); if (!m) return [P, line]; const alt = m[1] === 'B' ? P.duo : P.trio; return [alt ? { ...P, ...alt } : P, line.slice(2)]; };
const bleep = (s) => s.replace(/[#@%!$&*]{2,}!?/g, ' bleep ').replace(/#@%!/g, 'bleep').replace(/\s+/g, ' ').trim(); // what speak() says for the #@%! swear marks

const out = new Map();
function add(P0, line0, ev, tpl) {
  const [P, text] = who(P0, line0), ch = VCLIP.slug(P.nick), id = VCLIP.hash(ch + '|' + text);
  if (out.has(id)) return;
  const e = { id, character: ch, speaker: P.nick, text, say: bleep(text), ev, style: ev.startsWith('ann:') ? (ev === 'ann:status' ? 'hyping the crowd' : 'excitable play-by-play commentary') : STYLE[ev] || '', tier: MAIN.has(P.nick) ? 1 : 2 };
  if (ev === 'roast') e.roast = true;
  if (tpl && tpl !== line0) e.tpl = tpl;
  out.set(id, e);
}
for (const P of [...PERSONAS, COP]) for (const [ev, list] of Object.entries(P.lines || {})) for (const tpl of list) add(P, VCLIP.generic(tpl, P), ev, tpl); // (PERSONAS holds the car characters too)
for (const [type, pool] of Object.entries(HORN_LINES)) for (let line of pool) { let P = type === 'cruiser' ? COP : CAR_CAST[type] || ANNOUNCER; if (line.startsWith('T|')) { P = TOURIST; line = line.slice(2); } add(P, line, 'horn'); }
for (const pool of Object.values(MEGA)) for (const line of pool) add(COP, line, 'mega');
for (const ev of Object.keys(ANN_LINES)) for (const A of SHAZZA ? [ANNOUNCER, SHAZZA] : [ANNOUNCER]) for (const tpl of annPool ? annPool(A, ev) : ANN_LINES[ev]) add(A, VCLIP.generic(tpl, A), 'ann:' + ev, tpl); // Kev and Shazza split the calls
if (ROAST_BY) for (const [P, m] of ROAST_BY) for (const list of m.values()) for (const line of list) add(P, line, 'roast'); // roasts aimed at a named rival

const lines = [...out.values()];
fs.writeFileSync(path.join(HERE, 'lines.json'), JSON.stringify(lines, null, 0).replace(/\},\{/g, '},\n{') + '\n');
const sum = (a) => a.reduce((s, l) => s + l.say.length, 0);
for (const t of [1, 2]) { const a = lines.filter((l) => l.tier === t); console.log(`tier ${t} (${t === 1 ? 'the 15 car characters, Jesse, Kev, Lulu' : 'other cab cameos + the 18 extra drivers'}): ${a.length} clips, ${sum(a).toLocaleString()} characters, ${new Set(a.map((l) => l.character)).size} voices`); }
if (process.argv.includes('--table')) { const by = {}; for (const l of lines) { const c = by[l.character] || (by[l.character] = { tier: l.tier, n: 0, chars: 0 }); c.n++; c.chars += l.say.length; } for (const [k, c] of Object.entries(by).sort((a, b) => a[1].tier - b[1].tier || b[1].n - a[1].n)) console.log(`  ${c.tier} ${k.padEnd(28)} ${String(c.n).padStart(4)} lines ${String(c.chars).padStart(6)} chars`); }
