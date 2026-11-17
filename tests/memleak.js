// Long sessions must not leak GPU memory (Build 101). Every match rebuilt the props, bulls, ducks, pickups and shell casings without
// freeing the old ones, and every car's number texture leaked on respawn: ~115 geometries and ~25 textures a match. Autoplay ran
// for hours, so the Chromebook went from 60 to 15 fps over 25 matches (heap 89 MB -> 1.3 GB) and the Mac on Build 94 reached
// 17,000 geometries and a 5.5 GB heap. Checks GPU geometry/texture counts after 5 match restarts and 15 respawns stay flat.
// Fails on Build 100 (about +115 geometries per restart). The weapons phase fails on Build 105 (harpoon lines, propane shapes, Mixer drum).
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { __derby.S.aiCount = 5; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
  const r = await page.evaluate(async () => { const D = __derby, T = D.THREE, fr = async (k) => { for (let i = 0; i < k; i++) await new Promise((r) => requestAnimationFrame(r)); };
    // every geometry/texture the GPU has a copy of registers a 'dispose' listener when uploaded and drops it when freed
    const live = new Set(); for (const C of [T.BufferGeometry, T.Texture]) { const P = C.prototype, a = P.addEventListener, rm = P.removeEventListener;
      P.addEventListener = function (t, f) { if (t === 'dispose') live.add(this); return a.call(this, t, f); };
      P.removeEventListener = function (t, f) { if (t === 'dispose') live.delete(this); return rm.call(this, t, f); }; }
    const inScene = () => { const s = new Set(); D.scene.traverse((o) => { if (o.geometry) s.add(o.geometry); if (o.skeleton && o.skeleton.boneTexture) s.add(o.skeleton.boneTexture); /* a live bull's bone texture */ for (const m of [].concat(o.material || [])) if (m) for (const k in m) if (m[k] && m[k].isTexture) s.add(m[k]); }); return s; };
    const types = Object.keys(D.CAR_TYPES), restart = async () => { D.startMatch(); await new Promise((r) => setTimeout(r, 300)); await fr(15); };
    // warm-up: a restart and every car type once, so first-time shared allocations are in the baseline
    await restart(); for (let k = 0; k < types.length; k++) { D.respawnCar(D.cars.filter((c) => !c.isPlayer)[k % 4], types[k]); await fr(3); } await fr(15);
    const base = new Set(live), orphans = () => { const sc = inScene(); const o = [...live].filter((x) => !base.has(x) && !sc.has(x)); return { g: o.filter((x) => !x.isTexture).length, t: o.filter((x) => x.isTexture).length }; };
    for (let k = 0; k < 5; k++) await restart(); const afterRestarts = orphans();
    for (let k = 0; k < 15; k++) { D.respawnCar(D.cars.filter((c) => !c.isPlayer)[k % 4], types[(k * 7) % types.length]); await fr(3); } await fr(15);
    const afterRespawns = orphans(), CA = D.CANNON, wait = async (sec) => { const t0 = D.simTime, w0 = performance.now(); while (D.simTime - t0 < sec && performance.now() - w0 < sec * 4000 + 2000) await fr(1); }; /* (wall-clock cap: game time stops if the match ends) */
    // weapons whose parts used to leak (the first MEMGUARD record, Build 104): the harpoon's cable line, a new propane-bottle shape per RV shot, the Mixer's drum texture
    const foe = D.cars.find((c) => !c.isPlayer); foe.think = () => {};
    const shoot = async (type, n, gap) => { const p = D.respawnCar(D.player, type); await fr(5); for (let k = 0; k < n; k++) {
      p.body.position.set(0, 1.2, 0); p.body.velocity.set(0, 0, 0); p.body.angularVelocity.set(0, 0, 0); p.body.quaternion.set(0, 0, 0, 1);
      foe.body.position.set(15, 1.2, 0); foe.body.velocity.set(0, 0, 0); await fr(3); p.specialCd = 0; p.ctrl.fire = true; await wait(gap); } };
    await shoot('outrider', 1, 3); await shoot('camper', 1, 3); await shoot('outrider', 0, 0); await wait(1); /* warm-up: first-time shared shapes (puddle outlines, the propane bottle) go in the baseline */
    const w0 = orphans(); for (const x of live) base.add(x);
    await shoot('outrider', 6, 3); await shoot('camper', 6, 3); await wait(1);
    for (let k = 0; k < 4; k++) { D.respawnCar(D.cars.filter((c) => !c.isPlayer)[k % 4], 'mixer'); await fr(3); D.respawnCar(D.cars.filter((c) => !c.isPlayer)[k % 4], 'viper'); await fr(3); } await fr(15);
    return { afterRestarts, afterRespawns, warm: w0, afterWeapons: orphans() }; });
  console.log('  orphaned GPU objects (uploaded, no longer in the scene, never freed): ' + JSON.stringify(r));
  ok(r.afterRestarts.g <= 15, `5 match restarts leave at most 15 orphaned geometries (${r.afterRestarts.g})`);
  ok(r.afterRestarts.t <= 12, `5 match restarts leave at most 12 orphaned textures (${r.afterRestarts.t})`);
  ok(r.afterRespawns.g - r.afterRestarts.g <= 10 && r.afterRespawns.t - r.afterRestarts.t <= 4, `15 respawns add at most 10 geometries / 4 textures (${r.afterRespawns.g - r.afterRestarts.g} / ${r.afterRespawns.t - r.afterRestarts.t})`);
  ok(r.afterWeapons.g <= 2 && r.afterWeapons.t <= 1, `6 harpoon shots, 6 propane shots and 4 Mixer respawns leave at most 2 orphaned geometries / 1 texture (${r.afterWeapons.g} / ${r.afterWeapons.t})`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'MEMLEAK FAIL' : 'MEMLEAK PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
