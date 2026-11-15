// Tracked vehicles (Tiger, dozer): regression tests for the track drive.
//  - one broken track swings the hull toward the dead side (left broken -> turns left, right broken -> right)
//  - healthy tracks drive straight on flat ground (the bug in builds 52-63 made them pull right)
//  - healthy tracks climb the centre mesa slope
const { open } = require(process.env.H || './harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } }); await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.countdown <= 0, null, { timeout: 90000 });
  const res = await page.evaluate(async () => {
    const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), wt = async (s) => { const t0 = D.game.time; while (D.game.time - t0 < s) await sleep(20); };
    const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code }));
    const yaw = (c) => { const f = c.body.quaternion.vmult(new D.CANNON.Vec3(1, 0, 0)); return Math.atan2(-f.z, f.x); };
    const dy = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d * 57.3; };
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    const out = {};
    for (const t of ['tiger', 'dozer']) {
      D.respawnCar(D.player, t); await wt(0.3);
      const place = async (x, z, yw) => { const c = D.player; c.body.position.set(x, 2.2, z); c.body.quaternion.setFromEuler(0, yw, 0); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.health = 100; c.trackBroken = [false, false]; await wt(1); return c; };
      const drive = async (c, s) => { let acc = 0, py = yaw(c), y0 = c.body.position.y, ymax = y0; key('KeyW', true); const t0 = D.game.time; while (D.game.time - t0 < s) { await sleep(20); const y = yaw(c); acc += dy(py, y); py = y; ymax = Math.max(ymax, c.body.position.y); } key('KeyW', false); return { yaw: Math.round(acc), rise: +(ymax - y0).toFixed(1) }; };
      let c = await place(-60, 75, 0); const flat = await drive(c, 3);
      c = await place(-60, 75, 0); c.trackBroken = [true, false]; const brokeL = await drive(c, 2.5);
      c = await place(-60, 75, 0); c.trackBroken = [false, true]; const brokeR = await drive(c, 2.5);
      c = await place(-24, 0, 0); const hill = await drive(c, 6); // centre mesa: 3 m tall, 24 degree sides
      out[t] = { flat, brokeL, brokeR, hill };
    }
    return out; });
  let bad = 0;
  for (const [t, r] of Object.entries(res)) {
    const f = []; if (Math.abs(r.flat.yaw) > 10) f.push('pulls ' + r.flat.yaw + '° on flat'); if (r.brokeL.yaw < 20) f.push('left-broken should swing left, got ' + r.brokeL.yaw + '°'); if (r.brokeR.yaw > -20) f.push('right-broken should swing right, got ' + r.brokeR.yaw + '°'); if (r.hill.rise < 2.2) f.push('only climbed ' + r.hill.rise + ' m');
    if (f.length) bad++; console.log(`${f.length ? 'FAIL' : 'PASS'} ${t}: flat ${r.flat.yaw}°, left track broken ${r.brokeL.yaw}°, right track broken ${r.brokeR.yaw}°, mesa climb +${r.hill.rise} m` + (f.length ? '  <- ' + f.join('; ') : ''));
  }
  console.log(bad ? 'TRACKS FAIL' : 'TRACKS PASS', JSON.stringify(errors.filter((e) => !e.includes('ERR_FAILED')).slice(0, 3)));
  await browser.close(); process.exit(bad ? 1 : 0);
})();
