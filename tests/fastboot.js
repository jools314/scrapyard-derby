// Fast boot on a weak laptop: the page draws its first frame without waiting for the yard's shaders.
// The owner's Chromebook (Build 105, cold shader cache) took 16 s to its first frame: compileAsync of the yard ran into its 8 s timeout,
// and then the first frame compiled the same ~50 programs again (compileAsync built the on-screen variants, but quality 0-3 draws into
// the post chain's buffer, which needs other ones) plus the shadow and post shaders, all blocking. Now the first frame is the sky behind
// the menu (one small program), the yard's shaders compile after it for the way they are really drawn, and a device whose last match
// settled at the lowest qualities starts there.
// Stand-in for the Chromebook: 4x CPU throttle from before the page opens, KHR_parallel_shader_compile reported (the Chromebook has it;
// SwiftShader doesn't), and the remembered quality 7. LOADS page loads (default 3), medians.
// Fails on Build 108: ~90 programs compile before its first frame (here 3: the sky, and the env-map bake's two during the script),
// and its first frame took 26-33 s on this setup (median 31 s, 18 s of it after the script); this build 8-12 s (median 11 s, 5 s).
const H = require('./harness');
const LOADS = +(process.env.LOADS || 3), THR = +(process.env.THR || 4);
const fake = () => { const P = WebGL2RenderingContext.prototype, gE = P.getExtension, gP = P.getProgramParameter;
  P.getExtension = function (n) { return n === 'KHR_parallel_shader_compile' ? { COMPLETION_STATUS_KHR: 0x91B1 } : gE.call(this, n); };
  P.getProgramParameter = function (p, k) { return k === 0x91B1 ? true : gP.call(this, p, k); };
  try { localStorage.setItem('derby-qlevel', '7'); } catch (e) {} };
const throttle = async (page) => { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR }); };
const med = (a) => { const v = a.filter((x) => typeof x === 'number').sort((x, y) => x - y); return v.length ? v[Math.floor((v.length - 1) / 2)] : NaN; };
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const runs = [];
  for (let i = 0; i < LOADS; i++) {
    const last = i === LOADS - 1;
    const { browser, page, errors } = await H.open({ viewport: { width: 800, height: 500 } }, fake, throttle);
    await page.waitForFunction(() => __derby.BOOT.frame && (__derby.BOOT.yard || !('lite' in __derby.BOOT)), null, { timeout: 240000, polling: 250 });
    const b = await page.evaluate(() => { const B = __derby.BOOT; let rec = null;
      for (let i = 0; i < localStorage.length; i++) { const v = localStorage.getItem(localStorage.key(i)) || ''; if (v.includes('"kind":"boot"')) { try { rec = JSON.parse(v); } catch (e) {} } }
      return { ready: Math.round(B.ready), frame: Math.round(B.frame), yard: Math.round(B.yard), p1: B.p1, how: B.loop, yardHow: B.yardHow, q: __derby.QUALITY.level, rec }; });
    console.log(`  load ${i + 1}: script done ${b.ready} ms, first frame ${b.frame} ms (${b.p1} programs), whole yard ${b.yard} ms (${b.yardHow}), quality ${b.q}`);
    runs.push(b);
    if (last) { // the yard is really drawn, then a match starts and is driven
      await page.waitForTimeout(1500);
      const y = await page.evaluate(() => ({ calls: __derby.renderer.info.render.calls, tris: __derby.renderer.info.render.triangles, mask: __derby.camera.layers.mask, progs: __derby.renderer.info.programs.length }));
      ok(y.mask === 1 && y.calls >= 40 && y.tris > 20000, `menu draws the whole yard after boot (${y.calls} draw calls, ${y.tris} triangles, camera layers ${y.mask})`);
      await page.waitForFunction(() => __derby.BOOT.warmMs >= 0, null, { timeout: 120000, polling: 500 }).catch(() => {});
      const p0 = await page.evaluate(() => __derby.renderer.info.programs.length);
      await page.evaluate(() => document.getElementById('btnStart').click());
      await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 240000, polling: 500 });
      const g0 = await page.evaluate(() => __derby.game.time);
      await page.waitForFunction((g0) => __derby.game.time > g0 + 1, g0, { timeout: 120000, polling: 500 }).catch(() => {});
      const d = await page.evaluate((p0) => ({ t: __derby.game.time, calls: __derby.renderer.info.render.calls, progs: __derby.renderer.info.programs.length, after: __derby.renderer.info.programs.length - p0, q: __derby.QUALITY.level }), p0);
      ok(d.t > g0 + 1, `match runs after Start (game time ${g0.toFixed(1)} -> ${d.t.toFixed(1)})`);
      ok(d.calls >= 40, `driving draws the yard (${d.calls} draw calls at quality ${d.q})`);
      ok(d.progs <= 90 && d.after <= 12, `shader programs sane: ${d.progs} in all, ${d.after} compiled between Start and driving`);
      const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, `no page errors ${pe.slice(0, 2).join(' | ')}`);
    }
    await browser.close();
  }
  const r = runs[runs.length - 1].rec;
  ok(runs.every((x) => x.q === 7), `boots at the remembered quality 7 (${runs.map((x) => x.q).join(', ')})`);
  ok(runs.every((x) => x.how === 'async' && x.yardHow === 'async'), `first frame before the yard's parallel compile, yard shown when it is done (${runs.map((x) => x.how + '/' + x.yardHow).join(', ')})`);
  ok(runs.every((x) => x.p1 >= 1 && x.p1 <= 3), `only the sky's programs compiled before the first frame (${runs.map((x) => x.p1).join(', ')}; Build 108: ~90)`);
  ok(r && r.firstFrameMs > 0 && r.yardMs >= r.firstFrameMs && r.firstProgs === runs[runs.length - 1].p1 && r.q === 7, `boot record has first frame, yard and program count ${JSON.stringify(r && { f: r.firstFrameMs, y: r.yardMs, c: r.compileMs, p: r.firstProgs, q: r.q })}`);
  const ff = med(runs.map((x) => x.frame)), after = med(runs.map((x) => x.frame - x.ready)), yard = med(runs.map((x) => x.yard));
  console.log(`  median: first frame ${ff} ms (${after} ms after the script), whole yard ${yard} ms`);
  /* Build 108 on this setup (4x throttle, 3 loads, busy 4-core box): first frame median 30944 ms (26-33 s), 18019 ms of it after the script. The bars sit 40-45% under it (a busy machine adds seconds to both). */
  ok(ff < 18000, `median first frame ${ff} ms < 18000 ms (Build 108: 30944 ms here)`);
  ok(after < 10000, `median first frame ${after} ms after the script < 10000 ms (Build 108: 18019 ms)`);
  console.log(fails.length ? 'FASTBOOT FAIL' : 'FASTBOOT PASS'); process.exit(fails.length ? 1 : 0);
})();
