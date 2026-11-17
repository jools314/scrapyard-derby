// Portal-style first impression (Build 100): a new player sees the car picker and Start first, not a wall of multiplayer
// options, at laptop, small-laptop, phone and phone-landscape sizes. And startup: the frame loop starts only after the
// menu's shaders are compiled (in parallel where the browser can: KHR_parallel_shader_compile), so the page never sits frozen
// for seconds while the first frame compiles them all. A 'boot' record (script, compile, first-frame ms) goes in the play log.
// Fails on Build 99: Start sits below the multiplayer box (the car picker is off screen at 800x450), and there is no boot record.
const H = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const [w, h] of [[1280, 720], [800, 450], [390, 844], [874, 402]]) {
    const { browser, page, errors } = await H.open({ viewport: { width: w, height: h } });
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => { const R = (id) => document.getElementById(id).getBoundingClientRect(), s = R('btnStart'), g = R('garage'), m = document.getElementById('mpBox');
      const before = !!(document.getElementById('btnStart').compareDocumentPosition(m) & Node.DOCUMENT_POSITION_FOLLOWING);
      const pitch = document.querySelector('#menu .card > p:not(.eyebrow)').textContent.length;
      return { startIn: s.top >= 0 && s.bottom <= innerHeight, garageTop: Math.round(g.top), h: innerHeight, before, pitch }; });
    ok(r.startIn, `${w}x${h}: Start derby fully on screen without scrolling`);
    ok(r.garageTop < r.h * 0.6, `${w}x${h}: car picker starts in the top 60% of the screen (top ${r.garageTop} of ${r.h})`);
    ok(r.before, `${w}x${h}: Start comes before Play with friends`);
    ok(r.pitch <= 120, `${w}x${h}: one-line pitch (${r.pitch} chars)`);
    const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, `${w}x${h}: no page errors ${pe.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
  // startup, twice: this browser has no parallel shader compile (the frame loop starts directly), and then with it faked
  const fake = () => { const P = WebGL2RenderingContext.prototype, gE = P.getExtension, gP = P.getProgramParameter;
    P.getExtension = function (n) { return n === 'KHR_parallel_shader_compile' ? { COMPLETION_STATUS_KHR: 0x91B1 } : gE.call(this, n); };
    P.getProgramParameter = function (p, k) { return k === 0x91B1 ? true : gP.call(this, p, k); }; };
  const progs = {};
  for (const [name, init, want] of [['no parallel compile', null, 'direct'], ['parallel compile', fake, 'async']]) {
    const { browser, page, errors } = await H.open({ viewport: { width: 640, height: 400 } }, init);
    await page.waitForFunction(() => __derby.BOOT.yard, null, { timeout: 90000 }); // (the boot record is written once the whole yard is on screen)
    const b = await page.evaluate(() => { const B = __derby.BOOT; let rec = null; for (let i = 0; i < localStorage.length; i++) { const v = localStorage.getItem(localStorage.key(i)) || ''; if (v.includes('"kind":"boot"')) { try { rec = JSON.parse(v); } catch (e) {} } } return { loop: B.loop, parallel: B.parallel, rec }; });
    ok(b.loop === want, `${name}: frame loop started '${b.loop}' (want '${want}')`);
    ok(b.rec && b.rec.build && b.rec.firstFrameMs > 0 && b.rec.scriptMs > 0 && b.rec.compileMs >= 0, `${name}: boot record in the play log ${JSON.stringify(b.rec && { s: b.rec.scriptMs, c: b.rec.compileMs, f: b.rec.firstFrameMs, p: b.rec.parallel })}`);
    if (want === 'async') await page.waitForFunction(() => __derby.BOOT.warmMs >= 0, null, { timeout: 60000 }); // (the menu-time warm-up has finished)
    const p0 = await page.evaluate(() => (__derby.renderer.info.programs || []).length);
    await page.click('#btnStart'); await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
    const np = await page.evaluate((p0) => (__derby.renderer.info.programs || []).length - p0, p0); progs[want] = np; console.log(`  ${name}: ${np} shader programs compiled between Start and driving`);
    const f0 = await page.evaluate(() => __derby.game.time); // (wait on the game, not the clock: a busy machine draws slowly)
    await page.waitForFunction((f0) => __derby.game.time > f0 + 0.2, f0, { timeout: 90000 }).catch(() => {}); const f1 = await page.evaluate(() => __derby.game.time);
    await page.waitForFunction(() => __derby.BOOT.drive, null, { timeout: 30000 }).catch(() => {});
    ok(f1 > f0, `${name}: match runs after Start (game time ${f0.toFixed(1)} -> ${f1.toFixed(1)})`);
    const st = await page.evaluate(() => { for (let i = 0; i < localStorage.length; i++) { const v = localStorage.getItem(localStorage.key(i)) || ''; if (v.includes('"kind":"start"')) { try { return JSON.parse(v); } catch (e) {} } } return null; });
    ok(st && st.driveMs > st.loadMs && st.menuMs >= 0 && st.startMs > 0, `${name}: time-to-start record (open -> driving ${st && st.driveMs} ms: load ${st && st.loadMs}, menu ${st && st.menuMs}, start ${st && st.startMs})`);
    const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, `${name}: no page errors ${pe.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
  /* (up to ~3 still compile after Start: the opponents' car types are random, and a type that was not in the menu scene needs its own one or two programs - 0, 2 and 3 in three runs of the same build; 40+ without the menu-time compile) */ ok(progs.async < progs.direct && progs.async <= 5, `with parallel compile the effect shaders are ready before Start (${progs.async} compiled after Start vs ${progs.direct} without)`);
  console.log(fails.length ? 'PORTALSTART FAIL' : 'PORTALSTART PASS'); process.exit(fails.length ? 1 : 0);
})();
