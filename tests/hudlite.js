// Weak laptops (Build 101): at the two lowest quality levels the speedometer redraws ~20 times a second instead of every frame
// (a needle needs no more; on a 4x-throttled CPU the gauge and threat arrows were ~4.5% of the frame). At normal quality it
// still redraws every frame. Counts drawing calls on the gauge canvas. Fails on Build 100 (every frame at every level).
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 1100, height: 650 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.autoGfx = false; __derby.S.aiCount = 2; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 90000 });
  await page.evaluate(() => { __derby.AUTO.on = true; }); await page.waitForTimeout(2000); // (autoplay drives: a parked car's needle never moves and the gauge skips its redraw)
  const r = await page.evaluate(async () => { const g = document.getElementById('gauge').getContext('2d'), P = Object.getPrototypeOf(g), o = P.setTransform; let n = 0, last = -1;
    P.setTransform = function (...a) { if (this === g) { const t = performance.now(); if (t - last > 1.5) n++; last = t; } return o.apply(this, a); }; // (one redraw calls it a few times in a row)
    const frames = async (k) => { for (let i = 0; i < k; i++) await new Promise((r) => requestAnimationFrame(r)); };
    const measure = async (q) => { __derby.applyQuality(q); await frames(5); n = 0; let f = 0; const t0 = performance.now(); while (performance.now() - t0 < 3000) { await frames(1); f++; } const s = (performance.now() - t0) / 1000; return { draws: n, frames: f, perSec: +(n / s).toFixed(1), fps: +(f / s).toFixed(1) }; };
    const hi = await measure(0), lo = await measure(7); P.setTransform = o; return { hi, lo }; });
  console.log('  q0', JSON.stringify(r.hi), ' q7', JSON.stringify(r.lo));
  ok(r.hi.draws > 0 && r.hi.draws >= r.hi.frames * 0.5, `normal quality: the gauge redraws on most frames while driving (${r.hi.draws} draws / ${r.hi.frames} frames)`);
  ok(r.lo.perSec <= 24 && r.lo.draws > 0, /* (no lower bar beyond 'it still draws': the gauge also skips a redraw whenever the needle has not moved, so the count depends on how the autoplay drives — once 7.6/s) */ `lowest quality: the gauge redraws at most ~20 times a second (${r.lo.perSec}/s at ${r.lo.fps} fps)`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'HUDLITE FAIL' : 'HUDLITE PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
