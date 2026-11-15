// The Shake-Off: a fully soaked bull (soak >= 1 from the hose), once the hose stops
// and it starts to dry (its wet timer runs out), shakes itself dry like a huge dog —
// spraying every car within reach with a 3-second grip penalty (car.slipT, which
// halves wheel friction while it lasts). Cars out of reach stay dry, and the bull
// cannot shake twice for one soaking. Fails on the pre-change tree: soak/shakeOff
// and car.slipT do not exist there.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const W = (ms) => page.waitForTimeout(ms);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r1 = await page.evaluate(() => { const D = __derby, bl = D.BULLS[0]; if (!bl) return { nobull: true };
    // park the player right next to the bull, then soak the bull and let it dry
    const q = bl.body.position;
    D.player.body.position.set(q.x + 4, 1, q.z); D.player.body.velocity.set(0, 0, 0);
    bl.state = 'graze'; bl.t = 999; bl.soak = 1; bl.wet = 0.05; // fully soaked, hose just stopped
    return { slipBefore: D.player.slipT || 0 };
  });
  ok(!r1.nobull, 'a bull exists');
  ok((r1.slipBefore || 0) === 0, 'the player starts dry');
  await W(700);
  const r2 = await page.evaluate(() => { const D = __derby, bl = D.BULLS[0];
    return { shakes: bl.shakes || 0, soak: bl.soak || 0, slip: D.player.slipT || 0 };
  });
  ok(r2.shakes >= 1, `drying out: the soaked bull shook itself dry (shakes=${r2.shakes})`);
  ok(r2.soak === 0, 'the shake spends the soak');
  ok(r2.slip > 1.5, `the nearby car got sprayed: grip penalty running (slipT=${r2.slip.toFixed(2)} of 3 s)`);
  const r3 = await page.evaluate(() => { const D = __derby, bl = D.BULLS[0];
    // move the player far away and shake again by hand: nobody in reach, nobody sprayed
    D.player.body.position.set(bl.body.position.x + 60, 1, bl.body.position.z + 60); D.player.body.velocity.set(0, 0, 0); D.player.slipT = 0;
    const sprayed = D.shakeOff(bl);
    return { sprayed, slip: D.player.slipT || 0 };
  });
  ok(r3.sprayed === 0 && (r3.slip || 0) === 0, 'a shake with nobody in reach sprays nobody');
  await page.evaluate(() => { __derby.player.slipT = 0.05; });
  await W(450);
  const r4 = await page.evaluate(() => ({ slip: __derby.player.slipT || 0 }));
  ok(!(r4.slip > 0), `the grip penalty times out (slipT=${r4.slip})`);
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'SHAKEOFF PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
