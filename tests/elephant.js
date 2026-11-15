// The Brass Steam Elephant (walker): it walks straight, turns both ways and reverses on hover springs; its legs really step;
// the trunk grabs a light car, lifts it and flings it sideways; with nothing in reach it steams (puts out a burning car, shoves cars back);
// hits to the boiler from behind raise the pressure (front hits don't), the gauge needle on the model follows it, and at the red line it
// whistles, blows its top and stalls for ~4 s, then walks again; fire nearby raises the pressure faster; the AI uses the trunk;
// a guest's copy (no physics, only the snapshot) still walks its legs and shows the gauge. Prints ELEPHANT PASS / ELEPHANT FAIL.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } }); await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 1; __derby.S.autoGfx = false; __derby.S.damage = 1; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.countdown <= 0 && __derby.game.state === 'playing', null, { timeout: 150000 });
  const R = await page.evaluate(async () => {
    const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), V = D.CANNON.Vec3;
    const wt = async (s, each) => { const t0 = D.game.time; while (D.game.time - t0 < s) { await sleep(20); if (each) each(D.game.time - t0); } };
    const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code.replace('Key', '').toLowerCase() }));
    const yaw = (c) => { const f = c.body.quaternion.vmult(new V(1, 0, 0)); return Math.atan2(-f.z, f.x); };
    const dyaw = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d * 57.3; };
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    const out = {}, fails = [];
    const other = () => D.cars.find((x) => x !== D.player);
    const park = (c) => { c.think = () => {}; c.ctrl.throttle = 0; c.ctrl.steer = 0; c.ctrl.fire = false; c.ctrl.brake = false; c.ctrl.handbrake = false; c.ctrl.nitro = false; return c; }; // (a freshly respawned AI may have left its footbrake on)
    const settle = (c, x, z, yw) => { c.body.position.set(x, c.T.walker ? 2.4 : 1.4, z); c.body.quaternion.setFromEuler(0, yw || 0, 0); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); };
    D.respawnCar(D.player, 'elephant'); await wt(0.4); let E = D.player;
    const placeE = async () => { E = D.player; const ai = other(); if (ai) { park(ai); settle(ai, 100, -100); } settle(E, -60, 75, 0); E.health = 100; E.pressure = 0; E.stallT = 0; E.whistleT = 0; E.specialCd = 0; await wt(1.2); };
    // 1. drive: straight, left, right, reverse
    const run = async (keys, s) => { await placeE(); const p0 = E.body.position.clone(); let acc = 0, py = yaw(E); for (const k of keys) key(k, true); await wt(s, () => { const y = yaw(E); acc += dyaw(py, y); py = y; }); for (const k of keys) key(k, false); const f0 = new V(1, 0, 0), mv = E.body.position.vsub(p0); return { fwd: +(mv.x * f0.x + mv.z * f0.z).toFixed(1), yaw: Math.round(acc), y: +E.body.position.y.toFixed(2) }; };
    out.straight = await run(['KeyW'], 3); out.left = await run(['KeyW', 'KeyA'], 3); out.right = await run(['KeyW', 'KeyD'], 3); out.back = await run(['KeyS'], 3);
    if (out.straight.fwd < 8 || Math.abs(out.straight.yaw) > 20) fails.push('straight'); if (out.left.yaw < 25) fails.push('left'); if (out.right.yaw > -25) fails.push('right'); if (out.back.fwd > -2.5) fails.push('reverse');
    if (out.straight.y < 1.9 || out.straight.y > 2.8) fails.push('ride height');
    // 2. legs: walking, every hip swings and feet come down (stomps); standing still, the feet stay put
    await placeE(); { const mn = [9, 9, 9, 9], mx = [-9, -9, -9, -9], n0 = E.stompN || 0; key('KeyW', true); await wt(2.5, () => E.legs.forEach((l, i) => { mn[i] = Math.min(mn[i], l.hip.rotation.z); mx[i] = Math.max(mx[i], l.hip.rotation.z); })); key('KeyW', false);
      out.legSwing = mx.map((x, i) => +(x - mn[i]).toFixed(2)); out.stomps = (E.stompN || 0) - n0; if (out.legSwing.some((x) => x < 0.25)) fails.push('legs do not swing'); if (out.stomps < 6) fails.push('no footsteps');
      await wt(3); const f0 = E.gait.feet.map((f) => f.p.clone()); await wt(1); out.feetDrift = +Math.max(...E.gait.feet.map((f, i) => f.p.distanceTo(f0[i]))).toFixed(2); if (out.feetDrift > 0.05) fails.push('feet slide when standing'); }
    // 3. trunk: grab a light car in front, lift it, fling it sideways
    await placeE(); { let ai = other(); if (ai.type !== 'forklift' || ai.wrecked) { D.respawnCar(ai, 'forklift'); await wt(0.4); ai = other(); } park(ai); const ep = E.body.position; settle(ai, ep.x + 5.3, ep.z, Math.PI / 2); ai.health = 100; await wt(0.8);
      const y0 = ai.body.position.y, n0 = E.flungN || 0; let maxY = y0, held = false; E.ctrl.fire = true; key('KeyF', true); await wt(0.2); key('KeyF', false);
      await wt(3.5, () => { maxY = Math.max(maxY, ai.body.position.y); if (E.hold) held = true; });
      const d = Math.hypot(ai.body.position.x - E.body.position.x, ai.body.position.z - E.body.position.z), l = E.body.pointToLocalFrame(ai.body.position);
      out.fling = { held, flung: (E.flungN || 0) - n0, lift: +(maxY - y0).toFixed(1), dist: +d.toFixed(1), side: +l.z.toFixed(1), mass: ai.body.mass };
      if (!held || out.fling.flung < 1) fails.push('trunk did not grab'); if (maxY - y0 < 1.5) fails.push('not lifted'); if (d < 8) fails.push('not flung far'); if (Math.abs(l.z) < 4) fails.push('not flung sideways'); if (ai.body.mass < 1000) fails.push('mass not restored'); }
    // 4. steam: nothing grabbable in reach -> a burning car 10 m ahead is put out and shoved back
    await placeE(); { let ai = other(); if (ai.type !== 'viper' || ai.wrecked) { D.respawnCar(ai, 'viper'); await wt(0.4); ai = other(); } park(ai); const ep = E.body.position; settle(ai, ep.x + 10, ep.z, Math.PI); ai.health = 100; await wt(0.8); // nose to nose, like a car charging the elephant
      ai.burnT = 7; ai.douse = 0; const d0 = ai.body.position.distanceTo(E.body.position); key('KeyF', true); await wt(0.2); key('KeyF', false); const steamed = !!E.steamOn, lz = E.body.pointToLocalFrame(ai.body.position); let vmax = 0; await wt(1.6, () => { vmax = Math.max(vmax, Math.hypot(ai.body.velocity.x, ai.body.velocity.z)); }); const d1 = ai.body.position.distanceTo(E.body.position);
      out.steam = { steamed, burnT: +(ai.burnT || 0).toFixed(1), d0: +d0.toFixed(1), d1: +d1.toFixed(1), vmax: +vmax.toFixed(1), type: ai.type, wrecked: ai.wrecked, at: [+lz.x.toFixed(1), +lz.y.toFixed(1), +lz.z.toFixed(1)], mass: ai.body.mass }; if (!steamed) fails.push('no steam'); if (ai.burnT > 0) fails.push('steam did not put the fire out'); if (d1 < d0 + 1.5) fails.push('steam did not push back'); }
    // 5. boiler: hits from behind raise the pressure and move the gauge needle; front hits don't; red line -> whistle -> blow -> stall ~4 s -> walks again
    await placeE(); { const ai = park(other()); settle(ai, 100, -100); const n0 = E.gaugeNeedle.rotation.z;
      E.applyDamage(8, ai, 'front', new D.THREE.Vector3(2.5, 1, 0), 8); const pf = E.pressure;
      for (let k = 0; k < 3; k++) E.applyDamage(8, ai, 'rear', new D.THREE.Vector3(-2.3, 2.4, 0), 8); const pr = E.pressure; await wt(0.2); const n1 = E.gaugeNeedle.rotation.z;
      out.boiler = { front: +pf.toFixed(3), rear3: +pr.toFixed(3), needle: [+n0.toFixed(2), +n1.toFixed(2)] };
      if (pf > 0.001) fails.push('front hit raised pressure'); if (pr < 0.2) fails.push('rear hits did not raise pressure'); if (Math.abs(n1 - n0) < 0.5) fails.push('gauge needle did not move');
      let hits = 0; while (E.pressure < 0.86 && hits < 40) { E.applyDamage(4, ai, 'rear', new D.THREE.Vector3(-2.3, 2.4, 0), 4); hits++; } E.health = 100;
      key('KeyW', true); let whistled = false, stallAt = -1, endAt = -1, maxV = 0;
      await wt(7.5, (t) => { if (E.whistleT > 0) whistled = true; if (E.stallT > 0 && stallAt < 0) stallAt = t; if (stallAt >= 0 && E.stallT <= 0 && endAt < 0) endAt = t; if (stallAt >= 0 && endAt < 0 && t > stallAt + 0.6) maxV = Math.max(maxV, Math.hypot(E.body.velocity.x, E.body.velocity.z)); });
      const p0 = E.body.position.clone(); await wt(2.5); key('KeyW', false); const after = +E.body.position.distanceTo(p0).toFixed(1);
      out.blow = { whistled, stallAt: +stallAt.toFixed(1), stallLen: +(endAt - stallAt).toFixed(1), maxSpeedStalled: +maxV.toFixed(2), walkedAfter: after, blown: E.blownN || 0, pressureAfter: +E.pressure.toFixed(2) };
      if (!whistled) fails.push('no whistle'); if (stallAt < 0 || !(E.blownN > 0)) fails.push('did not blow'); if (endAt < 0 || Math.abs(endAt - stallAt - 4) > 0.6) fails.push('stall not ~4 s'); if (maxV > 0.8) fails.push('moved while stalled'); if (after < 5) fails.push('no recovery'); }
    // 6. fire nearby raises the pressure faster than it bleeds off
    await placeE(); { E.pressure = 0.3; await wt(3); const cold = E.pressure - 0.3; const p = E.body.position; D.addConcrete(p.x, p.z + 4, 2.5, 'fuel'); const pd = D.CONCRETE.list[D.CONCRETE.list.length - 1]; pd.t = 5; pd.burning = 20;
      E.pressure = 0.3; await wt(3); const hot = E.pressure - 0.3; pd.burning = 0; out.heat = { cold: +cold.toFixed(3), hot: +hot.toFixed(3) }; if (!(cold < 0)) fails.push('pressure does not bleed off'); if (hot < cold + 0.1) fails.push('fire does not heat the boiler'); E.pressure = 0; }
    // 7. a guest's copy: no physics, only position/velocity/pressure from snapshots, still steps and shows the gauge
    await placeE(); { E.ghost = true; E.pressure = 0.7; E.stallT = 0; const mn = [9, 9, 9, 9], mx = [-9, -9, -9, -9]; const n0 = E.gaugeNeedle.rotation.z;
      await wt(2, (t) => { E.body.velocity.set(4, 0, 0); E.body.angularVelocity.set(0, 0, 0); E.body.position.set(-60 + t * 4, 2.3, 75); E.legs.forEach((l, i) => { mn[i] = Math.min(mn[i], l.hip.rotation.z); mx[i] = Math.max(mx[i], l.hip.rotation.z); }); });
      E.ghost = false; out.remote = { swing: mx.map((x, i) => +(x - mn[i]).toFixed(2)), needle: +E.gaugeNeedle.rotation.z.toFixed(2), expect: +(2.356 - 0.7 * 4.712).toFixed(2) };
      if (out.remote.swing.some((x) => x < 0.2)) fails.push('remote legs do not animate'); if (Math.abs(E.gaugeNeedle.rotation.z - (2.356 - 0.7 * 4.712)) > 0.15) fails.push('remote gauge wrong'); E.pressure = 0; }
    // 8. the AI elephant walks up to a light car and uses the trunk on it
    { D.respawnCar(D.player, 'forklift'); await wt(0.4); const P = D.player; let ai = other(); if (ai.type !== 'elephant') { D.respawnCar(ai, 'elephant'); await wt(0.4); ai = other(); }
      settle(P, -60, 75, 0); settle(ai, -78, 75, 0); ai.pressure = 0; ai.stallT = 0; ai.specialCd = 0; ai.health = 100; P.health = 100;
      let used = 0; await wt(14, () => { used = Math.max(used, ai.trunkUses || 0); if (P.wrecked) P.health = 100; }); out.ai = { trunkUses: used, flung: ai.flungN || 0 }; if (used < 1) fails.push('AI never used the trunk'); }
    out.fails = fails; return out;
  });
  const pe = errors.filter((e) => !e.includes('ERR_FAILED'));
  console.log(JSON.stringify(R, null, 1)); if (pe.length) { console.log('page errors:', pe.slice(0, 5)); R.fails.push('page errors'); }
  console.log(R.fails.length ? 'ELEPHANT FAIL: ' + R.fails.join(', ') : 'ELEPHANT PASS'); await browser.close(); process.exit(R.fails.length ? 1 : 0);
})();
