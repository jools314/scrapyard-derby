// Long autoplay sessions must not keep piling up GPU geometries (Build 119). The owner's Chromebook (Build 114, autoplay) climbed from 632
// to 935 geometries in 1 h 40 min (about +180 an hour) with the scene itself flat, and its tab crashed at ~1 h 50 min. The memory guard's
// leak record (Mac, Build 108) named the shapes: rubber ducks (two spheres and two cones each) that float off and were never freed, and a
// sign post. Found with a census of every uploaded geometry by the code that made it: the duck's 4 shapes per duck, the bull burger's
// 16 shapes per burger (and the burger itself stayed in the yard when a new match started), and props taken out mid-match (harvested,
// burnt, splintered, blown up: a sign is 3 shapes).
// Each round here is a match restart plus those events, with one overview draw so everything is on the GPU (as a long match's camera
// eventually sees it all). Geometries and textures left orphaned (on the GPU, out of the scene) after round 7, counted from round 2, must stay near zero. Fails on Build 118 (54 orphaned geometries after 6 rounds, and a burger left behind each restart).
const { open } = require('./harness');
(async () => {
  const { browser, page, errors } = await open({ viewport: { width: 480, height: 300 } });
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  await page.evaluate(() => { __derby.S.aiCount = 5; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 120000 });
  const r = await page.evaluate(async () => { const D = __derby, T = D.THREE, fr = async (k) => { for (let i = 0; i < k; i++) await new Promise((r) => requestAnimationFrame(r)); };
    const top = new T.PerspectiveCamera(140, 1, 1, 3000); top.position.set(0, 220, 0.01); top.lookAt(0, 0, 0); top.layers.enableAll();
    const overview = () => { top.updateMatrixWorld(); D.renderer.setRenderTarget(null); D.renderer.render(D.scene, top); }; /* one draw of the whole yard: everything in it is uploaded */
    const mem = () => ({ g: D.renderer.info.memory.geometries, t: D.renderer.info.memory.textures });
    const ai = () => D.cars.filter((c) => !c.isPlayer && !c.wrecked);
    const events = async () => { const car = ai()[0] || D.player, B = D.BULLS;
      if (B[0]) { const q = B[0].body.position; D.hoseBull(car, B[0], { x: q.x - 5, y: q.y, z: q.z }, { x: 1, y: 0, z: 0 }, 0.05); } /* the rubber duck */
      if (B[2]) { const q = B[2].body.position; D.hoseBull(car, B[2], { x: q.x, y: q.y, z: q.z - 5 }, { x: 0, y: 0, z: 1 }, 0.05); }
      if (B[1]) D.cookBull(B[1], car, 1.2); /* the bull burger */
      const nxt = ai()[1]; if (nxt) D.respawnCar(nxt, Object.keys(D.CAR_TYPES)[(K++) % Object.keys(D.CAR_TYPES).length]); /* a respawn, a different vehicle each round */
      await fr(3); overview(); await fr(2);
      for (const d of D.DUCKS) d.t = 0.001; /* the ducks float away */
      const signs = D.SIGN_PROPS.filter((p) => D.props.includes(p)).slice(0, 2); for (const s of signs) D.harvestProp(car, s); /* the combine eats two signs */
      await fr(5); return { ducks: D.DUCKS.length, signs: signs.length }; };
    const restart = async () => { D.startMatch(); await new Promise((r) => setTimeout(r, 300)); await fr(10); overview(); await fr(3); };
    const inScene = () => { const s = new Set(); D.scene.traverse((o) => { if (o.geometry) s.add(o.geometry); if (o.skeleton && o.skeleton.boneTexture) s.add(o.skeleton.boneTexture); for (const m of [].concat(o.material || [])) if (m) for (const k in m) if (m[k] && m[k].isTexture) s.add(m[k]); }); return s; };
    /* orphans: on the GPU, not in the scene, and new since round 2 (shared shapes count too: a shared shape made again and again is a leak) */
    let base = null; const orphans = () => { const sc = inScene(), o = [...D.GPULIVE].filter((x) => !base.has(x) && !sc.has(x)), by = {}; for (const x of o) { const k = D.MEMGUARD.desc(x); by[k] = (by[k] || 0) + 1; }
      return { g: o.filter((x) => !x.isTexture).length, t: o.filter((x) => x.isTexture).length, top: Object.entries(by).sort((p, q) => q[1] - p[1]).slice(0, 12) }; };
    const rounds = [], orph = []; let ev = null, stray = 0, K = 0;
    for (let k = 1; k <= 7; k++) { const old = D.BULLS.map((b) => b.burger).filter(Boolean); await restart(); stray += old.filter((g) => g.parent).length; /* a burger left in the yard when its bull is gone */ rounds.push(mem()); if (k === 2) base = new Set(D.GPULIVE); if (k > 2) orph.push(orphans()); ev = await events(); }
    { const old = D.BULLS.map((b) => b.burger).filter(Boolean); await restart(); stray += old.filter((g) => g.parent).length; } rounds.push(mem()); orph.push(orphans());
    /* what one leaked geometry costs on the GPU: the bytes of its vertex and index buffers */
    const bytes = (g) => { let n = 0; for (const a of Object.values(g.attributes)) n += a.array.byteLength; if (g.index) n += g.index.array.byteLength; return n; };
    const duck = { body: new T.SphereGeometry(0.3, 12, 9), head: new T.SphereGeometry(0.17, 10, 8), beak: new T.ConeGeometry(0.07, 0.18, 8), tail: new T.ConeGeometry(0.09, 0.22, 8) };
    const duckB = Object.values(duck).reduce((a, g) => a + bytes(g), 0);
    return { rounds, orph, ev, duckB, stray }; });
  console.log('  geometries/textures at the start of each round: ' + r.rounds.map((x) => x.g + '/' + x.t).join(' ') + '   (last round: ducks still out ' + r.ev.ducks + ', signs harvested ' + r.ev.signs + ')');
  console.log('  one duck is ' + r.duckB + ' bytes of vertex/index buffers');
  console.log('  orphaned since round 2 (uploaded, not in the scene, never freed), by round: ' + r.orph.map((x) => x.g + '/' + x.t).join(' '));
  const z = r.orph[r.orph.length - 1]; console.log('  after round 7: ' + JSON.stringify(z.top));
  ok(r.ev.signs === 2, `the combine harvested two signs each round (${r.ev.signs})`);
  ok(z.g <= 10, `6 rounds of rubber ducks, bull burgers, respawns and harvested signs leave at most 10 orphaned geometries (${z.g})`);
  ok(r.stray === 0, `no bull burger stays behind in the yard when a new match starts (${r.stray} left over 7 restarts)`);
  ok(z.t <= 4, `and at most 4 orphaned textures (${z.t})`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'GEOLEAK FAIL' : 'GEOLEAK PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
