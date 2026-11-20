// The Buzzsaw Hover in Victor's tsunami: the flood water skips the hovercraft (floodStep: no drag, no buoyancy, no damping on a `hover` car).
// It rides its air cushion over the water, so in the flood it must keep hovering at its dry-land height and drive at its dry-land speed:
//   - full throttle for 3 s on the open south lane, dry, then the same run with the yard under ~1.45 m of water;
//   - flood speed >= 85% of dry speed (a wading car drops under 60%: tsunami.js), the cushion height within 0.25 m of the dry one,
//     floodK stays 0 (the flood never grabbed it), and it really was in deep water (waterAt over the floor >= 1 m).
// Fails if floodStep wades the hovercraft like a car (speed falls to ~40%). Prints HOVERFLOOD PASS / HOVERFLOOD FAIL.
const { open } = require('./harness');
(async () => {
  const fails = [], ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 480, height: 300 } });
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), out = {};
    const wt = async (s) => { const t0 = D.game.time, w0 = performance.now(); while (D.game.time - t0 < s && performance.now() - w0 < 300000) await sleep(30); };
    const until = async (f, s) => { const t0 = D.game.time, w0 = performance.now(); while (!f() && D.game.time - t0 < s && performance.now() - w0 < 400000) await sleep(30); return f(); };
    D.S.aiCount = 3; D.S.autoGfx = false; D.selectCar('hover'); document.getElementById('btnStart').click();
    while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    for (const c of D.cars.filter((c) => c !== D.player && c.T.jet)) D.respawnCar(c, 'viper'); // (an AI Jet would launch Ann, a live boat)
    let k = 0; for (const c of D.cars.filter((c) => c !== D.player)) { c.think = () => { c.ctrl.throttle = 0; c.ctrl.steer = 0; c.ctrl.fire = false; c.ctrl.handbrake = true; }; c.body.position.set(-110 + k * 9, 2, -120); k++; }
    out.type = D.player.type;
    const C = D.CANNON, rr = new C.RaycastResult(), floor = (x, z) => { rr.reset(); D.world.raycastClosest(new C.Vec3(x, 40, z), new C.Vec3(x, -1, z), { collisionFilterMask: ~(2 | 4) }, rr); return rr.hasHit ? rr.hitPointWorld.y : 0; };
    const place = async (x, z) => { const b = D.player.body; b.position.set(x, 1.6, z); b.quaternion.setFromEuler(0, 0, 0); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0); D.player.health = 100; await wt(1); };
    const key = (d) => window.dispatchEvent(new KeyboardEvent(d ? 'keydown' : 'keyup', { code: 'KeyW', key: 'w' }));
    const run = async (s) => { const b = D.player.body, p0 = b.position.clone(); let hs = 0, n = 0, fk = 0, deep = 9; key(true); const t0 = D.game.time;
      while (D.game.time - t0 < s) { await sleep(30); if (D.game.time - t0 > 0.8) { hs += b.position.y - floor(b.position.x, b.position.z); n++; fk = Math.max(fk, D.player.floodK || 0); deep = Math.min(deep, D.waterAt(b.position.x, b.position.z) - floor(b.position.x, b.position.z)); } }
      key(false); const p1 = b.position; return { v: +(Math.hypot(p1.x - p0.x, p1.z - p0.z) / s).toFixed(1), h: +(hs / Math.max(1, n)).toFixed(2), floodK: +fk.toFixed(2), deep: +deep.toFixed(2) }; };
    await place(-60, 75); out.land = await run(3);
    D.TSU.FLOOD = 12; out.started = D.startTsunami(true);
    await until(() => D.TSU.state === 'flood', 30); out.level = +D.TSU.level.toFixed(2); out.state = D.TSU.state;
    await place(-60, 75); out.flood = await run(3); out.stillFlood = D.TSU.state === 'flood';
    out.kicks = D.PHYS.log.filter((e) => e.kind === 'solver kick undone' && e.who === 'Buzzsaw Hover').length;
    await until(() => D.TSU.state === 'idle', 40); out.dry = D.TSU.state === 'idle';
    return out; });
  console.log(JSON.stringify(r));
  ok(r.type === 'hover' && r.started && r.state === 'flood' && r.level > 1.2 && r.stillFlood, `a hovercraft in a forced flood (level ${r.level} m)`);
  ok(r.flood.deep >= 1, `it was in deep water (at least ${r.flood.deep} m over the floor)`);
  ok(r.flood.v >= r.land.v * 0.85 && r.land.v > 10, `it drives at its normal speed in the flood: ${r.flood.v} m/s vs ${r.land.v} m/s dry (want >= 85%)`);
  ok(Math.abs(r.flood.h - r.land.h) <= 0.25, `it keeps hovering: ${r.flood.h} m over the floor in the flood vs ${r.land.h} m dry`);
  ok(r.flood.floodK === 0, `the flood never grabs it (floodK ${r.flood.floodK})`);
  ok(r.kicks === 0, `no solver kick undone on the hovercraft (${r.kicks})`);
  ok(r.dry, 'the water drains away');
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok(!pe.length, 'no page errors ' + pe.slice(0, 3).join(' | ')); // (blocked CDN / clip fetches are fine)
  await browser.close();
  console.log(fails.length ? 'HOVERFLOOD FAIL' : 'HOVERFLOOD PASS'); process.exit(fails.length ? 1 : 0);
})();
