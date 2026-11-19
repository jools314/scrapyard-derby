// The Spider-Walker, round 3 (owner, 11-19, from playing): "When the spider webs a car to the ground, put more webbing around the car so it's clearly held
// to the ground for some time, and the webbing should disappear incrementally... With a car webbed and the web line still attached, pressing jump should
// pull the spider along the thread to the car and land it on top of the roof... Then it can hurt the car from above while it's stuck: the laser bigger
// and stronger, a beam going down into the car... Make the AI spider use the combo sometimes."
// Every check here fails on Build 127, except two guards that must keep passing: J with no car on the line is still the ordinary leap, and the combo is no instant kill on a heavy. Prints SPIDER3 PASS / SPIDER3 FAIL.
const { open } = require('./harness');
const seed = () => { let a = 20261120; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } }, seed);
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), CA = D.CANNON, TH = D.THREE;
    D.S.aiCount = 3; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    const park = (c) => { c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false, handbrake: false }); };
    const place = (c, x, z, yaw = 0) => { c.body.position.set(x, c.T.walker ? 2.6 : 1.2, z); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), yaw); c.webbedT = 0; c.webAt = null; c.webFree = 0; c.webSnag = false; c.poisonT = 0; };
    const until = async (f, s) => { const t0 = D.simTime; while (D.simTime - t0 < s) { if (f()) return +(D.simTime - t0).toFixed(2); await sleep(16); } return null; };
    let [a, b, c3] = D.cars.filter((c) => !c.isPlayer); a = D.respawnCar(a, 'viper'); b = D.respawnCar(b, 'hellbender'); c3 = D.respawnCar(c3, 'tiger'); for (const c of [a, b, c3]) park(c);
    const away = () => { place(a, 90, 90); place(b, 100, 70); place(c3, 110, 40); };
    away(); const sp = D.respawnCar(D.player, 'spider'); sp.spiderSense = () => {}; const out = {};
    const reset = () => { if (sp.latch) sp.unlatch('gone'); sp.noLatch = null; sp.pounceT = -9; sp.leapAim = null; sp.laserT = 0; sp.laserReadyAt = 0; sp.web = null; sp.webOld = null; for (let i = 0; i < 8; i++) if (sp.wheelLost[i]) sp.refitWheel(i); sp.health = 100; };
    const web = async (c) => { sp.specialCd = 0; sp.webShots = 0; sp.ctrl.fire = true; return (await until(() => c.webbedT > 0, 0.4)) !== null; };
    const segs = (c) => { const L = sp.webLine, o = { strands: 0, near: 0, cable: false }; if (!L || !L.visible) return o; const P = L.geometry.attributes.position, q = c.body.position, s = sp.body.position;
      for (let i = 0; i + 1 < P.count; i += 2) { const x0 = P.getX(i), y0 = P.getY(i), z0 = P.getZ(i), x1 = P.getX(i + 1), y1 = P.getY(i + 1), z1 = P.getZ(i + 1), len = Math.hypot(x1 - x0, y1 - y0, z1 - z0); if (len < 0.3) continue;
        const n0 = Math.hypot(x0 - q.x, z0 - q.z) < 5, n1 = Math.hypot(x1 - q.x, z1 - q.z) < 5; if (n0 && n1) o.near++;
        if (n0 && n1 && Math.min(y0, y1) < 0.3 && Math.max(y0, y1) > 0.4) o.strands++;
        if ((Math.hypot(x0 - s.x, z0 - s.z) < 3 && n1) || (Math.hypot(x1 - s.x, z1 - s.z) < 3 && n0)) o.cable = true; }
      return o; };

    // 1) the held state: a Viper webbed 14 m ahead, flooring it. Lots of webbing round it, which lets go strand by strand as the hold runs out; the line stays attached the whole hold
    { reset(); place(sp, 0, 60, 0); place(a, 14, 60); a.health = 100; await until(() => false, 1.0); const hit = await web(a); const p0 = a.body.position.clone(); a.ctrl.throttle = 1;
      const hold0 = +a.webbedT.toFixed(2), s0 = D.simTime, samples = []; let moved = 0, heldFor = null;
      while (D.simTime - s0 < 6) { const t = D.simTime - s0; if (a.webbedT > 0) { moved = Math.max(moved, a.body.position.vsub(p0).length()); const g = segs(a); samples.push([+t.toFixed(2), g.strands, g.near, g.cable]); } else if (heldFor === null) heldFor = +t.toFixed(2); a.health = 100; await sleep(16); }
      a.ctrl.throttle = 0; const at = (f) => samples.reduce((best, s) => (Math.abs(s[0] - f * heldFor) < Math.abs(best[0] - f * heldFor) ? s : best), samples[0]);
      out.hold = { hit, hold0, heldFor, moved: +moved.toFixed(2), early: at(0.08), mid: at(0.5), late: at(0.85), lastCable: samples.length ? samples[samples.length - 1][3] : false, lastT: samples.length ? samples[samples.length - 1][0] : 0 }; }
    // ...a heavy (the Tiger) is held for less
    { reset(); place(sp, 0, 60, 0); place(a, 90, 90); place(c3, 15, 60); await until(() => false, 1.0); await web(c3); out.heavy = { hold0: +c3.webbedT.toFixed(2) }; await until(() => false, 3.5); }
    // 2) no perma-lock: a web on the same Viper every 0.8 s for 13 s (far more than one spider's bursts can do)
    { reset(); away(); place(sp, 0, 60, 0); place(a, 14, 60); await until(() => false, 1.0); let held = 0, run = 0, longest = 0, gap = 0, gapMax = 0, nextShot = 0; const s0 = D.simTime; let last = D.simTime;
      while (D.simTime - s0 < 13) { const t = D.simTime - s0, dt = D.simTime - last; last = D.simTime; if (t >= nextShot) { nextShot += 0.8; sp.specialCd = 0; sp.webShots = 0; sp.ctrl.fire = true; }
        if (a.webbedT > 0) { held += dt; run += dt; gap = 0; longest = Math.max(longest, run); } else { run = 0; gap += dt; gapMax = Math.max(gapMax, gap); } a.health = 100; sp.health = 100; await sleep(16); }
      out.lock = { held: +(held / 13).toFixed(2), longest: +longest.toFixed(2), gapMax: +gapMax.toFixed(2) }; place(a, 90, 90); await until(() => false, 3.5); }

    // 3) the thread-pull: a Hellbender webbed 16 m (then 30 m) ahead; J reels the spider in along the line, low and fast, onto its roof
    const pullTrial = async (dist) => { reset(); away(); place(sp, -30, -60, 0); place(b, -30 + dist, -60, Math.PI); b.health = 100; await until(() => false, 1.0); const hit = await web(b); await until(() => false, 0.5);
      const y0 = sp.body.position.y; let ymax = y0; const tethered = !!(sp.web && sp.web.t === b); sp.ctrl.jump = true;
      const t = await until(() => { ymax = Math.max(ymax, sp.body.position.y); return sp.latch && sp.latch.c === b; }, 3);
      return { hit, tethered, t, rise: +(ymax - y0).toFixed(2), why: sp.leapWhy, pinned: b.webbedT > 0 }; };
    out.pull16 = await pullTrial(16);
    // ...on its roof, still held down: F (with the web still recharging) fires the big laser straight down. How much does 1.5 s of it cut?
    { const L = { on: false, pin: false, wmax: 0, down: false, lost: 0 }; if (sp.latch && sp.latch.c === b) { b.health = 100; sp.specialCd = 3; const h0 = b.health; sp.ctrl.fire = true; L.on = (await until(() => sp.laserT > 0, 0.3)) !== null;
        const up = new TH.Vector3(); await until(() => { const M = sp.laserBeam; if (M && M.visible) { L.wmax = Math.max(L.wmax, M.scale.x); up.set(0, 1, 0).applyQuaternion(M.quaternion); if (up.y < -0.9) L.down = true; } L.pin = L.pin || !!sp.laserPin; return false; }, 1.5);
        L.lost = +(h0 - b.health).toFixed(1); L.stillPinned = b.webbedT > 0; }
      out.pinLaser = L; }
    // ...the same 1.5 s from a Hellbender's roof that isn't webbed down (the ordinary laser)
    { reset(); away(); place(b, 0, 40, 0); b.health = 100; place(sp, -8, 40, 0); await until(() => false, 1.2); const tf = 2.1, q = b.body.position, p = sp.body.position;
      sp.leapVel = { x: (q.x - p.x) / tf, z: (q.z - p.z) / tf, t: D.simTime }; sp.ctrl.jump = true; const m = (await until(() => sp.latch && sp.latch.c === b, 3)) !== null; const L = { mounted: m, wmax: 0, lost: 0 };
      if (m) { b.health = 100; sp.specialCd = 0; b.webFree = D.simTime + 9; /* (since spider4 F on a car it rides that isn't held webs it first: this one has just torn free, so F is the ordinary laser) */ const h0 = b.health; sp.ctrl.fire = true; await until(() => sp.laserT > 0, 0.3); await until(() => { const M = sp.laserBeam; if (M && M.visible) L.wmax = Math.max(L.wmax, M.scale.x); return false; }, 1.5); L.lost = +(h0 - b.health).toFixed(1); }
      out.plainLaser = L; }
    out.pull30 = await pullTrial(30);
    // ...with no car on the line, J is the ordinary high leap
    { reset(); away(); place(sp, -30, -30, Math.PI / 2); await until(() => false, 1.2); const y0 = sp.body.position.y; let ymax = y0; sp.ctrl.jump = true; await until(() => { ymax = Math.max(ymax, sp.body.position.y); return false; }, 1.6); out.normal = { rise: +(ymax - y0).toFixed(2) }; await until(() => sp.contacts > 0 && sp.body.velocity.y > -1, 3); }

    // 4) the whole combo on a heavy: web the Tiger, reel in, laser it from the roof for 3 s. It hurts, but it's no instant kill
    { reset(); away(); place(sp, -30, -60, 0); place(c3, -16, -60, Math.PI); c3.health = 100; await until(() => false, 1.0); const h0 = c3.health; await web(c3); await until(() => false, 0.4); sp.ctrl.jump = true;
      const t = await until(() => sp.latch && sp.latch.c === c3, 3); if (t !== null) { sp.ctrl.fire = true; await until(() => false, 3.2); }
      out.tiger = { latched: t !== null, lost: +(h0 - c3.health).toFixed(1), wrecked: c3.wrecked }; reset(); }

    // 5) multiplayer: the host's snapshot carries the big beam and how much of a web's hold is left (thirds), next to the other spider flags
    { reset(); away(); place(sp, -30, -60, 0); place(b, -14, -60, Math.PI); await until(() => false, 1.0); await web(b); await until(() => false, 0.4); sp.ctrl.jump = true; await until(() => sp.latch && sp.latch.c === b, 3); sp.specialCd = 3; sp.ctrl.fire = true; await until(() => sp.laserT > 0 && sp.laserPin, 0.5);
      let snap = null; const MP = D.MP, room = MP.room, ns = MP.nextSnap; MP.room = { presence: (o) => { snap = o; return Promise.resolve(); }, peers: () => [] }; MP.nextSnap = 0; let err = null; try { MP.hostFrame(0.016); } catch (e) { err = String(e); } MP.room = room; MP.nextSnap = ns;
      const fl = (c) => (snap ? snap.s.c[D.cars.indexOf(c)][11] : 0); out.snap = { err, spPin: !!(fl(sp) & 4096), spLaser: !!(fl(sp) & 2048), webQ: (fl(b) >> 13) & 3, webbed: !!(fl(b) & 64), leftNow: +(b.webbedT / (b.webHold0 || 1)).toFixed(2) }; reset(); }

    // 6) the AI spider does the combo: an AI spider 15 m from a parked Viper (the player's car); with the combo chance forced on, it webs it, reels in and lasers it from the roof
    { away(); const pv = D.respawnCar(sp, 'viper'); park(pv); place(pv, -40, 20, Math.PI); pv.health = 100; let ai = D.respawnCar(b, 'spider'); place(ai, -55, 20, 0); ai.target = pv; const WP = D.WEB_PULL || {}, k0 = WP.ai; WP.ai = 1;
      const seen = { webbed: false, pulled: false, latchPinned: false, pinLaser: false }; const s0 = D.simTime;
      while (D.simTime - s0 < 16 && !seen.pinLaser) { pv.health = Math.max(pv.health, 40); ai.health = 100; if (pv.webbedT > 0) seen.webbed = true; if (ai.leapWhy === 'pulled') seen.pulled = true; if (ai.latch && ai.latch.c === pv && pv.webbedT > 0) seen.latchPinned = true; if (ai.laserT > 0 && ai.laserPin) seen.pinLaser = true; if (pv.body.position.distanceTo(ai.body.position) > 40) place(pv, ai.body.position.x + 15, ai.body.position.z, Math.PI); await sleep(16); }
      seen.t = +(D.simTime - s0).toFixed(1); WP.ai = k0; out.ai = seen; }
    return out; });
  console.log('  ' + JSON.stringify(r));
  const H = r.hold; ok(H.hit && H.early[1] >= 16 && H.early[2] >= 22 && H.mid[1] < H.early[1] && H.late[1] < H.mid[1] && H.late[1] >= 1, `more webbing round a webbed Viper: ${H.early[1]} ground strands (${H.early[2]} strands near it) at first, ${H.mid[1]} half way, ${H.late[1]} near the end (Build 127: 3, all the way)`);
  ok(H.hold0 >= 3.8 && H.heldFor >= 3.7 && H.heldFor <= 4.6 && H.moved < 1.0 && H.lastCable && H.lastT > 3.4, `the hold: a Viper flooring it is held ${H.heldFor} s (was 3), moves ${H.moved} m, and the web line stays attached to the end (${H.lastCable} at ${H.lastT} s)`);
  ok(r.heavy.hold0 > 1.8 && r.heavy.hold0 <= H.hold0 - 1, `heavies are held for less: the Tiger ${r.heavy.hold0} s, the Viper ${H.hold0} s`);
  ok(r.lock.longest <= 4.7 && r.lock.gapMax >= 2 && r.lock.held < 0.85, `no perma-lock: webbed every 0.8 s for 13 s, the Viper is held ${Math.round(r.lock.held * 100)}% of the time, at most ${r.lock.longest} s in one go, free for ${r.lock.gapMax} s between`);
  const P1 = r.pull16, P2 = r.pull30; ok(P1.tethered && P1.t !== null && P1.t < 1.5 && P1.rise < 5 && P1.why === 'pulled' && P1.pinned, `thread-pull: J with a Hellbender on the line 16 m away lands the spider on its roof in ${P1.t} s, ${P1.rise} m high (a leap: ~2 s, ~8.6 m); still held down: ${P1.pinned}`);
  ok(P2.tethered && P2.t !== null && P2.t < 2 && P2.rise < 7, `thread-pull from 30 m: on its roof in ${P2.t} s, ${P2.rise} m high`);
  ok(r.normal.rise >= 7.8, `no car on the line: J is still the ordinary high leap (${r.normal.rise} m)`);
  const PL = r.pinLaser, UL = r.plainLaser; ok(PL.on && PL.pin && PL.down && PL.wmax >= 2 && UL.mounted && UL.wmax < 1.5, `on a webbed-down car the laser comes out big (beam ${PL.wmax.toFixed(1)}x wide, the ordinary one ${UL.wmax.toFixed(1)}x) and straight down (${PL.down}), even with the web still recharging (${PL.on})`);
  ok(PL.lost >= UL.lost * 1.35 && PL.lost < 60 && UL.lost > 5, `...and cuts harder: 1.5 s takes ${PL.lost} health off a pinned Hellbender, ${UL.lost} off one that isn't pinned`);
  ok(r.tiger.latched && !r.tiger.wrecked && r.tiger.lost > 8 && r.tiger.lost < 50, `the full combo on a Tiger (web, pull, 3 s of laser) takes ${r.tiger.lost} health: it hurts, no instant kill`);
  const SN = r.snap; ok(!SN.err && SN.spPin && SN.spLaser && SN.webbed && SN.webQ >= 1 && SN.webQ <= 3, `the snapshot sends the big beam (${SN.spPin}) and the hold left in thirds (${SN.webQ}, with ${SN.leftNow} left) ${SN.err || ''}`);
  ok(r.ai.webbed && r.ai.pulled && r.ai.latchPinned && r.ai.pinLaser, `the AI spider does the combo: webbed ${r.ai.webbed}, reeled in ${r.ai.pulled}, on the pinned roof ${r.ai.latchPinned}, big laser ${r.ai.pinLaser} (${r.ai.t} s)`);
  const pe = errors.filter((e) => e.startsWith('pageerror') || /frame error/.test(e)); ok(!pe.length, 'no page or frame errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'SPIDER3 FAIL' : 'SPIDER3 PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
