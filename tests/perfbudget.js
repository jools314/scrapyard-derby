// Performance budget: a standard 8-opponent match at high and low quality, measured, compared with tests/perf-baseline.json.
// Draw calls per frame, triangles and textures must not grow >10% (geometries >25%: debris varies); physics step time must not double (it warns at +30%: timing is noisy on a shared machine)
// (timing is machine-dependent: it's also printed so you can compare by eye). Prints PERF PASS / PERF FAIL.
// UPDATE_BASELINE=1 node perfbudget.js rewrites the baseline: only do that on purpose (say why in the commit).
const fs = require('fs'), path = require('path'); const { open } = require('./harness');
const BASE = path.join(__dirname, 'perf-baseline.json');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  const run = async (level) => page.evaluate(async (level) => {
    const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.S.aiCount = 8; D.S.autoGfx = false; D.applyQuality(level);
    if (D.game.state !== 'menu') { D.game.state = 'menu'; }
    document.getElementById('btnStart').click();
    while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    D.applyQuality(level); await sleep(2000);
    let stepMs = 0, steps = 0; const W = D.world, o = W.step.bind(W);
    W.step = (...a) => { const t = performance.now(); const r = o(...a); stepMs += performance.now() - t; steps++; return r; };
    const calls = [], tris = []; let last = performance.now(); const ft = []; const R = D.renderer; R.info.autoReset = false; R.info.reset();
    const t0 = performance.now();
    await new Promise((res) => { const f = () => { const i = R.info.render; if (i.calls) { calls.push(i.calls); tris.push(i.triangles); } R.info.reset(); const n = performance.now(); ft.push(n - last); last = n; if (n - t0 < 15000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    W.step = o; R.info.autoReset = true;
    const avg = (a) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length), p = (a, q) => [...a].sort((x, y) => x - y)[Math.floor(a.length * q)];
    const m = D.renderer.info.memory;
    return { level, frames: ft.length, callsAvg: Math.round(avg(calls)), callsMax: Math.max(...calls), trisAvg: Math.round(avg(tris)), geometries: m.geometries, textures: m.textures,
      physMsPerStep: +(stepMs / Math.max(1, steps)).toFixed(3), frameMsMed: +p(ft, 0.5).toFixed(1), frameMsP95: +p(ft, 0.95).toFixed(1) };
  }, level);
  await page.evaluate(() => { window.__noRender = false; });
  const hi = await run(0); await page.evaluate(() => { __derby.game.state = 'menu'; }); const lo = await run(+(process.env.LOW_LEVEL || 7));
  const cur = { high: hi, low: lo }; console.log(JSON.stringify(cur));
  const pe = errors.filter((e) => !e.includes('ERR_FAILED'));
  if (process.env.UPDATE_BASELINE) { fs.writeFileSync(BASE, JSON.stringify(cur, null, 2) + '\n'); console.log('baseline written'); }
  const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : null; const fails = [];
  if (base) for (const q of ['high', 'low']) {
    const b = base[q], c = cur[q];
    for (const k of ['callsAvg', 'callsMax', 'trisAvg', 'textures']) if (c[k] > b[k] * 1.10 + 5) fails.push(`${q} ${k} ${b[k]} -> ${c[k]} (>10%)`);
    if (c.geometries > b.geometries * 1.25) fails.push(`${q} geometries ${b.geometries} -> ${c.geometries} (>25%; debris makes this vary)`);
    if (c.physMsPerStep > b.physMsPerStep * 2 + 0.1) fails.push(`${q} physics step ${b.physMsPerStep} -> ${c.physMsPerStep} ms (>2x)`); else if (c.physMsPerStep > b.physMsPerStep * 1.3) console.log(`WARN ${q} physics step ${b.physMsPerStep} -> ${c.physMsPerStep} ms: timing is noisy on a busy machine; re-run, and if it holds, find out why`);
    console.log(`${q}: draw calls ${b.callsAvg}->${c.callsAvg} (max ${b.callsMax}->${c.callsMax}) · triangles ${b.trisAvg}->${c.trisAvg} · geometries ${b.geometries}->${c.geometries} · textures ${b.textures}->${c.textures} · physics ${b.physMsPerStep}->${c.physMsPerStep} ms/step · frame ms med ${b.frameMsMed}->${c.frameMsMed} p95 ${b.frameMsP95}->${c.frameMsP95} (software GPU: compare by eye)`);
  } else fails.push('no baseline: run UPDATE_BASELINE=1 node tests/perfbudget.js');
  if (pe.length) fails.push('page errors: ' + pe.slice(0, 2).join(' | '));
  fails.forEach((f) => console.log('FAIL ' + f));
  await browser.close(); console.log(fails.length ? 'PERF FAIL' : 'PERF PASS'); process.exit(fails.length ? 1 : 0);
})();
