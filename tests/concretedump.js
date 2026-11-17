// The Mixer's concrete dump (owner idea, 2026-11-17): F with a car close behind or beside the truck dumps a load ON it. The car is encased
// (held in place ~3 s at full throttle, then free), the heap left behind sets hard after ~8 s into a solid lump that stops a light car
// driven into it, a heavy truck ramming it (or the wrecking ball) bursts it, and there are never more than 6 lumps. Fails on Build 108 (no dump).
const { open } = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } });
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), CA = D.CANNON;
    if (!D.HEAPS || !D.dumpTarget) return { missing: true };
    const waitSim = async (sec, until) => { const t0 = D.simTime, w0 = performance.now(); while (D.simTime - t0 < sec && performance.now() - w0 < sec * 6000 + 3000) { if (until && until()) break; await sleep(16); } return D.simTime - t0; };
    D.S.aiCount = 3; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    let [a, b, c] = D.cars.filter((x) => !x.isPlayer); const M = D.respawnCar(a, 'mixer'), V = D.respawnCar(b, 'viper'), H = D.respawnCar(c, 'bertha');
    for (const x of [M, V, H]) { x.think = () => {}; Object.assign(x.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false, handbrake: false, brake: false }); } /* (c.ai is not a flag the game reads: stub the brain) */
    const place = (x, px, pz, yaw = 0) => { x.body.position.set(px, 1.3, pz); x.body.velocity.set(0, 0, 0); x.body.angularVelocity.set(0, 0, 0); x.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), yaw); x.body.wakeUp(); };
    place(D.player, -80, -60); place(H, 60, -60); await sleep(300);
    const out = {};
    { place(M, 30, 70); place(V, -M.T.L / 2 - 4.5, 40, Math.PI); await waitSim(0.8); const q0 = V.body.position.clone(); V.ctrl.throttle = 1; await waitSim(3); out.free = +Math.hypot(V.body.position.x - q0.x, V.body.position.z - q0.z).toFixed(2); V.ctrl.throttle = 0; } /* baseline: the same car from the same spot, free, 3 s from a standstill */
    // 1) dump: the Viper parked 3 m behind the Mixer's tail, facing away; on the hit it floors it
    place(M, 0, 40, 0); place(V, -M.T.L / 2 - 4.5, 40, Math.PI); await waitSim(0.8);
    out.target = D.dumpTarget(M) === V; const heaps0 = D.HEAP.id; M.load = 1; M.ctrl.fire = true;
    await waitSim(2, () => V.encasedT > 0); out.encased = V.encasedT > 0; out.crust = !!(V.crust && V.crust.visible); out.chuteT = +(M.chuteT || 0).toFixed(2);
    const p0 = V.body.position.clone(), t0 = D.simTime; let maxMove = 0; V.ctrl.throttle = 1;
    while (V.encasedT > 0 && D.simTime - t0 < 6) { maxMove = Math.max(maxMove, Math.hypot(V.body.position.x - p0.x, V.body.position.z - p0.z)); await sleep(16); }
    out.held = +(D.simTime - t0).toFixed(2); out.maxMove = +maxMove.toFixed(2); out.crustAfter = !!(V.crust && V.crust.visible);
    const p1 = V.body.position.clone(); await waitSim(3); out.after3 = +Math.hypot(V.body.position.x - p1.x, V.body.position.z - p1.z).toFixed(2); V.ctrl.throttle = 0;
    place(V, 40, 70); place(M, -30, 70);
    // 2) the heap sets hard about 8 s after the dump
    const h = D.HEAPS.find((o) => o.id === heaps0 + 1); out.heap = !!h;
    if (h) { await waitSim(10, () => h.set); out.setAt = +h.t.toFixed(2); out.body = !!(h.body && D.world.bodies.includes(h.body)); }
    // 3) a light car driven into it at moderate speed (~9 m/s) is stopped
    if (h && h.body) { h.x = -35; h.z = 40; h.body.position.set(h.x, 0.7, h.z); h.mesh.position.set(h.x, 0.05, h.z); /* moved to open yard (the stretch the Viper just drove out over) */ const hx = h.x, hz = h.z; place(V, hx + 14, hz, Math.PI); await waitSim(0.5); V.body.velocity.set(-9, 0, 0); V.ctrl.throttle = 0.35; let maxX = -1e9, vIn = 0;
      const s0 = D.simTime; while (D.simTime - s0 < 3) { maxX = Math.max(maxX, hx - V.body.position.x); if (hx - V.body.position.x < -4) vIn = Math.max(vIn, -V.body.velocity.x); await sleep(16); }
      V.ctrl.throttle = 0; out.light = { mass: V.body.mass, vIn: +vIn.toFixed(1), maxX: +maxX.toFixed(2), alive: D.HEAPS.includes(h), speedEnd: +Math.hypot(V.body.velocity.x, V.body.velocity.z).toFixed(2) };
      place(V, 40, 70);
      // 4) a heavy ram (Bertha, ~11 m/s) bursts it and drives on through
      place(H, hx + 18, hz, Math.PI); await waitSim(0.5); H.ctrl.throttle = 1; let hMax = -1e9; const s1 = D.simTime;
      while (D.simTime - s1 < 3) { if (hx - H.body.position.x < -7) { H.body.velocity.x = -11; H.body.velocity.z = 0; } hMax = Math.max(hMax, hx - H.body.position.x); await sleep(16); }
      H.ctrl.throttle = 0; out.heavy = { mass: H.body.mass, broke: !D.HEAPS.includes(h), bodyGone: !D.world.bodies.includes(h.body || {}), passed: +hMax.toFixed(1) }; place(H, 60, -60); }
    // 5) cap: 8 more dumps leave at most 6 lumps (meshes and bodies)
    for (let k = 0; k < 8; k++) { place(M, -40 + k * 12, -20, 0); place(V, -40 + k * 12 - M.T.L / 2 - 4, -20, Math.PI); await waitSim(0.3); V.encasedT = 0; V.encaseAt = null; M.load = 1; M.ctrl.fire = true; await waitSim(0.9); V.encasedT = 0; V.encaseAt = null; V.crackFree && V.crackFree(false); }
    place(V, 40, 70); place(M, -30, 70); await waitSim(9.5); /* let some set hard */
    let meshes = 0; D.scene.traverse((o) => { if (o.geometry === D.HEAP.geo && o.parent === D.scene) meshes++; });
    out.cap = { made: D.HEAP.id - heaps0, heaps: D.HEAPS.length, meshes, bodies: D.world.bodies.filter((x) => x.what === 'concrete lump').length };
    // 5b) the Mixer itself (9.5 t, low hull: it hits the lump square) bursts one at 10 m/s
    const hm = D.HEAPS.find((o) => o.body); if (hm) { hm.x = -35; hm.z = 40; hm.body.position.set(hm.x, 0.7, hm.z); hm.mesh.position.set(hm.x, 0.05, hm.z); place(M, hm.x + 16, hm.z, Math.PI); await waitSim(0.5); M.ctrl.throttle = 1; let mMax = -1e9; const s2 = D.simTime;
      while (D.simTime - s2 < 3) { if (M.body.position.x - hm.x > 7) { M.body.velocity.x = -10; M.body.velocity.z = 0; } mMax = Math.max(mMax, hm.x - M.body.position.x); await sleep(16); }
      M.ctrl.throttle = 0; out.mixerRam = { broke: !D.HEAPS.includes(hm), passed: +mMax.toFixed(1) }; place(M, -30, 70); }
    // 6) the wrecking ball bursts a lump in its path
    const hb = D.HEAPS.find((o) => o.body); if (hb) { hb.x = D.BALL.px; hb.z = D.BALL.pz; hb.body.position.set(hb.x, 0.7, hb.z); hb.mesh.position.set(hb.x, 0.05, hb.z); await waitSim(6, () => !D.HEAPS.includes(hb)); out.ball = !D.HEAPS.includes(hb); }
    return out; });
  console.log('  ' + JSON.stringify(r));
  if (r.missing) ok(false, 'the Mixer has a concrete dump (HEAPS / dumpTarget exist)');
  else {
    ok(r.target && r.encased && r.crust && r.chuteT > 0, `F with a car 4.5 m behind the Mixer dumps on it: encased ${r.encased}, crust ${r.crust}, chute swinging ${r.chuteT}`);
    ok(r.held >= 2.5 && r.held <= 3.6 && r.maxMove < 1.2, `encased car at full throttle held ${r.held} s (2.5-3.6) and moved at most ${r.maxMove} m (< 1.2)`);
    ok(!r.crustAfter && r.after3 > 3 && r.after3 < r.free * 1.5, `then it breaks free: crust gone ${!r.crustAfter}, drove ${r.after3} m in the next 3 s (> 3; free from a standstill: ${r.free} m)`);
    ok(r.heap && r.setAt >= 7.5 && r.setAt <= 10.5 && r.body, `the heap sets hard into a solid lump at ${r.setAt} s (7.5-10.5), body in the world ${r.body}`);
    ok(r.light && r.light.vIn > 6 && r.light.maxX < 0 && r.light.alive, `a ${r.light && r.light.mass} kg car driven in at ${r.light && r.light.vIn} m/s is stopped by it (got to ${r.light && r.light.maxX} m of its centre, lump intact ${r.light && r.light.alive})`);
    ok(r.heavy && r.heavy.broke && r.heavy.bodyGone && r.heavy.passed > 2, `a ${r.heavy && r.heavy.mass} kg ram at 11 m/s bursts it (broken ${r.heavy && r.heavy.broke}, body gone ${r.heavy && r.heavy.bodyGone}) and drives on through (${r.heavy && r.heavy.passed} m past)`);
    ok(r.mixerRam && r.mixerRam.broke && r.mixerRam.passed > 2, `the 9.5 t Mixer ramming a lump at 10 m/s bursts it too (broken ${r.mixerRam && r.mixerRam.broke}, ${r.mixerRam && r.mixerRam.passed} m past)`);
    ok(r.cap.made >= 8 && r.cap.heaps <= 6 && r.cap.meshes <= 6 && r.cap.bodies <= 6, `lumps are capped: ${r.cap.made} dumps -> ${r.cap.heaps} heaps, ${r.cap.meshes} meshes, ${r.cap.bodies} bodies (<= 6)`);
    ok(r.ball === true, `the wrecking ball bursts a lump in its path (${r.ball})`);
  }
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'CONCRETEDUMP FAIL' : 'CONCRETEDUMP PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
