// Cruiser power: the police car was "kind of weak". It now launches harder than the other light cars
// (a bigger traction-limited push off the line), has more engine, a little more weight to win a
// nose-to-nose shove against the Outrider, and is still not the fastest car (the Viper keeps that).
// Fails on the pre-change tree: the Cruiser launched exactly like everyone else (0-20 m/s ~1.77 s)
// and lost the shove.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 1; __derby.S.autoGfx = false; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.countdown <= 0, null, { timeout: 90000 });
  const r = await page.evaluate(async () => {
    const D = __derby, sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const wt = async (s) => { const t0 = D.game.time; while (D.game.time - t0 < s) await sleep(10); };
    const park = (c) => { c.think = () => {}; c.ctrl.throttle = 0; c.ctrl.steer = 0; c.ctrl.fire = false; };
    const still = (c, x, z, yaw) => { c.body.position.set(x, 2.2, z); c.body.quaternion.setFromEuler(0, yaw, 0); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.health = 100; };
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    let ai = D.cars.find((x) => x !== D.player); park(ai); ai.body.position.set(-100, 2, 100);
    const out = { launch: {}, vTop: {} };
    /* launch: 0-20 m/s on the open west lane, three lanes, best time (the first 2 s are clear of props) */
    for (const t of ['outrider', 'viper', 'cruiser']) {
      D.respawnCar(D.player, t); await wt(0.3); const c = D.player; park(c); out.vTop[t] = +c.vTop.toFixed(2);
      let best = 9;
      for (const z of [30, 60, -40]) {
        still(c, -110, z, 0); await wt(1.0); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); await wt(0.3);
        const t0 = D.game.time; let t20 = 9; D.touch.throttle = 1; /* the player's ctrl is rebuilt from keys/touch every frame */
        while (D.game.time - t0 < 3) { await sleep(5); if (Math.hypot(c.body.velocity.x, c.body.velocity.z) >= 20) { t20 = D.game.time - t0; break; } }
        D.touch.throttle = 0; best = Math.min(best, t20);
      }
      out.launch[t] = +best.toFixed(2);
    }
    /* shove: Cruiser and Outrider nose to nose, both flat out for 3 s: who gets pushed back? */
    D.respawnCar(D.player, 'cruiser'); await wt(0.3); const cop = D.player; park(cop);
    if (ai.type !== 'outrider' || ai.wrecked) { D.respawnCar(ai, 'outrider'); await wt(0.3); ai = D.cars.find((x) => x !== D.player); }
    park(ai);
    out.shove = [];
    for (const z of [30, 60]) {
      still(cop, -100, z, 0); still(ai, -100 + (cop.T.L + ai.T.L) / 2 + 0.4, z, Math.PI); await wt(1.0);
      cop.body.velocity.set(0, 0, 0); ai.body.velocity.set(0, 0, 0); await wt(0.2);
      const x0 = (cop.body.position.x + ai.body.position.x) / 2; D.touch.throttle = 1; ai.ctrl.throttle = 1; await wt(3);
      D.touch.throttle = 0; ai.ctrl.throttle = 0;
      out.shove.push(+(((cop.body.position.x + ai.body.position.x) / 2) - x0).toFixed(1)); /* + = the cruiser pushed the outrider back */
    }
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.launch.cruiser <= 1.6, `the Cruiser launches hard: 0-20 m/s in ${r.launch.cruiser} s (Outrider ${r.launch.outrider} s, Viper ${r.launch.viper} s; it was ~1.77 s like everyone)`);
  ok(r.launch.cruiser < r.launch.outrider - 0.1, 'quicker off the line than the Outrider');
  ok(r.vTop.cruiser < r.vTop.viper, `still not the fastest: top speed ${r.vTop.cruiser} < Viper ${r.vTop.viper}`);
  ok(r.shove.every((d) => d > 1), `wins a nose-to-nose shove against the Outrider (pushed it back ${r.shove.join(' / ')} m)`);
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'CRUISERPOWER PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
