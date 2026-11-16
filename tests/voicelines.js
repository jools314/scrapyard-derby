// Voice-line content check (no browser): re-extracts every spoken line from the game with voices/extract.mjs and checks
//  - voices/lines.json is up to date with index.html (same ids), and every manifest clip belongs to a line that still exists;
//  - lines stay short (one breath, ~6 s: at most 105 characters for the main cast);
//  - nothing on the banned list (strong swearing, the retired Rocket Raju), and no leftover "{" blanks in the recorded text;
//  - the main cast is recorded: Kev and Lulu fully, every car character all but at most 15 lines (round-5 extras render after the credit reset);
//  - round 5 is in: Emeka Danfo on the Sandflea, 60+ new lines each for Kev and Lulu, 15 more lines per driver.
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), game = process.env.GAME || path.join(ROOT, 'index.html');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'derby-voicelines-'));
fs.copyFileSync(path.join(ROOT, 'voices', 'extract.mjs'), path.join(tmp, 'extract.mjs'));
execFileSync(process.execPath, [path.join(tmp, 'extract.mjs'), game], { stdio: 'pipe' });
const fresh = JSON.parse(fs.readFileSync(path.join(tmp, 'lines.json'), 'utf8'));
const repo = JSON.parse(fs.readFileSync(path.join(ROOT, 'voices', 'lines.json'), 'utf8'));
const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'voices', 'manifest.json'), 'utf8'));
const fails = [], ok = (c, msg) => { if (!c) fails.push(msg); };
const ids = new Set(fresh.map((l) => l.id)), repoIds = new Set(repo.map((l) => l.id));
ok(ids.size === repoIds.size && [...ids].every((i) => repoIds.has(i)), `voices/lines.json is stale: run node voices/extract.mjs (${ids.size} lines in the game, ${repoIds.size} in lines.json)`);
const orphans = Object.keys(man.clips).filter((i) => !ids.has(i));
ok(!orphans.length, `${orphans.length} manifest clips for lines that no longer exist (node voices/render.mjs --prune)`);
const missingFiles = Object.values(man.clips).filter(([p]) => !fs.existsSync(path.join(ROOT, 'voices', p)));
ok(!missingFiles.length, `${missingFiles.length} manifest clips point at missing files, e.g. ${missingFiles[0] && missingFiles[0][0]}`);
const t1 = fresh.filter((l) => l.tier === 1);
const long = t1.filter((l) => l.say.length > 105);
ok(!long.length, `${long.length} main-cast lines over 105 characters (~6 s), e.g. "${long[0] && long[0].say}"`);
const BANNED = /\b(fuck\w*|shit\w*|bitch\w*|bastard\w*|cunt\w*|dick\w*|piss\w*|wank\w*|bollocks|stugots|stugatz|faen|cabr[oó]n|pendejo|putain|bugger\w*|private parts)\b|Raju|Bollywood|Dhishoom/i;
const bad = fresh.filter((l) => BANNED.test(l.text));
ok(!bad.length, `${bad.length} lines hit the banned list, e.g. "${bad[0] && bad[0].text}"`);
ok(!fresh.some((l) => /[{}]/.test(l.say)), 'a recorded line still has a {blank} in it');
const by = {}; for (const l of t1) { const b = by[l.character] || (by[l.character] = { n: 0, rec: 0 }); b.n++; if (man.clips[l.id]) b.rec++; }
for (const c of ['crash-cam-kev', 'lulu']) ok(by[c] && by[c].rec === by[c].n, `${c}: ${by[c] && by[c].rec}/${by[c] && by[c].n} lines recorded (should be all)`);
for (const [c, b] of Object.entries(by)) if (!['crash-cam-kev', 'lulu'].includes(c)) ok(b.n - b.rec <= 15, `${c}: ${b.n - b.rec} lines not recorded (at most 15, the round-5 extras)`);
ok(by['emeka-danfo'] && by['emeka-danfo'].n >= 95, `Emeka Danfo has ${by['emeka-danfo'] && by['emeka-danfo'].n} lines (want 95+)`);
const src = fs.readFileSync(game, 'utf8'), count = (name) => { const m = src.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`)); return m ? (m[1].match(/"(?:[^"\\]|\\.)*"/g) || []).length : 0; };
ok(count('KEV_LINES') >= 60, `KEV_LINES has ${count('KEV_LINES')} lines (want 60+)`);
ok(count('SHAZZA_R5') >= 60, `SHAZZA_R5 has ${count('SHAZZA_R5')} lines (want 60+)`);
const r5 = src.match(/const CAST_R5 = \{([\s\S]*?)\n\};/);
const rows = r5 ? r5[1].split('\n').filter((x) => /^\s+\w+: \{/.test(x)) : [];
ok(rows.length === 15 && rows.every((r) => (r.match(/"(?:[^"\\]|\\.)*"/g) || []).length >= 15), `CAST_R5: ${rows.length} drivers, want 15 with 15+ lines each`);
const sum = Object.entries(by).map(([c, b]) => `${c} ${b.rec}/${b.n}`).join(', ');
console.log(`main cast recorded: ${sum}`);
fs.rmSync(tmp, { recursive: true, force: true });
if (fails.length) { console.log('VOICELINES FAIL\n  ' + fails.join('\n  ')); process.exit(1); }
console.log(`VOICELINES PASS (${fresh.length} lines, ${Object.keys(man.clips).length} clips)`);
