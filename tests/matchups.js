// autoplay banner shows the build (and a pending update); the play log records matchups: who wrecked whom, and drag-kills (tow truck / forklift into the crusher / ball)
const { open } = require('./harness');
(async () => { const fails = []; const ok = (m, c, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m, d ? JSON.stringify(d) : ''); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  await page.evaluate(() => { window.__noRender = true; document.getElementById('btnAutoplay').click(); });
  await page.waitForFunction(() => __derby.AUTO.on && __derby.game.state === 'playing' && __derby.game.countdown <= 0 && __derby.PLAYLOG.m, null, { timeout: 300000 });
  await page.waitForTimeout(1500);
  const b1 = await page.evaluate(() => document.getElementById('apBanner').textContent);
  const build = await page.evaluate(() => document.documentElement.innerHTML.match(/const BUILD = '(\d+)'/)[1]);
  ok('autoplay banner shows the build number', b1.includes('BUILD ' + build), { b1 });
  await page.evaluate(() => { __derby.UPDATE.newer = '999'; }); await page.waitForTimeout(1500);
  const b2 = await page.evaluate(() => document.getElementById('apBanner').textContent);
  ok('...and that it will update when a newer build is out', /updating to 999/.test(b2), { b2 });
  await page.evaluate(() => { __derby.UPDATE.newer = null; });
  const r = await page.evaluate(() => {
    const D = __derby, cars = D.cars.filter((c) => !c.wrecked), [a, b, c, d] = cars;
    b.lastAttacker = a; b.lastAttackTime = 1e9; D.game.onWreck(b);
    c.lastAttacker = null; c.__relBy = d; c.__relT = 1e9; D.game.onWreck(c);
    const m = D.PLAYLOG.m, rec = D.PLAYLOG.rec('ck', 'test');
    return { k1: a.type + '>' + b.type, k2: d.type + '>' + c.type, vs: m.vs, recVs: rec.vs, hasVsD: !!rec.vsD };
  });
  ok('a wreck is logged as killer>victim', r.vs[r.k1] && r.vs[r.k1].k >= 1, r);
  ok('a car dropped/towed into a hazard credits the dragger as "dragged"', r.vs[r.k2] && r.vs[r.k2].dragged >= 1, r.vs[r.k2]);
  ok('the match record carries matchups and damage by pair', !!r.recVs && r.hasVsD);
  await page.waitForTimeout(8000); // real AI damage shows up by pair
  const dmg = await page.evaluate(() => Object.keys(__derby.PLAYLOG.m.vsD).length);
  ok('damage between car pairs accumulates during play', dmg > 0, { pairs: dmg });
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok('no page errors', pe.length === 0, pe.slice(0, 3));
  await browser.close(); console.log(fails.length ? 'MATCHUPS FAIL' : 'MATCHUPS PASS'); process.exit(fails.length ? 1 : 0); })();
