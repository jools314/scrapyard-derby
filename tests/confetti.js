// Crusher Confetti: a cardboard box inside the press when it slams makes the crusher
// erupt confetti (CRUSHER.confetti counts the boxes celebrated). An empty press — or a
// second slam with nothing left inside — erupts nothing. Fails on the pre-change tree:
// crushNow flattens the box but CRUSHER.confetti is never set.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r = await page.evaluate(() => { const D = __derby, C = D.CRUSHER;
    for (const c of D.cars) { const p = c.body.position; if (Math.abs(p.x - C.x) < 8 && Math.abs(p.z - C.z) < 8) { p.x += 60; c.body.velocity.set(0, 0, 0); } } // nobody in the press for this test
    const box = D.props.find((pr) => pr.kind === 'cardboard');
    if (!box) return { nobox: true };
    D.crushNow(); // empty press: no confetti
    const afterEmpty = C.confetti || 0;
    box.body.position.set(C.x, 1, C.z); box.body.velocity.set(0, 0, 0); box.body.wakeUp();
    D.crushNow(); // a cardboard box in the press: confetti
    return { afterEmpty, confetti: C.confetti || 0, boxGone: !D.props.includes(box) };
  });
  ok(!r.nobox, 'a cardboard box exists in the yard');
  ok(r.afterEmpty === 0, 'an empty press erupts no confetti');
  ok(r.confetti >= 1, `cardboard in the press: confetti erupted (confetti=${r.confetti})`);
  ok(r.boxGone, 'the box was crushed (flattened out of the props list) as before');
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'CONFETTI PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
