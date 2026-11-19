// The Spider-Walker, round 4 (owner, 11-19, from watching it play): "When the spider is lifted by the magnet crane its legs should keep moving...
// better at jumping on top of things (containers, props, cars)... when riding a car it should clearly hold on with its legs round the roof edges...
// a bigger, clearly visible cutting/holding tool while it rides... fall off if the car crashes hard... the thread-pull sometimes hops over the car and
// misses: make it land on the roof... if it lands on a car by accident it should be able to web that car down while riding it... the AI should do it too."
// Every check here fails on Build 129, except the guards (a light bump keeps it on; the snapshot still works). Prints SPIDER4 PASS / SPIDER4 FAIL.
const { open } = require('./harness');
const seed = () => { let a = 20261121; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } }, seed);
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), CA = D.CANNON, TH = D.THREE, HULL_Y0 = -0.2;
    D.S.aiCount = 4; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    const C = D.CRANE; C.state = 'idle'; C.t = 1e9; // (the crane only moves when a check asks it to)
    const park = (c) => { c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false, handbrake: false }); };
    const place = (c, x, z, yaw = 0) => { c.body.position.set(x, c.T.walker ? 2.6 : 1.2, z); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), yaw); c.webbedT = 0; c.webAt = null; c.webFree = 0; c.poisonT = 0; };
    const until = async (f, s) => { const t0 = D.simTime; while (D.simTime - t0 < s) { for (const c of [a, b, c3, d4]) if (c && !c.isPlayer && c.health < 60) c.health = 100; if (f()) return +(D.simTime - t0).toFixed(2); await sleep(16); } return null; }; /* (no check here is about damage: the parked cars never wreck) */
    let a, b, c3, d4;
    [a, b, c3, d4] = D.cars.filter((c) => !c.isPlayer); a = D.respawnCar(a, 'viper'); b = D.respawnCar(b, 'hellbender'); c3 = D.respawnCar(c3, 'tiger'); d4 = D.respawnCar(d4, 'bertha'); for (const c of [a, b, c3, d4]) park(c);
    const away = () => { place(a, 90, 90); place(b, 100, 70); place(c3, 110, 40); place(d4, 120, 110); };
    away(); const sp = D.respawnCar(D.player, 'spider'); sp.spiderSense = () => {}; const out = {};
    const reset = () => { if (sp.latch) sp.unlatch('gone'); sp.noLatch = null; sp.pounceT = -9; sp.leapAim = null; sp.laserT = 0; sp.laserReadyAt = 0; sp.web = null; sp.webOld = null; sp.specialCd = 0; sp.webShots = 0; for (let i = 0; i < 8; i++) if (sp.wheelLost[i]) sp.refitWheel(i); sp.health = 100; sp.unlatchWhy = null; };
    const mount = async (t, x, z) => { reset(); away(); place(t, x, z, 0); t.health = 100; place(sp, x - 8, z, 0); await until(() => false, 1.2); const tf = t.body.mass < 1800 ? 1.75 : 2.1, q = t.body.position, p = sp.body.position;
      sp.leapVel = { x: (q.x - p.x) / tf, z: (q.z - p.z) / tf, t: D.simTime }; sp.ctrl.jump = true; return (await until(() => sp.latch && sp.latch.c === t, 3.5)) !== null; };
    const footLocal = (l, c) => c.body.pointToLocalFrame(new CA.Vec3(l.foot.x, l.foot.y, l.foot.z));
    const segs = (c) => { const L = sp.webLine, o = { strands: 0 }; if (!L || !L.visible) return o; const P = L.geometry.attributes.position, q = c.body.position;
      for (let i = 0; i + 1 < P.count; i += 2) { const x0 = P.getX(i), y0 = P.getY(i), z0 = P.getZ(i), x1 = P.getX(i + 1), y1 = P.getY(i + 1), z1 = P.getZ(i + 1); if (Math.hypot(x1 - x0, y1 - y0, z1 - z0) < 0.3) continue;
        if (Math.hypot(x0 - q.x, z0 - q.z) < 5 && Math.hypot(x1 - q.x, z1 - q.z) < 5 && Math.min(y0, y1) < 0.3 && Math.max(y0, y1) > 0.4) o.strands++; }
      return o; };

    // 1) the magnet crane picks the spider up: its legs kick and flail all the way up (they froze in a fixed pose)
    { reset(); const ang = C.ang, rr = 15; place(sp, C.cx + Math.cos(ang) * rr, C.cz - Math.sin(ang) * rr, 0.4); await until(() => false, 1.2); C.r = rr; C.state = 'seek'; C.target = sp; C.t = 30;
      const got = await until(() => C.held === sp, 14); const path = sp.legs.map(() => 0), prev = sp.legs.map(() => null); let n = 0, yUp = 0; const s0 = D.simTime;
      if (got !== null) while (D.simTime - s0 < 2.2 && C.held === sp) { await sleep(16); n++; yUp = Math.max(yUp, sp.body.position.y); sp.legs.forEach((l, i) => { if (!l.foot) return; const f = sp.body.pointToLocalFrame(new CA.Vec3(l.foot.x, l.foot.y, l.foot.z)); if (prev[i]) path[i] += f.vsub(prev[i]).length(); prev[i] = f; }); }
      out.crane = { got, n, yUp: +yUp.toFixed(1), path: path.map((s) => +s.toFixed(2)), moving: path.filter((s) => s > 2.5).length }; /* (a leg that only trails the lift moves ~0.6 m in all) */
      let snap = null; const MP = D.MP, room = MP.room, ns = MP.nextSnap; MP.room = { presence: (o) => { snap = o; return Promise.resolve(); }, peers: () => [] }; MP.nextSnap = 0; let err = null; try { MP.hostFrame(0.016); } catch (e) { err = String(e); } MP.room = room; MP.nextSnap = ns;
      out.crane.flag = snap ? !!(snap.s.c[D.cars.indexOf(sp)][11] & 131072) : null; out.crane.err = err;
      C.t = 0.5; await until(() => !sp.craned, 12); C.state = 'idle'; C.t = 1e9; await until(() => sp.contacts > 0 && Math.abs(sp.body.velocity.y) < 1, 6); }

    // 2) leaping on top of things: a container 14 m ahead and 3 m to the side (a plain leap would come down beside it), and a car shell prop
    const topTrial = async (x, z, yaw, tx, tz, top) => { reset(); away(); place(sp, x, z, yaw); await until(() => false, 1.2); sp.ctrl.jump = true; await until(() => sp.body.position.y > 5, 1);
      await until(() => sp.contacts > 0 && Math.abs(sp.body.velocity.y) < 1.5 && sp.airT === 0, 4); await until(() => false, 0.5); const p = sp.body.position;
      return { x: +p.x.toFixed(1), z: +p.z.toFixed(1), y: +p.y.toFixed(2), on: Math.hypot(p.x - tx, p.z - tz) < 6 && p.y > top }; }; /* (top: the lowest height its body can be at standing on it; on the ground it stands at 1.7 m) */
    out.container = await topTrial(89, -124, -Math.PI / 2, 92, -110, 3.8);
    { const shell = D.props.find((pr) => pr.body.mass === 900 && Math.hypot(pr.body.position.x, pr.body.position.z) < 120); if (shell) { shell.body.velocity.set(0, 0, 0); const q = shell.body.position, sx = q.x - 12, sz = q.z + 2.5;
        out.shell = await topTrial(sx, sz, Math.atan2(-(q.z - sz), q.x - sx) + 0.2, q.x, q.z, 2.5); out.shell.at = [+q.x.toFixed(1), +q.z.toFixed(1)]; } else out.shell = { on: false, none: true }; }

    // 3) riding a Hellbender: the legs reach down and clamp round the hull's edges (not standing on the roof or on the ground beside it); 4) the big saw/claw shows
    { const m = await mount(b, 0, 40); await until(() => false, 1.0); const T = b.T, hw = T.W / 2, hl = T.L / 2, top = HULL_Y0 + T.H + T.cabin.h; let grip = 0; const feet = [];
      if (m) for (const l of sp.legs) { if (!l.foot) continue; const f = footLocal(l, b), side = Math.abs(Math.abs(f.z) - hw) < 0.4 && Math.abs(f.x) < hl + 0.3, end = Math.abs(Math.abs(f.x) - hl) < 0.4 && Math.abs(f.z) < hw + 0.3;
        const K = sp.T.size || 1, hip = sp.body.pointToWorldFrame(new CA.Vec3(l.hip.x * K, l.hip.y * K, l.hip.z * K)), reach = Math.hypot(hip.x - l.foot.x, hip.y - l.foot.y, hip.z - l.foot.z) <= (1.15 + 1.55) * K; /* (the drawn leg really gets there) */
        feet.push([+f.x.toFixed(2), +f.y.toFixed(2), +f.z.toFixed(2), reach]); if ((side || end) && reach && f.y > HULL_Y0 - 0.15 && f.y < top - 0.15) grip++; }
      const G = sp.gripTool, box = G && G.visible ? new TH.Box3().setFromObject(G) : null, sz = box ? box.getSize(new TH.Vector3()) : null;
      const roofW = b.body.pointToWorldFrame(new CA.Vec3(0, top, 0)).y; let spin = 0; if (sp.gripSaw) { const r0 = sp.gripSaw.rotation.y; await until(() => false, 0.2); spin = Math.abs(sp.gripSaw.rotation.y - r0); }
      out.ride = { m, grip, feet, tool: !!(G && G.visible), size: sz ? +Math.max(sz.x, sz.y, sz.z).toFixed(2) : 0, low: box ? +(box.min.y - roofW).toFixed(2) : null, spin: +spin.toFixed(2) };
      reset(); await until(() => false, 0.3); out.ride.toolOff = !(sp.gripTool && sp.gripTool.visible); await until(() => sp.contacts > 0, 3); }

    // 5) a hard crash on the ridden car throws it off: a Hellbender slams into the Viper it rides at 16 m/s. A light bump (6 m/s) doesn't
    { const m = await mount(a, 0, 40); place(b, 0, 31, -Math.PI / 2); await until(() => false, 0.4); let off = null, why = null;
      if (m) off = await until(() => { if (b.body.position.z < a.body.position.z - 3) b.body.velocity.z = 6; return !sp.latch; }, 1.5); why = sp.unlatchWhy; /* (the Tiger driven into it) */ out.bump = { m, off, why };
      const m2 = await mount(a, 0, 40); place(b, 0, 30, -Math.PI / 2); await until(() => false, 0.3); let off2 = null; if (m2) off2 = await until(() => { if (b.body.position.z < a.body.position.z - 3) b.body.velocity.z = 16; return !sp.latch; }, 1.5);
      out.crash = { m: m2, off: off2, why: sp.unlatchWhy }; reset(); await until(() => sp.contacts > 0, 3); }

    // 6) the thread-pull lands on the roof: a car held 10-35 m away (here and there, at an angle); in half the trials its hold runs out as the spider takes off and it floors it
    { // [distance, side offset, the car's heading, 1: it floors it as the hold runs out (2: and turns), x/z of the spider; w: next to a wall (the web drags it there), p: it pounced on something 1 s ago]
      const trials = [[10, 0, 0, 0, -40, -70], [16, 3, 0.6, 1, -40, -70], [22, -4, 1.4, 0, -40, -70, 'p'], [28, 2, -0.8, 2, -40, -70], [33, -3, 2.2, 0, -40, -70], [13, -2, Math.PI, 1, -40, -70, 'p'], [31, 5, 0.3, 2, -40, -70],
        [19, 0, -1.6, 1, -40, -70], [18, 0, Math.PI / 2, 0, 12, -141, 'w'], [28, 2, Math.PI / 2, 0, 114, 10, 'w'], [12, 0, 0.4, 2, -40, -70, 'p'], [17, 1, 0.5, 0, -40, -70, 't'], [24, -2, 2.6, 1, -40, -70, 'B'], [14, 0, -0.4, 0, -40, -70, 'B']]; const res = []; /* (t: the Tiger, turret and all; B: Big Bertha) */
      for (let i = 0; i < trials.length; i++) { const [d, off, yaw, mv, x0, z0, how] = trials[i], t = how === 't' ? c3 : how === 'B' ? d4 : i % 2 ? a : b; reset(); away(); place(sp, x0, z0, 0); place(t, x0 + d, z0 + off, yaw); t.health = 100; await until(() => false, 1.0);
        D.setPick(t); sp.ctrl.fire = true; await until(() => t.webbedT > 0, 0.4); D.setPick(null); await until(() => false, 0.4); const tied = !!(sp.web && sp.web.t === t), mode = sp.web && sp.web.mode;
        if (how === 'p') sp.pounceT = D.simTime - 0.3; if (mv) { t.webbedT = 0.25; t.ctrl.throttle = 1; t.ctrl.steer = mv === 2 ? 0.5 : 0; } sp.ctrl.jump = true; let vh = 0, past = false; const s1 = D.simTime;
        const got = await until(() => { const v = sp.body.velocity, q = t.body.position, p = sp.body.position; vh = Math.max(vh, Math.hypot(v.x - t.body.velocity.x, v.z - t.body.velocity.z));
          if (sp.airT > 0.1 && Math.hypot(p.x - q.x, p.z - q.z) > Math.max(t.T.L, t.T.W) * 0.5 + 1.5 && ((p.x - q.x) * (v.x - t.body.velocity.x) + (p.z - q.z) * (v.z - t.body.velocity.z)) > 0 && D.simTime - s1 > 0.3 && sp.body.position.y < q.y + 3) past = true;
          return sp.latch && sp.latch.c === t; }, 3.2);
        res.push({ d, mv, how, mode, tied, got, vh: +vh.toFixed(1), past, why: sp.leapWhy }); t.ctrl.throttle = 0; t.ctrl.steer = 0; }
      out.pulls = res; reset(); await until(() => sp.contacts > 0, 3); }
    // ...and an ordinary aimed leap at a Viper crossing in front at 9 m/s, three times: no overshoot
    { const res = []; for (let i = 0; i < 3; i++) { reset(); away(); place(sp, -60, 20 + i * 30, 0); place(a, -48 + i * 4, 13 + i * 30, -Math.PI / 2); await until(() => false, 1.0); let got = null;
        const s1 = D.simTime; sp.ctrl.jump = true; got = await until(() => { a.body.velocity.set(0, a.body.velocity.y, 9); a.body.angularVelocity.set(0, 0, 0); return sp.latch && sp.latch.c === a; }, 3.2); res.push({ got, aim: !!sp.leapAim || got !== null }); }
      out.leaps = res; reset(); a.body.velocity.set(0, 0, 0); await until(() => sp.contacts > 0, 3); }

    // 7) landed on a Viper by accident (a leap, not a pull): F webs the car it rides down to the ground (the strands round it), it holds on, and F again is the laser (the ordinary one: the big beam stays the thread-pull combo's)
    { const m = await mount(a, 0, 40); let webbed = false, still = false, strands = 0, pin = false, held = 0;
      if (m) { sp.specialCd = 0; sp.webShots = 0; sp.ctrl.fire = true; webbed = (await until(() => a.webbedT > 0 && a.webBy === sp, 0.5)) !== null; await until(() => false, 0.3); strands = segs(a).strands; still = !!(sp.latch && sp.latch.c === a);
        a.ctrl.throttle = 1; const s1 = D.simTime; let p0 = a.body.position.clone(), moved = 0; sp.ctrl.fire = true; pin = (await until(() => sp.laserT > 0, 1.0)) !== null; const big = !!sp.laserPin;
        while (D.simTime - s1 < 2) { if (sp.latch && sp.latch.c === a) held = D.simTime - s1; if (a.webbedT > 0) moved = Math.max(moved, a.body.position.vsub(p0).length()); a.health = Math.max(a.health, 50); await sleep(16); } a.ctrl.throttle = 0; out.rideWeb = { m, webbed, strands, still, pin, big, held: +held.toFixed(2), moved: +moved.toFixed(2) }; }
      else out.rideWeb = { m }; reset(); await until(() => sp.contacts > 0, 3); }

    // 8) the AI spider does it too: an AI spider that lands on the (player's) Viper webs it down from the roof and lasers it
    { away(); const pv = D.respawnCar(sp, 'viper'); park(pv); place(pv, -40, 20, Math.PI); pv.health = 100; let ai = D.respawnCar(b, 'spider'); ai.spiderSense = () => {}; place(ai, -48, 20, 0); ai.target = pv; await until(() => { ai.specialCd = 99; pv.webbedT = 0; return false; }, 1.2); /* (no web or laser on the way: it has to web the car it lands on) */
      const q = pv.body.position, p = ai.body.position; ai.leapVel = { x: (q.x - p.x) / 1.75, z: (q.z - p.z) / 1.75, t: D.simTime, c: pv }; ai.jumpBuf = 0.35; const seen = { latched: false, webbedRiding: false, pinLaser: false }; let lat = null;
      const s0 = D.simTime; while (D.simTime - s0 < 7 && !seen.pinLaser) { pv.health = Math.max(pv.health, 40); ai.health = 100; if (!seen.latched) { ai.specialCd = 99; pv.webbedT = 0; } if (ai.latch && ai.latch.c === pv) { if (!seen.latched) { seen.latched = true; lat = D.simTime; ai.specialCd = 0; ai.webShots = 0; ai.laserT = 0; ai.laserReadyAt = 0; } if (pv.webbedT > 0 && pv.webBy === ai && pv.webSince >= lat - 0.05) seen.webbedRiding = true; if (seen.webbedRiding && ai.laserT > 0) seen.pinLaser = true; } await sleep(16); }
      seen.t = +(D.simTime - s0).toFixed(1); seen.rode = lat !== null ? +(lat - s0).toFixed(2) : null; out.ai = seen; }
    return out; });
  console.log('  ' + JSON.stringify(r));
  const Cr = r.crane; ok(Cr.got !== null && Cr.n > 20 && Cr.moving >= 6, `on the crane's magnet the legs kick: ${Cr.moving}/8 feet travel more than 2.5 m in 2.2 s (${Cr.path.join(' ')}) while it's lifted to ${Cr.yUp} m`);
  ok(Cr.flag === true && !Cr.err, `the snapshot tells guests it's kicking (flag 131072: ${Cr.flag}) ${Cr.err || ''}`);
  ok(r.container.on, `a leap lands on top of a container 14 m ahead, 3 m off to the side (came down at ${r.container.x}, ${r.container.z}, ${r.container.y} m up)`);
  ok(r.shell.on, `a leap lands on top of a wrecked-car prop (came down at ${r.shell.x}, ${r.shell.z}, ${r.shell.y} m up; prop at ${r.shell.at})`);
  const R = r.ride; ok(R.m && R.grip >= 6, `riding a Hellbender the legs clamp round its hull: ${R.grip}/8 feet on the hull's sides and ends below the roof line ${JSON.stringify(R.feet)}`);
  ok(R.tool && R.size >= 1.1 && R.low !== null && R.low < 0.6 && R.spin > 0.5 && R.toolOff, `riding, a big saw and claws grip the roof: ${R.size} m across, reaching ${R.low} m from the roof, the saw spinning (${R.spin} rad in 0.2 s); put away when it gets off (${R.toolOff})`);
  ok(r.crash.m && r.crash.off !== null && r.crash.why === 'crash', `a hard crash on the ridden Viper (a Hellbender at 16 m/s) throws it off: ${r.crash.off} s, ${r.crash.why}`);
  ok(r.bump.m && r.bump.off === null, `a light bump (6 m/s) doesn't: still on after 1.5 s (${r.bump.why || 'held'})`);
  const P = r.pulls, landed = P.filter((x) => x.tied && x.got !== null).length, over = P.filter((x) => x.past).length, vmax = Math.max(...P.map((x) => x.vh));
  ok(landed === P.length && over === 0, `thread-pull onto a car 10-35 m away (half of them driving off): ${landed}/${P.length} land on the roof, ${over} overshoot ${JSON.stringify(P)}`);
  ok(vmax <= 21, `the thread-pull is never faster than it needs to be: at most ${vmax} m/s across (was up to 26)`);
  const LP = r.leaps; ok(LP.filter((x) => x.got !== null).length === LP.length, `an aimed leap at a Viper crossing at 9 m/s lands on it ${LP.filter((x) => x.got !== null).length}/${LP.length} times ${JSON.stringify(LP)}`);
  const W = r.rideWeb; ok(W.m && W.webbed && W.still && W.strands >= 8, `landed on a Viper, F webs the car it rides down (${W.webbed}, ${W.strands} strands round it) and it holds on (${W.still})`);
  ok(W.m && W.pin && !W.big && W.held >= 1.9 && W.moved < 1.2, `...F again is the laser (${W.pin}; the big combo beam: ${W.big}), it stays on ${W.held} s while the Viper floors it and goes nowhere (${W.moved} m)`);
  ok(r.ai.latched && r.ai.webbedRiding && r.ai.pinLaser, `the AI spider that lands on a car webs it down from its roof (${r.ai.webbedRiding}) and lasers it (${r.ai.pinLaser}): on the roof at ${r.ai.rode} s, done at ${r.ai.t} s`);
  const pe = errors.filter((e) => e.startsWith('pageerror') || /frame error/.test(e)); ok(!pe.length, 'no page or frame errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'SPIDER4 FAIL' : 'SPIDER4 PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
