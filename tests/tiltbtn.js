// Tilt button (owner: "make sure the tilt button is findable ... towards the top ... not hidden in some menu").
// On phones and tablets, during a match: a Tilt button sits in the top row (top quarter of the screen), is big enough to tap,
// overlaps no other visible control or HUD panel, and toggles tilt steering with a visible on-state. Not shown on a desktop.
// Fails on Build 111 (the phone layout hid the Tilt button; it lived only in the settings menu).
const { open } = require('./harness');
const { devices } = require('playwright');
const SHOTS = process.env.SHOTS;
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const screens = [['iPhone 13', devices['iPhone 13']], ['iPhone 13 landscape', devices['iPhone 13 landscape']], ['Pixel 5', devices['Pixel 5']], ['small phone', { viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ['iPad', devices['iPad (gen 7)']]];
  for (const [name, ctx] of screens) {
    const { browser, page, errors } = await open(ctx, () => { if (typeof DeviceMotionEvent === 'undefined') window.DeviceMotionEvent = class extends Event {}; }); /* (headless Chromium has no motion sensor API at all) */
    await page.evaluate(() => { __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => {
      const vis = (e) => { if (!e) return false; const cs = getComputedStyle(e); return !e.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0' && e.getClientRects().length > 0; };
      const box = (e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
      const t = document.getElementById('btnTilt');
      const others = [...document.querySelectorAll('.rail .ic, #touch .tb, .speedo, .stats, #opponents, #minimap, #btnBug, .stick-zone')].filter((e) => e !== t && vis(e) && !e.contains(t) && !t.contains(e));
      const tb = box(t), hits = others.filter((e) => { const b = box(e); return !(b[2] <= tb[0] || b[0] >= tb[2] || b[3] <= tb[1] || b[1] >= tb[3]); }).map((e) => (e.id || e.className) + ' ' + box(e));
      const top = document.elementFromPoint((tb[0] + tb[2]) / 2, (tb[1] + tb[3]) / 2);
      return { vis: vis(t), box: tb, h: innerHeight, w: innerWidth, hits, onTop: !!top && (top === t || t.contains(top)) };
    });
    console.log(`  ${name}: ${JSON.stringify(r)}`);
    ok(r.vis, `${name}: Tilt button shown during a match`);
    ok(r.box[1] >= 0 && r.box[3] <= r.h * 0.25 && r.box[2] <= r.w && r.box[0] >= 0, `${name}: in the top quarter of the screen, fully on screen (${r.box})`);
    ok(r.box[2] - r.box[0] >= 40 && r.box[3] - r.box[1] >= 40, `${name}: at least 40x40 px to tap`);
    ok(!r.hits.length && r.onTop, `${name}: nothing overlaps it ${r.hits.join(' | ')}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/tilt-${name.replace(/ /g, '_')}.png` }).catch(() => {}); /* (a picture for a person; under load it can time out) */
    // toggle: fake a motion sensor so it stays on
    /* a mock motion sensor: the phone held level (__tiltA = 0) or twisted __tiltA radians like a steering wheel, 20 readings a second */
    await page.evaluate(() => { window.__tiltA = 0; window.__fakeMotion = setInterval(() => { const e = new Event('devicemotion'); e.accelerationIncludingGravity = { x: 9.8 * Math.sin(window.__tiltA), y: 9.8 * Math.cos(window.__tiltA), z: 0 }; window.dispatchEvent(e); }, 50); });
    await page.tap('#btnTilt');
    await page.waitForTimeout(500);
    const on = await page.evaluate(() => { const t = document.getElementById('btnTilt'); return { on: __derby.tilt.on, cls: t.classList.contains('on'), lab: t.querySelector('small').textContent, aria: t.getAttribute('aria-pressed'), bg: getComputedStyle(t).backgroundColor }; });
    ok(on.on && on.cls && on.aria === 'true' && /on/i.test(on.lab), `${name}: a tap turns tilt on and the button says so ${JSON.stringify(on)}`);
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/tilt-${name.replace(/ /g, '_')}-on.png` }).catch(() => {}); /* (a picture for a person; under load it can time out) */
    if (name === 'iPhone 13') { /* drive with it: twist the phone left, then right, and the car turns that way (heading change over 1.5 s at full throttle) */
      const drive = async (a) => page.evaluate(async (a) => { const gw = (s) => new Promise((r) => { const t = __derby.game.time, t0 = performance.now(), f = () => (__derby.game.time >= t + s || performance.now() - t0 > 20000 ? r() : setTimeout(f, 30)); f(); }); /* wait on the game clock: a busy machine draws slowly */ const P = __derby.player, yaw = () => { const q = P.body.quaternion; return Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.x * q.x)); };
        /* start each drive from a standstill, pointing the same way: a hard left at full throttle can leave the car spinning, and a leftover spin failed the right-turn check (Builds 139/140 suites) */ window.__tiltA = 0; __derby.touch.throttle = 0; for (let k = 0; k < 3; k++) { P.body.velocity.set(0, 0, 0); P.body.angularVelocity.set(0, 0, 0); await gw(0.15); } const spin0 = +P.body.angularVelocity.y.toFixed(2);
        __derby.touch.throttle = 1; window.__tiltA = 0; await gw(0.4); window.__tiltA = a; await gw(0.3);
        const st = __derby.tilt.steer, c0 = P.ctrl.steer, y0 = yaw(), t0 = __derby.game.time; await gw(1.5);
        let d = yaw() - y0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; window.__tiltA = 0; __derby.touch.throttle = 0;
        return { paused: __derby.game.paused, state: __derby.game.state, tiltSteer: +st.toFixed(2), ctrlSteer: +c0.toFixed(2), turn: +d.toFixed(2), dt: +(__derby.game.time - t0).toFixed(1), spin0 }; }, a);
      await page.evaluate(() => { __derby.respawnCar(__derby.player, 'viper'); for (const c of __derby.cars) if (c !== __derby.player) { c.think = () => {}; c.ctrl.throttle = 0; c.ctrl.steer = 0; } }); await page.waitForTimeout(800); /* (park the AI: Build 115's suite run had one ram the test car mid-turn) */
      const L = await drive(0.35), R = await drive(-0.35);
      console.log(`  tilt drive: left ${JSON.stringify(L)} right ${JSON.stringify(R)}`);
      ok(L.tiltSteer > 0.5 && L.ctrlSteer > 0.5 && L.turn > 0.15, `mock motion sensor: phone twisted 20° left steers the car left (${JSON.stringify(L)})`);
      ok(R.tiltSteer < -0.5 && R.ctrlSteer < -0.5 && R.turn < -0.15, `mock motion sensor: phone twisted 20° right steers the car right (${JSON.stringify(R)})`);
      const lv = await page.evaluate(async () => { window.__tiltA = 0.02; await new Promise((r) => setTimeout(r, 300)); return __derby.tilt.steer; });
      ok(lv === 0, `mock motion sensor: held nearly level (1°) the car goes straight (steer ${lv})`); }
    await page.waitForTimeout(400);
    await page.tap('#btnTilt'); await page.waitForTimeout(300);
    const off = await page.evaluate(() => ({ on: __derby.tilt.on, lab: document.querySelector('#btnTilt small').textContent }));
    ok(!off.on && off.lab === 'Tilt', `${name}: a second tap turns it off ${JSON.stringify(off)}`);
    const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, `${name}: no page errors ${pe.slice(0, 2).join(' | ')}`);
    await browser.close();
  }
  { const { browser, page } = await open({ viewport: { width: 1280, height: 720 } });
    await page.evaluate(() => { __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing', null, { timeout: 120000 });
    const v = await page.evaluate(() => { const t = document.getElementById('btnTilt'); return getComputedStyle(t).display !== 'none' && t.getClientRects().length > 0; });
    ok(!v, 'desktop: no Tilt button'); await browser.close(); }
  console.log(fails.length ? 'TILTBTN FAIL' : 'TILTBTN PASS'); process.exit(fails.length ? 1 : 0);
})();
