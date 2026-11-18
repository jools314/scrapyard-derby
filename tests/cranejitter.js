// Crane jitter at low fps (Chromebook play logs, Build 118, ~20 fps at quality 7): a car held by the magnet crane jittered and
// tripped the physics safety net many times a second ("solver kick undone": 122-269 blow-ups in one match against 0-26 normally),
// and a flight log showed 'craned,air' with vertical speed going -11.6 -> +16.4 m/s in 0.1 s. The Mac at 60 fps never showed it.
// This drives the frame clock at ~20 fps (35-65 ms frames, seeded; 2-3 physics steps a frame) at quality 7 (8 solver passes, 3 catch-up steps),
// makes the crane grab a parked car (a light Cruiser, then a heavy Fire truck) right where the logged catches sat, and checks, while
// the car hangs: no solver kick undone and no other blow-up on it, no big vertical speed swings; and that it still gets lifted,
// swung and dropped. Fails on the pre-fix tree: the kinematic magnet was teleported to the crane's spot every frame and given a velocity
// from where the physics had left it, so its velocity flipped between ~2x and 0 frame to frame; at 2-3 steps a frame the stiff magnet
// joint turned that into kicks on the held car.
const { open } = require('./harness');
const INIT = () => { const nat = window.requestAnimationFrame.bind(window); let virt = 0, last = 0, seed = 7; window.__dt = 0; window.__jit = 0; window.__rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647); /* __dt (ms) set: every frame is that long; 0: real time */
  window.requestAnimationFrame = (cb) => nat((t) => { if (!last) { virt = t; last = t; } const d = window.__dt ? window.__dt * (window.__jit ? 1 + window.__jit * (2 * window.__rnd() - 1) : 1) : t - last; last = t; virt += d; cb(virt); }); };
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } }, INIT);
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 1; __derby.S.autoGfx = false; __derby.applyQuality(7); document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
  const r = await page.evaluate(async () => {
    const D = __derby, C = D.CRANE, sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const wt = async (s) => { const t0 = D.game.time; while (D.game.time - t0 < s) await sleep(10); };
    const park = (c) => { c.think = () => {}; c.ctrl.throttle = 0; c.ctrl.steer = 0; c.ctrl.fire = false; c.ctrl.handbrake = true; };
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    window.__dt = 50; window.__jit = 0.3; /* ~20 fps from here on: 35-65 ms frames (seeded), as a weak Chromebook's frames wander; the game caps a frame at 50 ms, so it runs 2 or 3 physics steps a frame */
    await wt(0.5);
    const out = { q: D.QUALITY.level, iters: D.world.solver.iterations, sub: D.QUALITY.subSteps, runs: [] };
    const P = D.player; park(P); P.body.position.set(-100, 2.2, 100); P.body.velocity.set(0, 0, 0);
    for (const [type, x, z] of [['cruiser', 92, -60], ['firetruck', 102, -60]]) {
      let ai = D.cars.find((c) => c !== D.player); if (ai.type !== type || ai.wrecked) { D.respawnCar(ai, type); await wt(0.3); ai = D.cars.find((c) => c !== D.player); }
      park(ai); ai.health = 100; ai.body.position.set(x, 2.4, z); ai.body.quaternion.setFromEuler(0, 0.4, 0); ai.body.velocity.set(0, 0, 0); ai.body.angularVelocity.set(0, 0, 0);
      P.body.position.set(-100, 2.2, 100); P.body.velocity.set(0, 0, 0);
      D.resetCrane ? D.resetCrane() : null; await wt(1.2);
      /* the crane's victim pick is random in time: hand it this car directly */
      C.state = 'seek'; C.target = ai; C.t = 14; D.game.grace = 0;
      const run = { type, grabbed: false, released: false, heldS: 0, y0: null, yMax: -99, undos: 0, blowups: 0, maxDvy: 0, vyMin: 99, vyMax: -99, kinds: {} };
      const samples = []; /* [simTime, vy] for every physics step while held */
      const hook = () => { if (C.held !== ai) return; samples.push([D.simTime, ai.body.velocity.y]); };
      D.world.addEventListener('postStep', hook);
      D.PHYS.log.length = 0; let b0 = null; const tStart = D.game.time; let tGrab = null;
      while (D.game.time - tStart < 30) {
        await sleep(10);
        if (C.held === ai && tGrab == null) { tGrab = D.game.time; run.grabbed = true; run.y0 = ai.body.position.y; b0 = D.PHYS.blowups; }
        if (tGrab != null && C.held === ai) run.yMax = Math.max(run.yMax, ai.body.position.y);
        if (tGrab != null && C.held !== ai) { run.released = !ai.craned; break; }
        if (tGrab == null && C.state === 'idle' && D.game.time - tStart > 2) { C.state = 'seek'; C.target = ai; C.t = 14; } /* lost it: try again */
      }
      D.world.removeEventListener('postStep', hook);
      if (tGrab != null) {
        run.heldS = +(D.game.time - tGrab).toFixed(2); run.blowups = D.PHYS.blowups - b0;
        for (const e of D.PHYS.log) { run.kinds[e.kind] = (run.kinds[e.kind] || 0) + 1; if (e.kind === 'solver kick undone' && e.who === ai.T.name) run.undos++; }
        /* vertical speed swing: biggest change in vy over any 0.1 s window while held */
        let j = 0; for (let i = 0; i < samples.length; i++) { while (samples[i][0] - samples[j][0] > 0.1 + 1e-6) j++; for (let k = j; k < i; k++) run.maxDvy = Math.max(run.maxDvy, Math.abs(samples[i][1] - samples[k][1])); run.vyMin = Math.min(run.vyMin, samples[i][1]); run.vyMax = Math.max(run.vyMax, samples[i][1]); }
        run.maxDvy = +run.maxDvy.toFixed(1); run.vyMin = +run.vyMin.toFixed(1); run.vyMax = +run.vyMax.toFixed(1); run.y0 = +run.y0.toFixed(1); run.yMax = +run.yMax.toFixed(1); run.steps = samples.length;
      }
      run.log = D.PHYS.log.slice(0, 4);
      out.runs.push(run);
      await wt(2.5); /* let it land */
    }
    out.fps = 1000 / window.__dt;
    window.__dt = 0;
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.q === 7 && r.iters === 8 && r.sub === 3, `lowest quality physics: q${r.q}, ${r.iters} solver passes, ${r.sub} catch-up steps, at ${r.fps} fps`);
  for (const u of r.runs) {
    ok(u.grabbed, `${u.type}: the magnet grabs it`);
    if (!u.grabbed) continue;
    ok(u.yMax > u.y0 + 4, `${u.type}: it gets lifted (y ${u.y0} -> ${u.yMax} m)`);
    ok(u.released, `${u.type}: it gets swung and dropped (held ${u.heldS} s)`);
    ok(u.heldS >= 3, `${u.type}: held for several seconds (${u.heldS} s)`);
    ok(u.undos === 0, `${u.type}: no solver kick undone while held (${u.undos}; all physics catches ${u.blowups}) ${u.undos ? JSON.stringify(u.log) : ''}`);
    ok(u.blowups === 0, `${u.type}: no physics blow-ups at all while held (${u.blowups})`);
    ok(u.maxDvy < 6, `${u.type}: no big vertical speed swings: max change in 0.1 s ${u.maxDvy} m/s (vy ${u.vyMin}..${u.vyMax} over ${u.steps} steps)`);
  }
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'CRANEJITTER PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
