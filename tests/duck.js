// Rubber Duck: the FIRST hosing of a bull makes it give up — it sits down in the puddle,
// defeated (satT), and a rubber duck floats past. A second hosing does not re-trigger it,
// and when the timer runs out the bull gets up again. Fails on the pre-change tree:
// hoseBull/DUCKS do not exist there and a hosed bull just gets shoved.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const W = (ms) => page.waitForTimeout(ms);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r1 = await page.evaluate(() => { const D = __derby, bl = D.BULLS[0]; if (!bl) return { nobull: true };
    bl.state = 'graze'; bl.target = D.player; // mid-argument with the player: the hose ends it
    const q = bl.body.position, p = { x: q.x - 10, y: q.y, z: q.z };
    const hit = D.hoseBull(D.player, bl, p, { x: 1, z: 0 }, 0.05);
    return { hit, ducked: !!bl.ducked, satT: bl.satT || 0, ducks: D.DUCKS.length, target: bl.target ? 'set' : null, x: q.x, z: q.z };
  });
  ok(!r1.nobull, 'a bull exists');
  ok(r1.hit === true, 'hose stream reaches the bull');
  ok(r1.ducked && r1.satT > 4, `first hosing: bull gives up and sits (satT=${(r1.satT || 0).toFixed(2)})`);
  ok(r1.ducks === 1, `a rubber duck floats past (DUCKS=${r1.ducks})`);
  ok(r1.target === null, 'the bull drops its target: the argument is over');
  await W(800);
  const r2 = await page.evaluate((r1) => { const D = __derby, bl = D.BULLS[0], q = bl.body.position;
    const moved = Math.hypot(q.x - r1.x, q.z - r1.z);
    const p = { x: q.x - 10, y: q.y, z: q.z };
    D.hoseBull(D.player, bl, p, { x: 1, z: 0 }, 0.05); // second hosing: no second duck, no re-trigger
    return { moved, ducks: D.DUCKS.length, satT: bl.satT || 0 };
  }, r1);
  ok(r2.moved < 2, `sat bull stays sat (moved ${r2.moved.toFixed(2)} m in 0.8 s)`);
  ok(r2.ducks === 1, `second hosing spawns no second duck (DUCKS=${r2.ducks})`);
  await page.evaluate(() => { __derby.BULLS[0].satT = 0.05; });
  await W(450);
  const r3 = await page.evaluate(() => ({ satT: __derby.BULLS[0].satT || 0, state: __derby.BULLS[0].state }));
  ok(!(r3.satT > 0), `timer over: the bull gets up again (state=${r3.state})`);
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'DUCK PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
