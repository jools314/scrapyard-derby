// The spider leaps more often (owner, after Build 111: "the spider needs to be able to jump more frequently"). The player can leap again as soon as
// the legs have caught the landing (~1.6 s leap to leap, was a 2.5 s cooldown), never from mid-air, and back-to-back leaps don't pump up its speed;
// the AI spider leaps at the car it hunts (a pounce), over a medium car charging at it (not only over the heavies), and out of a spot it's wedged in.
// And it's bigger (drawn and built 1.18x), heavier and tougher (owner: "a little stronger somehow, maybe a little bigger"). Fails on Build 111.
const { open } = require('./harness');
const seed = () => { let a = 20261117; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } }, seed);
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), CA = D.CANNON;
    D.S.aiCount = 2; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    const park = (c) => { c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false }); };
    const place = (c, x, z, yaw = 0) => { c.body.position.set(x, c.T.walker ? 2.2 : 1.2, z); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), yaw); };
    const kicks = () => D.PHYS.log.filter((e) => e.kind === 'solver kick undone' && /Spider/.test(e.who)).length;
    let [a, b] = D.cars.filter((c) => !c.isPlayer); a = D.respawnCar(a, 'viper'); b = D.respawnCar(b, 'hellbender'); park(a); park(b);
    const out = {};
    // 1) the player mashes J for 4.6 s: how often does it leap, does each leap start from its feet, and does its speed stay sane?
    { const sp = D.respawnCar(D.player, 'spider'); place(sp, -30, -30); place(a, 80, 80); place(b, 90, 60); await sleep(1200); const k0 = kicks();
      const leaps = []; let prevCd = sp.leapCd, prevY = +sp.body.position.y.toFixed(2), s0 = D.simTime, vmax = 0, ymax = 0, y0 = sp.body.position.y;
      while (D.simTime - s0 < 5.2) { sp.ctrl.jump = true; sp.ctrl.throttle = 1; /* a kid holding forward and hammering J */ const t = D.simTime - s0;
        if (sp.leapCd > prevCd + 0.2) leaps.push({ t: +t.toFixed(2), y: prevY, vy: +sp.body.velocity.y.toFixed(1) }); prevCd = sp.leapCd; prevY = +sp.body.position.y.toFixed(2); /* (y: the frame before it took off) */
        vmax = Math.max(vmax, Math.hypot(sp.body.velocity.x, sp.body.velocity.z)); ymax = Math.max(ymax, sp.body.position.y - y0); await sleep(16); }
      sp.ctrl.throttle = 0; out.player = { leaps, n: leaps.length, gap: leaps.length > 1 ? +(leaps[1].t - leaps[0].t).toFixed(2) : null, vmax: +vmax.toFixed(1), rise: +ymax.toFixed(2), kicks: kicks() - k0, legs: sp.legsLeft, up: +sp.up.y.toFixed(2) }; }
    // 2) an AI spider hunting a Viper that drives laps around it at 9 m/s (its pounces are at most one every 4 s)
    { const pl = D.player; pl.think = () => {}; const sp = D.respawnCar(a, 'spider'); const vp = D.respawnCar(D.player, 'viper'); park(b); place(b, 90, 60); place(vp, -30, -10, Math.PI); place(sp, -30, -50);
      let hits = 0; const op = sp.pounce.bind(sp); sp.pounce = (c, vy) => { if (c === vp && D.simTime - (sp.pounceT ?? -9) >= 1.5) hits++; return op(c, vy); };
      await sleep(600); const k0 = kicks(); let prevCd = sp.leapCd, s0 = D.simTime; const leaps = []; const h0 = vp.health;
      while (D.simTime - s0 < 16) { sp.target = vp; sp.retarget = 9; vp.health = 100; /* (the Viper must not wreck: it's the bait) */
        const q = vp.body.position, ang = Math.atan2(q.z + 30, q.x + 30) + 0.35; /* drive a 22 m circle round (-30,-30) */ const tx = -30 + Math.cos(ang) * 22, tz = -30 + Math.sin(ang) * 22, dx = tx - q.x, dz = tz - q.z, dl = Math.hypot(dx, dz) || 1;
        vp.body.velocity.x = dx / dl * 9; vp.body.velocity.z = dz / dl * 9; vp.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), Math.atan2(-dz, dx)); vp.body.angularVelocity.set(0, 0, 0);
        if (sp.leapCd > prevCd + 0.5) leaps.push({ t: +(D.simTime - s0).toFixed(1), why: sp.leapWhy || null }); prevCd = sp.leapCd; await sleep(16); }
      out.chase = { n: leaps.length, leaps, landed: hits, kicks: kicks() - k0, wrecked: sp.wrecked }; if (sp.latch) sp.unlatch('gone'); /* (since 11-19 it holds on to a roof for up to 10 s: let go, or placing it does nothing) */ park(sp); place(sp, 80, -80); place(vp, 70, -90); }
    // 3) a parked AI spider; a Hellbender (2.9 t, a medium car) charges straight at it at 8 m/s, three times
    { const sp = D.cars.find((c) => c.T.walker && !c.isPlayer); park(sp); let n = 0; const tries = [];
      for (let k = 0; k < 3; k++) { place(sp, 20, 60, 0); place(b, -2, 60, 0); b.health = 100; await sleep(700); let prevCd = sp.leapCd, s0 = D.simTime, leapt = false;
        while (D.simTime - s0 < 3.2) { if (b.body.position.x < 34) { b.body.velocity.x = 8; b.body.velocity.z = 0; b.body.position.z = 60; b.body.angularVelocity.set(0, 0, 0); } if (sp.leapCd > prevCd + 0.5) leapt = true; prevCd = sp.leapCd; await sleep(16); }
        if (leapt) n++; tries.push(leapt); }
      out.dodge = { n, tries }; }
    // 4) an AI spider wedged in place (its legs push, it doesn't move) with open yard ahead: it leaps out instead of only backing up
    { const sp = D.cars.find((c) => c.T.walker && !c.isPlayer); delete sp.think; for (let i = 0; i < 8; i++) if (sp.wheelLost[i]) sp.refitWheel(i); /* (the dodges above can cost it a leg: it leaps only on 6+) */ place(b, 90, 60); place(sp, -30, -30, 0); D.player.think = () => {}; place(D.player, -30, 60); await sleep(700); let prevCd = sp.leapCd, s0 = D.simTime, leapt = null, rev = false;
      while (D.simTime - s0 < 2.5 && !leapt) { sp.target = D.player; sp.retarget = 9; sp.mode = 'hunt'; if (sp.reverseTimer > 0) rev = true; if (sp.leapCd > prevCd + 0.5) leapt = { t: +(D.simTime - s0).toFixed(2), why: sp.leapWhy }; prevCd = sp.leapCd;
        if (!leapt && sp.contacts) { sp.body.velocity.x = 0; sp.body.velocity.z = 0; sp.body.position.x = -30; sp.body.position.z = -30; } await sleep(16); }
      out.stuck = { leapt, reversedFirst: rev }; }
    // 5) bigger and tougher (owner: "a little stronger somehow, maybe a little bigger"): its size and weight, its bite, and a 2.9 t Hellbender ramming its side at 13 m/s
    { let ai = D.cars.find((c) => c.T.walker && !c.isPlayer); const vp = D.respawnCar(ai, 'viper'); park(vp); const sp = D.respawnCar(D.player, 'spider'); sp.spiderSense = () => {}; /* (a fresh spider; no leaping or legs-up: it has to take the hit) */
      place(sp, 0, -40, Math.PI / 2); place(b, 80, 80); place(vp, 60, 90); await sleep(1200); const stand = +sp.body.position.y.toFixed(2); /* (the yard floor is flat at y = 0 here) */
      sp.body.aabbNeedsUpdate = true; sp.body.updateAABB(); const bb = sp.body.aabb, len = +Math.max(bb.upperBound.x - bb.lowerBound.x, bb.upperBound.z - bb.lowerBound.z).toFixed(2), drawn = +sp.root.scale.x.toFixed(2);
      sp.body.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), 0); place(vp, sp.body.position.x + 4, sp.body.position.z, Math.PI); vp.health = 100; await sleep(500); /* the bite: a Viper 4 m in front of its fangs */ const hv0 = vp.health; sp.specialCd = 0; sp.ctrl.fire = true; await sleep(120); sp.ctrl.fire = false; const bite = +(hv0 - vp.health).toFixed(1); place(vp, 60, 90);
      const rams = []; for (let k = 0; k < 2; k++) { place(sp, 0, -40, Math.PI / 2); sp.health = 100; await sleep(900); const x0 = sp.body.position.x, z0 = sp.body.position.z; place(b, x0 - 14, z0, 0); b.health = 100; await sleep(50);
        const h0 = sp.health, legs0 = sp.legsLeft; let upMin = 1, go = true; const s0 = D.simTime;
        while (D.simTime - s0 < 3) { if (go) { if (b.body.position.x > x0 - b.T.L / 2 - 1.8) go = false; else { b.body.velocity.x = 13; b.body.velocity.z = 0; b.body.position.z = z0; b.body.angularVelocity.set(0, 0, 0); } } /* (driven up to the moment of contact, then it coasts: one hit) */ upMin = Math.min(upMin, sp.up.y); await sleep(16); }
        rams.push({ lost: +(h0 - sp.health).toFixed(1), pushed: +Math.hypot(sp.body.position.x - x0, sp.body.position.z - z0).toFixed(1), legsLost: legs0 - sp.legsLeft, upMin: +upMin.toFixed(2), wrecked: sp.wrecked }); place(b, 80, 80); }
      out.strong = { mass: sp.body.mass, stand, len, drawn, bite, rams }; }
    return out; });
  console.log('  ' + JSON.stringify(r));
  const P = r.player;
  ok(P.n >= 3 && P.gap !== null && P.gap < 2.6, `player: mashing J leaps again as soon as it lands (${P.n} leaps in 5.2 s, ${P.gap} s apart, ~2.2 s of it in the air since the 8.4 m leap of 11-19; was 2.5 s + 1.9 s)`);
  ok(P.leaps.every((l) => l.y < 2.4), `player: every leap starts from its feet, never mid-air (take-off heights ${P.leaps.map((l) => l.y).join(', ')})`);
  ok(P.rise > 6.5 && P.rise < 9 && P.vmax < 25 && P.kicks === 0 && P.up > 0.8, `player: back-to-back leaps stay sane (rise ${P.rise} m, top speed ${P.vmax} m/s, ${P.kicks} solver kicks, upright ${P.up})`);
  ok((r.chase.n >= 2 || (r.chase.n >= 1 && r.chase.landed >= 1)) && r.chase.kicks === 0 /* (since spider4 a pounce that lands webs the car down and rides it up to 10 s: one landed pounce counts) */ && !r.chase.wrecked, `AI: hunting a Viper it leaps at it (${r.chase.n} leaps in 16 s: ${r.chase.leaps.map((l) => l.why).join(',')}; ${r.chase.landed} landed on its roof; ${r.chase.kicks} solver kicks)`);
  ok(r.dodge.n >= 2, `AI: leaps over a medium car charging at it (${r.dodge.n}/3)`);
  ok(!!r.stuck.leapt && !r.stuck.reversedFirst, `AI: wedged in place, it leaps out (${JSON.stringify(r.stuck.leapt)}, backed up first: ${r.stuck.reversedFirst})`);
  const G = r.strong, worst = (k) => Math.max(...G.rams.map((x) => x[k]));
  ok(G.mass >= 2000 && G.drawn >= 1.15 && G.stand > 1.6 && G.len > 2.6, `stronger: bigger and heavier (${G.mass} kg, drawn at ${G.drawn}x, stands ${G.stand} m tall, ${G.len} m long)`);
  ok(G.bite >= 8, `stronger: its bite hurts more (${G.bite})`);
  ok(worst('lost') < 10 && worst('pushed') < 4.6 && G.rams.every((x) => !x.legsLost && !x.wrecked && x.upMin > 0.8), `stronger: a Hellbender ramming its side at 13 m/s doesn't flip it or snap a leg, and hurts it less (${JSON.stringify(G.rams)})`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'SPIDERJUMP FAIL' : 'SPIDERJUMP PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
