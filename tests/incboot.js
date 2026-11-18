// Incremental start on a weak laptop: the menu is whole and Start answers a tap almost at once, the yard is built in turns (no long
// frozen task while it loads), it ends up with exactly the props a build in one go makes, and a match started as early as possible runs.
// Stand-in for the Chromebook as in tests/fastboot.js: 4x CPU throttle from before the page opens, KHR_parallel_shader_compile reported,
// remembered quality 7. Two page loads:
//  1. passive: when the car picker appears, the longest main-thread task until the yard is built (props and showroom cars), the props.
//  2. eager: Start is tapped (a real click) as soon as the page has painted; how long until the tap is acknowledged; the match starts,
//     its props are the same ones a synchronous rebuild makes (ids, masses, shapes, positions), and the car drives.
// Fails on main before this change (Build 115 + groundtex, this box, 4x): the picker appeared at 5.7-12.8 s (5-8.7 s after the game
// script started) and the script was one task of 4.6-8.5 s; an early tap waited for the whole script (seconds) to be answered.
const H = require('./harness');
const THR = +(process.env.THR || 4);
const PICK_MS = 6000, PICK_AFTER_SCRIPT_MS = 1500, TASK_CAP_MS = 2500, ACK_MS = 3000;
const init = () => { const P = WebGL2RenderingContext.prototype, gE = P.getExtension, gP = P.getProgramParameter;
  P.getExtension = function (n) { return n === 'KHR_parallel_shader_compile' ? { COMPLETION_STATUS_KHR: 0x91B1 } : gE.call(this, n); };
  P.getProgramParameter = function (p, k) { return k === 0x91B1 ? true : gP.call(this, p, k); };
  try { localStorage.setItem('derby-qlevel', '7'); } catch (e) {}
  window.__lt = []; window.__ev = {};
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) __lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) __ev[e.name] = Math.round(e.startTime); }).observe({ type: 'paint', buffered: true }); } catch (e) {}
  new MutationObserver(() => { const g = document.getElementById('garage'), b = document.getElementById('btnStart'), m = document.getElementById('menu'); // (from the first byte of the page)
    if (g && g.children.length && !__ev.picker) __ev.picker = Math.round(performance.now());
    if (b && !__ev.ack && (b.classList.contains('booting') || (m && m.hidden))) __ev.ack = Math.round(performance.now());
    if (b && !b.__seen) { b.__seen = true; b.addEventListener('click', () => { if (!__ev.click) __ev.click = Math.round(performance.now()); }, true); }
  }).observe(document, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden'] }); };
const throttle = async (page) => { const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR }); };
const propSig = () => __derby.props.map((p) => [p.id, p.body.mass, p.body.shapes.map((s) => s.type).join('+'), p.mesh.geometry ? p.mesh.geometry.type : 'group',
  Math.round(p.body.position.x), Math.round(p.body.position.z)].join(':')).join(' '); // (to the metre: a stack settles a little once physics runs)
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  { // 1. passive load
    const { browser, page, errors } = await H.open({ viewport: { width: 1280, height: 720 } }, init, throttle);
    await page.waitForFunction(() => window.__derby && __derby.BOOT.ready && __ev.picker, null, { timeout: 240000, polling: 250 });
    const r = await page.evaluate(() => { const B = __derby.BOOT, end = Math.max(B.built || 0, B.ready), lt = __lt.filter((x) => x[0] < end);
      return { fcp: __ev['first-contentful-paint'], picker: __ev.picker, t0: Math.round(B.t0), ready: Math.round(B.ready), built: Math.round(B.built || 0), end: Math.round(end), n: lt.length,
        longest: Math.max(0, ...lt.map((x) => x[1])), top: lt.sort((a, b) => b[1] - a[1]).slice(0, 6).map((x) => x[1] + '@' + x[0]).join(' '), props: __derby.props.length, cars: __derby.cars.length, aiN: Math.round(__derby.S.aiCount) }; });
    console.log(`  passive: menu painted ${r.fcp} ms, game script started ${r.t0} ms, car picker ${r.picker} ms, script done ${r.ready} ms, yard built ${r.built || '-'} ms`);
    console.log(`  long tasks to yard built: ${r.n}, longest ${r.longest} ms (${r.top})`);
    ok(r.picker <= PICK_MS, `car picker on screen ${r.picker} ms after page open (budget ${PICK_MS} ms)`);
    ok(r.picker - r.t0 <= PICK_AFTER_SCRIPT_MS, `car picker ${r.picker - r.t0} ms after the game script starts (budget ${PICK_AFTER_SCRIPT_MS} ms)`);
    ok(r.longest <= TASK_CAP_MS, `no main-thread task over ${TASK_CAP_MS} ms until the yard is built (longest ${r.longest} ms)`);
    ok(r.props > 250 && r.cars === 1 + r.aiN, `whole menu yard built: ${r.props} props, ${r.cars} cars`);
    await page.waitForFunction(() => __derby.BOOT.yard, null, { timeout: 240000, polling: 500 });
    const y = await page.evaluate(() => ({ calls: __derby.renderer.info.render.calls, mask: __derby.camera.layers.mask }));
    ok(y.mask === 1 && y.calls >= 40, `the whole yard is drawn behind the menu (${y.calls} draw calls)`);
    const pe = errors.filter((e) => e.startsWith('pageerror') || e.includes('frame error')); ok(!pe.length, `passive: no page errors ${pe.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
  { // 2. eager: tap Start as soon as the page has painted
    let page0 = null, clicked = null;
    const before = async (page) => { page0 = page; await throttle(page); };
    const opening = H.open({ viewport: { width: 1280, height: 720 } }, init, before);
    const tapper = (async () => { while (!page0) await new Promise((r) => setTimeout(r, 50));
      await page0.waitForFunction(() => __ev['first-contentful-paint'] && document.getElementById('btnStart'), null, { timeout: 120000, polling: 100 });
      const bx = await page0.evaluate(() => { const r = document.getElementById('btnStart').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
      clicked = await page0.mouse.click(bx.x, bx.y).then(() => true, (e) => String(e)); })(); // (a real click where the button is, the moment it is painted: no waiting for the page to settle)
    const { browser, page, errors } = await opening; await tapper;
    const st = await page.waitForFunction(() => __derby.game.state === 'playing', null, { timeout: 120000, polling: 250 }).then(() => true, () => false);
    if (!st) { ok(false, 'the early tap started a match'); console.log('INCBOOT FAIL'); await browser.close(); process.exit(1); }
    const r = await page.evaluate((sig) => { const D = __derby, B = D.BOOT; const a = eval(sig)(); D.startMatch(); const b = eval(sig)(); /* (a synchronous rebuild: the props a build in one go makes) */
      return { fcp: __ev['first-contentful-paint'], click: __ev.click,  ack: __ev.ack, ready: Math.round(B.ready), built: Math.round(B.built || 0), started: Math.round(B.click || 0), same: a === b, n: D.props.length, ids: D.props.every((p, i) => p.id === i), diff: a === b ? '' : [a.length, b.length, a.split(' ').find((x, i) => x !== b.split(' ')[i])].join(' / ') }; }, '(' + propSig.toString() + ')');
    console.log(`  eager: menu painted ${r.fcp} ms, Start tapped ${r.click} ms, answered ${r.ack} ms, script done ${r.ready} ms, yard built ${r.built || '-'} ms`);
    ok(clicked === true, `Start could be tapped right after the first paint (${clicked})`);
    ok(r.ack && r.ack - r.fcp <= ACK_MS, `a tap on Start right after the menu paints is answered within ${ACK_MS} ms of that paint (${r.ack - r.fcp} ms)`);
    ok(r.same && r.ids && r.n > 250, `the yard built in turns has the same ${r.n} props (ids, masses, shapes, positions) as a build in one go ${r.diff}`);
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 240000, polling: 500 });
    await page.keyboard.down('KeyW');
    const moved = await page.waitForFunction(() => __derby.player.body.velocity.length() > 2, null, { timeout: 240000, polling: 500 }).then(() => true, () => false);
    await page.keyboard.up('KeyW');
    const d = await page.evaluate(() => ({ t: __derby.game.time, v: __derby.player.body.velocity.length(), cars: __derby.cars.length, calls: __derby.renderer.info.render.calls }));
    ok(moved && d.t > 0.3, `the early match runs and your car drives (game time ${d.t.toFixed(1)} s, ${d.v.toFixed(1)} m/s, ${d.cars} cars, ${d.calls} draw calls)`);
    const pe = errors.filter((e) => e.startsWith('pageerror') || e.includes('frame error')); ok(!pe.length, `eager: no page errors ${pe.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
  console.log(fails.length ? 'INCBOOT FAIL' : 'INCBOOT PASS'); process.exit(fails.length ? 1 : 0);
})();
