// Regression: drive long/heavy/slow vehicles through the play-log stuck hotspots with the real AI brain (Car.think) chasing a
// parked target placed beyond the hotspot. Fails if any car is stuck (throttle on, < 1 m/s) for more than 4 s in a row.
const { open } = require('./harness');
const SPOTS = [
  ['centre drum/ramp/pillar', [[-40, 32, 30, 30], [30, 34, -40, 28], [-30, 10, 10, 45], [10, 50, -25, 15], [-9, 60, -9, 5], [-35, 22, 20, 36]]],
  ['fire pit', [[38, -135, 38, -75], [38, -75, 38, -135], [30, -130, 46, -80], [46, -78, 30, -132], [0, -110, 75, -104], [75, -110, 0, -106]]],
  ['pillar 36,-21 + drum', [[10, -40, 55, 5], [55, -5, 5, -30], [30, 5, 30, -45]]],
  ['east wall -20', [[130, -60, 138, 10], [136, 20, 132, -60], [110, -10, 140, -40]]],
  ['east wall 95 / bank end', [[138, 60, 100, 138], [100, 138, 141, 60], [115, 80, 146, 80], [146, 70, 120, 130]]],
  ['south wall containers', [[0, -140, 80, -143], [80, -140, 0, -143], [40, -110, 42, -146]]],
  ['bank corners', [[146, 60, 60, 146], [60, 146, 146, 60], [-146, -60, -60, -146], [88, -143, 146, -60], [146, -50, 80, -144]]],
  ['SW container -95,-118 (Bertha)', [[-60, -124, -120, -130], [-120, -130, -60, -120], [-87, -100, -90, -146], [-110, -140, -70, -105]]],
  ['south launch ramp -1,-106', [[0, -135, 0, -70], [-20, -110, 20, -100], [15, -112, -20, -104]]],
  ['west lane -145,-83 (Gap mesa / bank end)', [[-146, -84, -146, -20], [-144, -20, -138, -82], [-120, -85, -148, -80]]],
  ['quarter pipe ends', [[146, -60, 146, 60], [146, 60, 146, -60], [120, -40, 147, 10]]],
];
const TRACE = process.env.TRACE || '';
// QUICK=1 (the quick suite): the first two approaches to each spot, fire truck + mixer + Bertha (the cars the play logs caught most)
const QUICK = !!process.env.QUICK;
const TYPES = (process.env.TYPES || (QUICK ? 'firetruck,mixer,bertha' : 'firetruck,forklift,mixer,dozer,bertha')).split(',');
if (QUICK) for (const sp of SPOTS) sp[1] = sp[1].slice(0, 2);
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } }); if (TRACE) page.on('console', (m) => { if (m.type() === 'log') console.log(m.text()); }); await page.waitForTimeout(1200);
  const out = await page.evaluate(async ({ SPOTS, TYPES, only, TRACE }) => {
    window.__noRender = true; const D = __derby, DT = 1 / 60, Y = new D.CANNON.Vec3(0, 1, 0);
    let seed = 12345; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    D.S.aiCount = 1; D.S.autoGfx = false; D.game.state = 'menu'; D.startMatch(); D.game.countdown = 0; D.game.grace = 0; D.game.paused = true;
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    const res = [];
    for (const [name, apps] of SPOTS) { if (only && !name.includes(only)) continue;
      for (const [ax, az, gx, gz] of apps) for (const type of TYPES) {
        seed = 1000 + res.length * 77; // every run starts from a fresh yard (props and debris back in place), seeded
        D.game.state = 'menu'; D.startMatch(); D.game.countdown = 0; D.game.grace = 0; D.game.paused = true;
        for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
        // the car under test is an AI car (its own flip/stuck recovery applies, as in a match); the parked target is the player's car
        let P = D.cars.find((c) => c !== D.player); P = D.respawnCar(P, type) || D.cars.find((c) => c !== D.player); const T = D.player;
        T.ctrl.throttle = 0; T.ctrl.steer = 0; T.ctrl.fire = false;
        const park = () => { T.body.position.set(gx, 1.2, gz); T.body.velocity.set(0, 0, 0); T.body.angularVelocity.set(0, 0, 0); T.body.quaternion.set(0, 0, 0, 1); T.health = 100; };
        park(); const yaw = Math.atan2(-(gz - az), gx - ax);
        P.body.position.set(ax, 2.5, az); P.body.quaternion.setFromAxisAngle(Y, yaw); P.body.velocity.set(0, 0, 0); P.body.angularVelocity.set(0, 0, 0); P.health = 100;
        P.target = T; P.mode = 'hunt'; P.modeT = 3; P.reverseTimer = 0; P.stuckTimer = 0;
        for (let i = 0; i < 30; i++) { P.ctrl.throttle = 0; for (const c of D.cars) c.frameUpdate(DT); D.world.step(DT); park(); }
        let st = 0, anc = null, worst = 0, at = null, reached = false, minD = 1e9; const why = [];
        for (let i = 0; i < 60 * 30; i++) {
          P.health = 100; P.think(DT); T.ctrl.throttle = 0; T.ctrl.steer = 0; T.ctrl.handbrake = true; for (const c of D.cars) c.frameUpdate(DT); D.world.step(DT); park();
          const b = P.body; if (TRACE && TRACE === type + '@' + ax + ',' + az && i % 30 === 0) console.log(`${(i / 60).toFixed(1)} ${b.position.x.toFixed(1)},${b.position.y.toFixed(1)},${b.position.z.toFixed(1)} v${Math.hypot(b.velocity.x, b.velocity.z).toFixed(1)} thr${P.ctrl.throttle.toFixed(1)} st${P.ctrl.steer.toFixed(1)} ${P.mode} trap${(P.trapT || 0).toFixed(1)} esc${(P.escapeT || 0).toFixed(1)} hops${P.trapHops || 0} ${D.touching(P)}`); const hv = Math.hypot(b.velocity.x, b.velocity.z), d = Math.hypot(b.position.x - gx, b.position.z - gz); minD = Math.min(minD, d);
          if (d < P.T.L / 2 + 5) { reached = true; break; }
          // stuck = time spent wanting to move (throttle either way) at < 1.5 m/s without ever getting 2 m from where it was (rocking in place counts; a tight circle at speed doesn't)
          if (!anc || Math.hypot(b.position.x - anc.x, b.position.z - anc.z) > 2) { anc = { x: b.position.x, z: b.position.z }; st = 0; }
          else if (Math.abs(P.ctrl.throttle) > 0.3 && hv < 1.5) { st += DT; if (st > worst) { worst = st; at = { x: Math.round(b.position.x), z: Math.round(b.position.z), y: +b.position.y.toFixed(1), up: +P.up.y.toFixed(2), wh: P.contacts, touch: D.touching ? D.touching(P) : undefined }; } }
        }
        res.push({ spot: name, from: [ax, az], to: [gx, gz], type, worst: +worst.toFixed(1), reached, minD: Math.round(minD), at });
      }
    }
    return res; }, { SPOTS, TYPES, only: process.env.ONLY || '', TRACE });
  let bad = 0;
  for (const r of out) { const f = r.worst > 4; if (f) bad++; console.log(`${f ? 'FAIL' : 'PASS'} ${r.spot.padEnd(24)} ${r.type.padEnd(9)} ${JSON.stringify(r.from)}->${JSON.stringify(r.to)} worstStuck ${r.worst}s ${r.reached ? 'reached' : 'NOT reached (min ' + r.minD + ' m)'}${r.at && r.worst > 1 ? ' at ' + JSON.stringify(r.at) : ''}`); }
  const unreached = out.filter((r) => !r.reached).length;
  if (!bad) console.log('STUCKSPOTS PASS');
  console.log(`${out.length - bad}/${out.length} runs never stuck > 4 s; ${out.length - unreached}/${out.length} reached the target`, JSON.stringify(errors.filter((e) => !e.includes('ERR_FAILED')).slice(0, 3)));
  await browser.close(); process.exit(bad ? 1 : 0);
})();
