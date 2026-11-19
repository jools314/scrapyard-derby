// Weak-device match profile (the Chromebook stand-in): 4x CPU throttle (CDP), a big 2560x1305 window, quality 7 (50% res),
// autoplay drives the player through a real match. Prints the game's own per-system breakdown (SEC, ms per frame), the
// PERFREP split (game step / drawing prep / three.js render), frame ms median and p95, draw calls, triangles and programs.
// PROFILE=1 also takes a CDP CPU profile of the measured window and prints the top self-time functions.
// The throttle starts once the match is running (THR_EARLY=1: from page load).
// Usage: node tools/perf/weakprof.js [GAME=path/to/index.html] [Q=7] [THR=4] [SECS=25] [W=2560 H=1305] [OPP=6]
const path = require('path'); const H = require(path.join(__dirname, '..', '..', 'tests', 'harness'));
const THR = +(process.env.THR || 4), Q = +(process.env.Q ?? 7), SECS = +(process.env.SECS || 25), W = +(process.env.W || 2560), HH = +(process.env.H || 1305), OPP = +(process.env.OPP || 6);
(async () => {
  let cdp;
  const throttle = async (page) => { page.setDefaultTimeout(600000); cdp = await page.context().newCDPSession(page); if (process.env.THR_EARLY) await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR }); }; // (by default the throttle starts once the match runs: startup is not what this measures, and at 4x it takes minutes)
  const T0 = Date.now(), log = (m) => console.error(`[${((Date.now() - T0) / 1000).toFixed(0)}s] ${m}`);
  const { browser, page, errors } = await H.open({ viewport: { width: W, height: HH } }, null, throttle);
  log('page open');
  await page.evaluate(({ Q, OPP, AG }) => { const D = __derby; D.S.aiCount = OPP; D.S.autoGfx = AG; D.applyQuality(Q); document.getElementById('btnStart').click(); }, { Q, OPP, AG: !process.env.FIXGFX }); // (autoGfx on, as on real devices: the quality step's graphics cap applies; at the lowest step the governor can only go up, which a weak machine never earns)
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 900000, polling: 1000 });
  log('match running'); await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
  await page.evaluate((Q) => { __derby.AUTO.on = true; __derby.applyQuality(Q); }, Q);
  await page.waitForTimeout(+(process.env.SETTLE || 6000)); log('measuring');
  if (process.env.PROFILE) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start'); }
  const r = await page.evaluate(async (SECS) => {
    const D = __derby, R = D.renderer, L = D.PERFREP.lastSnap; const s0 = { t: { ...L.t }, n: L.n }; const ft = [], calls = [], tris = []; let last = performance.now(); const t0 = last; // (s0: the per-frame SEC snapshot PERFREP keeps, so this works on builds that don't export SEC)
    const f0 = D.PERFREP.f.length;
    await new Promise((res) => { let done = false; const end = () => { if (!done) { done = true; res(); } }; setTimeout(end, SECS * 1000 + 30000); const f = () => { if (done) return; const n = performance.now(); ft.push(n - last); last = n; calls.push(D.PERFREP.calls); tris.push(D.PERFREP.tris); if (n - t0 < SECS * 1000) requestAnimationFrame(f); else end(); }; requestAnimationFrame(f); }); // (a timer ends it too, if frames stall)
    const F = D.PERFREP.f.slice(-Math.min(ft.length, 900)); const avg = (a) => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length); const p = (a, q) => [...a].sort((x, y) => x - y)[Math.floor(a.length * q)];
    const sum = D.PERFREP.summary('prof', s0), parts = sum ? sum.parts : '?';
    return { frames: ft.length, fps: +(1000 / avg(ft)).toFixed(1), frameMsMed: +p(ft, 0.5).toFixed(1), frameMsP95: +p(ft, 0.95).toFixed(1), frameMsP99: +p(ft, 0.99).toFixed(1),
      sim: +avg(F.map((x) => x[2])).toFixed(2), drawPrep: +avg(F.map((x) => x[3])).toFixed(2), render: +avg(F.map((x) => x[4])).toFixed(2), drawPrepP95: +p(F.map((x) => x[3]), 0.95).toFixed(1),
      verdict: sum && sum.verdict, calls: Math.round(avg(calls)), callsMax: Math.max(...calls), tris: Math.round(avg(tris)), programs: (R.info.programs || []).length, geometries: R.info.memory.geometries, textures: R.info.memory.textures,
      parts, q: D.QUALITY ? D.QUALITY.level : '?', pr: R.getPixelRatio(), cars: D.cars ? D.cars.length : '?', alive: D.cars ? D.cars.filter((c) => !c.wrecked).length : '?' };
  }, SECS);
  console.log(JSON.stringify(r));
  if (process.env.PROFILE) {
    const { profile } = await cdp.send('Profiler.stop'); const self = new Map(), byId = new Map(); for (const n of profile.nodes) byId.set(n.id, n);
    const dts = profile.timeDeltas; const cnt = new Map(); profile.samples.forEach((id, i) => cnt.set(id, (cnt.get(id) || 0) + (dts[i] || 0)));
    let tot = 0; for (const [id, us] of cnt) { const n = byId.get(id), cf = n.callFrame, k = `${cf.functionName || '(anon)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + us); tot += us; }
    const top = [...self].sort((a, b) => b[1] - a[1]).slice(0, +(process.env.TOP || 40));
    console.log('top self time (% of sampled):'); for (const [k, us] of top) console.log(`  ${(100 * us / tot).toFixed(1).padStart(5)}%  ${(us / 1000).toFixed(0).padStart(6)} ms  ${k}`);
    if (process.env.PROFOUT) require('fs').writeFileSync(process.env.PROFOUT, JSON.stringify(profile));
  }
  const pe = errors.filter((e) => e.startsWith('pageerror')); if (pe.length) console.log('page errors:', pe.slice(0, 3).join(' | '));
  await browser.close();
})();
