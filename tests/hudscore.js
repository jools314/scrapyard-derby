// HUD dedup (DESIGN-PRINCIPLES 9: show everything once): every driver's score sits on their
// opponents-list name/health row, and the separate small leaderboard panel no longer exists.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const W = (ms) => page.waitForTimeout(ms);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 5; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  await W(600);
  ok(await page.evaluate(() => document.getElementById('lboard') === null), 'no separate leaderboard element (#lboard is gone)');
  const before = await page.evaluate(() => { const rows = [...document.querySelectorAll('#opponents li')];
    return { n: rows.length, pts: rows.map((li) => (li.querySelector('.opp-p') || {}).textContent) }; });
  ok(before.n >= 3, `opponents list has ${before.n} name/health rows`);
  ok(before.pts.every((p) => p !== undefined && p !== '' && !Number.isNaN(+p)), 'every opponent row shows a numeric score: ' + JSON.stringify(before.pts));
  // wreck someone: the killer's row must gain exactly 100 points (SCORE.pts: 100 per wreck)
  const after = await page.evaluate(() => new Promise((res) => { const D = __derby, ai = D.cars.filter((c) => !c.isPlayer);
    D.SCORE.wreck(ai[1], ai[0]);
    setTimeout(() => { const rows = [...document.querySelectorAll('#opponents li')];
      res({ pts: rows.map((li) => (li.querySelector('.opp-p') || {}).textContent), want: String(D.SCORE.pts(D.SCORE.rows.get(D.SCORE.keyOf(ai[0])))) }); }, 700); }));
  ok(after.pts[0] === after.want && +after.pts[0] === +(before.pts[0] || 0) + 100, `killer's row score rose by 100 (${before.pts[0]} -> ${after.pts[0]}, SCORE says ${after.want})`);
  const errs = errors.filter((e) => !e.includes('ERR_FAILED') && !/^warning/.test(e));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 5)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'HUDSCORE PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
