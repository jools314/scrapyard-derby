// Every vehicle, every basic control: straight, steer left, steer right, reverse, handbrake, (tracked: spin on the spot).
// Fails (exit 1) if any car can't turn both ways, go straight, or back up. Run before every publish.
const { open } = require(process.env.H || './harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } }); await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 1; __derby.S.autoGfx = false; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.countdown <= 0, null, { timeout: 90000 });
  await page.evaluate((e) => { if (e.PX) window.__PX = e.PX; if (e.PZ) window.__PZ = e.PZ; if (e.YAW) window.__YAW = e.YAW; }, { PX: process.env.PX, PZ: process.env.PZ, YAW: process.env.YAW });
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const res = await page.evaluate(async (only) => {
    const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const wt = async (s) => { const t0 = D.game.time; while (D.game.time - t0 < s) await sleep(20); };
    const key = (code, down) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code.replace('Key', '').toLowerCase() }));
    const yaw = (c) => { const f = c.body.quaternion.vmult(new D.CANNON.Vec3(1, 0, 0)); return Math.atan2(-f.z, f.x); };
    const dyaw = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d * 57.3; };
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    { const ai0 = D.cars.find((x) => x !== D.player); if (ai0 && ai0.type !== 'viper') { D.respawnCar(ai0, 'viper'); await wt(0.3); } } // a fixed, towable, light target every run (a random heavy truck can't be towed)
    const park = () => { const ai = D.cars.find((x) => x !== D.player); if (!ai) return null; ai.think = () => {}; ai.ctrl.throttle = 0; ai.ctrl.steer = 0; ai.ctrl.fire = false; return ai; };
    const parkAway = () => { const ai = park(); if (ai) { ai.body.position.set(-100, 2, 100); ai.body.velocity.set(0, 0, 0); ai.body.angularVelocity.set(0, 0, 0); } };
    const out = [];
    for (const t of Object.keys(D.CAR_TYPES)) { if (only && !only.includes(t)) continue;
      D.respawnCar(D.player, t); await wt(0.3); let c = D.player;
      const place = async () => { parkAway(); c = D.player; c.body.position.set(+(window.__PX ?? -60), 2.2, +(window.__PZ ?? 75)); c.body.quaternion.setFromEuler(0, +(window.__YAW ?? 0), 0); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.health = 100; await wt(1.0); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); await wt(0.3); };
      const run = async (keys, s) => { await place(); const p0 = c.body.position.clone(), y0 = yaw(c), f0 = c.body.quaternion.vmult(new D.CANNON.Vec3(1, 0, 0)); for (const k of keys) typeof k === 'function' ? k(true) : key(k, true); let acc = 0, py = y0; { const t0 = D.game.time; while (D.game.time - t0 < s) { await sleep(20); const y = yaw(c); acc += dyaw(py, y); py = y; } } for (const k of keys) typeof k === 'function' ? k(false) : key(k, false);
        const p1 = c.body.position, mv = p1.vsub(p0); return { d: +Math.hypot(mv.x, mv.z).toFixed(1), fwd: +(mv.x * f0.x + mv.z * f0.z).toFixed(1), yaw: Math.round(acc), v: Math.round(Math.abs(c.speed || 0)) }; };
      const r = { type: t, name: D.CAR_TYPES[t].name };
      r.straight = await run(['KeyW'], 3);
      r.left = await run(['KeyW', 'KeyA'], 3);
      r.right = await run(['KeyW', 'KeyD'], 3);
      r.back = await run(['KeyS'], 3);
      const T_ = D.touch, gas = (on) => { T_.throttle = on ? 1 : 0; }, tl = (on) => { T_.steer = on ? 1 : 0; }, tr = (on) => { T_.steer = on ? -1 : 0; };
      r.tLeft = await run([gas, tl], 3); r.tRight = await run([gas, tr], 3); // the phone's thumbstick and pedal
      // fire: something about the car must change that doesn't change when you just sit there
      const snap = () => { const o = {}; for (const [k, v] of Object.entries(c)) if (typeof v === 'number' || typeof v === 'boolean') o[k] = v; o.__parts = D.debris?.length ?? 0; o.__tow = !!c.tow; o.__mg = !!(c.mgSpin || c.mgFiring); return o; };
      const diff = (a, b) => Object.keys(a).filter((k) => a[k] !== b[k]);
      await place(); let s0 = snap(); await wt(0.8); const idle = new Set(diff(s0, snap()));
      await place(); { let ai = park(); if (ai && (ai.type !== 'viper' || ai.wrecked)) { D.respawnCar(ai, 'viper'); await wt(0.4); ai = park(); } const tow = D.CAR_TYPES[t].special === 'tow'; // a target: behind the tow truck's hook, 14 m ahead of everyone else
        ai.body.position.set(c.body.position.x + (tow ? -(c.T.L / 2 + ai.T.L / 2 + 1.2) : 14), 1.6, c.body.position.z); ai.body.quaternion.setFromEuler(0, 0, 0); ai.body.velocity.set(0, 0, 0); ai.body.angularVelocity.set(0, 0, 0); await wt(0.6); }
      document.getElementById('toasts').textContent = ''; s0 = snap(); key('KeyF', true); await wt(0.35); const mid = snap(); await wt(0.65); key('KeyF', false); await wt(0.3); r.fire = [...new Set([...diff(s0, mid), ...diff(s0, snap())])].filter((k) => !idle.has(k) && !/^(lastHit|hitTimes|speed|steerVal|contacts|airV|landT)/.test(k)).slice(0, 6);
      r.toast = document.getElementById('toasts').textContent.slice(0, 80); { const ai = park(); r.tgt = ai ? ai.type + '@' + ai.body.position.x.toFixed(1) + ',' + ai.body.position.y.toFixed(1) + ' me@' + c.body.position.x.toFixed(1) : 'none'; }
      if (D.CAR_TYPES[t].skid) { r.spinL = await run(['KeyA'], 2); r.spinR = await run(['KeyD'], 2); }
      // handbrake: get moving, then hold Space
      await place(); key('KeyW', true); await wt(2.5); const v0 = Math.abs(c.speed); key('KeyW', false); key('Space', true); await wt(1.2); key('Space', false); r.brake = { from: Math.round(v0), to: Math.round(Math.abs(c.speed)) };
      const fails = [];
      if (r.straight.fwd < 8 || Math.abs(r.straight.yaw) > 20) fails.push('straight');
      if (r.left.yaw < 25) fails.push('left');
      if (r.right.yaw > -25) fails.push('right');
      if (r.back.fwd > -2.5) fails.push('reverse');
      if (r.spinL && r.spinL.yaw < 15) fails.push('spin-left'); if (r.spinR && r.spinR.yaw > -15) fails.push('spin-right');
      if (r.brake.to > r.brake.from * 0.8 && r.brake.from > 3) fails.push('handbrake');
      if (r.tLeft.yaw < 25) fails.push('touch-left'); if (r.tRight.yaw > -25) fails.push('touch-right'); if (!r.fire.length) fails.push('fire');
      r.fails = fails; out.push(r);
    }
    return out; }, only);
  let bad = 0;
  for (const r of res) { if (r.fails.length) bad++; console.log(`${r.fails.length ? 'FAIL' : 'PASS'} ${r.type.padEnd(11)} straight ${r.straight.fwd}m/${r.straight.yaw}°  left ${r.left.yaw}°  right ${r.right.yaw}°  back ${r.back.fwd}m` + (r.spinL ? `  spin ${r.spinL.yaw}°/${r.spinR.yaw}°` : '') + `  touch ${r.tLeft.yaw}°/${r.tRight.yaw}°  brake ${r.brake.from}->${r.brake.to}  fire[${r.fire.slice(0, 2).join(',')}]` + (r.fails.length ? '  <- ' + r.fails.join(',') + '  [' + r.toast + ' | ' + r.tgt + ']' : '')); }
  console.log(`${res.length - bad}/${res.length} cars drive`, JSON.stringify(errors.filter((e) => !e.includes('ERR_FAILED')).slice(0, 3)));
  await browser.close(); process.exit(bad ? 1 : 0);
})();
