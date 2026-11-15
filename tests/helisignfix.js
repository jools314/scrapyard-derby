// Helicopter Sign regression fix (builds 82->88): a flight must not chain.
// Build 88 let a sign keep the full spin that knocked it (often 12-16 rad/s), so
// when its two seconds ended near the ground — or it came down in a pile still
// whirling — the very same knock lifted it again, keeping a loose body bouncing
// through the busiest corners. Play logs: physics catches 325 -> 420+/h and stuck
// 39 -> 78/h (Mac, build 82 -> 88), signs being the only new flying body that
// triggers constantly (~430 flights/h in autoplay census). The fix bleeds the
// spin to 7 rad/s at lift-off (under the 9 rad/s lift threshold) and caps the
// hover at 3 m. Fails on the pre-fix tree: the spin survives lift-off untouched
// and an expiring flight near the ground re-lifts on the same knock.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const W = (ms) => page.waitForTimeout(ms);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r1 = await page.evaluate(() => { const D = __derby;
    const s = D.props.find((pr) => pr.sign);
    if (!s) return { nosign: true };
    if (s.dormant) { s.dormant = false; if (!D.world.bodies.includes(s.body)) D.world.addBody(s.body); }
    s.body.position.set(0, 1.1, -20); s.body.velocity.set(0, 0, 0); s.body.quaternion.set(0, 0, 0, 1);
    s.body.angularVelocity.set(0, 14, 0); s.body.wakeUp();
    D.updateSigns(0.05);
    return { heliT: s.heliT || 0, vy: s.body.velocity.y, av: s.body.angularVelocity.length(), flights: s.heliFlights || 0 };
  });
  ok(!r1.nosign, 'yard signs exist and are marked');
  ok(r1.heliT > 1.5, `a hard knock still lifts the sign (heliT=${(r1.heliT || 0).toFixed(2)} of 2 s)`);
  ok(r1.vy >= 6, `it still climbs (vy=${(r1.vy || 0).toFixed(1)})`);
  ok(r1.flights === 1, 'the flight is counted');
  ok(r1.av <= 7.5, `the spin is bled under the lift threshold at lift-off (|av|=${(r1.av || 0).toFixed(1)} <= 7.5; pre-fix it stays 14)`);
  // Run the flight clock out with the sign held near the ground, still carrying
  // whatever spin the fix left it: the same knock must not lift it again.
  await page.evaluate(() => { const s = __derby.props.find((pr) => pr.sign); s.heliT = 0.05; s.body.velocity.set(0, 0, 0); s.body.position.y = 1.1; });
  await W(700);
  const r2 = await page.evaluate(() => { const s = __derby.props.find((pr) => pr.sign); return { heliT: s.heliT || 0, flights: s.heliFlights || 0 }; });
  ok(r2.flights === 1 && !(r2.heliT > 0), `one knock, one flight: no chained re-lift (flights=${r2.flights}, heliT=${r2.heliT})`);
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'HELISIGNFIX PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
