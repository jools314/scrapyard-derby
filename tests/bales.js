// Read the Bales: occasionally a Combine bale comes out with a message printed on
// it (HELP, SEND NITRO, I WAS A VIPER, …). Most bales stay plain. The message is
// carried on the bale mesh itself (userData.msg + its own printed texture).
// Fails on the pre-change tree: baleMsgRoll/harvestProp are not exposed there and
// no bale ever has a msg.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const W = (ms) => page.waitForTimeout(ms);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r1 = await page.evaluate(() => { const D = __derby, orig = Math.random;
    Math.random = () => 0.01; const lucky = D.baleMsgRoll();
    Math.random = () => 0.9; const plain = D.baleMsgRoll();
    Math.random = orig;
    return { lucky, plain, msgs: D.BALE_MSGS.slice() };
  });
  ok(typeof r1.lucky === 'string' && r1.msgs.includes(r1.lucky), `a lucky roll prints a message from the set (${JSON.stringify(r1.lucky)})`);
  ok(r1.plain === null, 'an ordinary roll: a plain bale');
  await page.evaluate(() => { const D = __derby;
    D.respawnCar(D.player, 'combine');
    window.__origRandom = Math.random; Math.random = () => 0.01; // every roll lucky until the bale is out (the roll happens as the bale is made, ~0.9 s later)
    const pr = D.props.find((p) => p.kind === 'wood');
    D.harvestProp(D.player, pr);
  });
  await W(2000); // bales pop out of the back ~0.9 s after the reel takes the prop in
  const r2 = await page.evaluate(() => { const D = __derby;
    Math.random = window.__origRandom;
    const msgBale = D.debris.find((d) => d.mesh && d.mesh.userData && d.mesh.userData.msg);
    return { found: !!msgBale, msg: msgBale ? msgBale.mesh.userData.msg : null, hasMap: !!(msgBale && msgBale.mesh.material && msgBale.mesh.material.map) };
  });
  ok(r2.found, 'a harvested bale came out with a message on it');
  ok(r2.msg && r1.msgs.includes(r2.msg), `the message is from the printed set (${JSON.stringify(r2.msg)})`);
  ok(r2.hasMap, 'the bale carries its printed texture');
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'BALES PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
