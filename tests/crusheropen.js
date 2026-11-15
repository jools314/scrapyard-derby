// The crusher is open on all four sides (owner request): a car shoved toward it from any side ends up inside the crush zone.
const { open } = require('./harness');
(async () => { const fails = []; const ok = (m, c, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m, d ? JSON.stringify(d) : ''); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 200, height: 140 } });
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    D.S.aiCount = 1; D.game.state = 'menu'; D.startMatch(); while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    const C = D.CRUSHER, c = D.cars.find((x) => !x.isPlayer) || D.player, out = {};
    for (const [name, dx, dz] of [['east', 1, 0], ['west', -1, 0], ['north', 0, 1], ['south', 0, -1]]) {
      C.state = 'idle'; C.t = 999;
      const b = c.body; b.position.set(C.x + dx * 9, 1.2, C.z + dz * 8); b.velocity.set(-dx * 9, 0, -dz * 9); b.angularVelocity.set(0, 0, 0);
      b.quaternion.setFromAxisAngle(new D.CANNON.Vec3(0, 1, 0), Math.atan2(dz, -dx)); c.ai = false;
      for (let i = 0; i < 40; i++) { b.velocity.x = -dx * 9; b.velocity.z = -dz * 9; await sleep(25); if (Math.abs(b.position.x - C.x) < C.hx && Math.abs(b.position.z - C.z) < C.hz) break; }
      out[name + '_pos'] = [+b.position.x.toFixed(1), +b.position.z.toFixed(1), D.touching ? D.touching(c) : ''];
      out[name] = Math.abs(b.position.x - C.x) < C.hx + 0.5 && Math.abs(b.position.z - C.z) < C.hz + 0.5; }
    return out; });
  console.log(JSON.stringify(r)); for (const k of Object.keys(r).filter((k) => !k.endsWith('_pos'))) ok(`a car shoved in from the ${k} ends up inside the crusher`, r[k]);
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok('no page errors', pe.length === 0, pe.slice(0, 3));
  await browser.close(); console.log(fails.length ? 'CRUSHEROPEN FAIL' : 'CRUSHEROPEN PASS'); process.exit(fails.length ? 1 : 0); })();
