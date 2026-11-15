// The Outrider's harpoon on a heavy truck: the cable reels in to bumper-to-bumper and lets go, never drags the two hulls into each other
// (the old cable wound down to 2 m between the CENTRES: the solver then shot the light car out, and the Outrider topped the physics
// safety-net log). Also: a heavy truck driving off with the Outrider on the line snaps the cable instead of flinging it.
// Fails if any solver kick / blow-up clamp happens to either car, or (while the cable is on) the centres get closer than the two hulls allow (it reeled itself under the truck).
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 400, height: 260 } }); await page.waitForTimeout(1200);
  const res = await page.evaluate(async () => {
    window.__noRender = true; const D = __derby, DT = 1 / 60, Y = new D.CANNON.Vec3(0, 1, 0), out = [];
    D.S.aiCount = 1; D.S.autoGfx = false; D.selectCar('outrider'); D.game.state = 'menu'; D.startMatch(); D.game.countdown = 0; D.game.grace = 0; D.game.paused = true;
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    for (const [tt, drive] of [['bertha', 0], ['mixer', 0], ['bertha', 1], ['tanker', 1]]) {
      let T = D.cars.find((c) => c !== D.player); T = D.respawnCar(T, tt) || D.cars.find((c) => c !== D.player); const P = D.player;
      T.think = () => { T.ctrl.throttle = drive ? 1 : 0; T.ctrl.steer = 0; T.ctrl.fire = false; };
      P.body.position.set(-40, 1.2, 60); P.body.quaternion.setFromAxisAngle(Y, 0); P.body.velocity.set(0, 0, 0); P.body.angularVelocity.set(0, 0, 0);
      T.body.position.set(-40 + 22, 1.6, 60); T.body.quaternion.setFromAxisAngle(Y, drive ? 0 : Math.PI / 2); T.body.velocity.set(0, 0, 0); T.body.angularVelocity.set(0, 0, 0);
      P.health = 100; T.health = 100; P.specialCd = 0;
      for (let i = 0; i < 40; i++) { P.ctrl.throttle = 0; for (const c of D.cars) c.frameUpdate(DT); D.world.step(DT); }
      const t0 = D.simTime; let minD = 99, cabled = false;
      for (let i = 0; i < 60 * 5; i++) {
        P.health = 100; T.health = 100; P.ctrl.throttle = 0; P.ctrl.steer = 0; P.ctrl.fire = i < 6; T.think(DT);
        for (const c of D.cars) c.frameUpdate(DT); D.world.step(DT);
        if (P.cable) { cabled = true; minD = Math.min(minD, P.body.position.distanceTo(T.body.position)); }
      }
      out.push({ target: tt, drive, cabled, kicks: D.PHYS.log.filter((x) => x.t >= t0 - 0.01 && (x.who === P.T.name || x.who === T.T.name)).length, minD: +minD.toFixed(2), need: +(P.T.L / 2 + Math.min(T.T.L, T.T.W) / 2 - 0.3).toFixed(2), log: D.PHYS.log.filter((x) => x.t >= t0 - 0.01).slice(-3).map((x) => x.kind + ' ' + x.who) });
    }
    return out; });
  let bad = 0;
  for (const r of res) { const ok = r.cabled && r.kicks === 0 && r.minD >= r.need; if (!ok) bad++; console.log(`${ok ? 'PASS' : 'FAIL'} harpoon ${r.target}${r.drive ? ' driving off' : ''}: cable ${r.cabled}, safety-net catches ${r.kicks}, closest centres ${r.minD} m (need >= ${r.need})${ok ? '' : ' ' + JSON.stringify(r.log)}`); }
  const errs = errors.filter((e) => !e.includes('ERR_FAILED'));
  if (errs.length) { bad++; console.log('errors', JSON.stringify(errs.slice(0, 3))); }
  console.log(bad ? 'HARPOON FAIL' : 'HARPOON PASS'); await browser.close(); process.exit(bad ? 1 : 0);
})();
