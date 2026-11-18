// Startup profile (a measuring tool, not a pass/fail test; not in run.sh).
// Opens the game at a CPU throttle (THR, default 4) with the Chromebook stand-in of tests/fastboot.js (parallel shader compile reported,
// remembered quality 7), records a CPU profile with the DevTools protocol, long tasks, paints and the BOOT timings, and prints:
//  - the timeline: page open -> menu painted -> cars in the picker -> Start handler -> script done -> first frame -> whole yard -> Start -> driving
//  - the main-thread time by phase (inclusive time of the game's own functions, and self time per script)
// EAGER=1 clicks Start as soon as it is on screen (every 250 ms until a match starts) instead of waiting for the whole yard.
// GAME=path profiles another copy of the page (e.g. one with window.__marks timing marks added at top-level lines).
const H = require('./harness');
const PROF = process.env.PROF !== '0', THR = +(process.env.THR || 4), EAGER = !!process.env.EAGER, TOP = +(process.env.TOP || 45);
const init = () => { const P = WebGL2RenderingContext.prototype, gE = P.getExtension, gP = P.getProgramParameter;
  if (!window.__noFake) { P.getExtension = function (n) { return n === 'KHR_parallel_shader_compile' ? { COMPLETION_STATUS_KHR: 0x91B1 } : gE.call(this, n); };
    P.getProgramParameter = function (p, k) { return k === 0x91B1 ? true : gP.call(this, p, k); }; }
  try { localStorage.setItem('derby-qlevel', '7'); } catch (e) {}
  window.__lt = []; window.__ev = {};
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) __lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) __ev[e.name] = Math.round(e.startTime); }).observe({ type: 'paint', buffered: true }); } catch (e) {}
  const poll = () => { const g = document.getElementById('garage'); if (g && g.children.length && !__ev.garage) __ev.garage = Math.round(performance.now());
    const m = document.getElementById('menu'); if (m && !__ev.menuDom) __ev.menuDom = Math.round(performance.now()); if (!__ev.garage) requestAnimationFrame(poll); };
  requestAnimationFrame(poll); };
(async () => {
  let cdp;
  const before = async (page) => { cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: THR });
    if (PROF) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Profiler.start'); } };
  const t0 = Date.now();
  let clicker = null, page0 = null;
  const { browser, page, errors } = await H.open({ viewport: { width: 1280, height: 720 } }, init, async (page) => { page0 = page; await before(page);
    if (EAGER) clicker = setInterval(() => { page.evaluate(() => { const b = document.getElementById('btnStart'); if (b && (!window.__derby || __derby.game.state === 'menu')) { if (!__ev.click1) __ev.click1 = Math.round(performance.now()); b.click(); } }).catch(() => {}); }, 250); });
  if (!EAGER) { await page.waitForFunction(() => __derby.BOOT.frame && __derby.BOOT.yard, null, { timeout: 300000, polling: 250 }); await page.waitForTimeout(1000);
    await page.evaluate(() => { __ev.click1 = Math.round(performance.now()); document.getElementById('btnStart').click(); __ev.raf = 0; const f = () => { __ev.raf++; if (!__derby.BOOT.drive) requestAnimationFrame(f); }; requestAnimationFrame(f); }); }
  await page.waitForFunction(() => __derby.BOOT.drive, null, { timeout: 300000, polling: 250 });
  if (clicker) clearInterval(clicker);
  await page.waitForTimeout(2000);
  const { profile } = PROF ? await cdp.send('Profiler.stop') : { profile: null };
  const r = await page.evaluate(() => { const B = __derby.BOOT; const R = (x) => (x ? Math.round(x) : x);
    return { B: { t0: R(B.t0), ready: R(B.ready), f1: R(B.f1), frame: R(B.frame), compiled: R(B.compiled), built: R(B.built), yard: R(B.yard), click: R(B.click), drive: R(B.drive), warm: B.warmMs, p1: B.p1, how: B.loop, yardHow: B.yardHow },
      ev: __ev, lt: __lt, marks: (window.__marks || []).map(([l, t]) => [l, Math.round(t)]), progs: __derby.renderer.info.programs.length, calls: __derby.renderer.info.render.calls,
      props: (__derby.props || []).length, bq: window.__bootq ? { slices: __bootq.slices, longest: __bootq.longest, stepMax: __bootq.stepMax } : null }; });
  console.log(`THR ${THR}x ${EAGER ? 'EAGER start' : 'start after whole yard'}  (wall ${Math.round((Date.now() - t0) / 1000)} s)`);
  const B = r.B, ev = r.ev;
  console.log('timeline (ms since page open):');
  for (const [k, v] of [['first paint', ev['first-paint']], ['first contentful paint (menu)', ev['first-contentful-paint']], ['module script starts', B.t0], ['cars in the picker', ev.garage],
    ['script done', B.ready], ['yard built (props, cars)', B.built], ['first frame (sky)', B.frame], ['yard compiled', B.compiled], ['whole yard on screen', B.yard], ['first Start click', ev.click1], ['Start handled', B.click], ['driving', B.drive]]) console.log(`  ${k.padEnd(32)} ${v}`);
  const lb = r.lt.filter((x) => x[0] <= (B.built || B.ready));
  console.log(`long tasks to yard built: ${lb.length}, total ${lb.reduce((a, x) => a + x[1], 0)} ms, longest ${Math.max(0, ...lb.map((x) => x[1]))} ms` + (r.bq ? ` (boot slices ${r.bq.slices}, longest slice ${r.bq.longest} ms, longest step ${r.bq.stepMax} ms)` : ''));
  const lt = r.lt.filter((x) => x[0] <= (B.drive || 1e9));
  console.log(`long tasks to driving: ${lt.length}, total ${lt.reduce((a, x) => a + x[1], 0)} ms, longest ${Math.max(0, ...lt.map((x) => x[1]))} ms`);
  console.log('  ' + lt.sort((a, b) => b[1] - a[1]).slice(0, 12).map((x) => `${x[1]}@${x[0]}`).join('  '));
  if (r.marks.length && process.env.MARKS) console.log('MARKS ' + JSON.stringify(r.marks));
  if (r.marks.length && !process.env.MARKS) { console.log('top-level script marks (ms from previous mark):'); for (let i = 1; i < r.marks.length; i++) { const d = r.marks[i][1] - r.marks[i - 1][1]; if (d >= 15) console.log(`  ${r.marks[i - 1][0]} -> ${r.marks[i][0]}: ${d}`); }
    console.log(`  last mark ${r.marks[r.marks.length - 1][0]} at ${r.marks[r.marks.length - 1][1]}`); }
  if (PROF) {
  // CPU profile: self time per script, inclusive time per game function
  const nodes = new Map(); for (const n of profile.nodes) nodes.set(n.id, n);
  const parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const self = new Map(), incl = new Map(), urls = new Map();
  const dts = profile.timeDeltas; let total = 0;
  for (let i = 0; i < profile.samples.length; i++) { const dt = (dts[i + 1] || 0) / 1000 / THR; /* (ms of unthrottled CPU) */ total += dt;
    const leaf = nodes.get(profile.samples[i]); const cf = leaf.callFrame;
    const u = cf.url ? cf.url.replace(/^.*\//, '') || 'game page' : cf.functionName || '(native)'; urls.set(u, (urls.get(u) || 0) + dt);
    const seen = new Set(); let id = leaf.id;
    while (id != null) { const n = nodes.get(id), f = n.callFrame; if (f.url && f.url.includes('game.local')) { const k = (f.functionName || '(top level)') + ':' + (f.lineNumber + 1); if (!seen.has(k)) { seen.add(k); incl.set(k, (incl.get(k) || 0) + dt); } } id = parent.get(id); } }
  const ms = (x) => (x * THR).toFixed(0);
  // align the profile clock with performance.now(): the first sample inside the game's top-level script is BOOT.t0
  { let t = profile.startTime, off = null; const tt = [];
    for (let i = 0; i < profile.samples.length; i++) { t += dts[i]; tt.push(t / 1000); if (off == null) { const f = nodes.get(profile.samples[i]).callFrame; let id = profile.samples[i], top = false;
      while (id != null) { const c = nodes.get(id).callFrame; if (c.url.includes('game.local') && c.functionName === '' && c.lineNumber > 700) { top = true; break; } id = parent.get(id); } if (top) off = t / 1000 - B.t0; } }
    const win = (a, b) => { const inc = new Map(), su = new Map(); let n = 0;
      for (let i = 0; i < profile.samples.length; i++) { const tp = tt[i] - off; if (tp < a || tp >= b) continue; const dt = (dts[i + 1] || 0) / 1000 / THR; const leaf = nodes.get(profile.samples[i]);
        let u = leaf.callFrame.url ? leaf.callFrame.url.replace(/^.*\//, '') || 'game' : leaf.callFrame.functionName || '(native)'; if (u === '(idle)') continue; if (process.env.FN) u += '.' + leaf.callFrame.functionName; n += dt; su.set(u, (su.get(u) || 0) + dt);
        const seen = new Set(); let id = leaf.id; while (id != null) { const f = nodes.get(id).callFrame; if (f.url && f.url.includes('game.local')) { const k = (f.functionName || '(top)') + ':' + (f.lineNumber + 1); if (!seen.has(k)) { seen.add(k); inc.set(k, (inc.get(k) || 0) + dt); } } id = parent.get(id); } }
      return `busy ${ms(n)} | self: ${[...su].sort((x, y) => y[1] - x[1]).slice(0, process.env.FN ? 8 : 4).map(([k, v]) => k + ' ' + ms(v)).join(', ')} | game: ${[...inc].sort((x, y) => y[1] - x[1]).slice(0, 9).map(([k, v]) => k + ' ' + ms(v)).join(', ')}`; };
    if (off != null) { console.log('windows:');
      for (const [k, a, b] of [['open -> script', 0, B.t0], ['script', B.t0, B.ready], ['script -> first frame', B.ready, B.frame], ['first frame -> yard', B.frame, B.yard], ['Start -> driving', B.click, B.drive]]) if (a != null && b != null) console.log(`  ${k} (${Math.round(b - a)} ms): ${win(a, b)}`);
      console.log('longest tasks:'); for (const [s0, d] of lt.slice(0, 10)) console.log(`  ${d} ms at ${s0}: ${win(s0, s0 + d)}`); } }
  console.log(`CPU profile: ${ms(total)} ms of samples at ${THR}x (shown as throttled ms)`);
  console.log('self time by script:'); for (const [u, v] of [...urls].sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`  ${u.padEnd(30)} ${ms(v)}`);
  console.log('inclusive time by game function (name:line):'); for (const [k, v] of [...incl].sort((a, b) => b[1] - a[1]).slice(0, TOP)) console.log(`  ${k.padEnd(40)} ${ms(v)}`);
  }
  console.log(`frames from Start to driving: ${ev.raf}`);
  console.log(`programs ${r.progs}, draw calls ${r.calls}`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); if (pe.length) console.log('page errors: ' + pe.slice(0, 3).join(' | '));
  await browser.close();
})();
