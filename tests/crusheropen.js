// (waits on game time, not wall-clock time: under load the old 1 s wall-clock wait timed out before the car arrived)
// The crusher is open on all four sides (owner request): a car shoved toward it from any side ends up inside the crush zone.
const { open } = require('./harness');
(async () => { const fails = []; const ok = (m, c, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m, d ? JSON.stringify(d) : ''); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } });
  await page.evaluate((t) => { window.__TYPE = t; }, process.env.TYPE || 'outrider');
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.S.aiCount = 1; D.game.state = 'menu'; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    // a fixed, ordinary car: the AI's type is random, and a walker's legs brace against a shove (2.4 s instead of 0.6 s on the spider branch)
    const C = D.CRUSHER, c0 = D.cars.find((x) => !x.isPlayer) || D.player, c = (window.__TYPE !== null && D.respawnCar(c0, window.__TYPE || 'outrider')) || D.cars.find((x) => !x.isPlayer) || D.player, out = {};
    // the other car (the player) out of every lane: once it sat north of the crusher and blocked that lane (spider branch, 17:30)
    if (c !== D.player) { const pb = D.player.body; pb.position.set(C.x + 60, 1.2, C.z - 60); pb.velocity.set(0, 0, 0); pb.angularVelocity.set(0, 0, 0); D.player.think = () => {}; Object.assign(D.player.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false }); } // (player.ai is not a flag the game reads: stub the brain so the parked player never drives into a lane)
    for (const [name, dx, dz] of [['east', 1, 0], ['west', -1, 0], ['north', 0, 1], ['south', 0, -1]]) {
      C.state = 'idle'; C.t = 999;
      const b = c.body, gx = C.x + dx * 9, gz = C.z + dz * 8, rr = new D.CANNON.RaycastResult(); D.world.raycastClosest(new D.CANNON.Vec3(gx, 12, gz), new D.CANNON.Vec3(gx, -1, gz), {}, rr); // (the north lane starts on the feed ramp, ~1.1 m up: a fixed y of 1.2 put a tall body inside it)
      b.position.set(gx, (rr.hasHit ? rr.hitPointWorld.y : 0) + 1.6, gz); b.velocity.set(-dx * 9, 0, -dz * 9); b.angularVelocity.set(0, 0, 0);
      b.quaternion.setFromAxisAngle(new D.CANNON.Vec3(0, 1, 0), Math.atan2(dz, -dx)); c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false }); // (c.ai is not a flag the game reads: stub the brain so the shoved car never drives itself out of the lane)
      const s0 = D.simTime, w0 = performance.now(); for (; D.simTime - s0 < 2.5 && performance.now() - w0 < 60000;) { /* game time only: on a busy machine 400 x 25 ms of wall time once ran out after 0.2 s of game time */ b.velocity.x = -dx * 9; b.velocity.z = -dz * 9; await sleep(25); if (Math.abs(b.position.x - C.x) < C.hx && Math.abs(b.position.z - C.z) < C.hz) break; }
      out[name + '_pos'] = [c.type, +b.position.x.toFixed(1), +b.position.z.toFixed(1), D.touching ? D.touching(c) : '', 'game s ' + (D.simTime - s0).toFixed(2)];
      out[name] = Math.abs(b.position.x - C.x) < C.hx + 0.5 && Math.abs(b.position.z - C.z) < C.hz + 0.5; }
    return out; });
  console.log(JSON.stringify(r)); for (const k of Object.keys(r).filter((k) => !k.endsWith('_pos'))) ok(`a car shoved in from the ${k} ends up inside the crusher`, r[k]);
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok('no page errors', pe.length === 0, pe.slice(0, 3));
  await browser.close(); console.log(fails.length ? 'CRUSHEROPEN FAIL' : 'CRUSHEROPEN PASS'); process.exit(fails.length ? 1 : 0); })();
