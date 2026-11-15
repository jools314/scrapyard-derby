// Play log: two quick matches with a reload (mid-match) in between, then a third; records, meter, Copy all, budget eviction
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://game.local' });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const W = (ms) => page.waitForTimeout(ms);
  await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith('derby-pl')) localStorage.removeItem(k); });
  await page.reload({ timeout: 180000 }); await page.waitForFunction(() => window.__derby, null, { timeout: 180000 });
  const start = async () => { await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 5; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0 && __derby.PLAYLOG.m, null, { timeout: 60000 }); };
  const until = (t) => page.waitForFunction((t) => __derby.game.time >= t, t, { timeout: 180000, polling: 500 });
  // match 1: play a bit, restart
  await start(); await until(8);
  const id1 = await page.evaluate(() => __derby.PLAYLOG.m.id);
  await page.evaluate(() => __derby.startMatch());
  await page.waitForFunction(() => __derby.PLAYLOG.m && __derby.game.countdown <= 0, null, { timeout: 60000 });
  // match 2: an error, then the page is reloaded mid-match
  await until(6);
  const id2 = await page.evaluate(() => { setTimeout(() => { throw new Error('boom-test'); }); return __derby.PLAYLOG.m.id; });
  await W(1500);
  const before = await page.evaluate(() => ({ keys: Object.keys(localStorage).filter((k) => k.startsWith('derby-pl-cur')).length, idx: __derby.PLAYLOG.meta().idx.map((e) => e[4]) }));
  console.log('before reload', JSON.stringify(before));
  await page.reload({ timeout: 180000 }); await page.waitForFunction(() => window.__derby, null, { timeout: 180000 });
  await W(1000);
  // match 3
  await start(); await until(5); await page.evaluate(() => __derby.startMatch()); await W(500);
  await page.evaluate(() => { document.getElementById('btnStart'); }); // (the 4th match just started: it's the "live" one)
  const r = await page.evaluate(() => { const P = __derby.PLAYLOG, o = P.meta(); return { idx: o.idx, recs: P.records().map((s) => JSON.parse(s)), cur: Object.keys(localStorage).filter((k) => k.startsWith('derby-pl-cur')) }; });
  const ms = r.recs.filter((x) => x.kind === 'match'), ss = r.recs.filter((x) => x.kind === 'session'), cks = r.recs.filter((x) => x.kind === 'ck');
  console.log('records:', r.recs.map((x) => `${x.seq}:${x.kind}${x.ended ? '(' + x.ended + ')' : ''}`).join(' '));
  ok(ss.length === 2, `2 session records (${ss.length}), builds ${ss.map((x) => x.build)}`);
  ok(ms.length === 3, `3 match records (${ms.length})`);
  ok(ms.some((x) => x.id === id1 && x.ended === 'restarted'), 'match 1 recorded (restarted)');
  const m2 = ms.find((x) => x.id === id2);
  ok(m2 && /page closed/.test(m2.ended) && m2.recovered && m2.game >= 6, 'match 2 recovered after the reload: ' + (m2 && m2.ended + ' · ' + m2.game + ' s'));
  ok(m2 && m2.errs.n >= 1 && m2.errs.list.some((e) => e.includes('boom-test')) && m2.ev.some((e) => e[1] === 'err'), 'match 2 has the script error (and an err event)');
  ok(cks.length === 0, `checkpoints replaced by the final records (${cks.length} left)`);
  // slow-incident capture (build 72): draw calls, triangles and the sim/draw/wait split must survive into the record
  const slowCap = await page.evaluate(() => { const P = __derby.PLAYLOG; if (!P.m) return null;
    P.slow({ secs: 1.5, fps: 12, worst: 900, verdict: 'test verdict', parts: 'render 5.0', q: 1, cars: 8, particles: 3, fires: 1, booms: 0, mem: '', worstF: null, before: [], calls: 432, tris: 123456, sim: 3.1, draw: 4.2, wait: 9.3, res: 100 });
    const e = P.m.inc[P.m.inc.length - 1]; return e && { calls: e.calls, tris: e.tris, sim: e.sim, draw: e.draw, wait: e.wait, res: e.res }; });
  ok(slowCap && slowCap.calls === 432 && slowCap.tris === 123456 && slowCap.sim === 3.1 && slowCap.draw === 4.2 && slowCap.wait === 9.3 && slowCap.res === 100, 'slow incidents keep calls/tris and the sim/draw/wait split: ' + JSON.stringify(slowCap));
  // stuck capture (build 74): a stuck entry says what the car is touching (the `why` field)
  const stuckWhy = await page.evaluate(() => new Promise((res) => { const P = __derby.PLAYLOG, D = __derby; if (!P.m) return res(null);
    let tries = 0; const iv = setInterval(() => { tries++;
      for (const car of D.cars) { const w = P.stuckWhy(car); if (w) { clearInterval(iv);
        car.__apS = { t: 6, x: Math.round(car.body.position.x), z: Math.round(car.body.position.z), why: w }; P.stuckDone(car);
        const list = P.m.stuck; return res({ why: w, entry: list.length ? list[list.length - 1] : null }); } }
      if (tries > 130) { clearInterval(iv); res({ why: null, entry: null }); } }, 150); }));
  ok(stuckWhy && typeof stuckWhy.why === 'string' && stuckWhy.why.length > 0 && stuckWhy.entry && stuckWhy.entry.why === stuckWhy.why, 'stuck entries record what the car is touching (why): ' + JSON.stringify(stuckWhy));
  const good = ms.every((x) => x.build && /^\d{4}-\d\d-\d\dT/.test(x.start) && /^\d{4}-\d\d-\d\dT/.test(x.end) && x.end >= x.start && x.sid && x.dev && x.role === 'solo' && x.mode && x.device.includes('GPU') && x.ua && x.cores && x.screen && x.me.length && x.fps && x.fps.med > 0 && x.q && x.phys && x.stuck && x.veh && x.weap && x.voice && x.net && x.errs && x.mem && Number.isFinite(x.mem.calls) && Number.isFinite(x.mem.tris) && x.ev.length >= 2); // (mem.calls/tris: build 73)
  ok(good, 'every match: build, ISO start/end, session, device, role, mode, cars driven, fps, quality, phys, stuck, vehicles, weapons, voice, net, errors, memory, events');
  console.log('sample match:', JSON.stringify({ ...ms[0], ev: ms[0].ev.slice(0, 8), slow: { ...ms[0].slow, list: ms[0].slow.list.slice(0, 1) } }).slice(0, 1600));
  ok(r.cur.length === 1, 'one in-progress key (this page) ' + JSON.stringify(r.cur));
  // meter
  await page.evaluate(() => { document.getElementById('btnGear').click(); document.getElementById('btnPerf').click(); }); await W(1500);
  const meter = await page.evaluate(() => document.getElementById('plMeter').textContent);
  console.log('meter:', meter);
  ok(/^Play log: \d+ KB · 3 matches since \d+\/\d+\/\d+ · build \d+ · (upload not set up|nothing uploaded yet|uploaded up to [^·]+) · \d+ waiting$/.test(meter), 'meter text');
  // Copy all
  const exp = await page.evaluate(() => window.playLogExport());
  ok(r.recs.every((x) => exp.includes(`"seq":${x.seq},`) || exp.includes(`"seq":${x.seq}}`)) && exp.split('\n').length >= r.recs.length + 2 && exp.includes('"kind":"live"'), `export has all ${r.recs.length} records + header + live (${exp.length} chars)`);
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (t) => { window.__clip = t; } } }); }); // (http://game.local is not a secure context: no real clipboard)
  await page.click('#plCopy'); await W(800);
  const clip = await page.evaluate(() => window.__clip || '');
  ok(clip.split('\n').length === exp.split('\n').length && clip.startsWith('# Scrapyard Derby play log'), `Copy all put ${clip.length} chars on the clipboard (${await page.evaluate(() => document.getElementById('plCopy').textContent)})`);
  // budget eviction
  const ev = await page.evaluate(() => { const P = __derby.PLAYLOG; P.budget = 60000; const o0 = P.meta(), first = o0.idx[0][0];
    for (let i = 0; i < 40; i++) P.add({ kind: 'test', build: '64', i, pad: 'x'.repeat(3000) });
    const o = P.meta(), keys = Object.keys(localStorage).filter((k) => /^derby-pl-\d+$/.test(k)).map((k) => +k.slice(9));
    return { bytes: P.bytes(o), n: o.idx.length, first, nowFirst: o.idx[0][0], last: o.idx[o.idx.length - 1], keys: keys.length, keysMatch: keys.sort((a, b) => a - b).join() === o.idx.map((e) => e[0]).join(), evicted: o.evicted, unsent: o.evictedUnsent, meter: P.meterText() }; });
  console.log('eviction', JSON.stringify(ev));
  ok(ev.bytes <= 60000 && ev.nowFirst > ev.first && ev.keysMatch && ev.evicted > 0 && ev.unsent === ev.evicted && ev.last[4] === 'test', `budget eviction: ${ev.n} records, ${ev.bytes} bytes ≤ 60000, oldest gone, storage keys = index`);
  ok(/dropped before upload/.test(ev.meter), 'meter says records were dropped unsent');
  const errs = errors.filter((e) => !e.includes('ERR_FAILED') && !/^warning/.test(e) && !e.includes('boom-test'));
  ok(errs.length === 0, 'no other page errors ' + JSON.stringify(errs.slice(0, 5)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'ALL PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
