// Health bars over the cars you hurt (owner: "a little bar above the car that shows its health as it's declining, so you can see if
// you're doing any damage"). Checks, in a real match: the Hellbender's minigun on an AI car shows a bar over that car whose fill
// matches its health; a big hit leaves a pale chunk that drains down to the new health; the bar fades out ~3.5 s after the last hit;
// no bar for your own car, for AI-on-AI damage, for a wreck or for a car off screen; at most 3 at once (the most recently hurt);
// no layout reads while updating; bars of cars in a line don't cover each other. Prints HPBAR PASS / HPBAR FAIL. Fails on Build 125 (no bars). SHOTS=dir also saves two pictures
// (desktop and phone, deviceScaleFactor 2). Run: bash tests/run.sh hpbar (GAME= overrides the file).
const { open } = require('./harness');
const SHOTS = process.env.SHOTS;
async function setup(page, n) {
  await page.evaluate((n) => { __derby.S.aiCount = n; __derby.S.autoGfx = false; __derby.selectCar('hellbender'); document.getElementById('btnStart').click(); }, n);
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 180000 });
  await page.evaluate(() => { // helpers kept on window for the later steps
    const D = __derby; window.__t = {
      wt: async (s) => { const t0 = D.game.time; while (D.game.time - t0 < s) await new Promise((r) => setTimeout(r, 20)); },
      still: (c, x, z) => { c.think = () => {}; c.ctrl.throttle = 0; c.ctrl.steer = 0; c.ctrl.fire = false; c.body.position.set(x, 1.6, z); c.body.quaternion.setFromEuler(0, -Math.PI / 2, 0); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); },
      park: () => { const P = D.player; P.body.position.set(-60, 2.2, 75); P.body.quaternion.setFromEuler(0, 0, 0); P.body.velocity.set(0, 0, 0); P.body.angularVelocity.set(0, 0, 0); P.health = 100; D.player.ctrl.throttle = 0; },
      bars: () => D.HPBAR.slots.map((s) => ({ car: s.car ? s.car.name : null, shown: !s.e.hidden, f: s.wf, lag: s.wl, op: s.wo, health: s.car ? +(s.car.health / 100).toFixed(3) : null })),
    };
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
  });
}
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 960, height: 600 }, deviceScaleFactor: SHOTS ? 2 : 1 });
  await setup(page, 4);
  const has = await page.evaluate(() => !!__derby.HPBAR && __derby.HPBAR.slots.length);
  ok(has === 3, `a pool of 3 bars exists (${has})`);
  if (has) {
    // 1. the minigun, for real: hold F at a parked AI car 16 m ahead
    const w = await page.evaluate(async () => { const D = __derby, T = window.__t, [A, B, C, E] = D.cars.filter((c) => c !== D.player);
      T.park(); for (const [c, x, z] of [[A, -44, 75], [B, 40, -80], [C, 50, -90], [E, 60, -100]]) { T.still(c, x, z); c.health = 100; }
      D.game.camSnap = true; await T.wt(1); T.park(); T.still(A, -44, 75); A.health = 100;
      const before = T.bars().filter((b) => b.shown).length;
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyF', key: 'f' }));
      let t = 0; while (t < 40 && A.health > 92) { await T.wt(0.1); t++; T.park(); T.still(A, -44, 75); A.health = Math.max(A.health, 30); }
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyF', key: 'f' }));
      await T.wt(0.1); const s = D.HPBAR.slots.find((s) => s.car === A);
      return { before, aHealth: +A.health.toFixed(1), slot: !!s, shown: s ? !s.e.hidden : false, f: s ? s.wf : null, want: +(A.health / 100).toFixed(3), lag: s ? s.wl : null, bars: T.bars() }; });
    console.log('  minigun: ' + JSON.stringify(w));
    ok(w.before === 0, 'no bars before you hurt anyone');
    ok(w.aHealth < 100 && w.slot && w.shown, `minigun hits on an AI car show a bar over it (health ${w.aHealth})`);
    ok(w.f !== null && Math.abs(w.f - w.want) <= 0.01, `the bar's fill matches its health (${w.f} vs ${w.want})`);
    // 2. a big hit: the pale chunk shows, then drains to the new health; the bar sits over the car
    const d = await page.evaluate(async () => { const D = __derby, T = window.__t, A = D.HPBAR.slots.find((s) => s.car)?.car, s = D.HPBAR.slots.find((s) => s.car === A);
      await T.wt(2); A.health = Math.max(A.health, 60); await T.wt(0.1); A.applyDamage(25, D.player, 'front', null, 0); await T.wt(0.15);
      const r0 = { f: s.wf, lag: s.wl }; await T.wt(1.8); const r1 = { f: s.wf, lag: s.wl };
      const b = s.e.getBoundingClientRect(), p = A.body.position, v = new D.THREE.Vector3(p.x, p.y, p.z).project(D.camera), cx = (v.x + 1) / 2 * innerWidth, cy = (1 - v.y) / 2 * innerHeight;
      return { r0, r1, health: +(A.health / 100).toFixed(3), box: [b.left, b.top, b.right, b.bottom].map(Math.round), car: [Math.round(cx), Math.round(cy)] }; });
    console.log('  drain: ' + JSON.stringify(d));
    ok(d.r0.lag - d.r0.f >= 0.2, `right after a 25 hp hit the lost chunk shows (${d.r0.lag} over ${d.r0.f})`);
    ok(Math.abs(d.r1.lag - d.health) <= 0.01 && Math.abs(d.r1.f - d.health) <= 0.01, `~2 s later it has drained to the health (${d.r1.lag}, ${d.r1.f} vs ${d.health})`);
    ok(d.box[3] < d.car[1] && d.box[0] < d.car[0] + 40 && d.box[2] > d.car[0] - 40 && d.box[2] - d.box[0] <= 70, `the bar sits above the car (${d.box} vs car ${d.car})`);
    // 3. fades out after you stop
    const f = await page.evaluate(async () => { const D = __derby, T = window.__t, s = D.HPBAR.slots.find((s) => s.car); s.car.applyDamage(3, D.player, 'front', null, 0); await T.wt(3.2); const mid = { shown: !s.e.hidden, op: s.wo }; await T.wt(0.6); return { mid, end: { shown: !s.e.hidden, car: !!s.car } }; });
    console.log('  fade: ' + JSON.stringify(f));
    ok(f.mid.shown && f.mid.op < 1, `3.2 s after the last hit it is fading (opacity ${f.mid.op})`);
    ok(!f.end.shown && !f.end.car, '3.8 s after the last hit it is gone');
    // 4. never your own car, never AI-on-AI damage
    const o = await page.evaluate(async () => { const D = __derby, T = window.__t, [A, B] = D.cars.filter((c) => c !== D.player);
      T.park(); T.still(A, -44, 75); T.still(B, -40, 80); A.health = 100; B.health = 100; D.player.health = 100;
      D.player.applyDamage(15, A, 'front', null, 0); A.applyDamage(15, B, 'front', null, 0); A.applyDamage(5, null, 'front', null, 0); await T.wt(0.3); D.player.health = 100;
      return T.bars().filter((b) => b.car); });
    console.log('  others: ' + JSON.stringify(o));
    ok(o.length === 0, 'no bar for your own car, for damage AI cars do to each other, or for blasts nobody caused');
    // 5. a shove you gave still counts (no driver passed, you were the last to touch it within 1 s)
    const sh = await page.evaluate(async () => { const D = __derby, T = window.__t, A = D.cars.find((c) => c !== D.player); A.health = 100; A.lastAttacker = D.player; A.lastAttackTime = D.simTime; A.applyDamage(6, null, 'left', null, 0); await T.wt(0.2); return T.bars().filter((b) => b.shown).map((b) => b.car); });
    ok(sh.length === 1, `a hit with no driver straight after your ram counts as yours (${sh})`);
    // 6. at most 3: hurt 4 cars, the first one you hurt makes room; and off screen hides it
    const c = await page.evaluate(async () => { const D = __derby, T = window.__t, ai = D.cars.filter((c) => c !== D.player);
      await T.wt(4); T.park(); ai.forEach((c, i) => { T.still(c, -38 - i * 2, 66 + i * 6); c.health = 100; }); await T.wt(0.3);
      for (const c of ai) { c.applyDamage(18, D.player, 'front', null, 0); await T.wt(0.15); }
      await T.wt(0.15); const bars = T.bars(), shown = bars.filter((b) => b.shown).map((b) => b.car);
      return { names: ai.map((c) => c.name), shown, bars }; });
    console.log('  cap: ' + JSON.stringify(c));
    ok(c.shown.length === 3 && !c.shown.includes(c.names[0]) && c.names.slice(1).every((n) => c.shown.includes(n)), `4 cars hurt: 3 bars, the last 3 hurt (${c.shown})`);
    if (SHOTS) { await page.evaluate(() => { __derby.HPBAR.SHOW = 1e4; }); /* (a slow screenshot must not outlast the bars) */ await page.waitForTimeout(300); await page.screenshot({ path: `${SHOTS}/hpbar-desktop.png`, timeout: 180000 }).catch((e) => console.log('  (shot failed ' + e.message + ')')); await page.evaluate(() => { const H = __derby.HPBAR; H.SHOW = 3; for (const s of H.slots) if (s.car) s.hitT = __derby.simTime; }); }
    // 7. layout reads and cost of the update (instrumented: any clientWidth/Height, offset* or getBoundingClientRect inside HPBAR.update)
    const pf = await page.evaluate(async () => { const D = __derby, T = window.__t, H = D.HPBAR, E = Element.prototype, HE = HTMLElement.prototype; let reads = 0, n = 0, ms = 0, inUp = false;
      const wrap = (P, k) => { const d = Object.getOwnPropertyDescriptor(P, k); if (!d) return () => {}; if (d.get) Object.defineProperty(P, k, { ...d, get() { if (inUp) reads++; return d.get.call(this); } }); else { const f = d.value; P[k] = function (...a) { if (inUp) reads++; return f.apply(this, a); }; } return () => Object.defineProperty(P, k, d); };
      const undo = [wrap(E, 'clientWidth'), wrap(E, 'clientHeight'), wrap(HE, 'offsetWidth'), wrap(HE, 'offsetHeight'), wrap(E, 'getBoundingClientRect')];
      const up = H.update; H.update = function (dt) { inUp = true; const t0 = performance.now(); try { return up.call(this, dt); } finally { ms += performance.now() - t0; n++; inUp = false; } };
      for (const c of D.cars) if (c !== D.player && H.slots.some((s) => s.car === c)) c.applyDamage(1, D.player, 'front', null, 0);
      await T.wt(1.0); H.update = up; undo.forEach((u) => u());
      return { reads, frames: n, usPerFrame: +(ms / Math.max(1, n) * 1000).toFixed(1), shown: T.bars().filter((b) => b.shown).length }; });
    console.log('  cost: ' + JSON.stringify(pf));
    ok(pf.frames > 5 && pf.reads === 0, `no layout reads while updating ${pf.shown} bars (${pf.reads} reads over ${pf.frames} frames, ${pf.usPerFrame} µs a frame)`);
    // 8. a wreck loses its bar; a car behind you hides its bar
    const wr = await page.evaluate(async () => { const D = __derby, T = window.__t, live = D.HPBAR.slots.filter((s) => s.car).map((s) => s.car), [X, Y] = live;
      X.applyDamage(500, D.player, 'front', null, 0); T.still(Y, -90, 75); Y.applyDamage(2, D.player, 'front', null, 0); await T.wt(0.2);
      const sx = D.HPBAR.slots.find((s) => s.car === X), sy = D.HPBAR.slots.find((s) => s.car === Y);
      return { wrecked: X.wrecked, xBar: !!(sx && !sx.e.hidden), yKept: !!sy, yShown: !!(sy && !sy.e.hidden) }; });
    console.log('  wreck/offscreen: ' + JSON.stringify(wr));
    ok(wr.wrecked && !wr.xBar, 'a wrecked car shows no bar');
    ok(wr.yKept && !wr.yShown, 'a hurt car behind you keeps its slot but shows no bar');
    // 9. two hurt cars one behind the other: their bars don't cover each other
    const ov = await page.evaluate(async () => { const D = __derby, T = window.__t, ai = D.cars.filter((c) => c !== D.player && !c.wrecked).slice(0, 2);
      T.park(); T.still(ai[0], -46, 75); T.still(ai[1], -36, 75.5); for (const c of ai) { c.health = 100; c.applyDamage(10, D.player, 'front', null, 0); } await T.wt(0.3);
      const r = D.HPBAR.slots.filter((s) => ai.includes(s.car) && !s.e.hidden).map((s) => { const b = s.e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom].map(Math.round); });
      return { r, hit: r.length === 2 && !(r[0][2] <= r[1][0] || r[1][2] <= r[0][0] || r[0][3] <= r[1][1] || r[1][3] <= r[0][1]) }; });
    console.log('  stacked: ' + JSON.stringify(ov));
    ok(ov.r.length === 2 && !ov.hit, `two cars in a line: both bars shown, not on top of each other (${JSON.stringify(ov.r)})`);
  }
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  await browser.close();
  if (SHOTS && has) { // a phone picture (portrait, touch controls)
    const { browser: b2, page: p2 } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await setup(p2, 3);
    await p2.evaluate(async () => { const D = __derby, T = window.__t, ai = D.cars.filter((c) => c !== D.player); T.park(); ai.forEach((c, i) => { T.still(c, -46 - i * 3, 71 + i * 4); c.health = 100; });
      D.game.camSnap = true; await T.wt(1); T.park(); ai.forEach((c, i) => T.still(c, -46 - i * 3, 71 + i * 4));
      ai[0].applyDamage(55, D.player, 'front', null, 0); ai[1].applyDamage(20, D.player, 'front', null, 0); await T.wt(0.6); D.HPBAR.SHOW = 1e4; ai[1].applyDamage(22, D.player, 'front', null, 0); await T.wt(0.1); });
    await p2.screenshot({ path: `${SHOTS}/hpbar-phone.png`, timeout: 180000 }).catch((e) => console.log('  (shot failed ' + e.message + ')'));
    await b2.close();
  }
  console.log(fails.length ? 'HPBAR FAIL' : 'HPBAR PASS'); process.exit(fails.length ? 1 : 0);
})();
