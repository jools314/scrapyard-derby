// The Buzzsaw Hover (Lucas's hovercraft): it hovers low, boosts up ~5 m, drifts, gets shoved around, cuts whoever rams its sides, can't be bogged
// down by wet concrete, and throws cartoon bombs. Each claim is measured against an ordinary car doing the same thing, and the physics safety net
// must never have to undo a solver kick on the hovercraft (in the scripted checks or in 40 s of AI free play with two hovercraft in the yard).
//   1 drift:    full throttle, then a hard turn: its sideways slide is far bigger than the Outrider's; let go of the stick and the slide dies out fast
//   2 boost:    parked, J: it hovers up to about 5 m (not more), floats there (slow rise, not a jump), then settles back onto its low cushion
//   3 push:     the same Viper ram at 14 m/s shoves it much further than the Outrider (a car of about its size)
//   4 saws:     the blades are on its sides; the Viper that rams its side takes far more damage than one that rams the Outrider; a nose bump isn't sawn
//   5 concrete: it drives straight out of a fresh puddle of wet concrete that bogs the Outrider down
//   6 bombs:    on the cushion F lobs a bomb onto a car 18 m ahead and drops one on a car behind; boosted up, onto a car below
//   7 AI:       two AI hovercraft fight for 40 s: they boost and bomb, their bombs land on cars, they stay inside the yard, no solver kick is undone
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 3; __derby.S.autoGfx = 0; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 600000, polling: 250 });
  const r = await page.evaluate(async () => {
    const D = __derby, C = D.CANNON, sleep = (ms) => new Promise((res) => setTimeout(res, ms)), out = {};
    const wt = async (s) => { const t0 = D.game.time, w0 = performance.now(); while (D.game.time - t0 < s && performance.now() - w0 < s * 60000 + 5000) await sleep(20); };
    const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code.replace('Key', '').toLowerCase() }));
    const kicks = () => D.PHYS.log.filter((e) => e.kind === 'solver kick undone' && e.who === 'Buzzsaw Hover').length;
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    const ais = () => D.cars.filter((c) => !c.isPlayer);
    const stub = (c) => { c.think = () => {}; Object.assign(c.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false, handbrake: false, brake: false }); };
    const parkAll = () => { let k = 0; for (const c of ais()) { stub(c); c.body.position.set(-110 + k * 9, 2, 120); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); k++; } };
    const put = (c, x, z, yaw) => { const b = c.body; b.position.set(x, 1.4, z); b.quaternion.setFromEuler(0, yaw, 0); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0); c.health = 100; for (const k in c.zones) c.zones[k] = 0; };
    const lat = (c) => { const f = c.body.quaternion.vmult(new C.Vec3(1, 0, 0)), v = c.body.velocity, h = Math.hypot(f.x, f.z) || 1; return Math.abs(v.x * -f.z / h + v.z * f.x / h); };
    const k0 = kicks();
    // 1 drift
    out.drift = {};
    for (const t of ['hover', 'outrider']) {
      D.respawnCar(D.player, t); await wt(0.3); parkAll(); const c = D.player; put(c, -70, 75, 0); await wt(1.0);
      key('KeyW', true); await wt(2.6); const v0 = Math.hypot(c.body.velocity.x, c.body.velocity.z); key('KeyA', true);
      let latMax = 0, settle = null; const t0 = D.game.time; while (D.game.time - t0 < 3.6) { await sleep(20); const l = lat(c), tt = D.game.time - t0; latMax = Math.max(latMax, l); if (tt > 1.1) key('KeyA', false); if (tt > 1.2 && settle === null && l < 3) settle = +(tt - 1.1).toFixed(2); }
      key('KeyA', false); key('KeyW', false); out.drift[t] = { v0: +v0.toFixed(1), latMax: +latMax.toFixed(1), settle }; await wt(0.5);
    }
    // 2 boost: parked on the flat, J
    { D.respawnCar(D.player, 'hover'); await wt(0.3); parkAll(); const c = D.player, b = c.body; put(c, -50, 75, 0); await wt(1.5);
      const rest = +(b.position.y - 0.2).toFixed(2); let peak = 0, vyMax = 0, up3 = 0, tPeak = 0, settled = null; key('KeyJ', true); await sleep(60); key('KeyJ', false);
      const t0 = D.game.time; let last = t0; while (D.game.time - t0 < 7) { await sleep(20); const tt = D.game.time - t0, gp = b.position.y - 0.2, dtt = tt - (last - t0); last = D.game.time;
        if (gp > peak) { peak = gp; tPeak = tt; } vyMax = Math.max(vyMax, b.velocity.y); if (gp > 3) up3 += dtt; if (peak > 3 && settled === null && gp < 0.8) settled = +tt.toFixed(2); }
      out.boost = { rest, peak: +peak.toFixed(2), tPeak: +tPeak.toFixed(2), vyMax: +vyMax.toFixed(1), up3: +up3.toFixed(2), settled, end: +(b.position.y - 0.2).toFixed(2), boosts: c.boostT === -1 }; }
    // 3 push + 4 saws: a Viper at 14 m/s into the parked car's left side
    out.ram = {};
    for (const t of ['hover', 'outrider', 'hoverNose']) { const nose = t === 'hoverNose';
      D.respawnCar(D.player, nose ? 'hover' : t); await wt(0.3); parkAll(); const c = D.player; put(c, -40, 75, 0); await wt(1.2);
      let v = ais()[0]; if (v.type !== 'viper') { v = D.respawnCar(v, 'viper'); await wt(0.3); } stub(v); put(v, -40, 63, Math.PI / 2 * -1); await wt(0.4); // (nose toward +z)
      if (nose) { put(v, -28, 75, Math.PI); v.body.velocity.set(-14, 0, 0); } else { put(v, -40, 63, -Math.PI / 2); v.body.velocity.set(0, 0, 14); } const p0 = c.body.position.clone(), h0 = c.health, vh0 = v.health, saw0 = c.sawHits || 0;
      const t0 = D.game.time; while (D.game.time - t0 < 2.5) { await sleep(20); if (D.game.time - t0 < 0.35) { if (nose) v.body.velocity.x = Math.min(v.body.velocity.x, -14); else v.body.velocity.z = Math.max(v.body.velocity.z, 14); } }
      const p1 = c.body.position; out.ram[t] = { moved: +Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(1), hurt: +(h0 - c.health).toFixed(1), rammerHurt: +(vh0 - v.health).toFixed(1), saws: (c.sawHits || 0) - saw0 };
    }
    out.saws = (() => { const c = D.player; return { n: c.sawSpots.length, minSide: +Math.min(...c.sawSpots.map((s) => Math.abs(s.z))).toFixed(2), maxX: +Math.max(...c.sawSpots.map((s) => Math.abs(s.x))).toFixed(2), halfW: D.CAR_TYPES.hover.W / 2, R: D.HOVER ? D.HOVER.sawR : 0.5 }; })();
    // 5 concrete
    out.concrete = {};
    for (const t of ['hover', 'outrider']) {
      D.respawnCar(D.player, t); await wt(0.3); parkAll(); const c = D.player; put(c, -72, 75, 0); await wt(1.0);
      D.addConcrete(-70, 75, 5, 'concrete'); const pd = D.CONCRETE.list[D.CONCRETE.list.length - 1]; pd.t = 20; await wt(0.2);
      const p0 = c.body.position.clone(); let stuck = 0; key('KeyW', true); const t0 = D.game.time; while (D.game.time - t0 < 2) { await sleep(20); if (c.stuckConcrete) stuck++; } key('KeyW', false);
      const p1 = c.body.position; out.concrete[t] = { moved: +Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(1), stuckFrames: stuck }; pd.t = 0.5; await wt(0.6);
    }
    // 6 bombs: a parked Outrider ahead / behind / under; the hovercraft throws one bomb at it each time
    const bombRun = async (setup) => { D.respawnCar(D.player, 'hover'); await wt(0.3); parkAll(); const c = D.player; let tg = ais()[0]; if (tg.type !== 'outrider') { tg = D.respawnCar(tg, 'outrider'); await wt(0.3); } stub(tg);
      c.bombCd = 0; const r0 = await setup(c, tg); if (!r0) return { fired: false }; const th0 = tg.health; key('KeyF', true); await sleep(40); key('KeyF', false);
      let s = null, last = null, t0 = D.game.time, from = null; while (D.game.time - t0 < 5) { await sleep(10); const x = D.shells.find((q) => q.hbomb && q.owner === c); if (x) { s = x; if (!from) from = +(x.pos.y).toFixed(1); last = x.pos.clone(); } else if (s) break; }
      key('KeyW', false); await wt(0.4); const q = tg.body.position;
      return { fired: !!s, from, aimed: !!(c._aim && c._aim.t === tg), miss: last ? +Math.hypot(last.x - q.x, last.z - q.z).toFixed(1) : null, hurt: +(th0 - tg.health).toFixed(1) }; };
    out.bomb = {};
    out.bomb.ahead = await bombRun(async (c, tg) => { put(tg, -62, 75, 0); put(c, -80, 75, 0); await wt(1.2); return true; });
    out.bomb.behind = await bombRun(async (c, tg) => { put(tg, -89, 75, 0); put(c, -80, 75, 0); await wt(1.2); return true; });
    out.bomb.below = await bombRun(async (c, tg) => { put(tg, -40, 75, 0); put(c, -56, 75, 0); await wt(1.2); key('KeyJ', true); await sleep(60); key('KeyJ', false);
      let t0 = D.game.time; while (D.game.time - t0 < 2 && !(c.liftH > 3.5)) await sleep(15); key('KeyW', true);
      t0 = D.game.time; while (D.game.time - t0 < 4) { await sleep(10); if (Math.abs(c.body.position.x - tg.body.position.x) < 4) { key('KeyW', false); return true; } } return false; });
    out.kicksScripted = kicks() - k0;
    // 6 AI free play: two AI hovercraft and a brawler, 40 s; the player's car sits out of the way
    { D.respawnCar(D.player, 'outrider'); await wt(0.3); stub(D.player); put(D.player, 130, -130, 0); D.player.think = () => {};
      const k1 = kicks(), list = ais(), hv = [D.respawnCar(list[0], 'hover'), D.respawnCar(list[1], 'hover')], other = D.respawnCar(list[2], 'bertha'); await wt(0.2);
      for (const c of [...hv, other]) { delete c.think; c.health = 100; } // (an own property shadows the class's think: delete it to drive again)
      const v0 = D.PLAYLOG.m ? JSON.parse(JSON.stringify(D.PLAYLOG.m.veh.hover || {})) : {}; let maxAbs = 0, minY = 9, maxUp = 0; const live = new Map(), landed = [];
      const t0 = D.game.time; while (D.game.time - t0 < 40) { await sleep(25); for (const c of D.cars) if (c.type === 'hover' && !c.isPlayer) { const p = c.body.position; maxAbs = Math.max(maxAbs, Math.abs(p.x), Math.abs(p.z)); minY = Math.min(minY, p.y); maxUp = Math.max(maxUp, c.liftH || 0); }
        const now = new Set(D.shells.filter((q) => q.hbomb)); for (const q of now) live.set(q, q.pos.clone()); for (const [q, at] of live) if (!now.has(q)) { live.delete(q); landed.push(Math.min(...D.cars.filter((c) => c !== q.owner && c !== D.player && !c.wrecked).map((c) => Math.hypot(c.body.position.x - at.x, c.body.position.z - at.z)))); } }
      const v1 = D.PLAYLOG.m ? D.PLAYLOG.m.veh.hover || {} : {};
      out.ai = { boosts: (v1.boosts || 0) - (v0.boosts || 0), maxUp: +maxUp.toFixed(2), landed: landed.map((d) => +d.toFixed(1)), nearCar: landed.filter((d) => d < 6).length, bombs: (v1.bombs || 0) - (v0.bombs || 0), sawHits: (v1.sawHits || 0) - (v0.sawHits || 0), maxAbs: +maxAbs.toFixed(1), minY: +minY.toFixed(2), kicks: kicks() - k1,
        escaped: D.PHYS.log.filter((e) => e.who === 'Buzzsaw Hover' && /escaped|floor/.test(e.kind)).length }; }
    out.kicksTotal = kicks() - k0; out.physLog = D.PHYS.log.filter((e) => e.who === 'Buzzsaw Hover').slice(0, 5);
    return out;
  });
  console.log(JSON.stringify(r));
  const d = r.drift, bo = r.boost, ra = r.ram, sw = r.saws, co = r.concrete, b = r.bomb;
  ok(d.hover.latMax >= 6 && d.hover.latMax >= 3 * d.outrider.latMax, `it drifts: sideways slide after a hard turn ${d.hover.latMax} m/s vs the Outrider's ${d.outrider.latMax} m/s (from ${d.hover.v0} / ${d.outrider.v0} m/s)`);
  ok(d.hover.settle !== null && d.hover.settle <= 1.3, `still easy to catch: let go of the stick and the slide is under 3 m/s after ${d.hover.settle} s`);
  ok(bo.rest > 0.2 && bo.rest < 0.7, `it hovers low: the skirt rides ${bo.rest} m off the ground`);
  ok(bo.peak >= 4 && bo.peak <= 5.2 && bo.tPeak >= 0.8, `J boosts it up to ${bo.peak} m (about 5, not more), reached after ${bo.tPeak} s`);
  ok(bo.vyMax <= 7 && bo.up3 >= 1.5, `it floats up, not a jump: top climb ${bo.vyMax} m/s, ${bo.up3} s above 3 m`);
  ok(bo.settled !== null && bo.settled <= 5.5 && bo.end < 0.7, `then it settles back onto its cushion: under 0.8 m after ${bo.settled} s, ${bo.end} m at the end`);
  ok(ra.hover.moved >= 1.8 * ra.outrider.moved && ra.hover.moved > 4, `it gets pushed around: the same 14 m/s Viper ram moved it ${ra.hover.moved} m vs the Outrider ${ra.outrider.moved} m`);
  ok(sw.n >= 6 && sw.minSide - sw.R * 0.5 >= sw.halfW && sw.maxX <= 1.4, `the saws are on its sides: ${sw.n} blades, every one at least ${sw.minSide} m out from the middle (hull half-width ${sw.halfW}, blade radius ${sw.R}), none further fore or aft than ${sw.maxX} m`);
  ok(ra.hover.saws >= 1 && ra.hover.rammerHurt >= ra.outrider.rammerHurt + 8 && ra.hover.hurt < ra.hover.rammerHurt, `the side saws cut the rammer: Viper lost ${ra.hover.rammerHurt} (vs ${ra.outrider.rammerHurt} ramming the Outrider), the hovercraft lost ${ra.hover.hurt} (saw hits ${ra.hover.saws})`);
  ok(ra.hoverNose.saws === 0, `a bump on the nose is just a bump: ${ra.hoverNose.saws} saw hits (Viper lost ${ra.hoverNose.rammerHurt})`);
  ok(co.hover.stuckFrames === 0 && co.hover.moved > 8 && co.hover.moved > 3 * co.outrider.moved, `wet concrete can't hold it: ${co.hover.moved} m in 2 s (never bogged) vs the Outrider ${co.outrider.moved} m (bogged ${co.outrider.stuckFrames} frames)`);
  for (const [k, what] of [['ahead', 'lobbed onto a car 18 m ahead'], ['behind', 'dropped behind onto a car 9 m back'], ['below', 'boosted up, dropped onto the car below']]) { const x = b[k];
    ok(x.fired && x.aimed && x.miss !== null && x.miss <= 4 && x.hurt >= 10, `a bomb ${what}: thrown from ${x.from} m up, landed ${x.miss} m from it, it lost ${x.hurt}`); }
  ok(b.below.from >= 4, `the boosted drop comes from high up: ${b.below.from} m`);
  ok(r.ai.boosts >= 1 && r.ai.maxUp >= 3 && r.ai.bombs >= 2 && r.ai.nearCar >= Math.max(1, Math.ceil(r.ai.landed.length * 0.3)) && r.ai.maxAbs < 150 && r.ai.escaped === 0, `the AI hovercraft boost (${r.ai.boosts}, up to ${r.ai.maxUp} m) and bomb (${r.ai.bombs}; ${r.ai.nearCar} of ${r.ai.landed.length} landed within 6 m of a car) and stay in the yard (max |x|,|z| ${r.ai.maxAbs}, escapes ${r.ai.escaped}), saw hits ${r.ai.sawHits}`);
  ok(r.kicksTotal === 0, `no solver kick undone on the hovercraft (${r.kicksScripted} scripted, ${r.ai.kicks} in AI play) ${JSON.stringify(r.physLog)}`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'HOVERCRAFT FAIL' : 'HOVERCRAFT PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
