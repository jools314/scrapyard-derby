// Anansi the Spider-Walker (build 72): eight legs, no wheels. It walks straight, turns both ways and reverses; its feet plant and swing
// with speed; it climbs a container and stays on top; its web pins the car in front for ~3 s; heavy rams snap legs (debris flies, it gets
// slower); under four legs it's a wreck; the AI uses the web; a remote (snapshot-driven) spider still walks its legs. Prints SPIDER PASS / SPIDER FAIL.
const { open } = require('./harness');
(async () => { const fails = []; const ok = (m, c, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m, d !== undefined ? JSON.stringify(d) : ''); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 1; __derby.S.autoGfx = false; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 180000 });
  await page.evaluate(() => { const D = __derby; window.T = { D, sleep: (ms) => new Promise((r) => setTimeout(r, ms)), wt: async (s) => { const t0 = D.game.time; while (D.game.time - t0 < s) await new Promise((r) => setTimeout(r, 20)); },
    park(c, x, z, yaw) { c.body.position.set(x, c.T.walker ? 2.2 : 1.6, z); c.body.quaternion.setFromEuler(0, yaw || 0, 0); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); },
    spider: async (x = -60, z = 75, yaw = 0) => { D.respawnCar(D.player, 'spider'); await T.wt(0.2); const c = D.player; T.go(0); T.park(c, x, z, yaw); c.health = 100; await T.wt(1.2); return c; },
    ai: async (type) => { let ai = D.cars.find((x) => x !== D.player); if (ai.type !== type || ai.wrecked) { D.respawnCar(ai, type); await T.wt(0.2); ai = D.cars.find((x) => x !== D.player); } ai.think = () => {}; ai.ctrl.throttle = 0; ai.ctrl.steer = 0; ai.ctrl.fire = false; ai.health = 100; return ai; },
    go: (thr, steer = 0) => { D.touch.throttle = thr; D.touch.steer = steer; },
    yaw: (c) => { const f = c.body.quaternion.vmult(new D.CANNON.Vec3(1, 0, 0)); return Math.atan2(-f.z, f.x); } };
    window.AUTO_OFF = true; D.AUTO.on = false; for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4); });

  // 1. it walks: straight, both turns, reverse
  const walk = await page.evaluate(async () => { const { D, wt } = T, out = {}; const ai = await T.ai('viper'); T.park(ai, -120, 120);
    const run = async (thr, steer, s) => { const c = await T.spider(); const p0 = c.body.position.clone(), y0 = T.yaw(c); T.go(thr, steer); let acc = 0, py = y0;
      const t0 = D.game.time; while (D.game.time - t0 < s) { await T.sleep(20); const y = T.yaw(c); let d = y - py; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; acc += d; py = y; }
      T.go(0); const mv = c.body.position.vsub(p0); return { fwd: +mv.x.toFixed(1), yaw: Math.round(acc * 57.3), y: +c.body.position.y.toFixed(2), up: +c.up.y.toFixed(2) }; };
    out.straight = await run(1, 0, 3); out.left = await run(1, 1, 2.5); out.right = await run(1, -1, 2.5); out.back = await run(-1, 0, 3); return out; });
  ok('walks straight (>25 m in 3 s, straight, stands at ~1.45 m, upright)', walk.straight.fwd > 25 && Math.abs(walk.straight.yaw) < 10 && walk.straight.y > 1.2 && walk.straight.y < 1.8 && walk.straight.up > 0.95, walk.straight);
  ok('turns left', walk.left.yaw > 60, walk.left); ok('turns right', walk.right.yaw < -60, walk.right); ok('reverses', walk.back.fwd < -8, walk.back);

  // 2. the legs: feet stay planted while it stands, swing along while it walks, and step faster with speed
  const legs = await page.evaluate(async () => { const { D, wt } = T; const c = await T.spider(); await wt(1);
    const feet = () => c.legs.map((l) => l.foot.clone()), moved = (a) => c.legs.map((l, i) => l.foot.distanceTo(a[i]));
    let f0 = feet(); await wt(1); const still = Math.max(...moved(f0));
    let steps = 0; const count = () => c.legs.filter((l) => l.t >= 0).length;
    const swing = async (thr, s) => { T.go(thr); let n = 0, was = c.legs.map((l) => l.t >= 0); const t0 = D.game.time; while (D.game.time - t0 < s) { await T.sleep(16); c.legs.forEach((l, i) => { const now = l.t >= 0; if (now && !was[i]) n++; was[i] = now; }); } return n / s; };
    f0 = feet(); const slow = await swing(0.3, 2), fast = await swing(1, 2); const walked = Math.min(...moved(f0));
    T.go(0); await wt(1.5); const m = new D.THREE.Matrix4(); c.legIM[1].getMatrixAt(0, m); const footY = c.legs.map((l) => +l.foot.y.toFixed(2));
    return { still: +still.toFixed(3), walked: +walked.toFixed(1), stepsPerSecSlow: +slow.toFixed(1), stepsPerSecFast: +fast.toFixed(1), footY, contacts: c.contacts, legInit: c.legInit, drawn: m.elements.some((e, i) => i !== 15 && e !== 0) }; });
  ok('feet stay planted while it stands still', legs.still < 0.05, legs);
  ok('every foot moves along while it walks', legs.walked > 8, legs);
  ok('more steps at speed than at a crawl', legs.stepsPerSecFast > legs.stepsPerSecSlow && legs.stepsPerSecSlow > 0, legs);
  ok('feet stand on the ground (y ~ 0)', legs.footY.every((y) => Math.abs(y) < 0.25), legs.footY);
  ok('legs are drawn (instanced)', legs.drawn, legs);

  // 3. it climbs a container (one-high, at x 92, z -110, long side along z) and stays on top
  const climb = await page.evaluate(async () => { const { D, wt } = T; const c = await T.spider(92, -127, -Math.PI / 2); const y0 = c.body.position.y; T.go(0.7); let top = 0;
    const t0 = D.game.time; while (D.game.time - t0 < 8) { await T.sleep(20); if (c.body.position.y > 3.6 && Math.abs(c.body.position.z + 110) < 4) break; }
    T.go(0); await wt(2.5); const p = c.body.position; return { y0: +y0.toFixed(2), y: +p.y.toFixed(2), x: +p.x.toFixed(1), z: +p.z.toFixed(1), up: +c.up.y.toFixed(2), frontFoot: +c.legs[0].foot.y.toFixed(2) }; });
  ok('climbs onto the container (body ~1.45 m above its 2.6 m top) and stays there', climb.y > 3.6 && climb.y < 4.6 && Math.abs(climb.x - 92) < 1.3 && Math.abs(climb.z + 110) < 6 && climb.up > 0.9 && climb.frontFoot > 2.3, climb);

  // 4. the web pins the car in front for ~3 s, however hard it pushes
  const web = await page.evaluate(async () => { const { D, wt } = T; const c = await T.spider(-60, 75, 0); const ai = await T.ai('outrider'); T.park(ai, -46, 75, 0); await wt(0.5);
    c.specialCd = 0; c.ctrl.fire = true; await wt(0.1); ai.ctrl.throttle = 1; const p0 = ai.body.position.clone(); let vmax = 0; const t0 = D.game.time;
    while (D.game.time - t0 < 2.6) { await T.sleep(20); vmax = Math.max(vmax, Math.hypot(ai.body.velocity.x, ai.body.velocity.z)); }
    const held = ai.body.position.vsub(p0).length(), webbed = ai.webbedT > 0, line = !!(c.webLine && c.webLine.visible);
    await wt(1.4); const p1 = ai.body.position.clone(); await wt(1.5); const after = ai.body.position.vsub(p1).length(); ai.ctrl.throttle = 0;
    return { webbed, line, held: +held.toFixed(2), vmax: +vmax.toFixed(2), freedAfter: +after.toFixed(1), cd: +c.specialCd.toFixed(1) }; });
  ok('web pins the car in front: ~0 speed for ~3 s with the throttle down', web.webbed && web.line && web.held < 1.0 && web.vmax < 1.5, web);
  ok('...then it lets go (the car drives off) and the web is on cooldown', web.freedAfter > 4 && web.cd > 0, web);

  // 5. heavy rams snap legs (debris flies, the spider gets slower); under four legs it's a wreck
  const snap = await page.evaluate(async () => { const { D, wt } = T; const c = await T.spider(-60, 75, 0); const ai = await T.ai('tanker'); T.park(ai, -60, 64, Math.PI / 2); await wt(0.4);
    const d0 = D.debris.length, n0 = c.wheelLost.filter(Boolean).length; { const t0 = D.game.time; while (D.game.time - t0 < 1.5) { if (ai.body.position.z < c.body.position.z - 3.5) { ai.body.velocity.set(0, 0, 13); ai.body.wakeUp(); } await T.sleep(16); } } // driven straight at its flank at 47 km/h
    const lost = c.wheelLost.filter(Boolean).length - n0, debris = D.debris.length - d0; T.park(ai, -120, 120);
    const top = async () => { const s = await T.spider(-60, 75, 0); return s; };
    let s = await top(); T.go(1); await wt(2.5); const v8 = s.speed; T.go(0);
    s = await top(); for (const i of [1, 2, 5]) s.loseWheel(i, null); await wt(0.5); T.go(1); await wt(2.5); const v5 = s.speed; T.go(0); const climb5 = s.canClimb;
    const wreckedAt5 = s.wrecked; s.loseWheel(6, null); await wt(0.3); const at4 = s.wrecked; s.loseWheel(7, null); await wt(0.5);
    return { lost, debris, v8: +v8.toFixed(1), v5: +v5.toFixed(1), climb5, wreckedAt5, at4, at3: s.wrecked }; });
  ok('a heavy ram (7.5 t tanker at 47 km/h) snaps a leg off and it flies as debris', snap.lost >= 1 && snap.debris >= 1, snap);
  ok('losing legs makes it slower (5 legs vs 8) and stops it climbing', snap.v5 < snap.v8 * 0.85 && !snap.climb5, snap);
  ok('under 4 legs it is a wreck (not at 5 or 4)', !snap.wreckedAt5 && !snap.at4 && snap.at3, snap);

  // 6. the AI uses the web on a car running in front of it
  const aiweb = await page.evaluate(async () => { const { D, wt } = T; D.respawnCar(D.player, 'viper'); await wt(0.3); let sp = D.cars.find((x) => x !== D.player); D.respawnCar(sp, 'spider'); await wt(0.3); sp = D.cars.find((x) => x !== D.player);
    T.park(sp, -60, 75, 0); T.park(D.player, -45, 75, 0); D.S.aiSkill = 0.8; let caught = false; const t0 = D.game.time;
    while (D.game.time - t0 < 15 && !caught) { await T.sleep(30); T.go(0.5); if (D.player.webbedT > 0) caught = true; if (D.player.body.position.distanceTo(sp.body.position) > 30) T.park(D.player, sp.body.position.x + sp.fwd.x * 14, sp.body.position.z + sp.fwd.z * 14, Math.atan2(-sp.fwd.z, sp.fwd.x)); }
    T.go(0); return { caught, secs: +(D.game.time - t0).toFixed(1), webs: D.PLAYLOG.m && D.PLAYLOG.m.veh.spider ? D.PLAYLOG.m.veh.spider.webs : null }; });
  ok('the AI spider webs a car in front of it', aiweb.caught, aiweb);

  // 7. a remote spider (a guest's copy, moved only by snapshots) still walks its legs
  const ghost = await page.evaluate(async () => { const { D, wt } = T; const sp = D.cars.find((x) => x !== D.player); D.respawnCar(sp, 'spider'); await wt(0.5); const g = D.cars.find((x) => x !== D.player);
    T.park(g, -60, 90, 0); await wt(1); g.ghost = true; g.body.type = D.CANNON.Body.KINEMATIC; g.body.updateMassProperties(); g.body.position.y = 1.45; const f0 = g.legs.map((l) => l.foot.clone());
    const t0 = D.game.time; while (D.game.time - t0 < 2) { await T.sleep(16); g.body.velocity.set(8, 0, 0); }
    const moved = Math.min(...g.legs.map((l, i) => l.foot.distanceTo(f0[i]))); g.body.velocity.set(0, 0, 0); return { moved: +moved.toFixed(1), x: +g.body.position.x.toFixed(1) }; });
  ok('a remote spider moved only by snapshots walks its legs', ghost.moved > 8, ghost);

  // 8. Anansi's lines: every event, roasts of and by everybody, a horn line
  const cast = await page.evaluate(() => { const D = __derby, P = D.CAR_CAST.spider, evs = ['start', 'hitYou', 'gotHit', 'wheel', 'low', 'wrecked', 'gloat', 'air', 'taunt', 'fire', 'charge', 'flee', 'crash', 'respawn', 'onFire', 'rodeo', 'burger', 'rival', 'kill'];
    const n = Object.values(P.lines).reduce((a, l) => a + l.length, 0), missing = evs.filter((e) => !(P.lines[e] && P.lines[e].length));
    const others = Object.values(D.CAR_CAST).filter((x) => x !== P).concat([D.COP]), by = D.ROAST_BY.get(P), noRoastOf = others.filter((o) => !by.get(o.nick)).map((o) => o.nick), noRoastBy = others.filter((o) => !(D.ROAST_BY.get(o) && D.ROAST_BY.get(o).get(P.nick))).map((o) => o.nick);
    return { n, missing, noRoastOf, noRoastBy, horn: !!D.hornLine && true }; });
  ok('Anansi has lines for every event (~95 with roasts and horn)', cast.missing.length === 0 && cast.n >= 70, cast);
  ok('Anansi roasts every other driver, and every other driver roasts Anansi', !cast.noRoastOf.length && !cast.noRoastBy.length, cast);

  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok('no page errors', pe.length === 0, pe.slice(0, 3));
  await browser.close(); console.log(fails.length ? 'SPIDER FAIL' : 'SPIDER PASS'); process.exit(fails.length ? 1 : 0); })();
