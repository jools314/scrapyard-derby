// Per-car AI (CAR_AI, docs/car-roles.md): each car does its signature thing in a staged scene. Every check fails on Build 123
// (before per-car AI the five shared personalities drove every car alike, and the gadgets fired at random).
//   1 Viper disengages from a Dozer charging at it (sidesteps, takes no blade, stays in the fight)
//   2 Fire truck goes for the burning car (not the nearer cold one) and hoses it out
//   3 Mixer lobs concrete ahead of a car crossing in front of it, onto its path
//   4 Tiger, kiting, holds its stand-off range and shells a crossing car
//   5 Bulldozer comes round and puts its blade into the side of a car facing it nose-on
//   6 Spider (its combo, on Build 137): webs the car it hunts, reels in on the thread and gives it the big beam from the roof; doesn't go off to perch
//   7 Buzzsaw Hover saw-rams: slides into a car with a saw flank, not its nose
//   8 Jet holds its range and lasers a light car; 9 Jet picks the cop car over a nearer Viper and rams its cash loose
//   0 Ann (the tsunami): an AI Jet drives at the wave and launches her, and she goes for a heavy wading in the flood (not a car up on a platform), hurting it, staying afloat
// ONLY=135 runs just those scenes.
// Each scene runs up to 3 times (the AI has dice in it); a check passes on 2 of 3.
const { open } = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } });
  await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.S.aiCount = 4; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100); D.game.grace = 0; D.TSU.at = D.TSU.win = Infinity; });
  const scene = (name, fn) => page.evaluate(async ({ name, src }) => {
    const D = __derby, CA = D.CANNON, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    if (D.game.state !== 'playing') { D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100); D.game.grace = 0; } // (a scene that wrecked every other car, or the player, ended the match: a fresh one)
    if (D.TSU.state === 'idle') D.TSU.at = D.TSU.win = Infinity; // no tsunami of its own in a staged scene (one in three matches gets one 70-220 s in, about when the Jet scenes run: the Jet then drives into the wave and Ann launches); scene 0 starts its own
    const until = async (secs, each) => { const s0 = D.simTime; while (D.simTime - s0 < secs) { if (each && each(D.simTime - s0)) break; await sleep(16); } };
    const place = (c, x, z, yaw = 0) => { c.body.position.set(x, 1.4, z); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), yaw); c.body.wakeUp(); };
    const park = (c, k) => { c.think = function () { Object.assign(this.ctrl, { throttle: 0, steer: 0, fire: false, nitro: false, jump: false, handbrake: true }); }; place(c, -120 + k * 12, 135); };
    const setup = (types) => { // AI cars respawned as the given types (the rest and the player parked in a far corner)
      const ai = D.cars.filter((c) => !c.isPlayer), out = [];
      for (let i = 0; i < ai.length; i++) { const c = D.respawnCar(ai[i], types[i] || 'forklift'); c.health = 100; if (i >= types.length) park(c, i); else out.push(c); }
      const p = D.player; p.body.position.set(120, 1.4, 135); p.body.velocity.set(0, 0, 0); p.health = 100; for (const c of D.cars) { c.lastAttacker = null; }
      for (const c of D.cars) if (c.isPlayer) c.ghost = false;
      D.CONCRETE.list.slice().forEach((pd) => { pd.t = Math.min(pd.t, 0.05); }); D.CASH.reset(); return out; }; // (and no cash left lying from the trial before: the Jet would go for that loot first)
    const drive = (c, steerTo) => { c.think = function () { const b = this.body, q = steerTo(); const l = b.pointToLocalFrame(new CA.Vec3(q.x, b.position.y, q.z)); const a = Math.atan2(-l.z, l.x); Object.assign(this.ctrl, { throttle: 1, steer: Math.max(-1, Math.min(1, a * 1.8)), fire: false, nitro: false, jump: false, handbrake: false }); }; };
    return await (eval('(' + src + ')'))({ D, CA, sleep, until, place, park, setup, drive });
  }, { name, src: fn.toString() });
  const ONLY = (process.env.ONLY || '1234567890').split('').map(Number), skip = { rs: [], good: 2 };
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
    const [tg, o] = setup(['tiger', 'combine']); place(tg, -60, -20, 0); place(o, -20, -60, Math.PI / 2); tg.target = o; tg.retarget = 99; tg.mode = 'kite'; tg.lastPlan = 'kite'; tg.modeT = 12; /* (its own tactic, staged: Build 123 has no such mode and just drives at it) */ tg.reload = 0; tg.barrelBend = 0;
    o.think = function () { Object.assign(this.ctrl, { throttle: 0, steer: 0, fire: false }); }; await sleep(200); const h0 = o.health; let minD = 99, maxD = 0, dmg = 0, sumD = 0, nD = 0;
    const od = o.applyDamage.bind(o); o.applyDamage = (d, by, ...a) => { if (by === tg) dmg += d; return od(d, by, ...a); };
    await until(9, (t) => { const ob = o.body; ob.velocity.z = ob.position.z > 60 ? -6 : ob.position.z < -60 ? 6 : Math.sign(ob.velocity.z || 1) * 6; ob.velocity.x = 0; ob.angularVelocity.set(0, 0, 0); if (t > 1.5) { const d = tg.body.position.distanceTo(ob.position); minD = Math.min(minD, d); maxD = Math.max(maxD, d); sumD += d; nD++; } });
    return { dmg: +dmg.toFixed(1), meanD: +(sumD / Math.max(1, nD)).toFixed(1), minD: +minD.toFixed(1), maxD: +maxD.toFixed(1), mode: tg.mode };
  }, (r) => r.dmg > 0 && r.meanD > 15.5);
  console.log('  4 ' + JSON.stringify(t4.rs));
  ok(t4.good >= 2, `Tiger keeps its stand-off (over 15.5 m on average; Build 123 averages ~13) and shells a crossing heavy (${t4.good}/${t4.rs.length})`);

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

  // 6 Spider: next to a one-high container (a perch it could climb and wait on, perching due) with a Viper driving slowly 30 m off;
  //   its own combo instead (web, thread-pull, big beam from the roof); on the Build 124 AI it climbs the container and waits
  const t6 = !ONLY.includes(6) ? skip : await trials(3, async ({ D, sleep, until, place, setup }) => {
    const [sp, v] = setup(['spider', 'viper']); place(sp, 92, -97, Math.PI); place(v, 62, -85, Math.PI / 2); sp.target = v; sp.retarget = 99; sp.mode = 'hunt'; sp.modeT = 20; sp.perchNext = 0; sp.perch = null;
    v.think = function () { Object.assign(this.ctrl, { throttle: 0, steer: 0, fire: false }); }; await sleep(200); const h0 = v.health; const seen = { webbed: false, pulled: false, pinLaser: false, perched: false };
    await until(16, () => { const vb = v.body; if (!(v.webbedT > 0) && !v.latchedBy) { vb.velocity.z = vb.position.z > -60 ? -4 : vb.position.z < -110 ? 4 : Math.sign(vb.velocity.z || 1) * 4; vb.velocity.x = 0; }
      v.health = Math.max(v.health, 30); sp.health = 100; if (v.webbedT > 0 && v.webBy === sp) seen.webbed = true; if (sp.leapWhy === 'pulled' || sp.leapWhy === 'pull') seen.pulled = true; if (sp.perch) seen.perched = true;
      if (sp.laserT > 0 && sp.laserPin) { seen.pinLaser = true; return true; } });
    return { ...seen, dmg: +(h0 - v.health).toFixed(1) };
  }, (r) => r.webbed && r.pinLaser && !r.perched);
  console.log('  6 ' + JSON.stringify(t6.rs));
  ok(t6.good >= 2, `Spider webs its target, reels in on the thread and fires the big beam from its roof, and doesn't go off to perch (${t6.good}/${t6.rs.length})`);

  // 7 Buzzsaw Hover: a parked Tow truck 30 m ahead (boost held back): it slides in and swings a saw flank into it, not its nose
  const t7 = !ONLY.includes(7) ? skip : await trials(3, async ({ D, sleep, until, place, setup }) => {
    const [hv, o] = setup(['hover', 'towtruck']); place(hv, -60, 40, 0); place(o, -30, 40, Math.PI / 2); hv.target = o; hv.retarget = 99; hv.mode = 'hunt'; hv.modeT = 12; hv.sawHits = 0;
    o.think = function () { Object.assign(this.ctrl, { throttle: 0, steer: 0, fire: false, handbrake: true }); }; await sleep(200); let dmg = 0, swing = 0;
    const od = o.applyDamage.bind(o); o.applyDamage = (d, by, ...a) => { if (by === hv) dmg += d; return od(d, by, ...a); };
    await until(16, () => { hv.boostCd = 9; hv.bombCd = 9; hv.health = 100; o.health = Math.max(o.health, 40); if (hv.mode === 'flee') hv.mode = 'hunt'; if (hv.sawSwing) swing++; });
    return { sawHits: hv.sawHits || 0, swing, dmg: +dmg.toFixed(1) };
  }, (r) => r.sawHits >= 1 && r.dmg > 5);
  console.log('  7 ' + JSON.stringify(t7.rs));
  ok(t7.good >= 2, `Buzzsaw Hover saw-rams: slides into a car flank-first: a saw hit and over 5 damage in 16 s (Build 124 AI: no saw hits, ~1.4 damage) (${t7.good}/${t7.rs.length})`);

  // 8 Jet: a Viper crossing 34 m away; the Jet kites it with the roof laser (holds its range, hits it)
  const t8 = !ONLY.includes(8) ? skip : await trials(3, async ({ D, sleep, until, place, setup }) => {
    const [j, v] = setup(['jet', 'viper']); place(j, -60, -20, 0); place(v, -26, -40, Math.PI / 2); j.target = v; j.retarget = 99; j.mode = 'kite'; j.lastPlan = 'kite'; j.modeT = 12; j.lzBat = 1; j.lzLock = 0;
    v.think = function () { Object.assign(this.ctrl, { throttle: 0, steer: 0, fire: false }); }; await sleep(200); let dmg = 0, sumD = 0, nD = 0, fired = 0;
    const od = v.applyDamage.bind(v); v.applyDamage = (d, by, ...a) => { if (by === j) dmg += d; return od(d, by, ...a); };
    await until(9, (t) => { const vb = v.body; vb.velocity.z = vb.position.z > 50 ? -6 : vb.position.z < -50 ? 6 : Math.sign(vb.velocity.z || 1) * 6; vb.velocity.x = 0; vb.angularVelocity.set(0, 0, 0); v.health = Math.max(v.health, 40); j.health = 100; if (j.lzOn) fired++;
      if (t > 1.5) { sumD += j.body.position.distanceTo(vb.position); nD++; } });
    return { dmg: +dmg.toFixed(1), meanD: +(sumD / Math.max(1, nD)).toFixed(1), fired, mode: j.mode, tgt: j.target && j.target.type, wet: +(j.wet || 0).toFixed(2), hulk: !!j.hulk, in: D.cars.includes(j), think: j.think === Object.getPrototypeOf(j).think };
  }, (r) => r.dmg > 3 && r.meanD > 12);
  console.log('  8 ' + JSON.stringify(t8.rs));
  ok(t8.good >= 2, `Jet holds its range (over 12 m) and lasers a crossing Viper (${t8.good}/${t8.rs.length})`);

  // 9 Jet vs the cop: a Viper 20 m away and the Cruiser 32 m away; the pirate picks the cop, rams it and its cash flies out (on the Build 124 AI it goes for the nearer Viper)
  const t9 = !ONLY.includes(9) ? skip : await trials(3, async ({ D, sleep, until, place, setup }) => {
    const [j, cr, v] = setup(['jet', 'cruiser', 'viper']); place(j, 40, 60, 0); place(cr, 72, 60, Math.PI / 2); place(v, 40, 80, 0); j.target = null; j.retarget = 0; j.mode = 'hunt'; j.modeT = 3;
    cr.think = v.think = function () { Object.assign(this.ctrl, { throttle: 0, steer: 0, fire: false, handbrake: true }); }; await sleep(100); const d0 = D.CASH.drops; let onCop = 0, n = 0;
    await until(14, () => { cr.health = Math.max(cr.health, 40); v.health = 100; j.health = 100; n++; if (j.target === cr) onCop++; });
    return { drops: D.CASH.drops - d0, jetGot: j.plunder || 0, onCop: +(onCop / Math.max(1, n)).toFixed(2) };
  }, (r) => r.drops >= 1 && r.onCop > 0.5);
  console.log('  9 ' + JSON.stringify(t9.rs));
  ok(t9.good >= 2, `Jet goes for the cop car over a nearer Viper and rams its cash loose (${t9.good}/${t9.rs.length})`);

  // 0 Ann: a tsunami with an AI Jet in the yard: it drives at the wave (north) and she launches; then she picks the Tiger wading in the flood over a nearer Viper up on a platform, rings it and hurts it, afloat nearly all the time
  //   (on Build 139 as first written the Jet's wave and loot aims came after its steering and did nothing: it drove off south after the Tiger and only launched Ann because the wave got to it anyway)
  const t0 = !ONLY.includes(0) ? skip : await trials(1, async ({ D, CA, sleep, until, place, setup }) => {
    const [j, tg, v] = setup(['jet', 'tiger', 'viper']); let E = null; for (let x = -140; x <= 140 && !E; x += 4) for (let z = -140; z <= 140 && !E; z += 4) { const e = D.platformOf({ x, y: 30, z }); if (e && e.y > 2.5 && e.x1 - e.x0 > 6 && e.z1 - e.z0 > 6) E = e; }
    if (!E) return { launched: false, noPlatform: true };
    const ex = (E.x0 + E.x1) / 2, ez = (E.z0 + E.z1) / 2, sx = ex > 0 ? -1 : 1, sz = ez > 0 ? -1 : 1;
    const ground = (x, z) => { let y = 0; D.world.raycastAll(new CA.Vec3(x, 12, z), new CA.Vec3(x, -1, z), { skipBackfaces: true }, (r) => { if (r.body && r.body.mass === 0 && r.hitPointWorld.y > y) y = r.hitPointWorld.y; }); return y; }; // (the yard itself, not the cars on it)
    let shore = 18; while (shore < 40 && [0, 1, 2, 3, 4, 5, 6].some((k) => ground(ex + sx * (shore + k), ez) > 0.05)) shore++; // the foot of the platform's slope (a mesa is much wider at the base than on top): Ann starts in open water past it, not on the bank
    const ax = ex + sx * (shore + 3); place(v, ex, ez, 0); v.body.position.y = E.y + 1.4;
    place(j, ex + sx * 30, ez, 0); place(tg, ex + sx * 45, ez + sz * 25, Math.PI / 2); j.target = tg; j.retarget = 99; // (the Tiger out in open water, clear of the platform's ramp)
    tg.think = function () { Object.assign(this.ctrl, { throttle: 0, steer: 0, fire: false, handbrake: true }); }; v.think = tg.think; tg.reload = 99; await sleep(200);
    const z0 = j.body.position.z; D.startTsunami(true); let ann = null; await until(30, () => { ann = D.cars.find((c) => c.type === 'ann' && !c.isPlayer); return !!ann; });
    if (!ann) return { launched: false, state: D.TSU.state };
    const toWave = +(z0 - ann.body.position.z).toFixed(1); // how far north (towards the wave, which comes over the north wall) the Jet drove before Ann launched
    await until(30, () => D.TSU.state === 'flood'); let dmg = 0, n = 0, afloat = 0, onTiger = 0; const od = tg.applyDamage.bind(tg); tg.applyDamage = (d, by, ...a) => { if (by === ann) dmg += d; return od(d, by, ...a); };
    ann.body.position.set(ax, D.TSU.level + 0.4, ez); ann.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), sx > 0 ? 0 : Math.PI); ann.body.velocity.set(0, 0, 0); ann.body.angularVelocity.set(0, 0, 0); ann.target = null; ann.retarget = 0; await sleep(300); // (on open water facing away from the bank, the Viper on the platform nearer than the Tiger)
    const vD = +Math.hypot(ax - ex, 0).toFixed(1), tD = +Math.hypot(tg.body.position.x - ax, tg.body.position.z - ez).toFixed(1);
    await until(14, () => { tg.health = Math.max(tg.health, 40); v.health = 100; ann.health = 100; tg.reload = 99; n++; if (ann.afloat) afloat++; if (ann.target === tg) onTiger++; });
    return { launched: true, toWave, dmg: +dmg.toFixed(1), afloat: +(afloat / Math.max(1, n)).toFixed(2), onTiger: +(onTiger / Math.max(1, n)).toFixed(2), vOnPlat: !!D.platformOf(v.body.position), vD, tD };
  }, (r) => r.launched && r.toWave > 8 && r.vD < r.tD && r.dmg > 3 && r.afloat > 0.8 && r.onTiger > 0.6);
  console.log('  0 ' + JSON.stringify(t0.rs));
  ok(t0.good >= 1, `Ann: an AI Jet drives at the tsunami wave and launches her; she goes for the Tiger wading in the flood, not the nearer Viper up on a platform, hurts it and stays afloat (${t0.good}/${t0.rs.length})`);

  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok(pe.length === 0, 'no page errors ' + JSON.stringify(pe.slice(0, 3)));
  await browser.close(); console.log(fails.length ? 'CARAI FAIL' : 'CARAI PASS'); process.exit(fails.length ? 1 : 0);
})();
