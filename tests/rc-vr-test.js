// VR mode end-to-end with an emulated WebXR headset (see vr-mock.js)
const fs = require('fs'), path = require('path');
const pw = require('playwright');
const MOCK = require('./vr-mock');
const origLaunch = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = async (o) => { const b = await origLaunch(o); const np = b.newPage.bind(b); b.newPage = async (opts) => { const p = await np(opts); await p.addInitScript(MOCK); return p; }; return b; };
const { open } = require('./harness');
const OUT = __dirname;
const res = []; const ok = (name, pass, info) => { res.push({ name, pass: !!pass, info }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
const savePng = (file, dataUrl) => fs.writeFileSync(path.join(OUT, file), Buffer.from(dataUrl.split(',')[1], 'base64'));
(async () => {
  const { browser, page, errors } = await open();
  page.setDefaultTimeout(400000);
  try {
    await page.waitForTimeout(1500);
    ok('Enter VR button shown', await page.evaluate(() => !document.getElementById('btnVR').hidden && !document.getElementById('gmVR').hidden));
    await page.evaluate(() => { const D = window.__derby; window.__cnt = { comp: 0, vr: 0, other: 0 };
      const cr = D.composer.render.bind(D.composer); D.composer.render = (...a) => { window.__cnt.comp++; return cr(...a); };
      const rr = D.renderer.render.bind(D.renderer); D.renderer.render = (s, c) => { if (c === D.VR.cam) window.__cnt.vr++; else window.__cnt.other++; return rr(s, c); }; });
    await page.click('#btnVR');
    await page.waitForFunction(() => window.__derby.XRS.on && __xrMock.frames > 3, null, { timeout: 400000 });
    const s0 = await page.evaluate(() => ({ sim: __derby.simTime, frames: __xrMock.frames, rate: __xrMock.rate, idle: __derby.VR.rafIdle, pres: __derby.renderer.xr.isPresenting, fb: __xrMock.fbStatus, lite: __derby.QUALITY.lite, q: __derby.QUALITY.level, shadow: __derby.renderer.shadowMap.enabled }));
    await page.evaluate(() => { window.__cnt.comp = 0; window.__cnt.vr = 0; window.__f0 = __xrMock.frames; window.__s0 = __derby.simTime; });
    await page.waitForFunction(() => __xrMock.frames > window.__f0 + 8, null, { timeout: 400000 });
    const s1 = await page.evaluate(() => ({ sim: __derby.simTime, frames: __xrMock.frames, cnt: { ...window.__cnt } }));
    ok('session presenting, framebuffer complete', s0.pres && s0.fb, s0);
    ok('loop runs inside XR session (session rAF frames advance, sim advances, window rAF loop idle)', s1.frames > s0.frames + 8 && s1.sim > s0.sim && s0.idle, { frames: s1.frames - s0.frames, sim: +(s1.sim - s0.sim).toFixed(2) });
    ok('composer bypassed in VR, renders go straight to the headset camera', s1.cnt.comp === 0 && s1.cnt.vr > 0, s1.cnt);
    ok('target frame rate requested', s0.rate === 90 || s0.rate === 72, s0.rate);
    ok('Quest preset (lite particles, quality step >= 5)', s0.lite && s0.q >= 5, { q: s0.q });
    // world menu in the garage
    await page.waitForFunction(() => __derby.VR.menuOpen && __derby.VR.menu.rects.length > 3);
    savePng('vr-menu.png', await page.evaluate(() => __xrMock.snap(false)));
    const pointAt = async (hand, label) => page.evaluate(([hand, label]) => { const D = __derby, T = D.THREE; const pt = D.VR.buttonLocal(label); if (!pt) return false;
      const o = new T.Vector3(hand === 'left' ? -0.2 : 0.2, -0.3, -0.3), m = new T.Matrix4().lookAt(o, new T.Vector3(...pt), new T.Vector3(0, 1, 0)).setPosition(o); __xrMock.ctl[hand].m = Array.from(m.elements); return true; }, [hand, label]);
    const frames = async (n) => { const f0 = await page.evaluate(() => __xrMock.frames); await page.waitForFunction((f) => __xrMock.frames >= f, f0 + n); };
    const pull = async (hand) => { await frames(2); await page.evaluate((h) => __xrMock.press(h, 0, true, 1), hand); await frames(3); await page.evaluate((h) => __xrMock.press(h, 0, false, 0), hand); await frames(2); };
    const labels = async () => page.evaluate(() => __derby.VR.menu.rects.map((r) => r.label));
    ok('main menu buttons', (await labels()).includes('START DERBY'), await labels());
    ok('menu fits on the panel', await page.evaluate(() => __derby.VR.menuBottom <= 830 - 50), await page.evaluate(() => __derby.VR.menuBottom));
    // pick a car with the laser (▶), then start
    const car0 = await page.evaluate(() => __derby.player.type);
    await pointAt('right', '▶'); await pull('right');
    await page.waitForFunction((c) => __derby.player.type !== c, car0, { timeout: 20000 }).catch(() => {});
    const car1 = await page.evaluate(() => __derby.player.type);
    ok('laser click picks the next car', car1 !== car0, { car0, car1 });
    await page.evaluate(() => { const D = __derby; D.selectCar('outrider'); });
    await page.waitForFunction(() => __derby.VR.menu.rects.some((r) => r.label === 'START DERBY'));
    await page.waitForTimeout(400);
    await pointAt('right', 'START DERBY'); await pull('right');
    await page.waitForFunction(() => __derby.game.state === 'playing', null, { timeout: 20000 }).catch(() => {});
    ok('world menu starts a match', await page.evaluate(() => __derby.game.state === 'playing'));
    await page.evaluate(() => { window.__noRender = true; });
    await page.waitForFunction(() => __derby.game.countdown <= 0, null, { timeout: 400000 });
    await frames(3);
    // rig at the cockpit eye, yaw only
    const rig = await page.evaluate(() => { const D = __derby, p = D.player, E = p.eye || D.cockpitEye(p), w = p.body.pointToWorldFrame(new D.CANNON.Vec3(E.x, E.y, 0)); const r = D.VR.rig; const up = new D.THREE.Vector3(0, 1, 0).applyQuaternion(r.quaternion);
      const fw = new D.THREE.Vector3(0, 0, -1).applyQuaternion(r.quaternion); const fl = Math.hypot(p.fwd.x, p.fwd.z);
      return { d: r.position.distanceTo(new D.THREE.Vector3(w.x, w.y, w.z)), upY: up.y, qx: r.quaternion.x, qz: r.quaternion.z, headingDot: (fw.x * p.fwd.x + fw.z * p.fwd.z) / fl, menu: D.VR.menuOpen, hud: D.VR.hud.mesh.visible }; });
    ok('rig sits at cockpitEye(car)', rig.d < 0.15, rig);
    ok('rig has zero roll/pitch (yaw only) and faces the car heading', Math.abs(rig.upY - 1) < 1e-6 && Math.abs(rig.qx) < 1e-6 && Math.abs(rig.qz) < 1e-6 && rig.headingDot > 0.99);
    ok('menu hidden while driving, dashboard HUD shown', !rig.menu && rig.hud);
    // tilt the car: the rig must stay level
    const tilt = await page.evaluate(async () => { const D = __derby, p = D.player; p.body.quaternion.setFromEuler(0.35, 0, 0.4); await new Promise((r) => setTimeout(r, 120)); const up = new D.THREE.Vector3(0, 1, 0).applyQuaternion(D.VR.rig.quaternion); return { upY: up.y }; });
    ok('horizon stays level when the car rolls/pitches', Math.abs(tilt.upY - 1) < 1e-6, tilt);
    await page.evaluate(() => { __derby.player.flipUpright(); });
    await page.waitForTimeout(1500);
    // drive: right trigger gas
    const hud0 = await page.evaluate(() => __derby.VR.hud.tex.version);
    await page.evaluate(() => __xrMock.press('right', 0, true, 1));
    await page.waitForFunction(() => Math.abs(__derby.player.speed) > 5, null, { timeout: 30000 }).catch(() => {});
    const sp = await page.evaluate(() => ({ speed: __derby.player.speed, thr: __derby.player.ctrl.throttle }));
    ok('right trigger drives the car (> 5 m/s)', Math.abs(sp.speed) > 5 && sp.thr > 0.9, sp);
    const yawOf = () => page.evaluate(() => { const f = __derby.player.fwd; return Math.atan2(-f.z, f.x); });
    const turn = async (x) => { const a0 = await yawOf(); await page.evaluate((x) => __xrMock.axis('left', x, 0), x); await page.waitForTimeout(1500); const st = await page.evaluate(() => __derby.player.ctrl.steer); const a1 = await yawOf(); await page.evaluate(() => __xrMock.axis('left', 0, 0)); let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return { d: +d.toFixed(3), steer: st }; };
    const tl = await turn(-1), tr = await turn(1);
    ok('left stick steers left and right', tl.steer > 0.9 && tr.steer < -0.9 && Math.sign(tl.d) !== Math.sign(tr.d) && Math.abs(tl.d) > 0.1 && Math.abs(tr.d) > 0.1, { left: tl, right: tr });
    await page.evaluate(() => __xrMock.press('right', 0, false, 0));
    // A fires the special (Outrider: harpoon)
    await page.evaluate(() => { __xrMock.haptics.length = 0; __derby.player.specialCd = 0; __xrMock.press('right', 4, true); });
    await frames(4); await page.evaluate(() => __xrMock.press('right', 4, false));
    const fire = await page.evaluate(() => ({ cd: __derby.player.specialCd, hap: __xrMock.haptics.slice(0, 4) }));
    ok('A fires the weapon (+ haptic pulse)', fire.cd > 0 && fire.hap.some((h) => h[0] === 'right'), fire);
    // B nitro, X jump, grip handbrake
    await page.evaluate(() => { __xrMock.press('right', 5, true); __xrMock.press('left', 1, true, 1); }); await frames(3);
    const bx = await page.evaluate(() => ({ nitro: __derby.player.ctrl.nitro, hb: __derby.player.ctrl.handbrake }));
    await page.evaluate(() => { __xrMock.press('right', 5, false); __xrMock.press('left', 1, false, 0); });
    ok('B = nitro, grip = handbrake', bx.nitro && bx.hb, bx);
    const hud1 = await page.evaluate(() => __derby.VR.hud.tex.version);
    ok('dashboard HUD texture updates', hud1 > hud0 + 5, { hud0, hud1 });
    // haptics on a crash (shake)
    await page.evaluate(() => { __xrMock.haptics.length = 0; __derby.game.shake = 1.2; }); await frames(3);
    { const sh = await page.evaluate(() => ({ hap: __xrMock.haptics.length, cc: __derby.game.crashCam === null ? null : 'set', shake: __derby.game.shake })); ok('crash shake becomes rumble (no camera shake in VR)', sh.hap > 0 && sh.cc === null, sh); }
    // screenshot of the cockpit (left eye)
    await page.evaluate(() => { window.__noRender = false; __xrMock.press('right', 0, true, 0.6); }); await frames(4); await page.waitForTimeout(500);
    savePng('vr-cockpit.png', await page.evaluate(() => __xrMock.snap(false)));
    savePng('vr-cockpit-stereo.png', await page.evaluate(() => __xrMock.snap(true)));
    ok('left eye picture is not empty', await page.evaluate(() => __xrMock.lastSnapMean > 10), await page.evaluate(() => __xrMock.lastSnapMean));
    await page.evaluate(() => { window.__noRender = true; __xrMock.press('right', 0, false, 0); });
    // pause with right stick click, respawn as a Viper through the world menu
    await page.evaluate(() => __xrMock.press('right', 3, true)); await frames(3); await page.evaluate(() => __xrMock.press('right', 3, false)); await frames(3);
    ok('right stick click pauses and opens the menu', await page.evaluate(() => __derby.game.paused && __derby.VR.menuOpen), await labels());
    const p0 = await page.evaluate(() => { window.__p0 = __derby.player; return __derby.player.type; });
    await page.waitForTimeout(300);
    await pointAt('right', 'Respawn / new car'); await pull('right'); await page.waitForTimeout(400);
    ok('pause menu -> car list', (await labels()).includes('Viper'), await labels());
    await page.evaluate(() => { window.__fmax = 0; setInterval(() => { window.__fmax = Math.max(window.__fmax, __derby.VR.fade); }, 5); }); await pointAt('right', 'Viper'); await page.evaluate(() => { window.__fmax = 0; }); await pull('right');
    await page.waitForFunction(() => __derby.player !== window.__p0, null, { timeout: 20000 }).catch(() => {});
    await frames(4);
    const rs = await page.evaluate(() => { const D = __derby, p = D.player, E = p.eye || D.cockpitEye(p), w = p.body.pointToWorldFrame(new D.CANNON.Vec3(E.x, E.y, 0)); return { type: p.type, paused: D.game.paused, d: D.VR.rig.position.distanceTo(new D.THREE.Vector3(w.x, w.y, w.z)), fade: +window.__fmax.toFixed(2) }; });
    ok('world menu respawns in a new car, rig re-attached, fade from black', rs.type === 'viper' && !rs.paused && rs.d < 0.15 && rs.fade > 0.9, rs);
    // a wreck: fade + wreck menu, then auto-respawn
    await page.evaluate(() => { const p = __derby.player; p.wreck(); });
    await page.waitForFunction(() => __derby.player.wrecked || __derby.player !== window.__p0, null, { timeout: 5000 }).catch(() => {});
    const wk = await page.evaluate(() => ({ wrecked: __derby.player.wrecked, menu: __derby.VR.menuOpen, labels: __derby.VR.menu.rects.map((r) => r.label).slice(0, 3) }));
    ok('wreck shows the respawn panel in VR', !wk.wrecked || (wk.menu && wk.labels.includes('RESPAWN NOW')), wk);
    if (wk.wrecked) { await page.waitForTimeout(800); ok('wreck dims the view', await page.evaluate(() => __derby.VR.fade > 0.4), await page.evaluate(() => __derby.VR.fade));
      await pointAt('right', 'RESPAWN NOW'); await pull('right'); await page.waitForFunction(() => !__derby.player.wrecked, null, { timeout: 20000 }).catch(() => {});
      ok('RESPAWN NOW brings you back', await page.evaluate(() => !__derby.player.wrecked)); }
    // recenter with Y: turn the head, tap Y
    await page.evaluate(() => { __xrMock.head = [0.1, 0.05, 0.08]; __xrMock.headYaw = 0.6; window.__noRender = false; }); await frames(4);
    await page.evaluate(() => __xrMock.press('left', 5, true)); await frames(3); await page.evaluate(() => __xrMock.press('left', 5, false)); await frames(4);
    const rc = await page.evaluate(() => { const D = __derby, c = D.VR.cam, s = D.VR.seat; const hp = c.position.clone().applyQuaternion(s.quaternion).add(s.position); const f = new D.THREE.Vector3(0, 0, -1).applyQuaternion(c.quaternion).applyQuaternion(s.quaternion); return { pos: hp.length(), yaw: Math.atan2(-f.x, -f.z) }; });
    ok('Y recenters the head onto the driver eye, facing forward', rc.pos < 0.01 && Math.abs(rc.yaw) < 0.01, rc);
    // join-code page
    await page.evaluate(() => { __derby.game.paused = true; __derby.VR.page = 'join'; }); await frames(4); await page.waitForTimeout(300);
    for (const ch of ['a', 'b', '1']) { await pointAt('right', ch); await pull('right'); }
    ok('join-code keypad types', await page.evaluate(() => __derby.VR.code === 'ab1'), await page.evaluate(() => __derby.VR.code));
    await page.evaluate(() => { __derby.VR.code = ''; __derby.VR.page = 'main'; });
    await frames(3); await page.waitForTimeout(300);
    // exit VR from the pause menu
    await page.evaluate(() => { window.__cnt.comp = 0; window.__cnt.other = 0; });
    await pointAt('right', 'Exit VR'); await frames(2); await page.evaluate(() => __xrMock.press('right', 0, true, 1));
    await page.waitForFunction(() => !__derby.XRS.on, null, { timeout: 30000 }).catch(() => {});
    await page.evaluate(() => __xrMock.press('right', 0, false, 0));
    await page.evaluate(() => { __derby.game.paused = false; window.__noRender = false; });
    await page.waitForFunction(() => window.__cnt.comp + window.__cnt.other >= 3 && __derby.simTime > 0, null, { timeout: 400000 }).catch(() => {});
    const ex = await page.evaluate(() => ({ on: __derby.XRS.on, pres: __derby.renderer.xr.isPresenting, comp: window.__cnt.comp, other: window.__cnt.other, size: __derby.renderer.getSize(new __derby.THREE.Vector2()).toArray(), cam: __derby.camera.position.toArray().map((v) => +v.toFixed(1)), level: __derby.QUALITY.level }));
    const sim0 = await page.evaluate(() => __derby.simTime); await page.waitForTimeout(1000); const sim1 = await page.evaluate(() => __derby.simTime);
    ok('exiting VR restores normal rendering (window loop, normal render path, canvas size)', !ex.on && !ex.pres && ex.comp + ex.other > 0 && sim1 > sim0 && ex.size[0] === 1280, ex);
    await page.screenshot({ path: path.join(OUT, 'vr-after-exit.png') });
    const errs = errors.filter((e) => !/Failed to load resource|net::ERR|GPU stall due to ReadPixels/.test(e));
    ok('no page errors', errs.length === 0, errs.slice(0, 8));
  } catch (e) { ok('test crashed', false, String(e && e.stack || e).slice(0, 800)); }
  await browser.close();
  const f = res.filter((r) => !r.pass).length; console.log(`\n${res.length - f}/${res.length} passed`);
  fs.writeFileSync(path.join(OUT, 'vr-test-result.json'), JSON.stringify(res, null, 1));
  process.exit(f ? 1 : 0);
})();
