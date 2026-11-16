// Fixed lights: the number of lights in the scene must never change during a match.
// Adding or removing a light makes three.js recompile every lit material at once (20+ shaders, a 0.4-0.7 s
// freeze on a Mac, seen in play logs after tanker blasts and cruiser/fire-truck respawns, Build 88).
// Checks: tanker blast, siren cars respawning and wrecking, sirens on/off - light count constant, and
// (with rendering on) the blast and respawns compile no more than a couple of new shader programs.
// Fails on Build 89: the blast adds a PointLight and each siren car carries its own.
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { __derby.S.aiCount = 4; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 90000 });
  const r = await page.evaluate(async () => {
    const D = __derby, R = D.renderer, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const lights = () => { let n = 0; D.scene.traverseVisible((o) => { if (o.isLight) n++; }); return n; };
    const progs = () => (R.info.programs || []).length;
    const frames = async (n) => { for (let i = 0; i < n; i++) await new Promise((r) => requestAnimationFrame(r)); };
    // every car type has been in the arena once (its own materials compile here, before we count), and you drive the cruiser
    for (const t of Object.keys(D.CAR_TYPES)) { const c = D.cars.find((c) => !c.isPlayer); D.respawnCar(c, t); await frames(3); }
    D.respawnCar(D.player, 'cruiser'); const ai = D.cars.filter((c) => !c.isPlayer); D.respawnCar(ai[0], 'firetruck'); await frames(20);
    const pos = D.player.body.position, n0 = lights(), p0 = progs(), seen = [n0];
    for (const c of D.cars.filter((c) => c.T.police || c.T.siren)) c.sirenOn = true; await frames(10); seen.push(lights());
    D.tankerBoom({ x: pos.x + 25, y: 1, z: pos.z }, D.cars.find((c) => !c.isPlayer)); await frames(15); seen.push(lights());
    for (let k = 0; k < 2; k++) { const now = D.cars.filter((c) => !c.isPlayer);
      D.respawnCar(now[0], k ? 'cruiser' : 'viper'); D.respawnCar(now[1], k ? 'firetruck' : 'mixer'); await frames(10); seen.push(lights()); }
    for (const c of D.cars.filter((c) => c.T.police || c.T.siren)) c.sirenOn = false; await frames(10); seen.push(lights());
    await sleep(2600); await frames(5); seen.push(lights()); // the blast is over
    const sirenCar = D.player.T.police ? D.player : null; let lit = null;
    if (sirenCar) { sirenCar.sirenOn = true; await frames(5); lit = D.scene.children.some((o) => o.isPointLight && o.intensity > 0 && o.position.distanceTo(sirenCar.body.position) < 6); sirenCar.sirenOn = false; }
    return { seen, n0, newProgs: progs() - p0, lit, sirenCar: !!sirenCar };
  });
  console.log('  light counts:', r.seen.join(' '), '· new shader programs after warm-up:', r.newProgs);
  ok(r.seen.every((n) => n === r.n0), 'light count never changes (blast, respawns, sirens)');
  ok(r.newProgs <= 6, `blast + siren-car respawns compiled ${r.newProgs} new shader programs (<= 6; the light-count bug compiles 20-31)`);
  ok(!r.sirenCar || r.lit, 'a siren that is on still lights up next to its car');
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok(pe.length === 0, 'no page errors' + (pe.length ? ': ' + pe.slice(0, 3).join(' | ') : ''));
  console.log(fails.length ? 'LIGHTCOUNT FAIL' : 'LIGHTCOUNT PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
