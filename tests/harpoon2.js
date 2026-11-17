// Harpoon, made fun (owner picks, 2026-11-17): (1) hooking a car yanks YOU at it for a ram ("get over here!"), (2) with no car ahead it
// can hook a concrete pillar and you swing round it, slung out when it lets go, (3) a hook in a car's side spins it out.
// Fails on Build 107 (the cable only reeled the target in, never hooked pillars, never spun anyone).
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
  const r = await page.evaluate(async () => { const D = __derby, CA = D.CANNON, out = {};
    const tame = (c) => { c.tamed = true; c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false }); return c; };
    let lot = 0; const fr = () => { for (const c of D.cars) if (!c.isPlayer && !c.tamed) { tame(c); place(c, -120 + (lot++ % 16) * 12, 130); out.lateRespawns = (out.lateRespawns || 0) + 1; } return new Promise((r) => requestAnimationFrame(r)); }; /* a car wrecked by the ram comes back on its own with a live brain: park it too, or it drives into the next shot */
    const wait = async (s) => { const t0 = D.simTime, w0 = performance.now(); while (D.simTime - t0 < s && performance.now() - w0 < s * 4000 + 2000) await fr(); };
    let p = D.respawnCar(D.player, 'outrider'); const fresh = () => { p = D.respawnCar(D.player, 'outrider'); }; /* a new Outrider for each check: the ram can wreck it, or bend it enough to slow the next one */ const foes = D.cars.filter((c) => !c.isPlayer); foes.forEach(tame);
    let a = tame(D.respawnCar(foes[0], 'viper'));
    const place = (c, x, z, yaw = 0) => { c.body.position.set(x, 1.2, z); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), yaw); };
    D.cars.filter((c) => !c.isPlayer && c !== a).forEach((c) => place(c, -120 + (lot++ % 16) * 12, 130));
    const fire = async () => { p.specialCd = 0; p.ctrl.fire = true; await fr(); await fr(); };
    /* a clear, flat 30 m lane for the shot. (-60, 60) used to be hard-coded: it sits on the edge of the NW jump table, so the Outrider was
       launched nose-up and was still in the air when it fired; the cone then missed the car (NO TARGET) or the side hook read as a nose hook. */
    const lane = () => { for (const z of [20, 0, -20, 40, -40, 60, -60, 100, -100]) for (const x0 of [-100, -75, -50, 30, 55, 80]) { let ok = true; for (let x = x0 - 4; x <= x0 + 30; x += 2.5) if (!D.spawnFree(x, z, 3.5)) { ok = false; break; } if (ok) return { x: x0, z }; } return null; };
    let L = lane(); out.lane1 = L; if (!L) return out;
    // 1) reel yourself in: a Viper parked 25 m ahead, nose-on
    place(p, L.x, L.z); place(a, L.x + 25, L.z, Math.PI); await wait(0.6); let vmax = 0, dmin = 99; await fire(); { const t0 = D.simTime; while (D.simTime - t0 < 1.6) { const v = p.body.velocity; vmax = Math.max(vmax, v.x); dmin = Math.min(dmin, p.body.position.distanceTo(a.body.position)); await fr(); } }
    out.zip = { hooked: !!(p.cable || dmin < 20), vmax: +vmax.toFixed(1), dmin: +dmin.toFixed(1) };
    if (p.cable) D.player.cable && (await wait(1)); await wait(2.6);
    // 2) spin out: the Viper broadside, 20 m ahead
    fresh(); place(a, 120, -130); const sc = tame(D.respawnCar(D.cars.find((c) => !c.isPlayer && c !== a), 'cruiser')); /* a fresh car: the ram may have wrecked the Viper */
    L = lane(); out.lane2 = L; if (!L) return out; place(p, L.x, L.z); place(sc, L.x + 20, L.z, Math.PI / 2); await wait(0.6); let wmax = 0; await fire(); { const t0 = D.simTime; while (D.simTime - t0 < 1.0) { wmax = Math.max(wmax, Math.abs(sc.body.angularVelocity.y)); await fr(); } }
    out.spin = { wmax: +wmax.toFixed(2), spun: !!(p.cable && p.cable.spun) };
    await wait(2.6);
    // 3) swing: a pillar 12 m ahead and 8 m to the side, no car in reach; driving past it at 14 m/s
    fresh(); place(sc, 110, -130); const P = { x: Math.cos(Math.PI / 6) * 42, z: Math.sin(Math.PI / 6) * 42 };
    place(p, P.x - 12, P.z - 8); p.body.velocity.set(14, 0, 0); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w' })); await fr(); await fire(); /* holding the throttle through the swing */ const swing = !!(p.cable && p.cable.swing); const h0 = Math.atan2(p.body.velocity.z, p.body.velocity.x);
    let pmin = 99, turned = 0, lastH = h0; { const t0 = D.simTime; while (D.simTime - t0 < 2.2 && p.cable) { const q = p.body.position; pmin = Math.min(pmin, Math.hypot(q.x - P.x, q.z - P.z)); const h = Math.atan2(p.body.velocity.z, p.body.velocity.x); let dh = h - lastH; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); turned += dh; lastH = h; await fr(); } }
    const vBefore = Math.hypot(p.body.velocity.x, p.body.velocity.z); await wait(0.5); window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'w' })); const vAfter = Math.hypot(p.body.velocity.x, p.body.velocity.z);
    out.swing = { swing, pmin: +pmin.toFixed(1), turnedDeg: Math.round(Math.abs(turned) * 57.3), vBefore: +vBefore.toFixed(1), vAfter: +vAfter.toFixed(1) };
    return out; });
  console.log('  ' + JSON.stringify(r));
  if (!r.lane1 || !r.lane2) { console.log('FAIL no clear lane for the shot\nHARPOON2 FAIL'); await browser.close(); process.exit(1); }
  ok(r.zip.vmax >= 15 && r.zip.dmin < 7.5, `hooking a car yanks you at it for a ram (top speed ${r.zip.vmax} m/s, closest ${r.zip.dmin} m)`);
  ok(r.spin.spun && r.spin.wmax > 1.5, `a hook in a car's side spins it out (yaw rate ${r.spin.wmax} rad/s)`);
  ok(r.swing.swing && r.swing.turnedDeg >= 60 && r.swing.pmin > 2.5 && r.swing.vBefore > 8, `with no car ahead it hooks a pillar and you swing round it (turned ${r.swing.turnedDeg}°, never closer than ${r.swing.pmin} m)`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'HARPOON2 FAIL' : 'HARPOON2 PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
