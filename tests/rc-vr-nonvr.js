// Plain desktop match (no WebXR on this browser): nothing VR shows or runs, the game plays as before
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open();
  page.setDefaultTimeout(400000);
  let fails = 0; const ok = (n, p, i) => { if (!p) fails++; console.log((p ? 'PASS ' : 'FAIL ') + n + (i !== undefined ? '  ' + JSON.stringify(i) : '')); };
  try {
    await page.waitForTimeout(1500);
    const st = await page.evaluate(() => ({ vr: document.getElementById('btnVR').hidden, gm: document.getElementById('gmVR').hidden, code: document.getElementById('codeRow').hidden, xr: __derby.XRS.on, rig: __derby.VR.rig.visible }));
    ok('no Enter VR button without WebXR; join-code row shown; rig hidden', st.vr && st.gm && !st.code && !st.xr && !st.rig, st);
    await page.fill('#mpCode', 'zz'); await page.click('#btnJoinCode'); await page.waitForTimeout(300);
    ok('join-code box rejects a malformed code', await page.evaluate(() => __derby.MP.role === 'solo' && __derby.VR.joinCode('https://x/#join-') === false));
    await page.evaluate(() => { window.__cc = 0; window.__rc = 0; const c = __derby.composer, r = c.render.bind(c); c.render = (...a) => { window.__cc++; return r(...a); }; const R = __derby.renderer, rr = R.render.bind(R); R.render = (sc, cm) => { if (cm === __derby.camera) window.__rc++; return rr(sc, cm); }; });
    await page.evaluate(() => { window.__noRender = true; __derby.startMatch(); });
    await page.waitForFunction(() => __derby.game.countdown <= 0, null, { timeout: 400000 });
    await page.keyboard.down('KeyW'); await page.waitForFunction(() => Math.abs(__derby.player.speed) > 5, null, { timeout: 400000 }).catch(() => {});
    await page.keyboard.down('KeyA'); await page.waitForTimeout(1200); await page.keyboard.up('KeyA');
    const spd = await page.evaluate(() => __derby.player.speed);
    await page.evaluate(() => { window.__noRender = false; window.__cc = 0; window.__rc = 0; });
    await page.waitForFunction(() => window.__cc + window.__rc >= 3, null, { timeout: 400000 }).catch(() => {});
    const r = await page.evaluate((spd) => ({ speed: spd, comp: window.__cc, direct: window.__rc, gfx: __derby.QUALITY.gfxCap, state: __derby.game.state }), spd);
    await page.keyboard.up('KeyW');
    ok('desktop match drives and renders (composer, or direct when auto-quality is at gfx 0)', Math.abs(r.speed) > 5 && r.comp + r.direct >= 3 && r.state === 'playing', r);
    // join-code box: bad code is rejected without errors
    await page.screenshot({ path: __dirname + '/vr-nonvr.png' });
    const errs = errors.filter((e) => !/Failed to load resource|net::ERR/.test(e));
    ok('no page errors', errs.length === 0, errs.slice(0, 8));
  } catch (e) { ok('crashed', false, String(e.stack || e).slice(0, 600)); }
  await browser.close(); process.exit(fails ? 1 : 0);
})();
