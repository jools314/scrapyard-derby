// Stuck-record diagnostics in the play log: each stuck entry says how the car stood, not just where it was and what it touched.
// (Build 134's Mac autoplay had more stuck cars than 133, all over the map, and the old record could not say why.)
//  - the player's car, nose against the east perimeter wall with the throttle held (kept from creeping forward), is recorded as stuck with
//    hp (health), cb (crushed into a bale: 0/1), w (wheels touching / wheels), up (up-vector y), v0 (speed when it stopped),
//    as (the traction assist fired: 1, it pushed against the wall the whole time);
//  - an AI car held in place (it keeps its foot down, then backs out) also carries ai (its plan, '/rev' while reversing) and tg (whom it was after);
//  - a still-ongoing episode is listed with the same fields;
//  - the match record counts crusher slams and cars crushed (crusher: {slam, crush}).
// Waits on game time, not wall-clock time, so a loaded machine only makes it slower.
// The AI and crusher cases use fresh cars of known kinds, and every hold (the player's pin too) runs on the physics step, not a 10 ms timer
// that let a step's push or an assist hop through now and then (deterministic since 11-20). Before, the free-for-all
// before them wrecked a car now and then and its respawn was a new car object (the test then held or pressed a stale one: no record, crush 0),
// a tank hangs back on a low throttle, a spider or a coward sits in ambush with its foot off, and a forklift picked the held car up: none of
// those is stuck by the game's definition, so the record was rightly missing. Now the AI's episode is waited for (up to 30 s of play).
const { open } = require('./harness');
(async () => { const fails = []; const ok = (m, c, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m, d ? JSON.stringify(d) : ''); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } });
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, P = D.PLAYLOG, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.S.aiCount = 2; D.game.state = 'menu'; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    const waitSim = async (s) => { const s0 = D.simTime; for (let i = 0; i < 4000 && D.simTime - s0 < s; i++) await sleep(20); };
    const Y = new D.CANNON.Vec3(0, 1, 0), out = {};
    const C = D.CRUSHER; C.state = 'idle'; C.t = 999; // (keep the press out of the way until its own check)
    for (const [i, c] of D.cars.filter((k) => k !== D.player).entries()) { c.body.position.set(-40 + i * 12, 1.2, 60); c.body.velocity.set(0, 0, 0); } // AIs parked far from the wall
    // 1) the player: nose into the east wall (x 150..152), facing +x, foot down
    const c = D.player, b = c.body; b.position.set(150 - c.T.L / 2 - 0.3, 1.0, 20); b.quaternion.setFromAxisAngle(Y, 0); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0);
    await waitSim(1); const n0 = P.m.stuckN, px = b.position.x, pz = b.position.z; D.keys.add('ArrowUp');
    const pin = () => { b.position.x = Math.min(b.position.x, px); b.position.z = pz; b.velocity.x = Math.min(0, Math.max(-0.5, b.velocity.x)); b.velocity.z = 0; }; D.world.addEventListener('postStep', pin); // (the assist's hops bounce a free car off the wall now and then, which ends the episode: keep it from creeping forward, or bouncing back at 1 m/s, on every physics step: a 10 ms timer let a step's hop through now and then)
    await waitSim(5); out.during = { apS: c.__apS && { ...c.__apS }, stuckA: c.stuckA, contacts: c.contacts, x: +b.position.x.toFixed(2) };
    D.keys.delete('ArrowUp'); D.world.removeEventListener('postStep', pin); await waitSim(1.5);
    out.player = P.m.stuck.filter((e) => e.me).pop(); out.nAfter = P.m.stuckN - n0;
    // 2) an AI car held still where it stands (it throttles, then backs out: still wanting to move, going nowhere). A fresh Firetruck (a wheeled
    //    brawler: no tank's low hang-back throttle, no forks or hook, rarely an ambush), the other AI (a fresh Viper, for the press) held 30 m away
    const until = async (f, s) => { const s0 = D.simTime; for (let i = 0; i < 40000 && !f() && D.simTime - s0 < s; i++) await sleep(20); return !!f(); };
    const holdAt = (car, x, z) => { const hb = car.body; hb.position.set(x, 1.2, z); hb.velocity.set(0, 0, 0); hb.angularVelocity.set(0, 0, 0);
      const f = () => { hb.position.x = x; hb.position.z = z; hb.velocity.x = 0; hb.velocity.z = 0; }; D.world.addEventListener('postStep', f); return () => D.world.removeEventListener('postStep', f); }; // (on every physics step: a timer let a step's push through now and then)
    const others = D.cars.filter((k) => k !== D.player), a = D.respawnCar(others[0], 'firetruck'), v = D.respawnCar(others[1], 'viper');
    const freeA = holdAt(a, -40, 60), freeV = holdAt(v, -10, 60);
    out.aiHeld = await until(() => a.__apS && a.__apS.t >= 5, 30); out.aiOngoing = P.rec('ck', 'test').stuck.list.find((e) => e.ongoing && e.car === a.type);
    freeA(); out.aiFreed = await until(() => !a.__apS, 8); out.ai = P.m.stuck.filter((e) => e.car === a.type && !e.me).pop(); out.aiState = { mode: a.mode, wrecked: a.wrecked, inCars: D.cars.includes(a) };
    // 3) the crusher: a car in the press (kept there until it comes down), the press brought down
    freeV(); const freeP = holdAt(v, C.x, C.z); C.state = 'warn'; C.t = 0.2; out.pressDown = await until(() => C.state === 'hold', 5); freeP(); await waitSim(0.5);
    out.crusher = P.rec('ck', 'test').crusher; out.crushed = !!v.crushedBox; out.pressed = { car: v.type, inCars: D.cars.includes(v), skid: !!v.T.skid };
    return out; });
  console.log(JSON.stringify(r));
  const p = r.player || {}, a = r.ai || {}, o = r.aiOngoing || {};
  ok('the wedged player car is recorded as stuck', r.nAfter >= 1 && p.secs >= 4, { nAfter: r.nAfter, p });
  ok('stuck record has hp (rounded health) and cb (crushed bale 0/1)', Number.isInteger(p.hp) && p.hp > 0 && p.hp <= 100 && p.cb === 0, p);
  ok('stuck record has w (wheels touching/wheels) and the car was grounded', /^\d+\/\d+$/.test(p.w || '') && +p.w.split('/')[0] > 0, p);
  ok('stuck record has up (up-vector y, 2 decimals) and the car stood upright', typeof p.up === 'number' && p.up > 0.8 && p.up <= 1 && Math.round(p.up * 100) === p.up * 100, p);
  ok('stuck record has v0 (speed when it stopped, < 1 m/s)', typeof p.v0 === 'number' && p.v0 >= 0 && p.v0 < 1, p);
  ok('stuck record has as = 1: the traction assist fired against the wall', p.as === 1, { p, during: r.during });
  ok('the player (not autoplay) has no AI plan in its record', p.ai === undefined, p);
  ok('an AI car\'s stuck record has its plan (ai) and its target (tg)', r.aiHeld && r.aiFreed && typeof a.ai === 'string' && a.ai.length > 0 && typeof a.tg === 'string' && 'hp' in a && 'w' in a && 'up' in a && 'v0' in a && 'as' in a, { a, held: r.aiHeld, freed: r.aiFreed, state: r.aiState });
  ok('an ongoing episode is listed with the same fields', o.ongoing && typeof o.ai === 'string' && 'hp' in o && 'cb' in o && 'w' in o && 'up' in o && 'v0' in o && 'as' in o, o);
  ok('a stuck record stays small (< 220 chars)', JSON.stringify(p).length < 220 && JSON.stringify(a).length < 220, { p: JSON.stringify(p).length, a: JSON.stringify(a).length });
  ok('the match record counts crusher slams and cars crushed', r.crusher && r.crusher.slam >= 1 && r.crusher.crush >= 1 && r.crushed, { crusher: r.crusher, crushed: r.crushed, pressDown: r.pressDown, pressed: r.pressed });
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok('no page errors', pe.length === 0, pe.slice(0, 3));
  await browser.close(); console.log(fails.length ? 'STUCKDIAG FAIL' : 'STUCKDIAG PASS'); process.exit(fails.length ? 1 : 0); })();
