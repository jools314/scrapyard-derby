// Phones and tablets can change the camera (owner: "I can't figure out how to change the view camera when on mobile"). There is no
// room for a View button in the phone's top row (it pushed the gear button under the speedometer), but on touch screens tapping the
// speedometer already changes the camera - nothing said so. Now it wears a 🎥 badge, and a tap cycles chase -> far -> inside.
// Fails on Build 102 (no badge).
const { open } = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const [w, h, name] of [[390, 844, 'phone portrait'], [874, 402, 'phone landscape'], [1024, 1366, 'tablet']]) {
    const { browser, page, errors } = await open({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    await page.evaluate(() => { document.body.classList.add('touch'); window.__noRender = true; __derby.S.aiCount = 2; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 90000 });
    const r = await page.evaluate(() => { const b = document.querySelector('.speedo'), rc = b.getBoundingClientRect(), badge = getComputedStyle(b, '::after').content;
      return { shown: /🎥/.test(badge) && rc.width > 40, inside: rc.left >= 0 && rc.top >= 0 && rc.right <= innerWidth && rc.bottom <= innerHeight, cam0: __derby.camMode }; });
    ok(r.shown && r.inside, `${name}: the speedometer is on screen with a 🎥 badge`);
    if (r.shown) { await page.tap('.speedo'); await page.waitForTimeout(700); const c1 = await page.evaluate(() => __derby.camMode); await page.tap('.speedo'); await page.waitForTimeout(700); const c2 = await page.evaluate(() => __derby.camMode);
      // (taps 0.7 s apart: two within ~0.3 s are a double tap, which the page swallows so it never zooms - see zoom.js)
      ok(c1 === (r.cam0 + 1) % 3 && c2 === (r.cam0 + 2) % 3, `${name}: tapping the speedometer cycles the camera (${r.cam0} -> ${c1} -> ${c2})`); }
    const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, `${name}: no page errors ${pe.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
  console.log(fails.length ? 'TOUCHCAM FAIL' : 'TOUCHCAM PASS'); process.exit(fails.length ? 1 : 0);
})();
