// Per-car AI (CAR_AI, docs/car-roles.md): each car does its signature thing in a staged scene. Every check fails on Build 123
// (before per-car AI the five shared personalities drove every car alike, and the gadgets fired at random).
//   1 Viper disengages from a Dozer charging at it (sidesteps, takes no blade, stays in the fight)
//   2 Fire truck goes for the burning car (not the nearer cold one) and hoses it out
//   3 Mixer lobs concrete ahead of a car crossing in front of it, onto its path
//   4 Tiger holds its stand-off range and shells a crossing car
//   5 Bulldozer comes round and puts its blade into the side of a car facing it nose-on
// ONLY=135 runs just those scenes.
// Each scene runs up to 3 times (the AI has dice in it); a check passes on 2 of 3.
const { open } = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } });
  await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.S.aiCount = 4; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100); D.game.grace = 0; });
  const scene = (name, fn) => page.evaluate(async ({ name, src }) => {
    const D = __derby, CA = D.CANNON, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const until = async (secs, each) => { const s0 = D.simTime; while (D.simTime - s0 < secs) { if (each && each(D.simTime - s0)) break; await sleep(16); } };
    const place = (c, x, z, yaw = 0) => { c.body.position.set(x, 1.4, z); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), yaw); c.body.wakeUp(); };
    const park = (c, k) => { c.think = function () { Object.assign(this.ctrl, { throttle: 0, steer: 0, fire: false, nitro: false, jump: false, handbrake: true }); }; place(c, -120 + k * 12, 135); };
    const setup = (types) => { // AI cars respawned as the given types (the rest and the player parked in a far corner)
      const ai = D.cars.filter((c) => !c.isPlayer), out = [];
      for (let i = 0; i < ai.length; i++) { const c = D.respawnCar(ai[i], types[i] || 'forklift'); c.health = 100; if (i >= types.length) park(c, i); else out.push(c); }
      const p = D.player; p.body.position.set(120, 1.4, 135); p.body.velocity.set(0, 0, 0); for (const c of D.cars) { c.lastAttacker = null; }
      for (const c of D.cars) if (c.isPlayer) c.ghost = false;
      D.CONCRETE.list.slice().forEach((pd) => { pd.t = Math.min(pd.t, 0.05); }); return out; };
    const drive = (c, steerTo) => { c.think = function () { const b = this.body, q = steerTo(); const l = b.pointToLocalFrame(new CA.Vec3(q.x, b.position.y, q.z)); const a = Math.atan2(-l.z, l.x); Object.assign(this.ctrl, { throttle: 1, steer: Math.max(-1, Math.min(1, a * 1.8)), fire: false, nitro: false, jump: false, handbrake: false }); }; };
    return await (eval('(' + src + ')'))({ D, CA, sleep, until, place, park, setup, drive });
  }, { name, src: fn.toString() });
  const ONLY = (process.env.ONLY || '12345').split('').map(Number), skip = { rs: [], good: 2 };
  const trials = async (n, fn, pass) => { const rs = []; let good = 0; for (let i = 0; i < n; i++) { const r = await scene('s', fn); rs.push(r); if (pass(r)) good++; if (good >= 2 || i - good >= n - 2) break; } return { rs, good }; };

  // 1 Viper vs a charging Dozer: a Viper going for the Dozer while it charges nose-first; the Viper should sidestep, not trade a head-on
  const t1 = !ONLY.includes(1) ? skip : await trials(3, async ({ D, sleep, until, place, setup, drive }) => {
    const [v, dz] = setup(['viper', 'dozer']); place(v, -20, -30, 0); place(dz, 22, -30, Math.PI); v.target = dz; v.retarget = 99; v.mode = 'hunt'; v.modeT = 6;
    drive(dz, () => v.body.position); await sleep(300); const h0 = v.health; let front = 0, minD = 99, evaded = false;
    await until(6, () => { const l = dz.body.pointToLocalFrame(v.body.position); const d = Math.hypot(l.x, l.z); minD = Math.min(minD, d); if (l.x > 0 && l.x < 7.5 && Math.abs(l.z) < 2.8) front += 0.016; if (v.evading) evaded = true; });
    const d = v.body.position.distanceTo(dz.body.position);
    return { lost: +(h0 - v.health).toFixed(1), front: +front.toFixed(2), minD: +minD.toFixed(1), endD: +d.toFixed(1), evaded };
  }, (r) => r.front < 0.25 && r.lost < 10 && r.endD < 45);
  console.log('  1 ' + JSON.stringify(t1.rs));
  ok(t1.good >= 2, `Viper sidesteps a charging Dozer: under 0.25 s in front of its blade, under 10 damage, still within 45 m (${t1.good}/${t1.rs.length})`);

  // 2 Fire truck: a burning car 26 m ahead, a cold one 18 m to the side: it hoses the fire
  const t2 = !ONLY.includes(2) ? skip : await trials(3, async ({ D, sleep, until, place, setup }) => {
    const [ft, hot, cold] = setup(['firetruck', 'sandflea', 'camper']); place(ft, -30, -40, 0); place(hot, -4, -40, Math.PI / 2); place(cold, -30, -22, 0);
    hot.think = cold.think = function () { Object.assign(this.ctrl, { throttle: 0, steer: 0, fire: false, handbrake: true }); };
    ft.target = null; ft.retarget = 0; ft.mode = 'hunt'; ft.modeT = 0; await sleep(300); hot.douse = 0; hot.burnT = 7; hot.ignite = 0; let tgtHot = 0, n = 0, out = false;
    await until(7, () => { if (hot.burnT < 5 && hot.burnT > 0) hot.burnT = 7; n++; if (ft.target === hot) tgtHot++; if (hot.douse > 0 && ft.specialT > 0) { out = true; return true; } });
    return { out, tgtHot: +(tgtHot / Math.max(1, n)).toFixed(2), coldWet: +(cold.wet || 0).toFixed(2), d: +ft.body.position.distanceTo(hot.body.position).toFixed(1) };
  }, (r) => r.out && r.tgtHot > 0.5);
  console.log('  2 ' + JSON.stringify(t2.rs));
  ok(t2.good >= 2, `Fire truck picks the burning car over a nearer cold one and hoses it out (${t2.good}/${t2.rs.length})`);

  // 3 Mixer: a Viper crosses 20 m in front at 11 m/s; the concrete lands ahead of it, on its path
  const t3 = !ONLY.includes(3) ? skip : await trials(3, async ({ D, sleep, until, place, setup }) => {
    const [mx, v] = setup(['mixer', 'viper']); place(mx, -40, 30, 0); place(v, -20, 8, -Math.PI / 2); mx.target = v; mx.retarget = 99; mx.mode = 'hunt'; mx.modeT = 8; mx.load = 1; mx.pourT = 0;
    v.think = function () { Object.assign(this.ctrl, { throttle: 0, steer: 0, fire: false }); }; await sleep(200);
    const hits = []; let seen = new Set(D.CONCRETE.list);
    await until(5, () => { const vb = v.body; vb.velocity.x = 0; vb.velocity.z = 11; vb.position.x = -20; vb.angularVelocity.set(0, 0, 0);
      for (const pd of D.CONCRETE.list) if (!seen.has(pd)) { seen.add(pd); if (pd.kind === 'concrete' && pd.owner === mx) hits.push({ x: +pd.x.toFixed(1), z: +pd.z.toFixed(1), vz: +vb.position.z.toFixed(1) }); } if (vb.position.z > 60) return true; });
    const ahead = hits.filter((h) => Math.abs(h.x + 20) < 5 && h.z > h.vz - 3); return { hits: hits.slice(0, 4), ahead: ahead.length };
  }, (r) => r.ahead >= 1);
  console.log('  3 ' + JSON.stringify(t3.rs));
  ok(t3.good >= 2, `Mixer drops concrete ahead of a crossing car, on its path (${t3.good}/${t3.rs.length})`);

  // 4 Tiger: a Combine crosses 40 m away at 6 m/s; the Tiger keeps its distance (20-60 m) and hits it with the cannon
  const t4 = !ONLY.includes(4) ? skip : await trials(3, async ({ D, sleep, until, place, setup }) => {
    const [tg, o] = setup(['tiger', 'combine']); place(tg, -60, -20, 0); place(o, -20, -60, Math.PI / 2); tg.target = o; tg.retarget = 99; tg.mode = 'hunt'; tg.modeT = 0; tg.reload = 0; tg.barrelBend = 0;
    o.think = function () { Object.assign(this.ctrl, { throttle: 0, steer: 0, fire: false }); }; await sleep(200); const h0 = o.health; let minD = 99, maxD = 0, dmg = 0;
    const od = o.applyDamage.bind(o); o.applyDamage = (d, by, ...a) => { if (by === tg) dmg += d; return od(d, by, ...a); };
    await until(9, (t) => { const ob = o.body; ob.velocity.z = ob.position.z > 60 ? -6 : ob.position.z < -60 ? 6 : Math.sign(ob.velocity.z || 1) * 6; ob.velocity.x = 0; ob.angularVelocity.set(0, 0, 0); if (t > 1.5) { const d = tg.body.position.distanceTo(ob.position); minD = Math.min(minD, d); maxD = Math.max(maxD, d); } });
    return { dmg: +dmg.toFixed(1), minD: +minD.toFixed(1), maxD: +maxD.toFixed(1), mode: tg.mode };
  }, (r) => r.dmg > 0 && r.minD > 18);
  console.log('  4 ' + JSON.stringify(t4.rs));
  ok(t4.good >= 2, `Tiger keeps its stand-off (over 18 m) and shells a crossing heavy (${t4.good}/${t4.rs.length})`);

  // 5 Bulldozer: a parked Cruiser points its nose at the Dozer; the Dozer comes round to blade it in the side, not head-on
  const t5 = !ONLY.includes(5) ? skip : await trials(3, async ({ D, sleep, until, place, setup }) => {
    const [dz, c] = setup(['dozer', 'cruiser']); place(dz, 80, -40, Math.PI); place(c, 60, -40, 0); dz.target = c; dz.retarget = 99; dz.mode = 'pin'; dz.lastPlan = 'pin'; dz.modeT = 14; /* (its own tactic, staged: on Build 123 there is no such mode and it just drives at it) */
    c.think = function () { Object.assign(this.ctrl, { throttle: 0, steer: 0, fire: false, handbrake: true }); }; await sleep(200);
    let side = 0, blade = 0, nose = 0; const od = c.applyDamage.bind(c); c.applyDamage = (d, by, zone, ...a) => { if (by === dz) { if (zone === 'left' || zone === 'right') side += d; if (zone === 'front' || zone === 'rear') nose += d; } return od(d, by, zone, ...a); };
    await until(14, () => { if (dz.bladeRaised) blade++; });
    return { side: +side.toFixed(1), nose: +nose.toFixed(1), blade, hp: +c.health.toFixed(0) };
  }, (r) => r.side > 5 && r.side > r.nose);
  console.log('  5 ' + JSON.stringify(t5.rs));
  ok(t5.good >= 2, `Bulldozer comes round and hits a car in the side, not the end (${t5.good}/${t5.rs.length})`);

  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok(pe.length === 0, 'no page errors ' + JSON.stringify(pe.slice(0, 3)));
  await browser.close(); console.log(fails.length ? 'CARAI FAIL' : 'CARAI PASS'); process.exit(fails.length ? 1 : 0);
})();
