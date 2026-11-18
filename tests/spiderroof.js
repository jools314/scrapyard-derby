// The spider jumps as often as it wants, jumps high, lands on cars and rides their roofs, and cuts them up with an angle grinder (owner, after
// Build 114: "spider should be able to jump as often as it want to. jump pretty high. land on cars and attack from above... some form of laser
// cutter or vinkelslip in addition to the ability to web cars to the ground for a bit"). Fails on Build 114.
const { open } = require('./harness');
const seed = () => { let a = 20261118; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } }, seed);
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), CA = D.CANNON;
    D.S.aiCount = 2; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4); /* (the bulls penned in a far corner, as in spider.js: one that charged the Viper parked at 90,90 wrecked it, and nothing lands on a wreck) */
    const park = (c) => { c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false }); };
    const place = (c, x, z, yaw = 0) => { c.body.position.set(x, c.T.walker ? 2.6 : 1.2, z); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), yaw); };
    const kicks = () => D.PHYS.log.filter((e) => e.kind === 'solver kick undone' && /Spider/.test(e.who)).length;
    const until = async (f, s) => { const t0 = D.simTime; while (D.simTime - t0 < s) { if (f()) return +(D.simTime - t0).toFixed(2); await sleep(16); } return null; };
    let [a, b] = D.cars.filter((c) => !c.isPlayer); a = D.respawnCar(a, 'viper'); b = D.respawnCar(b, 'hellbender'); park(a); park(b); place(a, 90, 90); place(b, 100, 70);
    const sp = D.respawnCar(D.player, 'spider'); sp.spiderSense = () => {}; /* (no legs-up or dodging: the test drives it) */ const k0 = kicks(), out = {};
    // 1) a big leap, and again 0.3 s after it lands
    { place(sp, -30, -30); await until(() => false, 1.2); const y0 = sp.body.position.y; let ymax = y0; sp.ctrl.jump = true; const s0 = D.simTime;
      await sleep(300); const land = await until(() => { ymax = Math.max(ymax, sp.body.position.y); return sp.contacts > 0 && D.simTime - s0 > 0.6 && sp.body.position.y < y0 + 0.4 && sp.body.velocity.y > -2; }, 3); /* (down on its feet, not still braking the drop) */
      const air = +(D.simTime - s0).toFixed(2); await until(() => false, 0.3); const cd0 = sp.leapCd; sp.ctrl.jump = true; const again = (await until(() => sp.leapCd > cd0 + 0.1, 0.4)) !== null; /* (game time: on a busy machine 150 ms of wall clock can be a single frame) */
      await until(() => sp.body.position.y > y0 + 1, 1); await until(() => sp.contacts > 0 && sp.body.velocity.y > -1 && sp.body.position.y < y0 + 0.3, 3); await until(() => false, 0.4); /* (up, then down again: then how it stands) */
      out.leap = { y0: +y0.toFixed(2), rise: +(ymax - y0).toFixed(2), air, land, again, up: +sp.up.y.toFixed(2), standY: +sp.body.position.y.toFixed(2) }; }
    // 2) a leap aimed onto a parked Viper's roof: it grabs on and rides it, clawing
    { place(a, 0, 40, 0); a.health = 100; place(sp, -8, 40, 0); await until(() => false, 1.2); const tf = 1.75, q = a.body.position, p = sp.body.position;
      sp.leapVel = { x: (q.x - p.x) / tf, z: (q.z - p.z) / tf, t: D.simTime }; sp.ctrl.jump = true; /* (the same aim the AI pounce uses) */
      const got = await until(() => sp.latch && sp.latch.c === a, 3); const h1 = a.health; let rode = 0; const s1 = D.simTime;
      while (D.simTime - s1 < 2) { if (sp.latch && sp.latch.c === a) rode = D.simTime - s1; await sleep(16); }
      const onTop = sp.body.position.y - a.body.position.y;
      out.ride = { got, rode: +rode.toFixed(2), clawed: +(h1 - a.health).toFixed(1), onTop: +onTop.toFixed(2), viperY: +a.body.position.y.toFixed(2), viperUp: +a.up.y.toFixed(2) };
      // 3) the Viper swerves hard: the spider is slung off and lands on its feet
      const s2 = D.simTime; let off = null; while (D.simTime - s2 < 2.5) { if (!sp.latch) { off = +(D.simTime - s2).toFixed(2); break; } a.body.angularVelocity.y = 3.2; await sleep(16); }
      a.body.angularVelocity.set(0, 0, 0); await sleep(2000);
      out.shake = { off, why: sp.unlatchWhy || null, up: +sp.up.y.toFixed(2), wrecked: sp.wrecked, y: +sp.body.position.y.toFixed(2) }; }
    // 4) up close, F: the angle grinder cuts into a parked Hellbender for ~2.5 s and rips a panel off; then it has to cool down
    { if (sp.latch) sp.unlatch('gone'); place(a, 90, 90); place(b, 0, -60, Math.PI); b.health = 100; place(sp, -5.6, -60, 0); await until(() => false, 1.2); /* (its front feelers just clear of the nose: closer, and it climbs onto the hood) */ const h0 = b.health, p0 = b.parts.filter((q) => q.detached).length;
      const at = [+sp.body.position.x.toFixed(2), +sp.body.position.y.toFixed(2), +sp.body.position.z.toFixed(2), +b.body.position.x.toFixed(2), +b.body.position.z.toFixed(2), +sp.fwd.x.toFixed(2), !!sp.latch]; sp.specialCd = 0; sp.ctrl.fire = true; await until(() => sp.grindT > 0, 0.3); const grinding = sp.grindT > 0; await until(() => !(sp.grindT > 0), 4); /* (until it stops: on an overloaded machine the physics can fall behind game time) */
      const lost = +(h0 - b.health).toFixed(1), ripped = b.parts.filter((q) => q.detached).length - p0, cd = +(sp.specialCd || 0).toFixed(1);
      sp.ctrl.fire = true; await until(() => false, 0.2); const again = sp.grindT > 0;
      out.grind = { at, grinding, lost, ripped, cd, again, label: document.getElementById('fireLab') && document.getElementById('fireLab').textContent }; }
    out.kicks = kicks() - k0; return out; });
  console.log('  ' + JSON.stringify(r));
  const L = r.leap, R = r.ride, Sh = r.shake, G = r.grind;
  ok(L.rise >= 6.5 && L.rise < 9, `jumps pretty high: rose ${L.rise} m (was ~4 m), ${L.air} s in the air`);
  ok(L.again, 'jumps again 0.3 s after it lands (as often as it wants)');
  ok(L.up > 0.9 && Math.abs(L.standY - L.y0) < 0.25, `lands on its feet after a big leap (up ${L.up}, standing at ${L.standY} m, was ${L.y0} m)`);
  ok(R.got !== null && R.rode > 1.5 && R.onTop > 1, `a leap onto a car's roof grabs on and rides it (grabbed after ${R.got} s, rode ${R.rode} s, ${R.onTop} m above it)`);
  ok(R.clawed >= 3 && R.viperUp > 0.9, `riding the roof it claws the car (${R.clawed} health in 2 s) without launching it (Viper up ${R.viperUp}, y ${R.viperY})`);
  ok(Sh.off !== null && Sh.off < 1.5 && Sh.why === 'shake' && !Sh.wrecked && Sh.up > 0.8, `a hard swerve shakes it off (${Sh.off} s, ${Sh.why}) and it lands on its feet (up ${Sh.up})`);
  ok(G.grinding && G.lost >= 14 && G.ripped >= 1, `up close F fires up the angle grinder: cuts ${G.lost} health and ${G.ripped} panel(s) off a Hellbender`);
  ok(G.cd > 0 && !G.again, `the grinder has to cool down (${G.cd} s left; second press: ${G.again ? 'ran again' : 'nothing'})`);
  ok(r.kicks === 0, `0 solver kicks undone on the spider (${r.kicks})`);
  const pe = errors.filter((e) => e.startsWith('pageerror') || /frame error/.test(e)); ok(!pe.length, 'no page or frame errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'SPIDERROOF FAIL' : 'SPIDERROOF PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
