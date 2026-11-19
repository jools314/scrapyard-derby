// Before/after screenshots at fixed cameras, high (q0) and low (q7) quality: node tools/perf/shots.js OUTDIR [GAME=...]
// One opponent (fewer moving things in the frame); the camera looks at the scenery the perf work touched.
const path = require('path'); const H = require(path.join(__dirname, '..', '..', 'tests', 'harness'));
const OUT = process.argv[2] || 'shots'; require('fs').mkdirSync(OUT, { recursive: true });
const VIEWS = { overview: [0, 45, -175, 0, 0, 10], containers: [-20, 9, -118, -45, 2, -148], pallets: [88, 6, -45, 110, 1, -60], fence: [-120, 8, 120, -150, 3, 150], center: [25, 7, 25, -10, 1, -5] };
(async () => {
  const { browser, page, errors } = await H.open({ viewport: { width: 1280, height: 720 } }, () => { let a = 1234567; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }); // (the same yard both times)
  page.setDefaultTimeout(600000);
  await page.evaluate(() => { const D = __derby; D.S.aiCount = 1; D.S.autoGfx = false; D.applyQuality(0); document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 600000, polling: 1000 });
  for (const [q, name] of [[0, 'high'], [7, 'low']]) {
    await page.evaluate((q) => { const D = __derby; D.S.autoGfx = true; D.applyQuality(q); }, q);
    for (const [v, c] of Object.entries(VIEWS)) {
      await page.evaluate((c) => { window.__camOverride = { pos: c.slice(0, 3), look: c.slice(3) }; }, c);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(OUT, `${name}-${v}.png`) });
    }
  }
  const pe = errors.filter((e) => e.startsWith('pageerror')); console.log(pe.length ? 'page errors: ' + pe.join(' | ') : 'no page errors'); await browser.close();
})();
