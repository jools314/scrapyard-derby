// Long autoplay sessions must not leak JS heap (found on Build 105). The solver-kick safety net remembered each body's last velocity in a Map keyed
// by the body, and never forgot one: every car (and bull) that ever lived stayed reachable through body.car, with its meshes, geometry
// arrays and canvases, though its GPU copies were freed (Build 101). Every match and every respawn added a yard's worth: the Chromebook's
// heap went 99 MB -> 1.2 GB over ~23 autoplay matches on Build 105 and the tab crashed. Also the jumbotron replay buffer kept the last
// match's cars and the far-away (LOD) list kept the last match's bulls when the scene had the same number of children.
// Checks: after several match restarts with respawns, (1) the cars and bulls of earlier matches are garbage-collected and (2) the heap
// (JS heap plus array-buffer backing stores, after a forced GC) grows by only a little per match. Fails on Build 105.
const { open } = require('./harness');
const T0 = Date.now(), N = +process.env.N || 4, RESP = +process.env.RESP || 3, MAXMB = +process.env.MAXMB || 2.5;
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const cdp = await page.context().newCDPSession(page);
  const heap = async () => { for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage'); const u = await cdp.send('Runtime.getHeapUsage'); return { js: u.usedSize / 1e6, buf: (u.backingStorageSize || 0) / 1e6 }; };
  await page.evaluate(() => { __derby.S.aiCount = 5; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 500000 });
  // one match: a little play, RESP respawns (autoplay's respawn mode makes new cars all match long), then the restart AUTO.nextMatch does
  const match = (resp) => page.evaluate(async (resp) => { const D = __derby, fr = async (k) => { for (let i = 0; i < k; i++) await new Promise((r) => requestAnimationFrame(r)); };
    await fr(20); const ty = Object.keys(D.CAR_TYPES);
    for (let k = 0; k < resp; k++) { const ai = D.cars.filter((c) => !c.isPlayer); D.respawnCar(ai[k % ai.length], ty[(k * 5 + 3) % ty.length]); await fr(3); }
    D.respawnCar(D.player, ty[(Math.random() * ty.length) | 0]); await fr(3);
    D.startMatch(); await new Promise((r) => setTimeout(r, 300)); await fr(20); }, resp);
  await match(RESP); await match(RESP); // warm-up: first-time shared allocations (shaders, shared shapes, voice tables) go in the baseline
  // weak references to this match's cars and bulls: after a few more matches nothing should hold them
  await page.evaluate(() => { const D = __derby; window.__old = [...D.cars, ...D.BULLS].map((o) => new WeakRef(o)); });
  const hs = [await heap()]; console.log(`  after warm-up: JS heap ${hs[0].js.toFixed(1)} MB, buffers ${hs[0].buf.toFixed(1)} MB`);
  for (let k = 0; k < N; k++) { await match(RESP); const h = await heap(); hs.push(h);
    const info = await page.evaluate(() => { const D = __derby; return { bodies: D.world.bodies.length, geo: D.renderer.info.memory.geometries }; });
    console.log(`  [${((Date.now() - T0) / 1000) | 0}s] match ${k + 1}: JS heap ${h.js.toFixed(1)} MB, buffers ${h.buf.toFixed(1)} MB, bodies ${info.bodies}, geometries ${info.geo}`); }
  const alive = await page.evaluate(() => window.__old.filter((w) => w.deref()).length), total = await page.evaluate(() => window.__old.length);
  const per = hs.slice(1).map((h, i) => h.js + h.buf - hs[i].js - hs[i].buf).sort((a, b) => a - b), med = per[per.length >> 1];
  const slope = (hs[hs.length - 1].js + hs[hs.length - 1].buf - hs[0].js - hs[0].buf) / N;
  console.log(`  growth per match (JS heap + buffers): median ${med.toFixed(2)} MB, overall ${slope.toFixed(2)} MB (${N} matches, ${RESP + 1} respawns each)`);
  ok(alive === 0, `the cars and bulls of a match ${N} matches ago are garbage-collected (${alive} of ${total} still alive)`);
  ok(med < MAXMB && slope < MAXMB, `heap grows less than ${MAXMB} MB per match (median ${med.toFixed(2)}, overall ${slope.toFixed(2)})`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'HEAPLEAK FAIL' : 'HEAPLEAK PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
