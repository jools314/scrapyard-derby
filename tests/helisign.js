// Helicopter Sign: knock a yard sign spinning fast enough and it lifts — it
// helicopters wildly for two seconds (heliT), held up against gravity, before
// clattering down as a normal sign again. A slowly turning sign stays grounded.
// Fails on the pre-change tree: signs are not marked and heliT does not exist.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const W = (ms) => page.waitForTimeout(ms);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r1 = await page.evaluate(() => { const D = __derby;
    const sign = D.props.find((pr) => pr.sign), slow = D.props.filter((pr) => pr.sign)[1];
    if (!sign || !slow) return { nosign: true };
    for (const pr of [sign, slow]) { if (pr.dormant) { pr.dormant = false; if (!D.world.bodies.includes(pr.body)) D.world.addBody(pr.body); } pr.body.wakeUp(); pr.body.velocity.set(0, 0, 0); }
    sign.body.position.y = 1.1; sign.body.angularVelocity.set(0, 14, 0); // a hard knock: spinning fast
    slow.body.angularVelocity.set(0, 2, 0); // a gentle turn
    D.updateSigns(0.05);
    return { signVy: sign.body.velocity.y, heliT: sign.heliT || 0, flights: sign.heliFlights || 0, slowVy: slow.body.velocity.y, slowHeliT: slow.heliT || 0 };
  });
  ok(!r1.nosign, 'yard signs exist and are marked');
  ok(r1.heliT > 1.5, `spinning fast: the sign lifts off (heliT=${(r1.heliT || 0).toFixed(2)} of 2 s)`);
  ok(r1.signVy >= 6, `it climbs (vy=${(r1.signVy || 0).toFixed(1)})`);
  ok(r1.flights === 1, 'the flight is counted');
  ok(r1.slowHeliT === 0 && r1.slowVy < 6, `a slowly turning sign stays a sign (vy=${(r1.slowVy || 0).toFixed(1)})`);
  await page.evaluate(() => { const s = __derby.props.find((pr) => pr.sign && pr.heliT > 0); if (s) { s.heliT = 0.05; s.body.angularVelocity.set(0, 0, 0); } }); // run the clock out, with the spin spent as a clattered landing would spend it (a sign still spinning fast near the ground honestly lifts again)
  await W(500);
  const r2 = await page.evaluate(() => { const s = __derby.props.find((pr) => pr.sign); return { heliT: s ? (s.heliT || 0) : null }; });
  ok(!(r2.heliT > 0), `two seconds over: it clatters down and is a normal sign again (heliT=${r2.heliT})`);
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'HELISIGN PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
