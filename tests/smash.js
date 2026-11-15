// Smash Burger: a burger that goes into the crusher — or under the Bulldozer's blade
// when it slams down — comes out wide, flat and proud on a little paper tray. It is
// still a burger everywhere burgers count (state stays 'burger'). A live bull is not
// a burger and cannot be smashed. Fails on the pre-change tree: smashBurger/bladeSlam
// are not exposed there and crushNow ignores burgers entirely.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r1 = await page.evaluate(() => { const D = __derby, C = D.CRUSHER;
    for (const c of D.cars) { const p = c.body.position; if (Math.abs(p.x - C.x) < 10 && Math.abs(p.z - C.z) < 10) { p.x += 60; c.body.velocity.set(0, 0, 0); } } // nobody in the press
    const live = D.BULLS[2], notBurger = live ? D.smashBurger(live, 'crusher') : 'nobull';
    const bl = D.BULLS[0]; if (!bl) return { nobull: true, notBurger };
    D.cookBull(bl, null, 2);
    if (bl.state !== 'burger') return { notburger: bl.state, notBurger };
    bl.body.position.set(C.x, 1, C.z); bl.body.velocity.set(0, 0, 0);
    D.crushNow();
    return { notBurger, smashed: !!bl.smashed, how: bl.smashHow || null, tray: !!bl.tray, state: bl.state,
      sx: bl.burger ? bl.burger.scale.x : null, sy: bl.burger ? bl.burger.scale.y : null };
  });
  ok(!r1.nobull && !r1.notburger, 'a bull cooked into a burger');
  ok(r1.notBurger === false, 'a live bull cannot be smash-burgered');
  ok(r1.smashed && r1.how === 'crusher', `crusher: the burger came out smashed (how=${r1.how})`);
  ok(r1.tray, 'crusher: it sits on a little paper tray');
  ok(r1.state === 'burger', 'it still counts as a burger (state stays burger)');
  ok(r1.sx !== null && r1.sx >= 1.6 && r1.sy <= 0.7, `wide and flat: scale ${r1.sx && r1.sx.toFixed(2)} x ${r1.sy && r1.sy.toFixed(2)} (proud is 1.25 x 1.25)`);
  const r2 = await page.evaluate(() => { const D = __derby;
    const bl = D.BULLS[1]; if (!bl) return { nobull: true };
    D.cookBull(bl, null, 2);
    if (bl.state !== 'burger') return { notburger: bl.state };
    D.respawnCar(D.player, 'dozer');
    const car = D.player;
    const wp = car.body.pointToWorldFrame(new D.CANNON.Vec3(car.T.L / 2 + 0.8 - car.comShift, 0, 0));
    bl.body.position.set(wp.x, 1, wp.z); bl.body.velocity.set(0, 0, 0);
    D.bladeSlam(car);
    return { smashed: !!bl.smashed, how: bl.smashHow || null, state: bl.state };
  });
  ok(!r2.nobull && !r2.notburger, 'a second bull cooked into a burger');
  ok(r2.smashed && r2.how === 'blade', `blade slam: the burger under the blade came out smashed (how=${r2.how})`);
  ok(r2.state === 'burger', 'blade: still a burger afterwards');
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'SMASH PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
