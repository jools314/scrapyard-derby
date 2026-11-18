// Auto quality on a phone (owner's iPhone, Build 114, 2026-11-18): the play log showed q0 and five "8s at 10 fps · waiting on the graphics
// chip" slow moments (sim 0, worst frame ~100 ms) with the governor never stepping down. They were the settings menu: opening it pauses a solo
// match and the frozen picture is redrawn at 10 fps on purpose, and the slow-moment watch counted those paced 100 ms frames as a GPU-bound game.
// The governor was right to ignore them. Checks, with the frame clock driven by the test (rAF timestamps advance a set step per frame):
//  1. iPhone 13 at q0 fed GPU-bound 90 ms frames: drops >= 2 steps within 3 s of game time (the governor still reacts to real slowness);
//  2. then fast frames: it doesn't climb straight back within ~12 s (hysteresis);
//  3. settings open for ~9.5 s (paused, paced to 10 fps): no slow moment is logged and quality doesn't change (fails on Build 114);
//  4. a desktop with fast frames climbs from q3 back to the top (each step waits for ~6 s of headroom).
const { open } = require('./harness');
const { devices } = require('playwright');
const INIT = () => { const nat = window.requestAnimationFrame.bind(window); let virt = 0, last = 0; window.__dt = 0; /* __dt (ms) set: every frame is that long; 0: real time */
  window.requestAnimationFrame = (cb) => nat((t) => { if (!last) { virt = t; last = t; } const d = window.__dt ? window.__dt : t - last; last = t; virt += d; cb(virt); }); };
const start = async (page) => {
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
  await page.evaluate(() => { Object.defineProperty(__derby.TABENV, 'suspect', { get: () => false, configurable: true }); }); /* (the headless test machine itself looks throttled: pin it to 'in front') */
};
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  let pe = [];
  { const { browser, page, errors } = await open(devices['iPhone 13'], INIT); await start(page);
    const a = await page.evaluate(async () => { const D = __derby, out = []; D.applyQuality(0); await new Promise((r) => setTimeout(r, 300));
      window.__dt = 90; const g0 = D.game.time; let at = null;
      while (D.game.time - g0 < 6 && at == null) { await new Promise((r) => setTimeout(r, 25)); if (D.QUALITY.level >= 2) at = D.game.time - g0; } /* (stop feeding slow frames as soon as it has stepped down) */
      const slowQ = D.QUALITY.level; out.push(['slow', slowQ]);
      window.__dt = 1000 / 60; const g1 = D.game.time; let minQ = slowQ;
      while (D.game.time - g1 < 12) { await new Promise((r) => setTimeout(r, 50)); minQ = Math.min(minQ, D.QUALITY.level); }
      return { touch: document.body.classList.contains('touch'), at, slowQ, minQ, fastQ: D.QUALITY.level }; });
    console.log('  iPhone slow/fast: ' + JSON.stringify(a));
    ok(a.touch, 'iPhone 13 runs the touch UI');
    ok(a.at != null && a.at <= 3, `GPU-bound 90 ms frames at q0 drop >= 2 steps within 3 s of game time (q${a.slowQ}, reached q2+ after ${a.at == null ? 'never' : a.at.toFixed(2) + ' s'})`);
    ok(a.minQ >= a.slowQ && a.fastQ >= a.slowQ, `fast frames right after don't bounce it straight back up within 12 s (q${a.slowQ} -> lowest q${a.minQ}, now q${a.fastQ})`);
    const p = await page.evaluate(async () => { const D = __derby; window.__dt = 0; D.applyQuality(0); await new Promise((r) => setTimeout(r, 1500));
      const q0 = D.QUALITY.level, n0 = D.PERFREP.incidents.length; document.getElementById('btnGear').click(); await new Promise((r) => setTimeout(r, 300)); const paused = D.game.paused;
      await new Promise((r) => setTimeout(r, 9500)); const inc = D.PERFREP.incidents.slice(n0).map((x) => `${x.secs}s at ${x.fps} fps (worst ${x.worst} ms, sim ${x.sim}) -> ${x.verdict}`), q1 = D.QUALITY.level;
      document.getElementById('btnGear').click(); await new Promise((r) => setTimeout(r, 500));
      return { paused, q0, q1, inc, resumed: !D.game.paused }; });
    console.log('  settings open: ' + JSON.stringify(p));
    ok(p.paused, `opening settings pauses the match (paused ${p.paused})`);
    ok(!p.inc.length, `no slow moment logged while paused (${p.inc.length ? p.inc.join(' | ') : 'none'})`);
    ok(p.q1 === p.q0 && p.resumed, `quality unchanged while paused (q${p.q0} -> q${p.q1}) and closing resumes`);
    pe = pe.concat(errors.filter((e) => e.startsWith('pageerror'))); await browser.close(); }
  { const { browser, page, errors } = await open({ viewport: { width: 1280, height: 760 } }, INIT); await start(page);
    const d = await page.evaluate(async () => { const D = __derby, steps = []; D.applyQuality(3); await new Promise((r) => setTimeout(r, 300)); window.__dt = 1000 / 60; const g0 = D.game.time; let last = 3;
      while (D.game.time - g0 < 120 && D.QUALITY.level > 0) { await new Promise((r) => setTimeout(r, 100)); if (D.QUALITY.level !== last) { last = D.QUALITY.level; steps.push([+(D.game.time - g0).toFixed(1), last]); } }
      return { touch: document.body.classList.contains('touch'), q: D.QUALITY.level, steps, secs: +(D.game.time - g0).toFixed(1) }; });
    console.log('  desktop fast: ' + JSON.stringify(d));
    ok(!d.touch && d.q === 0, `desktop with fast frames climbs from q3 (below the post-chain line) to the top quality (q${d.q} after ${d.secs} s)`);
    pe = pe.concat(errors.filter((e) => e.startsWith('pageerror'))); await browser.close(); }
  ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'GOVERN FAIL' : 'GOVERN PASS'); process.exit(fails.length ? 1 : 0);
})();
