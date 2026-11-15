// It Remembers: when a burger's time expires and a fresh bull wanders back in, one
// time in ten it returns wearing a sesame-seed bun as a hat. The hat stays until
// that bull is cooked (or the match ends). Fails on the pre-change tree:
// bunHatRoll/wearBunHat do not exist there.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r = await page.evaluate(() => { const D = __derby, orig = Math.random;
    const bl = D.BULLS[0], bl2 = D.BULLS[1]; if (!bl || !bl2) return { nobull: true };
    Math.random = () => 0.05; // a lucky roll: 1 in 10
    const rolled = D.bunHatRoll(bl);
    const hatAfterLucky = !!bl.hat, hatInScene = hatAfterLucky && bl.g.children.includes(bl.hat);
    Math.random = () => 0.5; // an ordinary roll: no hat
    const rolled2 = D.bunHatRoll(bl2);
    const hatAfterPlain = !!bl2.hat;
    Math.random = orig;
    D.cookBull(bl, null, 2); // cooked: the hat comes off
    return { rolled, hatAfterLucky, hatInScene, rolled2, hatAfterPlain, hatAfterCook: !!bl.hat, stateAfterCook: bl.state };
  });
  ok(!r.nobull, 'bulls exist');
  ok(r.rolled === true && r.hatAfterLucky, 'a 1-in-10 roll puts the bun hat on');
  ok(r.hatInScene, 'the hat is worn on the bull (a child of its group)');
  ok(r.rolled2 === false && !r.hatAfterPlain, 'an ordinary roll: no hat');
  ok(!r.hatAfterCook && r.stateAfterCook === 'burger', `cooking takes the hat off (state=${r.stateAfterCook})`);
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'REMEMBERS PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
