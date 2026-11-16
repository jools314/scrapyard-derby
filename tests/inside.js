// The "car inside an object" detector (INSIDE): a car held inside a container, a perimeter wall, a crusher post and a
// pillar is flagged after ~2 s with the right position and kind, logged in the play-log record (`inside`) and the network
// log; a car parked right next to a container is not flagged; the check stays cheap; no page errors.
// (waits on game time, not wall-clock time, so a loaded machine only makes it slower)
const { open } = require('./harness');
(async () => { const fails = []; const ok = (m, c, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m, d ? JSON.stringify(d) : ''); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } });
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, I = D.INSIDE, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.S.aiCount = 1; D.game.state = 'menu'; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    const c = D.player, b = c.body, Y = new D.CANNON.Vec3(0, 1, 0), hy = -0.2 + c.T.H / 2, out = { list: I.list.length, kinds: {} };
    for (const o of I.list) out.kinds[I.what(o)] = (out.kinds[I.what(o)] || 0) + 1;
    let hold = null; const iv = setInterval(() => { if (!hold) return; b.position.set(hold.x, hold.y, hold.z); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0); b.quaternion.setFromAxisAngle(Y, hold.yaw || 0); }, 10);
    const waitSim = async (s) => { const s0 = D.simTime; for (let i = 0; i < 3000 && D.simTime - s0 < s; i++) await sleep(20); };
    const clear = async () => { hold = { x: 0, y: 1.2, z: -60 }; b.collisionResponse = false; await waitSim(2.2); hold = null; b.collisionResponse = true; I.last = null; c.__in = 0; c.__inE = null; };
    const inside = async (name, x, y, z, yaw) => { await clear(); const n0 = I.total; hold = { x, y: y - hy, z, yaw }; b.collisionResponse = false; const s0 = D.simTime;
      for (let i = 0; i < 3000 && D.simTime - s0 < 6 && I.total === n0; i++) await sleep(20);
      out[name] = { flagged: I.total > n0, after: +(D.simTime - s0).toFixed(1), e: I.last }; hold = null; b.collisionResponse = true; };
    await inside('container', 92, 1.3, -110, Math.PI / 2); // the lone container in the north yard (yaw 90°, 12.2 m long along z)
    await inside('wall', 151, 2.0, 20, Math.PI / 2); // the east perimeter wall (x 150..152)
    const C = D.CRUSHER; await inside('post', C.x + (C.hx + 0.35), 2.0, C.z + (C.hz + 0.75), Math.PI / 4); // a crusher post (0.8 m square: only the hull centre fits)
    await inside('pillar', Math.cos(Math.PI / 6) * 42, 2.0, Math.sin(Math.PI / 6) * 42, 0); // a round concrete pillar (cylinder: convex test)
    // parked right next to the container (not in it): long side 0.4 m off its wall, left to settle on its own wheels
    await clear(); const n0 = I.total, x = 92 - 1.22 - c.T.W / 2 - 0.4; b.position.set(x, 1.2, -110); b.quaternion.setFromAxisAngle(Y, Math.PI / 2); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0);
    await waitSim(5); out.beside = { flagged: I.total > n0, pos: [+b.position.x.toFixed(2), +b.position.z.toFixed(2)], e: I.last };
    clearInterval(iv);
    // cost: time the check on its own, with all the cars in play spread round the yard
    let worst = 0, sum = 0; for (let i = 0; i < 50; i++) { const t0 = performance.now(); I.check(); const ms = performance.now() - t0; sum += ms; if (ms > worst) worst = ms; }
    out.cost = { avgMs: +(sum / 50).toFixed(3), worstMs: +worst.toFixed(3), cars: D.cars.length, inGame: { n: I.n, avgMs: +(I.msSum / Math.max(1, I.n)).toFixed(3), maxMs: +I.msMax.toFixed(3) } };
    const rec = D.PLAYLOG.rec('ck', 'test'); out.rec = rec.inside; out.net = (rec.net.list || []).filter((e) => /inside an object/.test(e[2])).length;
    out.netlog = D.NETLOG.inc.filter((x) => /inside an object/.test(x.what)).length;
    return out; });
  console.log(JSON.stringify({ list: r.list, kinds: r.kinds, cost: r.cost }));
  ok('the detector checks the yard\'s solid scenery', r.list > 100 && r.kinds.container > 5 && r.kinds.wall === 4 && r.kinds.pillar === 6 && r.kinds['crusher post'] === 4, { list: r.list });
  const near = (e, x, z, d = 2) => e && Math.abs(e.x - x) <= d && Math.abs(e.z - z) <= d;
  for (const [k, what, x, z] of [['container', 'container', 92, -110], ['wall', 'wall', 151, 20], ['post', 'crusher post', -107.85, -91.75], ['pillar', 'pillar', 36.4, 21]]) {
    const v = r[k]; ok(`a car inside a ${what} is flagged after ~2 s with the right kind and position`, v.flagged && v.after <= 3.5 && v.e.what === what && near(v.e, x, z, 2.5) && v.e.who, v); }
  ok('a car parked right next to a container is NOT flagged', !r.beside.flagged, r.beside);
  ok('play-log record has an inside summary (count + list of {t, who, x, z, what})', r.rec && r.rec.n === 4 && r.rec.list.length === 4 && r.rec.list.every((e) => e.t >= 0 && e.who && Number.isFinite(e.x) && Number.isFinite(e.z) && e.what), r.rec);
  ok('each one is a network-log incident (in the bug report)', r.netlog === 4 && r.net === 4, { netlog: r.netlog, net: r.net });
  ok('the check is cheap (avg < 0.2 ms, here on a software-rendered, shared machine)', r.cost.avgMs < 0.2, r.cost);
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok('no page errors', pe.length === 0, pe.slice(0, 3));
  await browser.close(); console.log(fails.length ? 'INSIDE FAIL' : 'INSIDE PASS'); process.exit(fails.length ? 1 : 0); })();
