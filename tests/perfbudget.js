// Performance budget: a standard 8-opponent match at high and low quality, measured, compared with tests/perf-baseline.json.
// Draw calls per frame, triangles and textures (median of 3 fresh runs) must not grow >10% (geometries >25%: debris varies); physics step time (fastest of 3 runs) must not double (it warns at +30%: timing is noisy on a shared machine)
// (timing is machine-dependent: it's also printed so you can compare by eye). Prints PERF PASS / PERF FAIL.
// Two absolute budgets too (weak laptops): no layout reads during play (clientWidth & co. after the HUD's writes force a page layout inside the frame),
// and the lowest quality draws the yard from a fixed overview camera in at most LOW_FIXED_MAX calls (main/Build 124: 342-348; claude/perf2: 301-316).
// UPDATE_BASELINE=1 node perfbudget.js rewrites the baseline: only do that on purpose (say why in the commit).
// TSUNAMI=1 forces a tsunami and measures during the flood (compare with the same no-flood baseline; never write the baseline with it).
const fs = require('fs'), path = require('path'); const { open } = require('./harness');
const BASE = path.join(__dirname, 'perf-baseline.json'), LOW_FIXED_MAX = +(process.env.LOW_FIXED_MAX || 332);
(async () => {
  // Each quality level is measured RUNS times, each in a fresh page (a match's own chaos, and other work on the machine, make one run noisy);
  // draw calls and triangles use the median run, physics time the fastest run.
  const RUNS = +(process.env.RUNS || 3), errors = [];
  const one = async (level) => { const o = await open({ viewport: { width: 640, height: 400 } }); errors.push(...o.errors); const page = o.page;
    const r = await page.evaluate(async ([level, tsu]) => {
    const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.S.aiCount = 8; D.S.autoGfx = false; D.applyQuality(level);
    document.getElementById('btnStart').click();
    while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    D.applyQuality(level); await sleep(2000);
    if (tsu) { D.TSU.FLOOD = 60; D.startTsunami(true); const w0 = performance.now(); while (D.TSU.state !== 'flood' && performance.now() - w0 < 300000) await sleep(50); } // TSUNAMI=1: measure during a flood (against the same baseline)
    let stepMs = 0, steps = 0; const W = D.world, o = W.step.bind(W);
    W.step = (...a) => { const t = performance.now(); const r = o(...a); stepMs += performance.now() - t; steps++; return r; };
    // layout reads (clientWidth, offsetHeight, getBoundingClientRect...) during play: each one after the frame's DOM writes makes the browser lay out
    // the page right there, inside the game's frame (Build 124's HUD did it every frame for the name tags)
    let reads = 0; const undo = []; const spy = (proto, k) => { const d = Object.getOwnPropertyDescriptor(proto, k); if (!d) return; if (d.get) { Object.defineProperty(proto, k, { ...d, get() { reads++; return d.get.call(this); } }); } else if (typeof d.value === 'function') { const f = d.value; proto[k] = function (...a) { reads++; return f.apply(this, a); }; } undo.push(() => Object.defineProperty(proto, k, d)); };
    for (const k of ['clientWidth', 'clientHeight', 'offsetWidth', 'offsetHeight']) { spy(Element.prototype, k); spy(HTMLElement.prototype, k); } spy(Element.prototype, 'getBoundingClientRect');
    const calls = [], tris = []; let last = performance.now(); const ft = []; const R = D.renderer; R.info.autoReset = false; R.info.reset();
    const t0 = performance.now();
    await new Promise((res) => { const f = () => { const i = R.info.render; if (i.calls) { calls.push(i.calls); tris.push(i.triangles); } R.info.reset(); const n = performance.now(); ft.push(n - last); last = n; if (n - t0 < 12000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    W.step = o; R.info.autoReset = true; undo.forEach((f) => f());
    // the same picture for every build: a fixed camera over the yard (the match's own camera depends on where you spawn), with the graphics cap a real device has
    D.S.autoGfx = true; D.applyQuality(level); window.__camOverride = { pos: [0, 45, -175], look: [0, 0, 10] }; for (let i = 0; i < 4; i++) await new Promise((r) => requestAnimationFrame(r));
    let fixed = 1e9; for (let i = 0; i < 3; i++) { R.info.autoReset = false; R.info.reset(); await new Promise((r) => requestAnimationFrame(r)); fixed = Math.min(fixed, R.info.render.calls); } R.info.autoReset = true; window.__camOverride = null;
    const avg = (a) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length), p = (a, q) => [...a].sort((x, y) => x - y)[Math.floor(a.length * q)];
    const m = D.renderer.info.memory;
    return { level, frames: ft.length, callsAvg: Math.round(avg(calls)), callsMax: Math.max(...calls), trisAvg: Math.round(avg(tris)), geometries: m.geometries, textures: m.textures,
      physMsPerStep: +(stepMs / Math.max(1, steps)).toFixed(3), layoutReadsPerFrame: +(reads / Math.max(1, ft.length)).toFixed(2), callsFixedCam: fixed, frameMsMed: +p(ft, 0.5).toFixed(1), frameMsP95: +p(ft, 0.95).toFixed(1) };
    }, [level, !!process.env.TSUNAMI]); await o.browser.close(); return r; };
  const med = (xs, k) => [...xs].map((x) => x[k]).sort((a, b) => a - b)[xs.length >> 1];
  const measure = async (level) => { const rs = []; for (let i = 0; i < RUNS; i++) rs.push(await one(level));
    const out = { level, runs: RUNS }; for (const k of ['callsAvg', 'callsMax', 'trisAvg', 'geometries', 'textures', 'frameMsMed', 'frameMsP95', 'callsFixedCam']) out[k] = med(rs, k); out.layoutReadsPerFrame = Math.max(...rs.map((r) => r.layoutReadsPerFrame));
    out.physMsPerStep = Math.min(...rs.map((r) => r.physMsPerStep)); out.spread = { callsAvg: [Math.min(...rs.map((r) => r.callsAvg)), Math.max(...rs.map((r) => r.callsAvg))] }; return out; };
  const hi = await measure(0); const lo = await measure(+(process.env.LOW_LEVEL || 7));
  const cur = { high: hi, low: lo }; console.log(JSON.stringify(cur));
  const pe = errors.filter((e) => !e.includes('ERR_FAILED'));
  if (process.env.UPDATE_BASELINE && !process.env.TSUNAMI) { fs.writeFileSync(BASE, JSON.stringify(cur, null, 2) + '\n'); console.log('baseline written'); }
  const base = fs.existsSync(BASE) ? JSON.parse(fs.readFileSync(BASE, 'utf8')) : null; const fails = [];
  if (base) for (const q of ['high', 'low']) {
    const b = base[q], c = cur[q];
    for (const k of ['callsAvg', 'callsMax', 'trisAvg', 'textures']) if (c[k] > b[k] * 1.10 + 5) fails.push(`${q} ${k} ${b[k]} -> ${c[k]} (>10%)`);
    if (c.geometries > b.geometries * 1.25) fails.push(`${q} geometries ${b.geometries} -> ${c.geometries} (>25%; debris makes this vary)`);
    if (c.physMsPerStep > b.physMsPerStep * 2 + 0.1) fails.push(`${q} physics step ${b.physMsPerStep} -> ${c.physMsPerStep} ms (>2x)`); else if (c.physMsPerStep > b.physMsPerStep * 1.3) console.log(`WARN ${q} physics step ${b.physMsPerStep} -> ${c.physMsPerStep} ms: timing is noisy on a busy machine; re-run, and if it holds, find out why`);
    console.log(`${q}: draw calls ${b.callsAvg}->${c.callsAvg} (max ${b.callsMax}->${c.callsMax}) · triangles ${b.trisAvg}->${c.trisAvg} · geometries ${b.geometries}->${c.geometries} · textures ${b.textures}->${c.textures} · physics ${b.physMsPerStep}->${c.physMsPerStep} ms/step · frame ms med ${b.frameMsMed}->${c.frameMsMed} p95 ${b.frameMsP95}->${c.frameMsP95} (software GPU: compare by eye)`);
  } else fails.push('no baseline: run UPDATE_BASELINE=1 node tests/perfbudget.js');
  // absolute budgets (Build 125, weak laptops): the HUD reads no layout during play, and the lowest quality draws the yard from the fixed camera in
  // under LOW_FIXED_MAX calls (Build 124: 342, this branch 301-316: scenery that differed only in colour, and the hazard bands, share draws now)
  for (const q of ['high', 'low']) if (cur[q].layoutReadsPerFrame > 0.05) fails.push(`${q} layout reads ${cur[q].layoutReadsPerFrame} per frame (budget 0.05: read sizes from a ResizeObserver, not in the frame)`);
  if (!process.env.TSUNAMI && cur.low.callsFixedCam > LOW_FIXED_MAX) fails.push(`low draw calls from the fixed camera ${cur.low.callsFixedCam} (budget ${LOW_FIXED_MAX})`);
  console.log(`budgets: layout reads/frame high ${cur.high.layoutReadsPerFrame} low ${cur.low.layoutReadsPerFrame} (max 0.05) · fixed-camera draw calls high ${cur.high.callsFixedCam} low ${cur.low.callsFixedCam} (low max ${LOW_FIXED_MAX})`);
  if (pe.length) fails.push('page errors: ' + pe.slice(0, 2).join(' | '));
  fails.forEach((f) => console.log('FAIL ' + f));
  console.log(fails.length ? 'PERF FAIL' : 'PERF PASS'); process.exit(fails.length ? 1 : 0);
})();
