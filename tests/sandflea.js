// Sandflea fixes (owner: "the sandflea tends to light itself on fire", "a little too fragile", "make the viper the default first car").
// (a) Alone in the yard, a Sandflea circling hard through its own fire-drift trail (and torching the air in front of it)
//     never catches fire by itself; another car's burning trail and another car's flamethrower still light it.
//     Fails on main: inFire() ignored who laid the burning patch, so the buggy lit itself (burnBy null) within ~3 s and burned to a wreck.
// (b) Sturdier: three side rams by an Outrider (1.5 t) at 13 m/s on open dirt cost it less hull than main did (main averaged 35-42 a ram, the branch 13-20).
// (c) A first visit (empty localStorage) shows the Viper picked in the menu; a returning player's saved pick is kept.
const { open } = require('./harness');
const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
const start = async (page, ai) => {
  await page.evaluate((ai) => { window.__noRender = true; __derby.selectCar('sandflea'); __derby.S.aiCount = ai; document.getElementById('btnStart').click(); }, ai);
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
};
const park = `const park = (c) => { c.think = () => {}; for (const k of Object.keys(c.ctrl)) c.ctrl[k] = typeof c.ctrl[k] === 'boolean' ? false : 0; };`;
(async () => {
  { // (a) self-ignition, plus fire from others
    const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
    await start(page, 1);
    const r = await page.evaluate(`(async () => { ${park} const D = __derby, p = D.player, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const other = D.cars.find((c) => !c.isPlayer); park(other); other.body.position.set(-100, 1.2, -100); other.body.velocity.set(0, 0, 0);
      p.body.position.set(0, 1.2, 40); p.body.velocity.set(0, 0, 0); p.body.angularVelocity.set(0, 0, 0); p.body.quaternion.set(0, 0, 0, 1);
      const key = (t, c) => window.dispatchEvent(new KeyboardEvent(t, { code: c, key: c.slice(3).toLowerCase() }));
      key('keydown', 'KeyD'); let onF = 0, burned = 0, maxOwn = 0, flames = 0; const t0 = D.game.time, h0 = p.health;
      while (D.game.time - t0 < 14) { await sleep(40); const sp = Math.hypot(p.body.velocity.x, p.body.velocity.z); key(sp > 11 ? 'keyup' : 'keydown', 'KeyW'); /* a tight circle at drift speed: straight back through the trail */
        if (!p.specialCd && !(p.specialT > 0)) { key('keydown', 'KeyF'); flames++; } else key('keyup', 'KeyF'); /* the flamethrower too, whenever it is ready */
        if (p.onFire) onF++; if (p.burnT > 0) burned++; maxOwn = Math.max(maxOwn, D.CONCRETE.list.filter((c) => c.owner === p && c.burning > 0).length); }
      key('keyup', 'KeyD'); key('keyup', 'KeyW'); key('keyup', 'KeyF');
      const self = { onF, burned, maxOwn, flames, h0, h1: p.health, wrecked: !!p.wrecked };
      /* another car's burning trail patch under the Sandflea still lights it */
      p.body.velocity.set(0, 0, 0); p.body.angularVelocity.set(0, 0, 0); p.body.position.set(30, 1.2, -30); p.body.quaternion.set(0, 0, 0, 1); p.burnT = 0; p.douse = 0; p.health = 100;
      for (const c of D.CONCRETE.list) c.burning = 0;
      D.addConcrete(30, -30, 1.5, 'fuel'); const pd = D.CONCRETE.list[D.CONCRETE.list.length - 1]; pd.burning = 30; pd.owner = other;
      let t1 = D.game.time; while (D.game.time - t1 < 8 && !(p.burnT > 0)) { await sleep(40); pd.burning = 30; }
      const theirTrail = { onFire: !!p.onFire, burnT: p.burnT || 0, by: p.burnBy ? p.burnBy.name : null }; pd.burning = 0; pd.t = 0.5;
      /* another car's flamethrower still lights it */
      p.burnT = 0; p.douse = 0; p.health = 100; await sleep(300); p.burnT = 0; p.ignite = 0;
      D.respawnCar(other, 'sandflea'); const fl = D.cars.find((c) => !c.isPlayer); park(fl);
      const q = p.body.position; fl.body.position.set(q.x - 5, 1.2, q.z); fl.body.quaternion.set(0, 0, 0, 1); fl.body.velocity.set(0, 0, 0); fl.body.angularVelocity.set(0, 0, 0);
      await sleep(400); fl.specialCd = 0; fl.ctrl.fire = true;
      t1 = D.game.time; while (D.game.time - t1 < 2.5 && !(p.burnT > 0)) { await sleep(40); fl.body.position.set(p.body.position.x - 5, fl.body.position.y, p.body.position.z); fl.body.quaternion.set(0, 0, 0, 1); }
      const flamer = { burnT: p.burnT || 0, by: p.burnBy ? p.burnBy.name : null, flName: fl.name, fwdX: +fl.fwd.x.toFixed(2) };
      return { self, theirTrail, flamer }; })()`);
    console.log(JSON.stringify(r));
    ok(r.self.maxOwn >= 3, `the Sandflea laid its own burning fire-drift trail (${r.self.maxOwn} patches alight at once) and used its flamethrower ${r.self.flames}x`);
    ok(r.self.onF === 0 && r.self.burned === 0, `14 s of circling through its own trail: never "in fire" (${r.self.onF} samples) and never set alight (${r.self.burned} samples burning)`);
    ok(!r.self.wrecked && r.self.h1 > r.self.h0 - 6, `no self-inflicted fire damage (hull ${Math.round(r.self.h0)} -> ${Math.round(r.self.h1)})`);
    ok(r.theirTrail.burnT > 0, `another car's burning trail still sets it alight (burnT ${r.theirTrail.burnT.toFixed(1)})`);
    ok(r.flamer.burnT > 0 && r.flamer.by === r.flamer.flName, `another car's flamethrower still sets it alight, credited to ${r.flamer.flName} (burnT ${r.flamer.burnT.toFixed(1)}, by ${r.flamer.by})`);
    const errs = errors.filter((e) => e.startsWith('pageerror:')); ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
    await browser.close();
  }
  { // (b) sturdier: a seeded side ram
    const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
    await start(page, 1);
    const r = await page.evaluate(`(async () => { ${park} const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      let o = D.cars.find((c) => !c.isPlayer); D.respawnCar(o, 'outrider'); o = D.cars.find((c) => !c.isPlayer); park(o);
      const T = D.CAR_TYPES.sandflea, out = { mass: T.mass, armor: T.armor, roll: T.handling.roll, power: T.power, runs: [] };
      let X = 0, Z = 0; search: for (let r = 0; r < 120; r += 6) for (let a = 0; a < 6.28; a += 0.5) { const x = Math.round(Math.cos(a) * r), z = Math.round(Math.sin(a) * r); if (D.spawnFree(x, z, 9) && D.spawnFree(x, z - 10, 9) && !D.ARENA.mud.some((m) => Math.hypot(m.x - x, m.z - z) < m.r + 12)) { X = x; Z = z; break search; } } /* flat, open dirt: no ramp, no mud, no props */
      out.at = [X, Z];
      for (let i = 0; i < 3; i++) {
        D.respawnCar(D.player, 'sandflea'); await sleep(200); const p = D.player; p.burnT = 0; /* a fresh buggy for every ram */
        p.body.position.set(X, 1.0, Z); p.body.quaternion.set(0, 0, 0, 1); p.body.velocity.set(0, 0, 0); p.body.angularVelocity.set(0, 0, 0);
        o.body.position.set(X, 1.0, Z - 10); o.body.quaternion.setFromAxisAngle(new D.CANNON.Vec3(0, 1, 0), -Math.PI / 2); o.body.velocity.set(0, 0, 0); o.body.angularVelocity.set(0, 0, 0);
        await sleep(700); const h0 = p.health; /* settled on its wheels */
        o.body.velocity.set(0, 0, 13); o.body.wakeUp(); p.body.wakeUp(); /* nose first into the buggy's left flank */
        const t0 = D.game.time; let minUp = 1; while (D.game.time - t0 < 2.5) { await sleep(30); minUp = Math.min(minUp, p.up.y); if (D.game.time - t0 > 1.2) { park(o); o.body.velocity.set(0, o.body.velocity.y, 0); } }
        out.runs.push({ lost: +(h0 - p.health).toFixed(1), minUp: +minUp.toFixed(2), upEnd: +p.up.y.toFixed(2), wrecked: !!p.wrecked });
        if (p.wrecked) break;
      }
      return out; })()`);
    console.log(JSON.stringify(r));
    const lost = r.runs.map((x) => x.lost), avg = lost.reduce((a, b) => a + b, 0) / lost.length;
    ok(r.mass >= 900 && r.armor <= 1.15, `sturdier numbers: ${r.mass} kg (main 850), damage taken x${r.armor} (main x1.3), roll ${r.roll} (main 1.1)`);
    ok(r.mass <= 1100 && r.power / r.mass >= 0.0008, `still a light, quick buggy (${r.mass} kg, power/weight ${(r.power / r.mass * 1e4).toFixed(2)}e-4; Viper 8.96e-4)`);
    ok(r.runs.length === 3 && !r.runs.some((x) => x.wrecked), `three 13 m/s Outrider side rams (a fresh buggy each) do not wreck it (${JSON.stringify(lost)} hull each)`);
    ok(avg < 27, `a 13 m/s Outrider side ram costs it under 27 hull on average (${avg.toFixed(1)}; main 34.7 and 41.9 in two runs, the branch 13-20)`);
    console.log(`(info) lowest up.y per ram ${JSON.stringify(r.runs.map((x) => x.minUp))}: a 13 m/s T-bone can still roll it now and then (random hub snaps), on main as on the branch, so this is logged, not gated`);
    const errs = errors.filter((e) => e.startsWith('pageerror:')); ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
    await browser.close();
  }
  for (const [saved, want] of [[null, 'viper'], ['tiger', 'tiger']]) { // (c) the default first car
    const init = saved ? `try { localStorage.setItem('scrapyard-derby-car-v3', ${JSON.stringify(saved)}); } catch (e) {}` : 'try { localStorage.clear(); } catch (e) {}';
    const { browser, page } = await open({ viewport: { width: 900, height: 560 } }, init);
    await page.waitForSelector('#garage button');
    const r = await page.evaluate(() => { const D = __derby, on = [...document.querySelectorAll('#garage button[aria-pressed="true"]')].map((b) => b.querySelector('.nm').textContent.trim());
      return { on, viperName: D.CAR_TYPES.viper.name, wantName: null }; });
    const wantName = await page.evaluate((k) => __derby.CAR_TYPES[k].name, want);
    ok(r.on.length === 1 && r.on[0] === wantName, `${saved ? 'saved pick "' + saved + '"' : 'fresh profile (no saved pick)'}: the menu shows ${wantName} picked (${JSON.stringify(r.on)})`);
    await browser.close();
  }
  console.log(fails.length ? `FAILED ${fails.length}` : 'SANDFLEA PASS'); process.exitCode = fails.length ? 1 : 0;
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
