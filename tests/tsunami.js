// The tsunami (Victor's idea): a forced wave floods most of the yard, then drains again.
//  - the water covers >= 75% of the yard floor, and a few high spots stay dry (ramps, mesas, container tops: >= 3%);
//  - cars in the flood are slowed (full throttle: under 60% of their dry-land speed) but can still drive (> 1.5 m/s), and water alone hurts nobody;
//  - a burning car, a burning fuel puddle and a burning crate all go out; puddles wash away;
//  - no solver-kick storm (physics safety-net catches during the flood stay under 8);
//  - it drains (level back to 0, at most once a match), and three restarts with a tsunami each leave no geometries, textures, bodies or empty trucks behind;
//  - perf at the lowest quality (q7, 8 opponents, damage off so nothing piles up between the two windows): the water itself at most 2 draw calls; the whole frame's draw calls during the flood within +10% of the same match before it, the flood's own physics under 0.5 ms a step, contacts within 1.6x + 25 and awake bodies +30,
//    and a loose wall-clock guard (3x + 2 ms a step: timing on a shared machine swings with other jobs). Frame time is printed, by eye only.
// Hooks: __derby.startTsunami(fast) forces one (fast = 2 s warning), ?tsunami=N in the URL schedules one at N s.
const { open } = require('./harness');
(async () => {
  const fails = [], ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 480, height: 300 } });
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), out = {};
    const wt = async (s) => { const t0 = D.game.time, w0 = performance.now(); while (D.game.time - t0 < s && performance.now() - w0 < 400000) await sleep(30); };
    const until = async (f, s) => { const t0 = D.game.time, w0 = performance.now(); while (!f() && D.game.time - t0 < s && performance.now() - w0 < 600000) await sleep(30); return f(); };
    D.S.aiCount = 4; D.S.autoGfx = false; D.selectCar('outrider'); document.getElementById('btnStart').click();
    while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    for (const c of D.cars.filter((c) => c !== D.player && c.T.jet)) D.respawnCar(c, 'viper'); // (an AI Jet would launch Ann, a new car with a live brain: this part is about the water alone)
    const ais = D.cars.filter((c) => c !== D.player); for (const c of ais) { c.think = () => { c.ctrl.throttle = 0; c.ctrl.steer = 0; c.ctrl.fire = false; c.ctrl.handbrake = true; }; }
    out.never = D.TSU.state === 'idle' && D.TSU.level === 0;
    // dry-land speed: full throttle on the open south lane for 3 s
    const P = D.player, place = async (x, z) => { const b = D.player.body; b.position.set(x, 1.6, z); b.quaternion.setFromEuler(0, 0, 0); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0); D.player.health = 100; await wt(0.8); };
    const run = async (s) => { const key = (d) => window.dispatchEvent(new KeyboardEvent(d ? 'keydown' : 'keyup', { code: 'KeyW', key: 'w' })); const p0 = D.player.body.position.clone(); key(true); await wt(s); key(false); const p1 = D.player.body.position; return Math.hypot(p1.x - p0.x, p1.z - p0.z) / s; };
    await place(-60, 75); out.vLand = +(await run(3)).toFixed(1);
    // things on fire before the wave: a car, a fuel puddle, a crate
    const burner = ais[0]; burner.body.position.set(110, 1.6, -40); D.setCarAlight(burner, null); out.burnBefore = burner.burnT > 0;
    D.addConcrete(-20, 20, 3, 'fuel'); const pud = D.CONCRETE.list[D.CONCRETE.list.length - 1]; pud.burning = 30; pud.t = 60;
    const crate = D.props.find((p) => p.kind === 'wood' && p.body.mass < 150); if (crate) { D.wakeProp(crate); D.igniteProp(crate, 60); } out.crateLit = !!(crate && crate.fireT > 0);
    D.addConcrete(30, -30, 3, 'oil'); const oil = D.CONCRETE.list[D.CONCRETE.list.length - 1]; oil.t = 60;
    const blow0 = D.PHYS.blowups; let h0 = null;
    out.started = D.startTsunami(true); out.again = D.startTsunami(true) === false; // (at most one at a time)
    out.warnSeen = D.TSU.state === 'warn';
    await until(() => D.TSU.state === 'flood', 30); h0 = ais.map((c) => c.health); out.hits = []; for (const c of ais) { const ad = c.applyDamage.bind(c); c.applyDamage = (d, by, zone, model, dv) => { if (d > 0.3 && out.hits.length < 12) out.hits.push([c.type, +d.toFixed(1), by ? by.type : c._hitWhat || (c.onFire ? 'fire' : '-'), zone, +(dv || 0).toFixed(1), Math.round(c.body.position.x), +c.body.position.y.toFixed(1), Math.round(c.body.position.z)]); return ad(d, by, zone, model, dv); }; } out.flood = D.TSU.state === 'flood'; out.level = +D.TSU.level.toFixed(2);
    // how much of the yard is under water: the floor (raycast, scenery only) under the water line
    { const C = D.CANNON, rr = new C.RaycastResult(); let wet = 0, dry = 0;
      for (let x = -146; x <= 146; x += 4) for (let z = -146; z <= 146; z += 4) { rr.reset(); D.world.raycastClosest(new C.Vec3(x, 40, z), new C.Vec3(x, -1, z), { collisionFilterMask: ~(2 | 4) }, rr); const y = rr.hasHit ? rr.hitPointWorld.y : 0; if (D.waterAt(x, z) > y + 0.1) wet++; else dry++; }
      out.wetFrac = +(wet / (wet + dry)).toFixed(3); out.dryFrac = +(dry / (wet + dry)).toFixed(3); }
    await wt(1.5);
    out.burnAfter = burner.burnT > 0; out.pudBurning = pud.burning > 0; out.crateAfter = !!(crate && crate.fireT > 0); out.oilGone = oil.t <= 2.6 || !D.CONCRETE.list.includes(oil);
    await place(-60, 75); out.vWater = +(await run(3)).toFixed(1); out.floodK = +(D.player.floodK || 0).toFixed(2);
    out.upright = D.cars.every((c) => c.up.y > 0.5); out.ups = D.cars.map((c) => +c.up.y.toFixed(2));
    await until(() => D.TSU.state === 'drain', 60); out.drainSeen = D.TSU.state === 'drain';
    out.blowFlood = D.PHYS.blowups - blow0; out.blowLog = D.PHYS.log.slice(-4);
    await until(() => D.TSU.state === 'idle', 20); out.dry = D.TSU.state === 'idle' && D.TSU.level === 0; out.done = D.TSU.done;
    out.dmg = ais.map((c, i) => +(h0[i] - c.health).toFixed(1)); out.wrecked = ais.filter((c) => c.wrecked).length; out.tlog = D.TSU.log.slice();
    await wt(1); D.TSU.at = 0; await wt(1); out.onceOnly = D.TSU.state === 'idle'; // (it has been: no second one this match)
    // three restarts, each with a (short) tsunami: nothing piles up
    const mem = [];
    for (let k = 0; k < 4; k++) { D.game.state = 'menu'; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
      D.TSU.FLOOD = 3; D.startTsunami(true); await until(() => D.TSU.state === 'flood', 30); await until(() => D.TSU.state === 'idle', 30); await wt(0.5);
      const mi = D.renderer.info.memory, deb = new Set(D.debris.map((d) => d.body)); mem.push({ geo: mi.geometries, tex: mi.textures, other: D.world.bodies.filter((b) => !b.prop && !b.car && !deb.has(b) && !b.bull).length, hulks: D.TSU.hulks.length, ghosts: D.TSU.ghosts.length, floaters: D.TSU.floaters.size, cars: D.cars.length, carBodies: D.world.bodies.filter((b) => b.car).length }); }
    D.TSU.FLOOD = 34; out.mem = mem;
    return out; });
  console.log(JSON.stringify(r));
  ok(r.never && r.started && r.warnSeen && r.again, 'a forced tsunami starts with a warning (and only one at a time)');
  ok(r.flood && r.level > 1.2, `the water rises (${r.level} m)`);
  ok(r.wetFrac >= 0.75, `it covers most of the yard (${(r.wetFrac * 100).toFixed(1)}% under water)`);
  ok(r.dryFrac >= 0.03, `a few high spots stay dry (${(r.dryFrac * 100).toFixed(1)}%)`);
  ok(r.vWater < r.vLand * 0.6 && r.vWater > 1.5, `cars are slowed but still drive: ${r.vLand} m/s on land, ${r.vWater} m/s in the water (floodK ${r.floodK})`);
  ok(r.wrecked === 0 && Math.max(...r.dmg) < 1, `water alone hurts nobody (damage from the flood's start to the drain: ${JSON.stringify(r.dmg)}) ${JSON.stringify(r.hits)}`);
  ok(r.upright, 'nobody capsizes ' + JSON.stringify(r.ups));
  ok(r.burnBefore && !r.burnAfter && !r.pudBurning && r.crateLit && !r.crateAfter, 'fires go out: a burning car, burning fuel and a burning crate');
  ok(r.oilGone, 'the oil puddle washes away');
  ok(r.blowFlood < 8, `no solver-kick storm (${r.blowFlood} catches) ${JSON.stringify(r.blowLog)}`);
  ok(r.drainSeen && r.dry && r.done && r.onceOnly, 'it drains, and does not come back in the same match ' + JSON.stringify(r.tlog));
  const m = r.mem, last = m[m.length - 1], first = m[1];
  ok(last.geo <= first.geo + 12 && last.tex <= first.tex + 2 && last.other <= first.other + 2 && m.every((x) => x.hulks === 0 && x.ghosts === 0 && x.floaters === 0 && x.carBodies === x.cars), 'no leaks over 3 restarts (GPU geometries and textures, non-prop bodies, empty trucks, floaters) ' + JSON.stringify(m));
  // perf at the lowest quality, 8 opponents, the same match before and during the flood (rendering on)
  const p = await page.evaluate(async () => { window.__noRender = false; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.S.aiCount = 8; D.S.autoGfx = false; D.applyQuality(7); const dmg0 = D.S.damage; D.S.damage = 0; /* (no panels coming off: a match piles up debris and loose parts as it goes, which would bias a before/after comparison) */ D.game.state = 'menu'; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100); D.applyQuality(7); await sleep(1500);
    const W = D.world, R = D.renderer;
    const ii = W.internalStep; const measure = async (ms) => { let stepMs = 0, steps = 0; let cont = 0; const fs0 = D.TSU.stepMs || 0, fn0 = D.TSU.steps || 0; W.internalStep = (dt) => { const t = performance.now(); const r = ii(dt); stepMs += performance.now() - t; steps++; cont += W.contacts.length; return r; }; // (per internal step: a slow frame runs more catch-up steps, which isn't the flood's cost)
      const calls = [], ft = []; let last = performance.now(); R.info.autoReset = false; R.info.reset(); const t0 = performance.now();
      await new Promise((res) => { const f = () => { const i = R.info.render; if (i.calls) calls.push(i.calls); R.info.reset(); const n = performance.now(); ft.push(n - last); last = n; if (n - t0 < ms) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      W.internalStep = ii; R.info.autoReset = true; const med = (a) => [...a].sort((x, y) => x - y)[a.length >> 1];
      return { calls: med(calls), physMs: +(stepMs / Math.max(1, steps)).toFixed(3), frameMs: +med(ft).toFixed(1), frames: ft.length, contacts: Math.round(cont / Math.max(1, steps)), awake: W.bodies.filter((b) => b.type === 1 && b.sleepState !== 2).length, floodMs: +(((D.TSU.stepMs || 0) - fs0) / Math.max(1, (D.TSU.steps || 0) - fn0)).toFixed(3) }; };
    const dry = await measure(9000);
    D.TSU.FLOOD = 40; D.startTsunami(true); const w0 = performance.now(); while (D.TSU.state !== 'flood' && performance.now() - w0 < 400000) await sleep(50);
    const wet = await measure(9000);
    // the water's own draw cost, in one frame: the same scene drawn with the water, foam and spray batch shown, then hidden
    const R2 = D.renderer, tsuObjs = [D.TSU.mesh, D.TSU.foam], vis0 = tsuObjs.map((o) => o.visible); R2.info.autoReset = false;
    R2.info.reset(); R2.render(D.scene, D.camera); const withW = R2.info.render.calls; tsuObjs.forEach((o) => { o.visible = false; }); R2.info.reset(); R2.render(D.scene, D.camera); const without = R2.info.render.calls; tsuObjs.forEach((o, i) => { o.visible = vis0[i]; }); R2.info.autoReset = true;
    const waterCalls = withW - without; D.TSU.FLOOD = 34; D.S.damage = dmg0; const st = D.TSU.state, lite = D.TSU.lite;
    return { dry, wet, waterCalls, st, lite, blow: D.PHYS.blowups }; });
  console.log('q7 perf: ' + JSON.stringify(p));
  ok(p.st === 'flood' && p.lite === true, 'at q7 the flood uses the flat, cheap water');
  ok(p.waterCalls <= 2, `q7: the water itself costs ${p.waterCalls} draw call(s) (budget 2)`);
  ok(p.wet.calls <= p.dry.calls * 1.10 + 2, `q7 draw calls, whole frame: ${p.dry.calls} dry -> ${p.wet.calls} flooded (budget +10%, the perfbudget gate; the rest is the match itself changing: cars respawning, a few floating crates awake)`);
  ok(p.wet.floodMs < 0.5, `q7: the flood's own physics work costs ${p.wet.floodMs} ms a step (budget 0.5)`);
  ok(p.wet.contacts <= p.dry.contacts * 1.6 + 25 && p.wet.awake <= p.dry.awake + 30, `q7 physics load: contacts ${p.dry.contacts} -> ${p.wet.contacts} a step (budget 1.6x + 25), awake bodies ${p.dry.awake} -> ${p.wet.awake} (budget +30)`);
  ok(p.wet.physMs <= p.dry.physMs * 3 + 2, `q7 physics time: ${p.dry.physMs} -> ${p.wet.physMs} ms per step (loose guard 3x + 2: wall-clock timing on this shared, software-rendered machine swings with other jobs; the load numbers above are the real budget)`);
  console.log(`(q7 median frame: ${p.dry.frameMs} -> ${p.wet.frameMs} ms, software GPU, by eye only)`);
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok(!pe.length, 'no page errors ' + pe.slice(0, 3).join(' | '));
  console.log(fails.length ? 'TSUNAMI FAIL' : 'TSUNAMI PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
