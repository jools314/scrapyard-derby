// A slow moment that ends as the tab hides or loses focus is the machine going to sleep, not the game (Build 111's Mac regression flag:
// one '8.1s at 10 fps' incident logged the instant the window lost focus and hid). Checks: a slow moment followed within 2 s by focus
// loss is not logged in the play log; one with the tab staying in front still is. Fails on Build 113 (logged at once).
const { open } = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 800, height: 450 } }, () => { window.__focus = true; Document.prototype.hasFocus = function () { return window.__focus; }; });
  await page.evaluate(() => { __derby.S.aiCount = 2; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0 && __derby.PLAYLOG.m, null, { timeout: 120000 });
  const fake = (tag) => ({ before: [tag], at: Date.now(), secs: 8.1, fps: 10, frame: 100, worst: 150, sim: 1, draw: 1, wait: 1, parts: 0, verdict: 'test', q: 0, res: '1', calls: 1 });
  const r = await page.evaluate(async (a) => { const D = __derby, n0 = D.PLAYLOG.m.inc.length; /* (tagged by 'before', so a real slow moment on a slow test machine can't confuse the count) */
    Object.defineProperty(D.TABENV, 'suspect', { get: () => false, configurable: true }); /* (the headless test machine itself looks throttled: pin it to 'in front') */ window.__focus = true;
    D.PERFREP.incidents.push(a[0]); window.__focus = false; window.dispatchEvent(new Event('blur')); /* the window loses focus right after */
    await new Promise((r) => setTimeout(r, 2600)); const has = (t) => D.PLAYLOG.m.inc.some((i) => i.before === t), n1 = has('sleep');
    window.__focus = true; window.dispatchEvent(new Event('focus')); await new Promise((r) => setTimeout(r, 300));
    D.PERFREP.incidents.push(a[1]); await new Promise((r) => setTimeout(r, 2600)); const n2 = has('real');
    return { n0, n1, n2 }; }, [fake('sleep'), fake('real')]);
  console.log('  ' + JSON.stringify(r));
  ok(!r.n1, `a slow moment followed by focus loss is not logged as a game problem (logged: ${r.n1})`);
  ok(r.n2, `a slow moment with the tab in front is still logged (logged: ${r.n2})`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'SLOWHIDE FAIL' : 'SLOWHIDE PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
