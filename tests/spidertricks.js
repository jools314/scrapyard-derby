// Anansi's tricks (owner, Build 106): F up close = poison bite (damage over time + wobble); a web hit next to another car ties the two
// together and reels them in; next to a wall/container it sticks the car to it; J = a high leap; a small car charging at the spider runs
// underneath its stretched legs. Fails on Build 105 (none of these exist).
const { open } = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } });
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), CA = D.CANNON;
    D.S.aiCount = 2; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    const sp = D.respawnCar(D.player, 'spider'); let [a, b] = D.cars.filter((c) => !c.isPlayer); a = D.respawnCar(a, 'viper'); b = D.respawnCar(b, 'mixer'); for (const c of [a, b]) { c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false }); } /* (c.ai is not a flag the game reads: stub the brain so the Viper never fires its rockets mid-test) */ await sleep(400);
    const place = (c, x, z, yaw = 0) => { c.body.position.set(x, 1.2 * (c.T.size || 1), z); /* (a bigger spider stands taller: dropped in at 1.2 m its leg cage would start in the floor) */ c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), yaw); c.webbedT = 0; c.webAt = null; c.poisonT = 0; };
    const fire = async () => { sp.specialCd = 0; sp.ctrl.fire = true; await sleep(120); sp.ctrl.fire = false; };
    const out = {};
    // 1) bite: target 4 m in front
    place(sp, 0, 60); place(a, 4, 60); place(b, -40, 20); await sleep(500); const h0 = a.health; await fire(); const pt0 = a.poisonT, h1 = a.health; await sleep(2000); await sleep(2000);
    out.bite = { poisonT: +(pt0 || 0).toFixed(1), lost: +(h0 - a.health).toFixed(1), biteDmg: +(h0 - h1).toFixed(1) };
    // 2) tie: target 18 m ahead, another car 6 m beside it
    place(sp, 0, 60); place(a, 18, 60); place(b, 18, 66); a.health = b.health = 100; await sleep(400); const d0 = a.body.position.distanceTo(b.body.position); await fire(); let dmin = d0; { const s9 = D.simTime; while (D.simTime - s9 < 2.5) { dmin = Math.min(dmin, a.body.position.distanceTo(b.body.position)); await sleep(16); } } /* (they slam together and bounce: the closest they got is what counts) */
    out.tie = { d0: +d0.toFixed(1), d1: +dmin.toFixed(1), mode: sp.web && sp.web.mode };
    await sleep(2500);
    // 3) wall: find a container (static box) and put the target 5 m from it, nothing else near
    let cont = null; for (const o of D.world.bodies) if (o.type === 2 && o.what && /container/.test(o.what)) { cont = o; break; }
    const cx = cont ? cont.position.x : 60, cz = cont ? cont.position.z : 0; place(b, cx + 60, cz + 60); place(sp, cx, cz + 22, Math.PI / 2); place(a, cx, cz + 7); await sleep(400);
    const before = Math.hypot(a.body.position.x - cx, a.body.position.z - cz); sp.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), Math.atan2(-(a.body.position.z - sp.body.position.z), a.body.position.x - sp.body.position.x)); await sleep(100); await fire(); await sleep(2000);
    out.wall = { found: !!cont, what: cont && cont.what, before: +before.toFixed(1), after: +Math.hypot(a.body.position.x - cx, a.body.position.z - cz).toFixed(1), webbedT: +(a.webbedT || 0).toFixed(1), mode: sp.web && sp.web.mode };
    await sleep(2500);
    // 4) leap: peak height
    place(sp, -30, -30); place(a, 60, 60); place(b, 70, 70); await sleep(800); const y0 = sp.body.position.y; let ymax = y0; sp.leapCd = 0; window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ', key: 'j' })); setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyJ', key: 'j' })), 150); const s0 = D.simTime; /* a real J press: the player's controls are re-read from the keys every frame */ while (D.simTime - s0 < 1.6) { ymax = Math.max(ymax, sp.body.position.y); await sleep(16); }
    out.leap = { rise: +(ymax - y0).toFixed(2) };
    // 5) stretch: a Viper drives straight at the parked spider at 16 m/s
    place(sp, 0, -40); place(a, -24, -40, 0); a.health = 100; await sleep(600); const hs = sp.health, hl0 = (D.HITLOG || []).length; const s1 = D.simTime; /* health is read after the settle: the parked Viper can nudge it while placing */ let maxRide = 0, passed = false;
    while (D.simTime - s1 < 2.5) { if (a.body.position.x < 10) { a.body.velocity.x = 16; a.body.velocity.z = 0; a.body.position.z = -40; a.body.angularVelocity.set(0, 0, 0); } maxRide = Math.max(maxRide, sp.ride || 0); if (a.body.position.x > sp.body.position.x + 3) passed = true; await sleep(16); }
    out.stretch = { maxRide: +maxRide.toFixed(2), passed, spiderLost: +(hs - sp.health).toFixed(1), hits: (D.HITLOG || []).slice(hl0), legs: sp.legsLeft, wrecked: sp.wrecked, up: +sp.up.y.toFixed(2), y: +sp.body.position.y.toFixed(2), aMass: a.body.mass, aType: a.type };
    return out; });
  console.log('  ' + JSON.stringify(r));
  ok(r.bite.poisonT > 6 && r.bite.lost >= 8, `bite: poisoned (${r.bite.poisonT} s) and keeps hurting (lost ${r.bite.lost} in 4 s)`);
  ok(r.tie.mode === 'tie' && r.tie.d1 < Math.min(r.tie.d0 - 1.5, 4), `web next to another car ties them together and reels them in (${r.tie.d0} m -> closest ${r.tie.d1} m)`);
  ok(r.wall.found && r.wall.mode === 'wall' && r.wall.after < r.wall.before - 1, `web next to a container sticks the car to it (${r.wall.what}: ${r.wall.before} -> ${r.wall.after} m)`);
  ok(r.leap.rise > 6.5 && r.leap.rise < 9, `J leaps high: 6.5-9 m (rose ${r.leap.rise} m; owner after Build 114: "jump pretty high", it was 3-6 m)`);
  ok(r.stretch.maxRide > 2.8 && r.stretch.passed && r.stretch.spiderLost < 8, `a small car charging at it runs underneath its stretched legs (ride ${r.stretch.maxRide}, passed ${r.stretch.passed}, spider lost ${r.stretch.spiderLost})`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'SPIDERTRICKS FAIL' : 'SPIDERTRICKS PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
