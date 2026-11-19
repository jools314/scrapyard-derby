// The Buzzsaw Hover (Lucas's hovercraft): it floats, drifts, gets shoved around, cuts whoever rams it, can't be bogged down by wet concrete,
// and hop-bombs whoever is below. Each claim is measured against an ordinary car doing the same thing, and the physics safety net must never
// have to undo a solver kick on the hovercraft (in the scripted checks or in 40 s of AI free play with two hovercraft in the yard).
//   1 drift:    full throttle, then a hard turn: its sideways slide is far bigger than the Outrider's
//   2 push:     the same Viper ram at 14 m/s shoves it much further than the Outrider (a car of about its size)
//   3 saws:     the Viper that rams it takes far more damage than one that rams the Outrider, and the hovercraft takes less than the Viper
//   4 concrete: it drives straight out of a fresh puddle of wet concrete that bogs the Outrider down
//   5 bomb:     hop over a parked car, drop a bomb from the air: it lands within 4 m of the car and hurts it
//   6 AI:       two AI hovercraft fight for 40 s: they hop and bomb, stay inside the yard, and no solver kick is undone on them
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 3; __derby.S.autoGfx = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 600000, polling: 250 });
  const r = await page.evaluate(async () => {
    const D = __derby, C = D.CANNON, sleep = (ms) => new Promise((res) => setTimeout(res, ms)), out = {};
    const wt = async (s) => { const t0 = D.game.time, w0 = performance.now(); while (D.game.time - t0 < s && performance.now() - w0 < s * 60000 + 5000) await sleep(20); };
    const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code.replace('Key', '').toLowerCase() }));
    const kicks = () => D.PHYS.log.filter((e) => e.kind === 'solver kick undone' && e.who === 'Buzzsaw Hover').length;
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    const ais = () => D.cars.filter((c) => !c.isPlayer);
    const stub = (c) => { c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false, handbrake: false, brake: false }); };
    const parkAll = () => { let k = 0; for (const c of ais()) { stub(c); c.body.position.set(-110 + k * 9, 2, 120); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); k++; } };
    const put = (c, x, z, yaw) => { const b = c.body; b.position.set(x, 1.4, z); b.quaternion.setFromEuler(0, yaw, 0); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0); c.health = 100; for (const k in c.zones) c.zones[k] = 0; };
    const lat = (c) => { const f = c.body.quaternion.vmult(new C.Vec3(1, 0, 0)), v = c.body.velocity, h = Math.hypot(f.x, f.z) || 1; return Math.abs(v.x * -f.z / h + v.z * f.x / h); };
    const k0 = kicks();
    // 1 drift
    out.drift = {};
    for (const t of ['hover', 'outrider']) {
      D.respawnCar(D.player, t); await wt(0.3); parkAll(); const c = D.player; put(c, -70, 75, 0); await wt(1.0);
      key('KeyW', true); await wt(2.6); const v0 = Math.hypot(c.body.velocity.x, c.body.velocity.z); key('KeyA', true);
      let latMax = 0; const t0 = D.game.time; while (D.game.time - t0 < 2.2) { await sleep(20); latMax = Math.max(latMax, lat(c)); if (D.game.time - t0 > 1.1) key('KeyA', false); }
      key('KeyA', false); key('KeyW', false); out.drift[t] = { v0: +v0.toFixed(1), latMax: +latMax.toFixed(1) }; await wt(0.5);
    }
    // 2 push + 3 saws: a Viper at 14 m/s into the parked car's left side
    out.ram = {};
    for (const t of ['hover', 'outrider']) {
      D.respawnCar(D.player, t); await wt(0.3); parkAll(); const c = D.player; put(c, -40, 75, 0); await wt(1.2);
      let v = ais()[0]; if (v.type !== 'viper') { v = D.respawnCar(v, 'viper'); await wt(0.3); } stub(v); put(v, -40, 63, Math.PI / 2 * -1); await wt(0.4); // (nose toward +z)
      put(v, -40, 63, -Math.PI / 2); v.body.velocity.set(0, 0, 14); const p0 = c.body.position.clone(), h0 = c.health, vh0 = v.health, saw0 = c.sawHits || 0;
      const t0 = D.game.time; while (D.game.time - t0 < 2.5) { await sleep(20); if (D.game.time - t0 < 0.35) v.body.velocity.z = Math.max(v.body.velocity.z, 14); }
      const p1 = c.body.position; out.ram[t] = { moved: +Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(1), hurt: +(h0 - c.health).toFixed(1), rammerHurt: +(vh0 - v.health).toFixed(1), saws: (c.sawHits || 0) - saw0 };
    }
    // 4 concrete
    out.concrete = {};
    for (const t of ['hover', 'outrider']) {
      D.respawnCar(D.player, t); await wt(0.3); parkAll(); const c = D.player; put(c, -72, 75, 0); await wt(1.0);
      D.addConcrete(-70, 75, 5, 'concrete'); const pd = D.CONCRETE.list[D.CONCRETE.list.length - 1]; pd.t = 20; await wt(0.2);
      const p0 = c.body.position.clone(); let stuck = 0; key('KeyW', true); const t0 = D.game.time; while (D.game.time - t0 < 2) { await sleep(20); if (c.stuckConcrete) stuck++; } key('KeyW', false);
      const p1 = c.body.position; out.concrete[t] = { moved: +Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(1), stuckFrames: stuck }; pd.t = 0.5; await wt(0.6);
    }
    // 5 bomb: a parked Outrider at (-30, 75); the hovercraft runs at it, hops, and bombs it from the air
    { D.respawnCar(D.player, 'hover'); await wt(0.3); parkAll(); const c = D.player; let tg = ais()[0]; if (tg.type !== 'outrider') { tg = D.respawnCar(tg, 'outrider'); await wt(0.3); } stub(tg); put(tg, -30, 75, 0); put(c, -80, 75, 0); await wt(1.0);
      const th0 = tg.health; key('KeyW', true); let hopX = null, dropped = null, landed = null, last = null; const t0 = D.game.time;
      while (D.game.time - t0 < 9 && !landed) { await sleep(15); const p = c.body.position;
        if (hopX === null && p.x > -45) { hopX = +p.x.toFixed(1); key('KeyF', true); await sleep(60); key('KeyF', false); }
        if (hopX !== null && !dropped && c.hovAir && c.airT > 0.3) { key('KeyF', true); await sleep(40); key('KeyF', false); const s = D.shells.find((x) => x.hbomb && x.owner === c); if (s) dropped = { x: +p.x.toFixed(1), y: +p.y.toFixed(1), aimed: c._aim && c._aim.t === tg }; }
        const s = D.shells.find((x) => x.hbomb && x.owner === c); if (s) last = s.pos.clone(); else if (dropped && last) landed = last; }
      key('KeyW', false); await wt(0.3); const q = tg.body.position;
      out.bomb = { at: [+c.body.position.x.toFixed(1), +c.body.position.z.toFixed(1)], hopX, dropped, landed: landed && { x: +landed.x.toFixed(1), y: +landed.y.toFixed(1), z: +landed.z.toFixed(1) }, miss: landed ? +Math.hypot(landed.x - q.x, landed.z - q.z).toFixed(1) : null, targetHurt: +(th0 - tg.health).toFixed(1) };
    }
    out.kicksScripted = kicks() - k0;
    // 6 AI free play: two AI hovercraft and a brawler, 40 s; the player's car sits out of the way
    { D.respawnCar(D.player, 'outrider'); await wt(0.3); stub(D.player); put(D.player, 130, -130, 0); D.player.think = () => {};
      const k1 = kicks(), list = ais(), hv = [D.respawnCar(list[0], 'hover'), D.respawnCar(list[1], 'hover')], other = D.respawnCar(list[2], 'bertha'); await wt(0.2);
      for (const c of [...hv, other]) { delete c.think; c.health = 100; } // (an own property shadows the class's think: delete it to drive again)
      const v0 = D.PLAYLOG.m ? JSON.parse(JSON.stringify(D.PLAYLOG.m.veh.hover || {})) : {}; let maxAbs = 0, minY = 9;
      const t0 = D.game.time; while (D.game.time - t0 < 40) { await sleep(50); for (const c of D.cars) if (c.type === 'hover' && !c.isPlayer) { const p = c.body.position; maxAbs = Math.max(maxAbs, Math.abs(p.x), Math.abs(p.z)); minY = Math.min(minY, p.y); } }
      const v1 = D.PLAYLOG.m ? D.PLAYLOG.m.veh.hover || {} : {};
      out.ai = { hops: (v1.hops || 0) - (v0.hops || 0), bombs: (v1.bombs || 0) - (v0.bombs || 0), sawHits: (v1.sawHits || 0) - (v0.sawHits || 0), maxAbs: +maxAbs.toFixed(1), minY: +minY.toFixed(2), kicks: kicks() - k1,
        escaped: D.PHYS.log.filter((e) => e.who === 'Buzzsaw Hover' && /escaped|floor/.test(e.kind)).length }; }
    out.kicksTotal = kicks() - k0; out.physLog = D.PHYS.log.filter((e) => e.who === 'Buzzsaw Hover').slice(0, 5);
    return out;
  });
  console.log(JSON.stringify(r));
  const d = r.drift, ra = r.ram, co = r.concrete, b = r.bomb;
  ok(d.hover.latMax >= 6 && d.hover.latMax >= 3 * d.outrider.latMax, `it drifts: sideways slide after a hard turn ${d.hover.latMax} m/s vs the Outrider's ${d.outrider.latMax} m/s (from ${d.hover.v0} / ${d.outrider.v0} m/s)`);
  ok(ra.hover.moved >= 1.8 * ra.outrider.moved && ra.hover.moved > 4, `it gets pushed around: the same 14 m/s Viper ram moved it ${ra.hover.moved} m vs the Outrider ${ra.outrider.moved} m`);
  ok(ra.hover.saws >= 1 && ra.hover.rammerHurt >= ra.outrider.rammerHurt + 8 && ra.hover.hurt < ra.hover.rammerHurt, `the saw ring cuts the rammer: Viper lost ${ra.hover.rammerHurt} (vs ${ra.outrider.rammerHurt} ramming the Outrider), the hovercraft lost ${ra.hover.hurt} (saw hits ${ra.hover.saws})`);
  ok(co.hover.stuckFrames === 0 && co.hover.moved > 8 && co.hover.moved > 3 * co.outrider.moved, `wet concrete can't hold it: ${co.hover.moved} m in 2 s (never bogged) vs the Outrider ${co.outrider.moved} m (bogged ${co.outrider.stuckFrames} frames)`);
  ok(!!b.dropped && b.miss !== null && b.miss <= 4 && b.targetHurt >= 10, `an airborne bomb lands on the car below: hop at x ${b.hopX}, dropped from ${b.dropped && b.dropped.y} m up, landed ${b.miss} m from it, it lost ${b.targetHurt}`);
  ok(r.ai.hops >= 2 && r.ai.bombs >= 1 && r.ai.maxAbs < 150 && r.ai.escaped === 0, `the AI hovercraft hop (${r.ai.hops}) and bomb (${r.ai.bombs}) and stay in the yard (max |x|,|z| ${r.ai.maxAbs}, escapes ${r.ai.escaped}), saw hits ${r.ai.sawHits}`);
  ok(r.kicksTotal === 0, `no solver kick undone on the hovercraft (${r.kicksScripted} scripted, ${r.ai.kicks} in AI play) ${JSON.stringify(r.physLog)}`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'HOVERCRAFT FAIL' : 'HOVERCRAFT PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
