// Self-play: headless AI-only autoplay matches, summed per car (a measuring tool, not part of run.sh).
//   MATCHES=24 PAR=3 APLEN=90 OPP=9 LOG=run.jsonl node tests/selfplay.js   (GAME=/path/to/index.html picks the build)
//   AGG=run.jsonl node tests/selfplay.js   summarises a saved (or partial) run: each match is appended to LOG as it ends
// Time is warped: every animation frame is 1/60 s of game time and the next one starts at once, so a match runs as fast as
// this machine can step it. The AI think step is timed with the real clock (ms of think() per sim frame, all cars together).
// Prints one JSON line per car (lives, wrecks dealt k, wrecked d, K/D, damage dealt/taken per life, life s, special uses per
// life, stuck s per life) and a SELFPLAY line with the totals. OUT=file.json also writes it all to a file.
const fs = require('fs'); const { open } = require('./harness');
const MATCHES = +(process.env.MATCHES || 24), PAR = +(process.env.PAR || 3), APLEN = +(process.env.APLEN || 90), OPP = +(process.env.OPP || 9);
const warp = () => { const rn = performance.now.bind(performance); window.__realNow = rn; let v = rn(); performance.now = () => v; window.__noRender = true;
  const mc = new MessageChannel(), q = []; mc.port1.onmessage = () => { const cbs = q.splice(0); v += 1000 / 60; for (const cb of cbs) cb(v); };
  window.requestAnimationFrame = (cb) => { q.push(cb); if (q.length === 1) mc.port2.postMessage(0); return q.length; }; window.cancelAnimationFrame = () => {}; };
async function worker(n, id, sink) { // runs n matches in one page, handing each match record to sink as soon as it is logged
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } }, warp);
  await page.evaluate(({ APLEN, OPP }) => {
    const D = __derby, rn = window.__realNow; D.S.aiCount = OPP; window.__sp = { recs: [], thinkMs: 0, simFrames: 0 }; let lastSim = -1; const S = window.__sp;
    const wrap = () => { const c = D.cars[0]; if (!c) return; const proto = Object.getPrototypeOf(c); if (proto.__wrapped) return; proto.__wrapped = true; const o = proto.think; proto.think = function (dt) { const t = rn(); o.call(this, dt); S.thinkMs += rn() - t; if (D.simTime !== lastSim) { lastSim = D.simTime; S.simFrames++; } }; };
    const ol = D.AUTO.logged.bind(D.AUTO); D.AUTO.logged = (r) => { S.recs.push({ veh: r.veh, stuck: r.stuck, game: r.game, cars: r.cars }); ol(r); };
    D.AUTO.matchSecs = APLEN; document.getElementById('btnAutoplay').click(); D.AUTO.matchSecs = APLEN; setInterval(wrap, 200);
  }, { APLEN, OPP });
  let got = 0; const t0 = Date.now();
  while (got < n && Date.now() - t0 < 3 * 3600e3) { await new Promise((r) => setTimeout(r, 3000));
    const r = await page.evaluate(() => { const S = window.__sp, out = { recs: S.recs.splice(0), thinkMs: S.thinkMs, simFrames: S.simFrames }; S.thinkMs = 0; S.simFrames = 0; return out; });
    for (const m of r.recs) { got++; sink({ worker: id, m }); } sink({ worker: id, thinkMs: r.thinkMs, simFrames: r.simFrames }); }
  await browser.close(); for (const e of errors.filter((e) => !e.includes('ERR_FAILED'))) sink({ worker: id, error: e });
}
function summarise(lines) {
  const veh = {}, head = (lines.find((L) => L.head) || {}).head || { aplen: APLEN, opp: OPP }; let think = 0, frames = 0, matches = 0, stuckN = 0, stuckS = 0, errs = [];
  for (const L of lines) { if (L.error) errs.push(L.error); if (L.thinkMs !== undefined) { think += L.thinkMs; frames += L.simFrames; } const m = L.m; if (!m) continue;
    matches++; stuckN += m.stuck ? m.stuck.n : 0; stuckS += m.stuck ? m.stuck.secs : 0;
    for (const [k, v] of Object.entries(m.veh || {})) { const a = veh[k] || (veh[k] = { lives: 0, k: 0, d: 0, dmg: 0, taken: 0, life: 0, fires: 0, stuckS: 0 }); for (const f of ['lives', 'k', 'd', 'dmg', 'taken', 'life', 'fires']) a[f] += v[f] || 0; }
    for (const s of (m.stuck && m.stuck.list) || []) if (veh[s.car]) veh[s.car].stuckS += s.secs; }
  const r1 = (x) => Math.round(x * 100) / 100, out = { matches, aplen: head.aplen, opp: head.opp, thinkMsPerFrame: r1(think / Math.max(1, frames)), stuckN, stuckS: Math.round(stuckS), errors: errs.length, cars: {} };
  for (const [k, a] of Object.entries(veh).sort()) { const L = Math.max(1, a.lives); out.cars[k] = { lives: a.lives, k: a.k, d: a.d, kd: r1(a.k / Math.max(1, a.d)), dmgL: Math.round(a.dmg / L), takenL: Math.round(a.taken / L), lifeS: Math.round(a.life / L), firesL: r1(a.fires / L), stuckL: r1(a.stuckS / L) }; }
  return { out, errs };
}
(async () => {
  const LOG = process.env.LOG; let lines = [];
  if (process.env.AGG) lines = fs.readFileSync(process.env.AGG, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); // summarise a saved run
  else { const per = Math.ceil(MATCHES / PAR); const sink = (o) => { lines.push(o); if (LOG) fs.appendFileSync(LOG, JSON.stringify(o) + '\n'); };
    sink({ head: { aplen: APLEN, opp: OPP, game: process.env.GAME || 'index.html' } }); await Promise.all(Array.from({ length: PAR }, (_, i) => worker(per, i, sink))); }
  const { out, errs } = summarise(lines);
  for (const [k, c] of Object.entries(out.cars)) console.log(k.padEnd(11), JSON.stringify(c));
  const { cars, ...tot } = out; console.log('SELFPLAY', JSON.stringify(tot));
  if (errs.length) console.log('errors:', errs.slice(0, 3));
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
})();
