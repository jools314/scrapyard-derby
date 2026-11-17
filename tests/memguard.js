// Memory guard (Build 102): when GPU memory runs away over a session, the game first finds out WHAT is leaking (uploaded objects no
// longer in the scene, grouped by what they are and what last held them), logs a 'leak' record, and then - only when autoplay is
// running, never under a person - reloads into autoplay. Here a fake leak (2,500 boxes from a group named 'test-leaker' drawn once,
// then dropped without being freed) must be named in the census; normal match restarts must never trip the guard.
// Fails on Build 101 (no guard).
const { open } = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  for (const auto of [true, false]) {
    const { browser, page, errors } = await open({ viewport: { width: 480, height: 300 } });
    await page.evaluate(() => { __derby.S.aiCount = 3; document.getElementById('btnStart').click(); });
    await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
    const r = await page.evaluate(async (auto) => { const D = __derby, G = D.MEMGUARD, T = D.THREE, fr = async (k) => { for (let i = 0; i < k; i++) await new Promise((r) => requestAnimationFrame(r)); };
      const reloads = []; D.UPDATE.reload = (u) => reloads.push(u); D.PLAYLOG.upload = async () => true;
      if (!G) return { noGuard: true };
      G.check('test baseline'); // the first match end sets the baseline
      for (let k = 0; k < 3; k++) { D.startMatch(); await new Promise((r) => setTimeout(r, 300)); await fr(10); G.check('test normal restart'); }
      const falseTrip = G.tripped;
      // the fake leak: drawn once (so it is on the GPU), then dropped from the scene without dispose()
      const grp = new T.Group(); grp.name = 'test-leaker'; const mat = new T.MeshBasicMaterial();
      for (let i = 0; i < 2500; i++) { const m = new T.Mesh(new T.BoxGeometry(0.3, 0.3, 0.3), mat); m.position.set(D.camera.position.x + (i % 40) * 0.01, D.camera.position.y - 2, D.camera.position.z - 6); m.frustumCulled = false; grp.add(m); }
      D.scene.add(grp); D.renderer.render(D.scene, D.camera); /* one forced draw: on a busy machine the game had not drawn a frame with the boxes yet, so they never reached the GPU and there was nothing to find */ await fr(3); await new Promise((r) => setTimeout(r, 6000)); await fr(2); D.scene.remove(grp); // (in the scene long enough for the 5 s owner walk)
      D.AUTO.on = auto; const started = auto ? (D.AUTO.nextMatch(), reloads.length || G.tripped) : (G.check('test match end'), G.tripped);
      await new Promise((r) => setTimeout(r, 500));
      const rec = G.last || null; return { falseTrip, tripped: G.tripped, reloads, top: rec && rec.top.slice(0, 3), orphans: rec && rec.orphans, base: rec && rec.base, now: rec && rec.now }; }, auto);
    if (r.noGuard) { ok(false, 'memory guard exists'); await browser.close(); break; }
    console.log(`  ${auto ? 'autoplay' : 'person playing'}: ` + JSON.stringify(r).slice(0, 400));
    ok(!r.falseTrip, `${auto ? 'autoplay' : 'person'}: normal match restarts never trip the guard`);
    ok(r.tripped && r.orphans >= 2400 && r.top && /test-leaker · BoxGeometry/.test(r.top[0][0]) && r.top[0][1] >= 2400, `${auto ? 'autoplay' : 'person'}: the census names the leak (${r.top && r.top[0] && r.top[0].join(' ×')})`);
    if (auto) ok(r.reloads.length === 1 && /autoplay=1/.test(r.reloads[0]) && /mem=1/.test(r.reloads[0]), `autoplay: reloads into autoplay (${r.reloads[0]})`);
    else ok(r.reloads.length === 0, 'person playing: never reloaded');
    const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
    await browser.close();
  }
  console.log(fails.length ? 'MEMGUARD FAIL' : 'MEMGUARD PASS'); process.exit(fails.length ? 1 : 0);
})();
