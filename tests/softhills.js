// Soft hills: cars must not end up stuck on the corners and edges of the yard's hills.
//  - The ends of the four banked corners (A): each 30° bank used to stop at the wall in a 6 m-tall open end, so a car driving
//    beside the wall hit the bank's edge at roof height or drove in under it and stuck in the narrowing tunnel. Now a solid
//    lead-in wedge takes it up onto the bank. Every bend end, low car, tank and heavy truck, at speed, plus a slow crawl.
//  - Ramp and tabletop crests (B): rounded, so a car dropped across a crest (along, diagonal, sideways) rolls off it (on main a fire
//    truck lying across the fire-pit kicker's crest sometimes stayed beached), and a long truck crawling over a launch ramp gets over.
//  - Ramp toes (C): a long heavy truck crawling onto a ramp's foot at an angle gets up it.
//  - Jumps still launch (D): the launch ramp still throws a fast car high and the fire-pit kicker still clears the pit.
// Cars are AI cars with their brains switched off (think stubbed, ctrl zeroed) and the throttle held down; "stuck" means it
// moved less than 1.5 m in 3 s with the throttle on. Fails on main at the bank ends (A).
const { open } = require('./harness');
(async () => { const fails = []; const ok = (m, c, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m, d ? JSON.stringify(d) : ''); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } });
  const A = 150, D2R = Math.PI / 180, yaw = (dx, dz) => Math.atan2(-dz, dx), lanes = [];
  // A: bank ends. A bend runs from (±A, ±104) along the walls; drive beside the wall towards it from 32 m out.
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    for (const type of ['viper', 'tiger', 'firetruck']) {
      // (a tank with nobody steering crawls up any 30° bank to the wall's top edge and leans there, here too: for it, passing = it
      // climbed up onto the bank at the bend's end, where on main it stopped dead at ground level)
      const tank = type === 'tiger' ? { onBank: 4 } : {};
      lanes.push(Object.assign({ g: 'A', n: `bank end ${sx > 0 ? 'E' : 'W'} wall (${sx * A}, ${sz * 104}) ${type}`, type, x: sx * (A - 4), z: sz * 72, yaw: yaw(0, sz), secs: 16, need: 34, minTop: 2 }, tank));
      lanes.push(Object.assign({ g: 'A', n: `bank end ${sz > 0 ? 'N' : 'S'} wall (${sx * 104}, ${sz * A}) ${type}`, type, x: sx * 72, z: sz * (A - 4), yaw: yaw(sx, 0), secs: 16, need: 34, minTop: 2 }, tank));
    }
  }
  for (const type of ['outrider', 'tiger', 'firetruck']) lanes.push({ g: 'A', n: `bank end E wall, inner lane, crawling ${type}`, type, x: 142.5, z: 80, yaw: yaw(0, 1), secs: 18, need: 26, cap: 3, minTop: 1.8, onBank: type === 'tiger' ? 4 : 0 });
  // B: crests (car dropped across the top, throttle on): launch ramp, both fire-pit kickers, a tabletop
  const kx = Math.cos(Math.PI / 4) * 80, kd = [-Math.sin(Math.PI / 4), Math.cos(Math.PI / 4)];
  const crests = [['launch ramp N', 0, 88.75, 5.6, 0, -1], ['fire-pit kicker W', 31, -100, 3.8, 1, 0], ['fire-pit kicker E', 45.4, -100, 3.8, -1, 0], ['tabletop NE', kx + kd[0] * 6.2, kx + kd[1] * 6.2, 2.7, kd[0], kd[1]]];
  for (const [name, x, z, y, ux, uz] of crests) for (const [type, ang] of [['viper', 0], ['tiger', 45], ['firetruck', 90], ['combine', 0]]) {
    const r = ang * D2R; lanes.push({ g: 'B', n: `${name} crest, ${type} across at ${ang}°`, type, x, z, y, yaw: yaw(ux * Math.cos(r) - uz * Math.sin(r), ux * Math.sin(r) + uz * Math.cos(r)), secs: 8, need: 6 });
  }
  // B2: crawling up and over a launch ramp's crest (a long truck must not end up balanced on its belly on top)
  for (const type of ['firetruck', 'combine', 'viper']) lanes.push({ g: 'B', n: `launch ramp N crest, ${type} crawling over it`, type, x: 0, z: 118, yaw: yaw(0, -1), secs: 16, need: 30, cap: 3 });
  // C: toes, crawling in at 35°
  for (const [name, tx, tz, ux, uz] of [['fire-pit kicker W', 19.3, -100, 1, 0], ['mesa ramp E', 24, -6, -1, 0], ['launch ramp S', 0, -103, 0, 1]]) for (const type of ['combine', 'firetruck', 'viper']) {
    const r = 35 * D2R, dx = ux * Math.cos(r) - uz * Math.sin(r), dz = ux * Math.sin(r) + uz * Math.cos(r);
    lanes.push({ g: 'C', n: `${name} toe, ${type} crawling in at 35°`, type, x: tx - dx * 9, z: tz - dz * 9, yaw: yaw(dx, dz), secs: 10, need: 14, cap: 2 });
  }
  // D: jumps still launch
  lanes.push({ g: 'D', n: 'launch ramp N still launches a fast viper', type: 'viper', x: 0, z: 118, yaw: yaw(0, -1), secs: 8, need: 40, minTop: 7 });
  lanes.push({ g: 'D', n: 'fire-pit kicker W still clears the pit (outrider)', type: 'outrider', x: 12, z: -100, yaw: yaw(1, 0), secs: 8, need: 40, clearPit: true, minTop: 4.5 });

  if (process.env.ONLY) { const keep = lanes.filter((t) => process.env.ONLY.includes(t.g)); lanes.length = 0; lanes.push(...keep); } // e.g. ONLY=D to rerun one group
  const res = await page.evaluate(async (lanes) => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.S.aiCount = 2; D.game.state = 'menu'; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, 130 - bl.id * 5);
    const out = [];
    for (const t of lanes) {
      const c = D.respawnCar(D.cars[1], t.type); c.think = () => {}; /* brain off: only the throttle below drives it */
      for (const k in c.ctrl) c.ctrl[k] = typeof c.ctrl[k] === 'number' ? 0 : false;
      for (const o of D.cars) if (o !== c) { o.think = () => {}; for (const k in o.ctrl) o.ctrl[k] = typeof o.ctrl[k] === 'number' ? 0 : false; o.body.position.set(-120 + D.cars.indexOf(o) * 9, 1.5, 125); o.body.velocity.set(0, 0, 0); }
      const b = c.body; b.quaternion.setFromEuler(0, t.yaw, 0); b.position.set(t.x, (t.y || 0) + 1.2, t.z); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0);
      const s0 = D.simTime, hist = []; let stuck = null, far = 0, top = 0, pitX = 0;
      while (D.simTime - s0 < t.secs) { await sleep(15);
        c.health = 100; c.wrecked = false; c.ctrl.throttle = 1; c.ctrl.steer = 0;
        if (t.cap) { const v = b.velocity, hs = Math.hypot(v.x, v.z); if (hs > t.cap) { v.x *= t.cap / hs; v.z *= t.cap / hs; } } /* a slow, careful driver */
        const p = b.position, st = D.simTime - s0; top = Math.max(top, p.y); far = Math.max(far, Math.hypot(p.x - t.x, p.z - t.z));
        if (Math.abs(p.z + 100) < 6 && p.x > 34 && p.x < 42.5 && p.y < 2.2) pitX = 1; /* touched down in the fire pit */
        hist.push([st, p.x, p.z]);
        if (far >= t.need) break;
        if (st > 3.5) { const old = hist.find((h) => h[0] >= st - 3); if (old && Math.hypot(p.x - old[1], p.z - old[2]) < 1.5) { stuck = { t: +st.toFixed(1), x: +p.x.toFixed(1), y: +p.y.toFixed(2), z: +p.z.toFixed(1) }; break; } }
      }
      out.push({ far: +far.toFixed(1), stuck, top: +top.toFixed(1), inPit: !!pitX, t: +(D.simTime - s0).toFixed(1) });
    }
    return out; }, lanes);
  lanes.forEach((t, i) => { const r = res[i];
    let pass = !r.stuck && r.far >= t.need; if (t.onBank) pass = r.top >= t.onBank; // (it got up onto the bank at its end: on main it stopped there at ground level) if (t.minTop) pass = pass && r.top >= t.minTop; if (t.clearPit) pass = pass && !r.inPit;
    ok(`[${t.g}] ${t.n}`, pass, Object.assign({ need: t.need }, r)); });
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok('no page errors (a badly wound hill shape logs one)', pe.length === 0, pe.slice(0, 2).map((e) => e.slice(0, 300)));
  await browser.close(); console.log(fails.length ? `SOFTHILLS FAIL (${fails.length} of ${lanes.length + 1})` : `SOFTHILLS PASS (${lanes.length + 1} checks)`); process.exit(fails.length ? 1 : 0); })();
