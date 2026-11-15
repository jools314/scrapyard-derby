// Honk Back: honking near a bull gets a moo pitched like the car's horn (hornPitch/2);
// a second honk within 6 s from the same car harmonises a fifth up (x1.5); after the
// window the next honk starts again at the plain answer. Out of earshot: no answer.
// Fails on the pre-change tree: honkBack does not exist and bullMoo takes no pitch.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 60000 });
  const r = await page.evaluate(() => { const D = __derby, car = D.player, bl = D.BULLS[0]; if (!bl) return { nobull: true };
    const pp = car.body.position, near = (d) => { bl.body.position.set(pp.x + d, 1.3, pp.z); bl.body.velocity.set(0, 0, 0); bl.state = 'graze'; bl.t = 999; };
    near(100); const far = D.honkBack(car);
    near(10); const a = D.honkBack(car);
    const b = D.honkBack(car);
    D.simTime = D.simTime + 10; // let the harmony window lapse
    const c = D.honkBack(car);
    return { far, a: a && { f: a.f, n: a.n }, b: b && { f: b.f, n: b.n }, c: c && { f: c.f, n: c.n },
      honkF: bl.honkF, lastMooF: bl.lastMooF, want: Math.min(520, Math.max(330, car.hornPitch || 440)) / 2 };
  });
  ok(!r.nobull, 'a bull exists');
  ok(r.far === null, 'no answer from out of earshot (100 m)');
  ok(r.a && r.a.n === 1 && Math.abs(r.a.f - r.want) < 0.01, `first honk: the bull answers at the horn's pitch (f=${r.a && r.a.f.toFixed(1)}, hornPitch/2=${r.want.toFixed(1)})`);
  ok(r.b && r.b.n === 2 && Math.abs(r.b.f - r.a.f * 1.5) < 0.01, `second honk: it harmonises a fifth up (f=${r.b && r.b.f.toFixed(1)})`);
  ok(r.c && r.c.n === 1 && Math.abs(r.c.f - r.want) < 0.01, 'after the window, the next honk is a plain answer again');
  ok(Math.abs(r.lastMooF - r.c.f) < 0.01, `the moo that sounded was at the answer pitch (lastMooF=${r.lastMooF && r.lastMooF.toFixed(1)})`);
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'HONKBACK PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
