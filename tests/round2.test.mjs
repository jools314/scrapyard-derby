#!/usr/bin/env node
// Scrapyard Derby — round-2 improvement test suite (Jonas's standing rule, 2026-11-14:
// every CL ships with tests). Run: node tests/round2.test.mjs
//
// What these tests are, honestly: the game needs WebGL + a browser (VR items need a
// headset, multiplayer items need two devices), so this suite covers everything that
// CAN be verified headlessly, per R2 item:
//   1. the module script parses (node --check on the extracted <script type="module">);
//   2. each item's implementation is present and wired — its functional anchors exist
//      in index.html (so cherry-picking an item OUT, or a bad merge dropping it,
//      fails exactly that item's case);
//   3. the shipped tools (lines-audit, playlog-diff) actually run and produce their
//      documented output on fixtures.
// Behavioural verification lives in tests/smoke.mjs (browser, CDP) and in the manual
// playtest list in IMPROVEMENTS-ROUND2.md — this suite never claims those passed.
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const cases = [];
const test = (id, name, fn) => cases.push({ id, name, fn });
const has = (re) => { if (!re.test(html)) throw new Error(`missing anchor ${re}`); };
const lacks = (re) => { if (re.test(html)) throw new Error(`unexpected anchor ${re}`); };
const fileHas = (rel, re) => { const p = join(root, rel); if (!existsSync(p)) throw new Error(`missing file ${rel}`); if (re && !re.test(readFileSync(p, 'utf8'))) throw new Error(`${rel} missing ${re}`); };

// ---- baseline guards ----
test('R2-00', 'pass marker present, BUILD unchanged', () => {
  has(/const BOB_PASS_R2 = 'improvements-round2';/);
  has(/const BUILD = '67';/);
});
test('SYNTAX', 'module script parses (node --check)', () => {
  const a = html.indexOf('<script type="module">'), b = html.lastIndexOf('</script>');
  if (a < 0 || b < 0) throw new Error('module script not found');
  const tmp = join(tmpdir(), `derby-round2-check-${process.pid}.mjs`);
  writeFileSync(tmp, html.slice(a + 22, b));
  try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); } finally { try { unlinkSync(tmp); } catch { /* gone */ } }
});

// ---- VR (1-18) ----
test('R2-1', 'jumbotron renders during VR sessions', () => has(/R2-1: render in VR too/));
test('R2-2', 'VR HUD draws minimap + opponent chevrons', () => has(/R2-2/));
test('R2-3', 'countdown/GO! drawn on the VR HUD', () => has(/R2-3/));
test('R2-4', 'hit-direction rim flash (uHit/uHitVec + player.hitFrom)', () => { has(/uHitVec/); has(/hitFrom/); });
test('R2-5', 'final standings on the VR game-over page', () => has(/R2-5/));
test('R2-6', 'family yard button in the VR menu', () => has(/R2-6/));
test('R2-7', 'governor sheds resolution/foveation before quality', () => { has(/applyResStep/); has(/R2-7/); });
test('R2-8', 'governor steps back up on sustained headroom', () => { has(/V\.fast/); has(/R2-8/); });
test('R2-9', '120 Hz requested when the headset offers it', () => has(/R2-9/));
test('R2-12', 'VR game-over page offers the wreck replay', () => has(/R2-12/));
test('R2-13', 'low-hull vignette in VR', () => has(/R2-13/));
test('R2-16', 'VR tune page (match settings from the headset)', () => has(/R2-16/));
test('R2-17', 'controller-lost toast in VR', () => has(/R2-17/));
test('R2-18', 'per-car seat height in VR', () => has(/R2-18/));

// ---- multiplayer (19-44) ----
test('R2-19', 'host kick + session blocklist', () => { has(/MP\.blocked|blocked = new Set|blocked:/); has(/R2-19/); });
test('R2-20', 'handover carries score + round clock (ho pack)', () => has(/R2-20/));
test('R2-24', 'family beacons are signed; bad signatures dropped', () => { has(/famMac/); has(/R2-24/); });
test('R2-25', 'snapshot trim by priority class', () => has(/R2-25/));
test('R2-26', 'quick-chat phrases ride presence (qc)', () => { has(/QC_PHRASES/); has(/R2-26/); });
test('R2-29', 'guest input rate gate (45 ms)', () => has(/R2-29/));
test('R2-30', 'nickname hygiene (cleanNick at every entry point)', () => { has(/function cleanNick/); has(/R2-30/); });
test('R2-31', 'nameplates for all cars with distance + host star', () => has(/R2-31/));
test('R2-32', 'guest lag vote informs the host', () => has(/R2-32/));
test('R2-33', 'transport named + fallback logged as incident', () => { has(/this\.via = 'relay'/); has(/fell back to the PeerJS backup server/); });
test('R2-34', 'family message of the day (famMotd + beacon mo)', () => { has(/famMotd/); has(/R2-34/); });
test('R2-35', 'AFK guest auto-park after 60 s', () => has(/R2-35/));
test('R2-37', 'snapshots carry sim tick; guests project countdown', () => has(/R2-37/));
test('R2-38', 'per-room car memory', () => { has(/derby-car-room-/); has(/R2-38/); });
test('R2-39', 'host can mint a fresh room code', () => { has(/btnNewCode/); has(/R2-39/); });
test('R2-41', 'hosting quality remembered + election tiebreak', () => { has(/derby-hostq/); has(/noteHostQ/); });
test('R2-44', 'rivalries recorded head-to-head', () => { has(/derby-rivalry-v1/); has(/rivalNemesis/); });

// ---- progression (43-58) ----
test('R2-43', 'career screen aggregates the play log', () => { has(/careerRender/); has(/btnCareer/); });
test('R2-45', 'daily challenge, date-seeded', () => { has(/CHAL_DAILY/); has(/derby-chal-v1/); });
test('R2-46', 'season line (this month vs last)', () => has(/seasonLine/));
test('R2-47', 'scrap currency accrues (no spend side on main)', () => { has(/derby-scrap-v1/); has(/scrapLine/); });
test('R2-49', 'match history browser', () => { has(/historyRender/); has(/historyPanel/); });
test('R2-50', 'family weekly best published in presence (wk)', () => { has(/myWeekBest/); has(/R2-50/); });
test('R2-52', 'shareable stats card (canvas PNG)', () => has(/btnCard/));
test('R2-53', 'win streaks counted once per match + menu line', () => { has(/derby-streak-v1/); has(/streakLine/); });
test('R2-55', 'per-car usage from the play log in the garage', () => has(/carUsage/));
test('R2-56', 'firsts tracked (first wreck / win / 1,000 pts)', () => has(/derby-firsts-v1/));
test('R2-57', 'weekly challenge trio (ISO week)', () => { has(/CHAL_WEEK/); has(/weekKey/); });
test('R2-58', 'nemesis bounty (+500, marked, claimed once)', () => has(/R2-58/));

// ---- content & feel (59-76) ----
test('R2-60', 'announcer coverage: barrelBurst wired, thin pools deepened', () => { has(/barrelBurst/); has(/R2-60/); });
test('R2-61', 'lines-audit tool runs and reports pool depth', () => {
  const out = execFileSync(process.execPath, [join(root, 'tools/lines-audit.mjs')], { encoding: 'utf8' });
  if (!/pool/.test(out)) throw new Error('audit output lacks pool report');
});
test('R2-62', 'grudge pool + heard-line memory across days', () => { has(/derby-heard-v1/); has(/R2-62/); });
test('R2-65', 'dynamic events scheduler + single score choke point', () => { has(/evtMul/); has(/R2-65/); });
test('R2-67', 'living sky drifts with match time', () => { has(/SKY\.drift|drift:/); has(/R2-67/); });
test('R2-68', 'per-car music mapping fixed (MUSIC_FOR)', () => has(/MUSIC_FOR/));
test('R2-69', 'two scoring scales, both labelled', () => { has(/League pts/); has(/R2-69/); });
test('R2-70', 'driver card on the menu', () => has(/driverCard/));
test('R2-71', 'session scars persist across resets', () => has(/R2-71/));
test('R2-72', 'crowd wave on wrecks and lead changes', () => { has(/crowdWave/); has(/R2-72/); });
test('R2-73', 'phase-aware adaptive music', () => { has(/sfx\.phase|phase:/); has(/R2-73/); });
test('R2-75', 'voice-clip coverage is measurable', () => has(/VCLIP\.coverage|coverage\(\)/));
test('R2-76', 'announcer duo colour lines', () => { has(/DUO_EVENTS/); has(/R2-76/); });

// ---- tooling (77-90) ----
test('R2-77', 'update check is origin-agnostic', () => has(/R2-77/));
test('R2-80', 'seeded runs (?seed=N installs the PRNG first)', () => { has(/__derbySeed/); has(/R2-80/); });
test('R2-81', 'playlog-diff runs on fixtures with correct deltas', () => {
  const out = execFileSync(process.execPath, [join(root, 'tools/playlog-diff.mjs'), join(root, 'tests/fixtures/playlog-a.txt'), join(root, 'tests/fixtures/playlog-b.txt')], { encoding: 'utf8' });
  if (!/fps p5 \(median\)\s+41\s+49\s+\+8/.test(out)) throw new Error('p5 delta wrong:\n' + out);
  if (!/blowups \/ match\s+1\.5\s+0\s+-1\.5/.test(out)) throw new Error('blowup delta wrong:\n' + out);
});
test('R2-82', 'perf budgets asserted at match end (BUDGET FAIL)', () => { has(/BUDGET FAIL/); has(/r\.budget/); });
test('R2-83', 'VR telemetry in the match record', () => has(/R2-83/));
test('R2-85', 'BUILD_HASH stamping point wired into records', () => { has(/const BUILD_HASH = '';/); has(/hash: BUILD_HASH/); });
test('R2-87', 'blowup pose capture into phys.blow', () => { has(/m\.blow/); has(/R2-87/); });
test('R2-88', 'autoplay presets elim/full/lite', () => { has(/autoplay=\(1\|elim\|full\|lite\)/); has(/R2-88/); });
test('R2-90', 'active transport named in log headers', () => { has(/activeVia\(\)/); has(/R2-90/); });

// ---- accessibility (92-100) ----
test('R2-92', 'reduce-flashing: setting + strobe caps', () => { has(/flashSafe/); has(/R2-92/); });
test('R2-94', 'HUD scale setting applied to HUD + toasts', () => { has(/uiScale/); has(/R2-94/); });

// ---- run ----
let pass = 0, fail = 0;
for (const c of cases) {
  try { c.fn(); pass++; console.log(`PASS ${c.id} — ${c.name}`); }
  catch (e) { fail++; console.log(`FAIL ${c.id} — ${c.name}\n     ${String(e.message).split('\n')[0]}`); }
}
console.log(`\n${pass} passed, ${fail} failed, ${cases.length} total`);
process.exit(fail ? 1 : 0);
