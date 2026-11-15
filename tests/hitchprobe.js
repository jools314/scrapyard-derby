// Hitch probe (diagnostic, not in the quick suite): autoplay one long match with rendering on and record
//  - every frame where a new shader program had to be compiled (renderer.info.programs grew) and how long that render took
//  - physics step spikes, with the number of bodies in the world and how many are awake
// Usage: GAME=../index.html SECS=240 node hitchprobe.js   -> prints a summary + HITCHPROBE DONE
const { open } = require('./harness');
const SECS = +(process.env.SECS || 240);
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  await page.goto('http://game.local/?autoplay=1&aplen=' + (SECS + 60), { timeout: 180000 });
  await page.waitForFunction(() => window.__derby && __derby.AUTO.on && __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
  const r = await page.evaluate(async (SECS) => {
    const D = __derby, R = D.renderer, W = D.world, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    await sleep(3000); // past the warm-up
    let lastTy = D.cars.map((c) => c.T && c.T.name).join(','); const compiles = [], phys = [], bodyPeak = { n: 0, awake: 0, t: 0 }; let stepN = 0, stepMs = 0;
    const oR = R.render.bind(R); R.render = (s, c) => { const p0 = (R.info.programs || []).length, t = performance.now(); const x = oR(s, c); const ms = performance.now() - t, p1 = (R.info.programs || []).length;
      if (p1 > p0) { const ty = D.cars.map((c) => c.T && c.T.name).join(','), nw = (R.info.programs || []).slice(-(p1 - p0)).map((q) => q.cacheKey), old = (R.info.programs || []).slice(0, p0).map((q) => q.cacheKey);
        const diff = nw.slice(0, 3).map((k) => { const a = k.split(','); let best = null, bd = 1e9; for (const o of old) { const b = o.split(','); if (b.length !== a.length) continue; const d = a.reduce((n, v, i) => n + (v !== b[i]), 0); if (d < bd) { bd = d; best = b; } } return best ? a.map((v, i) => v !== best[i] ? i + ':' + best[i] + '->' + v : null).filter(Boolean).join(' ') : 'no same-length match: ' + k.slice(0, 120); });
        compiles.push({ t: +D.game.time.toFixed(1), n: p1 - p0, ms: +ms.toFixed(0), cars: ty, newCars: ty.split(',').filter((x) => !(lastTy || '').split(',').includes(x)).join(','), diff }); lastTy = ty; } return x; };
    const oS = W.step.bind(W); W.step = (...a) => { const t = performance.now(); const x = oS(...a); const ms = performance.now() - t; stepN++; stepMs += ms;
      const n = W.bodies.length; let aw = 0; for (const b of W.bodies) if (b.type === 1 && b.sleepState !== 2) aw++;
      if (aw > bodyPeak.awake) Object.assign(bodyPeak, { n, awake: aw, t: +D.game.time.toFixed(1) });
      if (ms > 12) phys.push({ t: +D.game.time.toFixed(1), ms: +ms.toFixed(1), bodies: n, awake: aw, debris: (D.debris || []).length }); return x; };
    const samples = []; const t0 = performance.now();
    while (performance.now() - t0 < SECS * 1000) { await sleep(5000); let aw = 0; for (const b of W.bodies) if (b.type === 1 && b.sleepState !== 2) aw++; samples.push([Math.round(D.game.time), W.bodies.length, aw]); }
    R.render = oR; W.step = oS;
    return { compiles, phys: phys.sort((a, b) => b.ms - a.ms).slice(0, 25), physSpikes: phys.length, stepAvg: +(stepMs / stepN).toFixed(2), bodyPeak, samples, programs: (R.info.programs || []).length };
  }, SECS);
  console.log('shader compiles during play:', r.compiles.length, 'programs now', r.programs);
  for (const c of r.compiles) console.log('  t' + c.t, '+' + c.n, c.ms + ' ms', 'new cars: ' + c.newCars, '\n     ' + c.diff.join('\n     '));
  console.log('physics: avg', r.stepAvg, 'ms/step,', r.physSpikes, 'steps over 12 ms; peak awake bodies', JSON.stringify(r.bodyPeak));
  for (const p of r.phys) console.log('  t' + p.t, p.ms + ' ms', 'bodies', p.bodies, 'awake', p.awake, 'debris', p.debris);
  console.log('samples [t, bodies, awake]:', JSON.stringify(r.samples));
  console.log('errors:', errors.length); console.log('HITCHPROBE DONE');
  await browser.close();
})();
