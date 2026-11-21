// AI reverse loop (BACKLOG, 11-21): an AI car nose-in against a wall whose reverse is slow (rear wheels in mud, under 1.2 m/s) must get free.
// Before the fix, stuckTimer counted the planned (positive) throttle while the reverse ran, so a car backing out at under 1.2 m/s got a new
// reverse the moment the old one ended (and the feelers, still seeing the wall within 4 m, re-armed it every frame too): it backed out at a
// crawl forever. Now a reverse that isn't moving the car (1.6 s under 1.2 m/s, over one reverse or a chain of them) gives up: the car drives
// out forwards on full lock towards its target, backing the other way if it noses in again (a three-point turn); a tank turns on the spot.
// Each car type (light cars, heavies, a tank) is parked nose-in a metre off a container-sized wall on flat ground (the perimeter walls all
// have a ramp at their foot), facing +x, with a sticky patch that lets it creep backwards at no more than 0.8 m/s (forwards and turning
// are free), its target held 40 m away behind it to the left. Free = within 8 s of game time it drives forwards at over 2 m/s turned more
// than 60 degrees off the wall for 0.4 s, or is 10 m from where it started (backing out at 0.8 m/s covers 6.4 m in 8 s).
// On Build 138 every car backs out at a crawl for the whole 8 s. (Bertha, 26 t, gets free too, but in ~11 s: not in the default list.)
// TYPES=viper,tiger picks the cars, LIM=20 runs longer, CAP=0.4 sets the reverse speed in the patch, FAR the distance, MUD=0 drops the patch.
// Waits on game time, not wall-clock time, so a loaded machine only makes it slower.
const { open } = require('./harness');
const TYPES = (process.env.TYPES || 'viper,outrider,firetruck,mixer,tiger').split(',');
(async () => { const fails = []; const ok = (m, c, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m, d ? JSON.stringify(d) : ''); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } });
  const r = await page.evaluate(async ([TYPES, LIM, MUD, CAP, FAR]) => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.S.aiCount = 2; D.game.state = 'menu'; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    D.CRUSHER.state = 'idle'; D.CRUSHER.t = 999;
    const Y = new D.CANNON.Vec3(0, 1, 0), FX = new D.CANNON.Vec3(1, 0, 0), f = new D.CANNON.Vec3(), out = [];
    const holdAt = (car, x, z) => { const hb = car.body; hb.position.set(x, 1.2, z); hb.velocity.set(0, 0, 0); hb.angularVelocity.set(0, 0, 0);
      const h = () => { hb.position.x = x; hb.position.z = z; hb.velocity.x = 0; hb.velocity.z = 0; }; D.world.addEventListener('postStep', h); return () => D.world.removeEventListener('postStep', h); };
    const waitSim = async (s) => { const s0 = D.simTime; for (let i = 0; i < 4000 && D.simTime - s0 < s; i++) await sleep(20); };
    const WX = -20, z0 = 58, wall = new D.CANNON.Body({ type: D.CANNON.Body.STATIC, mass: 0, material: D.world.bodies.find((k) => k.what === 'wall').material }); // a container on its side: face at x = -20
    wall.addShape(new D.CANNON.Box(new D.CANNON.Vec3(1.22, 1.3, 6.1))); wall.position.set(WX + 1.22, 1.3, z0); wall.isObstacle = true; wall.what = 'container'; D.world.addBody(wall);
    const freeP = holdAt(D.player, -45, 95); // the target: 40 m away, behind and to the left
    for (const type of TYPES) {
      const others = D.cars.filter((k) => k !== D.player), a = D.respawnCar(others[0], type), o = D.cars.filter((k) => k !== D.player && k !== a)[0];
      const freeO = o ? holdAt(o, -120, -120) : () => {};
      const b = a.body, x0 = WX - a.T.L / 2 - 1.0; // nose a metre off the wall, wheels down
      b.quaternion.setFromAxisAngle(Y, 0); const freeA = holdAt(a, x0, z0); a.ctrl.throttle = 0; await waitSim(0.6); freeA(); b.angularVelocity.set(0, 0, 0);
      a.mode = 'hunt'; a.modeT = 999; a.target = D.player; a.retarget = 999; a.health = 100;
      const mud = () => { if (!MUD || Math.hypot(b.position.x - x0, b.position.z - z0) > 14) return; b.quaternion.vmult(FX, f); f.y = 0; const n = Math.hypot(f.x, f.z) || 1, back = -(b.velocity.x * f.x + b.velocity.z * f.z) / n;
        if (back > CAP) { b.velocity.x += (back - CAP) * f.x / n; b.velocity.z += (back - CAP) * f.z / n; } }; // the rear wheels sink: backwards no faster than CAP
      D.world.addEventListener('postStep', mud);
      const s0 = D.simTime; let freeAt = null, fastT = 0, revT = 0, maxBack = 0, last = s0; const trace = [];
      for (let i = 0; i < 40000 && D.simTime - s0 < LIM; i++) { await sleep(20); const dt = D.simTime - last; last = D.simTime; if (dt <= 0) continue;
        if (a.wrecked || !D.cars.includes(a)) break;
        b.quaternion.vmult(FX, f); const yaw = Math.abs(Math.atan2(f.z, f.x)) * 180 / Math.PI, d = Math.hypot(b.position.x - x0, b.position.z - z0);
        if (a.reverseTimer > 0) revT += dt; maxBack = Math.max(maxBack, -a.speed);
        fastT = a.speed > 2 && yaw > 60 ? fastT + dt : 0;
        if (trace.length < 60 && (D.simTime - s0) > trace.length * 0.4) trace.push([+(D.simTime - s0).toFixed(1), +a.speed.toFixed(1), Math.round(yaw), +d.toFixed(1), a.reverseTimer > 0 ? 'R' : a.fwdTimer > 0 ? 'F' : '-']);
        if (fastT > 0.4 || d > FAR) { freeAt = +(D.simTime - s0).toFixed(1); break; } }
      D.world.removeEventListener('postStep', mud); freeO();
      out.push({ type, mass: b.mass, freeAt, revT: +revT.toFixed(1), maxBack: +maxBack.toFixed(2), wrecked: !!a.wrecked, trace: freeAt === null ? trace : undefined });
    }
    freeP(); D.world.removeBody(wall); return out; }, [TYPES, +process.env.LIM || 8, process.env.MUD !== "0", +process.env.CAP || 0.8, +process.env.FAR || 10]);
  for (const e of r) ok(`${e.type} (${e.mass} kg) nose-in at a wall with a slow reverse gets free within 8 s`, e.freeAt !== null && !e.wrecked, e);
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok('no page errors', pe.length === 0, pe.slice(0, 3));
  await browser.close(); console.log(fails.length ? 'REVLOOP FAIL' : 'REVLOOP PASS'); process.exit(fails.length ? 1 : 0); })();
