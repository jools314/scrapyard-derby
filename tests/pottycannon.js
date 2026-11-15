// Potty Cannon: a porta-potty sitting on a geyser when it blows becomes the yard's
// least aerodynamic aircraft — a far bigger launch than an ordinary prop gets from
// the same geyser (26 vs 16), a tumble, and the flight is counted on the potty
// (pottyFlights), once per blow. An ordinary prop on the same geyser keeps the
// ordinary launch and no flight count. Fails on the pre-change tree: potties are
// not marked and every prop gets the same 16.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r = await page.evaluate(() => { const D = __derby, g = D.ARENA.geysers[0];
    const potty = D.props.find((pr) => pr.potty), crate = D.props.find((pr) => pr.kind === 'wood' && !pr.potty);
    if (!potty || !crate) return { missing: true, potty: !!potty, crate: !!crate };
    for (const pr of [potty, crate]) { pr.dormant = false; if (!D.world.bodies.includes(pr.body)) D.world.addBody(pr.body); pr.body.wakeUp(); }
    potty.body.position.set(g.x, 1.2, g.z); potty.body.velocity.set(0, 0, 0); potty.body.angularVelocity.set(0, 0, 0);
    crate.body.position.set(g.x + 1.5, 0.7, g.z + 1.5); crate.body.velocity.set(0, 0, 0);
    g.state = 'blow'; g.t = 1.6; g.hit = new Set();
    D.updateArenaPub(0.05); // one tick of the eruption
    const out = { pottyVy: potty.body.velocity.y, pottySpin: Math.hypot(potty.body.angularVelocity.x, potty.body.angularVelocity.z), flights: potty.pottyFlights || 0, crateVy: crate.body.velocity.y, crateFlights: crate.pottyFlights || 0 };
    D.updateArenaPub(0.05); // still the same blow: no second flight counted
    out.flightsAfterSecondTick = potty.pottyFlights || 0;
    return out;
  });
  ok(!r.missing, 'a marked potty and an ordinary crate exist');
  ok(r.pottyVy >= 24, `potty cannon: the potty launched hard (vy=${(r.pottyVy || 0).toFixed(1)}, ordinary props get 16)`);
  ok(r.pottySpin > 2, `the potty tumbles in flight (spin=${(r.pottySpin || 0).toFixed(1)})`);
  ok(r.flights === 1 && r.flightsAfterSecondTick === 1, `the flight is counted once per blow (flights=${r.flights} -> ${r.flightsAfterSecondTick})`);
  ok(r.crateVy > 10 && r.crateVy <= 17 && r.crateFlights === 0, `the ordinary prop keeps the ordinary launch (vy=${(r.crateVy || 0).toFixed(1)}) and no flight count`);
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'POTTYCANNON PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
