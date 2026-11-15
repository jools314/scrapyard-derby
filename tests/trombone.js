// Sad Trombone: the first wreck within 10 s of the match start earns one sad trombone;
// within 5 s it is the half-hearted version that gives up halfway. Only one per match,
// and a later first wreck earns nothing. Fails on the pre-change tree:
// sadTromboneKind / sfx.trombone / game.tromboneKind do not exist.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const unit = await page.evaluate(() => { const D = __derby;
    return { k3: D.sadTromboneKind(3), k5: D.sadTromboneKind(5), k7: D.sadTromboneKind(7), k10: D.sadTromboneKind(10), k11: D.sadTromboneKind(11), sting: typeof D.sfx.trombone };
  });
  ok(unit.k3 === 'half' && unit.k5 === 'half', `a wreck within 5 s earns the giving-up trombone (${unit.k3}/${unit.k5})`);
  ok(unit.k7 === 'full' && unit.k10 === 'full', `a wreck at 5–10 s earns the full trombone (${unit.k7}/${unit.k10})`);
  ok(unit.k11 === null, 'a wreck after 10 s earns no trombone');
  ok(unit.sting === 'function', 'sfx.trombone exists');
  const r = await page.evaluate(() => { const D = __derby, ai = D.cars.filter((c) => !c.isPlayer);
    D.game.time = 7; D.game.onWreck(ai[0]); // first wreck at 7 s
    const first = { kind: D.game.tromboneKind, done: !!D.game.tromboneDone };
    D.game.time = 3; D.game.onWreck(ai[1]); // an even earlier-feeling second wreck: no second trombone
    return { first, kindAfter: D.game.tromboneKind };
  });
  ok(r.first.kind === 'full' && r.first.done, `first wreck at 7 s: full trombone played (kind=${r.first.kind})`);
  ok(r.kindAfter === 'full', 'second wreck does not re-trigger or change the trombone (one per match)');
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'TROMBONE PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
