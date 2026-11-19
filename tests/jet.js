// Jet and Ann (Victor's pirate truck and speedboat):
//  - Jet's laser minigun (hold F) damages a car in front, and the battery drains while it fires;
//  - in a forced tsunami Ann launches off the bed and the player is in Ann; the truck is left empty, floating, Ann gone from its bed;
//  - Ann on the water is much faster than a car in the flood (at least 2x);
//  - J dives (cars pass over her), and she comes up zapping the car above; her cannons fire a broadside at a car alongside by themselves;
//  - a hard hit on the Cruiser drops cash bundles, and driving over one grabs it (+score);
//  - after the drain the player is back in a drivable Jet with Ann on the bed.
const { open } = require('./harness');
(async () => {
  const fails = [], ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 480, height: 300 } });
  const r = await page.evaluate(async () => { window.__noRender = true; const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), out = {};
    const wt = async (s) => { const t0 = D.game.time, w0 = performance.now(); while (D.game.time - t0 < s && performance.now() - w0 < 400000) await sleep(30); };
    const until = async (f, s) => { const t0 = D.game.time, w0 = performance.now(); while (!f() && D.game.time - t0 < s && performance.now() - w0 < 600000) await sleep(30); return f(); };
    const key = (code, d) => window.dispatchEvent(new KeyboardEvent(d ? 'keydown' : 'keyup', { code, key: code.replace('Key', '').toLowerCase() }));
    D.S.aiCount = 1; D.S.autoGfx = false; D.selectCar('jet'); document.getElementById('btnStart').click();
    while (!(D.game.state === 'playing' && D.game.countdown <= 0)) await sleep(100);
    for (const bl of D.BULLS) bl.body.position.set(-130, 1.3, -130 + bl.id * 4);
    let ai = D.cars.find((c) => c !== D.player); if (ai.type !== 'viper') { ai = D.respawnCar(ai, 'viper'); await wt(0.3); }
    const park = (c) => { c.think = () => { c.ctrl.throttle = c.want || 0; c.ctrl.steer = 0; c.ctrl.fire = false; c.ctrl.handbrake = !c.want; }; };
    park(ai);
    const put = (c, x, z, yaw = 0) => { const b = c.body; b.position.set(x, 1.7, z); b.quaternion.setFromEuler(0, yaw, 0); b.velocity.set(0, 0, 0); b.angularVelocity.set(0, 0, 0); };
    out.type = D.player.type; out.annOnBed = D.player.annAboard === true && !!D.player.annOnBed && D.player.annOnBed.visible;
    // 1. the laser minigun
    put(D.player, -60, 75); put(ai, -44, 75); await wt(1.2); ai.health = 100;
    key('KeyF', true); await wt(2.2); out.bat = +(D.player.lzBat ?? 1).toFixed(2); key('KeyF', false); await wt(0.3);
    out.laserDmg = +(100 - ai.health).toFixed(1); out.beams = D.JLASER.i;
    // 2. the tsunami: Ann launches, the player is in her
    ai.health = 100; ai.body.position.set(-60, 1.7, 40); const jet0 = D.player;
    D.startTsunami(true); await until(() => D.player.type === 'ann', 30);
    out.inAnn = D.player.type === 'ann' && D.player.isPlayer; out.hulk = D.TSU.hulks.length === 1 && D.TSU.hulks[0] === jet0 && !jet0.isPlayer && jet0.annAboard === false && !D.cars.includes(jet0);
    out.ejectLog = D.TSU.log.filter((e) => e.ev === 'eject').length;
    await until(() => D.TSU.state === 'flood', 30); await wt(1);
    // 3. Ann vs a car in the flood, both full throttle for 3 s
    const ann = D.player; put(ann, -40, 80, 0); put(ai, -40, 20, 0); ann.body.position.y = 1.5; await wt(1);
    const a0 = ann.body.position.clone(), c0 = ai.body.position.clone(); ai.want = 1; key('KeyW', true); await wt(3); key('KeyW', false); ai.want = 0;
    out.vAnn = +(Math.hypot(ann.body.position.x - a0.x, ann.body.position.z - a0.z) / 3).toFixed(1); out.vCar = +(Math.hypot(ai.body.position.x - c0.x, ai.body.position.z - c0.z) / 3).toFixed(1); out.afloat = ann.afloat;
    // 4. the dive: the viper parked right over her, J, and up she comes
    put(ann, 0, 60, 0); ann.body.position.y = 1.4; await wt(0.8); ai.health = 100; put(ai, 0, 60.5, 0); ai.body.position.y = 2.2; ann.diveCd = 0;
    key('KeyJ', true); await wt(0.1); key('KeyJ', false); await wt(0.3); out.diving = ann.diveT > 0; out.mask = ann.body.collisionFilterMask;
    put(ai, ann.body.position.x + 0.5, ann.body.position.z, 0); ai.body.position.y = 2.2;
    const up0 = D.TSU.upHits || 0; await until(() => !(ann.diveT > 0), 4); await wt(0.2);
    out.surfaced = !(ann.diveT > 0) && ann.body.collisionFilterMask === -1; out.upHits = (D.TSU.upHits || 0) - up0; out.diveDmg = +(100 - ai.health).toFixed(1);
    // 5. the broadside: a car alongside, 15 m off her right
    put(ann, 40, 60, 0); ann.body.position.y = 1.4; ann.broadCd = 0.5; await wt(0.4); put(ai, 40, 75, 0); ai.body.position.y = 1.8; const sh0 = D.shells.length; let maxSh = sh0;
    { const t0 = D.game.time; while (D.game.time - t0 < 2) { maxSh = Math.max(maxSh, D.shells.length); await sleep(20); } } out.broadside = maxSh - sh0;
    // 6. plunder: knock the cops' cash loose (a fresh Cruiser), drive over it
    let cop = D.respawnCar(ai, 'cruiser'); park(cop); await wt(0.3); put(cop, -20, 100, 0); await wt(0.6);
    D.dropCash(cop, ann); await wt(1.5); const bundle = D.CASH.b.find((k) => k.on); out.cash = !!bundle;
    if (bundle) { const s0 = D.game.score; put(ann, bundle.x, bundle.z, 0); ann.body.position.y = 1.5; await wt(0.8); out.grabbed = D.CASH.grabbed; out.plunderScore = D.game.score - s0; }
    // 7. the drain: back in Jet, Ann on the bed, and it drives
    await until(() => D.TSU.state === 'idle', 90); await wt(1);
    const j = D.player; out.back = j.type === 'jet' && j.isPlayer && !j.wrecked && j.annAboard === true && !!j.annOnBed.visible && D.TSU.hulks.length === 0; out.sameTruck = j === jet0; out.reb = D.TSU.log.filter((e) => e.ev === 'reboard');
    put(j, -60, 75, 0); await wt(1); const p0 = j.body.position.clone(); key('KeyW', true); await wt(2.5); key('KeyW', false); out.driveAfter = +Math.hypot(j.body.position.x - p0.x, j.body.position.z - p0.z).toFixed(1);
    return out; });
  console.log(JSON.stringify(r));
  ok(r.type === 'jet' && r.annOnBed, 'Jet starts with Ann strapped on the bed');
  ok(r.laserDmg >= 8 && r.bat < 1, `the laser minigun damages the car in front (${r.laserDmg} health in 2.2 s) and drains the battery (${r.bat})`);
  ok(r.inAnn && r.hulk && r.ejectLog === 1, 'in a tsunami Ann launches, the player is in Ann, Jet is left empty and floating');
  ok(r.afloat && r.vAnn >= Math.max(2 * r.vCar, 8), `Ann is much faster on the water (${r.vAnn} m/s) than a car in the flood (${r.vCar} m/s)`);
  ok(r.diving && (r.mask & 4) === 0, 'J dives: under the water, cars pass over her');
  ok(r.surfaced && r.upHits >= 1 && r.diveDmg >= 8, `she comes up zapping the car above (${r.diveDmg} damage)`);
  ok(r.broadside >= 3, `her cannons fire a broadside at a car alongside (${r.broadside} cannonballs)`);
  ok(r.cash && r.grabbed >= 1 && r.plunderScore >= 100, `the Cruiser drops cash, driving over it grabs it (+${r.plunderScore})`);
  ok(r.back && r.driveAfter > 6, `after the drain the player is back in a drivable Jet with Ann on board (drove ${r.driveAfter} m) ${JSON.stringify(r.reb)}`);
  const pe = errors.filter((e) => !e.includes('ERR_FAILED')); ok(!pe.length, 'no page errors ' + pe.slice(0, 3).join(' | '));
  console.log(fails.length ? 'JET FAIL' : 'JET PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
