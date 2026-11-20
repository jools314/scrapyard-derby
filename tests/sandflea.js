// Sandflea fixes (owner, build 132: "the Sandflea is catching fire when driving ... not good, needs to be stronger").
// (a) A player Sandflea driving normally on its own (full throttle, tight drift circles straight back through its own fire-drift
//     trail, its flamethrower used and not used, a straight run over the big launch ramp with a hard drifting turn after the landing)
//     never catches fire from its own trail / exhaust and takes no fire damage.
// (b) An AI Sandflea driving a real match on its own for 30 s (chasing, flaming, ramps, jumps) never catches fire either.
//     Its target is kept doused, other burning fuel is put out and the fire pit moved away, so only its own fire is left. Hull lost to hits (ramming the parked Tiger, bulls, props) is logged and
//     refunded, so only fire could wreck it in the window.
// (c) Real causes still light it: another car's burning trail, a plain burning fuel slick, another car's flamethrower, the fire pit.
//     Fails on main: inFire() ignored who laid a burning patch, so the buggy's own trail (dropped right under its tail) lit it.
// (e) A burning crate beside it hurts it only when someone else's fire lit it: one lit by its own fire-drift trail costs it 0 hull over 5 s
//     (fails on main: 5 hull/s from any burning prop), one lit by another car's trail or lit directly still burns it.
// (d) Sturdier but still light: three 13 m/s Outrider side rams on open dirt cost it clearly less hull than main (main averaged 35-48 a ram).
const { open } = require('./harness');
const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
const start = async (page, car, ai) => {
  await page.evaluate(([car, ai]) => { window.__noRender = true; __derby.selectCar(car); __derby.S.aiCount = ai; document.getElementById('btnStart').click(); }, [car, ai]);
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
};
const park = `const park = (c) => { c.think = () => {}; for (const k of Object.keys(c.ctrl)) c.ctrl[k] = typeof c.ctrl[k] === 'boolean' ? false : 0; };`;
const put = `const put = (c, x, z, yaw) => { const D = __derby; c.body.position.set(x, 1.2, z); c.body.quaternion.setFromAxisAngle(new D.CANNON.Vec3(0, 1, 0), yaw || 0); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.body.wakeUp(); };`;
(async () => {
  { // (a) the player drives; (c) real causes
    const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
    await start(page, 'sandflea', 1);
    const r = await page.evaluate(`(async () => { ${park} ${put} const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let p = D.player; const other = D.cars.find((c) => !c.isPlayer); park(other); put(other, -100, -100);
      const key = (t, c) => window.dispatchEvent(new KeyboardEvent(t, { code: c, key: c.startsWith('Key') ? c.slice(3).toLowerCase() : ' ' }));
      const st = { onF: 0, burned: 0, maxOwn: 0, flames: 0, maxY: 0, h0: 0 };
      const sample = () => { if (p.onFire) st.onF++; if (p.burnT > 0) st.burned++; st.maxOwn = Math.max(st.maxOwn, D.CONCRETE.list.filter((c) => c.owner === p && c.burning > 0).length); st.maxY = Math.max(st.maxY, p.body.position.y); };
      /* 1: tight drift circles at full throttle, flamer whenever ready for the first half, never in the second half */
      put(p, 0, 40); await sleep(300); st.h0 = p.health; key('keydown', 'KeyD'); let t0 = D.game.time;
      while (D.game.time - t0 < 14) { await sleep(40); const sp = Math.hypot(p.body.velocity.x, p.body.velocity.z); key(sp > 11 ? 'keyup' : 'keydown', 'KeyW');
        if (D.game.time - t0 < 7 && !p.specialCd && !(p.specialT > 0)) { key('keydown', 'KeyF'); st.flames++; } else key('keyup', 'KeyF'); sample(); }
      key('keyup', 'KeyD'); key('keyup', 'KeyW'); key('keyup', 'KeyF');
      /* 2: full throttle straight over the big launch ramp (z 96, uphill -z), then a hard handbrake drift turn and back through the trail */
      put(p, 0, 140, Math.PI / 2); await sleep(300); key('keydown', 'KeyW'); t0 = D.game.time;
      while (D.game.time - t0 < 12) { await sleep(40); const el = D.game.time - t0;
        if (el > 6 && el < 10) { key('keydown', 'KeyA'); key(el < 8 ? 'keydown' : 'keyup', 'Space'); } else { key('keyup', 'KeyA'); key('keyup', 'Space'); }
        if (el > 9 && !p.specialCd && !(p.specialT > 0)) { key('keydown', 'KeyF'); st.flames++; } else key('keyup', 'KeyF'); sample(); }
      for (const k of ['KeyW', 'KeyA', 'Space', 'KeyF']) key('keyup', k);
      const self = Object.assign(st, { h1: p.health, wrecked: !!p.wrecked });
      /* real causes: another car's burning fire-drift trail under the Sandflea */
      const reset = async (x, z) => { if (p.wrecked) { D.respawnCar(p, 'sandflea'); await sleep(300); p = D.player; } /* (on main the buggy has burned itself to a wreck by now) */ for (const c of D.CONCRETE.list) c.burning = 0; put(p, x, z); p.burnT = 0; p.douse = 0; p.ignite = 0; p.health = 100; await sleep(250); p.burnT = 0; };
      const waitLit = async (s, keep) => { const t1 = D.game.time; while (D.game.time - t1 < s && !(p.burnT > 0)) { await sleep(40); if (keep) keep(); } return { burnT: +(p.burnT || 0).toFixed(1), by: p.burnBy ? p.burnBy.name : null }; };
      await reset(30, -30); D.addConcrete(30, -30, 1.5, 'fuel'); let pd = D.CONCRETE.list[D.CONCRETE.list.length - 1]; pd.burning = 30; pd.owner = other; pd.trail = true;
      const theirTrail = await waitLit(8, () => { pd.burning = 30; }); pd.burning = 0;
      /* a plain burning fuel slick (a tanker's, or a blown-up barrel's) */
      await reset(-30, 30); D.addConcrete(-30, 30, 2, 'fuel'); pd = D.CONCRETE.list[D.CONCRETE.list.length - 1]; pd.burning = 30;
      const slick = await waitLit(8, () => { pd.burning = 30; }); pd.burning = 0;
      /* the fire pit */
      let pit = null; if (D.ARENA.firePit) { const F = D.ARENA.firePit; await reset((F.x0 + F.x1) / 2, F.z); pit = await waitLit(8, () => { p.body.position.y = Math.min(p.body.position.y, 1.2); }); }
      /* another car's flamethrower */
      await reset(30, -60); D.respawnCar(other, 'sandflea'); const fl = D.cars.find((c) => !c.isPlayer); park(fl);
      put(fl, p.body.position.x - 5, p.body.position.z); await sleep(400); fl.specialCd = 0; fl.ctrl.fire = true;
      const flamer = Object.assign(await waitLit(2.5, () => { fl.body.position.set(p.body.position.x - 5, fl.body.position.y, p.body.position.z); fl.body.quaternion.set(0, 0, 0, 1); }), { flName: fl.name });
      /* (e) a burning crate parked 2.3 m beside the stopped buggy for 5 s: lit by its own fire-drift trail (no hull lost), by another car's trail and lit
         directly (both still cost hull). The crate is lit by a small trail patch laid under it, out of the buggy's own reach, which is put out once it catches. */
      park(fl); put(fl, -100, -100); const crate = D.props.find((pr) => pr.body.propKind === 'wood' && !pr.body.gas && !pr.charred && pr.body.mass < 400);
      const besideCrate = async (lightBy) => { await reset(30, 30); const q = p.body.position, cx = q.x, cz = q.z + 2.3; crate.fireT = 0; crate.litBy = undefined;
        const hold = () => { crate.body.position.set(cx, crate.body.position.y, cz); crate.body.velocity.set(0, 0, 0); crate.body.angularVelocity.set(0, 0, 0); };
        hold(); D.wakeProp(crate); await sleep(200); hold();
        if (lightBy) { D.addConcrete(cx, cz, 0.6, 'fuel'); const pd = D.CONCRETE.list[D.CONCRETE.list.length - 1]; pd.burning = 30; pd.owner = lightBy; pd.trail = true; const t1 = D.game.time; while (D.game.time - t1 < 3 && !(crate.fireT > 0)) { await sleep(40); hold(); } pd.burning = 0; pd.t = 0.5; }
        else D.igniteProp(crate);
        const lit = crate.fireT > 0, by = crate.litBy ? crate.litBy.name : null; for (const c of D.CONCRETE.list) c.burning = 0; await sleep(100);
        const h0 = p.health, t2 = D.game.time; let burned = 0; while (D.game.time - t2 < 5) { await sleep(40); hold(); if (crate.fireT > 0) crate.fireT = Math.max(crate.fireT, 3); if (p.burnT > 0) burned++; }
        const d = +crate.body.position.distanceTo(p.body.position).toFixed(1); crate.fireT = 0; return { lit, by, lost: +(h0 - p.health).toFixed(1), burned, d }; };
      const crateOwn = crate ? await besideCrate(p) : null, crateTheirs = crate ? await besideCrate(fl) : null, crateDirect = crate ? await besideCrate(null) : null;
      return { self, theirTrail, slick, pit, flamer, crateOwn, crateTheirs, crateDirect, crateKind: crate && crate.body.propKind }; })()`);
    console.log(JSON.stringify(r));
    ok(r.self.maxOwn >= 3, `the Sandflea laid its own burning fire-drift trail (${r.self.maxOwn} patches alight at once) and used its flamethrower ${r.self.flames}x`);
    ok(r.self.maxY > 3, `it jumped the launch ramp (highest point ${r.self.maxY.toFixed(1)} m)`);
    ok(r.self.onF === 0 && r.self.burned === 0, `26 s of full-throttle driving, drift circles back through its own trail, a ramp jump and a handbrake turn: never "in fire" (${r.self.onF} samples) and never set alight (${r.self.burned} samples burning)`);
    ok(!r.self.wrecked && r.self.h1 > r.self.h0 - 15, `no self-inflicted fire damage (hull ${Math.round(r.self.h0)} -> ${Math.round(r.self.h1)}, jump landings allowed a little)`);
    ok(r.theirTrail.burnT > 0, `another car's burning trail still sets it alight (burnT ${r.theirTrail.burnT})`);
    ok(r.slick.burnT > 0, `a burning fuel slick still sets it alight (burnT ${r.slick.burnT})`);
    ok(!r.pit || r.pit.burnT > 0, `the fire pit still sets it alight (${r.pit ? 'burnT ' + r.pit.burnT : 'no fire pit in this yard'})`);
    ok(r.flamer.burnT > 0 && r.flamer.by === r.flamer.flName, `another car's flamethrower still sets it alight, credited to ${r.flamer.flName} (burnT ${r.flamer.burnT}, by ${r.flamer.by})`);
    ok(!!r.crateOwn && r.crateOwn.lit && r.crateOwn.d < 2.6 && r.crateOwn.lost === 0 && r.crateOwn.burned === 0, `(e) a crate lit by its own fire-drift trail, burning ${r.crateOwn && r.crateOwn.d} m beside it for 5 s, costs it no hull (${JSON.stringify(r.crateOwn)})`);
    ok(!!r.crateTheirs && r.crateTheirs.lit && r.crateTheirs.d < 2.6 && r.crateTheirs.lost > 5, `(e) a crate lit by another car's trail beside it still burns it (${JSON.stringify(r.crateTheirs)})`);
    ok(!!r.crateDirect && r.crateDirect.lit && r.crateDirect.d < 2.6 && r.crateDirect.lost > 5, `(e) a crate lit directly (a blast, a shell) beside it still burns it (${JSON.stringify(r.crateDirect)})`);
    const errs = errors.filter((e) => e.startsWith('pageerror:')); ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
    await browser.close();
  }
  { // (b) an AI Sandflea drives a real match on its own
    const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
    await start(page, 'tiger', 1);
    const r = await page.evaluate(`(async () => { ${park} ${put} const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let a = D.cars.find((c) => !c.isPlayer); D.respawnCar(a, 'sandflea'); a = D.cars.find((c) => !c.isPlayer); const p = D.player; park(p); put(p, 60, 60);
      /* every hull loss is recorded with its cause. Fire: lost while it is "in fire" or burning (what this check is about), never refunded.
         A burning prop beside it (a crate its own trail or flamer lit: 5 hull/s before this branch, now none; see (e)): kept, and listed. Hits (the target's armour when it rams the parked
         Tiger, up to 60 hull at once; a bull's gore and shove, up to 59; props, ramps, scenery, blasts): listed and refunded, so nothing but fire can wreck it
         in the window (a 30 s run once ended "0 burning, wrecked true, hull 100 -> 0" with no fire at all). */
      const hits = {}, fireLoss = { fire: 0, prop: 0 }; let firstFire = null; const ad = a.applyDamage.bind(a);
      a.applyDamage = (dmg, by, zone, model, dv) => { if (a.wrecked) return; const h0 = a.health, fire = !!(a.onFire || a.burnT > 0) && !model && !(dv > 0); /* (the fire's own damage: a crash while it happens to be "in fire" is a hit) */
        const prop = !fire && !zone && !by && !(dv > 0) && dmg < 1 && D.props.some((pr) => pr.fireT > 0 && pr.body.position.distanceTo(a.body.position) < 2.6);
        if (fire || prop) { ad(dmg, by, zone, model, dv); const lost = h0 - a.health; if (fire) { fireLoss.fire += lost; if (!firstFire) firstFire = { t: +(D.game.time - t0).toFixed(1), lost: +lost.toFixed(1), from: fireSrc() }; } else fireLoss.prop += lost; return; }
        const what = a._hitWhat || (by && by.T ? by.T.name : zone ? 'hit ' + zone : 'blast'); a.health = 1e6; ad(dmg, by, zone, model, dv); const lost = 1e6 - a.health; a.health = h0; if (lost > 0.05) hits[what] = +((hits[what] || 0) + lost).toFixed(1); };
      const fireSrc = () => { const q = a.body.position, F = D.ARENA.firePit; if (F && q.x > F.x0 && q.x < F.x1 && Math.abs(q.z - F.z) < F.hz && q.y < 2.2) return 'the fire pit';
        const near = D.CONCRETE.list.filter((c) => c.kind === 'fuel' && c.burning > 0 && (q.x - c.x) ** 2 + (q.z - c.z) ** 2 < (c.r + 1) ** 2), pd = near.find((c) => c.owner !== a) || near[0]; if (!pd) return a.burnT > 0 ? 'burning, by ' + (a.burnBy ? a.burnBy.name : 'nobody') : 'none found';
        return (pd.trail ? 'a fire-drift trail' : 'a burning fuel slick') + ' laid by ' + (pd.owner === a ? 'itself' : pd.owner ? pd.owner.name : 'nobody'); }, src = {};
      /* and no fire but its own: the fire pit is moved out of the yard for the window, and any burning fuel that isn't its own fire-drift trail is put out
         (a gas cylinder's burning slick, say: twice in ~30 runs it was "in fire" for one sample with no fire of its own near). fireSrc() names the source. */
      const pit = D.ARENA.firePit, pit0 = pit && Object.assign({}, pit); if (pit) Object.assign(pit, { x0: 9000, x1: 9001 });
      const douse = () => { for (const c of D.CONCRETE.list) if (c.burning > 0 && c.owner !== a) c.burning = 0; }, step0 = D.world.internalStep; D.world.internalStep = (dt) => { douse(); step0(dt); }; /* (before every physics step, so the buggy's in-fire test never sees one: a gas cylinder lit by a crate it torched blew up beside it once, and 'preStep' runs after the cars' own step) */
      const st = { onF: 0, burned: 0, maxOwn: 0, flames: 0, maxY: 0, dist: 0, h0: a.health, lastFire: false }; let last = a.body.position.clone(); const t0 = D.game.time;
      const think = a.think.bind(a); a.think = (dt) => { think(dt); const el = D.game.time - t0; if (el > 4 && el < 20) a.ctrl.fire = true; }; /* its own AI drives; between 4 s and 20 s it also torches the air whenever the flamer is ready (unused before and after) */
      while (D.game.time - t0 < 30 && !a.wrecked) { await sleep(40); p.douse = 1; p.burnT = 0; /* the target can never burn, so nothing else in the yard can light the buggy */
        if (D.game.time - t0 > 15 && p.body.position.distanceTo(a.body.position) < 12) { put(p, -p.body.position.x * 0.5 + 40, -p.body.position.z * 0.5 - 40); } /* move the target away now and then: more driving, more ramps */
        if (a.onFire || a.burnT > 0) { const k = fireSrc(); src[k] = (src[k] || 0) + 1; } if (a.onFire) st.onF++; if (a.burnT > 0) st.burned++; const f = a.specialT > 0; if (f && !st.lastFire) st.flames++; st.lastFire = f;
        st.maxOwn = Math.max(st.maxOwn, D.CONCRETE.list.filter((c) => c.owner === a && c.burning > 0).length); st.maxY = Math.max(st.maxY, a.body.position.y); st.dist += a.body.position.distanceTo(last); last.copy(a.body.position); }
      D.world.internalStep = step0; if (pit) Object.assign(pit, pit0);
      return Object.assign(st, { h1: a.health, wrecked: !!a.wrecked, secs: +(D.game.time - t0).toFixed(1), hits, fireLoss: +fireLoss.fire.toFixed(1), propLoss: +fireLoss.prop.toFixed(1), firstFire, src }); })()`);
    console.log(JSON.stringify(r));
    ok(r.dist > 150, `the AI Sandflea drove ${Math.round(r.dist)} m in ${r.secs} s (highest point ${r.maxY.toFixed(1)} m), flamed ${r.flames}x, ${r.maxOwn} of its own trail patches alight at once`);
    ok(r.onF === 0 && r.burned === 0 && r.fireLoss === 0 && !r.wrecked && r.secs >= 29.9, `the AI Sandflea never caught fire from its own driving (${r.onF} samples "in fire", ${r.burned} burning, ${r.fireLoss} hull lost on fire${r.firstFire ? ' first at ' + JSON.stringify(r.firstFire) : ''}${Object.keys(r.src).length ? ', fire from ' + JSON.stringify(r.src) : ''}, wrecked ${r.wrecked} after ${r.secs} s, hull ${Math.round(r.h0)} -> ${Math.round(r.h1)})`);
    console.log(`(info) hull lost beside burning props: ${r.propLoss}; hits taken (refunded, so only fire could wreck it): ${JSON.stringify(r.hits)}`);
    const errs = errors.filter((e) => e.startsWith('pageerror:')); ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
    await browser.close();
  }
  { // (d) sturdier: seeded side rams
    const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
    await start(page, 'sandflea', 1);
    const r = await page.evaluate(`(async () => { ${park} const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let o = D.cars.find((c) => !c.isPlayer); D.respawnCar(o, 'outrider'); o = D.cars.find((c) => !c.isPlayer); park(o);
      const T = D.CAR_TYPES.sandflea, V = D.CAR_TYPES.viper, out = { mass: T.mass, armor: T.armor, roll: T.handling.roll, power: T.power, viperPW: V.power / V.mass, runs: [] };
      let X = 0, Z = 0; search: for (let r = 0; r < 120; r += 6) for (let a = 0; a < 6.28; a += 0.5) { const x = Math.round(Math.cos(a) * r), z = Math.round(Math.sin(a) * r); if (D.spawnFree(x, z, 9) && D.spawnFree(x, z - 10, 9) && !D.ARENA.mud.some((m) => Math.hypot(m.x - x, m.z - z) < m.r + 12)) { X = x; Z = z; break search; } } /* flat, open dirt */
      out.at = [X, Z];
      for (let i = 0; i < 3; i++) {
        D.respawnCar(D.player, 'sandflea'); await sleep(200); const p = D.player; p.burnT = 0; /* a fresh buggy for every ram */
        p.body.position.set(X, 1.0, Z); p.body.quaternion.set(0, 0, 0, 1); p.body.velocity.set(0, 0, 0); p.body.angularVelocity.set(0, 0, 0);
        o.body.position.set(X, 1.0, Z - 10); o.body.quaternion.setFromAxisAngle(new D.CANNON.Vec3(0, 1, 0), -Math.PI / 2); o.body.velocity.set(0, 0, 0); o.body.angularVelocity.set(0, 0, 0);
        await sleep(700); const h0 = p.health;
        o.body.velocity.set(0, 0, 13); o.body.wakeUp(); p.body.wakeUp(); /* nose first into the buggy's left flank */
        const t0 = D.game.time; let minUp = 1; while (D.game.time - t0 < 2.5) { await sleep(30); minUp = Math.min(minUp, p.up.y); if (D.game.time - t0 > 1.2) { park(o); o.body.velocity.set(0, o.body.velocity.y, 0); } }
        out.runs.push({ lost: +(h0 - p.health).toFixed(1), minUp: +minUp.toFixed(2), wrecked: !!p.wrecked });
        if (p.wrecked) break;
      }
      return out; })()`);
    console.log(JSON.stringify(r));
    const lost = r.runs.map((x) => x.lost), avg = lost.reduce((a, b) => a + b, 0) / lost.length, pw = r.power / r.mass;
    ok(r.mass >= 900 && r.armor <= 1.15, `sturdier numbers: ${r.mass} kg (main 850), damage taken x${r.armor} (main x1.3), roll ${r.roll} (main 1.1)`);
    ok(r.mass <= 1100 && pw >= 0.0008, `still a light, quick buggy (${r.mass} kg, power/weight ${(pw * 1e4).toFixed(2)}e-4, main 8.82e-4; Viper ${(r.viperPW * 1e4).toFixed(2)}e-4)`);
    ok(r.runs.length === 3 && !r.runs.some((x) => x.wrecked), `three 13 m/s Outrider side rams (a fresh buggy each) do not wreck it (${JSON.stringify(lost)} hull each)`);
    ok(avg < 30, `a 13 m/s Outrider side ram costs it under 30 hull on average (${avg.toFixed(1)}; main averaged 34.7-48.5 over four runs)`);
    console.log(`(info) lowest up.y per ram ${JSON.stringify(r.runs.map((x) => x.minUp))}: a 13 m/s T-bone can still roll it now and then, so this is logged, not gated`);
    const errs = errors.filter((e) => e.startsWith('pageerror:')); ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
    await browser.close();
  }
  console.log(fails.length ? `FAILED ${fails.length}` : 'SANDFLEA PASS'); process.exitCode = fails.length ? 1 : 0;
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
