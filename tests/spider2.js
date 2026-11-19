// The Spider-Walker, round 2 (owner, 11-19): "It's too hard to hop and land on the cars... jump a little bit more. Auto-aim a little so that if a car is
// coming towards you and you jump, the spider helps you aim... Once you're sitting on the car it should be pretty good at holding on. Then it can use
// the grinder, or maybe make it a laser... shoot spider webs even better: a few in rapid succession, and you can choose your target. But if something
// is coming towards you, that should be the target." And the kids: "the bulls should be afraid of the spider, because the spider is really weird."
// Every check here fails on Build 123. Prints SPIDER2 PASS / SPIDER2 FAIL.
const { open } = require('./harness');
const seed = () => { let a = 20261119; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } }, seed);
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), CA = D.CANNON;
    D.S.aiCount = 3; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4); /* (the bulls penned in a far corner until their own test) */
    const park = (c) => { c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false, handbrake: false }); };
    const place = (c, x, z, yaw = 0) => { c.body.position.set(x, c.T.walker ? 2.6 : 1.2, z); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), yaw); c.webbedT = 0; c.webAt = null; c.poisonT = 0; };
    const until = async (f, s) => { const t0 = D.simTime; while (D.simTime - t0 < s) { if (f()) return +(D.simTime - t0).toFixed(2); await sleep(16); } return null; };
    const drive = (c, vx, vz) => { c.body.velocity.x = vx; c.body.velocity.z = vz; c.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), Math.atan2(-vz, vx)); c.body.angularVelocity.set(0, 0, 0); c.health = 100; };
    let [a, b, c3] = D.cars.filter((c) => !c.isPlayer); a = D.respawnCar(a, 'viper'); b = D.respawnCar(b, 'hellbender'); c3 = D.respawnCar(c3, 'outrider'); for (const c of [a, b, c3]) park(c);
    place(a, 90, 90); place(b, 100, 70); place(c3, 110, 50);
    const sp = D.respawnCar(D.player, 'spider'); sp.spiderSense = () => {}; /* (no legs-up: the test drives it) */ const out = {};
    const reset = () => { if (sp.latch) sp.unlatch('gone'); sp.noLatch = null; sp.pounceT = -9; sp.leapAim = null; for (let i = 0; i < 8; i++) if (sp.wheelLost[i]) sp.refitWheel(i); sp.health = 100; };

    // 1) jump: a little higher (~8-9 m; it was ~7.3)
    { place(sp, -30, -30); await until(() => false, 1.2); const y0 = sp.body.position.y; let ymax = y0; sp.ctrl.jump = true; await until(() => { ymax = Math.max(ymax, sp.body.position.y); return false; }, 1.6); out.jump = { rise: +(ymax - y0).toFixed(2) }; await until(() => sp.contacts > 0 && sp.body.velocity.y > -1, 3); }

    // 2) leap aim-assist: a Viper comes at the spider (or crosses ahead of it); the player presses J when it's ~16-19 m away. Does the spider land on its roof?
    const trials = [[10, 0, 17], [12, 3, 18], [14, -4, 19], [8, 5, 16], [11, -2, 17], [13, 1.5, 19], [9, -5, 16], [12, 6, 18]]; // [speed, lateral offset, press J at this distance]
    const leapTrial = async ([spd, off, dj], k) => { reset(); const z = -30 + (k % 2 ? 40 : 0); place(sp, -30, z, 0); place(a, 6, z + off * 1.6, Math.PI); await until(() => false, 1.0);
      const ux = -36 / Math.hypot(36, off * 0.6), uz = -off * 0.6 / Math.hypot(36, off * 0.6); let pressed = false, got = null; const s0 = D.simTime;
      while (D.simTime - s0 < 6) { const q = a.body.position; if (!a.latchedBy) drive(a, ux * spd, uz * spd); else a.health = 100; /* (straight at a point just beside the spider, and on past) */ /* (it drives at the spider's spot, a little off to one side, then on past) */
        if (!pressed && Math.hypot(q.x - sp.body.position.x, q.z - sp.body.position.z) < dj) { sp.ctrl.jump = true; pressed = true; }
        if (sp.latch && sp.latch.c === a) { got = +(D.simTime - s0).toFixed(2); break; } await sleep(16); }
      reset(); park(a); place(a, 90, 90); return !!got; };
    for (const on of [false, true]) { if (D.LEAP_AIM) D.LEAP_AIM.on = on; let n = 0; for (let k = 0; k < trials.length; k++) if (await leapTrial(trials[k], k)) n++; out[on ? 'assist' : 'noAssist'] = n; }
    if (D.LEAP_AIM) D.LEAP_AIM.on = true;
    // ...and a Viper driving across in front, 14 m ahead: assist leads it
    { reset(); place(sp, -30, -60, 0); place(a, -16, -80, Math.PI / 2); await until(() => false, 1.0); let pressed = false, got = false; const s0 = D.simTime;
      while (D.simTime - s0 < 5) { drive(a, 0, a.latchedBy ? 0 : 11); if (!pressed && a.body.position.z > -68) { sp.ctrl.jump = true; pressed = true; } if (sp.latch && sp.latch.c === a) { got = true; break; } await sleep(16); }
      out.crossing = got; reset(); park(a); place(a, 90, 90); }

    // 3) grip: on a parked Viper's roof. A hard 1.2 s swerve and a bump keep it on; spinning hard for 4 s throws it; J jumps off
    const mount = async () => { reset(); place(a, 0, 40, 0); a.health = 100; place(sp, -8, 40, 0); await until(() => false, 1.2); const tf = 2.1, q = a.body.position, p = sp.body.position;
      sp.leapVel = { x: (q.x - p.x) / tf, z: (q.z - p.z) / tf, t: D.simTime }; sp.ctrl.jump = true; return (await until(() => sp.latch && sp.latch.c === a, 3)) !== null; };
    { const m1 = await mount(); let s0 = D.simTime; while (D.simTime - s0 < 1.2) { a.body.angularVelocity.y = 3.0; a.health = 100; await sleep(16); } a.body.angularVelocity.set(0, 0, 0); await until(() => false, 0.6);
      const swerve = !!(sp.latch && sp.latch.c === a); a.body.velocity.y = 2.6; await until(() => false, 1.2); const bump = !!(sp.latch && sp.latch.c === a); /* (a bump: it hops off the ground for a moment) */
      let off = null; s0 = D.simTime; while (D.simTime - s0 < 4.5) { if (!sp.latch) { off = +(D.simTime - s0).toFixed(2); break; } a.body.angularVelocity.y = 3.5; a.health = 100; await sleep(16); } a.body.angularVelocity.set(0, 0, 0);
      const why = sp.unlatchWhy; await until(() => false, 1.5); const m2 = await mount(); a.health = 100; await until(() => false, 0.5); sp.ctrl.jump = true; await until(() => !sp.latch, 0.5); const jumpOff = !sp.latch && sp.unlatchWhy === 'leap';
      out.grip = { mounted: m1 && m2, swerve, bump, off, why, jumpOff, up: +sp.up.y.toFixed(2) }; }
    // ...and the Viper's own AI trying to sling it off (reported, not a pass mark: how long a driver takes to shake it, before and after)
    { const m = await mount(); delete a.think; a.target = null; let off = null, wmax = 0; const s0 = D.simTime; while (D.simTime - s0 < 12) { a.health = Math.max(a.health, 60); wmax = Math.max(wmax, Math.abs(a.body.angularVelocity.y)); if (!sp.latch) { off = +(D.simTime - s0).toFixed(2); break; } await sleep(16); }
      out.aiShake = { mounted: m, off, why: sp.unlatchWhy || null, wmax: +wmax.toFixed(1) }; reset(); park(a); place(a, 90, 90); await until(() => false, 1); }

    // 4) the laser: F up close on a parked Hellbender: how much does 3.5 s of it cut, and how many panels? then it has to cool down
    { reset(); place(b, 0, -60, Math.PI); b.health = 100; place(sp, -5.6, -60, 0); await until(() => false, 1.2); const h0 = b.health, p0 = b.parts.filter((q) => q.detached).length;
      sp.specialCd = 0; sp.ctrl.fire = true; const on = (await until(() => (sp.laserT ?? sp.grindT) > 0, 0.4)) !== null; let beam = false; await until(() => { beam = beam || !!(sp.laserBeam && sp.laserBeam.visible); return false; }, 3.5);
      const lost = +(h0 - b.health).toFixed(1), ripped = b.parts.filter((q) => q.detached).length - p0, cd = +(sp.specialCd || 0).toFixed(1); sp.ctrl.fire = true; await until(() => false, 0.2); const again = (sp.laserT ?? sp.grindT) > 0;
      out.laser = { on, beam, lost, ripped, cd, again, label: document.getElementById('fireLab').textContent }; place(b, 100, 70); }
    // ...riding a Viper's roof: how long until it melts? (not instantly; a few seconds)
    { const m = await mount(); const h1 = +a.health.toFixed(1); sp.specialCd = 0; sp.ctrl.fire = true; const t = await until(() => a.wrecked, 9); out.melt = { mounted: m, t, afterPounce: h1 }; /* (from the landing, full health before it: the pounce itself hurts) */ reset(); a = D.respawnCar(a, 'viper'); park(a); place(a, 90, 90); await until(() => false, 0.5); }

    // 5) webs: three cars ahead, F pressed three times 0.4 s apart: three webs; a fourth press does nothing (cooldown); after it, it fires again
    { reset(); place(sp, 0, 60, 0); place(a, 14, 60); place(b, 26, 71); place(c3, 26, 49); for (const c of [a, b, c3]) c.health = 100; await until(() => false, 1.0); sp.specialCd = 0; sp.webShots = 0;
      const webbed = new Set(); const watch = () => { for (const c of [a, b, c3]) if (c.webbedT > 0) webbed.add(c.type); };
      for (let k = 0; k < 3; k++) { sp.ctrl.fire = true; await until(() => { watch(); return false; }, 0.4); }
      const n3 = webbed.size, cd3 = +(sp.specialCd || 0).toFixed(1); const before = webbed.size; for (const c of [a, b, c3]) { c.webbedT = 0; c.webAt = null; } sp.ctrl.fire = true; let fourth = false; await until(() => { fourth = fourth || [a, b, c3].some((c) => c.webbedT > 0); return false; }, 0.4);
      await until(() => !(sp.specialCd > 0), 8); const back = +(D.simTime).toFixed(1); sp.ctrl.fire = true; let again = false; await until(() => { again = again || [a, b, c3].some((c) => c.webbedT > 0); return again; }, 0.5);
      out.burst = { webbed: n3, kinds: [...webbed], cdAfter3: cd3, fourth, again }; }
    // 6) the web's target: a Viper parked right in front, and the Outrider charging in from the side at 12 m/s: F webs the Outrider. With the Viper picked (Tab), F webs the Viper
    { const shoot = async (pick) => { reset(); for (const c of [a, b, c3]) { c.webbedT = 0; c.webAt = null; } place(b, 100, 70); place(sp, 0, -60, 0); place(a, 16, -60); place(c3, -4, -34, -Math.PI / 2); await until(() => false, 0.8); sp.specialCd = 0; sp.webShots = 0; D.setPick(pick);
        let shot = false; const s0 = D.simTime; while (D.simTime - s0 < 3) { const q = c3.body.position, dx = 0 - q.x, dz = -60 - q.z, dl = Math.hypot(dx, dz) || 1; drive(c3, dx / dl * 12, dz / dl * 12); if (!shot && dl < 15) { sp.ctrl.fire = true; shot = true; await until(() => false, 0.15); break; } await sleep(16); }
        const who = a.webbedT > 0 ? a.type : c3.webbedT > 0 ? c3.type : null; park(c3); place(c3, 110, 50); D.setPick(null); return who; };
      out.target = { canAim: D.canAim(sp.T), dflt: await shoot(null), picked: await shoot(a) }; }

    // 7) bulls: one 12 m from a parked spider runs away from it; one 12 m from a Viper (no spider near) charges the Viper
    { reset(); park(a); place(sp, 40, 0, 0); place(a, -60, 80); place(b, -100, 70); place(c3, -110, 50); const bl = D.BULLS[0]; await until(() => false, 0.6);
      bl.body.position.set(40, 1.3, 12); bl.body.velocity.set(0, 0, 0); bl.state = 'graze'; bl.t = 0; bl.angry = null; bl.target = null; const d0 = bl.body.position.distanceTo(sp.body.position); const states = new Set(); let charged = false;
      await until(() => { states.add(bl.state); if (bl.state === 'charge' && bl.target === sp) charged = true; return false; }, 3); const d1 = bl.body.position.distanceTo(sp.body.position);
      out.bullSpider = { d0: +d0.toFixed(1), d1: +d1.toFixed(1), states: [...states], charged };
      place(sp, 120, -120); bl.body.position.set(-60, 1.3, 68); bl.body.velocity.set(0, 0, 0); bl.state = 'graze'; bl.t = 0; bl.target = null; const e0 = bl.body.position.distanceTo(a.body.position); let dmin = e0, tgt = null;
      await until(() => { if ((bl.state === 'graze' || bl.state === 'walk') && bl.t > 0.2 && !tgt) bl.t = 0; if (bl.state === 'paw' || bl.state === 'charge') tgt = bl.target; dmin = Math.min(dmin, bl.body.position.distanceTo(a.body.position)); return false; }, 5);
      out.bullViper = { d0: +e0.toFixed(1), dmin: +dmin.toFixed(1), charged: tgt === a }; }
    return out; });
  console.log('  ' + JSON.stringify(r));
  ok(r.jump.rise >= 7.8 && r.jump.rise < 9.5, `jumps a little higher: ${r.jump.rise} m (was ~7.1-7.3 m)`);
  ok(r.assist >= 6 && r.assist >= r.noAssist + 3, `leap aim-assist: lands on an oncoming Viper ${r.assist}/8 with it, ${r.noAssist}/8 without`);
  ok(r.crossing, `leap aim-assist leads a Viper crossing in front (${r.crossing})`);
  const G = r.grip; ok(G.mounted && G.swerve && G.bump && G.off !== null && G.off > 0.5 && G.why === 'shake' && G.jumpOff, `grip: a hard 1.2 s swerve (3 rad/s) and a bump don't shake it off (swerve ${G.swerve}, bump ${G.bump}); still fair: spinning hard (3.5 rad/s) throws it after ${G.off} s (${G.why}), J jumps off (${G.jumpOff})`);
  console.log(`  (the Viper's own AI shook it off after ${r.aiShake.off} s: ${r.aiShake.why}; its yaw rate peaked at ${r.aiShake.wmax} rad/s)`);
  const L = r.laser; ok(L.on && L.beam && L.lost >= 38 && L.ripped >= 5, `laser: 3.5 s up close cuts ${L.lost} health and ${L.ripped} panels off a Hellbender (the grinder: ~23 and 3), beam drawn ${L.beam}`);
  ok(L.cd > 2 && !L.again && L.label === 'Laser' && L.beam, `laser: then it cools down (${L.cd} s left, second press ${L.again ? 'ran again' : 'nothing'}); the button says ${L.label}`);
  ok(r.melt.mounted && r.melt.t !== null && r.melt.t > 1.2 && r.melt.t < 3.5, `laser: landing on a Viper's roof (${r.melt.afterPounce} health left) and firing, it melts it in ${r.melt.t} s (a few seconds, not instantly)`);
  const B = r.burst; ok(B.webbed === 3 && !B.fourth && B.cdAfter3 > 4 && B.again, `webs: three presses 0.4 s apart web three cars (${B.webbed}: ${B.kinds.join(', ')}), then a cooldown (${B.cdAfter3} s; fourth press ${B.fourth ? 'fired' : 'nothing'}; after it fires again: ${B.again})`);
  ok(r.target.canAim && r.target.dflt === 'outrider' && r.target.picked === 'viper', `web target: the car charging in (${r.target.dflt}) before the one parked in front; with Tab's pick, the pick (${r.target.picked})`);
  const S1 = r.bullSpider, S2 = r.bullViper; ok(S1.d1 > S1.d0 + 6 && !S1.charged && S1.states.includes('flee') && S2.charged && S2.dmin < S2.d0 - 4, `bulls fear the spider: ${S1.d0} -> ${S1.d1} m in 3 s (${S1.states.join(',')}); but still charge a Viper (${S2.d0} -> ${S2.dmin} m)`);
  const pe = errors.filter((e) => e.startsWith('pageerror') || /frame error/.test(e)); ok(!pe.length, 'no page or frame errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'SPIDER2 FAIL' : 'SPIDER2 PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
