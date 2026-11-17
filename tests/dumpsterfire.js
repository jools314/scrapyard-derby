// Dumpster fire (owner's idea): when Big Bertha catches fire it is a proper DUMPSTER FIRE. Flames and smoke
// come out of the whole dump bed (not just the bonnet), she burns longer, the commentators call it
// ("dumpster fire"), the boulders she dumps while burning come out glowing and on fire and set alight
// whatever they roll into (cars, crates), and water still puts it all out.
// Fails on the pre-change tree: only the bonnet burns, no dumpster call, the boulders are plain rock.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 900, height: 560 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 1; __derby.S.autoGfx = false; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 90000 });
  const r = await page.evaluate(async () => {
    const D = __derby, sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const wt = async (s) => { const t0 = D.game.time; while (D.game.time - t0 < s) await sleep(10); };
    const out = { hooks: !!(D.setCarAlight && D.dropBoulder && D.sprites) }; /* (pre-change tree: no hooks, so light her the old way and dump with F) */
    const SPR = D.sprites || [], alight = D.setCarAlight || ((c) => { c.burnT = 7; });
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    let ai = D.cars.find((x) => x !== D.player); if (ai.type !== 'viper') { D.respawnCar(ai, 'viper'); await wt(0.3); ai = D.cars.find((x) => x !== D.player); }
    ai.think = () => {}; ai.ctrl.throttle = 0; ai.ctrl.steer = 0; ai.ctrl.fire = false; ai.body.position.set(-60, 2, 110); ai.body.velocity.set(0, 0, 0);
    D.respawnCar(D.player, 'bertha'); await wt(0.4); const B = D.player; B.think = () => {};
    B.body.position.set(-100, 3, 40); B.body.quaternion.setFromEuler(0, 0, 0); B.body.velocity.set(0, 0, 0); B.body.angularVelocity.set(0, 0, 0); await wt(1.5); B.body.velocity.set(0, 0, 0);
    const spoken = []; const show0 = D.barks.show.bind(D.barks); D.barks.show = (P, col, line) => { spoken.push(String(line)); return show0(P, col, line); };
    const bedFire = () => { let n = 0; for (const p of SPR) { if (!p || p.type !== 'fire' || !(p.life > 0)) continue; const l = B.body.pointToLocalFrame(new D.CANNON.Vec3(p.mesh.position.x, p.mesh.position.y, p.mesh.position.z)); if (l.x < -1 && l.x > -7 && Math.abs(l.z) < 3.5) n++; } return n; };
    for (const p of SPR) if (p) p.life = 0;
    D.barks.lastT = -99; D.barks.annT = -99; D.TALK.endT = 0; D.TALK.quietUntil = 0; D.TALK.hist.length = 0; /* a quiet yard: nobody mid-line */ document.getElementById('toasts').textContent = '';
    alight(B, ai); /* the viper lit her up */
    out.burnT = +B.burnT.toFixed(1); out.toast = document.getElementById('toasts').textContent;
    await wt(0.6); out.bedFire = bedFire(); out.spoken = spoken.slice();
    /* she tips the load while burning: the boulders come out on fire */
    const n0 = D.BOULDERS.length; if (D.dropBoulder) for (let i = 0; i < 3; i++) D.dropBoulder(B); else { B.specialCd = 0; B.bedLoaded = 1; const kd = (d) => window.dispatchEvent(new KeyboardEvent(d ? 'keydown' : 'keyup', { code: 'KeyF', key: 'f' })); kd(true); await wt(0.2); kd(false); await wt(1.6); } const rocks = D.BOULDERS.slice(n0, n0 + 3);
    if (rocks.length < 3) return Object.assign(out, { rocks: rocks.map(() => 0) });
    out.rocks = rocks.map((o) => +(o.fireT || 0).toFixed(1)); out.rockGlow = rocks.map((o) => o.mesh.material.emissive ? o.mesh.material.emissive.getHex() : 0);
    /* a burning rock rolls into the parked viper: it catches */
    const o = rocks[0]; ai.burnT = 0; ai.douse = 0;
    const ap = ai.body.position; o.body.position.set(ap.x - 4, ap.y + 0.3, ap.z); o.body.velocity.set(7, 0, 0); o.body.wakeUp();
    for (let k = 0; k < 40 && !(ai.burnT > 0); k++) await wt(0.05);
    out.viperBurn = +(ai.burnT || 0).toFixed(1);
    /* a burning rock next to a wooden crate: the crate catches */
    const crate = D.props.find((pr) => ['wood', 'cardboard'].includes(pr.body.propKind) && !pr.charred && !(pr.fireT > 0));
    if (crate) { const o2 = rocks[1]; const cp = crate.body.position; o2.body.position.set(cp.x + 1.6, cp.y + 0.2, cp.z); o2.body.velocity.set(0, 0, 0); await wt(1.0); out.crateFire = +(crate.fireT || 0).toFixed(1); }
    else out.crateFire = 'nocrate';
    /* water: a puddle under the third rock puts it out; a douse puts Bertha out and the bed stops burning */
    const o3 = rocks[2]; const q = o3.body.position; D.addConcrete(q.x, q.z, 3, 'water'); await wt(0.4);
    out.rockAfterWater = +(o3.fireT || 0).toFixed(2); out.rockMatAfter = o3.mesh.material.emissive ? o3.mesh.material.emissive.getHex() : 0;
    B.douse = 2; await wt(0.3); out.burnAfterDouse = B.burnT; for (const p of SPR) if (p) p.life = 0; await wt(0.5); out.bedFireAfter = bedFire();
    return out;
  });
  console.log(JSON.stringify(r));
  ok(r.burnT >= 9.5, `Bertha burns longer as a dumpster fire (burnT ${r.burnT} s; an ordinary car fire is 7 s)`);
  ok(r.bedFire >= 5, `flames come out of the dump bed, not just the bonnet (${r.bedFire} fire sprites over the bed)`);
  ok(r.spoken.some((l) => /dumpster fire/i.test(l)), `the commentators call the dumpster fire: ${JSON.stringify(r.spoken)}`);
  ok(/DUMPSTER FIRE/.test(r.toast), `the existing on-fire toast reads DUMPSTER FIRE for Bertha ("${r.toast}")`);
  ok(r.rocks.length === 3 && r.rocks.every((t) => t > 5), `boulders dumped during the fire come out burning (fireT ${r.rocks.join(', ')})`);
  ok(r.rockGlow.every((h) => h > 0), 'and glow like embers');
  ok(r.viperBurn > 0, `a burning boulder sets the car it rolls into alight (viper burnT ${r.viperBurn})`);
  ok(r.crateFire !== 'nocrate' && r.crateFire > 0, `a burning boulder lights the crate it rests against (fireT ${r.crateFire})`);
  ok(r.rockAfterWater === 0 && r.rockMatAfter === 0, `water puts a burning boulder out (fireT ${r.rockAfterWater}, back to plain rock)`);
  ok(!(r.burnAfterDouse > 0) && r.bedFireAfter === 0, `water puts the dumpster fire out (burnT ${r.burnAfterDouse}, bed flames ${r.bedFireAfter})`);
  const errs = errors.filter((e) => e.startsWith('pageerror:'));
  ok(errs.length === 0, 'no page errors ' + JSON.stringify(errs.slice(0, 3)));
  console.log(fails.length ? `FAILED ${fails.length}` : 'DUMPSTERFIRE PASS'); process.exitCode = fails.length ? 1 : 0;
  await browser.close();
})().catch((e) => { console.log('CRASH', e); process.exit(1); });
