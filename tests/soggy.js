// Soggy Burger: hosing a bull-burger makes it limp and friction-free — it takes a shove,
// keeps almost all of its slide (a dry burger is damped 0.9/step), sags wide and flat,
// and dries back to a proud burger on a timer. Fails on the pre-change tree: hoseBull
// ignores burgers and soggyT does not exist.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const W = (ms) => page.waitForTimeout(ms);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r1 = await page.evaluate(() => { const D = __derby, bl = D.BULLS[0]; if (!bl) return { nobull: true };
    D.cookBull(bl, null, 2); // flame-grilled on the spot: now a burger
    if (bl.state !== 'burger') return { notburger: bl.state };
    bl.body.velocity.set(0, 0, 0);
    const q = bl.body.position, p = { x: q.x - 10, y: q.y, z: q.z };
    const hit = D.hoseBull(D.player, bl, p, { x: 1, z: 0 }, 0.05);
    return { hit, soggyT: bl.soggyT || 0, vx: bl.body.velocity.x };
  });
  ok(!r1.nobull && !r1.notburger, 'a bull cooked into a burger');
  ok(r1.hit === true && r1.soggyT > 7, `hosing starts the soggy timer (soggyT=${(r1.soggyT || 0).toFixed(2)})`);
  ok(r1.vx > 3, `the hose shoves the soggy burger into a slide (vx=${(r1.vx || 0).toFixed(2)})`);
  await W(500);
  const r2 = await page.evaluate(() => { const D = __derby, bl = D.BULLS[0];
    return { vx: bl.body.velocity.x, soggyT: bl.soggyT || 0, sy: bl.burger ? bl.burger.scale.y : null, sx: bl.burger ? bl.burger.scale.x : null, state: bl.state };
  });
  ok(r2.state === 'burger', 'still a burger while soggy (it counts as a burger everywhere)');
  ok(r2.vx > r1.vx * 0.5, `friction-free: it kept most of its slide after 0.5 s (vx ${r1.vx.toFixed(2)} -> ${r2.vx.toFixed(2)}; a dry burger would be under 1)`);
  ok(r2.sy !== null && r2.sy < 1.1 && r2.sx > 1.35, `limp: the burger sags wide and flat (scale ${r2.sx.toFixed(2)} x ${r2.sy.toFixed(2)}, proud is 1.25 x 1.25)`);
  await page.evaluate(() => { __derby.BULLS[0].soggyT = 0.05; });
  await W(450);
  const r3 = await page.evaluate(() => { const bl = __derby.BULLS[0]; return { soggyT: bl.soggyT || 0, sy: bl.burger ? bl.burger.scale.y : null }; });
  ok(!(r3.soggyT > 0) && r3.sy !== null && Math.abs(r3.sy - 1.25) < 0.01, `dried out: back to a proud burger (scale.y=${r3.sy})`);
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'SOGGY PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
