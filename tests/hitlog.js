// Bug reports say what hit your car (Build 104). The owner's Sandflea went from 28 to 0 health in a tenth of a second at the NE
// hotspot and the report could not say what hit it. Now every hit on your car is logged (time, damage, health left, what hit you,
// where, impact speed, your speed) and the last 15 s go in the bug report. Here: the player rams a parked car, then a report is taken.
// Fails on Build 103 (no hits section).
const { open } = require('./harness');
(async () => {
  const fails = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails.push(m); };
  const { browser, page, errors } = await open({ viewport: { width: 640, height: 400 } });
  await page.evaluate(() => { window.__noRender = true; __derby.S.aiCount = 1; document.getElementById('btnStart').click(); });
  await page.waitForFunction(() => __derby.game.state === 'playing' && __derby.game.countdown <= 0, null, { timeout: 90000 });
  const r = await page.evaluate(async () => { const D = __derby, sleep = (ms) => new Promise((r) => setTimeout(r, ms)), CA = D.CANNON;
    const ai = D.cars.find((c) => !c.isPlayer); ai.think = () => {}; Object.assign(ai.ctrl, { throttle: 0, steer: 0, fire: false, jump: false, nitro: false }); const tb = ai.body; tb.position.set(40, 1.2, 40); tb.velocity.set(0, 0, 0); tb.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), Math.PI / 2); // (ai.ai was not a flag the game reads: the brain is stubbed so the target car stays parked and never fires back)
    const pb = D.player.body; pb.position.set(20, 1.2, 40); pb.quaternion.setFromAxisAngle(new CA.Vec3(0, 1, 0), 0); pb.angularVelocity.set(0, 0, 0);
    const h0 = D.player.health, s0 = D.simTime; while (D.simTime - s0 < 2.5) { if (pb.position.x < 37) pb.velocity.set(18, pb.velocity.y, 0); await sleep(16); }
    localStorage.removeItem('derby-bug-last'); document.getElementById('btnBug').click(); await sleep(300);
    const t = localStorage.getItem('derby-bug-last') || '', i = t.indexOf('Hits on your car'); return { h0, h1: D.player.health, name: ai.name, type: ai.T.name, sec: i >= 0 ? t.slice(i, i + 600) : '' }; });
  console.log('  health ' + r.h0 + ' -> ' + Math.round(r.h1) + '\n  ' + r.sec.split('\n').slice(0, 5).join('\n  '));
  ok(r.h1 < r.h0, 'the ram hurt the player');
  ok(!!r.sec, 'the bug report has a "Hits on your car" section');
  ok(r.sec.includes(r.name) && r.sec.includes(r.type), `it names what hit you (${r.type} ${r.name})`);
  const pe = errors.filter((e) => e.startsWith('pageerror')); ok(!pe.length, 'no page errors ' + pe.slice(0, 2).join(' | '));
  console.log(fails.length ? 'HITLOG FAIL' : 'HITLOG PASS'); await browser.close(); process.exit(fails.length ? 1 : 0);
})();
