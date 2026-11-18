// Target picking (Tab / 🎯): Tab picks a car in view and the next Tab moves on; the Tiger turret, the minigun and the rockets
// follow the pick; the pick clears when the car is wrecked or out of sight for 1.5 s+; the 🎯 touch button shows only for
// aiming cars; gamepad R1/L1 pick too; a guest's pick reaches the host; the map moved from Tab to Y. Prints AIM PASS / AIM FAIL.  Run: bash tests/run.sh aim (GAME= overrides the file).
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 960, height: 600 } }); await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 2; __derby.S.autoGfx = false; try { localStorage.setItem('derby-map', '0'); } catch (e) {} __derby.selectCar('tiger'); document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.countdown <= 0, null, { timeout: 300000 });
  const res = await page.evaluate(async () => {
    const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), out = { checks: {} }, ok = (k, v, info) => { out.checks[k] = !!v; if (info !== undefined) out[k] = info; };
    const wt = async (s) => { const t0 = D.game.time; while (D.game.time - t0 < s) await sleep(20); };
    const key = (code, down, extra) => window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', Object.assign({ code, key: code === 'Tab' ? 'Tab' : code.replace('Key', '').toLowerCase(), cancelable: true }, extra || {})));
    const tap = async (code) => { key(code, true); await sleep(30); key(code, false); await sleep(30); };
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    const still = (c, x, z) => { c.think = () => {}; c.ctrl.throttle = 0; c.ctrl.steer = 0; c.ctrl.fire = false; c.body.position.set(x, 1.6, z); c.body.quaternion.setFromEuler(0, Math.PI / 2, 0); c.body.velocity.set(0, 0, 0); c.body.angularVelocity.set(0, 0, 0); c.health = 100; };
    const ais = () => D.cars.filter((c) => c !== D.player);
    let [A, B] = ais();
    const place = async (type) => {
      if (type && D.player.type !== type) { D.respawnCar(D.player, type); await wt(0.3); }
      [A, B] = ais(); const P = D.player;
      P.body.position.set(-60, 2.2, 75); P.body.quaternion.setFromEuler(0, 0, 0); P.body.velocity.set(0, 0, 0); P.body.angularVelocity.set(0, 0, 0); P.health = 100;
      still(A, -40, 72); still(B, -10, 82); // A: 20 m ahead, a little right; B: 50 m ahead, further left
      D.game.camSnap = true; await wt(1.0);
      P.body.velocity.set(0, 0, 0); P.body.angularVelocity.set(0, 0, 0); still(A, -40, 72); still(B, -10, 82); await wt(0.4);
    };
    const pickB = async () => { D.setPick(null); for (let i = 0; i < 4 && D.player.pickT !== B; i++) await tap('Tab'); return D.player.pickT === B; };
    const yawTo = (c) => { const l = D.player.body.pointToLocalFrame(c.body.position); return Math.atan2(-l.z, l.x); };

    // --- Tiger: Tab picks, Tab moves on, turret follows the pick ---
    await place('tiger');
    ok('tigerCanAim', D.canAim(D.player.T));
    ok('keysStripTab', /Tab/.test(document.getElementById('keys').textContent), document.getElementById('keys').textContent);
    await wt(0.5); ok('autoPicksNearest', D.player.gunTarget === A, D.player.gunTarget && D.player.gunTarget.name);
    await tap('Tab'); const p1 = D.player.pickT;
    ok('tabPicks', p1 === A || p1 === B, p1 && p1.name);
    ok('markerShown', !document.getElementById('pickMark').hidden && document.getElementById('pickName').textContent.includes(p1 ? p1.name : '#'), document.getElementById('pickName').textContent);
    await tap('Tab'); const p2 = D.player.pickT;
    ok('tabMovesOn', p2 && p2 !== p1 && (p2 === A || p2 === B), p2 && p2.name);
    ok('pickB', await pickB());
    await wt(3);
    const ty = D.player.turretYaw, yA = yawTo(A), yB = yawTo(B);
    out.turret = { turretYaw: +ty.toFixed(3), toA: +yA.toFixed(3), toB: +yB.toFixed(3) };
    ok('turretOnPick', D.player.gunTarget === B && Math.abs(ty - yB) < 0.12 && Math.abs(ty - yA) > Math.abs(ty - yB) + 0.05);
    ok('tigerFrontTarget', D.frontTarget(D.player, 95, 1.3) === B);

    // --- multiplayer: a guest's input carries its pick ([5] = car index) and the host honours it; an old 5-field packet = auto ---
    { const g = A, MP = D.MP, sv = { remote: g.remote, guests: MP.guests }; let pkt = [0, 0, 0, 0, 0, D.cars.indexOf(B)];
      g.remote = 'peerAimTest'; g.body.quaternion.setFromEuler(0, 0, 0); MP.guests = () => [{ peer: 'peerAimTest', presence: { in: pkt } }];
      try { MP.applyInputs(); ok('hostGetsGuestPick', g.pickT === B && D.frontTarget(g, 110, 3.2) === B);
        pkt = [0, 0, 0, 0, 0]; MP.applyInputs(); ok('oldPacketAuto', !g.pickT);
      } finally { g.remote = sv.remote; MP.guests = sv.guests; g.pickT = null; g.ctrl.throttle = 0; g.ctrl.steer = 0; } }

    // --- Hellbender minigun ---
    await place('hellbender');
    ok('respawnClearsPick', !D.player.pickT);
    await wt(0.3); ok('mgAutoA', D.player.mgTarget === A, D.player.mgTarget && D.player.mgTarget.name);
    ok('pickBmg', await pickB()); await wt(0.4);
    ok('mgFollowsPick', D.player.mgTarget === B, D.player.mgTarget && D.player.mgTarget.name);
    ok('btnAimShownHellbender', getComputedStyle(document.getElementById('btnAim')).display !== 'none');
    D.setPick(null); document.getElementById('btnAim').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch' })); await wt(0.1);
    ok('btnAimTapPicks', D.player.pickT === A || D.player.pickT === B, D.player.pickT && D.player.pickT.name);

    // --- Viper rockets ---
    await place('viper');
    ok('rkAutoA', D.frontTarget(D.player, 110, 0.6) === A);
    ok('pickBrk', await pickB());
    ok('rkLockPick', D.frontTarget(D.player, 110, 0.6) === B);
    D.player.specialCd = 0; key('KeyF', true); await wt(0.3); key('KeyF', false); await wt(0.3);
    ok('rkTargetPick', D.player.rkTarget === B, D.player.rkTarget && D.player.rkTarget.name);

    // --- gamepad: R1 picks / moves on, L1 goes back (standard mapping, polled after gamepadconnected) ---
    { await place(); D.setPick(null);
      const btn = () => ({ pressed: false, value: 0 }), pad = { connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, btn) };
      const realGP = navigator.getGamepads; Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad, null, null, null] });
      window.dispatchEvent(new Event('gamepadconnected'));
      const press = async (i) => { pad.buttons[i] = { pressed: true, value: 1 }; await wt(0.15); pad.buttons[i] = btn(); await wt(0.15); };
      try { await press(5); const g1 = D.player.pickT; await press(5); const g2 = D.player.pickT; await press(4); const g3 = D.player.pickT;
        ok('padR1Picks', g1 === A || g1 === B, g1 && g1.name); ok('padR1MovesOn', g2 && g2 !== g1, g2 && g2.name); ok('padL1Back', g3 && g3 !== g2, g3 && g3.name);
      } finally { window.dispatchEvent(new Event('gamepaddisconnected')); if (realGP) Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: realGP }); D.setPick(null); } }

    // --- the pick clears: behind you for 1.5 s+ ---
    await place();
    ok('pickBagain', await pickB());
    still(B, -80, 75); await wt(0.8);
    ok('keptBriefly', D.player.pickT === B);
    await wt(1.4);
    ok('clearsBehind', !D.player.pickT);
    // --- ...and out of range (in front but 140 m away)
    await place(); ok('pickBrange', await pickB()); still(B, 80, 75); await wt(2.2);
    ok('clearsFar', !D.player.pickT);
    // --- ...and wrecked
    await place(); ok('pickBwreck', await pickB());
    B.applyDamage(900, D.player, 'front', null, 0); await wt(0.2);
    ok('wrecked', B.wrecked); ok('clearsWrecked', !D.player.pickT);
    await wt(0.2); ok('markerGone', document.getElementById('pickMark').hidden);

    // --- the 🎯 button hides for cars that don't aim ---
    D.respawnCar(D.player, 'towtruck'); await wt(0.3);
    ok('towCannotAim', !D.canAim(D.player.T));
    ok('btnAimHiddenTow', getComputedStyle(document.getElementById('btnAim')).display === 'none');
    await tap('Tab'); ok('tabIgnoredTow', !D.player.pickT);

    // --- the map moved from Tab to Y ---
    const m0 = document.body.classList.contains('nomap');
    await tap('Tab'); const m1 = document.body.classList.contains('nomap');
    await tap('KeyY'); const m2 = document.body.classList.contains('nomap');
    await tap('KeyY'); const m3 = document.body.classList.contains('nomap');
    ok('tabNotMap', m0 === m1); ok('yToggles', m2 !== m1 && m3 === m1);
    ok('noMapButton', !document.getElementById('btnMap')); /* the map is hidden (owner, 2026-11-18): no button, Y only */
    return out;
  });
  const errs = errors.filter((e) => e.startsWith('pageerror') || (e.startsWith('error') && !e.includes('ERR_FAILED')));
  const pass = Object.values(res.checks).every(Boolean) && errs.length === 0;
  console.log(JSON.stringify(res, null, 1)); console.log('errors', JSON.stringify(errs));
  console.log(pass ? 'AIM PASS' : 'AIM FAIL'); await browser.close(); process.exit(pass ? 0 : 1);
})().catch((e) => { console.error(e); console.log('AIM FAIL'); process.exit(1); });
