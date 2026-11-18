// Self-heal (Build 119): an unattended autoplay machine must recover by itself, all night, and a person playing is never reloaded.
// The Chromebook sat dead for hours twice: on Build 105 the tab crashed (JS heap leak), and on Build 114 it went silent after
// 1 h 50 min with its JS heap flat and GPU geometries +180/h (far under the guard's +1500). And the old guard allowed only
// 3 memory reloads per tab session (sessionStorage survives reloads), so an overnight run could use them up for good.
// Checks, with a fake clock (HEAL.now) and a stubbed reload (UPDATE.reload):
//  1. the memory guard still reloads after 3 earlier reloads in this tab: rate-limited (20 min apart, the count decays after a
//     healthy hour), not exhausted; asked again at the next match end once the gap has passed;
//  2. a planned fresh start after 90 min of autoplay, at a match boundary only;
//  3. steady growth (geometries +180/h, the Build 114 Chromebook) trips the guard; flat noise and a one-time step don't;
//  4. a lost WebGL context (WEBGL_lose_context): autoplay reloads at once; a person gets a toast, the context back, and if it
//     doesn't come back within 5 s, the reload banner (never an automatic reload);
//  5. the stall watchdog: no frame for a while with timers still running reloads autoplay (only with the screen wake lock held);
//  6. the launcher (autoplay.html): the game runs in its own process (an out-of-process frame, with Chrome's site isolation, as on
//     a Chromebook or Mac), its storage is kept by the launcher, and when the game's process is crashed (CDP Page.crash) or hangs,
//     the launcher starts a new game, which logs why; a frame a person has taken over is never restarted for a stall.
// Fails on Build 118: no rate limit (3 per tab), no planned refresh, no growth trigger, no context-loss or stall reload, no launcher.
const fs = require('fs'), path = require('path'), { chromium } = require('playwright'), { open } = require('./harness');
const ROOT = path.join(__dirname, '..'), GAME = process.env.GAME || path.join(ROOT, 'index.html'), NM = path.join(__dirname, 'node_modules');
const fails = []; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d !== undefined ? ' ' + JSON.stringify(d).slice(0, 500) : '')); if (!c) fails.push(m); };
const startMatch = async (page) => { await page.evaluate(() => { __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 }); };
// a page with stubbed reloads/uploads and a fake clock; returns nothing, state lives in window.__t
const rig = (page) => page.evaluate(() => { const D = __derby; window.__t = { reloads: [], clock: Date.now() };
  D.UPDATE.reload = (u) => window.__t.reloads.push(u); D.PLAYLOG.upload = async () => true;
  if (D.HEAL) D.HEAL.now = () => window.__t.clock; });
(async () => {
  const ONLY = process.env.ONLY || ''; // (ONLY=6 runs one part, while working on it)
  // ---------- 1-3 and 5: memory guard, planned refresh, steady growth, stall watchdog (one page) ----------
  if (!ONLY || ONLY.includes('1')) { const { browser, page, errors } = await open({ viewport: { width: 480, height: 300 } });
    await startMatch(page); await rig(page);
    const has = await page.evaluate(() => !!__derby.HEAL); ok(has, 'HEAL (self-heal) exists');
    // 1. rate limit, not a cap
    let r = await page.evaluate(async () => { const D = __derby, G = D.MEMGUARD, H = D.HEAL, T = window.__t, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let heap = 100e6; Object.defineProperty(performance, 'memory', { configurable: true, get: () => ({ usedJSHeapSize: heap, totalJSHeapSize: heap, jsHeapSizeLimit: 4e9 }) });
      sessionStorage.setItem('derby-mem-reloads', '3'); /* Build 118's counter: 3 reloads already in this tab */
      localStorage.setItem('derby-heal', JSON.stringify({ n: 3, last: T.clock - 25 * 60000, why: 'memory' })); /* and 3 here, the last 25 min ago */
      G.check('test baseline'); heap = 800e6; D.AUTO.on = true; D.AUTO.nextMatch(); await sleep(400); const first = T.reloads.slice();
      const out = { first, rec: H && H.last && { why: H.last.why, action: H.last.action, n: H.last.n, mem: H.last.mem } };
      if (!H) return out;
      /* a reload 5 min ago: not yet (logged once as rate-limited), asked again at the next match end, which is after the 20 min gap */
      H.going = false; T.reloads.length = 0; localStorage.setItem('derby-heal', JSON.stringify({ n: 4, last: T.clock - 5 * 60000 }));
      D.AUTO.nextMatch(); await sleep(400); out.soon = T.reloads.length; out.limited = H.last && H.last.action; out.waitS = H.last && H.last.waitS;
      T.clock += 16 * 60000; D.AUTO.nextMatch(); await sleep(400); out.later = T.reloads.slice();
      /* after 6 in a row they are 30 min apart; a healthy hour starts the count again */
      localStorage.setItem('derby-heal', JSON.stringify({ n: 7, last: T.clock - 25 * 60000 })); out.backoff = H.allow('memory');
      localStorage.setItem('derby-heal', JSON.stringify({ n: 7, last: T.clock - 61 * 60000 })); out.decayed = H.allow('memory');
      /* a person: never */
      H.going = false; T.reloads.length = 0; localStorage.removeItem('derby-heal'); D.AUTO.on = false; G.check('test match end'); await sleep(300); out.person = T.reloads.length;
      heap = 100e6; return out; });
    console.log('  1: ' + JSON.stringify(r).slice(0, 600));
    ok(r.first.length === 1 && /autoplay=1/.test(r.first[0]) && /mem=4/.test(r.first[0]), '1: after 3 earlier memory reloads in this tab the guard still reloads autoplay (the 4th)', r.first);
    ok(r.rec && r.rec.why === 'memory' && r.rec.action === 'reload' && r.rec.mem && r.rec.mem.heapMB === 800, "1: logged as a 'heal' record: why memory, action reload, memory at the time", r.rec);
    ok(r.soon === 0 && r.limited === 'rate-limited' && r.waitS > 800, '1: 5 min after a reload it waits (rate-limited, logged)', { soon: r.soon, limited: r.limited, waitS: r.waitS });
    ok(r.later && r.later.length === 1 && /mem=5/.test(r.later[0]), '1: the next match end after the 20 min gap reloads', r.later);
    ok(r.backoff && !r.backoff.ok && r.decayed && r.decayed.ok && r.decayed.n === 0, '1: 30 min apart after 6 in a row; the count starts again after a healthy hour', { backoff: r.backoff, decayed: r.decayed });
    ok(r.person === 0, '1: a person playing: never reloaded');
    // 2. planned fresh start after 90 min, only at a match boundary
    r = await page.evaluate(async () => { const D = __derby, G = D.MEMGUARD, H = D.HEAL, T = window.__t, sleep = (ms) => new Promise((r) => setTimeout(r, ms)); if (!H) return null;
      H.going = false; H.said = {}; T.reloads.length = 0; localStorage.removeItem('derby-heal'); G.tripped = false; G.base = null; G.hist = []; G.n = 0; T.clock = Date.now(); H.t0 = T.clock - 91 * 60000;
      D.AUTO.on = false; G.check('test person match end'); const person = T.reloads.length + (H.refresh() ? 1 : 0); /* a person, 91 min in: never */
      D.AUTO.on = true; await sleep(3000); const mid = T.reloads.length; /* mid-match: nothing */
      D.AUTO.nextMatch(); await sleep(400); return { person, mid, at: T.reloads.slice(), rec: H.last && { why: H.last.why, action: H.last.action, upS: H.last.upS, detail: H.last.detail } }; });
    console.log('  2: ' + JSON.stringify(r));
    ok(r && r.person === 0 && r.mid === 0, '2: no planned refresh under a person, and none in the middle of a match', r);
    ok(r && r.at.length === 1 && /autoplay=1/.test(r.at[0]) && /heal=refresh/.test(r.at[0]) && r.rec.why === 'refresh' && r.rec.action === 'reload' && r.rec.upS >= 5400, '2: after 90 min of autoplay the match boundary reloads into autoplay, logged as a planned refresh', r && { at: r.at, rec: r.rec });
    // 3. steady growth: the Build 114 Chromebook (+9 geometries a 3-min match = +180/h) trips it; flat noise and one step don't
    r = await page.evaluate(async () => { const D = __derby, G = D.MEMGUARD, H = D.HEAL, T = window.__t, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const real = G.stats.bind(G); let add = 0; G.stats = () => { const s = real(); s.g += add; return s; };
      const run = async (seq, auto) => { if (H) { H.going = false; H.said = {}; H.t0 = T.clock; } G.tripped = false; G.base = null; G.hist = []; G.n = 0; T.reloads.length = 0; localStorage.removeItem('derby-heal'); D.AUTO.on = auto;
        let at = -1; for (let i = 0; i < seq.length; i++) { add = seq[i]; T.clock += 3 * 60000; G.check('test match end'); if (at < 0 && G.tripped) at = i; } await sleep(300);
        return { at, mins: at * 3, reloads: T.reloads.slice(), why: G.last && G.last.trend, heal: H && H.last && H.last.detail }; };
      const noise = [0, 14, -9, 22, 60, 71, 48, 66, 52, 75, 58, 63, 49, 70, 61, 55, 67, 50, 72, 59, 64]; /* a first-time step of +60, then flat with +-12 */
      const flat = await run(noise, true);
      const climb = await run(Array.from({ length: 40 }, (_, i) => i * 9 + ((i * 7) % 5) * 6 - 12), true); /* +9 a match with noise */
      const person = await run(Array.from({ length: 40 }, (_, i) => i * 9), false);
      G.stats = real; return { flat, climb, person }; });
    console.log('  3: ' + JSON.stringify(r).slice(0, 700));
    ok(r.flat.at < 0 && r.flat.reloads.length === 0, '3: flat memory with noise and a one-time step: no trip', r.flat);
    ok(r.climb.at > 0 && r.climb.mins <= 75 && r.climb.reloads.length === 1 && /mem=1/.test(r.climb.reloads[0]) && /steadily/.test(r.climb.heal || ''), `3: geometries +180/h trip the guard after ${r.climb.mins} min (the absolute +1500 would take 8 h), autoplay reloads`, r.climb);
    ok(r.person.at > 0 && r.person.reloads.length === 0, '3: the same growth under a person: logged, never reloaded', r.person);
    // 5. stall watchdog
    r = await page.evaluate(async () => { const D = __derby, H = D.HEAL, T = window.__t, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      if (H) { H.going = false; H.said = {}; H.stallMs = 3000; H.t0 = T.clock = Date.now(); } T.reloads.length = 0; localStorage.removeItem('derby-heal');
      const raf0 = window.requestAnimationFrame; let held = null; window.requestAnimationFrame = (cb) => { held = cb; return 0; }; /* the frame loop stops; timers keep running */
      D.AUTO.on = false; await sleep(7000); const person = T.reloads.length;
      D.AUTO.on = true; D.AUTO.wl = null; await sleep(4500); const noLock = T.reloads.length, seen = H && H.last && H.last.action;
      D.AUTO.wl = { released: false, release: async () => {} }; await sleep(4500); const at = T.reloads.slice(), rec = H && H.last && { why: H.last.why, action: H.last.action, detail: H.last.detail };
      D.AUTO.on = false; D.AUTO.wl = null; window.requestAnimationFrame = raf0; if (held) raf0(held); await sleep(500);
      return { person, noLock, seen, at, rec }; });
    console.log('  5: ' + JSON.stringify(r));
    ok(r.person === 0, '5: frames stopped under a person: never reloaded');
    ok(r.noLock === 0 && r.seen === 'seen', '5: autoplay without the screen wake lock (the screen may be asleep): logged, not reloaded', r);
    ok(r.at.length === 1 && /autoplay=1/.test(r.at[0]) && /heal=stall/.test(r.at[0]) && r.rec && r.rec.why === 'stall' && /no frame for \d+ s/.test(r.rec.detail), '5: autoplay with no frame while visible and timers running: reloads, logged as a stall', r);
    const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, '1-5: no page errors ' + pe.slice(0, 2).join(' | '));
    await browser.close(); }
  // ---------- 4: lost WebGL context ----------
  if (!ONLY || ONLY.includes('4')) for (const auto of [true, false]) {
    const { browser, page, errors } = await open({ viewport: { width: 480, height: 300 } });
    await startMatch(page); await rig(page);
    const r = await page.evaluate(async (auto) => { const D = __derby, H = D.HEAL, T = window.__t, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const ext = D.renderer.getContext().getExtension('WEBGL_lose_context'); if (!ext) return { noExt: true };
      const toasts = () => [...document.querySelectorAll('#toasts .toast')].map((x) => x.textContent).join(' | '); const seenT = new Set(); const watch = setInterval(() => { for (const x of document.querySelectorAll('#toasts .toast')) seenT.add(x.textContent); }, 100);
      D.AUTO.on = auto; ext.loseContext(); await sleep(1500);
      const out = { after: T.reloads.slice(), rec: H && H.last && { why: H.last.why, action: H.last.action, detail: H.last.detail } };
      if (!auto) { ext.restoreContext(); await sleep(1500); out.restored = H && H.last && H.last.action; await sleep(5000); out.bannerAfterRestore = !!document.getElementById('updBanner');
        ext.loseContext(); await sleep(6500); const b = document.getElementById('updBanner'); out.banner = b ? b.textContent : null; out.reloadsBeforeTap = T.reloads.length; if (b) b.click(); out.afterTap = T.reloads.slice(); }
      clearInterval(watch); out.toasts = [...seenT]; return out; }, auto);
    console.log(`  4 ${auto ? 'autoplay' : 'person'}: ` + JSON.stringify(r));
    if (r.noExt) { ok(false, '4: WEBGL_lose_context available'); await browser.close(); continue; }
    if (auto) ok(r.after.length === 1 && /autoplay=1/.test(r.after[0]) && /heal=gpu/.test(r.after[0]) && r.rec && r.rec.why === 'gpu' && r.rec.action === 'reload', '4 autoplay: a lost GPU context reloads autoplay at once, logged', r);
    else { ok(r.after.length === 0 && r.toasts.some((t) => /GRAPHICS HICCUP/.test(t)), '4 person: no reload, a short toast', r.toasts);
      ok(r.restored === 'restored' && r.toasts.some((t) => /GRAPHICS BACK/.test(t)) && !r.bannerAfterRestore, '4 person: the context comes back (logged), no banner', r);
      ok(/graphics stopped/i.test(r.banner || '') && r.reloadsBeforeTap === 0 && r.afterTap.length === 1, '4 person: not back within 5 s -> the reload banner; it reloads only when tapped', r); }
    const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, `4 ${auto ? 'autoplay' : 'person'}: no page errors ` + pe.slice(0, 2).join(' | '));
    await browser.close();
  }
  // ---------- 6: the launcher ----------
  if (!ONLY || ONLY.includes('6')) { const lpath = path.join(ROOT, 'autoplay.html'); ok(fs.existsSync(lpath), '6: autoplay.html (the launcher) exists');
    if (fs.existsSync(lpath)) {
      // --site-per-process: Playwright turns site isolation off by default; Chrome on a Chromebook or a Mac has it on
      const browser = await chromium.launch({ args: ['--site-per-process', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
      const page = await browser.newPage({ viewport: { width: 480, height: 300 } }); const errors = [];
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|ERR_ABORTED/.test(m.text())) errors.push(m.text()); });
      await page.addInitScript(() => { window.__lnFast = 6; window.__noDrop = true; }); // (the launcher's waits 6x faster: 120 s without a heartbeat -> 20 s)
      const cors = { 'Access-Control-Allow-Origin': '*' }; // (the game frame has an opaque origin: its scripts and fetches are cross-origin, as GitHub Pages and the CDN allow)
      const route0 = (r) => { const u = r.request().url();
        if (u.includes('three@0.160.0/build/three.module.js')) return r.fulfill({ headers: cors, contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.module.js') });
        if (u.includes('three@0.160.0/examples/jsm/')) return r.fulfill({ headers: cors, contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/examples/jsm/' + u.split('/examples/jsm/')[1]) });
        if (u.includes('cannon-es@0.20.0/dist/cannon-es.js')) return r.fulfill({ headers: cors, contentType: 'application/javascript', body: fs.readFileSync(NM + '/cannon-es/dist/cannon-es.js') });
        if (u.startsWith('http://game.local/autoplay.html')) return r.fulfill({ contentType: 'text/html', body: fs.readFileSync(lpath, 'utf8') });
        if (u.startsWith('http://game.local/index.html')) return r.fulfill({ contentType: 'text/html', body: fs.readFileSync(GAME, 'utf8') });
        return r.abort(); }; await page.route('**/*', route0);
      // Playwright marks the whole page crashed once any of its frames' processes crashes, so everything here goes through a
      // browser-level CDP session instead: Runtime.evaluate in the launcher's target or in the current game frame's target
      const B = await browser.newBrowserCDPSession(); let mid = 1; const wait = new Map();
      B.on('Target.receivedMessageFromTarget', (e) => { let m = null; try { m = JSON.parse(e.message); } catch (x) {} if (m && m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
      const sess = new Map(); const target = async (game) => { const { targetInfos } = await B.send('Target.getTargets'); return targetInfos.filter((t) => game ? t.type === 'iframe' && /index\.html/.test(t.url) : t.type === 'page' && /autoplay\.html/.test(t.url)).pop(); };
      const send = async (game, method, params, ms) => { const t = await target(game); if (!t) return null; let sid = sess.get(t.targetId); if (!sid) { sid = (await B.send('Target.attachToTarget', { targetId: t.targetId, flatten: false })).sessionId; sess.set(t.targetId, sid); }
        const id = mid++, p = new Promise((r) => wait.set(id, r)); await B.send('Target.sendMessageToTarget', { sessionId: sid, message: JSON.stringify({ id, method, params: params || {} }) }).catch(() => {});
        return ms === 0 ? null : Promise.race([p, new Promise((r) => setTimeout(() => r(null), ms || 10000))]); };
      const ev = async (game, expr, ms) => { const m = await send(game, 'Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, ms); return m && m.result && m.result.result ? m.result.result.value : null; };
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const L = () => ev(false, '({ made: __ln.made, beats: __ln.beats, last: __ln.last, log: __ln.log.slice(-6) })');
      const until = async (fn, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await fn().catch(() => null); if (v) return v; await sleep(500); } return null; };
      // the launcher's storage: the play-log records the game wrote (through the bridge)
      const recs = (kind) => ev(false, `(() => { const out = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!/^derby-pl-\\d+$/.test(k)) continue; for (const line of String(localStorage.getItem(k)).split('\\n')) { try { const r = JSON.parse(line); if (r && r.kind === '${kind}') out.push(r); } catch (e) {} } } return out; })()`);
      await page.goto('http://game.local/autoplay.html');
      let s = await until(async () => { const x = await L(); return x && x.last && x.last.auto && x.last.booted && x.beats >= 2 ? x : null; }, 180000);
      ok(!!s, '6: the game runs in the launcher frame, autoplaying, and sends heartbeats', s || await L());
      const tg = await target(true); ok(!!tg, '6: the game frame has a process of its own (an out-of-process frame: sandboxed, opaque origin)', tg && { type: tg.type, url: tg.url });
      const iso = await until(() => ev(false, '__ln.iso || null'), 30000);
      const isoRec = await until(async () => { const r = await recs('heal'); return r && r.find((x) => x.action === 'isolation'); }, 30000);
      ok(iso && iso.own === true && isoRec && isoRec.own === true, "6: the launcher's own check agrees (its timer kept running while the game busy-waited 300 ms), and the game logs it as a heal 'isolation' record", { iso, rec: isoRec && isoRec.detail });
      const st = await ev(false, "Object.keys(localStorage).filter((k) => k.startsWith('derby-'))");
      ok(st && st.some((k) => k.startsWith('derby-pl-life-')) && st.some((k) => /^derby-pl-\d+$/.test(k)), "6: the game's storage (play log, stop log) is kept by the launcher", st);
      // crash the game's process
      const sid1 = s && s.last.sid, t0 = Date.now(); await send(true, 'Page.crash', {}, 0);
      s = await until(async () => { const x = await L(); return x && x.made >= 2 && x.last && x.last.booted ? x : null; }, 180000);
      ok(!!s, `6: after the game's process crashed, the launcher started a new game (${Math.round((Date.now() - t0) / 1000)} s, at 6x speed)`, s || await L());
      let h = await until(async () => { const r = await recs('heal'); return r && r.find((x) => x.why === 'frame dead') ? r : null; }, 60000);
      const hd = h && h.find((x) => x.why === 'frame dead');
      ok(hd && hd.action === 'new frame' && hd.by === 'launcher' && /no heartbeat/.test(hd.detail) && hd.mem && hd.mem.g > 0, "6: the new game logs it in the play log as a 'heal' record (why, uptime, memory from the last heartbeat)", hd);
      const le = await until(async () => { const r = await recs('lifeEnd'); return r && r.find((x) => x.sid === sid1) ? r : null; }, 30000);
      const l1 = le && le.find((x) => x.sid === sid1); ok(l1 && l1.how === 'vanished', '6: and the stop log says the crashed page vanished', l1 && l1.line);
      // hang the game's main thread: the launcher, in another process, still runs and replaces it
      const t1 = Date.now(); await send(true, 'Runtime.evaluate', { expression: 'for (;;) {}' }, 0);
      s = await until(async () => { const x = await L(); return x && x.made >= 3 && x.last && x.last.booted ? x : null; }, 180000);
      ok(!!s, `6: a hung game (busy loop) is replaced too (${Math.round((Date.now() - t1) / 1000)} s, at 6x speed)`, s || await L());
      // the game's own reload (a planned refresh) goes through the launcher: a new frame, so a new process
      await until(() => ev(true, '!!(window.__derby && __derby.HEAL && __derby.AUTO.on)'), 60000);
      const m0 = (await L()).made; await ev(true, 'const D = __derby; D.PLAYLOG.upload = async () => true; D.HEAL.t0 = Date.now() - 91 * 60000; D.AUTO.nextMatch(); 1');
      s = await until(async () => { const x = await L(); return x && x.made > m0 ? x : null; }, 30000);
      ok(!!s && /the game asked: \?autoplay=1&heal=refresh/.test(s.log.join(' ')), "6: the game's planned refresh asks the launcher, which starts a new frame", s);
      // a person took over: frames stop, heartbeats go on: the launcher leaves it alone
      await until(async () => { const x = await L(); return x && x.last && x.last.booted && x.made > m0 && await ev(true, '!!(window.__derby && __derby.AUTO.on && __derby.HEAL)'); }, 180000);
      const m1 = (await L()).made; await ev(true, '__derby.AUTO.stop(); window.requestAnimationFrame = () => 0; 1');
      await sleep(30000); s = await L();
      ok(s && s.made === m1 && s.last && s.last.auto === false, '6: a person playing (autoplay stopped) whose frames stop is never restarted by the launcher', s);
      ok(!errors.length, '6: no page errors ' + errors.slice(0, 3).join(' | '));
      await browser.close();
      // control: without site isolation (Playwright's default) the frame shares the launcher's process, and the check says so
      const b2 = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p2 = await b2.newPage({ viewport: { width: 480, height: 300 } });
      await p2.addInitScript(() => { window.__noDrop = true; }); await p2.route('**/*', route0); await p2.goto('http://game.local/autoplay.html');
      const iso2 = await p2.waitForFunction(() => window.__ln && __ln.iso, null, { timeout: 180000 }).then((h) => h.jsonValue()).catch(() => null);
      ok(iso2 && iso2.own === false, '6: control: with site isolation off, the check reports a shared process', iso2);
      await b2.close();
      } }
  // ---------- 7: autoplay moves itself into the launcher (no bookmark to change), and never bounces ----------
  if (!ONLY || ONLY.includes('7')) {
    const cors = { 'Access-Control-Allow-Origin': '*' }, lpath = path.join(ROOT, 'autoplay.html');
    const browser = await chromium.launch({ args: ['--site-per-process', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const fresh = async (deadFrame) => { const page = await browser.newPage({ viewport: { width: 480, height: 300 } }); const errors = [];
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
      await page.addInitScript(() => { window.__lnFast = 6; window.__noDrop = true; window.__launchTest = true; }); // (__launchTest: the redirect runs off github.io too)
      await page.route('**/*', (r) => { const u = r.request().url(), inFrame = r.request().frame() !== page.mainFrame();
        if (u.includes('three@0.160.0/build/three.module.js')) return r.fulfill({ headers: cors, contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/build/three.module.js') });
        if (u.includes('three@0.160.0/examples/jsm/')) return r.fulfill({ headers: cors, contentType: 'application/javascript', body: fs.readFileSync(NM + '/three/examples/jsm/' + u.split('/examples/jsm/')[1]) });
        if (u.includes('cannon-es@0.20.0/dist/cannon-es.js')) return r.fulfill({ headers: cors, contentType: 'application/javascript', body: fs.readFileSync(NM + '/cannon-es/dist/cannon-es.js') });
        if (u.startsWith('http://game.local/autoplay.html')) return fs.existsSync(lpath) ? r.fulfill({ contentType: 'text/html', body: fs.readFileSync(lpath, 'utf8') }) : r.fulfill({ status: 404, body: 'not found' });
        if (u.startsWith('http://game.local/index.html')) return r.fulfill({ contentType: 'text/html', body: deadFrame && inFrame ? '<!doctype html><title>broken</title>' : fs.readFileSync(GAME, 'utf8') }); // (deadFrame: a launcher that can't start the game)
        return r.abort(); });
      return { page, errors }; };
    const gameIn = (page) => page.evaluate(() => window.__ln ? 'launcher' : window.__derby ? 'top' : null).catch(() => null);
    // a. top-level ?autoplay=1 -> autoplay.html, the game inside the frame, logged as 'moved'
    let { page, errors } = await fresh(false);
    await page.goto('http://game.local/index.html?autoplay=1&aplen=60');
    const a = await page.waitForFunction(() => window.__ln && __ln.last && __ln.last.auto && __ln.last.booted, null, { timeout: 180000 }).then(() => page.evaluate(() => ({ url: location.href, src: __ln.frame && __ln.frame.src, made: __ln.made }))).catch(() => null);
    ok(a && /\/autoplay\.html\?aplen=60$/.test(a.url) && /index\.html\?aplen=60&autoplay=1$/.test(a.src), '7a: top-level index.html?autoplay=1 moves itself to autoplay.html (other parameters kept), the game autoplays inside the frame', a || { url: page.url() });
    const mv = a && await page.waitForFunction(() => { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!/^derby-pl-\d+$/.test(k)) continue; try { const r = JSON.parse(localStorage.getItem(k)); if (r.kind === 'heal' && r.action === 'moved') return r; } catch (e) {} } return null; }, null, { timeout: 30000 }).then((h) => h.jsonValue()).catch(() => null);
    ok(mv && mv.why === 'launcher' && mv.framed === true && /moved itself into the launcher/.test(mv.detail), "7a: logged as a heal record (why 'launcher', action 'moved')", mv && mv.detail);
    ok(!errors.length, '7a: no page errors ' + errors.slice(0, 2).join(' | ')); await page.close();
    // b. a person's plain index.html, idle autoplay and a join link stay put
    for (const u of ['index.html', 'index.html?autoplay=1&idle=1', 'index.html#join-abc123']) {
      ({ page, errors } = await fresh(false)); await page.goto('http://game.local/' + u); await page.waitForFunction(() => window.__derby, null, { timeout: 120000 }).catch(() => {}); await page.waitForTimeout(3000);
      const w = await gameIn(page); ok(w === 'top' && page.url() === 'http://game.local/' + u, `7b: ${u} is never redirected`, { url: page.url(), w }); await page.close(); }
    // c. loop guard: the launcher can't start a game -> autoplay goes back to the top level and stays (no second redirect)
    ({ page, errors } = await fresh(true)); const navs = []; page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs.push(f.url()); });
    await page.goto('http://game.local/index.html?autoplay=1');
    await page.waitForFunction(() => window.__derby && __derby.AUTO.on && !window.__ln, null, { timeout: 240000 }).catch(() => {});
    await page.waitForTimeout(15000); // (time enough for a second bounce, if there were one)
    const c = await page.evaluate(() => ({ url: location.href, auto: !!(window.__derby && __derby.AUTO.on), guard: JSON.parse(localStorage.getItem('derby-launch-guard') || 'null'), stay: !!window.__launchStay,
      heal: (() => { const o = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!/^derby-pl-\d+$/.test(k)) continue; try { const r = JSON.parse(localStorage.getItem(k)); if (r.kind === 'heal') o.push(r.why + '/' + r.action); } catch (e) {} } return o; })() })).catch((e) => ({ err: String(e) }));
    const top = navs.filter((u) => /index\.html/.test(u)).length, lau = navs.filter((u) => /autoplay\.html/.test(u)).length;
    ok(c.guard && c.guard.until > Date.now() + 23 * 3600000 && /could not start a game/.test(c.guard.why), '7c: a launcher that could not start a game in 3 min leaves a 24 h guard', c.guard);
    ok(/index\.html\?autoplay=1$/.test(c.url || '') && c.auto && c.stay && lau === 1 && top === 2, `7c: autoplay went back to the top level once and stays there (top-level loads ${top}, launcher loads ${lau}: ${navs.join(' > ')})`, c);
    ok((c.heal || []).includes('launcher/stayed') && (c.heal || []).includes('no game/new frame'), "7c: logged (the launcher's 'no game', then 'stayed')", c.heal);
    await page.close();
    // d. the other loop guard: the frame shares the launcher's process and crashes took both, twice in 6 h -> top level, and stay
    ({ page, errors } = await fresh(false)); await page.goto('http://game.local/index.html'); await page.waitForFunction(() => window.__derby, null, { timeout: 120000 }).catch(() => {});
    await page.evaluate(() => { localStorage.removeItem('derby-launch-guard'); localStorage.setItem('derby-launch-crash', JSON.stringify([Date.now() - 3600000])); localStorage.setItem('derby-launch-life', JSON.stringify({ seen: Date.now() - 60000, shared: true, clean: false })); });
    const navs2 = []; page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs2.push(f.url()); });
    await page.goto('http://game.local/index.html?autoplay=1'); await page.waitForFunction(() => window.__derby && !window.__ln, null, { timeout: 120000 }).catch(() => {}); await page.waitForTimeout(8000);
    const d = await page.evaluate(() => ({ url: location.href, guard: JSON.parse(localStorage.getItem('derby-launch-guard') || 'null') })).catch((e) => ({ err: String(e) }));
    ok(d.guard && /shares the launcher's process/.test(d.guard.why) && /index\.html\?autoplay=1$/.test(d.url || '') && navs2.filter((u) => /autoplay\.html/.test(u)).length === 1, '7d: shared process + repeated crashes: back to the top level once, guarded', { d, navs: navs2 });
    await page.close(); await browser.close();
  }
  console.log(fails.length ? 'SELFHEAL FAIL (' + fails.length + ')' : 'SELFHEAL PASS'); process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.log('SELFHEAL FAIL (exception) ' + (e && e.stack || e)); process.exit(1); });
