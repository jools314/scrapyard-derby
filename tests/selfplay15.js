// Balance + fun meter (manual, ~MIN real minutes): 15-vehicle self-play, every car on the AI brain. Prints JSON per vehicle: kills, deaths, K/D,
// kills per alive minute, avg life, % of time wrecked, seconds stuck, damage dealt/taken, weapon uses, physics safety-net catches. Summarise with tools/selfplay-sum.py.
// 15-vehicle self-play (14 AI + the player's car driven by the same AI brain), MIN minutes of real time.
// Reports per vehicle: lives, kills, deaths, seconds alive, and physics safety-net events (by kind), plus play-log stuck entries.
const { open } = require('./harness');
(async () => {
  const MIN = +(process.env.MIN || 4);
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const D = __derby; D.S.aiCount = 14; D.S.damage = 1; D.S.autoGfx = false; window.__noRender = true;
    window.__ph = {}; window.__phL = []; const P = D.PHYS.log, push0 = P.push; P.push = function (...a) { for (const x of a) { const k = (x.who || '?') + '|' + x.kind; window.__ph[k] = (window.__ph[k] || 0) + 1;
        if (window.__phL && window.__phL.length < 80) { const c = D.cars.find((o) => o.T.name === x.who && (x.x === undefined || Math.abs(o.body.position.x - x.x) < 2)); window.__phL.push({ ...x, cable: c && c.cable ? (c.cable.t.name || '?') + ' d' + c.cable.con.distance.toFixed(1) : undefined, cabled: c && D.cars.some((o) => o.cable && o.cable.t === c) || undefined, hop: c && c.hopCd > D.simTime - 1 || undefined, boost: c && c.boosting || undefined, touch: c ? D.touching(c) : undefined }); } } return push0.apply(this, a); }; });
  await page.click('#btnStart'); await page.waitForFunction(() => __derby.game.countdown <= 0, null, { timeout: 120000 });
  const r = await page.evaluate(async (MIN) => {
    const D = __derby, types = Object.keys(D.CAR_TYPES), name2type = {}; for (const t of types) name2type[D.CAR_TYPES[t].name] = t;
    const t0 = performance.now(), g0 = D.game.time, acc = {}; let gPrev = D.game.time;
    const A0 = (t) => acc[t] || (acc[t] = { alive: 0, wrecked: 0, stuck: 0 });
    while (performance.now() - t0 < MIN * 60000) {
      await new Promise((res) => setTimeout(res, 100));
      const gdt = D.game.time - gPrev; gPrev = D.game.time;
      for (const c of D.cars) { const a = A0(c.type), hv = Math.hypot(c.body.velocity.x, c.body.velocity.z); if (c.wrecked) a.wrecked += gdt; else { a.alive += gdt; if (Math.abs(c.ctrl.throttle) > 0.3 && hv < 1) a.stuck += gdt; } }
      const p = D.player; if (!p) continue;
      if (!p.__auto) { p.__auto = true; const fu = p.frameUpdate.bind(p); p.frameUpdate = (dt) => { if (D.game.state === 'playing' && D.game.countdown <= 0) p.think(dt); fu(dt); }; }
      if (p.wrecked && !p.respawnType) { const used = new Set(D.cars.map((c) => c.type)); const free = types.filter((k) => !used.has(k)); p.respawnType = free.length ? free[(Math.random() * free.length) | 0] : p.type; }
    }
    const rec = D.PLAYLOG.rec('test', false), veh = rec.veh || {}, out = {};
    for (const t of types) { const v = veh[t] || { lives: 0, k: 0, d: 0, life: 0 }; const a = acc[t] || { alive: 0, wrecked: 0, stuck: 0 }; out[t] = { lives: v.lives, k: v.k, d: v.d, kd: +(v.k / Math.max(1, v.d)).toFixed(2), aliveS: Math.round(a.alive), wreckedPct: Math.round(100 * a.wrecked / Math.max(1, a.alive + a.wrecked)), avgLifeS: Math.round(a.alive / Math.max(1, v.d)), kPerMin: +(v.k / Math.max(1, a.alive / 60)).toFixed(2), stuckS: Math.round(a.stuck), dmg: Math.round(v.dmg || 0), taken: Math.round(v.taken || 0), fires: v.fires || 0, phys: {} }; }
    for (const [k, n] of Object.entries(window.__ph)) { const [who, kind] = k.split('|'); const t = name2type[who] || who; (out[t] || (out[t] = { phys: {} })).phys[kind] = n; }
    return { vs: D.PLAYLOG.m && D.PLAYLOG.m.vs, gameS: Math.round(D.game.time - g0), veh: out, stuck: rec.stuck, phL: window.__phL, physTotal: Object.values(window.__ph).reduce((a, b) => a + b, 0) };
  }, MIN);
  console.log(JSON.stringify(r));
  console.log('errors', JSON.stringify(errors.filter((e) => !e.includes('ERR_FAILED')).slice(0, 5)));
  await browser.close();
})();
