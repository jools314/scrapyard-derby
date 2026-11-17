// The memory guard must reload autoplay before the heap gets big enough to crash a Chromebook tab (Build 110). The owner's Chromebook
// autoplay went silent twice: its heap grew ~150 MB a match (99 MB -> 1185 MB over ~23 matches; 179 -> 1303 MB on 16 Nov) and the tab
// crashed at ~1.2-1.3 GB, but the guard's heap trigger was "4x the first match AND over 1.5 GB", so it never fired. Now: over 3x the first
// match and over 700 MB. Replays that pattern with faked heap readings. Fails on Build 109 (no reload at 800 MB).
const { open } = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const auto of [true, false]) {
    const { browser, page, errors } = await open({ viewport: { width: 480, height: 300 } });
    await page.evaluate(() => { __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
    const r = await page.evaluate(async (auto) => { const D = __derby, G = D.MEMGUARD;
      let heap = 100e6; Object.defineProperty(performance, 'memory', { configurable: true, get: () => ({ usedJSHeapSize: heap, totalJSHeapSize: heap, jsHeapSizeLimit: 4e9 }) });
      const reloads = []; D.UPDATE.reload = (u) => reloads.push(u); D.PLAYLOG.upload = async () => true;
      G.check('test baseline'); const steps = [];
      for (const mb of [180, 260, 290]) { heap = mb * 1e6; G.check('test normal match'); steps.push([mb, G.tripped]); } // under 3x: a normal session
      heap = 800e6; D.AUTO.on = auto; if (auto) D.AUTO.nextMatch(); else G.check('test match end');
      await new Promise((r) => setTimeout(r, 500));
      return { steps, tripped: G.tripped, reloads, last: G.last && { base: G.last.base, now: G.last.now } }; }, auto);
    console.log(`  ${auto ? 'autoplay' : 'person playing'}: ` + JSON.stringify(r).slice(0, 300));
    ok(r.steps.every((s) => !s[1]), `${auto ? 'autoplay' : 'person'}: 180-290 MB after a 100 MB first match does not trip the guard`);
    ok(r.tripped, `${auto ? 'autoplay' : 'person'}: 800 MB after a 100 MB first match trips it (well before the ~1.2 GB where the Chromebook tab crashed)`);
    if (auto) ok(r.reloads.length === 1 && /autoplay=1/.test(r.reloads[0]), `autoplay: reloads into autoplay (${r.reloads[0]})`);
    else ok(r.reloads.length === 0, 'person playing: never reloaded');
    const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
    await browser.close();
  }
  console.log(fails.length ? 'HEAPGUARD FAIL' : 'HEAPGUARD PASS'); process.exit(fails.length ? 1 : 0);
})();
