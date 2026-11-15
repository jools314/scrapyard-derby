// Instant Ground Beef: a bull in the Combine's reel comes out the back as a burger —
// no fire — and the harvest counter agrees. Fails on the pre-change tree: the reel
// only knocks the bull down and tosses it, so it never becomes a burger.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r = await page.evaluate(async () => { const D = __derby, sleep = (ms) => new Promise((s) => setTimeout(s, ms));
    D.respawnCar(D.player, 'combine');
    const car = D.player, bl = D.BULLS[0]; if (!bl) return { nobull: true };
    const harvested0 = car.harvested || 0;
    car.reelOn = true;
    const t0 = Date.now();
    while (Date.now() - t0 < 9000) {
      if (bl.state === 'burger') break;
      // pin the bull in the reel's mouth (it would rather wander off) until the reel takes it
      bl.state = 'graze'; bl.t = 999; bl.satT = 0;
      const front = car.T.L / 2 + 0.75 - car.comShift;
      const wp = car.body.pointToWorldFrame(new D.CANNON.Vec3(front + 0.2, 0, 0));
      bl.body.position.set(wp.x, 1.3, wp.z); bl.body.velocity.set(0, 0, 0);
      await sleep(200);
    }
    const bp = bl.body.position, cp = car.body.position;
    const behind = (bp.x - cp.x) * car.fwd.x + (bp.z - cp.z) * car.fwd.z;
    return { state: bl.state, harvested: (car.harvested || 0) - harvested0, behind };
  });
  ok(!r.nobull, 'a bull exists');
  ok(r.state === 'burger', `reel contact turned the bull into a burger (state=${r.state})`);
  ok(r.harvested >= 1, `the harvest counter counted it (harvested +${r.harvested})`);
  ok(r.behind < 0, `the burger came out the BACK of the combine (forward offset ${r.behind.toFixed(1)} m)`);
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'GROUNDBEEF PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
