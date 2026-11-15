// The swinging wrecking ball hits a parked car: the car must be knocked away (the ball's shove), and the physics safety net must not
// "undo" the hit as a solver kick. (It used to: the net only knew the speeds of cars and bulls, not the ball's, so most ball hits were
// cancelled and logged as catches; the NE-corner catch hotspot at x 100-109, z 87-90 in the Build 67 play logs.)
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 400, height: 260 } }); await page.waitForTimeout(1200);
  const res = await page.evaluate(async () => {
    window.__noRender = true; const D = __derby, DT = 1 / 60, Y = new D.CANNON.Vec3(0, 1, 0), out = [];
    D.S.aiCount = 1; D.S.autoGfx = false; D.game.state = 'menu'; D.startMatch(); D.game.countdown = 0; D.game.grace = 0; D.game.paused = true;
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    for (const tt of ['camper', 'firetruck', 'hellbender', 'cruiser']) {
      let C = D.cars.find((c) => c !== D.player); C = D.respawnCar(C, tt) || D.cars.find((c) => c !== D.player); C.think = () => { C.ctrl.throttle = 0; C.ctrl.handbrake = true; };
      D.player.body.position.set(-100, 1.5, -40);
      const t0 = D.simTime; let hit = false, maxV = 0, kicks = 0;
      for (let i = 0; i < 60 * 14 && !hit; i++) { // park it under the ball's lowest point, wait for a swing to come through
        if (i < 2) { C.body.position.set(D.BALL.px, 1.4, D.BALL.pz); C.body.quaternion.setFromAxisAngle(Y, Math.PI / 2); C.body.velocity.set(0, 0, 0); C.body.angularVelocity.set(0, 0, 0); }
        C.health = 100; C.think(DT); for (const c of D.cars) c.frameUpdate(DT); D.updateArenaPub(DT); D.world.step(DT); D.simTime += DT;
        const v = Math.hypot(C.body.velocity.x, C.body.velocity.z); maxV = Math.max(maxV, v);
        if (i > 30 && Math.hypot(C.body.position.x - D.BALL.px, C.body.position.z - D.BALL.pz) > 3) hit = true;
      }
      for (let i = 0; i < 60; i++) { C.think(DT); for (const c of D.cars) c.frameUpdate(DT); D.updateArenaPub(DT); D.world.step(DT); D.simTime += DT; maxV = Math.max(maxV, Math.hypot(C.body.velocity.x, C.body.velocity.z)); }
      kicks = D.PHYS.log.filter((x) => x.t >= t0 && x.who === C.T.name && x.kind === 'solver kick undone').length;
      out.push({ car: tt, hit, maxV: +maxV.toFixed(1), kicks, moved: +Math.hypot(C.body.position.x - D.BALL.px, C.body.position.z - D.BALL.pz).toFixed(1) });
    }
    return out; });
  let bad = 0;
  for (const r of res) { const ok = r.hit && r.kicks === 0 && r.maxV > 3; if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'} wrecking ball vs ${r.car}: knocked ${r.moved} m, top speed ${r.maxV} m/s, hits undone by the safety net ${r.kicks}`); }
  const errs = errors.filter((e) => !e.includes('ERR_FAILED')); if (errs.length) { bad++; console.log('errors', JSON.stringify(errs.slice(0, 3))); }
  console.log(bad ? 'BALL FAIL' : 'BALL PASS'); await browser.close(); process.exit(bad ? 1 : 0);
})();
