// Two physics-catch bugs from the Build 129 play logs (physics catches/h 277 -> 650 on the Mac).
// 1) Outrider harpooned the Spider-Walker riding its own roof: the roof latch overwrites the spider's half of the cable's pull every step, so the
//    cable lifted Outrider by its own bootstraps, up to the vy 32 clamp for ~2.4 s. No weapon or tether may join a rider and the car it rides.
// 2) The physics guard undid a sudden LOSS of spin (restoring the big spin), and never gave up: a body a contact kept stopping, or an overlap kept
//    pushing out, was "undone" every step (120-150 in a row in the logs). Only a rise counts now, and after 3 undos in a row it takes the solver's
//    result, capped. Fails on Build 129.
const { open } = require('./harness');
const seed = () => { let a = 20261119; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } }, seed);
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), CA = D.CANNON;
    D.S.aiCount = 3; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4); /* (the bulls penned in a far corner) */
    const park = (c) => { c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false }); };
    const place = (c, x, z, yaw = 0) => { c.body.position.set(x, c.T.walker ? 2.6 : 1.2, z); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), yaw); };
    const until = async (f, s) => { const t0 = D.simTime; while (D.simTime - t0 < s) { if (f()) return +(D.simTime - t0).toFixed(2); await sleep(16); } return null; };
    const log = []; { const push0 = D.PHYS.log.push; D.PHYS.log.push = function (...a) { log.push(...a); return push0.apply(this, a); }; } /* (every safety-net entry, even ones the capped log drops) */
    const ais = D.cars.filter((c) => !c.isPlayer); park(D.player); place(D.player, -100, 100);
    const o = D.respawnCar(ais[0], 'outrider'), sp = D.respawnCar(ais[1], 'spider'), x = D.respawnCar(ais[2], 'viper'); park(o); park(sp); park(x); sp.spiderSense = () => {};
    place(x, 100, -100); /* (out of the way: nothing else in Outrider's cone) */
    const out = {};
    // 1) a spider latched on the front of Outrider's roof; Outrider fires its harpoon for 3 s
    { place(o, 0, 40, 0); place(sp, 0, 60, 0); await until(() => false, 1.2);
      o.body.pointToWorldFrame(new CA.Vec3(o.T.L / 2 - 0.3, 2.4, 0), sp.body.position); sp.body.velocity.set(0, 0, 0); const got = sp.latchOn(o);
      const off = sp.latch ? +sp.latch.off.length().toFixed(2) : null, ft = D.frontTarget(o, 40, 0.4), ft2 = D.frontTarget(o, 45, 0.5);
      const n0 = log.length, b0 = D.PHYS.blowups; let ymax = o.body.position.y, vmax = 0, cabled = 0, launch = 0; const s0 = D.simTime;
      while (D.simTime - s0 < 3) { o.ctrl.fire = true; await sleep(16); const q = o.body.position, v = o.body.velocity; ymax = Math.max(ymax, q.y); vmax = Math.max(vmax, Math.abs(v.y), Math.abs(sp.body.velocity.y)); if (Math.abs(v.y) > 25) launch++; if (o.cable && o.cable.t === sp) cabled++; }
      out.rider = { got, off, frontTarget: ft ? ft.T.name : null, frontTarget45: ft2 ? ft2.T.name : null, ymax: +ymax.toFixed(2), vmax: +vmax.toFixed(1), launch, cabled, still: !!(sp.latch && sp.latch.c === o), kicks: log.slice(n0).length, blowups: D.PHYS.blowups - b0, fired: o.specialCd > 0 || !!o.cable }; }
    // 1b) the other way round: Outrider harpoons the spider on the ground, and the spider lands on its roof with the cable still on: the cable goes within a step
    { if (sp.latch) sp.unlatch('gone'); await until(() => !o.cable, 3); place(o, 0, 40, 0); place(sp, 9, 40, 0); await until(() => false, 1.2); sp.noLatch = null;
      o.specialCd = 0; o.ctrl.fire = true; await until(() => !!o.cable, 0.5); const hooked = !!(o.cable && o.cable.t === sp);
      o.body.pointToWorldFrame(new CA.Vec3(o.T.L / 2 - 0.3, 2.4, 0), sp.body.position); sp.body.velocity.set(0, 0, 0); const got = sp.latchOn(o); const n0 = log.length; let ymax = o.body.position.y; const s0 = D.simTime;
      const gone = !(o.cable && o.cable.t === sp) ? 0 : await until(() => { ymax = Math.max(ymax, o.body.position.y); return !(o.cable && o.cable.t === sp); }, 2);
      await until(() => { ymax = Math.max(ymax, o.body.position.y); return false; }, 1);
      out.reel = { hooked, got, gone, ymax: +ymax.toFixed(2), kicks: log.slice(n0).length, list: log.slice(n0, n0 + 3) }; if (sp.latch) sp.unlatch('gone'); }
    // 2) the guard: a body with a 20 rad/s snapshot spin that a contact stops dead (emulated: zeroed after the solver, before the guard, for 1 s)
    { place(x, 60, -60, 0); await until(() => false, 1.2); const name = x.T.name; let on = true; const stop = () => { if (on) x.body.angularVelocity.set(0, 0, 0); }; D.world.addEventListener('preStep', stop);
      const n0 = log.length; x.body.angularVelocity.set(0, 20, 0); await until(() => false, 1); on = false; D.world.removeEventListener('preStep', stop); await until(() => false, 0.2);
      out.spin = { undos: log.slice(n0).filter((e) => e.kind === 'solver kick undone' && e.who === name).length, spin: +x.body.angularVelocity.length().toFixed(2) }; }
    // 3) a stationary wrecked body in a slight overlap that only the solver's push gets it out of (emulated: the solver pushes it out at 14 m/s every
    //    step; if the guard takes that push away, whatever it is stuck under puts it back where it was; if the push stays, it is out): it gets out
    //    within ~3 catches instead of being undone every step
    { place(x, 60, -60, 0); await until(() => false, 1.5); x.wrecked = true; const name = x.T.name, y0 = x.body.position.y, p0 = x.body.position.clone(), s0 = D.simTime; let on = true, outAt = null;
      const push = () => { if (on) x.body.velocity.set(0, 14, 0); }, back = () => { if (!on) return; if (x.body.velocity.y > 3) { on = false; outAt = +(D.simTime - s0).toFixed(3); } else { x.body.position.copy(p0); x.body.velocity.set(0, 0, 0); } };
      D.world.addEventListener('preStep', push); D.world.addEventListener('postStep', back); /* (registered after the guard: runs after it) */
      const n0 = log.length; let vmax = 0; await until(() => { vmax = Math.max(vmax, x.body.velocity.length()); return false; }, 1.5); on = false; D.world.removeEventListener('preStep', push); D.world.removeEventListener('postStep', back); await until(() => false, 1.5);
      const L = log.slice(n0).filter((e) => e.who === name);
      out.overlap = { catches: L.length, undos: L.filter((e) => e.kind === 'solver kick undone').length, y0: +y0.toFixed(2), outAt, vmax: +vmax.toFixed(1), kinds: [...new Set(L.map((e) => e.kind))] }; x.wrecked = false; }
    return out; });
  console.log('  ' + JSON.stringify(r));
  const R = r.rider, Re = r.reel, Sp = r.spin, Ov = r.overlap;
  ok(R.got && R.off > 2.2, `the spider rides the front of Outrider's roof (latched ${R.got}, ${R.off} m from its centre)`);
  ok(R.frontTarget === null && R.frontTarget45 === null, `frontTarget doesn't pick the rider (40 m: ${R.frontTarget}, 45 m: ${R.frontTarget45})`);
  ok(R.cabled === 0, `3 s of harpoon fire never hooks its own rider (${R.cabled} samples hooked)`);
  ok(R.ymax < 3 && R.launch === 0 && R.vmax < 25, `Outrider stays down: max y ${R.ymax} m, max |vy| ${R.vmax} m/s, ${R.launch} launch samples`);
  ok(R.kicks === 0 && R.blowups === 0, `no safety-net catches while it fires (${R.kicks} logged, blow-up counter +${R.blowups})`);
  ok(Re.hooked && Re.got && Re.gone !== null && Re.gone <= 0.02, `a harpoon on the spider ends as soon as it latches on the harpooner's roof (hooked ${Re.hooked}, latched ${Re.got}, cable gone after ${Re.gone} s)`);
  ok(Re.ymax < 3 && Re.kicks === 0, `...and Outrider stays down (max y ${Re.ymax} m, ${Re.kicks} catches) ${JSON.stringify(Re.list)}`);
  ok(Sp.undos === 0 && Sp.spin < 5, `guard: a 20 rad/s spin a contact stops is not restored: a lost spin is no kick (${Sp.undos} undos in 1 s; the cap alone would allow 3, spin after ${Sp.spin} rad/s)`);
  ok(Ov.catches <= 3 && Ov.outAt !== null && Ov.vmax < 15, `guard: a stationary wreck in an overlap resolves with ${Ov.catches} catches (${Ov.undos} undos; out of it after ${Ov.outAt} s, max speed ${Ov.vmax} m/s) ${Ov.kinds.join(', ')}`);
  const pe = errors.filter((e) => e.startsWith('pageerror') || /frame error/.test(e)); ok(!pe.length, 'no page or frame errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'PHYSFIX FAIL' : 'PHYSFIX PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
