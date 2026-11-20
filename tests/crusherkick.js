// The Crusher press kicked cars out of the floor (Build 129/132 play logs: bursts of physics safety-net catches at the Crusher, -112,-95).
// During 'slam' and 'hold' every car inside was TELEPORTED down to y 0.6 each frame. A body that rests higher than that (a wrecked Spider-Walker
// at ~1.4, a standing spider at ~1.7, a car on a bull) was put ~0.8 m into the floor and the solver shot it back out (vy 14, up to the vy 32 clamp).
// And any car inside restarted the press, a crushed wreck included, so a bale left in it was pressed every ~3 s.
// Now the press pushes down with velocity (like crushNow does), and a crushed bale no longer restarts it.
//   1 a Spider-Walker standing in the press, two press cycles: no safety-net catches, max |vy| < 10, crushed
//   2 a wrecked spider in the press, two press cycles: the same; then the crushed wreck doesn't restart the press on its own
//   3 the Buzzsaw Hover sitting on a bull in the press, two press cycles: the same (the bull kept calm and the hover unwrecked: only the press acts)
//   4 an ordinary car parked in the press still starts it and gets crushed into a bale
// Fails on Build 132.
const { open } = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } });
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), CA = D.CANNON, C = D.CRUSHER;
    D.S.aiCount = 3; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, 100 + bl.id * 4); /* (the bulls penned far from the crusher) */
    const park = (c) => { c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false }); };
    const place = (c, x, z, yaw = 0) => { c.body.position.set(x, c.T.walker ? 2.6 : 1.4, z); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), yaw); c.body.wakeUp(); };
    const wait = async (s, f) => { const t0 = D.simTime, w0 = performance.now(); while (D.simTime - t0 < s && performance.now() - w0 < s * 60000 + 5000) { if (f && f()) return true; await sleep(16); } return false; };
    const holdOpen = () => { C.state = 'idle'; C.t = 999; C.occ = 0; C.y = C.top; };
    const log = []; { const push0 = D.PHYS.log.push; D.PHYS.log.push = function (...a) { log.push(...a); return push0.apply(this, a); }; } /* (every safety-net entry, even ones the capped log drops) */
    const ais = D.cars.filter((c) => !c.isPlayer); park(D.player); place(D.player, 60, 100);
    const hv = D.respawnCar(ais[0], 'hover'), sp = D.respawnCar(ais[1], 'spider'), vp = D.respawnCar(ais[2], 'viper'); for (const c of [hv, sp, vp]) park(c); sp.spiderSense = () => {};
    place(hv, 0, 100); place(sp, 20, 100); place(vp, 40, 100);
    const settle = async (s) => { const t0 = D.simTime; while (D.simTime - t0 < s) { holdOpen(); await sleep(16); } };
    // two press cycles, forced: warn at t=0 -> slam -> hold -> idle, twice; catches and the largest |vy| of car c while it runs
    const press = async (c) => { const n0 = log.length; let vmax = 0, cycles = 0, ymin = 99;
      for (let k = 0; k < 2; k++) { C.state = 'warn'; C.t = 0; let seen = false; const t0 = D.simTime;
        while (D.simTime - t0 < 4) { vmax = Math.max(vmax, Math.abs(c.body.velocity.y)); ymin = Math.min(ymin, c.body.position.y); if (C.state === 'hold') seen = true; if (seen && C.state === 'idle') break; await sleep(16); }
        if (seen) cycles++; C.t = 999; await wait(0.3, () => { vmax = Math.max(vmax, Math.abs(c.body.velocity.y)); return false; }); }
      const L = log.slice(n0).filter((e) => e.who === c.T.name);
      return { cycles, catches: L.length, vmax: +vmax.toFixed(1), ymin: +ymin.toFixed(2), crushed: !!c.crushedBox, list: L.slice(0, 3) }; };
    const out = {}, inPress = (c) => Math.abs(c.body.position.x - C.x) < C.hx && Math.abs(c.body.position.z - C.z) < C.hz;
    // 1 a Spider-Walker standing on its legs in the press (rests ~1.7 m up)
    place(sp, C.x, C.z, Math.PI / 2); await settle(1.5); out.spiderRest = +sp.body.position.y.toFixed(2); out.spider = await press(sp);
    holdOpen(); place(sp, 20, 100); await settle(0.3);
    // 2 a wrecked spider in the press (a fresh one; kept from respawning; the wreck pop throws it about, so it is put back in and left to settle)
    const sw = D.respawnCar(sp, 'spider'); park(sw); sw.spiderSense = () => {}; place(sw, C.x, C.z, Math.PI / 2); await settle(1.5); sw.wreck(); sw.respawnT = 999; await settle(1.5);
    place(sw, C.x, C.z, Math.PI / 2); sw.body.position.y = 2; await settle(2); out.wreckRest = +sw.body.position.y.toFixed(2); out.wreckIn = inPress(sw); out.wreck = await press(sw);
    // ...and the bale left in it doesn't restart the press by itself
    holdOpen(); { out.baleIn = inPress(sw); let restarted = false; await wait(3, () => { if (C.state !== 'idle') restarted = true; return restarted; }); out.baleRestarts = restarted; }
    holdOpen(); place(sw, 20, 120); await settle(0.3);
    // 3 the Buzzsaw Hover sitting on a bull in the press
    // The bull is kept calm and the hover's hull topped up, so only the press acts on them. Left alone, the bull's AI picked the hover on its back,
    // pawed and charged (held in place), and gored it as the press pushed it down: the gore's off-centre impulse (spin 16-31) was what the guard
    // undid and logged as a "solver kick undone" (10 of 14 instrumented runs, every catch at the gore's exact time). And the second crush wrecked
    // the hover: its wreck blast threw the bull up into it at ~12 m/s, the bull was "ploughed into" and tumbled, and the hover reached |vy| 10.
    { const bl = D.BULLS[0], knocks0 = bl.knocks, pin = () => { for (const b of [bl.body, hv.body]) { b.position.x += (C.x - b.position.x) * 0.2; b.position.z += (C.z - b.position.z) * 0.2; b.velocity.x = 0; b.velocity.z = 0; } /* (the bull walks and the hover slides off its back: both held over the middle, sideways only) */
        if (bl.state !== 'down') { bl.state = 'graze'; bl.t = 99; bl.target = null; bl.want = bl.yaw; } bl.hitCd = 99; if (!hv.wrecked) hv.health = 100; }; /* (no victim picking, no gore, no knock-down; never wrecked, so no wreck blast) */
      D.world.addEventListener('preStep', pin); bl.body.position.set(C.x, 1.3, C.z); bl.body.velocity.set(0, 0, 0); place(hv, C.x, C.z, Math.PI / 2); hv.body.position.y = 3.6; await settle(2);
      out.hoverIn = inPress(hv); out.hoverRest = +hv.body.position.y.toFixed(2); out.bullY = +bl.body.position.y.toFixed(2); out.hover = await press(hv); D.world.removeEventListener('preStep', pin);
      out.bullCalm = bl.state === 'graze' && bl.knocks === knocks0; out.hoverWrecked = !!hv.wrecked; bl.hitCd = 0; bl.t = 2; bl.body.position.set(-130, 1.3, 100); }
    holdOpen(); place(hv, 0, 100); await settle(0.3);
    // 4 an ordinary car parked in the press: it starts the press (no forcing) and gets crushed
    place(vp, C.x, C.z, Math.PI / 2); await settle(1.2); vp.health = 100; C.t = 999; C.occ = 0; { const n0 = log.length;
      const crushed = await wait(6, () => !!vp.crushedBox); out.viper = { crushed, health: Math.round(vp.health), catches: log.slice(n0).filter((e) => e.who === vp.T.name).length }; }
    return out; });
  console.log('  ' + JSON.stringify(r));
  const Sp = r.spider, W = r.wreck, H = r.hover, V = r.viper;
  ok(Sp.cycles === 2 && W.cycles === 2 && H.cycles === 2, `two press cycles ran on each (spider ${Sp.cycles}, wreck ${W.cycles}, hover ${H.cycles})`);
  ok(Sp.catches === 0 && Sp.vmax < 10, `a Spider-Walker standing in the press (rests at y ${r.spiderRest}): ${Sp.catches} safety-net catches, max |vy| ${Sp.vmax} m/s (lowest y ${Sp.ymin}) ${JSON.stringify(Sp.list)}`);
  ok(r.wreckIn && W.catches === 0 && W.vmax < 10, `a wrecked spider in the press (in ${r.wreckIn}, rests at y ${r.wreckRest}): ${W.catches} safety-net catches, max |vy| ${W.vmax} m/s (lowest y ${W.ymin}) ${JSON.stringify(W.list)}`);
  ok(r.hoverIn && r.bullCalm && !r.hoverWrecked && H.catches === 0 && H.vmax < 10, `the Buzzsaw Hover on a bull in the press (in ${r.hoverIn}, rests at y ${r.hoverRest}, bull ${r.bullY}, bull calm ${r.bullCalm}, hover wrecked ${r.hoverWrecked}): ${H.catches} safety-net catches, max |vy| ${H.vmax} m/s (lowest y ${H.ymin}) ${JSON.stringify(H.list)}`);
  ok(Sp.crushed && W.crushed && H.crushed, `all three were crushed into bales (spider ${Sp.crushed}, wreck ${W.crushed}, hover ${H.crushed})`);
  ok(r.baleIn && !r.baleRestarts, `a crushed wreck left in the press doesn't restart it (still in ${r.baleIn}, restarted: ${r.baleRestarts})`);
  ok(V.crushed && V.health < 50 && V.catches === 0, `an ordinary car parked in the press starts it and gets crushed (crushed ${V.crushed}, health 100 -> ${V.health}, ${V.catches} catches)`);
  const pe = errors.filter((e) => e.startsWith('pageerror') || /frame error/.test(e)); ok(!pe.length, 'no page or frame errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'CRUSHERKICK FAIL' : 'CRUSHERKICK PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
